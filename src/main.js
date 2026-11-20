import * as THREE from 'three';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { spawnModel, spawnTower, makeGift, MODEL_NAMES } from './models.js';
import { buildTheme, makeConveyor, makeSpikes, makeCoalPile, setPile, makeSleigh, beltTexs, COLS, ROWS, key } from './scenery.js';
import { buildPath } from './path.js';
import { makeAircraft, makeGondola, makeCookies } from './props.js';
import { flat, glow, lump, rock, box } from './kit.js';

// ================================================================ data
const MAX_DELIVERED = 100;
const MAX_LEVEL = 4;
const SAVE_KEY = 'coal-for-christmas-level';

// paths are smooth curves through these points; they start off-screen and end at the goal
const LEVELS = [
  { name: 'The Warehouse', theme: 'snow', seed: 11, waves: 8, coal: 170, santaHits: 60,
    lake: { x: 5.5, z: 5.7, rx: 1.5, rz: 1.35 },
    peaks: [[13, 1, 1.25, 2.7], [1, 9, 1.2, 2.3], [10.4, 8.5, 1.2, 2.9], [13.2, 9.3, 1.0, 2.1]], // [x, z, radius, height]
    paths: [[[-9, 2.5], [-2, 2.5], [2.2, 2.2], [3.8, 4.2], [3.1, 7.0], [5.2, 8.6], [7.7, 7.0], [7.4, 3.6], [9.2, 1.7], [11.5, 2.6], [11.6, 5.2], [13.4, 6.6], [16.6, 6.5]]] },
  { name: 'Sleigh Lanes', theme: 'sky', seed: 23, waves: 9, coal: 190, santaHits: 80, bossPath: 1,
    paths: [
      [[-9, 5.5], [-1, 5.5], [2, 4.6], [3, 2.2], [5.4, 1.3], [7, 3], [6.6, 6.4], [8.2, 8.4], [10.5, 7.4], [10.6, 4.4], [12.4, 2.7], [13.9, 4.4], [14.2, 6], [16.4, 6.5]],
      [[9, -9], [9, -2], [8.8, 1.4], [8.9, 4.2], [9.3, 6.2], [10.5, 7.4], [10.6, 4.4], [12.4, 2.7], [13.9, 4.4], [14.2, 6], [16.4, 6.5]], // Santa's sled run
    ] },
  { name: 'Tinsel Street', theme: 'street', seed: 37, waves: 10, coal: 210, santaHits: 100,
    paths: [[[-9, 1.5], [-1, 1.5], [3.2, 1.4], [4.6, 3], [3.6, 5], [1.7, 5.9], [1.5, 8], [3.6, 8.9], [7, 8.5], [8.4, 6.6], [8.6, 4.8], [11, 4.5], [12.4, 3], [12.7, 1.5], [14.6, 1.2], [16.4, 1.5]]] },
];

// Health is counted in hits. Almost every attack is one hit.
const ENEMIES = {
  elf: { hits: 3, speed: 1.5, gifts: 1, reward: 2, scale: 0.62, craft: 'plane' },
  reindeer: { hits: 2, speed: 2.3, gifts: 2, reward: 2, scale: 0.62, craft: 'biplane' }, // faster than elves, one hit fewer
  mrs_claus: { hits: 8, speed: 1.0, gifts: 4, reward: 7, scale: 0.66, craft: 'airship' },
  santa: { hits: 50, speed: 0.72, gifts: 15, reward: 50, scale: 0.92, boss: true },
};

// levels[0] is the base gadget; levels[1..3] are the upgrades (name, cost, what changes).
const TOWERS = {
  coal_chucker: { name: 'Coal Chucker', cost: 70, on: 'land', scale: 0.68, desc: 'Lobs coal piles onto the path. Each pile hits whoever walks over it until it is used up.', levels: [
    { range: 2.4, rate: 3.2, dmg: 1, hits: 3, maxPiles: 3 },
    { name: 'Hot Coals', cost: 80, desc: 'Coals set gifts on fire for extra hits over time.', range: 2.4, rate: 2.8, dmg: 1, hits: 4, maxPiles: 4, burn: 2 },
    { name: 'Coal Cart', cost: 130, desc: 'Throws much faster with bigger piles and more reach.', range: 3.0, rate: 2.0, dmg: 1, hits: 5, maxPiles: 5, burn: 2 },
    { name: 'Meltdown', cost: 230, desc: 'Used-up piles explode.', range: 3.2, rate: 1.6, dmg: 1, hits: 7, maxPiles: 6, burn: 3, explode: 2 },
  ] },
  conveyor: { name: 'Conveyor', cost: 30, on: 'path', desc: 'A belt on the path that drags carriers the wrong way.', levels: [
    { slow: 0.4 },
    { name: 'Greased Rollers', cost: 40, desc: 'Much stronger drag.', slow: 0.25 },
    { name: 'Reverse Gear', cost: 90, desc: 'Flings carriers back down the path every few seconds.', slow: 0.25, kick: 2, kickEvery: 3 },
    { name: 'Gift Shredder', cost: 160, desc: 'Toothed rollers grind gifts while they are stuck.', slow: 0.2, kick: 2.5, kickEvery: 2.5, grind: 1.2 },
  ] },
  spikes: { name: 'Spikes', cost: 45, on: 'path', desc: 'Stabs every gift that passes over.', levels: [
    { dmg: 1, every: 1.2 },
    { name: 'Sharpened', cost: 50, desc: 'Stabs much faster.', dmg: 1, every: 0.8 },
    { name: 'Icicles', cost: 100, desc: 'Every stab freezes the carrier to half speed.', dmg: 1, every: 0.8, freeze: 1.5 },
    { name: 'Gift Grinder', cost: 180, desc: 'Double hits, wider reach, and torn wrapping keeps taking hits.', dmg: 2, every: 0.7, freeze: 1.5, radius: 1.1, bleed: 2 },
  ] },
  evil_reindeer: { name: 'Evil Reindeer', cost: 70, on: 'land', scale: 0.7, desc: 'Sticky spit that slows carriers.', levels: [
    { range: 2.6, rate: 1.1, dmg: 1, slow: 0.6, slowT: 1.2, shots: 1 },
    { name: 'Sticky Spit', cost: 70, desc: 'Spits faster and slows harder.', range: 2.8, rate: 0.9, dmg: 1, slow: 0.45, slowT: 2, shots: 1 },
    { name: 'Triple Spit', cost: 130, desc: 'Spits at three carriers at once.', range: 3.0, rate: 0.9, dmg: 1, slow: 0.45, slowT: 2, shots: 3 },
    { name: 'Acid Rain', cost: 220, desc: 'Spit splashes and keeps corroding gifts.', range: 3.4, rate: 0.8, dmg: 1, slow: 0.4, slowT: 2.5, shots: 3, splash: 0.8, acid: 2 },
  ] },
  toy_soldier: { name: 'Evil Toy Soldier', cost: 100, on: 'land', scale: 0.66, sniper: true, desc: 'Sniper. Shoots anything it can see, at any distance. Trees, rocks, peaks, houses and storm clouds block its view.', levels: [
    { dmg: 2, rate: 2.2, shots: 1, pierce: 1 },
    { name: 'Piercing Shots', cost: 100, desc: 'Shots punch straight through a line of carriers.', dmg: 2, rate: 2.0, shots: 1, pierce: 3 },
    { name: 'Double Barrel', cost: 160, desc: 'A second gun: two shots per volley.', dmg: 2, rate: 1.9, shots: 2, pierce: 3 },
    { name: 'Cannon Captain', cost: 280, desc: 'Swaps bullets for explosive cannonballs.', dmg: 3, rate: 1.8, shots: 2, pierce: 1, splash: 1.1 },
  ] },
  snowman: { name: 'Snowman', cost: 90, on: 'land', scale: 0.7, ice: true, desc: 'Bowls a giant snowball down a straight lane. It flattens everything in the way but shrinks, and hits softer, the further it rolls. Can stand on the frozen lake.', levels: [
    { range: 3.2, rate: 5.0, len: 5, dmg: 3 },
    { name: 'Packed Snow', cost: 80, desc: 'A bigger ball that rolls further, more often.', range: 3.4, rate: 4.4, len: 6, dmg: 4 },
    { name: 'Ice Core', cost: 140, desc: 'An ice ball that stuns whatever it bowls over.', range: 3.6, rate: 4.0, len: 7, dmg: 4, stun: 0.7 },
    { name: 'Avalanche', cost: 240, desc: 'An enormous ball that bursts at the end of its run.', range: 3.8, rate: 3.5, len: 8, dmg: 6, stun: 0.9, burst: 1.3 },
  ] },
};
// One hero on the board at a time. Each brings its own ult on Q.
const HEROES = {
  grump: { name: 'The Grump', cost: 0, on: 'land', scale: 0.78, hero: true, hot: 'G', ult: { name: 'Present Heist', glyph: '🎁', desc: 'Steal every present on the board, raid Santa for a third of his health, and take 3 back from the pile.' },
    desc: 'Throws snowballs on his own. His ult is the Present Heist.', levels: [
      { range: 6, rate: 1.8, dmg: 1, splash: 0.8, shots: 1 },
      { name: 'Ice Balls', cost: 80, desc: 'Throws faster and chills carriers.', range: 6.5, rate: 1.5, dmg: 1, splash: 0.85, shots: 1, chill: 1.5 },
      { name: 'Double Throw', cost: 140, desc: 'Two snowballs at once.', range: 7, rate: 1.5, dmg: 1, splash: 0.9, shots: 2, chill: 1.5 },
      { name: 'Avalanche', cost: 250, desc: 'Giant double-hit snowballs, and the ult charges 50% faster.', range: 8, rate: 1.3, dmg: 2, splash: 1.5, shots: 2, chill: 2, ultBoost: 1.5 },
    ] },
  jack_frost: { name: 'Jack Frost', cost: 0, on: 'land', scale: 0.74, hero: true, ice: true, hot: 'J', ult: { name: 'Deep Freeze', glyph: '❄️', desc: 'Freeze every carrier on the board solid for 4 seconds and crack each gift twice.' },
    desc: 'Blows a straight icy gust that cracks gifts and knocks everyone in it back down the path. Can stand on the frozen lake. His ult is Deep Freeze.', levels: [
      { range: 3.2, rate: 3.6, len: 4, width: 0.8, push: 1.8, dmg: 1 },
      { name: 'Cold Snap', cost: 80, desc: 'Harder gusts that chill carriers.', range: 3.4, rate: 3.3, len: 4.6, width: 0.85, push: 2.3, chill: 2, dmg: 1 },
      { name: 'Blizzard', cost: 140, desc: 'A longer, wider gust that hits twice as hard.', range: 3.8, rate: 3.0, len: 5.6, width: 1.1, push: 2.8, chill: 2.5, dmg: 2 },
      { name: 'Polar Vortex', cost: 250, desc: 'Freezes carriers solid before flinging them back, and the ult charges 50% faster.', range: 4.2, rate: 2.7, len: 6.4, width: 1.2, push: 3.4, chill: 3, dmg: 3, stun: 1.2, ultBoost: 1.5 },
    ] },
};
const TOWER_KEYS = Object.keys(TOWERS);
const HERO_KEYS = Object.keys(HEROES);
const DEFS = { ...HEROES, ...TOWERS };
const CARDS = [...HERO_KEYS, ...TOWER_KEYS];
const stat = (t) => t.def.levels[t.level - 1];
const LABELS = {
  dmg: 'Hits', shots: 'Shots per volley', rate: 'Seconds between shots', range: 'Range', pierce: 'Carriers pierced', splash: 'Blast radius',
  hits: 'Hits per pile', maxPiles: 'Piles at once', burn: 'Burn (extra hits)', explode: 'Explosion hits',
  slow: 'Speed multiplier', slowT: 'Slow lasts (s)', acid: 'Acid (extra hits)',
  kick: 'Fling distance', kickEvery: 'Fling every (s)', grind: 'Seconds per grind hit',
  every: 'Seconds between stabs', freeze: 'Freeze lasts (s)', radius: 'Reach', bleed: 'Torn wrapping (extra hits)',
  len: 'Lane length', width: 'Gust width', push: 'Blow-back distance', chill: 'Chill lasts (s)', stun: 'Frozen solid (s)', burst: 'Burst radius', ultBoost: 'Ult charge speed ×',
};

