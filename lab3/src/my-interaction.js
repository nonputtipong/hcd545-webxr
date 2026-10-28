import * as THREE from 'three';
import { settings, onChange } from './settings.js';

// YOUR TURN (Lab 3, Go further): turn this template into a small interaction of your own.
// A short VR experience needs a clear START, a TASK the visitor completes, and an END state, plus a way to reset.
// The template is a tiny state machine:   start  ->  task  ->  end  ->  (reset)  ->  start
//   start : a green "Start" sphere. Look at it to begin.
//   task  : the purple "Info cube". Look at it for the dwell time to complete the task.
//   end   : a gold "Done" sphere. Look at it to run the task again (the reset path).
// safe.js calls reset() from its Restart and Exit targets, so the experience can always be put back to the start.
// A gaze target is any Object3D with userData.target = { label, onActivate, setHover }.
// Change the labels, the captions and what each step does (play a sound with audio.ping(), move something, open a panel).
// Keep the two root.scale lines near the end: the user's Target size setting must apply to your objects too.
export function addMyTargets({ scene, gaze, captions, audio }) {
  const root = new THREE.Group();
  root.position.set(-1.2, 1.2, -2);
  scene.add(root);

  let state = 'start';
  const make = (geometry, color, label, onActivate) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, emissive: 0x000000 }));
    mesh.userData.target = {
      label,
      onActivate,
      setHover: (on) => mesh.material.emissive.setHex(on ? 0x666666 : 0x000000),
    };
    root.add(mesh);
    gaze.add(mesh);
    return mesh;
  };

  const startMarker = make(new THREE.SphereGeometry(0.25, 24, 16), 0x2ecc71, 'Start',
    () => go('task', '[start] Look at the cube to finish the task'));
  const cube = make(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0xab47bc, 'Info cube',
    () => go('end', '[done] Task complete. Look at the gold sphere to try again'));
  const endMarker = make(new THREE.SphereGeometry(0.25, 24, 16), 0xffc107, 'Done',
    () => go('start', '[reset] Back to the start'));

  // Each step stands in its own place, so the user has to look at the next object on purpose. (If they shared one spot, a single
  // long look would run start > task > end without a decision.)
  startMarker.position.y = 0.4;    // above the cube
  endMarker.position.y = -0.4;     // below the cube

  function go(next, message) {
    state = next;
    startMarker.visible = state === 'start';
    cube.visible = state === 'task';
    endMarker.visible = state === 'end';
    if (message) captions.say(message, 4);
  }

  // The reset path: put the experience back to its first state (called by safe.js; also useful in the console: hcd.mine.reset()).
  function reset() { go('start'); }

  root.scale.setScalar(settings.targetScale);
  onChange((key) => { if (key === 'targetScale') root.scale.setScalar(settings.targetScale); });
  reset();

  return { root, cube, reset, get state() { return state; } };
}
