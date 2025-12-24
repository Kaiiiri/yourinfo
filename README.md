# YourInfo

A privacy awareness demonstration that shows what information websites can collect about you through browser fingerprinting and behavioral analysis.

## Features

- **Browser Fingerprinting**: Canvas, WebGL, audio, fonts, and more
- **Cross-Browser Tracking**: Hardware-based identification that works across different browsers
- **Real-time Behavior Tracking**: Mouse movements, scroll patterns, typing behavior
- **Device Detection**: GPU, CPU cores, RAM, screen resolution
- **AI-Powered Profiling**: Uses Grok AI to infer personal details from fingerprint data
- **Interactive 3D Globe**: See other visitors in real-time with CesiumJS
- **Privacy Detection**: VPN, ad blocker, incognito mode detection

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Bun + Hono
- **Real-time**: WebSocket
- **Globe**: CesiumJS with OpenStreetMap tiles
- **AI**: Grok (X.AI) for user profiling (optional)
- **Cache**: Redis for profile caching and unique visitor tracking (optional)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Redis (optional, for caching)
- Grok API key (optional, for AI profiling)

### Installation

```bash
# Clone the repository
git clone https://github.com/siinghd/yourinfo.git
cd yourinfo

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Start development server (frontend + backend)
bun run dev
```

### Production

```bash
# Build frontend
bun run build

# Start production server
bun run server/index.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Backend server port | Yes |
| `VITE_WS_PORT` | WebSocket port for dev | Yes |
| `REDIS_URL` | Redis connection URL | No |
| `GROK_API_KEY` | Grok API key for AI profiling | No |

## What Information Is Collected

### Hardware
- Screen resolution, color depth, pixel ratio
- CPU cores, RAM (capped at 8GB by browsers)
- GPU vendor and model
- Touch screen capability

### Browser
- User agent, platform, language
- Installed fonts
- Canvas and WebGL fingerprints
- Audio processing fingerprint
- Supported codecs and DRM

### Behavior
- Mouse speed, acceleration, movement patterns
- Scroll depth and direction changes
- Typing speed and key hold times
- Tab switching and focus time
- Rage clicks and exit intent

### Network
- IP address and geolocation
- Connection type and speed
- WebRTC local IPs
- VPN/proxy detection

## Deployment

### With nginx

```nginx
server {
    listen 443 ssl http2;
    server_name yourinfo.example.com;

    location / {
        root /path/to/yourinfo/dist;
        try_files $uri $uri/ /index.html;
    }

    location /ws {
        proxy_pass http://localhost:3020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3020;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### With PM2

```bash
pm2 start bun --name yourinfo -- run server/index.ts
```

## Privacy Tips

This demo is meant to raise awareness about online tracking. To protect your privacy:

1. Use a VPN to mask your IP address
2. Enable Do Not Track in your browser
3. Use privacy-focused browsers like Firefox or Brave
4. Install browser extensions to block fingerprinting
5. Disable WebRTC to prevent local IP leaks
6. Use Tor Browser for maximum anonymity

## License

MIT
