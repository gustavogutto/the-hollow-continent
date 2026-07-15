/* Ashen Gothic — 20 tutorial mobs (lvl 1-20) + Grave Warden + Kardorim + Ash Spirit summon.
 * Sprites come from kit sheets (3x3 grids) or standalone images. */
import type { MobDef } from "../types";

const BEASTS = "/manus-storage/hollow_kit_beasts_bcafc41d.png";
const SKELS = "/manus-storage/hollow_kit_skels_e7ca2af2.png";
const SKEL_WARRIOR = "/manus-storage/hollow_skeleton_abf9379b.png";
const WARDEN = "/manus-storage/hollow_warden_d6d4b096.png";
const KARDORIM = "/manus-storage/hollow_kardorim_e9bc405c.png";
const SUNKEN = "/manus-storage/hollow_kit_sunken_aade1197.png";
const SENTINEL = "/manus-storage/hollow_sentinel_33786f0e.png";
const CINDER = "/manus-storage/kit_cinder_c48c8727.png";
const MARSH = "/manus-storage/kit_marsh2_62d52528.png";
const PEAKS = "/manus-storage/kit_peaks_05d3e9d4.png";
const VULKAS = "/manus-storage/boss_vulkas_4ac9d6fa.png";
const MORVANE = "/manus-storage/boss_morvane_444489eb.png";
const AURELION = "/manus-storage/boss_aurelion_9e537026.png";

/** Ids that trigger cinematic boss-fight treatment (intro, boss HP bar, permanence). */
export const BOSS_IDS = new Set(["kardorim", "drowned_sentinel", "vulkas", "morvane", "aurelion"]);

