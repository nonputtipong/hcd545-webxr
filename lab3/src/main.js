// Lab 3 snapshot: Lab 2 + gaze activation with dwell, a 3D menu, teleport pads, spatial audio with captions, a safe harbor
// (Pause / Restart / Exit by gaze), an input fallback chain, accessibility settings (saved), high contrast, seated mode and a
// timed gaze trial.
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import './style.css';
import { settings, set, onChange } from './settings.js';
import { h, button, startOverlay } from './ui.js';
import { createEnvironment } from './scene.js';
import { LookControls } from './look.js';
import { StereoMode } from './stereo.js';
import { Comfort } from './comfort.js';
import { FpsCounter } from './fps.js';
import { createCapsPanel } from './capabilities.js';
import { createSettingsPanel } from './settings-panel.js';
import { Captions } from './captions.js';
import { GazeSystem } from './gaze.js';
import { SpatialAudio } from './audio.js';
import { createMenu, createPads, createSpeaker } from './menu.js';
import { Trial } from './trial.js';
import { InputChain } from './input.js';
import { InputBadge } from './badge.js';
import { createSeated } from './seated.js';
import { createSafeHarbour } from './safe.js';
import { angularSize, angularSizes } from './measure.js';
import { applyPreset, presetNames } from './my-comfort.js';
import { addMyContent } from './my-scene.js';
import { addMyTargets } from './my-interaction.js';
import { applyAdaptations } from './adapt.js';
import { addFooter } from './footer.js';

// ---- Core: renderer, scene, camera inside a rig ---------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const adapt = applyAdaptations({ renderer });     // URL switches ?pr= ?fb= ?fov= (adapt.js); must run before any XR session
renderer.xr.enabled = true;                       // lets the same renderer present to a headset
renderer.shadowMap.enabled = true;                // shadows themselves are switched on and off with the Shadows button
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);
const rig = new THREE.Group();                    // turning and teleport move the rig; the camera pose belongs to look.js / the headset
rig.add(camera);
camera.position.set(0, 1.6, 0);                   // standing eye height (the headset overrides this in XR)
scene.add(rig);

const env = createEnvironment(scene);
const mine = addMyContent(scene);
mine.mine.castShadow = mine.mine.receiveShadow = true;
const look = new LookControls(camera, renderer.domElement, settings);
const stereo = new StereoMode(renderer, settings.ipd);   // side-by-side stereo for a phone viewer (stereo.js)
stereo.setFit(settings.viewerFit, settings.lensSpacing);   // Viewer fit: each eye under its lens (Settings panel)
const comfort = new Comfort({ rig, camera, renderer }); // vignette, snap/smooth turn, blink teleport (comfort.js)
const fps = new FpsCounter(60);

// ---- Lab 3: gaze, 3D UI, audio, captions ------------------------------------------------------------------------
// Every new const below needs renderer, scene, camera, rig, comfort and stereo, so it comes after the lines above.
const captions = new Captions(camera);                  // head-locked caption strip (captions.js)
const audio = new SpatialAudio(camera, captions);       // listener on the camera, generated sounds (audio.js)
const seated = createSeated({ rig, camera, renderer, say: (t) => captions.say(t, 3) });   // owns rig.position.y (seated.js)
const gaze = new GazeSystem({ renderer, camera });      // reticle, dwell timer, progress ring (gaze.js)
const speaker = createSpeaker({ scene, gaze });         // the orange sphere: look at it to mute or unmute
audio.attach(speaker.mesh);                             // humming PositionalAudio on the speaker
const pads = createPads({ scene, gaze, comfort });      // teleport pads on the floor (menu.js)
let presetIndex = 0;
const presetBtn = button('Comfort preset', (e) => {   // applies the next preset from my-comfort.js and shows its name on the button
  const name = presetNames[presetIndex];
  presetIndex = (presetIndex + 1) % presetNames.length;
  applyPreset(name);
  e.currentTarget.textContent = `Comfort: ${name}`;
  captions.say(`Comfort preset: ${name}`, 2);
});
const panel = createSettingsPanel({ sections: ['xp', 'comfort', 'access'], comfortButtons: [presetBtn] });   // IPD ... volume, trial, Reset height (settings-panel.js)
const trial = new Trial({
  scene, camera, renderer, gaze,
  onSay: (t, s) => captions.say(t, s),
  onDone: (text) => panel.addResult(text),
});
panel.onStartTrial = () => trial.start(10);
panel.onResetHeight = () => seated.reset();
panel.onReset = () => { presetIndex = 0; presetBtn.textContent = 'Comfort preset'; };   // the defaults are no preset
const menu = createMenu({ scene, gaze, actions: {     // the 3D menu to the right of the start position (menu.js)
  turn: (d) => comfort.turn(d),
  startTrial: () => trial.start(10),
  home: () => pads.home(),
  resetHeight: () => seated.reset(),
} });
const mine3d = addMyTargets({ scene, gaze, captions, audio });   // your start > task > end interaction (my-interaction.js)
// Input fallback chain: controller > hand pinch > gaze dwell > pointer / touch. In stereo it also turns on a far-edge tap.
const input = new InputChain({ renderer, rig, camera, gaze, getStereo: () => stereo.enabled, onEdgeTap: (d) => comfort.turn(d) });
const badge = new InputBadge({ camera, input });        // head-locked: which input is active (badge.js)

