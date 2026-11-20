// Dev-only model viewer: /models.html?set=base|side|back|upgrades|hero
import * as THREE from 'three';
import { spawnModel, spawnTower, makeGift } from './models.js';

const set = new URLSearchParams(location.search).get('set') || 'base';
const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
r.setSize(420, 420, false);
const grid = document.getElementById('grid');

function shot(obj, yaw, label) {
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0xa8c4d8, 1.15));
  const d = new THREE.DirectionalLight(0xfff4e0, 1.5); d.position.set(-3, 8, 6); sc.add(d);
  obj.rotation.y = yaw;
  sc.add(obj);
  const cam = new THREE.OrthographicCamera(-1.7, 1.7, 1.7, -1.7, 0.1, 60);
  cam.position.set(0, 4.4, 9); cam.lookAt(0, 1.2, 0);
  r.render(sc, cam);
  const fig = document.createElement('figure');
  const img = new Image(); img.src = r.domElement.toDataURL();
  fig.append(img, label);
  grid.appendChild(fig);
}

const ENEMIES = ['santa', 'mrs_claus', 'elf', 'reindeer'];
const ALL = [...ENEMIES, 'evil_reindeer', 'toy_soldier', 'coal_chucker', 'grump'];
if (set === 'upgrades' || set === 'hero') {
  for (const n of set === 'hero' ? ['grump', 'coal_chucker'] : ['evil_reindeer', 'toy_soldier'])
    for (let lv = 1; lv <= 4; lv++) shot(spawnTower(n, lv), 0.5, `${n} lv${lv}`);
} else {
  const yaw = set === 'side' ? Math.PI / 2 : set === 'back' ? Math.PI - 0.6 : 0.5;
  for (const n of ALL) {
    const o = spawnModel(n);
    if (ENEMIES.includes(n)) { const g = makeGift(); g.position.y = o.userData.height + 0.3; o.add(g); }
    shot(o, yaw, n);
  }
}
window.__viewerReady = true;
