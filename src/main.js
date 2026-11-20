import * as THREE from 'three';
import { spawnModel, spawnTower, makeGift } from './models.js';
import { buildTheme, makeConveyor, makeSpikes, makeCoalPile, setPile, makeCloudPuff, makeSleigh, beltTexs, COLS, ROWS, key } from './scenery.js';
import { flat, glow, lump, rock, box } from './kit.js';

// ================================================================ data
const MAX_DELIVERED = 100;
const MAX_LEVEL = 4;

const LEVELS = [
  { name: 'The Warehouse', theme: 'snow', seed: 11, waves: 8, coal: 180, grump: [5, 4],
    blurb: 'Santa is stocking up for the big day. Smash the presents before they reach his warehouse.',
    path: [[-1, 2], [3, 2], [3, 7], [7, 7], [7, 2], [11, 2], [11, 6], [15, 6]] },
  { name: 'Sleigh Lanes', theme: 'sky', seed: 23, waves: 9, coal: 200, grump: [8, 5],
    blurb: 'They took to the clouds. Build on the cloud tops and knock the gifts out of the sky.',
    path: [[-1, 5], [2, 5], [2, 1], [6, 1], [6, 8], [10, 8], [10, 3], [13, 3], [13, 6], [15, 6]] },
  { name: 'Tinsel Street', theme: 'street', seed: 37, waves: 10, coal: 220, grump: [6, 3],
    blurb: 'Delivery night. Stop the crew before the presents make it under the town tree.',
    path: [[-1, 1], [4, 1], [4, 5], [1, 5], [1, 8], [8, 8], [8, 5], [12, 5], [12, 1], [15, 1]] },
];

const ENEMIES = {
  elf: { hp: 80, speed: 1.5, gifts: 1, reward: 5, scale: 0.62 },
  reindeer: { hp: 124, speed: 2.25, gifts: 2, reward: 7, scale: 0.62 },
  mrs_claus: { hp: 500, speed: 1.0, gifts: 4, reward: 16, scale: 0.66 },
  santa: { hp: 3400, speed: 0.72, gifts: 15, reward: 90, scale: 0.92 },
};

// levels[0] is the base gadget; levels[1..3] are the upgrades (name, cost, what changes).
const TOWERS = {
  coal_chucker: { name: 'Coal Chucker', cost: 70, on: 'land', scale: 0.68, desc: 'Lobs coal piles onto the path', levels: [
    { range: 2.3, rate: 2.3, dmg: 14, hits: 4, maxPiles: 5 },
    { name: 'Hot Coals', cost: 80, desc: 'Coals set gifts on fire for 3s', range: 2.3, rate: 2.1, dmg: 16, hits: 5, maxPiles: 6, burn: 8 },
    { name: 'Coal Cart', cost: 130, desc: 'Throws much faster, bigger piles, more reach', range: 2.9, rate: 1.3, dmg: 20, hits: 8, maxPiles: 8, burn: 10 },
    { name: 'Meltdown', cost: 230, desc: 'Used-up piles explode', range: 3.1, rate: 1.1, dmg: 26, hits: 10, maxPiles: 9, burn: 14, explode: 45 },
  ] },
  conveyor: { name: 'Conveyor', cost: 30, on: 'path', desc: 'Drags them the wrong way', levels: [
    { slow: 0.4 },
    { name: 'Greased Rollers', cost: 40, desc: 'Much stronger drag', slow: 0.25 },
    { name: 'Reverse Gear', cost: 90, desc: 'Flings carriers back down the path every 3s', slow: 0.25, kick: 2, kickEvery: 3 },
    { name: 'Gift Shredder', cost: 160, desc: 'Toothed rollers grind gifts while they are stuck', slow: 0.2, kick: 2.5, kickEvery: 2.5, dps: 24 },
  ] },
  spikes: { name: 'Spikes', cost: 45, on: 'path', desc: 'Stabs gifts passing over', levels: [
    { dmg: 18, every: 0.3 },
    { name: 'Sharpened', cost: 50, desc: 'Longer spikes, harder stabs', dmg: 30, every: 0.28 },
    { name: 'Icicles', cost: 100, desc: 'Every stab freezes the carrier', dmg: 36, every: 0.28, freeze: 1.5 },
    { name: 'Gift Grinder', cost: 180, desc: 'Reaches next-door tiles and tears wrapping (+30% damage taken)', dmg: 52, every: 0.25, freeze: 1.5, radius: 1.0, shred: 3 },
  ] },
  evil_reindeer: { name: 'Evil Reindeer', cost: 70, on: 'land', scale: 0.7, desc: 'Rapid sticky spit, slows', levels: [
    { range: 2.6, rate: 0.32, dmg: 4, slow: 0.6, slowT: 1.2, shots: 1 },
    { name: 'Sticky Spit', cost: 70, desc: 'Heavier slow, more damage', range: 2.8, rate: 0.3, dmg: 6, slow: 0.45, slowT: 2, shots: 1 },
    { name: 'Triple Spit', cost: 130, desc: 'Spits at three carriers at once', range: 3.0, rate: 0.3, dmg: 7, slow: 0.45, slowT: 2, shots: 3 },
    { name: 'Acid Rain', cost: 220, desc: 'Spit splashes and keeps corroding gifts', range: 3.4, rate: 0.28, dmg: 9, slow: 0.4, slowT: 2.5, shots: 3, splash: 0.8, acid: 12 },
  ] },
  toy_soldier: { name: 'Evil Toy Soldier', cost: 90, on: 'land', scale: 0.66, desc: 'Long-range popgun', levels: [
    { range: 3.7, rate: 1.15, dmg: 28, shots: 1 },
    { name: 'Bayonet Drill', cost: 90, desc: 'More range and punch', range: 4.3, rate: 1.05, dmg: 44, shots: 1 },
    { name: 'Double Barrel', cost: 150, desc: 'A second gun: two shots per volley', range: 4.5, rate: 1.0, dmg: 46, shots: 2 },
    { name: 'Cannon Captain', cost: 270, desc: 'Explosive cannonballs', range: 5.0, rate: 0.95, dmg: 72, shots: 2, splash: 1.0 },
  ] },
};
const HERO = { name: 'The Grump', scale: 0.78, hero: true, on: 'land', levels: [
  { range: 6, rate: 1.4, dmg: 20, splash: 0.8, shots: 1 },
  { name: 'Ice Balls', cost: 80, desc: 'Snowballs chill carriers', range: 6.5, rate: 1.3, dmg: 28, splash: 0.85, shots: 1, chill: 1.5 },
  { name: 'Double Throw', cost: 140, desc: 'Two snowballs at once', range: 7, rate: 1.2, dmg: 30, splash: 0.9, shots: 2, chill: 1.5 },
  { name: 'Avalanche', cost: 250, desc: 'Giant snowballs, heist charges 50% faster', range: 8, rate: 1.1, dmg: 46, splash: 1.5, shots: 2, chill: 2, ultBoost: 1.5 },
] };
const TOWER_KEYS = Object.keys(TOWERS);
const stat = (t) => t.def.levels[t.level - 1];

