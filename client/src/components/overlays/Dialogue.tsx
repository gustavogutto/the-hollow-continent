/* Ashen Gothic — NPC dialogue, level-up (Elara), smithing (Gromm), bonfire menu. */
import { useEffect, useState, useCallback } from "react";
import { bus } from "@/game/core/events";
import { getGame } from "@/components/GameCanvas";
import { URLS } from "@/game/engine/assets";
import { LEVELUP_COST, UPGRADE_COST, MAX_WEAPON_LVL, ITEMS, UPGRADE_DMG_PER_LVL } from "@/game/data/items";
import { CLASSES } from "@/game/data/classes";
import { PAGES } from "@/game/data/world";

type Panel = "elara" | "gromm" | "elara_intro" | "bonfire" | null;

const ELARA_LINES = [
  "The flame remembers you, ember-bearer, even when the world does not.",
  "Souls are the only coin that matters here. Spend them before the ash takes them back.",
  "Kardorim was not always a monster. He was the first to carry the flame — and the first it consumed.",
  "Rest when you can. The dead are patient; you need not be reckless.",
];

const GROMM_LINES = [
  "A dull blade is a slow death. Bring me bones and iron; I'll give you an edge worth dying behind.",
  "I shod horses for the twelve armies once. Now I sharpen steel for one stubborn soul. Heh.",
  "That blade of yours drinks embers. Feed it and it will not fail you.",
];

