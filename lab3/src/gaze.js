import * as THREE from 'three';
import { settings } from './settings.js';

// Gaze activation: ray from the middle of the view, dwell timer, progress ring.
// Works the same in mono, StereoEffect and immersive-vr because it only needs a camera.
// A target is any Object3D with userData.target = { label, onActivate(hit, via), setHover(bool) }.
const REARM = 0.6;   // seconds of cool-down after an activation, so one long look is not a double click

function headLockedMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
}

export class GazeSystem {
  constructor({ renderer, camera }) {
    this.renderer = renderer; this.camera = camera;
    this.ray = new THREE.Raycaster(); this.ray.far = 40;
    this.targets = [];
    this.hovered = null; this.t = 0; this.progress = 0; this.lastStep = -1;
    this.onActivated = null;   // (target, via) feedback hook: audio ping + caption
    this.suppressed = false;   // set by the input chain while a controller is the active input (safe-harbor targets ignore it)
    this.paused = false;       // set by safe.js (Pause): only targets with userData.target.safe still activate
    this.ringIn = 0.03; this.ringOut = 0.04;   // progress ring radii (thicker in contrast mode)
    this._o = new THREE.Vector3(); this._d = new THREE.Vector3();

    // Reticle: 1.6 m in front of the eyes. Closer than ~1 m it gives double vision in stereo.
    this.reticle = new THREE.Group();
    this.reticle.position.z = -1.6;
    this.reticle.renderOrder = 999;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.006, 16), headLockedMaterial(0xffffff));
    const base = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 48), headLockedMaterial(0xffffff, 0.45));
    this.fill = new THREE.Mesh(new THREE.BufferGeometry(), headLockedMaterial(0x00e676));
    [dot, base, this.fill].forEach((m) => { m.renderOrder = 999; m.frustumCulled = false; this.reticle.add(m); });
    // Contrast mode: a dark halo behind the ring so it reads on any background (child 3: the code above indexes children 0-2).
    this.halo = new THREE.Mesh(new THREE.RingGeometry(0.026, 0.056, 48), headLockedMaterial(0x000000, 0.85));
    this.halo.renderOrder = 998; this.halo.frustumCulled = false; this.halo.visible = false;
    this.reticle.add(this.halo);
    this.base = base;
    camera.add(this.reticle);
  }

  // High contrast: thicker, fully opaque ring, yellow fill, dark halo.
  setContrast(on) {
    this.ringIn = 0.03; this.ringOut = on ? 0.052 : 0.04;
    this.base.geometry.dispose();
    this.base.geometry = on ? new THREE.RingGeometry(0.03, 0.052, 48) : new THREE.RingGeometry(0.03, 0.036, 48);
    this.base.material.opacity = on ? 1 : 0.45;
    this.fill.material.color.setHex(on ? 0xffeb3b : 0x00e676);
    this.halo.visible = on;
    this.lastStep = -1;
  }

  add(obj) { if (!this.targets.includes(obj)) this.targets.push(obj); }
  remove(obj) { this.targets = this.targets.filter((t) => t !== obj); }

  _root(object) {
    for (let o = object; o; o = o.parent) if (o.userData.target) return o;
    return null;
  }

  // Find the nearest target hit by a ray.
  pick(origin, dir) {
    this.ray.set(origin, dir);
    const live = this.targets.filter((t) => t.visible);
    for (const hit of this.ray.intersectObjects(live, true)) {
      const root = this._root(hit.object);
      if (root && root.visible) return { root, hit };
    }
    return null;
  }

  pickFromCamera() {
    // Use the scene camera in every mode. In an XR session it is a child of the rig and follows the head pose, so the ray
    // stays correct after a turn or teleport. (renderer.xr.getCamera() is rig-local until the next render: it ignores the rig.)
    const cam = this.camera;
    cam.getWorldPosition(this._o); cam.getWorldDirection(this._d);
    return this.pick(this._o, this._d);
  }

  activate(root, hit, via = 'gaze') {
    if (root === this.hovered) { this.t = -REARM; this._setProgress(0); }   // any input restarts the dwell timer, so a controller select plus a dwell cannot toggle Pause twice
    if (this.paused && !root.userData.target.safe) return;   // Pause: only safe-harbor targets respond
    // Generic feedback first (ping + default caption), then the target's own action: a caption set by onActivate wins.
    this.onActivated?.(root.userData.target, via);
    root.userData.target.onActivate?.(hit, via);
  }

  activateHovered(via = 'tap') {
    const p = this.pickFromCamera();
    if (p) this.activate(p.root, p.hit, via);
  }

  _setProgress(p) {
    const step = Math.round(p * 64);
    if (step === this.lastStep) return;
    this.lastStep = step;
    this.fill.geometry.dispose();
    if (step <= 0) { this.fill.geometry = new THREE.BufferGeometry(); return; }
    const theta = (step / 64) * Math.PI * 2;
    // starts at 12 o'clock and fills clockwise
    this.fill.geometry = new THREE.RingGeometry(this.ringIn, this.ringOut, 64, 1, Math.PI / 2 - theta, theta);
  }

  update(dt) {
    const p = this.pickFromCamera();
    const next = p ? p.root : null;
    if (next !== this.hovered) {
      this.hovered?.userData.target.setHover?.(false);
      this.hovered = next;
      this.hovered?.userData.target.setHover?.(true);
      this.t = 0;
    }
    // Safe-harbor targets (userData.target.safe) dwell even when gaze activation is off, paused or a controller is active, so the user can always get out.
    const safe = !!this.hovered?.userData.target.safe;
    const active = safe || (settings.gazeEnabled && !this.suppressed && !this.paused);
    if (!active || !this.hovered) { this.t = Math.min(this.t, 0); this._setProgress(0); this.reticle.children[2].visible = false; return; }
    this.t += dt;
    const dwell = Math.max(0.2, settings.dwell);
    this.fill.visible = this.t > 0;
    this._setProgress(Math.max(0, this.t / dwell));
    if (this.t >= dwell) {
      this.t = -REARM;
      this._setProgress(0);
      this.activate(this.hovered, p.hit, 'gaze');
    }
  }
}
