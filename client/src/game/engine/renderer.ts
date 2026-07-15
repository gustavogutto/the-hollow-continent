/* Ashen Gothic renderer — Canvas 2D isometric. Darkness is the canvas; ember light is information.
 * Draw order: tiles → tile highlights → hazards → depth-sorted entities → fx → vignette. */
import type { Vec2, Unit, PropDef, PageDef } from "../types";
import { gridToScreen, TILE_W, TILE_H } from "./iso";
import { getAttackFrame, getIdleFrame, getImage, getMobWalkFrame, getSprite, getWalkFrame, URLS, type AttackKey, type WalkDir } from "./assets";
import { GRID } from "../data/world";

export interface DamageNumber {
  pos: Vec2;
  text: string;
  color: string;
  t: number; // 0..1 life
  /** horizontal drift px/s (arc) */
  vx: number;
  /** vertical velocity px/s (starts negative = upward, gravity pulls down) */
  vy: number;
  ox: number; // accumulated offset
  oy: number;
  big: boolean; // executions / crits render larger
}

export interface Ember {
  x: number;
  y: number;
  vy: number;
  vx: number;
  life: number;
  max: number;
  size: number;
}

export interface FireTile {
  pos: Vec2;
  turns: number;
}

export interface TelegraphTile {
  pos: Vec2;
}

const PROP_CELL: Record<string, number> = {
  pillar: 0, gravestone: 1, tree: 2, chest: 3, bones: 4, arch: 5, brazier: 6, boulder: 7, cart: 8, illusory: 0,
};

/** A unit playing its death animation (drawn as fading corpse + particles). */
export interface DyingUnit {
  unit: Unit;
  pos: Vec2;
  t: number; // 0..1
  bones: boolean; // bone shards vs ash embers
}

