/**
 * Shared TypeScript types for YourInfo
 */

/** Geographic coordinates */
export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

/** Server-side gathered information */
export interface ServerInfo {
  ip: string;
  geo: GeoLocation | null;
  userAgent: string;
  acceptLanguage: string;
  referer: string;
  headers: Record<string, string>;
}

/** Client-side gathered information */
export interface ClientInfo {
  // Screen
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  devicePixelRatio: number;
  screenOrientation: string | null;

  // Window
  windowWidth: number;
  windowHeight: number;

  // System
  platform: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;

  // Hardware
  hardwareConcurrency: number;
  deviceMemory: number | null;
  deviceMemoryCapped: boolean; // True if deviceMemory is likely capped at 8GB
  maxTouchPoints: number;

  // Connection
  connectionType: string | null;
  connectionDownlink: number | null;
  connectionRtt: number | null;
  connectionSaveData: boolean | null;

  // Battery
  batteryLevel: number | null;
  batteryCharging: boolean | null;

  // WebGL
  webglVendor: string | null;
  webglRenderer: string | null;
  webglVersion: string | null;
  webglExtensions: number;

  // Capabilities
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  indexedDBEnabled: boolean;
  doNotTrack: boolean;
  globalPrivacyControl: boolean | null;
  pdfViewerEnabled: boolean;

  // Fingerprints
  canvasFingerprint: string;
  audioFingerprint: string;
  webglFingerprint: string;

  // Fonts (detected via canvas)
  fontsDetected: string[];

  // Media Devices
  mediaDevices: {
    audioinput: number;
    videoinput: number;
    audiooutput: number;
  } | null;

  // Speech Voices
  speechVoicesCount: number;
  speechVoicesHash: string;

  // Storage
  storageQuota: {
    usage: number;
    quota: number;
  } | null;

  // Permissions (where detectable)
  permissions: Record<string, string>;

  // Client Hints (if available)
  clientHints: {
    architecture: string | null;
    bitness: string | null;
    mobile: boolean | null;
    model: string | null;
    platformVersion: string | null;
    fullVersionList: string | null;
  } | null;

  // WebRTC
  webrtcLocalIPs: string[];
  webrtcSupported: boolean;

  // Ad Blocker
  adBlockerDetected: boolean | null;

  // Additional APIs
  bluetoothSupported: boolean;
  usbSupported: boolean;
  midiSupported: boolean;
  gamepadsSupported: boolean;
  webGPUSupported: boolean;
  sharedArrayBufferSupported: boolean;

  // CSS/Media Preferences
  prefersColorScheme: string;
  prefersReducedMotion: boolean;
  prefersReducedTransparency: boolean;
  prefersContrast: string;
  forcedColors: boolean;
  colorGamut: string;
  hdrSupported: boolean;
  invertedColors: boolean;

  // Browser Detection
  browserName: string;
  browserVersion: string;
  isIncognito: boolean | null;
  isAutomated: boolean;
  isHeadless: boolean;
  isVirtualMachine: boolean | null;
  historyLength: number;

  // Codec Support
  videoCodecs: string[];
  audioCodecs: string[];
  drmSupported: {
    widevine: boolean;
    fairplay: boolean;
    playready: boolean;
  };

  // Math Fingerprint (JS engine differences)
  mathFingerprint: string;

