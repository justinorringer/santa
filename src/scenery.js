import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { wonkyBox, part, cone, cyl, rock, box, flat, glow, toon } from './kit.js';
import { makeGift } from './models.js';
import { COLS, ROWS, key, distToPaths } from './path.js';

export { COLS, ROWS, key };


function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const THEMES = {
  snow: { bg: '#BFE3F5', ground: '#EAF4FB', tileA: '#F6FBFF', tileB: '#ECF5FC', path: '#B9CBD9', pathEdge: '#9FB4C6', hemi: [0xffffff, 0xa8c4d8, 1.15], sun: [0xfff4e0, 1.5] },
  sky: { bg: '#7EC8F2', ground: null, tileA: '#FFFFFF', tileB: '#F3FAFF', path: 'rgba(255,236,170,0.8)', pathEdge: 'rgba(255,214,110,0.95)', hemi: [0xffffff, 0x9fd2f5, 1.3], sun: [0xfff6d8, 1.4] },
  street: { bg: '#3A3E7A', ground: '#DDE6F2', tileA: '#EEF3FA', tileB: '#E2EAF5', path: '#4A4E63', pathEdge: '#373A4C', hemi: [0xcfd6ff, 0x6a6fa0, 1.25], sun: [0xffe2c4, 1.25] },
};

// ---------------------------------------------------------------- props
function pineTree(r, s = 1) {
  const g = new THREE.Group();
  g.add(part(cyl(0.07, 0.09, 0.3, 5), '#6B4226', 0, 0.15, 0));
  const greens = ['#2F7D4F', '#2A6E46', '#3B8C5A'];
  for (let i = 0; i < 3; i++) {
    g.add(part(cone(0.42 - i * 0.1, 0.5, 6), greens[i], 0, 0.5 + i * 0.3, 0, [0, r() * 3, 0]));
    g.add(part(cone(0.3 - i * 0.08, 0.2, 6), '#FFFFFF', 0, 0.72 + i * 0.3, 0, [0, r() * 3, 0]));
  }
  g.scale.setScalar(s * (0.8 + r() * 0.5));
  g.rotation.y = r() * 6;
  return g;
}

function cloudPuff(r, s = 1, color = '#FFFFFF') {
  const g = new THREE.Group();
  const m = flat(color);
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const p = part(rock(0.34 + r() * 0.16, 1), m, (r() - 0.5) * 0.6, (r() - 0.5) * 0.08, (r() - 0.5) * 0.5, [r() * 3, r() * 3, 0], [1, 0.62, 1]);
    p.castShadow = false;
    g.add(p);
  }
  g.scale.setScalar(s);
  return g;
}

const HOUSE_COLORS = ['#F28B82', '#F6C177', '#9AD1B9', '#8FB8ED', '#C9A0DC', '#F4A7C3', '#FFE08A'];
const ROOF_COLORS = ['#7A3B46', '#3F5F8A', '#5B4A8A', '#8A4B2D', '#2F6F6A'];
const windowMat = new THREE.MeshBasicMaterial({ color: '#FFE08A' });
function house(r, s = 1) {
  const g = new THREE.Group();
  const w = 0.62 + r() * 0.14, h = 0.55 + r() * 0.5;
  const wall = HOUSE_COLORS[Math.floor(r() * HOUSE_COLORS.length)];
  const body = part(wonkyBox(w, h, w, { taper: 1, wonk: 0.06, seed: Math.floor(r() * 99) }), wall, 0, h / 2, 0);
  g.add(body);
  const roofH = 0.4 + r() * 0.3;
  g.add(part(cone(w * 0.86, roofH, 4), ROOF_COLORS[Math.floor(r() * ROOF_COLORS.length)], 0, h + roofH / 2 - 0.02, 0, [0, Math.PI / 4, 0]));
  g.add(part(cone(w * 0.5, roofH * 0.55, 4), '#FFFFFF', 0, h + roofH * 0.74, 0, [0, Math.PI / 4, 0]));
  g.add(part(box(0.12, 0.3, 0.12), '#8A5A4A', w * 0.25, h + roofH * 0.55, -w * 0.2));
  g.add(part(box(0.16, 0.26, 0.03), '#5A3A2A', 0, 0.13, w / 2 + 0.01));
  for (const sx of [-1, 1]) {
    const win = new THREE.Mesh(box(0.13, 0.13, 0.03), windowMat);
    win.position.set(sx * w * 0.27, h * 0.62, w / 2 + 0.012);
    g.add(win);
    const win2 = new THREE.Mesh(box(0.03, 0.13, 0.13), windowMat);
    win2.position.set(sx * (w / 2 + 0.012), h * 0.62, 0);
    g.add(win2);
  }
  g.rotation.set((r() - 0.5) * 0.08, (r() - 0.5) * 0.5, (r() - 0.5) * 0.1);
  g.scale.setScalar(s);
  return g;
}

