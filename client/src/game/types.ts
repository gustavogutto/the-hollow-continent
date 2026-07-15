/* The Hollow Continent — shared types
 * Style: Ashen Gothic — grim tactical Souls-like. All gameplay data flows through these types. */

export interface Vec2 {
  x: number;
  y: number;
}

export type Facing = "N" | "E" | "S" | "W";

export type Element = "physical" | "fire" | "soul";

export interface SpellDef {
  id: string;
  name: string;
  icon: number; // ui_icons_kit cell index (0-based)
  apCost: number;
  range: [number, number]; // min, max (manhattan)
  needsLos: boolean;
  dmg: [number, number];
  element: Element;
  push?: number; // tiles pushed away from caster
  pull?: number; // tiles pulled toward caster
  aoe?: number; // radius 0 = single target
  heal?: [number, number];
  posture: number; // posture damage dealt
  selfMove?: number; // dash tiles
  buffAp?: number;
  leavesFire?: boolean; // scorches target tiles for a few turns
  desc: string;
}

export type WalkKey = "kardorim" | "warden" | "sentinel" | "skel_melee" | "skel_archer" | "beast" | "toad" | "fly" | "gargoyle" | "frail" | "drowned" | "sunkarcher" | "priest" | "mage" | "archer" | "pc_mage" | "pc_archer" | "hover" | "golem" | "serpent" | "spider" | "vulkas" | "morvane" | "aurelion" | "ashspirit" | "wflame" | "brinewraith" | "windreaper" | "dandelion" | "moray";

export type AttackKey = "knight" | "skel" | "kardorim" | "warden" | "sentinel" | "beast" | "toad" | "boar" | "garg" | "frail" | "drowned" | "sunkarcher" | "priest" | "mage" | "archer" | "pc_mage" | "pc_archer" | "golem" | "serpent" | "spider" | "vulkas" | "morvane" | "aurelion" | "corpsefly" | "dandelion" | "ashspirit" | "wflame" | "brinewraith" | "corpsefish" | "tidecrab" | "moray" | "ratking" | "wstatue" | "lurker" | "windreaper";

export type MoveStyle = "walk" | "hop" | "fly" | "drift" | "swim" | "scuttle";

export interface MobDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  ap: number;
  mp: number;
  initiative: number;
  dmg: [number, number];
  range: [number, number];
  element: Element;
  postureMax: number;
  resistPhys?: number; // 0..0.9 fraction reduced
  resistFire?: number;
  resistSoul?: number;
  souls: number;
  sprite: SpriteRef;
  scale?: number;
  /** Walk-animation archetype: which shared walk sheet this mob uses; "hover" floats. */
  walkKey?: WalkKey;
  /** Attack-animation archetype (sheet playback); omit for lunge-only. */
  attackKey?: AttackKey;
  /** Idle breathing strip (6-frame) for standing animation; omit for static sprite. */
  idleKey?: "frail" | "drowned";
  /** Locomotion personality: how this mob physically travels between tiles.
   * walk = grounded stride; hop = arced jumps (toad); fly = airborne wing-flap (uses walkKey strip);
   * drift = ethereal glide with sway (wraiths/flames); swim = low undulating sway (fish/moray);
   * scuttle = quick stepped bursts (rat/spider/crab). Defaults to "walk". */
  moveStyle?: MoveStyle;
  special?:
    | "revive"
    | "explode_death"
    | "poison"
    | "pull"
    | "push_charge"
    | "steal_ap"
    | "shield_front"
    | "invisible"
    | "web_mp"
    | "buff_allies"
    | "aoe_mage"
    | "summon";
  desc: string;
}

export interface SpriteRef {
  url: string;
  // kit-sheet crop (grid cells), omit for full-image sprites
  grid?: number; // e.g. 3 for 3x3
  cell?: number; // 0-based index
}

export type PropKind =
  | "pillar"
  | "gravestone"
  | "tree"
  | "chest"
  | "bones"
  | "arch"
  | "brazier"
  | "boulder"
  | "cart"
  | "illusory"; // looks like a pillar; walk into it to reveal a secret

export interface PropDef {
  kind: PropKind;
  pos: Vec2;
  chestLoot?: string[]; // item ids
  chestSouls?: number;
  opened?: boolean;
}

export interface MobGroupDef {
  id: string;
  mobIds: string[]; // mob def ids
  pos: Vec2;
}

export interface PageDef {
  id: string; // "px_y" world coords or "dungeon_N"
  name: string;
  kind: "overworld" | "dungeon" | "hub";
  tileset: "ash" | "crypt" | "sunken";
  zone?: 1 | 2 | 3 | 4 | 5; // 2 Sunken Reach, 3 Cinder Marches, 4 Pale Marsh, 5 Shattered Peaks
  props: PropDef[];
  groups: MobGroupDef[];
  bonfire?: { pos: Vec2; name: string };
  npcs?: { id: "elara" | "gromm"; pos: Vec2 }[];
  dungeonEntrance?: { pos: Vec2; to: string };
  dungeonNext?: { pos: Vec2; to: string }; // door to next room (locked until room cleared)
  exitToOverworld?: { pos: Vec2; to: string };
  ambient?: string;
}