// ================================================================ renderer / scene
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const INK = { defaultThickness: 0.0032, defaultColor: [0.1, 0.1, 0.15], defaultAlpha: 1 };
const outline = new OutlineEffect(renderer, INK); // cel-shading ink lines
const NO_INK = { outlineParameters: { visible: false } };

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const camBase = new THREE.Vector3(), lookBase = new THREE.Vector3();
const hemi = new THREE.HemisphereLight(0xffffff, 0xa8c4d8, 1.1);
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(2, 16, 12);
sun.target.position.set(8, 0, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 13, bottom: -13, near: 1, far: 50 });
sun.shadow.bias = -0.0015;
scene.add(hemi, sun, sun.target);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const dist = 18.5 * Math.max(1, 1.5 / camera.aspect);
  lookBase.set(COLS / 2 + 0.6, 0, ROWS / 2 + 1.7);
  camBase.copy(lookBase).addScaledVector(new THREE.Vector3(0, 0.8, 0.6).normalize(), dist);
  if (!cut.active) { camera.position.copy(camBase); camera.lookAt(lookBase); }
  camera.updateProjectionMatrix();
}

// ================================================================ state
const S = {
  levelIdx: 0, level: null, paths: [], slots: [], theme: null,
  coal: 0, delivered: 0, broken: 0, built: 0, wave: 0, waveActive: false, queue: [], waveT: 0,
  enemies: [], towers: [], occupied: new Map(), piles: new Map(), pending: new Set(), projectiles: [], particles: [], fx: [], rolls: [],
  selected: null, picked: null, ghost: null, hover: null, speed: 1, playing: false, paused: false, over: false, lost: false, deathT: 0, time: 0,
  hero: null, heroJump: 0, ult: 0, santa: null,
};
const cut = { active: false, beats: [], i: -1, t: 0, done: null, from: new THREE.Vector3(), fromLook: new THREE.Vector3(), look: new THREE.Vector3() };
window.__game = S;
const actors = new THREE.Group();
scene.add(actors);
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const $ = (id) => document.getElementById(id);
const heroBoost = () => (S.hero ? stat(S.hero).ultBoost || 1 : 0);
window.addEventListener('resize', resize);
resize();

// ================================================================ fx helpers
const pGeo = box(0.1, 0.1, 0.1);
const pMats = {};
function burst(pos, color, n = 10, speed = 2.6, opts = {}) {
  let mat = pMats[color];
  if (!mat) { mat = pMats[color] = flat(color); mat.userData = NO_INK; }
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(pGeo, mat);
    m.position.copy(pos);
    m.scale.setScalar(0.6 + Math.random() * 1.2);
    actors.add(m);
    const v = opts.dir
      ? opts.dir.clone().multiplyScalar(speed * (0.5 + Math.random() * 0.7)).add(new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 1.2, (Math.random() - 0.5) * 1.6))
      : new THREE.Vector3((Math.random() - 0.5) * speed, 1.5 + Math.random() * speed, (Math.random() - 0.5) * speed);
    S.particles.push({ m, v, g: opts.dir ? 1.5 : 9, life: (opts.life || 0.7) + Math.random() * 0.4 });
  }
}
const floats = $('floats');
function floatText(pos, text, cls = '') {
  const v = tmp2.copy(pos).project(camera);
  const el = document.createElement('div');
  el.className = 'float ' + cls;
  el.textContent = text;
  el.style.left = Math.max(70, Math.min(window.innerWidth - 120, ((v.x + 1) / 2) * window.innerWidth)) + 'px';
  el.style.top = Math.max(60, ((1 - v.y) / 2) * window.innerHeight) + 'px';
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
const overlayMat = (color, opacity) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthTest: false }); m.userData = NO_INK; return m; };
const ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), overlayMat(0xffffff, 0.75));
ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 5;
// the only hint of the grid: the tile (or path slot) the pointer snaps to
const hoverTile = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), overlayMat(0x6fa83a, 0.5));
hoverTile.rotation.order = 'YXZ'; hoverTile.rotation.x = -Math.PI / 2; hoverTile.visible = false; hoverTile.renderOrder = 4;
scene.add(ring, hoverTile);
// path spots a sniper can see
const visGeo = new THREE.CircleGeometry(0.24, 12), visMat = overlayMat(0xffd23f, 0.7), visPool = [];
function showVision(spots) {
  spots.forEach((c, i) => {
    let m = visPool[i];
    if (!m) { m = visPool[i] = new THREE.Mesh(visGeo, visMat); m.rotation.x = -Math.PI / 2; m.renderOrder = 4; scene.add(m); }
    m.position.set(c.x, 0.04, c.z);
    m.visible = true;
  });
  for (let i = spots.length; i < visPool.length; i++) visPool[i].visible = false;
}
function flash(ice) {
  const f = $('flash');
  f.classList.remove('go');
  f.classList.toggle('ice', !!ice);
  void f.offsetWidth;
  f.classList.add('go');
  setTimeout(() => f.classList.remove('go'), 600);
}

