/* Ashen Gothic overlays — main menu, YOU DIED, zone title cards, boss intro, victory. */
import { useEffect, useState, useCallback, useRef } from "react";
import { bus } from "@/game/core/events";
import { getGame } from "@/components/GameCanvas";
import { URLS } from "@/game/engine/assets";
import { slotMetas, clearSlot, formatPlayTime, mostRecentSlot, SLOT_COUNT, type SlotMeta } from "@/game/core/save";
import { CLASSES, CLASS_IDS, type PlayerClass } from "@/game/data/classes";

function useBusEvent(ev: Parameters<typeof bus.on>[0], fn: (p?: unknown) => void) {
  useEffect(() => {
    const off = bus.on(ev, fn);
    return () => {
      off();
    };
  }, [ev, fn]);
}

/* ---------- Main Menu ---------- */
export function MainMenu({ visible, onStart }: { visible: boolean; onStart: () => void }) {
  const [metas, setMetas] = useState<SlotMeta[]>([]);
  const [picker, setPicker] = useState<"none" | "new" | "load">("none");
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  useEffect(() => {
    if (visible) {
      setMetas(slotMetas());
      setPicker("none");
      setPendingSlot(null);
    }
  }, [visible]);
  if (!visible) return null;
  const hasSave = metas.some((m) => !m.empty);

  const refresh = () => setMetas(slotMetas());

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto">
      <img src={URLS.menuBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
      <div className="relative flex w-full max-w-xl flex-col items-center px-6 py-10 text-center">
        <div className="mb-3 h-px w-40 bg-gradient-to-r from-transparent via-[#c8a24b]/70 to-transparent" />
        <p className="font-body text-sm tracking-[0.4em] text-[#d6cdbb]/60 uppercase">A Souls-like Tactical RPG</p>
        <h1 className="font-display mt-4 text-5xl leading-tight text-[#f0e6d2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] md:text-7xl">
          The Hollow<br />Continent
        </h1>

        {picker === "none" ? (
          <>
            <p className="font-body mt-5 max-w-md text-base italic leading-relaxed text-[#d6cdbb]/70">
              "The continent did not die. It hollowed — and what is hollow, hungers."
            </p>
            <div className="mt-10 flex flex-col items-center gap-3">
              {hasSave && (
                <button
                  onClick={() => {
                    const n = mostRecentSlot();
                    getGame()?.continueGame(n ?? undefined);
                    onStart();
                  }}
                  className="group w-64 border border-[#c8a24b]/50 bg-black/50 px-8 py-3 font-display text-lg tracking-[0.2em] text-[#c8a24b] backdrop-blur-sm transition-all duration-200 hover:bg-[#c8a24b]/10 hover:shadow-[0_0_24px_rgba(200,162,75,0.25)] active:scale-[0.97] uppercase"
                >
                  Continue
                </button>
              )}
              <button
                onClick={() => setPicker("new")}
                className={`w-64 border px-8 py-3 font-display text-lg tracking-[0.2em] uppercase backdrop-blur-sm transition-all duration-200 active:scale-[0.97] ${
                  hasSave
                    ? "border-white/20 bg-black/40 text-[#d6cdbb]/70 hover:border-[#c8a24b]/40 hover:text-[#d6cdbb]"
                    : "border-[#c8a24b]/50 bg-black/50 text-[#c8a24b] hover:bg-[#c8a24b]/10 hover:shadow-[0_0_24px_rgba(200,162,75,0.25)]"
                }`}
              >
                New Game
              </button>
              {hasSave && (
                <button
                  onClick={() => setPicker("load")}
                  className="w-64 border border-white/20 bg-black/40 px-8 py-3 font-display text-lg tracking-[0.2em] text-[#d6cdbb]/70 uppercase backdrop-blur-sm transition-all duration-200 hover:border-[#c8a24b]/40 hover:text-[#d6cdbb] active:scale-[0.97]"
                >
                  Load Game
                </button>
              )}
            </div>
            <div className="mt-12 hidden max-w-lg text-xs leading-relaxed text-[#d6cdbb]/40 md:block">
              WASD or click to move · F interact · 1–6 abilities · Space end turn · E flask · C character · M map
            </div>
          </>
        ) : pendingSlot !== null ? (
          <ClassPicker
            onBack={() => setPendingSlot(null)}
            onPick={(cls) => {
              getGame()?.newGame(false, pendingSlot, cls);
              onStart();
            }}
          />
        ) : (
          <div className="mt-8 w-full max-w-md">
            <p className="mb-4 font-display text-sm tracking-[0.3em] text-[#c8a24b] uppercase">
              {picker === "new" ? "Choose a slot for your new journey" : "Load a saved journey"}
            </p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: SLOT_COUNT }).map((_, i) => {
                const slot = i + 1;
                const meta = metas[i];
                const m = meta && !meta.empty ? meta : null;
                const clickable = picker === "new" || !!m;
                return (
                  <SlotCard
                    key={slot}
                    slot={slot}
                    meta={m}
                    mode={picker}
                    disabled={!clickable}
                    onPick={() => {
                      if (picker === "new") {
                        setPendingSlot(slot);
                      } else if (m) {
                        getGame()?.continueGame(slot);
                        onStart();
                      }
                    }}
                    onDeleted={refresh}
                  />
                );
              })}
            </div>
            <button
              onClick={() => setPicker("none")}
              className="mx-auto mt-5 block border border-white/15 bg-black/50 px-8 py-2 font-display text-xs tracking-[0.25em] text-[#d6cdbb]/70 uppercase transition-all hover:border-[#c8a24b]/40 hover:text-[#c8a24b] active:scale-95"
            >
              Back
            </button>
            {picker === "new" && (
              <p className="mt-3 text-[11px] italic text-[#d6cdbb]/40">
                Starting on an occupied slot overwrites it. Hold the ember icon to erase a slot.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Class selection cards shown after picking a new-game slot. */
function ClassPicker({ onPick, onBack }: { onPick: (cls: PlayerClass) => void; onBack: () => void }) {
  return (
    <div className="mt-8 w-full max-w-2xl">
      <p className="mb-4 font-display text-sm tracking-[0.3em] text-[#c8a24b] uppercase">Choose your echo</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CLASS_IDS.map((id) => {
          const c = CLASSES[id];
          const portrait = c.portrait || URLS.player;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className="group flex flex-col items-center border border-white/15 bg-black/55 px-4 pb-4 pt-5 backdrop-blur-sm transition-all duration-200 hover:border-[#c8a24b]/60 hover:bg-[#c8a24b]/5 hover:shadow-[0_0_24px_rgba(200,162,75,0.2)] active:scale-[0.98]"
            >
              <div className="flex h-36 items-end justify-center overflow-hidden">
                <img
                  src={portrait}
                  alt={c.name}
                  className="h-36 w-auto object-contain object-bottom drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-3 font-display text-lg tracking-[0.15em] text-[#f0e6d2] uppercase">{c.name}</div>
              <div className="font-body text-[11px] italic tracking-wide text-[#c8a24b]/80">{c.title}</div>
              <p className="font-body mt-2 text-[11px] leading-relaxed text-[#d6cdbb]/60">{c.blurb}</p>
              <div className="mt-3 flex gap-3 text-[10px] tracking-wider text-[#d6cdbb]/50 uppercase">
                <span>HP {c.baseHp}</span>
                <span>AP {c.baseAp}</span>
                <span>MP {c.baseMp}</span>
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onBack}
        className="mx-auto mt-5 block border border-white/15 bg-black/50 px-8 py-2 font-display text-xs tracking-[0.25em] text-[#d6cdbb]/70 uppercase transition-all hover:border-[#c8a24b]/40 hover:text-[#c8a24b] active:scale-95"
      >
        Back
      </button>
    </div>
  );
}

/** One save-slot card on the title screen; hold the ember to delete. */
function SlotCard({
  slot,
  meta,
  mode,
  disabled,
  onPick,
  onDeleted,
}: {
  slot: number;
  meta: SlotMeta | null;
  mode: "new" | "load" | "none";
  disabled: boolean;
  onPick: () => void;
  onDeleted: () => void;
}) {
  const [holdT, setHoldT] = useState(0);
  const holdRef = useRef<number | null>(null);

  const startHold = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!meta) return;
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 1200);
      setHoldT(p);
      if (p >= 1) {
        clearSlot(slot);
        setHoldT(0);
        holdRef.current = null;
        onDeleted();
        return;
      }
      holdRef.current = requestAnimationFrame(tick);
    };
    holdRef.current = requestAnimationFrame(tick);
  };
  const cancelHold = () => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    setHoldT(0);
  };

  return (
    <div
      onClick={() => !disabled && onPick()}
      className={`flex items-center gap-3 border px-3 py-2.5 text-left backdrop-blur-sm transition-all ${
        disabled
          ? "cursor-default border-white/5 bg-black/30 opacity-50"
          : "cursor-pointer border-white/15 bg-black/50 hover:border-[#c8a24b]/50 hover:bg-[#c8a24b]/5 active:scale-[0.99]"
      }`}
    >
      <span className="font-display text-sm text-[#c8a24b]">{slot}</span>
      <div className="min-w-0 flex-1">
        {meta ? (
          <>
            <div className="truncate text-[13px] text-[#f0e6d2]">
              Lv {meta.level} · {(meta.souls ?? 0).toLocaleString()} souls
            </div>
            <div className="truncate text-[11px] text-[#d6cdbb]/50">
              {meta.location} · {formatPlayTime(meta.playTime ?? 0)}
            </div>
          </>
        ) : (
          <div className="text-[13px] italic text-[#d6cdbb]/35">{mode === "new" ? "Empty — begin here" : "Empty"}</div>
        )}
      </div>
      {meta && (
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onClick={(e) => e.stopPropagation()}
          title="Hold to erase"
          className="relative flex h-7 w-7 shrink-0 items-center justify-center border border-[#b04434]/40 bg-black/50 text-[#b04434] transition-colors hover:bg-[#b04434]/10"
        >
          <span className="text-xs">✕</span>
          {holdT > 0 && (
            <span
              className="absolute inset-0 bg-[#b04434]/40"
              style={{ transform: `scaleY(${holdT})`, transformOrigin: "bottom" }}
            />
          )}
        </button>
      )}
    </div>
  );
}

