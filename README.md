# Coal for Christmas

Three.js tower-defense prototype. You play the Grump: Santa, Mrs. Claus, elves and reindeer haul
presents along a path, and you smash the gifts before 100 of them get delivered.

```bash
npm install
npm run dev
```

## How it plays
- Pick a gadget (click a card or press 1–5), click a tile to place it. Right-click a gadget to sell it (60% back).
- Click anywhere with nothing selected to lob a snowball (1.2s cooldown).
- Break a gift and its carrier runs off; break it with coal and they run off covered in soot.
- Lose when 100 presents are delivered. Clear every wave to win the level.

| Gadget | Goes | Does |
| --- | --- | --- |
| Coal Chucker | on the path | Blocks the path until it gets shoved over, lobs splash coal |
| Conveyor | on the path | Drags carriers the wrong way (heavy slow) |
| Spikes | on the path | Damages gifts passing over |
| Evil Reindeer | beside the path | Rapid spit, slows |
| Toy Soldier | beside the path | Long-range popgun |

Levels: The Warehouse (snow), Sleigh Lanes (clouds, build only on cloud tops), Tinsel Street (houses).

## Code
- `src/kit.js` – shared model helpers (body, legs, painted faces)
- `src/models.js` – characters and gifts
- `src/scenery.js` – level themes, props, conveyor/spikes
- `src/main.js` – game loop, waves, towers, UI. Enemy/tower/level numbers are the tables at the top.

Dev console: `__dbg.lineup()` shows every model, `__dbg.load(n)` jumps to a level.