function lampPost() {
  const g = new THREE.Group();
  g.add(part(cyl(0.025, 0.035, 0.8, 5), '#2B2D42', 0, 0.4, 0));
  const bulb = new THREE.Mesh(rock(0.08), new THREE.MeshBasicMaterial({ color: '#FFE9A8' }));
  bulb.position.y = 0.85;
  g.add(bulb);
  return g;
}

function signTexture(text, bg, fg) {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = fg; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = fg; ctx.font = 'bold 26px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function warehouse() {
  const g = new THREE.Group();
  g.add(part(wonkyBox(3.2, 2.0, 4.2, { taper: 1, wonk: 0.02, bulge: 0.02, pinch: 0.02 }), '#B5543A', 0, 1.0, 0));
  g.add(part(box(3.5, 0.25, 4.5), '#FFFFFF', 0, 2.1, 0));
  g.add(part(cone(2.9, 1.1, 4), '#F4F9FF', 0, 2.75, 0, [0, Math.PI / 4, 0], [1, 1, 1.3]));
  g.add(part(box(0.1, 1.3, 1.5), '#3A2A2A', -1.62, 0.65, 0)); // door (faces -x)
  g.add(part(box(0.12, 1.45, 0.14), '#F4C430', -1.63, 0.72, -0.82));
  g.add(part(box(0.12, 1.45, 0.14), '#F4C430', -1.63, 0.72, 0.82));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: signTexture("SANTA'S WAREHOUSE", '#1E6B34', '#FFE08A') }));
  sign.position.set(-1.66, 1.72, 0); sign.rotation.y = -Math.PI / 2;
  g.add(sign);
  g.add(part(box(0.4, 0.9, 0.4), '#8A4B2D', 0.8, 2.9, -1.0));
  for (const [x, z, s] of [[-2.1, 1.5, 0.9], [-2.3, 2.0, 0.7], [-1.95, 1.9, 0.6], [-2.2, -1.6, 0.8]]) {
    const gift = makeGift(Math.floor(Math.abs(x * 7 + z * 3)));
    gift.position.set(x, 0.21 * s, z); gift.scale.setScalar(s); gift.rotation.y = x;
    g.add(gift);
  }
  return g;
}

function starGate() {
  const g = new THREE.Group();
  const gold = toon({ color: '#FFD23F', emissive: '#F4A300', emissiveIntensity: 0.5, flatShading: true });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.16, 5, 10), gold);
  ring.position.y = 1.2; ring.rotation.y = Math.PI / 2;
  g.add(ring);
  g.add(part(new THREE.OctahedronGeometry(0.32), gold, 0, 2.7, 0));
  const r = rng(77);
  const c = cloudPuff(r, 2.6); c.position.y = -0.3; g.add(c);
  return g;
}

