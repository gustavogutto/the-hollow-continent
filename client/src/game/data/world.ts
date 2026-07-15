/* Ashen Gothic — The Ashen Incarnation: 5x5 overworld pages + Crypt of the First King (5 rooms).
 * Page ids: "p{x}_{y}" with x,y in 0..4. Hub at p2_2. Dungeon entrance at p4_0. Mid bonfire p3_1.
 * Difficulty radiates outward from hub. Grid is 15x15 per page. */
import type { PageDef, PropDef, MobGroupDef, Vec2 } from "../types";

export const GRID = 15;
export const WORLD_W = 5;
export const WORLD_H = 5;

const P = (x: number, y: number): Vec2 => ({ x, y });

// deterministic prop scatter helper
function scatter(seed: number, kinds: PropDef["kind"][], count: number, avoid: Vec2[]): PropDef[] {
  const props: PropDef[] = [];
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let guard = 0;
  while (props.length < count && guard++ < 200) {
    const x = 1 + Math.floor(rnd() * (GRID - 2));
    const y = 1 + Math.floor(rnd() * (GRID - 2));
    if (avoid.some((a) => Math.abs(a.x - x) <= 1 && Math.abs(a.y - y) <= 1)) continue;
    if (props.some((p) => p.pos.x === x && p.pos.y === y)) continue;
    props.push({ kind: kinds[Math.floor(rnd() * kinds.length)], pos: P(x, y) });
  }
  return props;
}

function grp(id: string, pos: Vec2, ...mobIds: string[]): MobGroupDef {
  return { id, mobIds, pos };
}

const OVERWORLD_KINDS: PropDef["kind"][] = ["gravestone", "tree", "boulder", "bones", "pillar"];

