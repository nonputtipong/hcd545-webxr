import * as THREE from 'three';
import { settings, set, onChange, effectiveTurnMode } from './settings.js';

// Gaze-activated 3D UI: a menu panel, teleport pads and a speaker. Every button is a "target" for GazeSystem.

// Bigger label font than the first version (96 px bold on a 512 x 256 canvas): readable from the menu distance on a phone in stereo.
function labelTexture(text, w = 512, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n');
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 100, w - 16));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// colors: { base, hover } for the normal look. In contrast mode every button is black with a white frame (yellow on hover).
// safe: true marks a safe-harbor target (see gaze.js and safe.js): it still works when gaze is off or the app is paused.
export class Button3D {
  constructor({ label, w = 0.56, h = 0.3, onActivate, colors = { base: 0x333333, hover: 0x5a5a5a }, safe = false }) {
    this.colors = colors; this.hover = false;
    this.group = new THREE.Group();
    this.body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), new THREE.MeshStandardMaterial({ color: colors.base }));
    this.text = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ transparent: true }));
    this.text.position.z = 0.021;
    this.frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.06, h + 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.frame.position.z = -0.015; this.frame.raycast = () => {};   // visual only: does not enlarge the gaze target
    this.group.add(this.frame, this.body, this.text);
    this.base = 1;
    this.group.userData.target = {
      label: label.replace('\n', ' '),
      onActivate,
      safe,
      setHover: (on) => { this.hover = on; this.look(); },
    };
    this.setLabel(label);
    this.look();
    onChange((key) => { if (key === 'contrast') this.look(); });
  }
  look() {
    const hi = settings.contrast;
    this.body.material.color.setHex(hi ? 0x000000 : (this.hover ? this.colors.hover : this.colors.base));
    this.frame.visible = hi;
    this.frame.material.color.setHex(this.hover ? 0xffeb3b : 0xffffff);
    this.group.scale.setScalar(this.hover && !settings.reducedMotion ? 1.06 : 1);
  }
  setLabel(text) {
    this.group.userData.target.label = text.replace('\n', ' ');
    this.text.material.map?.dispose();
    this.text.material.map = labelTexture(text);
    this.text.material.needsUpdate = true;
  }
}

export function createMenu({ scene, gaze, actions }) {
  const group = new THREE.Group();
  group.position.set(2.6, 1.5, -1.4);   // off to the right, so the default view does not dwell on a button (and clear of the gold cube in my-scene.js)
  scene.add(group);

  const buttons = {};
  const add = (id, col, row, label, onActivate) => {
    const b = new Button3D({ label, onActivate });
    b.group.position.set((col - 1) * 0.62, -(row - 2.5) * 0.36, 0);   // 6 rows, centered on the group origin
    group.add(b.group); gaze.add(b.group);
    buttons[id] = b;
  };

  add('dwellDown', 0, 0, 'Dwell -', () => set('dwell', Math.max(0.5, +(settings.dwell - 0.1).toFixed(1))));
  add('dwellInfo', 1, 0, '', () => {});
  add('dwellUp', 2, 0, 'Dwell +', () => set('dwell', Math.min(3, +(settings.dwell + 0.1).toFixed(1))));
  add('turnL', 0, 1, 'Turn\nleft', () => actions.turn(-1));
  add('turnMode', 1, 1, '', () => set('turnMode', settings.turnMode === 'snap' ? 'smooth' : 'snap'));
  add('turnR', 2, 1, 'Turn\nright', () => actions.turn(1));
  add('audio', 0, 2, '', () => set('audio', !settings.audio));
  add('captions', 1, 2, '', () => set('captions', !settings.captions));
  add('size', 2, 2, '', () => set('targetScale', settings.targetScale >= 1.6 ? 1.0 : +(settings.targetScale + 0.3).toFixed(1)));
  add('trial', 0, 3, 'Start\ntrial', () => actions.startTrial());
  add('motion', 1, 3, '', () => set('reducedMotion', !settings.reducedMotion));
  add('home', 2, 3, 'Home', () => actions.home());
  // Row 4: eye separation by gaze (3 mm steps: 55, 58, ... 64, ... 70 mm are all reachable; the DOM slider allows 40-90 mm).
  const stepIpd = (d) => set('ipd', Math.min(90, Math.max(40, Math.round(settings.ipd * 1000) + d)) / 1000);
  add('ipdDown', 0, 4, 'IPD -', () => stepIpd(-3));
  add('ipdInfo', 1, 4, '', () => {});
  add('ipdUp', 2, 4, 'IPD +', () => stepIpd(3));
  // Row 5: accessibility settings, reachable by gaze alone (the DOM panel is not visible in stereo or in a headset).
  add('contrast', 0, 5, '', () => set('contrast', !settings.contrast));
  add('seated', 1, 5, '', () => set('seated', !settings.seated));
  add('resetHeight', 2, 5, 'Reset\nheight', () => actions.resetHeight?.());
  // The dwell readout is information, not a control: take it out of the target list.
  gaze.remove(buttons.dwellInfo.group); gaze.remove(buttons.ipdInfo.group);
  [buttons.dwellInfo, buttons.ipdInfo].forEach((b) => { b.colors = { base: 0x1a1a1a, hover: 0x1a1a1a }; b.look(); });   // read-outs: darker than the buttons, no hover

  function refresh() {
    buttons.dwellInfo.setLabel(`Dwell\n${settings.dwell.toFixed(1)} s`);
    buttons.turnMode.setLabel(`Turn: ${effectiveTurnMode()}`);
    buttons.audio.setLabel(`Sound\n${settings.audio ? 'on' : 'off'}`);
    buttons.captions.setLabel(`Captions\n${settings.captions ? 'on' : 'off'}`);
    buttons.size.setLabel(`Size\n${settings.targetScale.toFixed(1)}x`);
    buttons.motion.setLabel(`Reduced\nmotion ${settings.reducedMotion ? 'on' : 'off'}`);
    buttons.ipdInfo.setLabel(`IPD\n${Math.round(settings.ipd * 1000)} mm`);
    buttons.contrast.setLabel(`Contrast\n${settings.contrast ? 'on' : 'off'}`);
    buttons.seated.setLabel(`Seated\n${settings.seated ? 'on' : 'off'}`);
    group.scale.setScalar(settings.targetScale);
  }
  onChange(refresh);
  refresh();

  const _v = new THREE.Vector3();
  return {
    group, buttons, refresh,
    // Turn the panel toward the viewer (yaw only) so it stays readable after a teleport.
    update(camera) {
      camera.getWorldPosition(_v);
      group.rotation.y = Math.atan2(_v.x - group.position.x, _v.z - group.position.z);
    },
  };
}

