import * as THREE from 'three';
import { settings } from './settings.js';
import { Button3D } from './menu.js';

// Safe harbor: a way to pause, restart or leave that is reachable by gaze at any time, in mono, stereo and headset.
// Design: a dock of gaze targets that is BODY-locked (it follows the user, not the head) and sits about 45 degrees below the
// horizon, 1.1 m away. A target fixed to the head can never reach the view center, so it could not be dwelled on; here the user
// simply looks down. The head-locked badge (badge.js) tells them where it is.
//   Pause / Resume : while paused, only safe targets respond (gaze.paused)
//   Restart        : reset hook (your task back to the start) + Home pad
//   Exit           : Restart + end the XR session + leave stereo
//   Exit stereo    : only shown in stereo, so a split-screen user can leave without touching the phone
// The targets carry userData.target.safe = true, which lets them dwell even when Gaze activation is off.
const DIST = 0.78;   // horizontal and vertical offset (1.1 m at 45 degrees below the eyes)

export function createSafeHarbour({ scene, camera, gaze, renderer, stereo, setStereo, say, hooks }) {
  const group = new THREE.Group();
  scene.add(group);

  const grey = { base: 0x6b5a00, hover: 0xc9a800 };
  const red = { base: 0x8b1a1a, hover: 0xd32f2f };
  const graphite = { base: 0x333333, hover: 0x5a5a5a };   // the same as the 3D menu buttons
  const api = {};
  const make = (label, x, y, colors, onActivate) => {
    const b = new Button3D({ label, w: 0.3, h: 0.18, onActivate, colors, safe: true });
    b.group.position.set(x, y, 0);
    group.add(b.group); gaze.add(b.group);
    return b;
  };

  const pause = make('Pause', -0.34, -0.1, grey, () => api.pause());
  const restart = make('Restart', 0, -0.1, graphite, () => api.restart());
  const exit = make('Exit', 0.34, -0.1, red, () => api.exit());
  const exitStereo = make('Exit\nstereo', 0, 0.12, red, () => { setStereo(false); say('Left stereo'); });

  Object.assign(api, {
    group, buttons: { pause, restart, exit, exitStereo },
    pause() {
      gaze.paused = !gaze.paused;
      pause.setLabel(gaze.paused ? 'Resume' : 'Pause');
      say(gaze.paused ? 'Paused: only Pause, Restart and Exit respond' : 'Resumed', 3);
    },
    restart() {
      gaze.paused = false; pause.setLabel('Pause');
      hooks.reset(); hooks.home();
      say('Restarted', 2);
    },
    // Order matters: reset your own state first, then leave stereo, then ask the session to end (async; main.js reacts to sessionend).
    exit() {
      api.restart();
      if (stereo.enabled) setStereo(false);
      const session = renderer.xr.getSession();
      if (session) session.end().catch(() => {});
      else if (!stereo.enabled) say('Not in a headset or stereo: restarted', 2);
    },
  });

  // Follow the user's yaw, but only when they have turned more than 35 degrees away from the dock (then glide until it is within
  // 8 degrees). A dock that always re-centered would run away from a user who looks at its left or right button. Never move
  // while a safe target is being looked at. Hold the last yaw when looking almost straight up or down (yaw is undefined there).
  const eye = new THREE.Vector3(), dir = new THREE.Vector3();
  const wrap = (d) => ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let yaw = 0, first = true, gliding = false;
  api.update = (dt) => {
    camera.getWorldPosition(eye); camera.getWorldDirection(dir);
    if (Math.hypot(dir.x, dir.z) > 0.35) {
      const target = Math.atan2(dir.x, dir.z);
      const d = wrap(target - yaw);
      if (first) { yaw = target; first = false; }
      else if (!gaze.hovered?.userData.target.safe) {
        if (Math.abs(d) > THREE.MathUtils.degToRad(35)) gliding = true;
        if (Math.abs(d) < THREE.MathUtils.degToRad(8)) gliding = false;
        if (gliding) yaw += d * (1 - Math.exp(-4 * dt));
      }
    }
    group.position.set(eye.x + Math.sin(yaw) * DIST, eye.y - DIST, eye.z + Math.cos(yaw) * DIST);
    group.lookAt(eye);
    group.scale.setScalar(settings.targetScale);
    exitStereo.group.visible = stereo.enabled && !renderer.xr.isPresenting;
  };
  return api;
}
