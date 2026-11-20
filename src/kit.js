// Shared helpers for building characters: body, legs, accessories, painted faces.
import * as THREE from 'three';

const TEX = 128;

// ---------- cel shading ----------
// Every lit material goes through toon(): lighting snaps to a few flat bands.
const BANDS = new Uint8Array([120, 120, 190, 190, 255, 255]);
const gradientMap = new THREE.DataTexture(BANDS, BANDS.length, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;
export function toon({ flatShading, ...params } = {}) {
  const m = new THREE.MeshToonMaterial({ gradientMap, ...params });
  // Not a declared MeshToonMaterial option, but the shader honours it: gives the faceted low-poly look.
  if (flatShading) m.flatShading = true;
  return m;
}

export function shade(hex, amt) {
  // amt > 0 lightens, amt < 0 darkens (and saturates slightly, never grey)
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  hsl.l = THREE.MathUtils.clamp(hsl.l + amt, 0, 1);
  if (amt < 0) hsl.s = THREE.MathUtils.clamp(hsl.s + 0.08, 0, 1);
  c.setHSL(hsl.h, hsl.s, hsl.l);
  return '#' + c.getHexString();
}

function makeCanvas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = TEX;
  return cv;
}

// Painted-sun gradient + pillow bevel rim: the two passes that sell the style.
function paintBase(ctx, color, face) {
  const g = ctx.createLinearGradient(0, 0, 0, TEX);
  if (face === 'top') {
    g.addColorStop(0, shade(color, 0.1));
    g.addColorStop(1, shade(color, 0.05));
  } else if (face === 'bottom') {
    g.addColorStop(0, shade(color, -0.2));
    g.addColorStop(1, shade(color, -0.2));
  } else {
    g.addColorStop(0, shade(color, 0.06));
    g.addColorStop(0.55, color);
    g.addColorStop(1, shade(color, -0.13));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX, TEX);
}

function paintRim(ctx) {
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.strokeRect(2.5, 2.5, TEX - 5, TEX - 5);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.strokeRect(1, 1, TEX - 2, TEX - 2);
}

function texFrom(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  return t;
}

const hash = (x, y, z, seed) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453;
  return s - Math.floor(s);
};

