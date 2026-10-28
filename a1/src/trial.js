import * as THREE from 'three';
import { settings } from './settings.js';

// Fitts-style gaze trial: ten spheres appear one at a time 3 m away; look at each until it fills.
// Time per target = travel (Fitts: distance and size) + dwell. Change Dwell time and Target size between runs and compare the means.
const DIST = 3;

export class Trial {
  constructor({ scene, camera, renderer, gaze, onDone, onSay }) {
    Object.assign(this, { scene, camera, renderer, gaze, onDone, onSay });
    this.mesh = null; this.times = []; this.total = 0; this.t0 = 0;
    this._o = new THREE.Vector3(); this._d = new THREE.Vector3();
  }

  get running() { return this.total > 0; }

  start(n = 10) {
    this.stop();
    this.total = n; this.times = [];
    this.onSay?.(`Trial: look at each target (${n})`);
    this._spawn();
  }

  stop() {
    if (this.mesh) { this.scene.remove(this.mesh); this.gaze.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null; }
    this.total = 0;
  }

  _spawn() {
    const cam = this.camera;   // follows the head pose in XR and includes the rig (see gaze.js)
    cam.getWorldPosition(this._o); cam.getWorldDirection(this._d);
    // random offset up to +-40 deg yaw and +-15 deg pitch from where the user is facing now;
    // try again if another target (menu, cube, pad) stands in front, so the sphere is never hidden behind it
    let dir;
    for (let i = 0; i < 30; i++) {
      const yaw = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 40);
      const pitch = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 15);
      dir = this._d.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      const side = new THREE.Vector3().crossVectors(dir, THREE.Object3D.DEFAULT_UP).normalize();
      dir.applyAxisAngle(side, pitch);
      const blocker = this.gaze.pick(this._o, dir);
      if (!blocker || blocker.hit.distance > DIST + 0.5) break;
    }
    const diameterDeg = 4 * settings.targetScale;
    const radius = DIST * Math.tan(THREE.MathUtils.degToRad(diameterDeg / 2));
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff4081, emissive: 0x551133 }));
    mesh.position.copy(this._o).addScaledVector(dir, DIST);
    mesh.userData.target = {
      label: 'Trial target',
      onActivate: () => this._hit(),
      setHover: (on) => mesh.material.emissive.setHex(on ? 0xff80ab : 0x551133),
    };
    this.mesh = mesh;
    this.scene.add(mesh); this.gaze.add(mesh);
    this.t0 = performance.now();
  }

  _hit() {
    this.times.push((performance.now() - this.t0) / 1000);
    this.scene.remove(this.mesh); this.gaze.remove(this.mesh);
    this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null;
    if (this.times.length >= this.total) {
      const mean = this.times.reduce((a, b) => a + b, 0) / this.times.length;
      const text = `mean ${mean.toFixed(2)} s over ${this.times.length} | dwell ${settings.dwell.toFixed(1)} s | target ${(4 * settings.targetScale).toFixed(1)} deg`;
      this.total = 0;
      this.onSay?.(`Trial done: mean ${mean.toFixed(2)} s`, 6);
      this.onDone?.(text, mean);
    } else this._spawn();
  }
}
