/* Ashen Gothic HUD — engraved gold filigree over darkness. HP ember orb, AP/MP gems,
 * 6-slot action bar, souls counter, turn order rail, boss bar.
 * Mobile: compact orb, icon-only buttons, scrollable spell row, repositioned joystick. */
import { useEffect, useRef, useState } from "react";
import type { HudState } from "@/game/types";
import { ALL_CLASS_SPELLS } from "@/game/data/classes";
import { bus } from "@/game/core/events";
import { getGame } from "@/components/GameCanvas";
import { iconDataUrl } from "@/game/engine/assets";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useMobile";
import { slotMetas, formatPlayTime, getActiveSlot, SLOT_COUNT } from "@/game/core/save";
import { audio } from "@/game/core/audio";

export default function Hud() {
  const [hud, setHud] = useState<HudState | null>(null);
  const isMobile = useIsMobile();
  // compact = phone in either orientation: narrow width OR short height (landscape phones)
  const [shortViewport, setShortViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-height: 520px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-height: 520px)");
    const onChange = (e: MediaQueryListEvent) => setShortViewport(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const compact = isMobile || shortViewport;
  useEffect(() => {
    const off = bus.on("hud", (h) => setHud(h as HudState));
    return () => {
      off();
    };
  }, []);

  if (!hud || hud.mode === "menu" || hud.mode === "victory") return null;

  const game = getGame();
  const hpPct = Math.max(0, Math.min(1, hud.hp / hud.hpMax));
  const orbSize = compact ? "h-16 w-16" : "h-24 w-24";

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none font-body">
      {/* Zone name — top left */}
      <div className="absolute left-3 top-3 flex items-center gap-2 md:left-5 md:top-4 md:gap-3">
        <div className="hidden h-px w-8 bg-gradient-to-r from-transparent to-[#c8a24b]/60 md:block" />
        <span className="font-display text-[11px] tracking-[0.18em] text-[#d6cdbb]/80 uppercase md:text-sm md:tracking-[0.22em]">
          {hud.zoneName}
        </span>
        <div className="hidden h-px w-8 bg-gradient-to-l from-transparent to-[#c8a24b]/60 md:block" />
      </div>

      {/* Souls counter + pause — top right */}
      <div className="absolute right-3 top-3 flex items-center gap-2 md:right-5 md:top-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center gap-1.5 rounded-sm border border-[#c8a24b]/25 bg-black/60 px-2.5 py-1 backdrop-blur-sm md:gap-2 md:px-4 md:py-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#8adbb4] shadow-[0_0_8px_#8adbb4] md:h-2.5 md:w-2.5" />
          <span className="font-display text-sm tabular-nums text-[#d6cdbb] md:text-lg">{hud.souls.toLocaleString()}</span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#d6cdbb]/50 md:inline">souls</span>
        </div>
        <button
          onClick={() => {
            audio.unlock();
            audio.uiClick();
            game?.toggleMenu();
          }}
          title="Menu (Esc)"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center border border-[#c8a24b]/25 bg-black/60 text-[#d6cdbb]/70 backdrop-blur-sm transition-colors hover:border-[#c8a24b]/50 hover:text-[#c8a24b] active:scale-95 md:h-9 md:w-9"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block h-[2px] w-3.5 bg-current" />
            <span className="block h-[2px] w-3.5 bg-current" />
            <span className="block h-[2px] w-3.5 bg-current" />
          </span>
        </button>
      </div>

      {/* Boss bar */}
      {hud.boss && (
        <div className="absolute left-1/2 top-14 w-[min(680px,80vw)] -translate-x-1/2">
          <div className="mb-1 text-center font-display text-base tracking-[0.18em] text-[#d6cdbb]">
            {hud.boss.name}
          </div>
          <div className="h-3 w-full border border-[#c8a24b]/40 bg-black/70 p-[2px]">
            <div
              className="h-full bg-gradient-to-r from-[#7a1f14] via-[#b04434] to-[#e8823c] transition-all duration-500"
              style={{ width: `${(hud.boss.hp / hud.boss.hpMax) * 100}%` }}
            />
          </div>
          <div className="mx-auto mt-1 h-1 w-2/3 border border-[#c8a24b]/20 bg-black/60 p-[1px]">
            <div
              className={`h-full transition-all duration-300 ${hud.boss.staggered ? "bg-[#e8d44b]" : "bg-[#7a7468]"}`}
              style={{ width: `${Math.min(100, (hud.boss.posture / hud.boss.postureMax) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Turn order rail — right side, combat only (hidden on mobile to save space) */}
      {hud.inCombat && !isMobile && (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
          {hud.turnOrder.map((u) => (
            <div
              key={u.uid}
              className={`flex w-44 items-center gap-2 border px-2 py-1.5 backdrop-blur-sm transition-all duration-200 ${
                u.uid === hud.activeUid
                  ? "border-[#c8a24b]/70 bg-[#c8a24b]/10 translate-x-[-6px]"
                  : "border-white/8 bg-black/55"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rotate-45 ${
                  u.isPlayer ? "bg-[#c8a24b]" : u.isBoss ? "bg-[#e8823c]" : "bg-[#b04434]"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] leading-tight text-[#d6cdbb]/90">
                  {u.name}
                </div>
                <div className="mt-0.5 h-1 w-full bg-black/70">
                  <div
                    className={`h-full ${u.isPlayer ? "bg-[#4a8a5c]" : "bg-[#b04434]"} transition-all duration-300`}
                    style={{ width: `${(u.hp / u.hpMax) * 100}%` }}
                  />
                </div>
              </div>
              {u.staggered && <span className="text-[9px] text-[#e8d44b]">✦</span>}
            </div>
          ))}
        </div>
      )}

      {/* Mobile combat: compact turn dots along the right edge */}
      {hud.inCombat && isMobile && (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1">
          {hud.turnOrder.map((u) => (
            <span
              key={u.uid}
              className={`h-2.5 w-2.5 rotate-45 border ${
                u.uid === hud.activeUid ? "scale-125 border-white/60" : "border-transparent"
              } ${u.isPlayer ? "bg-[#c8a24b]" : u.isBoss ? "bg-[#e8823c]" : "bg-[#b04434]"}`}
            />
          ))}
        </div>
      )}

      {/* Turn banner */}
      {hud.inCombat && (
        <div className="absolute left-1/2 top-[62px] -translate-x-1/2 md:top-[86px]">
          <span
            className={`font-display text-[10px] tracking-[0.3em] uppercase md:text-xs ${
              hud.isPlayerTurn ? "text-[#c8a24b]" : "text-[#b04434]"
            }`}
          >
            {hud.isPlayerTurn ? "— Your Turn —" : "— Enemy Turn —"}
          </span>
        </div>
      )}

      {/* Interact hint */}
      {!hud.inCombat && hud.canInteract && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-sm border border-[#c8a24b]/30 bg-black/70 px-4 py-1.5 text-sm text-[#d6cdbb] backdrop-blur-sm md:bottom-40">
          {isMobile ? (
            <button
              className="pointer-events-auto"
              onClick={() => getGame()?.interact()}
            >
              {hud.canInteract.replace(/^F — /, "Tap: ")}
            </button>
          ) : (
            hud.canInteract
          )}
        </div>
      )}

      {/* Virtual joystick — touch devices, explore mode only */}
      {!hud.inCombat && <VirtualJoystick />}

      {/* Controls help overlay — toggled by ? / H */}
      {hud.helpVisible && <HelpOverlay isMobile={isMobile} onClose={() => game?.toggleHelp()} />}

      {/* System menu — pause / save-load / return to title */}
      {hud.menuOpen && <SystemMenu isMobile={isMobile} />}

      {/* ===== Bottom HUD ===== */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-1.5 px-2 pb-2 md:gap-3 md:px-6 md:pb-4"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* HP orb + flasks */}
        <div className="pointer-events-auto flex items-end gap-2 md:gap-3">
          <div className={`relative ${orbSize}`}>
            <div className="absolute inset-0 rounded-full border-2 border-[#c8a24b]/40 bg-black/70 shadow-[0_0_24px_rgba(0,0,0,0.8)]" />
            <div className="absolute inset-[4px] overflow-hidden rounded-full bg-[#1a0d08] md:inset-[5px]">
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#7a1f14] via-[#b03424] to-[#e05038] transition-all duration-500"
                style={{ height: `${hpPct * 100}%` }}
              />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_6px_16px_rgba(0,0,0,0.7)]" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-sm leading-none text-[#f0e6d2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] md:text-lg">
                {hud.hp}
              </span>
              <span className="text-[8px] text-[#d6cdbb]/60 md:text-[9px]">/ {hud.hpMax}</span>
            </div>
          </div>
          <button
            className="group flex flex-col items-center gap-0.5 pb-0.5 md:pb-1"
            onClick={() => {
              audio.unlock();
              (hud.inCombat ? game?.useFlaskCombat() : game?.useFlaskExplore());
            }}
            title="Ashen Flask (E) — heal 45 HP. Costs 2 AP in combat."
          >
            <div className="relative flex h-9 w-9 items-center justify-center border border-[#c8a24b]/30 bg-black/60 transition-transform group-active:scale-95 md:h-11 md:w-11">
              {iconDataUrl(6) ? (
                <img src={iconDataUrl(6)} alt="flask" className="h-7 w-7 object-contain md:h-8 md:w-8" />
              ) : (
                <span className="text-[#e05038]">◉</span>
              )}
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7a1f14] text-[10px] text-white">
                {hud.flasks}
              </span>
            </div>
            {!isMobile && <span className="text-[9px] uppercase tracking-wider text-[#d6cdbb]/50">E</span>}
          </button>
          {/* ? help toggle */}
          <button
            onClick={() => game?.toggleHelp()}
            title="Controls (H)"
            className="mb-0.5 flex h-9 w-9 items-center justify-center border border-white/10 bg-black/55 font-display text-sm text-[#d6cdbb]/60 transition-colors hover:border-[#c8a24b]/40 hover:text-[#c8a24b] active:scale-95 md:mb-1 md:h-11 md:w-11"
          >
            ?
          </button>
        </div>

        {/* Action bar — combat */}
        {hud.inCombat ? (
          <div className="pointer-events-auto flex min-w-0 flex-1 flex-col items-center gap-1.5 px-2 md:gap-2">
            {/* AP / MP gems */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-1 md:gap-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#e8823c]/80 md:text-[10px]">AP</span>
                {Array.from({ length: Math.max(hud.apMax, hud.ap) }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rotate-45 border transition-all duration-200 md:h-2.5 md:w-2.5 ${
                      i < hud.ap
                        ? "border-[#e8823c] bg-[#e8823c] shadow-[0_0_6px_rgba(232,130,60,0.7)]"
                        : "border-[#e8823c]/30 bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 md:gap-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#5a8a9c]/80 md:text-[10px]">MP</span>
                {Array.from({ length: Math.max(hud.mpMax, hud.mp) }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rotate-45 border transition-all duration-200 md:h-2.5 md:w-2.5 ${
                      i < hud.mp
                        ? "border-[#5a8a9c] bg-[#5a8a9c] shadow-[0_0_6px_rgba(90,138,156,0.7)]"
                        : "border-[#5a8a9c]/30 bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex max-w-full items-end gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {hud.spellIds
                .map((id) => ALL_CLASS_SPELLS.find((s) => s.id === id)!)
                .filter(Boolean)
                .map((sp, i) => {
                const selected = hud.selectedSpell === i;
                const usable = hud.isPlayerTurn && hud.ap >= sp.apCost;
                return (
                  <Tooltip key={sp.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          audio.unlock();
                          audio.uiClick();
                          game?.selectSpell(i);
                        }}
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center border transition-all duration-150 active:scale-95 md:h-14 md:w-14 ${
                          selected
                            ? "border-[#c8a24b] bg-[#c8a24b]/15 shadow-[0_0_14px_rgba(200,162,75,0.4)] -translate-y-1"
                            : usable
                              ? "border-[#c8a24b]/35 bg-black/65 hover:border-[#c8a24b]/70"
                              : "border-white/10 bg-black/50 opacity-45"
                        }`}
                      >
                        {iconDataUrl(sp.icon) ? (
                          <img src={iconDataUrl(sp.icon)} alt={sp.name} className="h-9 w-9 object-contain md:h-10 md:w-10" />
                        ) : (
                          <span className="font-display text-[#d6cdbb]">{i + 1}</span>
                        )}
                        {!isMobile && <span className="absolute left-1 top-0.5 text-[9px] text-[#d6cdbb]/60">{i + 1}</span>}
                        <span className="absolute bottom-0.5 right-1 text-[9px] text-[#e8823c]">{sp.apCost}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56 border-[#c8a24b]/30 bg-[#141210] text-[#d6cdbb]">
                      <div className="font-display text-sm text-[#c8a24b]">{sp.name}</div>
                      <div className="mt-1 text-xs leading-snug text-[#d6cdbb]/85">{sp.desc}</div>
                      <div className="mt-1 text-[10px] text-[#d6cdbb]/60">
                        {sp.apCost} AP · range {sp.range[0]}–{sp.range[1]}
                        {sp.dmg[1] > 0 ? ` · ${sp.dmg[0]}–${sp.dmg[1]} dmg` : ""}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
                })}
              <button
                onClick={() => {
                  audio.unlock();
                  audio.uiClick();
                  game?.endPlayerTurn();
                }}
                disabled={!hud.isPlayerTurn}
                className={`ml-1.5 h-12 shrink-0 border px-2 font-display text-[10px] uppercase tracking-[0.08em] transition-all duration-150 active:scale-95 md:ml-3 md:h-14 md:px-4 md:text-xs md:tracking-[0.18em] ${
                  hud.isPlayerTurn
                    ? "border-[#b04434]/60 bg-[#3a1410]/80 text-[#e8b0a0] hover:bg-[#5a1f16]"
                    : "border-white/10 bg-black/50 text-white/30"
                }`}
              >
                {compact ? "End" : "End Turn"}
                {!compact && <div className="mt-0.5 text-[9px] normal-case tracking-normal opacity-60">Space</div>}
              </button>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* Level badge — bottom right (hidden during combat on mobile to free space) */}
        <div className={`pointer-events-auto flex-col items-end gap-1 md:gap-1.5 ${hud.inCombat && compact ? "hidden" : "flex"}`}>
          {!hud.inCombat && (
            <button
              onClick={() => bus.emit("dialogue", { npc: "map" })}
              className="border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-[#d6cdbb]/60 transition-colors hover:border-[#c8a24b]/40 hover:text-[#d6cdbb] active:scale-95 md:px-3 md:tracking-[0.18em]"
            >
              {isMobile ? "Map" : "Map (M)"}
            </button>
          )}
          <button
            onClick={() => bus.emit("dialogue", { npc: "inventory" })}
            className="flex items-center gap-1.5 border border-[#c8a24b]/25 bg-black/60 px-2.5 py-1 backdrop-blur-sm transition-colors hover:border-[#c8a24b]/50 active:scale-95 md:gap-2 md:px-3 md:py-1.5"
          >
            <span className="font-display text-xs text-[#c8a24b] md:text-sm">Lv {hud.level}</span>
            {!isMobile && (
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#d6cdbb]/50">
                +{hud.weaponLevel} blade
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Controls reference overlay with dim backdrop; toggled by the ? button or H. */
function HelpOverlay({ isMobile, onClose }: { isMobile: boolean; onClose: () => void }) {
  const rows: [string, string][] = isMobile
    ? [
        ["Drag joystick / tap tile", "Move"],
        ["Tap glowing prompt", "Interact — bonfires, NPCs, chests"],
        ["Tap spell, then a tile", "Cast in combat"],
        ["End Turn", "Pass the turn in combat"],
        ["Flask button", "Heal 45 HP (2 AP in combat)"],
        ["Lv badge / Map", "Character sheet · world map"],
      ]
    : [
        ["WASD / Click", "Move"],
        ["F", "Interact — bonfires, NPCs, chests"],
        ["1–6", "Select spell · click a tile to cast"],
        ["Space", "End turn in combat"],
        ["E", "Drink flask — heal 45 HP (2 AP in combat)"],
        ["C", "Character sheet & inventory"],
        ["M", "World map"],
        ["H / ?", "Toggle this help"],
      ];
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md border border-[#c8a24b]/40 bg-[#12100d]/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 md:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 h-px w-full bg-gradient-to-r from-transparent via-[#c8a24b]/60 to-transparent" />
        <h2 className="py-2 text-center font-display text-lg tracking-[0.25em] text-[#c8a24b] uppercase">
          Controls
        </h2>
        <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-[#c8a24b]/60 to-transparent" />
        <div className="flex flex-col gap-2">
          {rows.map(([key, desc]) => (
            <div key={key} className="flex items-baseline gap-3">
              <span className="w-40 shrink-0 text-right font-display text-[13px] text-[#f0e6d2]">{key}</span>
              <span className="text-[13px] text-[#d6cdbb]/70">{desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] italic text-[#d6cdbb]/40">
          Rest at bonfires to heal and refill flasks — but the dead will rise again.
        </p>
        <button
          onClick={onClose}
          className="mx-auto mt-4 block border border-[#c8a24b]/40 bg-black/50 px-6 py-1.5 font-display text-xs tracking-[0.2em] text-[#c8a24b] uppercase transition-all hover:bg-[#c8a24b]/10 active:scale-95"
        >
          {isMobile ? "Close" : "Close (H)"}
        </button>
      </div>
    </div>
  );
}

/** Touch-only virtual joystick — LEFT side, floating origin: the pad appears under
 * the first touch anywhere in the lower-left zone, Dofus/mobile-shooter style. */
function VirtualJoystick() {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [stick, setStick] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  if (!isTouch) return null;

  const RADIUS = 56; // pad radius in px
  const MAX = RADIUS - 14;

  const update = (clientX: number, clientY: number, o: { x: number; y: number }) => {
    let dx = clientX - o.x;
    let dy = clientY - o.y;
    const len = Math.hypot(dx, dy);
    if (len > MAX) {
      dx = (dx / len) * MAX;
      dy = (dy / len) * MAX;
    }
    setStick({ x: dx, y: dy });
    const game = getGame();
    if (!game) return;
    if (len < 12) {
      game.setTouchDir(null);
      return;
    }
    const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "d" : "a") : dy > 0 ? "s" : "w";
    game.setTouchDir(dir);
  };

  const release = () => {
    setOrigin(null);
    setStick({ x: 0, y: 0 });
    getGame()?.setTouchDir(null);
  };

  return (
    <div
      ref={zoneRef}
      className="pointer-events-auto fixed bottom-0 left-0 z-30 h-[42vh] w-[45vw] touch-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        const o = { x: e.clientX, y: e.clientY };
        setOrigin(o);
        update(e.clientX, e.clientY, o);
      }}
      onPointerMove={(e) => {
        if (origin && (e.buttons > 0 || e.pointerType === "touch")) update(e.clientX, e.clientY, origin);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {/* resting hint ring when idle — anchored bottom-left */}
      {!origin && (
        <div className="absolute bottom-24 left-6 h-24 w-24 rounded-full border border-dashed border-[#c8a24b]/20 bg-black/20" />
      )}
      {origin && (
        <div
          className="fixed rounded-full border border-[#c8a24b]/30 bg-black/40 backdrop-blur-sm"
          style={{
            left: origin.x - RADIUS,
            top: origin.y - RADIUS,
            width: RADIUS * 2,
            height: RADIUS * 2,
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-[#c8a24b]/50 bg-[#c8a24b]/15 shadow-[0_0_12px_rgba(200,162,75,0.25)]"
            style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
          />
        </div>
      )}
    </div>
  );
}

/** Pause / system menu: Resume, Controls, Save & Load slots, Return to Title. */
function SystemMenu({ isMobile }: { isMobile: boolean }) {
  const game = getGame();
  const [view, setView] = useState<"root" | "slots">("root");
  const [metas, setMetas] = useState(() => slotMetas());
  const [muted, setMuted] = useState(() => audio.muted);
  const active = getActiveSlot();

  const refresh = () => setMetas(slotMetas());

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-[3px] animate-in fade-in duration-200"
      onClick={() => game?.toggleMenu()}
    >
      <div
        className="mx-4 w-full max-w-sm border border-[#c8a24b]/40 bg-[#12100d]/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 h-px w-full bg-gradient-to-r from-transparent via-[#c8a24b]/60 to-transparent" />
        <h2 className="py-2 text-center font-display text-lg tracking-[0.25em] text-[#c8a24b] uppercase">
          {view === "root" ? "Paused" : "Save & Load"}
        </h2>
        <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-[#c8a24b]/60 to-transparent" />

        {view === "root" ? (
          <div className="flex flex-col gap-2">
            <MenuBtn label="Resume" primary onClick={() => game?.toggleMenu()} />
            <MenuBtn
              label="Controls"
              onClick={() => {
                game?.toggleMenu();
                game?.toggleHelp();
              }}
            />
            <MenuBtn label="Save & Load" onClick={() => { refresh(); setView("slots"); }} />
            <MenuBtn
              label={muted ? "Sound: Off" : "Sound: On"}
              onClick={() => {
                audio.unlock();
                setMuted(audio.toggleMuted());
              }}
            />
            <MenuBtn
              label="Return to Title"
              danger
              onClick={() => game?.returnToTitle()}
            />
            {!isMobile && (
              <p className="mt-2 text-center text-[10px] text-[#d6cdbb]/40">Esc — close menu</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: SLOT_COUNT }).map((_, i) => {
              const slot = i + 1;
              const meta = metas[i];
              const m = meta && !meta.empty ? meta : null;
              return (
                <div
                  key={slot}
                  className={`flex items-center gap-2 border px-2.5 py-2 ${
                    slot === active ? "border-[#c8a24b]/50 bg-[#c8a24b]/8" : "border-white/10 bg-black/40"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xs text-[#c8a24b]">Slot {slot}</span>
                      {slot === active && (
                        <span className="text-[9px] uppercase tracking-wider text-[#8adbb4]/80">active</span>
                      )}
                    </div>
                    {m ? (
                      <div className="mt-0.5 truncate text-[11px] text-[#d6cdbb]/70">
                        Lv {m.level} · {(m.souls ?? 0).toLocaleString()} souls · {m.location}
                        <span className="text-[#d6cdbb]/40"> · {formatPlayTime(m.playTime ?? 0)}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[11px] italic text-[#d6cdbb]/35">Empty</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      game?.saveToSlot(slot);
                      refresh();
                    }}
                    className="border border-[#c8a24b]/35 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wider text-[#c8a24b] transition-all hover:bg-[#c8a24b]/10 active:scale-95"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      if (m) game?.loadFromSlot(slot);
                    }}
                    disabled={!m}
                    className={`border px-2 py-1 text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                      m
                        ? "border-white/20 bg-black/50 text-[#d6cdbb] hover:bg-white/5"
                        : "border-white/5 bg-black/30 text-white/20"
                    }`}
                  >
                    Load
                  </button>
                </div>
              );
            })}
            <MenuBtn label="Back" onClick={() => setView("root")} />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuBtn({
  label,
  onClick,
  primary,
  danger,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full border px-4 py-2.5 font-display text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
        primary
          ? "border-[#c8a24b]/60 bg-[#c8a24b]/12 text-[#c8a24b] hover:bg-[#c8a24b]/20"
          : danger
            ? "border-[#b04434]/50 bg-[#3a1410]/60 text-[#e8b0a0] hover:bg-[#5a1f16]"
            : "border-white/15 bg-black/50 text-[#d6cdbb] hover:border-[#c8a24b]/40 hover:text-[#c8a24b]"
      }`}
    >
      {label}
    </button>
  );
}
