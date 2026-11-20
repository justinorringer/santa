import * as THREE from 'three';
import { buildCharacter, part, cone, cyl, rock, lump, box, flat, shade, circle, band, sawtooth, eyes, dotEyes, cheeks, smile } from './kit.js';

const SKIN = '#F2C6A0';
const INK = '#2B2B2B';

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// ------------------------------------------------------------------ Santa
function santa() {
  return buildCharacter({
    size: [1.2, 0.95, 1.05], color: '#D62828', seed: 2,
    legs: { color: '#1B1B1E', h: 0.16, size: 0.34 },
    paint: {
      sides(ctx) {
        band(ctx, 0.64, 0.77, '#1B1B1E');
        band(ctx, 0.87, 1, '#F1EDE4');
        sawtooth(ctx, 0.87, 0.03, 9, '#F1EDE4', false);
      },
      front(ctx) {
        roundRect(ctx, 0.1, 0.05, 0.8, 0.5, 0.12, SKIN);
        // beard
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0.06, 0.36);
        ctx.quadraticCurveTo(0.5, 0.52, 0.94, 0.36);
        ctx.lineTo(0.94, 0.6);
        for (let i = 0; i < 5; i++) ctx.arc(0.85 - i * 0.175, 0.62, 0.0875, 0, Math.PI);
        ctx.lineTo(0.06, 0.36);
        ctx.fill();
        dotEyes(ctx, { y: 0.24, dx: 0.19, r: 0.05 });
        cheeks(ctx, { y: 0.34, dx: 0.3, r: 0.065 });
        circle(ctx, 0.5, 0.36, 0.06, '#E89A8A'); // nose
        // moustache
        ctx.fillStyle = '#F1EDE4';
        ctx.beginPath(); ctx.ellipse(0.4, 0.44, 0.11, 0.045, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0.6, 0.44, 0.11, 0.045, 0.2, 0, Math.PI * 2); ctx.fill();
        // buckle
        roundRect(ctx, 0.4, 0.74, 0.2, 0.15, 0.02, '#F4C430');
        roundRect(ctx, 0.45, 0.78, 0.1, 0.07, 0.01, '#1B1B1E');
      },
    },
    build(g, { W, D, top, mid }) {
      g.add(part(cyl(0.5, 0.56, 0.17, 6), '#F7F4EC', 0, top + 0.03, 0)); // brim
      g.add(part(cyl(0.26, 0.45, 0.34, 5), '#D62828', 0, top + 0.26, 0));
      g.add(part(cone(0.26, 0.5, 5), '#C22020', 0.2, top + 0.52, -0.05, [0, 0, -1.0]));
      g.add(part(rock(0.14), '#FFFFFF', 0.47, top + 0.6, -0.05));
      g.add(part(rock(0.45), '#8A5A2B', 0, mid + 0.18, -D / 2 - 0.12, null, [1, 1.1, 0.8])); // sack
      g.add(part(box(0.2, 0.34, 0.26), '#D62828', -W / 2 - 0.05, mid - 0.02, 0.1, [0, 0, 0.25]));
      g.add(part(box(0.2, 0.34, 0.26), '#D62828', W / 2 + 0.05, mid - 0.02, 0.1, [0, 0, -0.25]));
    },
    height: 1.75,
  });
}

// ------------------------------------------------------------------ Mrs Claus
function mrsClaus() {
  const HAIR = '#D9D9E0';
  return buildCharacter({
    size: [1.0, 0.9, 0.92], color: '#C1121F', seed: 4,
    colors: { top: HAIR },
    legs: { color: '#3A2A2A', h: 0.14, size: 0.28 },
    paint: {
      sides(ctx) {
        sawtooth(ctx, 0.12, 0.05, 6, HAIR, true);
        band(ctx, 0.88, 1, '#FFFFFF');
      },
      back(ctx) { sawtooth(ctx, 0.3, 0.06, 6, HAIR, true); },
      front(ctx) {
        roundRect(ctx, 0.1, 0.1, 0.8, 0.42, 0.12, SKIN);
        sawtooth(ctx, 0.12, 0.05, 6, HAIR, true);
        roundRect(ctx, 0.2, 0.56, 0.6, 0.4, 0.06, '#FFFFFF'); // apron
        roundRect(ctx, 0.4, 0.7, 0.2, 0.14, 0.03, '#EFE6E6');
        dotEyes(ctx, { y: 0.3, dx: 0.18, r: 0.04 });
        ctx.strokeStyle = '#8A7A5A'; ctx.lineWidth = 0.018; // glasses
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(0.5 + s * 0.18, 0.3, 0.085, 0, Math.PI * 2); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(0.405, 0.3); ctx.lineTo(0.595, 0.3); ctx.stroke();
        cheeks(ctx, { y: 0.41, dx: 0.29, r: 0.055 });
        smile(ctx, { y: 0.44, w: 0.07 });
      },
    },
    build(g, { top }) {
      g.add(part(rock(0.3), HAIR, 0, top + 0.14, -0.08, null, [1, 0.85, 1]));
      g.add(part(rock(0.17), HAIR, 0, top + 0.4, -0.08));
      g.add(part(cone(0.07, 0.2, 4), '#2D6A4F', 0.22, top + 0.1, 0.24, [0.6, 0, -0.8]));
      g.add(part(cone(0.07, 0.2, 4), '#2D6A4F', 0.3, top + 0.08, 0.16, [0.2, 0, -1.3]));
      g.add(part(rock(0.055), '#E63946', 0.2, top + 0.05, 0.27));
    },
    height: 1.55,
  });
}

