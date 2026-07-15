/* localStorage persistence with 5 save slots. Inventory and equipment are never lost on death — only souls.
 * Slots live at echoes_save_slot_{1..5}; the legacy single-save key migrates into slot 1 on first load. */
import type { SaveData } from "../types";
import { START_PAGE, START_POS } from "../data/world";
import { PAGES } from "../data/world";

const LEGACY_KEY = "echoes_save_v1";
const SLOT_KEY = (n: number) => `echoes_save_slot_${n}`;
const ACTIVE_KEY = "echoes_active_slot";
export const SLOT_COUNT = 5;

export interface SlotMeta {
  slot: number;
  empty: boolean;
  playerClass?: "knight" | "mage" | "archer";
  level?: number;
  souls?: number;
  location?: string;
  playTime?: number; // seconds
  savedAt?: number; // epoch ms
}

const START_WEAPON: Record<"knight" | "mage" | "archer", string> = {
  knight: "ember_blade",
  mage: "ashen_staff",
  archer: "rangers_longbow",
};

export function defaultSave(cls: "knight" | "mage" | "archer" = "knight"): SaveData {
  return {
    playerClass: cls,
    stats: { level: 1, vitality: 0, strength: 0, intelligence: 0, agility: 0, souls: 0 },
    weaponLevel: 0,
    equipment: { weapon: START_WEAPON[cls], armor: null, helmet: null, ring: null },
    inventory: [START_WEAPON[cls]],
    flasks: 3,
    flasksMax: 3,
    discoveredBonfires: [START_PAGE],
    lastBonfire: START_PAGE,
    openedChests: [],
    clearedGroups: [],
    clearedRooms: [],
    bossDefeated: false,
    wardenDefeated: false,
    droppedSouls: null,
    currentPage: START_PAGE,
    playerPos: { ...START_POS },
    hp: -1, // -1 = full
    hasAshenCrown: false,
    unlockedSpells: [],
    quests: { grommOre: 0, grommDone: false, elaraMemories: 0, elaraDone: false },
    secretsFound: [],
    sentinelDefeated: false,
    vulkasDefeated: false,
    morvaneDefeated: false,
    aurelionDefeated: false,
    helpSeen: false,
    tutorialDone: false,
    playTime: 0,
    savedAt: 0,
  };
}

/** One-time migration: move the legacy single save into slot 1 if no slots exist yet. */
function migrateLegacy() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const anySlot = Array.from({ length: SLOT_COUNT }, (_, i) => localStorage.getItem(SLOT_KEY(i + 1))).some(Boolean);
    if (!anySlot) {
      localStorage.setItem(SLOT_KEY(1), legacy);
      localStorage.setItem(ACTIVE_KEY, "1");
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as SaveData;
    if (!data.stats || !data.currentPage) return null;
    const d = defaultSave();
    const merged = { ...d, ...data, quests: { ...d.quests, ...(data.quests ?? {}) } };
    // older saves predate the scripted first fight — never replay it for a run in progress
    if ((data as Partial<SaveData>).tutorialDone === undefined && (data.playTime ?? 0) > 0) merged.tutorialDone = true;
    return merged;
  } catch {
    return null;
  }
}

export function getActiveSlot(): number {
  migrateLegacy();
  const n = parseInt(localStorage.getItem(ACTIVE_KEY) ?? "1", 10);
  return n >= 1 && n <= SLOT_COUNT ? n : 1;
}

export function setActiveSlot(slot: number) {
  try {
    localStorage.setItem(ACTIVE_KEY, String(slot));
  } catch {
    /* ignore */
  }
}

/** Load the save in a specific slot (defaults to active slot). */
export function loadSlot(slot?: number): SaveData | null {
  migrateLegacy();
  const n = slot ?? getActiveSlot();
  try {
    return parseSave(localStorage.getItem(SLOT_KEY(n)));
  } catch {
    return null;
  }
}

/** Write the save to a specific slot (defaults to active slot), stamping savedAt. */
export function writeSlot(data: SaveData, slot?: number) {
  const n = slot ?? getActiveSlot();
  try {
    localStorage.setItem(SLOT_KEY(n), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* storage full/blocked — ignore */
  }
}

export function clearSlot(slot: number) {
  try {
    localStorage.removeItem(SLOT_KEY(slot));
  } catch {
    /* ignore */
  }
}

/** Metadata cards for the slot picker UI. */
export function slotMetas(): SlotMeta[] {
  migrateLegacy();
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const n = i + 1;
    const s = parseSave(localStorage.getItem(SLOT_KEY(n)));
    if (!s) return { slot: n, empty: true };
    return {
      slot: n,
      empty: false,
      playerClass: s.playerClass,
      level: s.stats.level,
      souls: s.stats.souls,
      location: PAGES[s.currentPage]?.name ?? s.currentPage,
      playTime: s.playTime ?? 0,
      savedAt: s.savedAt ?? 0,
    };
  });
}

/** Most recently saved non-empty slot, or null. */
export function mostRecentSlot(): number | null {
  const metas = slotMetas().filter((m) => !m.empty);
  if (!metas.length) return null;
  metas.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
  return metas[0].slot;
}

export function formatPlayTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

/* Back-compat wrappers (existing call sites) — operate on the active slot. */
export function loadSave(): SaveData | null {
  return loadSlot();
}

export function writeSave(data: SaveData) {
  writeSlot(data);
}

export function clearSave() {
  clearSlot(getActiveSlot());
}