// ================================================================ enemies
function spawnEnemy(type) {
  const def = ENEMIES[type];
  const g = new THREE.Group();
  const model = spawnModel(type);
  model.scale.setScalar(def.scale);
  g.add(model);
  const flying = S.theme.flying;
  let baseY = 0, props = [];
  if (flying) { // the whole crew is airborne: planes, a flying boat, and the sleigh
    baseY = 0.45;
    const craft = def.boss ? makeSleigh() : makeAircraft(def.craft);
    if (def.boss) { craft.scale.setScalar(0.72); craft.position.y = -0.1; model.position.y = 0.2; }
    craft.traverse((o) => { if (o.name === 'prop') props.push(o); });
    g.add(craft);
  }
  const giftY = model.userData.height * def.scale + 0.24 + (flying && def.boss ? 0.2 : 0);
  const gift = new THREE.Group();
  const n = def.gifts > 3 ? 3 : def.gifts > 1 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const b = makeGift();
    b.scale.setScalar(i === 0 ? 1 : 0.72);
    b.position.set(i === 2 ? 0.1 : i === 1 ? -0.08 : 0, i === 0 ? 0 : 0.2 + i * 0.16, 0);
    b.rotation.y = i * 0.6;
    gift.add(b);
  }
  const gs = def.boss ? 1.25 : type === 'mrs_claus' ? 0.95 : 0.8;
  gift.scale.setScalar(gs);
  gift.position.y = giftY;
  g.add(gift);
  const bar = makeBar(0.62);
  bar.position.y = giftY + 0.45 * gs + (n > 1 ? 0.3 : 0);
  g.add(bar);
  const legs = [];
  model.traverse((o) => { if (o.name === 'leg') legs.push(o); });
  const hp = def.boss ? S.level.santaHits : def.hits;
  const e = {
    type, def, g, model, gift, giftScale: gs, giftY, bar, legs, legY: legs.map((l) => l.position.y), head: model.getObjectByName('head'), baseY, props,
    path: S.paths[def.boss ? S.level.bossPath || 0 : 0], d: 0, hp, maxHp: hp, state: 'walk', phase: Math.random() * 6, punch: 0, hop: 0,
    slowT: 0, slowMul: 1, dotLeft: 0, dotTick: 0, dotSrc: '', stunT: 0, pileCd: 0, grindT: 0, color: gift.children[0].userData.color,
  };
  actors.add(g);
  S.enemies.push(e);
  placeEnemy(e);
  e.g.rotation.y = Math.atan2(tmp.x, tmp.z);
  return e;
}
function placeEnemy(e) {
  e.path.pointAt(e.d, e.g.position, tmp);
  e.g.position.y = e.baseY;
  const sgn = e.state === 'flee' ? -1 : 1;
  let dy = Math.atan2(tmp.x * sgn, tmp.z * sgn) - e.g.rotation.y;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  e.g.rotation.y += dy * 0.25;
}
/** Walk / flee / frozen body animation, shared by carriers and cutscene actors. */
function animate(a, time, mode) {
  const ph = time * (mode === 'run' ? 16 : 5 + (a.def?.speed || 1) * 2.5) + a.phase;
  const frozen = mode === 'frozen';
  const y0 = a.modelY || 0;
  a.model.position.y = y0 + (frozen ? 0 : Math.abs(Math.sin(ph)) * (mode === 'run' ? 0.12 : 0.05)) + Math.sin((a.hop || 0) * Math.PI) * 0.5;
  a.model.rotation.z = frozen ? 0 : Math.sin(ph) * (mode === 'run' ? 0.16 : 0.07);
  if (a.head) a.head.rotation.z = frozen ? 0 : Math.sin(ph + 1) * 0.1;
  for (let l = 0; l < a.legs.length; l++) a.legs[l].position.y = a.legY[l] + (frozen ? 0 : Math.max(0, Math.sin(ph + (l === 0 || l === 3 ? 0 : Math.PI))) * 0.09);
  return ph;
}
const giftPos = (e, out) => out.copy(e.g.position).setY(e.g.position.y + e.giftY);
const onBoard = (e) => e.g.position.x > -0.4 && e.g.position.x < COLS + 0.9 && e.g.position.z > -0.4 && e.g.position.z < ROWS + 0.4;
function hit(e, n, source, quiet) {
  if (e.state !== 'walk') return;
  e.hp -= n;
  if (!quiet) e.punch = 1;
  if (!e.def.boss) setBar(e.bar, e.hp / e.maxHp); // the boss gets the big bar at the bottom instead
  if (e.hp <= 0) breakGift(e, source);
}
function applySlow(e, mul, t) {
  e.slowMul = e.slowT > 0 ? Math.min(e.slowMul, mul) : mul;
  e.slowT = Math.max(e.slowT, t);
}
/** Burn / acid / torn wrapping: n more hits, one every 1.5s. */
function applyDot(e, n, src) {
  if (e.dotLeft <= 0) e.dotTick = 1.5;
  e.dotLeft = Math.max(e.dotLeft, n);
  e.dotSrc = src;
}
function blowBack(e, dist) {
  e.d = Math.max(0.5, e.d - dist * (e.def.boss ? 0.4 : 1));
  e.hop = 1;
}
function loseGift(e) {
  e.g.remove(e.gift); e.g.remove(e.bar);
  e.state = 'flee';
  S.coal += e.def.reward;
  S.broken += e.def.gifts;
  S.ult = Math.min(100, S.ult + e.def.gifts * 0.5 * heroBoost());
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
  S.heroJump = 1;
  if (S.level) updateHud();
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
  const out = [], r2 = r * r;
  for (const e of S.enemies) {
    if (e.state !== 'walk') continue;
    const dx = e.g.position.x - x, dz = e.g.position.z - z;
    if (dx * dx + dz * dz <= r2) out.push(e);
  }
  return out;
}
/** Up to n walking carriers, furthest along first. Snipers use what they can see instead of a range. */
function pickTargets(t, L, n) {
  const pos = t.mesh.position, r2 = (L.range || 0) ** 2, list = [];
  for (const e of S.enemies) {
    if (e.state !== 'walk' || !onBoard(e)) continue;
    const ex = e.g.position.x, ez = e.g.position.z;
    if (t.def.sniper) { if (!lineOfSight(t.px, t.pz, ex, ez)) continue; }
    else if ((ex - pos.x) ** 2 + (ez - pos.z) ** 2 > r2) continue;
    list.push(e);
  }
  list.sort((a, b) => (b.path.total - b.d) - (a.path.total - a.d)).reverse(); // closest to the goal first
  return list.slice(0, n);
}
function splashEach(pos, radius, fn) {
  for (const e of [...S.enemies]) {
    if (e.state !== 'walk') continue;
    const dx = e.g.position.x - pos.x, dz = e.g.position.z - pos.z;
    if (dx * dx + dz * dz <= radius * radius) fn(e);
  }
}
/** Walking carriers inside a straight lane from (ox, oz) along dir, nearest first. */
function inLane(ox, oz, dir, len, halfWidth) {
  const out = [];
  for (const e of S.enemies) {
    if (e.state !== 'walk') continue;
    const dx = e.g.position.x - ox, dz = e.g.position.z - oz;
    const along = dx * dir.x + dz * dir.z;
    if (along < 0 || along > len) continue;
    if (Math.abs(dx * dir.z - dz * dir.x) <= halfWidth) out.push({ e, along });
  }
  return out.sort((a, b) => a.along - b.along).map((o) => o.e);
}

// ---- line of sight (snipers)
function lineOfSight(ax, az, bx, bz) {
  const own = key(Math.floor(ax), Math.floor(az));
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2);
  for (let i = 1; i < n; i++) {
    const k = key(Math.floor(ax + ((bx - ax) * i) / n), Math.floor(az + ((bz - az) * i) / n));
    if (k !== own && S.theme.opaque.has(k)) return false;
  }
  return true;
}
const seenSlots = (px, pz) => S.slots.filter((c) => lineOfSight(px, pz, c.x, c.z));

// ================================================================ gadgets
function makeTowerMesh(type, slot, level = 1) {
  if (type === 'conveyor' || type === 'spikes') {
    const m = type === 'conveyor' ? makeConveyor(level) : makeSpikes(level);
    if (slot) m.rotation.y = Math.atan2(-slot.dir.x, -slot.dir.z); // belts push back the way they came
    return m;
  }
  const m = MODEL_NAMES.includes(type) ? spawnTower(type, level) : new THREE.Mesh(box(0.8, 1.4, 0.8), flat('#FFFFFF'));
  m.scale.setScalar(DEFS[type].scale * (1 + 0.06 * (level - 1)));
  return m;
}
/** (Re)builds a gadget's mesh for its current level. */
function refreshMesh(t) {
  const yaw = t.mesh ? t.mesh.rotation.y : 0;
  if (t.mesh) actors.remove(t.mesh);
  t.mesh = makeTowerMesh(t.type, t.slot, t.level);
  t.mesh.position.set(t.px, 0.02, t.pz);
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
  t.ball = t.mesh.getObjectByName('ball');
  if (t.type === 'coal_chucker') { const r = stat(t).range; t.slots = S.slots.filter((c) => Math.hypot(c.x - t.px, c.z - t.pz) <= r); }
  if (t.def.sniper) t.seen = seenSlots(t.px, t.pz);
  t.mesh.userData.gadget = t;
  actors.add(t.mesh);
}
/** Where a gadget of this type would go for a pointer at world (wx, wz): a tile, or the nearest slot on the path. */
function spotFor(type, wx, wz) {
  if (DEFS[type].on === 'path') {
    let best = null, bd = 0.95;
    for (const s of S.slots) { const d = Math.hypot(s.x - wx, s.z - wz); if (d < bd) { bd = d; best = s; } }
    return best ? { k: best.k, px: best.x, pz: best.z, slot: best } : null;
  }
  const x = Math.floor(wx), z = Math.floor(wz);
  if (x < 0 || x >= COLS || z < 0 || z >= ROWS) return null;
  return { k: key(x, z), px: x + 0.5, pz: z + 0.5, x, z };
}
function canPlace(type, spot) {
  const def = DEFS[type];
  if (!spot || S.occupied.has(spot.k) || (def.hero && S.hero)) return false;
  if (def.on === 'path') return !!spot.slot;
  return S.theme.buildable(spot.x, spot.z, def.ice);
}
function placeTower(type, spot) {
  const def = DEFS[type];
  const t = { type, def, level: 1, ...spot, cd: 0.6, kick: 0, pop: 0, kickCd: 1, spent: def.cost, mesh: null, aim: null };
  refreshMesh(t);
  S.occupied.set(t.k, t);
  if (S.theme.flying && def.on !== 'path') { // sky gadgets ride their own little balloon gondola
    t.base = makeGondola();
    t.base.position.set(t.px, 0.02, t.pz);
    actors.add(t.base);
  }
  if (def.hero) {
    S.hero = t;
    S.heroJump = 1;
    $('ultGlyph').textContent = def.ult.glyph;
    $('ultBtn').title = `${def.ult.name}: ${def.ult.desc}`;
    floatText(t.mesh.position.clone().setY(1.8), type === 'grump' ? 'Bah humbug!' : 'Brrr!');
  } else {
    S.towers.push(t);
    S.built++;
  }
  S.coal -= def.cost;
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
  if (t.def.hero) S.heroJump = 1;
  pick(t);
  updateHud();
  return true;
}
/** Sell a gadget, or send the hero home so the other one can come out. */
function sellTower(t) {
  if (!t) return;
  const refund = Math.floor(t.spent * 0.6);
  S.coal += refund;
  floatText(t.mesh.position.clone().setY(1), t.def.hero ? 'Sent home' + (refund ? ` +${refund}` : '') : `Sold +${refund}`);
  actors.remove(t.mesh);
  if (t.base) actors.remove(t.base);
  if (t.def.hero) { S.hero = null; S.ult = 0; }
  else S.towers.splice(S.towers.indexOf(t), 1);
  S.occupied.delete(t.k);
  pick(null);
  updateHud();
}

