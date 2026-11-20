import * as THREE from 'three';
import { wonkyBox, part, cone, cyl, rock, box, flat } from './kit.js';
import { makeGift } from './models.js';

export const COLS = 16;
export const ROWS = 10;
export const key = (x, z) => x + ',' + z;

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
  const gold = new THREE.MeshLambertMaterial({ color: '#FFD23F', emissive: '#F4A300', emissiveIntensity: 0.5, flatShading: true });
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

// ---------------------------------------------------------------- theme
/**
 * Builds the scenery for a level. Returns { group, blocked:Set, buildable(x,z), grumpY, lights, bg, flying }
 */
export function buildTheme(level, path) {
  const T = THEMES[level.theme];
  const r = rng(level.seed);
  const group = new THREE.Group();
  const blocked = new Set();
  const [gx, gz] = level.grump;
  blocked.add(key(gx, gz));
  const isPath = (x, z) => path.cells.has(key(x, z));
  const nearPath = (x, z) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (isPath(x + dx, z + dz)) return true;
    return false;
  };

  let skyCells = null;
  if (level.theme === 'sky') {
    skyCells = new Set();
    for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
      if (!isPath(x, z) && nearPath(x, z) && r() < 0.72) skyCells.add(key(x, z));
    }
    skyCells.add(key(gx, gz));
  }

  // decorations that occupy cells
  for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
    if (isPath(x, z) || blocked.has(key(x, z))) continue;
    const roll = r();
    if (level.theme === 'snow' && roll < 0.13) {
      const t = roll < 0.1 ? pineTree(r) : part(rock(0.3, 1), '#FFFFFF', 0, 0.08, 0, null, [1.2, 0.6, 1.1]);
      t.position.x += x + 0.5; t.position.z += z + 0.5;
      group.add(t); blocked.add(key(x, z));
    } else if (level.theme === 'street' && roll < 0.3) {
      const h = house(r);
      h.position.set(x + 0.5, 0, z + 0.5);
      group.add(h); blocked.add(key(x, z));
    } else if (level.theme === 'street' && roll < 0.36) {
      const l = lampPost();
      l.position.set(x + 0.15, 0, z + 0.15);
      group.add(l);
    }
  }

  // board texture (path + tiles painted in one canvas)
  const PX = 64;
  const cv = document.createElement('canvas'); cv.width = COLS * PX; cv.height = ROWS * PX;
  const ctx = cv.getContext('2d');
  for (let x = 0; x < COLS; x++) for (let z = 0; z < ROWS; z++) {
    const px = x * PX, pz = z * PX;
    if (isPath(x, z)) {
      ctx.fillStyle = T.path; ctx.fillRect(px, pz, PX, PX);
    } else if (level.theme === 'sky') {
      if (skyCells.has(key(x, z))) {
        ctx.fillStyle = (x + z) % 2 ? T.tileA : T.tileB;
        ctx.beginPath(); ctx.roundRect(px + 3, pz + 3, PX - 6, PX - 6, 16); ctx.fill();
      }
    } else {
      ctx.fillStyle = (x + z) % 2 ? T.tileA : T.tileB; ctx.fillRect(px, pz, PX, PX);
    }
  }
  // path edges + centre markings
  ctx.strokeStyle = T.pathEdge; ctx.lineWidth = 5;
  for (const c of path.cells.values()) {
    const px = c.x * PX, pz = c.z * PX;
    const edges = [[0, -1, px, pz, px + PX, pz], [0, 1, px, pz + PX, px + PX, pz + PX], [-1, 0, px, pz, px, pz + PX], [1, 0, px + PX, pz, px + PX, pz + PX]];
    for (const [dx, dz, x0, y0, x1, y1] of edges) {
      const nx = c.x + dx, nz = c.z + dz;
      const outside = nx < 0 || nx >= COLS; // path continues off-board at the ends
      if (!isPath(nx, nz) && !outside) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    }
    if (level.theme === 'street') {
      ctx.fillStyle = '#F4D35E';
      if (c.dir.x !== 0) ctx.fillRect(px + PX * 0.3, pz + PX * 0.47, PX * 0.4, PX * 0.06);
      else ctx.fillRect(px + PX * 0.47, pz + PX * 0.3, PX * 0.06, PX * 0.4);
    } else if (level.theme === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(px + PX * (0.3 + ((c.x * 7 + c.z * 3) % 5) * 0.1), pz + PX * 0.5, 7, 4, 0.5, 0, 7); ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), new THREE.MeshLambertMaterial({ map: tex, transparent: level.theme === 'sky' }));
  board.rotation.x = -Math.PI / 2; board.position.set(COLS / 2, 0.01, ROWS / 2); board.receiveShadow = true;
  group.add(board);

  if (T.ground) {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshLambertMaterial({ color: T.ground }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(COLS / 2, 0, ROWS / 2); ground.receiveShadow = true;
    group.add(ground);
  }

  // framing outside the board + goal
  const end = path.pointAt(path.total, new THREE.Vector3());
  let goal;
  if (level.theme === 'snow') {
    for (let i = 0; i < 46; i++) {
      const x = -5 + r() * 27, z = r() < 0.6 ? -4.5 + r() * 3.6 : 10.8 + r() * 4;
      if (x > 14.5 && z > 2) continue;
      const t = pineTree(r, 1.5); t.position.set(x, 0, z); group.add(t);
    }
    for (let i = 0; i < 8; i++) { const t = pineTree(r, 1.4); t.position.set(-2.5 - r() * 3, 0, 4 + r() * 6); group.add(t); }
    goal = warehouse(); goal.position.set(end.x + 2.1, 0, end.z);
  } else if (level.theme === 'sky') {
    for (const k of skyCells) {
      const [x, z] = k.split(',').map(Number);
      const c = cloudPuff(r, 1.25); c.position.set(x + 0.5, -0.32, z + 0.5); group.add(c);
    }
    for (let i = 0; i < 40; i++) {
      const c = cloudPuff(r, 2 + r() * 3, r() < 0.5 ? '#FFFFFF' : '#E4F3FF');
      c.position.set(-12 + r() * 40, -3 - r() * 7, -10 + r() * 30); group.add(c);
    }
    goal = starGate(); goal.position.set(end.x + 1.1, 0, end.z);
  } else {
    for (let i = 0; i < 60; i++) {
      const x = -6 + r() * 28, z = r() < 0.6 ? -5 + r() * 4.3 : 10.6 + r() * 4.5;
      const h = house(r, 1.3 + r() * 0.5); h.position.set(x, 0, z); group.add(h);
    }
    for (let i = 0; i < 10; i++) { const h = house(r, 1.3); h.position.set(-1.5 - r() * 4, 0, 3 + r() * 7); group.add(h); }
    goal = bigTree(); goal.position.set(end.x + 1.8, 0, end.z);
  }
  group.add(goal);

  // grump's perch
  const perch = level.theme === 'sky' ? cloudPuff(r, 1.5) : part(cyl(0.42, 0.48, 0.22, 7), level.theme === 'snow' ? '#DCEAF5' : '#8D93B8', 0, 0.11, 0);
  perch.position.x += gx + 0.5; perch.position.z += gz + 0.5;
  if (level.theme === 'sky') perch.position.y = -0.1;
  group.add(perch);

  // falling snow
  const N = 420;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = -4 + r() * 24; pos[i * 3 + 1] = r() * 10; pos[i * 3 + 2] = -3 + r() * 16; }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.9 }));
  group.add(snow);

  const buildable = (x, z) => x >= 0 && x < COLS && z >= 0 && z < ROWS && !isPath(x, z) && !blocked.has(key(x, z)) && (!skyCells || skyCells.has(key(x, z)));

  return {
    group, blocked, buildable, theme: T, goal,
    grumpY: level.theme === 'sky' ? 0.1 : 0.22,
    flying: level.theme === 'sky',
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
      if (level.theme === 'sky') goal.children[0].rotation.z = t * 0.6;
    },
  };
}

