# Coal for Christmas

Three.js tower-defense prototype. You play the Grump: Santa, Mrs. Claus, elves and reindeer haul
presents along a path, and you smash the gifts before 100 of them get delivered.

```bash
npm install
npm run dev
```

## How it plays
- Pick a gadget (click a card or press 1–5) and click a tile to place it.
- Click any placed gadget, or the Grump himself, to open its panel: **U** upgrades, **X** sells (60% back).
- The Grump throws snowballs on his own. His ult, **Present Heist (Q)**, charges as you smash gifts: it steals
  every present on the board, raids Santa's sack for 35% of its health, and takes 5 presents back from the delivered pile.
- Break a gift and its carrier runs off; break it with coal and they run off covered in soot.
- Lose when 100 presents are delivered (death screen, **R** to retry). Clear every wave to win the level.

| Gadget | Goes | Base | Upgrades |
| --- | --- | --- | --- |
| Coal Chucker | beside the path | Lobs coal piles onto nearby path tiles; piles hurt whoever walks over them | Hot Coals (burn) → Coal Cart (faster, bigger) → Meltdown (spent piles explode) |
| Conveyor | on the path | Drags carriers the wrong way | Greased Rollers → Reverse Gear (flings them back) → Gift Shredder (grinds gifts) |
| Spikes | on the path | Fast stabs at anything on the tile | Sharpened → Icicles (freeze) → Gift Grinder (wider, +30% damage taken) |
| Evil Reindeer | beside the path | Rapid spit that slows | Sticky Spit → Triple Spit → Acid Rain (splash + corrosion) |
| Evil Toy Soldier | beside the path | Long-range popgun | Bayonet Drill → Double Barrel → Cannon Captain (explosive) |
| The Grump | fixed perch | Auto snowballs | Ice Balls (chill) → Double Throw → Avalanche (giant, faster heist) |

Every upgrade changes how the gadget looks.

Levels: The Warehouse (snow), Sleigh Lanes (clouds, build only on cloud tops), Tinsel Street (houses).

## Code
- `src/kit.js` – shared model helpers (painted blocks, legs, faces)
- `src/models.js` – characters, gifts, per-level upgrade parts
- `src/scenery.js` – level themes, props, conveyor/spikes/coal piles
- `src/main.js` – game loop, waves, gadgets, upgrades, UI. All numbers are the tables at the top.
- `models.html` – model viewer (`?set=base|side|back|upgrades|hero`)

Dev console: `__dbg.load(n)` jumps to a level; `__game` is the live state.
