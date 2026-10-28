// Lab 1 snapshot: Hello WebXR. Monocular look-around (device orientation or drag), capability detection,
// Enter-VR button where the browser supports immersive-vr.
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import './style.css';
import { settings, set, onChange } from './settings.js';
import { h, button, startOverlay } from './ui.js';
import { createEnvironment } from './scene.js';
import { LookControls } from './look.js';
import { createCapsPanel } from './capabilities.js';
import { addMyContent } from './my-scene.js';
import { addFooter } from './footer.js';

// ---- Core: renderer, scene, camera inside a rig ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;                       // lets the same renderer present to a headset
renderer.shadowMap.enabled = true;                // shadows themselves are switched on and off with the Shadows button
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);
const rig = new THREE.Group();                    // the rig is what we will move in Lab 2 and 3
rig.add(camera);
camera.position.set(0, 1.6, 0);                   // standing eye height (the headset overrides this in XR)
scene.add(rig);

const env = createEnvironment(scene);
const mine = addMyContent(scene);
mine.mine.castShadow = mine.mine.receiveShadow = true;
const look = new LookControls(camera, renderer.domElement, settings);

// ---- DOM UI -----------------------------------------------------------------------------------------------------
const renderMode = () => (renderer.xr.isPresenting ? 'immersive-vr (WebXR)' : 'monocular');
// Cues cycles through three views of the scene: everything, only the geometric solids, only the sofa and the car.
const CUE_MODES = ['all', 'solids', 'models'];
const cueIndex = () => { const i = CUE_MODES.indexOf(settings.cues); return i < 0 ? 1 : i; };   // older saved values (true/false) become 'solids'
function applyCues() {
  const mode = CUE_MODES[cueIndex()];
  env.setCues(mode);
  mine.mine.visible = mode !== 'models';   // your own cube is a solid too
}
applyCues();
env.setShadows(settings.shadows);
const caps = createCapsPanel({ lab: 'lab1', look, getRenderMode: renderMode, getInputMode: () => (renderer.xr.isPresenting ? 'headset (XR)' : look.mode) });
document.body.append(
  h('div', { class: 'stack' }, caps.el, caps.showBtn),
  h('div', { id: 'bar' },
    button('Recenter', () => look.recenter()),
    button('Sky', () => { const k = ['gradient', 'checker', 'dark', 'anime']; set('sky', k[(k.indexOf(settings.sky) + 1) % k.length]); }),
    button('Cues', () => set('cues', CUE_MODES[(cueIndex() + 1) % CUE_MODES.length])),
    button('Shadows', () => set('shadows', !settings.shadows))));

addFooter();   // "build <commit hash>": shows which commit a deployed page was built from

onChange((key) => {
  if (key === 'sky') env.setSky(settings.sky);
  if (key === 'cues') applyCues();
  if (key === 'shadows') env.setShadows(settings.shadows);
});

// "Enter VR" only appears if the browser says immersive-vr is supported. Whether it really STARTS is a different question:
// press it and watch the "Enter VR started" row in the capability panel.
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) { const b = VRButton.createButton(renderer); b.classList.add('vrbtn'); document.body.append(b); }
  }).catch(() => {});
}
function refreshSources() {
  const s = renderer.xr.getSession();
  const list = s ? [...s.inputSources].map((i) => `${i.handedness || '-'}:${i.targetRayMode}`).join(', ') : '';
  caps.setInputSources(s ? (list || 'none') : 'no session');
}
renderer.xr.addEventListener('sessionstart', () => {
  const s = renderer.xr.getSession();
  caps.setSessionState('YES (session started)');
  rig.position.y = (s.enabledFeatures && !s.enabledFeatures.includes('local-floor')) ? 1.6 : 0;
  s.addEventListener('inputsourceschange', refreshSources);
  refreshSources();
});
renderer.xr.addEventListener('sessionend', () => {
  camera.position.set(0, 1.6, 0); camera.quaternion.identity(); rig.position.y = 0;
  caps.setSessionState('ended'); refreshSources(); resize();
});

// ---- Resize + loop ----------------------------------------------------------------------------------------------
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop((now) => {              // not requestAnimationFrame: XR needs the session's own loop
  const t = now / 1000;
  if (!renderer.xr.isPresenting) look.update();    // in a headset, the headset owns the camera pose
  env.update(t); mine.update(t);
  renderer.render(scene, camera);
});

// ---- Start card: the click we need for iOS motion permission --------------------------------------------------
startOverlay({
  title: 'HCD-545 WebXR starter (Lab 1)',
  lines: [
    'Move your phone to look around, or drag with finger or mouse.',
    'On iPhone and iPad the browser asks for motion access when you press Start. Please allow it.',
  ],
  onStart: () => { look.requestPermission(); },    // synchronous inside the click: iOS needs the user gesture
});

window.hcd = { renderer, scene, camera, rig, look, settings, caps };   // handy in the console