// ================================================================ renderer / scene
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const camBase = new THREE.Vector3();
const hemi = new THREE.HemisphereLight(0xffffff, 0xa8c4d8, 1.1);
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 16, 12);
sun.target.position.set(8, 0, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 11, bottom: -11, near: 1, far: 45 });
sun.shadow.bias = -0.0015;
scene.add(hemi, sun, sun.target);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const dist = 18.5 * Math.max(1, 1.5 / camera.aspect);
  const dir = new THREE.Vector3(0, 0.8, 0.6).normalize();
  const target = new THREE.Vector3(COLS / 2 + 0.6, 0, ROWS / 2 + 1.7);
  camBase.copy(target).addScaledVector(dir, dist);
  camera.position.copy(camBase);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ================================================================ path
function buildPath(wps) {
  const pts = wps.map(([x, z]) => new THREE.Vector3(x + 0.5, 0, z + 0.5));
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = pts[i].distanceTo(pts[i + 1]);
    segs.push({ a: pts[i], b: pts[i + 1], len, start: total, dir: pts[i + 1].clone().sub(pts[i]).normalize() });
    total += len;
  }
  const cells = new Map();
  for (const s of segs) {
    for (let k = 0; k <= Math.round(s.len); k++) {
      const x = Math.floor(s.a.x + s.dir.x * k), z = Math.floor(s.a.z + s.dir.z * k);
      if (x < 0 || x >= COLS || z < 0 || z >= ROWS || cells.has(key(x, z))) continue;
      cells.set(key(x, z), { x, z, k: key(x, z), d: s.start + k, dir: s.dir });
    }
  }
  function pointAt(d, out, dirOut) {
    let s = segs[0];
    if (d >= total) s = segs[segs.length - 1];
    else if (d > 0) for (const q of segs) { if (d <= q.start + q.len) { s = q; break; } }
    out.copy(s.a).addScaledVector(s.dir, d - s.start);
    if (dirOut) dirOut.copy(s.dir);
    return out;
  }
  return { segs, total, cells, pointAt };
}

// ================================================================ state
const S = {
  levelIdx: 0, level: null, path: null, theme: null,
  coal: 0, delivered: 0, broken: 0, built: 0, wave: 0, waveActive: false, queue: [], waveT: 0, autoT: -1,
  enemies: [], towers: [], occupied: new Map(), piles: new Map(), pending: new Set(), projectiles: [], particles: [],
  selected: null, picked: null, ghost: null, hover: null, speed: 1, playing: false, over: false, lost: false, deathT: 0, time: 0,
  hero: null, grumpJump: 0, ult: 0,
};
window.__game = S;
const actors = new THREE.Group();
scene.add(actors);
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const $ = (id) => document.getElementById(id);

// ================================================================ fx helpers
const pGeo = box(0.1, 0.1, 0.1);
const pMats = {};
function burst(pos, color, n = 10, speed = 2.6) {
  const mat = (pMats[color] ||= flat(color));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(pGeo, mat);
    m.position.copy(pos);
    m.scale.setScalar(0.6 + Math.random() * 1.2);
    actors.add(m);
    S.particles.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * speed, 1.5 + Math.random() * speed, (Math.random() - 0.5) * speed), life: 0.7 + Math.random() * 0.4 });
  }
}
const floats = $('floats');
function floatText(pos, text, cls = '') {
  const v = tmp2.copy(pos).project(camera);
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  el.style.left = Math.max(70, Math.min(window.innerWidth - 120, ((v.x + 1) / 2) * window.innerWidth)) + 'px';
  el.style.top = ((1 - v.y) / 2) * window.innerHeight + 'px';
  floats.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
// Health bar: both sprites sit at the same point; the fill is anchored to the
// background's left edge in screen space through its sprite centre.
function makeBar(width) {
  const g = new THREE.Group();
  const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x1b1b1e, depthTest: false }));
  bg.scale.set(width + 0.06, 0.13, 1);
  bg.renderOrder = 10;
  const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x57d163, depthTest: false }));
  fg.scale.set(width, 0.075, 1);
  fg.renderOrder = 11;
  g.add(bg, fg);
  g.visible = false;
  g.userData = { fg, width };
  return g;
}
function setBar(bar, ratio) {
  const r = Math.max(0.02, Math.min(1, ratio));
  const { fg, width } = bar.userData;
  bar.visible = ratio < 0.999;
  fg.scale.x = width * r;
  fg.center.x = 0.5 / r;
  fg.material.color.set(r > 0.5 ? 0x57d163 : r > 0.25 ? 0xf4c430 : 0xe63946);
}
const coalMat = flat('#26262B');
const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthTest: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5;
const hoverTile = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), new THREE.MeshBasicMaterial({ color: 0x6fa83a, transparent: true, opacity: 0.5, depthTest: false }));
hoverTile.rotation.x = -Math.PI / 2; hoverTile.visible = false; hoverTile.renderOrder = 4;
scene.add(ring, hoverTile);
function flash() {
  const f = $('flash');
  f.classList.remove('go');
  void f.offsetWidth;
  f.classList.add('go');
  setTimeout(() => f.classList.remove('go'), 600);
}