// ---- coal piles (the chucker's product)
function chooseSlot(t, L) {
  const free = [], used = [];
  for (const c of t.slots) (S.piles.has(c.k) || S.pending.has(c.k) ? used : free).push(c);
  if (free.length && used.length < L.maxPiles) return free[Math.floor(Math.random() * free.length)];
  let weakest = null;
  for (const c of used) {
    const p = S.piles.get(c.k);
    if (p && !S.pending.has(c.k) && p.hits <= L.hits * 0.5 && (!weakest || p.hits < weakest.p.hits)) weakest = { c, p };
  }
  return weakest ? weakest.c : null;
}
function landCoal(slot, L) {
  S.pending.delete(slot.k);
  const pos = new THREE.Vector3(slot.x, 0.05, slot.z);
  burst(pos, '#26262B', 5, 1.4);
  let p = S.piles.get(slot.k);
  if (p && p.hot !== !!L.burn) { actors.remove(p.mesh); S.piles.delete(slot.k); p = null; }
  if (!p) {
    p = { k: slot.k, pos, mesh: makeCoalPile(!!L.burn), hot: !!L.burn };
    p.mesh.position.copy(pos).setY(0.02);
    p.mesh.rotation.y = Math.random() * 6;
    actors.add(p.mesh);
    S.piles.set(slot.k, p);
  }
  Object.assign(p, { hits: L.hits, max: L.hits, dmg: L.dmg, burn: L.burn || 0, explode: L.explode || 0 });
  setPile(p.mesh, 1);
}
function usePile(p, e) {
  hit(e, p.dmg, 'coal');
  if (p.burn && e.state === 'walk') applyDot(e, p.burn, 'coal');
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
const basic = (color) => { const m = new THREE.MeshBasicMaterial({ color }); m.userData = NO_INK; return m; };
const projGeo = { coal: lump(0.14), snow: rock(0.15, 1), spit: rock(0.08), bullet: box(0.07, 0.07, 0.5), ball: rock(0.14, 1) };
const projMat = { coal: flat('#1F1F24'), hot: glow('#FF8C1A', 1), snow: flat('#FFFFFF'), ice: glow('#8FDCFF', 0.6), spit: basic('#9BE564'), bullet: basic('#FFE08A'), ball: flat('#17171A') };
function shoot(kind, from, o) {
  const m = o.mesh || new THREE.Mesh(projGeo[kind], projMat[o.mat || kind]);
  m.position.copy(from);
  if (o.size) m.scale.setScalar(o.size);
  m.visible = !o.delay;
  actors.add(m);
  S.projectiles.push({ kind, m, from: from.clone(), to: o.to ? o.to.clone() : new THREE.Vector3(), target: o.target || null, t: -(o.delay || 0) / o.dur, dur: o.dur, arc: o.arc || 0, onHit: o.onHit || (() => {}) });
}
// Sniper: bullets fly dead straight and can punch through a line of carriers; cannonballs arc and explode.
function fireSoldier(t, L, targets) {
  t.kick = 1;
  for (let i = 0; i < L.shots; i++) {
    const e = targets[i % targets.length];
    const from = t.mesh.position.clone().setY(L.splash ? 1.15 : 0.75);
    if (L.splash) {
      shoot('ball', from, {
        target: e, dur: Math.max(0.12, from.distanceTo(e.g.position) / 13), delay: i * 0.14, arc: 0.6,
        onHit: (_, p) => { burst(p, '#FF8C1A', 9, 3); burst(p, '#3A3A40', 5, 2); splashEach(p, L.splash, (v) => hit(v, L.dmg, 'bullet')); },
      });
      continue;
    }
    const dir = new THREE.Vector3(e.g.position.x - from.x, 0, e.g.position.z - from.z);
    const reach = dir.length();
    dir.normalize();
    const len = L.pierce > 1 ? reach + 4 : reach;
    const victims = L.pierce > 1 ? inLane(from.x, from.z, dir, len, 0.42).slice(0, L.pierce) : [e];
    if (!victims.includes(e)) victims[victims.length - 1] = e;
    const to = from.clone().addScaledVector(dir, len).setY(0.75);
    shoot('bullet', from, { to, dur: Math.max(0.05, len / 34), delay: i * 0.12 });
    for (const v of victims) { hit(v, L.dmg, 'bullet'); if (L.pierce > 1) burst(giftPos(v, new THREE.Vector3()), '#FFE08A', 2, 1.4); }
  }
}
function fireReindeer(t, L, targets) {
  t.kick = 0.6;
  for (const e of targets) {
    const from = t.mesh.position.clone().setY(0.55);
    shoot('spit', from, {
      target: e, dur: Math.max(0.08, from.distanceTo(e.g.position) / 10), size: L.acid ? 1.9 : 1.3,
      onHit: (tg, p) => {
        const apply = (v) => { applySlow(v, L.slow, L.slowT); if (L.acid) applyDot(v, L.acid, 'spit'); hit(v, L.dmg, 'spit'); };
        if (L.splash) { burst(p, '#9BE564', 4, 1.6); splashEach(p, L.splash, apply); }
        else if (tg) apply(tg);
      },
    });
  }
}
function fireChucker(t, L, slot) {
  t.kick = 1;
  S.pending.add(slot.k);
  const to = new THREE.Vector3(slot.x, 0.1, slot.z);
  t.mesh.rotation.y = Math.atan2(to.x - t.px, to.z - t.pz);
  shoot('coal', t.mesh.position.clone().setY(1.0), { to, dur: 0.5, arc: 1.3, mat: L.burn ? 'hot' : 'coal', size: 1 + t.level * 0.12, onHit: () => landCoal(slot, L) });
}
// Jack Frost: one straight gust; everyone in the lane is blown back down the path.
const gustGeo = new THREE.PlaneGeometry(1, 1);
function fireFrost(t, L, target) {
  t.kick = 1;
  const o = t.mesh.position;
  const dir = new THREE.Vector3(target.g.position.x - o.x, 0, target.g.position.z - o.z).normalize();
  const yaw = Math.atan2(dir.x, dir.z);
  t.mesh.rotation.y = yaw;
  for (const v of inLane(o.x, o.z, dir, L.len, L.width / 2 + 0.3)) {
    if (L.dmg) hit(v, L.dmg, 'frost');
    if (v.state !== 'walk') continue;
    if (L.chill) applySlow(v, 0.6, L.chill);
    if (L.stun) v.stunT = L.stun * (v.def.boss ? 0.4 : 1);
    blowBack(v, L.push);
    burst(giftPos(v, new THREE.Vector3()), '#CFF1FF', 3, 1.5);
  }
  const g = new THREE.Group();
  const lane = new THREE.Mesh(gustGeo, overlayMat(0xcff1ff, 0.6));
  lane.rotation.x = -Math.PI / 2;
  lane.scale.set(L.width, L.len, 1);
  lane.position.set(0, 0.07, L.len / 2);
  lane.renderOrder = 3;
  g.add(lane);
  g.position.copy(o);
  g.rotation.y = yaw;
  actors.add(g);
  S.fx.push({ g, mat: lane.material, life: 0.5, max: 0.5 });
  burst(o.clone().setY(0.8).addScaledVector(dir, 0.5), '#FFFFFF', 16, L.len * 2.2, { dir, life: 0.25 });
  burst(o.clone().setY(0.6).addScaledVector(dir, 0.5), '#8FDCFF', 8, L.len * 1.8, { dir, life: 0.25 });
}
// Snowman: a bowling ball of snow. It rolls dead straight, shrinking and hitting softer as it goes.
const rollGeo = rock(1, 1), rollMat = { snow: flat('#FFFFFF'), ice: glow('#BFEFFF', 0.45) };
function fireSnowman(t, L, target) {
  t.kick = 1;
  const lead = target.def.speed * 0.5;
  const aim = target.path.pointAt(Math.min(target.path.total, target.d + lead), new THREE.Vector3());
  const dir = new THREE.Vector3(aim.x - t.px, 0, aim.z - t.pz).normalize();
  t.mesh.rotation.y = Math.atan2(dir.x, dir.z);
  const m = new THREE.Mesh(rollGeo, rollMat[L.stun ? 'ice' : 'snow']);
  m.castShadow = true;
  actors.add(m);
  S.rolls.push({ m, ox: t.px, oz: t.pz, dir, len: L.len, dist: 0.7, power: L.dmg, stun: L.stun || 0, burst: L.burst || 0, size: 0.36 + L.dmg * 0.045, seen: new Set(), axis: new THREE.Vector3(dir.z, 0, -dir.x) });
}
function tickRolls(dt) {
  for (let i = S.rolls.length - 1; i >= 0; i--) {
    const b = S.rolls[i];
    b.dist += 5.5 * dt;
    const f = Math.min(1, b.dist / b.len);
    const rad = b.size * (1 - 0.7 * f);
    const x = b.ox + b.dir.x * b.dist, z = b.oz + b.dir.z * b.dist;
    b.m.position.set(x, rad, z);
    b.m.scale.setScalar(rad);
    b.m.rotateOnWorldAxis(b.axis, (5.5 * dt) / rad);
    for (const e of S.enemies) {
      if (e.state !== 'walk' || b.seen.has(e)) continue;
      if ((e.g.position.x - x) ** 2 + (e.g.position.z - z) ** 2 > (rad + 0.3) ** 2) continue;
      b.seen.add(e);
      if (b.stun) e.stunT = Math.max(e.stunT, b.stun * (e.def.boss ? 0.4 : 1));
      e.hop = 0.6;
      burst(giftPos(e, new THREE.Vector3()), '#FFFFFF', 4, 1.8);
      hit(e, Math.max(1, Math.ceil(b.power * (1 - f))), 'snow');
    }
    if (f >= 1) {
      const p = new THREE.Vector3(x, 0.2, z);
      burst(p, '#FFFFFF', b.burst ? 22 : 8, b.burst ? 4 : 2);
      if (b.burst) splashEach(p, b.burst, (v) => hit(v, 1, 'snow'));
      actors.remove(b.m);
      S.rolls.splice(i, 1);
    }
  }
}
function throwSnowballs(h, L, targets) {
  h.kick = 1;
  for (const e of targets) {
    const from = h.mesh.position.clone().setY(1.3);
    const dur = 0.3 + from.distanceTo(e.g.position) * 0.035;
    const lead = e.def.speed * (e.slowT > 0 ? e.slowMul : 1) * dur;
    const to = e.path.pointAt(Math.min(e.path.total, e.d + lead), new THREE.Vector3()).setY(0.5);
    shoot('snow', from, {
      to, dur, arc: 1.4, mat: L.chill ? 'ice' : 'snow', size: L.splash > 1.2 ? 2.1 : 1,
      onHit: (_, p) => {
        burst(p, L.chill ? '#8FDCFF' : '#FFFFFF', L.splash > 1.2 ? 16 : 9, 2);
        splashEach(p, L.splash, (v) => { if (L.chill) applySlow(v, 0.6, L.chill); hit(v, L.dmg, 'snow'); });
      },
    });
  }
  const e = targets[0];
  h.mesh.rotation.y = Math.atan2(e.g.position.x - h.px, e.g.position.z - h.pz);
}

// ---- hero ults (Q)
function useUlt() {
  if (!S.hero || S.ult < 100 || !S.playing || S.paused) return;
  const to = S.hero.mesh.position.clone().setY(1.3);
  if (S.hero.type === 'jack_frost') { // Deep Freeze
    let n = 0;
    for (const e of [...S.enemies]) {
      if (e.state !== 'walk' || !onBoard(e)) continue;
      e.stunT = Math.max(e.stunT, 4 * (e.def.boss ? 0.5 : 1));
      burst(giftPos(e, new THREE.Vector3()), '#8FDCFF', 5, 1.6);
      hit(e, 2, 'frost');
      n++;
    }
    flash(true);
    floatText(to.clone().setY(2.4), `DEEP FREEZE! ${n} frozen`);
  } else { // Present Heist
    const fly = (from, delay) => shoot('gift', from, { mesh: makeGift(), to, dur: 0.75, delay, arc: 2.6, size: 0.8, onHit: (_, p) => burst(p, '#F4C430', 4, 1.5) });
    let n = 0, i = 0;
    for (const e of [...S.enemies]) {
      if (e.state !== 'walk' || !onBoard(e)) continue;
      if (e.def.boss) {
        const p = giftPos(e, new THREE.Vector3());
        floatText(p, 'Sack raided!');
        for (let k = 0; k < 4; k++) fly(p, 0.1 * k);
        hit(e, Math.ceil(e.maxHp * 0.35), 'steal');
        n += 4;
        continue;
      }
      fly(giftPos(e, new THREE.Vector3()), 0.04 * i++);
      loseGift(e);
      n += e.def.gifts;
    }
    const back = Math.min(S.delivered, 3);
    if (back) {
      S.delivered -= back;
      const gp = S.theme.goal.position.clone().setY(1.2);
      for (let k = 0; k < back; k++) fly(gp, 0.12 * k);
      floatText(gp.clone().setY(2.2), `-${back} 🎁 stolen back`);
    }
    flash(false);
    floatText(to.clone().setY(2.4), n + back ? `HEIST! ${n + back} presents` : 'HEIST!');
  }
  S.ult = 0;
  S.heroJump = 1;
  updateHud();
}

// ================================================================ Santa at the goal (frets between waves)
function makeActor(type, scale) {
  const g = new THREE.Group();
  const model = spawnModel(type);
  model.scale.setScalar(scale);
  g.add(model);
  const legs = [];
  model.traverse((o) => { if (o.name === 'leg') legs.push(o); });
  actors.add(g);
  return { g, model, legs, legY: legs.map((l) => l.position.y), head: model.getObjectByName('head'), phase: 0, hop: 0, def: { speed: 1 } };
}
function makeGoalSanta() {
  const a = makeActor('santa', 0.8);
  a.home = S.theme.santaSpot.clone().setY(S.theme.flying ? 0.05 : 0);
  a.g.position.copy(a.home);
  a.mode = 'idle'; a.modeT = 0; a.eatT = 0;
  a.cookies = makeCookies();
  a.cookies.position.copy(a.home).add(new THREE.Vector3(0.75, 0, 0.35));
  a.cookies.visible = false;
  a.bites = [];
  a.cookies.traverse((o) => { if (o.name === 'cookie') a.bites.push(o); });
  actors.add(a.cookies);
  return a;
}
function santaMode(mode, secs) {
  const a = S.santa;
  if (!a) return;
  a.mode = mode; a.modeT = secs; a.eatT = 0.6;
  a.cookies.visible = mode === 'eat';
  for (const c of a.bites) c.visible = true;
  if (mode !== 'run') { a.g.position.copy(a.home); a.g.rotation.y = mode === 'eat' ? 0.9 : 0; }
}
/** run = panicked laps, eat = stress-eating cookies, idle = watching the path. */
function tickSanta(dt, time) {
  const a = S.santa;
  if (!a) return;
  const bossOut = S.enemies.some((e) => e.def.boss && e.state === 'walk');
  a.g.visible = !bossOut; // he cannot be at the door and out on the road at once
  a.cookies.visible = a.mode === 'eat' && !bossOut;
  if (a.mode !== 'idle') { a.modeT -= dt; if (a.modeT <= 0) santaMode('idle', 0); }
  if (a.mode === 'run') {
    const ang = time * 4.2;
    a.g.position.set(a.home.x + Math.cos(ang) * 0.75, a.home.y, a.home.z + Math.sin(ang) * 0.6);
    a.g.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang) * 0.8);
    animate(a, time, 'run');
    a.model.rotation.x = 0.18; // leaning into it
  } else if (a.mode === 'eat') {
    animate(a, time, 'frozen');
    a.model.rotation.x = 0;
    if (a.head) a.head.rotation.x = Math.max(0, Math.sin(time * 14)) * 0.28; // chomp chomp
    a.model.position.y = Math.abs(Math.sin(time * 7)) * 0.03;
    a.eatT -= dt;
    if (a.eatT <= 0) {
      a.eatT = 1.0;
      const c = a.bites.find((o) => o.visible) || (a.bites.forEach((o) => { o.visible = true; }), a.bites[0]);
      if (c) { c.visible = false; burst(a.g.position.clone().add(new THREE.Vector3(0.3, 1.0, 0.4)), '#C68642', 6, 1.6); }
    }
  } else {
    animate(a, time * 0.35, 'walk');
    a.model.rotation.x = 0;
    a.g.rotation.y = Math.sin(time * 0.6) * 0.5 - 0.6;
  }
}

