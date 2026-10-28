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

export function applyAdaptations({ renderer }) {
  const params = new URLSearchParams(window.location.search);
  const applied = {};
  const pr = num(params, 'pr', 0.5, 3);
  if (pr !== null) { renderer.setPixelRatio(pr); applied.pixelRatio = pr; }
  const fb = num(params, 'fb', 0.5, 2);
  if (fb !== null && renderer.xr?.setFramebufferScaleFactor) { renderer.xr.setFramebufferScaleFactor(fb); applied.framebufferScale = fb; }
  const fov = num(params, 'fov', 0, 1);
  if (fov !== null && renderer.xr?.setFoveation) { renderer.xr.setFoveation(fov); applied.foveation = fov; }

  const pixelRatio = renderer.getPixelRatio();
  const text = Object.keys(applied).length
    ? 'applied from URL: ' + Object.entries(applied).map(([k, v]) => `${k}=${v}`).join(', ')
    : 'none requested (defaults)';
  console.info(`[adapt] ${text}; renderer pixel ratio now ${pixelRatio} (devicePixelRatio ${window.devicePixelRatio})`);
  return { applied, pixelRatio };
}
