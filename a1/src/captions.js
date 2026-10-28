import * as THREE from 'three';
import { settings } from './settings.js';

// Head-locked caption strip for sound (W3C XR Accessibility User Requirements, XAUR: captions and descriptions of non-speech audio).
// Drawn as a 3D mesh on the camera, so it shows in mono, in each eye of stereo, and inside immersive-vr.
export class Captions {
  constructor(camera) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024; this.canvas.height = 128;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.125),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
    this.mesh.position.set(0, -0.4, -1.3);
    this.mesh.renderOrder = 998;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    camera.add(this.mesh);
    this.ambient = ''; this.timed = ''; this.timer = 0; this.drawn = null; this.drawnContrast = false;
  }

  setAmbient(text) { this.ambient = text; }
  say(text, seconds = 2.5) { this.timed = text; this.timer = seconds; }

  update(dt) {
    if (this.timer > 0) { this.timer -= dt; if (this.timer <= 0) this.timed = ''; }
    const text = settings.captions ? (this.timed || this.ambient) : '';
    if (text !== this.drawn || settings.contrast !== this.drawnContrast) {
      this.drawn = text; this.drawnContrast = settings.contrast;
      const g = this.ctx;
      g.clearRect(0, 0, 1024, 128);
      if (text) {
        g.fillStyle = settings.contrast ? '#000000' : 'rgba(0,0,0,0.8)';   // contrast mode: opaque black, yellow text
        g.beginPath(); g.roundRect(0, 0, 1024, 128, 24); g.fill();
        g.fillStyle = settings.contrast ? '#ffeb3b' : '#ffffff'; g.font = 'bold 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(text, 512, 66, 980);
      }
      this.tex.needsUpdate = true;
    }
    this.mesh.visible = !!text;
  }
}
