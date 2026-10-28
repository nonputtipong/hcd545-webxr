// Platform adaptations you can switch with the URL, so you can compare numbers before and after a change on each device.
// These parameter names (pr, fb, fov) are THIS starter's own convention, not a web standard.
//   ?pr=1     renderer.setPixelRatio(1): fewer pixels to draw (0.5 to 3; main.js default is min(devicePixelRatio, 2))
//   ?fb=0.8   renderer.xr.setFramebufferScaleFactor(0.8): headset eye-buffer scale (0.5 to 2); read when a session starts
//   ?fov=0.5  renderer.xr.setFoveation(0.5): 0 = none, 1 = maximum (three.js default 1); applied by the XR compositor when a
//             session starts, so it only has an effect on a device whose browser supports it (Quest browser: expected, not verified here)
// Example: https://you.github.io/repo/?pr=1&fb=0.8&fov=1
// Call once, right after the renderer is created and BEFORE any XR session (three warns if the framebuffer scale changes mid-session).
const num = (params, key, lo, hi) => {
  if (!params.has(key)) return null;
  const v = parseFloat(params.get(key));
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null;
};

// ---- Assignment 1: my own platform adaptations -----------------------------------------------------------------
// Decided by asking the browser what the screen and APIs are (media queries, devicePixelRatio, feature checks), never by
// reading navigator.userAgent. ?adapt=0 switches all three off, so the same device can be measured before and after.
//   A. Dense touch screen (pointer: coarse and devicePixelRatio > 2, e.g. an iPhone at 3x): pixel ratio 1.5 instead of 2.
//      Stereo draws the scene twice per frame; 1.5 instead of 2 draws 44 % fewer pixels, and at 3x the loss is hard to see.
//   B. The same screens: no MSAA antialiasing. The pixels are so small that jagged edges barely show, and MSAA costs fill rate.
//   C. No Fullscreen API on the page (iPhone Safari and Chrome): the stereo view keeps the browser bars, so entering stereo
//      shows a caption telling the user to turn the phone sideways and hide the toolbar. (Read in main.js setStereo.)
export function detectPlatform() {
  const on = new URLSearchParams(window.location.search).get('adapt') !== '0';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const dense = coarse && window.devicePixelRatio > 2;
  return {
    on,
    lowerPixelRatio: on && dense,                                         // A
    noAntialias: on && dense,                                             // B (main.js: must be known when the renderer is created)
    fullscreenHint: on && !document.documentElement.requestFullscreen,    // C
  };
}

export function applyAdaptations({ renderer, platform }) {
  const params = new URLSearchParams(window.location.search);
  const applied = {};
  if (platform?.lowerPixelRatio) { renderer.setPixelRatio(1.5); applied.densePixelRatio = 1.5; }   // A (a ?pr= below still wins)
  if (platform?.noAntialias) applied.antialias = 'off';
  if (platform?.fullscreenHint) applied.fullscreenHint = 'on';
  if (platform && !platform.on) applied.myAdaptations = 'off (?adapt=0)';
  const pr = num(params, 'pr', 0.5, 3);
  if (pr !== null) { renderer.setPixelRatio(pr); applied.pixelRatio = pr; }
  const fb = num(params, 'fb', 0.5, 2);
  if (fb !== null && renderer.xr?.setFramebufferScaleFactor) { renderer.xr.setFramebufferScaleFactor(fb); applied.framebufferScale = fb; }
  const fov = num(params, 'fov', 0, 1);
  if (fov !== null && renderer.xr?.setFoveation) { renderer.xr.setFoveation(fov); applied.foveation = fov; }

  const pixelRatio = renderer.getPixelRatio();
  const text = Object.keys(applied).length
    ? 'applied: ' + Object.entries(applied).map(([k, v]) => `${k}=${v}`).join(', ')
    : 'none requested (defaults)';
  console.info(`[adapt] ${text}; renderer pixel ratio now ${pixelRatio} (devicePixelRatio ${window.devicePixelRatio})`);
  return { applied, pixelRatio };
}
