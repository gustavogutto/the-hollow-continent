# PLAN.md — Echoes of the Old Continent (Prototype)

## Vision
Dark fantasy tactical turn-based Souls-like in browser. Dofus-style page-based world + AP/MP grid combat, Souls death/bonfire/souls-loss loop. Tutorial zone "The Ashen Incarnation" (5×5 world pages), 20 mob types (lvl 1–20), Crypt dungeon (4 rooms + Kardorim boss), NPCs Elara (Soul Keeper, level-up) and Gromm (bald Blacksmith, weapon upgrades).

## Technical approach
- Babylon.js NOT needed for this design — a 2D isometric tactical game is far better served by a custom canvas 2D renderer (deterministic isometric diamond grid, sprite draw ordering, tweening). DECISION: use HTML5 Canvas 2D with plain TS game classes under `client/src/game/`, React only as frame (HUD overlays in React reading from a game store via events). This keeps full control of the tactical grid and avoids 3D overhead.
- World: 5×5 pages, each page a 15×15 isometric cell grid. Exploration mode: click-to-move / WASD; edge transitions between pages. Combat mode: turn-based on the same grid.
- Persistence: localStorage save (level, souls, gear, discovered bonfires, boss kills).

## Risk slices (build first)
1. **R1 Isometric grid renderer** — draw diamond grid, place sprites with depth sort, hover/selection highlight, click→cell mapping. Verify: screenshot shows grid + player sprite + highlighted path.
2. **R2 Combat engine core** — turn order, AP/MP spend, move + attack, enemy AI (approach + attack), damage, death. Verify: scripted demo combat plays via ?demo.
3. **R3 Page transition + world map** — moving to edge loads adjacent page, world map overlay (M) with bonfire teleports. Verify: screenshots of two pages + map overlay.

## Main build tasks
- T1 Data: mobs.ts (20 types + stats + spells), pages.ts (25-page world layout + dungeon rooms), items.ts (weapons/armor/flasks/materials), spells.ts (player abilities).
- T2 Exploration mode: player movement, mob groups roaming on pages, engaging combat on contact, chests (F to open), bonfires (F to rest: heal+flasks+respawn+levelup menu+teleport).
- T3 Combat mode: placement phase, player turn UI (spell bar, AP/MP), enemy turns, backstab bonus, pushback collision damage, stagger/execution, souls reward, death → drop souls at spot, respawn at bonfire, recover souls pickup.
- T4 NPC dialogues: Elara (level up with souls: Vitality/Strength/Intelligence/Agility), Gromm (upgrade weapon +1..+5 with souls + materials), letterboxed dialogue UI.
- T5 Dungeon: Crypt entrance page → 5 sequential room pages, no rest between rooms, Kardorim 2-phase boss (3x3 cleave telegraphs, phase 2 fire tiles + Ash Spirit adds, backstab stagger), boss bar, victory → Ashen Crown + end screen.
- T6 UI/UX: HUD (HP orb, flasks, AP/MP, souls counter), inventory+equipment combined tab (C), world map (M), death "YOU DIED" screen, zone/boss title cards, main menu with new/continue.
- T7 Polish: SFX-free but screen shake, damage numbers, ember particles, save/load, ?demo autopilot.

## Verification criteria
- Screenshot: hub page with bonfire + NPCs visible, HUD present.
- Screenshot: combat with grid highlights, turn order, AP/MP bar.
- Screenshot: world map overlay; inventory panel; boss room with boss bar.
- pnpm check passes; no console errors in logs.

## Keybinds (user preference)
WASD move, E heal flask, F interact/chest, C inventory, M map, Esc back. Combat: 1-6 spell slots, Space end turn.
