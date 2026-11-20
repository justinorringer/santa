import * as THREE from 'three';
import { buildFigure, paintedBox, part, cone, cyl, rock, lump, box, chunk, tone, flat, glow, shade, circle, band, sawtooth, eyes, dotEyes, cheeks, smile, squareFace, toon, stick, fuse } from './kit.js';

const SKIN = '#F2C6A0';

// Every character is a torso block + a separate head block (group 'head', pivot at the neck) with
// features that stick OUT of the blocks: noses, muzzles, brows, jaws, beards, belts, cuffs, toes.
// Only eyes / cheeks / glasses stay painted on the head's front face.

/** part() with one shared material per colour. */
const P = (geo, color, x, y, z, rot, scale) => part(geo, typeof color === 'string' ? tone(color) : color, x, y, z, rot, scale);

/** Arm hanging from a shoulder pivot (group origin): sleeve, optional cuff band, optional hand block. */
function limb({ w = 0.2, d = 0.24, len = 0.36, color, cuff, hand, handLen = 0.16, handPad = 0.03, seed = 3 }) {
  const g = new THREE.Group();
  g.add(P(chunk(w, len, d, seed), color, 0, 0.05 - len / 2, 0));
  if (cuff) g.add(P(box(w + 0.07, 0.09, d + 0.07), cuff, 0, 0.1 - len, 0));
  if (hand) g.add(P(chunk(w + handPad, handLen, d + handPad, seed + 1), hand, 0, 0.09 - len - handLen / 2, 0));
  return g;
}
const place = (o, x, y, z, rx = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, 0, rz); return o; };
/** Four-sided crystal spike whose BASE centre sits at (x, y, z); rx / rz tilt it away from straight up. */
function shard(r, len, color, x, y, z, rx = 0, rz = 0, flatZ = 1) {
  const m = P(cone(r, len, 4), color, 0, 0, 0, [rx, 0, rz], [1, 1, flatZ]);
  m.position.set(x, y, z).add(new THREE.Vector3(0, len / 2, 0).applyEuler(m.rotation));
  return m;
}

// ------------------------------------------------------------------ Santa
function santa() {
  const RED = '#D62828', FUR = '#F7F4EC', WHITE = '#FFFFFF', BLACK = '#1B1B1E', GOLD = '#F4C430';
  const hs = [0.9, 0.58, 0.78];
  return buildFigure({
    torso: { size: [1.0, 0.7, 0.9], color: RED, seed: 2 },
    head: {
      size: hs, color: SKIN, seed: 3, z: 0.03, sink: 0.06, colors: { back: WHITE, top: RED },
      paint: {
        right(ctx) { ctx.fillStyle = WHITE; ctx.fillRect(0.5, 0, 0.5, 1); }, // white hair round the back
        left(ctx) { ctx.fillStyle = WHITE; ctx.fillRect(0, 0, 0.5, 1); },
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => {
            dotEyes(ctx, { y: 0.33, dx: 0.3, r: 0.085 });
            cheeks(ctx, { y: 0.47, dx: 0.5, r: 0.1 });
          });
        },
      },
    },
    feet: { color: BLACK, size: [0.36, 0.28, 0.4], at: [[-0.27, 0], [0.27, 0]], toe: [0.36, 0.17, 0.2] },
    build(g, { head: h, hf }) {
      // coat: fur hem, belt that stands proud all round, gold buckle
      g.add(P(chunk(1.14, 0.15, 1.02, 21), FUR, 0, 0.27, 0));
      g.add(P(box(1.1, 0.14, 1.0), BLACK, 0, 0.45, 0));
      g.add(P(box(0.3, 0.22, 0.1), GOLD, 0, 0.45, 0.5));
      g.add(P(box(0.15, 0.1, 0.12), BLACK, 0, 0.45, 0.5));
      for (const s of [-1, 1]) g.add(place(limb({ w: 0.2, d: 0.28, len: 0.38, color: RED, cuff: FUR, hand: '#1E5B34' }), s * 0.55, 0.8, 0.04, -0.15, s * 0.1));
      // sack on his back
      g.add(P(rock(0.4), '#8A5A2B', 0.08, 0.62, -0.52, null, [1, 1.1, 0.8]));
      g.add(P(cyl(0.07, 0.13, 0.16, 5), '#6E4520', 0.08, 1.05, -0.5));
      // beard slabs, sideburns, moustache, nose
      h.add(P(chunk(0.84, 0.36, 0.2, 22), WHITE, 0, 0.08, hf + 0.03));
      h.add(P(chunk(0.54, 0.2, 0.2, 23), WHITE, 0, -0.15, hf + 0.05));
      for (const s of [-1, 1]) {
        h.add(P(chunk(0.12, 0.34, 0.44, 24), WHITE, s * 0.45, 0.14, 0.1));
        h.add(P(chunk(0.28, 0.12, 0.12, 25), FUR, s * 0.14, 0.23, hf + 0.15, [0, 0, -s * 0.3]));
      }
      h.add(P(rock(0.095), '#E89A8A', 0, 0.31, hf + 0.14));
      // hat: fur brim, cap, floppy tip, pom
      h.add(P(chunk(0.98, 0.18, 0.86, 26), FUR, 0, 0.56, 0));
      h.add(P(chunk(0.74, 0.22, 0.64, 27), RED, 0, 0.73, -0.02));
      h.add(P(cone(0.25, 0.46, 5), '#C22020', 0.16, 0.88, -0.04, [0, 0, -1.15]));
      h.add(P(rock(0.13), WHITE, 0.4, 0.93, -0.04));
    },
  });
}

// ------------------------------------------------------------------ Mrs Claus
function mrsClaus() {
  const HAIR = '#D9D9E0', DRESS = '#C1121F', WHITE = '#FFFFFF';
  const hs = [0.86, 0.62, 0.76];
  return buildFigure({
    torso: { size: [0.8, 0.56, 0.74], color: DRESS, seed: 4 },
    head: {
      size: hs, color: SKIN, seed: 5, z: 0.03, colors: { top: HAIR, back: HAIR, left: HAIR, right: HAIR },
      paint: {
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => {
            dotEyes(ctx, { y: 0.53, dx: 0.27, r: 0.07 });
            ctx.strokeStyle = '#8A7A5A'; ctx.lineWidth = 0.03; // glasses
            for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(0.5 + s * 0.27, 0.53, 0.15, 0, Math.PI * 2); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(0.38, 0.53); ctx.lineTo(0.62, 0.53); ctx.stroke();
            cheeks(ctx, { y: 0.76, dx: 0.44, r: 0.09 });
            smile(ctx, { y: 0.88, w: 0.11, lw: 0.03 });
          });
        },
      },
    },
    feet: { color: '#3A2A2A', size: [0.26, 0.24, 0.3], at: [[-0.2, 0], [0.2, 0]], toe: [0.26, 0.14, 0.16] },
    build(g, { head: h, hh, hf }) {
      // flared skirt + lace hem, apron slab with pocket, waistband and bow
      g.add(P(chunk(0.92, 0.3, 0.86, 31), DRESS, 0, 0.33, 0));
      g.add(P(chunk(0.98, 0.1, 0.92, 32), WHITE, 0, 0.2, 0));
      g.add(P(chunk(0.5, 0.42, 0.1, 33), WHITE, 0, 0.42, 0.46));
      g.add(P(box(0.2, 0.14, 0.05), '#E4DADA', 0, 0.36, 0.515));
      g.add(P(box(0.86, 0.08, 0.8), WHITE, 0, 0.6, 0));
      for (const s of [-1, 1]) {
        g.add(P(cone(0.1, 0.22, 4), WHITE, s * 0.13, 0.6, -0.42, [0, 0, s * 1.57], [1, 1, 0.5]));
        g.add(place(limb({ w: 0.18, d: 0.22, len: 0.32, color: DRESS, cuff: WHITE, hand: SKIN, handLen: 0.13 }), s * 0.49, 0.66, 0.04, -0.15, s * 0.15));
      }
      // hair: cap that overhangs, fringe, side curls, bun; plus a button nose
      h.add(P(chunk(0.92, 0.16, 0.82, 34), HAIR, 0, hh - 0.03, -0.02));
      h.add(P(chunk(0.66, 0.14, 0.6, 38), HAIR, 0, hh + 0.09, -0.06));
      h.add(P(chunk(0.7, 0.1, 0.1, 35), HAIR, 0, hh - 0.07, hf + 0.02));
      for (const s of [-1, 1]) h.add(P(chunk(0.12, 0.42, 0.56, 36), HAIR, s * 0.43, 0.34, -0.08));
      h.add(P(chunk(0.13, 0.1, 0.12, 37), '#E8AE8C', 0, 0.18, hf + 0.04));
      h.add(P(rock(0.25), HAIR, 0, hh + 0.27, -0.12, null, [1, 0.85, 1]));
      h.add(P(rock(0.13), HAIR, 0, hh + 0.48, -0.12));
      h.add(P(cone(0.07, 0.2, 4), '#2D6A4F', 0.26, hh + 0.12, 0.22, [0.6, 0, -0.8]));
      h.add(P(cone(0.07, 0.2, 4), '#2D6A4F', 0.34, hh + 0.1, 0.14, [0.2, 0, -1.3]));
      h.add(P(rock(0.055), '#E63946', 0.24, hh + 0.08, 0.25));
    },
  });
}