/* ---------- YOU DIED ---------- */
export function DeathOverlay() {
  const [state, setState] = useState<{ visible: boolean; lost: number }>({ visible: false, lost: 0 });
  useBusEvent(
    "death",
    useCallback((p?: unknown) => {
      const lost = (p as { lost: number })?.lost ?? 0;
      setState({ visible: true, lost });
    }, [])
  );
  if (!state.visible) return null;
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/85 animate-in fade-in duration-1000">
      <h1 className="font-display text-6xl tracking-[0.25em] text-[#8a1f14] drop-shadow-[0_0_40px_rgba(138,31,20,0.6)] md:text-8xl uppercase">
        You Died
      </h1>
      {state.lost > 0 && (
        <p className="font-body mt-6 text-base italic text-[#d6cdbb]/70">
          {state.lost.toLocaleString()} souls slipped from your grasp. They linger where you fell — reclaim them, or lose them to a second death.
        </p>
      )}
      <p className="font-body mt-2 text-sm text-[#d6cdbb]/50">Your possessions remain yours. Only the souls were taken.</p>
      <button
        onClick={() => {
          setState({ visible: false, lost: 0 });
          getGame()?.respawn();
        }}
        className="mt-10 border border-[#c8a24b]/50 bg-black/60 px-10 py-3 font-display text-base tracking-[0.2em] text-[#c8a24b] uppercase transition-all duration-200 hover:bg-[#c8a24b]/10 active:scale-[0.97]"
      >
        Return to the Bonfire
      </button>
    </div>
  );
}

