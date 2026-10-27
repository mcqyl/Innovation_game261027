/* ============================================================
   CODE RIFT — 2D platforming engine
   Canvas logical size: 1280 x 720
   ============================================================ */

import { ART } from "./art.js";

const VIEW_W = 1280;
const VIEW_H = 720;
const GRAVITY = 2350;
const MOVE_SPEED = 336;
const MOVE_ACCEL = 2750;
const GROUND_FRICTION = 3200;
const AIR_FRICTION = 520;
const JUMP_VELOCITY = 830;
const DOUBLE_JUMP_VELOCITY = 755;
const MAX_FALL = 1180;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER = 0.14;
const PLAYER_W = 30;
const PLAYER_H = 50;
const MAX_HP = 3;
const MAX_INK = 3;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function overlap(a, b, inset = 0) {
  return (
    a.x + inset < b.x + (b.w || 0) &&
    a.x + (a.w || 0) - inset > b.x &&
    a.y + inset < b.y + (b.h || 0) &&
    a.y + (a.h || 0) - inset > b.y
  );
}

export class GameEngine {
  constructor({ canvas, level, audio, callbacks = {} }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.level = level;
    this.audio = audio;
    this.callbacks = callbacks;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = VIEW_W * this.dpr;
    this.canvas.height = VIEW_H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.palette = ART.makePalette(level);
    this.totalCores = level.collectibles.filter((item) => item.type === "core").length;
    this.totalBits = level.collectibles.length - this.totalCores;
    this.spawn = this.findSpawn(level.start.x, level.start.y);
    this.player = this.makePlayer(this.spawn);
    this.camera = 0;
    this.time = 0;
    this.elapsed = 0;
    this.paused = true;
    this.finished = false;
    this.started = false;
    this.last = 0;
    this.raf = 0;
    this.hp = MAX_HP;
    this.ink = MAX_INK;
    this.bits = 0;
    this.cores = 0;
    this.damageCount = 0;
    this.rewindsUsed = 0;
    this.mistakes = 0;
    this.hints = 0;
    this.terminalSolved = false;
    this.bossHp = level.bossFight ? level.bossFight.maxHp || 3 : 0;
    this.bossMax = this.bossHp;
    this.bossSolved = 0;
    this.bossDefeated = false;
    this.checkpoint = { x: level.checkpoint.x, y: level.checkpoint.y, active: false };
    this.interactTarget = null;
    this.lastInteractKey = "";
    this.nearNpc = new Set();
    this.visitedNpcs = new Set();
    this.hinted = new Set();
    this.shake = 0;
    this.particles = [];
    this.popups = [];
    this.snapshots = [];
    this.snapshotTimer = 0;
    this.dustTimer = 0;
    this.keys = { left: false, right: false, jump: false };
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.airJumps = 1;
    this.doubleJumped = false;
    this.jumpHeld = false;
    this.hudKey = "";
    this.lastFrame = performance.now();
    this.boundFrame = (now) => this.frame(now);
    this.keydownHandler = (event) => this.onKeyDown(event);
    this.keyupHandler = (event) => this.onKeyUp(event);
    this.blurHandler = () => this.clearInput();
    this.visibilityHandler = () => {
      if (document.hidden) this.clearInput();
    };
    this.touchBindings = [];

    this.cloneWorld();
  }

  cloneWorld() {
    this.level = {
      ...this.level,
      collectibles: this.level.collectibles.map((item) => ({ ...item, collected: false })),
      enemies: (this.level.enemies || []).map((enemy) => ({ ...enemy, dead: false, homeX: enemy.x })),
      npcs: (this.level.npcs || []).map((npc) => ({ ...npc })),
      platforms: this.level.platforms.map((platform) => ({ ...platform })),
      hazards: this.level.hazards.map((hazard) => ({ ...hazard })),
      springs: (this.level.springs || []).map((spring) => ({ ...spring }))
    };
  }

  makePlayer(spawn) {
    return {
      x: spawn.x - PLAYER_W / 2,
      y: spawn.surfaceY - PLAYER_H - 1,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      invuln: 0,
      doubleJumped: false
    };
  }