// Feedback for every activation: a ping you can hear and a caption you can read.
gaze.onActivated = (target) => {
  audio.ping();
  if (target.label !== 'Trial target') captions.say(`[chime] ${target.label}`, 1.5);
};

// ---- DOM UI -----------------------------------------------------------------------------------------------------
function renderMode() {
  if (renderer.xr.isPresenting) return 'immersive-vr (WebXR)';
  if (!stereo.enabled) return 'monocular';
  return stereo.fit ? 'binocular (viewer fit)' : 'binocular (StereoEffect)';
}
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

const caps = createCapsPanel({ lab: 'lab3', look, getRenderMode: renderMode, getInputMode: () => input.mode });

// Sound button, bottom right: the sound starts off; the label shows the current state (also Sound on in Settings and the 3D menu).
const soundBtn = button('', () => set('audio', !settings.audio), 'ui');
soundBtn.id = 'sound';
function syncSoundBtn() { soundBtn.textContent = settings.audio ? 'Sound: on' : 'Sound: off'; soundBtn.setAttribute('aria-pressed', String(settings.audio)); }
syncSoundBtn();

function recenter() { look.recenter(); rig.rotation.y = 0; comfort.pendingYaw = 0; }   // face the start direction: also undoes turns
function setStereo(on) {
  if (on) stereo.enable(); else stereo.disable();   // enable() must run inside the click (fullscreen needs a gesture)
  document.body.classList.toggle('stereo', on);
  resize();                                          // resets the viewport that StereoEffect leaves on the right half
}

document.body.append(
  h('div', { class: 'stack' },             // one column: each button is replaced by its panel when opened
    caps.showBtn, caps.el, panel.showBtn, panel.el),
  h('div', { id: 'bar' },
    button('Stereo', () => setStereo(!stereo.enabled), 'act'),
    button('Turn left (Z)', () => comfort.turn(-1), 'gap'),   // group 2 (dark gray): moving in the scene
    button('Turn right (C)', () => comfort.turn(1)),
    button('Recenter (R)', recenter),
    button('Sky', () => { const k = ['gradient', 'checker', 'dark']; set('sky', k[(k.indexOf(settings.sky) + 1) % k.length]); }, 'muted gap'),   // group 3 (muted gray): how the scene looks
    button('Cues', () => set('cues', CUE_MODES[(cueIndex() + 1) % CUE_MODES.length]), 'muted'),
    button('Shadows', () => set('shadows', !settings.shadows), 'muted'),
    button('Exit stereo', () => setStereo(false), 'keep')),   // the only toolbar button shown in stereo
  soundBtn, fps.el);
fps.el.hidden = !settings.showFps;   // 'Show FPS (developer)' checkbox in the Settings panel

// Keyboard: R recenters (Z / C turn: comfort.js; Enter / Space activate what you look at: input.js).
// Ignored while typing in a field or choosing in a menu. F is kept free: it is reserved for click / activate later.
window.addEventListener('keydown', (e) => {
  if (e.repeat || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
  if (e.code === 'KeyR') recenter();
});
addFooter();   // "build <commit hash>": shows which commit a deployed page was built from

// Safe harbor: Pause / Restart / Exit (and Exit stereo) as gaze targets that follow the user's yaw, 45 degrees below the horizon.
const safe = createSafeHarbour({ scene, camera, gaze, renderer, stereo, setStereo, say: (t, s) => captions.say(t, s ?? 2.5),
  hooks: { reset: () => { trial.stop(); mine3d.reset(); }, home: () => pads.home() } });

// "Enter VR" only appears if the browser says immersive-vr is supported. In a headset the browser draws both eyes itself,
// so StereoEffect and look.js are not used during the session. 'hand-tracking' lets hands arrive as input sources.
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) { const b = VRButton.createButton(renderer, { optionalFeatures: ['hand-tracking'] }); b.classList.add('vrbtn'); document.body.append(b); }
  }).catch(() => {});
}