function bigTree() {
  const g = new THREE.Group();
  g.add(part(cyl(0.2, 0.26, 0.6, 6), '#6B4226', 0, 0.3, 0));
  const lights = ['#FFD23F', '#E63946', '#3E7CB1', '#F4A7C3'];
  for (let i = 0; i < 4; i++) {
    const rad = 1.3 - i * 0.28;
    g.add(part(cone(rad, 1.0, 7), i % 2 ? '#2F7D4F' : '#2A6E46', 0, 0.9 + i * 0.62, 0, [0, i, 0]));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + i;
      const b = new THREE.Mesh(rock(0.07), new THREE.MeshBasicMaterial({ color: lights[(k + i) % 4] }));
      b.position.set(Math.cos(a) * rad * 0.74, 0.62 + i * 0.62, Math.sin(a) * rad * 0.74);
      g.add(b);
    }
  }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: '#FFE08A' }));
  star.position.y = 3.55; star.name = 'spin';
  g.add(star);
  return g;
}

// ---------------------------------------------------------------- instanced forest + mountains
function colored(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(hex), n = g.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
const at = (geo, x, y, z, ry = 0) => geo.rotateY(ry).translate(x, y, z);
let treeGeo;
function getTreeGeo() {
  if (treeGeo) return treeGeo;
  const parts = [colored(at(cyl(0.07, 0.09, 0.3, 5), 0, 0.15, 0), '#6B4226')];
  const greens = ['#2F7D4F', '#2A6E46', '#3B8C5A'];
  for (let i = 0; i < 3; i++) {
    parts.push(colored(at(cone(0.42 - i * 0.1, 0.5, 6), 0, 0.5 + i * 0.3, 0, i * 0.5), greens[i]));
    parts.push(colored(at(cone(0.3 - i * 0.08, 0.2, 6), 0, 0.72 + i * 0.3, 0, i * 0.5 + 0.3), '#FFFFFF'));
  }
  treeGeo = mergeGeometries(parts);
  return treeGeo;
}
const vcMat = toon({ vertexColors: true, flatShading: true });
/** One draw call for every pine: list of [x, z, scale, rotY]. */
function forest(list) {
  const m = new THREE.InstancedMesh(getTreeGeo(), vcMat, list.length);
  const o = new THREE.Object3D();
  list.forEach(([x, z, sc, ry], i) => { o.position.set(x, 0, z); o.scale.setScalar(sc); o.rotation.y = ry; o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.castShadow = true;
  m.frustumCulled = false;
  return m;
}
/** Low-poly snow-capped peaks merged into one mesh: list of [x, z, radius, height]. */
function mountains(list, r) {
  const parts = [];
  for (const [x, z, rad, h] of list) {
    const g = new THREE.ConeGeometry(rad, h, 7, 3).toNonIndexed();
    const pos = g.attributes.position;
    const seen = new Map();
    for (let i = 0; i < pos.count; i++) { // jitter shared vertices identically so faces stay joined
      const k = pos.getX(i).toFixed(2) + ',' + pos.getY(i).toFixed(2) + ',' + pos.getZ(i).toFixed(2);
      if (!seen.has(k)) seen.set(k, [(r() - 0.5) * rad * 0.28, (r() - 0.5) * h * 0.08, (r() - 0.5) * rad * 0.28]);
      const [dx, dy, dz] = seen.get(k);
      const tip = pos.getY(i) > h * 0.49 ? 0.3 : 1;
      pos.setXYZ(i, pos.getX(i) + dx * tip, pos.getY(i) + dy * tip, pos.getZ(i) + dz * tip);
    }
    const col = new Float32Array(pos.count * 3);
    const rockA = new THREE.Color('#8E9AAF'), rockB = new THREE.Color('#77839A'), snow = new THREE.Color('#FFFFFF');
    for (let f = 0; f < pos.count; f += 3) {
      const cy = (pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3 / h + 0.5; // 0 base .. 1 tip
      const c = cy > 0.52 + (r() - 0.5) * 0.12 ? snow : r() < 0.5 ? rockA : rockB;
      for (let v = 0; v < 3; v++) { col[(f + v) * 3] = c.r; col[(f + v) * 3 + 1] = c.g; col[(f + v) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.rotateY(r() * 6).translate(x, h / 2 - 0.2, z);
    parts.push(g);
  }
  const m = new THREE.Mesh(mergeGeometries(parts), vcMat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function rockOutcrop(r) {
  const g = new THREE.Group();
  g.add(part(rock(0.36, 0), '#8E9AAF', 0, 0.2, 0, [r() * 3, r() * 3, 0], [1.1, 1.3, 1]));
  g.add(part(rock(0.24, 0), '#77839A', 0.24, 0.12, 0.14, [r() * 3, r() * 3, 0]));
  g.add(part(rock(0.2, 0), '#FFFFFF', -0.04, 0.5, 0, [r() * 3, r() * 3, 0], [1.2, 0.5, 1.1]));
  g.rotation.y = r() * 6;
  return g;
}
function stormCloud(r) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const c = cloudPuff(r, 1.05 - i * 0.18, i === 0 ? '#8FA3BF' : '#A9B9CF'); c.position.y = 0.1 + i * 0.5; g.add(c); }
  return g;
}

// ---------------------------------------------------------------- theme
// The painted ground covers far more than the playfield so paths can run off-screen.
const EX0 = -14, EX1 = 30, EZ0 = -10, EZ1 = 18;
/**
 * Builds the scenery for a level around its winding paths.
 * Returns { group, blocked, opaque (tiles that block line of sight), lake (ice-only tiles),
 *           buildable(x, z, ice), theme, goal, santaSpot, flying, tick }
 */
export function buildTheme(level, paths) {
  const T = THEMES[level.theme];
  const r = rng(level.seed);
  const group = new THREE.Group();
  const blocked = new Set(), opaque = new Set(), lake = new Set();
  const sky = level.theme === 'sky';
  const dist = (x, z) => distToPaths(paths, x, z);
  const onPath = (x, z) => dist(x + 0.5, z + 0.5) < 0.82; // tile is too close to the road to build on
  const inBoard = (x, z) => x >= 0 && x < COLS && z >= 0 && z < ROWS;
  const main = paths[0];
  const end = main.pointAt(main.total, new THREE.Vector3());

  // goal + the spot beside it where Santa frets between waves
  let goal;
  if (level.theme === 'snow') { goal = warehouse(); goal.position.set(end.x + 1.5, 0, end.z); }
  else if (sky) { goal = starGate(); goal.position.set(end.x + 0.6, 0, end.z); }
  else { goal = bigTree(); goal.position.set(end.x + 1.3, 0, end.z); }
  group.add(goal);
  const santaSpot = new THREE.Vector3(end.x - 1.1, 0, end.z + 1.9);
  const sk = key(Math.floor(santaSpot.x), Math.floor(santaSpot.z));
  blocked.add(sk);
  if (sky) { const c = cloudPuff(r, 1.7); c.position.copy(santaSpot).setY(-0.36); group.add(c); }

  // frozen lake: only frost folk can stand on it
  const L = level.lake;
  if (L) for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
    if (!onPath(x, z) && ((x + 0.5 - L.x) / L.rx) ** 2 + ((z + 0.5 - L.z) / L.rz) ** 2 < 0.92) lake.add(key(x, z));
  }

  // rocky peaks standing on the board: they take up tiles and block line of sight
  const peaks = [];
  for (const [px, pz, rad, h] of level.peaks || []) {
    peaks.push([px, pz, rad, h]);
    for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
      if (!onPath(x, z) && Math.hypot(x + 0.5 - px, z + 0.5 - pz) < rad * 0.8) { blocked.add(key(x, z)); opaque.add(key(x, z)); }
    }
  }

  let skyCells = null;
  if (sky) {
    skyCells = new Set();
    for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
      const d = dist(x + 0.5, z + 0.5);
      if (d >= 0.82 && d < 2.3 && r() < 0.78) skyCells.add(key(x, z));
    }
  }

  // decorations that occupy tiles
  const trees = [];
  for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
    const k = key(x, z);
    if (onPath(x, z) || blocked.has(k) || lake.has(k)) continue;
    const roll = r();
    if (level.theme === 'snow' && roll < 0.12) {
      if (roll < 0.08) trees.push([x + 0.5, z + 0.5, 0.85 + r() * 0.45, r() * 6]);
      else { const o = rockOutcrop(r); o.position.set(x + 0.5, 0, z + 0.5); group.add(o); }
      blocked.add(k); opaque.add(k);
    } else if (level.theme === 'street' && roll < 0.3) {
      const h = house(r);
      h.position.set(x + 0.5, 0, z + 0.5);
      group.add(h); blocked.add(k); opaque.add(k);
    } else if (level.theme === 'street' && roll < 0.36) {
      const l = lampPost();
      l.position.set(x + 0.15, 0, z + 0.15);
      group.add(l);
    } else if (sky && ((roll < 0.06 && dist(x + 0.5, z + 0.5) > 2.3) || (roll < 0.13 && skyCells.has(k)))) {
      const c = stormCloud(r); // thunderheads block the view
      c.position.set(x + 0.5, 0, z + 0.5);
      group.add(c); blocked.add(k); opaque.add(k);
    }
  }

  // ground texture: no grid, just terrain with the roads winding across it
  const PX = 40, W = EX1 - EX0, H = EZ1 - EZ0;
  const cv = document.createElement('canvas'); cv.width = W * PX; cv.height = H * PX;
  const ctx = cv.getContext('2d');
  const cx = (x) => (x - EX0) * PX, cz = (z) => (z - EZ0) * PX;
  if (!sky) {
    ctx.fillStyle = T.ground; ctx.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 260; i++) { // soft drifts so the ground is not one flat colour
      ctx.fillStyle = i % 2 ? T.tileA : T.tileB;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.ellipse(r() * cv.width, r() * cv.height, 30 + r() * 90, 14 + r() * 40, r() * 3, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (L) {
    ctx.fillStyle = '#DCEFFA'; ctx.beginPath(); ctx.ellipse(cx(L.x), cz(L.z), (L.rx + 0.22) * PX, (L.rz + 0.22) * PX, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8FD0EE'; ctx.beginPath(); ctx.ellipse(cx(L.x), cz(L.z), L.rx * PX, L.rz * PX, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#A9DDF5'; ctx.beginPath(); ctx.ellipse(cx(L.x - L.rx * 0.2), cz(L.z - L.rz * 0.15), L.rx * 0.62 * PX, L.rz * 0.6 * PX, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { // skate marks and cracks
      const a = r() * 6, rr = 0.2 + r() * 0.6, len = 0.25 + r() * 0.3;
      const x0 = L.x + Math.cos(a) * L.rx * rr, z0 = L.z + Math.sin(a) * L.rz * rr;
      ctx.beginPath(); ctx.moveTo(cx(x0), cz(z0)); ctx.lineTo(cx(x0 + len), cz(z0 - len * 0.5)); ctx.stroke();
    }
  }
  const trace = (p) => { ctx.beginPath(); p.samples.forEach((s, i) => (i ? ctx.lineTo(cx(s.x), cz(s.z)) : ctx.moveTo(cx(s.x), cz(s.z)))); };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const p of paths) { trace(p); ctx.strokeStyle = T.pathEdge; ctx.lineWidth = PX * 1.02; ctx.stroke(); }
  for (const p of paths) { trace(p); ctx.strokeStyle = T.path; ctx.lineWidth = PX * 0.86; ctx.stroke(); }
  for (const p of paths) {
    if (level.theme === 'street') { trace(p); ctx.strokeStyle = '#F4D35E'; ctx.lineWidth = 3; ctx.setLineDash([14, 16]); ctx.stroke(); ctx.setLineDash([]); }
    else if (level.theme === 'snow') { // footprints
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 4; i < p.samples.length; i += 9) { const s = p.samples[i]; ctx.beginPath(); ctx.ellipse(cx(s.x) + ((i % 2) * 10 - 5), cz(s.z) + ((i % 3) * 5 - 5), 5, 3, 0.5, 0, 7); ctx.fill(); }
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const noOutline = { outlineParameters: { visible: false } };
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W, H), toon({ map: tex, transparent: sky }));
  board.material.userData = noOutline;
  board.rotation.x = -Math.PI / 2; board.position.set((EX0 + EX1) / 2, 0.01, (EZ0 + EZ1) / 2); board.receiveShadow = true;
  group.add(board);
  if (T.ground) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 110), toon({ color: T.ground }));
    ground.material.userData = noOutline;
    ground.rotation.x = -Math.PI / 2; ground.position.set(COLS / 2, 0, ROWS / 2); ground.receiveShadow = true;
    group.add(ground);
  }

  // framing outside the playfield
  const clear = (x, z, pad) => dist(x, z) > pad && Math.hypot(x - goal.position.x, z - goal.position.z) > pad + 2.6 && Math.hypot(x - santaSpot.x, z - santaSpot.z) > 1.3;
  if (level.theme === 'snow') {
    // mountain range along the far edge, foothills just behind the board, shoulders at the sides
    for (let x = EX0 + 1; x < EX1; x += 3.4 + r() * 1.6) peaks.push([x, -6.6 - r() * 2.5, 3.2 + r() * 1.8, 6 + r() * 4.5]);
    for (let x = EX0 + 3; x < EX1; x += 3 + r() * 1.6) peaks.push([x, -2.9 - r() * 1.1, 1.5 + r() * 0.9, 2.4 + r() * 1.8]);
    for (const sx of [-1, 1]) for (let z = -1; z < 13; z += 2.6 + r() * 1.6) {
      const x = sx < 0 ? -3.4 - r() * 3.2 : COLS + 4.6 + r() * 3.2;
      if (clear(x, z, 2.6)) peaks.push([x, z, 1.5 + r() * 1.1, 2.4 + r() * 2.4]);
    }
    for (let x = EX0; x < EX1; x += 0.9) for (let z = EZ0 + 1.5; z < EZ1; z += 0.9) {
      const tx = x + (r() - 0.5) * 0.7, tz = z + (r() - 0.5) * 0.7, roll = r();
      if (tx > -0.7 && tx < COLS + 0.7 && tz > -0.7 && tz < ROWS + 0.9) continue;
      if (roll > 0.86 || !clear(tx, tz, 1.15)) continue;
      if (peaks.some(([mx, mz, rad]) => Math.hypot(tx - mx, tz - mz) < rad * 0.8)) continue;
      trees.push([tx, tz, (tz > ROWS ? 1.0 : 1.25) + r() * 0.7, r() * 6]);
    }
  } else if (sky) {
    for (const k of skyCells) {
      const [x, z] = k.split(',').map(Number);
      const c = cloudPuff(r, 1.25); c.position.set(x + 0.5, -0.4, z + 0.5); group.add(c);
    }
    for (let i = 0; i < 46; i++) {
      const c = cloudPuff(r, 2 + r() * 3, r() < 0.5 ? '#FFFFFF' : '#E4F3FF');
      c.position.set(-14 + r() * 44, -3 - r() * 7, -10 + r() * 30); group.add(c);
    }
  } else {
    for (let i = 0; i < 90; i++) {
      const x = -10 + r() * 36, z = r() < 0.55 ? -6 + r() * 5.2 : 10.7 + r() * 5;
      if (!clear(x, z, 1.3)) continue;
      const h = house(r, 1.3 + r() * 0.5); h.position.set(x, 0, z); group.add(h);
    }
    for (let i = 0; i < 26; i++) {
      const x = i % 2 === 0 ? -1.6 - r() * 8 : COLS + 3.5 + r() * 6, z = -1 + r() * 11;
      if (!clear(x, z, 1.3)) continue;
      const h = house(r, 1.3); h.position.set(x, 0, z); group.add(h);
    }
  }
  if (peaks.length) group.add(mountains(peaks, r));
  if (trees.length) group.add(forest(trees));

  // falling snow
  const N = 520;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = -8 + r() * 32; pos[i * 3 + 1] = r() * 10; pos[i * 3 + 2] = -4 + r() * 18; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9 }));
  group.add(snow);

  /** Can something stand on this tile? Frozen-lake tiles only take ice units. */
  const buildable = (x, z, ice) => {
    const k = key(x, z);
    if (!inBoard(x, z) || onPath(x, z) || blocked.has(k)) return false;
    if (lake.has(k)) return !!ice;
    return !skyCells || skyCells.has(k);
  };

  return {
    group, blocked, opaque, lake, buildable, theme: T, goal, santaSpot,
    flying: sky,
    tick(dt, t) {
      const p = snowGeo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = p.getY(i) - dt * (0.7 + (i % 5) * 0.12);
        if (y < -0.5) y = 10;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.15);
      }
      p.needsUpdate = true;
      const spin = goal.getObjectByName('spin'); if (spin) spin.rotation.y = t * 2;
      if (sky) goal.children[0].rotation.z = t * 0.6;
    },
  };
}

