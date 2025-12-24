/**
 * Behavioral Tracking Module
 * Tracks user behavior patterns that can be used for identification
 * This demonstrates how websites track your behavior, not just your device
 */

import type { BehaviorData } from '../types';

/** Callback for behavior updates */
type BehaviorCallback = (data: BehaviorData) => void;

/** Internal tracking state */
interface TrackingState {
  // Mouse
  lastMouseX: number;
  lastMouseY: number;
  lastMouseTime: number;
  mouseSpeedSamples: number[];
  mouseAccelSamples: number[];
  totalMouseDistance: number;
  mouseMovementCount: number;
  lastMouseMoveTime: number;

  // Clicks
  clickTimes: number[];
  clickPositions: Array<{ x: number; y: number; time: number }>;

  // Scroll
  lastScrollY: number;
  lastScrollTime: number;
  lastScrollDirection: 'up' | 'down' | null;
  scrollSpeedSamples: number[];
  scrollDirectionChanges: number;
  scrollEventCount: number;
  maxScrollDepth: number;

  // Keyboard
  keyPressTimes: number[];
  keyHoldDurations: number[];
  keyIntervals: number[];
  lastKeyDownTime: number;
  lastKeyUpTime: number;
  totalKeysPressed: number;

  // Touch
  touchCount: number;
  touchPressures: number[];
  lastTouchCount: number;
  pinchZoomCount: number;
  swipeCount: number;
  lastTouchX: number;
  lastTouchY: number;

  // Focus
  tabSwitchCount: number;
  focusStartTime: number;
  totalFocusTime: number;
  blurStartTime: number;
  totalBlurTime: number;
  hasFocus: boolean;

  // Session
  pageLoadTime: number;
  firstInteractionTime: number | null;
  lastInteractionTime: number;
}

