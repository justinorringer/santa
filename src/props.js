// Sky-level vehicles and small props, in the same chunky block style + toon materials as the characters.
import * as THREE from 'three';
import { part, box, cyl, cone, rock, chunk, tone, glow, toon, stick, fuse } from './kit.js';

const P = (geo, color, x, y, z, rot, scale) => part(geo, typeof color === 'string' ? tone(color) : color, x, y, z, rot, scale);
const both = (fn) => [-1, 1].flatMap(fn);

const WOOD = '#9A6532', DARK_WOOD = '#5E3B1C', ROPE = '#C9A26B', CREAM = '#F1EDE4', RED = '#D62828', GREEN = '#2D9C4A', GOLD = '#F4C430', STEEL = '#D5DCE8', INK = '#1B1B1E';

/** Fuselage block: the deck (top) stays level while the belly rises toward the tapered tail (-z). */
const hullGeo = (w, h, d, taper, seed) => chunk(w, h, d, seed, taper).rotateZ(Math.PI);
/** Bow block: narrows toward +z with the keel rising. */
const bowGeo = (w, h, d, taper, seed) => chunk(w, h, d, seed, taper).rotateX(Math.PI);

/** Spinning propeller: a group named 'prop' whose blades lie in its local XY plane (the game spins rotation.z). */
function propeller(r, blade, hub) {
  const g = new THREE.Group();
  g.name = 'prop';
  const mat = tone(blade);
  g.add(fuse([part(box(r * 2, 0.14, 0.035), mat, 0, 0, 0), part(box(0.14, r * 2, 0.035), mat, 0, 0, 0)], mat));
  g.add(P(cone(0.09, 0.18, 5), hub, 0, 0, 0.07, [Math.PI / 2, 0, 0]));
  return g;
}
/** Little flag: pole from `foot` to `top`, cloth trailing along `dir` ([dx, dz], unit-ish) just under the top. */
function flag(foot, top, dir, cloth, len = 0.3, h = 0.18, emblem = null) {
  const yaw = Math.atan2(dir[0], dir[1]);
  const cx = top[0] + dir[0] * len / 2, cz = top[2] + dir[1] * len / 2, cy = top[1] - h / 2 - 0.02;
  const out = [stick(foot, top, 0.028, tone(DARK_WOOD)), P(box(0.03, h, len), cloth, cx, cy, cz, [0, yaw, 0])];
  if (emblem) out.push(P(box(0.045, h * 0.42, len * 0.34), emblem, cx, cy, cz, [0, yaw, 0]));
  return out;
}
/** Low cockpit coaming round where the rider stands (two side rails + a back rest), fused into one mesh. */
function coaming(halfW, len, zc, backW, color) {
  const mat = tone(color);
  return fuse([
    ...both((s) => [part(chunk(0.1, 0.16, len, 203), mat, s * halfW, 0.04, zc)]),
    part(chunk(backW, 0.22, 0.14, 204), mat, 0, 0.07, zc - len / 2 - 0.02),
  ], mat);
}

// ------------------------------------------------------------------ aircraft
// The rider's feet are at the origin, facing +Z. Nothing sits above the rider: lift is at the sides / behind / below.

function plane() { // elf: tiny single-prop plane, open cockpit, stubby patched wings
  const g = new THREE.Group();
  g.add(P(hullGeo(0.86, 0.42, 1.16, 0.6, 201), GREEN, 0, -0.2, -0.06));
  g.add(P(chunk(0.72, 0.46, 0.3, 202), RED, 0, -0.17, 0.6)); // engine cowl
  const prop = propeller(0.44, STEEL, GOLD);
  prop.position.set(0, -0.17, 0.78);
  g.add(prop);
  g.add(P(box(0.56, 0.2, 0.05), '#BFE9F8', 0, 0.1, 0.46, [-0.35, 0, 0])); // windscreen
  g.add(coaming(0.43, 0.86, -0.02, 0.66, '#1E7A38'));
  g.add(P(chunk(1.6, 0.09, 0.52, 205), CREAM, 0, -0.16, 0.14)); // wing
  g.add(fuse(both((s) => [part(chunk(0.2, 0.11, 0.56, 206), tone(RED), s * 0.78, -0.16, 0.14)]), tone(RED))); // wing tips
  g.add(P(box(0.22, 0.03, 0.2), ROPE, -0.58, -0.11, 0.2, [0, 0.3, 0])); // patch
  g.add(P(chunk(0.8, 0.07, 0.28, 207), CREAM, 0, -0.1, -0.62)); // tailplane
  g.add(P(chunk(0.09, 0.4, 0.3, 208), RED, 0, 0.08, -0.64)); // fin (behind the rider, not above)
  g.add(...flag([0, 0.2, -0.7], [0, 0.56, -0.74], [0, -1], GOLD, 0.2, 0.14));
  g.add(fuse(both((s) => [ // sleigh-runner skids
    part(box(0.08, 0.06, 0.9), tone(DARK_WOOD), s * 0.3, -0.52, 0.12),
    stick([s * 0.3, -0.5, 0.4], [s * 0.3, -0.36, 0.34], 0.03, tone(DARK_WOOD)),
    stick([s * 0.3, -0.5, -0.2], [s * 0.3, -0.34, -0.14], 0.03, tone(DARK_WOOD)),
  ]), tone(DARK_WOOD)));
  return g;
}