// A slightly wonky cube: 2x2 grid per side, corners pulled in, centres bulged, back smaller.
export function wonkyBox(W, H, D, { taper = 0.92, seed = 1, wonk = 0.025, bulge = 0.06, pinch = 0.07 } = {}) {
  const geo = new THREE.BoxGeometry(W, H, D, 2, 2, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.round((pos.getX(i) / (W / 2)) * 1) / 1;
    const ny = Math.round(pos.getY(i) / (H / 2));
    const nz = Math.round(pos.getZ(i) / (D / 2));
    const ext = Math.abs(nx) + Math.abs(ny) + Math.abs(nz);
    let s = 1;
    if (ext === 3) s = 1 - pinch; // corner
    else if (ext === 1) s = 1 + bulge; // face centre
    let x = nx * (W / 2) * s;
    let y = ny * (H / 2) * s;
    let z = nz * (D / 2) * s;
    const t = THREE.MathUtils.lerp(taper, 1, (nz + 1) / 2); // back (-z) smaller
    x *= t;
    y = y * t - (1 - t) * (H / 2) * 0.5;
    x += (hash(nx, ny, nz, seed) - 0.5) * wonk * W;
    y += (hash(nx, ny, nz, seed + 3) - 0.5) * wonk * H;
    z += (hash(nx, ny, nz, seed + 7) - 0.5) * wonk * D;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

const FACES = ['right', 'left', 'top', 'bottom', 'front', 'back']; // BoxGeometry group order

export function flat(color, opts = {}) {
  return toon({ color, flatShading: true, ...opts });
}

/**
 * spec = {
 *   size: [W, H, D], color, seed, taper,
 *   legs: { color, size, h, spread:[x,z] } | false,
 *   paint: { all(ctx,face), sides(ctx,face), front(ctx), back(ctx), top(ctx), left(ctx), right(ctx) }
 *   colors: { top, front, ... } optional per-face base colour override
 *   build(group, body, helpers) -> add accessories
 * }
 */
export function paintedBox(size, color, paint = {}, { taper = 0.92, seed = 1, colors } = {}) {
  const [W, H, D] = size;
  const mats = FACES.map((face) => {
    const cv = makeCanvas();
    const ctx = cv.getContext('2d');
    paintBase(ctx, colors?.[face] ?? color, face);
    const side = face !== 'top' && face !== 'bottom';
    ctx.save();
    ctx.scale(TEX, TEX); // painters work in 0..1, y down
    paint.all?.(ctx, face);
    if (side) paint.sides?.(ctx, face);
    paint[face]?.(ctx, face);
    ctx.restore();
    paintRim(ctx);
    return toon({ map: texFrom(cv), flatShading: true });
  });
  const m = new THREE.Mesh(wonkyBox(W, H, D, { taper, seed }), mats);
  m.castShadow = true;
  return m;
}

export function buildCharacter(spec) {
  const [W, H, D] = spec.size;
  const legH = spec.legs === false ? 0 : (spec.legs?.h ?? 0.2);
  const group = new THREE.Group();

  const body = paintedBox(spec.size, spec.color, spec.paint || {}, { taper: spec.taper ?? 0.92, seed: spec.seed ?? 1, colors: spec.colors });
  body.position.y = legH + H / 2;
  body.name = 'body';
  group.add(body);

  if (spec.legs !== false) {
    const L = spec.legs || {};
    const ls = L.size ?? W * 0.26;
    const [sx, sz] = L.spread ?? [0.28, 0.27];
    const legGeo = wonkyBox(ls, legH + 0.12, ls, { taper: 1, bulge: 0.03, pinch: 0.1, seed: 5 });
    const legMat = flat(L.color ?? shade(spec.color, -0.18));
    for (const [ix, iz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(ix * W * sx, (legH + 0.12) / 2, iz * D * sz);
      leg.castShadow = true;
      leg.name = 'leg';
      group.add(leg);
    }
  }

  const top = legH + H;
  const mid = legH + H / 2;
  spec.build?.(group, { W, H, D, top, mid, legH });
  group.userData.height = spec.height ?? top;
  return group;
}

const toneCache = {};
/** Cached flat material: every part of the same colour shares one material. */
export function tone(color) {
  return (toneCache[color] ||= flat(color));
}

/** Chunky accessory block: a wonky box without the back taper (brows, muzzles, belts, cuffs...). */
export const chunk = (w, h, d, seed = 1, taper = 1) => wonkyBox(w, h, d, { taper, seed, wonk: 0.03, bulge: 0.05, pinch: 0.08 });

/**
 * Runs `fn` with x squashed around the centre so circles painted on a w×h face stay round.
 * Inside fn: y is still 0..1 (top→bottom), x = 0.5 is the centre, and one x unit == one y unit == h.
 */
export function squareFace(ctx, w, h, fn) {
  ctx.save();
  ctx.translate(0.5, 0);
  ctx.scale(h / w, 1);
  ctx.translate(-0.5, 0);
  fn(ctx);
  ctx.restore();
}

/**
 * Two-block chibi figure: torso + separate head group (pivot at the neck) + feet with toe boxes.
 * spec = {
 *   torso: { size:[W,H,D], color, paint, seed, taper, colors, z, tilt },
 *   head:  { size:[w,h,d], color, paint, seed, taper, colors, z, sink },   // sink = overlap into the torso
 *   feet:  { size:[w,h,d], color, at:[[x,z],...], toe:[w,h,d]|undefined, toeColor, lift },
 *   build(group, { head, skull, torso, feet, W,H,D, hw,hh,hd, hf, legH, top, neck, mid }),
 *   height,   // optional; defaults to the measured top of the finished model
 * }
 * Head features go in the `head` group in head-local coords: y up from the neck, z = hf is the face.
 * Every foot is a mesh named 'leg' (toe box is its child) so the game can bob position.y.
 */
export function buildFigure(spec) {
  const T = spec.torso, Hd = spec.head, F = spec.feet || {};
  const [W, H, D] = T.size;
  const [hw, hh, hd] = Hd.size;
  const [fw, fh, fd] = F.size ?? [W * 0.3, 0.26, D * 0.4];
  const legH = F.lift ?? Math.max(0.06, fh - 0.1);
  const group = new THREE.Group();

  const torso = paintedBox(T.size, T.color, T.paint || {}, { taper: T.taper ?? 0.94, seed: T.seed ?? 1, colors: T.colors });
  torso.position.set(0, legH + H / 2, T.z ?? 0);
  if (T.tilt) torso.rotation.x = T.tilt;
  torso.name = 'body';
  group.add(torso);

  const top = legH + H;
  const neck = top - (Hd.sink ?? 0.05);
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, neck, Hd.z ?? 0);
  const skull = paintedBox(Hd.size, Hd.color, Hd.paint || {}, { taper: Hd.taper ?? 0.94, seed: Hd.seed ?? 2, colors: Hd.colors });
  skull.position.y = hh / 2;
  skull.name = 'skull';
  head.add(skull);
  group.add(head);

  const footGeo = wonkyBox(fw, fh, fd, { taper: 1, bulge: 0.03, pinch: 0.1, seed: 5 });
  const footMat = tone(F.color ?? shade(T.color, -0.18));
  const toeGeo = F.toe ? wonkyBox(F.toe[0], F.toe[1], F.toe[2], { taper: 1, bulge: 0.04, pinch: 0.1, seed: 6 }) : null;
  const toeMat = toeGeo ? tone(F.toeColor ?? F.color ?? shade(T.color, -0.18)) : null;
  const feet = [];
  for (const [x, z] of F.at ?? [[-W * 0.25, 0], [W * 0.25, 0]]) {
    const leg = new THREE.Mesh(footGeo, footMat);
    leg.position.set(x, fh / 2, z);
    leg.castShadow = true;
    leg.name = 'leg';
    if (toeGeo) {
      const toe = new THREE.Mesh(toeGeo, toeMat);
      toe.position.set(0, -fh / 2 + F.toe[1] / 2, fd / 2 + F.toe[2] / 2 - 0.05);
      toe.castShadow = true;
      leg.add(toe);
    }
    group.add(leg);
    feet.push(leg);
  }

  spec.build?.(group, { head, skull, torso, feet, W, H, D, hw, hh, hd, hf: hd / 2, legH, top, neck, mid: legH + H / 2 });
  // top of the whole model (hat tips, antlers...) unless the spec pins it
  group.userData.height = spec.height ?? Math.round(new THREE.Box3().setFromObject(group).max.y * 100) / 100;
  return group;
}

// ---------- chunky accessory helpers ----------
export function part(geo, color, x, y, z, rot, scale) {
  const m = new THREE.Mesh(geo, typeof color === 'object' && color.isMaterial ? color : flat(color));
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  return m;
}
export const cone = (r, h, sides = 5) => new THREE.ConeGeometry(r, h, sides);
export const cyl = (rt, rb, h, sides = 6) => new THREE.CylinderGeometry(rt, rb, h, sides);
export const rock = (r, detail = 0) => new THREE.IcosahedronGeometry(r, detail);
export const lump = (r) => new THREE.DodecahedronGeometry(r, 0);
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
/** Cylinder mesh running from point a to point b, both [x, y, z] (twigs, struts, masts, ropes). r2 = radius at b. */
export function stick(a, b, r, color, sides = 5, r2 = r) {
  const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]);
  const m = part(cyl(r2, r, A.distanceTo(B), sides), color, 0, 0, 0);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
  return m;
}
/** Bakes several parts (meshes with their own position/rotation/scale) into ONE mesh: one draw call. */
export function fuse(parts, material) {
  const pos = [];
  for (const m of parts) {
    m.updateMatrix();
    const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    for (const v of geo.attributes.position.array) pos.push(v);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}
const glowCache = {};
/** Self-lit flat material (embers, eyes, crystals). */
export function glow(color, intensity = 0.9) {
  return (glowCache[color + intensity] ||= toon({ color, emissive: color, emissiveIntensity: intensity, flatShading: true }));
}

// ---------- flat cartoon face helpers (canvas ctx scaled to 0..1) ----------
export function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
export function band(ctx, y0, y1, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, y0, 1, y1 - y0);
}
export function sawtooth(ctx, y, depth, n, fill, down = true) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let i = 0; i < n; i++) {
    ctx.lineTo((i + 0.5) / n, y + (down ? depth : -depth));
    ctx.lineTo((i + 1) / n, y);
  }
  ctx.lineTo(1, down ? 0 : 1);
  ctx.lineTo(0, down ? 0 : 1);
  ctx.closePath();
  ctx.fill();
}
/** Big wide-set eyes: white sclera, coloured iris, pupil, shine. opts: lid (0..1), brow (angle), browColor */
export function eyes(ctx, { y = 0.48, dx = 0.2, r = 0.085, iris = '#3A2A20', sclera = '#fff', lid = 0, brow = null, browColor = '#2B2B2B', lidColor = '#000', pupil = '#141414' } = {}) {
  for (const s of [-1, 1]) {
    const x = 0.5 + s * dx;
    circle(ctx, x, y, r, sclera);
    circle(ctx, x + s * -0.008, y + 0.008, r * 0.68, iris);
    circle(ctx, x + s * -0.008, y + 0.008, r * 0.38, pupil);
    circle(ctx, x - 0.028, y - 0.03, r * 0.24, '#fff');
    if (lid > 0) {
      ctx.fillStyle = lidColor;
      ctx.beginPath();
      ctx.rect(x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2 * lid);
      ctx.save();
      ctx.clip();
      circle(ctx, x, y, r * 1.04, lidColor);
      ctx.restore();
    }
    if (brow !== null) {
      ctx.save();
      ctx.translate(x, y - r * 1.25);
      ctx.rotate(s * brow);
      ctx.fillStyle = browColor;
      ctx.fillRect(-r * 1.15, -0.02, r * 2.3, 0.04);
      ctx.restore();
    }
  }
}
export function dotEyes(ctx, { y = 0.42, dx = 0.17, r = 0.045, color = '#1B1B1E' } = {}) {
  for (const s of [-1, 1]) {
    circle(ctx, 0.5 + s * dx, y, r, color);
    circle(ctx, 0.5 + s * dx - 0.014, y - 0.016, r * 0.32, '#fff');
  }
}
export function cheeks(ctx, { y = 0.58, dx = 0.3, r = 0.06, color = 'rgba(242,120,120,0.75)' } = {}) {
  for (const s of [-1, 1]) circle(ctx, 0.5 + s * dx, y, r, color);
}
export function smile(ctx, { x = 0.5, y = 0.62, w = 0.09, color = '#2B2B2B', frown = false, lw = 0.022 } = {}) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (frown) ctx.arc(x, y + w * 0.9, w, Math.PI * 1.2, Math.PI * 1.8);
  else ctx.arc(x, y - w * 0.5, w, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}
