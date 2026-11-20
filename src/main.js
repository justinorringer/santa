import * as THREE from 'three';
import { spawnModel, makeGift } from './models.js';
import { buildTheme, makeConveyor, makeSpikes, makeCloudPuff, makeSleigh, beltTex, COLS, ROWS, key } from './scenery.js';
import { flat, lump, rock, box } from './kit.js';

// ================================================================ data
const MAX_DELIVERED = 100;

const LEVELS = [
  { name: 'The Warehouse', theme: 'snow', seed: 11, waves: 8, coal: 170, grump: [5, 4],
    blurb: 'Santa is stocking up for the big day. Smash the presents before they reach his warehouse.',
    path: [[-1, 2], [3, 2], [3, 7], [7, 7], [7, 2], [11, 2], [11, 6], [15, 6]] },
  { name: 'Sleigh Lanes', theme: 'sky', seed: 23, waves: 9, coal: 190, grump: [8, 5],
    blurb: 'They took to the clouds. Build on the cloud tops and knock the gifts out of the sky.',
    path: [[-1, 5], [2, 5], [2, 1], [6, 1], [6, 8], [10, 8], [10, 3], [13, 3], [13, 6], [15, 6]] },
  { name: 'Tinsel Street', theme: 'street', seed: 37, waves: 10, coal: 200, grump: [6, 3],
    blurb: 'Delivery night. Stop the crew before the presents make it under the town tree.',
    path: [[-1, 1], [4, 1], [4, 5], [1, 5], [1, 8], [8, 8], [8, 5], [12, 5], [12, 1], [15, 1]] },
];

const ENEMIES = {
  elf: { hp: 38, speed: 1.5, gifts: 1, reward: 5, scale: 0.62, push: 7 },
  reindeer: { hp: 60, speed: 2.25, gifts: 2, reward: 7, scale: 0.62, push: 9 },
  mrs_claus: { hp: 230, speed: 1.0, gifts: 4, reward: 16, scale: 0.7, push: 16 },
  santa: { hp: 1500, speed: 0.72, gifts: 15, reward: 80, scale: 0.92, push: 45 },
};

const TOWERS = {
  coal_chucker: { name: 'Coal Chucker', cost: 60, on: 'path', range: 2.0, rate: 1.25, dmg: 16, splash: 0.8, hp: 150, scale: 0.7, desc: 'Blocks the path and lobs coal' },
  conveyor: { name: 'Conveyor', cost: 30, on: 'path', slow: 0.35, desc: 'Drags them the wrong way' },
  spikes: { name: 'Spikes', cost: 40, on: 'path', dps: 26, desc: 'Shreds gifts passing over' },
  evil_reindeer: { name: 'Evil Reindeer', cost: 70, on: 'land', range: 2.6, rate: 0.32, dmg: 4, scale: 0.7, desc: 'Rapid sticky spit, slows' },
  toy_soldier: { name: 'Toy Soldier', cost: 90, on: 'land', range: 3.7, rate: 1.15, dmg: 28, scale: 0.66, desc: 'Long-range popgun' },
};
const TOWER_KEYS = Object.keys(TOWERS);