function biplane() { // reindeer: pointed nose, two stacked wings low on the fuselage, swept tail
  const g = new THREE.Group();
  const CRIMSON = '#C8102E';
  g.add(P(hullGeo(0.8, 0.42, 1.2, 0.45, 211), CRIMSON, 0, -0.2, -0.1));
  g.add(P(cone(0.4, 0.42, 4).rotateY(Math.PI / 4).rotateX(Math.PI / 2).scale(1.3, 0.72, 1), GOLD, 0, -0.2, 0.69)); // nose
  const prop = propeller(0.4, GOLD, INK);
  prop.position.set(0, -0.2, 0.9);
  g.add(prop);
  g.add(P(box(0.5, 0.2, 0.05), '#BFE9F8', 0, 0.1, 0.44, [-0.5, 0, 0]));
  g.add(coaming(0.4, 0.86, -0.05, 0.6, '#7A0C1E'));
  g.add(P(chunk(1.9, 0.08, 0.5, 212), GOLD, 0, -0.26, 0.05)); // lower wing, full span
  g.add(fuse(both((s) => [part(chunk(0.5, 0.08, 0.46, 213), tone(CRIMSON), s * 0.72, 0.22, 0.2)]), tone(CRIMSON))); // upper wing halves, clear of the rider
  g.add(fuse(both((s) => [ // struts
    stick([s * 0.56, -0.24, 0.2], [s * 0.56, 0.2, 0.32], 0.03, tone(DARK_WOOD)),
    stick([s * 0.9, -0.24, -0.06], [s * 0.9, 0.2, 0.1], 0.03, tone(DARK_WOOD)),
    stick([s * 0.9, -0.24, 0.2], [s * 0.56, 0.2, 0.1], 0.02, tone(DARK_WOOD)),
  ]), tone(DARK_WOOD)));
  g.add(P(chunk(0.08, 0.44, 0.32, 214), GOLD, 0, 0.06, -0.68, [-0.45, 0, 0])); // swept fin
  g.add(fuse(both((s) => [part(chunk(0.46, 0.07, 0.26, 215), tone(CRIMSON), s * 0.3, -0.1, -0.68, [0, -s * 0.35, 0])]), tone(CRIMSON))); // swept tailplane
  g.add(...flag([0.92, 0.24, 0.2], [0.92, 0.56, 0.2], [0, -1], INK, 0.26, 0.15, CREAM)); // jolly-roger pennant on the wing tip
  return g;
}

function airship() { // Mrs. Claus: flying boat with gas-bags on side outriggers and a stern flag
  const g = new THREE.Group();
  g.add(P(hullGeo(0.96, 0.44, 1.2, 0.8, 221), WOOD, 0, -0.21, -0.12));
  g.add(P(bowGeo(0.96, 0.44, 0.46, 0.3, 222), WOOD, 0, -0.21, 0.7));
  const dark = tone(DARK_WOOD);
  g.add(fuse([ // gunwale all round
    ...both((s) => [part(chunk(0.1, 0.16, 1.2, 223), dark, s * 0.47, 0.04, -0.12)]),
    part(chunk(0.9, 0.2, 0.12, 224), dark, 0, 0.06, -0.72),
  ], dark));
  g.add(stick([-0.8, -0.1, 0], [0.8, -0.1, 0], 0.045, dark)); // outrigger beam
  for (const s of [-1, 1]) g.add(P(rock(0.27, 1), s < 0 ? RED : GREEN, s * 0.78, 0.2, 0, null, [1, 0.95, 1.35])); // gas-bags, at the sides
  g.add(fuse(both((s) => [part(cyl(0.278, 0.278, 0.07, 8), tone(CREAM), s * 0.78, 0.2, 0, null, [1, 1, 1.35])]), tone(CREAM))); // bag bands
  g.add(fuse(both((s) => [ // rigging
    stick([s * 0.62, 0.3, 0.26], [s * 0.47, 0.1, 0.38], 0.016, tone(ROPE)),
    stick([s * 0.62, 0.3, -0.26], [s * 0.47, 0.1, -0.5], 0.016, tone(ROPE)),
  ]), tone(ROPE)));
  g.add(...flag([0, -0.05, -0.7], [0, 0.82, -0.74], [0, -1], INK, 0.28, 0.22, CREAM)); // stern flag on a short mast behind her
  const prop = propeller(0.3, STEEL, GOLD);
  prop.position.set(0, -0.26, -0.8);
  prop.rotation.y = Math.PI;
  g.add(prop);
  g.add(stick([0, 0, 0.8], [0, 0.16, 1.0], 0.03, dark)); // bowsprit
  g.add(P(rock(0.07), glow('#FFD23F', 0.8), 0, 0.08, 1.0)); // bow lantern
  g.add(P(box(0.03, 0.16, 0.22), ROPE, 0.49, -0.2, 0.1, [0, 0, 0.1])); // hull patch
  return g;
}

