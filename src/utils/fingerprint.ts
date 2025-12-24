/**
 * Client-side fingerprinting utilities
 * Demonstrates what information websites can collect about visitors
 */

import type { ClientInfo } from '../types';
import { getInitialBehaviorData, detectInstalledApps } from './behavior';
import {
  detectSocialLogins,
  detectCryptoWallets,
  detectVPN,
  generateFingerprintId,
  generateCrossBrowserId,
  getInitialAdvancedBehavior,
  generateUserProfile,
} from './advanced';

/**
 * Collect all client-side information
 */
export async function collectClientInfo(): Promise<ClientInfo> {
  const [
    batteryInfo,
    connectionInfo,
    webglInfo,
    canvasFingerprint,
    audioFingerprint,
    fontsDetected,
    mediaDevices,
    speechInfo,
    storageQuota,
    permissions,
    clientHints,
    webrtcInfo,
    adBlockerDetected,
  ] = await Promise.all([
    getBatteryInfo(),
    getConnectionInfo(),
    getWebGLInfo(),
    getCanvasFingerprint(),
    getAudioFingerprint(),
    detectFonts(),
    getMediaDevices(),
    getSpeechVoices(),
    getStorageQuota(),
    getPermissions(),
    getClientHints(),
    getWebRTCInfo(),
    detectAdBlocker(),
  ]);

  const deviceMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null;

  const result: ClientInfo = {
    // Screen
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    devicePixelRatio: window.devicePixelRatio,
    screenOrientation: screen.orientation?.type || null,

    // Window
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,

    // System
    platform: navigator.platform,
    language: navigator.language,
    languages: [...navigator.languages],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    // Hardware
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: deviceMem,
    deviceMemoryCapped: deviceMem === 8, // Browser caps at 8GB for privacy
    maxTouchPoints: navigator.maxTouchPoints || 0,

    // Connection
    connectionType: connectionInfo.type,
    connectionDownlink: connectionInfo.downlink,
    connectionRtt: connectionInfo.rtt,
    connectionSaveData: connectionInfo.saveData,

    // Battery
    batteryLevel: batteryInfo.level,
    batteryCharging: batteryInfo.charging,

    // WebGL
    webglVendor: webglInfo.vendor,
    webglRenderer: webglInfo.renderer,
    webglVersion: webglInfo.version,
    webglExtensions: webglInfo.extensionsCount,

    // Capabilities
    cookiesEnabled: navigator.cookieEnabled,
    localStorageEnabled: isLocalStorageEnabled(),
    sessionStorageEnabled: isSessionStorageEnabled(),
    indexedDBEnabled: isIndexedDBEnabled(),
    doNotTrack: navigator.doNotTrack === '1',
    globalPrivacyControl: getGlobalPrivacyControl(),
    pdfViewerEnabled: (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled ?? false,

    // Fingerprints
    canvasFingerprint,
    audioFingerprint,
    webglFingerprint: webglInfo.fingerprint,

    // Fonts
    fontsDetected,

    // Media Devices
    mediaDevices,

    // Speech Voices
    speechVoicesCount: speechInfo.count,
    speechVoicesHash: speechInfo.hash,

    // Storage
    storageQuota,

    // Permissions
    permissions,

    // Client Hints
    clientHints,

    // WebRTC
    webrtcLocalIPs: webrtcInfo.localIPs,
    webrtcSupported: webrtcInfo.supported,

    // Ad Blocker
    adBlockerDetected,

    // Additional APIs
    bluetoothSupported: 'bluetooth' in navigator,
    usbSupported: 'usb' in navigator,
    midiSupported: 'requestMIDIAccess' in navigator,
    gamepadsSupported: 'getGamepads' in navigator,
    webGPUSupported: 'gpu' in navigator,
    sharedArrayBufferSupported: typeof SharedArrayBuffer !== 'undefined',

    // CSS/Media Preferences
    ...getCSSPreferences(),

    // Browser Detection
    ...getBrowserInfo(),
    isIncognito: await detectIncognito(),
    isAutomated: detectAutomation(),
    isHeadless: detectHeadless(),
    isVirtualMachine: detectVirtualMachine(),
    historyLength: window.history.length,

    // Codec Support
    ...getCodecSupport(),

    // Math Fingerprint
    mathFingerprint: getMathFingerprint(),

    // Timing Fingerprint
    timingFingerprint: getTimingFingerprint(),
    performanceMemory: getPerformanceMemory(),

    // Sensors
    sensors: getSensorSupport(),

    // Additional Capabilities
    serviceWorkerSupported: 'serviceWorker' in navigator,
    webWorkerSupported: typeof Worker !== 'undefined',
    wasmSupported: typeof WebAssembly !== 'undefined',
    webSocketSupported: typeof WebSocket !== 'undefined',
    webRTCSupported: typeof RTCPeerConnection !== 'undefined',
    notificationSupported: 'Notification' in window,
    pushSupported: 'PushManager' in window,
    paymentRequestSupported: 'PaymentRequest' in window,
    credentialsSupported: 'credentials' in navigator,
    clipboardSupported: 'clipboard' in navigator,

    // Network Hints
    downlinkMax: getDownlinkMax(),
    hardwareFamily: getHardwareFamily(),

    // Extension Detection
    extensionsDetected: await detectExtensions(),

    // Error Fingerprint
    errorFingerprint: getErrorFingerprint(),

    // Navigator/Window Props Count
    navigatorPropsCount: Object.keys(Object.getOwnPropertyDescriptors(navigator)).length,
    windowPropsCount: Object.keys(Object.getOwnPropertyDescriptors(window)).length,

    // Behavioral tracking (starts with empty data, updates in real-time)
    behavior: getInitialBehaviorData(),

    // Installed apps detection
    installedApps: await detectInstalledApps(),

    // Social media login detection
    socialLogins: await detectSocialLogins(),

    // Crypto wallet detection
    cryptoWallets: detectCryptoWallets(),

    // VPN detection (needs server timezone for comparison)
    vpnDetection: await detectVPN(undefined, webrtcInfo.localIPs),

    // Generate unique fingerprint ID
    ...(() => {
      const fp = generateFingerprintId({
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenColorDepth: window.screen.colorDepth,
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        webglRenderer: webglInfo.renderer,
        webglVendor: webglInfo.vendor,
        canvasFingerprint,
        audioFingerprint,
        fontsDetected,
        mathFingerprint: getMathFingerprint(),
        errorFingerprint: getErrorFingerprint(),
      });
      const crossBrowser = generateCrossBrowserId();
      return {
        fingerprintId: fp.id,
        fingerprintConfidence: fp.confidence,
        crossBrowserId: crossBrowser.id,
        crossBrowserFactors: crossBrowser.factors,
      };
    })(),

    // Advanced behavioral tracking
    advancedBehavior: getInitialAdvancedBehavior(),

    // User profile inference (placeholder - will be updated below)
    userProfile: null as unknown as ClientInfo['userProfile'],
  };

  // Generate user profile now that we have all data
  result.userProfile = generateUserProfile(result);

  return result;
}

/**
 * Get battery information (if available)
 */
async function getBatteryInfo(): Promise<{ level: number | null; charging: boolean | null }> {
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    if (nav.getBattery) {
      const battery = await nav.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
      };
    }
  } catch {
    // Battery API not available
  }
  return { level: null, charging: null };
}

