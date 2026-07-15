/* Ashen Gothic — playable classes: Knight (Ember-Bearer), Mage (Ashbound Scholar),
 * Archer (Hollow Ranger). Each class has base stats, its own spell kit, unlockable
 * spells taught by Elara, a starting weapon, and its own sprite set. */
import type { SpellDef } from "../types";
import { PLAYER_SPELLS, UNLOCKABLE_SPELLS, SPELL_UNLOCKS } from "./spells";

export type PlayerClass = "knight" | "mage" | "archer";

export interface ClassDef {
  id: PlayerClass;
  name: string;
  title: string;
  baseHp: number;
  baseAp: number;
  baseMp: number;
  startWeapon: string;
  /** portrait for the class picker + character sheet (processed, transparent bg) */
  portrait: string;
  /** player art: null = legacy knight sheet path in renderer */
  walkKey: "pc_mage" | "pc_archer" | null;
  attackKey: "knight" | "pc_mage" | "pc_archer";
  spells: SpellDef[];
  unlockables: SpellDef[];
  unlocks: Record<string, { level: number; souls: number }>;
  blurb: string;
}

/* ---------- Mage kit — the Ashbound Scholar ---------- */
const MAGE_SPELLS: SpellDef[] = [
  {
    id: "emberbolt", name: "Ember Bolt", icon: 3, apCost: 3, range: [2, 6], needsLos: true,
    dmg: [11, 16], element: "fire", posture: 6,
    desc: "Hurl a searing mote from the staff's caged ember. The scholar's bread and butter.",
  },
  {
    id: "soullance", name: "Soul Lance", icon: 2, apCost: 4, range: [2, 7], needsLos: true,
    dmg: [14, 20], element: "soul", posture: 10,
    desc: "A spear of condensed soulstuff. Pierces the defenses of spirits.",
  },
  {
    id: "cindernova", name: "Cinder Nova", icon: 7, apCost: 5, range: [0, 0], needsLos: false,
    dmg: [16, 24], element: "fire", posture: 14, aoe: 2, push: 1,
    desc: "Detonate the air around you — sears and shoves back everything near. A scholar's panic button.",
  },
  {
    id: "ashveil", name: "Ash Veil", icon: 9, apCost: 2, range: [0, 0], needsLos: false,
    dmg: [0, 0], element: "soul", posture: 0, buffAp: 2,
    desc: "Draw the ash about you like a cloak, quickening the next incantation. +2 AP this turn. Once per fight.",
  },
  {
    id: "gravebrand", name: "Grave Brand", icon: 10, apCost: 4, range: [2, 5], needsLos: true,
    dmg: [12, 18], element: "fire", posture: 8, aoe: 1, leavesFire: true,
    desc: "Brand distant ground with grave-fire, igniting the tiles beneath your foes.",
  },
  {
    id: "blink", name: "Blink Step", icon: 5, apCost: 2, range: [1, 4], needsLos: false,
    dmg: [0, 0], element: "soul", posture: 0, selfMove: 4,
    desc: "Fold the space between two pinches of ash — reappear on an empty tile within 4.",
  },
];

const MAGE_UNLOCKABLES: SpellDef[] = [
  {
    id: "soulstorm", name: "Soulstorm", icon: 11, apCost: 5, range: [2, 6], needsLos: true,
    dmg: [17, 24], element: "soul", posture: 12, aoe: 2,
    desc: "Call a howling storm of severed souls over distant ground.",
  },
  {
    id: "cataclysm", name: "Ember Cataclysm", icon: 7, apCost: 6, range: [2, 5], needsLos: true,
    dmg: [26, 38], element: "fire", posture: 20, aoe: 1, leavesFire: true,
    desc: "The scholar's final argument — a pillar of pyre-fire that leaves the ground burning.",
  },
  {
    id: "spiritdrain", name: "Spirit Drain", icon: 2, apCost: 4, range: [1, 4], needsLos: true,
    dmg: [14, 20], element: "soul", posture: 8, heal: [10, 16],
    desc: "Drink a foe's soul-heat into your own veins — damages them, mends you.",
  },
];