// ================================================================ waves
function buildWave(w, level, li) {
  const q = [];
  let t = 0;
  const m = 1 + 0.4 * li; // later levels send bigger crowds
  const add = (type, n, gap) => { for (let i = 0; i < n; i++) { q.push({ type, t }); t += gap; } };
  add('elf', Math.round((9 + 4 * w) * m), Math.max(0.28, 0.6 - 0.04 * w));
  if (w >= 1) { t += 1; add('reindeer', Math.round((3 + 2.5 * w) * m), 0.5); }
  if (w >= 2) { t += 1; add('mrs_claus', Math.round((w - 1) * (1.1 + 0.5 * li) * m) + 1, 1.3); }
  if (w >= 2) { t += 0.5; add('elf', Math.round(3 * w * m), 0.32); }
  if (w === level.waves - 1 || (level.waves >= 9 && w === Math.floor(level.waves / 2))) { t += 2; add('santa', 1, 1); }
  return q;
}
function startWave() {
  if (S.waveActive || S.over || !S.playing || S.wave >= S.level.waves) return;
  S.queue = buildWave(S.wave, S.level, S.levelIdx);
  S.waveT = 0;
  S.waveActive = true;
  S.paused = false;
  santaMode('idle', 0);
  updateHud();
}
function endWave() {
  S.waveActive = false;
  S.wave++;
  if (S.wave >= S.level.waves) return endGame(true);
  const bonus = 12 + S.wave * 3;
  S.coal += bonus;
  santaMode(S.wave % 2 ? 'run' : 'eat', 8); // Santa takes the news badly
  showHint(`Wave cleared! +${bonus} coal. Press ▶ for the next one`);
  updateHud();
}
/** The round button and Space: start the next wave, or pause / resume the one running. */
function togglePlay() {
  if (!S.playing) return;
  if (!S.waveActive) startWave();
  else S.paused = !S.paused;
  updateHud();
}