class BehaviorTracker {
  private state: TrackingState;
  private callbacks: BehaviorCallback[] = [];
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): TrackingState {
    return {
      lastMouseX: 0,
      lastMouseY: 0,
      lastMouseTime: 0,
      mouseSpeedSamples: [],
      mouseAccelSamples: [],
      totalMouseDistance: 0,
      mouseMovementCount: 0,
      lastMouseMoveTime: Date.now(),

      clickTimes: [],
      clickPositions: [],

      lastScrollY: 0,
      lastScrollTime: 0,
      lastScrollDirection: null,
      scrollSpeedSamples: [],
      scrollDirectionChanges: 0,
      scrollEventCount: 0,
      maxScrollDepth: 0,

      keyPressTimes: [],
      keyHoldDurations: [],
      keyIntervals: [],
      lastKeyDownTime: 0,
      lastKeyUpTime: 0,
      totalKeysPressed: 0,

      touchCount: 0,
      touchPressures: [],
      lastTouchCount: 0,
      pinchZoomCount: 0,
      swipeCount: 0,
      lastTouchX: 0,
      lastTouchY: 0,

      tabSwitchCount: 0,
      focusStartTime: Date.now(),
      totalFocusTime: 0,
      blurStartTime: 0,
      totalBlurTime: 0,
      hasFocus: document.hasFocus(),

      pageLoadTime: performance.now(),
      firstInteractionTime: null,
      lastInteractionTime: Date.now(),
    };
  }

  /** Start tracking behavior */
  start(callback?: BehaviorCallback): void {
    if (this.initialized) return;
    this.initialized = true;

    if (callback) {
      this.callbacks.push(callback);
    }

    // Mouse tracking
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick);

    // Scroll tracking
    document.addEventListener('scroll', this.handleScroll, { passive: true });

    // Keyboard tracking
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    // Touch tracking
    document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    // Focus tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);

    // Update callbacks periodically
    this.updateInterval = setInterval(() => {
      this.notifyCallbacks();
    }, 1000);
  }

  /** Stop tracking */
  stop(): void {
    if (!this.initialized) return;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.initialized = false;
  }

  /** Subscribe to behavior updates */
  subscribe(callback: BehaviorCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /** Get current behavior data */
  getData(): BehaviorData {
    const s = this.state;
    const now = Date.now();

    // Calculate averages
    const avgMouseSpeed = s.mouseSpeedSamples.length > 0
      ? s.mouseSpeedSamples.reduce((a, b) => a + b, 0) / s.mouseSpeedSamples.length
      : 0;

    const avgMouseAccel = s.mouseAccelSamples.length > 0
      ? s.mouseAccelSamples.reduce((a, b) => a + b, 0) / s.mouseAccelSamples.length
      : 0;

    const avgScrollSpeed = s.scrollSpeedSamples.length > 0
      ? s.scrollSpeedSamples.reduce((a, b) => a + b, 0) / s.scrollSpeedSamples.length
      : 0;

    const avgClickInterval = s.clickTimes.length > 1
      ? s.clickTimes.slice(1).reduce((sum, time, i) => sum + (time - s.clickTimes[i]), 0) / (s.clickTimes.length - 1)
      : 0;

    const avgKeyHoldTime = s.keyHoldDurations.length > 0
      ? s.keyHoldDurations.reduce((a, b) => a + b, 0) / s.keyHoldDurations.length
      : 0;

    const avgKeyInterval = s.keyIntervals.length > 0
      ? s.keyIntervals.reduce((a, b) => a + b, 0) / s.keyIntervals.length
      : 0;

    const avgTouchPressure = s.touchPressures.length > 0
      ? s.touchPressures.reduce((a, b) => a + b, 0) / s.touchPressures.length
      : 0;

    // Typing speed (chars per minute)
    const sessionMinutes = (now - s.pageLoadTime) / 60000;
    const typingSpeed = sessionMinutes > 0 ? s.totalKeysPressed / sessionMinutes : 0;

    // Calculate focus time
    let totalFocus = s.totalFocusTime;
    let totalBlur = s.totalBlurTime;
    if (s.hasFocus) {
      totalFocus += now - s.focusStartTime;
    } else if (s.blurStartTime > 0) {
      totalBlur += now - s.blurStartTime;
    }

    // Mouse idle time
    const mouseIdleTime = now - s.lastMouseMoveTime;

    return {
      mouseSpeed: Math.round(avgMouseSpeed * 100) / 100,
      mouseAcceleration: Math.round(avgMouseAccel * 100) / 100,
      mouseMovements: s.mouseMovementCount,
      mouseDistanceTraveled: Math.round(s.totalMouseDistance),
      mouseIdleTime,

      clickCount: s.clickTimes.length,
      avgClickInterval: Math.round(avgClickInterval),
      clickPositions: s.clickPositions.slice(-10), // Last 10 clicks

      scrollSpeed: Math.round(avgScrollSpeed * 100) / 100,
      scrollDepthMax: Math.round(s.maxScrollDepth * 100) / 100,
      scrollDirectionChanges: s.scrollDirectionChanges,
      scrollEvents: s.scrollEventCount,

      keyPressCount: s.totalKeysPressed,
      avgKeyHoldTime: Math.round(avgKeyHoldTime),
      avgKeyInterval: Math.round(avgKeyInterval),
      typingSpeed: Math.round(typingSpeed),

      touchCount: s.touchCount,
      avgTouchPressure: Math.round(avgTouchPressure * 100) / 100,
      pinchZoomCount: s.pinchZoomCount,
      swipeCount: s.swipeCount,

      tabSwitchCount: s.tabSwitchCount,
      totalFocusTime: Math.round(totalFocus),
      totalBlurTime: Math.round(totalBlur),
      pageLoadTime: Math.round(s.pageLoadTime),

      firstInteractionTime: s.firstInteractionTime ?? 0,
      lastInteractionTime: s.lastInteractionTime,
      sessionDuration: now - s.pageLoadTime,
    };
  }

  private recordInteraction(): void {
    const now = Date.now();
    if (this.state.firstInteractionTime === null) {
      this.state.firstInteractionTime = now - this.state.pageLoadTime;
    }
    this.state.lastInteractionTime = now;
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const now = performance.now();
    const { lastMouseX, lastMouseY, lastMouseTime } = this.state;

    if (lastMouseTime > 0) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dt = now - lastMouseTime;

      if (dt > 0) {
        const speed = distance / dt * 1000; // pixels per second
        this.state.mouseSpeedSamples.push(speed);

        // Keep only last 100 samples
        if (this.state.mouseSpeedSamples.length > 100) {
          this.state.mouseSpeedSamples.shift();
        }

        // Calculate acceleration
        if (this.state.mouseSpeedSamples.length > 1) {
          const prevSpeed = this.state.mouseSpeedSamples[this.state.mouseSpeedSamples.length - 2];
          const accel = Math.abs(speed - prevSpeed) / dt * 1000;
          this.state.mouseAccelSamples.push(accel);
          if (this.state.mouseAccelSamples.length > 100) {
            this.state.mouseAccelSamples.shift();
          }
        }

        this.state.totalMouseDistance += distance;
      }
    }

    this.state.lastMouseX = e.clientX;
    this.state.lastMouseY = e.clientY;
    this.state.lastMouseTime = now;
    this.state.lastMouseMoveTime = Date.now();
    this.state.mouseMovementCount++;
    this.recordInteraction();
  };

  private handleClick = (e: MouseEvent): void => {
    const now = Date.now();
    this.state.clickTimes.push(now);
    this.state.clickPositions.push({
      x: e.clientX,
      y: e.clientY,
      time: now,
    });

    // Keep only last 50 clicks
    if (this.state.clickTimes.length > 50) {
      this.state.clickTimes.shift();
      this.state.clickPositions.shift();
    }

    this.recordInteraction();
  };

  private handleScroll = (): void => {
    const now = performance.now();
    const scrollY = window.scrollY;
    const { lastScrollY, lastScrollTime, lastScrollDirection } = this.state;

    if (lastScrollTime > 0) {
      const distance = Math.abs(scrollY - lastScrollY);
      const dt = now - lastScrollTime;

      if (dt > 0 && distance > 0) {
        const speed = distance / dt * 1000; // pixels per second
        this.state.scrollSpeedSamples.push(speed);

        if (this.state.scrollSpeedSamples.length > 50) {
          this.state.scrollSpeedSamples.shift();
        }

        // Detect direction change
        const direction = scrollY > lastScrollY ? 'down' : 'up';
        if (lastScrollDirection && direction !== lastScrollDirection) {
          this.state.scrollDirectionChanges++;
        }
        this.state.lastScrollDirection = direction;
      }
    }

    // Calculate scroll depth
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const viewportHeight = window.innerHeight;
    const scrollDepth = (scrollY + viewportHeight) / docHeight;
    this.state.maxScrollDepth = Math.max(this.state.maxScrollDepth, scrollDepth);

    this.state.lastScrollY = scrollY;
    this.state.lastScrollTime = now;
    this.state.scrollEventCount++;
    this.recordInteraction();
  };

  private handleKeyDown = (_e: KeyboardEvent): void => {
    const now = performance.now();

    // Calculate interval from last key
    if (this.state.lastKeyUpTime > 0) {
      const interval = now - this.state.lastKeyUpTime;
      this.state.keyIntervals.push(interval);
      if (this.state.keyIntervals.length > 50) {
        this.state.keyIntervals.shift();
      }
    }

    this.state.lastKeyDownTime = now;
    this.state.keyPressTimes.push(now);
    if (this.state.keyPressTimes.length > 50) {
      this.state.keyPressTimes.shift();
    }

    this.state.totalKeysPressed++;
    this.recordInteraction();
  };

  private handleKeyUp = (): void => {
    const now = performance.now();

    if (this.state.lastKeyDownTime > 0) {
      const holdDuration = now - this.state.lastKeyDownTime;
      this.state.keyHoldDurations.push(holdDuration);
      if (this.state.keyHoldDurations.length > 50) {
        this.state.keyHoldDurations.shift();
      }
    }

    this.state.lastKeyUpTime = now;
  };

  private handleTouchStart = (e: TouchEvent): void => {
    this.state.touchCount++;

    // Record touch pressure if available
    for (const touch of Array.from(e.touches)) {
      if ('force' in touch && (touch as Touch & { force: number }).force > 0) {
        this.state.touchPressures.push((touch as Touch & { force: number }).force);
        if (this.state.touchPressures.length > 50) {
          this.state.touchPressures.shift();
        }
      }
    }

    // Detect pinch zoom start
    if (e.touches.length === 2 && this.state.lastTouchCount !== 2) {
      this.state.pinchZoomCount++;
    }

    this.state.lastTouchCount = e.touches.length;
    if (e.touches.length > 0) {
      this.state.lastTouchX = e.touches[0].clientX;
      this.state.lastTouchY = e.touches[0].clientY;
    }

    this.recordInteraction();
  };

  private handleTouchMove = (e: TouchEvent): void => {
    // Record pressure during move
    for (const touch of Array.from(e.touches)) {
      if ('force' in touch && (touch as Touch & { force: number }).force > 0) {
        this.state.touchPressures.push((touch as Touch & { force: number }).force);
        if (this.state.touchPressures.length > 50) {
          this.state.touchPressures.shift();
        }
      }
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    // Detect swipe
    if (event.changedTouches.length > 0 && this.state.lastTouchX !== 0) {
      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.state.lastTouchX;
      const dy = touch.clientY - this.state.lastTouchY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Consider it a swipe if distance > 50px
      if (distance > 50) {
        this.state.swipeCount++;
      }
    }

    this.state.lastTouchCount = event.touches.length;
  };

  private handleVisibilityChange = (): void => {
    const now = Date.now();

    if (document.hidden) {
      // Page became hidden
      if (this.state.hasFocus) {
        this.state.totalFocusTime += now - this.state.focusStartTime;
      }
      this.state.hasFocus = false;
      this.state.blurStartTime = now;
      this.state.tabSwitchCount++;
    } else {
      // Page became visible
      if (this.state.blurStartTime > 0) {
        this.state.totalBlurTime += now - this.state.blurStartTime;
      }
      this.state.hasFocus = true;
      this.state.focusStartTime = now;
    }
  };

  private handleFocus = (): void => {
    const now = Date.now();
    if (!this.state.hasFocus) {
      if (this.state.blurStartTime > 0) {
        this.state.totalBlurTime += now - this.state.blurStartTime;
      }
      this.state.hasFocus = true;
      this.state.focusStartTime = now;
    }
  };

  private handleBlur = (): void => {
    const now = Date.now();
    if (this.state.hasFocus) {
      this.state.totalFocusTime += now - this.state.focusStartTime;
      this.state.hasFocus = false;
      this.state.blurStartTime = now;
    }
  };

  private notifyCallbacks(): void {
    const data = this.getData();
    for (const callback of this.callbacks) {
      callback(data);
    }
  }
}

