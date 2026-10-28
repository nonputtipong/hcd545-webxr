import * as THREE from 'three';
import { settings } from './settings.js';

// Input fallback chain: controller -> hand pinch -> gaze dwell -> pointer/touch. The first one available is used.
//   controller : XR input source with a tracked-pointer or transient-pointer ray. "select" activates what the ray hits at once.
//   hand       : the same select path (a pinch fires "select"), but reported separately as kind 'hand' when the XRInputSource has
//                a .hand (the session must have been created with the optional 'hand-tracking' feature; see main.js).
//   gaze       : center-of-view dwell (gaze.js). Switched off while a controller is active, so you never double-activate
//                (except the safe-harbor dock: safe targets still fill by gaze; see gaze.js).
//   pointer    : mouse click / finger tap. Mono: activates the target under the pointer. Stereo: a tap = Cardboard-style
//                click that activates what you are looking at.
// input.kind is the short name for the badge ('controller' | 'hand' | 'gaze' | 'pointer' | 'none'); input.mode keeps the long text.
// On Apple Vision Pro a gaze+pinch arrives as a transient-pointer source; it is reported as 'hand' only if the browser exposes .hand
// on it (unverified), otherwise as 'controller'.
export class InputChain {
  constructor({ renderer, rig, camera, gaze, getStereo, onEdgeTap }) {
    Object.assign(this, { renderer, rig, camera, gaze, getStereo, onEdgeTap });
    this.active = new Map();           // controller object -> targetRayMode
    this.sources = new Map();          // controller object -> XRInputSource (to tell a hand from a controller)
    this.lastPointer = -1e9;           // time of the last tap/click (ms), for the 'pointer' badge outside XR
    this.ndc = new THREE.Vector2();
    this._o = new THREE.Vector3(); this._d = new THREE.Vector3(); this._m = new THREE.Matrix4();

    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i);
      rig.add(c);                      // children of the rig, so teleport and turn move them too
      c.addEventListener('connected', (e) => {
        const mode = e.data.targetRayMode;
        this.active.set(c, mode);
        this.sources.set(c, e.data);
        if (mode === 'tracked-pointer') {
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)]),
            new THREE.LineBasicMaterial({ color: 0xffffff }));
          line.name = 'ray'; c.add(line);
        }
      });
      c.addEventListener('disconnected', () => { this.active.delete(c); this.sources.delete(c); c.remove(c.getObjectByName('ray')); });
      c.addEventListener('select', () => this._controllerSelect(c));
    }

    // Pointer / touch on the canvas: a tap (little movement) is a click; a drag belongs to look.js.
    const dom = renderer.domElement;
    let sx = 0, sy = 0;
    dom.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    dom.addEventListener('pointerup', (e) => {
      if (renderer.xr.isPresenting) return;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) return;
      this.lastPointer = performance.now();
      this._tap(e);
    });
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat && !/INPUT|SELECT|BUTTON|TEXTAREA/.test(document.activeElement?.tagName || '')) {
        this.gaze.activateHovered('key');
      }
    });
  }

  _controllerSelect(c) {
    this._m.identity().extractRotation(c.matrixWorld);
    this._o.setFromMatrixPosition(c.matrixWorld);
    this._d.set(0, 0, -1).applyMatrix4(this._m);
    const p = this.gaze.pick(this._o, this._d);
    if (p) this.gaze.activate(p.root, p.hit, 'controller');
  }

  _tap(e) {
    if (this.getStereo()) {
      const f = e.clientX / window.innerWidth;
      if (f < 0.12) { this.onEdgeTap?.(-1); return; }     // tap the far left / right edge = turn
      if (f > 0.88) { this.onEdgeTap?.(1); return; }
      this.gaze.activateHovered('tap');
      return;
    }
    this.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    this.gaze.ray.setFromCamera(this.ndc, this.camera);
    const p = this.gaze.pick(this.gaze.ray.ray.origin.clone(), this.gaze.ray.ray.direction.clone());
    if (p) this.gaze.activate(p.root, p.hit, 'pointer');
  }

  get controllerActive() {
    for (const m of this.active.values()) if (m === 'tracked-pointer' || m === 'transient-pointer') return true;
    return false;
  }

  // Which link of the chain is in charge right now, as one word (drives the head-locked badge, see badge.js).
  // A controller wins over a hand; outside XR a tap/click in the last 3 s shows 'pointer'.
  get kind() {
    let hand = false;
    for (const [c, mode] of this.active) {
      if (mode !== 'tracked-pointer' && mode !== 'transient-pointer') continue;
      if (this.sources.get(c)?.hand) hand = true; else return 'controller';
    }
    if (hand) return 'hand';
    if (this.renderer.xr.isPresenting) return settings.gazeEnabled ? 'gaze' : 'none';
    if (performance.now() - this.lastPointer < 3000) return 'pointer';
    return settings.gazeEnabled ? 'gaze' : 'pointer';
  }

  // Human-readable "which link of the chain is in charge right now".
  get mode() {
    if (this.controllerActive) return this.kind === 'hand' ? 'hand pinch (gaze dwell paused)' : 'controller (gaze dwell paused)';
    if (this.renderer.xr.isPresenting) return settings.gazeEnabled ? 'gaze (headset, no controller)' : 'none (gaze off, no controller)';
    return settings.gazeEnabled ? 'gaze dwell + pointer/tap' : 'pointer/tap only';
  }

  update() { this.gaze.suppressed = this.controllerActive; }
}