// ================================================================ enemies
function spawnEnemy(type, hpMul) {
  const def = ENEMIES[type];
  const g = new THREE.Group();
  const model = spawnModel(type);
  model.scale.setScalar(def.scale);
  g.add(model);
  const flying = S.theme.flying;
  let baseY = 0;
  if (flying) {
    baseY = 0.3;
    if (type === 'santa') {
      const sl = makeSleigh(); sl.scale.setScalar(0.72); sl.position.y = -0.1; g.add(sl);
      model.position.y = 0.2;
    } else {
      const c = makeCloudPuff(def.scale * 1.5); c.position.y = -0.08; g.add(c);
    }
  }
  const giftY = model.userData.height * def.scale + 0.24 + (flying && type === 'santa' ? 0.2 : 0);
  const gift = new THREE.Group();
  const n = def.gifts > 3 ? 3 : def.gifts > 1 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const b = makeGift();
    b.scale.setScalar(i === 0 ? 1 : 0.72);
    b.position.set(i === 2 ? 0.1 : i === 1 ? -0.08 : 0, i === 0 ? 0 : 0.2 + i * 0.16, 0);
    b.rotation.y = i * 0.6;
    gift.add(b);
  }
  const gs = type === 'santa' ? 1.25 : type === 'mrs_claus' ? 0.95 : 0.8;
  gift.scale.setScalar(gs);
  gift.position.y = giftY;
  g.add(gift);
  const bar = makeBar(type === 'santa' ? 1.1 : 0.62);
  bar.position.y = giftY + 0.45 * gs + (n > 1 ? 0.3 : 0);
  g.add(bar);
  const legs = [];
  model.traverse((o) => { if (o.name === 'leg') legs.push(o); });
  const hp = def.hp * hpMul;
  const e = {
    type, def, g, model, gift, giftScale: gs, giftY, bar, legs, legY: legs.map((l) => l.position.y), head: model.getObjectByName('head'), baseY,
    d: -0.6, hp, maxHp: hp, state: 'walk', phase: Math.random() * 6, punch: 0, hop: 0,
    slowT: 0, slowMul: 1, dotT: 0, dotDps: 0, dotSrc: '', vulnT: 0, pileCd: 0, color: gift.children[0].userData.color,
  };
  actors.add(g);
  S.enemies.push(e);
  placeEnemy(e);
  return e;
}
function placeEnemy(e) {
  S.path.pointAt(e.d, e.g.position, tmp);
  e.g.position.y = e.baseY;
  const sgn = e.state === 'flee' ? -1 : 1;
  let dy = Math.atan2(tmp.x * sgn, tmp.z * sgn) - e.g.rotation.y;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  e.g.rotation.y += dy * 0.25;
}
const giftPos = (e, out) => out.copy(e.g.position).setY(e.g.position.y + e.giftY);
function hit(e, dmg, source, quiet) {
  if (e.state !== 'walk') return;
  if (e.vulnT > 0) dmg *= 1.3;
  e.hp -= dmg;
  if (!quiet) e.punch = 1;
  setBar(e.bar, e.hp / e.maxHp);
  if (e.hp <= 0) breakGift(e, source);
}
function applySlow(e, mul, t) {
  e.slowMul = e.slowT > 0 ? Math.min(e.slowMul, mul) : mul;
  e.slowT = Math.max(e.slowT, t);
}
function applyDot(e, dps, t, src) {
  e.dotDps = e.dotT > 0 ? Math.max(e.dotDps, dps) : dps;
  e.dotT = Math.max(e.dotT, t);
  e.dotSrc = src;
}
function loseGift(e) {
  e.g.remove(e.gift); e.g.remove(e.bar);
  e.state = 'flee';
  S.coal += e.def.reward;
  S.broken += e.def.gifts;
  S.ult = Math.min(100, S.ult + e.def.gifts * 1.1 * (stat(S.hero).ultBoost || 1));
}
function breakGift(e, source) {
  const p = giftPos(e, new THREE.Vector3());
  burst(p, e.color, 12);
  burst(p, '#F4C430', 5);
  loseGift(e);
  floatText(p, '+' + e.def.reward);
  if (source === 'coal') {
    e.model.traverse((o) => { if (o.isMesh) o.material = coalMat; });
    burst(p.setY(p.y - 0.4), '#26262B', 12, 2);
  }
  S.grumpJump = 1;
  updateHud();
}
function deliver(e) {
  S.delivered += e.def.gifts;
  floatText(giftPos(e, tmp), `+${e.def.gifts} 🎁 delivered`, 'bad');
  removeEnemy(e);
  updateHud();
  if (S.delivered >= MAX_DELIVERED && !S.over) endGame(false);
}
function removeEnemy(e) {
  actors.remove(e.g);
  const i = S.enemies.indexOf(e);
  if (i >= 0) S.enemies.splice(i, 1);
}
function enemiesNear(x, z, r) {
  const out = [];
  for (const e of S.enemies) {
    if (e.state !== 'walk') continue;
    if (Math.max(Math.abs(e.g.position.x - x), Math.abs(e.g.position.z - z)) <= r) out.push(e);
  }
  return out;
}
function pickTargets(pos, range, n) {
  const r2 = range * range, list = [];
  for (const e of S.enemies) {
    if (e.state !== 'walk' || e.d < 0) continue;
    const dx = e.g.position.x - pos.x, dz = e.g.position.z - pos.z;
    if (dx * dx + dz * dz <= r2) list.push(e);
  }
  list.sort((a, b) => b.d - a.d);
  return list.slice(0, n);
}
function splashEach(pos, radius, fn) {
  for (const e of [...S.enemies]) {
    if (e.state !== 'walk') continue;
    const dx = e.g.position.x - pos.x, dz = e.g.position.z - pos.z;
    if (dx * dx + dz * dz <= radius * radius) fn(e);
  }
}

// ================================================================ towers
function makeTowerMesh(type, cell, level = 1) {
  if (type === 'conveyor') {
    const m = makeConveyor(level);
    if (cell) m.rotation.y = Math.atan2(-cell.dir.x, -cell.dir.z);
    return m;
  }
  if (type === 'spikes') return makeSpikes(level);
  const m = spawnTower(type, level);
  m.scale.setScalar((type === 'grump' ? HERO : TOWERS[type]).scale * (1 + 0.06 * (level - 1)));
  return m;
}
/** (Re)builds a gadget's mesh for its current level. */
function refreshMesh(t) {
  const yaw = t.mesh ? t.mesh.rotation.y : 0;
  if (t.mesh) actors.remove(t.mesh);
  const cell = S.path.cells.get(t.k);
  t.mesh = makeTowerMesh(t.type, cell, t.level);
  t.mesh.position.set(t.x + 0.5, t.def.hero ? S.theme.grumpY : 0.02, t.z + 0.5);
  if (t.def.on !== 'path') t.mesh.rotation.y = yaw;
  t.baseScale = t.mesh.scale.x;
  t.spin = []; t.roll = []; t.blink = [];
  t.mesh.traverse((o) => {
    if (o.name === 'spin') t.spin.push(o);
    else if (o.name === 'rollx') t.roll.push(o);
    else if (o.name === 'blink') t.blink.push(o);
  });
  t.spikes = t.mesh.getObjectByName('spikes');
  t.arm = t.mesh.getObjectByName('arm');
  if (t.type === 'coal_chucker') {
    const r = stat(t).range;
    t.cells = [...S.path.cells.values()].filter((c) => Math.hypot(c.x - t.x, c.z - t.z) <= r);
  }
  t.mesh.userData.gadget = t;
  actors.add(t.mesh);
}
function canPlace(type, x, z) {
  const def = TOWERS[type], k = key(x, z);
  if (S.occupied.has(k)) return false;
  if (def.on === 'path') return S.path.cells.has(k);
  return S.theme.buildable(x, z);
}
function placeTower(type, x, z) {
  const def = TOWERS[type];
  const t = { type, def, level: 1, x, z, k: key(x, z), cd: 0.4, kick: 0, pop: 0, kickCd: 1, spent: def.cost, mesh: null };
  refreshMesh(t);
  S.towers.push(t);
  S.occupied.set(t.k, t);
  S.coal -= def.cost;
  S.built++;
  burst(t.mesh.position.clone().setY(0.2), '#FFFFFF', 8, 1.6);
  updateHud();
  return t;
}
function upgrade(t) {
  if (!t || t.level >= MAX_LEVEL) return false;
  const next = t.def.levels[t.level];
  if (S.coal < next.cost) { showHint(`Need ${next.cost} coal for ${next.name}`); return false; }
  S.coal -= next.cost;
  t.spent = (t.spent || 0) + next.cost;
  t.level++;
  refreshMesh(t);
  const p = t.mesh.position.clone().setY(0.8);
  burst(p, '#FFD23F', 14, 3);
  burst(p, '#FFFFFF', 6, 2);
  floatText(p.setY(1.6), next.name + '!');
  if (t.def.hero) S.grumpJump = 1;
  pick(t);
  updateHud();
  return true;
}
function sellTower(t) {
  if (!t || t.def.hero) return;
  const refund = Math.floor(t.spent * 0.6);
  S.coal += refund;
  floatText(t.mesh.position.clone().setY(1), `Sold +${refund}`);
  actors.remove(t.mesh);
  S.towers.splice(S.towers.indexOf(t), 1);
  S.occupied.delete(t.k);
  pick(null);
  updateHud();
}

