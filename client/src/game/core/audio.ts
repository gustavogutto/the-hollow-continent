/* Ashen Gothic audio — fully procedural Web Audio. No files, no deps.
 * Layers: ambient drone + wind, bonfire crackle (proximity), combat pulse (boss variant).
 * One-shot SFX are synthesized on demand. Master mute persists in localStorage.
 * Every public call is guarded: if AudioContext is unavailable or suspended
 * (autoplay policy, headless screenshots), everything silently no-ops. */

const MUTE_KEY = "hollow_audio_muted";

type Layer = {
  nodes: AudioNode[];
  gain: GainNode;
  timers: number[];
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: Layer | null = null;
  private crackle: Layer | null = null;
  private combatLayer: Layer | null = null;
  private crackleGain = 0;
  private unlocked = false;
  muted = false;

  constructor() {
    try {
      this.muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      this.muted = false;
    }
  }

  /** Call from any user-gesture handler; creates/resumes the context lazily. */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      if (this.ctx.state === "running" && !this.unlocked) {
        this.unlocked = true;
        this.pendingAmbient && this.startAmbient();
      }
    } catch {
      /* audio unavailable — stay silent */
    }
  }

  private pendingAmbient = false;

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch { /* ignore */ }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ready(): boolean {
    return !!(this.ctx && this.master && this.ctx.state === "running");
  }

  private noiseBuffer(seconds = 1): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  private killLayer(l: Layer | null, fade = 0.6) {
    if (!l || !this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      l.gain.gain.setTargetAtTime(0, t, fade / 3);
    } catch { /* ignore */ }
    l.timers.forEach((id) => window.clearTimeout(id));
    window.setTimeout(() => {
      l.nodes.forEach((n) => {
        try {
          (n as OscillatorNode).stop?.();
        } catch { /* ignore */ }
        try {
          n.disconnect();
        } catch { /* ignore */ }
      });
      try {
        l.gain.disconnect();
      } catch { /* ignore */ }
    }, fade * 1000 + 100);
  }

  // ---------- ambient drone + wind ----------
  startAmbient() {
    if (!this.ready()) {
      this.pendingAmbient = true;
      return;
    }
    this.pendingAmbient = false;
    if (this.ambient) return;
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master!);
    gain.gain.setTargetAtTime(0.16, ctx.currentTime, 1.5);

    const nodes: AudioNode[] = [];
    // two detuned low oscillators through a lowpass
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    lp.connect(gain);
    for (const f of [55, 57.3]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      o.connect(g).connect(lp);
      o.start();
      nodes.push(o, g);
    }
    // slow swell LFO on the drone
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.06;
    lfo.connect(lfoG).connect(gain.gain);
    lfo.start();
    nodes.push(lfo, lfoG);
    // wind: looping noise through a wandering bandpass
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(2);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 400;
    bp.Q.value = 0.6;
    const wg = ctx.createGain();
    wg.gain.value = 0.28;
    src.connect(bp).connect(wg).connect(gain);
    src.start();
    nodes.push(src, bp, wg);
    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.05;
    const windLfoG = ctx.createGain();
    windLfoG.gain.value = 250;
    windLfo.connect(windLfoG).connect(bp.frequency);
    windLfo.start();
    nodes.push(windLfo, windLfoG);

    this.ambient = { nodes, gain, timers: [] };
  }

  stopAmbient() {
    this.pendingAmbient = false;
    this.killLayer(this.ambient, 1.2);
    this.ambient = null;
  }

  // ---------- bonfire crackle (proximity 0..1) ----------
  setBonfireProximity(p: number) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    if (p > 0.02 && !this.crackle) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.master!);
      const layer: Layer = { nodes: [], gain, timers: [] };
      const scheduleCrackle = () => {
        if (!this.crackle || this.crackle !== layer) return;
        // short filtered noise burst = one crackle pop
        try {
          const src = ctx.createBufferSource();
          src.buffer = this.noiseBuffer(0.06);
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = 1400 + Math.random() * 2600;
          bp.Q.value = 2.5;
          const g = ctx.createGain();
          const t = ctx.currentTime;
          g.gain.setValueAtTime(0.5 + Math.random() * 0.5, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + Math.random() * 0.06);
          src.connect(bp).connect(g).connect(gain);
          src.start();
          src.stop(t + 0.15);
        } catch { /* ignore */ }
        layer.timers.push(window.setTimeout(scheduleCrackle, 40 + Math.random() * 220));
      };
      // soft fire bed under the pops
      const bed = ctx.createBufferSource();
      bed.buffer = this.noiseBuffer(1.5);
      bed.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const bg = ctx.createGain();
      bg.gain.value = 0.15;
      bed.connect(lp).connect(bg).connect(gain);
      bed.start();
      layer.nodes.push(bed, lp, bg);
      this.crackle = layer;
      scheduleCrackle();
    }
    if (this.crackle) {
      const target = Math.max(0, Math.min(1, p)) * 0.4;
      if (Math.abs(target - this.crackleGain) > 0.01) {
        this.crackleGain = target;
        this.crackle.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
      }
      if (p <= 0.02) {
        this.killLayer(this.crackle, 0.5);
        this.crackle = null;
        this.crackleGain = 0;
      }
    }
  }

  // ---------- combat layer ----------
  combatStart(boss = false) {
    if (!this.ready()) return;
    if (this.combatLayer) return;
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master!);
    gain.gain.setTargetAtTime(boss ? 0.14 : 0.1, ctx.currentTime, 0.8);
    const nodes: AudioNode[] = [];
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = boss ? 320 : 420;
    lp.connect(gain);
    const freqs = boss ? [36.7, 55, 73.4] : [55, 82.4];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.3;
      o.connect(g).connect(lp);
      o.start();
      nodes.push(o, g);
    }
    // slow tremolo — a heartbeat under the fight
    const trem = ctx.createOscillator();
    trem.frequency.value = boss ? 1.1 : 0.8;
    const tremG = ctx.createGain();
    tremG.gain.value = 0.05;
    trem.connect(tremG).connect(gain.gain);
    trem.start();
    nodes.push(trem, tremG);
    this.combatLayer = { nodes, gain, timers: [] };
  }

  combatEnd() {
    this.killLayer(this.combatLayer, 1.0);
    this.combatLayer = null;
  }

  stopAll() {
    this.stopAmbient();
    this.combatEnd();
    if (this.crackle) {
      this.killLayer(this.crackle, 0.3);
      this.crackle = null;
      this.crackleGain = 0;
    }
  }

  // ---------- one-shot SFX ----------
  private env(peak: number, dur: number, curve = 0.001): GainNode | null {
    if (!this.ready()) return null;
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(curve, t + dur);
    g.connect(this.master!);
    return g;
  }

  private burst(opts: { freq: number; type?: OscillatorType; dur: number; peak: number; glideTo?: number }) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const g = this.env(opts.peak, opts.dur);
    if (!g) return;
    const o = ctx.createOscillator();
    o.type = opts.type ?? "sine";
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(opts.freq, t);
    if (opts.glideTo) o.frequency.exponentialRampToValueAtTime(opts.glideTo, t + opts.dur);
    o.connect(g);
    o.start();
    o.stop(t + opts.dur + 0.05);
  }

  private noiseHit(opts: { freq: number; q?: number; dur: number; peak: number; type?: BiquadFilterType }) {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const g = this.env(opts.peak, opts.dur);
    if (!g) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(opts.dur + 0.05);
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? "bandpass";
    f.frequency.value = opts.freq;
    f.Q.value = opts.q ?? 1;
    src.connect(f).connect(g);
    src.start();
    src.stop(ctx.currentTime + opts.dur + 0.1);
  }

  swordHit() {
    this.noiseHit({ freq: 2600, q: 1.4, dur: 0.09, peak: 0.5 });
    this.burst({ freq: 180, type: "triangle", dur: 0.09, peak: 0.35, glideTo: 70 });
  }

  heavyHit() {
    this.noiseHit({ freq: 900, q: 1, dur: 0.16, peak: 0.6 });
    this.burst({ freq: 110, type: "triangle", dur: 0.2, peak: 0.55, glideTo: 40 });
  }

  backstab() {
    this.noiseHit({ freq: 3600, q: 3, dur: 0.07, peak: 0.5 });
    this.burst({ freq: 260, type: "square", dur: 0.12, peak: 0.22, glideTo: 90 });
  }

  execution() {
    // metallic klang: inharmonic partials
    if (!this.ready()) return;
    const ctx = this.ctx!;
    for (const [f, p] of [[523, 0.3], [761, 0.22], [1123, 0.16], [1622, 0.1]] as const) {
      const g = this.env(p, 0.5);
      if (!g) return;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      o.start();
      o.stop(ctx.currentTime + 0.55);
    }
    this.burst({ freq: 90, type: "triangle", dur: 0.35, peak: 0.6, glideTo: 30 });
    this.noiseHit({ freq: 1800, q: 0.8, dur: 0.2, peak: 0.35 });
  }

  stagger() {
    this.burst({ freq: 660, type: "square", dur: 0.16, peak: 0.2, glideTo: 330 });
    this.noiseHit({ freq: 2200, q: 2, dur: 0.12, peak: 0.3 });
  }

  hurt() {
    this.burst({ freq: 220, type: "sawtooth", dur: 0.15, peak: 0.25, glideTo: 110 });
  }

  death() {
    this.burst({ freq: 300, type: "sawtooth", dur: 0.5, peak: 0.3, glideTo: 45 });
    this.noiseHit({ freq: 500, q: 0.6, dur: 0.4, peak: 0.25, type: "lowpass" });
  }

  crash() {
    this.noiseHit({ freq: 300, q: 0.5, dur: 0.3, peak: 0.6, type: "lowpass" });
    this.burst({ freq: 70, type: "triangle", dur: 0.3, peak: 0.5, glideTo: 28 });
  }

  bowShot() {
    this.noiseHit({ freq: 4200, q: 4, dur: 0.12, peak: 0.35 });
    this.burst({ freq: 900, type: "sine", dur: 0.1, peak: 0.12, glideTo: 2400 });
  }

  spellFire() {
    this.noiseHit({ freq: 1200, q: 0.7, dur: 0.35, peak: 0.4 });
    this.burst({ freq: 140, type: "sawtooth", dur: 0.3, peak: 0.2, glideTo: 60 });
  }

  spellSoul() {
    this.burst({ freq: 880, type: "sine", dur: 0.4, peak: 0.2, glideTo: 1760 });
    this.burst({ freq: 587, type: "sine", dur: 0.45, peak: 0.14, glideTo: 1174 });
  }

  flask() {
    this.burst({ freq: 520, type: "sine", dur: 0.25, peak: 0.2, glideTo: 780 });
    this.burst({ freq: 390, type: "triangle", dur: 0.3, peak: 0.12, glideTo: 585 });
  }

  souls() {
    this.burst({ freq: 1046, type: "sine", dur: 0.3, peak: 0.14, glideTo: 1568 });
  }

  heal() {
    this.burst({ freq: 660, type: "sine", dur: 0.35, peak: 0.16, glideTo: 990 });
  }

  uiClick() {
    this.burst({ freq: 1200, type: "square", dur: 0.04, peak: 0.08 });
  }

  bossRoar() {
    if (!this.ready()) return;
    const ctx = this.ctx!;
    const g = this.env(0.55, 1.2);
    if (!g) return;
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 4);
    }
    dist.curve = curve;
    dist.connect(g);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(70, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 1.0);
    o.connect(dist);
    o.start();
    o.stop(ctx.currentTime + 1.25);
    this.noiseHit({ freq: 350, q: 0.5, dur: 0.9, peak: 0.3, type: "lowpass" });
  }

  phaseSting() {
    this.burst({ freq: 110, type: "sawtooth", dur: 0.8, peak: 0.4, glideTo: 55 });
    this.burst({ freq: 1244, type: "sine", dur: 0.7, peak: 0.15, glideTo: 622 });
    this.noiseHit({ freq: 3000, q: 0.7, dur: 0.5, peak: 0.2 });
  }

  tutorialPing() {
    this.burst({ freq: 784, type: "sine", dur: 0.18, peak: 0.14, glideTo: 1046 });
  }

  bonfireRest() {
    this.burst({ freq: 392, type: "sine", dur: 0.6, peak: 0.18, glideTo: 523 });
    this.burst({ freq: 262, type: "triangle", dur: 0.8, peak: 0.12, glideTo: 330 });
  }
}

export const audio = new AudioEngine();