  findSpawn(x, approxY) {
    const candidates = this.level.platforms
      .filter((p) => x >= p.x - 10 && x <= p.x + p.w + 10 && p.y >= approxY - 14 && p.y <= approxY + 150)
      .sort((a, b) => a.y - b.y);
    if (candidates.length) {
      return { x, surfaceY: candidates[0].y };
    }
    return { x, surfaceY: approxY + PLAYER_H };
  }

  getStats() {
    return {
      id: this.level.id,
      title: this.level.title,
      time: Math.round(this.elapsed),
      bits: this.bits,
      totalBits: this.totalBits,
      cores: this.cores,
      totalCores: this.totalCores,
      damage: this.damageCount,
      deaths: this.damageCount,
      rewinds: this.rewindsUsed,
      mistakes: this.mistakes,
      hints: this.hints,
      boss: Boolean(this.level.bossFight)
    };
  }

  getBossState() {
    return {
      hp: this.bossHp,
      maxHp: this.bossMax,
      solved: this.bossSolved,
      defeated: this.bossDefeated
    };
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.paused = true;
    window.addEventListener("keydown", this.keydownHandler, { passive: false });
    window.addEventListener("keyup", this.keyupHandler);
    window.addEventListener("blur", this.blurHandler);
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.bindTouchControls();
    this.emitHud(true);
    this.updateInteractHint();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.boundFrame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);
    window.removeEventListener("blur", this.blurHandler);
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.touchBindings.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.touchBindings = [];
    this.started = false;
  }

  pause() {
    this.paused = true;
    this.clearInput();
  }

  resume() {
    if (!this.started || this.finished) return;
    this.paused = false;
    this.last = performance.now();
    this.clearInput();
  }

  clearInput() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.jumpBuffer = 0;
    this.jumpHeld = false;
  }

  onKeyDown(event) {
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
      return;
    }
    const code = event.code;
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(code)) event.preventDefault();
    if (this.paused || this.finished) return;
    if (event.repeat) return;
    if (code === "KeyA" || code === "ArrowLeft") this.keys.left = true;
    else if (code === "KeyD" || code === "ArrowRight") this.keys.right = true;
    else if (code === "Space" || code === "KeyW" || code === "ArrowUp") {
      this.jumpBuffer = JUMP_BUFFER;
      this.jumpHeld = true;
      this.keys.jump = true;
    } else if (code === "KeyE") {
      this.interact();
    } else if (code === "KeyZ") {
      this.rewind();
    }
  }

  onKeyUp(event) {
    const code = event.code;
    if (code === "KeyA" || code === "ArrowLeft") this.keys.left = false;
    else if (code === "KeyD" || code === "ArrowRight") this.keys.right = false;
    else if (code === "Space" || code === "KeyW" || code === "ArrowUp") {
      this.keys.jump = false;
      if (this.jumpHeld && this.player.vy < -260) this.player.vy *= 0.55;
      this.jumpHeld = false;
    }
  }

  bindTouchControls() {
    const buttons = document.querySelectorAll("[data-touch]");
    buttons.forEach((element) => {
      const action = element.dataset.touch;
      const down = (event) => {
        event.preventDefault();
        element.classList.add("is-pressed");
        if (this.paused || this.finished) return;
        if (action === "left") this.keys.left = true;
        else if (action === "right") this.keys.right = true;
        else if (action === "jump") {
          this.jumpBuffer = JUMP_BUFFER;
          this.jumpHeld = true;
          this.keys.jump = true;
        } else if (action === "interact") this.interact();
        else if (action === "rewind") this.rewind();
      };
      const up = (event) => {
        event.preventDefault();
        element.classList.remove("is-pressed");
        if (action === "left") this.keys.left = false;
        else if (action === "right") this.keys.right = false;
        else if (action === "jump") {
          this.keys.jump = false;
          if (this.jumpHeld && this.player.vy < -260) this.player.vy *= 0.55;
          this.jumpHeld = false;
        }
      };
      element.addEventListener("pointerdown", down);
      element.addEventListener("pointerup", up);
      element.addEventListener("pointercancel", up);
      element.addEventListener("pointerleave", up);
      this.touchBindings.push({ element, type: "pointerdown", handler: down });
      this.touchBindings.push({ element, type: "pointerup", handler: up });
      this.touchBindings.push({ element, type: "pointercancel", handler: up });
      this.touchBindings.push({ element, type: "pointerleave", handler: up });
    });
  }

  frame(now) {
    const dt = Math.min(0.045, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.time += dt;
    if (!this.paused && !this.finished) {
      this.elapsed += dt;
      this.update(dt);
    }
    this.render();
    this.raf = requestAnimationFrame(this.boundFrame);
  }

  update(dt) {
    const player = this.player;
    player.invuln = Math.max(0, player.invuln - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.shake = Math.max(0, this.shake - dt * 12);
    this.updateInteractHint();
    this.checkCheckpoint();
    this.updateNpcsProximity();

    const move = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    if (move !== 0) {
      player.vx += move * MOVE_ACCEL * dt;
      player.vx = clamp(player.vx, -MOVE_SPEED, MOVE_SPEED);
      player.facing = move;
    } else {
      const friction = player.grounded ? GROUND_FRICTION : AIR_FRICTION;
      const drop = friction * dt;
      if (Math.abs(player.vx) <= drop) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * drop;
    }

    if (this.jumpBuffer > 0) {
      if (player.grounded || this.coyote > 0) {
        player.vy = -JUMP_VELOCITY;
        player.grounded = false;
        this.jumpBuffer = 0;
        this.coyote = 0;
        this.airJumps = 1;
        this.jumpHeld = true;
        this.audio?.play("jump");
        this.spawnDust(player.x + player.w / 2, player.y + player.h, 7, this.palette.accent);
      } else if (this.airJumps > 0) {
        player.vy = -DOUBLE_JUMP_VELOCITY;
        player.grounded = false;
        this.airJumps -= 1;
        this.jumpBuffer = 0;
        this.jumpHeld = true;
        this.doubleJumped = true;
        this.audio?.play("doubleJump");
        this.spawnRing(player.x + player.w / 2, player.y + player.h * 0.6, this.palette.accent);
        this.spawnDust(player.x + player.w / 2, player.y + player.h, 5, this.palette.accent2);
      }
    }

    const previousX = player.x;
    player.x += player.vx * dt;
    player.x = clamp(player.x, 0, this.level.width - player.w);

    if (player.x !== previousX && this.keys.jump && player.grounded) {
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.16;
        this.spawnDust(player.x + player.w / 2, player.y + player.h, 1, this.palette.accent);
      }
    }

    const wasGrounded = player.grounded;
    const prevBottom = player.y + player.h;
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
    player.y += player.vy * dt;
    player.grounded = false;

    for (const platform of this.level.platforms) {
      if (!this.overlapX(player, platform)) continue;
      const newBottom = player.y + player.h;
      if (player.vy >= 0 && prevBottom <= platform.y + 10 && newBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
        this.airJumps = 1;
        this.doubleJumped = false;
        if (!wasGrounded) this.onLand();
      }
    }

    if (player.grounded) {
      this.coyote = COYOTE_TIME;
    } else if (wasGrounded && this.coyote <= 0) {
      this.coyote = COYOTE_TIME;
    }

    if (player.grounded) {
      for (const spring of this.level.springs) {
        if (
          player.x + player.w > spring.x + 4 &&
          player.x < spring.x + spring.w - 4 &&
          player.y + player.h >= spring.y - 6 &&
          player.y + player.h <= spring.y + 22
        ) {
          player.vy = -spring.power;
          player.grounded = false;
          this.airJumps = 1;
          this.jumpHeld = true;
          this.audio?.play("spring");
          this.spawnRing(spring.x + spring.w / 2, spring.y, this.palette.accent);
          this.spawnDust(spring.x + spring.w / 2, spring.y, 8, this.palette.accent2);
          this.popup(spring.x + spring.w / 2, spring.y - 20, "BOOST", this.palette.accent);
        }
      }
    }

    if (player.grounded) {
      player.vy = 0;
    }

    for (const hazard of this.level.hazards) {
      const hitbox = { x: hazard.x + 6, y: hazard.y + 10, w: hazard.w - 12, h: hazard.h - 4 };
      if (overlap(player, hitbox, 4)) {
        this.damage("spike", true);
        break;
      }
    }

    for (const enemy of this.level.enemies) {
      if (enemy.dead) continue;
      enemy.x += enemy.dir * enemy.speed * dt;
      if (enemy.x <= enemy.min) {
        enemy.x = enemy.min;
        enemy.dir = 1;
      } else if (enemy.x + enemy.w >= enemy.max) {
        enemy.x = enemy.max - enemy.w;
        enemy.dir = -1;
      }
      if (player.invuln > 0) continue;
      if (!overlap(player, enemy, 3)) continue;
      const stomped = player.vy > 110 && player.y + player.h - player.vy * dt <= enemy.y + 14;
      if (stomped) {
        enemy.dead = true;
        player.vy = -450;
        this.airJumps = 1;
        this.audio?.play("stomp");
        this.spawnBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, [this.palette.accent, "#ffffff"], 13, 170);
        this.popup(enemy.x + enemy.w / 2, enemy.y, "+BUG", this.palette.accent);
        this.shake = Math.max(this.shake, 2);
        this.emitHint("踩扁了。它本来也只是一个没被处理的异常。", "smug", "first-stomp");
      } else {
        this.damage("bug", false);
        player.vx = Math.sign(player.x + player.w / 2 - (enemy.x + enemy.w / 2)) * 280 || 280;
        player.vy = -350;
        player.grounded = false;
        break;
      }
    }

    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      const dx = player.x + player.w / 2 - item.x;
      const dy = player.y + player.h / 2 - item.y;
      const radius = item.type === "core" ? 33 : 21;
      if (dx * dx + dy * dy > radius * radius) continue;
      item.collected = true;
      if (item.type === "core") {
        this.cores += 1;
        this.audio?.play("core");
        this.spawnBurst(item.x, item.y, [this.palette.accent, "#ffffff", this.palette.accent2], 22, 210);
        this.spawnRing(item.x, item.y, this.palette.accent);
        this.popup(item.x, item.y - 18, "SOURCE CORE +1", this.palette.accent);
        this.shake = Math.max(this.shake, 2.5);
        this.emitHint("源核 +1。它看起来像会发光的小储蓄罐。", "happy", "first-core");
      } else {
        this.bits += 1;
        this.audio?.play("bit");
        this.spawnBurst(item.x, item.y, [this.palette.accent], 6, 110);
        this.emitHint("碎片只是加分。不过你捡得很认真，我记下了——大概七秒。", "neutral", "first-bit");
      }
      this.emitHud(true);
    }

    if (player.y > VIEW_H + 80) {
      this.damage("fall", true);
    }

    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 0.08) {
      this.snapshotTimer = 0;
      this.snapshots.push({
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy,
        facing: player.facing,
        hp: this.hp,
        grounded: player.grounded
      });
      if (this.snapshots.length > 70) this.snapshots.shift();
    }

    this.updateParticles(dt);
    this.updatePopups(dt);

    const targetCamera = this.level.width <= VIEW_W ? 0 : clamp(player.x + player.w / 2 - VIEW_W * 0.42, 0, this.level.width - VIEW_W);
    const cameraEase = 1 - Math.pow(0.001, dt);
    this.camera += (targetCamera - this.camera) * cameraEase;

    if (this.level.bossFight && !this.bossDefeated) {
      const distance = Math.abs(player.x - this.level.terminal.x);
      if (distance < 430) this.emitHint("三层壳。每答对一层，就剥掉它一层。按 E 接入控制台。", "serious", "boss-near");
    }
  }

  overlapX(a, b) {
    return a.x + a.w > b.x + 2 && a.x < b.x + b.w - 2;
  }

  onLand() {
    const player = this.player;
    this.spawnDust(player.x + player.w / 2, player.y + player.h, 4, this.palette.edge);
    this.audio?.play("land");
    this.shake = Math.max(this.shake, 0.6);
  }

  updateNpcsProximity() {
    const player = this.player;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    for (const npc of this.level.npcs) {
      const near = Math.abs(px - npc.x) < 86 && Math.abs(py - (npc.y - 28)) < 100;
      if (near) this.nearNpc.add(npc.id);
      else this.nearNpc.delete(npc.id);
    }
  }

  checkCheckpoint() {
    if (this.checkpoint.active) return;
    const cx = this.player.x + this.player.w / 2;
    if (cx < this.checkpoint.x) return;
    const surfaceY = this.checkpoint.y;
    this.checkpoint.active = true;
    this.spawn = { x: this.checkpoint.x, surfaceY };
    this.hp = MAX_HP;
    this.ink = MAX_INK;
    this.audio?.play("checkpoint");
    this.spawnBurst(this.checkpoint.x, surfaceY - 54, [this.palette.accent, "#ffffff"], 19, 160);
    this.spawnRing(this.checkpoint.x, surfaceY - 54, this.palette.accent);
    this.popup(this.checkpoint.x, surfaceY - 112, "SYNC LOCKED", this.palette.accent);
    this.emitHud(true);
    this.callbacks.onCheckpoint?.({ x: this.checkpoint.x, surfaceY });
    this.emitHint("检查点已同步。现在起，你的失误会被温柔记录。", "calm", "checkpoint");
  }

  updateInteractHint() {
    const player = this.player;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    let nearest = null;
    let nearestDistance = Infinity;

    for (const npc of this.level.npcs) {
      const distance = Math.abs(px - npc.x) + Math.abs(py - (npc.y - 32)) * 0.4;
      if (distance < 100 && distance < nearestDistance) {
        nearest = { kind: "npc", label: `交谈 · ${npc.name}`, npc, distance };
        nearestDistance = distance;
      }
    }

    if (this.level.bossFight && !this.bossDefeated) {
      const distance = Math.abs(px - this.level.terminal.x) + Math.abs(py - (this.level.terminal.y - 40)) * 0.4;
      if (distance < 118 && distance < nearestDistance) {
        const shell = Math.min(this.bossSolved + 1, this.bossMax);
        nearest = { kind: "terminal", label: `接入控制台 · 第 ${shell} 层壳`, distance };
        nearestDistance = distance;
      }
    } else if (!this.terminalSolved) {
      const distance = Math.abs(px - this.level.terminal.x) + Math.abs(py - (this.level.terminal.y - 40)) * 0.4;
      if (distance < 112 && distance < nearestDistance) {
        nearest = { kind: "terminal", label: `接入终端 · ${this.level.terminal.label}`, distance };
        nearestDistance = distance;
      }
    }

    if (this.level.door) {
      const distance = Math.abs(px - this.level.door.x) + Math.abs(py - (this.level.door.y - 50)) * 0.4;
      if (distance < 118 && distance < nearestDistance) {
        nearest = {
          kind: "door",
          label: this.terminalSolved ? `进入 · ${this.level.door.label}` : `${this.level.door.label} · 编译门锁定`,
          distance
        };
        nearestDistance = distance;
      }
    }

    this.interactTarget = nearest;
    const key = nearest ? `${nearest.kind}:${nearest.label}` : "";
    if (key !== this.lastInteractKey) {
      this.lastInteractKey = key;
      this.callbacks.onInteract?.(nearest ? { kind: nearest.kind, label: nearest.label } : null);
    }

    if (!this.hinted.has("terminal") && !this.terminalSolved && !this.level.bossFight && px > this.level.terminal.x - 460) {
      this.hinted.add("terminal");
      this.emitHint("终端就在前面。按 E 接入，读代码，别读它的态度。", "neutral", "terminal-near");
    }
  }

  interact() {
    const target = this.interactTarget;
    if (!target) return;
    if (target.kind === "npc") {
      const npc = target.npc;
      const firstTime = !this.visitedNpcs.has(npc.id);
      this.visitedNpcs.add(npc.id);
      const lines = firstTime ? npc.dialogue : [npc.repeat];
      this.audio?.play("talk");
      this.callbacks.onDialogue?.({
        source: "npc",
        npc,
        lines,
        firstTime,
        rewardId: firstTime ? npc.rewardId : null
      });
      return;
    }
    if (target.kind === "terminal") {
      this.audio?.play("terminal");
      if (this.level.bossFight) {
        this.callbacks.onPuzzle?.({
          source: "boss",
          puzzle: this.level.bossFight.questions[this.bossSolved],
          boss: true,
          questionIndex: this.bossSolved
        });
      } else if (!this.terminalSolved) {
        this.callbacks.onPuzzle?.({
          source: "terminal",
          puzzle: this.level.puzzle,
          boss: false,
          questionIndex: 0
        });
      }
      return;
    }
    if (target.kind === "door") {
      if (!this.terminalSolved) {
        this.audio?.play("locked");
        this.callbacks.onToast?.("编译门还锁着。先去修复终端。", "warn");
        this.emitHint("门不会因为你有热情就打开。它只认终端修复。", "smug", "door-locked");
        return;
      }
      this.audio?.play("door");
      this.spawnBurst(this.level.door.x, this.level.door.y - 56, [this.palette.accent, "#ffffff"], 20, 180);
      this.callbacks.onDoor?.({ door: this.level.door });
    }
  }

  solveTerminal() {
    if (this.terminalSolved) return;
    this.terminalSolved = true;
    this.audio?.play("success");
    const terminal = this.level.terminal;
    this.spawnBurst(terminal.x, terminal.y - 50, [this.palette.accent, "#ffffff", this.palette.accent2], 28, 230);
    this.spawnRing(terminal.x, terminal.y - 50, this.palette.accent);
    this.popup(terminal.x, terminal.y - 110, "TERMINAL FIXED", this.palette.accent);
    this.shake = Math.max(this.shake, 3);
    this.emitHud(true);
    this.emitHint("终端修复完成。编译门开了，趁它后悔之前过去。", "happy", "terminal-solved");
    this.callbacks.onTerminalSolved?.();
  }

  solveBossShell() {
    if (!this.level.bossFight) return this.getBossState();
    this.bossSolved = Math.min(this.bossMax, this.bossSolved + 1);
    this.bossHp = Math.max(0, this.bossMax - this.bossSolved);
    this.audio?.play("bossHit");
    const bossX = 1440 - this.camera;
    this.spawnBurst(bossX, 287, ["#ff97b5", "#ffffff", "#a692ff"], 32, 260);
    this.spawnRing(bossX, 287, "#ff97b5");
    this.shake = Math.max(this.shake, 7);
    if (this.bossHp === 0) {
      this.spawnBurst(1440 - this.camera, 287, ["#ffd0df", "#ff97b5", "#ffffff"], 60, 380);
      this.shake = 14;
    }
    this.emitHud(true);
    return this.getBossState();
  }

  defeatBoss() {
    this.bossDefeated = true;
    this.bossHp = 0;
    this.shake = 16;
    this.audio?.play("bossDown");
    const bossX = 1440 - this.camera;
    this.spawnBurst(bossX, 287, ["#ffd0df", "#ff97b5", "#a692ff", "#ffffff"], 90, 420);
    this.spawnRing(bossX, 287, "#ff97b5");
    this.popup(bossX, 120, "NULL POINTER // CAUGHT", "#ffc1d1");
    this.emitHud(true);
  }

  finishRun() {
    this.finished = true;
    this.clearInput();
    this.player.vx = 0;
    return this.getStats();
  }

  registerMistake() {
    this.mistakes += 1;
  }

  registerHint() {
    this.hints += 1;
  }

  interactPulse() {
    this.callbacks.onInteract?.(this.interactTarget ? { kind: this.interactTarget.kind, label: this.interactTarget.label } : null);
  }

  rewind() {
    if (this.ink <= 0) {
      this.callbacks.onToast?.("回溯墨水用完了。下一次检查点会补满。", "warn");
      this.emitHint("没墨水了。用身体记住这次失误吧。", "worried", "no-rewind");
      return;
    }
    if (this.snapshots.length < 8) {
      this.callbacks.onToast?.("回溯需要一点历史。先动起来。", "warn");
      return;
    }
    const targetIndex = Math.max(0, this.snapshots.length - 28);
    const snapshot = this.snapshots[targetIndex];
    const player = this.player;
    this.spawnBurst(player.x + player.w / 2, player.y + player.h / 2, [this.palette.accent2, "#ffffff"], 20, 190);
    for (let i = this.snapshots.length - 1; i > targetIndex; i -= 2) {
      const ghost = this.snapshots[i];
      this.spawnDust(ghost.x + player.w / 2, ghost.y + player.h / 2, 1, this.palette.accent2);
    }
    player.x = snapshot.x;
    player.y = snapshot.y;
    player.vx = 0;
    player.vy = 0;
    player.facing = snapshot.facing;
    player.invuln = 0.9;
    this.hp = clamp(snapshot.hp, 1, MAX_HP);
    this.ink -= 1;
    this.rewindsUsed += 1;
    this.snapshots = this.snapshots.slice(0, targetIndex + 1);
    this.audio?.play("rewind");
    this.shake = 2.5;
    this.popup(player.x + player.w / 2, player.y - 10, "REWIND", this.palette.accent2);
    this.emitHud(true);
    this.emitHint("回溯完成。过去不是被改写，是被重新读了一遍。", "mystic", "rewind");
  }

  damage(reason, respawn) {
    if (this.player.invuln > 0) return;
    this.hp -= 1;
    this.damageCount += 1;
    this.player.invuln = 1.2;
    this.audio?.play("hurt");
    this.shake = Math.max(this.shake, 5);
    this.spawnBurst(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      [this.palette.danger, "#ffffff"],
      18,
      190
    );
    const reasonText = reason === "spike" ? "尖刺比你更懂边界。" : reason === "fall" ? "你掉出了关卡。世界帮你撤销了这一步。" : "它撞了你一下，像一条未处理的异常。";
    this.popup(this.player.x + this.player.w / 2, this.player.y - 8, "-1 SYNC", this.palette.danger);
    this.emitHint(reasonText, "worried", `hurt-${reason}`);
    if (this.hp <= 0) {
      this.hp = MAX_HP;
      this.ink = MAX_INK;
      respawn = true;
      this.callbacks.onToast?.("同步崩坏。已回到检查点，墨水补满。", "error");
      this.emitHint("同步崩坏了，但我把你捡回来了。检查点是个好东西。", "relieved", "revive");
    }
    if (respawn) this.respawn();
    this.emitHud(true);
  }

  respawn() {
    const player = this.player;
    player.x = this.spawn.x - player.w / 2;
    player.y = this.spawn.surfaceY - player.h - 1;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.invuln = 1.4;
    this.airJumps = 1;
    this.doubleJumped = false;
    this.clearInput();
    this.snapshots = [];
    const targetCamera = this.level.width <= VIEW_W ? 0 : clamp(player.x + player.w / 2 - VIEW_W * 0.42, 0, this.level.width - VIEW_W);
    this.camera = targetCamera;
    this.spawnRing(player.x + player.w / 2, player.y + player.h / 2, this.palette.accent);
    this.audio?.play("respawn");
  }

  emitHint(text, mood, onceKey) {
    if (onceKey) {
      if (this.hinted.has(`hint:${onceKey}`)) return;
      this.hinted.add(`hint:${onceKey}`);
    }
    this.callbacks.onHint?.({ text, mood });
  }

  popup(x, y, text, color) {
    this.popups.push({ x, y, text, color, life: 1, maxLife: 1 });
  }

  spawnDust(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 90,
        vy: -Math.random() * 80,
        gravity: 240,
        size: 1.4 + Math.random() * 2.2,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        shape: "dust"
      });
    }
  }

  spawnBurst(x, y, colors, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.75);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 30,
        gravity: 380,
        size: 1 + Math.random() * 2.6,
        life: 0.45 + Math.random() * 0.6,
        maxLife: 1.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: "spark"
      });
    }
  }

  spawnRing(x, y, color) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      size: 4,
      life: 0.42,
      maxLife: 0.42,
      color,
      shape: "ring"
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (particle.shape !== "ring") {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        particle.vx *= 1 - dt * 0.8;
      } else {
        particle.size += dt * 80;
      }
    }
  }

  updatePopups(dt) {
    for (let i = this.popups.length - 1; i >= 0; i -= 1) {
      const popup = this.popups[i];
      popup.life -= dt;
      popup.y -= 26 * dt;
      if (popup.life <= 0) this.popups.splice(i, 1);
    }
  }

  emitHud(force = false) {
    const key = `${this.hp}:${this.ink}:${this.bits}:${this.cores}:${this.terminalSolved}:${this.bossHp}:${this.bossSolved}:${this.bossDefeated}`;
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.callbacks.onHud?.({
      hp: this.hp,
      maxHp: MAX_HP,
      ink: this.ink,
      maxInk: MAX_INK,
      bits: this.bits,
      cores: this.cores,
      totalCores: this.totalCores,
      terminalSolved: this.terminalSolved,
      boss: Boolean(this.level.bossFight),
      bossHp: this.bossHp,
      bossMax: this.bossMax,
      bossSolved: this.bossSolved,
      bossDefeated: this.bossDefeated
    });
  }

  render() {
    const ctx = this.ctx;
    const player = this.player;
    const shakeX = (Math.random() - 0.5) * this.shake;
    const shakeY = (Math.random() - 0.5) * this.shake * 0.7;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.translate(shakeX, shakeY);

    ART.drawBackground(ctx, this.level, this.camera, this.time);

    if (this.level.bossFight) {
      ART.drawBoss(ctx, this.level, this.camera, this.time, {
        hp: this.bossHp,
        defeated: this.bossDefeated
      });
    }

    ctx.save();
    ctx.translate(-this.camera, 0);

    ART.drawCheckpoint(
      ctx,
      { x: this.checkpoint.x, y: this.checkpoint.y },
      this.level,
      this.time,
      this.checkpoint.active
    );

    for (const platform of this.level.platforms) {
      if (platform.x + platform.w < this.camera - 120 || platform.x > this.camera + VIEW_W + 120) continue;
      ART.drawPlatform(ctx, platform, this.level, this.time);
    }

    for (const spring of this.level.springs) {
      ART.drawSpring(ctx, spring, this.level, this.time);
    }

    for (const hazard of this.level.hazards) {
      if (hazard.x + hazard.w < this.camera - 60 || hazard.x > this.camera + VIEW_W + 60) continue;
      ART.drawSpike(ctx, hazard, this.level, this.time);
    }

    if (this.level.door) {
      ART.drawDoor(ctx, this.level.door, this.level, this.time, { open: this.terminalSolved });
    }

    ART.drawTerminal(ctx, this.level.terminal, this.level, this.time, {
      solved: this.terminalSolved,
      boss: Boolean(this.level.bossFight),
      shell: Math.min(this.bossSolved, this.bossMax - 1)
    });

    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      if (item.x < this.camera - 60 || item.x > this.camera + VIEW_W + 60) continue;
      if (item.type === "core") ART.drawCore(ctx, item, this.level, this.time);
      else ART.drawBit(ctx, item, this.level, this.time);
    }

    for (const npc of this.level.npcs) {
      if (npc.x < this.camera - 130 || npc.x > this.camera + VIEW_W + 130) continue;
      ART.drawNpc(ctx, npc, this.level, this.time, {
        nearby: this.nearNpc.has(npc.id),
        visited: this.visitedNpcs.has(npc.id)
      });
    }

    for (const enemy of this.level.enemies) {
      if (enemy.dead) continue;
      if (enemy.x < this.camera - 100 || enemy.x > this.camera + VIEW_W + 100) continue;
      ART.drawBug(ctx, enemy, this.level, this.time);
    }

    if (!this.finished) {
      ART.drawPlayer(ctx, player, this.level, this.time);
    } else {
      ART.drawPlayer(ctx, { ...player, invuln: 0 }, this.level, this.time);
    }

    ctx.restore();

    this.renderParticles(ctx);
    ART.drawForeground(ctx, this.level, this.camera, this.time);

    if (this.level.bossFight) {
      const targetX = 1440 - this.camera;
      if (targetX > 0 && targetX < VIEW_W + 200) {
        ctx.save();
        ctx.globalAlpha = 0.12 + Math.sin(this.time) * 0.025;
        ctx.fillStyle = "#ff97b5";
        ctx.fillRect(targetX - 170, 430, 340, 1);
        ctx.restore();
      }
    }

    this.renderPopups(ctx);
    ctx.restore();
  }

  renderParticles(ctx) {
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (particle.shape === "ring") {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(particle.x - this.camera, particle.y, particle.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (particle.shape === "spark") {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - this.camera - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x - this.camera, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderPopups(ctx) {
    for (const popup of this.popups) {
      const alpha = clamp(popup.life / popup.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = popup.color;
      ctx.font = '600 8px "Cascadia Code", Consolas, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 5;
      ctx.fillText(popup.text, popup.x - this.camera, popup.y);
      ctx.restore();
    }
  }
}
