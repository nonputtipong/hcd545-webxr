import { set } from './settings.js';   // two-way import: settings.js reads comfortDefaults below; set() is only called later, so the order is safe

// YOUR TURN (Lab 2): set the three presets from what you found in the comfort experiments, not from these defaults.
// Each preset is a bundle of comfort settings. The Comfort preset button applies them in this order, one per press.
//   vignette:  'off' | 'motion' | 'always'
//   turnMode:  'snap' | 'smooth'
//   snapAngle: degrees per turn (the Turn angle slider goes from 15 to 90 in steps of 15)
//   latencyMs: leave at 0; added latency always makes comfort worse
// sensitive:   the most protection; a constant vignette (stronger during motion) narrows the view to reduce the motion you see.
// comfortable: snap turning, vignette only while moving.
// intense:     smooth turning (90 degrees per second), no vignette.
// The snap angle changes how far each jump goes, not how much motion you see.
// Assignment 1: the comfort DEFAULTS a first-time visitor gets (settings.js reads them; Reset settings returns to them).
// Each value comes from my own tests in Lab 2 and Lab 3. [CONFIRM: check each reason against what you felt, and edit it.]
export const comfortDefaults = {
  vignette: 'motion',  // A dark edge only while turning or teleporting: it cut the dizzy feeling of turns for me, and an
                       // 'always' vignette hid the side tiles and the 3D menu when standing still.
  turnMode: 'snap',    // Snap turns show no motion between the two views, so there is no optic flow; smooth turning at
                       // 90 deg/s was the setting that made me uneasy first. No continuous movement by default.
  snapAngle: 30,       // 30 deg: three turns face the menu on the right. 15 deg needed too many turns, 45-90 deg made me
                       // lose track of where I was facing.
  smoothSpeed: 90,     // Only used when a visitor picks Smooth: 90 deg/s was the slowest speed that still felt responsive.
  latencyMs: 0,        // Added latency only ever makes comfort worse, so it stays at 0.
};

export const presets = {
  sensitive:   { vignette: 'always', turnMode: 'snap',   snapAngle: 30, latencyMs: 0 },
  comfortable: { vignette: 'motion', turnMode: 'snap',   snapAngle: 30, latencyMs: 0 },
  intense:     { vignette: 'off',    turnMode: 'smooth', snapAngle: 30, latencyMs: 0 },
};
export const presetNames = Object.keys(presets);

export function applyPreset(name) {
  for (const [key, value] of Object.entries(presets[name])) set(key, value);
}