/**
 * Get network connection information
 */
function getConnectionInfo(): {
  type: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean | null;
} {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  };

  if (nav.connection) {
    return {
      type: nav.connection.effectiveType || null,
      downlink: nav.connection.downlink || null,
      rtt: nav.connection.rtt || null,
      saveData: nav.connection.saveData ?? null,
    };
  }

  return { type: null, downlink: null, rtt: null, saveData: null };
}

/**
 * Get WebGL renderer info (reveals GPU)
 */
function getWebGLInfo(): {
  vendor: string | null;
  renderer: string | null;
  version: string | null;
  extensionsCount: number;
  fingerprint: string;
} {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const glCtx = gl as WebGLRenderingContext;
      const debugInfo = glCtx.getExtension('WEBGL_debug_renderer_info');
      const extensions = glCtx.getSupportedExtensions() || [];

      // Create WebGL fingerprint from parameters
      const params = [
        glCtx.getParameter(glCtx.VERSION),
        glCtx.getParameter(glCtx.SHADING_LANGUAGE_VERSION),
        glCtx.getParameter(glCtx.MAX_TEXTURE_SIZE),
        glCtx.getParameter(glCtx.MAX_VERTEX_ATTRIBS),
        glCtx.getParameter(glCtx.MAX_VERTEX_UNIFORM_VECTORS),
        glCtx.getParameter(glCtx.MAX_VARYING_VECTORS),
        glCtx.getParameter(glCtx.MAX_FRAGMENT_UNIFORM_VECTORS),
        glCtx.getParameter(glCtx.MAX_RENDERBUFFER_SIZE),
        extensions.length,
      ].join('|');

      return {
        vendor: debugInfo ? glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        renderer: debugInfo ? glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
        version: glCtx.getParameter(glCtx.VERSION),
        extensionsCount: extensions.length,
        fingerprint: hashString(params),
      };
    }
  } catch {
    // WebGL not available
  }
  return { vendor: null, renderer: null, version: null, extensionsCount: 0, fingerprint: 'unavailable' };
}