// ------------------------------------------------------------------ Elf
function elf() {
  const GREEN = '#2D9C4A', RED = '#D62828', GOLD = '#F4C430', HAIR = '#C8742A';
  const hs = [0.8, 0.56, 0.7];
  return buildFigure({
    torso: { size: [0.56, 0.4, 0.5], color: GREEN, seed: 6 },
    head: {
      size: hs, color: SKIN, seed: 7, z: 0.02, colors: { back: HAIR },
      paint: {
        right(ctx) { ctx.fillStyle = HAIR; ctx.fillRect(0.55, 0, 0.45, 1); }, // hair round the back
        left(ctx) { ctx.fillStyle = HAIR; ctx.fillRect(0, 0, 0.45, 1); },
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => {
            eyes(ctx, { y: 0.47, dx: 0.3, r: 0.14, iris: '#3E7CB1' });
            cheeks(ctx, { y: 0.7, dx: 0.47, r: 0.085 });
            smile(ctx, { x: 0.53, y: 0.86, w: 0.14, lw: 0.035 });
          });
        },
      },
    },
    feet: { color: RED, size: [0.22, 0.22, 0.26], at: [[-0.16, 0], [0.16, 0]] },
    build(g, { head: h, feet, hh, hf }) {
      for (const f of feet) { // curly toes with a bell
        f.add(P(cone(0.08, 0.28, 4), RED, 0, 0.02, 0.18, [1.2, 0, 0]));
        f.add(P(rock(0.055), GOLD, 0, 0.09, 0.32));
      }
      g.add(P(chunk(0.68, 0.12, 0.62, 41), '#1E7A38', 0, 0.2, 0)); // tunic hem
      g.add(P(box(0.63, 0.09, 0.57), '#1B1B1E', 0, 0.33, 0));
      g.add(P(box(0.17, 0.15, 0.07), GOLD, 0, 0.33, 0.28));
      for (const s of [-1, 1]) {
        g.add(place(limb({ w: 0.16, d: 0.2, len: 0.24, color: GREEN, cuff: RED, hand: SKIN, handLen: 0.12 }), s * 0.36, 0.48, 0.03, -0.2, s * 0.25));
        h.add(P(cone(0.13, 0.4, 4), SKIN, s * 0.48, 0.32, 0, [0, 0, -s * 1.15], [1, 1, 0.45])); // big ears
      }
      h.add(P(rock(0.075), '#E8A98A', 0, 0.2, hf + 0.06)); // nose
      h.add(P(chunk(0.3, 0.11, 0.12, 42), HAIR, -0.12, hh - 0.08, hf + 0.03, [0, 0, 0.2])); // hair tuft
      // hat: brim band, cone, bent tip, bell
      h.add(P(chunk(0.84, 0.11, 0.74, 43), RED, 0, hh, 0));
      h.add(P(cyl(0.2, 0.41, 0.3, 5), GREEN, 0, hh + 0.19, 0));
      h.add(P(cone(0.21, 0.44, 5), '#258A3F', -0.13, hh + 0.42, 0, [0, 0, 0.9]));
      h.add(P(rock(0.085), GOLD, -0.36, hh + 0.52, 0));
    },
  });
}

// ------------------------------------------------------------------ Reindeer (friendly + evil)
function reindeer(evil = false) {
  const C = evil
    ? { coat: '#453B52', belly: '#6F5B7E', nose: '#9BE564', antler: '#26232B', spot: '#5A4D6A', leg: '#1E1A24' }
    : { coat: '#A06F42', belly: '#F3E3C3', nose: '#E63946', antler: '#D8B98A', spot: '#C89766', leg: '#4A2E18' };
  const hs = [0.84, 0.6, 0.7];
  return buildFigure({
    torso: {
      size: [0.76, 0.5, 0.84], color: C.coat, seed: evil ? 9 : 8, z: -0.12,
      paint: {
        sides(ctx) { sawtooth(ctx, 0.72, 0.07, 5, C.belly, false); },
        top(ctx) { for (const [x, y, r] of [[0.3, 0.2, 0.07], [0.66, 0.12, 0.05], [0.72, 0.36, 0.07], [0.36, 0.42, 0.05]]) circle(ctx, x, y, r, C.spot); },
      },
    },
    head: {
      size: hs, color: C.coat, seed: 10, z: 0.1, sink: 0.08,
      paint: {
        top(ctx) { for (const [x, y, r] of [[0.5, 0.3, 0.07], [0.3, 0.6, 0.05], [0.72, 0.62, 0.06]]) circle(ctx, x, y, r, C.spot); },
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => {
            if (evil) eyes(ctx, { y: 0.43, dx: 0.33, r: 0.12, iris: '#FFD23F', sclera: '#FFF3B0', lid: 0.25, lidColor: shade(C.coat, -0.08) });
            else {
              eyes(ctx, { y: 0.4, dx: 0.33, r: 0.11, iris: '#4A2E18' });
              cheeks(ctx, { y: 0.62, dx: 0.56, r: 0.07 });
            }
          });
        },
      },
    },
    feet: { color: C.leg, size: [0.22, 0.34, 0.24], at: [[-0.25, -0.39], [0.25, -0.39], [-0.25, 0.15], [0.25, 0.15]], toe: [0.22, 0.14, 0.1] },
    build(g, { head: h, hf }) {
      g.add(P(chunk(0.46, 0.26, 0.12, 51), C.belly, 0, 0.47, 0.33)); // chest fluff
      g.add(P(rock(0.12), C.belly, 0, 0.64, -0.55)); // tail
      // muzzle block with the nose on its tip
      const muzzle = paintedBox([0.46, 0.28, 0.26], C.belly, {
        front(ctx) {
          if (evil) {
            ctx.strokeStyle = '#17141C'; ctx.lineWidth = 0.06; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0.14, 0.7); ctx.quadraticCurveTo(0.5, 0.56, 0.86, 0.66); ctx.stroke();
          } else smile(ctx, { y: 0.66, w: 0.16, color: '#4A2E18', lw: 0.05 });
        },
      }, { seed: 52, taper: 1 });
      muzzle.position.set(0, 0.16, hf + 0.08);
      h.add(muzzle);
      h.add(P(rock(0.12, 1), evil ? glow(C.nose, 0.5) : C.nose, 0, 0.28, hf + 0.19));
      if (evil) {
        for (const s of [-1, 1]) h.add(P(chunk(0.36, 0.12, 0.14, 53), '#17141C', s * 0.21, 0.52, hf - 0.01, [0, 0, s * 0.35])); // angry brow ridge
        h.add(P(cone(0.05, 0.16, 4), '#FFFFFF', 0.14, -0.03, hf + 0.15, [Math.PI, 0, 0])); // fang
      } else {
        h.add(P(chunk(0.26, 0.12, 0.2, 54), C.spot, 0, 0.6, 0.14)); // forelock
      }
      for (const s of [-1, 1]) {
        const a = new THREE.Group();
        a.name = s < 0 ? 'antlerL' : 'antlerR';
        a.add(P(cyl(0.045, 0.07, 0.55, 5), C.antler, 0, 0.25, 0));
        a.add(P(cyl(0.035, 0.05, 0.3, 5), C.antler, s * 0.11, 0.33, 0, [0, 0, -s * 0.9]));
        a.add(P(cyl(0.03, 0.045, 0.24, 5), C.antler, -s * 0.07, 0.48, 0, [0, 0, s * 0.8]));
        if (evil) a.add(P(cone(0.045, 0.16, 4), C.antler, 0, 0.58, 0));
        a.position.set(s * 0.24, 0.56, -0.08);
        a.rotation.z = -s * 0.38;
        h.add(a);
        h.add(P(cone(0.12, 0.3, 4), C.coat, s * 0.5, 0.48, -0.05, [0, 0, -s * 1.2], [1, 1, 0.5])); // ears
      }
    },
  });
}