export const MOBS: Record<string, MobDef> = {
  frail_hollow: {
    id: "frail_hollow", name: "Frail Hollow", level: 1, hp: 30, ap: 4, mp: 2, initiative: 10,
    walkKey: "frail", attackKey: "frail", idleKey: "frail",
    dmg: [5, 8], range: [1, 1], element: "physical", postureMax: 20, souls: 15,
    sprite: { url: BEASTS, grid: 3, cell: 0 },
    desc: "A husk of a man, emptied of soul. Teaches the blade its first lesson.",
  },
  plague_rat: {
    id: "plague_rat", name: "Plague Rat", level: 2, hp: 22, ap: 4, mp: 5, initiative: 30,
    walkKey: "beast", attackKey: "beast", moveStyle: "scuttle",
    dmg: [4, 7], range: [1, 1], element: "physical", postureMax: 15, souls: 20,
    sprite: { url: BEASTS, grid: 3, cell: 1 }, scale: 0.75,
    desc: "Swift vermin of the ash. Alone it is nothing; in numbers, a grave.",
  },
  corpse_fly: {
    id: "corpse_fly", name: "Corpse Fly", level: 3, hp: 20, ap: 4, mp: 4, initiative: 40,
    walkKey: "fly", moveStyle: "fly", attackKey: "corpsefly",
    dmg: [3, 5], range: [1, 2], element: "physical", postureMax: 12, souls: 25, special: "poison",
    sprite: { url: BEASTS, grid: 3, cell: 2 }, scale: 0.7,
    desc: "Bloated on the dead. Its bite festers — poison lingers in the blood.",
  },
  rotting_hound: {
    id: "rotting_hound", name: "Rotting Hound", level: 4, hp: 35, ap: 5, mp: 6, initiative: 45,
    walkKey: "beast", attackKey: "beast",
    dmg: [7, 11], range: [1, 1], element: "physical", postureMax: 22, souls: 35,
    sprite: { url: BEASTS, grid: 3, cell: 3 }, scale: 0.85,
    desc: "It remembers the hunt, not the master. Closes distance in a single breath.",
  },
  skeleton_novice: {
    id: "skeleton_novice", name: "Skeleton Novice", level: 5, hp: 40, ap: 5, mp: 3, initiative: 25,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [8, 12], range: [1, 1], element: "physical", postureMax: 30, souls: 45, special: "revive",
    sprite: { url: SKEL_WARRIOR },
    desc: "The bones remember war. Cut it down and it rises once more — unless staggered when slain.",
  },
  skeleton_archer: {
    id: "skeleton_archer", name: "Skeleton Archer", level: 6, hp: 32, ap: 5, mp: 3, initiative: 35,
    walkKey: "skel_archer", attackKey: "archer",
    dmg: [9, 13], range: [3, 7], element: "physical", postureMax: 25, souls: 55,
    sprite: { url: SKELS, grid: 3, cell: 0 },
    desc: "Its arrows seek warmth. Break its line of sight or break its bow.",
  },
  cursed_dandelion: {
    id: "cursed_dandelion", name: "Cursed Dandelion", level: 7, hp: 28, ap: 3, mp: 0, initiative: 5,
    walkKey: "dandelion", moveStyle: "drift", attackKey: "dandelion",
    dmg: [6, 9], range: [1, 2], element: "fire", postureMax: 18, souls: 60, special: "explode_death",
    sprite: { url: BEASTS, grid: 3, cell: 4 }, scale: 0.8,
    desc: "Rooted malice. It bursts in flame when felled — keep your distance at the end.",
  },
  blighted_toad: {
    id: "blighted_toad", name: "Blighted Toad", level: 8, hp: 50, ap: 5, mp: 2, initiative: 15,
    walkKey: "toad", moveStyle: "hop", attackKey: "toad",
    dmg: [8, 12], range: [2, 4], element: "physical", postureMax: 35, souls: 70, special: "pull",
    sprite: { url: BEASTS, grid: 3, cell: 5 }, scale: 0.9,
    desc: "Its tongue drags prey into its maw. Beware standing at a distance you cannot hold.",
  },
  skeleton_pikeman: {
    id: "skeleton_pikeman", name: "Skeleton Pikeman", level: 9, hp: 45, ap: 5, mp: 3, initiative: 28,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [11, 16], range: [1, 2], element: "physical", postureMax: 32, souls: 80,
    sprite: { url: SKELS, grid: 3, cell: 1 },
    desc: "Two measures of reach, one measure of mercy. Never end your step before its point.",
  },
  ash_spirit: {
    id: "ash_spirit", name: "Ash Spirit", level: 10, hp: 38, ap: 5, mp: 4, initiative: 50,
    walkKey: "ashspirit", moveStyle: "drift", attackKey: "ashspirit",
    dmg: [9, 14], range: [1, 3], element: "soul", postureMax: 20, resistPhys: 0.5, souls: 90,
    sprite: { url: SKELS, grid: 3, cell: 5 }, scale: 0.9,
    desc: "What drifts from the pyre does not feel steel. Soulfire answers soulfire.",
  },
  grave_robber: {
    id: "grave_robber", name: "Grave Robber", level: 11, hp: 55, ap: 6, mp: 4, initiative: 42,
    walkKey: "frail", attackKey: "frail",
    dmg: [10, 15], range: [1, 1], element: "physical", postureMax: 30, souls: 100, special: "steal_ap",
    sprite: { url: BEASTS, grid: 3, cell: 8 },
    desc: "He robbed the dead; now he robs the living of their strength. Each cut steals your vigor.",
  },
  skeleton_shieldbearer: {
    id: "skeleton_shieldbearer", name: "Skeleton Shieldbearer", level: 12, hp: 70, ap: 4, mp: 2, initiative: 12,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [10, 14], range: [1, 1], element: "physical", postureMax: 50, resistPhys: 0.3, souls: 115, special: "shield_front",
    sprite: { url: SKELS, grid: 3, cell: 2 },
    desc: "Its wall of rust turns every frontal blow. Flank it, or waste your strength.",
  },
  corrupted_boar: {
    id: "corrupted_boar", name: "Corrupted Boar", level: 13, hp: 80, ap: 5, mp: 5, initiative: 38,
    walkKey: "beast", attackKey: "boar",
    dmg: [12, 18], range: [1, 1], element: "physical", postureMax: 45, souls: 130, special: "push_charge",
    sprite: { url: BEASTS, grid: 3, cell: 6 },
    desc: "It charges in a line and hurls you against stone. The wall hurts more than the tusk.",
  },
  wandering_flame: {
    id: "wandering_flame", name: "Wandering Flame", level: 14, hp: 45, ap: 6, mp: 4, initiative: 55,
    walkKey: "wflame", moveStyle: "drift", attackKey: "wflame",
    dmg: [14, 20], range: [1, 3], element: "fire", postureMax: 15, resistFire: 0.8, souls: 145, special: "explode_death",
    sprite: { url: SKELS, grid: 3, cell: 6 }, scale: 0.85,
    desc: "A soul that refused to gutter out. It dies as it lived — burning everything near.",
  },
  skeleton_assassin: {
    id: "skeleton_assassin", name: "Skeleton Assassin", level: 15, hp: 55, ap: 6, mp: 5, initiative: 70,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [15, 22], range: [1, 1], element: "physical", postureMax: 28, souls: 165, special: "invisible",
    sprite: { url: SKELS, grid: 3, cell: 3 },
    desc: "It vanishes between heartbeats and strikes from behind. Guard your back.",
  },
  tomb_spider: {
    id: "tomb_spider", name: "Tomb Spider", level: 16, hp: 65, ap: 5, mp: 4, initiative: 48,
    walkKey: "spider", attackKey: "spider", moveStyle: "scuttle",
    dmg: [12, 17], range: [1, 4], element: "physical", postureMax: 35, souls: 180, special: "web_mp",
    sprite: { url: BEASTS, grid: 3, cell: 7 },
    desc: "Its webs bind the legs of the living. Movement is life; it takes movement first.",
  },
  hollowed_mage: {
    id: "hollowed_mage", name: "Hollowed Mage", level: 17, hp: 50, ap: 7, mp: 3, initiative: 60,
    walkKey: "mage", attackKey: "mage", moveStyle: "walk",
    dmg: [16, 24], range: [2, 6], element: "soul", postureMax: 22, souls: 200, special: "aoe_mage",
    sprite: { url: SKELS, grid: 3, cell: 7 },
    desc: "The mind is hollow but the craft remains. Its soulfire scours whole swaths of ground.",
  },
  skeleton_sergeant: {
    id: "skeleton_sergeant", name: "Skeleton Sergeant", level: 18, hp: 90, ap: 6, mp: 3, initiative: 33,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [16, 23], range: [1, 1], element: "physical", postureMax: 55, souls: 230, special: "buff_allies",
    sprite: { url: SKELS, grid: 3, cell: 4 },
    desc: "Dead officers still give orders. Its rally hardens every bone around it.",
  },
  gargoyle_whelp: {
    id: "gargoyle_whelp", name: "Gargoyle Whelp", level: 19, hp: 75, ap: 6, mp: 6, initiative: 65,
    walkKey: "gargoyle", moveStyle: "fly", attackKey: "garg",
    dmg: [15, 21], range: [1, 1], element: "physical", postureMax: 40, resistPhys: 0.35, souls: 260,
    sprite: { url: SKELS, grid: 3, cell: 8 },
    desc: "Stone given hunger. It drops from broken arches upon the unwary.",
  },
  ash_mage: {
    id: "ash_mage", name: "Ash Mage", level: 14, hp: 55, ap: 6, mp: 3, initiative: 52,
    walkKey: "mage", attackKey: "mage", moveStyle: "walk",
    dmg: [13, 19], range: [2, 5], element: "fire", postureMax: 24, resistFire: 0.4, souls: 150, special: "aoe_mage",
    sprite: { url: "/manus-storage/hollow_mage_idle_final_1bc02b68.png" },
    desc: "An acolyte who fed his own memories to the pyre. What remains casts by instinct alone.",
  },
  hollow_archer: {
    id: "hollow_archer", name: "Hollow Archer", level: 10, hp: 42, ap: 5, mp: 4, initiative: 48,
    walkKey: "archer", attackKey: "archer",
    dmg: [10, 15], range: [3, 6], element: "physical", postureMax: 26, souls: 95,
    sprite: { url: "/manus-storage/hollow_archer_idle_final_34f15aa0.png" },
    desc: "A deserter's shade that never stopped retreating. It looses, falls back, and looses again.",
  },
  grave_warden: {
    id: "grave_warden", name: "Grave Warden", level: 20, hp: 180, ap: 7, mp: 3, initiative: 44,
    walkKey: "warden", attackKey: "warden",
    dmg: [20, 28], range: [1, 2], element: "physical", postureMax: 80, resistPhys: 0.2, souls: 500,
    sprite: { url: WARDEN }, scale: 1.35,
    desc: "Keeper of the crypt's silence. Its halberd sweeps the earth clean of trespassers.",
  },
  kardorim: {
    id: "kardorim", name: "Kardorim, the Hollow King", level: 25, hp: 420, ap: 8, mp: 4, initiative: 58,
    walkKey: "kardorim", attackKey: "kardorim",
    dmg: [24, 34], range: [1, 2], element: "physical", postureMax: 120, resistPhys: 0.15, resistFire: 0.5,
    souls: 2500, sprite: { url: KARDORIM }, scale: 1.6, special: "summon",
    desc: "The first king of the old continent, crowned in ash. His blade remembers every soul it has taken.",
  },
  // —— Zone 2: The Sunken Reach (lvl 20-26) ——
  drowned_soldier: {
    id: "drowned_soldier", name: "Drowned Soldier", level: 20, hp: 95, ap: 6, mp: 3, initiative: 30,
    walkKey: "drowned", attackKey: "drowned", idleKey: "drowned",
    dmg: [18, 26], range: [1, 1], element: "physical", postureMax: 55, resistPhys: 0.15, souls: 280,
    sprite: { url: SUNKEN, grid: 3, cell: 0 },
    desc: "A soldier of the flooded kingdom, rusted into his own harness. The sea kept him marching.",
  },
  brine_wraith: {
    id: "brine_wraith", name: "Brine Wraith", level: 21, hp: 70, ap: 6, mp: 5, initiative: 62,
    walkKey: "brinewraith", moveStyle: "drift", attackKey: "brinewraith",
    dmg: [18, 27], range: [1, 3], element: "soul", postureMax: 25, resistPhys: 0.55, souls: 310,
    sprite: { url: SUNKEN, grid: 3, cell: 1 }, scale: 0.95,
    desc: "Salt and sorrow given shape. Steel passes through it like water.",
  },
  corpse_fish: {
    id: "corpse_fish", name: "Corpse Fish", level: 22, hp: 60, ap: 5, mp: 6, initiative: 70,
    moveStyle: "swim", attackKey: "corpsefish",
    dmg: [16, 24], range: [1, 1], element: "physical", postureMax: 30, souls: 330, special: "poison",
    sprite: { url: SUNKEN, grid: 3, cell: 3 }, scale: 0.85,
    desc: "It flops and lunges with rotten speed, and its bite carries the deep's black blood.",
  },
  tide_crab: {
    id: "tide_crab", name: "Tide Crab", level: 22, hp: 110, ap: 4, mp: 3, initiative: 14,
    moveStyle: "scuttle", attackKey: "tidecrab",
    dmg: [17, 25], range: [1, 1], element: "physical", postureMax: 70, resistPhys: 0.4, souls: 340, special: "shield_front",
    sprite: { url: SUNKEN, grid: 3, cell: 5 }, scale: 0.95,
    desc: "A living rampart. Its shell shrugs off frontal blows — crack it from behind.",
  },
  sunken_archer: {
    id: "sunken_archer", name: "Sunken Archer", level: 23, hp: 75, ap: 6, mp: 3, initiative: 45,
    walkKey: "sunkarcher", attackKey: "sunkarcher",
    dmg: [20, 29], range: [3, 8], element: "physical", postureMax: 30, souls: 360,
    sprite: { url: SUNKEN, grid: 3, cell: 4 },
    desc: "Kelp-strung bow, coral-tipped arrows. It shoots farther than any archer of the ash.",
  },
  tide_priest: {
    id: "tide_priest", name: "Tide Priest", level: 24, hp: 80, ap: 7, mp: 3, initiative: 58,
    walkKey: "priest", attackKey: "priest",
    dmg: [21, 30], range: [2, 6], element: "soul", postureMax: 28, souls: 400, special: "aoe_mage",
    sprite: { url: SUNKEN, grid: 3, cell: 6 },
    desc: "It still preaches to the drowned. Its litany falls upon whole congregations of ground.",
  },
  moray_horror: {
    id: "moray_horror", name: "Moray Horror", level: 25, hp: 90, ap: 6, mp: 5, initiative: 66,
    walkKey: "moray", moveStyle: "swim", attackKey: "moray",
    dmg: [22, 32], range: [1, 2], element: "physical", postureMax: 40, souls: 440, special: "pull",
    sprite: { url: SUNKEN, grid: 3, cell: 7 }, scale: 1.0,
    desc: "It coils through drowned air as through water, dragging prey into reach of its jaws.",
  },
  coral_golem: {
    id: "coral_golem", name: "Coral Golem", level: 26, hp: 160, ap: 5, mp: 3, initiative: 20,
    walkKey: "golem", attackKey: "golem",
    dmg: [24, 34], range: [1, 1], element: "physical", postureMax: 90, resistPhys: 0.35, souls: 520, special: "push_charge",
    sprite: { url: SUNKEN, grid: 3, cell: 2 }, scale: 1.25,
    desc: "Reef grown over an old titan's bones. When it charges, the ground remembers the tide.",
  },
  drowned_ogre: {
    id: "drowned_ogre", name: "Drowned Ogre", level: 26, hp: 140, ap: 6, mp: 4, initiative: 35,
    walkKey: "golem", attackKey: "golem",
    dmg: [26, 36], range: [1, 2], element: "physical", postureMax: 75, souls: 560, special: "buff_allies",
    sprite: { url: SUNKEN, grid: 3, cell: 8 }, scale: 1.3,
    desc: "Bloated by the deep, it bellows waterlogged war-songs that harden the drowned ranks.",
  },
  // —— Zone 3: The Cinder Marches (lvl 26-33) ——
  ash_wretch: {
    id: "ash_wretch", name: "Ash Wretch", level: 26, hp: 105, ap: 5, mp: 3, initiative: 25,
    walkKey: "frail", attackKey: "frail",
    dmg: [22, 30], range: [1, 1], element: "physical", postureMax: 45, souls: 480,
    sprite: { url: CINDER, grid: 3, cell: 0 },
    desc: "A husk baked to cinder-glass in the marches' heat. It claws at anything cooler than itself.",
  },
  cinder_hound: {
    id: "cinder_hound", name: "Cinder Hound", level: 27, hp: 95, ap: 6, mp: 6, initiative: 55,
    walkKey: "beast", attackKey: "beast",
    dmg: [24, 33], range: [1, 1], element: "fire", postureMax: 40, resistFire: 0.5, souls: 520,
    sprite: { url: CINDER, grid: 3, cell: 1 }, scale: 0.95,
    desc: "A hound of slag and coal, veins bright with the Foundry's heat. It runs down all that flees.",
  },
  ember_priest: {
    id: "ember_priest", name: "Ember Priest", level: 28, hp: 90, ap: 7, mp: 3, initiative: 58,
    walkKey: "priest", attackKey: "priest",
    dmg: [25, 35], range: [2, 6], element: "fire", postureMax: 30, resistFire: 0.6, souls: 560, special: "aoe_mage",
    sprite: { url: CINDER, grid: 3, cell: 2 },
    desc: "It swings a censer of living coals and preaches ruin. Whole yards of ground answer its sermon.",
  },
  burnt_soldier: {
    id: "burnt_soldier", name: "Burnt Soldier", level: 28, hp: 115, ap: 6, mp: 3, initiative: 32,
    walkKey: "drowned", attackKey: "drowned",
    dmg: [26, 35], range: [1, 1], element: "physical", postureMax: 55, resistFire: 0.4, souls: 580,
    sprite: { url: CINDER, grid: 3, cell: 7 },
    desc: "He marched into the burning marches and kept marching. Sword and shield fused to his hands.",
  },
  slag_golem: {
    id: "slag_golem", name: "Slag Golem", level: 29, hp: 190, ap: 5, mp: 3, initiative: 15,
    walkKey: "golem", attackKey: "golem",
    dmg: [28, 38], range: [1, 1], element: "physical", postureMax: 95, resistPhys: 0.35, resistFire: 0.7, souls: 640, special: "push_charge",
    sprite: { url: CINDER, grid: 3, cell: 3 }, scale: 1.25,
    desc: "Foundry waste that woke up angry. When it charges, stone walls are a rumor.",
  },
  forge_revenant: {
    id: "forge_revenant", name: "Forge Revenant", level: 30, hp: 130, ap: 6, mp: 3, initiative: 36,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [28, 39], range: [1, 1], element: "physical", postureMax: 60, resistFire: 0.5, souls: 700, special: "revive",
    sprite: { url: CINDER, grid: 3, cell: 4 },
    desc: "A smith who died at his anvil and would not stop working. The hammer remembers; kill it staggered or it rises.",
  },
  magma_leech: {
    id: "magma_leech", name: "Magma Leech", level: 31, hp: 120, ap: 5, mp: 4, initiative: 44,
    walkKey: "serpent", attackKey: "serpent", moveStyle: "swim",
    dmg: [27, 37], range: [1, 3], element: "fire", postureMax: 45, resistFire: 0.8, souls: 760, special: "pull",
    sprite: { url: CINDER, grid: 3, cell: 5 }, scale: 1.1,
    desc: "It swims through cooling slag as through water, and drags the living into its furnace gullet.",
  },
  pyre_daemon: {
    id: "pyre_daemon", name: "Pyre Daemon", level: 33, hp: 140, ap: 6, mp: 6, initiative: 68,
    walkKey: "gargoyle", moveStyle: "fly", attackKey: "garg",
    dmg: [30, 42], range: [1, 2], element: "fire", postureMax: 50, resistPhys: 0.2, resistFire: 0.8, souls: 900,
    sprite: { url: CINDER, grid: 3, cell: 6 }, scale: 1.15,
    desc: "Something older than the marches wears the fire like a crown. It descends only to burn.",
  },

  // —— Zone 4: The Pale Marsh (lvl 32-38) ——
  marsh_ghoul: {
    id: "marsh_ghoul", name: "Marsh Ghoul", level: 32, hp: 135, ap: 6, mp: 4, initiative: 34,
    walkKey: "frail", attackKey: "frail", idleKey: "frail",
    dmg: [28, 38], range: [1, 1], element: "physical", postureMax: 50, souls: 820, special: "steal_ap",
    sprite: { url: MARSH, grid: 3, cell: 0 },
    desc: "Waterlogged and patient, it wrings the strength from the living with each wet, tearing blow.",
  },
  bog_witch: {
    id: "bog_witch", name: "Bog Witch", level: 33, hp: 110, ap: 7, mp: 3, initiative: 60,
    walkKey: "mage", attackKey: "mage", moveStyle: "walk",
    dmg: [30, 42], range: [2, 6], element: "soul", postureMax: 32, resistSoul: 0.4, souls: 880, special: "aoe_mage",
    sprite: { url: MARSH, grid: 3, cell: 1 },
    desc: "She reads drowned futures in the fen-water. Her hexes rot whole spans of ground at once.",
  },
  plague_bearer: {
    id: "plague_bearer", name: "Plague Bearer", level: 34, hp: 160, ap: 5, mp: 3, initiative: 22,
    walkKey: "drowned", attackKey: "drowned",
    dmg: [30, 40], range: [1, 1], element: "physical", postureMax: 65, souls: 940, special: "explode_death",
    sprite: { url: MARSH, grid: 3, cell: 2 }, scale: 1.2,
    desc: "It carries its own head like a lantern, and its bulk like a bomb. Do not stand close at the end.",
  },
  rat_king: {
    id: "rat_king", name: "Rat King", level: 34, hp: 125, ap: 6, mp: 6, initiative: 62,
    moveStyle: "scuttle", attackKey: "ratking",
    dmg: [26, 36], range: [1, 1], element: "physical", postureMax: 40, souls: 900, special: "poison",
    sprite: { url: MARSH, grid: 3, cell: 7 }, scale: 1.05,
    desc: "A knot of grave-rats fused into one hunger. It moves like spilled water and bites like plague.",
  },
  weeping_statue: {
    id: "weeping_statue", name: "Weeping Statue", level: 35, hp: 200, ap: 4, mp: 2, initiative: 8,
    attackKey: "wstatue",
    dmg: [32, 44], range: [1, 1], element: "physical", postureMax: 110, resistPhys: 0.45, souls: 1000, special: "shield_front",
    sprite: { url: MARSH, grid: 3, cell: 3 }, scale: 1.15,
    desc: "A mourner carved in stone that learned to grieve for the living. Its veiled front turns every blade.",
  },
  catacomb_lurker: {
    id: "catacomb_lurker", name: "Catacomb Lurker", level: 36, hp: 140, ap: 7, mp: 5, initiative: 78,
    moveStyle: "scuttle", attackKey: "lurker",
    dmg: [34, 48], range: [1, 1], element: "physical", postureMax: 42, souls: 1080, special: "invisible",
    sprite: { url: MARSH, grid: 3, cell: 4 },
    desc: "Pale as things that have never seen the sun. It slips between heartbeats and opens throats from behind.",
  },
  mire_serpent: {
    id: "mire_serpent", name: "Mire Serpent", level: 37, hp: 165, ap: 6, mp: 5, initiative: 58,
    walkKey: "serpent", attackKey: "serpent", moveStyle: "swim",
    dmg: [34, 47], range: [1, 3], element: "physical", postureMax: 55, souls: 1160, special: "pull",
    sprite: { url: MARSH, grid: 3, cell: 5 }, scale: 1.2,
    desc: "The bog's long throat. Distance is an illusion it swallows first, then you.",
  },
  fen_stalker: {
    id: "fen_stalker", name: "Fen Stalker", level: 38, hp: 130, ap: 6, mp: 5, initiative: 66,
    walkKey: "archer", attackKey: "archer",
    dmg: [34, 46], range: [3, 8], element: "physical", postureMax: 38, souls: 1240,
    sprite: { url: MARSH, grid: 3, cell: 6 },
    desc: "It hunts from the fog with a bow of black bone, and it has never once been seen twice.",
  },

  // —— Zone 5: The Shattered Peaks (lvl 40-45) ——
  frost_soldier: {
    id: "frost_soldier", name: "Frost Soldier", level: 40, hp: 170, ap: 6, mp: 3, initiative: 36,
    walkKey: "drowned", attackKey: "drowned",
    dmg: [38, 52], range: [1, 2], element: "physical", postureMax: 70, resistPhys: 0.2, souls: 1400,
    sprite: { url: PEAKS, grid: 3, cell: 6 },
    desc: "Rime-mailed and patient as winter. Its spear finds you one step before you find it.",
  },
  spire_knight: {
    id: "spire_knight", name: "Spire Knight", level: 40, hp: 195, ap: 6, mp: 3, initiative: 40,
    walkKey: "skel_melee", attackKey: "skel",
    dmg: [40, 55], range: [1, 1], element: "physical", postureMax: 80, resistPhys: 0.25, souls: 1500,
    sprite: { url: PEAKS, grid: 3, cell: 0 }, scale: 1.1,
    desc: "A knight of the Choir's old guard, crowned in verdigris. His greatsword sings one note: down.",
  },
  storm_gargoyle: {
    id: "storm_gargoyle", name: "Storm Gargoyle", level: 41, hp: 160, ap: 6, mp: 6, initiative: 72,
    walkKey: "gargoyle", moveStyle: "fly", attackKey: "garg",
    dmg: [38, 52], range: [1, 2], element: "soul", postureMax: 55, resistPhys: 0.35, souls: 1580,
    sprite: { url: PEAKS, grid: 3, cell: 1 }, scale: 1.15,
    desc: "Lightning nests in its wings. It rides the peak-winds down like a thrown spear.",
  },
  wind_reaper: {
    id: "wind_reaper", name: "Wind Reaper", level: 42, hp: 145, ap: 7, mp: 5, initiative: 80,
    walkKey: "windreaper", moveStyle: "drift", attackKey: "windreaper",
    dmg: [40, 56], range: [2, 6], element: "soul", postureMax: 35, resistPhys: 0.6, souls: 1680, special: "aoe_mage",
    sprite: { url: PEAKS, grid: 3, cell: 2 },
    desc: "A rag of wind with a scythe of frozen sky. It harvests from a distance grief cannot close.",
  },
  hollow_cantor: {
    id: "hollow_cantor", name: "Hollow Cantor", level: 43, hp: 165, ap: 7, mp: 3, initiative: 56,
    walkKey: "priest", attackKey: "priest",
    dmg: [40, 56], range: [2, 6], element: "soul", postureMax: 45, resistSoul: 0.5, souls: 1780, special: "buff_allies",
    sprite: { url: PEAKS, grid: 3, cell: 3 },
    desc: "Its halo still hums the Choir's last hymn. Every note hardens the dead around it.",
  },
  choir_sentinel: {
    id: "choir_sentinel", name: "Choir Sentinel", level: 44, hp: 230, ap: 5, mp: 3, initiative: 20,
    walkKey: "drowned", attackKey: "skel",
    dmg: [44, 60], range: [1, 1], element: "physical", postureMax: 120, resistPhys: 0.4, souls: 1900, special: "shield_front",
    sprite: { url: PEAKS, grid: 3, cell: 4 }, scale: 1.25,
    desc: "It carries the Spire's organ-gate as a shield. The music stopped; the vigil did not.",
  },
  peak_wyvern: {
    id: "peak_wyvern", name: "Peak Wyvern", level: 45, hp: 260, ap: 6, mp: 6, initiative: 64,
    walkKey: "gargoyle", moveStyle: "fly", attackKey: "garg",
    dmg: [46, 64], range: [1, 2], element: "physical", postureMax: 90, resistPhys: 0.25, souls: 2100, special: "push_charge",
    sprite: { url: PEAKS, grid: 3, cell: 5 }, scale: 1.4,
    desc: "The last thing that nests above the clouds. Its stoop shatters stone and certainty alike.",
  },

  // —— Expansion dungeon bosses ——
  vulkas: {
    id: "vulkas", name: "Vulkas, the Forge Tyrant", level: 34, hp: 520, ap: 8, mp: 4, initiative: 48,
    walkKey: "vulkas", attackKey: "vulkas",
    dmg: [34, 48], range: [1, 2], element: "fire", postureMax: 140, resistPhys: 0.25, resistFire: 0.7,
    souls: 5000, sprite: { url: VULKAS }, scale: 1.6, special: "summon",
    desc: "The Foundry's master, fused to his own masterwork. His maul is a river of iron that never cooled.",
  },
  morvane: {
    id: "morvane", name: "Morvane, the Weeping Matriarch", level: 40, hp: 580, ap: 8, mp: 4, initiative: 54,
    walkKey: "morvane", attackKey: "morvane",
    dmg: [38, 54], range: [2, 5], element: "soul", postureMax: 130, resistPhys: 0.3, resistSoul: 0.5,
    souls: 7000, sprite: { url: MORVANE }, scale: 1.55, special: "summon",
    desc: "Six arms to cradle the dead, and none left for mercy. Her grief drowns catacombs whole.",
  },
  aurelion: {
    id: "aurelion", name: "Aurelion, the Last Cantor", level: 46, hp: 660, ap: 9, mp: 4, initiative: 62,
    walkKey: "aurelion", attackKey: "aurelion",
    dmg: [44, 62], range: [1, 2], element: "soul", postureMax: 160, resistPhys: 0.25, resistSoul: 0.4,
    souls: 10000, sprite: { url: AURELION }, scale: 1.6, special: "summon",
    desc: "The Choir's final voice, wings strung with hymn-wire. When he sings, the mountain remembers being whole.",
  },
  drowned_sentinel: {
    id: "drowned_sentinel", name: "The Drowned Sentinel", level: 28, hp: 300, ap: 7, mp: 3, initiative: 50,
    walkKey: "sentinel", attackKey: "sentinel",
    dmg: [26, 38], range: [1, 2], element: "physical", postureMax: 100, resistPhys: 0.25, resistSoul: 0.3,
    souls: 3000, sprite: { url: SENTINEL }, scale: 1.5, special: "summon",
    desc: "The last knight of the flooded kingdom, standing a watch no king remains to relieve.",
  },
};

/** Level → mob id lookup for spawn tables */
export const MOB_BY_LEVEL: string[] = [
  "frail_hollow", "plague_rat", "corpse_fly", "rotting_hound", "skeleton_novice",
  "skeleton_archer", "cursed_dandelion", "blighted_toad", "skeleton_pikeman", "ash_spirit",
  "grave_robber", "skeleton_shieldbearer", "corrupted_boar", "wandering_flame", "skeleton_assassin",
  "tomb_spider", "hollowed_mage", "skeleton_sergeant", "gargoyle_whelp", "grave_warden",
];
