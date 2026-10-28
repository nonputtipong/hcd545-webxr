import * as THREE from 'three';
import { settings, onChange } from './settings.js';
import { Button3D } from './menu.js';

// Assignment 1: a gaze-only memory game.  start -> play -> end -> (Play again / Restart / Exit) -> start
//   start : one "Start game" button above the grid (a deliberate look up, so the game never starts by accident).
//   play  : 6 face-down tiles (3 pairs). Dwell on a tile to flip it. Two open tiles: a match stays open, a miss flips back.
//   end   : a result card (tries and time) and a "Play again" button.
// Every tile shows a shape AND a word AND a color, so the game never depends on color alone.
// Every sound is a PositionalAudio played from the tile itself, and every sound has a caption, so it also works with sound off.
// safe.js calls reset() from Restart and Exit.

const SYMBOLS = [
  { name: 'Circle', color: '#e53935', freq: 523 },     // C5
  { name: 'Triangle', color: '#1e88e5', freq: 659 },   // E5
  { name: 'Square', color: '#2e7d32', freq: 784 },     // G5
];
const TILE = 0.5;        // meters: about 9 degrees wide from the Home position (3.2 m away)
const GAP = 0.65;        // center to center
const MISS_SHOW = 1.5;   // seconds two wrong tiles stay open, so the player can remember them
const POS = ['top left', 'top middle', 'top right', 'bottom left', 'bottom middle', 'bottom right'];

// ---- Sounds, generated in code (no audio files) -------------------------------------------------------------------
function makeBuffer(ctx, seconds, fn) {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = fn(i / sr);
  return buf;
}
const tone = (ctx, f) => makeBuffer(ctx, 0.3, (t) => 0.5 * Math.exp(-t * 10) * Math.sin(2 * Math.PI * f * t));
const chime = (ctx, f) => makeBuffer(ctx, 0.5, (t) => 0.45 * Math.exp(-t * 6) * Math.sin(2 * Math.PI * (t < 0.15 ? f : f * 1.5) * t));
const buzz = (ctx) => makeBuffer(ctx, 0.4, (t) => 0.3 * Math.exp(-t * 5) * Math.sign(Math.sin(2 * Math.PI * 140 * t)));
const fanfare = (ctx) => makeBuffer(ctx, 0.9, (t) => {
  const f = t < 0.3 ? 523 : t < 0.6 ? 659 : 784;
  return 0.45 * Math.exp(-(t % 0.3) * 6) * Math.sin(2 * Math.PI * f * t);
});