// ------------------------------------------------------------------ Evil toy soldier (tower)
function toySoldier() {
  const WOOD = '#CDB79A', COAT = '#5E1420', BLACK = '#141417', BRASS = '#B8860B';
  const hs = [0.7, 0.52, 0.62];
  return buildFigure({
    torso: {
      size: [0.64, 0.5, 0.54], color: COAT, seed: 11,
      paint: {
        sides(ctx) { band(ctx, 0.86, 1, BLACK); },
        front(ctx) {
          ctx.strokeStyle = '#EDE6D6'; ctx.lineWidth = 0.1; // crossed straps
          ctx.beginPath(); ctx.moveTo(0.04, 0.02); ctx.lineTo(0.96, 0.62); ctx.moveTo(0.96, 0.02); ctx.lineTo(0.04, 0.62); ctx.stroke();
        },
      },
    },
    head: {
      size: hs, color: WOOD, seed: 12, z: 0.02,
      paint: {
        sides(ctx, face) { if (face !== 'front') { ctx.fillStyle = BLACK; ctx.fillRect(0.42, 0, 0.14, 1); } }, // chin strap
        front(ctx) {
          ctx.fillStyle = '#1A0508'; ctx.fillRect(0.15, 0.7, 0.7, 0.3); // open mouth behind the jaw
          ctx.fillStyle = '#FFFFFF';
          for (let i = 0; i < 5; i++) { const x = 0.2 + i * 0.12; ctx.beginPath(); ctx.moveTo(x, 0.7); ctx.lineTo(x + 0.12, 0.7); ctx.lineTo(x + 0.06, 0.8); ctx.fill(); }
          ctx.strokeStyle = '#6B5A45'; ctx.lineWidth = 0.02; ctx.lineJoin = 'round'; // cracked paint
          ctx.beginPath(); ctx.moveTo(0.9, 0.2); ctx.lineTo(0.84, 0.34); ctx.lineTo(0.92, 0.46); ctx.lineTo(0.86, 0.6); ctx.stroke();
          squareFace(ctx, hs[0], hs[1], () => eyes(ctx, { y: 0.47, dx: 0.27, r: 0.11, sclera: '#1A0508', iris: '#FF2A2A', pupil: '#FFD23F' }));
        },
      },
    },
    feet: { color: BLACK, size: [0.24, 0.26, 0.28], at: [[-0.17, 0], [0.17, 0]], toe: [0.24, 0.15, 0.14] },
    build(g, { head: h, hh, hf }) {
      g.add(P(box(0.72, 0.1, 0.62), BLACK, 0, 0.28, 0)); // belt + buckle
      g.add(P(box(0.16, 0.15, 0.06), BRASS, 0, 0.28, 0.31));
      g.add(P(box(0.15, 0.15, 0.06), '#EDE6D6', 0, 0.47, 0.285, [0, 0, Math.PI / 4])); // badge where the straps cross
      for (const s of [-1, 1]) g.add(P(chunk(0.24, 0.09, 0.36, 61), BRASS, s * 0.38, 0.66, 0)); // epaulettes
      g.add(place(limb({ w: 0.18, d: 0.22, len: 0.34, color: COAT, cuff: BRASS, hand: WOOD, handLen: 0.13 }), -0.43, 0.62, 0, 0, -0.1));
      g.add(place(limb({ w: 0.18, d: 0.22, len: 0.3, color: COAT, cuff: BRASS, hand: WOOD, handLen: 0.13 }), 0.43, 0.6, 0.02, -1.15, 0.05));
      // popgun, pointing forward (+z), with a cork in the muzzle
      g.add(P(cyl(0.05, 0.065, 0.9, 5), '#2A2A30', 0.46, 0.44, 0.4, [Math.PI / 2, 0, 0]));
      g.add(P(box(0.12, 0.2, 0.34), '#4A2E1A', 0.46, 0.4, -0.06));
      g.add(P(cyl(0.06, 0.06, 0.08, 5), '#C9A26B', 0.46, 0.44, 0.86, [Math.PI / 2, 0, 0]));
      // face: angry brow ridge, nose block, nutcracker jaw with jagged teeth
      for (const s of [-1, 1]) h.add(P(chunk(0.34, 0.13, 0.15, 62), BLACK, s * 0.18, 0.42, hf - 0.01, [0, 0, s * 0.4]));
      h.add(P(chunk(0.13, 0.13, 0.12, 63), '#B89F80', 0, 0.2, hf + 0.04));
      h.add(P(chunk(0.5, 0.2, 0.26, 64), '#B89F80', 0, 0.02, hf + 0.03));
      for (let i = 0; i < 4; i++) h.add(P(cone(0.055, 0.13, 4), '#FFFFFF', -0.15 + i * 0.1, 0.16, hf + 0.11, [0, Math.PI / 4, 0]));
      // shako: band, tall block, visor, badge, plume
      h.add(P(chunk(0.76, 0.1, 0.68, 65), '#8B0F1A', 0, hh + 0.01, 0));
      h.add(P(chunk(0.66, 0.56, 0.58, 66), BLACK, 0, hh + 0.32, 0));
      h.add(P(box(0.5, 0.05, 0.14), BLACK, 0, hh - 0.03, hf + 0.02));
      h.add(P(box(0.14, 0.14, 0.05), BRASS, 0, hh + 0.26, 0.3, [0, 0, Math.PI / 4]));
      h.add(P(cone(0.09, 0.3, 4), '#E11D2E', 0, hh + 0.72, 0.12));
    },
  });
}

