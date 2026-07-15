# The Hollow Continent — Mobile UI, Save Slots & Mob Life

**Design Plan for Approval** · 2026-07-13 · Manus AI

This document traces the plan for the next development batch before any code is written. It is grounded in an inspection of the current codebase, explains what is actually causing the 9:16 problem, and filters the ideas into what I recommend building now, what I would build differently than asked, and what I would defer.

---

## 1. What is wrong today (root causes, from code inspection)

| Symptom you saw | Actual cause in code |
|---|---|
| 9:16 "doesn't fit proper" | The camera is **static**: it centers the whole isometric map on screen (`offsetY = h/2 − GRID·TILE_H/2`) with no follow-cam and no zoom. On a portrait phone the map diamond is wider than the screen, so the edges spill off and the action can sit far from center. |
| Joystick on the wrong side | It's hard-coded `fixed bottom-24 right-5` in `Hud.tsx`. |
| No return to title | The title screen hands off to the game permanently; the `Game` class has no "teardown to menu" path and the HUD has no system menu. |
| No save slots | `core/save.ts` writes one single `localStorage` key. The data model (`SaveData`) is fine — it just needs a slot-aware wrapper. |
| Toad slides instead of hopping | After the toad-into-wolf fix, small critters (toad, rat, boar, spider, fish, crab) deliberately have **no** walk animation — they keep their static sprite while moving. Correct fix for the wolf bug, but lifeless. |
| Winged mobs don't flap | "Hover" mobs only get a code-driven bob (sine float). There are no flap frames for the corpse fly or chapel gargoyle. |

## 2. Proposed design

### 2.1 Camera & 9:16 fit (the real fix, benefits 16:9 too)

Replace the static camera with a **follow camera + smart zoom**:

- The camera smoothly follows the player (lerped, with a small dead-zone so it doesn't jitter on every step).
- Zoom adapts to viewport: portrait phones get a closer zoom (~1.15–1.3×) so tiles and the hero read large and the world fills the tall screen; desktop 16:9 keeps roughly the current framing. Combat zooms out just enough to frame the encounter grid.
- Safe-area insets (`env(safe-area-inset-*)`) so HUD elements clear notches and home indicators on real phones.
- Landscape phones (16:9 mobile) get the same follow-cam with a mid zoom — this makes both orientations genuinely playable rather than optimizing one at the expense of the other.

This is the highest-impact item on the list: it fixes portrait, improves landscape and desktop, and makes larger future maps possible (the static camera would have broken on any map bigger than one screen anyway).

### 2.2 Mobile HUD layout (9:16)

Portrait layout, thumb-first, minimal occlusion of the play field:

- **Joystick bottom-LEFT** (as requested), floating origin: it appears where your thumb lands within the left third of the screen instead of a fixed circle — this feels much better than a fixed pad on phones. A fixed fallback ring remains visible at rest so players know where to touch.
- **Action cluster bottom-RIGHT** (attack / spells / items in an arc) — classic two-thumb mobile-RPG ergonomics, matching your Diablo-style inspiration.
- **Top bar**: HP orb + souls left, system (pause) button right. Toasts stay top-right under the souls counter.
- In combat, the joystick hides (turn-based tap-to-move stays) and the right-hand arc becomes the combat action bar.

### 2.3 System menu & return to title

A pause button (top-right) and `Esc`/`X` open a full-screen **System Menu**: Resume · Controls (existing help overlay) · Save & Load (slot picker) · Return to Title. Return to title tears the game down cleanly and re-shows the title screen (world state is saved first, so it's always safe). This also gives us the natural future home for audio/settings toggles.

### 2.4 Five save slots

- Storage moves from one key to `hollow_save_slot_1..5`, each with metadata (character level, souls, location name, play time, timestamp) for the picker UI.
- **Migration**: an existing old-format save is automatically imported into Slot 1 — nobody loses progress.
- **Title screen** gains a slot picker: each slot card shows its metadata or "Empty"; New Game asks which slot to use; Continue jumps to the most recent slot. In-game, the System Menu lets you save to any slot (copy-style saves like classic RPGs) and load any slot.
- Autosave keeps working, writing to the active slot.

### 2.5 Mob animation & life system

I propose a **movement-style system** in the engine — each mob declares how it moves, and the renderer animates accordingly. This gives every creature life even where we don't spend art budget on full sheets:

| Style | Mobs | How it works |
|---|---|---|
| `walk` | skeletons, hound, boar, robber, bosses | existing 6-frame walk strips |
| `hop` | **toad** | new 6-frame hop strip (crouch → leap → mid-air → land) played over an arced jump: the toad physically leaves the ground and travels in discrete jumps, never slides. Idle = breathing squash. |
| `fly` | **corpse fly, chapel gargoyle** | new 4–6-frame wing-flap strips, played continuously (flying things flap even when "idle"), plus the existing hover bob. |
| `drift` | brine wraith, wandering flame, hollow dandelion | no new art: procedural bob + sway + subtle alpha/scale pulse (ethereal shimmer). |
| `swim` | drowned fish, moray | procedural undulation (slight rotation sway + bob) — reads as swimming through murk. |
| `scuttle` | rat, spider, crab | procedural rapid micro-steps: tiny fast bounce + lean into movement direction. Cheap and full of character. |

Plus two global "life" touches (no art needed): idle **breathing** (1–2 % vertical scale pulse) on all grounded mobs so nothing is frozen, and a small **direction lean/flip** so mobs face where they wander.

**Art to generate (6 strips, keeps cost sane):** toad hop SE + SW, corpse-fly flap SE + SW, gargoyle flap SE + SW — processed through the existing pipeline (transparency key, defringe, height/baseline normalization). NE/NW reuse mirrored SE/SW as elsewhere.

## 3. Recommendations & filtering (my honest take)

**Build now (this batch):** everything above. It's one coherent "playability + life" package, and the camera work is a prerequisite for the mobile HUD to feel right.

**Do differently than asked — one thing:** you said "optimised to play 16:9, but 9:16 would be nice". With the follow-cam approach we don't have to choose: the same system serves both, portrait simply gets a closer zoom. So I'd frame it as *one adaptive camera*, not two layouts to maintain.

**Defer (good ideas, separate batches):** species-specific *attack* strips for critters (toad tongue-snap etc.) — bigger art batch, do after movement feels right; audio (would pair perfectly with the new life pass); cloud/export saves (slots first, export later); and the map/teleport "grace" system you mentioned previously — that's a design feature of its own and deserves its own plan.

**Small extras I'd sneak in because they're nearly free:** pause button also on desktop (Esc), slot metadata showing where you are ("Ashen Shrine · Lv 6 · 2h 14m"), and a "Delete save" option per slot with a hold-to-confirm so it can't be fat-fingered.

## 4. Execution order & what you'll see

1. **Art batch** (runs first, in parallel with code): 6 animation strips → pipeline → upload.
2. **Camera + 9:16**: follow-cam, adaptive zoom, safe areas.
3. **HUD**: left joystick (floating origin), right action cluster, top bar + pause.
4. **System menu + 5 slots + title slot picker + migration.**
5. **Mob life**: movement-style system, wire the new strips, procedural styles for the rest.
6. **Verification** at 375×812 (9:16), 812×375 (landscape phone), and 1280×720 (16:9), then a checkpoint you can test.

Estimated result: portrait becomes genuinely playable (not a squeezed desktop view), every mob type moves in a way that suits its species, and the game finally has proper session management (pause, quit, five saves).

---

*Reply with approval or adjustments — e.g. "skip the gargoyle, add X", "joystick fixed instead of floating", "slots should also store options" — and I'll start with the art batch immediately.*