// ---------------------------------------------------------------- path traps
const BELT_COLORS = ['#FFD23F', '#5BC8F5', '#FF5A4F', '#C77DFF'];
export const beltTexs = BELT_COLORS.map((col) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#34343C'; ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineJoin = 'miter';
  for (const y of [8, 40]) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(32, y + 16); ctx.lineTo(54, y); ctx.stroke(); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
});
const beltMats = beltTexs.map((t) => toon({ map: t }));

/** Conveyor: chevrons point along local +z; rotate so +z is the push direction. */
export function makeConveyor(level = 1) {
  const g = new THREE.Group();
  g.add(part(box(0.86, 0.1, 0.96), '#22222A', 0, 0.06, 0));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.96), beltMats[level - 1]);
  top.rotation.x = -Math.PI / 2; top.position.y = 0.115;
  g.add(top);
  const rail = ['#E63946', '#3E7CB1', '#B5202B', '#6A2C91'][level - 1];
  for (const s of [-1, 1]) g.add(part(box(0.08, 0.16 + (level - 1) * 0.03, 0.98), rail, s * 0.4, 0.09, 0));
  for (const z of [-0.48, 0.48]) g.add(part(cyl(0.07, 0.07, 0.8, 6), '#8D93A8', 0, 0.08, z, [0, 0, Math.PI / 2]));
  if (level >= 2) for (const s of [-1, 1]) g.add(part(box(0.1, 0.1, 0.5), '#D5DCE8', s * 0.4, 0.22, 0)); // grease guards
  if (level >= 3) { // reverse gear: warning lights + boosters
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(part(cyl(0.03, 0.03, 0.3, 5), '#22222A', sx * 0.4, 0.3, sz * 0.42));
      const l = part(rock(0.07), glow('#FF3B30', 1), sx * 0.4, 0.48, sz * 0.42); l.castShadow = false; l.name = 'blink';
      g.add(l);
    }
    for (const s of [-1, 1]) g.add(part(cone(0.1, 0.26, 5), '#F4C430', s * 0.4, 0.28, 0.3, [Math.PI / 2, 0, 0]));
  }
  if (level >= 4) { // shredder: toothed rollers
    for (const z of [-0.26, 0.26]) {
      const r = new THREE.Group(); r.name = 'rollx'; r.position.set(0, 0.2, z);
      r.add(part(cyl(0.1, 0.1, 0.66, 6), '#8D93A8', 0, 0, 0, [0, 0, Math.PI / 2]));
      for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + i * 0.5;
        r.add(part(cone(0.045, 0.14, 4), '#D5DCE8', -0.24 + i * 0.16, Math.cos(a) * 0.14, Math.sin(a) * 0.14, [a, 0, 0]));
      }
      g.add(r);
    }
  }
  return g;
}

