/* Ashen Gothic — items: weapons, armor, materials, keys. Icons index ui_icons_kit 4x4. */
import type { ItemDef } from "../types";

export const ITEMS: Record<string, ItemDef> = {
  ember_blade: {
    id: "ember_blade", name: "Ember Blade", slot: "weapon", icon: 0, dmgBonus: [0, 0],
    desc: "A knight's longsword, its edge kept alive by a dying ember. Gromm can reinforce it.",
  },
  ashen_staff: {
    id: "ashen_staff", name: "Ashen Staff", slot: "weapon", icon: 3, dmgBonus: [0, 0],
    desc: "A scholar's staff crowned with a caged ember that never quite dies. Gromm can reinforce it.",
  },
  rangers_longbow: {
    id: "rangers_longbow", name: "Ranger's Longbow", slot: "weapon", icon: 1, dmgBonus: [0, 0],
    desc: "A black-yew longbow worn smooth by a deserter's grip. Gromm can reinforce it.",
  },
  ashen_plate: {
    id: "ashen_plate", name: "Ashen Plate", slot: "armor", icon: 12, hpBonus: 25,
    desc: "Battered plate scavenged from the ash fields. +25 max HP.",
  },
  bone_helm: {
    id: "bone_helm", name: "Bone Helm", slot: "helmet", icon: 13, hpBonus: 15,
    desc: "A helm carved from a warden's skull. +15 max HP.",
  },
  ember_ring: {
    id: "ember_ring", name: "Ring of Embers", slot: "ring", icon: 14, apBonus: 1,
    desc: "A ring holding a warm cinder. +1 AP.",
  },
  swift_ring: {
    id: "swift_ring", name: "Ring of the Wind", slot: "ring", icon: 14, mpBonus: 1,
    desc: "A ring light as breath. +1 MP.",
  },
  old_bone: {
    id: "old_bone", name: "Old Bone", slot: "material", icon: 10,
    desc: "A bone dense with old soul-residue. Smithing material.",
  },
  iron_shard: {
    id: "iron_shard", name: "Iron Shard", slot: "material", icon: 11,
    desc: "A shard of pre-collapse iron. Smithing material.",
  },
  // —— loot variety: weapons with real tradeoffs ——
  grave_scythe: {
    id: "grave_scythe", name: "Grave Scythe", slot: "weapon", icon: 1, dmgBonus: [6, 10], mpBonus: -1,
    desc: "The Warden's reaping blade — heavy, hungry. +6–10 damage, but −1 MP.",
  },
  soul_saber: {
    id: "soul_saber", name: "Soul Saber", slot: "weapon", icon: 2, dmgBonus: [3, 5], apBonus: 1,
    desc: "A blade of condensed soulstuff, feather-light. +3–5 damage and +1 AP.",
  },
  ember_greatsword: {
    id: "ember_greatsword", name: "Ember-Forged Greatsword", slot: "weapon", icon: 1, dmgBonus: [8, 14], apBonus: -1,
    desc: "Gromm's masterwork, forged from living ore. +8–14 damage, but its weight costs −1 AP.",
  },
  // —— armor with tradeoffs ——
  king_plate: {
    id: "king_plate", name: "Plate of the First King", slot: "armor", icon: 12, hpBonus: 50, mpBonus: -1,
    desc: "Kardorim's royal plate, immensely heavy. +50 max HP, −1 MP.",
  },
  wraith_shroud: {
    id: "wraith_shroud", name: "Wraith Shroud", slot: "armor", icon: 12, hpBonus: 10, mpBonus: 1,
    desc: "Woven from drowned spirit-cloth, near weightless. +10 max HP, +1 MP.",
  },
  sentinel_helm: {
    id: "sentinel_helm", name: "Sentinel's Barbute", slot: "helmet", icon: 13, hpBonus: 30, apBonus: -1,
    desc: "The Drowned Sentinel's barnacled helm. +30 max HP, −1 AP.",
  },
  scholar_ring: {
    id: "scholar_ring", name: "Scholar's Seal", slot: "ring", icon: 14, hpBonus: -10, apBonus: 1, mpBonus: 1,
    desc: "A seal of the old academies. +1 AP, +1 MP — but −10 max HP.",
  },
  tide_ring: {
    id: "tide_ring", name: "Tide-Worn Ring", slot: "ring", icon: 14, hpBonus: 20, mpBonus: 1,
    desc: "The Drowned Sentinel's ring, smoothed by centuries of current. +20 max HP, +1 MP.",
  },
  keepers_locket: {
    id: "keepers_locket", name: "Keeper's Locket", slot: "ring", icon: 14, hpBonus: 25, apBonus: 1,
    desc: "Elara's memories, kept close to the heart. +25 max HP, +1 AP.",
  },
  // —— quest & secret items ——
  ember_ore: {
    id: "ember_ore", name: "Ember Ore", slot: "material", icon: 11,
    desc: "Ore that still glows from within. Gromm needs two lumps to feed his forge.",
  },
  memory_fragment: {
    id: "memory_fragment", name: "Memory Fragment", slot: "material", icon: 10,
    desc: "A crystallized moment of the world before the ash. Elara seeks three.",
  },
  forge_hammer: {
    id: "forge_hammer", name: "Gromm's Masterwork Hammer", slot: "ring", icon: 14, apBonus: 1,
    desc: "Reward of a rebuilt forge — worn as a charm. +1 AP. (Ring slot)",
  },
  keepers_blessing: {
    id: "keepers_blessing", name: "Keeper's Blessing", slot: "ring", icon: 14, hpBonus: 30,
    desc: "Elara's gratitude given form. +30 max HP. (Ring slot)",
  },
  crypt_key: {
    id: "crypt_key", name: "Crypt Key", slot: "key", icon: 15,
    desc: "A cold iron key. Opens the Crypt of the First King.",
  },
  ashen_crown: {
    id: "ashen_crown", name: "Ashen Crown", slot: "key", icon: 15,
    desc: "Kardorim's broken crown. Proof of the first trial. The Hollow Continent awaits.",
  },

  // —— Expansion: zone smithing materials ——
  cinder_ore: {
    id: "cinder_ore", name: "Cinder Ore", slot: "material", icon: 11,
    desc: "Ore from the Marches that never cooled. Counts as a smithing shard of rare grade.",
  },
  grave_silk: {
    id: "grave_silk", name: "Grave Silk", slot: "material", icon: 10,
    desc: "Thread spun in the Weeping Catacombs — stronger than it has any right to be. Smithing material.",
  },
  storm_crystal: {
    id: "storm_crystal", name: "Storm Crystal", slot: "material", icon: 11,
    desc: "A splinter of the torn sky above the Peaks. It hums against the palm. Smithing material.",
  },

  // —— Expansion: rings ——
  cinder_ring: {
    id: "cinder_ring", name: "Cinder Ring", slot: "ring", icon: 14, dmgBonus: [2, 4],
    desc: "A band of unburnt coal from the Marches. +2–4 damage — the fire wants out.",
  },
  gale_ring: {
    id: "gale_ring", name: "Gale Ring", slot: "ring", icon: 14, mpBonus: 2, hpBonus: -5,
    desc: "The wind of the Marches lives in it. +2 MP, −5 max HP — travel light.",
  },
  tear_ring: {
    id: "tear_ring", name: "Ring of Gathered Tears", slot: "ring", icon: 14, hpBonus: 40,
    desc: "Sorrows of the Catacombs, crystallized. +40 max HP.",
  },
  cantor_seal: {
    id: "cantor_seal", name: "Cantor's Seal", slot: "ring", icon: 14, dmgBonus: [4, 6], apBonus: 1, hpBonus: -15,
    desc: "The Choir's last commission. +4–6 damage, +1 AP — but the song takes its toll: −15 max HP.",
  },

  // —— Expansion: armor ——
  foundry_plate: {
    id: "foundry_plate", name: "Foundry Plate", slot: "armor", icon: 12, hpBonus: 45, mpBonus: -1,
    desc: "Slag-forged plate from the Ember Foundry's own line. +45 max HP, −1 MP.",
  },
  scholar_vestment: {
    id: "scholar_vestment", name: "Scholar's Vestment", slot: "armor", icon: 12, hpBonus: 20, dmgBonus: [2, 4],
    desc: "Ashbound weave lined with burning formulae. +20 max HP, +2–4 damage.",
  },
  rangers_weave: {
    id: "rangers_weave", name: "Ranger's Weave", slot: "armor", icon: 12, hpBonus: 20, mpBonus: 1,
    desc: "Hollow Ranger fieldcloth — light, silent. +20 max HP, +1 MP.",
  },
  morvane_veil: {
    id: "morvane_veil", name: "Morvane's Veil", slot: "armor", icon: 12, hpBonus: 55, apBonus: -1,
    desc: "The Matriarch's mourning veil, vast as a shroud. +55 max HP, −1 AP.",
  },

  // —— Expansion: helmets ——
  wyvern_helm: {
    id: "wyvern_helm", name: "Wyvern-Scale Helm", slot: "helmet", icon: 13, hpBonus: 25,
    desc: "Scales prised from the Wyvern Scar. +25 max HP.",
  },
  choir_crown: {
    id: "choir_crown", name: "Crown of the Last Choir", slot: "helmet", icon: 13, hpBonus: 20, dmgBonus: [3, 5],
    desc: "Aurelion's diadem, still faintly singing. +20 max HP, +3–5 damage.",
  },

  // —— Expansion: weapons ——
  vulkas_maul: {
    id: "vulkas_maul", name: "Vulkas's Foundry Maul", slot: "weapon", icon: 1, dmgBonus: [10, 16], apBonus: -1,
    desc: "The Forge Tyrant's hammer — an anvil on a haft. +10–16 damage, −1 AP.",
  },
  cantor_twinblade: {
    id: "cantor_twinblade", name: "Cantor's Twinblade", slot: "weapon", icon: 2, dmgBonus: [8, 12], apBonus: 1, hpBonus: -10,
    desc: "Aurelion's baton, unfolded into two singing edges. +8–12 damage, +1 AP, −10 max HP.",
  },
  stormwood_bow: {
    id: "stormwood_bow", name: "Stormwood Bow", slot: "weapon", icon: 1, dmgBonus: [7, 11], mpBonus: 1,
    desc: "Cut from a tree struck nine times by the sky. +7–11 damage, +1 MP.",
  },
  lichs_sceptre: {
    id: "lichs_sceptre", name: "Lich's Sceptre", slot: "weapon", icon: 3, dmgBonus: [6, 10], apBonus: 1,
    desc: "A cold authority over dead flame. +6–10 damage, +1 AP.",
  },
  marsh_piercer: {
    id: "marsh_piercer", name: "Marsh Piercer", slot: "weapon", icon: 2, dmgBonus: [6, 9], mpBonus: 1,
    desc: "A long spear-point blade with the fen's patience. +6–9 damage, +1 MP.",
  },
};

/** Weapon upgrade: souls + materials per level. Damage bonus per level: +4 flat both ends. */
export const UPGRADE_COST = (lvl: number) => ({
  souls: 150 * (lvl + 1),
  bones: lvl + 1,
  shards: lvl,
});
export const UPGRADE_DMG_PER_LVL = 4;
export const MAX_WEAPON_LVL = 5;

/** Level up: cost grows per level; each stat point gives fixed bonus. */
export const LEVELUP_COST = (level: number) => Math.floor(80 * Math.pow(1.22, level - 1));
export const VIT_HP = 8;
export const STR_DMG = 0.04; // +4% phys per point
export const INT_DMG = 0.04; // +4% soul/fire per point
export const AGI_INIT = 5;
