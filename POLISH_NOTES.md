# Polish Batch Working Notes (phase 20-22)

## User feedback (from screenshots)
1. Player knight too small vs NPCs -> DONE: Game.ts line ~77 player.scale 1.0 -> 1.28 (units drawn at TILE_W*1.05*scale; NPCs drawn raw at TILE_W*1.12 in renderer.ts ~line 340). Verify visually; NPC sprites may have taller aspect so tune 1.28 up/down.
2. Toasts cover bottom HUD -> move to top-right under souls counter, compact, stack<=3, fast fade, bounce-in. Toast rendering lives in client/src/components/overlays/Overlays.tsx (Toasts component) + Home.tsx wires events. Souls counter is top-right in Hud.tsx.
3. Hint bar (WASD/Click move · F interact · C character · M map · E flask) in Hud.tsx bottom center -> remove always-on; add "?" button + H key toggle help overlay w/ dim backdrop; auto-show once for new players (first ~60s or until first move+interact); persist `showHints`/`helpSeen` in save (core/save.ts migration).
4. Mobile HUD broken (overlaps: HP orb / hint bar / Lv badge; joystick collides) -> media queries / useMobile hook; compact icons for flask+MAP, Lv chip, no keybind text on mobile, joystick reposition, combat bar scrollable + big END TURN.
5. Ambient mob wandering in explore -> mob groups idle-step 1-2 tiles around spawn, leashed, walk anims + facing; NPC idle facing shifts. Explore mobs drawn in Game.ts render (~line 1064): pageMobGroups mapped to exploreMobs each frame with uid 100000+idx — need persistent wander offset state per group (Map<groupId,{pos,target,timer}>), move group.pos NOT (groups from world data are shared/immutable? they're per-page instances in this.pageMobGroups — check how loaded; likely fresh copies per page load, safe to mutate).

## Key file/line facts
- Game.ts:74-78 player init (scale 1.28 now)
- Game.ts:653 startCombat, 1064 exploreMobs mapping, 1074 drawEntities call
- renderer.ts:333-354 NPC draw (TILE_W*1.12 raw, gold ✦ marker), 421+ units draw (TILE_W*1.05*u.scale), 466 unit width
- combat.ts:26 makeUnit (scale from def, default 1)
- mobs.ts scales: rats 0.75, hounds 0.85, warden 1.35, kardorim 1.6, sentinel 1.5
- Hud.tsx: hint bar bottom center; VirtualJoystick appended at end (touch only); MAP (M) button top right area; HP orb bottom-left; Lv badge bottom-right
- Overlays.tsx: Toasts component (bottom-center currently), MainMenu/Death/ZoneTitle/BossIntro/Victory
- Home.tsx: wires game events incl. toasts
- save key: echoes_save_v1; save.ts has migration merge
- events: core/events.ts emitter; hud state assembled in Game.ts ~1130-1166 (HudState in types.ts)
- pnpm check = tsc --noEmit; dev URL https://3000-itr6y5209vnm0lj5igiom-4a555133.us2.manus.computer
- Latest checkpoint: 92c6f968 (expansion delivered)

## Verification findings (browser, 2026-07-12)
- Desktop explore/combat + mobile 375x812 screenshots all render correctly: compact mobile HUD, joystick bottom-right, scrollable combat bar, turn dots on mobile, help ? button present.
- Player scale 1.28 looks right next to Gromm/Elara.
- Wandering works (mobs shifted positions between shots); labels follow smooth pos; combat snap-to-grid added in startCombat.
- ISSUE FOUND: on first New Game, auto-shown help overlay OVERLAPS Elara's intro dialogue (both visible at once). FIX: when a dialogue opens, auto-close the help overlay (Game listens or Hud effect: if dialogue event fires while helpVisible, call toggleHelp). Simplest: in Home.tsx/Hud, bus.on('dialogue') -> game.hideHelp(). Add hideHelp() to Game.

## Status
- [x] 1 player scale (verified)
- [x] 2 toasts (top-right, compact)
- [x] 3 hint toggle (? button, H key, auto-show once) — needs overlap fix w/ intro dialogue
- [x] 4 mobile HUD
- [x] 5 wandering
- [x] fix help/dialogue overlap — VERIFIED in browser: New Game -> Elara dialogue alone -> Skip -> help overlay auto-shows -> Close works; hideHelp on dialogue open, onDialogueClosed triggers first-run help (Game.ts pendingFirstHelp, Dialogue.tsx hooks). tsc clean.
- [ ] checkpoint + deliver (NO publish)
