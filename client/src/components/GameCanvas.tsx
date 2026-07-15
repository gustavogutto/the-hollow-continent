/* Ashen Gothic — canvas mount + Game lifecycle (StrictMode-safe singleton). */
import { useEffect, useRef } from "react";
import { Game } from "@/game/Game";

let gameSingleton: Game | null = null;

export function getGame(): Game | null {
  return gameSingleton;
}

export default function GameCanvas({ onReady }: { onReady?: (game: Game) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // StrictMode double-mount guard
    if (gameSingleton) {
      gameSingleton.destroy();
      gameSingleton = null;
    }
    const game = new Game(canvasRef.current);
    gameSingleton = game;
    let cancelled = false;
    game.init().then(() => {
      if (!cancelled) onReady?.(game);
    });
    return () => {
      cancelled = true;
      game.destroy();
      if (gameSingleton === game) gameSingleton = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 block"
      style={{ imageRendering: "auto", background: "#0b0a08" }}
    />
  );
}