  // Timing Fingerprint
  timingFingerprint: string;
  performanceMemory: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  } | null;

  // Sensors
  sensors: {
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    ambientLight: boolean;
    proximity: boolean;
    linearAcceleration: boolean;
    gravity: boolean;
    relativeOrientation: boolean;
    absoluteOrientation: boolean;
  };

  // Additional Capabilities
  serviceWorkerSupported: boolean;
  webWorkerSupported: boolean;
  wasmSupported: boolean;
  webSocketSupported: boolean;
  webRTCSupported: boolean;
  notificationSupported: boolean;
  pushSupported: boolean;
  paymentRequestSupported: boolean;
  credentialsSupported: boolean;
  clipboardSupported: boolean;

  // Network Hints
  downlinkMax: number | null;
  hardwareFamily: string | null;

  // Extension Detection (common ones)
  extensionsDetected: string[];

  // Error Fingerprint
  errorFingerprint: string;

  // Navigator Props Count
  navigatorPropsCount: number;
  windowPropsCount: number;

  // Behavioral Tracking (real-time, updated over time)
  behavior: BehaviorData;

  // Installed Apps (protocol handlers)
  installedApps: string[];

  // Social Media Login Detection
  socialLogins: {
    google: boolean | null;
    facebook: boolean | null;
    twitter: boolean | null;
    linkedin: boolean | null;
    github: boolean | null;
    reddit: boolean | null;
    amazon: boolean | null;
    microsoft: boolean | null;
  };

  // Crypto Wallet Detection
  cryptoWallets: string[];

  // VPN/Proxy Detection
  vpnDetection: {
    likelyUsingVPN: boolean;
    timezoneIPMismatch: boolean;
    webrtcLeak: boolean;
    suspiciousHeaders: boolean;
  };

  // Unique Fingerprint ID
  fingerprintId: string;
  fingerprintConfidence: number; // 0-100

  // Cross-Browser Fingerprint (hardware-based, same across browsers)
  crossBrowserId: string;
  crossBrowserFactors: string[];

  // Advanced Behavioral
  advancedBehavior: AdvancedBehavior;

  // User Profile Inference (the creepy stuff)
  userProfile: UserProfile;
}

/** Inferred user profile - what companies guess about you */
export interface UserProfile {
  // User type
  likelyDeveloper: boolean;
  developerScore: number;
  developerReason?: string;
  likelyGamer: boolean;
  gamerScore: number;
  gamerReason?: string;
  likelyDesigner: boolean;
  designerScore: number;
  designerReason?: string;
  likelyPowerUser: boolean;
  powerUserScore: number;
  powerUserReason?: string;
  privacyConscious: boolean;
  privacyScore: number;
  privacyReason?: string;

  // Device assessment
  deviceTier: 'budget' | 'mid-range' | 'high-end' | 'premium';
  estimatedDeviceValue: string;
  deviceAge: 'new' | 'recent' | 'older' | 'old';

  // Bot detection
  humanScore: number; // 0-100, 100 = definitely human
  botIndicators: string[];

  // Demographics inference
  likelyTechSavvy: boolean;
  likelyMobile: boolean;
  likelyWorkDevice: boolean;
  likelyCountry: string;

  // Inferred interests
  inferredInterests: string[];

  // Risk assessment
  fraudRiskScore: number;
  fraudIndicators: string[];

  // AI-generated extended fields
  aiGenerated?: boolean;
  personalityTraits?: string[];
  incomeLevel?: 'low' | 'medium' | 'high' | 'very-high';
  ageRange?: string;
  occupation?: string;

  // Creepy AI inferences
  relationshipStatus?: 'single' | 'in-relationship' | 'married' | 'unknown';
  relationshipReason?: string;
  educationLevel?: 'high-school' | 'some-college' | 'bachelors' | 'masters' | 'phd' | 'unknown';
  educationReason?: string;
  politicalLeaning?: 'liberal' | 'moderate' | 'conservative' | 'unknown';
  politicalReason?: string;
  lifeSituation?: string;
  financialHealth?: 'struggling' | 'stable' | 'comfortable' | 'wealthy';
  financialReason?: string;
  workStyle?: 'remote' | 'office' | 'hybrid' | 'freelance' | 'unemployed' | 'student';
  workReason?: string;
  sleepSchedule?: 'early-bird' | 'night-owl' | 'irregular' | 'normal';
  sleepReason?: string;
  stressLevel?: 'low' | 'moderate' | 'high' | 'burnout';
  stressReason?: string;
  socialLife?: 'introvert' | 'ambivert' | 'extrovert';
  socialReason?: string;
  likelyParent?: boolean;
  parentReason?: string;
  petOwner?: boolean;
  petType?: string | null;
  homeowner?: boolean;
  homeReason?: string;
  carOwner?: boolean;
  carType?: string | null;
  healthConscious?: boolean;
  healthReason?: string;
  dietaryPreference?: string | null;
  coffeeOrTea?: 'coffee' | 'tea' | 'both' | 'neither';
  drinksAlcohol?: boolean;
  smokes?: boolean;
  fitnessLevel?: 'sedentary' | 'light' | 'moderate' | 'athletic';
  fitnessReason?: string;
  lifeEvents?: string[];
  shoppingHabits?: 'frugal' | 'moderate' | 'spender' | 'luxury';
  shoppingReason?: string;
  brandPreference?: string[];
  streamingServices?: string[];
  musicTaste?: string[];
  travelFrequency?: 'rarely' | 'occasionally' | 'frequently' | 'constant';
  travelReason?: string;
  creepyInsights?: string[];
}

