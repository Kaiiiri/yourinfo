/**
 * YourInfo Backend Server
 * Bun + Hono with WebSocket support
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getGeolocation } from './geolocation';
import { generateAIProfile, trackUniqueVisitor, getTotalUniqueVisitors } from './ai-profiler';
import type {
  VisitorInfo,
  ServerInfo,
  ClientInfo,
  WSMessage,
  WelcomePayload,
  VisitorEventPayload,
  ClientInfoPayload,
} from '../src/types';

const app = new Hono();
const PORT = parseInt(process.env.PORT || '3020', 10);

/** Active visitors map */
const visitors = new Map<string, VisitorInfo>();

/** WebSocket connections map */
const connections = new Map<string, WebSocket>();

// Enable CORS for development
app.use('*', cors());

/** Health check endpoint */
app.get('/health', (c) => c.json({ status: 'ok', visitors: visitors.size }));

/** Get visitor info by ID */
app.get('/api/visitor/:id', (c) => {
  const id = c.req.param('id');
  const visitor = visitors.get(id);
  if (!visitor) {
    return c.json({ error: 'Visitor not found' }, 404);
  }
  return c.json(visitor);
});

/** Get all visitors */
app.get('/api/visitors', (c) => {
  return c.json(Array.from(visitors.values()));
});

/** Get total unique visitors */
app.get('/api/stats', async (c) => {
  const totalUnique = await getTotalUniqueVisitors();
  return c.json({
    online: visitors.size,
    totalUnique,
  });
});

/** AI-powered user profiling endpoint */
app.post('/api/profile', async (c) => {
  try {
    const body = await c.req.json();
    const clientInfo = body.clientInfo as Partial<ClientInfo>;

    if (!clientInfo) {
      return c.json({ error: 'clientInfo required' }, 400);
    }

    const result = await generateAIProfile(clientInfo);

    return c.json({
      profile: result.profile,
      source: result.source,
      error: result.error,
    });
  } catch (err) {
    console.error('Profile endpoint error:', err);
    return c.json({ error: 'Internal server error', source: 'fallback' }, 500);
  }
});

/**
 * Generate a unique visitor ID
 */
function generateId(): string {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Redact sensitive info from visitor for privacy
 * Only the visitor themselves should see their full info
 */
function redactVisitorInfo(visitor: VisitorInfo): VisitorInfo {
  return {
    ...visitor,
    server: {
      ...visitor.server,
      ip: '•••.•••.•••.•••',
      geo: visitor.server.geo ? {
        ...visitor.server.geo,
        city: '••••••',
        // Round to 1 decimal place for rough location (still works for globe pin)
        lat: Math.round(visitor.server.geo.lat * 10) / 10,
        lng: Math.round(visitor.server.geo.lng * 10) / 10,
        isp: '••••••',
        org: '••••••',
      } : null,
    },
  };
}

/**
 * Redact all visitors except the specified one
 */
function redactVisitorsExcept(allVisitors: VisitorInfo[], currentId: string): VisitorInfo[] {
  return allVisitors.map(v => v.id === currentId ? v : redactVisitorInfo(v));
}

/**
 * Extract real IP from request (handles Cloudflare, nginx proxies)
 */
function getRealIP(req: Request, server: { requestIP?: (req: Request) => { address: string } | null }): string {
  // Cloudflare
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // X-Forwarded-For (first IP in chain)
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const firstIP = xff.split(',')[0].trim();
    if (firstIP) return firstIP;
  }

  // X-Real-IP (nginx)
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;

  // Bun's requestIP
  if (server.requestIP) {
    const addr = server.requestIP(req);
    if (addr) return addr.address;
  }

  return '127.0.0.1';
}

/**
 * Build server info from request
 */
