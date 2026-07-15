/* Tiny typed event emitter — bridge between game engine and React HUD. */
export type GameEvent =
  | "hud" // HudState snapshot
  | "dialogue" // open dialogue overlay {npc}
  | "death"
  | "victory"
  | "zone" // zone title card {name}
  | "bossIntro"
  | "bonfireMenu"
  | "toast"
  | "combatStart"
  | "combatEnd"
  | "returnToTitle"; // game returned to the title screen (system menu)

type Handler = (payload?: unknown) => void;

class Emitter {
  private handlers: Map<string, Set<Handler>> = new Map();
  on(ev: GameEvent, fn: Handler) {
    if (!this.handlers.has(ev)) this.handlers.set(ev, new Set());
    this.handlers.get(ev)!.add(fn);
    return () => this.handlers.get(ev)?.delete(fn);
  }
  emit(ev: GameEvent, payload?: unknown) {
    this.handlers.get(ev)?.forEach((fn) => fn(payload));
  }
}

export const bus = new Emitter();
