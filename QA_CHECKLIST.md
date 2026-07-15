# QA Checklist — v3 "Sound & Fury" batch

Run on desktop 1280x720, portrait 375x812, landscape 812x375 before checkpoint.
TypeScript (`pnpm check`) and production build must pass with zero errors.

## Regression (must not break)

| Area | Check |
|---|---|
| Title | Menu loads, Continue/New Game slot picker works, slot metadata renders |
| Saves | Old save (pre-batch) loads without error; new fields default correctly |
| Explore | WASD + click-to-move + joystick (mobile) all move the player; walk anim plays |
| Page transitions | Edge walk swaps pages; illusory walls still work; camera snaps (no cross-map pan) |
| Bonfire | Rest heals, refills flasks, respawns mobs, opens bonfire menu |
| Combat entry | Walking within 2 tiles of mob group starts combat; grid frames on desktop |
| Combat core | Move/attack/spells/flask/End Turn work; backstab/execution/posture unchanged numerically |
| Boss fights | Kardorim telegraphs + summons still function; victory overlay on kill |
| Death loop | Player death drops souls, respawns at bonfire, souls recoverable |
| Pause menu | Esc opens; save/load slots; return to title; controls overlay |
| Mobile HUD | Joystick, action cluster, compact combat bar on 375x812 and 812x375 |

## New features

| Feature | Check |
|---|---|
| Audio: ambient | Drone starts after first user gesture in explore; stops on return to title |
| Audio: bonfire | Crackle audible only near bonfire, fades with distance |
| Audio: combat | Combat layer on combatStart, stops on end; boss layer deeper |
| Audio: SFX | Hits, backstab, execution, death, UI clicks, flask, souls all fire |
| Audio: mute | Toggle in pause menu; persists across reload (localStorage); M key |
| Audio: safety | No crash when AudioContext blocked; screenshots unaffected |
| Hit-stop | Brief freeze on hits, longer on execution; game never stalls (cap) |
| Shake | Reduced-motion pref disables shake |
| Damage numbers | Arc + gravity + pop-in scale; execution numbers larger |
| Death dissolve | Soul motes rise from dying units; corpse fades as before |
| Toad attack | Tongue-snap strip plays SE/SW in combat, correct scale/baseline |
| Boar attack | Charge strip plays; still pushes player 2 tiles on charge |
| Gargoyle attack | Dive/claw strip plays SE/SW |
| Kiter AI | Archer retreats when player adjacent, then shoots if range+LoS |
| Healer AI | Tide priest heals wounded ally (cyan number) instead of attacking |
| Defender AI | Shieldbearer/crab brace (posture regen) when player far; still attack adjacent |
| Berserker AI | Hound/fish gain frenzy (+2 MP) below 50% HP, shows FRENZY once |
| Fast travel | Bonfire menu lists all bonfires; undiscovered locked; travel works both zones |
| Boss cinematic | Letterbox + camera pan to boss + title card + roar for warden/sentinel/kardorim; skippable; input locked during, restored after |
| Kardorim P2 | Flash + sting + glow tint at 50%; Soul Nova ring telegraph every 2nd round; ring resolves correctly |
| Tutorial | New game only: after intro dialogue, guided fight vs 1 frail hollow; banner steps advance (move → attack → end turn → victory); never blocks/soft-locks; not shown on continue or once done |
| Tutorial save | tutorialDone persists; old saves skip tutorial |

## Build gates

- `pnpm check` → 0 errors
- Production build succeeds
- No console errors on load, explore, combat, boss fight (check browserConsole.log)
