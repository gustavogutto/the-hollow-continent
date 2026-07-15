/* Ashen Gothic — Character sheet (C) with combined inventory/equipment, World Map (M). */
import { useEffect, useState, useCallback } from "react";
import { bus } from "@/game/core/events";
import { getGame } from "@/components/GameCanvas";
import { ITEMS, UPGRADE_DMG_PER_LVL } from "@/game/data/items";
import { CLASSES } from "@/game/data/classes";
import { PAGES } from "@/game/data/world";
import { iconDataUrl } from "@/game/engine/assets";

type Tab = "character" | "map" | null;

export default function CharacterMap() {
  const [tab, setTab] = useState<Tab>(null);
  const [, force] = useState(0);

  const onDialogue = useCallback((p?: unknown) => {
    const npc = (p as { npc: string })?.npc;
    if (npc === "inventory") setTab((t) => (t === "character" ? null : "character"));
    if (npc === "map") setTab((t) => (t === "map" ? null : "map"));
  }, []);
  useEffect(() => {
    const off = bus.on("dialogue", onDialogue);
    return () => {
      off();
    };
  }, [onDialogue]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTab(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!tab) return null;
  const game = getGame();
  if (!game) return null;
  const save = game.save;
  const close = () => setTab(null);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 animate-in fade-in duration-200" onClick={close}>
      <div
        className="max-h-[86vh] w-[min(640px,94vw)] overflow-y-auto border border-[#c8a24b]/30 bg-[#12100d]/95 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* tabs */}
        <div className="flex border-b border-[#c8a24b]/20">
          {(["character", "map"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 font-display text-sm uppercase tracking-[0.2em] transition-colors ${
                tab === t ? "bg-[#c8a24b]/10 text-[#c8a24b]" : "text-[#d6cdbb]/50 hover:text-[#d6cdbb]"
              }`}
            >
              {t === "character" ? "Character (C)" : "World Map (M)"}
            </button>
          ))}
          <button onClick={close} className="px-4 text-xs text-[#d6cdbb]/40 hover:text-[#d6cdbb]">✕</button>
        </div>

        {tab === "character" ? <CharacterPanel forceUpdate={() => force((n) => n + 1)} /> : <MapPanel />}
      </div>
    </div>
  );
}

function CharacterPanel({ forceUpdate }: { forceUpdate: () => void }) {
  const game = getGame()!;
  const save = game.save;
  const s = save.stats;
  const equipped = [save.equipment.weapon, save.equipment.armor, save.equipment.helmet, save.equipment.ring].filter(Boolean) as string[];
  // count inventory items
  const counts = new Map<string, number>();
  save.inventory.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));

  return (
    <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
      {/* stats */}
      <div>
        <h4 className="font-display text-xs uppercase tracking-[0.25em] text-[#c8a24b]/80">{CLASSES[save.playerClass ?? "knight"].title}</h4>
        <div className="mt-3 space-y-1.5 text-sm">
          <StatRow label="Level" value={s.level} />
          <StatRow label="Souls" value={s.souls.toLocaleString()} accent />
          <StatRow label="Vitality" value={s.vitality} sub={`${game.player.hpMax} max HP`} />
          <StatRow label="Strength" value={s.strength} sub={`+${s.strength * 4}% physical`} />
          <StatRow label="Intelligence" value={s.intelligence} sub={`+${s.intelligence * 4}% soul/fire`} />
          <StatRow label="Agility" value={s.agility} sub={`${50 + s.agility * 5} initiative`} />
          <StatRow label="Weapon" value={`${ITEMS[save.equipment.weapon]?.name ?? "Weapon"} +${save.weaponLevel}`} sub={`+${save.weaponLevel * UPGRADE_DMG_PER_LVL} damage`} />
          <StatRow label="Flasks" value={`${save.flasks} / ${save.flasksMax}`} />
        </div>
      </div>
      {/* inventory */}
      <div>
        <h4 className="font-display text-xs uppercase tracking-[0.25em] text-[#c8a24b]/80">Possessions</h4>
        <div className="mt-3 space-y-1.5">
          {Array.from(counts.entries()).map(([id, n]) => {
            const item = ITEMS[id];
            if (!item) return null;
            const isEquipped = equipped.includes(id);
            const equippable = ["armor", "helmet", "ring", "weapon"].includes(item.slot);
            return (
              <div key={id} className="flex items-center gap-2.5 border border-white/8 bg-black/40 px-3 py-2">
                {iconDataUrl(item.icon) && (
                  <img src={iconDataUrl(item.icon)} alt="" className="h-7 w-7 object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm text-[#f0e6d2]">
                    {item.name}
                    {n > 1 && <span className="text-xs text-[#d6cdbb]/50">×{n}</span>}
                    {isEquipped && <span className="text-[9px] uppercase tracking-wider text-[#8adbb4]">equipped</span>}
                  </div>
                  <div className="truncate text-[11px] text-[#d6cdbb]/50">{item.desc}</div>
                </div>
                {equippable && !isEquipped && (
                  <button
                    onClick={() => {
                      game.equip(id);
                      forceUpdate();
                    }}
                    className="shrink-0 border border-[#c8a24b]/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#c8a24b] hover:bg-[#c8a24b]/10 active:scale-95"
                  >
                    Equip
                  </button>
                )}
              </div>
            );
          })}
          {counts.size === 0 && <p className="text-sm text-[#d6cdbb]/40">Nothing but ash in your pockets.</p>}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/5 pb-1">
      <span className="text-[#d6cdbb]/60">{label}</span>
      <span className="text-right">
        <span className={accent ? "text-[#8adbb4]" : "text-[#f0e6d2]"}>{value}</span>
        {sub && <span className="ml-2 text-[11px] text-[#d6cdbb]/40">{sub}</span>}
      </span>
    </div>
  );
}

const ZONE_TABS: {
  prefix: string;
  name: string;
  w: number;
  h: number;
  blurb: string;
  unlocked: (s: ReturnType<typeof getGame> extends infer _ ? any : never) => boolean;
  lockHint: string;
}[] = [
  {
    prefix: "p", name: "Pale Sepulchre", w: 5, h: 5,
    blurb: "A shattered isle adrift above the Hollow Continent. The crypt festers in the north-east.",
    unlocked: () => true, lockHint: "",
  },
  {
    prefix: "s", name: "Sunken Reach", w: 3, h: 3,
    blurb: "The drowned shelf below the Sepulchre. The sea here remembers everything it has taken.",
    unlocked: (s) => s.bossDefeated, lockHint: "Defeat the Hollow King to unseal the drowned stair.",
  },
  {
    prefix: "g", name: "Cinder Marches", w: 5, h: 5,
    blurb: "A burning west where the sky rains ash. The Ember Foundry hammers on, masterless no longer.",
    unlocked: (s) => s.sentinelDefeated, lockHint: "Fell the Drowned Sentinel to open the western pass.",
  },
  {
    prefix: "m", name: "Pale Marsh", w: 4, h: 4,
    blurb: "A fog-drowned fen that swallows echoes whole. The catacombs beneath it weep upward.",
    unlocked: (s) => s.vulkasDefeated, lockHint: "Silence the Forge Tyrant to thin the marsh fog.",
  },
  {
    prefix: "k", name: "Shattered Peaks", w: 4, h: 4,
    blurb: "The roof of the world, sheared open. From the Spire's crown, one voice still sings.",
    unlocked: (s) => s.morvaneDefeated, lockHint: "Still the Weeping Matriarch to clear the mountain pass.",
  },
];

function MapPanel() {
  const game = getGame()!;
  const save = game.save;
  const current = save.currentPage;
  const curPrefix = /^[a-z]/.exec(current)?.[0] ?? "p";
  const inDungeon = !PAGES[current] || PAGES[current].kind === "dungeon";
  const homeTab = ZONE_TABS.find((z) => z.prefix === curPrefix && !inDungeon) ?? ZONE_TABS[0];
  const [tab, setTab] = useState(homeTab.prefix);
  const zone = ZONE_TABS.find((z) => z.prefix === tab) ?? ZONE_TABS[0];
  const zoneUnlocked = zone.unlocked(save);

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap justify-center gap-1.5">
        {ZONE_TABS.map((z) => {
          const open = z.unlocked(save);
          return (
            <button
              key={z.prefix}
              onClick={() => setTab(z.prefix)}
              className={`border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                tab === z.prefix
                  ? "border-[#c8a24b] bg-[#c8a24b]/15 text-[#c8a24b]"
                  : open
                    ? "border-white/15 text-[#d6cdbb]/70 hover:border-white/30"
                    : "border-white/8 text-[#d6cdbb]/30"
              }`}
            >
              {open ? z.name : `⊘ ${z.name}`}
            </button>
          );
        })}
      </div>
      <p className="mb-4 text-center text-xs italic text-[#d6cdbb]/55">
        {zoneUnlocked ? zone.blurb : zone.lockHint}
      </p>
      {zoneUnlocked ? (
        <div className="mx-auto grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${zone.w}, minmax(0, 1fr))` }}>
          {Array.from({ length: zone.h }).flatMap((_, y) =>
            Array.from({ length: zone.w }).map((_, x) => {
              const id = `${zone.prefix}${x}_${y}`;
              const page = PAGES[id];
              const isCurrent = id === current;
              const hasBonfire = !!page?.bonfire;
              const isGate = !!page?.dungeonEntrance;
              return (
                <div
                  key={id}
                  className={`relative flex h-[64px] w-[92px] flex-col items-center justify-center border p-1 text-center transition-all ${
                    isCurrent
                      ? "border-[#c8a24b] bg-[#c8a24b]/15 shadow-[0_0_14px_rgba(200,162,75,0.3)]"
                      : page
                        ? "border-white/10 bg-black/40"
                        : "border-white/5 bg-black/20"
                  }`}
                >
                  <span className="text-[9px] leading-tight text-[#d6cdbb]/75">{page?.name ?? "—"}</span>
                  <div className="mt-1 flex gap-1.5">
                    {hasBonfire && <span className="text-[10px] text-[#e8823c]" title="Bonfire">🔥</span>}
                    {isGate && <span className="text-[10px] text-[#b04434]" title="Dungeon entrance">☠</span>}
                    {isCurrent && <span className="text-[10px] text-[#c8a24b]">◆</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#d6cdbb]/35">This land is still veiled from your map.</p>
      )}
      {inDungeon && (
        <p className="mt-4 text-center text-sm text-[#b04434]">
          You are below — {PAGES[current]?.name}. The map of the living cannot chart the depths.
        </p>
      )}
      <div className="mt-4 flex justify-center gap-6 text-[11px] text-[#d6cdbb]/50">
        <span>🔥 bonfire</span>
        <span>☠ dungeon gate</span>
        <span className="text-[#c8a24b]">◆ you</span>
      </div>
    </div>
  );
}
