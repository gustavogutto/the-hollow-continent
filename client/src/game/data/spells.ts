/* Ashen Gothic — player ability bar (6 slots). Icons index into ui_icons_kit (4x4). */
import type { SpellDef } from "../types";

export const PLAYER_SPELLS: SpellDef[] = [
  {
    id: "slash", name: "Ember Slash", icon: 0, apCost: 3, range: [1, 1], needsLos: true,
    dmg: [12, 18], element: "physical", posture: 12,
    desc: "A swift cut with the ember blade. Backstabs deal +50% damage.",
  },
  {
    id: "heavy", name: "Crushing Blow", icon: 1, apCost: 5, range: [1, 1], needsLos: true,
    dmg: [22, 32], element: "physical", posture: 30, push: 1,
    desc: "A heavy two-handed strike that shatters posture and shoves the foe back. Collision deals bonus damage.",
  },
  {
    id: "soulbolt", name: "Soul Bolt", icon: 2, apCost: 3, range: [2, 6], needsLos: true,
    dmg: [10, 15], element: "soul", posture: 6,
    desc: "Hurl a shard of your own soul. Pierces the defenses of spirits.",
  },
  {
    id: "emberburst", name: "Ember Burst", icon: 3, apCost: 4, range: [2, 4], needsLos: true,
    dmg: [14, 20], element: "fire", posture: 8, aoe: 1,
    desc: "Ignite the ground in a burst of cinders, searing all in the area.",
  },
  {
    id: "warcry", name: "Ashen Cry", icon: 9, apCost: 2, range: [0, 0], needsLos: false,
    dmg: [0, 0], element: "physical", posture: 0, buffAp: 2,
    desc: "A cry from the old wars. Grants +2 AP this turn. Once per fight.",
  },
  {
    id: "dash", name: "Shadow Step", icon: 5, apCost: 2, range: [1, 3], needsLos: true,
    dmg: [0, 0], element: "physical", posture: 0, selfMove: 3,
    desc: "Step through the ash to an empty tile within 3 — spends no movement.",
  },
];

/** Unlockable spells — learned from Elara for souls once the player reaches the required level. */
export const UNLOCKABLE_SPELLS: SpellDef[] = [
  {
    id: "pyre", name: "Funeral Pyre", icon: 7, apCost: 5, range: [2, 5], needsLos: true,
    dmg: [18, 26], element: "fire", posture: 10, aoe: 1, leavesFire: true,
    desc: "Call down grave-fire on distant foes, igniting the tiles beneath them.",
  },
  {
    id: "gravequake", name: "Gravequake", icon: 10, apCost: 6, range: [0, 0], needsLos: false,
    dmg: [20, 30], element: "physical", posture: 25, aoe: 2, push: 1,
    desc: "Slam the earth around you — damages and shoves back every adjacent foe.",
  },
  {
    id: "soulrend", name: "Soul Rend", icon: 11, apCost: 4, range: [1, 2], needsLos: true,
    dmg: [16, 22], element: "soul", posture: 35,
    desc: "Tear at the foe's spirit — devastating posture damage. Staggers most lesser dead outright.",
  },
];

/** Unlock requirements at Elara: player level + soul cost. */
export const SPELL_UNLOCKS: Record<string, { level: number; souls: number }> = {
  pyre: { level: 6, souls: 900 },
  gravequake: { level: 10, souls: 2200 },
  soulrend: { level: 14, souls: 4500 },
};

/** All spells the player can ever have, in bar order. */
export const ALL_PLAYER_SPELLS: SpellDef[] = [...PLAYER_SPELLS, ...UNLOCKABLE_SPELLS];

/** Execution strike vs staggered enemies: free, massive damage. */
export const EXECUTION_MULT = 2.5;
export const BACKSTAB_MULT = 1.5;
export const COLLISION_DMG = 10;