// ------------------------------------------------------------------ Elf
function elf() {
  return buildCharacter({
    size: [0.78, 0.82, 0.74], color: '#2D9C4A', seed: 6,
    legs: { color: '#D62828', h: 0.14, size: 0.22 },
    paint: {
      sides(ctx) {
        band(ctx, 0.74, 0.84, '#1E6B34');
        sawtooth(ctx, 0.5, 0.09, 5, '#D62828', true); // zig-zag collar
        band(ctx, 0, 0.44, '#2D9C4A');
      },
      front(ctx) {
        roundRect(ctx, 0.08, 0.06, 0.84, 0.44, 0.12, SKIN);
        eyes(ctx, { y: 0.26, dx: 0.2, r: 0.09, iris: '#3E7CB1' });
        cheeks(ctx, { y: 0.4, dx: 0.32, r: 0.055 });
        smile(ctx, { y: 0.4, w: 0.09 });
        roundRect(ctx, 0.42, 0.72, 0.16, 0.14, 0.02, '#F4C430');
      },
    },
    build(g, { W, top, mid }) {
      for (const s of [-1, 1]) {
        g.add(part(cone(0.13, 0.42, 4), SKIN, s * (W / 2 + 0.14), mid + 0.2, 0.05, [0, 0, -s * 1.15], [1, 1, 0.45]));
      }
      g.add(part(cyl(0.34, 0.36, 0.1, 6), '#D62828', 0, top + 0.03, 0));
      g.add(part(cyl(0.17, 0.33, 0.3, 5), '#2D9C4A', 0, top + 0.22, 0));
      g.add(part(cone(0.17, 0.42, 5), '#258A3F', -0.14, top + 0.47, 0, [0, 0, 0.9]));
      g.add(part(rock(0.085), '#F4C430', -0.36, top + 0.56, 0));
    },
    height: 1.5,
  });
}

