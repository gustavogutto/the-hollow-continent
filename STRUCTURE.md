# STRUCTURE.md — Architecture

## Decision
Canvas 2D isometric renderer (NOT Babylon 3D). Turn-based tactical game = deterministic drawing, depth-sorted sprites. Plain TS game classes, React as frame for HUD/menus/dialogues (reads game state via a tiny event emitter store).

## Layout
```
client/src/game/
  types.ts        — shared types (Vec2, Unit, Page, CombatState, Item, ...)
  data/
    mobs.ts       — 20 mob defs + boss + grave warden + ash spirit
    spells.ts     — player abilities (6 slots) + mob abilities
    items.ts      — weapons, armor, flasks, materials, key items
    world.ts      — 5x5 page grid defs + dungeon rooms + props + spawns
  core/
    events.ts     — tiny emitter (game → React HUD)
    save.ts       — localStorage save/load
    rng.ts        — seeded helpers
  engine/
    iso.ts        — grid↔screen math, depth sort
    renderer.ts   — canvas draw: tiles, highlights, sprites, fx, damage numbers
    input.ts      — keyboard (WASD, E, F, C, M, Esc, 1-6, Space) + mouse picking
    assets.ts     — image loading, kit-sheet cell cropping
    fx.ts         — particles (embers), screen shake, tweens
  modes/
    explore.ts    — free movement, page transitions, mob roam/aggro, interactions
    combat.ts     — turn engine: initiative, AP/MP, pathing, AI, damage, stagger, souls
  Game.ts         — root orchestrator: mode switching, save, death loop
client/src/components/
  GameCanvas.tsx  — canvas mount + Game lifecycle
  hud/*.tsx       — HPOrb, ActionBar, SoulsCounter, TurnBanner, BossBar
  overlays/*.tsx  — MainMenu, Death, Dialogue, Inventory, WorldMap, LevelUp, Smith, ZoneTitle, Victory
client/src/pages/Home.tsx — full-screen game shell
```

## Combat rules
- Grid 15x15 per page. Initiative order. Player: 6 AP, 3 MP base.
- Move = 1 MP per tile (BFS path, no diagonals). Attack costs AP per spell.
- Backstab: attacking a unit from the tile behind its facing = +50% dmg.
- Pushback: some abilities push 1-2 tiles; colliding with obstacle/unit = bonus dmg.
- Stagger: each hit adds posture dmg; at threshold, unit is STAGGERED 1 turn; attacks vs staggered = crit (execution visual).
- Death: player drops souls at death tile (persisted), respawns at last bonfire, mobs respawn. Walk onto soul spot to recover; dying again loses them.
- Bonfire rest: full heal, flasks refilled, mobs respawn, opens Level Up / Travel menu.

## Mode flow
MainMenu → Explore(page) ↔ Combat(same page grid) → Explore
Explore: touch mob group → Combat placement → fight → victory (souls+loot) or death.
Dungeon pages are linear; victory in room 5 → Victory overlay.
