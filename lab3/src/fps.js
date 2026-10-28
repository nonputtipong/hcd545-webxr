import { h } from './ui.js';

// Frame counter. Frame time (ms) matters more than fps: 72 Hz = 13.9 ms, 90 Hz = 11.1 ms, 60 Hz = 16.7 ms.
export class FpsCounter {
  // The box turns red below minFps: 90 % of the target on a screen (54 fps at 60 Hz), 72 fps in a VR session (Meta's minimum).
  constructor(targetHz = 60, minFps = targetHz * 0.9) {
    this.targetHz = targetHz;
    this.minFps = minFps;
    this.el = h('div', { id: 'fps' }, '-- fps');
    this.frames = 0; this.acc = 0; this.worst = 0; this.fps = 0; this.ms = 0;
  }
  setTarget(hz, minFps = hz * 0.9) { this.targetHz = hz; this.minFps = minFps; }
  tick(dt) {
    this.frames++; this.acc += dt; this.worst = Math.max(this.worst, dt);
    if (this.acc >= 0.5) {
      this.fps = this.frames / this.acc;
      this.ms = (this.acc / this.frames) * 1000;
      this.el.textContent = `${this.fps.toFixed(0)} fps | ${this.ms.toFixed(1)} ms | worst ${(this.worst * 1000).toFixed(0)} ms`;
      this.el.classList.toggle('bad', Math.round(this.fps) < this.minFps);   // compare the number shown, so 72 at 72 Hz is not red
      this.frames = 0; this.acc = 0; this.worst = 0;
    }
  }
}
