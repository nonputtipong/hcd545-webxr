import * as THREE from 'three';

// Angular size of an object as seen from the camera. A common guideline: a gaze target should cover at least 3 degrees of view.
// Takes the bounding-box corners of the visible meshes in world space and measures the angle between the outermost
// corners, seen from a camera that looks at the object's center. Rotated meshes come out slightly too large (box corners).
// Usage in the console:  hcd.angularSize(hcd.menu.buttons.home.group)   ->  { width, height, min, distance }  (degrees, meters)
//                        hcd.angularSizes()                               ->  table for every gaze target
const _probe = new THREE.PerspectiveCamera();
const _v = new THREE.Vector3();
const _box = new THREE.Box3();
const _centre = new THREE.Vector3();

function visibleChain(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export function angularSize(obj, camera) {
  obj.updateWorldMatrix(true, true);
  _box.setFromObject(obj).getCenter(_centre);
  camera.getWorldPosition(_probe.position);
  _probe.lookAt(_centre);
  _probe.updateMatrixWorld(true);
  const inv = _probe.matrixWorldInverse;
  let h0 = Infinity, h1 = -Infinity, v0 = Infinity, v1 = -Infinity, any = false;
  obj.traverse((m) => {
    if (!m.isMesh || !visibleChain(m)) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox;
    for (let i = 0; i < 8; i++) {
      _v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
      if (_v.z >= 0) continue;   // behind the viewer
      const ah = Math.atan2(_v.x, -_v.z), av = Math.atan2(_v.y, -_v.z);
      h0 = Math.min(h0, ah); h1 = Math.max(h1, ah); v0 = Math.min(v0, av); v1 = Math.max(v1, av); any = true;
    }
  });
  if (!any) return null;
  const deg = (r) => +(THREE.MathUtils.radToDeg(r)).toFixed(1);
  const width = deg(h1 - h0), height = deg(v1 - v0);
  return { width, height, min: Math.min(width, height), distance: +camera.getWorldPosition(_v).distanceTo(_centre).toFixed(2) };
}

// Table of every current gaze target (label, smallest angle, distance, pass/fail against 3 degrees).
export function angularSizes(gaze, camera, threshold = 3) {
  const rows = gaze.targets.filter((t) => t.visible).map((t) => {
    const a = angularSize(t, camera);
    return { label: t.userData.target.label, ...(a || {}), ok: a ? a.min >= threshold : false };
  });
  console.table(rows);
  return rows;
}
