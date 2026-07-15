# The Hollow Continent — Art Bible & Asset Guide

**Author:** Manus AI · **Version:** 2.0 ("Pale Sepulchre" art set) · **Date:** July 2026

This document is the complete reference for every piece of artwork in *The Hollow Continent*. It is written as a hand-off guide: give it to any collaborator (human or AI, e.g. Claude) and they will know **what each asset is, where it lives on disk, where it is referenced in code, how it is rendered in-game, how it was generated, and how to regenerate or replace it** without breaking anything.

---

## 1. Visual Identity — "Pale Sepulchre"

The game's second art set replaces the warm "Ashen Gothic" look of *Echoes of the Old Continent* (charcoal greys, orange ember light) with a colder, more haunted direction. The lineage remains firmly Souls-like — Demon's Souls, Dark Souls 3, Bloodborne, Elden Ring concept art — painterly and grounded, never cartoonish or cel-shaded.

| Element | Specification |
|---|---|
| Primary palette | Bone-white, pale cracked marble, cold moonlit blue-grey, deep umber shadow |
| Accent (signature) | Sickly **cyan-teal soul-light** — replaces all orange ember glow from v1 |
| Secondary accent | Tarnished silver, verdigris (oxidized bronze-green) |
| Light model | Cold overhead moonlight, rim-lit silhouettes, phosphorescent cyan glows (eyes, wounds, braziers, bonfire) |
| Materials | Cracked marble, wet bone, rusted silver, rotting linen, black iron |
| Rendering style | Painterly oil-texture dark fantasy, muted desaturated colors, isometric game asset |

**Mood keyword block** — include verbatim in every generation prompt:

> "hollow, moonlit, sepulchral, cold soul-light, painterly dark fantasy, oil painting texture, in the style of Dark Souls and Elden Ring concept art, NOT cartoon, NOT cel-shaded, muted desaturated colors, isometric game asset"

**Character canon (must never change):**

- **Hero (Ember-Bearer):** pale bone-lacquered plate armor, cracked porcelain-like mask helm, ash-grey linen hood and tattered cape, longsword with cold cyan glow along the fuller. Silhouette must read at ~85 px tall on screen.
- **Elara, Soul Keeper:** blonde woman with Polish features, dark robes, carries a candle/soul-light.
- **Gromm, Blacksmith:** bald, heavy build, blacksmith apron, hammer.
- **Kardorim, the Hollow King:** final boss, regal hollowed monarch.

---

## 2. Master Asset Inventory

All 39 assets. **Key** is the property name in `client/src/game/engine/assets.ts` (`URLS` map) — that file is the single registry every renderer call goes through. Live URLs are `/manus-storage/hollow_*.png`; in the export kit they become `/assets/hollow_*.png`.

### 2.1 Hero (player character)

| Key | File | Size / layout | Used for |
|---|---|---|---|
| `player` | `hollow_player_94b59b65.png` | 1920×1920, single figure, transparent | Idle sprite in explore + combat. **This is the style anchor** — every other character asset was generated against it. |
| `walkSE` | `hollow_walk_se_3ef6953c.png` | 2688×1152, 6-frame horizontal strip (448×1152 cells) | Walk cycle facing south-east (D key) |
| `walkSW` | `hollow_walk_sw_1ab84a10.png` | 2688×1152, 6×1 strip | Walk south-west (S key) |
| `walkNE` | `hollow_walk_ne_d904e229.png` | 2688×1152, 6×1 strip | Walk north-east (W key) |
| `walkNW` | `hollow_walk_nw_9d27ca4f.png` | 2688×1152, 6×1 strip | Walk north-west (A key) |
| `knightAttackSE` | `hollow_attack_se_38f0bdc1.png` | 2688×1152, 6×1 strip | Sword swing facing SE (combat) |
| `knightAttackSW` | `hollow_attack_sw_ec052356.png` | 2688×1152, 6×1 strip | Sword swing facing SW |

Walk strips must contain a real stride cycle — contact, recoil, passing, high-point poses with clearly alternating legs. All frames are post-processed to identical content height and a common foot baseline (see §5), otherwise the character "pops" in size while walking.

### 2.2 NPCs and bosses

| Key | File | Size | Used for |
|---|---|---|---|
| `elara` | `hollow_elara_05ce412c.png` | 1920×1920 | Shrine NPC + dialogue portrait |
| `gromm` | `hollow_gromm_3c26a2d2.png` | 1920×1920 | Shrine blacksmith NPC + dialogue portrait |
| `kardorim` | `hollow_kardorim_e9bc405c.png` | 1920×1920 | Final boss (drawn at scale 1.6) |
| `warden` | `hollow_warden_d6d4b096.png` | 1920×1920 | Grave Warden boss (scale 1.35) |
| `drownedSentinel` | `hollow_sentinel_33786f0e.png` | 1536×2304 portrait | Zone-2 boss (scale 1.5) |
| `skeleton` | `hollow_skeleton_abf9379b.png` | 1920×1920 | Skeleton Novice tutorial mob |