/** Behavioral tracking data - updated in real-time */
export interface BehaviorData {
  // Mouse behavior
  mouseSpeed: number; // avg pixels/second
  mouseAcceleration: number;
  mouseMovements: number; // total movements tracked
  mouseDistanceTraveled: number; // total pixels
  mouseIdleTime: number; // ms spent idle

  // Click behavior
  clickCount: number;
  avgClickInterval: number; // ms between clicks
  clickPositions: Array<{ x: number; y: number; time: number }>;

  // Scroll behavior
  scrollSpeed: number; // avg pixels/second
  scrollDepthMax: number; // deepest scroll percentage
  scrollDirectionChanges: number;
  scrollEvents: number;

  // Typing behavior (keystroke dynamics)
  keyPressCount: number;
  avgKeyHoldTime: number; // ms key is held down
  avgKeyInterval: number; // ms between key presses
  typingSpeed: number; // chars per minute

  // Touch behavior (mobile)
  touchCount: number;
  avgTouchPressure: number;
  pinchZoomCount: number;
  swipeCount: number;

  // Focus/Attention
  tabSwitchCount: number;
  totalFocusTime: number; // ms with focus
  totalBlurTime: number; // ms without focus
  pageLoadTime: number;

  // Interaction timing
  firstInteractionTime: number; // ms until first interaction
  lastInteractionTime: number;
  sessionDuration: number;
}

/** Advanced behavioral tracking */
export interface AdvancedBehavior {
  // DevTools detection
  devToolsOpen: boolean;

  // Idle/AFK detection
  isIdle: boolean;
  idleTime: number; // ms since last activity
  afkCount: number; // times went AFK

  // Text selection
  textSelectCount: number;
  lastSelectedText: string;
  copyCount: number;
  pasteCount: number;

  // Rage clicks (frustration)
  rageClickCount: number;
  lastRageClickTime: number;

  // Exit intent
  exitIntentCount: number;
  mouseLeftWindow: boolean;

  // Handedness (inferred from mouse patterns)
  likelyHandedness: 'left' | 'right' | 'unknown';
  handednessConfidence: number;

  // Reading behavior
  estimatedReadingSpeed: number; // words per minute
  contentEngagement: number; // 0-100 score

  // Attention
  focusLossCount: number;
  avgFocusDuration: number;

  // Form behavior
  formInteractions: number;
  formFieldsTyped: number;
  formAbandoned: boolean;

  // Right click / context menu
  rightClickCount: number;

  // Screenshot attempts (PrintScreen detection)
  screenshotAttempts: number;

  // Keyboard shortcuts used
  keyboardShortcutsUsed: string[];
}

/** Complete visitor information */
export interface VisitorInfo {
  id: string;
  server: ServerInfo;
  client: ClientInfo | null;
  connectedAt: number;
}

/** WebSocket message types */
export type WSMessageType =
  | 'welcome'
  | 'visitor_joined'
  | 'visitor_left'
  | 'visitor_updated'
  | 'visitors_list'
  | 'client_info';

/** WebSocket message structure */
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}

/** Welcome message payload */
export interface WelcomePayload {
  visitor: VisitorInfo;
  visitors: VisitorInfo[];
}

/** Visitor event payload */
export interface VisitorEventPayload {
  visitor: VisitorInfo;
}

/** Visitors list payload */
export interface VisitorsListPayload {
  visitors: VisitorInfo[];
}

/** Client info payload (sent from client to server) */
export interface ClientInfoPayload {
  clientInfo: ClientInfo;
}

/** Globe point data for rendering */
export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  visitor: VisitorInfo;
}