export function makeSpikes(level = 1) {
  const g = new THREE.Group();
  g.add(part(box(0.9, 0.07, 0.9), ['#4A4E63', '#4A4E63', '#3A6E8F', '#5A4A1E'][level - 1], 0, 0.045, 0));
  const sp = new THREE.Group(); sp.name = 'spikes';
  const mat = [flat('#D5DCE8'), flat('#D5DCE8'), glow('#8FDCFF', 0.55), glow('#F4C430', 0.35)][level - 1];
  const h = [0.34, 0.5, 0.56, 0.6][level - 1];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = -0.27 + i * 0.27, z = -0.27 + j * 0.27;
    if (level === 4 && i === 1 && j === 1) continue;
    const geo = level === 3 ? new THREE.OctahedronGeometry(0.1) : cone(0.085, h, 4);
    sp.add(part(geo, mat, x, h / 2 + 0.05, z, [0, (i + j) * 0.7, 0], level === 3 ? [1, h / 0.2, 1] : null));
    if (level === 2) sp.add(part(cone(0.04, 0.16, 4), flat('#E63946'), x, h + 0.0, z));
  }
  g.add(sp);
  if (level === 4) { // grinder disc
    const disc = new THREE.Group(); disc.name = 'spin'; disc.position.y = 0.2;
    disc.add(part(cyl(0.2, 0.2, 0.08, 8), '#8D93A8', 0, 0, 0));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; disc.add(part(cone(0.06, 0.2, 4), glow('#F4C430', 0.35), Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26, [0, -a, -Math.PI / 2])); }
    g.add(disc);
  }
  return g;
}