### 2.3 Mob kits (3×3 grid sheets, 640 px cells)

Each kit is one 1920×1920 sheet holding nine mobs. The renderer crops cells at load time (`getSprite` with `grid: 3, cell: n`). **Cell order is contractual** — changing it re-skins the wrong mobs.

| Key | File | Cell order (0–8, row-major) |
|---|---|---|
| `beasts` | `hollow_kit_beasts_bcafc41d.png` | 0 hollow man, 1 plague rat, 2 corpse fly, 3 rotting hound, 4 cursed dandelion, 5 blighted toad, 6 corrupted boar, 7 tomb spider, 8 grave robber |
| `skels` | `hollow_kit_skels_e7ca2af2.png` | 0 archer, 1 pikeman, 2 shieldbearer, 3 assassin, 4 sergeant, 5 ash spirit, 6 wandering flame, 7 hollowed mage, 8 gargoyle |
| `sunkenMobs` | `hollow_kit_sunken_aade1197.png` | 0 drowned soldier, 1 brine wraith, 2 coral golem, 3 corpse fish, 4 sunken archer, 5 tide crab, 6 tide priest, 7 moray horror, 8 drowned ogre |

### 2.4 Mob & boss animation strips (1536×256, 6-frame strips, 256 px cells)

Mobs animate through **archetype** strips, not per-mob strips. `mobs.ts` assigns each mob a `walkKey` and optional `attackKey`; `assets.ts` maps archetypes to sheets. NE/NW directions fall back to SE/SW automatically.

| Key | File | Archetype covers |
|---|---|---|
| `kardorimWalkSE` / `kardorimWalkSW` | `hollow_kardorim_walk_se_0378fb2c.png` / `_sw_cf58650d.png` | Kardorim boss walk |
| `wardenWalkSE` / `wardenWalkSW` | `hollow_warden_walk_se_79c2452e.png` / `_sw_a9caee8c.png` | Grave Warden walk; also reused by Drowned Sentinel (armored giant) |
| `skelMeleeWalkSE` / `skelMeleeWalkSW` | `hollow_skel_melee_walk_se_0ed23ef5.png` / `_sw_2ae612ec.png` | All melee skeletons (novice, pikeman, shieldbearer, assassin, sergeant) |
| `skelArcherWalkSE` / `skelArcherWalkSW` | `hollow_skel_archer_walk_se_e1a596ec.png` / `_sw_1fef1f9c.png` | Ranged skeletons (archer, mage) |
| `beastWalkSE` / `beastWalkSW` | `hollow_beast_walk_se_43e20789.png` / `_sw_02722a66.png` | Rotting Hound (four-legged gait) |
| `skelAttackSE` | `hollow_skel_attack_se_a7070970.png` | Skeleton sword swing (SW mirrors SE) |
| `beastAttackSE` | `hollow_beast_attack_se_a1d6b299.png` | Beast lunge-bite (SW mirrors SE) |

**Movement coverage rules** (from the animation audit):

- Mobs whose body plan matches an archetype use its walk strip.
- Floating mobs (corpse fly, cursed dandelion, ash spirit, wandering flame, gargoyle, brine wraith, moray horror) use `walkKey: "hover"` — a bobbing float, no sheet needed.
- Small ground critters with unique body plans (plague rat, blighted toad, corrupted boar, tomb spider, corpse fish, tide crab) intentionally have **no** `walkKey` and slide-step with their own sprite. This is deliberate: sharing a humanoid or hound strip made toads visually morph into wolves (a real bug we fixed). Give them walk strips only by generating species-specific sheets.

### 2.5 Environment & UI