// ================================================================ renderer / scene
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
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
  camera.position.copy(target).addScaledVector(dir, dist);
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
      cells.set(key(x, z), { x, z, d: s.start + k, dir: s.dir });
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
  coal: 0, delivered: 0, broken: 0, wave: 0, waveActive: false, queue: [], waveT: 0, autoT: -1,
  enemies: [], towers: [], occupied: new Map(), projectiles: [], particles: [],
  selected: null, ghost: null, hover: null, speed: 1, playing: false, over: false, time: 0, snowCd: 0,
  grump: null, grumpJump: 0, grumpThrow: 0,
};
window.__game = S;
window.__dbg = { place: (t, x, z) => canPlace(t, x, z) && placeTower(t, x, z), start: () => startWave(), load: (i) => loadLevel(i), snow: (x, z) => throwSnowball(new THREE.Vector3(x, 0, z)) };
const actors = new THREE.Group();
scene.add(actors);

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

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
const floats = document.getElementById('floats');
function floatText(pos, text, cls = '') {
  const v = tmp2.copy(pos).project(camera);
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  el.style.left = ((v.x + 1) / 2) * window.innerWidth + 'px';
  el.style.top = ((1 - v.y) / 2) * window.innerHeight + 'px';
  floats.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
function makeBar(width, color) {
  const g = new THREE.Group();
  const bg = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x1b1b1e, depthTest: false }));
  bg.scale.set(width + 0.06, 0.12, 1);
  const fg = new THREE.Sprite(new THREE.SpriteMaterial({ color, depthTest: false }));
  fg.center.set(0, 0.5);
  fg.position.x = -width / 2;
  fg.scale.set(width, 0.07, 1);
  g.add(bg, fg);
  g.renderOrder = 10;
  g.visible = false;
  g.userData = { fg, width };
  return g;
}
function setBar(bar, ratio) {
  bar.visible = ratio < 0.999;
  bar.userData.fg.scale.x = Math.max(0.001, bar.userData.width * ratio);
}
const coalMat = flat('#26262B');
const ringGeo = new THREE.RingGeometry(0.97, 1, 48);
const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthTest: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5;
const hoverTile = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), new THREE.MeshBasicMaterial({ color: 0x6fa83a, transparent: true, opacity: 0.5, depthTest: false }));
hoverTile.rotation.x = -Math.PI / 2; hoverTile.visible = false; hoverTile.renderOrder = 4;
scene.add(ring, hoverTile);

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
  const n = Math.min(3, def.gifts > 3 ? 3 : def.gifts > 1 ? 2 : 1);
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
  const bar = makeBar(type === 'santa' ? 1.1 : 0.6, 0xe63946);
  bar.position.y = giftY + 0.45 * gs + (n > 1 ? 0.3 : 0);
  g.add(bar);
  const legs = [];
  model.traverse((o) => { if (o.name === 'leg') legs.push(o); });
  const hp = def.hp * hpMul;
  const e = { type, def, g, model, gift, giftScale: gs, giftY, bar, legs, legY: legs[0]?.position.y ?? 0, baseY, d: -0.6, hp, maxHp: hp, slowT: 0, state: 'walk', phase: Math.random() * 6, punch: 0, blocked: false, color: gift.children[0].userData.color };
  actors.add(g);
  S.enemies.push(e);
  placeEnemy(e);
  return e;
}
function placeEnemy(e) {
  S.path.pointAt(e.d, e.g.position, tmp);
  e.g.position.y = e.baseY;
  const sgn = e.state === 'flee' ? -1 : 1;
  const targetYaw = Math.atan2(tmp.x * sgn, tmp.z * sgn);
  let dy = targetYaw - e.g.rotation.y;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  e.g.rotation.y += dy * 0.25;
}
function giftPos(e, out) {
  return out.copy(e.g.position).setY(e.g.position.y + e.giftY);
}
function hit(e, dmg, source) {
  if (e.state !== 'walk') return;
  e.hp -= dmg;
  e.punch = 1;
  setBar(e.bar, Math.max(0, e.hp / e.maxHp));
  if (e.hp <= 0) breakGift(e, source);
}
function breakGift(e, source) {
  const p = giftPos(e, new THREE.Vector3());
  burst(p, e.color, 12);
  burst(p, '#F4C430', 5);
  e.g.remove(e.gift); e.g.remove(e.bar);
  e.state = 'flee';
  S.coal += e.def.reward;
  S.broken += e.def.gifts;
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

// ================================================================ towers
function makeTowerMesh(type, cell) {
  const def = TOWERS[type];
  let m;
  if (type === 'conveyor') {
    m = makeConveyor();
    const dir = cell?.dir;
    if (dir) m.rotation.y = Math.atan2(-dir.x, -dir.z);
  } else if (type === 'spikes') m = makeSpikes();
  else { m = spawnModel(type); m.scale.setScalar(def.scale); }
  return m;
}
function canPlace(type, x, z) {
  const def = TOWERS[type], k = key(x, z);
  if (S.occupied.has(k)) return false;
  if (def.on === 'path') return S.path.cells.has(k);
  return S.theme.buildable(x, z);
}
function placeTower(type, x, z) {
  const def = TOWERS[type], k = key(x, z);
  const cell = S.path.cells.get(k);
  const mesh = makeTowerMesh(type, cell);
  mesh.position.set(x + 0.5, type === 'coal_chucker' || def.on === 'path' ? 0.02 : 0.02, z + 0.5);
  actors.add(mesh);
  const t = { type, def, mesh, x, z, k, cd: 0.3, kick: 0, pop: 0, d: cell?.d, hp: def.hp, maxHp: def.hp };
  if (def.hp) { t.bar = makeBar(0.7, 0x6fa83a); t.bar.position.set(x + 0.5, 1.5, z + 0.5); actors.add(t.bar); }
  if (type === 'coal_chucker') { t.arm = mesh.getObjectByName('arm'); if (cell) mesh.rotation.y = Math.atan2(-cell.dir.x, -cell.dir.z); }
  S.towers.push(t);
  S.occupied.set(k, t);
  S.coal -= def.cost;
  burst(mesh.position.clone().setY(0.2), '#FFFFFF', 8, 1.6);
  updateHud();
}
function removeTower(t, destroyed) {
  actors.remove(t.mesh);
  if (t.bar) actors.remove(t.bar);
  S.towers.splice(S.towers.indexOf(t), 1);
  S.occupied.delete(t.k);
  if (destroyed) { burst(t.mesh.position.clone().setY(0.5), '#26262B', 16, 3); floatText(t.mesh.position.clone().setY(1), 'Knocked over!', 'bad'); }
}
function pickTarget(t) {
  let best = null, bestScore = -Infinity;
  const r2 = t.def.range * t.def.range;
  for (const e of S.enemies) {
    if (e.state !== 'walk' || e.d < 0) continue;
    const dx = e.g.position.x - t.mesh.position.x, dz = e.g.position.z - t.mesh.position.z;
    if (dx * dx + dz * dz > r2) continue;
    if (e.d > bestScore) { bestScore = e.d; best = e; }
  }
  return best;
}

// ================================================================ projectiles
const projGeo = { coal: lump(0.14), snow: rock(0.15, 1), spit: rock(0.08), bullet: box(0.07, 0.07, 0.22) };
const projMat = { coal: flat('#1F1F24'), snow: flat('#FFFFFF'), spit: new THREE.MeshBasicMaterial({ color: '#9BE564' }), bullet: new THREE.MeshBasicMaterial({ color: '#FFE08A' }) };
function shoot(kind, from, opts) {
  const m = new THREE.Mesh(projGeo[kind], projMat[kind]);
  m.position.copy(from);
  actors.add(m);
  S.projectiles.push({ kind, m, from: from.clone(), to: opts.to ? opts.to.clone() : new THREE.Vector3(), target: opts.target || null, t: 0, dur: opts.dur, arc: opts.arc || 0, onHit: opts.onHit });
}
function splash(pos, radius, dmg, source) {
  for (const e of [...S.enemies]) {
    if (e.state !== 'walk') continue;
    const dx = e.g.position.x - pos.x, dz = e.g.position.z - pos.z;
    if (dx * dx + dz * dz <= radius * radius) hit(e, dmg, source);
  }
}
function fireTower(t, e) {
  const from = t.mesh.position.clone();
  if (t.type === 'toy_soldier') {
    from.y = 0.7;
    t.kick = 1;
    shoot('bullet', from, { target: e, dur: Math.max(0.08, from.distanceTo(e.g.position) / 16), onHit: (tg) => tg && hit(tg, t.def.dmg, 'bullet') });
  } else if (t.type === 'evil_reindeer') {
    from.y = 0.55;
    t.kick = 0.6;
    shoot('spit', from, { target: e, dur: Math.max(0.08, from.distanceTo(e.g.position) / 10), onHit: (tg) => { if (tg) { tg.slowT = 1.2; hit(tg, t.def.dmg, 'spit'); } } });
  } else if (t.type === 'coal_chucker') {
    from.y = 1.0;
    t.kick = 1;
    const to = giftPos(e, new THREE.Vector3());
    shoot('coal', from, { to, dur: 0.45, arc: 1.0, onHit: (_, p) => { burst(p, '#26262B', 6, 1.6); splash(p, t.def.splash, t.def.dmg, 'coal'); } });
  }
}
function throwSnowball(point) {
  if (S.snowCd > 0 || !S.playing) return;
  S.snowCd = 1.2;
  S.grumpThrow = 1;
  const from = S.grump.position.clone().setY(1.3);
  const to = point.clone().setY(0.5);
  S.grump.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
  shoot('snow', from, { to, dur: 0.3 + from.distanceTo(to) * 0.035, arc: 1.4, onHit: (_, p) => { burst(p, '#FFFFFF', 9, 2); splash(p, 0.95, 24, 'snow'); } });
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
  S.coal += 20;
  S.autoT = 7;
  floatText(S.grump.position.clone().setY(2), 'Wave cleared! +20');
  updateHud();
}

// ================================================================ level lifecycle
function loadLevel(idx) {
  if (S.theme) scene.remove(S.theme.group);
  actors.clear();
  Object.assign(S, { levelIdx: idx, level: LEVELS[idx], enemies: [], towers: [], projectiles: [], particles: [], queue: [], wave: 0, waveActive: false, delivered: 0, broken: 0, over: false, autoT: -1, snowCd: 0, time: 0 });
  S.occupied = new Map();
  S.coal = S.level.coal;
  S.path = buildPath(S.level.path);
  S.theme = buildTheme(S.level, S.path);
  scene.add(S.theme.group);
  const T = S.theme.theme;
  scene.background = new THREE.Color(T.bg);
  scene.fog = new THREE.Fog(T.bg, 34, 70);
  hemi.color.set(T.hemi[0]); hemi.groundColor.set(T.hemi[1]); hemi.intensity = T.hemi[2];
  sun.color.set(T.sun[0]); sun.intensity = T.sun[1];
  S.grump = spawnModel('grump');
  S.grump.scale.setScalar(0.78);
  const [gx, gz] = S.level.grump;
  S.grump.position.set(gx + 0.5, S.theme.grumpY, gz + 0.5);
  actors.add(S.grump);
  select(null);
  S.playing = true;
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('levelName').textContent = `${idx + 1}. ${S.level.name}`;
  document.getElementById('waves').textContent = S.level.waves;
  updateHud();
  showHint('Place your gadgets, then start the wave');
}
function endGame(won) {
  S.over = true;
  S.playing = false;
  select(null);
  const next = S.levelIdx + 1 < LEVELS.length;
  showOverlay(
    won ? (next ? 'Christmas is cancelled… here' : 'Bah humbug, you win!') : 'Santa delivered 100 presents',
    won ? `You smashed ${S.broken} presents and only ${S.delivered} got through.` : `He made it past you on wave ${S.wave + 1}. ${S.broken} presents smashed.`,
    won && next ? S.levelIdx + 1 : null,
  );
}

// ================================================================ UI
const $ = (id) => document.getElementById(id);
let hintTimer;
function showHint(text) {
  const el = $('hint');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 2600);
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
}
function select(type) {
  if (S.ghost) { scene.remove(S.ghost); S.ghost = null; }
  S.selected = type;
  ring.visible = false; hoverTile.visible = false;
  if (S.level) updateHud();
  canvas.style.cursor = type ? 'copy' : 'crosshair';
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
  $('overlay').classList.remove('hidden');
}

