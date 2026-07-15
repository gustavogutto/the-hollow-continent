/* Game orchestrator — modes, page transitions, bonfires, death loop, NPCs, saving.
 * Ashen Gothic: deliberate, weighty; ember light carries the information. */
import type { Vec2, Unit, SaveData, HudState, GameMode, PropDef, CombatUnitView } from "./types";
import { PAGES, GRID, neighborPage, START_POS } from "./data/world";
import { MOBS } from "./data/mobs";
import { ITEMS, UPGRADE_DMG_PER_LVL, VIT_HP, STR_DMG, INT_DMG, AGI_INIT } from "./data/items";
import { CLASSES, type PlayerClass } from "./data/classes";
import type { SpellDef } from "./types";
import { Renderer, type DyingUnit } from "./engine/renderer";
import { ZONE2_ENTRY, ZONE_GATES, ILLUSORY_SECRETS } from "./data/world";
import { BOSS_IDS } from "./data/mobs";
import { loadAssets, URLS, WALK_FRAMES, type WalkDir } from "./engine/assets";
import { bus } from "./core/events";
import { audio } from "./core/audio";
import { defaultSave, loadSave, loadSlot, mostRecentSlot, setActiveSlot, writeSave } from "./core/save";
import { Combat, makeUnit } from "./modes/combat";
import { bfsPath, eq, gridToScreen, manhattan } from "./engine/iso";

const PLAYER_BASE_HP = 100;
const PLAYER_BASE_AP = 6;
const PLAYER_BASE_MP = 3;
const FLASK_HEAL = 45;

interface MoveAnim {
  unit: Unit;
  path: Vec2[];
  seg: number;
  t: number;
  done: () => void;
}

interface AttackAnim {
  unit: Unit;
  target: Vec2;
  t: number;
  done: () => void;
}