/* ---------- Zone title card ---------- */
export function ZoneTitle() {
  const [name, setName] = useState<string | null>(null);
  useBusEvent(
    "zone",
    useCallback((p?: unknown) => {
      const n = (p as { name: string })?.name;
      if (!n) return;
      setName(n);
      const t = setTimeout(() => setName(null), 2600);
      return () => clearTimeout(t);
    }, [])
  );
  if (!name) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[22%] z-30 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="h-px w-64 bg-gradient-to-r from-transparent via-[#c8a24b]/80 to-transparent" />
      <h2 className="font-display my-3 text-3xl tracking-[0.2em] text-[#f0e6d2] drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] md:text-4xl">
        {name}
      </h2>
      <div className="h-px w-64 bg-gradient-to-r from-transparent via-[#c8a24b]/80 to-transparent" />
    </div>
  );
}

/* ---------- Boss intro ---------- */
export function BossIntro() {
  const [name, setName] = useState<string | null>(null);
  const [tagline, setTagline] = useState<string>("");
  useBusEvent(
    "bossIntro",
    useCallback((p?: unknown) => {
      const d = p as { name: string; tagline?: string };
      if (!d?.name) return;
      setName(d.name);
      setTagline(d.tagline ?? "");
      setTimeout(() => setName(null), 3400);
    }, [])
  );
  if (!name) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end justify-center pb-[26vh] animate-in fade-in duration-500">
      <div className="flex flex-col items-center">
        <p className="font-body text-xs tracking-[0.5em] text-[#b04434] uppercase">{tagline || "A Nameless Horror Stirs"}</p>
        <h2 className="font-display mt-2 text-4xl tracking-[0.12em] text-[#f0e6d2] drop-shadow-[0_0_30px_rgba(176,68,52,0.5)] md:text-5xl">
          {name}
        </h2>
        <div className="mt-3 h-px w-[420px] max-w-[80vw] bg-gradient-to-r from-transparent via-[#b04434] to-transparent" />
      </div>
    </div>
  );
}