// ---------------------------------------------------------------- path traps
const beltCanvas = document.createElement('canvas'); beltCanvas.width = beltCanvas.height = 64;
{
  const ctx = beltCanvas.getContext('2d');
  ctx.fillStyle = '#34343C'; ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 6; ctx.lineJoin = 'miter';
  for (const y of [8, 40]) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(32, y + 16); ctx.lineTo(54, y); ctx.stroke(); }
}
export const beltTex = new THREE.CanvasTexture(beltCanvas);
beltTex.colorSpace = THREE.SRGBColorSpace; beltTex.wrapS = beltTex.wrapT = THREE.RepeatWrapping;
const beltMat = new THREE.MeshLambertMaterial({ map: beltTex });

/** Conveyor: chevrons point along local +z; rotate so +z is the push direction. */
export function makeConveyor() {
  const g = new THREE.Group();
  g.add(part(box(0.86, 0.1, 0.96), '#22222A', 0, 0.06, 0));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.96), beltMat);
  top.rotation.x = -Math.PI / 2; top.position.y = 0.115;
  g.add(top);
  for (const s of [-1, 1]) g.add(part(box(0.08, 0.16, 0.98), '#E63946', s * 0.4, 0.09, 0));
  for (const z of [-0.48, 0.48]) g.add(part(cyl(0.07, 0.07, 0.8, 6), '#8D93A8', 0, 0.08, z, [0, 0, Math.PI / 2]));
  return g;
}

export function makeSpikes() {
  const g = new THREE.Group();
  g.add(part(box(0.9, 0.07, 0.9), '#4A4E63', 0, 0.045, 0));
  const steel = flat('#D5DCE8');
  const sp = new THREE.Group(); sp.name = 'spikes';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) sp.add(part(cone(0.085, 0.34, 4), steel, -0.27 + i * 0.27, 0.22, -0.27 + j * 0.27, [0, (i + j) * 0.7, 0]));
  g.add(sp);
  return g;
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