// ---- coal piles (the chucker's product)
function chooseCell(t, L) {
  const free = [], used = [];
  for (const c of t.cells) (S.piles.has(c.k) || S.pending.has(c.k) ? used : free).push(c);
  if (free.length && used.length < L.maxPiles) return free[Math.floor(Math.random() * free.length)];
  let weakest = null;
  for (const c of used) {
    const p = S.piles.get(c.k);
    if (p && !S.pending.has(c.k) && p.hits <= L.hits * 0.5 && (!weakest || p.hits < weakest.p.hits)) weakest = { c, p };
  }
  return weakest ? weakest.c : null;
}
function landCoal(cell, L) {
  S.pending.delete(cell.k);
  const pos = new THREE.Vector3(cell.x + 0.5, 0.05, cell.z + 0.5);
  burst(pos, '#26262B', 5, 1.4);
  splashEach(pos, 0.5, (e) => hit(e, L.dmg, 'coal'));
  let p = S.piles.get(cell.k);
  if (p && p.hot !== !!L.burn) { actors.remove(p.mesh); S.piles.delete(cell.k); p = null; }
  if (!p) {
    p = { k: cell.k, pos, mesh: makeCoalPile(!!L.burn), hot: !!L.burn };
    p.mesh.position.copy(pos).setY(0.02);
    p.mesh.rotation.y = Math.random() * 6;
    actors.add(p.mesh);
    S.piles.set(cell.k, p);
  }
  Object.assign(p, { hits: L.hits, max: L.hits, dmg: L.dmg, burn: L.burn || 0, explode: L.explode || 0 });
  setPile(p.mesh, 1);
}
function usePile(p, e) {
  hit(e, p.dmg, 'coal');
  if (p.burn && e.state === 'walk') applyDot(e, p.burn, 3, 'coal');
  p.hits--;
  setPile(p.mesh, p.hits / p.max);
  if (p.hits <= 0) {
    actors.remove(p.mesh);
    S.piles.delete(p.k);
    if (p.explode) {
      burst(p.pos, '#FF8C1A', 16, 4);
      burst(p.pos, '#FFD23F', 8, 3);
      splashEach(p.pos, 1.3, (v) => hit(v, p.explode, 'coal'));
    }
  }
}

// ================================================================ projectiles
const projGeo = { coal: lump(0.14), snow: rock(0.15, 1), spit: rock(0.08), bullet: box(0.07, 0.07, 0.22), ball: rock(0.14, 1) };
const projMat = { coal: flat('#1F1F24'), hot: glow('#FF8C1A', 1), snow: flat('#FFFFFF'), ice: glow('#8FDCFF', 0.6), spit: new THREE.MeshBasicMaterial({ color: '#9BE564' }), bullet: new THREE.MeshBasicMaterial({ color: '#FFE08A' }), ball: flat('#17171A') };
function shoot(kind, from, o) {
  const m = o.mesh || new THREE.Mesh(projGeo[kind], projMat[o.mat || kind]);
  m.position.copy(from);
  if (o.size) m.scale.setScalar(o.size);
  m.visible = !o.delay;
  actors.add(m);
  S.projectiles.push({ kind, m, from: from.clone(), to: o.to ? o.to.clone() : new THREE.Vector3(), target: o.target || null, t: -(o.delay || 0) / o.dur, dur: o.dur, arc: o.arc || 0, onHit: o.onHit });
}
function fireSoldier(t, L, targets) {
  t.kick = 1;
  for (let i = 0; i < L.shots; i++) {
    const e = targets[i % targets.length];
    const from = t.mesh.position.clone().setY(L.splash ? 1.15 : 0.7);
    const dur = Math.max(0.08, from.distanceTo(e.g.position) / (L.splash ? 11 : 16));
    shoot(L.splash ? 'ball' : 'bullet', from, {
      target: e, dur, delay: i * 0.12, arc: L.splash ? 0.5 : 0,
      onHit: (tg, p) => {
        if (L.splash) { burst(p, '#FF8C1A', 9, 3); burst(p, '#3A3A40', 5, 2); splashEach(p, L.splash, (v) => hit(v, L.dmg, 'bullet')); }
        else if (tg) hit(tg, L.dmg, 'bullet');
      },
    });
  }
}
function fireReindeer(t, L, targets) {
  t.kick = 0.6;
  for (const e of targets) {
    const from = t.mesh.position.clone().setY(0.55);
    shoot('spit', from, {
      target: e, dur: Math.max(0.08, from.distanceTo(e.g.position) / 10), size: L.acid ? 1.6 : 1,
      onHit: (tg, p) => {
        const apply = (v) => { applySlow(v, L.slow, L.slowT); if (L.acid) applyDot(v, L.acid, 3, 'spit'); hit(v, L.dmg, 'spit'); };
        if (L.splash) { burst(p, '#9BE564', 4, 1.6); splashEach(p, L.splash, apply); }
        else if (tg) apply(tg);
      },
    });
  }
}
function fireChucker(t, L, cell) {
  t.kick = 1;
  S.pending.add(cell.k);
  const to = new THREE.Vector3(cell.x + 0.5, 0.1, cell.z + 0.5);
  t.mesh.rotation.y = Math.atan2(to.x - t.mesh.position.x, to.z - t.mesh.position.z);
  shoot('coal', t.mesh.position.clone().setY(1.0), { to, dur: 0.5, arc: 1.3, mat: L.burn ? 'hot' : 'coal', size: 1 + t.level * 0.12, onHit: () => landCoal(cell, L) });
}
function throwSnowballs(h, L, targets) {
  h.kick = 1;
  for (const e of targets) {
    const from = h.mesh.position.clone().setY(1.3);
    const dur = 0.3 + from.distanceTo(e.g.position) * 0.035;
    const lead = e.def.speed * (e.slowT > 0 ? e.slowMul : 1) * dur;
    const to = S.path.pointAt(Math.min(S.path.total, e.d + lead), new THREE.Vector3()).setY(0.5);
    shoot('snow', from, {
      to, dur, arc: 1.4, mat: L.chill ? 'ice' : 'snow', size: L.splash > 1.2 ? 2.1 : 1,
      onHit: (_, p) => {
        burst(p, L.chill ? '#8FDCFF' : '#FFFFFF', L.splash > 1.2 ? 16 : 9, 2);
        splashEach(p, L.splash, (v) => { if (L.chill) applySlow(v, 0.6, L.chill); hit(v, L.dmg, 'snow'); });
      },
    });
  }
  const e = targets[0];
  h.mesh.rotation.y = Math.atan2(e.g.position.x - h.mesh.position.x, e.g.position.z - h.mesh.position.z);
}

