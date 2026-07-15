# The Hollow Continent — Art Remake Direction

## New Visual Identity (v2, distinct from the "Ashen Gothic" v1 set)

The v1 set ("Echoes of the Old Continent") was warm-ash gothic: charcoal greys, orange ember light, tarnished steel. For **The Hollow Continent** we shift to a **"Pale Sepulchre"** direction — still Souls-like (Demon's Souls / DS3 / Bloodborne / Elden Ring lineage, never cartoonish), but colder, more haunted and moonlit:

- **Palette**: bone-white and pale marble, cold moonlit blue-greys, deep umber shadows, with **sickly cyan-teal soul-light** replacing v1's orange ember glow as the accent. Secondary accent: tarnished silver and verdigris (oxidized bronze-green).
- **Light**: cold overhead moonlight, rim-lit silhouettes, phosphorescent glows from wounds/eyes/braziers (cyan, not orange).
- **Material feel**: cracked marble, wet bone, rusted silver, rotting linen, black iron.
- **Mood keywords for every prompt**: "hollow, moonlit, sepulchral, cold soul-light, painterly dark fantasy, oil painting texture, in the style of Dark Souls and Elden Ring concept art, NOT cartoon, NOT cel-shaded, muted desaturated colors, isometric game asset".
- **Hero redesign**: the knight now wears pale bone-lacquered plate with a cracked porcelain-like mask helm, hooded in ash-grey linen, sword glowing cold cyan along fuller. Same silhouette discipline (readable at 85px tall).
- **NPC constraints (unchanged requirements)**: Gromm the blacksmith is **bald**; Elara is a **blonde woman with Polish features**.

## Complete Asset Inventory & Generation Specs

All character/prop sheets on **fully transparent background**. Every multi-frame sheet is a **horizontal strip** (6 frames). Kits are square grids. Sizes mirror v1 so all in-code scales keep working.

| # | Key (assets.ts) | File concept | Size / layout | Used in / notes |
|---|---|---|---|---|
| 1 | player | Hero idle, SE-facing 3/4 view | 1920x1920, single | renderer explore+combat idle; scale computed vs NPC |
| 2 | walkSE/SW/NE/NW | Hero walk cycles | 2688x1152, 6x1 strip (448x1152 cells) | 4 sheets; distinct stride poses (contact/recoil/passing/high-point); normalize height+baseline |
| 3 | knightAttackSE/SW | Hero sword swings | 2688x1152, 6x1 | anticipation→swing→follow-through |
| 4 | elara | Elara, Soul Keeper (blonde, Polish features, candle/soul-light) | 1920x1920 | shrine NPC + dialogue portrait |
| 5 | gromm | Gromm, Blacksmith (bald, heavy build, hammer) | 1920x1920 | shrine NPC + dialogue portrait |
| 6 | kardorim | Boss: Kardorim the Hollow King (was Ashen Lord) | 1920x1920 | boss arena; scale 1.6 |
| 7 | warden | Boss: Grave Warden (halberd crypt keeper) | 1920x1920 | crypt boss; scale 1.35 |
| 8 | drownedSentinel | Boss: Drowned Sentinel (flooded-kingdom knight) | 1536x2304 portrait | zone-2 boss; scale 1.5 |
| 9 | skeleton | Skeleton Warrior standalone | 1920x1920 | skeleton_novice mob |
| 10 | beasts | Beast kit 3x3: hollow man, rat, corpse fly, hound, cursed flower, toad, boar, tomb spider, grave robber | 1920x1920 (640px cells) | 9 mobs, cells 0-8 in that order |
| 11 | skels | Skeleton kit 3x3: archer, pikeman, shieldbearer, assassin, sergeant, ash spirit, wandering flame, hollowed mage, gargoyle | 1920x1920 | 9 mobs, cells 0-8 |
| 12 | sunkenMobs | Sunken kit 3x3: drowned soldier, brine wraith, coral golem, corpse fish, sunken archer, tide crab, tide priest, moray horror, drowned ogre | 1920x1920 | 9 mobs, cells 0-8 |
| 13 | mob walk sheets (10) | kardorim/warden/skel_melee/skel_archer/beast x SE+SW | 1536x256, 6x1 (256px cells) | must match new kit designs |
| 14 | skelAttackSE, beastAttackSE | mob attack strips | 1536x256, 6x1 | skel sword swing; beast lunge-bite |
| 15 | props | Props kit 3x3: pillar, gravestone, dead tree, chest, bone pile, ruined arch, brazier (cyan flame), boulder, broken cart | 1920x1920 | explore maps decoration |
| 16 | bonfire | Checkpoint fire: sword-in-coals, CYAN soul-flame | 1920x1920 | shrine checkpoint |
| 17 | icons | UI icon kit 4x4 (16): 0 slash, 1 heavy blow, 2 soul bolt, 3 burst, 4 spare, 5 shadow step, 6 flask, 7 pyre, 8 spare, 9 war cry, 10 quake/bone, 11 rend/shard, 12 armor, 13 helm, 14 ring, 15 key | 1920x1920 (480px cells) | HUD spell bar + inventory |
| 18 | tileAsh | Ground texture, zone 1: pale ash/bone-dust cobbles | 1920x1920 seamless-ish | drawn as iso diamond fill |
| 19 | tileCrypt | Ground texture, crypt: dark marble slabs | 1920x1920 | crypt maps |
| 20 | tileSunken | Ground texture, zone 2: wet kelp-slick stone | 1920x1920 | sunken maps |
| 21 | menuBg | Title screen: pale ruined continent vista, moonlit, lone knight silhouette | 1920x1080 | main menu + title |
| 22 | bossBg | Boss victory/defeat overlay bg | 1920x1080 | Overlays.tsx |
| 23 | sunkenBg | Zone-2 ambience bg | 2560x1440 | zone 2 backdrop |

## Post-processing pipeline (per sheet type)

Walk/attack strips: slice 6 cells → alpha>128 content bbox → uniform content height + common foot baseline → largest-connected-component cleanup (strip floating debris) → reassemble strip. Kits: verify each cell's content is centered with margin; no cross-cell bleed. All: ensure true alpha transparency (no checkerboard-pattern fake transparency, no solid bg).

## Rebrand text changes

- client/index.html title → "The Hollow Continent"
- Overlays.tsx title screen → "The Hollow<br/>Continent"
- Kardorim rename: "Kardorim, the Hollow King" (mobs.ts) — keep id.
- Comment headers (Home.tsx, types.ts) — cosmetic.