/** Singleton behavior tracker */
export const behaviorTracker = new BehaviorTracker();

/**
 * Detect installed apps via protocol handlers
 * This is a privacy concern - websites can detect what apps you have installed
 */
export async function detectInstalledApps(): Promise<string[]> {
  const detected: string[] = [];

  const apps = [
    { name: 'Zoom', protocol: 'zoommtg:' },
    { name: 'Slack', protocol: 'slack:' },
    { name: 'Discord', protocol: 'discord:' },
    { name: 'Spotify', protocol: 'spotify:' },
    { name: 'Steam', protocol: 'steam:' },
    { name: 'VS Code', protocol: 'vscode:' },
    { name: 'Figma', protocol: 'figma:' },
    { name: 'Notion', protocol: 'notion:' },
    { name: 'Telegram', protocol: 'tg:' },
    { name: 'WhatsApp', protocol: 'whatsapp:' },
    { name: 'Signal', protocol: 'sgnl:' },
    { name: 'Skype', protocol: 'skype:' },
    { name: 'Microsoft Teams', protocol: 'msteams:' },
    { name: 'iTunes', protocol: 'itms:' },
    { name: 'Apple Music', protocol: 'music:' },
    { name: 'Calendly', protocol: 'calendly:' },
    { name: '1Password', protocol: 'onepassword:' },
    { name: 'Bear Notes', protocol: 'bear:' },
    { name: 'Things', protocol: 'things:' },
    { name: 'Craft', protocol: 'craftdocs:' },
  ];

  // Modern approach using navigator.registerProtocolHandler check
  // Note: This has limitations and may not work in all browsers
  for (const app of apps) {
    try {
      // Create a hidden iframe to test protocol
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Try to detect via blur event timing (less reliable but privacy-respecting)
      // For now, just check if protocol is registered
      const link = document.createElement('a');
      link.href = app.protocol;

      // Some browsers expose protocol handler info
      // This is a simplified check - real detection would need user interaction
      if (link.protocol === app.protocol) {
        // Protocol is recognized as a valid protocol
        // This doesn't guarantee the app is installed, but it's a hint
      }

      document.body.removeChild(iframe);
    } catch {
      // Ignore errors
    }
  }

  // Check for common app-injected globals
  const win = window as Window & {
    __SPOTIFY_BRIDGE__?: unknown;
    __DISCORD_BRIDGE__?: unknown;
    __zoom_bridge__?: unknown;
  };

  if (win.__SPOTIFY_BRIDGE__) detected.push('Spotify');
  if (win.__DISCORD_BRIDGE__) detected.push('Discord');
  if (win.__zoom_bridge__) detected.push('Zoom');

  return detected;
}

/**
 * Get initial empty behavior data
 */
export function getInitialBehaviorData(): BehaviorData {
  return {
    mouseSpeed: 0,
    mouseAcceleration: 0,
    mouseMovements: 0,
    mouseDistanceTraveled: 0,
    mouseIdleTime: 0,

    clickCount: 0,
    avgClickInterval: 0,
    clickPositions: [],

    scrollSpeed: 0,
    scrollDepthMax: 0,
    scrollDirectionChanges: 0,
    scrollEvents: 0,

    keyPressCount: 0,
    avgKeyHoldTime: 0,
    avgKeyInterval: 0,
    typingSpeed: 0,

    touchCount: 0,
    avgTouchPressure: 0,
    pinchZoomCount: 0,
    swipeCount: 0,

    tabSwitchCount: 0,
    totalFocusTime: 0,
    totalBlurTime: 0,
    pageLoadTime: performance.now(),

    firstInteractionTime: 0,
    lastInteractionTime: Date.now(),
    sessionDuration: 0,
  };
}