// ---- the Grump's ult: Present Heist
function heist() {
  if (S.ult < 100 || !S.playing) return;
  const to = S.hero.mesh.position.clone().setY(1.3);
  const fly = (from, delay) => shoot('gift', from, { mesh: makeGift(), to, dur: 0.75, delay, arc: 2.6, size: 0.8, onHit: (_, p) => burst(p, '#F4C430', 4, 1.5) });
  let n = 0, i = 0;
  for (const e of [...S.enemies]) {
    if (e.state !== 'walk') continue;
    if (e.type === 'santa') {
      const p = giftPos(e, new THREE.Vector3());
      floatText(p, 'Sack raided!');
      for (let k = 0; k < 4; k++) fly(p, 0.1 * k);
      hit(e, e.maxHp * 0.35, 'steal');
      n += 4;
      continue;
    }
    fly(giftPos(e, new THREE.Vector3()), 0.04 * i++);
    loseGift(e);
    n += e.def.gifts;
  }
  const back = Math.min(S.delivered, 5);
  if (back) {
    S.delivered -= back;
    const gp = S.theme.goal.position.clone().setY(1.2);
    for (let k = 0; k < back; k++) fly(gp, 0.12 * k);
    floatText(gp.clone().setY(2.2), `-${back} 🎁 stolen back`);
  }
  S.ult = 0;
  S.grumpJump = 1;
  flash();
  floatText(to.clone().setY(2.4), n + back ? `HEIST! ${n + back} presents` : 'HEIST!');
  updateHud();
}

// ================================================================ waves
function buildWave(w, level) {
  const q = [];
  let t = 0;
  const add = (type, n, gap) => { for (let i = 0; i < n; i++) { q.push({ type, t }); t += gap; } };
  add('elf', 6 + 2 * w, 0.7);
  if (w >= 1) { t += 1; add('reindeer', 2 + Math.floor(w * 1.5), 0.8); }
  if (w >= 3) { t += 1; add('mrs_claus', Math.floor((w - 1) / 2), 2.2); }
  if (w >= 2) { t += 0.5; add('elf', w, 0.5); }
  if (w === level.waves - 1 || (level.waves >= 9 && w === Math.floor(level.waves / 2))) { t += 2; add('santa', 1, 1); }
  return q;
}
function startWave() {
  if (S.waveActive || S.over || !S.playing || S.wave >= S.level.waves) return;
  S.queue = buildWave(S.wave, S.level);
  S.waveT = 0;
  S.waveActive = true;
  S.autoT = -1;
  updateHud();
}
function endWave() {
  S.waveActive = false;
  S.wave++;
  if (S.wave >= S.level.waves) return endGame(true);
  const bonus = 20 + S.wave * 5;
  S.coal += bonus;
  S.autoT = 8;
  floatText(S.hero.mesh.position.clone().setY(2), `Wave cleared! +${bonus}`);
  updateHud();
}

// ================================================================ level lifecycle
function loadLevel(idx) {
  if (S.theme) scene.remove(S.theme.group);
  actors.clear();
  Object.assign(S, { levelIdx: idx, level: LEVELS[idx], enemies: [], towers: [], projectiles: [], particles: [], queue: [], wave: 0, waveActive: false, delivered: 0, broken: 0, built: 0, over: false, lost: false, deathT: 0, autoT: -1, time: 0, ult: 0, picked: null });
  S.occupied = new Map(); S.piles = new Map(); S.pending = new Set();
  S.coal = S.level.coal;
  S.path = buildPath(S.level.path);
  S.theme = buildTheme(S.level, S.path);
  scene.add(S.theme.group);
  const T = S.theme.theme;
  scene.background = new THREE.Color(T.bg);
  scene.fog = new THREE.Fog(T.bg, 34, 70);
  hemi.color.set(T.hemi[0]); hemi.groundColor.set(T.hemi[1]); hemi.intensity = T.hemi[2];
  sun.color.set(T.sun[0]); sun.intensity = T.sun[1];
  const [gx, gz] = S.level.grump;
  S.hero = { type: 'grump', def: HERO, level: 1, x: gx, z: gz, k: key(gx, gz), cd: 1, kick: 0, spent: 0, mesh: null };
  refreshMesh(S.hero);
  camera.position.copy(camBase);
  select(null);
  S.playing = true;
  $('overlay').classList.add('hidden');
  $('death').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('levelName').textContent = `${idx + 1}. ${S.level.name}`;
  $('waves').textContent = S.level.waves;
  updateHud();
  showHint('Place gadgets, click them to upgrade, then start the wave');
}
function endGame(won) {
  S.over = true;
  S.playing = false;
  select(null);
  if (!won) { S.lost = true; S.deathT = 0; return; } // death sequence plays in frame()
  const next = S.levelIdx + 1 < LEVELS.length;
  showOverlay(next ? 'Christmas is cancelled… here' : 'Bah humbug, you win!', `You smashed ${S.broken} presents and only ${S.delivered} got through.`, next ? S.levelIdx + 1 : null);
}
function showDeath() {
  $('deathSub').textContent = `Santa got ${MAX_DELIVERED} presents through on ${S.level.name}. Christmas is happening.`;
  $('dsWave').textContent = `${Math.min(S.wave + 1, S.level.waves)}/${S.level.waves}`;
  $('dsBroken').textContent = S.broken;
  $('dsTowers').textContent = S.built;
  const sec = Math.round(S.time);
  $('dsTime').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const rain = $('rain');
  rain.innerHTML = '';
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.textContent = i % 5 === 0 ? '🎄' : '🎁';
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = 3 + Math.random() * 4 + 's';
    s.style.animationDelay = -Math.random() * 6 + 's';
    rain.appendChild(s);
  }
  $('hud').classList.add('hidden');
  $('death').classList.remove('hidden');
}