export default function Dialogue() {
  const [panel, setPanel] = useState<Panel>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const onDialogue = useCallback((p?: unknown) => {
    const npc = (p as { npc: string })?.npc;
    if (npc === "elara" || npc === "gromm" || npc === "elara_intro") {
      getGame()?.hideHelp(); // never stack the controls overlay on a dialogue
      setPanel(npc as Panel);
      setLineIdx(0);
    }
  }, []);
  useEffect(() => {
    const off = bus.on("dialogue", onDialogue);
    const off2 = bus.on("bonfireMenu", () => {
      getGame()?.hideHelp();
      setPanel("bonfire");
    });
    return () => {
      off();
      off2();
    };
  }, [onDialogue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // notify the game when a dialogue closes (drives one-time first-run help)
  useEffect(() => {
    if (panel === null) getGame()?.onDialogueClosed();
  }, [panel]);

  if (!panel) return null;
  const game = getGame();
  if (!game) return null;
  const save = game.save;

  const close = () => setPanel(null);

  /* ----- Elara intro (Melina-style greeting) ----- */
  if (panel === "elara_intro") {
    const introLines = [
      { speaker: "Elara", text: "So. Another ember answers the flame. I had begun to think the fire had given up on this place." },
      { speaker: "Elara", text: "I am Elara, keeper of what souls remain. I will trade your gathered souls for strength — that is my purpose, and my penance." },
      { speaker: "Elara", text: "North of here, past the graves, the Crypt of the First King festers. Kardorim's crown must be reclaimed... or this isle will never see dawn." },
      { speaker: "Elara", text: "Go gently, ember-bearer. When you fall — and you will fall — the bonfire will call you back. Your souls, however, will not follow." },
    ];
    const line = introLines[lineIdx];
    return (
      <DialogueFrame portrait={URLS.elara} name={line.speaker} onClose={close}>
        <p className="font-body text-base italic leading-relaxed text-[#d6cdbb]">{line.text}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={close} className="px-4 py-1.5 text-xs uppercase tracking-[0.15em] text-[#d6cdbb]/50 hover:text-[#d6cdbb]">
            Skip
          </button>
          <button
            onClick={() => (lineIdx < introLines.length - 1 ? setLineIdx(lineIdx + 1) : close())}
            className="border border-[#c8a24b]/50 bg-black/40 px-6 py-1.5 font-display text-sm tracking-[0.15em] text-[#c8a24b] uppercase hover:bg-[#c8a24b]/10 active:scale-[0.97]"
          >
            {lineIdx < introLines.length - 1 ? "Continue" : "Begin"}
          </button>
        </div>
      </DialogueFrame>
    );
  }

  /* ----- Elara: level up ----- */
  if (panel === "elara") {
    const cost = LEVELUP_COST(save.stats.level);
    const stats: { key: "vitality" | "strength" | "intelligence" | "agility"; label: string; desc: string; val: number }[] = [
      { key: "vitality", label: "Vitality", desc: "+8 max HP", val: save.stats.vitality },
      { key: "strength", label: "Strength", desc: "+4% physical damage", val: save.stats.strength },
      { key: "intelligence", label: "Intelligence", desc: "+4% soul & fire damage", val: save.stats.intelligence },
      { key: "agility", label: "Agility", desc: "+5 initiative", val: save.stats.agility },
    ];
    return (
      <DialogueFrame portrait={URLS.elara} name="Elara, the Soul Keeper" onClose={close}>
        <p className="font-body text-sm italic leading-relaxed text-[#d6cdbb]/85">
          {ELARA_LINES[lineIdx % ELARA_LINES.length]}
        </p>
        <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#d6cdbb]/50">Level {save.stats.level} → {save.stats.level + 1}</span>
          <span className="flex items-center gap-1.5 text-sm text-[#8adbb4]">
            <span className="h-2 w-2 rounded-full bg-[#8adbb4] shadow-[0_0_6px_#8adbb4]" />
            {cost.toLocaleString()} souls needed · you hold {save.stats.souls.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <button
              key={s.key}
              disabled={save.stats.souls < cost}
              onClick={() => {
                if (game.levelUp(s.key, cost)) {
                  setLineIdx((i) => i + 1);
                  rerender();
                  bus.emit("toast", { msg: `${s.label} increased. You are level ${game.save.stats.level}.` });
                }
              }}
              className="group flex items-center justify-between border border-[#c8a24b]/25 bg-black/40 px-4 py-3 text-left transition-all hover:border-[#c8a24b]/60 hover:bg-[#c8a24b]/5 active:scale-[0.98] disabled:opacity-40 disabled:hover:border-[#c8a24b]/25"
            >
              <div>
                <div className="font-display text-sm text-[#f0e6d2]">{s.label} <span className="text-[#c8a24b]">{s.val}</span></div>
                <div className="text-[11px] text-[#d6cdbb]/55">{s.desc}</div>
              </div>
              <span className="font-display text-lg text-[#c8a24b]/60 group-hover:text-[#c8a24b]">+</span>
            </button>
          ))}
        </div>

        {/* Teachings — unlockable spells */}
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[#d6cdbb]/50">Teachings of the Flame</div>
          <div className="mt-2 space-y-1.5">
            {CLASSES[save.playerClass ?? "knight"].unlockables.map((sp) => {
              const req = CLASSES[save.playerClass ?? "knight"].unlocks[sp.id];
              const known = save.unlockedSpells.includes(sp.id);
              const can = !known && save.stats.level >= req.level && save.stats.souls >= req.souls;
              return (
                <div key={sp.id} className="flex items-center justify-between border border-white/8 bg-black/30 px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-display text-sm text-[#f0e6d2]">{sp.name}</div>
                    <div className="truncate text-[11px] text-[#d6cdbb]/55">{sp.desc}</div>
                  </div>
                  {known ? (
                    <span className="ml-3 shrink-0 text-[10px] uppercase tracking-wider text-[#8adbb4]">learned</span>
                  ) : (
                    <button
                      disabled={!can}
                      onClick={() => {
                        if (game.learnSpell(sp.id, req)) {
                          rerender();
                          bus.emit("toast", { msg: `${sp.name} learned. It waits on your action bar.` });
                        }
                      }}
                      className="ml-3 shrink-0 border border-[#c8a24b]/40 bg-black/40 px-3 py-1 text-[11px] text-[#c8a24b] transition-all hover:bg-[#c8a24b]/10 active:scale-95 disabled:opacity-40"
                    >
                      Lv {req.level} · {req.souls.toLocaleString()} souls
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Memory quest */}
        <ElaraQuest rerender={rerender} />
      </DialogueFrame>
    );
  }

  /* ----- Gromm: smithing + equipment ----- */
  if (panel === "gromm") {
    const lvl = save.weaponLevel;
    const cost = UPGRADE_COST(lvl);
    const bones = save.inventory.filter((i) => i === "old_bone").length;
    const shards = save.inventory.filter((i) => i === "iron_shard").length;
    const maxed = lvl >= MAX_WEAPON_LVL;
    const canAfford = !maxed && save.stats.souls >= cost.souls && bones >= cost.bones && shards >= cost.shards;
    return (
      <DialogueFrame portrait={URLS.gromm} name="Gromm, the Blacksmith" onClose={close}>
        <p className="font-body text-sm italic leading-relaxed text-[#d6cdbb]/85">
          {GROMM_LINES[lineIdx % GROMM_LINES.length]}
        </p>
        <div className="mt-4 border border-[#c8a24b]/20 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-base text-[#f0e6d2]">
                Ember Blade <span className="text-[#e8823c]">+{lvl}</span>
              </div>
              <div className="text-[11px] text-[#d6cdbb]/55">
                {maxed ? "The blade holds all the fire it can bear." : `Reinforce to +${lvl + 1} — adds +${UPGRADE_DMG_PER_LVL} physical damage`}
              </div>
            </div>
            {!maxed && (
              <button
                disabled={!canAfford}
                onClick={() => {
                  if (game.upgradeWeapon(cost)) {
                    setLineIdx((i) => i + 1);
                    rerender();
                    bus.emit("toast", { msg: `The Ember Blade sings — now +${game.save.weaponLevel}.` });
                  }
                }}
                className="border border-[#e8823c]/50 bg-[#3a1d10]/60 px-5 py-2 font-display text-sm tracking-[0.12em] text-[#e8823c] uppercase transition-all hover:bg-[#e8823c]/15 active:scale-[0.97] disabled:opacity-40"
              >
                Reinforce
              </button>
            )}
          </div>
          {!maxed && (
            <div className="mt-3 flex gap-4 border-t border-white/8 pt-2 text-xs">
              <Cost ok={save.stats.souls >= cost.souls} label={`${cost.souls} souls`} have={save.stats.souls} />
              <Cost ok={bones >= cost.bones} label={`${cost.bones} old bone`} have={bones} />
              <Cost ok={shards >= cost.shards} label={`${cost.shards} iron shard`} have={shards} />
            </div>
          )}
        </div>
        {/* Ember ore quest */}
        <GrommQuest rerender={rerender} />
        <p className="mt-3 text-[11px] text-[#d6cdbb]/45">
          Bones and iron fall from the dead across the isle. Chests hide the finer things.
        </p>
      </DialogueFrame>
    );
  }

  /* ----- Bonfire rest menu ----- */
  if (panel === "bonfire") {
    const discovered = save.discoveredBonfires.filter((id) => PAGES[id]?.bonfire);
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 animate-in fade-in duration-300" onClick={close}>
        <div
          className="w-[min(480px,92vw)] border border-[#c8a24b]/30 bg-[#12100d]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-[0.35em] text-[#e8823c]">Bonfire</span>
            <h3 className="font-display mt-1 text-2xl text-[#f0e6d2]">{PAGES[save.currentPage]?.bonfire?.name}</h3>
            <p className="mt-1 text-xs text-[#d6cdbb]/55">Health restored · flasks refilled · the dead have returned</p>
          </div>
          <div className="mt-5 space-y-2">
            <button
              onClick={() => {
                close();
                bus.emit("dialogue", { npc: "elara" });
              }}
              className="w-full border border-white/10 bg-black/40 px-4 py-2.5 text-left text-sm text-[#d6cdbb] transition-colors hover:border-[#c8a24b]/40"
            >
              <span className="font-display text-[#c8a24b]">Strengthen</span>
              <span className="ml-2 text-xs text-[#d6cdbb]/50">— spend souls with Elara (only at the Shrine)</span>
            </button>
            {discovered.length > 1 && (
              <div className="border border-white/10 bg-black/40 px-4 py-2.5">
                <div className="font-display text-sm text-[#c8a24b]">Travel</div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {discovered.map((id) => (
                    <button
                      key={id}
                      disabled={id === save.currentPage}
                      onClick={() => {
                        close();
                        game.teleportToBonfire(id);
                      }}
                      className="flex items-center justify-between px-2 py-1.5 text-left text-sm text-[#d6cdbb]/85 transition-colors hover:bg-[#c8a24b]/10 disabled:opacity-40"
                    >
                      <span>{PAGES[id].bonfire!.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#d6cdbb]/40">
                        {id === save.currentPage ? "here" : "travel"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={close}
              className="w-full border border-[#c8a24b]/40 bg-black/50 px-4 py-2.5 font-display text-sm tracking-[0.15em] text-[#c8a24b] uppercase transition-all hover:bg-[#c8a24b]/10 active:scale-[0.98]"
            >
              Rise and Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/** Elara's lore quest: bring 3 memory fragments to hear the truth of the isle. */
function ElaraQuest({ rerender }: { rerender: () => void }) {
  const game = getGame();
  if (!game) return null;
  const save = game.save;
  const frags = save.inventory.filter((i) => i === "memory_fragment").length;
  if (save.quests.elaraDone) {
    return (
      <p className="mt-4 border-t border-white/10 pt-3 font-body text-xs italic text-[#d6cdbb]/60">
        “You returned my memories to me, ember-bearer. Whatever end you find, a part of me walks beside you.”
      </p>
    );
  }
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-[#d6cdbb]/50">Quest — The Keeper's Memories</div>
          <p className="mt-1 text-[11px] leading-snug text-[#d6cdbb]/70">
            “Fragments of my memory lie scattered in chests across the isle. Bring me three, and I will tell you what I was… and reward you well.”
          </p>
        </div>
        <button
          disabled={frags < 3}
          onClick={() => {
            if (game.completeElaraQuest()) {
              rerender();
              bus.emit("toast", { msg: "Elara remembers. 2,000 souls and the Keeper's Locket are yours." });
            }
          }}
          className="ml-3 shrink-0 border border-[#8adbb4]/40 bg-black/40 px-3 py-1.5 text-[11px] text-[#8adbb4] transition-all hover:bg-[#8adbb4]/10 active:scale-95 disabled:opacity-40"
        >
          Fragments {frags}/3
        </button>
      </div>
    </div>
  );
}

/** Gromm's quest: bring 2 ember ore to forge the Ember-Forged Greatsword. */
function GrommQuest({ rerender }: { rerender: () => void }) {
  const game = getGame();
  if (!game) return null;
  const save = game.save;
  const ore = save.inventory.filter((i) => i === "ember_ore").length;
  if (save.quests.grommDone) {
    return (
      <p className="mt-3 border-t border-white/10 pt-2 font-body text-xs italic text-[#d6cdbb]/60">
        “That greatsword is the finest work these old hands have done. Swing it well, ember-bearer.”
      </p>
    );
  }
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-[#d6cdbb]/50">Quest — The Old Forge's Hunger</div>
          <p className="mt-1 text-[11px] leading-snug text-[#d6cdbb]/70">
            “Ember ore — stone that still burns. The dead hoard it in chests and carry it in their ribs. Bring me two lumps and I'll forge you something the ash will fear.”
          </p>
        </div>
        <button
          disabled={ore < 2}
          onClick={() => {
            if (game.completeGrommQuest()) {
              rerender();
              bus.emit("toast", { msg: "Gromm forges the Ember-Forged Greatsword. It is yours." });
            }
          }}
          className="ml-3 shrink-0 border border-[#e8823c]/40 bg-black/40 px-3 py-1.5 text-[11px] text-[#e8823c] transition-all hover:bg-[#e8823c]/10 active:scale-95 disabled:opacity-40"
        >
          Ore {ore}/2
        </button>
      </div>
    </div>
  );
}

function Cost({ ok, label, have }: { ok: boolean; label: string; have: number }) {
  return (
    <span className={ok ? "text-[#8adbb4]" : "text-[#b04434]"}>
      {label} <span className="opacity-60">({have})</span>
    </span>
  );
}

function DialogueFrame({
  portrait,
  name,
  children,
  onClose,
}: {
  portrait: string;
  name: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 pb-10 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="flex w-[min(720px,94vw)] gap-5 border border-[#c8a24b]/30 bg-[#12100d]/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden w-32 shrink-0 sm:block">
          <div className="border border-[#c8a24b]/25 bg-black/60 p-1">
            <img src={portrait} alt={name} className="h-36 w-full object-contain object-bottom" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-[#c8a24b]/20 pb-2">
            <h3 className="font-display text-lg text-[#c8a24b]">{name}</h3>
            <button onClick={onClose} className="text-xs uppercase tracking-widest text-[#d6cdbb]/40 hover:text-[#d6cdbb]">
              Esc ✕
            </button>
          </div>
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
