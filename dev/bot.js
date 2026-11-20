// Balance bot (dev only). In the browser console:
//   const { run } = await import('/dev/bot.js'); run(0, 'up')
// mode: 'none' | 'hero' | 'noup' (place only) | 'up' (place + upgrade). Returns a one-line summary.
export function run(level, mode = 'up', heroType = 'grump') {
  const D = window.__dbg, G = window.__game, T = D.defs.TOWERS;
  D.endCut(); D.load(level);
  const slots = G.slots.slice().sort((a, b) => a.path - b.path || a.d - b.d);
  const land = [];
  for (let x = 0; x < 16; x++) for (let z = 0; z < 10; z++) if (D.can('toy_soldier', x, z)) {
    let n = 0; for (const c of G.slots) if (Math.hypot(c.x - x - 0.5, c.z - z - 0.5) <= 2.5) n++;
    land.push({ x, z, n });
  }
  land.sort((a, b) => b.n - a.n);
  const placed = {}; let li = 0, pi = 5;
  const P = (id, type) => ['p', id, type], U = (id) => ['u', id];
  let plan = [P('hero', heroType), P('r1', 'evil_reindeer'), P('s1', 'toy_soldier'), P('k1', 'spikes'), P('c1', 'coal_chucker'), U('s1'), U('k1'), P('m1', 'snowman'), U('hero'), U('r1'), P('v1', 'conveyor'), U('c1'), U('k1'), U('s1'), U('hero'), U('m1'), U('r1'), U('c1'), U('v1'), P('s2', 'toy_soldier'), U('s1'), U('r1'), U('m1'), U('k1'), U('hero'), U('c1'), U('s2'), U('v1'), U('m1'), U('s2'), U('s2'), U('v1')];
  if (mode === 'noup') plan = plan.filter((a) => a[0] === 'p').concat([P('s3', 'toy_soldier'), P('r2', 'evil_reindeer'), P('c2', 'coal_chucker'), P('m2', 'snowman'), P('s4', 'toy_soldier'), P('r3', 'evil_reindeer'), P('k2', 'spikes'), P('s5', 'toy_soldier'), P('r4', 'evil_reindeer'), P('m3', 'snowman'), P('s6', 'toy_soldier'), P('c3', 'coal_chucker'), P('s7', 'toy_soldier'), P('r5', 'evil_reindeer')]);
  if (mode === 'none') plan = [];
  if (mode === 'hero') plan = [P('hero', heroType)];
  let ai = 0, guard = 0, ults = 0, peak = 0, maxE = 0;
  while (!G.over && guard++ < 150000) {
    while (ai < plan.length) {
      const a = plan[ai];
      if (a[0] === 'p') {
        const type = a[2], cost = T[type] ? T[type].cost : 0;
        if (G.coal < cost) break;
        let t;
        if (!T[type] || T[type].on === 'land') { const c = land[li++]; if (!c) { ai++; continue; } t = D.place(type, c.x, c.z); }
        else { const c = slots[Math.min(slots.length - 2, pi)]; pi += type === 'conveyor' ? 6 : 1; t = D.place(type, c.x - 0.5, c.z - 0.5); }
        placed[a[1]] = t; ai++;
      } else {
        const t = placed[a[1]];
        if (!t || t.level >= 4) { ai++; continue; }
        if (G.coal < t.def.levels[t.level].cost) break;
        D.upgrade(t); ai++;
      }
    }
    if (!G.waveActive) D.start();
    if (G.hero && G.ult >= 100 && G.enemies.filter((e) => e.state === 'walk' && e.g.position.x > 0).length >= 5) { D.ult(); ults++; }
    peak = Math.max(peak, G.delivered); maxE = Math.max(maxE, G.enemies.length);
    D.step(0.033, 1);
  }
  return `L${level + 1} ${mode} ${heroType}: wave ${G.wave}/${G.level.waves} ${G.lost ? 'LOST' : 'won'} delivered ${G.delivered} peak ${peak} ults ${ults} coal ${G.coal} maxEnemies ${maxE}`;
}
export function suite() {
  const out = [run(0, 'none'), run(0, 'hero'), run(0, 'noup'), run(0, 'up'), run(0, 'up', 'jack_frost'), run(1, 'noup'), run(1, 'up'), run(2, 'noup'), run(2, 'up')];
  try { localStorage.removeItem('coal-for-christmas-level'); } catch { /* ignore */ }
  return out;
}
