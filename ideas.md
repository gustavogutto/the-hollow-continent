# Echoes of the Old Continent — Design Ideas

## Three Candidate Directions

1. **Ashen Gothic** — Dark Souls 3 meets tactical grid: charred stone, ember light, faded gold heraldry. Grim, elegiac, reverent. Probability: 0.07
2. **Void Parchment** — The world drawn as a decaying illuminated manuscript; sepia ink, vellum textures, blood-red accents. Probability: 0.04
3. **Cold Moonlight** — Bloodborne-adjacent blue-grey palette, fog, silver filigree, lunar glow. Probability: 0.02

## CHOSEN: Ashen Gothic

- **Design Movement**: Dark fantasy gothic (Dark Souls 3 / Elden Ring UI language) — engraved metal, ember glow, weathered serif type.
- **Core Principles**:
  1. Darkness is the canvas; light (embers, bonfires, soul-glow) is the information.
  2. Every UI element feels forged or engraved — no flat "web" chrome.
  3. Tension through restraint: sparse HUD, information revealed on demand.
  4. The grid is sacred: combat readability always beats decoration.
- **Color Philosophy**: Near-black charcoal (#0b0a08) base symbolizing the dead world; ember orange (#e8823c) as the "life/soul" accent — bonfires, souls, HP; ash-gold (#c8a24b) for interactive highlights and rare loot; desaturated bone (#d6cdbb) for body text. Cold teal-blue (#5a8a9c) reserved exclusively for magic/AP.
- **Layout Paradigm**: Full-screen game canvas. HUD anchored asymmetrically: character orb + flasks bottom-left, AP/MP + turn timeline bottom-center-right, souls counter bottom-right corner (Souls convention). Dialogues as letterboxed bottom bands, not modal boxes.
- **Signature Elements**:
  1. Ember particles drifting upward on menus and bonfire screens.
  2. Engraved corner filigree (thin gold strokes) framing panels.
  3. "YOU DIED" style full-screen letterform moments (death, boss intro, zone discovery).
- **Interaction Philosophy**: Deliberate and weighty. Actions confirm with short, heavy feedback (screen shake on hits, slow fade on death). Nothing bouncy or playful.
- **Animation**: Slow fades (400–600ms) for scene moments; fast (120–200ms) snappy tweens for grid movement/attacks; damage numbers rise and fade; bonfire flame flicker via sprite pulse.
- **Typography System**: "Cinzel" (engraved Roman serif) for titles/zone names/boss bars; "EB Garamond" for dialogue and body; small-caps tracking-wide labels for HUD.
- **Brand Essence**: A tactical Souls pilgrimage through a dead world — for players who love both Dofus grids and Elden Ring dread. Adjectives: solemn, punishing, atmospheric.
- **Brand Voice**: Cryptic, liturgical. Examples: "The ash remembers what you were." / "Rest, ember-bearer. The dead will rise with you."
- **Wordmark & Logo**: "ECHOES of the OLD CONTINENT" in Cinzel, wide-tracked, with a cracked soul-flame sigil above.
- **Signature Brand Color**: Ember orange #e8823c.

## Reference (ground truth from GDD)
- Dofus-style page-based world (5×5 pages), tactical AP/MP grid combat, Souls death/bonfire loop.
- User's style knowledge: NOT cartoonish; 2D isometric with 3D feel; bonfire at zone start + mid-route; bald blacksmith; blonde Soul Keeper with Polish traces; skeletons in tutorial.
- Keybinds: WASD move, E heal flask, F interact/open chest, C inventory (combined equipment+inventory tab), M map, Esc back.