export class Game {
  renderer: Renderer;
  mode: GameMode = "menu";
  save: SaveData = defaultSave();
  player: Unit;
  combat: Combat | null = null;
  pageProps: PropDef[] = [];
  pageMobGroups: { id: string; pos: Vec2; mobIds: string[]; defeated: boolean }[] = [];
  hoverCell: Vec2 | null = null;
  selectedSpell = -1;
  moveAnims: MoveAnim[] = [];
  attackAnims: AttackAnim[] = [];
  raf = 0;
  lastTime = 0;
  destroyed = false;
  interactHint: string | null = null;
  demo = false;
  demoTimer = 0;
  private saveTimer = 0;
  // joystick-style walking state
  private heldDirs: string[] = [];
  private walkDir: WalkDir = "se";
  private walkFrameT = 0;
  private walkMoving = false;
  private dustTimer = 0;
  // per-unit walk animation state (mobs/bosses), keyed by uid
  private unitWalkT = new Map<number, number>();
  private unitWalk = new Map<number, { moving: boolean; dir: WalkDir; frame: number }>();
  // attack sheet playback state, keyed by uid
  private unitAttack = new Map<number, { dir: WalkDir; t: number }>();
  // units playing their death animation
  private dying: DyingUnit[] = [];
  // enemy whose intent is being previewed (hover in combat)
  private intentUid: number | null = null;
  // controls help overlay (? button / H key); auto-shown once for new players
  helpVisible = false;
  menuOpen = false;
  // first-run help queued until the intro dialogue closes
  private pendingFirstHelp = false;
  // combat juice: brief global slowdown after impacts (seconds remaining)
  private hitStop = 0;
  private cinematic: { t: number; dur: number; focus: Vec2 } | null = null;
  // scripted first fight (tutorial)
  private tutorialQueued = false;
  private tutorialStep = -1;
  private tutorialGroup: { id: string; pos: Vec2; mobIds: string[]; defeated: boolean } | null = null;
  // ambient wandering of explore mob groups, keyed by group id
  private wander = new Map<
    string,
    { home: Vec2; target: Vec2 | null; timer: number; dir: WalkDir; walkT: number }
  >();

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.player = makeUnit("frail_hollow", { ...START_POS }, true);
    this.player.name = "Ember-Bearer";
    this.player.sprite = { url: URLS.player };
    // Walk sheet cells are 448x1152 (aspect 2.571) and the renderer scales by WIDTH
    // (w = TILE_W*1.05*scale, h = w*aspect). Content fills ~92% of cell height, so
    // visible height = 1.05*scale*2.571*0.92 TILE_W. NPCs render ~1.07 TILE_W tall;
    // scale 0.5 puts the knight at ~1.24 TILE_W — slightly taller than Elara/Gromm.
    this.player.scale = 0.5;
    this.demo = typeof window !== "undefined" && window.location.search.includes("demo");
  }

  async init() {
    await loadAssets();
    this.resize();
    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("click", this.onClick);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
    this.pushHud();
    if (this.demo) {
      this.newGame(true);
      if (window.location.search.includes("demo=combat")) {
        // jump straight to a mob page and start a fight for verification.
        // demo=combat:mob_id1,mob_id2 spawns a custom QA group of those mobs.
        this.loadPage("p3_2", { x: 2, y: 7 });
        const m = window.location.search.match(/demo=combat:([a-z0-9_,]+)/);
        if (m) {
          const ids = m[1].split(",").filter((id) => MOBS[id]);
          if (ids.length) {
            const qaGroup = {
              id: "qa_group",
              mobIds: ids,
              pos: { x: 6, y: 5 },
              defeated: false,
            } as (typeof this.pageMobGroups)[number];
            this.pageMobGroups.push(qaGroup);
            this.startCombat(qaGroup);
            return;
          }
        }
        const g = this.pageMobGroups.find((g) => !g.defeated);
        if (g) this.startCombat(g);
      }
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("click", this.onClick);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
  }

  resize = () => {
    this.renderer.resize(window.innerWidth, window.innerHeight);
  };

  // ---------- persistence ----------
  hasSave(): boolean {
    return mostRecentSlot() !== null;
  }

  newGame(demo = false, slot?: number, cls: PlayerClass = "knight") {
    if (slot) setActiveSlot(slot);
    this.save = defaultSave(cls);
    writeSave(this.save);
    this.applyStats();
    this.player.hp = this.player.hpMax;
    this.loadPage(this.save.currentPage, { ...this.save.playerPos });
    this.mode = "explore";
    audio.startAmbient();
    bus.emit("zone", { name: "The Ashen Incarnation" });
    if (!demo) {
      setTimeout(() => {
        bus.emit("dialogue", { npc: "elara_intro" });
      }, 2600);
      // first-run: the controls overlay auto-shows once, but only after the
      // intro dialogue has been dismissed (dialogueClosed) — never on top of it
      this.pendingFirstHelp = !this.save.helpSeen;
    }
    this.pushHud();
  }

  continueGame(slot?: number) {
    if (slot) setActiveSlot(slot);
    else {
      const recent = mostRecentSlot();
      if (recent) setActiveSlot(recent);
    }
    const s = loadSave();
    if (!s) return this.newGame();
    this.save = s;
    this.applyStats();
    this.player.hp = s.hp < 0 ? this.player.hpMax : Math.min(s.hp, this.player.hpMax);
    this.loadPage(s.currentPage, { ...s.playerPos });
    this.mode = "explore";
    audio.startAmbient();
    bus.emit("zone", { name: PAGES[s.currentPage]?.name ?? "The Ashen Incarnation" });
    // players from older saves have never seen the help overlay — show it once
    if (!this.save.helpSeen) {
      setTimeout(() => {
        if (!this.save.helpSeen && this.mode === "explore") {
          this.helpVisible = true;
          this.pushHud();
        }
      }, 1500);
    } else if (!this.save.tutorialDone) {
      // continued a save that never finished the scripted first fight
      setTimeout(() => this.maybeStartTutorial(), 1800);
    }
    this.pushHud();
  }

  persist() {
    this.save.playerPos = { ...this.player.pos };
    this.save.hp = this.player.hp;
    writeSave(this.save);
  }

  /** recompute player derived stats from save */
  applyStats() {
    this.applyClassArt();
    const cls = CLASSES[this.save.playerClass ?? "knight"];
    const s = this.save.stats;
    let hpMax = cls.baseHp + s.vitality * VIT_HP;
    let ap = cls.baseAp;
    let mp = cls.baseMp;
    const eqp = this.save.equipment;
    ([eqp.weapon, eqp.armor, eqp.helmet, eqp.ring] as (string | null)[]).forEach((id) => {
      if (!id) return;
      const item = ITEMS[id];
      if (item?.hpBonus) hpMax += item.hpBonus;
      if (item?.apBonus) ap += item.apBonus;
      if (item?.mpBonus) mp += item.mpBonus;
    });
    this.player.hpMax = hpMax;
    this.player.hp = Math.min(this.player.hp, hpMax);
    this.player.apMax = ap;
    this.player.mpMax = mp;
    this.player.ap = ap;
    this.player.mp = mp;
    this.player.initiative = 50 + s.agility * AGI_INIT;
    this.player.level = s.level;
  }

  /** point the player unit at the right sprite set for the chosen class */
  private applyClassArt() {
    const cls = CLASSES[this.save.playerClass ?? "knight"];
    if (cls.id === "knight") {
      this.player.sprite = { url: URLS.player };
      this.player.walkKey = undefined;
      this.player.attackKey = "knight";
      this.player.name = "Ember-Bearer";
    } else {
      this.player.sprite = { url: cls.portrait };
      this.player.walkKey = cls.walkKey ?? undefined;
      this.player.attackKey = cls.attackKey;
      this.player.name = cls.title.replace(/^The /, "");
    }
  }

  // ---------- page loading ----------
  loadPage(pageId: string, pos: Vec2) {
    const page = PAGES[pageId];
    if (!page) return;
    this.save.currentPage = pageId;
    this.player.pos = { ...pos };
    // deep copy props with chest opened state
    this.pageProps = page.props.map((p) => ({
      ...p,
      pos: { ...p.pos },
      opened: p.kind === "chest" ? this.save.openedChests.includes(`${pageId}:${p.pos.x},${p.pos.y}`) : undefined,
    }));
    // mob groups — cleared until rest (boss/warden permanent)
    this.pageMobGroups = page.groups
      .filter((g) => {
        if (pageId === "d5" && this.save.bossDefeated) return false;
        if (pageId === "p4_0" && g.mobIds.includes("grave_warden") && this.save.wardenDefeated) return false;
        if (pageId === "f5" && this.save.vulkasDefeated) return false;
        if (pageId === "w5" && this.save.morvaneDefeated) return false;
        if (pageId === "c5" && this.save.aurelionDefeated) return false;
        return !this.save.clearedGroups.includes(`${pageId}:${g.id}`);
      })
      .map((g) => ({ id: g.id, pos: { ...g.pos }, mobIds: [...g.mobIds], defeated: false }));
    this.wander.clear();
    // snap the follow-camera to the player on page transitions (no cross-map pan)
    const world = gridToScreen(this.player.pos);
    const portrait = this.renderer.height > this.renderer.width * 1.1;
    this.renderer.setCameraFocus({ x: world.x, y: world.y - 30 }, portrait ? 1.25 : 1.05, true);
    this.persist();
  }

  get page() {
    return PAGES[this.save.currentPage];
  }

  isBlockedByProp = (p: Vec2): boolean => {
    return this.pageProps.some((prop) => prop.kind !== "bones" && prop.kind !== "cart" && eq(prop.pos, p));
  };

  exploreBlocked = (p: Vec2): boolean => {
    if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID) return true;
    if (this.isBlockedByProp(p)) return true;
    const page = this.page;
    if (page.npcs?.some((n) => eq(n.pos, p))) return true;
    if (page.bonfire && eq(page.bonfire.pos, p)) return true;
    return false;
  };

  // ---------- input ----------
  onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const g = this.renderer.gridAtScreen(e.clientX - rect.left, e.clientY - rect.top);
    this.hoverCell = g.x >= 0 && g.y >= 0 && g.x < GRID && g.y < GRID ? g : null;
    // enemy intent preview: hovering an enemy in combat shows its threat range
    this.intentUid = null;
    if (this.mode === "combat" && this.combat && this.hoverCell && this.selectedSpell < 0) {
      const enemy = this.combat.units.find((u) => !u.isPlayer && !u.dead && eq(u.pos, this.hoverCell!));
      if (enemy) this.intentUid = enemy.uid;
    }
  };

  onClick = (e: MouseEvent) => {
    audio.unlock();
    const rect = this.canvas.getBoundingClientRect();
    const g = this.renderer.gridAtScreen(e.clientX - rect.left, e.clientY - rect.top);
    if (g.x < 0 || g.y < 0 || g.x >= GRID || g.y >= GRID) return;
    if (this.mode === "explore") {
      this.exploreMoveTo(g);
    } else if (this.mode === "combat" && this.combat) {
      if (this.selectedSpell >= 0) {
        this.combat.castSpell(this.selectedSpell, g);
        this.selectedSpell = -1;
        this.pushHud();
      } else {
        this.combat.tryMove(g);
      }
    }
  };

  onKey = (e: KeyboardEvent) => {
    audio.unlock();
    const k = e.key.toLowerCase();
    if (this.mode === "explore") {
      if (k === "w" || k === "a" || k === "s" || k === "d") {
        e.preventDefault();
        if (!this.heldDirs.includes(k)) this.heldDirs.push(k);
        this.stepFromHeld();
        return;
      }
      if (k === "f") this.interact();
      if (k === "e") this.useFlaskExplore();
      if (k === "c") bus.emit("dialogue", { npc: "inventory" });
      if (k === "m") bus.emit("dialogue", { npc: "map" });
      if (k === "h" || k === "?") this.toggleHelp();
      if (k === "escape") {
        if (this.helpVisible) this.toggleHelp();
        else this.toggleMenu();
      }
    } else if (this.mode === "combat" && this.combat) {
      if (k === " ") {
        e.preventDefault();
        if (this.combat.isPlayerTurn) this.combat.endTurn();
      }
      if (k >= "1" && k <= "9") {
        const idx = parseInt(k) - 1;
        if (idx < this.activeSpells.length) {
          this.selectedSpell = this.selectedSpell === idx ? -1 : idx;
          this.pushHud();
        }
      }
      if (k === "e") this.useFlaskCombat();
      if (k === "h" || k === "?") this.toggleHelp();
      if (k === "escape") {
        if (this.selectedSpell >= 0 || this.helpVisible) {
          this.selectedSpell = -1;
          if (this.helpVisible) this.helpVisible = false;
          this.pushHud();
        } else {
          this.toggleMenu();
        }
      }
    }
  };

  /** Toggle the pause/system menu (Esc key or HUD pause button). */
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.helpVisible = false;
      this.heldDirs = [];
    }
    this.pushHud();
  }

  /** Save to the active slot and return to the title screen. */
  returnToTitle() {
    if (this.mode === "explore" || this.mode === "combat") this.persist();
    this.menuOpen = false;
    this.helpVisible = false;
    this.heldDirs = [];
    this.combat = null;
    this.mode = "menu";
    audio.stopAll();
    bus.emit("returnToTitle");
    this.pushHud();
  }

  /** Manual save into a specific slot (from the pause menu). Makes it the active slot. */
  saveToSlot(slot: number) {
    if (this.mode !== "explore" && this.mode !== "combat") return;
    setActiveSlot(slot);
    this.persist();
    this.renderer.addDamage(this.player.pos, "SAVED", "#8adbb4");
  }

  /** Load a slot from the pause menu: switch active slot and restart from its save. */
  loadFromSlot(slot: number) {
    const data = loadSlot(slot);
    if (!data) return;
    setActiveSlot(slot);
    this.menuOpen = false;
    this.helpVisible = false;
    this.heldDirs = [];
    this.combat = null;
    this.continueGame(slot);
  }

  /** Toggle the controls help overlay. Marks helpSeen so it never auto-shows again. */
  toggleHelp() {
    const wasFirstView = this.helpVisible && !this.save.helpSeen;
    this.helpVisible = !this.helpVisible;
    if (!this.save.helpSeen) {
      this.save.helpSeen = true;
      this.persist();
    }
    this.pushHud();
    // closing the first-run help on a fresh save leads straight into the scripted first fight
    if (wasFirstView && !this.helpVisible) this.maybeStartTutorial();
  }

  /** Hide the help overlay if open (e.g. when a dialogue window opens). */
  hideHelp() {
    if (this.helpVisible) {
      this.helpVisible = false;
      this.pushHud();
    }
  }

  /** Called by the UI when a dialogue closes — triggers the one-time first-run help, then the scripted first fight. */
  onDialogueClosed() {
    if (this.pendingFirstHelp && !this.save.helpSeen && this.mode === "explore") {
      this.pendingFirstHelp = false;
      setTimeout(() => {
        if (!this.save.helpSeen && this.mode === "explore") {
          this.helpVisible = true;
          this.pushHud();
        }
      }, 600);
      return;
    }
    // after the help overlay path is exhausted, queue the tutorial fight on a fresh save
    this.maybeStartTutorial();
  }

  /** Scripted first fight: a lone Frail Hollow shambles up to teach the combat basics. */
  private maybeStartTutorial() {
    if (this.demo || this.save.tutorialDone || this.mode !== "explore" || this.tutorialQueued) return;
    this.tutorialQueued = true;
    setTimeout(() => {
      if (this.save.tutorialDone || this.mode !== "explore") {
        this.tutorialQueued = false;
        return;
      }
      bus.emit("toast", { msg: "Something stirs in the ash ahead…" });
      this.playSfx("tutorialPing");
      setTimeout(() => {
        if (this.mode !== "explore") {
          this.tutorialQueued = false;
          return;
        }
        // spawn the lesson beside the player
        const spot = this.findTutorialSpot();
        this.tutorialGroup = { id: "__tutorial__", pos: spot, mobIds: ["frail_hollow"], defeated: false };
        this.startCombat(this.tutorialGroup);
        this.tutorialStep = 0;
        this.advanceTutorialHint();
      }, 1600);
    }, 800);
  }

  private findTutorialSpot(): Vec2 {
    const dirs = [
      { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 },
      { x: 2, y: 1 }, { x: 1, y: 2 }, { x: -2, y: -1 }, { x: -1, y: -2 },
    ];
    for (const d of dirs) {
      const p = { x: this.player.pos.x + d.x, y: this.player.pos.y + d.y };
      if (p.x >= 1 && p.y >= 1 && p.x < GRID - 1 && p.y < GRID - 1 && !this.exploreBlocked(p)) return p;
    }
    return { x: Math.min(GRID - 2, this.player.pos.x + 1), y: this.player.pos.y };
  }

  /** Sequenced combat hints for the scripted first fight. */
  advanceTutorialHint() {
    if (!this.tutorialGroup || this.tutorialStep < 0) return;
    const hints = [
      "Tap a blue tile to MOVE (costs MP). Get beside the Hollow.",
      "Select STRIKE, then tap the Hollow to attack (costs AP).",
      "Attacks build POSTURE — stagger a foe and your next hit EXECUTES for massive damage.",
      "Attack from BEHIND for a backstab bonus. END TURN when you are out of AP.",
    ];
    if (this.tutorialStep < hints.length) {
      bus.emit("toast", { msg: `† ${hints[this.tutorialStep]}` });
      this.tutorialStep++;
      if (this.tutorialStep < hints.length) {
        window.setTimeout(() => this.advanceTutorialHint(), 6500);
      }
    }
  }

  onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.heldDirs = this.heldDirs.filter((d) => d !== k);
  };

  onBlur = () => {
    this.heldDirs = [];
  };

  /** Virtual joystick (touch): hold a direction like a WASD key, null to release. */
  setTouchDir(dir: "w" | "a" | "s" | "d" | null) {
    this.heldDirs = this.heldDirs.filter((d) => !["w", "a", "s", "d"].includes(d) || d === dir);
    if (dir && !this.heldDirs.includes(dir)) this.heldDirs.push(dir);
    if (dir) this.stepFromHeld();
  }

  /** Action bar spells: the base kit plus everything unlocked at Elara. */
  get activeSpells(): SpellDef[] {
    const cls = CLASSES[this.save.playerClass ?? "knight"];
    const unlocked = cls.unlockables.filter((s) => this.save.unlockedSpells.includes(s.id));
    return [...cls.spells, ...unlocked];
  }

  /** Learn an unlockable spell from Elara. Returns false if reqs unmet. */
  learnSpell(spellId: string, cost: { level: number; souls: number }): boolean {
    if (this.save.unlockedSpells.includes(spellId)) return false;
    if (this.save.stats.level < cost.level || this.save.stats.souls < cost.souls) return false;
    this.save.stats.souls -= cost.souls;
    this.save.unlockedSpells.push(spellId);
    if (this.combat) this.combat.playerSpells = this.activeSpells;
    this.persist();
    this.pushHud();
    return true;
  }

  /** Elara's memory quest: consume 3 memory fragments → souls + Keeper's Locket. */
  completeElaraQuest(): boolean {
    if (this.save.quests.elaraDone) return false;
    const frags = this.save.inventory.filter((i) => i === "memory_fragment").length;
    if (frags < 3) return false;
    let removed = 0;
    this.save.inventory = this.save.inventory.filter((i) => {
      if (i === "memory_fragment" && removed < 3) {
        removed++;
        return false;
      }
      return true;
    });
    this.save.quests.elaraMemories = 3;
    this.save.quests.elaraDone = true;
    this.save.stats.souls += 2000;
    this.save.inventory.push("keepers_locket");
    this.persist();
    this.pushHud();
    return true;
  }

  /** Gromm's forge quest: consume 2 ember ore → Ember-Forged Greatsword. */
  completeGrommQuest(): boolean {
    if (this.save.quests.grommDone) return false;
    const ore = this.save.inventory.filter((i) => i === "ember_ore").length;
    if (ore < 2) return false;
    let removed = 0;
    this.save.inventory = this.save.inventory.filter((i) => {
      if (i === "ember_ore" && removed < 2) {
        removed++;
        return false;
      }
      return true;
    });
    this.save.quests.grommOre = 2;
    this.save.quests.grommDone = true;
    this.save.inventory.push("ember_greatsword");
    this.persist();
    this.pushHud();
    return true;
  }

  /** Walk continuously while a WASD key is held (joystick feel). */
  private stepFromHeld() {
    if (this.mode !== "explore" || this.moveAnims.length > 0 || this.heldDirs.length === 0) return;
    const k = this.heldDirs[this.heldDirs.length - 1];
    const dir =
      k === "w" ? { x: 0, y: -1 } : k === "s" ? { x: 0, y: 1 } : k === "a" ? { x: -1, y: 0 } : { x: 1, y: 0 };
    this.exploreStep(dir);
  }

  /** Update player facing from a movement delta (screen-space direction). */
  private setFacing(from: Vec2, to: Vec2) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // isometric: grid +x = screen SE, grid -x = NW, grid +y = SW, grid -y = NE
    if (dx > 0) this.walkDir = "se";
    else if (dx < 0) this.walkDir = "nw";
    else if (dy > 0) this.walkDir = "sw";
    else if (dy < 0) this.walkDir = "ne";
  }

  selectSpell(idx: number) {
    if (this.mode !== "combat") return;
    this.selectedSpell = this.selectedSpell === idx ? -1 : idx;
    this.pushHud();
  }

  endPlayerTurn() {
    if (this.combat?.isPlayerTurn) this.combat.endTurn();
  }

  // ---------- explore ----------
  exploreStep(dir: Vec2) {
    if (this.moveAnims.length > 0) return;
    const np = { x: this.player.pos.x + dir.x, y: this.player.pos.y + dir.y };
    // page transition at edges
    if (np.x < 0 || np.x >= GRID || np.y < 0 || np.y >= GRID) {
      this.tryPageTransition(np);
      return;
    }
    if (this.exploreBlocked(np)) {
      this.tryIllusoryWall(np);
      return;
    }
    this.animateUnitMove(this.player, [np], () => {
      this.player.pos = np;
      this.afterExploreStep();
    });
  }

  /** Souls-style secret: walking into an illusory wall dispels it. */
  private tryIllusoryWall(np: Vec2) {
    const prop = this.pageProps.find((p) => p.kind === "illusory" && eq(p.pos, np));
    if (!prop) return;
    const key = `${this.save.currentPage}:${np.x},${np.y}`;
    const secret = ILLUSORY_SECRETS[key];
    if (!secret) return;
    if (!this.save.secretsFound.includes(key)) {
      this.save.secretsFound.push(key);
      this.renderer.addDamage(np, "ILLUSORY WALL", "#c8a24b");
      bus.emit("toast", { msg: "The wall was never there. A hidden path opens..." });
    }
    this.persist();
    setTimeout(() => this.enterPage(secret.to, { ...secret.spawn }), 350);
  }

  exploreMoveTo(target: Vec2) {
    if (this.moveAnims.length > 0) return;
    if (this.exploreBlocked(target) && !this.isInteractable(target)) return;
    const goal = this.isInteractable(target) ? this.nearestFree(target) : target;
    if (!goal) return;
    const path = bfsPath(this.player.pos, goal, GRID, this.exploreBlocked, 30);
    if (!path || path.length === 0) return;
    this.animateUnitMove(this.player, path, () => {
      this.player.pos = { ...path[path.length - 1] };
      this.afterExploreStep();
    });
  }

  private nearestFree(target: Vec2): Vec2 | null {
    const dirs = [
      { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
    ];
    for (const d of dirs) {
      const p = { x: target.x + d.x, y: target.y + d.y };
      if (p.x >= 0 && p.y >= 0 && p.x < GRID && p.y < GRID && !this.exploreBlocked(p)) return p;
    }
    return null;
  }

  private isInteractable(p: Vec2): boolean {
    const page = this.page;
    if (page.bonfire && eq(page.bonfire.pos, p)) return true;
    if (page.npcs?.some((n) => eq(n.pos, p))) return true;
    if (this.pageProps.some((prop) => prop.kind === "chest" && !prop.opened && eq(prop.pos, p))) return true;
    return false;
  }

  afterExploreStep() {
    this.persist();
    // soul recovery
    const drop = this.save.droppedSouls;
    if (drop && drop.pageId === this.save.currentPage && eq(drop.pos, this.player.pos)) {
      this.save.stats.souls += drop.amount;
      this.save.droppedSouls = null;
      this.renderer.addDamage(this.player.pos, `+${drop.amount} SOULS RECOVERED`, "#8adbb4");
      bus.emit("toast", { msg: "Your lost souls return to you." });
      this.persist();
    }
    // mob aggro: engage if adjacent-ish
    for (const g of this.pageMobGroups) {
      if (!g.defeated && manhattan(g.pos, this.player.pos) <= 2) {
        this.startCombat(g);
        return;
      }
    }
    // dungeon door / entrance checks
    const page = this.page;
    if (page.dungeonEntrance && eq(page.dungeonEntrance.pos, this.player.pos)) {
      this.enterPage(page.dungeonEntrance.to, { x: 7, y: 12 });
      return;
    }
    if (page.dungeonNext && eq(page.dungeonNext.pos, this.player.pos)) {
      if (this.pageMobGroups.some((g) => !g.defeated)) {
        bus.emit("toast", { msg: "The sealed door will not open while the dead still stand." });
      } else {
        this.enterPage(page.dungeonNext.to, { x: 7, y: 12 });
      }
      return;
    }
    if (page.exitToOverworld && eq(page.exitToOverworld.pos, this.player.pos)) {
      this.enterPage(page.exitToOverworld.to, { x: 7, y: 5 });
      return;
    }
    this.updateInteractHint();
    this.pushHud();
  }

  updateInteractHint() {
    const page = this.page;
    this.interactHint = null;
    const near = (p: Vec2) => manhattan(p, this.player.pos) <= 1;
    if (page.bonfire && near(page.bonfire.pos)) this.interactHint = "F — Rest at bonfire";
    else if (page.npcs?.some((n) => near(n.pos))) {
      const npc = page.npcs.find((n) => near(n.pos))!;
      this.interactHint = `F — Speak with ${npc.id === "elara" ? "Elara" : "Gromm"}`;
    } else if (this.pageProps.some((p) => p.kind === "chest" && !p.opened && near(p.pos)))
      this.interactHint = "F — Open chest";
  }

  interact() {
    const page = this.page;
    const near = (p: Vec2) => manhattan(p, this.player.pos) <= 1;
    if (page.bonfire && near(page.bonfire.pos)) {
      this.restAtBonfire();
      return;
    }
    const npc = page.npcs?.find((n) => near(n.pos));
    if (npc) {
      bus.emit("dialogue", { npc: npc.id });
      return;
    }
    const chest = this.pageProps.find((p) => p.kind === "chest" && !p.opened && near(p.pos));
    if (chest) {
      chest.opened = true;
      this.save.openedChests.push(`${this.save.currentPage}:${chest.pos.x},${chest.pos.y}`);
      const pageDef = PAGES[this.save.currentPage];
      const src = pageDef.props.find((p) => p.kind === "chest" && eq(p.pos, chest.pos));
      const lootNames: string[] = [];
      src?.chestLoot?.forEach((id) => {
        this.save.inventory.push(id);
        lootNames.push(ITEMS[id]?.name ?? id);
      });
      if (src?.chestSouls) {
        this.save.stats.souls += src.chestSouls;
        lootNames.push(`${src.chestSouls} souls`);
      }
      bus.emit("toast", { msg: `Found: ${lootNames.join(", ")}` });
      this.renderer.addDamage(chest.pos, "OPENED", "#c8a24b");
      this.persist();
      this.pushHud();
    }
  }

  restAtBonfire() {
    const page = this.page;
    if (!page.bonfire) return;
    // heal, refill, respawn mobs
    this.player.hp = this.player.hpMax;
    this.save.flasks = this.save.flasksMax;
    this.save.lastBonfire = page.id;
    if (!this.save.discoveredBonfires.includes(page.id)) {
      this.save.discoveredBonfires.push(page.id);
      bus.emit("toast", { msg: `Bonfire discovered: ${page.bonfire.name}` });
    }
    this.save.clearedGroups = []; // mobs respawn
    this.persist();
    this.loadPage(page.id, this.player.pos);
    this.renderer.addDamage(this.player.pos, "RESTED", "#e8823c");
    audio.bonfireRest();
    bus.emit("bonfireMenu", {});
    this.pushHud();
  }

  teleportToBonfire(pageId: string) {
    const page = PAGES[pageId];
    if (!page?.bonfire) return;
    this.save.clearedGroups = [];
    this.loadPage(pageId, this.nearestFreeOn(pageId, page.bonfire.pos));
    this.player.hp = this.player.hpMax;
    this.save.flasks = this.save.flasksMax;
    this.save.lastBonfire = pageId;
    bus.emit("zone", { name: page.name });
    this.persist();
    this.pushHud();
  }

  private nearestFreeOn(pageId: string, p: Vec2): Vec2 {
    return { x: p.x, y: p.y + 1 };
  }

  useFlaskExplore() {
    if (this.save.flasks <= 0 || this.player.hp >= this.player.hpMax) return;
    this.save.flasks--;
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + FLASK_HEAL);
    audio.flask();
    this.renderer.addDamage(this.player.pos, `+${FLASK_HEAL}`, "#8adbb4");
    this.persist();
    this.pushHud();
  }

  useFlaskCombat() {
    if (!this.combat?.isPlayerTurn) return;
    if (this.save.flasks <= 0 || this.player.hp >= this.player.hpMax) return;
    if (this.player.ap < 2) {
      bus.emit("toast", { msg: "Drinking takes 2 AP." });
      return;
    }
    this.player.ap -= 2;
    this.save.flasks--;
    this.player.hp = Math.min(this.player.hpMax, this.player.hp + FLASK_HEAL);
    audio.flask();
    this.renderer.addDamage(this.player.pos, `+${FLASK_HEAL}`, "#8adbb4");
    this.pushHud();
  }

  tryPageTransition(np: Vec2) {
    const page = this.page;
    if (page.kind === "dungeon") return; // dungeons use doors
    let dir: "N" | "S" | "E" | "W" | null = null;
    if (np.y < 0) dir = "N";
    else if (np.y >= GRID) dir = "S";
    else if (np.x < 0) dir = "W";
    else if (np.x >= GRID) dir = "E";
    if (!dir) return;
    let next = neighborPage(page.id, dir);
    // the descent to the Sunken Reach opens once Kardorim has fallen
    if (!next && page.id === ZONE2_ENTRY.fromPage && dir === "N") {
      if (!this.save.bossDefeated) {
        bus.emit("toast", { msg: "A drowned stair descends here — but a seal of ash bars it while the Hollow King reigns." });
        return;
      }
      next = ZONE2_ENTRY.toPage;
    }
    // returning from the Sunken Reach
    if (!next && page.id === ZONE2_ENTRY.toPage && dir === "S") {
      next = ZONE2_ENTRY.fromPage;
    }
    // expansion zone gates (Cinder Marches / Pale Marsh / Shattered Peaks)
    if (!next) {
      for (const gate of ZONE_GATES) {
        if (page.id === gate.fromPage && dir === gate.dir) {
          if (!this.save[gate.flag]) {
            bus.emit("toast", { msg: gate.lockedMsg });
            return;
          }
          next = gate.toPage;
          bus.emit("toast", { msg: `You cross into ${gate.zoneName}.` });
          break;
        }
        if (page.id === gate.toPage && dir === gate.backDir) {
          next = gate.fromPage;
          break;
        }
      }
    }
    if (!next) {
      bus.emit("toast", { msg: "Only the void lies beyond." });
      return;
    }
    const entry: Vec2 =
      dir === "N" ? { x: this.player.pos.x, y: GRID - 1 } :
      dir === "S" ? { x: this.player.pos.x, y: 0 } :
      dir === "W" ? { x: GRID - 1, y: this.player.pos.y } :
      { x: 0, y: this.player.pos.y };
    this.enterPage(next, entry);
  }

  enterPage(pageId: string, pos: Vec2) {
    // find free entry
    let p = { ...pos };
    let guard = 0;
    while (this.destroyed === false && guard++ < 20) {
      this.loadPage(pageId, p);
      if (!this.exploreBlocked(p)) break;
      p = { x: Math.min(GRID - 1, p.x + 1), y: p.y };
    }
    bus.emit("zone", { name: PAGES[pageId].name });
    this.afterExploreStep();
    this.pushHud();
  }

  // ---------- combat ----------
  startCombat(group: { id: string; pos: Vec2; mobIds: string[]; defeated: boolean }) {
    // wandering leaves fractional positions — snap the group to its grid cell
    group.pos = { x: Math.round(group.pos.x), y: Math.round(group.pos.y) };
    const enemies: Unit[] = [];
    const positions = this.spreadPositions(group.pos, group.mobIds.length);
    group.mobIds.forEach((mid, i) => {
      enemies.push(makeUnit(mid, positions[i]));
    });
    this.applyStats();
    this.player.ap = this.player.apMax;
    this.player.mp = this.player.mpMax;
    this.player.posture = 0;
    this.player.staggered = 0;
    this.player.poisoned = 0;
    this.player.webbed = 0;
    this.player.dead = false;
    this.selectedSpell = -1;

    const isBossFight = group.mobIds.some((id) => BOSS_IDS.has(id));
    const combat = new Combat(this.player, enemies, {
      onDamage: (pos, text, color, big) => this.renderer.addDamage(pos, text, color, { big }),
      onShake: (amt) => this.renderer.addShake(amt),
      onSfx: (name) => this.playSfx(name),
      onImpact: (kind) => {
        this.hitStop = Math.max(
          this.hitStop,
          kind === "execution" ? 0.14 : kind === "cleave" ? 0.12 : kind === "backstab" ? 0.09 : kind === "crash" ? 0.1 : 0.055
        );
      },
      onUnitMoved: () => {},
      onLog: (msg) => bus.emit("toast", { msg }),
      onStateChange: () => this.pushHud(),
      onCombatEnd: (victory, souls) => this.onCombatEnd(group, victory, souls),
      isBlockedByProp: this.isBlockedByProp,
      animateMove: (unit, path, done) => this.animateUnitMove(unit, path, done),
      animateAttack: (unit, target, done) => this.animateAttack(unit, target, done),
      onUnitDied: (unit) => this.onUnitDeath(unit),
    });
    combat.playerSpells = this.activeSpells;
    // apply player scaling
    const s = this.save.stats;
    combat.physMult = 1 + s.strength * STR_DMG;
    combat.magMult = 1 + s.intelligence * INT_DMG;
    {
      // reinforcement + equipped gear damage bonuses (weapon/armor/helmet/ring average of dmgBonus range)
      const eqp = this.save.equipment;
      let gearFlat = 0;
      ([eqp.weapon, eqp.armor, eqp.helmet, eqp.ring] as (string | null)[]).forEach((id) => {
        const b = id ? ITEMS[id]?.dmgBonus : undefined;
        if (b) gearFlat += Math.round((b[0] + b[1]) / 2);
      });
      combat.weaponFlat = this.save.weaponLevel * UPGRADE_DMG_PER_LVL + gearFlat;
    }
    this.combat = combat;
    this.mode = "combat";
    audio.combatStart(isBossFight);
    bus.emit("combatStart", {});
    if (isBossFight) {
      const bossId = group.mobIds.find((id) => BOSS_IDS.has(id));
      const BOSS_TITLES: Record<string, string> = {
        kardorim: "Kardorim, the Hollow King",
        drowned_sentinel: "The Drowned Sentinel",
        vulkas: "Vulkas, the Forge Tyrant",
        morvane: "Morvane, the Weeping Matriarch",
        aurelion: "Aurelion, the Last Cantor",
      };
      const BOSS_TAGLINES: Record<string, string> = {
        kardorim: "The Hollow King Rises",
        drowned_sentinel: "The Deep Stirs",
        vulkas: "The Forge Awakens",
        morvane: "The Catacombs Weep",
        aurelion: "The Last Hymn Begins",
      };
      bus.emit("bossIntro", {
        name: BOSS_TITLES[bossId ?? ""] ?? "???",
        tagline: BOSS_TAGLINES[bossId ?? ""] ?? "A Nameless Horror Stirs",
      });
      // cinematic: lock input, letterbox in, pan camera to the boss, roar, then release
      const boss = enemies.find((e) => e.isBoss) ?? enemies[0];
      this.cinematic = { t: 0, dur: 3.2, focus: { ...boss.pos } };
      combat.introHold = true; // block player actions + defer AI turns during the intro
      this.playSfx("bossRoar");
      window.setTimeout(() => {
        this.cinematic = null;
        if (this.combat === combat) combat.releaseIntro();
        this.renderer.addShake(8);
        this.pushHud();
      }, 3200);
    }
    this.pushHud();
  }

  private spreadPositions(center: Vec2, n: number): Vec2[] {
    const out: Vec2[] = [];
    const dirs = [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 },
    ];
    for (const d of dirs) {
      if (out.length >= n) break;
      const p = { x: center.x + d.x, y: center.y + d.y };
      if (p.x < 1 || p.y < 1 || p.x >= GRID - 1 || p.y >= GRID - 1) continue;
      if (this.isBlockedByProp(p) || eq(p, this.player.pos)) continue;
      out.push(p);
    }
    while (out.length < n) out.push({ x: center.x, y: Math.max(1, center.y - out.length) });
    return out;
  }

  /** Play a death animation + particles when any unit dies in combat. */
  private onUnitDeath(unit: Unit) {
    const bones = (unit.walkKey === "skel_melee" || unit.walkKey === "skel_archer" || unit.mobDef?.id.includes("skeleton")) ?? false;
    this.dying.push({ unit, pos: { ...unit.pos }, t: 0, bones });
    this.renderer.spawnDeathBits(unit.pos, bones, (unit.scale ?? 1) >= 1.25);
    this.renderer.addShake(unit.isBoss ? 8 : 3);
  }

  onCombatEnd(group: { id: string; defeated: boolean; mobIds: string[] }, victory: boolean, souls: number) {
    audio.combatEnd();
    if (victory) {
      group.defeated = true;
      this.save.stats.souls += souls;
      if (group.id === "__tutorial__") {
        // scripted first fight complete — never repeats, never pollutes clearedGroups
        this.save.tutorialDone = true;
        this.tutorialGroup = null;
        this.tutorialStep = -1;
        this.persist();
        bus.emit("toast", { msg: "† The ash accepts your first kill. Explore on — and rest at bonfires to recover." });
      } else {
        this.save.clearedGroups.push(`${this.save.currentPage}:${group.id}`);
      }
      // material drops — zone 2 and high-level mobs can carry ember ore
      const zone = this.page?.zone ?? 1;
      const zoneMat = zone === 3 ? "cinder_ore" : zone === 4 ? "grave_silk" : zone === 5 ? "storm_crystal" : "ember_ore";
      const r = Math.random();
      if (r < (zone >= 3 ? 0.16 : 0.1)) {
        this.save.inventory.push(zoneMat);
        bus.emit("toast", { msg: `${ITEMS[zoneMat].name} acquired. ${souls} souls claimed.` });
      } else if (r < 0.55) {
        const mat = Math.random() < (zone === 2 ? 0.4 : 0.6) ? "old_bone" : "iron_shard";
        this.save.inventory.push(mat);
        bus.emit("toast", { msg: `${ITEMS[mat].name} acquired. ${souls} souls claimed.` });
      } else {
        bus.emit("toast", { msg: `${souls} souls claimed.` });
      }
      if (group.mobIds.includes("grave_warden") && this.save.currentPage === "p4_0") {
        this.save.wardenDefeated = true;
        this.save.inventory.push("grave_scythe");
        bus.emit("toast", { msg: "The Grave Warden falls. Its scythe is yours. The crypt gate stands open." });
      }
      if (group.mobIds.includes("drowned_sentinel")) {
        this.save.sentinelDefeated = true;
        this.save.inventory.push("tide_ring");
        bus.emit("toast", { msg: "The Drowned Sentinel sinks at last. A tide-worn ring remains." });
      }
      if (group.mobIds.includes("vulkas")) {
        this.save.vulkasDefeated = true;
        this.save.inventory.push("vulkas_maul", "cinder_ore", "cinder_ore");
        bus.emit("toast", { msg: "Vulkas falls across his own anvil. The Foundry exhales at last — his maul is yours, and the fog over the Pale Marsh thins." });
      }
      if (group.mobIds.includes("morvane")) {
        this.save.morvaneDefeated = true;
        this.save.inventory.push("morvane_veil", "grave_silk", "grave_silk");
        bus.emit("toast", { msg: "Morvane's weeping stills. Her veil settles into your hands — and far north, the pass to the Shattered Peaks clears." });
      }
      if (group.mobIds.includes("aurelion")) {
        this.save.aurelionDefeated = true;
        this.save.inventory.push("cantor_twinblade", "choir_crown");
        bus.emit("toast", { msg: "† THE LAST HYMN ENDS — Aurelion kneels, and the torn sky begins to close. The Old Continent is quiet, and it is yours." });
      }
      if (group.mobIds.includes("kardorim")) {
        this.save.bossDefeated = true;
        this.save.hasAshenCrown = true;
        this.save.inventory.push("ashen_crown", "king_plate");
        this.mode = "victory";
        this.combat = null;
        this.persist();
        bus.emit("victory", {});
        this.pushHud();
        return;
      }
      this.mode = "explore";
      this.combat = null;
      bus.emit("combatEnd", { victory });
      this.persist();
      this.pushHud();
    } else {
      // death: drop souls here, respawn at bonfire
      const lost = this.save.stats.souls;
      if (lost > 0) {
        this.save.droppedSouls = { pageId: this.save.currentPage, pos: { ...this.player.pos }, amount: lost };
      }
      this.save.stats.souls = 0;
      this.persist();
      this.mode = "dead";
      this.combat = null;
      bus.emit("death", { lost });
      this.pushHud();
    }
  }

  respawn() {
    // dying during the scripted first fight re-arms it for the next explore step
    this.tutorialQueued = false;
    this.tutorialGroup = null;
    this.tutorialStep = -1;
    const bonfirePage = PAGES[this.save.lastBonfire];
    const pos = bonfirePage.bonfire ? { x: bonfirePage.bonfire.pos.x, y: bonfirePage.bonfire.pos.y + 1 } : { ...START_POS };
    this.player.dead = false;
    this.player.hp = this.player.hpMax;
    this.save.flasks = this.save.flasksMax;
    this.save.clearedGroups = [];
    this.loadPage(this.save.lastBonfire, pos);
    this.mode = "explore";
    bus.emit("zone", { name: bonfirePage.name });
    this.persist();
    this.pushHud();
    if (!this.save.tutorialDone) setTimeout(() => this.maybeStartTutorial(), 1200);
  }

  // ---------- NPC actions ----------
  levelUp(stat: "vitality" | "strength" | "intelligence" | "agility", cost: number): boolean {
    if (this.save.stats.souls < cost) return false;
    this.save.stats.souls -= cost;
    this.save.stats[stat]++;
    this.save.stats.level++;
    this.applyStats();
    if (stat === "vitality") this.player.hp = this.player.hpMax;
    this.persist();
    this.pushHud();
    return true;
  }

  upgradeWeapon(cost: { souls: number; bones: number; shards: number }): boolean {
    // expansion materials feed the forge too: grave silk counts as bone, cinder ore / storm crystal as shard
    const BONE_LIKE = ["old_bone", "grave_silk"];
    const SHARD_LIKE = ["iron_shard", "cinder_ore", "storm_crystal"];
    const bones = this.save.inventory.filter((i) => BONE_LIKE.includes(i)).length;
    const shards = this.save.inventory.filter((i) => SHARD_LIKE.includes(i)).length;
    if (this.save.stats.souls < cost.souls || bones < cost.bones || shards < cost.shards) return false;
    this.save.stats.souls -= cost.souls;
    const consume = (kinds: string[]) => {
      for (const k of kinds) {
        const idx = this.save.inventory.indexOf(k);
        if (idx >= 0) { this.save.inventory.splice(idx, 1); return; }
      }
    };
    for (let i = 0; i < cost.bones; i++) consume(BONE_LIKE);
    for (let i = 0; i < cost.shards; i++) consume(SHARD_LIKE);
    this.save.weaponLevel++;
    this.persist();
    this.pushHud();
    return true;
  }

  equip(itemId: string) {
    const item = ITEMS[itemId];
    if (!item) return;
    if (item.slot === "armor") this.save.equipment.armor = itemId;
    if (item.slot === "helmet") this.save.equipment.helmet = itemId;
    if (item.slot === "ring") this.save.equipment.ring = itemId;
    if (item.slot === "weapon") this.save.equipment.weapon = itemId;
    this.applyStats();
    this.persist();
    this.pushHud();
  }

  /** Dispatch a named one-shot SFX from the combat engine. */
  playSfx(name: string) {
    switch (name) {
      case "swordHit": audio.swordHit(); break;
      case "heavyHit": audio.heavyHit(); break;
      case "backstab": audio.backstab(); break;
      case "execution": audio.execution(); break;
      case "stagger": audio.stagger(); break;
      case "death": audio.death(); break;
      case "crash": audio.crash(); break;
      case "souls": audio.souls(); break;
      case "spellFire": audio.spellFire(); break;
      case "spellSoul": audio.spellSoul(); break;
      case "bowShot": audio.bowShot(); break;
      case "heal": audio.heal(); break;
      case "hurt": audio.hurt(); break;
      case "bossRoar": audio.bossRoar(); break;
      case "phaseSting": audio.phaseSting(); break;
      case "tutorialPing": audio.tutorialPing(); break;
      case "uiClick": audio.uiClick(); break;
      case "flask": audio.flask(); break;
      case "bonfireRest": audio.bonfireRest(); break;
    }
  }

  // ---------- animation ----------
  animateUnitMove(unit: Unit, path: Vec2[], done: () => void) {
    this.moveAnims.push({ unit, path: [unit.pos, ...path], seg: 0, t: 0, done });
  }

  animateAttack(unit: Unit, target: Vec2, done: () => void) {
    this.attackAnims.push({ unit, target, t: 0, done });
  }

  // ---------- demo autopilot (deterministic-ish for screenshots) ----------
  private runDemo(dt: number) {
    if (!this.demo) return;
    this.demoTimer += dt;
    if (this.mode === "explore" && this.demoTimer > 0.35) {
      this.demoTimer = 0;
      // walk east toward mobs
      if (this.save.currentPage === "p2_2") {
        this.exploreStep({ x: 1, y: 0 });
        if (this.player.pos.x >= GRID - 1) this.tryPageTransition({ x: GRID, y: this.player.pos.y });
      } else {
        // find nearest group and walk to it
        const g = this.pageMobGroups.find((g) => !g.defeated);
        if (g) {
          const dx = Math.sign(g.pos.x - this.player.pos.x);
          const dy = Math.sign(g.pos.y - this.player.pos.y);
          this.exploreStep(dx !== 0 ? { x: dx, y: 0 } : { x: 0, y: dy });
        }
      }
    } else if (this.mode === "combat" && this.combat?.isPlayerTurn && this.demoTimer > 1.0) {
      this.demoTimer = 0;
      const c = this.combat;
      const enemy = c.aliveEnemies()[0];
      if (!enemy) return;
      const dist = manhattan(this.player.pos, enemy.pos);
      if (dist <= 1 && this.player.ap >= 3) {
        c.castSpell(0, enemy.pos);
      } else if (this.player.mp > 0) {
        const cells = c.moveCells();
        let best = cells[0];
        let bd = Infinity;
        cells.forEach((cell) => {
          const d = manhattan(cell, enemy.pos);
          if (d < bd) { bd = d; best = cell; }
        });
        if (best && bd < dist) c.tryMove(best);
        else if (this.player.ap >= 3 && dist <= 6) c.castSpell(2, enemy.pos);
        else c.endTurn();
      } else if (this.player.ap >= 3 && dist <= 6) {
        c.castSpell(2, enemy.pos);
      } else {
        c.endTurn();
      }
    }
  }

  /** Ambient wandering: explore mob groups idle-step 1–2 tiles around their spawn. */
  private updateWander(dt: number) {
    if (this.mode !== "explore") return;
    const WANDER_SPEED = 1.6; // tiles per second — slow, ominous
    for (const g of this.pageMobGroups) {
      if (g.defeated) continue;
      let w = this.wander.get(g.id);
      if (!w) {
        w = { home: { ...g.pos }, target: null, timer: 1.5 + Math.random() * 3, dir: "sw", walkT: 0 };
        this.wander.set(g.id, w);
      }
      if (w.target) {
        // move toward target at constant speed
        const dx = w.target.x - g.pos.x;
        const dy = w.target.y - g.pos.y;
        const dist = Math.hypot(dx, dy);
        const step = WANDER_SPEED * dt;
        if (dist <= step) {
          g.pos = { x: w.target.x, y: w.target.y };
          w.target = null;
          w.timer = 2.5 + Math.random() * 3.5;
          w.walkT = 0;
        } else {
          g.pos = { x: g.pos.x + (dx / dist) * step, y: g.pos.y + (dy / dist) * step };
          w.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "se" : "nw") : dy > 0 ? "sw" : "ne";
          w.walkT += dt * 8;
        }
      } else {
        w.timer -= dt;
        if (w.timer <= 0) {
          // pick a free integer cell within 2 tiles of home (leash)
          for (let tries = 0; tries < 6; tries++) {
            const cand = {
              x: Math.round(w.home.x + (Math.floor(Math.random() * 5) - 2)),
              y: Math.round(w.home.y + (Math.floor(Math.random() * 5) - 2)),
            };
            if (
              cand.x >= 1 && cand.y >= 1 && cand.x < GRID - 1 && cand.y < GRID - 1 &&
              manhattan(cand, w.home) <= 2 &&
              manhattan(cand, { x: Math.round(g.pos.x), y: Math.round(g.pos.y) }) > 0 &&
              !this.exploreBlocked(cand) &&
              manhattan(cand, this.player.pos) > 3
            ) {
              w.target = cand;
              break;
            }
          }
          if (!w.target) w.timer = 2 + Math.random() * 2;
        }
      }
    }
  }

  // ---------- main loop ----------
  loop = (time: number) => {
    if (this.destroyed) return;
    const rawDt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    // hit-stop: freeze-frame impact feedback — animations crawl at 8% speed briefly.
    // FX/camera still use rawDt so the world never fully stalls.
    let dt = rawDt;
    if (this.hitStop > 0) {
      this.hitStop -= rawDt;
      dt = rawDt * 0.08;
    }

    // advance animations
    const unitOverride = new Map<number, Vec2>();
    // walk-cycle bookkeeping for the player
    const playerMove = this.moveAnims.find((a) => a.unit === this.player);
    this.walkMoving = !!playerMove;
    if (playerMove) {
      const from = playerMove.path[playerMove.seg];
      const to = playerMove.path[Math.min(playerMove.seg + 1, playerMove.path.length - 1)];
      this.setFacing(from, to);
      this.walkFrameT += dt * 10; // ~10 fps walk cycle
      // footstep dust puffs
      this.dustTimer += dt;
      if (this.dustTimer > 0.22) {
        this.dustTimer = 0;
        const s1 = this.renderer.screenOf(from);
        const s2 = this.renderer.screenOf(to);
        const t = Math.min(1, playerMove.t);
        this.renderer.addDust({ x: s1.x + (s2.x - s1.x) * t, y: s1.y + (s2.y - s1.y) * t });
      }
    }
    // per-unit (mob) walk-cycle bookkeeping
    this.unitWalk.clear();
    for (const a of this.moveAnims) {
      if (a.unit === this.player || !a.unit.walkKey || a.unit.walkKey === "hover") continue;
      const from = a.path[a.seg];
      const to = a.path[Math.min(a.seg + 1, a.path.length - 1)];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dir: WalkDir = dx > 0 ? "se" : dx < 0 ? "nw" : dy > 0 ? "sw" : "ne";
      // cadence per movement style: scuttlers churn fast, hoppers bound, fliers glide
      const cadence =
        a.unit.moveStyle === "scuttle" ? 16 : a.unit.moveStyle === "hop" ? 12 : a.unit.moveStyle === "fly" ? 13 : 10;
      const ft = (this.unitWalkT.get(a.unit.uid) ?? 0) + dt * cadence;
      this.unitWalkT.set(a.unit.uid, ft);
      this.unitWalk.set(a.unit.uid, {
        moving: true,
        dir,
        frame: Math.floor(ft) % WALK_FRAMES,
      });
      // heavy walkers kick up dust too
      if ((a.unit.scale ?? 1) >= 1.25 && Math.floor(ft * 2) % 3 === 0) {
        const s1 = this.renderer.screenOf(from);
        const s2 = this.renderer.screenOf(to);
        const t = Math.min(1, a.t);
        this.renderer.addDust({ x: s1.x + (s2.x - s1.x) * t, y: s1.y + (s2.y - s1.y) * t });
      }
    }
    this.moveAnims = this.moveAnims.filter((a) => {
      a.t += dt * (a.unit === this.player && this.mode === "explore" ? 5.2 : 6.5); // tiles per second
      // advance whole segments; path has (path.length - 1) segments total
      while (a.t >= 1 && a.seg < a.path.length - 1) {
        a.t -= 1;
        a.seg++;
      }
      if (a.seg >= a.path.length - 1) {
        // reached final node — finish outside the filter to avoid re-entrancy issues
        setTimeout(a.done, 0);
        if (a.unit === this.player) setTimeout(() => this.stepFromHeld(), 0);
        return false;
      }
      const from = a.path[a.seg];
      const to = a.path[a.seg + 1];
      const t = Math.min(1, a.t);
      const s1 = this.renderer.screenOf(from);
      const s2 = this.renderer.screenOf(to);
      unitOverride.set(a.unit.uid, { x: s1.x + (s2.x - s1.x) * t, y: s1.y + (s2.y - s1.y) * t });
      return true;
    });
    this.unitAttack.clear();
    this.attackAnims = this.attackAnims.filter((a) => {
      a.t += dt * 3.2;
      if (a.t >= 1) {
        a.done();
        return false;
      }
      // lunge toward target
      const p = Math.sin(Math.min(1, a.t) * Math.PI);
      const s1 = this.renderer.screenOf(a.unit.pos);
      const s2 = this.renderer.screenOf(a.target);
      unitOverride.set(a.unit.uid, {
        x: s1.x + (s2.x - s1.x) * 0.35 * p,
        y: s1.y + (s2.y - s1.y) * 0.35 * p,
      });
      // attack sheet playback (facing derived from grid delta toward the target)
      const dx = a.target.x - a.unit.pos.x;
      const dy = a.target.y - a.unit.pos.y;
      const dir: WalkDir =
        Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : dy >= 0 ? "sw" : "ne";
      this.unitAttack.set(a.unit.uid, { dir, t: Math.min(1, a.t) });
      if (a.unit.isPlayer) this.walkDir = dir;
      return true;
    });
    // advance death animations (corpses fade into ash/bone)
    this.dying = this.dying.filter((d) => {
      d.t += dt * 0.9;
      return d.t < 1;
    });

    this.updateWander(dt);
    this.runDemo(rawDt);
    // cinematic letterbox ramps in during the boss intro and back out after
    if (this.cinematic) {
      this.cinematic.t += rawDt;
      this.renderer.letterbox = Math.min(1, this.renderer.letterbox + rawDt * 3);
    } else {
      this.renderer.letterbox = Math.max(0, this.renderer.letterbox - rawDt * 2);
    }
    this.updateCameraTarget(unitOverride);
    this.renderer.updateCamera(rawDt);

    // bonfire crackle proximity (explore only; cheap distance check)
    if (this.mode === "explore" && this.page?.bonfire) {
      const d = manhattan(this.player.pos, this.page.bonfire.pos);
      audio.setBonfireProximity(Math.max(0, 1 - d / 6));
    } else {
      audio.setBonfireProximity(0);
    }

    // play-time accumulation (any active gameplay mode)
    if (this.mode === "explore" || this.mode === "combat") this.save.playTime += rawDt;

    // periodic autosave
    this.saveTimer += rawDt;
    if (this.saveTimer > 5 && this.mode === "explore") {
      this.saveTimer = 0;
      this.persist();
    }

    this.render(time, unitOverride);
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Follow-camera targeting: player-follow (closer on portrait) in explore, whole-grid framing in combat. */
  private updateCameraTarget(unitOverride: Map<number, Vec2>) {
    const r = this.renderer;
    const portrait = r.height > r.width * 1.1;
    // boss-intro cinematic: pan to the boss at a closer zoom, overriding normal framing
    if (this.cinematic) {
      const world = gridToScreen(this.cinematic.focus);
      r.setCameraFocus({ x: world.x, y: world.y - 40 }, portrait ? 1.15 : 1.0);
      return;
    }
    if (this.mode === "combat") {
      if (portrait && this.combat) {
        // portrait: the 15x15 grid can't fit a phone width at a readable zoom —
        // follow the active unit instead (tactics-game style), biased toward the player
        const act = this.combat.active;
        const focusUnit = act && !this.combat.over ? act : this.combat.player;
        const ov = focusUnit ? unitOverride.get(focusUnit.uid) : undefined;
        let world: Vec2;
        if (ov) {
          world = { x: ov.x - r.offsetX, y: ov.y - r.offsetY };
        } else if (focusUnit) {
          world = gridToScreen(focusUnit.pos);
        } else {
          world = r.gridCenterWorld();
        }
        r.setCameraFocus({ x: world.x, y: world.y - 20 }, 0.95);
      } else {
        r.setCameraFocus(r.gridCenterWorld(), r.fitGridZoom(70));
      }
      return;
    }
    if (this.mode === "menu") {
      r.setCameraFocus(r.gridCenterWorld(), 1);
      return;
    }
    // explore: follow the player's smooth screen position when walking, grid cell otherwise
    const ov = unitOverride.get(this.player.uid);
    let world: Vec2;
    if (ov) {
      // unitOverride stores screen coords; convert back to world (pre-offset) space
      world = { x: ov.x - r.offsetX, y: ov.y - r.offsetY };
    } else {
      world = gridToScreen(this.player.pos);
    }
    // bias the focus slightly downward so more of the map ahead is visible above the HUD
    const zoom = portrait ? 1.25 : 1.05;
    r.setCameraFocus({ x: world.x, y: world.y - 30 }, zoom);
  }

  render(time: number, unitOverride: Map<number, Vec2>) {
    const r = this.renderer;
    r.beginFrame();
    if (this.mode === "menu") {
      // menu handled by React overlay; draw dark bg
      r.ctx.fillStyle = "#0b0a08";
      r.ctx.fillRect(0, 0, r.width, r.height);
      r.drawFx(1 / 60, { ash: true });
      r.endFrame();
      return;
    }
    const page = this.page;
    r.drawGround(page, time);

    // highlights
    if (this.mode === "combat" && this.combat) {
      const c = this.combat;
      const spells = this.activeSpells;
      const intent = this.intentUid !== null ? c.intentCells(this.intentUid) : null;
      r.drawHighlights({
        moveCells: c.isPlayerTurn && this.selectedSpell < 0 ? c.moveCells() : [],
        rangeCells: c.isPlayerTurn && this.selectedSpell >= 0 ? c.spellRangeCells(this.selectedSpell) : [],
        aoeCells:
          c.isPlayerTurn && this.selectedSpell >= 0 && this.hoverCell && (spells[this.selectedSpell]?.aoe ?? 0) > 0
            ? this.aoePreview(this.hoverCell, spells[this.selectedSpell].aoe!)
            : [],
        telegraphs: c.telegraphs,
        fireTiles: c.fireTiles,
        intentMove: intent?.move,
        intentThreat: intent?.threat,
        hoverCell: this.hoverCell,
        time,
      });
    } else {
      r.drawHighlights({ hoverCell: this.hoverCell, time });
    }

    // entities
    const units = this.mode === "combat" && this.combat ? this.combat.units : [this.player];
    const doors: { pos: Vec2; label: string; locked: boolean }[] = [];
    if (page.dungeonEntrance) {
      doors.push({ pos: page.dungeonEntrance.pos, label: "CRYPT", locked: !this.save.wardenDefeated && !this.demo ? false : false });
    }
    if (page.dungeonNext) {
      doors.push({
        pos: page.dungeonNext.pos,
        label: "DOOR",
        locked: this.pageMobGroups.some((g) => !g.defeated),
      });
    }
    if (page.exitToOverworld) {
      doors.push({ pos: page.exitToOverworld.pos, label: "EXIT", locked: false });
    }
    // explore mode: draw mob groups as their first mob
    const exploreMobs: Unit[] = [];
    if (this.mode === "explore") {
      this.pageMobGroups.forEach((g) => {
        if (g.defeated) return;
        const lead = MOBS[g.mobIds[0]];
        const uid = 100000 + exploreMobs.length;
        const cell = { x: Math.round(g.pos.x), y: Math.round(g.pos.y) };
        const u: Unit = {
          ...makeUnit(g.mobIds[0], cell),
          uid,
          name: `${lead.name}${g.mobIds.length > 1 ? ` +${g.mobIds.length - 1}` : ""} (Lv ${lead.level})`,
        };
        // ambient wander: smooth screen-space position + walk animation while drifting
        const w = this.wander.get(g.id);
        if (w) {
          unitOverride.set(uid, this.renderer.screenOf(g.pos));
          if (w.target && u.walkKey && u.walkKey !== "hover") {
            // scale wander walk frames by style cadence (walkT accrues at 8/s in updateWander)
            const mult = u.moveStyle === "scuttle" ? 1.6 : u.moveStyle === "hop" ? 1.2 : u.moveStyle === "fly" ? 1.3 : 1;
            this.unitWalk.set(uid, { moving: true, dir: w.dir, frame: Math.floor(w.walkT * mult) % WALK_FRAMES });
          }
        }
        exploreMobs.push(u);
      });
    }
    r.drawEntities({
      units: [...units, ...exploreMobs],
      props: this.pageProps,
      bonfire: page.bonfire,
      npcs: page.npcs,
      doors,
      soulDrop:
        this.save.droppedSouls?.pageId === this.save.currentPage ? this.save.droppedSouls.pos : null,
      unitScreenOverride: unitOverride,
      activeUid: this.mode === "combat" ? this.combat?.active?.uid : this.player.uid,
      playerWalk: {
        moving: this.walkMoving,
        dir: this.walkDir,
        frame: Math.floor(this.walkFrameT) % WALK_FRAMES,
      },
      unitWalk: this.unitWalk,
      unitAttack: this.unitAttack,
      dying: this.dying,
      time,
    });

    // group labels in explore
    if (this.mode === "explore") {
      exploreMobs.forEach((m) => {
        const s = unitOverride.get(m.uid) ?? r.screenOf(m.pos);
        r.ctx.save();
        r.ctx.font = "600 10px 'Cinzel', serif";
        r.ctx.textAlign = "center";
        r.ctx.fillStyle = "rgba(214,205,187,0.75)";
        r.ctx.fillText(m.name, s.x, s.y - 66);
        r.ctx.restore();
      });
    }

    const ts = page.tileset;
    r.drawFx(1 / 60, {
      ash: ts === "ash",
      fog: ts === "crypt" || ts === "sunken",
    });
    r.endFrame();
  }

  private aoePreview(center: Vec2, radius: number): Vec2[] {
    const out: Vec2[] = [];
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if (manhattan({ x, y }, center) <= radius) out.push({ x, y });
    return out;
  }

  // ---------- HUD ----------
  pushHud() {
    const c = this.combat;
    const turnOrder: CombatUnitView[] =
      c?.order
        .filter((u) => !u.dead)
        .map((u) => ({
          uid: u.uid,
          name: u.name,
          isPlayer: u.isPlayer,
          isBoss: u.isBoss,
          hp: Math.max(0, Math.round(u.hp)),
          hpMax: u.hpMax,
          posture: u.posture,
          postureMax: u.postureMax,
          staggered: u.staggered > 0,
          dead: u.dead,
          level: u.level,
        })) ?? [];
    const boss = c?.units.find((u) => u.isBoss && !u.dead);
    this.updateInteractHint();
    const hud: HudState = {
      mode: this.mode,
      hp: Math.max(0, Math.round(this.player.hp)),
      hpMax: this.player.hpMax,
      ap: this.player.ap,
      apMax: this.player.apMax,
      mp: this.player.mp,
      mpMax: this.player.mpMax,
      souls: this.save.stats.souls,
      flasks: this.save.flasks,
      flasksMax: this.save.flasksMax,
      level: this.save.stats.level,
      zoneName: this.page?.name ?? "",
      inCombat: this.mode === "combat",
      isPlayerTurn: c?.isPlayerTurn ?? false,
      turnOrder,
      activeUid: c?.active?.uid ?? -1,
      selectedSpell: this.selectedSpell,
      boss: boss
        ? {
            uid: boss.uid, name: boss.name, isPlayer: false, isBoss: true,
            hp: Math.max(0, Math.round(boss.hp)), hpMax: boss.hpMax,
            posture: boss.posture, postureMax: boss.postureMax,
            staggered: boss.staggered > 0, dead: boss.dead, level: boss.level,
          }
        : null,
      weaponLevel: this.save.weaponLevel,
      canInteract: this.interactHint,
      spellIds: this.activeSpells.map((s) => s.id),
      helpVisible: this.helpVisible,
      menuOpen: this.menuOpen,
    };
    bus.emit("hud", hud);
  }
}