// Teleport pads: gaze at a pad to blink-teleport onto it. The pad you stand on is hidden.
export function createPads({ scene, gaze, comfort }) {
  // [x, z] on open floor, clear of the solids, the sofa and the car in scene.js. The last spot is Home (the start position).
  const spots = [[-3, -1], [2.5, 1.5], [1, -6.5], [-4, 4.5], [4, 4.5], [0, 0]];
  const group = new THREE.Group();
  scene.add(group);
  const pads = spots.map(([x, z], i) => {
    const pad = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 40), new THREE.MeshStandardMaterial({ color: 0x1de9b6, emissive: 0x0a5a48 }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 8, 40).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    let hover = false;
    // Contrast mode: yellow pad with a thick black rim (white when hovered) instead of teal with a white rim.
    const paint = () => {
      const hi = settings.contrast;
      disc.material.color.setHex(hover ? (hi ? 0xffffff : 0xffee58) : (hi ? 0xffeb3b : 0x1de9b6));
      disc.material.emissive.setHex(hi ? 0x000000 : 0x0a5a48);
      rim.material.color.setHex(hi ? 0x000000 : 0xffffff);
      rim.scale.set(1, hi ? 3 : 1, 1);
    };
    onChange((k) => { if (k === 'contrast') paint(); });
    rim.position.y = 0.03;
    pad.add(disc, rim);
    pad.position.set(x, 0.03, z);
    pad.userData.spot = new THREE.Vector3(x, 0, z);
    pad.userData.target = {
      label: i === spots.length - 1 ? 'Home pad' : `Teleport pad ${i + 1}`,
      onActivate: () => { comfort.teleportTo(pad.userData.spot); current = pad; sync(); },
      setHover: (on) => { hover = on; paint(); },
    };
    paint();
    group.add(pad); gaze.add(pad);
    return pad;
  });
  let current = pads[pads.length - 1];
  function sync() { pads.forEach((p) => { p.visible = p !== current; }); }
  function applyScale() { pads.forEach((p) => p.scale.set(settings.targetScale, 1, settings.targetScale)); }
  onChange((k) => { if (k === 'targetScale') applyScale(); });
  sync(); applyScale();
  return {
    group, pads,
    home() { comfort.teleportTo(pads[pads.length - 1].userData.spot); current = pads[pads.length - 1]; sync(); },
  };
}

// A speaker you can look at to mute or unmute (a second target type: object, not button).
export function createSpeaker({ scene, gaze }) {
  const speaker = new THREE.Group();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ color: 0xff9800, emissive: 0x663300 }));
  speaker.add(orb);
  speaker.position.set(-3, 1.2, -3.5);
  speaker.userData.target = {
    label: 'Speaker',
    onActivate: () => set('audio', !settings.audio),
    setHover: (on) => { orb.material.emissive.setHex(on ? 0xffaa33 : 0x663300); },
  };
  scene.add(speaker); gaze.add(speaker);
  return {
    mesh: speaker,
    update(t) { speaker.position.y = 1.2 + (settings.reducedMotion ? 0 : Math.sin(t * 1.5) * 0.08); },
  };
}
