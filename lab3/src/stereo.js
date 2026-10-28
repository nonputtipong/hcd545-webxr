import * as THREE from 'three';
import { StereoEffect } from 'three/addons/effects/StereoEffect.js';

// Binocular mode for phones in a viewer: side-by-side stereo, no lens correction (StereoEffect has none).
// Viewer fit: StereoEffect gives each eye half the screen, so on a large phone the two images sit farther apart than the
// lenses. With fit on, each eye is drawn in a square one lens spacing wide, centered under its lens and placed from the
// bottom edge of the screen (where the phone rests in a cardboard viewer), with black around it.
const PX_PER_MM = 5.6;            // CSS pixels per mm on current phones (S24 Ultra 5.3, iPhone 15 5.7, Pixel 8 5.9); the Lens spacing slider corrects the remaining difference
const LENS_ABOVE_BOTTOM_MM = 35;  // bottom edge of the screen to the lens centers in a typical cardboard viewer

export class StereoMode {
  constructor(renderer, ipd = 0.064) {
    this.renderer = renderer;
    this.effect = new StereoEffect(renderer);
    this.effect.setEyeSeparation(ipd);   // meters; verified in the r186 addon source
    this.camera = new THREE.StereoCamera();   // the same eye cameras StereoEffect uses, for the viewer-fit path
    this.camera.eyeSep = ipd;
    this.fit = false;
    this.lensMm = 64;
    this.enabled = false;
    this.wakeLock = null;
    this._size = new THREE.Vector2();
    this._clear = new THREE.Color();
  }

  setIpd(metres) { this.effect.setEyeSeparation(metres); this.camera.eyeSep = metres; }

  setFit(on, lensMm) { this.fit = on; this.lensMm = lensMm; }

  // Call from a click handler. Every piece is optional: iPhone Safari has no Fullscreen API for pages.
  enable() {
    this.enabled = true;
    const root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    try { screen.orientation?.lock?.('landscape')?.catch?.(() => {}); } catch { /* not supported */ }
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => { this.wakeLock = l; }).catch(() => {});
  }

  disable() {
    this.enabled = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try { screen.orientation?.unlock?.(); } catch { /* ignore */ }
    this.wakeLock?.release?.().catch?.(() => {});
    this.wakeLock = null;
  }

  // The two eye squares in CSS pixels, [x, y, size], with y from the bottom (the three.js viewport convention).
  eyeRects(w, h) {
    const d = this.lensMm * PX_PER_MM;                      // lens center to lens center
    const side = Math.min(d, h, w / 2);
    const cy = Math.min(Math.max(LENS_ABOVE_BOTTOM_MM * PX_PER_MM, side / 2), h - side / 2);
    return [-1, 1].map((s) => [w / 2 + (s * d) / 2 - side / 2, cy - side / 2, side]);
  }

  render(scene, camera) {
    if (!this.fit) { this.effect.render(scene, camera); return; }
    const r = this.renderer;
    r.getSize(this._size);
    const rects = this.eyeRects(this._size.x, this._size.y);
    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();
    this.camera.aspect = 1 / camera.aspect;                  // square eyes: camera.aspect * this.aspect = 1
    this.camera.update(camera);

    const autoClear = r.autoClear;
    r.getClearColor(this._clear);                            // the sky color, set by the last render
    const alpha = r.getClearAlpha();
    r.autoClear = false;
    r.setScissorTest(false);
    r.setClearColor(0x000000, 1);
    r.clear();                                               // black around the two eyes
    r.setClearColor(this._clear, alpha);
    r.setScissorTest(true);
    [this.camera.cameraL, this.camera.cameraR].forEach((eye, i) => {
      const [x, y, s] = rects[i];
      r.setScissor(x, y, s, s);
      r.setViewport(x, y, s, s);
      r.clear();                                             // color and depth, inside this eye only
      r.render(scene, eye);
    });
    r.setScissorTest(false);
    r.autoClear = autoClear;
  }
}
