import * as THREE from 'three';
import { settings } from './settings.js';

// Spatial audio with no audio files: the hum and the ping are generated in code as AudioBuffers.
// AudioListener on the camera + PositionalAudio on a mesh = Web Audio PannerNode (HRTF: direction cues for headphones) driven by the scene graph.

function makeHum(ctx) {
  const sr = ctx.sampleRate, len = Math.floor(sr * 1.6);
  const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  const T = len / sr;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    // pulse at 1.25 Hz; the 220 Hz and 330 Hz tones complete whole cycles over the loop, so there is no click where it repeats
    const env = 0.5 - 0.5 * Math.cos(2 * Math.PI * (2 / T) * t);
    d[i] = 0.4 * env * (Math.sin(2 * Math.PI * 220 * t) + 0.5 * Math.sin(2 * Math.PI * 330 * t)) / 1.5;
  }
  return buf;
}

function makePing(ctx) {
  const sr = ctx.sampleRate, len = Math.floor(sr * 0.35);
  const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) { const t = i / sr; d[i] = 0.5 * Math.exp(-t * 12) * Math.sin(2 * Math.PI * 880 * t); }
  return buf;
}

const BEARINGS = [
  [30, 'ahead'], [75, 'ahead and to the %'], [120, 'to the %'], [165, 'behind and to the %'], [181, 'behind you'],
];

export class SpatialAudio {
  constructor(camera, captions) {
    this.camera = camera; this.captions = captions;
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);
    this.ctx = this.listener.context;
    this.source = null; this.mesh = null; this.pingSound = null;
    this._v = new THREE.Vector3(); this._lastCaption = ''; this._acc = 0;
    this.started = false;
  }

  attach(mesh) {
    const a = new THREE.PositionalAudio(this.listener);
    a.setBuffer(makeHum(this.ctx));
    a.setLoop(true);
    a.setRefDistance(1.5);
    a.setRolloffFactor(1.2);
    a.setDistanceModel('inverse');
    a.panner.panningModel = 'HRTF';
    mesh.add(a);
    this.source = a; this.mesh = mesh;
    this.pingSound = new THREE.Audio(this.listener);
    this.pingSound.setBuffer(makePing(this.ctx));
  }

  // Call from a click/tap handler: browsers keep the AudioContext suspended until a user gesture.
  start() {
    this.ctx.resume();
    this.started = true;
    this.sync();
  }

  resume() { this.ctx.resume(); }

  // Apply on/off + volume from settings.
  sync() {
    this.listener.setMasterVolume(settings.volume);
    if (!this.source || !this.started) return;
    if (settings.audio && !this.source.isPlaying) this.source.play();
    if (!settings.audio && this.source.isPlaying) this.source.pause();
  }

  ping() {
    if (!this.pingSound || !settings.audio || !this.started) return;
    if (this.pingSound.isPlaying) this.pingSound.stop();
    this.pingSound.play();
  }

  // Describe where the source is, relative to where the user faces: the caption for people who cannot hear direction.
  describe() {
    if (!this.mesh) return '';
    this.camera.updateWorldMatrix(true, false);
    this.mesh.getWorldPosition(this._v);
    const local = this.camera.worldToLocal(this._v);
    const dist = local.length();
    const ang = Math.abs(Math.atan2(local.x, -local.z)) * 180 / Math.PI;
    const side = local.x < 0 ? 'left' : 'right';
    const [, text] = BEARINGS.find(([max]) => ang <= max);
    return `[humming, ${text.replace('%', side)}, ${Math.round(dist)} m]`;
  }

  update(dt) {
    this._acc += dt;
    if (this._acc < 0.25) return;
    this._acc = 0;
    const playing = this.started && settings.audio && this.source?.isPlaying;
    const text = playing ? this.describe() : '';
    if (text !== this._lastCaption) { this._lastCaption = text; this.captions?.setAmbient(text); }
  }
}
