/* Combat engine — turn-based tactical on the page grid.
 * Souls rules: backstab +50%, pushback collision dmg, posture/stagger + execution,
 * boss telegraphs + phase 2 fire tiles + summons. */
import type { Unit, Vec2, SpellDef, MobDef, Facing } from "../types";
import { MOBS, BOSS_IDS } from "../data/mobs";
import { PLAYER_SPELLS, EXECUTION_MULT, BACKSTAB_MULT, COLLISION_DMG } from "../data/spells";
import { manhattan, eq, bfsPath, reachable, hasLos } from "../engine/iso";
import { GRID } from "../data/world";
import type { FireTile, TelegraphTile } from "../engine/renderer";

export interface CombatCallbacks {
  onDamage: (pos: Vec2, text: string, color: string, big?: boolean) => void;
  onShake: (amt: number) => void;
  onUnitMoved: () => void;
  onLog: (msg: string) => void;
  onStateChange: () => void;
  onCombatEnd: (victory: boolean, soulsGained: number) => void;
  isBlockedByProp: (p: Vec2) => boolean;
  animateMove: (unit: Unit, path: Vec2[], done: () => void) => void;
  animateAttack: (from: Unit, to: Vec2, done: () => void) => void;
  onUnitDied?: (unit: Unit) => void;
  /** one-shot sound effect hook (engine stays audio-agnostic) */
  onSfx?: (name: string) => void;
  /** impact feedback hook — Game uses it for hit-stop */
  onImpact?: (kind: "hit" | "backstab" | "execution" | "cleave" | "crash") => void;
}

let UID = 1;

export function makeUnit(defId: string, pos: Vec2, isPlayer = false): Unit {
  const def: MobDef | undefined = MOBS[defId];
  if (!def && !isPlayer) throw new Error(`unknown mob ${defId}`);
  const d = def!;
  return {
    uid: UID++,
    defId,
    name: d?.name ?? "Ember-Bearer",
    isPlayer,
    isBoss: BOSS_IDS.has(defId),
    level: d?.level ?? 1,
    hp: d?.hp ?? 100,
    hpMax: d?.hp ?? 100,
    ap: d?.ap ?? 6,
    apMax: d?.ap ?? 6,
    mp: d?.mp ?? 3,
    mpMax: d?.mp ?? 3,
    initiative: d?.initiative ?? 50,
    pos: { ...pos },
    facing: "S",
    posture: 0,
    postureMax: d?.postureMax ?? 40,
    staggered: 0,
    poisoned: 0,
    webbed: 0,
    invisible: 0,
    buffedAp: 0,
    dead: false,
    sprite: d?.sprite ?? { url: "" },
    scale: d?.scale ?? 1,
    souls: d?.souls ?? 0,
    walkKey: d?.walkKey,
    attackKey: d?.attackKey,
    idleKey: d?.idleKey,
    moveStyle: d?.moveStyle,
    mobDef: d,
  };
}

export class Combat {
  units: Unit[] = [];
  order: Unit[] = [];
  turnIdx = 0;
  round = 1;
  fireTiles: FireTile[] = [];
  telegraphs: TelegraphTile[] = [];
  pendingBossAoe: Vec2[] | null = null;
  playerUsedWarcry = false;
  bossPhase2 = false;
  bossSummonCounter = 0;
  private novaCounter = 0;
  backstabStreak = 0;
  busy = false; // animation lock
  over = false;
  /** boss-intro hold: blocks player actions and defers the first AI turn until released */
  introHold = false;
  private heldAI: Unit | null = null;

  constructor(
    public player: Unit,
    enemies: Unit[],
    private cb: CombatCallbacks
  ) {
    this.units = [player, ...enemies];
    this.order = [...this.units].sort((a, b) => b.initiative - a.initiative);
    this.turnIdx = 0;
    this.startTurn();
  }

  get active(): Unit {
    return this.order[this.turnIdx];
  }

  get isPlayerTurn(): boolean {
    return this.active?.isPlayer === true && !this.busy && !this.over && !this.introHold;
  }

  /** release the boss-intro hold; if an AI turn was deferred, run it now */
  releaseIntro() {
    if (!this.introHold) return;
    this.introHold = false;
    if (this.heldAI) {
      const u = this.heldAI;
      this.heldAI = null;
      setTimeout(() => this.runAI(u), 350);
    }
  }

  /** Spells available to the player this fight (base + unlocked), set by Game. */
  playerSpells: SpellDef[] = PLAYER_SPELLS;

  aliveEnemies(): Unit[] {
    return this.units.filter((u) => !u.isPlayer && !u.dead);
  }

