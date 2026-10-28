import { settings } from './settings.js';

// Seated mode: in a headset session with a floor reference space the camera sits at the real head height. A seated user is
// about 0.3-0.5 m lower than a standing one, so floor-level content (pads, the menu) feels too high. Seated mode lifts the RIG
// so the eye ends up at a standard 1.6 m (EYE_HEIGHT, an approximate design value), and "Reset height" re-measures it.
// All height logic lives here: main.js calls onSessionStart / onSessionEnd / onSettingChange / update, and nothing else sets rig.position.y.
const EYE_HEIGHT = 1.6;
const MIN_OFFSET = -0.6, MAX_OFFSET = 1.0;   // meters: clamp the correction so a bad reading cannot put the user below the floor

export function createSeated({ rig, camera, renderer, say }) {
  let floor = true;      // false when the session has no floor reference (three then needs a manual 1.6 m eye height)
  let offset = 0;        // meters added to rig.position.y while seated
  let wait = 0;          // frames to wait after session start, until the headset pose has reached the camera

  function apply() {
    if (!renderer.xr.getSession()) { rig.position.y = 0; return; }
    rig.position.y = floor ? (settings.seated ? offset : 0) : EYE_HEIGHT;
  }

  // Measure the head height (camera.position.y is relative to the rig, i.e. to the reference space) and set the offset.
  function reset() {
    if (!renderer.xr.getSession()) { say('Reset height works in a headset session'); return false; }
    if (!floor) { say('No floor reference in this session: eye height fixed at 1.6 m'); return false; }
    if (!settings.seated) { say('Turn Seated on first'); return false; }
    offset = Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, EYE_HEIGHT - camera.position.y));
    apply();
    say(`Height reset: offset ${offset >= 0 ? '+' : ''}${offset.toFixed(2)} m`);
    return true;
  }

  return {
    get offset() { return offset; },
    apply, reset,
    onSessionStart(session) {
      floor = !(session.enabledFeatures && !session.enabledFeatures.includes('local-floor'));
      offset = 0; apply();
      if (settings.seated) wait = 3;
    },
    onSessionEnd() { offset = 0; wait = 0; apply(); },
    onSettingChange() {
      if (!renderer.xr.getSession()) return;
      if (settings.seated) { offset = 0; wait = 1; } else { offset = 0; apply(); }
    },
    update() {
      if (wait > 0 && --wait === 0) reset();
    },
  };
}
