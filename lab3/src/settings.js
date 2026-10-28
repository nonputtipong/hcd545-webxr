// Settings store. Each lab saves under its own key, so values saved by another lab on the same site do not carry over.
const KEY = 'hcd545-webxr-settings-lab3';

const prefersReduced = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
})();

export const defaults = {
  // Lab 1
  sky: 'gradient',        // 'gradient' | 'checker' | 'dark'
  shadows: true,          // sun shadows on or off (they show which objects float and which sit on the floor)
  cues: 'all',            // scale cues (the sofa and car download when shown): 'all' | 'solids' (geometric solids only) | 'models' (sofa and car only)
  // Lab 2
  ipd: 0.064,             // meters, used by StereoEffect.setEyeSeparation
  viewerFit: false,       // stereo view: draw each eye under its lens, as in a cardboard viewer (stereo.js)
  lensSpacing: 64,        // mm between the viewer's lens centers; adjust until the two images fuse
  latencyMs: 0,           // artificial head-tracking latency
  vignette: 'motion',     // 'off' | 'motion' | 'always'
  turnMode: 'snap',       // 'snap' | 'smooth'
  snapAngle: 30,          // degrees per turn
  smoothSpeed: 90,        // degrees per second
  // Lab 3 (accessibility)
  gazeEnabled: true,
  dwell: 1.2,             // seconds
  targetScale: 1.0,       // 0.8 - 1.6
  reducedMotion: prefersReduced,
  captions: true,
  audio: false,           // off until you press the Sound button (bottom right), the 3D menu or Sound on in Settings
  volume: 0.8,
  // Added in Lab 2 and Lab 3 (unused keys are harmless in Lab 1)
  showFps: true,          // 'Show FPS (developer)': the FPS box; keep it on in the labs
  contrast: false,        // high-contrast mode (3D menu, pads, ring, captions, DOM panels)
  seated: false,          // seated mode: eye height is held at 1.6 m; 'Reset height' recalibrates (headset sessions)
};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export const settings = { ...defaults, ...load() };
const listeners = new Set();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode: settings are not saved */ }
}

export function set(key, value) {
  settings[key] = value;
  save();
  listeners.forEach((f) => f(key, value));
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function reset() {
  Object.keys(defaults).forEach((k) => set(k, defaults[k]));
}

// Reduced motion forces snap turning and removes animation; use this instead of settings.turnMode directly.
export function effectiveTurnMode() {
  return settings.reducedMotion ? 'snap' : settings.turnMode;
}
