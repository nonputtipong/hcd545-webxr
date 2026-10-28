import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { settings } from './settings.js';

// 1 three.js unit = 1 metre. A real-size sofa and car are the scale cues that tell the brain how big the room is.
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const skyTextures = {
  gradient: () => canvasTexture(512, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1b2a55'); grad.addColorStop(0.5, '#8fb4e8'); grad.addColorStop(0.55, '#e8dcc0'); grad.addColorStop(1, '#4a4a4a');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  }),
  checker: () => canvasTexture(1024, 512, (g, w, h) => {
    const n = 32, sw = w / n, sh = h / (n / 2);
    for (let y = 0; y < n / 2; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? '#f2f2f2' : '#202020';
      g.fillRect(x * sw, y * sh, sw, sh);
    }
  }),
  dark: () => canvasTexture(8, 8, (g, w, h) => { g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h); }),
  // Stretch: an anime-style night. The image is equirectangular: x = direction around you, y = elevation (top = straight up).
  anime: () => canvasTexture(2048, 1024, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h / 2);
    grad.addColorStop(0, '#010108'); grad.addColorStop(0.55, '#0a0828'); grad.addColorStop(0.85, '#121a48'); grad.addColorStop(1, '#22366e');
    g.fillStyle = grad; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = '#08050f'; g.fillRect(0, h / 2, w, h / 2);
    // Stars: sin(elevation) uniform spreads them evenly over the dome instead of bunching at the top.
    for (let i = 0; i < 2500; i++) {
      const y = (0.5 - Math.asin(Math.random()) / Math.PI) * h, x = Math.random() * w;
      const r = Math.random() < 0.95 ? 0.3 + Math.random() * 0.5 : 1 + Math.random() * 0.6;   // 1 px is about 0.18 deg of sky
      g.fillStyle = `rgba(255, ${230 + Math.random() * 25 | 0}, 255, ${0.4 + Math.random() * 0.6})`;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    // A big glowing moon ahead and up (the start view looks toward u = 0.75). The ellipse undoes the equirect stretch.
    const mx = 0.72 * w, my = (0.5 - 22 / 180) * h, mr = 28, sx = 1 / Math.cos(22 * Math.PI / 180);
    const halo = g.createRadialGradient(mx, my, mr, mx, my, mr * 2.5);
    halo.addColorStop(0, 'rgba(255, 220, 245, 0.3)'); halo.addColorStop(1, 'rgba(255, 220, 245, 0)');
    g.fillStyle = halo; g.beginPath(); g.ellipse(mx, my, mr * 2.5 * sx, mr * 2.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff4fb'; g.beginPath(); g.ellipse(mx, my, mr * sx, mr, 0, 0, Math.PI * 2); g.fill();
  }),
};

// Shooting stars for the anime sky: bright streaks that slide across the dome, fade, and respawn somewhere else.
function createStarfall(count = 12, radius = 80) {
  const map = canvasTexture(256, 16, (g, w, h) => {   // head on the right (+x), tail fading to the left
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255, 200, 240, 0)'); grad.addColorStop(0.85, 'rgba(255, 230, 250, 0.8)'); grad.addColorStop(1, '#ffffff');
    g.fillStyle = grad; g.fillRect(0, h * 0.3, w, h * 0.4);
  });
  const group = new THREE.Group();
  const streaks = Array.from({ length: count }, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 1),
      new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    group.add(m);
    return { m, t0: Infinity, dur: 1, start: new THREE.Vector3(), dir: new THREE.Vector3() };
  });
  const inward = new THREE.Vector3(), up = new THREE.Vector3(), basis = new THREE.Matrix4();
  function respawn(s, t) {
    const az = Math.random() * Math.PI * 2, el = THREE.MathUtils.degToRad(25 + Math.random() * 50);
    s.start.setFromSphericalCoords(radius, Math.PI / 2 - el, az);
    inward.copy(s.start).negate().normalize();
    // Fall direction: sideways along the dome and slightly down, kept perpendicular to the view ray so the streak faces you.
    s.dir.set(Math.random() - 0.5, -0.6, Math.random() - 0.5).projectOnPlane(inward).normalize();
    up.crossVectors(inward, s.dir);
    s.m.quaternion.setFromRotationMatrix(basis.makeBasis(s.dir, up, inward));
    s.t0 = t + 0.3 + Math.random() * 2.5;   // short random gap before each streak
    s.dur = 0.8 + Math.random() * 0.8;
  }
  return {
    group,
    update(t) {
      for (const s of streaks) {
        if (t > s.t0 + s.dur || s.t0 === Infinity) respawn(s, t);
        const k = (t - s.t0) / s.dur;                       // 0..1 while the streak is alive
        s.m.material.opacity = k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI);
        s.m.position.copy(s.start).addScaledVector(s.dir, Math.max(k, 0) * 30);
      }
    },
  };
}