// ================================================================ level lifecycle
const savedLevel = () => { try { return Math.min(LEVELS.length - 1, +localStorage.getItem(SAVE_KEY) || 0); } catch { return 0; } };
const saveLevel = (i) => { try { localStorage.setItem(SAVE_KEY, i); } catch { /* private mode */ } };
function loadLevel(idx, play = true) {
  if (S.theme) scene.remove(S.theme.group);
  actors.clear();
  cut.active = false;
  $('cine').classList.add('hidden');
  Object.assign(S, { levelIdx: idx, level: LEVELS[idx], enemies: [], towers: [], projectiles: [], particles: [], fx: [], rolls: [], queue: [], wave: 0, waveActive: false, paused: false, delivered: 0, broken: 0, built: 0, over: false, lost: false, deathT: 0, time: 0, ult: 0, picked: null, hero: null });
  S.occupied = new Map(); S.piles = new Map(); S.pending = new Set();
  S.coal = S.level.coal;
  S.slots = [];
  S.paths = S.level.paths.map((pts, i) => buildPath(pts, i, S.slots));
  S.theme = buildTheme(S.level, S.paths);
  scene.add(S.theme.group);
  const T = S.theme.theme;
  scene.background = new THREE.Color(T.bg);
  scene.fog = new THREE.Fog(T.bg, 38, 78);
  hemi.color.set(T.hemi[0]); hemi.groundColor.set(T.hemi[1]); hemi.intensity = T.hemi[2];
  sun.color.set(T.sun[0]); sun.intensity = T.sun[1];
  camera.position.copy(camBase);
  camera.lookAt(lookBase);
  S.santa = makeGoalSanta();
  select(null);
  showVision([]);
  S.playing = play;
  $('death').classList.add('hidden');
  $('overlay').classList.add('hidden');
  $('levelName').textContent = `${idx + 1}. ${S.level.name}`;
  $('waves').textContent = S.level.waves;
  $('hud').classList.toggle('hidden', !play);
  if (play) {
    saveLevel(idx);
    showHint('Pick a hero (G or J) and place them, add gadgets, then press ▶');
  }
  updateHud();
}
function endGame(won) {
  S.over = true;
  S.playing = false;
  select(null);
  pick(null);
  if (!won) { S.lost = true; S.deathT = 0; return; } // death sequence plays in frame()
  const next = S.levelIdx + 1;
  const stats = `You smashed ${S.broken} presents and only ${S.delivered} got through.`;
  saveLevel(next < LEVELS.length ? next : 0);
  playCut(winBeats(), () => {
    if (next < LEVELS.length) showOverlay('Santa is short on presents', `${stats} Next stop: ${LEVELS[next].name}. ${LEVELS[next].blurb || ''}`, [['Next level →', () => loadLevel(next)]]);
    else showOverlay('Bah humbug, you win!', `${stats} Every sleigh, street and warehouse is safe from cheer.`, [['Play again', () => loadLevel(0)]]);
  });
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

// ================================================================ cutscenes
// A cutscene is a list of beats: { dur, text, cam: [x,y,z], look: [x,y,z], enter(), tick(k, dt, time) }.
function playCut(beats, done) {
  Object.assign(cut, { active: true, beats, i: -1, t: 0, done });
  cut.from.copy(camera.position);
  cut.fromLook.copy(lookBase);
  cut.look.copy(lookBase);
  $('hud').classList.add('hidden');
  $('overlay').classList.add('hidden');
  $('cine').classList.remove('hidden');
  nextBeat();
}
function nextBeat() {
  cut.i++;
  cut.t = 0;
  const b = cut.beats[cut.i];
  if (!b) return endCut();
  cut.from.copy(camera.position);
  cut.fromLook.copy(cut.look);
  const cap = $('caption');
  cap.textContent = b.text;
  cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
  b.enter?.();
}
function endCut() {
  if (!cut.active) return;
  cut.active = false;
  $('cine').classList.add('hidden');
  camera.position.copy(camBase);
  camera.lookAt(lookBase);
  const done = cut.done;
  cut.done = null;
  done?.();
}
function tickCut(dt, time) {
  const b = cut.beats[cut.i];
  if (!b) return;
  cut.t += dt;
  const k = Math.min(1, cut.t / 1.3), ease = k * k * (3 - 2 * k);
  camera.position.lerpVectors(cut.from, tmp.set(...b.cam), ease);
  cut.look.lerpVectors(cut.fromLook, tmp.set(...b.look), ease);
  camera.lookAt(cut.look);
  b.tick?.(Math.min(1, cut.t / b.dur), dt, time);
  // the world keeps moving: carriers walk, snowballs fly, bits scatter, Santa frets
  for (const e of [...S.enemies]) {
    if (e.state === 'walk') { e.d += e.def.speed * dt; if (e.d >= e.path.total) { removeEnemy(e); continue; } }
    else { e.d -= 3.6 * dt; if (e.d < 0) { removeEnemy(e); continue; } }
    placeEnemy(e);
    animate(e, time, e.state === 'flee' ? 'run' : 'walk');
    e.punch = Math.max(0, e.punch - dt * 6);
  }
  tickProjectiles(dt);
  tickParticles(dt);
  tickSanta(dt, time);
  S.theme.tick(dt, time);
  if (cut.t >= b.dur) nextBeat();
}
/** Opening: who Santa is, who you are, what you are here to do. Plays on the first level's scenery. */
function introBeats() {
  const P = S.paths[0];
  const end = P.pointAt(P.total, new THREE.Vector3());
  let spot = { x: 9, z: 4 };
  for (let rad = 0; rad < 4 && !S.theme.buildable(spot.x, spot.z); rad++) {
    for (let x = 8 - rad; x <= 10 + rad; x++) for (let z = 3 - rad; z <= 5 + rad; z++) if (S.theme.buildable(x, z)) spot = { x, z };
  }
  const gx = spot.x + 0.5, gz = spot.z + 0.5;
  let grump = null, target = null, thrown = false;
  const walkIn = (type, d) => { const e = spawnEnemy(type); e.d = d; placeEnemy(e); return e; };
  return [
    { dur: 4.6, text: 'Santa is stocking his warehouse for the big night.', cam: [end.x - 4.6, 6.6, end.z + 6.6], look: [end.x - 2.6, 0.4, end.z - 0.4],
      enter() { santaMode('idle', 0); S.santa.g.visible = false; walkIn('santa', P.total - 4.4); walkIn('elf', P.total - 6.4); walkIn('elf', P.total - 8); walkIn('reindeer', P.total - 12); walkIn('mrs_claus', P.total - 10.5); } },
    { dur: 4.0, text: 'The Grump has other plans.', cam: [gx + 2.4, 2.5, gz + 4.8], look: [gx, 0.95, gz],
      enter() { grump = makeActor('grump', 0.01); grump.g.position.set(gx, 0.02, gz); grump.g.rotation.y = 0.35; },
      tick(k, dt, time) {
        const s = Math.min(1, cut.t / 0.5), pop = s < 1 ? s * (1.25 - 0.25 * s) : 1;
        grump.model.scale.setScalar(0.78 * pop);
        grump.hop = cut.t > 1.4 && cut.t < 1.8 ? (cut.t - 1.4) / 0.4 : 0;
        animate(grump, time * 0.4, 'walk');
      } },
    { dur: 5.2, text: 'Smash the presents before they get inside.', cam: [gx + 1.5, 7.5, gz + 9], look: [gx - 0.5, 0, gz - 0.6],
      enter() {
        let best = 0, bd = 1e9; // drop an elf onto the stretch of road nearest the Grump
        for (let d = 2; d < P.total - 2; d += 0.25) { const p = P.pointAt(d, tmp2); const dd = Math.hypot(p.x - gx, p.z - gz); if (dd < bd) { bd = dd; best = d; } }
        for (const e of [...S.enemies]) removeEnemy(e);
        target = walkIn('elf', best - 3.4);
        walkIn('elf', best - 5);
        walkIn('reindeer', best - 8);
      },
      tick(k, dt, time) {
        animate(grump, time * 0.4, 'walk');
        if (!thrown && cut.t > 1.5 && target.state === 'walk') {
          thrown = true;
          const from = grump.g.position.clone().setY(1.3);
          const to = target.path.pointAt(target.d + target.def.speed * 0.5, new THREE.Vector3()).setY(0.6);
          grump.g.rotation.y = Math.atan2(to.x - gx, to.z - gz);
          grump.hop = 0.5;
          shoot('snow', from, { to, dur: 0.5, arc: 1.5, size: 1.4, onHit: (_, p) => { burst(p, '#FFFFFF', 12, 2.4); splashEach(p, 1.0, (v) => hit(v, 9, 'snow')); } });
        }
        grump.hop = Math.max(0, (grump.hop || 0) - dt * 2);
      } },
    { dur: 4.4, text: 'Leave Santa short. If 100 presents get through, Christmas happens.', cam: camBase.toArray(), look: lookBase.toArray(),
      enter() { S.santa.g.visible = true; santaMode('run', 6); },
      tick(k, dt, time) { animate(grump, time * 0.4, 'walk'); } },
  ];
}
/** After a level: Santa, short on presents, runs laps or stress-eats the cookies. */
function winBeats() {
  const s = S.theme.santaSpot;
  const cam = [s.x + 0.6, 3.4, s.z + 5.6], look = [s.x + 0.2, 0.8, s.z];
  const run = { dur: 4.6, text: 'Santa is short on presents. He is not taking it well.', cam, look, enter() { santaMode('run', 30); } };
  const eat = { dur: 5.2, text: 'Not enough presents. Santa is stress-eating the cookies.', cam: [s.x + 1.4, 2.6, s.z + 4.6], look: [s.x + 0.4, 0.7, s.z + 0.1], enter() { santaMode('eat', 30); } };
  return S.levelIdx === 1 ? [eat] : S.levelIdx === 2 ? [run, eat] : [run];
}

// ================================================================ UI
let hintTimer;
function showHint(text) {
  const el = $('hint');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 3400);
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));
const lumpHtml = '<span class="lump"></span>';

// ---- full gadget panel: current stats plus every improvement, each expandable
let panelKey = '';
function panelHtml(t) {
  const L = stat(t), levels = t.def.levels;
  const stats = Object.keys(LABELS).filter((k) => L[k] !== undefined).map((k) => `<span>${LABELS[k]}</span><b>${fmt(L[k])}</b>`).join('');
  const ups = levels.slice(1).map((up, i) => {
    const lv = i + 2, prev = levels[i];
    const state = t.level >= lv ? 'owned' : t.level === lv - 1 ? 'next' : 'locked';
    const tag = state === 'owned' ? 'Owned' : `${lumpHtml}${up.cost}`;
    const keys = Object.keys(LABELS).filter((k) => up[k] !== undefined && up[k] !== prev[k]);
    const diff = keys.map((k) => `<span>${LABELS[k]}</span><b>${prev[k] === undefined ? 'new · ' + fmt(up[k]) : fmt(prev[k]) + ' → ' + fmt(up[k])}</b>`).join('');
    return `<details class="up ${state}" ${state === 'next' ? 'open' : ''}><summary><span class="n">${i + 1}</span><span class="t">${up.name}</span><span class="tag">${tag}</span></summary>
      <div class="body">${up.desc}<div class="diff">${diff}</div></div></details>`;
  }).join('');
  const next = levels[t.level], refund = Math.floor((t.spent || 0) * 0.6);
  return `<div class="phead"><img src="${iconFor(t.type, t.level)}" alt=""><div><h2>${t.def.name}</h2><div class="stars">${'★'.repeat(t.level)}${'☆'.repeat(MAX_LEVEL - t.level)}</div><div class="tier">${t.level === 1 ? (t.def.hero ? 'Hero' : 'Base model') : levels[t.level - 1].name}</div></div><button class="pclose" title="Close (Esc)">✕</button></div>
    <div class="pnote">${t.def.desc}</div>
    ${t.def.ult ? `<div class="pnote"><b>${t.def.ult.glyph} ${t.def.ult.name} (Q):</b> ${t.def.ult.desc}</div>` : ''}
    <div class="psec">Right now</div>
    <div class="pstats">${stats}${t.def.sniper ? `<span>Path spots in view</span><b>${t.seen.length}</b>` : ''}</div>
    <div class="psec">Improvements</div>
    ${ups}
    <div class="pbtns">
      <button class="btn up">${next ? `Upgrade to ${next.name} · ${next.cost} <kbd>U</kbd>` : 'Fully upgraded'}</button>
      <button class="btn sell">${t.def.hero ? `Send home${refund ? ' +' + refund : ''}` : `Sell for ${refund}`} <kbd>X</kbd></button>
    </div>`;
}
function refreshPanel() {
  const t = S.picked, panel = $('panel');
  const show = !!t && S.playing;
  panel.classList.toggle('hidden', !show);
  $('hud').classList.toggle('panel-open', show);
  if (!show) { panelKey = ''; return; }
  const k = t.k + ':' + t.type + ':' + t.level;
  if (k !== panelKey) {
    panelKey = k;
    panel.innerHTML = panelHtml(t);
    panel.querySelector('.pclose').onclick = () => pick(null);
    panel.querySelector('.btn.up').onclick = () => upgrade(S.picked);
    panel.querySelector('.btn.sell').onclick = () => sellTower(S.picked);
  }
  const next = t.def.levels[t.level];
  panel.querySelector('.btn.up').disabled = !next || S.coal < next.cost;
}
function updateHud() {
  $('wave').textContent = Math.min(S.wave + 1, S.level.waves);
  $('delivered').textContent = S.delivered;
  $('deliverBar').style.width = Math.min(100, (S.delivered / MAX_DELIVERED) * 100) + '%';
  $('coal').textContent = S.coal;
  for (const el of document.querySelectorAll('.tower')) {
    const type = el.dataset.type;
    el.classList.toggle('poor', DEFS[type].cost > S.coal);
    el.classList.toggle('selected', type === S.selected);
    if (DEFS[type].hero) el.classList.toggle('hidden', !!S.hero); // one hero out at a time
  }
  $('playBtn').classList.toggle('running', S.waveActive && !S.paused);
  $('paused').classList.toggle('hidden', !(S.paused && S.playing));
  $('ultBtn').classList.toggle('hidden', !S.hero); // no ult until a hero is on the board
  refreshPanel();
}
function select(type) {
  if (S.ghost) { scene.remove(S.ghost); S.ghost = null; }
  if (type && DEFS[type].hero && S.hero) { showHint(`${S.hero.def.name} is already out. Send them home first`); type = null; }
  S.selected = type;
  hoverTile.visible = false;
  if (type) pick(null);
  if (!S.picked) { ring.visible = false; showVision([]); }
  if (S.level) updateHud();
  canvas.style.cursor = type ? 'copy' : 'default';
}
function pick(t) {
  S.picked = t || null;
  const r = t && stat(t).range;
  ring.visible = !!r;
  if (r) { ring.position.set(t.px, 0.05, t.pz); ring.scale.setScalar(r); }
  showVision(t && t.seen ? t.seen : []);
  refreshPanel();
}
function showOverlay(title, text, buttons) {
  $('ovTitle').textContent = title;
  $('ovText').textContent = text;
  const wrap = $('ovBtns');
  wrap.innerHTML = '';
  buttons.forEach(([label, fn], i) => {
    const b = document.createElement('button');
    b.className = 'btn ' + (i === 0 ? 'big' : 'alt');
    b.textContent = label;
    b.onclick = fn;
    wrap.appendChild(b);
  });
  $('death').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('overlay').classList.remove('hidden');
}

