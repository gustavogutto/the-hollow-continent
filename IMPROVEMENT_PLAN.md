# Improvement Batch Plan — v3 "Sound & Fury"

Audited against checkpoint 614cb85a. Every feature below lists its exact integration
points so we extend rather than rewrite. Rule: NO changes to save-key names; new save
fields must be optional with defaults so old slots keep loading.

## 1. Audio engine (`game/core/audio.ts`, NEW)

All sound is procedurally synthesized with the Web Audio API — zero audio files, so the
export kit stays self-contained and no licensing issues. Master GainNode with `muted`
persisted in localStorage (`hollow_audio_muted`, NOT in SaveData → global preference).
AudioContext lazily created/resumed on first user gesture (browser autoplay policy).

- Ambient layer: low drone (2 detuned sine/triangle oscillators ~55/57 Hz through lowpass
  + slow LFO gain). Started in explore/menu; adds a wind noise layer (filtered noise buffer).
- Bonfire crackle: proximity-gated (distance to page bonfire in Game loop) noise bursts
  through bandpass, randomized scheduling.
- Combat layer: on `combatStart`, raise a tense pulse (filtered saw pad + slow tremolo);
  boss fights add a deeper second oscillator. Stops on combatEnd/victory/death.
- SFX (fire-and-forget fns): swordHit, heavyHit, execution (metallic klang via
  inharmonic partials), hurt, death (down-glide), stagger, uiClick, uiHover, flask,
  souls, spellFire (noise whoosh + saw), spellSoul (sine shimmer), bossRoar (low
  distorted burst), phaseSting, tutorialPing, hopThud, bowShot, heal.
- Integration points:
  - Game.startCombat → audio.combatStart(isBossFight)
  - Game.onCombatEnd / playerDied path → audio.combatEnd()
  - Combat callbacks: cb.onDamage already receives all damage text; better: add explicit
    calls in dealDamage (hit/backstab/execution/stagger), killUnit (death), pushUnit (crash).
    Combat is engine-pure → add optional `onSfx?: (name: string) => void` callback to
    CombatCallbacks; Game wires it to audio. Keeps combat.ts decoupled.
  - Hud.tsx buttons → audio.uiClick() on press (End Turn, spells, flask, menu).
  - Bonfire crackle: Game.loop computes dist to page.bonfire each frame (cheap), calls
    audio.setBonfireProximity(0..1).
  - Mute toggle: SystemMenu row + M key handled in Hud/Game; persists localStorage.

## 2. Combat juice