// ---- Tile faces: drawn on a canvas -------------------------------------------------------------------------------
function faceTexture(sym, matched) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), hi = settings.contrast;
  g.fillStyle = sym ? (hi ? '#000000' : '#ffffff') : (hi ? '#000000' : '#283593');
  g.fillRect(0, 0, 256, 256);
  if (hi || matched) { g.strokeStyle = matched ? '#00e676' : '#ffffff'; g.lineWidth = 16; g.strokeRect(8, 8, 240, 240); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!sym) {                                         // back of the tile
    g.fillStyle = hi ? '#ffeb3b' : '#ffffff'; g.font = 'bold 150px sans-serif';
    g.fillText('?', 128, 136);
  } else {
    g.fillStyle = hi ? '#ffeb3b' : sym.color;
    g.beginPath();
    if (sym.name === 'Circle') g.arc(128, 100, 62, 0, Math.PI * 2);
    if (sym.name === 'Triangle') { g.moveTo(128, 36); g.lineTo(196, 160); g.lineTo(60, 160); g.closePath(); }
    if (sym.name === 'Square') g.rect(68, 42, 120, 120);
    g.fill();
    g.fillStyle = hi ? '#ffffff' : '#111111'; g.font = 'bold 50px sans-serif';
    g.fillText(matched ? `${sym.name} ✓` : sym.name, 128, 212, 240);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function addMyTargets({ scene, gaze, captions, audio }) {
  const root = new THREE.Group();
  root.position.set(0, 1.675, -3.2);   // in front of Home; the rows sit above and below eye level, so a straight look hits nothing
  scene.add(root);

  // Sounds: one PositionalAudio per tile, so each sound comes from where the tile is.
  const ctx = audio.ctx;
  const sounds = { buzz: buzz(ctx), fanfare: fanfare(ctx) };
  SYMBOLS.forEach((s) => { sounds['tone' + s.name] = tone(ctx, s.freq); sounds['chime' + s.name] = chime(ctx, s.freq); });
  function play(obj, key) {
    if (!settings.audio || !audio.started) return;   // sound off: the caption alone carries the information
    const a = obj.userData.sound;
    if (a.isPlaying) a.stop();
    a.setBuffer(sounds[key]);
    a.play();
  }
  const addSound = (obj) => {
    const a = new THREE.PositionalAudio(audio.listener);
    a.setRefDistance(2); a.panner.panningModel = 'HRTF';
    obj.add(a); obj.userData.sound = a;
  };
  addSound(root);

  // ---- Buttons and the result card (Button3D from menu.js: contrast mode and hover come for free) ------------------
  const green = { base: 0x1b5e20, hover: 0x2e7d32 };
  const startBtn = new Button3D({ label: 'Start\ngame', w: 0.7, h: 0.36, colors: green, onActivate: () => begin() });
  const againBtn = new Button3D({ label: 'Play\nagain', w: 0.7, h: 0.36, colors: green, onActivate: () => begin() });
  const result = new Button3D({ label: '', w: 1.4, h: 0.5, colors: { base: 0x1a1a1a, hover: 0x1a1a1a }, onActivate: () => {} });
  // Start and Play again sit ABOVE the tile grid (about 17 degrees up), never where a tile appears: otherwise one long look
  // would press Start and then flip the tile behind it without a decision.
  startBtn.group.position.set(0, 0.95, 0);
  againBtn.group.position.set(0, 0.95, 0);
  result.group.position.set(0, 0.2, 0);
  for (const b of [startBtn, againBtn]) { b.group.userData.target.quiet = true; root.add(b.group); gaze.add(b.group); }
  root.add(result.group);   // a read-out, not a gaze target

  // ---- Tiles ------------------------------------------------------------------------------------------------------
  const tiles = POS.map((where, i) => {
    const front = new THREE.MeshBasicMaterial();
    const side = new THREE.MeshStandardMaterial({ color: 0x9e9e9e });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(TILE, TILE, 0.04), [side, side, side, side, front, side]);   // index 4 = +z face, toward Home
    mesh.position.set(((i % 3) - 1) * GAP, i < 3 ? 0.375 : -0.375, 0);
    const tile = { mesh, front, where, sym: null, open: false, matched: false, hover: false };
    mesh.userData.target = {
      label: `Tile ${where}`,
      quiet: true,   // main.js skips its generic ping: the tile plays its own sound and caption
      onActivate: () => flip(tile),
      setHover: (on) => { tile.hover = on; mesh.scale.setScalar(on && !settings.reducedMotion ? 1.06 : 1); },
    };
    addSound(mesh);
    root.add(mesh);
    return tile;
  });

  function paint(tile) {
    tile.front.map?.dispose();
    tile.front.map = faceTexture(tile.open ? tile.sym : null, tile.matched);
    tile.front.needsUpdate = true;
  }

  // ---- Game state -------------------------------------------------------------------------------------------------
  let state = 'start', firstOpen = null, missTimer = 0, tries = 0, pairs = 0, elapsed = 0;

  // A tile is a gaze target only while it can be flipped, so the ring never fills on an open tile or during a miss.
  function syncTargets() {
    tiles.forEach((t) => {
      if (state === 'play' && !t.open && missTimer <= 0) gaze.add(t.mesh); else gaze.remove(t.mesh);
    });
  }

  function show() {
    startBtn.group.visible = state === 'start';
    againBtn.group.visible = result.group.visible = state === 'end';
    tiles.forEach((t) => { t.mesh.visible = state === 'play'; });
    syncTargets();
  }

  function begin() {
    const deck = [...SYMBOLS, ...SYMBOLS];
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }   // Fisher-Yates shuffle
    tiles.forEach((t, i) => { t.sym = deck[i]; t.open = t.matched = false; paint(t); });
    firstOpen = null; missTimer = 0; tries = 0; pairs = 0; elapsed = 0;
    state = 'play'; show();
    play(root, 'toneCircle');
    captions.say('[ping] Find the 3 pairs. Look at a tile to turn it over', 4);
  }

  function flip(tile) {
    if (state !== 'play' || tile.open || missTimer > 0) return;
    tile.open = true; paint(tile);
    if (!firstOpen) {                                  // first tile of a try
      firstOpen = tile;
      play(tile.mesh, 'tone' + tile.sym.name);
      captions.say(`[tone] ${tile.sym.name}, ${tile.where}. Now find its pair`, 3);
    } else if (firstOpen.sym === tile.sym) {           // match: both stay open
      tries++; pairs++;
      tile.matched = firstOpen.matched = true; paint(tile); paint(firstOpen);
      firstOpen = null;
      if (pairs === SYMBOLS.length) return finish(tile);
      play(tile.mesh, 'chime' + tile.sym.name);
      captions.say(`[chime] Match: ${tile.sym.name}! ${pairs} of ${SYMBOLS.length} pairs`, 3);
    } else {                                           // miss: show both for MISS_SHOW s, then turn them back
      tries++;
      play(tile.mesh, 'buzz');
      captions.say(`[buzz] No match: ${firstOpen.sym.name} and ${tile.sym.name}. Remember them`, MISS_SHOW + 0.5);
      missTimer = MISS_SHOW;
    }
    syncTargets();
  }

  function finish(tile) {
    state = 'end';
    result.setLabel(`All pairs found!\n${tries} tries, ${Math.round(elapsed)} s`);
    show();
    play(tile.mesh, 'fanfare');
    captions.say(`[fanfare] Well done: ${tries} tries in ${Math.round(elapsed)} s. Look up to play again`, 5);
  }

  // Called every frame by main.js. The clock and the miss timer stop while the dock's Pause is on.
  function update(dt) {
    if (state !== 'play' || gaze.paused) return;
    elapsed += dt;
    if (missTimer > 0 && (missTimer -= dt) <= 0) {
      tiles.forEach((t) => { if (t.open && !t.matched) { t.open = false; paint(t); } });
      firstOpen = null;
      syncTargets();
    }
  }

  // The reset path (Restart and Exit in the dock, or hcd.mine.reset() in the console).
  function reset() { state = 'start'; firstOpen = null; missTimer = 0; show(); }

  root.scale.setScalar(settings.targetScale);
  onChange((key) => {
    if (key === 'targetScale') root.scale.setScalar(settings.targetScale);
    if (key === 'contrast') tiles.forEach(paint);
  });
  tiles.forEach(paint);
  reset();

  return { root, tiles, reset, update, begin, get state() { return state; }, get tries() { return tries; } };
}
