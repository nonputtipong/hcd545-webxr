import * as THREE from 'three';
import { settings, effectiveTurnMode } from './settings.js';

// Comfort layer: head-locked vignette, snap/smooth turning, blink teleport.
// Everything moves the RIG (a Group that holds the camera), never the camera: WebXR and look.js overwrite the camera pose.

class Vignette {
  constructor(camera) {
    this.material = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uInner: { value: 1.4 }, uOuter: { value: 1.9 }, uFade: { value: 0 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uInner; uniform float uOuter; uniform float uFade; varying vec2 vP;' +
        'void main(){ float a = max(smoothstep(uInner, uOuter, length(vP)), uFade); gl_FragColor = vec4(0.0,0.0,0.0,a); }',
    });
    // A 10 m plane 1 m in front of the eyes: radius r on the plane = tan(half-angle). Child of the camera, so it
    // is drawn in mono, in each eye of StereoEffect and in immersive-vr.
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), this.material);
    this.mesh.position.z = -1;
    this.mesh.renderOrder = 1000;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    camera.add(this.mesh);
  }
  // strength 0 = invisible, 1 = a narrow tunnel (about 25 degrees half-angle). fade 1 = fully black.
  set(strength, fade) {
    const inner = 1.4 - 1.0 * THREE.MathUtils.clamp(strength, 0, 1);
    this.material.uniforms.uInner.value = inner;
    this.material.uniforms.uOuter.value = inner + 0.5;
    this.material.uniforms.uFade.value = fade;
    this.mesh.visible = strength > 0.01 || fade > 0.001;
  }
}

export class Comfort {
  constructor({ rig, camera, renderer }) {
    this.rig = rig; this.camera = camera; this.renderer = renderer;
    this.vignette = new Vignette(camera);
    this.pendingYaw = 0;       // radians still to turn (smooth mode)
    this.motion = 0;           // 0..1, smoothed turn speed, drives the vignette
    this.fade = 0; this.tunnel = 0; this.tp = null;   // tunnel 0..1: the vignette that closes during a blink teleport
    this.stickArmed = true;
    this._v = new THREE.Vector3();
    window.addEventListener('keydown', (e) => {   // Z / C turn (ignored while typing in a field or choosing in a menu)
      if (e.repeat || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
      if (e.code === 'KeyZ') this.turn(-1);
      if (e.code === 'KeyC') this.turn(1);
    });
  }

  // dir: -1 = left, +1 = right. Snap = instant jump, smooth = continuous rotation at settings.smoothSpeed.
  turn(dir) {
    const a = THREE.MathUtils.degToRad(settings.snapAngle);
    if (effectiveTurnMode() === 'snap') this._rotate(-dir * a);
    else this.pendingYaw += -dir * a;
  }

  // Rotate about the HEAD, not the rig origin, so a standing headset user does not swing sideways.
  _rotate(dYaw) {
    const local = this._v.set(this.camera.position.x, 0, this.camera.position.z);
    const before = local.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.rig.rotation.y);
    this.rig.rotation.y += dYaw;
    const after = local.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.rig.rotation.y);
    this.rig.position.x += before.x - after.x;
    this.rig.position.z += before.z - after.z;
  }

  // Move so that the head ends above (x, z). Blink (fade out, move, fade in) unless reduced motion.
  teleportTo(point) {
    if (settings.reducedMotion) { this._moveHeadTo(point); return; }
    this.tp = { point: point.clone(), phase: 'out' };
  }

  _moveHeadTo(p) {
    const local = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z).applyAxisAngle(THREE.Object3D.DEFAULT_UP, this.rig.rotation.y);
    this.rig.position.x = p.x - local.x;
    this.rig.position.z = p.z - local.z;
  }

  // Thumbstick (only exists with controllers; returns 0 when there are none).
  _pollSticks() {
    const session = this.renderer.xr.getSession?.();
    if (!session) return 0;
    let x = 0;
    for (const src of session.inputSources) {
      const ax = src.gamepad?.axes;
      if (!ax) continue;
      const v = ax.length >= 4 ? ax[2] : ax[0];
      if (Math.abs(v) > Math.abs(x)) x = v;
    }
    return x;
  }

  update(dt) {
    // Smooth turning
    let speed = 0;
    if (this.pendingYaw !== 0) {
      const max = THREE.MathUtils.degToRad(settings.smoothSpeed) * dt;
      const step = Math.sign(this.pendingYaw) * Math.min(Math.abs(this.pendingYaw), max);
      this._rotate(step);
      this.pendingYaw -= step;
      speed = Math.abs(step) / Math.max(dt, 1e-4) / THREE.MathUtils.degToRad(settings.smoothSpeed);
    }
    // Thumbstick turning (XR controllers only)
    const stick = this._pollSticks();
    if (Math.abs(stick) > 0.1) {
      if (effectiveTurnMode() === 'smooth') {
        const step = -stick * THREE.MathUtils.degToRad(settings.smoothSpeed) * dt;
        this._rotate(step); speed = Math.abs(stick);
      } else if (this.stickArmed && Math.abs(stick) > 0.7) {
        this.turn(Math.sign(stick)); this.stickArmed = false;
      }
    } else this.stickArmed = true;

    this.motion += (speed - this.motion) * Math.min(1, dt * 8);

    // Blink teleport: the vignette tunnel closes first (so the blink is visible as a comfort cue), then the view fades to black,
    // the head moves, and everything reverses. With vignette 'off' the tunnel is skipped and only the fade remains.
    if (this.tp) {
      const useTunnel = settings.vignette !== 'off';
      if (this.tp.phase === 'out') {
        this.tunnel = useTunnel ? Math.min(1, this.tunnel + dt / 0.15) : 1;
        if (this.tunnel >= 1) this.fade = Math.min(1, this.fade + dt / 0.1);
        if (this.fade >= 1) { this._moveHeadTo(this.tp.point); this.tp.phase = 'in'; }
      } else {
        this.fade = Math.max(0, this.fade - dt / 0.15);
        if (this.fade <= 0) this.tunnel = Math.max(0, this.tunnel - dt / 0.25);
        if (this.fade <= 0 && this.tunnel <= 0) this.tp = null;
      }
    }

    // Vignette: setting 'always' = constant tunnel, 'motion' = only while turning, 'off' = none (blink still fades).
    const v = settings.vignette;
    const base = v === 'always' ? 0.45 : 0;
    const strength = v === 'off' ? 0 : Math.max(base, this.motion * 0.8, this.tunnel * 0.9);
    this.vignette.set(strength, this.fade);
  }
}