async function buildServerInfo(req: Request, ip: string): Promise<ServerInfo> {
  const geo = await getGeolocation(ip);

  // Extract relevant headers (sanitized)
  const headers: Record<string, string> = {};
  const headerWhitelist = [
    'accept',
    'accept-encoding',
    'accept-language',
    'cache-control',
    'connection',
    'dnt',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'upgrade-insecure-requests',
  ];

  for (const name of headerWhitelist) {
    const value = req.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  return {
    ip,
    geo,
    userAgent: req.headers.get('user-agent') || 'Unknown',
    acceptLanguage: req.headers.get('accept-language') || 'Unknown',
    referer: req.headers.get('referer') || 'Direct',
    headers,
  };
}

/**
 * Broadcast message to all connected clients
 */
function broadcast(message: WSMessage, excludeId?: string): void {
  const data = JSON.stringify(message);
  for (const [id, ws] of connections.entries()) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

/**
 * Handle WebSocket upgrade
 */
const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const ip = getRealIP(req, server);
      const upgraded = server.upgrade(req, {
        data: { ip, req },
      });
      if (upgraded) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Handle Hono routes
    return app.fetch(req);
  },

  websocket: {
    async open(ws) {
      const { ip, req } = ws.data as { ip: string; req: Request };
      const id = generateId();

      // Build visitor info
      const serverInfo = await buildServerInfo(req, ip);
      const visitor: VisitorInfo = {
        id,
        server: serverInfo,
        client: null,
        connectedAt: Date.now(),
      };

      // Store visitor and connection
      visitors.set(id, visitor);
      connections.set(id, ws as unknown as WebSocket);

      // Attach ID to websocket for later reference
      (ws as unknown as { visitorId: string }).visitorId = id;

      // Send welcome message with visitor's own info and all current visitors
      // Redact other visitors' sensitive info
      const welcomePayload: WelcomePayload = {
        visitor,
        visitors: redactVisitorsExcept(Array.from(visitors.values()), id),
      };

      ws.send(JSON.stringify({
        type: 'welcome',
        payload: welcomePayload,
      } as WSMessage));

      // Broadcast new visitor to others (redacted)
      broadcast(
        {
          type: 'visitor_joined',
          payload: { visitor: redactVisitorInfo(visitor) } as VisitorEventPayload,
        },
        id
      );

      console.log(`Visitor connected: ${id} from ${ip} (${serverInfo.geo?.city || 'Unknown'})`);
    },

    message(ws, message) {
      try {
        const data = JSON.parse(message.toString()) as WSMessage;
        const visitorId = (ws as unknown as { visitorId: string }).visitorId;

        if (data.type === 'client_info') {
          // Update visitor with client info
          const visitor = visitors.get(visitorId);
          if (visitor) {
            const payload = data.payload as ClientInfoPayload;
            visitor.client = payload.clientInfo;
            visitors.set(visitorId, visitor);

            // Track unique visitor
            if (payload.clientInfo.fingerprintId && payload.clientInfo.crossBrowserId) {
              trackUniqueVisitor(payload.clientInfo.fingerprintId, payload.clientInfo.crossBrowserId);
            }

            // Send full info back to the visitor
            const currentWs = connections.get(visitorId);
            if (currentWs && currentWs.readyState === WebSocket.OPEN) {
              currentWs.send(JSON.stringify({
                type: 'visitor_updated',
                payload: { visitor } as VisitorEventPayload,
              }));
            }

            // Broadcast redacted info to others
            broadcast({
              type: 'visitor_updated',
              payload: { visitor: redactVisitorInfo(visitor) } as VisitorEventPayload,
            }, visitorId);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    },

    close(ws) {
      const visitorId = (ws as unknown as { visitorId: string }).visitorId;

      if (visitorId) {
        const visitor = visitors.get(visitorId);
        visitors.delete(visitorId);
        connections.delete(visitorId);

        if (visitor) {
          // Broadcast visitor left (redacted)
          broadcast({
            type: 'visitor_left',
            payload: { visitor: redactVisitorInfo(visitor) } as VisitorEventPayload,
          });
        }

        console.log(`Visitor disconnected: ${visitorId}`);
      }
    },
  },
});

console.log(`YourInfo server running on port ${PORT}`);
console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