// ---- icons (rendered once per gadget + level, with the same ink outline as the game)
let iconR, iconFx;
const iconCache = {};
function snapshot(obj, yaw = 0.45) {
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x9fb4c6, 1.5));
  const d = new THREE.DirectionalLight(0xffffff, 1.5); d.position.set(2, 5, 4); sc.add(d);
  obj.rotation.y = yaw;
  sc.add(obj);
  const bb = new THREE.Box3().setFromObject(obj);
  const c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
  const rad = Math.max(s.x, s.y, s.z) * 0.62;
  const cam = new THREE.OrthographicCamera(-rad, rad, rad, -rad, 0.1, 60);
  cam.position.copy(c).add(new THREE.Vector3(0, 3.2, 9));
  cam.lookAt(c);
  iconR.setClearColor(0x000000, 0);
  iconR.clear();
  iconFx.render(sc, cam);
  return iconR.domElement.toDataURL();
}
function iconFor(type, level = 1) {
  return (iconCache[type + level] ||= snapshot(makeTowerMesh(type, null, level), type === 'conveyor' || type === 'spikes' ? 0.6 : 0.45));
}

function buildUi() {
  iconR = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  iconR.setSize(224, 224, false);
  iconFx = new OutlineEffect(iconR, { ...INK, defaultThickness: 0.006 });
  const santa = spawnModel('santa');
  const g = makeGift(0); g.position.y = santa.userData.height + 0.3; santa.add(g);
  $('deathSanta').src = snapshot(santa, -0.3);
  const wrap = $('towers');
  CARDS.forEach((k) => {
    const def = DEFS[k];
    const el = document.createElement('div');
    el.className = 'tower' + (def.hero ? ' hero' : '');
    el.dataset.type = k;
    el.title = def.desc;
    const hot = def.hero ? def.hot : TOWER_KEYS.indexOf(k) + 1;
    el.innerHTML = `<span class="keycap">${hot}</span><img src="${iconFor(k)}" alt=""><div class="name">${def.name}</div><div class="cost">${def.hero ? 'Hero · free' : lumpHtml + def.cost}</div>`;
    el.onclick = () => select(S.selected === k ? null : k);
    wrap.appendChild(el);
  });
  $('playBtn').onclick = togglePlay;
  $('ultBtn').onclick = useUlt;
  $('retryBtn').onclick = () => loadLevel(S.levelIdx);
  $('skipBtn').onclick = endCut;
  $('speedBtn').onclick = () => { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 3 : 1; $('speedBtn').textContent = S.speed + '×'; };
  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (cut.active) { if (k === 'escape' || k === 'enter' || k === ' ') { ev.preventDefault(); endCut(); } return; }
    if (k >= '1' && k <= String(TOWER_KEYS.length)) select(TOWER_KEYS[+k - 1]);
    else if (k === 'g') select('grump');
    else if (k === 'j') select('jack_frost');
    else if (k === 'escape') { select(null); pick(null); }
    else if (k === ' ') { ev.preventDefault(); togglePlay(); }
    else if (k === 'u') upgrade(S.picked);
    else if (k === 'x') sellTower(S.picked);
    else if (k === 'q') useUlt();
    else if (k === 'r' && S.lost) loadLevel(S.levelIdx);
  });
}

// ================================================================ input
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouse = new THREE.Vector2();
function pointerPoint(ev, out) {
  mouse.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  return raycaster.ray.intersectPlane(groundPlane, out);
}
// What the pointer is on: the model under the cursor first, then whatever sits on that tile or path spot.
// (Call right after pointerPoint, which aims the raycaster.)
function gadgetAt(p) {
  const meshes = S.towers.map((t) => t.mesh);
  if (S.hero) meshes.push(S.hero.mesh);
  for (const h of raycaster.intersectObjects(meshes, true)) {
    for (let o = h.object; o; o = o.parent) if (o.userData.gadget) return o.userData.gadget;
  }
  if (!p) return null;
  let best = null, bd = 0.6;
  for (const t of S.occupied.values()) { const d = Math.hypot(t.px - p.x, t.pz - p.z); if (d < bd) { bd = d; best = t; } }
  return best;
}
let ghostKey = '';
function refreshGhost() {
  const p = S.hover;
  if (!S.selected) {
    hoverTile.visible = false;
    if (S.ghost) S.ghost.visible = false;
    canvas.style.cursor = S.playing && p && gadgetAt(p) ? 'pointer' : 'default';
    return;
  }
  const spot = p && spotFor(S.selected, p.x, p.z);
  if (!spot) { hoverTile.visible = false; ring.visible = false; showVision([]); ghostKey = ''; if (S.ghost) S.ghost.visible = false; return; }
  const def = DEFS[S.selected];
  const ok = canPlace(S.selected, spot) && S.coal >= def.cost;
  if (S.ghost && S.ghost.userData.spotKey !== spot.k) { scene.remove(S.ghost); S.ghost = null; }
  if (!S.ghost) {
    S.ghost = makeTowerMesh(S.selected, spot.slot);
    S.ghost.userData.spotKey = spot.k;
    S.ghost.traverse((o) => { o.castShadow = false; });
    scene.add(S.ghost);
  }
  S.ghost.visible = ok;
  S.ghost.position.set(spot.px, 0.02, spot.pz);
  hoverTile.visible = true;
  hoverTile.position.set(spot.px, 0.03, spot.pz);
  hoverTile.rotation.y = spot.slot ? Math.atan2(spot.slot.dir.x, spot.slot.dir.z) : 0;
  hoverTile.material.color.set(ok ? 0x6fa83a : 0xe63946);
  const range = def.levels[0].range;
  ring.visible = !!range;
  if (range) { ring.position.set(spot.px, 0.05, spot.pz); ring.scale.setScalar(range); }
  if (def.sniper && ghostKey !== spot.k) { ghostKey = spot.k; showVision(ok ? seenSlots(spot.px, spot.pz) : []); }
}
const hoverPoint = new THREE.Vector3();
canvas.addEventListener('pointermove', (ev) => { S.hover = pointerPoint(ev, hoverPoint) ? hoverPoint : null; refreshGhost(); });
canvas.addEventListener('pointerleave', () => { S.hover = null; refreshGhost(); });
canvas.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0 || !S.playing) return;
  const p = pointerPoint(ev, new THREE.Vector3());
  if (!p) return;
  if (!S.selected) return pick(gadgetAt(p));
  const def = DEFS[S.selected];
  const spot = spotFor(S.selected, p.x, p.z);
  if (!spot) return def.on === 'path' ? showHint(`${def.name} goes on the path`) : undefined;
  if (S.coal < def.cost) return showHint(`Not enough coal for ${def.name}`);
  if (!canPlace(S.selected, spot)) {
    const lake = spot.x !== undefined && S.theme.lake.has(spot.k);
    return showHint(S.occupied.has(spot.k) ? 'That spot is taken' : lake ? 'Only Jack Frost and the Snowman can stand on the ice' : S.theme.flying ? `${def.name} needs a clear cloud beside the path` : `${def.name} cannot go there`);
  }
  const placed = placeTower(S.selected, spot);
  ghostKey = '';
  if (def.hero || S.coal < def.cost) { select(null); if (def.hero) pick(placed); }
  else { if (S.ghost) { scene.remove(S.ghost); S.ghost = null; } refreshGhost(); }
});
canvas.addEventListener('contextmenu', (ev) => { ev.preventDefault(); select(null); pick(null); });