// Dev helper: __dbg.lineup() shows a big render of every model.
function lineup() {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(380, 380, false);
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:#dfeaf2;display:grid;grid-template-columns:repeat(4,1fr);z-index:99;';
  for (const name of ['santa', 'mrs_claus', 'elf', 'reindeer', 'evil_reindeer', 'toy_soldier', 'coal_chucker', 'grump']) {
    const obj = spawnModel(name);
    const gift = makeGift(); gift.position.y = obj.userData.height + 0.3; if (['santa', 'mrs_claus', 'elf', 'reindeer'].includes(name)) obj.add(gift);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0xa8c4d8, 1.15));
    const d = new THREE.DirectionalLight(0xfff4e0, 1.5); d.position.set(-3, 8, 6); sc.add(d);
    obj.rotation.y = 0.5; sc.add(obj);
    const cam = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 60);
    cam.position.set(0, 4.2, 9); cam.lookAt(0, 1.15, 0);
    r.render(sc, cam);
    const img = new Image(); img.src = r.domElement.toDataURL(); img.style.cssText = 'width:100%;height:100%;object-fit:contain';
    wrap.appendChild(img);
  }
  r.dispose();
  wrap.onclick = () => wrap.remove();
  document.body.appendChild(wrap);
}
window.__dbg.lineup = lineup;
window.__dbg.step = (dt, n) => { for (let i = 0; i < n; i++) update(dt); };
window.__dbg.can = canPlace;

