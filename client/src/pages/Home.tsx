/* The Hollow Continent — full-screen game shell.
 * Ashen Gothic: the canvas is the world; React draws only the engraved UI above it. */
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import GameCanvas from "@/components/GameCanvas";
import Hud from "@/components/hud/Hud";
import { MainMenu, DeathOverlay, ZoneTitle, BossIntro, VictoryOverlay } from "@/components/overlays/Overlays";
import Dialogue from "@/components/overlays/Dialogue";
import CharacterMap from "@/components/overlays/CharacterMap";
import { bus } from "@/game/core/events";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [inMenu, setInMenu] = useState(
    () => !(typeof window !== "undefined" && window.location.search.includes("demo"))
  );

  useEffect(() => {
    const off = bus.on("toast", (p) => {
      const msg = (p as { msg: string })?.msg;
      if (msg)
        toast(msg, {
          duration: 2200,
          style: {
            background: "rgba(18,16,13,0.92)",
            border: "1px solid rgba(200,162,75,0.3)",
            color: "#d6cdbb",
            fontFamily: "'EB Garamond', serif",
            fontSize: "13px",
            padding: "8px 12px",
            width: "fit-content",
            maxWidth: "300px",
            marginLeft: "auto",
          },
        });
    });
    const offTitle = bus.on("returnToTitle", () => setInMenu(true));
    return () => {
      off();
      offTitle();
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b0a08]">
      <GameCanvas onReady={onReady} />
      {ready && (
        <>
          <Hud />
          <ZoneTitle />
          <BossIntro />
          <Dialogue />
          <CharacterMap />
          <DeathOverlay />
          <VictoryOverlay />
          <MainMenu visible={inMenu} onStart={() => setInMenu(false)} />
        </>
      )}
      {!ready && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0a08]">
          <div className="h-3 w-3 animate-pulse rounded-full bg-[#e8823c] shadow-[0_0_20px_#e8823c]" />
          <p className="font-display mt-4 text-sm tracking-[0.3em] text-[#d6cdbb]/60 uppercase">
            Kindling the flame…
          </p>
        </div>
      )}
    </div>
  );
}