// ------------------------------------------------------------------ Reindeer (friendly + evil)
function reindeer(evil = false) {
  const P = evil
    ? { coat: '#453B52', belly: '#6F5B7E', nose: '#9BE564', antler: '#26232B', spot: '#5A4D6A', leg: '#1E1A24' }
    : { coat: '#A06F42', belly: '#F3E3C3', nose: '#E63946', antler: '#D8B98A', spot: '#C89766', leg: '#4A2E18' };
  return buildCharacter({
    size: [0.98, 0.9, 1.08], color: P.coat, seed: evil ? 9 : 8,
    legs: { color: P.leg, h: 0.2, size: 0.25 },
    paint: {
      sides(ctx) { sawtooth(ctx, 0.76, 0.06, 6, P.belly, false); },
      top(ctx) {
        for (const [x, y, r] of [[0.3, 0.3, 0.06], [0.62, 0.22, 0.045], [0.7, 0.5, 0.06], [0.38, 0.62, 0.05], [0.55, 0.78, 0.04]]) circle(ctx, x, y, r, P.spot);
      },
      front(ctx) {
        ctx.fillStyle = P.belly;
        ctx.beginPath(); ctx.ellipse(0.5, 0.74, 0.34, 0.26, 0, 0, Math.PI * 2); ctx.fill();
        if (evil) {
          eyes(ctx, { y: 0.34, dx: 0.21, r: 0.095, iris: '#FFD23F', sclera: '#FFF3B0', lid: 0.3, lidColor: shade(P.coat, -0.08), brow: 0.42, browColor: '#17141C' });
          ctx.strokeStyle = '#17141C'; ctx.lineWidth = 0.022; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0.38, 0.86); ctx.quadraticCurveTo(0.5, 0.8, 0.64, 0.84); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0.57, 0.83); ctx.lineTo(0.63, 0.83); ctx.lineTo(0.6, 0.9); ctx.fill();
        } else {
          eyes(ctx, { y: 0.36, dx: 0.21, r: 0.095, iris: '#4A2E18' });
          cheeks(ctx, { y: 0.52, dx: 0.33, r: 0.05 });
          smile(ctx, { y: 0.84, w: 0.07, color: '#4A2E18' });
        }
      },
    },
    build(g, { W, D, top, mid }) {
      g.add(part(rock(0.15, 1), evil ? new THREE.MeshLambertMaterial({ color: P.nose, emissive: P.nose, emissiveIntensity: 0.5, flatShading: true }) : P.nose, 0, mid - 0.08, D / 2 + 0.05));
      for (const s of [-1, 1]) {
        const a = new THREE.Group();
        a.add(part(cyl(0.045, 0.07, 0.55, 5), P.antler, 0, 0.25, 0));
        a.add(part(cyl(0.035, 0.05, 0.3, 5), P.antler, s * 0.11, 0.33, 0, [0, 0, -s * 0.9]));
        a.add(part(cyl(0.03, 0.045, 0.24, 5), P.antler, -s * 0.07, 0.48, 0, [0, 0, s * 0.8]));
        if (evil) a.add(part(cone(0.045, 0.16, 4), P.antler, 0, 0.58, 0));
        a.position.set(s * W * 0.27, top - 0.06, 0.05);
        a.rotation.z = -s * 0.38;
        g.add(a);
        g.add(part(cone(0.12, 0.3, 4), P.coat, s * (W / 2 + 0.08), top - 0.14, 0.2, [0, 0, -s * 1.2], [1, 1, 0.5]));
      }
      g.add(part(rock(0.13), P.belly, 0, mid + 0.05, -D / 2 - 0.03));
    },
    height: 1.7,
  });
}

// ------------------------------------------------------------------ Toy soldier (tower)
function toySoldier() {
  const WOOD = '#E8C9A0';
  return buildCharacter({
    size: [0.78, 1.1, 0.72], color: '#8B1E2D', seed: 11,
    legs: { color: '#1B1B1E', h: 0.16, size: 0.24 },
    paint: {
      sides(ctx) { band(ctx, 0.9, 1, '#1B1B1E'); band(ctx, 0.4, 0.45, '#F4C430'); },
      front(ctx) {
        roundRect(ctx, 0.08, 0.04, 0.84, 0.36, 0.1, WOOD);
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.07; // crossed straps
        ctx.beginPath(); ctx.moveTo(0.05, 0.47); ctx.lineTo(0.95, 0.9); ctx.moveTo(0.95, 0.47); ctx.lineTo(0.05, 0.9); ctx.stroke();
        for (const y of [0.54, 0.83]) for (const s of [-1, 1]) circle(ctx, 0.5 + s * 0.3, y, 0.035, '#F4C430');
        circle(ctx, 0.5, 0.685, 0.05, '#F4C430');
        eyes(ctx, { y: 0.21, dx: 0.19, r: 0.07, iris: '#2B2B2B', brow: 0.4, browColor: '#1B1B1E' });
        cheeks(ctx, { y: 0.31, dx: 0.31, r: 0.05, color: '#D9534F' });
        smile(ctx, { y: 0.31, w: 0.06, frown: true });
      },
    },
    build(g, { W, top, mid }) {
      g.add(part(cyl(0.34, 0.38, 0.62, 6), '#1B1B1E', 0, top + 0.26, 0));
      g.add(part(cyl(0.385, 0.39, 0.09, 6), '#F4C430', 0, top + 0.04, 0));
      g.add(part(cone(0.09, 0.3, 4), '#E63946', 0, top + 0.68, 0.1));
      // popgun, pointing forward (+z)
      g.add(part(cyl(0.05, 0.065, 0.95, 5), '#3A3A40', W / 2 + 0.1, mid + 0.02, 0.3, [Math.PI / 2, 0, 0]));
      g.add(part(box(0.13, 0.2, 0.36), '#7A4E2D', W / 2 + 0.1, mid - 0.04, -0.1));
      g.add(part(box(0.2, 0.3, 0.24), '#8B1E2D', W / 2 + 0.06, mid + 0.02, 0.12));
      g.add(part(box(0.2, 0.36, 0.24), '#8B1E2D', -W / 2 - 0.06, mid - 0.05, 0));
    },
    height: 2.0,
  });
}

