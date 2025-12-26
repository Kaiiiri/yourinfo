/**
 * AI-Powered Simulated Ad Auction
 * Uses AI to generate realistic, personalized bids based on user data
 *
 * TRANSPARENT: This is a SIMULATION to educate users about how ad auctions work
 */

import type { VisitorInfo } from '../types';

export interface AdBid {
  bidder: string;
  bidderName: string;
  cpm: number;
  currency: string;
  reason: string; // AI-generated explanation
  status: 'bid' | 'no-bid' | 'timeout';
  responseTime: number;
  category: 'global' | 'regional' | 'specialized';
  country?: string; // For regional bidders
}

export interface AuctionResult {
  auctionId: string;
  timestamp: number;
  duration: number;
  bids: AdBid[];
  winner: AdBid | null;
  totalBidders: number;
  userValueBreakdown: ValueFactor[];
  isSimulated: true; // Always true - we're transparent
  aiPowered: boolean;
}

export interface ValueFactor {
  factor: string;
  impact: string; // e.g., "+$0.45" or "-$0.20"
  impactValue: number;
  description: string;
}

// All 20+ ad companies with metadata
export const AD_COMPANIES: Record<string, {
  name: string;
  category: 'global' | 'regional' | 'specialized';
  countries?: string[]; // If regional, which countries
  specialty?: string;
  color: string;
}> = {
  // Global DSPs/SSPs (bid everywhere)
  'google': { name: 'Google Ads', category: 'global', color: '#4285F4', specialty: 'Search intent, YouTube' },
  'meta': { name: 'Meta (Facebook/Instagram)', category: 'global', color: '#0082FB', specialty: 'Social, demographics' },
  'amazon': { name: 'Amazon DSP', category: 'global', color: '#FF9900', specialty: 'Shopping intent, Prime data' },
  'criteo': { name: 'Criteo', category: 'global', color: '#F48120', specialty: 'Retargeting' },
  'thetradedesk': { name: 'The Trade Desk', category: 'global', color: '#00B140', specialty: 'Premium inventory' },
  'xandr': { name: 'Xandr (Microsoft)', category: 'global', color: '#00BCF2', specialty: 'LinkedIn, Xbox, Bing' },
  'magnite': { name: 'Magnite', category: 'global', color: '#6B4EE6', specialty: 'CTV, Video' },
  'pubmatic': { name: 'PubMatic', category: 'global', color: '#00A4E4', specialty: 'Programmatic' },
  'openx': { name: 'OpenX', category: 'global', color: '#36B37E', specialty: 'Premium publishers' },
  'index': { name: 'Index Exchange', category: 'global', color: '#FF6B6B', specialty: 'Header bidding' },
  'triplelift': { name: 'TripleLift', category: 'global', color: '#1A1A1A', specialty: 'Native ads' },
  'taboola': { name: 'Taboola', category: 'global', color: '#0066FF', specialty: 'Content recommendation' },
  'outbrain': { name: 'Outbrain', category: 'global', color: '#E85D00', specialty: 'Native content' },

  // Regional (bid more in specific countries)
  'yandex': { name: 'Yandex Ads', category: 'regional', countries: ['RU', 'BY', 'KZ'], color: '#FF0000', specialty: 'Russian market' },
  'baidu': { name: 'Baidu Marketing', category: 'regional', countries: ['CN'], color: '#2932E1', specialty: 'Chinese market' },
  'tencent': { name: 'Tencent Ads', category: 'regional', countries: ['CN', 'HK'], color: '#00D26A', specialty: 'WeChat, QQ' },
  'rakuten': { name: 'Rakuten Advertising', category: 'regional', countries: ['JP'], color: '#BF0000', specialty: 'Japanese market' },
  'naver': { name: 'Naver Ads', category: 'regional', countries: ['KR'], color: '#03C75A', specialty: 'Korean market' },
  'flipkart': { name: 'Flipkart Ads', category: 'regional', countries: ['IN'], color: '#F7D700', specialty: 'Indian ecommerce' },
  'mercadolibre': { name: 'Mercado Ads', category: 'regional', countries: ['BR', 'AR', 'MX'], color: '#FFE600', specialty: 'LATAM ecommerce' },
  'bol': { name: 'bol.com Ads', category: 'regional', countries: ['NL', 'BE'], color: '#0000A4', specialty: 'Benelux' },
  'zalando': { name: 'Zalando Marketing', category: 'regional', countries: ['DE', 'AT', 'CH', 'NL', 'PL'], color: '#FF6900', specialty: 'EU fashion' },
  'otto': { name: 'OTTO Advertising', category: 'regional', countries: ['DE'], color: '#E30613', specialty: 'German retail' },

  // Specialized (bid based on user profile match)
  'spotify': { name: 'Spotify Ad Studio', category: 'specialized', color: '#1DB954', specialty: 'Audio, music taste' },
  'tiktok': { name: 'TikTok Ads', category: 'specialized', color: '#000000', specialty: 'Gen Z, short video' },
  'snapchat': { name: 'Snapchat Ads', category: 'specialized', color: '#FFFC00', specialty: 'Young demographics' },
  'pinterest': { name: 'Pinterest Ads', category: 'specialized', color: '#E60023', specialty: 'Visual discovery, DIY' },
  'linkedin': { name: 'LinkedIn Ads', category: 'specialized', color: '#0A66C2', specialty: 'B2B, professionals' },
  'twitter': { name: 'X Ads', category: 'specialized', color: '#000000', specialty: 'Real-time, news' },
  'reddit': { name: 'Reddit Ads', category: 'specialized', color: '#FF4500', specialty: 'Communities, niche' },
  'twitch': { name: 'Twitch Ads', category: 'specialized', color: '#9146FF', specialty: 'Gamers, streaming' },
};