export function createEnvironment(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const fill = new THREE.HemisphereLight(0xffffff, 0x445566, 1.6);
  scene.add(fill);
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);   // the sun: one directional light, aimed at the origin
  sun.position.set(4, 8, 3);
  // Lighting per sky. At night the "sun" becomes dim blue moonlight from the painted moon's direction (azimuth u = 0.72, 22 deg up).
  const lighting = {
    day: { fill: [0xffffff, 0x445566, 1.6], sun: [0xffffff, 2.0, new THREE.Vector3(4, 8, 3)] },
    night: { fill: [0x6a5fb8, 0x2a1d45, 0.55], sun: [0xc8d0ff, 0.6, new THREE.Vector3(0.17, 0.37, -0.91).multiplyScalar(10)] },
  };
  function setLighting({ fill: [sky, ground, fi], sun: [color, si, pos] }) {
    fill.color.set(sky); fill.groundColor.set(ground); fill.intensity = fi;
    sun.color.set(color); sun.intensity = si; sun.position.copy(pos);
  }
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 0.5, far: 30 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const castAndReceive = (obj) => obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Floor and a 1 m grid (a ruler for free).
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x5a6b5a, roughness: 1 }));
  floor.receiveShadow = true;
  root.add(floor);
  const grid = new THREE.GridHelper(60, 60, 0xffffff, 0x99aa99);
  grid.position.y = 0.005;
  grid.material.transparent = true; grid.material.opacity = 0.35;
  root.add(grid);

  // Sky sphere.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -1;
  root.add(sky);
  const starfall = createStarfall();
  root.add(starfall.group);
  let skyMap = null;
  function setSky(kind) {
    skyMap?.dispose();
    skyMap = (skyTextures[kind] || skyTextures.gradient)();
    sky.material.map = skyMap;
    sky.material.needsUpdate = true;
    setLighting(kind === 'anime' ? lighting.night : lighting.day);
  }

  // Geometric solids of different sizes at different distances (parallax and size cues).
  // The blue cube (index 1, 1 m wide) is the object measured in the Lab 1 experiment. It counts as a solid: hidden in 'models' mode.
  const props = new THREE.Group();
  const target = new THREE.Group();
  root.add(props, target);
  const palette = [0xe4572e, 0x29b6f6, 0xf6c445, 0x8e6bbf, 0x4caf7d];
  // [x, y, z, size]: y is the centre height. Some solids float above the floor, some rest on it (y = size / 2). Shadows show which.
  const specs = [
    [-0.7, 1.2, -4, 0.5], [2.2, 0.5, -4, 1.0], [0, 0.9, -2, 0.3], [7.5, 0.75, -9, 1.5],
    [-5, 1.0, -14, 2.0], [-4, 1.0, 2, 0.6], [4, 0.4, 3, 0.8], [0, 0.5, 6, 1.0],
  ];
  specs.forEach(([x, y, z, s], i) => {
    const m = new THREE.Mesh(
      i % 2 ? new THREE.BoxGeometry(s, s, s) : new THREE.SphereGeometry(s / 2, 24, 16),
      new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.6 }));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    (i === 1 ? target : props).add(m);
  });
  const orbiter = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.25, 0.08, 96, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3 }));
  orbiter.position.set(0, 1.4, -5);
  orbiter.castShadow = orbiter.receiveShadow = true;
  props.add(orbiter);

  // Real-size scale cues: a sofa (2.73 x 1.12 x 0.92 m) and a car (2.54 x 1.15 x 4.36 m). Both glTF files are in metres and are
  // used at their authored size. See public/models/CREDITS.md for the source, the licence and the size check.
  const models = new THREE.Group();
  root.add(models);
  const url = (name) => `${import.meta.env.BASE_URL}models/${name}`;
  let modelsRequested = false;
  function loadModels() {   // about 3 MB: downloaded the first time the sofa and car are asked for, not at page load
    if (modelsRequested) return;
    modelsRequested = true;
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load(url('sofa.glb'), (g) => { g.scene.position.set(-4.4, 0, -5.8); g.scene.rotation.y = 0.5; castAndReceive(g.scene); models.add(g.scene); }, undefined,
      (e) => console.warn('sofa.glb did not load', e));
    loader.load(url('car.glb'), (g) => { g.scene.position.set(-11, 0, -2.5); g.scene.rotation.y = -0.22; castAndReceive(g.scene); models.add(g.scene); }, undefined,
      (e) => console.warn('car.glb did not load', e));
  }

  // mode: 'all' | 'solids' | 'models'. Older saved settings held true or false: treat anything else as 'solids'.
  function setCues(mode) {
    props.visible = mode !== 'models';
    target.visible = mode !== 'models';
    models.visible = mode !== 'solids';
    if (mode !== 'solids') loadModels();
  }

  function setShadows(on) { sun.castShadow = on; }

  setSky(settings.sky);
  setCues(settings.cues);
  setShadows(settings.shadows);

  return {
    root, floor, setSky, setCues, setShadows,
    update(t) {
      if (!settings.reducedMotion) { orbiter.rotation.y = t * 0.6; orbiter.rotation.x = t * 0.3; }
      starfall.group.visible = settings.sky === 'anime' && !settings.reducedMotion;   // no falling stars with reduced motion
      if (starfall.group.visible) starfall.update(t);
    },
  };
}