/**
 * Generate canvas fingerprint hash
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw various shapes and text
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('YourInfo <canvas> 1.0', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('YourInfo <canvas> 1.0', 4, 17);

      // Add some gradients and arcs
      ctx.beginPath();
      ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      // Get data URL and hash it
      const dataUrl = canvas.toDataURL();
      return hashString(dataUrl);
    }
  } catch {
    // Canvas not available
  }
  return 'unavailable';
}

/**
 * Generate audio fingerprint hash
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return 'unavailable';

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    // Configure audio nodes
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);
    gain.gain.setValueAtTime(0, context.currentTime);

    // Connect nodes
    oscillator.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(gain);
    gain.connect(context.destination);

    oscillator.start(0);

    // Wait for audio processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get frequency data
    const frequencyData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(frequencyData);

    oscillator.stop();
    await context.close();

    // Hash the frequency data
    const dataString = frequencyData.slice(0, 30).join(',');
    return hashString(dataString);
  } catch {
    // Audio API not available
  }
  return 'unavailable';
}

/**
 * Detect available fonts using canvas measurement
 */
function detectFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testFonts = [
    'Arial',
    'Arial Black',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Lucida Console',
    'Palatino Linotype',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Helvetica',
    'Monaco',
    'Menlo',
    'Consolas',
    'Ubuntu',
    'Roboto',
    'Open Sans',
    'Segoe UI',
    'SF Pro',
    'SF Mono',
    'Fira Code',
    'JetBrains Mono',
    'Source Code Pro',
    'Cascadia Code',
    'Noto Sans',
    'Noto Serif',
    'Liberation Sans',
    'Liberation Mono',
  ];

  const detected: string[] = [];
  const testString = 'mmmmmmmmmmlli';
  const testSize = '72px';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return detected;

  // Measure base fonts
  const baseMeasurements: Record<string, number> = {};
  for (const font of baseFonts) {
    ctx.font = `${testSize} ${font}`;
    baseMeasurements[font] = ctx.measureText(testString).width;
  }

  // Test each font against base fonts
  for (const font of testFonts) {
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} '${font}', ${baseFont}`;
      const width = ctx.measureText(testString).width;
      if (width !== baseMeasurements[baseFont]) {
        detected.push(font);
        break;
      }
    }
  }

  return detected;
}

/**
 * Get media devices count
 */
async function getMediaDevices(): Promise<{
  audioinput: number;
  videoinput: number;
  audiooutput: number;
} | null> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return null;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const counts = { audioinput: 0, videoinput: 0, audiooutput: 0 };

    for (const device of devices) {
      if (device.kind in counts) {
        counts[device.kind as keyof typeof counts]++;
      }
    }

    return counts;
  } catch {
    return null;
  }
}

/**
 * Get speech synthesis voices
 */
async function getSpeechVoices(): Promise<{ count: number; hash: string }> {
  try {
    if (!('speechSynthesis' in window)) {
      return { count: 0, hash: 'unavailable' };
    }

    // Wait for voices to load
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        speechSynthesis.onvoiceschanged = () => resolve();
        setTimeout(resolve, 500); // Timeout fallback
      });
      voices = speechSynthesis.getVoices();
    }

    const voiceString = voices.map((v) => `${v.name}|${v.lang}|${v.localService}`).join(',');
    return {
      count: voices.length,
      hash: hashString(voiceString),
    };
  } catch {
    return { count: 0, hash: 'unavailable' };
  }
}

/**
 * Get storage quota
 */
async function getStorageQuota(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null;

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get permission states
 */
async function getPermissions(): Promise<Record<string, string>> {
  const permissions: Record<string, string> = {};

  if (!navigator.permissions) return permissions;

  const permissionNames = [
    'geolocation',
    'notifications',
    'camera',
    'microphone',
    'accelerometer',
    'gyroscope',
    'magnetometer',
    'clipboard-read',
    'clipboard-write',
  ];

  await Promise.all(
    permissionNames.map(async (name) => {
      try {
        const result = await navigator.permissions.query({ name: name as PermissionName });
        permissions[name] = result.state;
      } catch {
        // Permission not supported
      }
    })
  );

  return permissions;
}

/**
 * Get Client Hints (if available)
 */
async function getClientHints(): Promise<{
  architecture: string | null;
  bitness: string | null;
  mobile: boolean | null;
  model: string | null;
  platformVersion: string | null;
  fullVersionList: string | null;
} | null> {
  try {
    const nav = navigator as Navigator & {
      userAgentData?: {
        architecture?: string;
        bitness?: string;
        mobile?: boolean;
        model?: string;
        platform?: string;
        platformVersion?: string;
        getHighEntropyValues?: (hints: string[]) => Promise<{
          architecture?: string;
          bitness?: string;
          mobile?: boolean;
          model?: string;
          platformVersion?: string;
          fullVersionList?: Array<{ brand: string; version: string }>;
        }>;
      };
    };

    if (!nav.userAgentData?.getHighEntropyValues) return null;

    const data = await nav.userAgentData.getHighEntropyValues([
      'architecture',
      'bitness',
      'mobile',
      'model',
      'platformVersion',
      'fullVersionList',
    ]);

    return {
      architecture: data.architecture || null,
      bitness: data.bitness || null,
      mobile: data.mobile ?? null,
      model: data.model || null,
      platformVersion: data.platformVersion || null,
      fullVersionList: data.fullVersionList?.map((v) => `${v.brand} ${v.version}`).join(', ') || null,
    };
  } catch {
    return null;
  }
}

/**
 * Get WebRTC local IPs
 */
async function getWebRTCInfo(): Promise<{ localIPs: string[]; supported: boolean }> {
  if (!window.RTCPeerConnection) {
    return { localIPs: [], supported: false };
  }

  try {
    const localIPs: string[] = [];
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.createDataChannel('');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ICE candidates
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        const candidate = event.candidate.candidate;
        // Extract IP addresses from ICE candidates
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (ipMatch && !localIPs.includes(ipMatch[0])) {
          // Filter out STUN server response (public IP)
          if (
            ipMatch[0].startsWith('10.') ||
            ipMatch[0].startsWith('192.168.') ||
            ipMatch[0].startsWith('172.')
          ) {
            localIPs.push(ipMatch[0]);
          }
        }

        // Also check for IPv6
        const ipv6Match = candidate.match(/([a-f0-9:]+:+)+[a-f0-9]+/i);
        if (ipv6Match && !localIPs.includes(ipv6Match[0])) {
          localIPs.push(ipv6Match[0]);
        }
      };
    });

    pc.close();
    return { localIPs, supported: true };
  } catch {
    return { localIPs: [], supported: true };
  }
}

/**
 * Detect ad blocker
 */
async function detectAdBlocker(): Promise<boolean | null> {
  try {
    // Create a bait element that ad blockers typically block
    const bait = document.createElement('div');
    bait.className = 'ad ads adsbox ad-placement carbon-ads';
    bait.style.cssText =
      'position:absolute;top:-10px;left:-10px;width:1px;height:1px;';
    bait.innerHTML = '&nbsp;';
    document.body.appendChild(bait);

    // Wait a bit for ad blocker to act
    await new Promise((resolve) => setTimeout(resolve, 100));

    const blocked =
      bait.offsetHeight === 0 ||
      bait.offsetWidth === 0 ||
      bait.clientHeight === 0 ||
      getComputedStyle(bait).display === 'none' ||
      getComputedStyle(bait).visibility === 'hidden';

    document.body.removeChild(bait);

    // Also try to fetch a known ad script
    try {
      await fetch(
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        { mode: 'no-cors', cache: 'no-store' }
      );
      // If we get here, ad scripts aren't blocked
      return blocked;
    } catch {
      // Fetch was blocked - ad blocker detected
      return true;
    }
  } catch {
    return null;
  }
}

/**
 * Get Global Privacy Control setting
 */
function getGlobalPrivacyControl(): boolean | null {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl ?? null;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageEnabled(): boolean {
  try {
    const key = '__yourinfo_test__';
    localStorage.setItem(key, 'test');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
function isSessionStorageEnabled(): boolean {
  try {
    const key = '__yourinfo_test__';
    sessionStorage.setItem(key, 'test');
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB is available
 */
function isIndexedDBEnabled(): boolean {
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}

/**
 * Simple hash function for fingerprinting
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get CSS/Media query preferences
 */
function getCSSPreferences() {
  const getMediaQuery = (query: string): boolean => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  let colorScheme = 'no-preference';
  if (getMediaQuery('(prefers-color-scheme: dark)')) colorScheme = 'dark';
  else if (getMediaQuery('(prefers-color-scheme: light)')) colorScheme = 'light';

  let contrast = 'no-preference';
  if (getMediaQuery('(prefers-contrast: more)')) contrast = 'more';
  else if (getMediaQuery('(prefers-contrast: less)')) contrast = 'less';
  else if (getMediaQuery('(prefers-contrast: custom)')) contrast = 'custom';

  let colorGamut = 'srgb';
  if (getMediaQuery('(color-gamut: rec2020)')) colorGamut = 'rec2020';
  else if (getMediaQuery('(color-gamut: p3)')) colorGamut = 'p3';

  return {
    prefersColorScheme: colorScheme,
    prefersReducedMotion: getMediaQuery('(prefers-reduced-motion: reduce)'),
    prefersReducedTransparency: getMediaQuery('(prefers-reduced-transparency: reduce)'),
    prefersContrast: contrast,
    forcedColors: getMediaQuery('(forced-colors: active)'),
    colorGamut,
    hdrSupported: getMediaQuery('(dynamic-range: high)'),
    invertedColors: getMediaQuery('(inverted-colors: inverted)'),
  };
}

/**
 * Get browser name and version from user agent
 */
function getBrowserInfo(): { browserName: string; browserVersion: string } {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = '';

  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.?\d*)/)?.[1] || '';
  }

  return { browserName, browserVersion };
}

/**
 * Detect incognito/private browsing mode
 */
async function detectIncognito(): Promise<boolean | null> {
  try {
    // Chrome/Chromium method - storage quota is limited in incognito
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { quota } = await navigator.storage.estimate();
      // Incognito usually has quota < 120MB
      if (quota && quota < 120000000) return true;
    }

    // Firefox method - indexedDB behaves differently
    return new Promise((resolve) => {
      const db = indexedDB.open('test');
      db.onerror = () => resolve(true);
      db.onsuccess = () => {
        db.result.close();
        resolve(false);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Detect browser automation (Selenium, Puppeteer, Playwright)
 */
function detectAutomation(): boolean {
  const dominated = navigator as Navigator & {
    webdriver?: boolean;
  };
  const win = window as Window & {
    __nightmare?: unknown;
    _phantom?: unknown;
    phantom?: unknown;
    callPhantom?: unknown;
    __selenium_unwrapped?: unknown;
    __webdriver_evaluate?: unknown;
    __driver_evaluate?: unknown;
    __webdriver_unwrapped?: unknown;
    __fxdriver_evaluate?: unknown;
    __fxdriver_unwrapped?: unknown;
    _Selenium_IDE_Recorder?: unknown;
    _selenium?: unknown;
    calledSelenium?: unknown;
    domAutomation?: unknown;
    domAutomationController?: unknown;
  };

  return !!(
    dominated.webdriver ||
    win.__nightmare ||
    win._phantom ||
    win.phantom ||
    win.callPhantom ||
    win.__selenium_unwrapped ||
    win.__webdriver_evaluate ||
    win.__driver_evaluate ||
    win.__webdriver_unwrapped ||
    win.__fxdriver_evaluate ||
    win.__fxdriver_unwrapped ||
    win._Selenium_IDE_Recorder ||
    win._selenium ||
    win.calledSelenium ||
    win.domAutomation ||
    win.domAutomationController ||
    document.documentElement.getAttribute('webdriver') ||
    document.documentElement.getAttribute('selenium') ||
    document.documentElement.getAttribute('driver')
  );
}

/**
 * Detect headless browser
 */
function detectHeadless(): boolean {
  // Check for headless indicators
  const dominated = navigator as Navigator & {
    webdriver?: boolean;
  };

  // Plugins length is 0 in headless
  if (navigator.plugins.length === 0) return true;

  // Languages empty in headless
  if (navigator.languages.length === 0) return true;

  // Webdriver flag
  if (dominated.webdriver) return true;

  // Check for HeadlessChrome in user agent
  if (navigator.userAgent.includes('HeadlessChrome')) return true;

  // Check for missing chrome object in Chrome
  if (navigator.userAgent.includes('Chrome') && !(window as Window & { chrome?: unknown }).chrome) {
    return true;
  }

  return false;
}

/**
 * Detect if running in a virtual machine
 */
function detectVirtualMachine(): boolean | null {
  try {
    // Check WebGL renderer for VM indicators
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        const vmIndicators = ['vmware', 'virtualbox', 'virtual', 'parallels', 'hyper-v', 'qemu', 'xen'];
        for (const indicator of vmIndicators) {
          if (renderer.includes(indicator)) return true;
        }
      }
    }

    // Check for low hardware specs that might indicate VM
    if (navigator.hardwareConcurrency <= 2 &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory &&
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 2) {
      return null; // Suspicious but not conclusive
    }

    return false;
  } catch {
    return null;
  }
}

/**
 * Get codec support
 */
function getCodecSupport() {
  const videoCodecs: string[] = [];
  const audioCodecs: string[] = [];

  const videoTypes = [
    { codec: 'video/mp4; codecs="avc1.42E01E"', name: 'H.264' },
    { codec: 'video/mp4; codecs="avc1.4D401E"', name: 'H.264 Main' },
    { codec: 'video/mp4; codecs="avc1.64001E"', name: 'H.264 High' },
    { codec: 'video/mp4; codecs="hvc1.1.6.L93.B0"', name: 'H.265/HEVC' },
    { codec: 'video/webm; codecs="vp8"', name: 'VP8' },
    { codec: 'video/webm; codecs="vp9"', name: 'VP9' },
    { codec: 'video/webm; codecs="av01.0.00M.08"', name: 'AV1' },
    { codec: 'video/ogg; codecs="theora"', name: 'Theora' },
  ];

  const audioTypes = [
    { codec: 'audio/mp4; codecs="mp4a.40.2"', name: 'AAC' },
    { codec: 'audio/mpeg', name: 'MP3' },
    { codec: 'audio/webm; codecs="opus"', name: 'Opus' },
    { codec: 'audio/webm; codecs="vorbis"', name: 'Vorbis' },
    { codec: 'audio/ogg; codecs="flac"', name: 'FLAC' },
    { codec: 'audio/wav', name: 'WAV' },
  ];

  const video = document.createElement('video');
  const audio = document.createElement('audio');

  for (const { codec, name } of videoTypes) {
    if (video.canPlayType(codec)) videoCodecs.push(name);
  }

  for (const { codec, name } of audioTypes) {
    if (audio.canPlayType(codec)) audioCodecs.push(name);
  }

  // DRM Support
  const drmSupported = {
    widevine: false,
    fairplay: false,
    playready: false,
  };

  if ('requestMediaKeySystemAccess' in navigator) {
    // We can't actually test without async, so just check if API exists
    drmSupported.widevine = true; // Chrome, Firefox, Edge
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      drmSupported.fairplay = true;
    }
    if (navigator.userAgent.includes('Edge') || navigator.userAgent.includes('Windows')) {
      drmSupported.playready = true;
    }
  }

  return { videoCodecs, audioCodecs, drmSupported };
}

/**
 * Math fingerprint - JS engines have subtle differences in math operations
 */
function getMathFingerprint(): string {
  const results = [
    Math.tan(-1e300),
    Math.sin(1),
    Math.cos(1),
    Math.exp(1),
    Math.log(2),
    Math.sqrt(2),
    Math.acos(0.5),
    Math.asin(0.5),
    Math.atan(1),
    Math.atan2(1, 1),
    Math.pow(Math.PI, -100),
    Math.sinh(1),
    Math.cosh(1),
    Math.tanh(1),
    Math.asinh(1),
    Math.acosh(2),
    Math.atanh(0.5),
    Math.cbrt(100),
    Math.hypot(1, 2),
    Math.log1p(1),
    Math.expm1(1),
  ].map(n => n.toString()).join(',');

  return hashString(results);
}

/**
 * Get timing-based fingerprint
 */
function getTimingFingerprint(): string {
  const start = performance.now();

  // Do some predictable work
  let result = 0;
  for (let i = 0; i < 10000; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }

  const end = performance.now();
  const duration = end - start;

  // Combine with performance timing data
  const timing = performance.timing || ({} as PerformanceTiming);
  const timingData = [
    duration.toFixed(2),
    (timing.domContentLoadedEventEnd - timing.navigationStart) || 0,
    (timing.loadEventEnd - timing.navigationStart) || 0,
    performance.timeOrigin?.toFixed(0) || '0',
  ].join('|');

  return hashString(timingData + result.toFixed(2));
}

/**
 * Get performance memory info
 */
function getPerformanceMemory(): { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } | null {
  const perf = performance as Performance & {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  };

  if (perf.memory) {
    return {
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      usedJSHeapSize: perf.memory.usedJSHeapSize,
    };
  }

  return null;
}

/**
 * Get sensor API support
 */
function getSensorSupport() {
  const win = window as Window & {
    Accelerometer?: unknown;
    Gyroscope?: unknown;
    Magnetometer?: unknown;
    AmbientLightSensor?: unknown;
    ProximitySensor?: unknown;
    LinearAccelerationSensor?: unknown;
    GravitySensor?: unknown;
    RelativeOrientationSensor?: unknown;
    AbsoluteOrientationSensor?: unknown;
  };

  return {
    accelerometer: 'Accelerometer' in win,
    gyroscope: 'Gyroscope' in win,
    magnetometer: 'Magnetometer' in win,
    ambientLight: 'AmbientLightSensor' in win,
    proximity: 'ProximitySensor' in win,
    linearAcceleration: 'LinearAccelerationSensor' in win,
    gravity: 'GravitySensor' in win,
    relativeOrientation: 'RelativeOrientationSensor' in win,
    absoluteOrientation: 'AbsoluteOrientationSensor' in win,
  };
}

/**
 * Get max downlink speed
 */
function getDownlinkMax(): number | null {
  const nav = navigator as Navigator & {
    connection?: {
      downlinkMax?: number;
    };
  };
  return nav.connection?.downlinkMax ?? null;
}

/**
 * Get hardware family hint
 */
function getHardwareFamily(): string | null {
  // Infer hardware family from various signals
  const ua = navigator.userAgent;
  const platform = navigator.platform;

  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Android')) {
    if (ua.includes('Mobile')) return 'Android Phone';
    return 'Android Tablet';
  }
  if (platform.includes('Win')) return 'Windows PC';
  if (platform.includes('Linux')) return 'Linux PC';
  if (ua.includes('CrOS')) return 'Chromebook';

  return null;
}

/**
 * Detect common browser extensions
 */
async function detectExtensions(): Promise<string[]> {
  const detected: string[] = [];

  // Check for common extension-injected elements or globals
  const checks: Array<{ name: string; check: () => boolean }> = [
    {
      name: 'LastPass',
      check: () => !!document.querySelector('[data-lastpass-root]') ||
                   !!(window as Window & { __LASTPASS_EXTENSION_LOADED__?: unknown }).__LASTPASS_EXTENSION_LOADED__
    },
    {
      name: 'Grammarly',
      check: () => !!document.querySelector('grammarly-desktop-integration') ||
                   !!document.querySelector('[data-grammarly-shadow-root]')
    },
    {
      name: 'React DevTools',
      check: () => !!(window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__
    },
    {
      name: 'Vue DevTools',
      check: () => !!(window as Window & { __VUE_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__VUE_DEVTOOLS_GLOBAL_HOOK__
    },
    {
      name: 'Redux DevTools',
      check: () => !!(window as Window & { __REDUX_DEVTOOLS_EXTENSION__?: unknown }).__REDUX_DEVTOOLS_EXTENSION__
    },
    {
      name: 'Honey',
      check: () => !!document.querySelector('[data-honey-container]')
    },
    {
      name: 'Dashlane',
      check: () => !!document.querySelector('[data-dashlanecreated]')
    },
    {
      name: '1Password',
      check: () => !!document.querySelector('[data-onepassword-extension]') ||
                   !!document.querySelector('[data-com-onepassword-version]')
    },
    {
      name: 'Bitwarden',
      check: () => !!document.querySelector('[data-bwautofill]')
    },
  ];

  for (const { name, check } of checks) {
    try {
      if (check()) detected.push(name);
    } catch {
      // Ignore errors
    }
  }

  return detected;
}

/**
 * Error fingerprint - error messages differ between browsers
 */
function getErrorFingerprint(): string {
  const errors: string[] = [];

  try {
    // @ts-expect-error Intentional error
    null.toString();
  } catch (e) {
    errors.push((e as Error).message);
  }

  try {
    // @ts-expect-error Intentional error
    undefined.toString();
  } catch (e) {
    errors.push((e as Error).message);
  }

  try {
    // @ts-expect-error Intentional error
    ({}).foo.bar;
  } catch (e) {
    errors.push((e as Error).message);
  }

  try {
    eval('function(){');
  } catch (e) {
    errors.push((e as Error).message);
  }

  return hashString(errors.join('|'));
}