/**
 * Get relevant bidders based on user's country
 */
export function getRelevantBidders(countryCode: string): string[] {
  const bidders: string[] = [];

  // Always include global bidders
  Object.entries(AD_COMPANIES).forEach(([id, company]) => {
    if (company.category === 'global') {
      bidders.push(id);
    }
  });

  // Add regional bidders for user's country
  Object.entries(AD_COMPANIES).forEach(([id, company]) => {
    if (company.category === 'regional' && company.countries?.includes(countryCode)) {
      bidders.push(id);
    }
  });

  // Add specialized bidders (they bid everywhere but amounts vary)
  Object.entries(AD_COMPANIES).forEach(([id, company]) => {
    if (company.category === 'specialized') {
      bidders.push(id);
    }
  });

  return bidders;
}

/**
 * Calculate base CPM multiplier by country
 * Based on real industry data - US/UK/AU have highest CPMs
 */
export function getCountryCPMMultiplier(countryCode: string): { multiplier: number; tier: string } {
  const tiers: Record<string, { multiplier: number; tier: string }> = {
    // Tier 1 - Highest value
    'US': { multiplier: 1.0, tier: 'Premium' },
    'GB': { multiplier: 0.95, tier: 'Premium' },
    'AU': { multiplier: 0.90, tier: 'Premium' },
    'CA': { multiplier: 0.88, tier: 'Premium' },
    'DE': { multiplier: 0.85, tier: 'Premium' },
    'CH': { multiplier: 0.92, tier: 'Premium' },
    'NO': { multiplier: 0.88, tier: 'Premium' },
    'SE': { multiplier: 0.85, tier: 'Premium' },
    'DK': { multiplier: 0.85, tier: 'Premium' },
    'NL': { multiplier: 0.82, tier: 'Premium' },
    'AT': { multiplier: 0.80, tier: 'Premium' },
    'NZ': { multiplier: 0.78, tier: 'Premium' },
    'IE': { multiplier: 0.80, tier: 'Premium' },
    'SG': { multiplier: 0.75, tier: 'Premium' },
    'AE': { multiplier: 0.78, tier: 'Premium' },

    // Tier 2 - High value
    'FR': { multiplier: 0.70, tier: 'High' },
    'JP': { multiplier: 0.72, tier: 'High' },
    'IT': { multiplier: 0.65, tier: 'High' },
    'ES': { multiplier: 0.60, tier: 'High' },
    'BE': { multiplier: 0.68, tier: 'High' },
    'FI': { multiplier: 0.70, tier: 'High' },
    'KR': { multiplier: 0.65, tier: 'High' },
    'IL': { multiplier: 0.62, tier: 'High' },
    'HK': { multiplier: 0.60, tier: 'High' },
    'PT': { multiplier: 0.55, tier: 'High' },

    // Tier 3 - Medium value
    'PL': { multiplier: 0.40, tier: 'Medium' },
    'CZ': { multiplier: 0.38, tier: 'Medium' },
    'RU': { multiplier: 0.35, tier: 'Medium' },
    'BR': { multiplier: 0.32, tier: 'Medium' },
    'MX': { multiplier: 0.30, tier: 'Medium' },
    'AR': { multiplier: 0.28, tier: 'Medium' },
    'TW': { multiplier: 0.45, tier: 'Medium' },
    'MY': { multiplier: 0.35, tier: 'Medium' },
    'TH': { multiplier: 0.30, tier: 'Medium' },
    'SA': { multiplier: 0.42, tier: 'Medium' },
    'ZA': { multiplier: 0.35, tier: 'Medium' },
    'TR': { multiplier: 0.28, tier: 'Medium' },
    'RO': { multiplier: 0.32, tier: 'Medium' },
    'HU': { multiplier: 0.30, tier: 'Medium' },
    'GR': { multiplier: 0.32, tier: 'Medium' },
    'CL': { multiplier: 0.30, tier: 'Medium' },
    'CO': { multiplier: 0.25, tier: 'Medium' },

    // Tier 4 - Lower value
    'CN': { multiplier: 0.25, tier: 'Standard' },
    'IN': { multiplier: 0.15, tier: 'Standard' },
    'ID': { multiplier: 0.18, tier: 'Standard' },
    'PH': { multiplier: 0.15, tier: 'Standard' },
    'VN': { multiplier: 0.12, tier: 'Standard' },
    'PK': { multiplier: 0.10, tier: 'Standard' },
    'BD': { multiplier: 0.08, tier: 'Standard' },
    'NG': { multiplier: 0.10, tier: 'Standard' },
    'EG': { multiplier: 0.12, tier: 'Standard' },
    'KE': { multiplier: 0.10, tier: 'Standard' },
  };

  return tiers[countryCode] || { multiplier: 0.20, tier: 'Standard' };
}