function renderIcons() {
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setSize(192, 192, false);
  const icon = (obj, yaw = 0.45) => {
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
  };
  const out = { grump: icon(spawnModel('grump'), 0.35) };
  for (const k of TOWER_KEYS) out[k] = icon(makeTowerMesh(k, null), k === 'conveyor' || k === 'spikes' ? 0.6 : 0.45);
  r.dispose();
  return out;
}

function buildUi() {
  const icons = renderIcons();
  $('portrait').src = icons.grump;
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
  $('speedBtn').onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1; $('speedBtn').textContent = S.speed + '×'; };
  $('menuBtn').onclick = () => { S.playing = false; showOverlay('Coal for Christmas', 'Pick a level.', null); };
  window.addEventListener('keydown', (ev) => {
    if (ev.key >= '1' && ev.key <= '5') select(TOWER_KEYS[+ev.key - 1]);
    else if (ev.key === 'Escape') select(null);
    else if (ev.key === ' ') { ev.preventDefault(); startWave(); }
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
const hoverPoint = new THREE.Vector3();
function refreshGhost() {
  const h = S.hover;
  if (!S.selected || !h || !h.inside) { hoverTile.visible = false; ring.visible = false; if (S.ghost) S.ghost.visible = false; return; }
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
  ring.visible = !!def.range;
  if (def.range) { ring.position.set(h.x + 0.5, 0.05, h.z + 0.5); ring.scale.setScalar(def.range); }
}
canvas.addEventListener('pointermove', (ev) => { S.hover = pointerCell(ev, hoverPoint); refreshGhost(); });
canvas.addEventListener('pointerleave', () => { S.hover = null; refreshGhost(); });
canvas.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0 || !S.playing) return;
  const p = new THREE.Vector3();
  const c = pointerCell(ev, p);
  if (!c) return;
  if (!S.selected) return throwSnowball(p);
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
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  if (S.selected) return select(null);
  const c = pointerCell(ev, new THREE.Vector3());
  const t = c && S.occupied.get(key(c.x, c.z));
  if (t && S.playing) {
    const refund = Math.floor(t.def.cost * 0.6);
    S.coal += refund;
    floatText(t.mesh.position.clone().setY(1), `Sold +${refund}`);
    removeTower(t, false);
    updateHud();
  }
});