| Key | File | Size | Used for |
|---|---|---|---|
| `props` | `hollow_props_a24d92fe.png` | 1920×1920, 3×3 kit | Map decoration. Cell order: 0 pillar, 1 gravestone, 2 dead tree, 3 chest, 4 bone pile, 5 ruined arch, 6 brazier (cyan flame), 7 boulder, 8 broken cart |
| `bonfire` | `hollow_bonfire_efe4592d.png` | 1920×1920 | Checkpoint: sword-in-coals with cyan soul-flame |
| `icons` | `hollow_icons_0c869833.png` | 1920×1920, 4×4 kit (480 px cells) | HUD spell bar + inventory. Index: 0 slash, 1 heavy blow, 2 soul bolt, 3 burst, 4 spare, 5 shadow step, 6 flask, 7 pyre, 8 spare, 9 war cry, 10 quake/bone, 11 rend/shard, 12 armor, 13 helm, 14 ring, 15 key |
| `tileAsh` | `hollow_tile_ash_1c12ccd4.png` | 1920×1920 seamless | Zone-1 ground: pale ash/bone-dust cobbles (opaque) |
| `tileCrypt` | `hollow_tile_crypt_81e6aec5.png` | 1920×1920 | Crypt ground: dark marble slabs (opaque) |
| `tileSunken` | `hollow_tile_sunken_6f996750.png` | 1920×1920 | Zone-2 ground: wet kelp-slick stone (opaque) |
| `menuBg` | `hollow_menu_bg_b494cbb4.png` | 1920×1080 | Title screen vista (opaque) |
| `bossBg` | `hollow_boss_bg_39adf290.png` | 1920×1080 | Boss victory/defeat overlay (opaque) |
| `sunkenBg` | `hollow_sunken_bg_fd8473eb.png` | 2560×1440 | Zone-2 ambience backdrop (opaque) |

---

## 3. Where Each Asset Is Wired in Code

The code touchpoints form a small, closed set. If you replace art, these are the only files you ever need to edit.

| File | Role |
|---|---|
| `client/src/game/engine/assets.ts` | **The registry.** `URLS` map (all 39 URLs), strip slicers (`getWalkFrame`, `getMobWalkFrame`, `getAttackFrame`), kit croppers (`getSprite`, `getIcon`, `iconDataUrl`). Replace an asset = change one URL here. |
| `client/src/game/data/mobs.ts` | Mob definitions. Each `MobDef` carries a `sprite` (`{ url, grid, cell }`), optional `walkKey` (`"kardorim" \| "warden" \| "skel_melee" \| "skel_archer" \| "beast" \| "hover"`), and optional `attackKey` (`"knight" \| "skel" \| "beast"`). Has its own kit-URL constants at the top — keep them in sync with `assets.ts`. |
| `client/src/game/engine/renderer.ts` | Draws everything. Player draw scale, walk/attack frame selection, iso tile fill, prop placement (`PROP_CELL` order), label positioning. |
| `client/src/game/Game.ts` | Game loop. Player unit creation (**player scale lives here, currently `0.5`** — see §5.3), walk-frame cadence, wander logic. |
| `client/src/components/overlays/Overlays.tsx` | Title screen (uses `menuBg`), boss overlays (`bossBg`). |
| `client/src/components/hud/Hud.tsx` | HUD; spell/flask icons via `iconDataUrl(index)`. |

---

## 4. Generation Recipes (how every asset was made)

All images were AI-generated with detailed prompts. Reference images matter more than words: **always attach the hero anchor (`hollow_player`) or the relevant kit sheet as a style reference** when generating anything new, or the set will drift.

### 4.1 Universal prompt skeleton

```
[SUBJECT DESCRIPTION — very specific: body, armor/materials, pose, facing]
+ layout spec (single figure centered / horizontal sprite sheet with exactly 6 equal
  frames / 3x3 grid with one creature per cell, generous margins, no overlap)
+ "solid #FF00FF magenta background" (or #00FF00 green) for anything that must be
  keyed to transparency — do NOT ask for "transparent background", generators
  produce fake checkerboards
+ the mood keyword block from §1
```

### 4.2 Per-type recipes

| Asset type | Recipe highlights |
|---|---|
| Hero idle (anchor) | Single figure, SE-facing 3/4 view, full body incl. feet, centered, ~85% of canvas height. Generate FIRST, QA hard — everything else derives from it. |
| Walk strips | "Horizontal sprite sheet, exactly 6 equal frames in one row, same character in each frame, walking [direction], clearly different leg positions per frame: contact, recoil, passing, high-point, contact opposite, recoil opposite. Identical character size in all frames." Attach hero anchor. **QA every frame for a real stride** — generators love producing six identical standing poses (this exact failure shipped once and made the knight glide). |
| Attack strips | Same 6-frame layout; poses: anticipation (2) → swing (2) → follow-through (2). |
| NPC/boss singles | Single figure, canon traits from §1, full body, feet visible, solid key color bg. |
| Mob kits (3×3) | Name each of the 9 creatures cell-by-cell in the prompt, in exact row-major order, "one creature per cell, no overlap, equal cell sizes, generous margins". |
| Mob archetype strips | Attach the kit sheet AND crop of the specific creature as references. 6-frame rule as above. |
| Tiles | "Seamless tileable ground texture, top-down, even lighting, no shadows baked at edges." Opaque — no keying needed. |
| Backgrounds | Cinematic 16:9, opaque, painterly vista. |
| Icon kit | "4×4 grid of 16 square UI icons, unified style, engraved silver on dark stone, cyan accent glow", list all 16 icons in index order. |