// ------------------------------------------------------------------ Coal chucker (tower)
function coalChucker() {
  const cracks = (ctx, face) => {
    const seed = { right: 1, left: 2, top: 3, bottom: 4, front: 5, back: 6 }[face];
    let r = seed * 7.13;
    const rnd = () => { r = Math.sin(r * 91.7 + 3.3) * 4375.85; r -= Math.floor(r); return r; };
    for (let k = 0; k < 3; k++) {
      let x = rnd(), y = face === 'front' ? 0.75 + rnd() * 0.25 : rnd();
      const pts = [[x, y]];
      for (let i = 0; i < 4; i++) { x += (rnd() - 0.5) * 0.3; y += (rnd() - 0.5) * 0.3; pts.push([x, y]); }
      for (const [lw, col] of [[0.05, 'rgba(255,110,20,0.35)'], [0.026, '#FF8C1A'], [0.01, '#FFD23F']]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
      }
    }
    for (let i = 0; i < 5; i++) circle(ctx, rnd(), rnd(), 0.05 + rnd() * 0.05, 'rgba(0,0,0,0.18)'); // soot
  };
  const g = buildCharacter({
    size: [1.02, 0.92, 0.98], color: '#33333A', seed: 13,
    legs: { color: '#17171A', h: 0.16, size: 0.3 },
    paint: {
      all: cracks,
      front(ctx) {
        roundRect(ctx, 0.06, 0.08, 0.88, 0.62, 0.1, '#2B2B30');
        for (const s of [-1, 1]) {
          circle(ctx, 0.5 + s * 0.2, 0.3, 0.1, '#FF8C1A');
          circle(ctx, 0.5 + s * 0.2, 0.31, 0.055, '#FFD23F');
          ctx.save(); ctx.translate(0.5 + s * 0.2, 0.17); ctx.rotate(s * 0.4);
          ctx.fillStyle = '#17171A'; ctx.fillRect(-0.13, -0.03, 0.26, 0.07); ctx.restore();
        }
        roundRect(ctx, 0.24, 0.5, 0.52, 0.2, 0.05, '#17171A'); // furnace grate
        roundRect(ctx, 0.27, 0.53, 0.46, 0.14, 0.03, '#FF8C1A');
        roundRect(ctx, 0.3, 0.57, 0.4, 0.09, 0.03, '#FFD23F');
        ctx.fillStyle = '#17171A';
        for (let i = 1; i < 5; i++) ctx.fillRect(0.27 + i * 0.092 - 0.012, 0.52, 0.024, 0.17);
      },
    },
    build(g, { W, top, mid }) {
      const coal = flat('#1F1F24');
      g.add(part(lump(0.26), coal, -0.2, top + 0.12, -0.1, [0.3, 0.5, 0]));
      g.add(part(lump(0.22), coal, 0.22, top + 0.1, -0.2, [1, 0.2, 0.4]));
      g.add(part(lump(0.2), coal, 0.1, top + 0.1, 0.22, [0.2, 1.3, 0.1]));
      g.add(part(lump(0.17), coal, 0.02, top + 0.36, -0.06, [0.7, 0.2, 1]));
      const arm = new THREE.Group();
      arm.name = 'arm';
      arm.add(part(box(0.24, 0.5, 0.26), '#33333A', 0, 0.2, 0));
      arm.add(part(lump(0.2), coal, 0, 0.56, 0, [0.4, 0.3, 0]));
      arm.position.set(W / 2 + 0.1, mid, 0.05);
      arm.rotation.z = -0.25;
      g.add(arm);
      g.add(part(box(0.22, 0.36, 0.26), '#33333A', -W / 2 - 0.07, mid - 0.08, 0.05, [0, 0, 0.2]));
    },
    height: 1.6,
  });
  return g;
}

