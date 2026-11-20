# Coal for Christmas

Three.js tower-defense prototype. You play the Grump: Santa, Mrs. Claus, elves and reindeer haul
presents along a path, and you smash the gifts before 100 of them get delivered.

```bash
npm install
npm run dev
```

## How it plays
- No menu: an animated intro shows Santa stocking his warehouse and the Grump deciding to leave him short, then the game starts.
  Levels run in order (The Warehouse, Sleigh Lanes, Tinsel Street) and progress is remembered.
- Pick a **hero** and place them: the Grump (**G**, auto snowballs, ult: Present Heist) or Jack Frost (**J**, icy gusts that blow carriers back, ult: Deep Freeze).
  Only one hero can be out at a time; send one home from their panel to bring out the other. The ult is the round icon in the corner (**Q**).
- Pick a gadget (card or **1–6**) and click. There is no visible grid, but everything snaps: gadgets to tiles, traps to spots along the winding path.
- The frozen lake on level 1 only holds ice folk: Jack Frost and the Snowman.
- Click any gadget to open its panel: current stats and every improvement, expandable. **U** upgrades, **X** sells (60% back).
- The round button (or **Space**) starts the next wave and pauses/resumes it.
- Health is counted in hits: reindeer 2, elves 3, Mrs. Claus 8, Santa 60–100. Reindeer are the fastest.
- Level 2 is in the air: the crew flies planes and a flying boat, your gadgets ride balloon gondolas, and Santa comes down his own sled lane.
- Between waves Santa frets by the goal (running laps or stress-eating cookies), and each level win gets a short scene of the same.
- Lose when 100 presents are delivered (death screen, **R** to retry).

| Gadget | Goes | Base | Upgrades |
| --- | --- | --- | --- |
| Coal Chucker | beside the path | Lobs coal piles onto nearby path spots | Hot Coals (burn) → Coal Cart (faster, bigger) → Meltdown (spent piles explode) |
| Conveyor | on the path | Drags carriers the wrong way | Greased Rollers → Reverse Gear (flings them back) → Gift Shredder (grinds gifts) |
| Spikes | on the path | Stabs anything on the spot | Sharpened → Icicles (freeze) → Gift Grinder (double hits, wider, torn wrapping) |
| Evil Reindeer | beside the path | Sticky spit that slows | Sticky Spit → Triple Spit → Acid Rain (splash + corrosion) |
| Evil Toy Soldier | anywhere buildable | Sniper: unlimited range, but only what it can see | Piercing Shots → Double Barrel → Cannon Captain (explosive) |
| Snowman | beside the path or on the lake | Bowls a giant snowball down a straight lane; it shrinks and hits softer the further it rolls | Packed Snow → Ice Core (stun) → Avalanche (bursts at the end) |

Every upgrade changes how the gadget looks. Heroes have three upgrades too.

## Look
Cel shaded: every lit material is a banded toon material (`toon()` in `src/kit.js`) and the scene is drawn with ink outlines (`OutlineEffect`).

## Code
- `src/kit.js` – shared model helpers (toon materials, painted blocks, figures, faces)
- `src/models.js` – characters, gifts, per-level upgrade parts
- `src/path.js` – winding paths (smooth curves, distance lookups, snap spots)
- `src/scenery.js` – level themes: ground and path texture, frozen lake, instanced forest, mountains, houses, clouds, conveyor/spikes/coal piles
- `src/props.js` – sky aircraft, balloon gondola, cookie plate
- `src/main.js` – game loop, waves, gadgets, heroes, cutscenes, UI. All numbers are the tables at the top.
- `dev/bot.js` – balance bot: `const { suite } = await import('/dev/bot.js'); suite()` in the browser console
- `models.html` – model viewer (`?set=base|side|back|upgrades|hero|frost|snowman|props`)

Dev console: `__dbg.load(n)` jumps to a level, `__dbg.intro()` replays the intro; `__game` is the live state.
