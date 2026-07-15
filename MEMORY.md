# MEMORY — mob/boss walk animation task (phase 12-14)

## Current state: about to generate mob walk sheets (batch)

## Key facts (verified by reading code)
- assets.ts: URLS map; WalkDir="se"|"sw"|"ne"|"nw"; WALK_FRAMES=6; getWalkFrame(dir,frame) for PLAYER only (WALK_URLS).
- mobs.ts: MOBS record; source sprite URLs:
  - Kardorim: /manus-storage/boss_kardorim_bd0e4e8a.png (scale 1.6)
  - Warden: /manus-storage/grave_warden_2eb1d99f.png (scale 1.35)
  - Skeleton melee standalone: /manus-storage/skeleton_warrior_0f6f5381.png
  - Skeleton kit (3x3): /manus-storage/mobs_kit_skeletons_1ae2112e.png — cells: 0 archer,1 pikeman,2 shieldbearer,3 assassin,4 sergeant,5 ash_spirit,6 wandering_flame,7 hollowed_mage,8 gargoyle_whelp
  - Beast kit (3x3): /manus-storage/mobs_kit_beasts_db0b938c.png — cells: 0 frail_hollow,1 plague_rat,2 corpse_fly,3 rotting_hound,4 cursed_dandelion,5 blighted_toad,6 corrupted_boar,7 tomb_spider,8 grave_robber
- renderer.ts drawEntities: playerWalk param {moving,dir,frame}; player-only walk draw at ~line 368.
- Game.ts loop (~line 758-798): computes unitOverride per move anim (ALL units incl combat mobs); player-only walk bookkeeping (walkDir/walkFrameT/dust) at 761-777; moveAnims speed 5.2 explore / 6.5 combat.
- Player walk sheets processed via /home/ubuntu/process_walk_sheets.py (green bg removal, centroid framing, shared-scale normalization). Processed to /home/ubuntu/webdev-static-assets/processed/.

## Plan
1. Generate 6-frame horizontal walk sheets, green bg #00FF00 via transparent_background, 1536x256-ish, style-matched using reference images:
   - kardorim_walk_se/sw (ref boss art), warden_walk_se/sw, skel_melee_walk_se/sw, skel_archer_walk_se/sw, beast_walk_se/sw (hound-like quadruped)
   - Spirits (ash_spirit, wandering_flame, corpse_fly?) get code hover-bob, no sheets.
2. Process with adapted process_walk_sheets.py; upload via manus-upload-file --webdev.
3. assets.ts: add MOB_WALK map: archetype -> {se,sw} urls; getMobWalkFrame(archetype, dir, frame) (ne→se, nw→sw fallback).
4. types.ts MobDef: add walkKey?: "kardorim"|"warden"|"skel_melee"|"skel_archer"|"beast"|"hover".
   mobs.ts: assign walkKey: kardorim→kardorim; grave_warden→warden; skeleton_novice/pikeman/shieldbearer/assassin/sergeant/gargoyle_whelp→skel_melee; skeleton_archer/hollowed_mage→skel_archer; frail_hollow/plague_rat/rotting_hound/blighted_toad/corrupted_boar/tomb_spider/grave_robber→beast; ash_spirit/wandering_flame/corpse_fly/cursed_dandelion→hover.
5. Game.ts: unitWalk map<uid,{dir,frame,moving}> computed in loop for every move anim (facing from seg delta); pass to renderer; keep playerWalk for player (or fold player into unitWalk). Dust for units with scale>=1.3 (heavy).
6. renderer.ts: use unitWalk for non-player units w/ walkKey; hover-bob (sin offset) for walkKey="hover" units always; fallback static sprite.
7. Verify TS + combat demo screenshots (?demo=combat), checkpoint, deliver.

## Notes
- makeUnit lives in game code (probably combat.ts or types.ts) — Unit carries sprite; may need walkKey copied onto Unit in makeUnit.
- Unit type in types.ts; check Unit fields when editing.
- Dev URL: https://3000-itr6y5209vnm0lj5igiom-4a555133.us2.manus.computer ; save key echoes_save_v1.
- Checkpoint before this phase: c4487f37.
- User loves current state. Deliver phase 14 with checkpoint attachment.
