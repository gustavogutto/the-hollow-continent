/* Isometric diamond grid math. Tile = 64x32 diamond. Origin centered by renderer. */
import type { Vec2 } from "../types";

export const TILE_W = 72;
export const TILE_H = 36;

export function gridToScreen(g: Vec2): Vec2 {
  return {
    x: (g.x - g.y) * (TILE_W / 2),
    y: (g.x + g.y) * (TILE_H / 2),
  };
}

export function screenToGrid(s: Vec2): Vec2 {
  const x = (s.x / (TILE_W / 2) + s.y / (TILE_H / 2)) / 2;
  const y = (s.y / (TILE_H / 2) - s.x / (TILE_W / 2)) / 2;
  return { x: Math.round(x), y: Math.round(y) };
}

export function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function eq(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Bresenham-ish line of sight over grid centers; blocked cells break sight. */
export function hasLos(from: Vec2, to: Vec2, blocked: (p: Vec2) => boolean): boolean {
  let x0 = from.x, y0 = from.y;
  const x1 = to.x, y1 = to.y;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
    if (x0 === x1 && y0 === y1) break;
    if (blocked({ x: x0, y: y0 })) return false;
  }
  return true;
}

/** BFS shortest path avoiding blocked cells. Returns path excluding start, or null. */
export function bfsPath(
  start: Vec2,
  goal: Vec2,
  size: number,
  blocked: (p: Vec2) => boolean,
  maxLen = 64
): Vec2[] | null {
  if (eq(start, goal)) return [];
  const key = (p: Vec2) => p.y * size + p.x;
  const prev = new Map<number, number>();
  const visited = new Set<number>([key(start)]);
  const queue: Vec2[] = [start];
  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
  ];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const d of dirs) {
      const nx = cur.x + d.x, ny = cur.y + d.y;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const np = { x: nx, y: ny };
      const nk = key(np);
      if (visited.has(nk)) continue;
      if (!eq(np, goal) && blocked(np)) continue;
      visited.add(nk);
      prev.set(nk, key(cur));
      if (eq(np, goal)) {
        // reconstruct
        const path: Vec2[] = [np];
        let k = nk;
        while (prev.has(k)) {
          const pk = prev.get(k)!;
          if (pk === key(start)) break;
          path.unshift({ x: pk % size, y: Math.floor(pk / size) });
          k = pk;
        }
        return path.length <= maxLen ? path : null;
      }
      queue.push(np);
    }
  }
  return null;
}

/** All cells reachable within mp movement points. */
export function reachable(
  start: Vec2,
  mp: number,
  size: number,
  blocked: (p: Vec2) => boolean
): Vec2[] {
  const out: Vec2[] = [];
  const key = (p: Vec2) => p.y * size + p.x;
  const dist = new Map<number, number>([[key(start), 0]]);
  const queue: Vec2[] = [start];
  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
  ];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(key(cur))!;
    if (d >= mp) continue;
    for (const dir of dirs) {
      const np = { x: cur.x + dir.x, y: cur.y + dir.y };
      if (np.x < 0 || np.y < 0 || np.x >= size || np.y >= size) continue;
      const nk = key(np);
      if (dist.has(nk) || blocked(np)) continue;
      dist.set(nk, d + 1);
      out.push(np);
      queue.push(np);
    }
  }
  return out;
}