/** Pile of coal sitting on the path. setPile(pile, 0..1) shows how much is left. */
export function makeCoalPile(hot) {
  const g = new THREE.Group();
  const cold = flat('#1F1F24');
  const spots = [[0, 0.1, 0, 0.2], [-0.2, 0.08, 0.12, 0.15], [0.2, 0.08, -0.1, 0.16], [0.08, 0.07, 0.24, 0.13], [-0.12, 0.07, -0.22, 0.14], [0.02, 0.27, 0.02, 0.14]];
  spots.forEach(([x, y, z, r], i) => {
    const m = part(new THREE.DodecahedronGeometry(r, 0), hot && i % 2 === 0 ? glow('#FF8C1A', 0.9) : cold, x, y, z, [i, i * 2, i * 3]);
    g.add(m);
  });
  return g;
}
export function setPile(g, ratio) {
  const n = Math.max(1, Math.ceil(ratio * g.children.length));
  g.children.forEach((c, i) => { c.visible = i < n; });
}

export function makeCloudPuff(s = 1) { return cloudPuff(rng(5), s); }

export function makeSleigh() {
  const g = new THREE.Group();
  g.add(part(box(1.5, 0.5, 1.9), '#B5202B', 0, 0.3, 0));
  g.add(part(box(1.5, 0.5, 0.2), '#B5202B', 0, 0.7, -0.85));
  g.add(part(box(1.56, 0.1, 1.96), '#F4C430', 0, 0.56, 0));
  for (const s of [-1, 1]) g.add(part(box(0.1, 0.1, 2.3), '#F4C430', s * 0.6, 0, 0.1));
  return g;
}