---

## 5. Post-Processing Pipeline (mandatory for keyed sprites)

Raw generations are **never** wired in directly. The pipeline scripts live in `/home/ubuntu/sprite_check/` (main one: `hollow_process.py`); their logic, in order:

1. **Chroma-key removal** — flood-remove the solid magenta/green background to true alpha. Also scan for *semi-transparent leaked background* (a faint dark box around figures): check the 4 corner regions; if their mean alpha > 0, re-key with a wider tolerance. This bug shipped once (Elara/Gromm rendered inside visible rectangles).
2. **Defringe** — pixels near the alpha edge whose hue matches the key color get desaturated toward neighboring colors, killing magenta/green halos.
3. **Strip slicing & normalization** (6-frame sheets only) — slice into equal cells, compute each frame's content bounding box at alpha > 128, then rescale every frame so all have **identical content height** and a **common foot baseline**, and re-center horizontally on the torso. Without this the character visibly grows/shrinks frame to frame.
4. **Debris removal** — keep only the largest connected alpha component per frame (strips floating sword fragments and generator artifacts). Use judgment: projectiles/effects that should stay must be whitelisted.
5. **Kit verification** — for 3×3 / 4×4 sheets, confirm each cell's content is centered with margin and nothing bleeds across cell borders.

**Renderer scaling contract (critical):** the renderer scales sprites **by width**. A unit is drawn at `width = tileWidth × unitScale`, and height follows the image's aspect ratio. Consequences:

- Frames with different aspect ratios render at different heights → normalize (step 3).
- The **player scale constant in `Game.ts` is `0.5`**, mathematically derived from: walk cell 448×1152 with content filling ~92% of cell height, targeting the hero slightly taller than Gromm. If you regenerate walk sheets with different cell proportions or content-height fractions, re-derive this number — do not guess (the hero once rendered as a giant because of a stale multiplier).

---

## 6. How to Replace or Add an Asset (checklist)

1. Generate with the recipe from §4, attaching the hero anchor or kit sheet as style reference. Always generate **from scratch** — never edit an old generation.
2. Run the §5 pipeline (key, defringe, normalize, debris-strip).
3. QA with a contact sheet: for strips, view all 6 frames side by side and confirm pose variety and equal heights; for kits, confirm cell order.
4. Drop the processed PNG into hosting (live game: upload and use returned URL; export kit: copy into `client/public/assets/`).
5. Update the URL in `assets.ts` `URLS` (and the duplicate constants at the top of `mobs.ts` if it is a kit).
6. If player walk/attack proportions changed, re-derive the player scale in `Game.ts` (§5.3).
7. Type-check, then test in-game: menu, explore (walk all four directions), combat (attack both facings), and the relevant boss.

---

## 7. Known Pitfalls (learned the hard way)

| Pitfall | Symptom | Prevention |
|---|---|---|
| Six identical frames in a "walk" strip | Character glides without stepping | QA contact sheet before wiring; demand explicit pose list in prompt |
| Fake transparency (checkerboard baked in) | Grey checker squares behind sprite | Always generate on solid key color, key it yourself |
| Semi-transparent background leak | Faint dark rectangle around figure | Corner-alpha check in pipeline step 1 |
| Aspect-ratio drift between sheets | Character size "pops" when switching idle↔walk↔attack | Normalize all frames; re-derive draw scale |
| Shared walk strip across body plans | Toad visually morphs into a wolf when moving | Only assign `walkKey` when the archetype's body plan matches |
| Magenta/green fringe | Colored outline glow around sprites | Defringe pass (pipeline step 2) |
| Wrong kit cell order | Mobs wear each other's art | Treat cell order as a contract; never reorder |

---

## 8. File Locations Summary

| What | Where |
|---|---|
| Live game project | `/home/ubuntu/echoes-old-continent/` (dev preview + published site) |
| Asset registry | `client/src/game/engine/assets.ts` |
| Mob definitions | `client/src/game/data/mobs.ts` |
| Art direction source doc | `ART_DIRECTION.md` (project root) |
| This guide | `ART_GUIDE.md` (project root; also copied into the export kit) |
| Export kit (for Claude/Vercel) | `the-hollow-continent-kit/` — all assets local in `client/public/assets/`, code references `/assets/...` |
| Raw + processed generations | `/home/ubuntu/webdev-static-assets/` (`hollow_*.png` raw, `final/hollow_*.png` processed) — sandbox only |
| Pipeline scripts | `/home/ubuntu/sprite_check/` — sandbox only |