/* ---------- Archer kit — the Hollow Ranger ---------- */
const ARCHER_SPELLS: SpellDef[] = [
  {
    id: "piercingshot", name: "Piercing Shot", icon: 0, apCost: 3, range: [2, 7], needsLos: true,
    dmg: [11, 16], element: "physical", posture: 8,
    desc: "A black-fletched arrow loosed clean and flat. The ranger's bread and butter.",
  },
  {
    id: "heavydraw", name: "Heavy Draw", icon: 1, apCost: 5, range: [2, 6], needsLos: true,
    dmg: [20, 30], element: "physical", posture: 25, push: 1,
    desc: "A full-anchor draw that punches through mail and staggers the target back a step.",
  },
  {
    id: "barbrain", name: "Rain of Barbs", icon: 10, apCost: 5, range: [3, 6], needsLos: true,
    dmg: [12, 17], element: "physical", posture: 8, aoe: 1,
    desc: "Loose a fan of barbed arrows arcing onto an area — every foe beneath is pinned by iron.",
  },
  {
    id: "huntersstep", name: "Hunter's Step", icon: 5, apCost: 2, range: [1, 4], needsLos: true,
    dmg: [0, 0], element: "physical", posture: 0, selfMove: 4,
    desc: "Slip through the ash like game through brush — reposition up to 4 tiles.",
  },
  {
    id: "cripplingarrow", name: "Crippling Arrow", icon: 2, apCost: 3, range: [2, 6], needsLos: true,
    dmg: [8, 12], element: "physical", posture: 22,
    desc: "An arrow to the knee-joint. Light damage, brutal posture harm — herald of the stagger.",
  },
  {
    id: "pointblank", name: "Point-Blank Kick", icon: 9, apCost: 2, range: [1, 1], needsLos: true,
    dmg: [6, 10], element: "physical", posture: 6, push: 2,
    desc: "A boot to the chest to buy shooting room — shoves the foe two tiles back.",
  },
];

const ARCHER_UNLOCKABLES: SpellDef[] = [
  {
    id: "volley", name: "Grave Volley", icon: 10, apCost: 6, range: [3, 7], needsLos: true,
    dmg: [15, 21], element: "physical", posture: 10, aoe: 2,
    desc: "Blacken the sky. A wide volley falls on everything in the killing square.",
  },
  {
    id: "soularrow", name: "Soul-Tipped Arrow", icon: 2, apCost: 4, range: [2, 8], needsLos: true,
    dmg: [22, 32], element: "soul", posture: 12,
    desc: "An arrowhead quenched in grave-water — flies farther than sight and bites the spirit itself.",
  },
  {
    id: "shadowsnare", name: "Shadow Snare", icon: 11, apCost: 3, range: [2, 5], needsLos: true,
    dmg: [10, 14], element: "physical", posture: 30,
    desc: "A weighted snare-line to the legs. Modest harm, but it wrenches posture toward the breaking point.",
  },
];

/* ---------- Class table ---------- */
export const CLASSES: Record<PlayerClass, ClassDef> = {
  knight: {
    id: "knight",
    name: "Knight",
    title: "The Ember-Bearer",
    baseHp: 100, baseAp: 6, baseMp: 3,
    startWeapon: "ember_blade",
    portrait: "", // filled from URLS.player in UI (legacy sheet)
    walkKey: null,
    attackKey: "knight",
    spells: PLAYER_SPELLS,
    unlockables: UNLOCKABLE_SPELLS,
    unlocks: SPELL_UNLOCKS,
    blurb: "The last knight of the ash. Sword and grit — strong in the press, forgiving of mistakes.",
  },
  mage: {
    id: "mage",
    name: "Mage",
    title: "The Ashbound Scholar",
    baseHp: 80, baseAp: 6, baseMp: 3,
    startWeapon: "ashen_staff",
    portrait: "/manus-storage/pc_mage_idle_final_23cc8b50.png",
    walkKey: "pc_mage",
    attackKey: "pc_mage",
    spells: MAGE_SPELLS,
    unlockables: MAGE_UNLOCKABLES,
    unlocks: { soulstorm: { level: 6, souls: 900 }, cataclysm: { level: 12, souls: 3000 }, spiritdrain: { level: 9, souls: 1800 } },
    blurb: "A scholar who fed his memories to the pyre. Frail, but death itself answers his staff.",
  },
  archer: {
    id: "archer",
    name: "Archer",
    title: "The Hollow Ranger",
    baseHp: 90, baseAp: 6, baseMp: 4,
    startWeapon: "rangers_longbow",
    portrait: "/manus-storage/pc_archer_idle_final_4d6b72c8.png",
    walkKey: "pc_archer",
    attackKey: "pc_archer",
    spells: ARCHER_SPELLS,
    unlockables: ARCHER_UNLOCKABLES,
    unlocks: { volley: { level: 6, souls: 900 }, soularrow: { level: 10, souls: 2200 }, shadowsnare: { level: 14, souls: 4000 } },
    blurb: "A deserter who never stopped moving. Fast, far-sighted, and merciless at range.",
  },
};

export const CLASS_IDS: PlayerClass[] = ["knight", "mage", "archer"];

/** Every spell any class can ever have — used by the HUD to resolve spell ids to defs. */
export const ALL_CLASS_SPELLS: SpellDef[] = [
  ...PLAYER_SPELLS, ...UNLOCKABLE_SPELLS,
  ...MAGE_SPELLS, ...MAGE_UNLOCKABLES,
  ...ARCHER_SPELLS, ...ARCHER_UNLOCKABLES,
];