/** kind: 'plane' (elf), 'biplane' (reindeer), 'airship' (Mrs. Claus). The rider stands at the origin, facing +Z. */
export function makeAircraft(kind) {
  return kind === 'biplane' ? biplane() : kind === 'airship' ? airship() : plane();
}

// ------------------------------------------------------------------ gondola
/** Floating platform a gadget stands on in the sky. The gadget's feet are at the origin (deck top is y = 0). */
export function makeGondola() {
  const g = new THREE.Group();
  const WICKER = '#B9853F', dark = tone('#7A5326');
  g.add(P(cyl(0.47, 0.38, 0.42, 8), WICKER, 0, -0.22, 0)); // basket
  g.add(P(cyl(0.44, 0.41, 0.08, 8), dark, 0, -0.25, 0)); // weave band
  g.add(P(cyl(0.53, 0.53, 0.09, 8), dark, 0, -0.045, 0)); // rim
  g.add(P(cyl(0.45, 0.45, 0.03, 8), '#D8B27A', 0, -0.012, 0)); // plank deck: its top is the gadget's floor
  const bags = [[-0.59, 0.06, RED], [0.59, 0.06, GREEN], [0, -0.59, GOLD]]; // small balloons hugging the rim: sides + back
  for (const [x, z, c] of bags) g.add(P(rock(0.16, 1), c, x, -0.07, z, null, [1, 1.1, 1]));
  g.add(fuse(bags.flatMap(([x, z]) => [
    part(cone(0.05, 0.08, 5), tone(ROPE), x, -0.27, z, [Math.PI, 0, 0]),
    stick([x, -0.3, z], [x * 0.62, -0.4, z * 0.62], 0.014, tone(ROPE)),
  ]), tone(ROPE)));
  g.add(fuse(bags.map(([x, z]) => stick([x * 0.6, -0.16, z * 0.6], [x * 1.02, -0.16, z * 1.02], 0.03, dark)), dark)); // outriggers
  g.add(...flag([-0.47, -0.3, -0.47], [-0.47, 0.52, -0.47], [-0.707, -0.707], INK, 0.24, 0.17, CREAM)); // pirate flag, outside the gadget's column
  return g;
}

// ------------------------------------------------------------------ cookies
let glassMat = null;
/** Plate of chunky chocolate-chip cookies + a glass of milk. Each cookie is a group named 'cookie' (eaten one at a time). */
export function makeCookies() {
  const g = new THREE.Group();
  g.add(P(cyl(0.27, 0.2, 0.05, 8), '#FFFFFF', -0.08, 0.025, 0));
  g.add(P(cyl(0.2, 0.2, 0.012, 8), '#DCE6EE', -0.08, 0.052, 0)); // plate well
  const dough = tone('#C68642'), chip = tone('#4A2A16'), disc = cyl(0.115, 0.125, 0.06, 7);
  const cookie = (x, y, z, rx, rz, turn) => {
    const c = new THREE.Group();
    c.name = 'cookie';
    c.add(part(disc, dough, 0, 0, 0));
    c.add(fuse([[0.04, 0.03], [-0.05, 0.02], [0.0, -0.06], [-0.03, -0.01], [0.06, -0.04]].map(([cx, cz], i) => part(box(0.035, 0.03, 0.035), chip, cx, 0.03, cz, [0, i, 0])), chip));
    c.position.set(x, y, z);
    c.rotation.set(rx, turn, rz);
    return c;
  };
  g.add(cookie(-0.17, 0.09, 0.06, 0, 0, 0.3), cookie(0.0, 0.09, 0.07, 0, 0, 1.2), cookie(-0.09, 0.09, -0.11, 0, 0, 2.2));
  g.add(cookie(-0.1, 0.15, 0.03, 0.12, -0.1, 0.8), cookie(-0.02, 0.2, -0.02, -0.35, 0.3, 1.7));
  g.add(P(cyl(0.075, 0.062, 0.2, 8), '#FFFFFF', 0.26, 0.1, 0.02)); // milk
  const glass = part(cyl(0.09, 0.075, 0.26, 8), (glassMat ||= toon({ color: '#CFE6F2', transparent: true, opacity: 0.4, depthWrite: false, flatShading: true })), 0.26, 0.13, 0.02);
  glass.castShadow = false;
  g.add(glass);
  return g;
}
