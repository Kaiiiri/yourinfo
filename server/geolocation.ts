/**
 * IP Geolocation service using ip-api.com
 */

import type { GeoLocation } from '../src/types';

/** Cache for geolocation lookups to reduce API calls */
const geoCache = new Map<string, { data: GeoLocation | null; timestamp: number }>();

/** Cache TTL in milliseconds (1 hour) */
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Look up geolocation data for an IP address
 * Uses ip-api.com free tier (45 requests/minute from server)
 */
export async function getGeolocation(ip: string): Promise<GeoLocation | null> {
  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Skip localhost/private IPs
  if (isPrivateIP(ip)) {
    return null;
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as`
    );

    if (!response.ok) {
      console.error(`Geolocation API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'success') {
      console.error(`Geolocation lookup failed: ${data.message}`);
      geoCache.set(ip, { data: null, timestamp: Date.now() });
      return null;
    }

    const geo: GeoLocation = {
      lat: data.lat,
      lng: data.lon,
      city: data.city || 'Unknown',
      region: data.regionName || data.region || 'Unknown',
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      timezone: data.timezone || 'UTC',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      as: data.as || 'Unknown',
    };

    geoCache.set(ip, { data: geo, timestamp: Date.now() });
    return geo;
  } catch (error) {
    console.error('Geolocation lookup error:', error);
    return null;
  }
}

/**
 * Check if an IP is private/localhost
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.')
  ) {
    return true;
  }

  // IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }

  return false;
}

/**
 * Clear expired cache entries
 */
export function cleanupGeoCache(): void {
  const now = Date.now();
  for (const [ip, entry] of geoCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      geoCache.delete(ip);
    }
  }
}

// Run cache cleanup every 10 minutes
setInterval(cleanupGeoCache, 10 * 60 * 1000);