/**
 * Extract key profile data for AI prompt
 */
function extractProfileSummary(visitor: VisitorInfo): string {
  const parts: string[] = [];
  const client = visitor.client;
  const server = visitor.server;

  // Location
  if (server?.geo) {
    parts.push(`Location: ${server.geo.city}, ${server.geo.country} (${server.geo.countryCode})`);
  }

  // Device
  if (client) {
    parts.push(`Device: ${client.platform}, ${client.screenWidth}x${client.screenHeight}, DPR ${client.devicePixelRatio}`);
    parts.push(`Browser: ${client.browserName} ${client.browserVersion}`);

    if (client.webglRenderer) {
      parts.push(`GPU: ${client.webglRenderer}`);
    }

    if (client.deviceMemory) {
      parts.push(`RAM: ${client.deviceMemory}GB`);
    }

    // User profile
    const profile = client.userProfile;
    if (profile) {
      if (profile.deviceTier) parts.push(`Device Tier: ${profile.deviceTier}`);
      if (profile.likelyDeveloper) parts.push('Likely Developer: Yes');
      if (profile.likelyGamer) parts.push('Likely Gamer: Yes');
      if (profile.likelyDesigner) parts.push('Likely Designer: Yes');
      if (profile.incomeLevel) parts.push(`Income Level: ${profile.incomeLevel}`);
      if (profile.ageRange) parts.push(`Age Range: ${profile.ageRange}`);
      if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
      if (profile.inferredInterests?.length) {
        parts.push(`Interests: ${profile.inferredInterests.slice(0, 5).join(', ')}`);
      }
    }

    // Privacy signals
    if (client.adBlockerDetected) parts.push('Ad Blocker: Detected');
    if (client.doNotTrack) parts.push('Do Not Track: Enabled');
    if (client.vpnDetection?.likelyUsingVPN) parts.push('VPN: Likely');

    // Crypto
    if (client.cryptoWallets?.length) {
      parts.push(`Crypto Wallets: ${client.cryptoWallets.join(', ')}`);
    }
  }

  return parts.join('\n');
}

/**
 * Generate AI-powered auction using the API
 */
