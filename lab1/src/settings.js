// One settings store shared by every lab. Unused keys in early labs are harmless.
const KEY = 'hcd545-webxr-settings-v1';

const prefersReduced = (() => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
})();

export const defaults = {
  // Lab 1
  sky: 'checker',         // 'gradient' | 'checker' | 'dark' | 'anime'
  shadows: false,         // sun shadows on or off (they show which objects float and which sit on the floor)
  cues: 'solids',         // scale cues (the sofa and car load only when asked for): 'all' | 'solids' (geometric solids only) | 'models' (sofa and car only)
  // Lab 2
  ipd: 0.064,             // metres, used by StereoEffect.setEyeSeparation
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
  audio: true,
  volume: 0.8,
  // A1 additions (used from Lab 2 on; unused keys are harmless in Lab 1)
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
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode: fine */ }
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