// ================================================================ UI
let hintTimer;
function showHint(text) {
  const el = $('hint');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
function describe(t) {
  const L = stat(t);
  switch (t.type) {
    case 'coal_chucker': return `Pile: ${L.hits} hits × ${L.dmg} dmg · every ${L.rate}s · up to ${L.maxPiles} piles${L.burn ? ` · burn ${L.burn}/s` : ''}${L.explode ? ' · explodes' : ''}`;
    case 'conveyor': return `Speed on belt ×${L.slow}${L.kick ? ` · flings back ${L.kick} tiles / ${L.kickEvery}s` : ''}${L.dps ? ` · grinds ${L.dps}/s` : ''}`;
    case 'spikes': return `${L.dmg} dmg per stab · every ${L.every}s${L.freeze ? ' · freezes' : ''}${L.shred ? ' · tears wrapping' : ''}`;
    case 'evil_reindeer': return `${L.dmg} dmg × ${L.shots} · every ${L.rate}s · range ${L.range} · slow ×${L.slow}${L.acid ? ` · acid ${L.acid}/s` : ''}`;
    case 'toy_soldier': return `${L.dmg} dmg × ${L.shots} · every ${L.rate}s · range ${L.range}${L.splash ? ' · explosive' : ''}`;
    default: return `Snowball ${L.dmg} dmg × ${L.shots} · every ${L.rate}s · range ${L.range}${L.chill ? ' · chills' : ''}`;
  }
}
function refreshPanel() {
  const t = S.picked, panel = $('panel');
  panel.classList.toggle('hidden', !t || !S.playing);
  if (!t) return;
  $('pName').textContent = t.def.name;
  $('pPips').textContent = '★'.repeat(t.level) + '☆'.repeat(MAX_LEVEL - t.level);
  $('pStats').textContent = describe(t);
  const next = t.def.levels[t.level];
  $('pNextName').textContent = next ? `Next: ${next.name}` : 'Fully upgraded';
  $('pNextDesc').textContent = next ? next.desc : 'Nothing left to buy here.';
  const up = $('upBtn');
  up.disabled = !next || S.coal < next.cost;
  up.innerHTML = next ? `Upgrade · ${next.cost} <kbd>U</kbd>` : 'MAX';
  const sell = $('sellBtn');
  sell.classList.toggle('hidden', !!t.def.hero);
  sell.innerHTML = `Sell +${Math.floor((t.spent || 0) * 0.6)} <kbd>X</kbd>`;
}
function updateHud() {
  $('wave').textContent = Math.min(S.wave + 1, S.level.waves);
  $('delivered').textContent = S.delivered;
  $('deliverBar').style.width = Math.min(100, (S.delivered / MAX_DELIVERED) * 100) + '%';
  $('coal').textContent = S.coal;
  for (const el of document.querySelectorAll('.tower')) {
    el.classList.toggle('poor', TOWERS[el.dataset.type].cost > S.coal);
    el.classList.toggle('selected', el.dataset.type === S.selected);
  }
  const btn = $('waveBtn');
  btn.disabled = S.waveActive;
  btn.textContent = S.waveActive ? 'Wave incoming…' : S.autoT > 0 ? `Next wave (${Math.ceil(S.autoT)})` : S.wave === 0 ? 'Start wave' : 'Next wave';
  refreshPanel();
}
function select(type) {
  if (S.ghost) { scene.remove(S.ghost); S.ghost = null; }
  S.selected = type;
  hoverTile.visible = false;
  if (type) S.picked = null;
  if (!S.picked) ring.visible = false;
  if (S.level) updateHud();
  canvas.style.cursor = type ? 'copy' : 'default';
}
function pick(t) {
  S.picked = t || null;
  const r = t && stat(t).range;
  ring.visible = !!r;
  if (r) { ring.position.set(t.x + 0.5, 0.05, t.z + 0.5); ring.scale.setScalar(r); }
  refreshPanel();
}
function showOverlay(title, text, nextIdx) {
  $('ovTitle').textContent = title;
  $('ovText').textContent = text;
  const wrap = $('levelBtns');
  wrap.innerHTML = '';
  if (nextIdx != null) {
    const b = document.createElement('button');
    b.className = 'btn'; b.textContent = `Next: ${LEVELS[nextIdx].name} →`;
    b.onclick = () => loadLevel(nextIdx);
    wrap.appendChild(b);
  }
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = 'btn' + (nextIdx != null ? ' alt' : '');
    b.textContent = `${i + 1}. ${lv.name}`;
    b.title = lv.blurb;
    b.onclick = () => loadLevel(i);
    wrap.appendChild(b);
  });
  $('death').classList.add('hidden');
  $('overlay').classList.remove('hidden');
  refreshPanel();
}

function snapshot(r, obj, yaw = 0.45) {
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9fb4c6, 1.5));
  const d = new THREE.DirectionalLight(0xffffff, 1.5); d.position.set(2, 5, 4); sc.add(d);
  obj.rotation.y = yaw;
  sc.add(obj);
  const bb = new THREE.Box3().setFromObject(obj);
  const c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
  const rad = Math.max(s.x, s.y, s.z) * 0.64;
  const cam = new THREE.OrthographicCamera(-rad, rad, rad, -rad, 0.1, 60);
  cam.position.copy(c).add(new THREE.Vector3(0, 3.2, 9));
  cam.lookAt(c);
  r.render(sc, cam);
  return r.domElement.toDataURL();
}
function renderIcons() {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(256, 256, false);
  const santa = spawnModel('santa');
  const g = makeGift(0); g.position.y = santa.userData.height + 0.3; santa.add(g);
  const out = { grump: snapshot(r, spawnModel('grump'), 0.35), santa: snapshot(r, santa, -0.3) };
  for (const k of TOWER_KEYS) out[k] = snapshot(r, makeTowerMesh(k, null), k === 'conveyor' || k === 'spikes' ? 0.6 : 0.45);
  r.dispose();
  return out;
}

function buildUi() {
  const icons = renderIcons();
  $('portrait').src = icons.grump;
  $('deathSanta').src = icons.santa;
  const wrap = $('towers');
  TOWER_KEYS.forEach((k, i) => {
    const def = TOWERS[k];
    const el = document.createElement('div');
    el.className = 'tower';
    el.dataset.type = k;
    el.innerHTML = `<span class="keycap">${i + 1}</span><img src="${icons[k]}" alt=""><div class="name">${def.name}</div><div class="desc">${def.desc}</div><div class="cost"><span class="lump"></span>${def.cost}</div>`;
    el.onclick = () => select(S.selected === k ? null : k);
    wrap.appendChild(el);
  });
  $('waveBtn').onclick = startWave;
  $('ultBtn').onclick = heist;
  $('upBtn').onclick = () => upgrade(S.picked);
  $('sellBtn').onclick = () => sellTower(S.picked);
  $('retryBtn').onclick = () => loadLevel(S.levelIdx);
  $('deathMenuBtn').onclick = () => showOverlay('Coal for Christmas', 'Pick a level.', null);
  $('speedBtn').onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1; $('speedBtn').textContent = S.speed + '×'; };
  $('menuBtn').onclick = () => { S.playing = false; showOverlay('Coal for Christmas', 'Pick a level.', null); };
  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (k >= '1' && k <= '5') select(TOWER_KEYS[+k - 1]);
    else if (k === 'escape') { select(null); pick(null); }
    else if (k === ' ') { ev.preventDefault(); startWave(); }
    else if (k === 'u') upgrade(S.picked);
    else if (k === 'x') sellTower(S.picked);
    else if (k === 'q') heist();
    else if (k === 'r' && S.lost) loadLevel(S.levelIdx);
  });
}