export async function runAIAuction(visitor: VisitorInfo): Promise<AuctionResult> {
  const auctionStart = Date.now();
  const auctionId = `auction_${auctionStart}_${Math.random().toString(36).substr(2, 9)}`;

  const countryCode = visitor.server?.geo?.countryCode || 'US';
  const country = visitor.server?.geo?.country || 'Unknown';
  const profileSummary = extractProfileSummary(visitor);

  try {
    // Call the AI endpoint with profile summary
    const response = await fetch('/api/ai-auction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileSummary,
        country,
        countryCode
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.bids && data.bids.length > 0) {
        return processAIResponse(data, auctionId, auctionStart);
      }
    }
  } catch (error) {
    console.log('AI auction failed, falling back to calculated auction:', error);
  }

  // Fallback to calculated auction if AI fails
  return runCalculatedAuction(visitor, auctionId, auctionStart);
}

/**
 * Categorize a company based on its name
 */
function categorizeCompany(name: string): 'global' | 'regional' | 'specialized' {
  const globalCompanies = ['google', 'meta', 'amazon', 'criteo', 'trade desk', 'magnite', 'pubmatic', 'openx', 'index', 'triplelift', 'taboola', 'outbrain', 'xandr'];
  const specializedCompanies = ['linkedin', 'spotify', 'tiktok', 'snapchat', 'pinterest', 'twitter', 'reddit', 'twitch', 'discord', 'steam', 'unity', 'github', 'stack overflow', 'coinbase', 'binance', 'brave'];

  const lower = name.toLowerCase();
  if (globalCompanies.some(g => lower.includes(g))) return 'global';
  if (specializedCompanies.some(s => lower.includes(s))) return 'specialized';
  return 'regional';
}

/**
 * Process AI response into AuctionResult
 */
function processAIResponse(
  data: { bids: Array<{ bidder: string; cpm: number; status: string; reason: string }>; valueFactors: ValueFactor[] },
  auctionId: string,
  auctionStart: number
): AuctionResult {
  const bids: AdBid[] = data.bids.map(bid => {
    return {
      bidder: bid.bidder.toLowerCase().replace(/\s+/g, '-'),
      bidderName: bid.bidder,
      cpm: bid.cpm || 0,
      currency: 'USD',
      reason: bid.reason,
      status: bid.status as 'bid' | 'no-bid' | 'timeout',
      responseTime: 50 + Math.random() * 200,
      category: categorizeCompany(bid.bidder),
    };
  });

  // Sort by CPM descending
  bids.sort((a, b) => b.cpm - a.cpm);

  const winner = bids.find(b => b.status === 'bid') || null;

  return {
    auctionId,
    timestamp: auctionStart,
    duration: Date.now() - auctionStart,
    bids,
    winner,
    totalBidders: bids.length,
    userValueBreakdown: data.valueFactors || [],
    isSimulated: true,
    aiPowered: true,
  };
}

/**
 * Fallback: Calculate auction based on formulas (no AI)
 */