// ================================================================ update
function update(dt) {
  S.time += dt;
  const time = S.time;

  // spawning
  if (S.waveActive) {
    S.waveT += dt;
    const hpMul = (1 + 0.3 * S.wave) * (1 + 0.35 * S.levelIdx);
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
  const blockers = S.towers.filter((t) => t.type === 'coal_chucker');
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    const ph = time * (e.state === 'flee' ? 16 : 5 + e.def.speed * 2.5) + e.phase;
    if (e.state === 'walk') {
      let sp = e.def.speed * (e.slowT > 0 ? 0.6 : 1);
      e.slowT -= dt;
      const trap = S.occupied.get(key(Math.floor(e.g.position.x), Math.floor(e.g.position.z)));
      if (trap?.type === 'conveyor') sp *= trap.def.slow;
      else if (trap?.type === 'spikes') { trap.pop = 1; hit(e, trap.def.dps * dt, 'spikes'); if (e.state !== 'walk') continue; }
      let nd = e.d + sp * dt;
      e.blocked = false;
      for (const b of blockers) {
        const stopAt = b.d - 0.55;
        if (e.d <= stopAt + 0.01 && nd > stopAt) { nd = stopAt; e.blocked = true; b.hp -= e.def.push * dt; b.shake = 1; }
      }
      e.d = nd;
      if (e.d >= S.path.total) { deliver(e); continue; }
      e.punch = Math.max(0, e.punch - dt * 6);
      e.gift.scale.setScalar(e.giftScale * (1 + e.punch * 0.22));
      e.gift.position.y = e.giftY + Math.sin(ph * 0.6) * 0.03;
      e.gift.rotation.z = Math.sin(ph * 0.5) * 0.06;
    } else {
      e.d -= 3.6 * dt;
      if (e.d < -1.6) { removeEnemy(e); continue; }
    }
    placeEnemy(e);
    const hop = e.blocked ? 0.3 : 1;
    e.model.position.y = (S.theme.flying && e.type === 'santa' ? 0.2 : 0) + Math.abs(Math.sin(ph)) * (e.state === 'flee' ? 0.12 : 0.05) * hop;
    e.model.rotation.z = Math.sin(ph) * (e.state === 'flee' ? 0.16 : 0.07);
    for (let l = 0; l < e.legs.length; l++) e.legs[l].position.y = e.legY + Math.max(0, Math.sin(ph + (l === 0 || l === 3 ? 0 : Math.PI))) * 0.09;
    if (S.theme.flying) e.g.position.y = e.baseY + Math.sin(time * 2 + e.phase) * 0.06;
  }

  // towers
  for (let i = S.towers.length - 1; i >= 0; i--) {
    const t = S.towers[i];
    if (t.type === 'spikes') {
      t.pop = Math.max(0, t.pop - dt * 4);
      t.mesh.getObjectByName('spikes').position.y = -0.1 + t.pop * 0.12;
      continue;
    }
    if (t.type === 'conveyor') continue;
    if (t.hp !== undefined && t.maxHp) {
      setBar(t.bar, Math.max(0, t.hp / t.maxHp));
      if (t.hp <= 0) { removeTower(t, true); continue; }
      t.shake = Math.max(0, (t.shake || 0) - dt * 5);
      t.mesh.rotation.z = Math.sin(time * 40) * 0.05 * t.shake;
    }
    t.cd -= dt;
    t.kick = Math.max(0, t.kick - dt * 5);
    const s = t.def.scale;
    t.mesh.scale.set(s * (1 + t.kick * 0.08), s * (1 - t.kick * 0.1), s * (1 + t.kick * 0.08));
    if (t.arm) t.arm.rotation.x = -t.kick * 1.3;
    const target = pickTarget(t);
    if (target) {
      const yaw = Math.atan2(target.g.position.x - t.mesh.position.x, target.g.position.z - t.mesh.position.z);
      let dy = yaw - t.mesh.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      t.mesh.rotation.y += dy * Math.min(1, dt * 12);
      if (t.cd <= 0) { fireTower(t, target); t.cd = t.def.rate; }
    } else if (t.type !== 'coal_chucker') {
      t.mesh.position.y = 0.02 + Math.abs(Math.sin(time * 2 + t.x)) * 0.015;
    }
  }

  // projectiles
  for (let i = S.projectiles.length - 1; i >= 0; i--) {
    const p = S.projectiles[i];
    p.t += dt / p.dur;
    if (p.target) {
      if (p.target.state === 'walk') giftPos(p.target, p.to);
      else p.target = null, (p.lost = true);
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

  // grump
  S.snowCd = Math.max(0, S.snowCd - dt);
  S.grumpJump = Math.max(0, S.grumpJump - dt * 3);
  S.grumpThrow = Math.max(0, S.grumpThrow - dt * 4);
  const g = S.grump;
  g.position.y = S.theme.grumpY + Math.sin(S.grumpJump * Math.PI) * 0.35 + Math.sin(time * 2) * 0.012;
  const gs = 0.78;
  g.scale.set(gs * (1 + S.grumpThrow * 0.1), gs * (1 - S.grumpThrow * 0.12 + Math.sin(time * 2) * 0.012), gs * (1 + S.grumpThrow * 0.1));
  $('snowState').textContent = S.snowCd > 0 ? S.snowCd.toFixed(1) + 's' : 'ready';

  beltTex.offset.y = (time * 1.4) % 1;
  S.theme.tick(dt, time);
}

// ================================================================ boot
buildUi();
loadLevel(0);
S.playing = false;
showOverlay('Coal for Christmas', 'You are the Grump. Santa and his crew are hauling presents. Smash the gifts before 100 get delivered.', null);

let last = performance.now();
function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (S.playing) {
    const steps = S.speed;
    for (let i = 0; i < steps; i++) update(raw);
  } else if (S.theme) {
    S.theme.tick(raw, now / 1000);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