// ================================================================ update
function tickProjectiles(dt) {
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
}
function tickParticles(dt) {
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.life -= dt;
    p.v.y -= p.g * dt;
    p.m.position.addScaledVector(p.v, dt);
    p.m.rotation.x += dt * 8; p.m.rotation.y += dt * 6;
    if (p.m.position.y < 0.05 && !S.theme.flying) { p.m.position.y = 0.05; p.v.set(0, 0, 0); }
    if (p.life <= 0) { actors.remove(p.m); S.particles.splice(i, 1); }
  }
  for (let i = S.fx.length - 1; i >= 0; i--) {
    const f = S.fx[i];
    f.life -= dt;
    f.mat.opacity = 0.6 * Math.max(0, f.life / f.max);
    if (f.life <= 0) { actors.remove(f.g); f.mat.dispose(); S.fx.splice(i, 1); }
  }
}
let bossShown = -1;
function update(dt) {
  S.time += dt;
  const time = S.time;

  // spawning
  if (S.waveActive) {
    S.waveT += dt;
    S.ult = Math.min(100, S.ult + dt * 1.0 * heroBoost());
    while (S.queue.length && S.queue[0].t <= S.waveT) spawnEnemy(S.queue.shift().type);
    if (!S.queue.length && !S.enemies.some((e) => e.state === 'walk')) endWave();
  }
  if (S.over) return;

  // carriers
  const belts = S.towers.filter((t) => t.type === 'conveyor');
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    if (e.state === 'walk') {
      if (e.dotLeft > 0) { e.dotTick -= dt; if (e.dotTick <= 0) { e.dotTick = 1.5; e.dotLeft--; hit(e, 1, e.dotSrc, true); } }
      e.pileCd -= dt;
      let sp = e.def.speed * (1 + 0.12 * S.levelIdx) * (e.slowT > 0 ? e.slowMul : 1); // everyone hurries on later levels
      e.slowT -= dt;
      if (e.stunT > 0) { e.stunT -= dt; sp = 0; }
      const ex = e.g.position.x, ez = e.g.position.z;
      for (const b of belts) if ((b.px - ex) ** 2 + (b.pz - ez) ** 2 < 0.3) { sp *= stat(b).slow; break; }
      if (e.pileCd <= 0 && e.state === 'walk') {
        for (const p of S.piles.values()) {
          if ((p.pos.x - ex) ** 2 + (p.pos.z - ez) ** 2 < 0.3) { e.pileCd = 0.5; usePile(p, e); break; }
        }
      }
      if (e.state === 'walk') {
        e.d += sp * dt;
        if (e.d >= e.path.total) { deliver(e); continue; }
        e.punch = Math.max(0, e.punch - dt * 6);
        e.gift.scale.setScalar(e.giftScale * (1 + e.punch * 0.22));
      }
    } else {
      e.d -= 3.6 * dt;
      if (e.d < 0) { removeEnemy(e); continue; }
    }
    placeEnemy(e);
    e.hop = Math.max(0, e.hop - dt * 2.5);
    e.modelY = S.theme.flying && e.def.boss ? 0.2 : 0;
    const ph = animate(e, time, e.state === 'flee' ? 'run' : e.stunT > 0 ? 'frozen' : 'walk');
    if (e.state === 'walk') { e.gift.position.y = e.giftY + Math.sin(ph * 0.6) * 0.03; e.gift.rotation.z = Math.sin(ph * 0.5) * 0.06; }
    if (S.theme.flying) {
      e.g.position.y = e.baseY + Math.sin(time * 2 + e.phase) * 0.07;
      e.model.rotation.z *= 0.3; // seated: less waddle
      for (const o of e.props) o.rotation.z = time * 22;
    }
  }

  // boss bar: Santa's health sits big at the bottom while he is on the board
  const boss = S.enemies.find((e) => e.def.boss && e.state === 'walk' && onBoard(e));
  const bossPct = boss ? Math.max(0, Math.round((boss.hp / boss.maxHp) * 1000)) : -1;
  if (bossPct !== bossShown) {
    bossShown = bossPct;
    $('boss').classList.toggle('hidden', !boss);
    if (boss) { $('bossFill').style.width = bossPct / 10 + '%'; $('bossHp').textContent = `${Math.max(0, boss.hp)} / ${boss.maxHp} hits`; }
  }

  // gadgets
  for (const t of [...S.towers]) {
    const L = stat(t);
    for (const o of t.spin) o.rotation.y = time * 3;
    for (const o of t.roll) o.rotation.x = time * 9;
    for (const o of t.blink) o.visible = Math.sin(time * 9) > 0;
    if (t.type === 'spikes') {
      t.cd -= dt;
      t.pop = Math.max(0, t.pop - dt * 9);
      t.spikes.position.y = -0.12 + t.pop * 0.16;
      if (t.cd <= 0) {
        const victims = enemiesNear(t.px, t.pz, L.radius || 0.6);
        if (victims.length) {
          t.cd = L.every; t.pop = 1;
          for (const v of victims) {
            if (L.freeze) { applySlow(v, 0.5, L.freeze); burst(giftPos(v, new THREE.Vector3()), '#8FDCFF', 2, 1.2); }
            if (L.bleed) applyDot(v, L.bleed, 'spikes');
            hit(v, L.dmg, 'spikes');
          }
        }
      }
    } else if (t.type === 'conveyor') {
      if (L.grind || L.kick) {
        const victims = enemiesNear(t.px, t.pz, 0.6);
        if (L.grind) for (const v of victims) { v.grindT += dt; if (v.grindT >= L.grind) { v.grindT = 0; hit(v, 1, 'shred'); } }
        t.kickCd -= dt;
        if (L.kick && t.kickCd <= 0 && victims.length) {
          t.kickCd = L.kickEvery;
          for (const v of victims) { if (v.state === 'walk') blowBack(v, L.kick); }
          burst(new THREE.Vector3(t.px, 0.3, t.pz), '#FF5A4F', 8, 2.4);
        }
      }
    } else {
      t.cd -= dt;
      t.kick = Math.max(0, t.kick - dt * 5);
      const s = t.baseScale;
      t.mesh.scale.set(s * (1 + t.kick * 0.08), s * (1 - t.kick * 0.1), s * (1 + t.kick * 0.08));
      if (t.arm) t.arm.rotation.x = -t.kick * 1.3;
      if (t.ball) t.ball.visible = t.cd < L.rate * 0.6; // re-packing a snowball
      if (t.type === 'coal_chucker') {
        if (t.cd <= 0) {
          const slot = chooseSlot(t, L);
          if (slot) { fireChucker(t, L, slot); t.cd = L.rate; } else t.cd = 0.4;
        }
        continue;
      }
      // snipers only look when they are ready to fire (line-of-sight checks are not free)
      const targets = t.def.sniper && t.cd > 0 ? (t.aim && t.aim.state === 'walk' ? [t.aim] : []) : pickTargets(t, L, L.shots || 1);
      if (targets.length) {
        t.aim = targets[0];
        const a = targets[0].g.position;
        let dy = Math.atan2(a.x - t.px, a.z - t.pz) - t.mesh.rotation.y;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        t.mesh.rotation.y += dy * Math.min(1, dt * 12);
        if (t.cd <= 0) {
          if (t.type === 'toy_soldier') fireSoldier(t, L, targets);
          else if (t.type === 'snowman') fireSnowman(t, L, targets[0]);
          else fireReindeer(t, L, targets);
          t.cd = L.rate;
        }
      } else { t.mesh.position.y = 0.02 + Math.abs(Math.sin(time * 2 + t.px)) * 0.015; if (t.cd <= 0) t.cd = 0.12; }
    }
  }

  // the hero (once one has been placed)
  const h = S.hero;
  S.heroJump = Math.max(0, S.heroJump - dt * 3);
  if (h) {
    const HL = stat(h);
    h.cd -= dt;
    h.kick = Math.max(0, h.kick - dt * 4);
    if (h.cd <= 0) {
      const targets = pickTargets(h, HL, HL.shots || 1);
      if (targets.length) { h.type === 'grump' ? throwSnowballs(h, HL, targets) : fireFrost(h, HL, targets[0]); h.cd = HL.rate; }
      else h.cd = 0.15;
    }
    for (const o of h.spin) o.rotation.y = time * 3;
    h.mesh.position.y = 0.02 + Math.sin(S.heroJump * Math.PI) * 0.35 + Math.sin(time * 2) * 0.012;
    const gs = h.baseScale;
    h.mesh.scale.set(gs * (1 + h.kick * 0.1), gs * (1 - h.kick * 0.12 + Math.sin(time * 2) * 0.012), gs * (1 + h.kick * 0.1));
  }

  tickRolls(dt);
  tickProjectiles(dt);
  tickParticles(dt);
  tickSanta(dt, time);

  // ult charge ring
  const ub = $('ultBtn');
  ub.style.setProperty('--p', S.ult + '%');
  ub.classList.toggle('ready', S.ult >= 100);

  beltTexs.forEach((tex, i) => { tex.offset.y = (time * (1.4 + i * 0.7)) % 1; });
  S.theme.tick(dt, time);
}

// Lost: the hero keels over, the crew bounces, then the death screen slams in.
function deathSequence(dt, now) {
  S.deathT += dt;
  const k = Math.min(1, S.deathT / 0.7);
  if (S.hero) {
    const m = S.hero.mesh;
    m.rotation.z = k * 1.45;
    m.position.y = 0.02 + Math.sin(k * Math.PI) * 0.5 + k * 0.25;
  }
  for (const e of S.enemies) e.model.position.y = Math.abs(Math.sin(now * 0.012 + e.phase)) * 0.3;
  const shake = Math.max(0, 0.6 - S.deathT) * 0.35;
  camera.position.set(camBase.x + (Math.random() - 0.5) * shake, camBase.y + (Math.random() - 0.5) * shake, camBase.z);
  if (S.deathT >= 1.5 && $('death').classList.contains('hidden')) showDeath();
}

// ================================================================ boot
window.__dbg = {
  /** place(type, x, z): land gadgets by tile, path gadgets at the slot nearest (x, z). */
  place: (t, x, z) => { const spot = spotFor(t, x + 0.5, z + 0.5); return canPlace(t, spot) && placeTower(t, spot); },
  can: (t, x, z) => canPlace(t, spotFor(t, x + 0.5, z + 0.5)),
  upgrade, sell: sellTower, ult: useUlt, pick, togglePlay, endCut,
  start: () => startWave(), load: (i) => loadLevel(i), intro: () => { loadLevel(0, false); playCut(introBeats(), () => loadLevel(savedLevel())); },
  step: (dt, n) => { for (let i = 0; i < n; i++) update(dt); },
  cutStep: (dt, n) => { let t = performance.now() / 1000; for (let i = 0; i < n && cut.active; i++) tickCut(dt, (t += dt)); return cut.i; },
  defs: { TOWERS, HEROES, ENEMIES }, renderer, cut,
  at: (x, z) => { const v = new THREE.Vector3(x, 0, z).project(camera); return [Math.round(((v.x + 1) / 2) * window.innerWidth), Math.round(((1 - v.y) / 2) * window.innerHeight)]; },
};
buildUi();
// no menu: an animated introduction on the first level's scenery, then straight into the game
loadLevel(0, false);
playCut(introBeats(), () => loadLevel(savedLevel()));

let last = performance.now();
function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (cut.active) tickCut(raw, now / 1000);
  else if (S.playing && !S.paused) for (let i = 0; i < S.speed; i++) update(raw);
  else if (S.lost) { deathSequence(raw, now); S.theme.tick(raw, now / 1000); }
  else if (S.theme) { tickSanta(raw, now / 1000); S.theme.tick(raw, now / 1000); }
  outline.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