// ------------------------------------------------------------------ Grump (player)
function grump() {
  const FUR = '#6FA83A', DARK = '#4C7A27', BELLY = '#B8D66B', SCARF = '#7A1F2B';
  return buildCharacter({
    size: [1.2, 1.05, 1.1], color: FUR, seed: 17,
    legs: { color: DARK, h: 0.18, size: 0.34 },
    paint: {
      sides(ctx) {
        sawtooth(ctx, 0.3, 0.07, 7, shade(FUR, 0.05), true);
        sawtooth(ctx, 0.9, 0.1, 7, DARK, false);
        band(ctx, 0.66, 0.78, SCARF);
        ctx.fillStyle = shade(SCARF, 0.1);
        for (let i = 0; i < 6; i++) ctx.fillRect(i / 6 + 0.02, 0.66, 0.06, 0.12);
      },
      front(ctx) {
        ctx.fillStyle = BELLY;
        ctx.beginPath(); ctx.ellipse(0.5, 0.36, 0.42, 0.3, 0, 0, Math.PI * 2); ctx.fill();
        band(ctx, 0.66, 0.78, SCARF);
        ctx.fillStyle = shade(SCARF, 0.1);
        for (let i = 0; i < 6; i++) ctx.fillRect(i / 6 + 0.02, 0.66, 0.06, 0.12);
        eyes(ctx, { y: 0.3, dx: 0.2, r: 0.105, iris: '#F2A900', sclera: '#FFF1A8', lid: 0.42, lidColor: DARK, brow: 0.3, browColor: '#2F4F18' });
        // lopsided smirk + one tooth
        ctx.strokeStyle = INK; ctx.lineWidth = 0.024; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0.3, 0.53); ctx.quadraticCurveTo(0.5, 0.6, 0.72, 0.48); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillRect(0.56, 0.535, 0.06, 0.06);
        cheeks(ctx, { y: 0.47, dx: 0.34, r: 0.045, color: 'rgba(120,170,60,0.9)' });
      },
    },
    build(g, { W, D, top, mid }) {
      const body = g.getObjectByName('body');
      body.rotation.x = 0.16;
      g.add(part(rock(0.6, 1), DARK, 0, top - 0.16, -D * 0.4, null, [1.0, 0.85, 0.85])); // hump
      g.add(part(cone(0.1, 0.34, 4), DARK, 0, top + 0.2, 0.36, [0.5, 0, 0]));
      g.add(part(cone(0.08, 0.28, 4), DARK, 0.13, top + 0.14, 0.38, [0.6, 0, -0.5]));
      g.add(part(cone(0.08, 0.28, 4), DARK, -0.13, top + 0.14, 0.38, [0.6, 0, 0.5]));
      g.add(part(box(0.2, 0.42, 0.08), SCARF, 0.34, mid - 0.42, D / 2 + 0.07, [0.1, 0, -0.15]));
      for (const s of [-1, 1]) g.add(part(box(0.24, 0.5, 0.3), FUR, s * (W / 2 + 0.08), mid - 0.12, 0.18, [0.3, 0, -s * 0.2]));
    },
    height: 1.9,
  });
}

// ------------------------------------------------------------------ Props
const GIFT_COLORS = [['#E63946', '#F4C430'], ['#2D9C4A', '#F1EDE4'], ['#3E7CB1', '#F4C430'], ['#B5179E', '#F1EDE4'], ['#F4A261', '#E63946']];
const giftMats = GIFT_COLORS.map(([c, ribbon]) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = c; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = ribbon; ctx.fillRect(25, 0, 14, 64); ctx.fillRect(0, 25, 64, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 60, 60);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return { mat: new THREE.MeshLambertMaterial({ map: t }), ribbon: flat(ribbon), color: c };
});
const giftGeo = box(0.5, 0.42, 0.5);
const bowGeo = cone(0.1, 0.2, 4);
export function makeGift(i = Math.floor(Math.random() * giftMats.length)) {
  const { mat, ribbon, color } = giftMats[i % giftMats.length];
  const g = new THREE.Group();
  const b = new THREE.Mesh(giftGeo, mat); b.castShadow = true; g.add(b);
  for (const s of [-1, 1]) { const bow = new THREE.Mesh(bowGeo, ribbon); bow.position.set(s * 0.09, 0.27, 0); bow.rotation.z = s * 1.9; g.add(bow); }
  g.userData.color = color;
  return g;
}

const BUILDERS = { santa, mrs_claus: mrsClaus, elf, reindeer: () => reindeer(false), evil_reindeer: () => reindeer(true), toy_soldier: toySoldier, coal_chucker: coalChucker, grump };
const cache = {};
/** Returns a fresh instance (shared geometry + materials) of a named character. */
export function spawnModel(name) {
  if (!cache[name]) cache[name] = BUILDERS[name]();
  const inst = cache[name].clone();
  inst.userData.height = cache[name].userData.height;
  return inst;
}
export const MODEL_NAMES = Object.keys(BUILDERS);