// ------------------------------------------------------------------ Coal chucker (tower)
function coalChucker() {
  const SOOT = '#33333A', IRON = '#17171A', COAL = '#1F1F24';
  const cracks = (off, skipFace) => (ctx, face) => {
    const seed = { right: 1, left: 2, top: 3, bottom: 4, front: 5, back: 6 }[face] + off;
    let r = seed * 7.13;
    const rnd = () => { r = Math.sin(r * 91.7 + 3.3) * 4375.85; r -= Math.floor(r); return r; };
    for (let k = 0; k < 3; k++) {
      let x = rnd(), y = rnd();
      if (face === 'front' && skipFace) { x = k ? 0.9 : 0.08; y = 0.3 + rnd() * 0.5; } // keep cracks off the face
      const pts = [[x, y]];
      for (let i = 0; i < 4; i++) { x += (rnd() - 0.5) * 0.3; y += (rnd() - 0.5) * 0.3; pts.push([x, y]); }
      for (const [lw, col] of [[0.05, 'rgba(255,110,20,0.35)'], [0.026, '#FF8C1A'], [0.01, '#FFD23F']]) {
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
      }
    }
    for (let i = 0; i < 5; i++) circle(ctx, rnd(), rnd(), 0.05 + rnd() * 0.05, 'rgba(0,0,0,0.18)'); // soot
  };
  const hs = [0.84, 0.66, 0.8];
  return buildFigure({
    torso: { size: [0.8, 0.42, 0.72], color: SOOT, seed: 13, paint: { all: cracks(0, false) } },
    head: {
      size: hs, color: SOOT, seed: 14, z: 0.02,
      paint: {
        all: cracks(6, true),
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => {
            for (const s of [-1, 1]) {
              circle(ctx, 0.5 + s * 0.31, 0.4, 0.15, '#17171A');
              circle(ctx, 0.5 + s * 0.31, 0.4, 0.125, '#FF8C1A');
              circle(ctx, 0.5 + s * 0.31, 0.41, 0.065, '#FFD23F');
            }
          });
        },
      },
    },
    feet: { color: IRON, size: [0.22, 0.24, 0.22], at: [[-0.27, -0.22], [0.27, -0.22], [-0.27, 0.22], [0.27, 0.22]] },
    build(g, { head: h, hh, hf }) {
      g.add(P(box(0.88, 0.1, 0.8), '#4A4A52', 0, 0.3, 0)); // iron band round the base
      // arms hang off the stove body (the head block) so they move with it
      h.add(place(limb({ w: 0.2, d: 0.24, len: 0.38, color: SOOT, cuff: '#4A4A52', hand: COAL, handLen: 0.18 }), -0.5, 0.32, 0.04, -0.1, -0.08));
      const arm = new THREE.Group(); // raised throwing arm, pivots at the shoulder
      arm.name = 'arm';
      arm.add(P(chunk(0.2, 0.5, 0.24, 71), SOOT, 0, 0.2, 0));
      arm.add(P(box(0.27, 0.09, 0.31), '#4A4A52', 0, 0.36, 0));
      arm.add(P(lump(0.18), COAL, 0, 0.55, 0, [0.4, 0.3, 0]));
      arm.position.set(0.5, 0.3, 0.04);
      arm.rotation.z = -0.1;
      h.add(arm);
      // stove face: angry brows, jutting grate jaw with a glowing mouth behind bars
      for (const s of [-1, 1]) h.add(P(chunk(0.36, 0.12, 0.14, 72), IRON, s * 0.21, 0.56, hf - 0.01, [0, 0, s * 0.3]));
      h.add(P(chunk(0.6, 0.3, 0.16, 73), IRON, 0, 0.16, hf + 0.03));
      h.add(P(box(0.48, 0.18, 0.03), glow('#FF8C1A'), 0, 0.16, hf + 0.125));
      h.add(P(box(0.4, 0.06, 0.03), glow('#FFD23F'), 0, 0.11, hf + 0.13));
      for (const x of [-0.12, 0, 0.12]) h.add(P(box(0.045, 0.22, 0.05), IRON, x, 0.16, hf + 0.15));
      h.add(P(box(0.56, 0.05, 0.08), IRON, 0, 0.275, hf + 0.14));
      h.add(P(box(0.56, 0.05, 0.08), IRON, 0, 0.045, hf + 0.14));
      // stove lid + coal pile
      h.add(P(chunk(0.92, 0.09, 0.88, 74), '#4A4A52', 0, hh, 0));
      h.add(P(lump(0.24), COAL, -0.2, hh + 0.13, -0.1, [0.3, 0.5, 0]));
      h.add(P(lump(0.2), COAL, 0.22, hh + 0.11, -0.2, [1, 0.2, 0.4]));
      h.add(P(lump(0.19), COAL, 0.1, hh + 0.11, 0.2, [0.2, 1.3, 0.1]));
      h.add(P(lump(0.16), COAL, 0.0, hh + 0.32, -0.06, [0.7, 0.2, 1]));
    },
  });
}

// ------------------------------------------------------------------ Grump (player)
function grump() {
  const FUR = '#6FA83A', DARK = '#4C7A27', BELLY = '#B8D66B', SCARF = '#7A1F2B', JAW = '#8CC24E', TOOTH = '#FFF8E7';
  const hs = [0.8, 0.56, 0.66];
  return buildFigure({
    torso: {
      size: [0.98, 0.66, 0.8], color: FUR, seed: 17, tilt: 0.2,
      paint: { sides(ctx) { sawtooth(ctx, 0.88, 0.1, 6, DARK, false); } },
    },
    head: { // smaller than the shoulders, pushed forward and low
      size: hs, color: FUR, seed: 18, z: 0.31, sink: 0.22,
      paint: {
        top(ctx) { sawtooth(ctx, 0.3, 0.14, 4, DARK, true); },
        sides(ctx, face) { if (face !== 'front') sawtooth(ctx, 0.9, 0.1, 5, DARK, false); },
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => eyes(ctx, { y: 0.47, dx: 0.34, r: 0.155, iris: '#F2A900', sclera: '#FFF1A8', lid: 0.3, lidColor: DARK }));
        },
      },
    },
    feet: { color: '#3D6420', size: [0.34, 0.28, 0.36], at: [[-0.27, 0.02], [0.27, 0.02]], toe: [0.36, 0.17, 0.2] },
    build(g, { head: h, hh, hf }) {
      h.rotation.x = 0.1; // head hangs forward
      // hunched back: a dark hump of shoulders rising behind and above the head
      const hump = paintedBox([0.92, 0.66, 0.68], '#426D20', { sides(ctx) { sawtooth(ctx, 0.84, 0.12, 5, FUR, false); } }, { seed: 81, taper: 0.85 });
      hump.position.set(0, 1.08, -0.22);
      hump.rotation.x = -0.1;
      g.add(hump);
      g.add(P(cone(0.12, 0.3, 4), DARK, -0.18, 1.5, -0.16, [-0.3, 0, 0.3]));
      g.add(P(cone(0.11, 0.26, 4), DARK, 0.2, 1.48, -0.26, [-0.5, 0, -0.3]));
      g.add(P(cone(0.11, 0.26, 4), DARK, 0, 1.4, -0.48, [-0.9, 0, 0]));
      g.add(P(chunk(0.6, 0.36, 0.1, 82), BELLY, 0, 0.42, 0.43, [0.2, 0, 0])); // belly patch
      // tattered scarf: thick wrap under the jaw + a hanging tail
      g.add(P(chunk(0.92, 0.16, 0.72, 83), SCARF, 0, 0.62, 0.31));
      g.add(P(chunk(0.2, 0.34, 0.1, 84), SCARF, 0.24, 0.4, 0.61, [0.1, 0, -0.1]));
      g.add(P(box(0.08, 0.12, 0.08), shade(SCARF, 0.08), 0.3, 0.2, 0.61, [0.1, 0, -0.1]));
      for (const s of [-1, 1]) { // long arms hanging forward off the hump, big hands
        const a = place(limb({ w: 0.22, d: 0.28, len: 0.6, color: FUR, hand: DARK, handLen: 0.22, handPad: 0.06 }), s * 0.54, 0.9, -0.04, -0.4, s * 0.06);
        a.name = s < 0 ? 'armL' : 'armR';
        g.add(a);
      }
      // face: heavy brow, nose, big underbite jaw with teeth, droopy ears, scruffy tuft
      for (const s of [-1, 1]) {
        h.add(P(chunk(0.4, 0.13, 0.14, 85), DARK, s * 0.2, 0.46, hf - 0.01, [0, 0, s * 0.25]));
        h.add(P(cone(0.1, 0.3, 4), FUR, s * 0.46, 0.36, -0.06, [0, 0, -s * 1.5], [1, 1, 0.5]));
      }
      h.add(P(chunk(0.16, 0.12, 0.13, 86), '#5C9130', 0, 0.19, hf + 0.04));
      h.add(P(chunk(0.76, 0.22, 0.34, 87), JAW, 0, 0.03, hf - 0.04));
      h.add(P(chunk(0.11, 0.15, 0.09, 88), TOOTH, 0.3, 0.18, hf + 0.07)); // tusk-ish teeth at the jaw corners
      h.add(P(chunk(0.08, 0.1, 0.08, 89), TOOTH, -0.31, 0.16, hf + 0.07));
      const tuft = new THREE.Group();
      tuft.name = 'tuft';
      tuft.add(P(cone(0.12, 0.4, 4), DARK, 0, 0.16, 0, [0.5, 0, 0]));
      tuft.add(P(cone(0.1, 0.32, 4), DARK, 0.15, 0.1, 0.02, [0.6, 0, -0.5]));
      tuft.add(P(cone(0.1, 0.32, 4), DARK, -0.15, 0.1, 0.02, [0.6, 0, 0.5]));
      tuft.position.set(0, hh - 0.02, 0.1);
      h.add(tuft);
    },
  });
}