- Hit-stop: global `hitStop` timer in Game.loop — when >0, subtract dt, clamp effective
  dt for animation advancement to ~10% (don't fully zero: avoids stalls). Set on
  dealDamage via new onSfx/onImpact callback: normal hit 0.06s, backstab 0.09s,
  execution 0.14s, boss cleave 0.12s.
- Screen shake already exists (renderer.addShake). Tune: add micro-shake on normal hits
  (already amt 4). Add prefers-reduced-motion check in renderer.addShake to no-op.
- Damage numbers: upgrade renderer damage FX from linear float to arc (vx, vy with
  gravity), scale pop-in (1.4→1.0 in first 15%), crit/execution numbers bigger.
  Keep addDamage signature; add optional opts param.
- Death dissolve: dying units currently fade via DyingUnit t. Add cyan soul-wisp
  particles rising + brief white flash on death frame (spawnDeathBits already exists —
  extend with soul motes). Cheap: more particles w/ negative vy and cyan color.

## 3. Species attack strips (media generation)

Three new 6-frame strips (SE/SW each = 6 images): toad tongue-snap, boar charge,
gargoyle claw-dive. Same pipeline as flap/hop strips: 2688x1152, magenta chroma,
normalize baseline. Wire as attackKeys: `toad_attack`, `boar_attack`, `garg_attack` in
assets.ts ATTACK registry; assign attackKey in mobs.ts (blighted_toad, corrupted_boar,
gargoyle_whelp; coral_golem reuses boar? NO — golem keeps default lunge).
Renderer already plays attack sheets via unitAttack map — only registry additions needed.
Risk: generation quality variance → reuse the exact prompt recipe from ART_GUIDE plus
reference the kit cell crops as style anchors.

## 4. Enemy AI archetypes (combat.ts)

Extend runAI with data-driven `aiRole` field on MobDef (optional, default current logic):
- `kiter` (skeleton_archer, sunken_archer): if player within 2 tiles, first move AWAY to
  a cell that keeps range & LoS, then shoot. Implemented via aiApproach scoring tweak:
  add penalty for cells adjacent to player when mx>1. (aiApproach already prefers far
  cells; strengthen + add explicit retreat step.)
- `healer` (tide_priest): if any wounded ally (hp<60%) in range 6, heal it
  (25-35 hp, cyan number) instead of attacking; else fall through to aoe_mage behavior.
- `defender` (shieldbearer, tide_crab): stays put unless player > its range+1 away;
  gains +10 posture regen per turn while stationary ("braced").
- `berserker` (rotting_hound, corpse_fish): +2 MP when hp<50% and always targets the
  path that ends adjacent (already default); shows "FRENZY" once.
All keep existing `special` behaviors — aiRole composes before the default block.

## 5. Bonfire fast travel map

Bonfire menu already lists discovered bonfires (Dialogue.tsx). Improvements:
- Add travel section ALWAYS visible with all 3 bonfire pages (p2_2 Ashen Shrine,
  p3_1, s1_2) — undiscovered shown as "Unknown ember" locked rows.
- Add "Map" panel access in explore (M key already opens map dialogue) — add bonfire
  travel buttons there when standing NOT at bonfire? NO — Souls rule: travel only from
  a bonfire. Keep to bonfire menu, but improve presentation (zone labels).
- This is small; main work is polish + locked-row states.

## 6. Boss intro cinematic

Current: text card via bossIntro event. Upgrade to letterbox cinematic:
- Game.startCombat for boss fights: set `cinematic` state {t, bossUid} for ~2.6s;
  during cinematic, camera focuses boss (setCameraFocus boss pos, zoom 1.15), input
  locked (combat.busy = true via a dedicated flag), then camera returns and combat begins.
- Renderer: draw letterbox bars (two black rects easing in/out) when cinematic active.
- BossIntro overlay keeps the title card, now synced: emit bossIntro AFTER the pan
  starts (0.4s delay), audio.bossRoar at start.
- Apply to kardorim, drowned_sentinel AND grave_warden (add warden to isBossFight list
  for the intro only — group check by mobIds includes grave_warden).

## 7. Kardorim phase 2 upgrade

Phase 2 exists (fire tiles + summons at 50%). Add:
- Visual: on transition, screen flash + audio.phaseSting + big shake (exists) +
  Kardorim gains cyan soul-flame tint overlay in renderer (unit.phase2 flag → draw
  additive glow ellipse behind sprite).
- New attack: every 2nd round in phase 2, "Soul Nova" — telegraphed ring (radius 2,
  ring cells only) around HIMSELF next turn, replacing player-centred cleave that turn.
- HP bar color shift handled by boss bar (Hud reads hud state — add bossPhase2 to view).

## 8. Scripted tutorial fight

New player experience: after Elara intro dialogue closes on a NEW game (not demo,
not continue), spawn a single `frail_hollow` two tiles east and start a guided combat:
- Tutorial state machine in Game: steps [move, attack, endturn, finish]; HUD shows a
  small instruction banner (bus event `tutorial` with text) top-center.
- Step gating: in tutorial combat, End Turn disabled until player moved+attacked once
  (soft gating — banner explains; don't hard-block to avoid stuck states. Only step 1
  "move" highlights movement, etc.)
- On victory: banner "The ash will teach you the rest", tutorialDone=true persisted
  (new optional SaveData field, default false; old saves → treated done if helpSeen).
- Keep it ONE weak mob so it can't kill a new player (frail_hollow dmg 5-8 vs 100 hp).

## Risk notes

- combat.ts callback additions are optional fields → no breakage of existing tests.
- New SaveData fields optional; loadSave already spreads defaults (verify defaultSave
  merge behavior — save.ts loadSave must merge defaults for missing fields).
- Cinematic must not soft-lock: hard cap timer, skippable by tap/click/Esc.
- Audio must never throw when AudioContext unavailable (SSR/screenshot runs) — guard all.
- Screenshots (webdev tool) don't click → audio never starts in captures; fine.
- Keep bundle clean: no new deps.

## Execution order

Phase 2: audio.ts + wiring + juice (hit-stop, damage arcs, dissolve, mute UI).
Phase 3: generate 6 strips (3 species x SE/SW), process, upload, wire.
Phase 4: AI roles → fast-travel polish → boss cinematic → Kardorim phase 2 → tutorial.
Phase 5: full QA (QA_CHECKLIST.md) + fixes + checkpoint.
Phase 6: kit rebuild. Phase 7: deliver.