export function runCalculatedAuction(
  visitor: VisitorInfo,
  auctionId?: string,
  auctionStart?: number
): AuctionResult {
  const start = auctionStart || Date.now();
  const id = auctionId || `auction_${start}_${Math.random().toString(36).substr(2, 9)}`;

  const countryCode = visitor.server?.geo?.countryCode || 'US';
  const countryData = getCountryCPMMultiplier(countryCode);
  const relevantBidders = getRelevantBidders(countryCode);
  const client = visitor.client;
  const profile = client?.userProfile;

  // Calculate value factors
  const valueFactors: ValueFactor[] = [];
  let totalMultiplier = countryData.multiplier;

  // Country factor
  valueFactors.push({
    factor: `${visitor.server?.geo?.country || 'Unknown'} Location`,
    impact: countryData.multiplier >= 0.8 ? `+${((countryData.multiplier - 0.5) * 2).toFixed(0)}%` : `-${((0.5 - countryData.multiplier) * 100).toFixed(0)}%`,
    impactValue: countryData.multiplier,
    description: `${countryData.tier} market - advertisers pay ${countryData.multiplier >= 0.8 ? 'premium' : 'standard'} rates`
  });

  // Device tier
  if (profile?.deviceTier) {
    const deviceMultipliers: Record<string, number> = {
      'premium': 1.5,
      'high-end': 1.25,
      'mid-range': 1.0,
      'budget': 0.7
    };
    const deviceMult = deviceMultipliers[profile.deviceTier] || 1.0;
    totalMultiplier *= deviceMult;
    valueFactors.push({
      factor: `${profile.deviceTier.charAt(0).toUpperCase() + profile.deviceTier.slice(1)} Device`,
      impact: deviceMult > 1 ? `+${((deviceMult - 1) * 100).toFixed(0)}%` : `-${((1 - deviceMult) * 100).toFixed(0)}%`,
      impactValue: deviceMult,
      description: profile.estimatedDeviceValue || 'Device value assessment'
    });
  }

  // Income level
  if (profile?.incomeLevel) {
    const incomeMultipliers: Record<string, number> = {
      'very-high': 1.8,
      'high': 1.4,
      'medium': 1.0,
      'low': 0.7
    };
    const incomeMult = incomeMultipliers[profile.incomeLevel] || 1.0;
    totalMultiplier *= incomeMult;
    valueFactors.push({
      factor: `${profile.incomeLevel.charAt(0).toUpperCase() + profile.incomeLevel.slice(1)} Income`,
      impact: incomeMult > 1 ? `+${((incomeMult - 1) * 100).toFixed(0)}%` : `-${((1 - incomeMult) * 100).toFixed(0)}%`,
      impactValue: incomeMult,
      description: 'Inferred purchasing power'
    });
  }

  // Developer
  if (profile?.likelyDeveloper) {
    totalMultiplier *= 1.3;
    valueFactors.push({
      factor: 'Developer Profile',
      impact: '+30%',
      impactValue: 1.3,
      description: profile.developerReason || 'Tech-savvy, high-value for SaaS ads'
    });
  }

  // Gamer
  if (profile?.likelyGamer) {
    totalMultiplier *= 1.25;
    valueFactors.push({
      factor: 'Gamer Profile',
      impact: '+25%',
      impactValue: 1.25,
      description: profile.gamerReason || 'Valuable for gaming & entertainment ads'
    });
  }

  // Crypto
  if (client?.cryptoWallets?.length) {
    totalMultiplier *= 1.4;
    valueFactors.push({
      factor: 'Crypto Investor',
      impact: '+40%',
      impactValue: 1.4,
      description: `${client.cryptoWallets.join(', ')} detected - high value for DeFi/exchange ads`
    });
  }

  // Ad blocker penalty
  if (client?.adBlockerDetected) {
    totalMultiplier *= 0.3;
    valueFactors.push({
      factor: 'Ad Blocker Detected',
      impact: '-70%',
      impactValue: 0.3,
      description: 'Ads likely blocked - drastically reduces value'
    });
  }

  // Privacy conscious penalty
  if (client?.doNotTrack || client?.globalPrivacyControl) {
    totalMultiplier *= 0.8;
    valueFactors.push({
      factor: 'Privacy Signals',
      impact: '-20%',
      impactValue: 0.8,
      description: 'DNT/GPC enabled - harder to track, less valuable'
    });
  }

  // VPN penalty
  if (client?.vpnDetection?.likelyUsingVPN) {
    totalMultiplier *= 0.6;
    valueFactors.push({
      factor: 'VPN Detected',
      impact: '-40%',
      impactValue: 0.6,
      description: 'Location uncertainty reduces targeting accuracy'
    });
  }

  // Generate bids for each company
  const bids: AdBid[] = relevantBidders.map(bidderId => {
    const company = AD_COMPANIES[bidderId];

    // Base CPM for this company (varies by company size/type)
    let baseCPM = 0.80 + Math.random() * 0.40;

    // Adjust based on company specialty match
    let specialtyMatch = 1.0;
    let reason = 'Standard programmatic bid';

    if (bidderId === 'linkedin' && profile?.likelyDeveloper) {
      specialtyMatch = 1.5;
      reason = 'Developer profile matches B2B targeting';
    } else if (bidderId === 'twitch' && profile?.likelyGamer) {
      specialtyMatch = 1.6;
      reason = 'Gamer profile ideal for Twitch advertisers';
    } else if ((bidderId === 'amazon' || bidderId === 'criteo') && profile?.incomeLevel === 'high') {
      specialtyMatch = 1.4;
      reason = 'High income = high purchase intent';
    } else if (bidderId === 'tiktok' && profile?.ageRange?.includes('18-24')) {
      specialtyMatch = 1.5;
      reason = 'Young demographic matches TikTok audience';
    } else if (bidderId === 'google') {
      specialtyMatch = 1.2;
      reason = 'Cross-platform data enables precise targeting';
    } else if (bidderId === 'meta') {
      specialtyMatch = 1.15;
      reason = 'Social graph data for demographic targeting';
    } else if (company.category === 'regional') {
      if (company.countries?.includes(countryCode)) {
        specialtyMatch = 1.4;
        reason = `Local market leader in ${visitor.server?.geo?.country}`;
      } else {
        specialtyMatch = 0;
        reason = 'No bid - outside target region';
      }
    }

    // Calculate final CPM
    const finalCPM = baseCPM * totalMultiplier * specialtyMatch;

    // Some companies may not bid
    const shouldBid = specialtyMatch > 0 && Math.random() > 0.1;

    return {
      bidder: bidderId,
      bidderName: company.name,
      cpm: shouldBid ? Math.round(finalCPM * 100) / 100 : 0,
      currency: 'USD',
      reason: shouldBid ? reason : 'No bid - user profile doesn\'t match targeting criteria',
      status: shouldBid ? 'bid' : 'no-bid' as const,
      responseTime: 50 + Math.random() * 250,
      category: company.category,
    };
  });

  // Sort by CPM descending
  bids.sort((a, b) => b.cpm - a.cpm);

  const winner = bids.find(b => b.status === 'bid') || null;

  return {
    auctionId: id,
    timestamp: start,
    duration: Date.now() - start,
    bids,
    winner,
    totalBidders: relevantBidders.length,
    userValueBreakdown: valueFactors,
    isSimulated: true,
    aiPowered: false,
  };
}

