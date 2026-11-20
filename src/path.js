// Winding paths: a smooth curve through a few points, sampled so anything can ask
// "where is distance d along it?" Gadgets that sit on the path snap to slots along it.
import * as THREE from 'three';

export const COLS = 16;
export const ROWS = 10;
export const key = (x, z) => x + ',' + z;
const STEP = 0.1;
const tmp = new THREE.Vector3();

/**
 * pts: [[x, z], ...] in world units. index: which path of the level this is.
 * taken: slots already claimed by earlier paths (so shared stretches are not doubled up).
 */
export function buildPath(pts, index = 0, taken = []) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const total = curve.getLength();
  const n = Math.ceil(total / STEP);
  const samples = curve.getSpacedPoints(n);
  const step = total / n;
  function pointAt(d, out, dirOut) {
    const f = Math.max(0, Math.min(n - 1e-4, d / step));
    const i = Math.floor(f);
    const a = samples[i], b = samples[i + 1];
    out.lerpVectors(a, b, f - i);
    tmp.subVectors(b, a).normalize();
    if (dirOut) dirOut.copy(tmp);
    if (d < 0) out.addScaledVector(tmp, d);
    else if (d > total) out.addScaledVector(tmp, d - total);
    return out;
  }
  const slots = [];
  for (let i = 0; i + 0.5 < total; i++) {
    const p = pointAt(i + 0.5, new THREE.Vector3());
    if (p.x < 0.4 || p.x > COLS - 0.4 || p.z < 0.4 || p.z > ROWS - 0.4) continue;
    if (taken.some((s) => Math.hypot(s.x - p.x, s.z - p.z) < 0.7)) continue;
    const dir = new THREE.Vector3();
    pointAt(i + 0.5, tmp.clone(), dir);
    const slot = { k: `p${index}s${i}`, path: index, d: i + 0.5, x: p.x, z: p.z, dir };
    slots.push(slot);
    taken.push(slot);
  }
  return { index, samples, step, total, pointAt, slots };
}

/** Shortest distance from (x, z) to any of the paths. */
export function distToPaths(paths, x, z) {
  let best = Infinity;
  for (const p of paths) {
    for (let i = 0; i < p.samples.length; i += 2) {
      const s = p.samples[i];
      const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}
