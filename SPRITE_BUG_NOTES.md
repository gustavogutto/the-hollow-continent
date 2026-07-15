# Sprite Bug Investigation (2026-07-12)

## User reports
1. "Blighted Toad" shows a wolf/hound sprite when wandering (user screenshot shows a clearly wolf-like creature labeled "Blighted Toad +1 (Lv 8)").
2. Player character sprite sizes uneven — user says "recreate the pictures not fix the size".

## Video analysis result (manus-analyze-video on user's .mov)
- CONFIRMED severe issue: player IDLE sprite is large & detailed; the WALKING sprite is a completely different, ~half-size, low-res "chibi" model. Instant pop between idle and walk each time movement starts/stops, all directions (timestamps 0:01, 0:04-0:05, 0:06-0:11).
- So the player's 4 directional walk sheets (URLS.walkSE/SW/NE/NW) don't match the idle sprite in scale/style. Idle sprite = player.sprite (knight image). Fix: REGENERATE walk sheets from scratch to match idle knight (dark armor, red accents), 6-frame horizontal strips, per direction; keep proportions consistent.

## Root cause 1: toad-as-wolf
- mobs.ts: blighted_toad has `walkKey: "beast"`; its STATIC sprite is BEASTS kit cell 5 (a toad).
- assets.ts: MOB_WALK_URLS.beast = beast_walk_se/sw sheets — these sheets depict a hound/wolf-like beast. ALL walkKey:"beast" mobs (frail_hollow, plague_rat, corpse_fly?no, rotting_hound, blighted_toad, corrupted_boar, tomb_spider, corpse_fish, tide_crab) swap to that wolf sheet when wandering (wander code sets unitWalk which makes renderer draw walk frames instead of static sprite).
- Options: (a) only use walk sheet when the mob's static sprite IS the hound (rotting_hound); for others, keep static sprite while wandering (slide without frame swap) — cheap and correct; (b) generate per-mob walk sheets — expensive. Choose (a): restrict wander walk-anim to mobs whose sprite matches walk sheet; e.g. add `wanderAnim: boolean` or only pass walk anim when mobDef.id === "rotting_hound" / walkKey beast+hound. Simplest general rule: during WANDER (not combat), don't set unitWalk for mobs — just slide the static sprite (facing flip ok). In COMBAT movement they already use walk sheets? (mob combat movement also uses getMobWalkFrame — same wolf issue exists in combat for toad; but user only saw wander. Better fix covers both: only use beast walk sheet for rotting_hound; others keep static sprite during movement.)

## Renderer facts (from earlier work)
- renderer.ts ~line 421+ draws units at TILE_W*1.05*u.scale; walk frames replace static sprite when unitWalk.moving.
- Game.ts render explore: wander sets `this.unitWalk.set(uid, {moving:true...})` when `w.target && u.walkKey && u.walkKey !== "hover"` (line ~1172).
- Player: walkKey via WALK_URLS (walkSE/walkSW/walkNE/walkNW in URLS), WALK_FRAMES=6, drawn in drawEntities playerWalk.
- Player idle sprite URL: check URLS.knight / player sprite in Game.ts makeUnit — knight idle is separate image.

## Asset URLs (assets.ts URLS)
- beasts kit: /manus-storage/mobs_kit_beasts_db0b938c.png (3x3: 0 frail_hollow,1 plague_rat,2 corpse_fly,3 rotting_hound,4 cursed_dandelion,5 blighted_toad,6 corrupted_boar,7 tomb_spider,8 grave_robber)
- beastWalkSE: /manus-storage/beast_walk_se_sheet_4a1a7900.png ; beastWalkSW: /manus-storage/beast_walk_sw_sheet_4da0e9e0.png (wolf-like)
- player walk sheets: URLS.walkSE/walkSW/walkNE/walkNW (lines ~20-30 of assets.ts, need exact URLs)
- knight attack: knight_attack_se/sw sheets

## Plan
- [x] video analysis
- [x] identify toad bug root cause
- [ ] read assets.ts lines 1-46 for player walk sheet URLs + knight idle URL
- [ ] download & inspect player idle + walk sheets (sizes, style mismatch confirm)
- [ ] regenerate player 4-dir walk sheets (6 frames, horizontal) matching idle knight style/scale; upload via manus-upload-file --webdev; update URLS
- [ ] fix mob walk mapping: restrict "beast" walk sheet to rotting_hound only (mobs.ts walkKey changes: others -> keep static: introduce no walk anim). Also check combat movement path.
- [ ] tsc + visual verify + checkpoint + deliver