/* ---------- Victory ---------- */
export function VictoryOverlay() {
  const [visible, setVisible] = useState(false);
  useBusEvent("victory", useCallback(() => setVisible(true), []));
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <img src={URLS.bossBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative flex max-w-2xl flex-col items-center px-6 text-center animate-in fade-in zoom-in-95 duration-1000">
        <p className="font-body text-sm tracking-[0.5em] text-[#c8a24b] uppercase">Unhollowed</p>
        <h1 className="font-display mt-4 text-5xl leading-tight text-[#f0e6d2] md:text-6xl">
          The Hollow King<br />Has Fallen
        </h1>
        <div className="my-6 h-px w-72 bg-gradient-to-r from-transparent via-[#c8a24b]/80 to-transparent" />
        <p className="font-body text-base italic leading-relaxed text-[#d6cdbb]/80">
          "You lift the cracked alabaster crown from Kardorim's skull. It is cold — colder
          than the grave that held it. Far below the floating isle, through the parting mist,
          you glimpse it at last: the Hollow Continent, vast and waiting."
        </p>
        <p className="font-body mt-4 text-sm text-[#d6cdbb]/60">
          The Pale Sepulchre is conquered. The true journey — the Hollow Continent itself — lies ahead.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              setVisible(false);
              const g = getGame();
              if (g) {
                g.teleportToBonfire(g.save.lastBonfire);
              }
            }}
            className="border border-[#c8a24b]/50 bg-black/60 px-8 py-3 font-display text-sm tracking-[0.2em] text-[#c8a24b] uppercase transition-all duration-200 hover:bg-[#c8a24b]/10 active:scale-[0.97]"
          >
            Keep Wandering the Pale
          </button>
        </div>
      </div>
    </div>
  );
}