// ================================================================ input
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouse = new THREE.Vector2();
function pointerCell(ev, out) {
  mouse.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  if (!raycaster.ray.intersectPlane(groundPlane, out)) return null;
  const x = Math.floor(out.x), z = Math.floor(out.z);
  return { x, z, inside: x >= 0 && x < COLS && z >= 0 && z < ROWS };
}
// What the pointer is on: the model under the cursor first, then whatever owns the tile.
// (Call right after pointerCell, which aims the raycaster.)
function gadgetAt(c) {
  if (!S.hero) return null;
  const hits = raycaster.intersectObjects([S.hero.mesh, ...S.towers.map((t) => t.mesh)], true);
  for (const h of hits) {
    for (let o = h.object; o; o = o.parent) if (o.userData.gadget) return o.userData.gadget;
  }
  if (!c) return null;
  return S.occupied.get(key(c.x, c.z)) || (c.x === S.hero.x && c.z === S.hero.z ? S.hero : null);
}
const hoverPoint = new THREE.Vector3();
function refreshGhost() {
  const h = S.hover;
  if (!S.selected) {
    hoverTile.visible = false;
    if (S.ghost) S.ghost.visible = false;
    canvas.style.cursor = S.playing && h && gadgetAt(h.inside ? h : null) ? 'pointer' : 'default';
    return;
  }
  if (!h || !h.inside) { hoverTile.visible = false; ring.visible = false; if (S.ghost) S.ghost.visible = false; return; }
  const def = TOWERS[S.selected];
  const ok = canPlace(S.selected, h.x, h.z) && S.coal >= def.cost;
  if (S.ghost && S.ghost.userData.cellKey !== key(h.x, h.z)) { scene.remove(S.ghost); S.ghost = null; }
  if (!S.ghost) {
    S.ghost = makeTowerMesh(S.selected, S.path.cells.get(key(h.x, h.z)));
    S.ghost.userData.cellKey = key(h.x, h.z);
    S.ghost.traverse((o) => { o.castShadow = false; });
    scene.add(S.ghost);
  }
  S.ghost.visible = ok;
  S.ghost.position.set(h.x + 0.5, 0.02, h.z + 0.5);
  hoverTile.visible = true;
  hoverTile.position.set(h.x + 0.5, 0.03, h.z + 0.5);
  hoverTile.material.color.set(ok ? 0x6fa83a : 0xe63946);
  const range = def.levels[0].range;
  ring.visible = !!range;
  if (range) { ring.position.set(h.x + 0.5, 0.05, h.z + 0.5); ring.scale.setScalar(range); }
}
canvas.addEventListener('pointermove', (ev) => { S.hover = pointerCell(ev, hoverPoint); refreshGhost(); });
canvas.addEventListener('pointerleave', () => { S.hover = null; refreshGhost(); });
canvas.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0 || !S.playing) return;
  const c = pointerCell(ev, new THREE.Vector3());
  if (!c) return;
  if (!S.selected) return pick(gadgetAt(c.inside ? c : null));
  if (!c.inside) return;
  const def = TOWERS[S.selected];
  if (S.coal < def.cost) return showHint(`Not enough coal for ${def.name}`);
  if (!canPlace(S.selected, c.x, c.z)) {
    return showHint(S.occupied.has(key(c.x, c.z)) ? 'That tile is taken' : def.on === 'path' ? `${def.name} goes on the path` : S.theme.flying ? `${def.name} needs a cloud beside the path` : `${def.name} goes beside the path`);
  }
  placeTower(S.selected, c.x, c.z);
  if (S.coal < def.cost) select(null);
  else { if (S.ghost) { scene.remove(S.ghost); S.ghost = null; } S.hover = c; refreshGhost(); }
});
canvas.addEventListener('contextmenu', (ev) => { ev.preventDefault(); select(null); pick(null); });