export const PAGES: Record<string, PageDef> = {
  // ---------- Row 2 (center): hub and main path ----------
  p2_2: {
    id: "p2_2", name: "Shrine of the First Flame", kind: "hub", tileset: "ash",
    bonfire: { pos: P(7, 6), name: "Shrine of the First Flame" },
    npcs: [
      { id: "elara", pos: P(5, 8) },
      { id: "gromm", pos: P(10, 8) },
    ],
    props: [
      { kind: "arch", pos: P(7, 3) },
      { kind: "pillar", pos: P(3, 4) }, { kind: "pillar", pos: P(11, 4) },
      { kind: "brazier", pos: P(4, 10) }, { kind: "brazier", pos: P(10, 10) },
      { kind: "bones", pos: P(2, 12) },
    ],
    groups: [],
    ambient: "The great bonfire gutters low. Elara watches the flame; Gromm watches his anvil.",
  },
  p1_2: {
    id: "p1_2", name: "Ash Fields — East", kind: "overworld", tileset: "ash",
    props: scatter(12, OVERWORLD_KINDS, 8, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 4), "frail_hollow", "frail_hollow"),
      grp("g2", P(10, 9), "frail_hollow", "plague_rat"),
    ],
    ambient: "Burnt grass whispers underfoot. The hollows here barely remember how to fight.",
  },
  p3_2: {
    id: "p3_2", name: "Way of Souls", kind: "overworld", tileset: "ash",
    props: scatter(33, OVERWORLD_KINDS, 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "skeleton_novice", "plague_rat"),
      grp("g2", P(11, 8), "skeleton_novice", "skeleton_novice"),
      grp("g3", P(8, 12), "corpse_fly", "corpse_fly"),
    ],
    ambient: "Pale wisps drift east, toward the crypt. The bones stir where they fall.",
  },
  p0_2: {
    id: "p0_2", name: "The Withered Pastures", kind: "overworld", tileset: "ash",
    props: scatter(51, OVERWORLD_KINDS, 10, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 6), "plague_rat", "plague_rat", "plague_rat"),
      grp("g2", P(10, 4), "rotting_hound"),
      grp("g3", P(9, 11), "frail_hollow", "corpse_fly"),
    ],
    ambient: "Something grazed here once. Its bones bleach among the thistles.",
  },
  p4_2: {
    id: "p4_2", name: "Pilgrims' Descent", kind: "overworld", tileset: "ash",
    props: scatter(77, OVERWORLD_KINDS, 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 4), "skeleton_archer", "skeleton_novice"),
      grp("g2", P(10, 10), "cursed_dandelion", "cursed_dandelion", "corpse_fly"),
    ],
    ambient: "Broken statues of the Twelve line the old pilgrim road.",
  },

  // ---------- Row 1 (north): harder, path to dungeon ----------
  p2_1: {
    id: "p2_1", name: "The Silent Orchard", kind: "overworld", tileset: "ash",
    props: scatter(91, ["tree", "tree", "gravestone", "boulder"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 5), "blighted_toad", "corpse_fly"),
      grp("g2", P(11, 6), "skeleton_pikeman", "skeleton_novice"),
      grp("g3", P(7, 11), "rotting_hound", "rotting_hound"),
    ],
    ambient: "Dead trees claw at a starless sky. Nothing has bloomed here for an age.",
  },
  p3_1: {
    id: "p3_1", name: "The Watcher's Rest", kind: "overworld", tileset: "ash",
    bonfire: { pos: P(7, 7), name: "The Watcher's Rest" },
    props: [
      { kind: "arch", pos: P(7, 4) }, { kind: "pillar", pos: P(4, 6) }, { kind: "pillar", pos: P(10, 6) },
      { kind: "chest", pos: P(12, 10), chestLoot: ["ember_ring"], chestSouls: 100 },
      ...scatter(101, ["gravestone", "bones"], 5, [P(7, 7), P(12, 10)]),
    ],
    groups: [
      grp("g1", P(3, 11), "ash_spirit", "skeleton_archer"),
    ],
    ambient: "A lone bonfire before the final climb. Rest, ember-bearer — the crypt does not.",
  },
  p1_1: {
    id: "p1_1", name: "Gallows Ridge", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(12, 12), chestLoot: ["ember_ore"], chestSouls: 40 },
      ...scatter(113, OVERWORLD_KINDS, 10, [P(7, 7), P(12, 12)]),
    ],
    groups: [
      grp("g1", P(5, 5), "grave_robber", "plague_rat"),
      grp("g2", P(10, 9), "skeleton_shieldbearer", "skeleton_archer"),
      grp("g3", P(12, 4), "hollow_archer", "hollow_archer"),
    ],
    ambient: "Ropes creak on the gallows tree, though the wind is still.",
  },
  p4_1: {
    id: "p4_1", name: "Cryptward Approach", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(3, 3), chestLoot: ["old_bone", "old_bone"], chestSouls: 80 },
      ...scatter(131, ["pillar", "arch", "gravestone", "bones"], 9, [P(7, 7), P(3, 3)]),
    ],
    groups: [
      grp("g1", P(6, 5), "skeleton_pikeman", "skeleton_shieldbearer"),
      grp("g2", P(10, 10), "wandering_flame", "ash_spirit"),
      grp("g3", P(3, 10), "ash_mage", "hollow_archer"),
    ],
    ambient: "The crypt breathes cold from the north. The dead grow bolder near their king.",
  },

  // ---------- Row 0 (far north): deadliest, dungeon entrance ----------
  p2_0: {
    id: "p2_0", name: "The Sunken Necropolis", kind: "overworld", tileset: "ash",
    props: scatter(149, ["gravestone", "gravestone", "pillar", "bones", "arch"], 12, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 4), "skeleton_assassin", "skeleton_novice"),
      grp("g2", P(11, 7), "tomb_spider", "corpse_fly"),
      grp("g3", P(7, 12), "hollowed_mage", "skeleton_shieldbearer"),
    ],
    ambient: "Ten thousand graves, and every one of them open.",
  },
  p3_0: {
    id: "p3_0", name: "The Ossuary Steps", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(11, 3), chestLoot: ["bone_helm", "iron_shard"], chestSouls: 150 },
      ...scatter(167, ["bones", "bones", "boulder", "pillar"], 9, [P(7, 7), P(11, 3)]),
    ],
    groups: [
      grp("g1", P(5, 6), "skeleton_sergeant", "skeleton_novice", "skeleton_archer"),
      grp("g2", P(10, 10), "gargoyle_whelp"),
    ],
    ambient: "Steps of mortared bone lead up to the crypt gate. Each stair was someone.",
  },
  p4_0: {
    id: "p4_0", name: "Gate of the First King", kind: "overworld", tileset: "ash",
    dungeonEntrance: { pos: P(7, 3), to: "d1" },
    props: [
      { kind: "arch", pos: P(7, 2) },
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      ...scatter(191, ["gravestone", "bones"], 6, [P(7, 3), P(7, 7)]),
    ],
    groups: [
      grp("g1", P(4, 9), "grave_warden"),
    ],
    ambient: "The Grave Warden bars the way. Beyond the black arch, the crypt descends.",
  },
  p1_0: {
    id: "p1_0", name: "The Shattered Belfry", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(7, 7), chestLoot: ["swift_ring"], chestSouls: 120 },
      ...scatter(211, ["arch", "pillar", "boulder", "bones"], 10, [P(7, 7)]),
    ],
    groups: [
      grp("g1", P(4, 4), "gargoyle_whelp", "skeleton_archer"),
      grp("g2", P(11, 10), "skeleton_assassin", "skeleton_assassin"),
    ],
    ambient: "The bell fell an age ago. The gargoyles never left the tower's corpse.",
  },
  p0_0: {
    id: "p0_0", name: "World's Edge — North", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(13, 2), chestLoot: ["ember_ore"], chestSouls: 60 },
      { kind: "illusory", pos: P(1, 7) },
      ...scatter(229, OVERWORLD_KINDS, 8, [P(7, 7), P(13, 2), P(1, 7)]),
    ],
    groups: [
      grp("g1", P(6, 6), "hollowed_mage", "wandering_flame"),
      grp("g2", P(10, 10), "tomb_spider", "tomb_spider"),
      grp("g3", P(3, 4), "ash_mage", "ash_mage"),
    ],
    ambient: "The island ends in ragged stone and endless void. Do not trust the edges.",
  },

  // ---------- Row 3 (south): moderate ----------
  p2_3: {
    id: "p2_3", name: "The Drowned Lake", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(2, 2), chestLoot: ["memory_fragment"], chestSouls: 30 },
      ...scatter(241, ["boulder", "boulder", "tree", "bones"], 9, [P(7, 7), P(2, 2)]),
    ],
    groups: [
      grp("g1", P(5, 5), "blighted_toad", "blighted_toad"),
      grp("g2", P(10, 9), "corpse_fly", "plague_rat", "plague_rat"),
    ],
    ambient: "The lake burned dry. Things that drank of it still crawl its cracked bed.",
  },
  p1_3: {
    id: "p1_3", name: "Charcoal Woods", kind: "overworld", tileset: "ash",
    props: scatter(263, ["tree", "tree", "tree", "boulder"], 12, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 6), "rotting_hound", "rotting_hound", "plague_rat"),
      grp("g2", P(11, 5), "cursed_dandelion", "cursed_dandelion"),
    ],
    ambient: "Every trunk is charred hollow. Eyes glitter from the black.",
  },
  p3_3: {
    id: "p3_3", name: "The Pilgrim's Fall", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(4, 11), chestLoot: ["ashen_plate"], chestSouls: 90 },
      ...scatter(281, OVERWORLD_KINDS, 8, [P(7, 7), P(4, 11)]),
    ],
    groups: [
      grp("g1", P(6, 4), "skeleton_archer", "hollow_archer"),
      grp("g2", P(10, 10), "grave_robber"),
    ],
    ambient: "A pilgrim's pack lies split open by the road. Its owner is close — parts of him, anyway.",
  },
  p0_3: {
    id: "p0_3", name: "Wolf's Hollow", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(12, 3), chestLoot: ["memory_fragment"], chestSouls: 30 },
      ...scatter(307, OVERWORLD_KINDS, 9, [P(7, 7), P(12, 3)]),
    ],
    groups: [
      grp("g1", P(5, 7), "rotting_hound", "rotting_hound", "rotting_hound"),
    ],
    ambient: "The pack that hunts here died together. It hunts together still.",
  },
  p4_3: {
    id: "p4_3", name: "The Broken Aqueduct", kind: "overworld", tileset: "ash",
    props: [
      { kind: "illusory", pos: P(13, 7) },
      ...scatter(331, ["arch", "arch", "pillar", "boulder"], 10, [P(7, 7), P(13, 7)]),
    ],
    groups: [
      grp("g1", P(5, 5), "ash_spirit", "ash_spirit"),
      grp("g2", P(10, 9), "skeleton_pikeman", "skeleton_novice"),
    ],
    ambient: "Dry channels of ancient stone stride south on legs of arches.",
  },

  // ---------- Row 4 (far south): starter fields ----------
  p2_4: {
    id: "p2_4", name: "The First Field", kind: "overworld", tileset: "ash",
    props: scatter(353, ["gravestone", "tree", "boulder"], 7, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "frail_hollow"),
      grp("g2", P(10, 8), "frail_hollow", "frail_hollow"),
    ],
    ambient: "Where every ember-bearer takes their first stumbling swing.",
  },
  p1_4: {
    id: "p1_4", name: "Ashen Shallows", kind: "overworld", tileset: "ash",
    props: scatter(373, OVERWORLD_KINDS, 8, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 5), "plague_rat", "plague_rat"),
      grp("g2", P(9, 10), "frail_hollow", "corpse_fly"),
    ],
    ambient: "Shallow drifts of ash swallow the old road south.",
  },
  p3_4: {
    id: "p3_4", name: "The Tithe Barn", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(8, 5), chestLoot: ["old_bone", "iron_shard"], chestSouls: 60 },
      ...scatter(397, ["cart", "boulder", "gravestone"], 8, [P(7, 7), P(8, 5)]),
    ],
    groups: [
      grp("g1", P(5, 9), "corpse_fly", "corpse_fly", "plague_rat"),
    ],
    ambient: "Grain rotted to dust; the tithe was never collected.",
  },
  p0_4: {
    id: "p0_4", name: "World's Edge — South", kind: "overworld", tileset: "ash",
    props: scatter(419, OVERWORLD_KINDS, 8, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "rotting_hound", "frail_hollow"),
    ],
    ambient: "Below the broken cliff there is only void, and the sound of slow breathing.",
  },
  p4_4: {
    id: "p4_4", name: "The Fallen Watchtower", kind: "overworld", tileset: "ash",
    props: [
      { kind: "chest", pos: P(10, 6), chestLoot: ["iron_shard", "iron_shard"], chestSouls: 70 },
      ...scatter(439, ["boulder", "pillar", "bones"], 9, [P(7, 7), P(10, 6)]),
    ],
    groups: [
      grp("g1", P(5, 8), "skeleton_novice", "frail_hollow"),
    ],
    ambient: "The tower watched for something. Whatever it was, it came.",
  },

  // ---------- Crypt of the First King (5 rooms) ----------
  d1: {
    id: "d1", name: "Crypt — The Antechamber", kind: "dungeon", tileset: "crypt",
    exitToOverworld: { pos: P(7, 13), to: "p4_0" },
    dungeonNext: { pos: P(7, 1), to: "d2" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "pillar", pos: P(4, 10) }, { kind: "pillar", pos: P(10, 10) },
      { kind: "brazier", pos: P(2, 2) }, { kind: "brazier", pos: P(12, 2) },
      { kind: "bones", pos: P(6, 8) },
    ],
    groups: [grp("g1", P(7, 5), "skeleton_novice", "skeleton_novice", "skeleton_archer")],
    ambient: "Dust of centuries. The door behind seals; the way is forward.",
  },
  d2: {
    id: "d2", name: "Crypt — Hall of Shields", kind: "dungeon", tileset: "crypt",
    dungeonNext: { pos: P(7, 1), to: "d3" },
    props: [
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "pillar", pos: P(5, 7) }, { kind: "pillar", pos: P(9, 7) },
      { kind: "pillar", pos: P(5, 11) }, { kind: "pillar", pos: P(9, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("g1", P(7, 5), "skeleton_shieldbearer", "skeleton_shieldbearer", "skeleton_pikeman")],
    ambient: "A corridor of rusted walls. Their shields have not lowered in a thousand years.",
  },
  d3: {
    id: "d3", name: "Crypt — The Ambush", kind: "dungeon", tileset: "crypt",
    dungeonNext: { pos: P(7, 1), to: "d4" },
    props: [
      { kind: "gravestone", pos: P(3, 4) }, { kind: "gravestone", pos: P(11, 4) },
      { kind: "bones", pos: P(3, 10) }, { kind: "bones", pos: P(11, 10) },
      { kind: "arch", pos: P(7, 7) },
    ],
    groups: [grp("g1", P(7, 4), "skeleton_sergeant", "skeleton_assassin", "skeleton_assassin", "hollowed_mage")],
    ambient: "The dark here has weight. Something moves between the tombs, unseen.",
  },
  d4: {
    id: "d4", name: "Crypt — The Executioner's Pit", kind: "dungeon", tileset: "crypt",
    dungeonNext: { pos: P(7, 1), to: "d5" },
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "bones", pos: P(5, 9) }, { kind: "bones", pos: P(9, 9) },
      { kind: "brazier", pos: P(7, 12) },
      { kind: "chest", pos: P(13, 13), chestLoot: ["old_bone", "iron_shard", "ember_ore"], chestSouls: 200 },
      { kind: "chest", pos: P(1, 13), chestLoot: ["memory_fragment"], chestSouls: 50 },
    ],
    groups: [grp("g1", P(7, 5), "grave_warden", "rotting_hound", "rotting_hound")],
    ambient: "Old blood blackens the pit floor. The Warden's twin keeps the final vigil.",
  },
  d5: {
    id: "d5", name: "Crypt — Throne of the Hollow King", kind: "dungeon", tileset: "crypt",
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "pillar", pos: P(3, 11) }, { kind: "pillar", pos: P(11, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("boss", P(7, 4), "kardorim")],
    ambient: "He has waited on his throne since the continent fell. He rises.",
  },

  // ---------- Secret pages (behind illusory walls) ----------
  secret_belfry: {
    id: "secret_belfry", name: "The Hidden Reliquary", kind: "dungeon", tileset: "crypt",
    exitToOverworld: { pos: P(7, 13), to: "p0_0" },
    props: [
      { kind: "chest", pos: P(7, 4), chestLoot: ["scholar_ring", "memory_fragment"], chestSouls: 400 },
      { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      { kind: "pillar", pos: P(4, 8) }, { kind: "pillar", pos: P(10, 8) },
    ],
    groups: [grp("g1", P(7, 8), "wandering_flame", "ash_spirit")],
    ambient: "A vault the mapmakers never knew. Someone hid what mattered most.",
  },
  secret_sentinel: {
    id: "secret_sentinel", name: "The Drowned Vigil", kind: "dungeon", tileset: "sunken", zone: 2,
    exitToOverworld: { pos: P(7, 13), to: "p4_3" },
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
      { kind: "chest", pos: P(7, 2), chestLoot: ["sentinel_helm", "ember_ore"], chestSouls: 500 },
    ],
    groups: [grp("boss", P(7, 5), "drowned_sentinel")],
    ambient: "Salt water beads on stone that has never seen the sea. Something keeps its vigil here.",
  },

  // ---------- Zone 2: The Sunken Reach (3x3, lvl 20-26) ----------
  s1_2: {
    id: "s1_2", name: "The Sunken Stair", kind: "overworld", tileset: "sunken", zone: 2,
    bonfire: { pos: P(7, 8), name: "The Sunken Stair" },
    exitToOverworld: { pos: P(7, 13), to: "p2_0" },
    props: [
      { kind: "arch", pos: P(7, 5) },
      { kind: "pillar", pos: P(4, 6) }, { kind: "pillar", pos: P(10, 6) },
      ...scatter(457, ["boulder", "pillar", "bones"], 6, [P(7, 8), P(7, 5), P(7, 13)]),
    ],
    groups: [],
    ambient: "Below the necropolis, the world is drowned. A stair of black coral descends into green light.",
  },
  s0_2: {
    id: "s0_2", name: "The Kelp Fields", kind: "overworld", tileset: "sunken", zone: 2,
    props: scatter(479, ["tree", "boulder", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "drowned_soldier", "corpse_fish"),
      grp("g2", P(10, 9), "corpse_fish", "corpse_fish"),
    ],
    ambient: "Kelp sways in air that moves like water. The drowned tend their old fields still.",
  },
  s2_2: {
    id: "s2_2", name: "The Tidal Graves", kind: "overworld", tileset: "sunken", zone: 2,
    props: [
      { kind: "chest", pos: P(3, 11), chestLoot: ["wraith_shroud"], chestSouls: 250 },
      ...scatter(499, ["gravestone", "boulder", "bones"], 9, [P(7, 7), P(3, 11)]),
    ],
    groups: [
      grp("g1", P(5, 4), "drowned_soldier", "drowned_soldier"),
      grp("g2", P(10, 10), "brine_wraith", "corpse_fish"),
    ],
    ambient: "Graves washed open by a tide that never receded.",
  },
  s1_1: {
    id: "s1_1", name: "The Coral Court", kind: "overworld", tileset: "sunken", zone: 2,
    props: scatter(521, ["pillar", "arch", "boulder"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 6), "tide_crab", "corpse_fish"),
      grp("g2", P(11, 8), "sunken_archer", "drowned_soldier"),
    ],
    ambient: "A royal court grown over in reef. The courtiers bow no longer — they lunge.",
  },
  s0_1: {
    id: "s0_1", name: "The Wraith Shallows", kind: "overworld", tileset: "sunken", zone: 2,
    props: [
      { kind: "chest", pos: P(11, 4), chestLoot: ["ember_ore", "iron_shard"], chestSouls: 200 },
      ...scatter(547, ["boulder", "bones", "tree"], 8, [P(7, 7), P(11, 4)]),
    ],
    groups: [
      grp("g1", P(5, 6), "brine_wraith", "brine_wraith"),
      grp("g2", P(9, 11), "tide_priest", "drowned_soldier"),
    ],
    ambient: "Grief pools here like cold water around the ankles.",
  },
  s2_1: {
    id: "s2_1", name: "The Moray Deep", kind: "overworld", tileset: "sunken", zone: 2,
    props: scatter(569, ["boulder", "boulder", "bones"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "moray_horror", "corpse_fish"),
      grp("g2", P(10, 9), "sunken_archer", "tide_crab"),
    ],
    ambient: "Do not stand near the dark clefts. Distance is a lie the eels tell.",
  },
  s1_0: {
    id: "s1_0", name: "The Golem Reef", kind: "overworld", tileset: "sunken", zone: 2,
    props: [
      { kind: "chest", pos: P(12, 11), chestLoot: ["memory_fragment", "old_bone"], chestSouls: 300 },
      ...scatter(593, ["boulder", "pillar", "arch"], 10, [P(7, 7), P(12, 11)]),
    ],
    groups: [
      grp("g1", P(6, 5), "coral_golem"),
      grp("g2", P(10, 10), "tide_priest", "brine_wraith"),
    ],
    ambient: "The reef stands in ranks, like statues. Some of the statues breathe.",
  },
  s0_0: {
    id: "s0_0", name: "The Ogre's Wallow", kind: "overworld", tileset: "sunken", zone: 2,
    props: scatter(617, ["boulder", "bones", "tree"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "drowned_ogre", "corpse_fish", "corpse_fish"),
    ],
    ambient: "Wallow-pits of black mud. The songs that rise from them are not for the living.",
  },
  s2_0: {
    id: "s2_0", name: "The Abyssal Brink", kind: "overworld", tileset: "sunken", zone: 2,
    props: [
      { kind: "chest", pos: P(7, 3), chestLoot: ["soul_saber"], chestSouls: 600 },
      ...scatter(641, ["pillar", "boulder", "bones"], 8, [P(7, 7), P(7, 3)]),
    ],
    groups: [
      grp("g1", P(5, 5), "drowned_ogre", "tide_priest"),
      grp("g2", P(10, 9), "coral_golem", "brine_wraith"),
    ],
    ambient: "The Reach ends at a cliff of black water, standing like glass. Beyond it — deeper kingdoms.",
  },

  // ==================== Zone 3: The Cinder Marches (g, 5x5, lvl 26-33) ====================
  g4_2: {
    id: "g4_2", name: "The March Gate", kind: "overworld", tileset: "ash", zone: 3,
    bonfire: { pos: P(7, 8), name: "The March Gate" },
    props: [
      { kind: "arch", pos: P(7, 5) }, { kind: "brazier", pos: P(5, 6) }, { kind: "brazier", pos: P(9, 6) },
      ...scatter(701, ["boulder", "bones", "pillar"], 6, [P(7, 8), P(7, 5)]),
    ],
    groups: [],
    ambient: "West of the ash fields the ground glows through its cracks. The air tastes of the forge.",
  },
  g3_2: {
    id: "g3_2", name: "The Smouldering Road", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(709, ["boulder", "bones", "pillar"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "ash_wretch", "ash_wretch"),
      grp("g2", P(10, 9), "cinder_hound", "ash_wretch"),
    ],
    ambient: "The old trade road west, paved now with clinker. Footprints in the ash still smoke.",
  },
  g2_2: {
    id: "g2_2", name: "The Clinker Flats", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(3, 10), chestLoot: ["cinder_ore"], chestSouls: 300 },
      ...scatter(719, ["boulder", "boulder", "bones"], 9, [P(7, 7), P(3, 10)]),
    ],
    groups: [
      grp("g1", P(5, 4), "cinder_hound", "cinder_hound"),
      grp("g2", P(10, 10), "burnt_soldier", "ash_wretch"),
    ],
    ambient: "Fields of fused glass crunch underfoot. Heat shimmers where nothing burns.",
  },
  g1_2: {
    id: "g1_2", name: "The Ashfall Terraces", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(729, ["pillar", "boulder", "bones", "arch"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 6), "ember_priest", "ash_wretch"),
      grp("g2", P(11, 8), "burnt_soldier", "burnt_soldier"),
    ],
    ambient: "Terraced farms drowned in grey snowfall that never melts and never cools.",
  },
  g0_2: {
    id: "g0_2", name: "The Furnace Scarp", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(11, 4), chestLoot: ["cinder_ring"], chestSouls: 500 },
      ...scatter(739, ["boulder", "pillar", "bones"], 9, [P(7, 7), P(11, 4)]),
    ],
    groups: [
      grp("g1", P(5, 5), "slag_golem"),
      grp("g2", P(9, 10), "ember_priest", "cinder_hound"),
    ],
    ambient: "A cliff of cooled iron, taller than any wall men built. The Foundry gnaws at its roots.",
  },
  g4_1: {
    id: "g4_1", name: "The Cindered Orchard", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(749, ["tree", "tree", "boulder", "bones"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "ash_wretch", "ash_wretch", "cinder_hound"),
    ],
    ambient: "Orchard rows of charcoal trees, fruit still hanging — small black suns that shed warmth.",
  },
  g3_1: {
    id: "g3_1", name: "The Slag Fields", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(12, 11), chestLoot: ["cinder_ore", "iron_shard"], chestSouls: 260 },
      ...scatter(759, ["boulder", "boulder", "bones"], 9, [P(7, 7), P(12, 11)]),
    ],
    groups: [
      grp("g1", P(4, 5), "burnt_soldier", "ember_priest"),
      grp("g2", P(10, 9), "magma_leech"),
    ],
    ambient: "Rivers of slag cooled mid-flow, frozen in the shapes of the things they caught.",
  },
  g1_1: {
    id: "g1_1", name: "The Slag Well", kind: "overworld", tileset: "ash", zone: 3,
    bonfire: { pos: P(7, 7), name: "The Slag Well" },
    props: [
      { kind: "arch", pos: P(7, 4) }, { kind: "pillar", pos: P(4, 6) }, { kind: "pillar", pos: P(10, 6) },
      { kind: "chest", pos: P(12, 10), chestLoot: ["foundry_plate"], chestSouls: 400 },
      ...scatter(769, ["boulder", "bones"], 5, [P(7, 7), P(12, 10)]),
    ],
    groups: [
      grp("g1", P(3, 11), "cinder_hound", "ash_wretch"),
    ],
    ambient: "An old well that draws heat instead of water. The flame here burns low and loyal.",
  },
  g2_1: {
    id: "g2_1", name: "The Anvil Yard", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(779, ["boulder", "pillar", "cart", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "forge_revenant", "burnt_soldier"),
      grp("g2", P(10, 8), "slag_golem"),
    ],
    ambient: "A thousand anvils rust in ranks. At night, some of them still ring.",
  },
  g0_1: {
    id: "g0_1", name: "The Leech Pools", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(3, 3), chestLoot: ["memory_fragment", "cinder_ore"], chestSouls: 350 },
      ...scatter(789, ["boulder", "bones"], 8, [P(7, 7), P(3, 3)]),
    ],
    groups: [
      grp("g1", P(6, 6), "magma_leech", "magma_leech"),
      grp("g2", P(10, 10), "cinder_hound", "cinder_hound"),
    ],
    ambient: "Pools of slow iron, skinned with black. Do not stand near the bright cracks.",
  },
  g4_0: {
    id: "g4_0", name: "The Charred Watch", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(799, ["pillar", "arch", "boulder", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "burnt_soldier", "burnt_soldier", "ember_priest"),
    ],
    ambient: "A watchtower burnt from the inside out. Its garrison never abandoned their posts.",
  },
  g3_0: {
    id: "g3_0", name: "The Ember Steps", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(11, 3), chestLoot: ["scholar_vestment"], chestSouls: 450 },
      ...scatter(809, ["boulder", "pillar", "bones"], 9, [P(7, 7), P(11, 3)]),
    ],
    groups: [
      grp("g1", P(5, 5), "pyre_daemon"),
      grp("g2", P(10, 10), "forge_revenant", "ash_wretch"),
    ],
    ambient: "Stairs cut for something with a longer stride than men. They climb toward the broken peaks.",
  },
  g2_0: {
    id: "g2_0", name: "The Ashen Pass", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(819, ["boulder", "boulder", "pillar"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 5), "pyre_daemon", "cinder_hound"),
      grp("g2", P(10, 9), "slag_golem", "ember_priest"),
    ],
    ambient: "The pass north climbs out of the heat into thinner, colder dark. Wind sings through broken stone.",
  },
  g1_0: {
    id: "g1_0", name: "The Cinder Barrows", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(12, 12), chestLoot: ["cinder_ore", "cinder_ore"], chestSouls: 380 },
      ...scatter(829, ["gravestone", "gravestone", "boulder"], 10, [P(7, 7), P(12, 12)]),
    ],
    groups: [
      grp("g1", P(5, 6), "forge_revenant", "forge_revenant"),
      grp("g2", P(10, 4), "ember_priest", "burnt_soldier"),
    ],
    ambient: "Burial mounds of the smith-clans. They were buried with their hammers. They kept them.",
  },
  g0_0: {
    id: "g0_0", name: "The Foundry Gate", kind: "overworld", tileset: "ash", zone: 3,
    dungeonEntrance: { pos: P(7, 3), to: "f1" },
    props: [
      { kind: "arch", pos: P(7, 2) },
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      ...scatter(839, ["boulder", "bones"], 6, [P(7, 3), P(7, 7)]),
    ],
    groups: [
      grp("g1", P(4, 9), "slag_golem", "forge_revenant"),
    ],
    ambient: "The Ember Foundry's black gate stands open, breathing slow heat like a sleeping animal.",
  },
  g4_3: {
    id: "g4_3", name: "The Grey Waste", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(849, ["boulder", "bones", "gravestone"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "ash_wretch", "ash_wretch", "ash_wretch"),
    ],
    ambient: "Ash deep as snowdrifts. Things move beneath the surface like fish under ice.",
  },
  g3_3: {
    id: "g3_3", name: "The Broken Bellows", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(4, 11), chestLoot: ["iron_shard", "cinder_ore"], chestSouls: 280 },
      ...scatter(859, ["cart", "boulder", "pillar"], 9, [P(7, 7), P(4, 11)]),
    ],
    groups: [
      grp("g1", P(6, 4), "cinder_hound", "cinder_hound", "cinder_hound"),
    ],
    ambient: "A bellows the size of a chapel, torn open. The wind through it still sighs warm.",
  },
  g2_3: {
    id: "g2_3", name: "The Soot Marsh", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(869, ["tree", "boulder", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "magma_leech", "ash_wretch"),
      grp("g2", P(10, 9), "ember_priest"),
    ],
    ambient: "Where the marches drown in wet soot. Every pool is warm; some of them are hungry.",
  },
  g1_3: {
    id: "g1_3", name: "The Pilgrim Kilns", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(10, 6), chestLoot: ["memory_fragment"], chestSouls: 200 },
      ...scatter(879, ["pillar", "arch", "boulder"], 9, [P(7, 7), P(10, 6)]),
    ],
    groups: [
      grp("g1", P(5, 9), "burnt_soldier", "ash_wretch"),
    ],
    ambient: "Kilns where pilgrims once fired votive clay. The offerings inside have fused to glass.",
  },
  g0_3: {
    id: "g0_3", name: "The Tyrant's Shadow", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(889, ["boulder", "pillar", "bones"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "slag_golem", "cinder_hound"),
      grp("g2", P(10, 9), "forge_revenant"),
    ],
    ambient: "The Foundry's chimney throws its shadow here at dawn — a sundial that counts only bad hours.",
  },
  g4_4: {
    id: "g4_4", name: "The Ashwood Fringe", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(899, ["tree", "tree", "boulder"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "ash_wretch", "cinder_hound"),
    ],
    ambient: "The last trees before the burn. Their sap runs black and slow as pitch.",
  },
  g3_4: {
    id: "g3_4", name: "The Collier's Rest", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(8, 5), chestLoot: ["old_bone", "cinder_ore"], chestSouls: 240 },
      ...scatter(909, ["cart", "boulder", "bones"], 8, [P(7, 7), P(8, 5)]),
    ],
    groups: [
      grp("g1", P(5, 9), "ash_wretch", "ash_wretch"),
    ],
    ambient: "A charcoal-burner's camp, cold for a century. His stack still smoulders.",
  },
  g2_4: {
    id: "g2_4", name: "The Ember Fen", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(919, ["tree", "boulder", "bones"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 5), "magma_leech", "cinder_hound"),
    ],
    ambient: "Warm mud and drowned embers. The fen glows faintly from below after dark.",
  },
  g1_4: {
    id: "g1_4", name: "The Southern Clinker", kind: "overworld", tileset: "ash", zone: 3,
    props: scatter(929, ["boulder", "boulder", "bones"], 9, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "burnt_soldier", "ash_wretch"),
      grp("g2", P(10, 8), "ember_priest"),
    ],
    ambient: "Clinker plains running south to the fog. Nothing grows; several things graze.",
  },
  g0_4: {
    id: "g0_4", name: "World's Edge — The Burn", kind: "overworld", tileset: "ash", zone: 3,
    props: [
      { kind: "chest", pos: P(13, 2), chestLoot: ["gale_ring"], chestSouls: 420 },
      ...scatter(939, ["boulder", "pillar", "bones"], 8, [P(7, 7), P(13, 2)]),
    ],
    groups: [
      grp("g1", P(6, 6), "pyre_daemon", "ember_priest"),
    ],
    ambient: "The marches end in a cliff of glass. Far below, the void reflects the glow like a black mirror.",
  },

  // ==================== Dungeon A: The Ember Foundry (f1-f5, lvl 30-34) ====================
  f1: {
    id: "f1", name: "Foundry — The Coal Gallery", kind: "dungeon", tileset: "crypt", zone: 3,
    exitToOverworld: { pos: P(7, 13), to: "g0_0" },
    dungeonNext: { pos: P(7, 1), to: "f2" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "brazier", pos: P(2, 2) }, { kind: "brazier", pos: P(12, 2) },
      { kind: "brazier", pos: P(2, 12) }, { kind: "brazier", pos: P(12, 12) },
      { kind: "cart", pos: P(5, 9) },
    ],
    groups: [grp("g1", P(7, 5), "ash_wretch", "ash_wretch", "cinder_hound")],
    ambient: "Coal bunkers stacked to the vaulting. The Foundry eats a hill a year, and it is never full.",
  },
  f2: {
    id: "f2", name: "Foundry — The Casting Hall", kind: "dungeon", tileset: "crypt", zone: 3,
    dungeonNext: { pos: P(7, 1), to: "f3" },
    props: [
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "pillar", pos: P(5, 11) }, { kind: "pillar", pos: P(9, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("g1", P(7, 5), "burnt_soldier", "burnt_soldier", "ember_priest")],
    ambient: "Moulds for bells, blades, and things with no names line the hall. Some moulds are man-shaped.",
  },
  f3: {
    id: "f3", name: "Foundry — The Bonfire Vault", kind: "dungeon", tileset: "crypt", zone: 3,
    bonfire: { pos: P(7, 7), name: "The Bonfire Vault" },
    dungeonNext: { pos: P(7, 1), to: "f4" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "brazier", pos: P(4, 10) }, { kind: "brazier", pos: P(10, 10) },
      { kind: "chest", pos: P(12, 12), chestLoot: ["cinder_ore", "cinder_ore"], chestSouls: 300 },
    ],
    groups: [],
    ambient: "A vault where the Foundry's first flame is kept. It knows you. It has always known you.",
  },
  f4: {
    id: "f4", name: "Foundry — The Slag Run", kind: "dungeon", tileset: "crypt", zone: 3,
    dungeonNext: { pos: P(7, 1), to: "f5" },
    props: [
      { kind: "boulder", pos: P(3, 4) }, { kind: "boulder", pos: P(11, 4) },
      { kind: "boulder", pos: P(3, 10) }, { kind: "boulder", pos: P(11, 10) },
      { kind: "brazier", pos: P(7, 12) },
      { kind: "chest", pos: P(1, 13), chestLoot: ["memory_fragment", "cinder_ore"], chestSouls: 350 },
    ],
    groups: [grp("g1", P(7, 5), "slag_golem", "magma_leech", "forge_revenant")],
    ambient: "The channel where slag runs to the pits. The grating underfoot is warm, and it moves.",
  },
  f5: {
    id: "f5", name: "Foundry — The Tyrant's Forge", kind: "dungeon", tileset: "crypt", zone: 3,
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "pillar", pos: P(3, 11) }, { kind: "pillar", pos: P(11, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("boss", P(7, 4), "vulkas")],
    ambient: "The great forge has never gone cold. Its master has never stopped working. He turns.",
  },

  // ==================== Zone 4: The Pale Marsh (m, 4x4, lvl 32-38) ====================
  m3_1: {
    id: "m3_1", name: "The Fen Gate", kind: "overworld", tileset: "sunken", zone: 4,
    bonfire: { pos: P(7, 7), name: "The Fen Gate" },
    props: [
      { kind: "arch", pos: P(7, 4) }, { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      ...scatter(1001, ["tree", "boulder", "bones"], 6, [P(7, 7), P(7, 4)]),
    ],
    groups: [],
    ambient: "The fog opens just wide enough to let you regret entering. The marsh drinks all echoes.",
  },
  m2_1: {
    id: "m2_1", name: "The Drowned Causeway", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1009, ["tree", "boulder", "pillar", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "marsh_ghoul", "marsh_ghoul"),
      grp("g2", P(10, 9), "rat_king"),
    ],
    ambient: "An old causeway of sunken logs. Each step answers with a slow, deliberate bubble.",
  },
  m1_1: {
    id: "m1_1", name: "The Hag's Acre", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "chest", pos: P(3, 10), chestLoot: ["grave_silk"], chestSouls: 500 },
      ...scatter(1019, ["tree", "tree", "boulder"], 10, [P(7, 7), P(3, 10)]),
    ],
    groups: [
      grp("g1", P(5, 4), "bog_witch", "marsh_ghoul"),
      grp("g2", P(10, 10), "plague_bearer"),
    ],
    ambient: "Fence posts of leg bones mark a field no one farms. Something keeps the fence mended.",
  },
  m0_1: {
    id: "m0_1", name: "The Weeping Shallows", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1029, ["tree", "boulder", "bones", "gravestone"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "weeping_statue"),
      grp("g2", P(10, 5), "marsh_ghoul", "rat_king"),
    ],
    ambient: "Stone mourners stand waist-deep in the shallows, facing the catacombs. Their tears are real.",
  },
  m3_0: {
    id: "m3_0", name: "The Rotwood", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1039, ["tree", "tree", "tree", "boulder"], 12, [P(7, 7)]),
    groups: [
      grp("g1", P(4, 6), "rat_king", "marsh_ghoul"),
      grp("g2", P(11, 5), "catacomb_lurker"),
    ],
    ambient: "Trees soft as drowned flesh. The bark peels in strips that are better left unexamined.",
  },
  m2_0: {
    id: "m2_0", name: "The Midden Pools", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "chest", pos: P(11, 3), chestLoot: ["marsh_piercer"], chestSouls: 600 },
      ...scatter(1049, ["boulder", "tree", "bones"], 9, [P(7, 7), P(11, 3)]),
    ],
    groups: [
      grp("g1", P(5, 5), "plague_bearer", "marsh_ghoul"),
      grp("g2", P(9, 10), "mire_serpent"),
    ],
    ambient: "The marsh digests what it catches slowly. These pools are where it keeps its meals.",
  },
  m1_0: {
    id: "m1_0", name: "The Sunken Chapel", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "arch", pos: P(7, 5) }, { kind: "pillar", pos: P(5, 6) }, { kind: "pillar", pos: P(9, 6) },
      { kind: "chest", pos: P(7, 3), chestLoot: ["tear_ring"], chestSouls: 550 },
      ...scatter(1059, ["gravestone", "bones", "tree"], 8, [P(7, 7), P(7, 3), P(7, 5)]),
    ],
    groups: [
      grp("g1", P(5, 9), "bog_witch", "weeping_statue"),
    ],
    ambient: "A chapel sunk to its windows. The congregation never left; they float in the nave, face down.",
  },
  m0_0: {
    id: "m0_0", name: "The Serpent's Bend", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1069, ["tree", "boulder", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "mire_serpent", "mire_serpent"),
    ],
    ambient: "The channel doubles back on itself like something coiling. Perhaps it is.",
  },
  m3_2: {
    id: "m3_2", name: "The Pilgrim Fen", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "chest", pos: P(12, 12), chestLoot: ["memory_fragment", "grave_silk"], chestSouls: 400 },
      ...scatter(1079, ["tree", "gravestone", "boulder"], 9, [P(7, 7), P(12, 12)]),
    ],
    groups: [
      grp("g1", P(5, 5), "marsh_ghoul", "marsh_ghoul", "rat_king"),
    ],
    ambient: "Staffs of drowned pilgrims mark the old fen road. Their owners lie beneath, pointing the way.",
  },
  m2_2: {
    id: "m2_2", name: "The Lantern Mire", kind: "overworld", tileset: "sunken", zone: 4,
    bonfire: { pos: P(7, 7), name: "The Lantern Mire" },
    props: [
      { kind: "brazier", pos: P(4, 5) }, { kind: "brazier", pos: P(10, 5) },
      ...scatter(1089, ["tree", "boulder", "bones"], 7, [P(7, 7)]),
    ],
    groups: [
      grp("g1", P(3, 11), "fen_stalker"),
    ],
    ambient: "Someone keeps the lanterns lit along the mire path. No one has ever seen them do it.",
  },
  m1_2: {
    id: "m1_2", name: "The Grief Gardens", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1099, ["gravestone", "gravestone", "tree", "pillar"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "weeping_statue", "marsh_ghoul"),
      grp("g2", P(10, 9), "bog_witch"),
    ],
    ambient: "Grave-flowers bloom grey here, watered on schedule. The gardener wears a veil.",
  },
  m0_2: {
    id: "m0_2", name: "The Lurker's Warren", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "illusory", pos: P(2, 7) },
      ...scatter(1109, ["boulder", "tree", "bones"], 9, [P(7, 7), P(2, 7)]),
    ],
    groups: [
      grp("g1", P(5, 5), "catacomb_lurker", "catacomb_lurker"),
      grp("g2", P(10, 10), "rat_king", "marsh_ghoul"),
    ],
    ambient: "Burrow mouths gape in the peat banks. Count them on your way in; recount on your way out.",
  },
  m3_3: {
    id: "m3_3", name: "The Fenland Verge", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1119, ["tree", "tree", "boulder"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "marsh_ghoul", "rat_king"),
    ],
    ambient: "The marsh's southern hem, stitched with dead reeds taller than men.",
  },
  m2_3: {
    id: "m2_3", name: "The Stalker's Blind", kind: "overworld", tileset: "sunken", zone: 4,
    props: [
      { kind: "chest", pos: P(4, 11), chestLoot: ["grave_silk", "iron_shard"], chestSouls: 380 },
      ...scatter(1129, ["tree", "boulder", "bones"], 9, [P(7, 7), P(4, 11)]),
    ],
    groups: [
      grp("g1", P(6, 4), "fen_stalker", "marsh_ghoul"),
    ],
    ambient: "Hunting blinds of woven reed stand over the water. The arrows come from none of them.",
  },
  m1_3: {
    id: "m1_3", name: "The Plague Orchard", kind: "overworld", tileset: "sunken", zone: 4,
    props: scatter(1139, ["tree", "tree", "gravestone"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "plague_bearer", "plague_bearer"),
      grp("g2", P(10, 5), "rat_king"),
    ],
    ambient: "Fruit trees fat with wet rot. The windfalls move when the wind does not blow.",
  },
  m0_3: {
    id: "m0_3", name: "The Catacomb Door", kind: "overworld", tileset: "sunken", zone: 4,
    dungeonEntrance: { pos: P(7, 3), to: "w1" },
    props: [
      { kind: "arch", pos: P(7, 2) },
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      ...scatter(1149, ["gravestone", "bones"], 6, [P(7, 3), P(7, 7)]),
    ],
    groups: [
      grp("g1", P(4, 9), "weeping_statue", "bog_witch"),
    ],
    ambient: "Stairs descend below the waterline, yet the way is dry. The catacombs are weeping upward.",
  },

  // ==================== Dungeon B: The Weeping Catacombs (w1-w5, lvl 36-40) ====================
  w1: {
    id: "w1", name: "Catacombs — The Flooded Nave", kind: "dungeon", tileset: "sunken", zone: 4,
    exitToOverworld: { pos: P(7, 13), to: "m0_3" },
    dungeonNext: { pos: P(7, 1), to: "w2" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "brazier", pos: P(2, 2) }, { kind: "brazier", pos: P(12, 2) },
      { kind: "gravestone", pos: P(3, 9) }, { kind: "gravestone", pos: P(11, 9) },
    ],
    groups: [grp("g1", P(7, 5), "marsh_ghoul", "marsh_ghoul", "rat_king")],
    ambient: "Water sheets down the walls in steady grief. The tombs here are labelled in a drowned tongue.",
  },
  w2: {
    id: "w2", name: "Catacombs — The Ossuary of Tears", kind: "dungeon", tileset: "sunken", zone: 4,
    dungeonNext: { pos: P(7, 1), to: "w3" },
    props: [
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "bones", pos: P(3, 6) }, { kind: "bones", pos: P(11, 6) },
      { kind: "bones", pos: P(3, 10) }, { kind: "bones", pos: P(11, 10) },
    ],
    groups: [grp("g1", P(7, 5), "catacomb_lurker", "plague_bearer")],
    ambient: "Skulls stacked in weeping alcoves, each cheek grooved by centuries of salt water.",
  },
  w3: {
    id: "w3", name: "Catacombs — The Candle Crypt", kind: "dungeon", tileset: "sunken", zone: 4,
    bonfire: { pos: P(7, 7), name: "The Candle Crypt" },
    dungeonNext: { pos: P(7, 1), to: "w4" },
    props: [
      { kind: "brazier", pos: P(4, 4) }, { kind: "brazier", pos: P(10, 4) },
      { kind: "brazier", pos: P(4, 10) }, { kind: "brazier", pos: P(10, 10) },
      { kind: "chest", pos: P(12, 12), chestLoot: ["grave_silk", "grave_silk"], chestSouls: 450 },
    ],
    groups: [],
    ambient: "A crypt of ten thousand candles, all burning, none consumed. The flame here does not judge.",
  },
  w4: {
    id: "w4", name: "Catacombs — The Ghoul Warrens", kind: "dungeon", tileset: "sunken", zone: 4,
    dungeonNext: { pos: P(7, 1), to: "w5" },
    props: [
      { kind: "boulder", pos: P(3, 4) }, { kind: "boulder", pos: P(11, 4) },
      { kind: "bones", pos: P(5, 9) }, { kind: "bones", pos: P(9, 9) },
      { kind: "chest", pos: P(1, 13), chestLoot: ["memory_fragment", "grave_silk"], chestSouls: 500 },
    ],
    groups: [grp("g1", P(7, 5), "weeping_statue", "bog_witch", "marsh_ghoul")],
    ambient: "The walls are honeycombed with grave-shafts. Wet breathing echoes from most of them.",
  },
  w5: {
    id: "w5", name: "Catacombs — The Matriarch's Vigil", kind: "dungeon", tileset: "sunken", zone: 4,
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "pillar", pos: P(3, 11) }, { kind: "pillar", pos: P(11, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("boss", P(7, 4), "morvane")],
    ambient: "She has counted every tomb and wept for each. She rises, arms opening — all six of them.",
  },

  // ==================== Zone 5: The Shattered Peaks (k, 4x4, lvl 40-46) ====================
  k1_3: {
    id: "k1_3", name: "The Broken Stair", kind: "overworld", tileset: "crypt", zone: 5,
    bonfire: { pos: P(7, 8), name: "The Broken Stair" },
    props: [
      { kind: "arch", pos: P(7, 5) }, { kind: "pillar", pos: P(5, 6) }, { kind: "pillar", pos: P(9, 6) },
      ...scatter(1201, ["boulder", "pillar", "bones"], 6, [P(7, 8), P(7, 5)]),
    ],
    groups: [],
    ambient: "A stair meant for processions climbs into cloud. The Choir went up singing; the song came down alone.",
  },
  k0_3: {
    id: "k0_3", name: "The Toppled Colossus", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "chest", pos: P(3, 10), chestLoot: ["storm_crystal"], chestSouls: 700 },
      ...scatter(1209, ["boulder", "boulder", "pillar", "bones"], 10, [P(7, 7), P(3, 10)]),
    ],
    groups: [
      grp("g1", P(5, 5), "frost_soldier", "frost_soldier"),
    ],
    ambient: "A statue tall as a hill lies in pieces across the vale. Its stone face is still singing.",
  },
  k2_3: {
    id: "k2_3", name: "The Icefall Terraces", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1219, ["boulder", "pillar", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "frost_soldier", "spire_knight"),
      grp("g2", P(10, 9), "storm_gargoyle"),
    ],
    ambient: "Waterfalls frozen mid-leap hang from the terraces like glass banners.",
  },
  k3_3: {
    id: "k3_3", name: "The Pilgrim's Gasp", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1229, ["boulder", "gravestone", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(6, 6), "frost_soldier", "frost_soldier", "frost_soldier"),
    ],
    ambient: "The thin air ends prayers early here. Cairns of failed pilgrims line the ledge.",
  },
  k1_2: {
    id: "k1_2", name: "The Windscored Court", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "chest", pos: P(11, 4), chestLoot: ["wyvern_helm"], chestSouls: 800 },
      ...scatter(1239, ["pillar", "arch", "boulder"], 10, [P(7, 7), P(11, 4)]),
    ],
    groups: [
      grp("g1", P(5, 5), "spire_knight", "frost_soldier"),
      grp("g2", P(10, 9), "wind_reaper"),
    ],
    ambient: "A courtyard scoured to mirror-smoothness. The wind here has opinions, and claws.",
  },
  k0_2: {
    id: "k0_2", name: "The Gargoyle Roosts", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1249, ["boulder", "pillar", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "storm_gargoyle", "storm_gargoyle"),
    ],
    ambient: "Every ledge wears a crown of crouched stone shapes. Count them twice; the count will differ.",
  },
  k2_2: {
    id: "k2_2", name: "The Hymn Hollow", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "illusory", pos: P(13, 7) },
      ...scatter(1259, ["pillar", "boulder", "gravestone"], 9, [P(7, 7), P(13, 7)]),
    ],
    groups: [
      grp("g1", P(5, 5), "hollow_cantor", "frost_soldier"),
      grp("g2", P(10, 9), "wind_reaper"),
    ],
    ambient: "The hollow holds the Choir's last chord like a bowl holds water. Standing in it aches.",
  },
  k3_2: {
    id: "k3_2", name: "The Shattered Span", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1269, ["boulder", "arch", "bones"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 6), "spire_knight", "storm_gargoyle"),
    ],
    ambient: "A bridge to nowhere now — its far end fell with the mountain's shoulder an age ago.",
  },
  k1_1: {
    id: "k1_1", name: "The Choir Steps", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "chest", pos: P(12, 11), chestLoot: ["storm_crystal", "storm_crystal"], chestSouls: 750 },
      ...scatter(1279, ["pillar", "pillar", "boulder"], 9, [P(7, 7), P(12, 11)]),
    ],
    groups: [
      grp("g1", P(4, 5), "hollow_cantor", "spire_knight"),
      grp("g2", P(10, 9), "choir_sentinel"),
    ],
    ambient: "Each step is carved with a line of the Great Hymn. The higher you climb, the darker the verses.",
  },
  k2_1: {
    id: "k2_1", name: "The Silent Belfry", kind: "overworld", tileset: "crypt", zone: 5,
    bonfire: { pos: P(7, 7), name: "The Silent Belfry" },
    props: [
      { kind: "arch", pos: P(7, 4) }, { kind: "brazier", pos: P(4, 6) }, { kind: "brazier", pos: P(10, 6) },
      ...scatter(1289, ["pillar", "boulder"], 6, [P(7, 7), P(7, 4)]),
    ],
    groups: [
      grp("g1", P(3, 11), "wind_reaper"),
    ],
    ambient: "The great bell lies in the nave it fell through. The flame beside it burns without flickering — the only stillness on the mountain.",
  },
  k0_1: {
    id: "k0_1", name: "The Reaper's Gallery", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1299, ["pillar", "arch", "boulder", "bones"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "wind_reaper", "wind_reaper"),
      grp("g2", P(10, 10), "frost_soldier"),
    ],
    ambient: "A cloister walk open to the sky. The wind moves through it in long, deliberate strokes.",
  },
  k3_1: {
    id: "k3_1", name: "The Wyvern Scar", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "chest", pos: P(3, 3), chestLoot: ["stormwood_bow"], chestSouls: 900 },
      ...scatter(1309, ["boulder", "boulder", "bones"], 9, [P(7, 7), P(3, 3)]),
    ],
    groups: [
      grp("g1", P(6, 6), "peak_wyvern"),
    ],
    ambient: "A gouge torn from the mountainside, floored with cracked scales and the bones of bold climbers.",
  },
  k1_0: {
    id: "k1_0", name: "The Last Procession", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1319, ["gravestone", "gravestone", "pillar", "bones"], 11, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "choir_sentinel", "hollow_cantor"),
      grp("g2", P(10, 9), "spire_knight"),
    ],
    ambient: "Statues of the Choir's final procession line the road — or they were statues, once.",
  },
  k0_0: {
    id: "k0_0", name: "World's Edge — The Sky Wound", kind: "overworld", tileset: "crypt", zone: 5,
    props: [
      { kind: "chest", pos: P(13, 2), chestLoot: ["cantor_seal"], chestSouls: 1000 },
      ...scatter(1329, ["boulder", "pillar", "bones"], 8, [P(7, 7), P(13, 2)]),
    ],
    groups: [
      grp("g1", P(6, 6), "peak_wyvern", "storm_gargoyle"),
    ],
    ambient: "Here the mountain simply stops, sheared clean. Above the void, the sky is torn and slowly bleeding light.",
  },
  k2_0: {
    id: "k2_0", name: "The Cantor's Approach", kind: "overworld", tileset: "crypt", zone: 5,
    props: scatter(1339, ["pillar", "arch", "gravestone"], 10, [P(7, 7)]),
    groups: [
      grp("g1", P(5, 5), "choir_sentinel", "wind_reaper"),
      grp("g2", P(10, 9), "hollow_cantor", "frost_soldier"),
    ],
    ambient: "The Spire's shadow falls across the approach like a raised baton. The mountain holds its breath.",
  },
  k3_0: {
    id: "k3_0", name: "The Spire Gate", kind: "overworld", tileset: "crypt", zone: 5,
    dungeonEntrance: { pos: P(7, 3), to: "c1" },
    props: [
      { kind: "arch", pos: P(7, 2) },
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "brazier", pos: P(5, 5) }, { kind: "brazier", pos: P(9, 5) },
      ...scatter(1349, ["boulder", "bones"], 6, [P(7, 3), P(7, 7)]),
    ],
    groups: [
      grp("g1", P(4, 9), "choir_sentinel", "spire_knight"),
    ],
    ambient: "The Spire of the Last Choir needles into the torn sky. From high above: one voice, still singing.",
  },

  // ==================== Dungeon C: The Spire of the Last Choir (c1-c5, lvl 42-46) ====================
  c1: {
    id: "c1", name: "Spire — The Nave of Echoes", kind: "dungeon", tileset: "crypt", zone: 5,
    exitToOverworld: { pos: P(7, 13), to: "k3_0" },
    dungeonNext: { pos: P(7, 1), to: "c2" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "pillar", pos: P(4, 10) }, { kind: "pillar", pos: P(10, 10) },
      { kind: "brazier", pos: P(2, 2) }, { kind: "brazier", pos: P(12, 2) },
    ],
    groups: [grp("g1", P(7, 5), "spire_knight", "frost_soldier", "frost_soldier")],
    ambient: "Your footsteps return to you in four-part harmony. The Spire is rehearsing you.",
  },
  c2: {
    id: "c2", name: "Spire — The Organ Loft", kind: "dungeon", tileset: "crypt", zone: 5,
    dungeonNext: { pos: P(7, 1), to: "c3" },
    props: [
      { kind: "pillar", pos: P(5, 3) }, { kind: "pillar", pos: P(9, 3) },
      { kind: "arch", pos: P(7, 12) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("g1", P(7, 5), "hollow_cantor", "storm_gargoyle")],
    ambient: "Pipes of glacial brass climb out of sight. Wind plays them softly, badly, without pause.",
  },
  c3: {
    id: "c3", name: "Spire — The Choristry", kind: "dungeon", tileset: "crypt", zone: 5,
    bonfire: { pos: P(7, 7), name: "The Choristry" },
    dungeonNext: { pos: P(7, 1), to: "c4" },
    props: [
      { kind: "pillar", pos: P(4, 4) }, { kind: "pillar", pos: P(10, 4) },
      { kind: "brazier", pos: P(4, 10) }, { kind: "brazier", pos: P(10, 10) },
      { kind: "chest", pos: P(12, 12), chestLoot: ["storm_crystal", "storm_crystal"], chestSouls: 600 },
    ],
    groups: [],
    ambient: "Robes hang in ordered rows, waiting for a service that ended the world ago. The flame hums along.",
  },
  c4: {
    id: "c4", name: "Spire — The Bell Gallery", kind: "dungeon", tileset: "crypt", zone: 5,
    dungeonNext: { pos: P(7, 1), to: "c5" },
    props: [
      { kind: "boulder", pos: P(3, 4) }, { kind: "boulder", pos: P(11, 4) },
      { kind: "arch", pos: P(7, 8) },
      { kind: "chest", pos: P(1, 13), chestLoot: ["memory_fragment", "storm_crystal"], chestSouls: 700 },
    ],
    groups: [grp("g1", P(7, 5), "choir_sentinel", "wind_reaper", "hollow_cantor")],
    ambient: "Nine bells hang silent overhead. The dust beneath each one is disturbed in a perfect circle.",
  },
  c5: {
    id: "c5", name: "Spire — The Last Choirloft", kind: "dungeon", tileset: "crypt", zone: 5,
    props: [
      { kind: "pillar", pos: P(3, 3) }, { kind: "pillar", pos: P(11, 3) },
      { kind: "pillar", pos: P(3, 11) }, { kind: "pillar", pos: P(11, 11) },
      { kind: "brazier", pos: P(2, 7) }, { kind: "brazier", pos: P(12, 7) },
    ],
    groups: [grp("boss", P(7, 4), "aurelion")],
    ambient: "At the Spire's crown, one figure still conducts the absent Choir. He finishes the phrase, and turns.",
  },
};

