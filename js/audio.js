/* ============================================================
   CODE RIFT — procedural WebAudio score & SFX
   No audio files. Everything is synthesized in the browser.
   ============================================================ */

const SOUND_KEY = "codeRift.sound.v1";

const MOODS = {
  menu: { root: 98, notes: [196, 246.94, 293.66, 392, 440], filter: 640, type: "triangle" },
  forest: { root: 110, notes: [220, 261.63, 293.66, 329.63, 392], filter: 820, type: "sine" },
  mine: { root: 82.41, notes: [164.81, 196, 220, 246.94, 293.66], filter: 520, type: "triangle" },
  sky: { root: 130.81, notes: [261.63, 329.63, 392, 440, 523.25], filter: 960, type: "sine" },
  void: { root: 55, notes: [110, 130.81, 155.56, 185, 220], filter: 380, type: "sawtooth" }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class AudioDirector {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.enabled = true;
    this.mood = "menu";
    this.ambience = null;
    this.noteTimer = 0;
    this.noteStep = 0;
    try {
      this.enabled = window.localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      this.enabled = true;
    }
    this.syncButtons();
  }

  ensure() {
    if (!this.enabled) return false;
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return true;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    try {
      this.ctx = new Context();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.72;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise();
    } catch {
      this.ctx = null;
      return false;
    }
    this.startAmbience();
    return true;
  }

  unlock() {
    if (!this.enabled) {
      this.syncButtons();
      return;
    }
    this.ensure();
    this.syncButtons();
  }

  makeNoise() {
    const ctx = this.ctx;
    if (!ctx) return null;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.9), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    return buffer;
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      window.localStorage.setItem(SOUND_KEY, this.enabled ? "on" : "off");
    } catch {
      // Sound preference is non-critical.
    }
    if (this.enabled) {
      this.ensure();
      if (this.master) this.master.gain.setTargetAtTime(0.72, this.ctx.currentTime, 0.05);
      this.startAmbience();
      this.play("ui");
    } else if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
      this.stopAmbience();
    }
    this.syncButtons();
    return this.enabled;
  }

  syncButtons() {
    document.querySelectorAll("#bootSound, #selectSound, #mapSound, #gameSoundBtn").forEach((button) => {
      button.setAttribute("aria-pressed", this.enabled ? "true" : "false");
      const label = button.querySelector(".js-sound-label");
      if (label) label.textContent = this.enabled ? "声音开启" : "声音关闭";
      button.setAttribute("aria-label", this.enabled ? "关闭声音" : "开启声音");
    });
  }

  tone({ freq, endFreq = freq, type = "sine", dur = 0.16, gain = 0.06, delay = 0, attack = 0.006, filter = 0 }) {
    if (!this.ensure()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);
    }
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    if (filter) {
      const low = ctx.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = filter;
      osc.connect(low).connect(amp);
    } else {
      osc.connect(amp);
    }
    amp.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  noise({ dur = 0.12, gain = 0.05, delay = 0, filter = 1200, type = "lowpass" }) {
    if (!this.ensure() || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const low = ctx.createBiquadFilter();
    low.type = type;
    low.frequency.value = filter;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(Math.max(0.0002, gain), now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    source.connect(low).connect(amp);
    amp.connect(this.master);
    source.start(now);
    source.stop(now + dur + 0.03);
  }

  chord(freqs, { type = "sine", gap = 0.07, dur = 0.24, gain = 0.045 } = {}) {
    freqs.forEach((freq, index) => {
      this.tone({ freq, type, dur, gain, delay: index * gap });
    });
  }

  play(name) {
    if (!this.enabled) return;
    switch (name) {
      case "jump":
        this.tone({ freq: 310, endFreq: 560, type: "triangle", dur: 0.13, gain: 0.055 });
        break;
      case "doubleJump":
        this.tone({ freq: 460, endFreq: 820, type: "sine", dur: 0.16, gain: 0.06 });
        this.tone({ freq: 690, endFreq: 1080, type: "triangle", dur: 0.12, gain: 0.025, delay: 0.03 });
        break;
      case "land":
        this.noise({ dur: 0.07, gain: 0.035, filter: 500 });
        this.tone({ freq: 120, endFreq: 68, type: "sine", dur: 0.1, gain: 0.05 });
        break;
      case "spring":
        this.tone({ freq: 240, endFreq: 880, type: "sine", dur: 0.26, gain: 0.075 });
        this.tone({ freq: 480, endFreq: 1320, type: "triangle", dur: 0.2, gain: 0.03, delay: 0.04 });
        break;
      case "bit":
        this.tone({ freq: 860 + Math.random() * 100, endFreq: 1280, type: "sine", dur: 0.08, gain: 0.035 });
        break;
      case "core":
        this.chord([659.25, 880, 1318.5], { gap: 0.06, dur: 0.38, gain: 0.045 });
        this.tone({ freq: 1760, type: "sine", dur: 0.42, gain: 0.02, delay: 0.16 });
        break;
      case "hurt":
        this.tone({ freq: 210, endFreq: 64, type: "sawtooth", dur: 0.24, gain: 0.075, filter: 900 });
        this.noise({ dur: 0.16, gain: 0.045, filter: 1600 });
        break;
      case "stomp":
        this.tone({ freq: 110, endFreq: 38, type: "square", dur: 0.11, gain: 0.07, filter: 420 });
        this.noise({ dur: 0.08, gain: 0.045, filter: 900 });
        break;
      case "checkpoint":
        this.chord([523.25, 783.99], { gap: 0.12, dur: 0.32, gain: 0.048 });
        this.tone({ freq: 1046.5, type: "sine", dur: 0.5, gain: 0.025, delay: 0.2 });
        break;
      case "talk":
        this.tone({ freq: 640 + Math.random() * 40, endFreq: 590, type: "triangle", dur: 0.055, gain: 0.022 });
        break;
      case "terminal":
        this.tone({ freq: 220, endFreq: 440, type: "square", dur: 0.1, gain: 0.035, filter: 1100 });
        this.tone({ freq: 660, type: "sine", dur: 0.08, gain: 0.03, delay: 0.08 });
        break;
      case "locked":
        this.tone({ freq: 140, type: "square", dur: 0.07, gain: 0.045, filter: 600 });
        this.tone({ freq: 118, type: "square", dur: 0.09, gain: 0.04, delay: 0.11, filter: 600 });
        break;
      case "door":
        this.tone({ freq: 110, endFreq: 300, type: "sine", dur: 0.42, gain: 0.06 });
        this.noise({ dur: 0.36, gain: 0.025, filter: 900 });
        this.tone({ freq: 550, endFreq: 880, type: "triangle", dur: 0.35, gain: 0.027, delay: 0.1 });
        break;
      case "success":
        this.chord([523.25, 659.25, 783.99, 1046.5], { gap: 0.09, dur: 0.42, gain: 0.042 });
        break;
      case "rewind":
        this.tone({ freq: 920, endFreq: 180, type: "triangle", dur: 0.38, gain: 0.06, filter: 1600 });
        this.tone({ freq: 1320, endFreq: 260, type: "sine", dur: 0.32, gain: 0.022, delay: 0.02 });
        this.noise({ dur: 0.22, gain: 0.02, filter: 2600, type: "highpass" });
        break;
      case "bossHit":
        this.tone({ freq: 78, endFreq: 44, type: "sawtooth", dur: 0.3, gain: 0.1, filter: 500 });
        this.noise({ dur: 0.22, gain: 0.06, filter: 1200 });
        this.tone({ freq: 1180, endFreq: 200, type: "square", dur: 0.2, gain: 0.03, delay: 0.02 });
        break;
      case "bossDown":
        this.tone({ freq: 220, endFreq: 36, type: "sawtooth", dur: 1.2, gain: 0.1, filter: 720 });
        this.noise({ dur: 0.9, gain: 0.07, filter: 800 });
        this.chord([392, 523.25, 659.25], { gap: 0.14, dur: 0.7, gain: 0.04 });
        break;
      case "respawn":
        this.chord([196, 293.66, 392], { gap: 0.08, dur: 0.4, gain: 0.038 });
        break;
      case "ui":
        this.tone({ freq: 520, endFreq: 620, type: "sine", dur: 0.05, gain: 0.02 });
        break;
      default:
        break;
    }
  }

  setMood(mood) {
    if (!MOODS[mood] || this.mood === mood) return;
    this.mood = mood;
    if (this.ambience) {
      this.stopAmbience();
      this.startAmbience();
    } else if (this.enabled) {
      this.startAmbience();
    }
  }

  startAmbience() {
    if (!this.enabled || !this.ctx || !this.master || this.ambience) return;
    const ctx = this.ctx;
    const config = MOODS[this.mood] || MOODS.menu;
    const group = ctx.createGain();
    group.gain.setValueAtTime(0.0001, ctx.currentTime);
    group.gain.exponentialRampToValueAtTime(0.028, ctx.currentTime + 1.6);
    group.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = config.filter;
    filter.Q.value = 0.6;
    filter.connect(group);

    const oscillators = [];
    [1, 1.005].forEach((detune, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 0 ? config.type : "sine";
      osc.frequency.value = config.root;
      osc.detune.value = index * 7;
      const gain = ctx.createGain();
      gain.gain.value = index === 0 ? 0.6 : 0.25;
      osc.connect(gain).connect(filter);
      osc.start();
      oscillators.push(osc);
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.055;
    lfoGain.gain.value = config.filter * 0.24;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    oscillators.push(lfo);

    this.ambience = { group, filter, oscillators };
    this.noteStep = 0;
    this.scheduleAmbientNote(2.4);
  }

  scheduleAmbientNote(delay) {
    window.clearTimeout(this.noteTimer);
    if (!this.enabled) return;
    this.noteTimer = window.setTimeout(() => {
      if (!this.enabled || !this.ctx || !this.master) return;
      if (!this.ambience) return;
      const config = MOODS[this.mood] || MOODS.menu;
      const note = config.notes[this.noteStep % config.notes.length];
      this.noteStep += 1;
      this.tone({
        freq: note * (this.noteStep % 2 ? 1 : 2),
        endFreq: note * (this.noteStep % 2 ? 1.002 : 2.002),
        type: "sine",
        dur: 3.4,
        gain: 0.014,
        attack: 0.8,
        filter: config.filter + 300
      });
      if (this.ctx && this.master) {
        const now = this.ctx.currentTime;
        this.ambience.group.gain.setTargetAtTime(0.02 + Math.random() * 0.008, now, 0.8);
      }
      this.scheduleAmbientNote(3200 + Math.random() * 2600);
    }, Math.max(400, delay * 1000));
  }

  stopAmbience() {
    window.clearTimeout(this.noteTimer);
    if (!this.ambience || !this.ctx) {
      this.ambience = null;
      return;
    }
    const { group, oscillators } = this.ambience;
    const now = this.ctx.currentTime;
    group.gain.cancelScheduledValues(now);
    group.gain.setValueAtTime(Math.max(0.0001, group.gain.value), now);
    group.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    oscillators.forEach((osc) => {
      try {
        osc.stop(now + 0.5);
      } catch {
        // Oscillator already stopped.
      }
    });
    this.ambience = null;
  }

  setMutedForVisibility(hidden) {
    if (!this.ctx || !this.master) return;
    const target = hidden ? 0 : this.enabled ? 0.72 : 0;
    this.master.gain.setTargetAtTime(clamp(target, 0, 1), this.ctx.currentTime, 0.08);
  }
}

export const audio = new AudioDirector();