// ------------------------------------------------------------------ Jack Frost (tower)
const FROST = { skin: '#9FD8F5', tunic: '#3A6EA5', fur: '#F4FAFF', hair: '#E9F6FD', ice: '#A8E4F7', glow: '#8FDCFF', scarf: '#7A5CE0' };
function jackFrost() {
  const F = FROST, GLOW = glow(F.glow, 0.5);
  const hs = [0.8, 0.58, 0.7];
  return buildFigure({
    torso: {
      size: [0.6, 0.5, 0.52], color: F.tunic, seed: 91,
      paint: { sides(ctx) { sawtooth(ctx, 0.84, 0.1, 5, F.fur, false); } }, // frosted hem
    },
    head: {
      size: hs, color: F.skin, seed: 92, z: 0.02, colors: { top: F.hair, back: F.hair },
      paint: {
        right(ctx) { ctx.fillStyle = F.hair; ctx.fillRect(0.55, 0, 0.45, 1); }, // hair round the back
        left(ctx) { ctx.fillStyle = F.hair; ctx.fillRect(0, 0, 0.45, 1); },
        front(ctx) {
          squareFace(ctx, hs[0], hs[1], () => eyes(ctx, { y: 0.38, dx: 0.33, r: 0.125, iris: '#1C9BD0', lid: 0.32, lidColor: shade(F.skin, -0.12) }));
        },
      },
    },
    feet: { color: '#27467A', size: [0.24, 0.24, 0.28], at: [[-0.16, 0], [0.16, 0]], toe: [0.24, 0.14, 0.16], toeColor: F.fur },
    build(g, { head: h, hh, hf }) {
      // frost-fur collar that overhangs the shoulders, scarf wrapped above it with a tail flying out behind
      g.add(P(chunk(0.9, 0.14, 0.78, 93), F.fur, 0, 0.57, 0.02));
      g.add(P(chunk(0.84, 0.09, 0.72, 94), F.scarf, 0, 0.655, 0.02));
      g.add(P(chunk(0.16, 0.08, 0.42, 95), F.scarf, -0.36, 0.69, -0.46, [0.12, 0.75, 0]));
      g.add(P(chunk(0.14, 0.07, 0.26, 96), shade(F.scarf, 0.08), -0.53, 0.75, -0.62, [0.2, 1.0, 0]));
      // both arms reach forward and up: hands cupped under the mouth, ready to blow
      for (const s of [-1, 1]) {
        const a = new THREE.Group();
        a.name = s < 0 ? 'armL' : 'armR';
        a.add(P(chunk(0.17, 0.17, 0.44, 97), F.tunic, 0, 0, 0.2));
        a.add(P(box(0.22, 0.22, 0.09), F.fur, 0, 0, 0.42));
        a.add(P(chunk(0.18, 0.13, 0.2, 98), F.skin, 0, 0, 0.55));
        a.position.set(s * 0.36, 0.5, 0.06);
        a.rotation.set(-0.2, -s * 0.5, 0);
        g.add(a);
      }
      g.add(P(rock(0.065), glow(F.glow, 0.8), 0, 0.7, 0.6)); // frost puff in his palms
      // face: cocked brow ridge, sharp nose, puffed cheeks and an "O" mouth mid-blow, pointy ears
      h.add(P(chunk(0.28, 0.08, 0.1, 99), '#3F78B8', -0.19, 0.49, hf + 0.01, [0, 0, -0.1]));
      h.add(P(chunk(0.28, 0.08, 0.1, 100), '#3F78B8', 0.19, 0.45, hf + 0.01, [0, 0, 0.3]));
      h.add(P(cone(0.06, 0.2, 4), '#7DB6DC', 0, 0.3, hf + 0.08, [Math.PI / 2, 0, 0]));
      h.add(P(cyl(0.1, 0.11, 0.08, 6), '#5C8FC2', 0, 0.17, hf + 0.04, [Math.PI / 2, 0, 0]));
      h.add(P(cyl(0.06, 0.06, 0.02, 6), '#1D3557', 0, 0.17, hf + 0.085, [Math.PI / 2, 0, 0]));
      for (const s of [-1, 1]) {
        h.add(P(chunk(0.17, 0.15, 0.12, 101), '#D9AEEA', s * 0.27, 0.19, hf + 0.01));
        h.add(P(cone(0.13, 0.42, 4), F.skin, s * 0.47, 0.32, 0, [0, 0, -s * 1.05], [1, 1, 0.5]));
      }
      // ice-crystal hair swept back: cap + chunky spikes (fused per colour), a few glowing
      h.add(P(chunk(0.86, 0.16, 0.76, 102), F.hair, 0, hh - 0.02, -0.02));
      h.add(fuse([shard(0.18, 0.78, GLOW, 0, hh, 0, -0.55, 0), shard(0.13, 0.4, GLOW, 0.17, hh - 0.04, -0.28, -1.15, -0.3), shard(0.12, 0.34, GLOW, -0.2, 0.3, -0.3, -1.75, 0.3)], GLOW));
      const ICE = tone(F.ice);
      h.add(fuse([
        shard(0.15, 0.52, ICE, -0.24, hh, -0.02, -0.6, 0.45), shard(0.15, 0.52, ICE, 0.24, hh, -0.02, -0.6, -0.45),
        shard(0.13, 0.4, ICE, -0.17, hh - 0.04, -0.28, -1.15, 0.3), shard(0.14, 0.38, ICE, 0, 0.42, -0.3, -1.5, 0), shard(0.12, 0.34, ICE, 0.2, 0.3, -0.3, -1.75, -0.3),
      ], ICE));
      const fringe = new THREE.Group();
      fringe.name = 'fringe';
      for (const s of [-1, 1]) fringe.add(shard(0.1, 0.3, F.fur, s * 0.16, hh + 0.02, 0.26, 1.0, -s * 0.35));
      h.add(fringe);
    },
  });
}

