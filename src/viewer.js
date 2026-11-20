// Dev-only model viewer: /models.html?set=base|side|back|upgrades|hero|frost|snowman|props
import * as THREE from 'three';
import { spawnModel, spawnTower, makeGift } from './models.js';
import { makeAircraft, makeGondola, makeCookies } from './props.js';
import { part, box, toon } from './kit.js';

const set = new URLSearchParams(location.search).get('set') || 'base';
const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
r.setSize(420, 420, false);
const grid = document.getElementById('grid');

// el = camera elevation in degrees, R = half-size of the view, cy = height the camera looks at
function shot(obj, yaw, label, { el = 19.6, R = 1.7, cy = 1.2 } = {}) {
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0xa8c4d8, 1.15));
  const d = new THREE.DirectionalLight(0xfff4e0, 1.5); d.position.set(-3, 8, 6); sc.add(d);
  obj.rotation.y = yaw;
  sc.add(obj);
  const cam = new THREE.OrthographicCamera(-R, R, R, -R, 0.1, 60);
  const e = (el * Math.PI) / 180;
  cam.position.set(0, cy + 9.55 * Math.sin(e), 9.55 * Math.cos(e)); cam.lookAt(0, cy, 0);
  r.render(sc, cam);
  const fig = document.createElement('figure');
  const img = new Image(); img.src = r.domElement.toDataURL();
  fig.append(img, label);
  grid.appendChild(fig);
}

const ENEMIES = ['santa', 'mrs_claus', 'elf', 'reindeer'];
const ALL = [...ENEMIES, 'evil_reindeer', 'toy_soldier', 'coal_chucker', 'grump', 'jack_frost', 'snowman'];
const LEVEL_SETS = { upgrades: ['evil_reindeer', 'toy_soldier'], hero: ['grump', 'coal_chucker'], frost: ['jack_frost'], snowman: ['snowman'] };
if (LEVEL_SETS[set]) {
  for (const n of LEVEL_SETS[set])
    for (let lv = 1; lv <= 4; lv++) shot(spawnTower(n, lv), 0.5, `${n} lv${lv}`);
} else if (set === 'props') {
  // grey stand-in blocks show the rider / gadget each vehicle carries, for scale and clearance
  const ghost = toon({ color: '#8E9AAB', transparent: true, opacity: 0.6, flatShading: true });
  const standIn = (w, h, d) => part(box(w, h, d), ghost, 0, h / 2, 0);
  const PROPS = [
    ['plane', () => makeAircraft('plane'), () => standIn(0.9, 1.2, 0.8), 1.5, 0.35],
    ['biplane', () => makeAircraft('biplane'), () => standIn(0.9, 1.2, 0.8), 1.5, 0.35],
    ['airship', () => makeAircraft('airship'), () => standIn(0.9, 1.2, 0.8), 1.5, 0.35],
    ['gondola', makeGondola, () => standIn(1.0, 1.4, 1.0), 1.5, 0.45],
    ['cookies', makeCookies, null, 0.55, 0.1],
  ];
  for (const [el, yaw, view] of [[19.6, 0.5, 'front 3/4'], [53, 0, 'game angle'], [19.6, Math.PI / 2, 'side'], [70, Math.PI, 'above, from behind']]) {
    for (const [name, make, rider, R, cy] of PROPS) {
      const g = new THREE.Group();
      g.add(make());
      if (rider) g.add(rider());
      shot(g, yaw, `${name} (${view})`, { el, R, cy });
    }
  }
} else {
  const yaw = set === 'side' ? Math.PI / 2 : set === 'back' ? Math.PI - 0.6 : 0.5;
  for (const n of ALL) {
    const o = spawnModel(n);
    if (ENEMIES.includes(n)) { const g = makeGift(); g.position.y = o.userData.height + 0.3; o.add(g); }
    shot(o, yaw, n);
  }
}
window.__viewerReady = true;