/** overworld adjacency: page id for a direction, or null. Handles zones by prefix with per-zone grid size. */
export function neighborPage(pageId: string, dir: "N" | "S" | "E" | "W"): string | null {
  const m = pageId.match(/^([psgmk])(\d)_(\d)$/);
  if (!m) return null;
  const zone = m[1];
  let x = parseInt(m[2]);
  let y = parseInt(m[3]);
  if (dir === "N") y -= 1;
  if (dir === "S") y += 1;
  if (dir === "W") x -= 1;
  if (dir === "E") x += 1;
  const SIZES: Record<string, [number, number]> = { p: [WORLD_W, WORLD_H], s: [3, 3], g: [5, 5], m: [4, 4], k: [4, 4] };
  const [w, h] = SIZES[zone] ?? [WORLD_W, WORLD_H];
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  const id = `${zone}${x}_${y}`;
  return PAGES[id] ? id : null;
}

/** Zone-2 entrance: walking off the NORTH edge of p2_0 descends to the Sunken Reach (needs Kardorim defeated). */
export const ZONE2_ENTRY = { fromPage: "p2_0", toPage: "s1_2", backPos: { x: 7, y: 12 } };

/** Cross-zone edge gates: walking off `dir` edge of fromPage crosses into toPage (if `flag` on save is true). */
export interface ZoneGate {
  fromPage: string;
  dir: "N" | "S" | "E" | "W";
  toPage: string;
  backDir: "N" | "S" | "E" | "W";
  flag: "bossDefeated" | "sentinelDefeated" | "vulkasDefeated" | "morvaneDefeated";
  lockedMsg: string;
  zoneName: string;
}
export const ZONE_GATES: ZoneGate[] = [
  {
    fromPage: "p0_2", dir: "W", toPage: "g4_2", backDir: "E",
    flag: "sentinelDefeated",
    lockedMsg: "A wall of heat-haze bars the west. While the Drowned Sentinel keeps its vigil, the marches refuse you.",
    zoneName: "The Cinder Marches",
  },
  {
    fromPage: "s0_2", dir: "W", toPage: "m3_1", backDir: "E",
    flag: "vulkasDefeated",
    lockedMsg: "Pale fog stands like a door in the kelp. It will not part while the Forge Tyrant draws breath.",
    zoneName: "The Pale Marsh",
  },
  {
    fromPage: "g2_0", dir: "N", toPage: "k1_3", backDir: "S",
    flag: "morvaneDefeated",
    lockedMsg: "The pass north is choked with weeping fog. It will not lift while the Matriarch grieves below.",
    zoneName: "The Shattered Peaks",
  },
];

/** Illusory wall secrets: pageId:x,y → destination secret page. */
export const ILLUSORY_SECRETS: Record<string, { to: string; spawn: Vec2 }> = {
  "p0_0:1,7": { to: "secret_belfry", spawn: { x: 7, y: 12 } },
  "p4_3:13,7": { to: "secret_sentinel", spawn: { x: 7, y: 12 } },
};

export const START_PAGE = "p2_2";
export const START_POS: Vec2 = { x: 7, y: 9 };