export interface ItemDef {
  id: string;
  name: string;
  slot: "weapon" | "armor" | "helmet" | "ring" | "material" | "key" | "consumable";
  icon: number;
  dmgBonus?: [number, number];
  hpBonus?: number;
  apBonus?: number;
  mpBonus?: number;
  desc: string;
}

export interface Unit {
  uid: number;
  defId: string;
  name: string;
  isPlayer: boolean;
  isBoss?: boolean;
  level: number;
  hp: number;
  hpMax: number;
  ap: number;
  apMax: number;
  mp: number;
  mpMax: number;
  initiative: number;
  pos: Vec2;
  facing: Facing;
  posture: number;
  postureMax: number;
  staggered: number; // turns remaining staggered
  poisoned: number; // turns of poison
  webbed: number; // turns of reduced MP
  invisible: number;
  buffedAp: number;
  revived?: boolean; // for skeleton novice one-time revive
  frenzied?: boolean; // berserker archetype: locked-in frenzy below half HP
  dead: boolean;
  sprite: SpriteRef;
  scale: number;
  souls: number;
  walkKey?: WalkKey;
  attackKey?: AttackKey;
  idleKey?: "frail" | "drowned";
  moveStyle?: MoveStyle;
  mobDef?: MobDef;
}

export interface PlayerStats {
  level: number;
  vitality: number;
  strength: number;
  intelligence: number;
  agility: number;
  souls: number;
}

export interface SaveData {
  /** Chosen player class; old saves merge to "knight". */
  playerClass: "knight" | "mage" | "archer";
  stats: PlayerStats;
  weaponLevel: number;
  equipment: { weapon: string; armor: string | null; helmet: string | null; ring: string | null };
  inventory: string[];
  flasks: number;
  flasksMax: number;
  discoveredBonfires: string[]; // page ids
  lastBonfire: string; // page id
  openedChests: string[]; // pageId:x,y
  clearedGroups: string[]; // pageId:groupId (cleared until next rest)
  clearedRooms: string[]; // dungeon room ids permanently? no — until rest; boss permanent
  bossDefeated: boolean;
  wardenDefeated: boolean;
  droppedSouls: { pageId: string; pos: Vec2; amount: number } | null;
  currentPage: string;
  playerPos: Vec2;
  hp: number;
  hasAshenCrown: boolean;
  /** Spell ids beyond the starting kit that the player has unlocked at Elara. */
  unlockedSpells: string[];
  /** Side-quest progress. */
  quests: {
    grommOre: number; // ember ore collected (need 3)
    grommDone: boolean;
    elaraMemories: number; // memory fragments found (need 3)
    elaraDone: boolean;
  };
  /** Secret ids discovered (illusory walls, hidden chests). */
  secretsFound: string[];
  sentinelDefeated: boolean;
  /** Expansion dungeon boss flags — these bosses stay dead permanently. */
  vulkasDefeated: boolean;
  morvaneDefeated: boolean;
  aurelionDefeated: boolean;
  /** Player has dismissed/seen the controls help overlay at least once. */
  helpSeen: boolean;
  /** The scripted first fight has been completed (or skipped on older saves). */
  tutorialDone: boolean;
  /** Accumulated play time in seconds. */
  playTime: number;
  /** Epoch ms of last write (stamped on save). */
  savedAt: number;
}

export type GameMode = "menu" | "explore" | "combat" | "dead" | "victory";

export interface CombatUnitView {
  uid: number;
  name: string;
  isPlayer: boolean;
  isBoss?: boolean;
  hp: number;
  hpMax: number;
  posture: number;
  postureMax: number;
  staggered: boolean;
  dead: boolean;
  level: number;
}

/** Snapshot pushed to React HUD via events */
export interface HudState {
  mode: GameMode;
  hp: number;
  hpMax: number;
  ap: number;
  apMax: number;
  mp: number;
  mpMax: number;
  souls: number;
  flasks: number;
  flasksMax: number;
  level: number;
  zoneName: string;
  inCombat: boolean;
  isPlayerTurn: boolean;
  turnOrder: CombatUnitView[];
  activeUid: number;
  selectedSpell: number; // index or -1
  boss: CombatUnitView | null;
  weaponLevel: number;
  canInteract: string | null; // interaction hint text
  /** ids of the spells currently on the action bar (base + unlocked) */
  spellIds: string[];
  /** controls help overlay visibility (toggled with ? button / H key) */
  helpVisible: boolean;
  /** system/pause menu visibility (pause button / Esc) */
  menuOpen: boolean;
}