// ------------------------------------------------------------------ Snowman (tower)
const SNOW = { base: '#C6D9EC', chest: '#E2ECF7', head: '#F7FAFF', ball: '#EAF2FA', lump: '#BFD3E8', coal: '#22222A', twig: '#5A3A22', carrot: '#F28C28', scarf: '#B3202A', tin: '#7C8794' };
function snowman() {
  const S = SNOW, g = new THREE.Group();
  const COAL = tone(S.coal), TWIG = tone(S.twig), MITT = tone(S.scarf), LUMP = tone(S.lump);
  // three stacked wonky snow blocks in slightly different tones: blue-ish base, cool chest, bright head
  const base = paintedBox([1.0, 0.56, 0.9], S.base, {}, { seed: 121, taper: 0.94 });
  base.position.y = 0.28;
  base.name = 'body';
  const chest = paintedBox([0.76, 0.48, 0.7], S.chest, {}, { seed: 122, taper: 0.94 });
  chest.position.set(0, 0.74, 0.02);
  g.add(base, chest);
  g.add(fuse([part(rock(0.2), LUMP, -0.44, 0.17, 0.26), part(rock(0.17), LUMP, 0.46, 0.14, -0.2), part(rock(0.18), LUMP, -0.2, 0.15, -0.3)], LUMP)); // drift lumps round the base
  g.add(fuse([[0.05, 0.87, 0.39], [0.05, 0.71, 0.4], [0.05, 0.4, 0.48]].map(([x, y, z]) => part(lump(0.055), COAL, x, y, z, [x * 9, y * 7, 0])), COAL)); // coal buttons
  // scarf with a hanging tail
  g.add(P(chunk(0.86, 0.13, 0.78, 124), S.scarf, 0, 0.97, 0.04));
  g.add(P(chunk(0.17, 0.36, 0.09, 125), S.scarf, -0.25, 0.79, 0.42, [0.06, 0, 0.1]));
  g.add(P(box(0.18, 0.06, 0.1), '#F1EDE4', -0.26, 0.69, 0.425, [0.06, 0, 0.1]));
  // twig arms reaching forward and down onto the ball, mittens on the ends
  g.add(fuse([-1, 1].flatMap((s) => [
    stick([s * 0.36, 0.86, 0.02], [s * 0.5, 0.84, 0.22], 0.055, TWIG, 5, 0.05),
    stick([s * 0.5, 0.84, 0.22], [s * 0.28, 0.74, 0.5], 0.05, TWIG, 5, 0.036),
    stick([s * 0.47, 0.83, 0.28], [s * 0.6, 0.98, 0.4], 0.03, TWIG, 4, 0.018),
  ]), TWIG));
  g.add(fuse([-1, 1].map((s) => part(chunk(0.18, 0.18, 0.2, 126), MITT, s * 0.27, 0.72, 0.52, [0.5, -s * 0.3, 0])), MITT));
  // the snowball he is about to bowl: the game hides / shows this by name
  const ball = P(rock(0.4, 1), S.ball, 0, 0.4, 0.75, [0.3, 0.5, 0]);
  ball.name = 'ball';
  g.add(ball);

  const hh = 0.56, hf = 0.33;
  const h = new THREE.Group();
  h.name = 'head';
  h.position.set(0, 0.94, 0.05);
  const skull = paintedBox([0.72, hh, 0.66], S.head, {}, { seed: 123, taper: 0.94 });
  skull.position.y = hh / 2;
  skull.name = 'skull';
  h.add(skull);
  h.add(P(cone(0.085, 0.42, 5), S.carrot, 0, 0.27, hf + 0.19, [Math.PI / 2, 0, 0])); // carrot nose, well out
  h.add(fuse([ // coal eyes + a coal frown
    ...[-1, 1].map((s) => part(lump(0.07), COAL, s * 0.17, 0.39, hf + 0.02, [s, 0.4, 0])),
    ...[-2, -1, 0, 1, 2].map((i) => part(lump(0.042), COAL, i * 0.085, 0.135 - i * i * 0.014, hf + 0.015, [i, 0.3, 0])),
  ], COAL));
  const brows = new THREE.Group(); // heavy angry twig brows (swapped for icicles at level 3)
  brows.name = 'brows';
  for (const s of [-1, 1]) brows.add(P(chunk(0.28, 0.075, 0.1, 127), S.twig, s * 0.19, 0.5, hf + 0.03, [0, 0, s * 0.42]));
  h.add(brows);
  const hat = new THREE.Group(); // dented tin bucket, worn at an angle
  hat.name = 'hat';
  hat.add(P(cyl(0.24, 0.31, 0.34, 6), S.tin, 0, 0.17, 0));
  hat.add(P(cyl(0.37, 0.37, 0.05, 6), shade(S.tin, -0.12), 0, 0.02, 0));
  hat.add(P(rock(0.15), S.head, 0.04, 0.35, 0.02, null, [1, 0.6, 1])); // snow cap
  hat.position.set(0.03, hh - 0.01, -0.03);
  hat.rotation.set(0.06, 0, -0.2);
  h.add(hat);
  g.add(h);
  g.userData.height = Math.round(new THREE.Box3().setFromObject(h, true).max.y * 100) / 100; // top of the hat
  return g;
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
  return { mat: toon({ map: t }), ribbon: flat(ribbon), color: c };
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

// ------------------------------------------------------------------ Upgrade looks
// Extra parts bolted on per level (2..4). Head-mounted parts go in the 'head' group (head-local
// coords: y up from the neck) so they wobble with it; the rest are model-local, before scaling.
const pip = (g, level, y) => {
  for (let i = 0; i < level - 1; i++) g.add(part(new THREE.OctahedronGeometry(0.09), glow('#FFD23F', 0.7), (i - (level - 2) / 2) * 0.24, y, 0));
};
const ADDONS = {
  coal_chucker(g, lv) {
    const h = g.getObjectByName('head'), top = 0.7; // top = stove lid, head-local
    if (lv >= 2) { // hot coals in the pile
      h.add(P(lump(0.17), glow('#FF8C1A'), -0.14, top + 0.12, 0.26, [0.4, 0.2, 0]));
      h.add(P(lump(0.14), glow('#FFD23F'), 0.33, top + 0.1, 0.02, [0.1, 0.8, 0.3]));
    }
    if (lv >= 3) { // chimney + heavy iron rim + bigger pile
      h.add(P(cyl(0.12, 0.14, 0.6, 6), '#17171A', -0.3, top + 0.3, -0.28));
      h.add(P(cyl(0.17, 0.17, 0.08, 6), '#4A4A52', -0.3, top + 0.6, -0.28));
      h.add(P(box(1.04, 0.14, 0.96), '#4A4A52', 0, top - 0.06, 0));
      h.add(P(lump(0.22), '#1F1F24', 0.26, top + 0.3, 0.12, [0.9, 0.1, 0.4]));
    }
    if (lv >= 4) { // meltdown: flame crown
      for (const [x, z, fh] of [[0, 0, 0.6], [-0.2, 0.2, 0.4], [0.26, -0.1, 0.44], [0.05, -0.28, 0.36]]) {
        h.add(P(cone(0.16, fh, 5), glow('#FF8C1A', 1), x, top + 0.34 + fh / 2, z));
        h.add(P(cone(0.09, fh * 0.7, 5), glow('#FFE08A', 1), x, top + 0.34 + fh * 0.4, z));
      }
      h.add(P(cone(0.12, 0.3, 5), glow('#FF8C1A', 1), -0.3, top + 0.78, -0.28));
    }
    pip(g, lv, lv >= 4 ? 2.4 : lv >= 3 ? 2.1 : 1.9);
  },
  evil_reindeer(g, lv) {
    const h = g.getObjectByName('head'), hf = 0.35;
    if (lv >= 2) { // bigger glowing nose + drool
      h.add(P(rock(0.18, 1), glow('#9BE564', 0.8), 0, 0.29, hf + 0.2));
      h.add(P(cone(0.05, 0.22, 4), glow('#9BE564', 0.8), -0.1, -0.07, hf + 0.14, [Math.PI, 0, 0]));
    }
    if (lv >= 3) { // spikes: head crest, cheeks, rump + extra antler prongs
      for (const s of [-1, 1]) {
        g.add(P(cone(0.08, 0.26, 4), '#D5DCE8', s * 0.2, 0.84, -0.4, [-0.3, 0, -s * 0.25]));
        h.add(P(cone(0.09, 0.3, 4), '#D5DCE8', s * 0.5, 0.2, 0.12, [0, 0, -s * Math.PI / 2]));
        g.getObjectByName(s < 0 ? 'antlerL' : 'antlerR').add(P(cone(0.05, 0.3, 4), '#26232B', s * 0.16, 0.14, 0, [0, 0, -s * 1.1]));
      }
      g.add(P(cone(0.08, 0.26, 4), '#D5DCE8', 0, 0.86, -0.56, [-0.7, 0, 0]));
      for (const z of [0.2, 0, -0.2]) h.add(P(cone(0.08, 0.26, 4), '#D5DCE8', 0, 0.7, z)); // spiked crest
    }
    if (lv >= 4) { // acid: glowing antler tips + toxic halo
      for (const s of [-1, 1]) {
        const a = g.getObjectByName(s < 0 ? 'antlerL' : 'antlerR');
        a.add(P(rock(0.1), glow('#9BE564', 1), 0, 0.68, 0));
        a.add(P(rock(0.08), glow('#9BE564', 1), s * 0.24, 0.43, 0));
      }
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 4, 10), glow('#9BE564', 0.9));
      halo.rotation.x = Math.PI / 2; halo.position.y = 0.12; halo.name = 'spin';
      g.add(halo);
    }
    pip(g, lv, 2.15);
  },
  toy_soldier(g, lv) {
    const h = g.getObjectByName('head'), hh = 0.52, hf = 0.31;
    const gunX = 0.46, gunY = 0.44;
    if (lv >= 2) { // bayonet + skull badge on the hat
      g.add(P(cone(0.05, 0.36, 4), '#D5DCE8', gunX, gunY - 0.08, 0.98, [Math.PI / 2, 0, 0]));
      h.add(P(box(0.24, 0.22, 0.06), '#EDE6D6', 0, hh + 0.28, 0.3));
      h.add(P(box(0.06, 0.07, 0.07), '#141417', -0.06, hh + 0.3, 0.31));
      h.add(P(box(0.06, 0.07, 0.07), '#141417', 0.06, hh + 0.3, 0.31));
    }
    if (lv >= 3) { // second gun + glowing eyes
      g.add(P(cyl(0.05, 0.065, 0.9, 5), '#2A2A30', -gunX - 0.06, gunY - 0.1, 0.4, [Math.PI / 2, 0, 0]));
      g.add(P(box(0.12, 0.2, 0.34), '#4A2E1A', -gunX - 0.06, gunY - 0.14, -0.06));
      g.add(P(cone(0.05, 0.36, 4), '#D5DCE8', -gunX - 0.06, gunY - 0.18, 0.98, [Math.PI / 2, 0, 0]));
      for (const s of [-1, 1]) h.add(P(rock(0.055), glow('#FF2A2A', 1), s * 0.14, 0.275, hf + 0.03));
    }
    if (lv >= 4) { // shoulder cannon + big gold epaulettes + flame plume
      g.add(P(cyl(0.15, 0.18, 0.8, 7), '#17171A', -0.52, 0.9, 0.1, [Math.PI / 2 - 0.12, 0, 0]));
      g.add(P(cyl(0.2, 0.2, 0.1, 7), '#F4C430', -0.52, 0.95, 0.47, [Math.PI / 2 - 0.12, 0, 0]));
      g.add(P(box(0.2, 0.2, 0.2), '#4A2E1A', -0.5, 0.74, 0));
      for (const s of [-1, 1]) g.add(P(box(0.32, 0.12, 0.44), '#F4C430', s * 0.4, 0.68, 0));
      h.add(P(cone(0.14, 0.5, 5), glow('#FF8C1A', 1), 0, hh + 0.86, 0.1));
    }
    pip(g, lv, lv >= 4 ? 2.5 : 2.25);
  },
  grump(g, lv) {
    const h = g.getObjectByName('head'), hh = 0.56;
    if (lv >= 2) { // ice ball in hand + frosty fists
      const R = g.getObjectByName('armR'), L = g.getObjectByName('armL');
      R.add(P(rock(0.2, 1), glow('#8FDCFF', 0.6), 0.02, -0.62, 0.24));
      R.add(P(box(0.32, 0.12, 0.38), '#8FDCFF', 0, -0.4, 0));
      L.add(P(box(0.32, 0.12, 0.38), '#8FDCFF', 0, -0.4, 0));
    }
    if (lv >= 3) { // loot sack slung over the hump
      g.add(P(rock(0.46, 1), '#8A5A2B', -0.44, 0.62, -0.56, null, [1, 1.15, 0.9]));
      g.add(P(box(0.3, 0.26, 0.3), '#E63946', -0.5, 1.2, -0.52, [0.3, 0.5, 0.2]));
      g.add(P(box(0.22, 0.2, 0.22), '#3E7CB1', -0.28, 1.16, -0.66, [0.1, 0.2, -0.3]));
    }
    if (lv >= 4) { // stolen hat
      g.getObjectByName('tuft').visible = false;
      h.add(P(cyl(0.44, 0.48, 0.15, 6), '#F7F4EC', 0, hh + 0.05, -0.02, [0.1, 0, 0]));
      h.add(P(cyl(0.2, 0.4, 0.34, 5), '#D62828', 0, hh + 0.28, -0.04, [0.1, 0, 0]));
      h.add(P(cone(0.2, 0.5, 5), '#C22020', -0.2, hh + 0.52, -0.06, [0, 0, 1.0]));
      h.add(P(rock(0.13), '#FFFFFF', -0.47, hh + 0.6, -0.06));
    }
    pip(g, lv, lv >= 4 ? 2.25 : 1.85);
  },
  jack_frost(g, lv) {
    const h = g.getObjectByName('head'), hh = 0.58, F = FROST;
    const HOT = glow(F.glow, 0.8), ICE = tone(F.ice), SNOW = tone(F.fur);
    const both = (fn) => [-1, 1].flatMap(fn);
    if (lv >= 2) { // Cold Snap: frost crystals on the shoulders + bigger glowing hair spikes
      if (lv < 4) { // (at level 4 these grow into the wings)
        g.add(fuse(both((s) => [shard(0.13, 0.42, HOT, s * 0.44, 0.62, -0.04, -0.15, -s * 1.05)]), HOT));
        g.add(fuse(both((s) => [shard(0.09, 0.3, ICE, s * 0.42, 0.62, 0.16, 0.5, -s * 1.0), shard(0.09, 0.3, ICE, s * 0.4, 0.64, -0.24, -0.7, -s * 0.7)]), ICE));
      }
      h.add(fuse([shard(0.23, 0.95, HOT, 0, hh, 0, -0.55, 0), ...both((s) => [shard(0.18, 0.66, HOT, s * 0.25, hh, -0.02, -0.6, -s * 0.5)])], HOT));
    }
    if (lv >= 3) { // Blizzard: ice crown + a ring of ice shards circling him
      h.getObjectByName('fringe').visible = false;
      h.add(P(chunk(0.74, 0.09, 0.12, 111), '#DDF6FF', 0, hh + 0.08, 0.3));
      const BRIGHT = glow('#BFF3FF', 0.9);
      h.add(fuse([-2, -1, 0, 1, 2].map((i) => shard(0.075, i === 0 ? 0.36 : 0.25, BRIGHT, i * 0.16, hh + 0.1, 0.3, 0.15, -i * 0.12)), BRIGHT));
      const ring = new THREE.Group();
      ring.name = 'spin';
      const octa = new THREE.OctahedronGeometry(0.11);
      const flake = (i) => { const a = (i / 10) * Math.PI * 2; return part(octa, SNOW, Math.sin(a) * 0.84, i % 2 ? 0.1 : -0.1, Math.cos(a) * 0.84, [0.3, a, 0.4], [0.6, 1.8, 0.6]); };
      ring.add(fuse([0, 2, 4, 6, 8].map(flake), SNOW), fuse([1, 3, 5, 7, 9].map(flake), HOT));
      ring.position.y = 0.95;
      g.add(ring);
    }
    if (lv >= 4) { // Polar Vortex: spinning vortex halo at his feet + ice-shard wings
      const vortex = new THREE.Group();
      vortex.name = 'spin';
      const band = (r, t, y, tilt) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 4, 12), HOT); m.rotation.set(Math.PI / 2 + tilt, 0, 0); m.position.y = y; return m; };
      vortex.add(band(0.82, 0.05, 0, 0), band(0.62, 0.035, 0.16, 0.12));
      vortex.add(fuse([0, 1, 2, 3].map((i) => { // swooshes so the spin is visible
        const a = (i / 4) * Math.PI * 2;
        return part(cone(0.08, 0.5, 4), SNOW, Math.sin(a) * 0.82, 0.06, Math.cos(a) * 0.82, [Math.PI / 2, 0, -a - Math.PI / 2 + 0.2], [1, 1, 0.5]);
      }), SNOW));
      vortex.position.y = 0.12;
      g.add(vortex);
      const wing = (s, k) => shard(0.2, 0.92 - k * 0.16, ICE, s * 0.22, 0.6, -0.36, -0.5, -s * (0.5 + k * 0.4), 0.35);
      g.add(fuse(both((s) => [wing(s, 0), wing(s, 2)]), ICE), fuse(both((s) => [wing(s, 1)]), HOT));
    }
    pip(g, lv, 2.3);
  },
  snowman(g, lv) {
    const h = g.getObjectByName('head'), ball = g.getObjectByName('ball'), hh = 0.56, hf = 0.33;
    const ICE = tone('#A8E4F7'), HOT = glow('#8FDCFF', 0.7), SNOWM = tone(SNOW.ball);
    const k = [1, 1.25, 1.35, 1.5][lv - 1]; // the ball grows every level but keeps touching the ground and his mittens
    ball.scale.setScalar(k);
    ball.position.set(0, 0.4 * k, 0.35 + 0.4 * k);
    if (lv >= 2) { // Packed Snow: bigger ball, chunkier base, earmuffs
      g.add(P(chunk(1.18, 0.3, 1.06, 131), SNOW.lump, 0, 0.15, 0));
      h.add(fuse([-1, 1].map((s) => part(chunk(0.14, 0.3, 0.3, 132), tone('#3E7CB1'), s * 0.4, 0.3, 0)), tone('#3E7CB1')));
      h.add(P(box(0.84, 0.07, 0.07), '#27467A', 0, 0.36, -0.34));
    }
    if (lv >= 3) { // Ice Core: faceted glowing ice ball, ice shards on the shoulders, icicle brows
      ball.geometry = rock(0.4, 0);
      ball.material = HOT;
      g.add(fuse([-1, 1].flatMap((s) => [shard(0.11, 0.4, ICE, s * 0.36, 0.9, -0.04, -0.2, -s * 1.0), shard(0.08, 0.26, ICE, s * 0.36, 0.9, -0.22, -0.7, -s * 0.6)]), ICE));
      g.add(fuse([-1, 1].map((s) => shard(0.08, 0.28, HOT, s * 0.36, 0.9, 0.12, 0.3, -s * 1.2)), HOT));
      h.getObjectByName('brows').visible = false;
      h.add(fuse([-1, 1].flatMap((s) => [
        part(chunk(0.3, 0.085, 0.11, 133), ICE, s * 0.19, 0.5, hf + 0.03, [0, 0, s * 0.42]),
        part(cone(0.035, 0.16, 4), ICE, s * 0.31, 0.47, hf + 0.05, [Math.PI, 0, 0]),
        part(cone(0.03, 0.11, 4), ICE, s * 0.24, 0.46, hf + 0.06, [Math.PI, 0, 0]),
      ]), ICE));
    }
    if (lv >= 4) { // Avalanche: enormous ball, ice crown instead of the bucket, snowballs orbiting his head
      h.getObjectByName('hat').visible = false;
      h.add(P(cyl(0.33, 0.36, 0.1, 6), '#DDF6FF', 0, hh + 0.04, 0));
      h.add(fuse([0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return shard(0.09, i % 2 ? 0.3 : 0.44, HOT, Math.sin(a) * 0.27, hh + 0.06, Math.cos(a) * 0.27, Math.cos(a) * 0.3, -Math.sin(a) * 0.3); }), HOT));
      const orbit = new THREE.Group();
      orbit.name = 'spin';
      orbit.add(fuse([0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return part(rock(i % 2 ? 0.09 : 0.12), SNOWM, Math.sin(a) * 0.74, i % 2 ? 0.06 : -0.06, Math.cos(a) * 0.74, [a, a * 2, 0]); }), SNOWM));
      orbit.position.y = 1.46;
      g.add(orbit);
    }
    pip(g, lv, lv >= 4 ? 2.35 : 2.2);
  },
};
/** Character-style tower (or the grump) at a given upgrade level, 1..4. */
export function spawnTower(name, level = 1) {
  const m = spawnModel(name);
  if (level > 1) ADDONS[name]?.(m, level);
  return m;
}

const BUILDERS = { santa, mrs_claus: mrsClaus, elf, reindeer: () => reindeer(false), evil_reindeer: () => reindeer(true), toy_soldier: toySoldier, coal_chucker: coalChucker, grump, jack_frost: jackFrost, snowman };
const cache = {};
/** Returns a fresh instance (shared geometry + materials) of a named character. */
export function spawnModel(name) {
  if (!cache[name]) cache[name] = BUILDERS[name]();
  const inst = cache[name].clone();
  inst.userData.height = cache[name].userData.height;
  return inst;
}
export const MODEL_NAMES = Object.keys(BUILDERS);
