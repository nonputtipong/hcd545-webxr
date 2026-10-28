import * as THREE from 'three';
import { settings } from './settings.js';

// YOUR TURN (W1, Task 4): make this scene yours. Works as-is; change it, then reload on your phone.
//  1. Change the shape, colour, size and position of `mine`. Keep it between 0.5 m and 5 m from the start (0, 0, 0).
//  2. Add a second object that gives a scale cue (something a person knows the size of: a chair 0.45 m seat height, a mug 0.1 m).
//  3. Move or recolour the point light and look at what changes.
export function addMyContent(scene) {
  const mine = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.6, 32),                                     // was a 0.4 m cube: now a cone 0.6 m wide, 0.6 m tall
    new THREE.MeshStandardMaterial({ color: 0xe91e63, roughness: 0.4 }));     // was gold: now pink
  mine.position.set(-1, 1.2, -2.5);                                          // was (1, 1.0, -1.5): now to the left and further away
  scene.add(mine);

  // Scale cue: a chair with a 0.45 m seat height, which most people know from everyday life.
  const wood = new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.8 });
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), wood);
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.05), wood);
  back.position.set(0, 0.7, -0.2);
  chair.add(seat, back);
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), wood);
    leg.position.set(x, 0.225, z);
    chair.add(leg);
  }
  chair.position.set(-1, 0, -2.5);                                           // stands on the floor under the cone
  chair.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  scene.add(chair);

  const light = new THREE.PointLight(0x80d8ff, 8, 6);                         // was warm yellow: now cool blue
  light.position.set(-1, 2, -2);                                             // moved above the cone and chair
  scene.add(light);

  return {
    mine,
    update(t) {
      if (!settings.reducedMotion) mine.rotation.y = t;   // respect reduced motion even in your own animations
    },
  };
}
