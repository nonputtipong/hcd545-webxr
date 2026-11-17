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
// Each value comes from my own test (2026-11-18). I chose my own taste where the task allows it, and kept the safe
// choice where the task asks for it (no continuous movement by default). Every value can be changed in Settings > Comfort.
export const comfortDefaults = {
  vignette: 'off',     // I like Off best: a clear view with no dark edges. 'During motion' was fine for me, and 'always' felt
                       // like something covering my eyes (it suits a horror game, not this one). A visitor who feels sick
                       // turns it on in Settings > Comfort or with the 'sensitive' / 'comfortable' presets.
  turnMode: 'snap',    // I prefer Smooth (it looks like real life) and felt no sickness, but smooth turning shows the world
                       // sliding past, the main cause of VR sickness, and the task asks for no continuous movement by default.
                       // Note: I think snap could tire my eyes over a long session; this game takes under a minute.
  snapAngle: 30,       // My comfort zone: 15 deg needed too many presses, 90 deg made me lose track of where I was facing.
  smoothSpeed: 120,    // Only used when a visitor picks Smooth. 90 deg/s felt a little slow to me, so 120 (a quarter-turn
                       // in 0.75 s): faster, but still a steady slide rather than a jump.
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