  blocked = (p: Vec2): boolean => {
    if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID) return true;
    if (this.cb.isBlockedByProp(p)) return true;
    return this.units.some((u) => !u.dead && eq(u.pos, p));
  };

  blockedForLos = (p: Vec2): boolean => {
    if (this.cb.isBlockedByProp(p)) return true;
    return false;
  };

  moveCells(): Vec2[] {
    const u = this.active;
    if (!u || !u.isPlayer) return [];
    return reachable(u.pos, u.mp, GRID, this.blocked);
  }

  /** Threat preview for an enemy: tiles it could reach plus tiles it could attack from there. */
  intentCells(uid: number): { move: Vec2[]; threat: Vec2[] } {
    const u = this.units.find((x) => x.uid === uid && !x.dead && !x.isPlayer);
    if (!u || !u.mobDef) return { move: [], threat: [] };
    const blockedNoSelf = (p: Vec2): boolean => {
      if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID) return true;
      if (this.cb.isBlockedByProp(p)) return true;
      return this.units.some((x) => !x.dead && x.uid !== u.uid && eq(x.pos, p));
    };
    const move = reachable(u.pos, u.mp, GRID, blockedNoSelf);
    const cells = [u.pos, ...move];
    const [mn, mx] = u.mobDef.range;
    const seen = new Set<string>();
    const threat: Vec2[] = [];
    for (const c of cells) {
      for (let dy = -mx; dy <= mx; dy++) {
        for (let dx = -mx; dx <= mx; dx++) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d < mn || d > mx) continue;
          const p = { x: c.x + dx, y: c.y + dy };
          if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID) continue;
          const k = `${p.x},${p.y}`;
          if (seen.has(k)) continue;
          seen.add(k);
          threat.push(p);
        }
      }
    }
    return { move, threat };
  }

  spellRangeCells(spellIdx: number): Vec2[] {
    const u = this.player;
    const spell = this.playerSpells[spellIdx];
    if (!spell) return [];
    const out: Vec2[] = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const p = { x, y };
        const d = manhattan(u.pos, p);
        if (d < spell.range[0] || d > spell.range[1]) continue;
        if (spell.needsLos && !hasLos(u.pos, p, this.blockedForLos)) continue;
        out.push(p);
      }
    }
    return out;
  }

  /** Player clicks a cell to move (explore-style pathing within MP). */
  tryMove(target: Vec2, done?: () => void) {
    const u = this.active;
    if (!this.isPlayerTurn || this.busy) return;
    const path = bfsPath(u.pos, target, GRID, this.blocked, u.mp);
    if (!path || path.length === 0 || path.length > u.mp) return;
    u.mp -= path.length;
    this.busy = true;
    this.cb.animateMove(u, path, () => {
      u.pos = { ...path[path.length - 1] };
      if (path.length >= 1) u.facing = faceOf(path.length > 1 ? path[path.length - 2] : u.pos, path[path.length - 1]);
      this.busy = false;
      this.cb.onStateChange();
      done?.();
    });
    this.cb.onStateChange();
  }

  castSpell(spellIdx: number, target: Vec2) {
    const u = this.player;
    if (!this.isPlayerTurn || this.busy) return;
    const spell = this.playerSpells[spellIdx];
    if (!spell || u.ap < spell.apCost) return;
    // Forgiving target pick: for single-target damage spells, clicking a tile
    // adjacent to an enemy (isometric sprites overhang their tile) snaps to that
    // enemy — and whiffing an empty tile costs nothing.
    const isGroundTargeted = !!spell.aoe || !!spell.leavesFire || !!spell.selfMove || spell.range[1] === 0;
    if (!isGroundTargeted) {
      const enemyAt = (p: Vec2) => this.units.find((t) => !t.dead && !t.isPlayer && eq(t.pos, p));
      let picked = enemyAt(target);
      if (!picked) {
        // snap to nearest living enemy within 1 tile of the click that is castable
        let best: Unit | undefined;
        let bestDist = Infinity;
        for (const t of this.units) {
          if (t.dead || t.isPlayer) continue;
          const clickDist = manhattan(t.pos, target);
          if (clickDist > 1) continue;
          const range = manhattan(u.pos, t.pos);
          if (range < spell.range[0] || range > spell.range[1]) continue;
          if (spell.needsLos && !hasLos(u.pos, t.pos, this.blockedForLos)) continue;
          if (clickDist < bestDist) { bestDist = clickDist; best = t; }
        }
        picked = best;
      }
      if (!picked) {
        this.cb.onLog("No foe there — the blow would find only ash.");
        return; // no AP spent on a whiff
      }
      target = { ...picked.pos };
    }
    const d = manhattan(u.pos, target);
    if (d < spell.range[0] || d > spell.range[1]) {
      this.cb.onLog(d > spell.range[1] ? "Out of reach." : "Too close.");
      return;
    }
    if (spell.needsLos && d > 0 && !hasLos(u.pos, target, this.blockedForLos)) {
      this.cb.onLog("No clear line to the target.");
      return;
    }

    if (spell.buffAp && spell.dmg[1] === 0) {
      // self-buff (warcry / ash veil): once per fight
      if (this.playerUsedWarcry) {
        this.cb.onLog("That power has already been spent this fight.");
        return;
      }
      u.ap -= spell.apCost;
      u.ap += spell.buffAp ?? 0;
      this.playerUsedWarcry = true;
      this.cb.onDamage(u.pos, `+${spell.buffAp} AP`, "#5a8a9c");
      this.cb.onStateChange();
      return;
    }

    if (spell.selfMove) {
      // dash to empty tile
      if (this.blocked(target)) return;
      u.ap -= spell.apCost;
      this.busy = true;
      this.cb.animateMove(u, [target], () => {
        u.pos = { ...target };
        this.busy = false;
        this.cb.onStateChange();
      });
      return;
    }

    u.ap -= spell.apCost;
    this.busy = true;
    this.cb.animateAttack(u, target, () => {
      const targets: Unit[] = [];
      if (spell.aoe && spell.aoe > 0) {
        this.units.forEach((t) => {
          if (!t.dead && manhattan(t.pos, target) <= spell.aoe!) targets.push(t);
        });
      } else {
        const t = this.units.find((t) => !t.dead && eq(t.pos, target));
        if (t) targets.push(t);
      }
      targets.forEach((t) => {
        if (t.isPlayer) return; // player AoE doesn't self-harm (mercy rule)
        this.dealDamage(u, t, spell);
      });
      // life-drain spells (spirit drain): mend the caster if anything was struck
      if (spell.heal && targets.some((t) => !t.isPlayer)) {
        const [hlo, hhi] = spell.heal;
        const amount = Math.round(hlo + Math.random() * (hhi - hlo));
        u.hp = Math.min(u.hpMax, u.hp + amount);
        this.cb.onDamage(u.pos, `+${amount}`, "#8adbb4");
        this.cb.onSfx?.("heal");
      }
      // pyre: scorch the ground
      if (spell.leavesFire) {
        const radius = spell.aoe ?? 0;
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const c = { x: target.x + dx, y: target.y + dy };
            if (c.x < 0 || c.y < 0 || c.x >= GRID || c.y >= GRID) continue;
            if (Math.abs(dx) + Math.abs(dy) > radius) continue;
            if (!this.fireTiles.some((f) => eq(f.pos, c))) this.fireTiles.push({ pos: c, turns: 2 });
          }
      }
      if (targets.length === 0 && !spell.leavesFire) this.cb.onLog("The blow finds only ash.");
      this.busy = false;
      this.checkEnd();
      this.cb.onStateChange();
    });
    this.cb.onStateChange();
  }

  private playerDmgMult(spell: SpellDef): number {
    // stats applied externally via strength/int; player attack values pre-adjusted in Game
    return spell.element === "physical" ? this.physMult : this.magMult;
  }
  physMult = 1;
  magMult = 1;
  weaponFlat = 0;

  dealDamage(attacker: Unit, target: Unit, spell: SpellDef) {
    if (target.dead) return;
    let [lo, hi] = spell.dmg;
    let dmg = lo + Math.random() * (hi - lo);
    if (attacker.isPlayer) {
      dmg *= this.playerDmgMult(spell);
      // weapon reinforcement applies to every damaging art — blade, staff, or bow
      dmg += this.weaponFlat;
    }

    // backstab
    const behind = behindOf(target);
    const isBackstab = eq(attacker.pos, behind) || (manhattan(attacker.pos, target.pos) === 1 && facingAway(attacker.pos, target));
    if (isBackstab && spell.range[1] === 1) {
      dmg *= BACKSTAB_MULT;
    }

    // execution vs staggered
    let executed = false;
    if (target.staggered > 0) {
      dmg *= EXECUTION_MULT;
      executed = true;
      target.staggered = 0;
      target.posture = 0;
    }

    // shieldbearer frontal block
    if (target.mobDef?.special === "shield_front" && !isBackstab && !executed) {
      dmg *= 0.35;
    }

    // resistances
    const def = target.mobDef;
    if (def) {
      if (spell.element === "physical" && def.resistPhys) dmg *= 1 - def.resistPhys;
      if (spell.element === "fire" && def.resistFire) dmg *= 1 - def.resistFire;
      if (spell.element === "soul" && def.resistSoul) dmg *= 1 - def.resistSoul;
    }

    dmg = Math.max(1, Math.round(dmg));
    target.hp -= dmg;

    // posture
    if (!executed) {
      let posture = spell.posture;
      // Kardorim backstab stagger mechanic: backstabs deal heavy posture
      if (target.isBoss && isBackstab) {
        posture += 30;
        this.backstabStreak++;
      }
      target.posture = Math.min(target.postureMax, target.posture + posture);
      if (target.posture >= target.postureMax && target.staggered === 0) {
        target.staggered = 1;
        this.cb.onDamage(target.pos, "STAGGERED", "#e8d44b");
        this.cb.onLog(`${target.name} is staggered! Strike now for an execution.`);
        this.cb.onSfx?.("stagger");
      }
    }

    const col = executed ? "#e8d44b" : isBackstab ? "#e8823c" : spell.element === "soul" ? "#5a8a9c" : spell.element === "fire" ? "#e86a3c" : "#d6cdbb";
    this.cb.onDamage(target.pos, `${executed ? "✦ " : ""}${dmg}`, col, executed || isBackstab);
    this.cb.onShake(executed ? 10 : isBackstab ? 7 : 4);
    this.cb.onImpact?.(executed ? "execution" : isBackstab ? "backstab" : "hit");
    this.cb.onSfx?.(
      executed ? "execution" : isBackstab ? "backstab" : spell.element === "fire" ? "spellFire" : spell.element === "soul" ? "spellSoul" : dmg >= 20 ? "heavyHit" : "swordHit"
    );
    if (isBackstab && !executed) this.cb.onDamage({ x: target.pos.x, y: target.pos.y - 1 }, "BACKSTAB", "#e8823c");

    // push / pull
    if (spell.push && !target.dead) this.pushUnit(attacker.pos, target, spell.push);

    if (target.hp <= 0) this.killUnit(target, attacker);
  }

  pushUnit(from: Vec2, target: Unit, tiles: number) {
    const dx = Math.sign(target.pos.x - from.x);
    const dy = Math.sign(target.pos.y - from.y);
    const dir = Math.abs(target.pos.x - from.x) >= Math.abs(target.pos.y - from.y) ? { x: dx || 1, y: 0 } : { x: 0, y: dy || 1 };
    for (let i = 0; i < tiles; i++) {
      const np = { x: target.pos.x + dir.x, y: target.pos.y + dir.y };
      if (np.x < 0 || np.y < 0 || np.x >= GRID || np.y >= GRID || this.blocked(np)) {
        // collision!
        const cdmg = COLLISION_DMG + Math.floor(Math.random() * 6);
        target.hp -= cdmg;
        this.cb.onDamage(target.pos, `${cdmg} CRASH`, "#e8823c");
        this.cb.onShake(6);
        this.cb.onImpact?.("crash");
        this.cb.onSfx?.("crash");
        if (target.hp <= 0) this.killUnit(target, this.player);
        return;
      }
      target.pos = np;
    }
  }

  killUnit(u: Unit, killer: Unit) {
    if (u.dead) return;
    // skeleton novice revive
    if (u.mobDef?.special === "revive" && !u.revived && u.staggered === 0) {
      u.revived = true;
      u.hp = Math.max(1, Math.floor(u.hpMax * 0.15));
      u.posture = Math.floor(u.postureMax * 0.7);
      this.cb.onDamage(u.pos, "THE BONES RISE", "#d6cdbb");
      this.cb.onLog(`${u.name} refuses death — stagger it before the killing blow.`);
      return;
    }
    u.dead = true;
    this.cb.onUnitDied?.(u);
    this.cb.onSfx?.("death");
    // explode on death
    if (u.mobDef?.special === "explode_death") {
      this.units.forEach((t) => {
        if (t.dead || t.uid === u.uid) return;
        if (manhattan(t.pos, u.pos) <= 1) {
          const dmg = 12 + Math.floor(Math.random() * 8);
          t.hp -= dmg;
          this.cb.onDamage(t.pos, `${dmg} BURN`, "#e86a3c");
          if (t.hp <= 0 && !t.isPlayer) this.killUnit(t, u);
          if (t.isPlayer && t.hp <= 0) this.playerDied();
        }
      });
      this.cb.onShake(8);
    }
    if (!u.isPlayer && killer.isPlayer) {
      this.cb.onDamage(u.pos, `+${u.souls} SOULS`, "#8adbb4");
      this.cb.onSfx?.("souls");
    }
    if (u.isPlayer) this.playerDied();
  }

  playerDied() {
    if (this.over) return;
    this.player.dead = true;
    this.over = true;
    this.cb.onCombatEnd(false, 0);
  }

  checkEnd() {
    if (this.over) return;
    if (this.player.hp <= 0 || this.player.dead) {
      this.playerDied();
      return;
    }
    if (this.aliveEnemies().length === 0) {
      this.over = true;
      const souls = this.units.filter((u) => !u.isPlayer && u.dead).reduce((s, u) => s + u.souls, 0);
      this.cb.onCombatEnd(true, souls);
    }
  }

  useFlask(): boolean {
    if (!this.isPlayerTurn) return false;
    return true; // actual flask logic in Game
  }

  endTurn() {
    if (this.busy || this.over) return;
    const u = this.active;
    // end-of-turn effects
    if (u.poisoned > 0) {
      const dmg = 4 + Math.floor(Math.random() * 4);
      u.hp -= dmg;
      this.cb.onDamage(u.pos, `${dmg} POISON`, "#6aa84f");
      u.poisoned--;
      if (u.hp <= 0) {
        this.killUnit(u, u);
        this.checkEnd();
        if (this.over) return;
      }
    }
    if (u.staggered > 0) u.staggered--;
    if (u.invisible > 0) u.invisible--;

    this.turnIdx = (this.turnIdx + 1) % this.order.length;
    // skip dead
    let guard = 0;
    while (this.order[this.turnIdx].dead && guard++ < 30) {
      this.turnIdx = (this.turnIdx + 1) % this.order.length;
    }
    if (this.turnIdx === 0) this.round++;
    this.startTurn();
  }

  startTurn() {
    const u = this.active;
    if (!u || this.over) return;
    u.ap = u.apMax + u.buffedAp;
    u.buffedAp = 0;
    u.mp = u.webbed > 0 ? Math.max(0, u.mpMax - 2) : u.mpMax;
    if (u.webbed > 0) u.webbed--;

    // fire tiles damage anyone standing on them at their turn start
    const onFire = this.fireTiles.find((f) => eq(f.pos, u.pos));
    if (onFire) {
      const dmg = 10 + Math.floor(Math.random() * 6);
      u.hp -= dmg;
      this.cb.onDamage(u.pos, `${dmg} FIRE`, "#e86a3c");
      if (u.hp <= 0) {
        this.killUnit(u, u);
        this.checkEnd();
        if (this.over) return;
        this.endTurn();
        return;
      }
    }

    this.cb.onStateChange();
    if (!u.isPlayer) {
      if (this.introHold) {
        // boss intro cinematic playing — defer this AI turn until release
        this.heldAI = u;
        return;
      }
      // AI turn with a slight delay for readability
      setTimeout(() => this.runAI(u), 450);
    }
  }

  /** resolve boss telegraphed AoE at start of boss turn */
  private resolveBossTelegraph(boss: Unit) {
    if (!this.pendingBossAoe) return;
    const cells = this.pendingBossAoe;
    this.pendingBossAoe = null;
    this.telegraphs = [];
    cells.forEach((c) => {
      const t = this.units.find((x) => !x.dead && eq(x.pos, c));
      if (t && !eq(t.pos, boss.pos)) {
        const dmg = 26 + Math.floor(Math.random() * 10);
        t.hp -= dmg;
        this.cb.onDamage(t.pos, `${dmg} CLEAVE`, "#e05038");
        this.cb.onImpact?.("cleave");
        this.cb.onSfx?.("heavyHit");
        if (t.isPlayer && t.hp <= 0) this.playerDied();
      }
      // phase 2 leaves fire
      if (this.bossPhase2 && Math.random() < 0.5) {
        this.fireTiles.push({ pos: { ...c }, turns: 3 });
      }
    });
    this.cb.onShake(12);
  }

  private runAI(u: Unit) {
    if (this.introHold) {
      // boss intro cinematic still playing — park this turn until release
      this.heldAI = u;
      return;
    }
    if (this.over || u.dead) {
      this.checkEnd();
      return;
    }
    const done = () => {
      this.checkEnd();
      if (!this.over) this.endTurn();
    };

    const def = u.mobDef!;
    const player = this.player;

    // ---- BOSS AI ----
    if (u.isBoss) {
      this.resolveBossTelegraph(u);
      if (this.over) return;
      // phase transition
      if (!this.bossPhase2 && u.hp <= u.hpMax * 0.5) {
        this.bossPhase2 = true;
        this.cb.onLog(
          def.id === "kardorim"
            ? "Kardorim ignites his blade with dark fire. The ground will burn."
            : `${u.name} draws on the deep — its fury redoubles.`
        );
        this.cb.onDamage(u.pos, "PHASE II", "#e86a3c", true);
        this.cb.onShake(14);
        this.cb.onSfx?.("phaseSting");
      }
      // phase 2: every 2nd boss round, telegraph a SOUL NOVA ring (radius 1-2 around boss)
      if (this.bossPhase2 && !this.pendingBossAoe) {
        this.novaCounter++;
        if (this.novaCounter >= 2) {
          this.novaCounter = 0;
          const ring: Vec2[] = [];
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const r = Math.abs(dx) + Math.abs(dy);
              if (r < 1 || r > 2) continue;
              const c = { x: u.pos.x + dx, y: u.pos.y + dy };
              if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID) ring.push(c);
            }
          if (ring.length > 0) {
            this.pendingBossAoe = ring;
            this.telegraphs = ring.map((c) => ({ pos: c }));
            this.cb.onLog(`${u.name} gathers soulfire — a nova will scour the marked ring!`);
          }
        }
      }
      // summon adds every 3 rounds in phase 2
      if (this.bossPhase2) {
        this.bossSummonCounter++;
        if (this.bossSummonCounter >= 3 && this.aliveEnemies().length < 4) {
          this.bossSummonCounter = 0;
          const SUMMONS: Record<string, { id: string; label: string }> = {
            kardorim: { id: "ash_spirit", label: "ASH SPIRIT RISES" },
            drowned_sentinel: { id: "drowned_soldier", label: "THE DROWNED ANSWER" },
            vulkas: { id: "cinder_hound", label: "CINDER HOUNDS UNLEASHED" },
            morvane: { id: "marsh_ghoul", label: "THE TOMBS OPEN" },
            aurelion: { id: "hollow_cantor", label: "THE CHOIR ANSWERS" },
          };
          const s = SUMMONS[u.defId] ?? SUMMONS.kardorim;
          for (let i = 0; i < 2; i++) {
            const spot = this.findFreeNear(u.pos, 3);
            if (spot) {
              const spirit = makeUnit(s.id, spot);
              this.units.push(spirit);
              this.order.push(spirit);
              this.cb.onDamage(spot, s.label, "#5a8a9c");
            }
          }
        }
      }
      // decay fire tiles
      this.fireTiles = this.fireTiles.map((f) => ({ ...f, turns: f.turns - 0 })); // decay handled below per boss round
      // move toward player then telegraph 3x3 cleave if close, else attack
      this.aiApproach(u, player, () => {
        const dist = manhattan(u.pos, player.pos);
        if (dist <= 2) {
          // telegraph a 3x3 around the player's current position
          const cells: Vec2[] = [];
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const c = { x: player.pos.x + dx, y: player.pos.y + dy };
              if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID) cells.push(c);
            }
          this.pendingBossAoe = cells;
          this.telegraphs = cells.map((c) => ({ pos: c }));
          this.cb.onLog(`${u.name} winds up a devastating blow — MOVE from the marked ground!`);
          done();
        } else if (dist <= (def.range?.[1] ?? 2)) {
          this.aiAttack(u, player, done);
        } else {
          done();
        }
      });
      // fire tile decay each boss turn
      this.fireTiles = this.fireTiles
        .map((f) => ({ pos: f.pos, turns: f.turns - 1 }))
        .filter((f) => f.turns > 0);
      return;
    }

    // ---- archetype: BERSERKER (hounds/fish) — frenzy below 50% HP: +2 MP, announced once ----
    if ((def.id === "rotting_hound" || def.id === "corpse_fish") && !u.frenzied && u.hp <= u.hpMax * 0.5) {
      u.frenzied = true;
      this.cb.onDamage(u.pos, "FRENZY", "#e05038");
      this.cb.onLog(`${u.name} froths with rotten fury — it moves faster now.`);
    }
    if (u.frenzied) u.mp = u.mpMax + 2;

    // ---- archetype: HEALER (tide priest) — mend the most wounded ally in 5 tiles ----
    if (def.id === "tide_priest") {
      const wounded = this.aliveEnemies()
        .filter((a) => a.uid !== u.uid && a.hp < a.hpMax * 0.7 && manhattan(a.pos, u.pos) <= 5)
        .sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
      if (wounded && Math.random() < 0.75) {
        this.cb.animateAttack(u, wounded.pos, () => {
          const heal = 18 + Math.floor(Math.random() * 8);
          wounded.hp = Math.min(wounded.hpMax, wounded.hp + heal);
          this.cb.onDamage(wounded.pos, `+${heal}`, "#8adbb4");
          this.cb.onSfx?.("heal");
          this.cb.onLog(`${u.name} chants a drowned litany — ${wounded.name} is mended.`);
          this.checkEnd();
          if (!this.over) this.endTurn();
        });
        return;
      }
    }

    // ---- archetype: DEFENDER (shieldbearer/crab) — brace when player is far: recover posture, stay put ----
    if (def.special === "shield_front" && manhattan(u.pos, player.pos) > u.mp + 1) {
      u.posture = Math.max(0, u.posture - 12);
      this.cb.onDamage(u.pos, "BRACES", "#9a9488");
      done();
      return;
    }

    // ---- archetype: KITER (ranged units) — retreat from adjacent player before shooting ----
    if (def.range[0] >= 2 && manhattan(u.pos, player.pos) <= 1) {
      const cells = reachable(u.pos, u.mp, GRID, this.blocked);
      let best: Vec2 | null = null;
      let bestScore = -Infinity;
      for (const c of cells) {
        const d = manhattan(c, player.pos);
        if (d < def.range[0] || d > def.range[1]) continue;
        if (!hasLos(c, player.pos, this.blockedForLos)) continue;
        if (d > bestScore) {
          bestScore = d;
          best = c;
        }
      }
      if (best) {
        const path = bfsPath(u.pos, best, GRID, this.blocked, u.mp);
        if (path && path.length > 0) {
          this.cb.onLog(`${u.name} slips away from your blade.`);
          this.cb.animateMove(u, path, () => {
            u.pos = { ...path[path.length - 1] };
            u.facing = faceOf(path.length > 1 ? path[path.length - 2] : u.pos, path[path.length - 1]);
            const d = manhattan(u.pos, player.pos);
            if (d >= def.range[0] && d <= def.range[1] && hasLos(u.pos, player.pos, this.blockedForLos)) {
              this.aiAttack(u, player, done);
            } else done();
          });
          return;
        }
      }
    }

    // ---- special: sergeant buffs allies ----
    if (def.special === "buff_allies") {
      const allies = this.aliveEnemies().filter((a) => a.uid !== u.uid && manhattan(a.pos, u.pos) <= 4);
      if (allies.length > 0 && Math.random() < 0.6) {
        allies.forEach((a) => {
          a.buffedAp = 2;
        });
        this.cb.onDamage(u.pos, "RALLY", "#c8a24b");
        this.aiApproach(u, player, () => {
          if (manhattan(u.pos, player.pos) <= def.range[1]) this.aiAttack(u, player, done);
          else done();
        });
        return;
      }
    }

    // ---- special: assassin goes invisible when far ----
    if (def.special === "invisible" && manhattan(u.pos, player.pos) > 3 && u.invisible === 0 && Math.random() < 0.5) {
      u.invisible = 2;
      this.cb.onDamage(u.pos, "VANISHES", "#9a9488");
    }

    // ---- special: toad pulls player ----
    if (def.special === "pull") {
      const dist = manhattan(u.pos, player.pos);
      if (dist >= 2 && dist <= 4 && hasLos(u.pos, player.pos, this.blockedForLos)) {
        // pull player adjacent
        const dir = {
          x: Math.sign(u.pos.x - player.pos.x),
          y: Math.sign(u.pos.y - player.pos.y),
        };
        const steps = dist - 1;
        for (let i = 0; i < steps; i++) {
          const np = {
            x: player.pos.x + (dir.x !== 0 ? dir.x : 0),
            y: player.pos.y + (dir.x === 0 ? dir.y : 0),
          };
          if (this.blocked(np)) break;
          player.pos = np;
        }
        this.cb.onDamage(player.pos, "DRAGGED", "#6aa84f");
        this.cb.onShake(5);
        this.aiAttack(u, player, done);
        return;
      }
    }

    // ---- special: boar charge ----
    if (def.special === "push_charge") {
      // if aligned with player in straight line with clear path → charge
      const aligned = u.pos.x === player.pos.x || u.pos.y === player.pos.y;
      const dist = manhattan(u.pos, player.pos);
      if (aligned && dist <= 6 && dist >= 2) {
        // move to adjacent then push
        this.aiApproach(u, player, () => {
          if (manhattan(u.pos, player.pos) <= 1) {
            const spell: SpellDef = {
              id: "charge", name: "Charge", icon: 0, apCost: 0, range: [1, 1], needsLos: true,
              dmg: def.dmg, element: "physical", posture: 15, push: 2, desc: "",
            };
            this.cb.animateAttack(u, player.pos, () => {
              this.dealDamage(u, player, spell);
              this.checkEnd();
              if (!this.over) this.endTurn();
            });
          } else done();
        });
        return;
      }
    }

    // ---- special: mage AoE from range ----
    if (def.special === "aoe_mage") {
      const dist = manhattan(u.pos, player.pos);
      if (dist >= 2 && dist <= 6 && hasLos(u.pos, player.pos, this.blockedForLos)) {
        this.cb.animateAttack(u, player.pos, () => {
          this.units.forEach((t) => {
            if (t.dead || !t.isPlayer) return;
            if (manhattan(t.pos, player.pos) <= 1) {
              const spell: SpellDef = {
                id: "soulscour", name: "Soul Scour", icon: 2, apCost: 0, range: [2, 6], needsLos: true,
                dmg: def.dmg, element: "soul", posture: 8, desc: "",
              };
              this.dealDamage(u, t, spell);
            }
          });
          this.checkEnd();
          if (!this.over) this.endTurn();
        });
        return;
      }
    }

    // default AI: approach and attack
    this.aiApproach(u, player, () => {
      const dist = manhattan(u.pos, player.pos);
      const [mn, mx] = def.range;
      if (dist >= mn && dist <= mx && (!def.range || hasLos(u.pos, player.pos, this.blockedForLos) || mx === 1)) {
        this.aiAttack(u, player, done);
      } else {
        done();
      }
    });
  }

  private aiApproach(u: Unit, target: Unit, then: () => void) {
    const def = u.mobDef!;
    const [mn, mx] = def.range;
    const dist = manhattan(u.pos, target.pos);
    // ranged units try to keep distance
    if (dist >= mn && dist <= mx && hasLos(u.pos, target.pos, this.blockedForLos)) {
      then();
      return;
    }
    // find best cell within MP that gets into attack range (or closer)
    const cells = reachable(u.pos, u.mp, GRID, this.blocked);
    let best: Vec2 | null = null;
    let bestScore = Infinity;
    for (const c of cells) {
      const d = manhattan(c, target.pos);
      let score: number;
      if (d >= mn && d <= mx && hasLos(c, target.pos, this.blockedForLos)) {
        score = -100 + d * (mx > 1 ? -1 : 1); // in range is great; ranged prefer farther
      } else {
        score = Math.abs(d - mx); // get closer to range
      }
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best || eq(best, u.pos)) {
      then();
      return;
    }
    const path = bfsPath(u.pos, best, GRID, this.blocked, u.mp);
    if (!path || path.length === 0) {
      then();
      return;
    }
    this.cb.animateMove(u, path, () => {
      u.pos = { ...path[path.length - 1] };
      if (path.length >= 1) u.facing = faceOf(path.length > 1 ? path[path.length - 2] : u.pos, path[path.length - 1]);
      then();
    });
  }

  private aiAttack(u: Unit, target: Unit, then: () => void) {
    const def = u.mobDef!;
    this.cb.animateAttack(u, target.pos, () => {
      const spell: SpellDef = {
        id: "mobatk", name: def.name, icon: 0, apCost: 0, range: def.range, needsLos: true,
        dmg: def.dmg, element: def.element, posture: 10, desc: "",
      };
      this.dealDamage(u, target, spell);
      // specials on hit
      if (def.special === "poison" && target.isPlayer && !target.dead) {
        target.poisoned = Math.max(target.poisoned, 2);
        this.cb.onDamage(target.pos, "POISONED", "#6aa84f");
      }
      if (def.special === "steal_ap" && target.isPlayer) {
        target.apMax = Math.max(3, target.apMax); // AP theft handled as temp: reduce current next turn via buffedAp negative
        target.buffedAp = Math.min(target.buffedAp, -1);
        this.cb.onDamage(target.pos, "-1 AP", "#5a8a9c");
      }
      if (def.special === "web_mp" && target.isPlayer) {
        target.webbed = Math.max(target.webbed, 2);
        this.cb.onDamage(target.pos, "WEBBED", "#cccccc");
      }
      if (def.special === "invisible") u.invisible = 0;
      then();
    });
  }

  private findFreeNear(pos: Vec2, radius: number): Vec2 | null {
    for (let r = 1; r <= radius; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const p = { x: pos.x + dx, y: pos.y + dy };
          if (p.x < 0 || p.y < 0 || p.x >= GRID || p.y >= GRID) continue;
          if (!this.blocked(p)) return p;
        }
      }
    }
    return null;
  }
}

function faceOf(from: Vec2, to: Vec2): Facing {
  if (to.x > from.x) return "E";
  if (to.x < from.x) return "W";
  if (to.y > from.y) return "S";
  return "N";
}

/** the tile directly behind a unit given its facing */
export function behindOf(u: Unit): Vec2 {
  switch (u.facing) {
    case "N": return { x: u.pos.x, y: u.pos.y + 1 };
    case "S": return { x: u.pos.x, y: u.pos.y - 1 };
    case "E": return { x: u.pos.x - 1, y: u.pos.y };
    case "W": return { x: u.pos.x + 1, y: u.pos.y };
  }
}

function facingAway(attackerPos: Vec2, target: Unit): boolean {
  // target facing away = attacker is in the half-plane behind target facing
  switch (target.facing) {
    case "N": return attackerPos.y > target.pos.y;
    case "S": return attackerPos.y < target.pos.y;
    case "E": return attackerPos.x < target.pos.x;
    case "W": return attackerPos.x > target.pos.x;
  }
}
