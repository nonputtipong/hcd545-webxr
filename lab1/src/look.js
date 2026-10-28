import * as THREE from 'three';

// Look-around for non-XR modes. three.js r186 no longer ships DeviceOrientationControls, so this is our own.
// Priority: DeviceOrientation (phones/tablets) + drag yaw; otherwise pure drag (desktop).
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);
const Q_UPRIGHT = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2); // -90 deg about X: phone upright = looking at horizon
const deg = THREE.MathUtils.degToRad;

function screenAngle() {
  return (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
}

export class LookControls {
  constructor(camera, dom, settings) {
    this.camera = camera; this.dom = dom; this.settings = settings;
    this.permission = 'not-asked';      // 'granted' | 'denied' | 'not-required' | 'unavailable' | 'not-asked'
    this.hasData = false;               // true once a real sample arrived
    this.alpha = 0; this.beta = 0; this.gamma = 0; this.yawRef = null;
    this.dragYaw = 0; this.pitch = 0;
    this.qDev = new THREE.Quaternion(); this.qTmp = new THREE.Quaternion(); this.euler = new THREE.Euler();
    this.buffer = [];                   // [{t, q}] for artificial latency
    this._listening = false;
    this._bindDrag();
  }

  get mode() { return this.hasData ? 'device orientation + drag' : 'drag'; }

  // MUST be called synchronously from a click handler (iOS drops user activation after any await).
  requestPermission() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) { this.permission = 'unavailable'; return Promise.resolve(this.permission); }
    if (typeof DOE.requestPermission === 'function') {
      return DOE.requestPermission().then((r) => {
        this.permission = r;
        if (r === 'granted') this._listen();
        return r;
      }).catch(() => { this.permission = 'denied'; return this.permission; });
    }
    this.permission = 'not-required';
    this._listen();
    return Promise.resolve(this.permission);
  }

  _listen() {
    if (this._listening) return;
    this._listening = true;
    window.addEventListener('deviceorientation', (e) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return; // desktop browsers fire one empty event
      this.alpha = e.alpha; this.beta = e.beta; this.gamma = e.gamma;
      if (this.yawRef === null) this.yawRef = e.alpha;
      this.hasData = true;
    });
  }

  recenter() {
    this.yawRef = this.alpha;
    this.dragYaw = 0; this.pitch = 0;
  }

  _bindDrag() {
    let down = false, lx = 0, ly = 0;
    const d = this.dom;
    d.style.touchAction = 'none';
    d.addEventListener('pointerdown', (e) => { down = true; lx = e.clientX; ly = e.clientY; d.setPointerCapture(e.pointerId); });
    d.addEventListener('pointerup', (e) => { down = false; d.releasePointerCapture?.(e.pointerId); });
    d.addEventListener('pointercancel', () => { down = false; });
    d.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      this.dragYaw += dx * 0.005;                       // drag right = scene moves right = camera looks left
      if (!this.hasData) this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.005, -1.4, 1.4);
    });
  }

  // Call every frame when NOT presenting in XR (the headset owns the camera pose in XR).
  update(now = performance.now()) {
    let q;
    if (this.hasData) {
      this.euler.set(deg(this.beta), deg(this.alpha - this.yawRef), -deg(this.gamma), 'YXZ');
      this.qDev.setFromEuler(this.euler).multiply(Q_UPRIGHT).multiply(this.qTmp.setFromAxisAngle(Z, -deg(screenAngle())));
      q = new THREE.Quaternion().setFromAxisAngle(Y, this.dragYaw).multiply(this.qDev);
    } else {
      this.euler.set(this.pitch, this.dragYaw, 0, 'YXZ');
      q = new THREE.Quaternion().setFromEuler(this.euler);
    }
    const lat = this.settings.latencyMs;
    if (lat <= 0) { this.buffer.length = 0; this.camera.quaternion.copy(q); return; }
    this.buffer.push({ t: now, q });
    const target = now - lat;
    while (this.buffer.length > 1 && this.buffer[1].t <= target) this.buffer.shift();
    this.camera.quaternion.copy(this.buffer[0].q);
  }
}