const PROP_SCALE: Record<string, number> = {
  pillar: 1.15, gravestone: 0.8, tree: 1.5, chest: 0.7, bones: 0.7, arch: 1.6, brazier: 0.85, boulder: 0.85, cart: 0.8, illusory: 1.15,
};

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  offsetX = 0;
  offsetY = 0;
  shake = 0;
  /** Follow-camera: world-space focus point (iso px, pre-offset) and zoom. Lerped every frame. */
  private camX = 0;
  private camY = 0;
  private camZoom = 1;
  private camTargetX = 0;
  private camTargetY = 0;
  private camTargetZoom = 1;
  private camSnap = true;
  embers: Ember[] = [];
  damageNumbers: DamageNumber[] = [];
  dust: { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }[] = [];
  /** death particles (bone shards / ash motes) in screen space */
  deathBits: { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }[] = [];
  /** drifting ash flakes (overworld weather), screen space */
  private ashFlakes: { x: number; y: number; vx: number; vy: number; phase: number; size: number }[] = [];
  private tilePattern: Map<string, HTMLCanvasElement> = new Map();

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
    this.applyCamera();
  }

  /** Point the camera at a world-space focus (use focusGrid for grid cells). Snap teleports instantly. */
  setCameraFocus(world: Vec2, zoom: number, snap = false) {
    this.camTargetX = world.x;
    this.camTargetY = world.y;
    this.camTargetZoom = zoom;
    if (snap) this.camSnap = true;
  }

  focusGrid(g: Vec2, zoom: number, snap = false) {
    const s = gridToScreen(g);
    this.setCameraFocus({ x: s.x, y: s.y }, zoom, snap);
  }

  /** Center of the map grid in world space (for combat / fallback framing). */
  gridCenterWorld(): Vec2 {
    const s = gridToScreen({ x: (GRID - 1) / 2, y: (GRID - 1) / 2 });
    return { x: s.x, y: s.y };
  }

  /** Zoom that fits the whole grid on screen with margin (combat framing). */
  fitGridZoom(margin = 70): number {
    const gw = GRID * TILE_W + margin;
    const gh = GRID * TILE_H + 190; // sprite + HUD headroom
    return Math.max(0.55, Math.min(this.width / gw, this.height / gh, 1.1));
  }

  /** Advance the camera lerp; call once per frame BEFORE drawing. */
  updateCamera(dt: number) {
    if (this.camSnap) {
      this.camX = this.camTargetX;
      this.camY = this.camTargetY;
      this.camZoom = this.camTargetZoom;
      this.camSnap = false;
    } else {
      const t = Math.min(1, dt * 4.5);
      const zt = Math.min(1, dt * 3);
      this.camX += (this.camTargetX - this.camX) * t;
      this.camY += (this.camTargetY - this.camY) * t;
      this.camZoom += (this.camTargetZoom - this.camZoom) * zt;
    }
    this.applyCamera();
  }

  get zoom() {
    return this.camZoom;
  }

  private applyCamera() {
    // screen(world) = world + offset, then the whole frame is zoomed around screen center in beginFrame
    this.offsetX = this.width / 2 - this.camX;
    this.offsetY = this.height / 2 - this.camY;
  }

  screenOf(g: Vec2, lift = 0): Vec2 {
    const s = gridToScreen(g);
    return { x: s.x + this.offsetX, y: s.y + this.offsetY - lift };
  }

  gridAtScreen(csx: number, csy: number): Vec2 {
    // undo the center-zoom applied in beginFrame, then the offset
    const sx = (csx - this.width / 2) / this.camZoom + this.width / 2;
    const sy = (csy - this.height / 2) / this.camZoom + this.height / 2;
    const x = sx - this.offsetX;
    const y = sy - this.offsetY;
    const gx = (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
    const gy = (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
    return { x: Math.floor(gx + 0.5), y: Math.floor(gy + 0.5) };
  }

  private reducedMotion =
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  addShake(amount: number) {
    if (this.reducedMotion) return;
    this.shake = Math.min(14, this.shake + amount);
  }

  addDamage(pos: Vec2, text: string, color: string, opts?: { big?: boolean }) {
    // numeric hits arc sideways; status text floats straight up
    const numeric = /\d/.test(text);
    this.damageNumbers.push({
      pos: { ...pos },
      text,
      color,
      t: 0,
      vx: numeric ? (Math.random() - 0.5) * 70 : 0,
      vy: numeric ? -95 - Math.random() * 30 : -55,
      ox: 0,
      oy: 0,
      big: opts?.big ?? false,
    });
  }

  /** Letterbox cinematic bars, 0..1 coverage (drawn in endFrame, screen space). */
  letterbox = 0;

  spawnEmbers(n: number) {
    for (let i = 0; i < n; i++) {
      this.embers.push({
        x: Math.random() * this.width,
        y: this.height + 10,
        vy: -(12 + Math.random() * 28),
        vx: (Math.random() - 0.5) * 12,
        life: 0,
        max: 6 + Math.random() * 8,
        size: 1 + Math.random() * 2.2,
      });
    }
  }

  private tileCanvas(tileset: string): HTMLCanvasElement | undefined {
    const key = tileset;
    if (this.tilePattern.has(key)) return this.tilePattern.get(key);
    const img = getImage(
      tileset === "ash" ? URLS.tileAsh : tileset === "sunken" ? URLS.tileSunken : URLS.tileCrypt,
    );
    if (!img) return undefined;
    // pre-render a diamond tile with texture
    const c = document.createElement("canvas");
    c.width = TILE_W;
    c.height = TILE_H;
    const cx = c.getContext("2d")!;
    cx.beginPath();
    cx.moveTo(TILE_W / 2, 0);
    cx.lineTo(TILE_W, TILE_H / 2);
    cx.lineTo(TILE_W / 2, TILE_H);
    cx.lineTo(0, TILE_H / 2);
    cx.closePath();
    cx.clip();
    cx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, -8, -20, TILE_W + 16, TILE_H + 40);
    this.tilePattern.set(key, c);
    return c;
  }

  drawDiamond(g: Vec2, fill: string, stroke?: string, lineWidth = 1) {
    const s = this.screenOf(g);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - TILE_H / 2);
    ctx.lineTo(s.x + TILE_W / 2, s.y);
    ctx.lineTo(s.x, s.y + TILE_H / 2);
    ctx.lineTo(s.x - TILE_W / 2, s.y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  drawGround(page: PageDef, time: number) {
    const ctx = this.ctx;
    // void background — expand fill to cover the whole screen even when zoomed out
    // (this draws inside the camera transform, which scales around screen center)
    const invZ = 1 / Math.max(0.05, this.camZoom);
    const bx = this.width / 2 - (this.width / 2) * invZ;
    const by = this.height / 2 - (this.height / 2) * invZ;
    const bw = this.width * invZ;
    const bh = this.height * invZ;
    ctx.fillStyle = "#0b0a08";
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    // faint void mist
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 100 * invZ,
      this.width / 2, this.height / 2, Math.max(bw, bh) * 0.7
    );
    grad.addColorStop(0, "rgba(38,36,32,0.55)");
    grad.addColorStop(1, "rgba(8,8,10,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);

    const tile = this.tileCanvas(page.tileset);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const s = this.screenOf({ x, y });
        if (tile) {
          ctx.save();
          // subtle per-tile brightness variation
          const v = ((x * 7 + y * 13) % 5) * 0.02;
          ctx.globalAlpha = 0.92 - v;
          ctx.drawImage(tile, s.x - TILE_W / 2, s.y - TILE_H / 2);
          ctx.restore();
        } else {
          this.drawDiamond(
            { x, y },
            page.tileset === "ash" ? "#1a1712" : page.tileset === "sunken" ? "#101820" : "#16161c",
          );
        }
        // grid line whisper
        this.drawDiamond({ x, y }, "", "rgba(214,205,187,0.05)", 0.5);
      }
    }
    // island edge glow
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.08 * Math.sin(time * 0.001);
    const corners = [
      this.screenOf({ x: 0, y: 0 }), this.screenOf({ x: GRID - 1, y: 0 }),
      this.screenOf({ x: GRID - 1, y: GRID - 1 }), this.screenOf({ x: 0, y: GRID - 1 }),
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y - TILE_H / 2);
    ctx.lineTo(corners[1].x + TILE_W / 2, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y + TILE_H / 2);
    ctx.lineTo(corners[3].x - TILE_W / 2, corners[3].y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(200,162,75,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawHighlights(opts: {
    moveCells?: Vec2[];
    pathCells?: Vec2[];
    rangeCells?: Vec2[];
    aoeCells?: Vec2[];
    telegraphs?: TelegraphTile[];
    fireTiles?: FireTile[];
    /** enemy intent preview (hover): reachable tiles + threatened tiles */
    intentMove?: Vec2[];
    intentThreat?: Vec2[];
    hoverCell?: Vec2 | null;
    time: number;
  }) {
    const pulse = 0.5 + 0.25 * Math.sin(opts.time * 0.004);
    // enemy intent preview — drawn beneath other highlights
    opts.intentThreat?.forEach((c) =>
      this.drawDiamond(c, `rgba(200,60,40,${0.1 + 0.05 * pulse})`, "rgba(200,60,40,0.25)", 1),
    );
    opts.intentMove?.forEach((c) =>
      this.drawDiamond(c, `rgba(220,140,50,${0.14 + 0.06 * pulse})`, "rgba(220,140,50,0.3)", 1),
    );
    opts.moveCells?.forEach((c) => this.drawDiamond(c, "rgba(90,138,156,0.16)", "rgba(90,138,156,0.35)", 1));
    opts.rangeCells?.forEach((c) => this.drawDiamond(c, "rgba(232,130,60,0.13)", "rgba(232,130,60,0.4)", 1));
    opts.aoeCells?.forEach((c) => this.drawDiamond(c, "rgba(232,130,60,0.32)", "rgba(232,130,60,0.8)", 1.5));
    opts.pathCells?.forEach((c) => this.drawDiamond(c, "rgba(200,162,75,0.28)", "rgba(200,162,75,0.6)", 1));
    opts.telegraphs?.forEach((t) =>
      this.drawDiamond(t.pos, `rgba(180,40,30,${0.22 + pulse * 0.22})`, "rgba(220,60,40,0.85)", 1.5)
    );
    opts.fireTiles?.forEach((f) =>
      this.drawDiamond(f.pos, `rgba(232,100,30,${0.3 + pulse * 0.2})`, "rgba(255,140,50,0.9)", 1.5)
    );
    if (opts.hoverCell) {
      this.drawDiamond(opts.hoverCell, "rgba(214,205,187,0.12)", "rgba(214,205,187,0.55)", 1.5);
    }
  }

  /** entity draw item for depth sorting */
  drawEntities(items: {
    units: Unit[];
    props: PropDef[];
    bonfire?: { pos: Vec2 };
    npcs?: { id: "elara" | "gromm"; pos: Vec2 }[];
    doors?: { pos: Vec2; label: string; locked: boolean }[];
    soulDrop?: Vec2 | null;
    unitScreenOverride?: Map<number, Vec2>;
    activeUid?: number;
    playerWalk?: { moving: boolean; dir: WalkDir; frame: number };
    unitWalk?: Map<number, { moving: boolean; dir: WalkDir; frame: number }>;
    /** attack sheet playback: uid -> dir + progress 0..1 */
    unitAttack?: Map<number, { dir: WalkDir; t: number }>;
    /** units currently playing death animation */
    dying?: DyingUnit[];
    time: number;
  }) {
    type DrawItem = { depth: number; draw: () => void };
    const list: DrawItem[] = [];
    const ctx = this.ctx;
    const time = items.time;

    items.props.forEach((p) => {
      list.push({
        depth: p.pos.x + p.pos.y + 0.1,
        draw: () => {
          const sprite = getSprite({ url: URLS.props, grid: 3, cell: PROP_CELL[p.kind] });
          const s = this.screenOf(p.pos);
          const scale = PROP_SCALE[p.kind];
          const size = TILE_W * scale;
          if (sprite) {
            const sw = sprite instanceof HTMLCanvasElement ? sprite.width : (sprite as HTMLImageElement).naturalWidth;
            const sh = sprite instanceof HTMLCanvasElement ? sprite.height : (sprite as HTMLImageElement).naturalHeight;
            const ratio = sh / sw;
            const w = size;
            const h = size * ratio;
            if (p.kind === "chest" && p.opened) ctx.globalAlpha = 0.45;
            ctx.drawImage(sprite as CanvasImageSource, s.x - w / 2, s.y - h + TILE_H * 0.4, w, h);
            ctx.globalAlpha = 1;
            // chest glint
            if (p.kind === "chest" && !p.opened) {
              const g = 0.4 + 0.3 * Math.sin(time * 0.005);
              ctx.save();
              ctx.globalAlpha = g;
              ctx.fillStyle = "#c8a24b";
              ctx.beginPath();
              ctx.arc(s.x, s.y - h * 0.5, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        },
      });
    });

    if (items.bonfire) {
      const b = items.bonfire;
      list.push({
        depth: b.pos.x + b.pos.y + 0.1,
        draw: () => {
          const img = getImage(URLS.bonfire);
          const s = this.screenOf(b.pos);
          // ember glow under bonfire
          const flick = 0.75 + 0.25 * Math.sin(time * 0.006) + 0.08 * Math.sin(time * 0.013);
          const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, 70 * flick);
          grad.addColorStop(0, "rgba(232,130,60,0.4)");
          grad.addColorStop(1, "rgba(232,130,60,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(s.x - 80, s.y - 80, 160, 160);
          if (img) {
            const w = TILE_W * 1.15 * flick ** 0.08;
            const h = w * (img.naturalHeight / img.naturalWidth);
            ctx.drawImage(img, s.x - w / 2, s.y - h + TILE_H * 0.42, w, h);
          }
        },
      });
    }

    items.npcs?.forEach((n) => {
      list.push({
        depth: n.pos.x + n.pos.y + 0.1,
        draw: () => {
          const img = getImage(n.id === "elara" ? URLS.elara : URLS.gromm);
          const s = this.screenOf(n.pos);
          if (img) {
            const w = TILE_W * 1.12;
            const h = w * (img.naturalHeight / img.naturalWidth);
            ctx.drawImage(img, s.x - w / 2, s.y - h + TILE_H * 0.42, w, h);
          }
          // gentle gold marker
          const bob = Math.sin(time * 0.003) * 3;
          ctx.save();
          ctx.fillStyle = "rgba(200,162,75,0.9)";
          ctx.font = "13px serif";
          ctx.textAlign = "center";
          ctx.fillText("✦", s.x, s.y - TILE_W * 1.5 + bob);
          ctx.restore();
        },
      });
    });

    items.doors?.forEach((d) => {
      list.push({
        depth: d.pos.x + d.pos.y + 0.05,
        draw: () => {
          const s = this.screenOf(d.pos);
          this.drawDiamond(d.pos, d.locked ? "rgba(120,30,25,0.35)" : "rgba(200,162,75,0.3)", d.locked ? "rgba(180,60,40,0.8)" : "rgba(200,162,75,0.9)", 2);
          ctx.save();
          ctx.fillStyle = d.locked ? "#b05038" : "#c8a24b";
          ctx.font = "600 10px 'Cinzel', serif";
          ctx.textAlign = "center";
          ctx.fillText(d.label, s.x, s.y - 12);
          ctx.restore();
        },
      });
    });

    if (items.soulDrop) {
      const p = items.soulDrop;
      list.push({
        depth: p.x + p.y + 0.05,
        draw: () => {
          const s = this.screenOf(p);
          const fl = 0.6 + 0.4 * Math.sin(time * 0.005);
          const grad = ctx.createRadialGradient(s.x, s.y - 8, 2, s.x, s.y - 8, 26);
          grad.addColorStop(0, `rgba(120,220,180,${0.75 * fl})`);
          grad.addColorStop(1, "rgba(120,220,180,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(s.x - 30, s.y - 40, 60, 60);
          ctx.fillStyle = `rgba(180,255,220,${0.9 * fl})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y - 8, 5, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    // dying units: fading corpse sinks into the ground
    items.dying?.forEach((d) => {
      list.push({
        depth: d.pos.x + d.pos.y + 0.15,
        draw: () => {
          const sprite = getSprite(d.unit.sprite);
          if (!sprite) return;
          const s = this.screenOf(d.pos);
          const sw = sprite instanceof HTMLCanvasElement ? sprite.width : (sprite as HTMLImageElement).naturalWidth;
          const sh = sprite instanceof HTMLCanvasElement ? sprite.height : (sprite as HTMLImageElement).naturalHeight;
          const ratio = sh / sw;
          const w = TILE_W * 1.05 * d.unit.scale;
          const h = w * ratio;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - d.t) * 0.9;
          // crumble: squash down and tint dark as it dies
          const squash = 1 - d.t * 0.55;
          ctx.drawImage(
            sprite as CanvasImageSource,
            s.x - w / 2,
            s.y - h * squash + TILE_H * 0.42,
            w,
            h * squash,
          );
          ctx.restore();
        },
      });
    });

    items.units.forEach((u) => {
      if (u.dead) return;
      const screenPos = items.unitScreenOverride?.get(u.uid);
      const gp = screenPos ? null : u.pos;
      const s = screenPos ?? this.screenOf(u.pos);
      const depth = gp ? gp.x + gp.y + 0.2 : (u.pos.x + u.pos.y + 0.2);
      list.push({
        depth,
        draw: () => {
          // player uses directional walk frames while moving
          let sprite: CanvasImageSource | undefined;
          const atk = items.unitAttack?.get(u.uid);
          const atkKey: AttackKey | undefined = u.isPlayer ? (u.attackKey as AttackKey) ?? "knight" : u.attackKey;
          if (atk && atkKey) {
            const frame = Math.min(5, Math.floor(atk.t * 6));
            sprite = getAttackFrame(atkKey, atk.dir, frame) ?? getSprite(u.sprite);
          } else if (u.isPlayer && items.playerWalk?.moving) {
            // mage/archer classes have their own walk strips; knight uses the legacy 4-dir sheet
            sprite = u.walkKey
              ? (getMobWalkFrame(u.walkKey, items.playerWalk.dir, items.playerWalk.frame) ?? getSprite(u.sprite))
              : (getWalkFrame(items.playerWalk.dir, items.playerWalk.frame) ?? getSprite(u.sprite));
          } else if (u.isPlayer && items.playerWalk) {
            // idle: keep last facing using frame 0 of that direction for continuity
            sprite = u.walkKey
              ? (getMobWalkFrame(u.walkKey, items.playerWalk.dir, 0) ?? getSprite(u.sprite))
              : (getWalkFrame(items.playerWalk.dir, 0) ?? getSprite(u.sprite));
          } else if (!u.isPlayer && u.walkKey && u.walkKey !== "hover") {
            const wk = items.unitWalk?.get(u.uid);
            if (wk?.moving) {
              sprite = getMobWalkFrame(u.walkKey, wk.dir, wk.frame) ?? getSprite(u.sprite);
            } else if (u.moveStyle === "fly" || u.moveStyle === "drift" || u.moveStyle === "swim") {
              // airborne mobs keep animating even when standing still (frame cycles slowly);
              // drift/swim cycle slower than wing-flap fliers, keeping last facing
              const rate = u.moveStyle === "fly" ? 7 : 4.5;
              const idleFrame = Math.floor(items.time * rate + u.uid) % 6;
              const idleDir = wk?.dir === "sw" || wk?.dir === "nw" ? "sw" : "se";
              sprite = getMobWalkFrame(u.walkKey, idleDir, idleFrame) ?? getSprite(u.sprite);
            } else if (u.idleKey) {
              // idle breathing strip: slow 6-frame sway while standing
              const idleFrame = Math.floor(items.time * 4 + u.uid) % 6;
              const idleDir = wk?.dir === "sw" || wk?.dir === "nw" ? "sw" : "se";
              sprite = getIdleFrame(u.idleKey, idleDir, idleFrame) ?? getSprite(u.sprite);
            } else {
              sprite = getSprite(u.sprite);
            }
          } else if (!u.isPlayer && u.idleKey) {
            const idleFrame = Math.floor(items.time * 4 + u.uid) % 6;
            sprite = getIdleFrame(u.idleKey, "se", idleFrame) ?? getSprite(u.sprite);
          } else {
            sprite = getSprite(u.sprite);
          }
          const wkState = items.unitWalk?.get(u.uid);
          const style = u.moveStyle;
          // vertical/horizontal life offsets per movement style
          let hoverOff = 0;
          let swayOff = 0;
          if (u.walkKey === "hover" || style === "fly") {
            hoverOff = Math.sin(items.time * 2.6 + u.uid * 1.7) * 4 - 3;
            if (style === "fly") hoverOff -= 8; // fliers ride a bit higher off the ground
          } else if (style === "drift") {
            hoverOff = Math.sin(items.time * 1.7 + u.uid * 2.1) * 5 - 2;
            swayOff = Math.sin(items.time * 1.1 + u.uid) * 4;
          } else if (style === "swim") {
            hoverOff = Math.sin(items.time * 3.2 + u.uid * 1.3) * 2.5;
            swayOff = Math.sin(items.time * 2.1 + u.uid * 0.7) * 3;
          } else if (style === "hop" && wkState?.moving) {
            // hop arc synced to the 6-frame cycle: airborne mid-frames
            const ph = (wkState.frame % 6) / 6;
            hoverOff = -Math.abs(Math.sin(ph * Math.PI)) * 14;
          }
          const active = items.activeUid === u.uid;
          // active unit ring
          if (active) {
            const gd = this.gridAtScreen(s.x, s.y);
            this.drawDiamond(gd, "", u.isPlayer ? "rgba(200,162,75,0.9)" : "rgba(220,60,40,0.9)", 2);
          }
          if (u.invisible > 0) ctx.globalAlpha = 0.25;
          if (sprite) {
            const sw = sprite instanceof HTMLCanvasElement ? sprite.width : (sprite as HTMLImageElement).naturalWidth;
            const sh = sprite instanceof HTMLCanvasElement ? sprite.height : (sprite as HTMLImageElement).naturalHeight;
            const ratio = sh / sw;
            const w = TILE_W * 1.05 * u.scale;
            let h = w * ratio;
            // idle breathing for grounded, non-moving mobs (subtle vertical squash cycle)
            const grounded = !u.isPlayer && u.walkKey !== "hover" && style !== "fly" && style !== "drift" && style !== "swim";
            if (grounded && !wkState?.moving) {
              h *= 1 + Math.sin(items.time * 1.9 + u.uid * 2.3) * 0.012;
            }
            // shadow ellipse — airborne styles get a smaller, pulsing shadow
            const airborne = u.walkKey === "hover" || style === "fly" || style === "drift" || style === "swim" || (style === "hop" && hoverOff < -2);
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            ctx.beginPath();
            const shScale = airborne ? 0.72 + Math.sin(items.time * 2.6 + u.uid * 1.7) * 0.08 : 1;
            ctx.ellipse(s.x, s.y + TILE_H * 0.18, w * 0.28 * shScale, TILE_H * 0.22 * shScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.drawImage(sprite as CanvasImageSource, s.x - w / 2 + swayOff, s.y - h + TILE_H * 0.42 + hoverOff, w, h);
          } else {
            // fallback marker
            ctx.fillStyle = u.isPlayer ? "#c8a24b" : "#a04030";
            ctx.beginPath();
            ctx.arc(s.x, s.y - 14, 12, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // status pips + hp bar for enemies
          if (!u.isPlayer) {
            const w = 40;
            const y = s.y - TILE_W * u.scale * 1.05 + 6;
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(s.x - w / 2, y, w, 4);
            ctx.fillStyle = u.isBoss ? "#c8a24b" : "#b04434";
            ctx.fillRect(s.x - w / 2, y, w * Math.max(0, u.hp / u.hpMax), 4);
            // posture
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(s.x - w / 2, y + 5, w, 2.5);
            ctx.fillStyle = u.staggered > 0 ? "#e8d44b" : "#7a7468";
            ctx.fillRect(s.x - w / 2, y + 5, w * Math.min(1, u.posture / u.postureMax), 2.5);
            if (u.staggered > 0) {
              ctx.fillStyle = "#e8d44b";
              ctx.font = "bold 11px serif";
              ctx.textAlign = "center";
              ctx.fillText("STAGGERED", s.x, y - 4);
            }
          }
          if (u.poisoned > 0) {
            // dripping poison: pip + falling green droplets
            ctx.fillStyle = "#6aa84f";
            ctx.beginPath();
            ctx.arc(s.x - 16, s.y - TILE_W * u.scale + 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 2; i++) {
              const ph = ((time * 0.0012 + i * 0.5 + u.uid * 0.21) % 1);
              ctx.globalAlpha = (1 - ph) * 0.75;
              ctx.fillStyle = "#7bc25e";
              ctx.beginPath();
              ctx.arc(
                s.x - 10 + i * 18 + Math.sin(u.uid + i) * 4,
                s.y - TILE_W * u.scale * 0.75 + ph * 34,
                2.2,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          if (u.webbed > 0) {
            // web strands wrapped around the unit
            ctx.save();
            ctx.strokeStyle = "rgba(230,230,235,0.55)";
            ctx.lineWidth = 1.2;
            const wy = s.y - TILE_W * u.scale * 0.45;
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.moveTo(s.x - 17, wy + i * 8 - 6);
              ctx.quadraticCurveTo(s.x, wy + i * 8 + (i % 2 ? 4 : -3), s.x + 17, wy + i * 8 - 8);
              ctx.stroke();
            }
            ctx.fillStyle = "#cccccc";
            ctx.beginPath();
            ctx.arc(s.x + 16, s.y - TILE_W * u.scale + 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        },
      });
    });

    list.sort((a, b) => a.depth - b.depth);
    list.forEach((i) => i.draw());
  }

  /** Burst of death particles at a grid position. bones=skeletal shards, else ash embers. */
  spawnDeathBits(g: Vec2, bones: boolean, big = false) {
    const s = this.screenOf(g);
    // soul motes: slow cyan wisps that rise from every death (the soul leaving)
    const motes = big ? 10 : 6;
    for (let i = 0; i < motes; i++) {
      this.deathBits.push({
        x: s.x + (Math.random() - 0.5) * 26,
        y: s.y - 10 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 18,
        vy: -34 - Math.random() * 40,
        life: 0,
        max: 0.9 + Math.random() * 0.7,
        size: 1.4 + Math.random() * 1.8,
        color: `rgba(138,219,180,ALPHA)`,
      });
    }
    const n = big ? 26 : 14;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * (big ? 120 : 70);
      this.deathBits.push({
        x: s.x,
        y: s.y - 18 - Math.random() * 22,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp * 0.5 - 40,
        life: 0,
        max: 0.5 + Math.random() * 0.55,
        size: bones ? 1.6 + Math.random() * 2.4 : 1.2 + Math.random() * 2,
        color: bones
          ? `rgba(214,205,187,ALPHA)`
          : Math.random() < 0.5
            ? `rgba(232,130,60,ALPHA)`
            : `rgba(150,140,120,ALPHA)`,
      });
    }
  }

  /** Spawn a footstep dust puff at a screen position. */
  addDust(s: { x: number; y: number }) {
    for (let i = 0; i < 3; i++) {
      this.dust.push({
        x: s.x + (Math.random() - 0.5) * 14,
        y: s.y + 6 + (Math.random() - 0.5) * 5,
        vx: (Math.random() - 0.5) * 22,
        vy: -8 - Math.random() * 14,
        life: 0,
        max: 0.45 + Math.random() * 0.3,
        size: 2 + Math.random() * 2.5,
      });
    }
  }

  drawFx(dt: number, weather?: { ash?: boolean; fog?: boolean }) {
    const ctx = this.ctx;
    // drifting ash flakes (overworld weather)
    if (weather?.ash) {
      if (this.ashFlakes.length < 44) {
        this.ashFlakes.push({
          x: Math.random() * this.width,
          y: -6,
          vx: 6 + Math.random() * 16,
          vy: 12 + Math.random() * 20,
          phase: Math.random() * Math.PI * 2,
          size: 0.8 + Math.random() * 1.8,
        });
      }
      this.ashFlakes = this.ashFlakes.filter((f) => f.y < this.height + 8 && f.x < this.width + 8);
      this.ashFlakes.forEach((f) => {
        f.phase += dt * 1.4;
        f.x += (f.vx + Math.sin(f.phase) * 9) * dt;
        f.y += f.vy * dt;
        ctx.fillStyle = "rgba(190,182,168,0.4)";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    // death particles (soul motes drift upward — no gravity for the cyan wisps)
    this.deathBits = this.deathBits.filter((p) => p.life < p.max);
    this.deathBits.forEach((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const isSoul = p.color.startsWith("rgba(138");
      p.vy += (isSoul ? -18 : 150) * dt;
      const a = Math.max(0, 1 - p.life / p.max) * 0.85;
      ctx.fillStyle = p.color.replace("ALPHA", a.toFixed(2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // footstep dust
    this.dust = this.dust.filter((p) => p.life < p.max);
    this.dust.forEach((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 26 * dt;
      const a = Math.max(0, 1 - p.life / p.max) * 0.32;
      ctx.fillStyle = `rgba(168,158,140,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.life * 1.6), 0, Math.PI * 2);
      ctx.fill();
    });
    // embers
    if (Math.random() < 0.15) this.spawnEmbers(1);
    this.embers = this.embers.filter((e) => e.life < e.max);
    this.embers.forEach((e) => {
      e.life += dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const a = Math.max(0, 1 - e.life / e.max) * 0.7;
      ctx.fillStyle = `rgba(232,140,60,${a})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // damage numbers — arc with gravity + pop-in scale
    this.damageNumbers = this.damageNumbers.filter((d) => d.t < 1);
    this.damageNumbers.forEach((d) => {
      d.t += dt * 0.85;
      d.ox += d.vx * dt;
      d.oy += d.vy * dt;
      d.vy += 140 * dt; // gravity flattens the arc
      const s = this.screenOf(d.pos);
      const x = s.x + d.ox;
      const y = s.y - 50 + d.oy;
      // pop-in: 1.45 → 1.0 over the first 18% of life
      const pop = d.t < 0.18 ? 1.45 - (d.t / 0.18) * 0.45 : 1;
      const base = d.big ? 24 : 17;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, (d.t - 0.35) / 0.65));
      ctx.font = `700 ${Math.round(base * pop)}px 'Cinzel', serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = d.big ? 4 : 3;
      ctx.strokeText(d.text, x, y);
      ctx.fillStyle = d.color;
      ctx.fillText(d.text, x, y);
      ctx.restore();
    });
    // crypt fog: slow horizontal haze bands
    if (weather?.fog) {
      ctx.save();
      const t = performance.now() * 0.00004;
      for (let i = 0; i < 3; i++) {
        const y = this.height * (0.35 + i * 0.2) + Math.sin(t * 900 + i * 2.2) * 14;
        const g = ctx.createLinearGradient(0, y - 46, 0, y + 46);
        g.addColorStop(0, "rgba(120,125,140,0)");
        g.addColorStop(0.5, `rgba(120,125,140,${0.05 + i * 0.014})`);
        g.addColorStop(1, "rgba(120,125,140,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 46, this.width, 92);
      }
      ctx.restore();
    }
    // decay shake (vignette moved to endFrame, drawn outside the camera transform)
    this.shake = Math.max(0, this.shake - dt * 40);
  }

  beginFrame() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.5) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    // zoom the whole world around screen center (see applyCamera)
    if (Math.abs(this.camZoom - 1) > 0.001) {
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(this.camZoom, this.camZoom);
      ctx.translate(-this.width / 2, -this.height / 2);
    }
  }

  endFrame() {
    const ctx = this.ctx;
    ctx.restore();
    // cinematic letterbox bars (screen space, above everything but the vignette)
    if (this.letterbox > 0.005) {
      const h = this.height * 0.12 * Math.min(1, this.letterbox);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.width, h);
      ctx.fillRect(0, this.height - h, this.width, h);
    }
    // vignette in raw screen space so it always hugs the edges regardless of zoom
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.36,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.72
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