/**
 * Main auction function - tries AI first, falls back to calculated
 */
export async function runAdAuction(visitor: VisitorInfo | null): Promise<AuctionResult> {
  if (!visitor) {
    // Return empty auction if no visitor data
    return {
      auctionId: 'no_visitor',
      timestamp: Date.now(),
      duration: 0,
      bids: [],
      winner: null,
      totalBidders: 0,
      userValueBreakdown: [],
      isSimulated: true,
      aiPowered: false,
    };
  }

  // Try AI auction first
  try {
    return await runAIAuction(visitor);
  } catch {
    // Fallback to calculated
    return runCalculatedAuction(visitor);
  }
}

/**
 * Ad preference page URLs for major platforms
 */
export const AD_PREFERENCE_PAGES = {
  google: {
    name: 'Google',
    url: 'https://adssettings.google.com/',
    description: 'See the interests Google thinks you have',
  },
  facebook: {
    name: 'Facebook/Meta',
    url: 'https://www.facebook.com/ads/preferences/',
    description: 'View your ad interests and advertisers',
  },
  twitter: {
    name: 'X (Twitter)',
    url: 'https://twitter.com/settings/your_twitter_data/twitter_interests',
    description: 'See topics X thinks you\'re interested in',
  },
  microsoft: {
    name: 'Microsoft',
    url: 'https://account.microsoft.com/privacy/ad-settings',
    description: 'Manage Microsoft advertising preferences',
  },
  amazon: {
    name: 'Amazon',
    url: 'https://www.amazon.com/adprefs',
    description: 'View Amazon ad preferences',
  },
  linkedin: {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/psettings/advertising',
    description: 'See how LinkedIn categorizes you',
  },
  tiktok: {
    name: 'TikTok',
    url: 'https://www.tiktok.com/setting/ads',
    description: 'View TikTok ad personalization',
  },
  reddit: {
    name: 'Reddit',
    url: 'https://www.reddit.com/settings/privacy',
    description: 'Manage Reddit ad preferences',
  },
  yahoo: {
    name: 'Yahoo',
    url: 'https://legal.yahoo.com/us/en/yahoo/privacy/adinfo/index.html',
    description: 'Yahoo/AOL ad preferences',
  },
  optOut: {
    name: 'NAI Opt-Out',
    url: 'https://optout.networkadvertising.org/',
    description: 'Opt out of 100+ ad networks at once',
  },
  youradchoices: {
    name: 'YourAdChoices',
    url: 'https://optout.aboutads.info/',
    description: 'DAA opt-out tool for behavioural ads',
  },
};
