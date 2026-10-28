import * as THREE from 'three';
import { settings } from './settings.js';

// Head-locked input badge: shows which link of the fallback chain is active (input.kind) and where the safe-harbor targets are.
// Display only (it is not a gaze target), drawn as a mesh on the camera so it shows in mono, each eye of stereo and immersive-vr.
// The texture is redrawn only when the text or the contrast setting changes.
const LABELS = { controller: 'Controller', hand: 'Hand', gaze: 'Gaze', pointer: 'Pointer / touch', none: 'None (gaze off)' };

export class InputBadge {
  constructor({ camera, input }) {
    this.input = input;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512; this.canvas.height = 128;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.125),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
    this.mesh.position.set(0, -0.78, -1.6);   // about 26 degrees below the view center, same depth as the reticle
    this.mesh.renderOrder = 997;
    this.mesh.frustumCulled = false;
    camera.add(this.mesh);
    this.key = '';
  }

  get label() { return LABELS[this.input.kind] || this.input.kind; }

  update() {
    const key = `${this.input.kind}|${settings.contrast}`;
    if (key === this.key) return;
    this.key = key;
    const g = this.canvas.getContext('2d'), hi = settings.contrast;
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = hi ? '#000000' : 'rgba(0,0,0,0.72)';
    g.beginPath(); g.roundRect(0, 0, 512, 128, 20); g.fill();
    if (hi) { g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = hi ? '#ffeb3b' : '#ffffff'; g.font = 'bold 50px sans-serif';
    g.fillText(`Input: ${this.label}`, 256, 46, 490);
    g.fillStyle = hi ? '#ffffff' : '#b8c4dc'; g.font = '30px sans-serif';
    g.fillText('Look down for Pause / Exit', 256, 98, 490);
    this.tex.needsUpdate = true;
  }
}