// ================================================================ update
function update(dt) {
  S.time += dt;
  const time = S.time;

  // spawning
  if (S.waveActive) {
    S.waveT += dt;
    S.ult = Math.min(100, S.ult + dt * 1.5 * (stat(S.hero).ultBoost || 1));
    const hpMul = (1 + 0.28 * S.wave) * (1 + 0.15 * S.levelIdx);
    while (S.queue.length && S.queue[0].t <= S.waveT) spawnEnemy(S.queue.shift().type, hpMul);
    if (!S.queue.length && !S.enemies.some((e) => e.state === 'walk')) endWave();
  } else if (S.autoT > 0) {
    const before = Math.ceil(S.autoT);
    S.autoT -= dt;
    if (S.autoT <= 0) startWave();
    else if (Math.ceil(S.autoT) !== before) updateHud();
  }
  if (S.over) return;

  // enemies
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    const ph = time * (e.state === 'flee' ? 16 : 5 + e.def.speed * 2.5) + e.phase;
    if (e.state === 'walk') {
      if (e.dotT > 0) { e.dotT -= dt; hit(e, e.dotDps * dt, e.dotSrc, true); }
      e.vulnT -= dt;
      e.pileCd -= dt;
      let sp = e.def.speed * (e.slowT > 0 ? e.slowMul : 1);
      e.slowT -= dt;
      const ck = key(Math.floor(e.g.position.x), Math.floor(e.g.position.z));
      const trap = S.occupied.get(ck);
      if (trap?.type === 'conveyor') sp *= stat(trap).slow;
      const pile = S.piles.get(ck);
      if (pile && e.pileCd <= 0 && e.state === 'walk') { e.pileCd = 0.28; usePile(pile, e); }
      if (e.state === 'walk') {
        e.d += sp * dt;
        if (e.d >= S.path.total) { deliver(e); continue; }
        e.punch = Math.max(0, e.punch - dt * 6);
        e.gift.scale.setScalar(e.giftScale * (1 + e.punch * 0.22));
        e.gift.position.y = e.giftY + Math.sin(ph * 0.6) * 0.03;
        e.gift.rotation.z = Math.sin(ph * 0.5) * 0.06;
      }
    } else {
      e.d -= 3.6 * dt;
      if (e.d < -1.6) { removeEnemy(e); continue; }
    }
    placeEnemy(e);
    e.hop = Math.max(0, e.hop - dt * 2.5);
    e.model.position.y = (S.theme.flying && e.type === 'santa' ? 0.2 : 0) + Math.abs(Math.sin(ph)) * (e.state === 'flee' ? 0.12 : 0.05) + Math.sin(e.hop * Math.PI) * 0.5;
    e.model.rotation.z = Math.sin(ph) * (e.state === 'flee' ? 0.16 : 0.07);
    if (e.head) e.head.rotation.z = Math.sin(ph + 1) * 0.1;
    for (let l = 0; l < e.legs.length; l++) e.legs[l].position.y = e.legY[l] + Math.max(0, Math.sin(ph + (l === 0 || l === 3 ? 0 : Math.PI))) * 0.09;
    if (S.theme.flying) e.g.position.y = e.baseY + Math.sin(time * 2 + e.phase) * 0.06;
  }

  // gadgets
  for (const t of [...S.towers]) {
    const L = stat(t);
    for (const o of t.spin) o.rotation.y = time * 3;
    for (const o of t.roll) o.rotation.x = time * 9;
    for (const o of t.blink) o.visible = Math.sin(time * 9) > 0;
    const cx = t.x + 0.5, cz = t.z + 0.5;
    if (t.type === 'spikes') {
      t.cd -= dt;
      t.pop = Math.max(0, t.pop - dt * 9);
      t.spikes.position.y = -0.12 + t.pop * 0.16;
      if (t.cd <= 0) {
        const victims = enemiesNear(cx, cz, L.radius || 0.5);
        if (victims.length) {
          t.cd = L.every; t.pop = 1;
          for (const v of victims) {
            if (L.freeze) { applySlow(v, 0.5, L.freeze); burst(giftPos(v, new THREE.Vector3()), '#8FDCFF', 2, 1.2); }
            if (L.shred) v.vulnT = L.shred;
            hit(v, L.dmg, 'spikes');
          }
        }
      }
    } else if (t.type === 'conveyor') {
      if (L.dps || L.kick) {
        const victims = enemiesNear(cx, cz, 0.5);
        if (L.dps) for (const v of victims) hit(v, L.dps * dt, 'shred', true);
        t.kickCd -= dt;
        if (L.kick && t.kickCd <= 0 && victims.length) {
          t.kickCd = L.kickEvery;
          for (const v of victims) { if (v.state === 'walk') { v.d = Math.max(-0.3, v.d - L.kick); v.hop = 1; } }
          burst(new THREE.Vector3(cx, 0.3, cz), '#FF5A4F', 8, 2.4);
        }
      }
    } else {
      t.cd -= dt;
      t.kick = Math.max(0, t.kick - dt * 5);
      const s = t.baseScale;
      t.mesh.scale.set(s * (1 + t.kick * 0.08), s * (1 - t.kick * 0.1), s * (1 + t.kick * 0.08));
      if (t.arm) t.arm.rotation.x = -t.kick * 1.3;
      if (t.type === 'coal_chucker') {
        if (t.cd <= 0) {
          const cell = chooseCell(t, L);
          if (cell) { fireChucker(t, L, cell); t.cd = L.rate; } else t.cd = 0.4;
        }
        continue;
      }
      const targets = pickTargets(t.mesh.position, L.range, L.shots);
      if (targets.length) {
        const a = targets[0].g.position;
        let dy = Math.atan2(a.x - t.mesh.position.x, a.z - t.mesh.position.z) - t.mesh.rotation.y;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        t.mesh.rotation.y += dy * Math.min(1, dt * 12);
        if (t.cd <= 0) { (t.type === 'toy_soldier' ? fireSoldier : fireReindeer)(t, L, targets); t.cd = L.rate; }
      } else t.mesh.position.y = 0.02 + Math.abs(Math.sin(time * 2 + t.x)) * 0.015;
    }
  }

  // the Grump
  const h = S.hero, HL = stat(h);
  h.cd -= dt;
  h.kick = Math.max(0, h.kick - dt * 4);
  if (h.cd <= 0) {
    const targets = pickTargets(h.mesh.position, HL.range, HL.shots);
    if (targets.length) { throwSnowballs(h, HL, targets); h.cd = HL.rate; } else h.cd = 0.15;
  }
  S.grumpJump = Math.max(0, S.grumpJump - dt * 3);
  for (const o of h.spin) o.rotation.y = time * 3;
  h.mesh.position.y = S.theme.grumpY + Math.sin(S.grumpJump * Math.PI) * 0.35 + Math.sin(time * 2) * 0.012;
  const gs = h.baseScale;
  h.mesh.scale.set(gs * (1 + h.kick * 0.1), gs * (1 - h.kick * 0.12 + Math.sin(time * 2) * 0.012), gs * (1 + h.kick * 0.1));

  // projectiles
  for (let i = S.projectiles.length - 1; i >= 0; i--) {
    const p = S.projectiles[i];
    p.t += dt / p.dur;
    if (p.t < 0) continue;
    p.m.visible = true;
    if (p.target) {
      if (p.target.state === 'walk') giftPos(p.target, p.to);
      else { p.target = null; p.lost = true; }
    }
    const k = Math.min(1, p.t);
    p.m.position.lerpVectors(p.from, p.to, k);
    p.m.position.y += Math.sin(k * Math.PI) * p.arc;
    if (p.kind === 'bullet') p.m.lookAt(p.to);
    else p.m.rotation.x += dt * 9;
    if (p.t >= 1) {
      p.onHit(p.lost ? null : p.target, p.to);
      actors.remove(p.m);
      S.projectiles.splice(i, 1);
    }
  }

  // particles
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.life -= dt;
    p.v.y -= 9 * dt;
    p.m.position.addScaledVector(p.v, dt);
    p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
    if (p.m.position.y < 0.05 && !S.theme.flying) { p.m.position.y = 0.05; p.v.set(0, 0, 0); }
    if (p.life <= 0) { actors.remove(p.m); S.particles.splice(i, 1); }
  }

  // heist meter
  $('ultFill').style.width = S.ult + '%';
  $('ultBtn').classList.toggle('ready', S.ult >= 100);

  beltTexs.forEach((tex, i) => { tex.offset.y = (time * (1.4 + i * 0.7)) % 1; });
  S.theme.tick(dt, time);
}

// Lost: the Grump keels over, the crew bounces, then the death screen slams in.
function deathSequence(dt, now) {
  S.deathT += dt;
  const k = Math.min(1, S.deathT / 0.7);
  const m = S.hero.mesh;
  m.rotation.z = k * 1.45;
  m.position.y = S.theme.grumpY + Math.sin(k * Math.PI) * 0.5 + k * 0.25;
  for (const e of S.enemies) e.model.position.y = Math.abs(Math.sin(now * 0.012 + e.phase)) * 0.3;
  const shake = Math.max(0, 0.6 - S.deathT) * 0.35;
  camera.position.set(camBase.x + (Math.random() - 0.5) * shake, camBase.y + (Math.random() - 0.5) * shake, camBase.z);
  if (S.deathT >= 1.5 && $('death').classList.contains('hidden')) showDeath();
}

// ================================================================ boot
window.__dbg = {
  place: (t, x, z) => canPlace(t, x, z) && placeTower(t, x, z), can: canPlace, upgrade, sell: sellTower, heist, pick,
  start: () => startWave(), load: (i) => loadLevel(i),
  step: (dt, n) => { for (let i = 0; i < n; i++) update(dt); },
  defs: { TOWERS, HERO, ENEMIES },
};
buildUi();
loadLevel(0);
S.playing = false;
showOverlay('Coal for Christmas', 'You are the Grump. Santa and his crew are hauling presents. Smash the gifts before 100 get delivered.', null);

let last = performance.now();
function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.playing) for (let i = 0; i < S.speed; i++) update(raw);
  else if (S.lost) { deathSequence(raw, now); S.theme.tick(raw, now / 1000); }
  else if (S.theme) S.theme.tick(raw, now / 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