// ---- Settings reactions -----------------------------------------------------------------------------------------
onChange((key) => {
  if (key === 'ipd') stereo.setIpd(settings.ipd);      // eye separation in meters
  if (key === 'viewerFit' || key === 'lensSpacing') stereo.setFit(settings.viewerFit, settings.lensSpacing);
  if (key === 'sky') env.setSky(settings.sky);
  if (key === 'cues') applyCues();
  if (key === 'shadows') env.setShadows(settings.shadows);
  if (key === 'showFps') fps.el.hidden = !settings.showFps;
  if (key === 'audio' || key === 'volume') audio.sync();
  if (key === 'audio') syncSoundBtn();
  if (key === 'contrast') applyContrast();
  if (key === 'seated') seated.onSettingChange();
});
function applyContrast() {
  document.body.classList.toggle('contrast', settings.contrast);
  env.setContrast(settings.contrast);
  gaze.setContrast(settings.contrast);
}
applyContrast();

// ---- XR session hooks -------------------------------------------------------------------------------------------
function refreshSources() {
  const s = renderer.xr.getSession();
  if (!s) { caps.setInputSources('no session'); return; }
  const list = [...s.inputSources].map((i) => `${i.handedness || '-'}:${i.targetRayMode}`).join(', ');
  caps.setInputSources(list || 'none (gaze fallback)');
}
renderer.xr.addEventListener('sessionstart', () => {
  const s = renderer.xr.getSession();
  if (stereo.enabled) setStereo(false);              // the headset does its own stereo
  audio.resume();
  caps.setSessionState('YES (session started)');
  seated.onSessionStart(s);                          // sets rig.position.y (floor / no floor / seated offset)
  fitHeadLocked();
  fps.setTarget(s.frameRate || 72, 72);           // in a headset the minimum is 72 fps
  s.addEventListener('inputsourceschange', refreshSources);
  refreshSources();
});
renderer.xr.addEventListener('sessionend', () => {
  camera.position.set(0, 1.6, 0); camera.quaternion.identity(); seated.onSessionEnd();
  fps.setTarget(60); caps.setSessionState('ended'); refreshSources(); resize();
});

// ---- Resize + loop ----------------------------------------------------------------------------------------------
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);   // also resets the viewport StereoEffect leaves on the right half
  fitHeadLocked();
}
// The caption strip (1.0 m wide, 1.3 m away) and the input badge (0.5 m wide, 1.6 m away) are wider than a phone held upright can
// show. Shrink them to fit the visible width; a headset session always uses full size.
function fitHeadLocked() {
  const fit = (width, dist) => (renderer.xr.isPresenting ? 1
    : Math.min(1, 0.95 * 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect / width));
  captions.mesh.scale.setScalar(fit(1.0, 1.3));
  badge.mesh.scale.setScalar(fit(0.5, 1.6));
}
window.addEventListener('resize', resize);
resize();

let last = performance.now() / 1000;   // (THREE.Clock is deprecated in r186; the loop callback already gets a timestamp)
renderer.setAnimationLoop((now) => {              // not requestAnimationFrame: XR needs the session's own loop
  const t = now / 1000, dt = Math.min(Math.max(t - last, 0), 0.1);   // dt: seconds since the last frame, capped at 0.1 s
  last = t;
  fps.tick(dt);
  if (!renderer.xr.isPresenting) look.update();    // applies the Added latency from the Settings panel
  comfort.update(dt);
  input.update(); badge.update();
  env.update(t); mine.update(t); speaker.update(t); menu.update(camera);
  seated.update(); safe.update(dt);
  gaze.update(dt);                                  // after everything that moves the camera or the targets
  audio.update(dt); captions.update(dt);
  if (stereo.enabled && !renderer.xr.isPresenting) stereo.render(scene, camera);   // two renders per frame, one per eye
  else renderer.render(scene, camera);
});

// ---- Start card: the one user gesture we get ------------------------------------------------------------------
startOverlay({
  title: 'HCD-545 WebXR starter (Lab 3)',
  lines: [
    'Move your phone to look around, or drag with finger or mouse. Z / C (or the Turn buttons) turn the view.',
    'Look at a button until the ring fills to activate it. Use headphones for the 3D sound.',
    'Look down to find Pause, Restart and Exit at any time.',
  ],
  onStart: () => { look.requestPermission(); audio.start(); },   // no await before these: iOS and AudioContext need the gesture
});

window.hcd = { renderer, scene, camera, rig, look, stereo, comfort, fps, settings, caps, panel, env, adapt,   // handy in the console
  gaze, audio, captions, input, trial, menu, pads, seated, safe, badge, mine: mine3d,
  angularSize: (obj) => angularSize(obj, camera), angularSizes: () => angularSizes(gaze, camera) };
