/* ============================================================
   CODE RIFT — procedural Canvas 2D art
   Everything is drawn at runtime: no external images.
   ============================================================ */

const TAU = Math.PI * 2;

const BASE_PALETTES = {
  python: {
    skyTop: "#04120e",
    skyMid: "#0a2820",
    skyLow: "#194536",
    haze: "rgba(133, 237, 178, 0.14)",
    accent: "#9deec0",
    accent2: "#6c90ff",
    edge: "#80e2aa",
    ground: "#12241a",
    groundDeep: "#07110c",
    groundTop: "#315c41",
    stone: "#182e24",
    stoneEdge: "#4f8e69",
    danger: "#ff8295",
    glow: "rgba(157, 238, 192, 0.6)",
    ink: "#06110d",
    label: "P"
  },
  c: {
    skyTop: "#130906",
    skyMid: "#2a120b",
    skyLow: "#4d2415",
    haze: "rgba(255, 164, 94, 0.12)",
    accent: "#ffba76",
    accent2: "#ff6e7a",
    edge: "#ffd09e",
    ground: "#24160f",
    groundDeep: "#0d0806",
    groundTop: "#5c3923",
    stone: "#2e1d13",
    stoneEdge: "#9a6038",
    danger: "#ff6e7a",
    glow: "rgba(255, 186, 118, 0.58)",
    ink: "#0f0805",
    label: "C"
  },
  java: {
    skyTop: "#050d17",
    skyMid: "#0d2238",
    skyLow: "#1f4d69",
    haze: "rgba(159, 214, 255, 0.14)",
    accent: "#9fd6ff",
    accent2: "#ffb6d5",
    edge: "#c8ebff",
    ground: "#12232e",
    groundDeep: "#071018",
    groundTop: "#3f6779",
    stone: "#152d3b",
    stoneEdge: "#649db8",
    danger: "#ff97b5",
    glow: "rgba(159, 214, 255, 0.58)",
    ink: "#050c12",
    label: "J"
  },
  void: {
    skyTop: "#05030a",
    skyMid: "#100617",
    skyLow: "#2a0b28",
    haze: "rgba(255, 130, 170, 0.1)",
    accent: "#ff97b5",
    accent2: "#a692ff",
    edge: "#ffc0d1",
    ground: "#160d18",
    groundDeep: "#07040a",
    groundTop: "#422241",
    stone: "#241329",
    stoneEdge: "#92527c",
    danger: "#ff6e9e",
    glow: "rgba(255, 151, 181, 0.55)",
    ink: "#07040a",
    label: "∅"
  }
};

export function makePalette(level) {
  const key = level.bossFight ? "void" : level.theme;
  return {
    ...BASE_PALETTES[key] || BASE_PALETTES.python,
    accent: level.accent || BASE_PALETTES[key]?.accent || "#9deec0",
    accent2: level.accent2 || BASE_PALETTES[key]?.accent2 || "#6c90ff",
    boss: Boolean(level.bossFight)
  };
}

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function rgba(hex, alpha) {
  const h = hex.replace("#", "");
  const value = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(value, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawText(ctx, text, x, y, { size = 10, color = "#fff", weight = 500, align = "center", mono = true, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${mono ? '"Cascadia Code", Consolas, monospace' : '"Segoe UI", "Microsoft YaHei", sans-serif'}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ------------------------------------------------------------
   Backgrounds
   ------------------------------------------------------------ */
export function drawBackground(ctx, level, camera, t) {
  const palette = makePalette(level);
  if (level.bossFight) return drawVoidBackground(ctx, level, palette, camera, t);
  const painter = level.theme === "c" ? drawMineBackground : level.theme === "java" ? drawSkyBackground : drawForestBackground;
  painter(ctx, level, palette, camera, t);
}

function drawForestBackground(ctx, level, p, camera, t) {
  const w = 1280;
  const h = 720;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(0.5, p.skyMid);
  sky.addColorStop(1, p.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const moonX = 1010 - camera * 0.045;
  const moonY = 118;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 160);
  moonGlow.addColorStop(0, "rgba(183, 255, 211, 0.55)");
  moonGlow.addColorStop(0.16, "rgba(156, 242, 190, 0.18)");
  moonGlow.addColorStop(1, "rgba(157, 238, 192, 0)");
  ctx.fillStyle = moonGlow;
  ctx.fillRect(moonX - 160, moonY - 160, 320, 320);
  ctx.fillStyle = "rgba(210, 255, 226, 0.62)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 36, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(6, 26, 18, 0.46)";
  ctx.beginPath();
  ctx.arc(moonX + 12, moonY - 8, 33, 0, TAU);
  ctx.fill();

  const light = ctx.createLinearGradient(0, 0, 0, 500);
  light.addColorStop(0, "rgba(146, 255, 194, 0.1)");
  light.addColorStop(1, "rgba(146, 255, 194, 0)");
  polygon(ctx, [[890 - camera * 0.05, 0], [1010 - camera * 0.05, 0], [750 - camera * 0.05, 540], [500 - camera * 0.05, 540]]);
  ctx.fillStyle = light;
  ctx.fill();

  for (let i = 0; i < 9; i += 1) {
    const seed = i * 13.7;
    const x = ((i * 224 + 90 - camera * 0.1) % 1900 + 1900) % 1900 - 300;
    const trunkH = 280 + hash(seed) * 280;
    const trunkW = 44 + hash(seed + 2) * 60;
    const baseY = 650;
    ctx.fillStyle = "rgba(5, 23, 15, 0.55)";
    ctx.beginPath();
    ctx.moveTo(x - trunkW * 0.16, baseY);
    ctx.quadraticCurveTo(x - trunkW * 0.34, baseY - trunkH * 0.6, x - trunkW * 0.42, baseY - trunkH);
    ctx.lineTo(x + trunkW * 0.42, baseY - trunkH);
    ctx.quadraticCurveTo(x + trunkW * 0.3, baseY - trunkH * 0.5, x + trunkW * 0.16, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(8, 34, 22, 0.62)";
    for (let j = 0; j < 4; j += 1) {
      const by = baseY - trunkH * (0.5 + j * 0.13);
      const bw = trunkW * (2.4 + hash(seed + j) * 1.4);
      ctx.beginPath();
      ctx.ellipse(x + (j % 2 ? -1 : 1) * bw * 0.28, by, bw * 0.47, 20 + hash(seed + j + 4) * 16, j % 2 ? -0.25 : 0.22, 0, TAU);
      ctx.fill();
    }
  }

  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 178 + 50 - camera * 0.2) % 1680 + 1680) % 1680 - 200;
    const top = -40;
    const length = 150 + hash(i + 5) * 250;
    ctx.strokeStyle = `rgba(96, 184, 128, ${0.08 + hash(i) * 0.09})`;
    ctx.lineWidth = 1 + hash(i + 9) * 2;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(x + 18, top + length * 0.35, x - 20, top + length * 0.72, x + 5, top + length);
    ctx.stroke();
    for (let j = 1; j < 5; j += 1) {
      const ly = top + (length / 5) * j;
      ctx.beginPath();
      ctx.ellipse(x + (j % 2 ? 8 : -5), ly, 7 + hash(i + j) * 7, 3, j % 2 ? 0.5 : -0.5, 0, TAU);
      ctx.fillStyle = `rgba(72, 142, 98, ${0.1 + hash(i + j) * 0.09})`;
      ctx.fill();
    }
  }

  const mist = ctx.createLinearGradient(0, 400, 0, 720);
  mist.addColorStop(0, "rgba(133, 238, 181, 0)");
  mist.addColorStop(0.65, "rgba(118, 214, 162, 0.08)");
  mist.addColorStop(1, "rgba(194, 255, 218, 0.12)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 380, w, 340);

  ctx.fillStyle = "rgba(5, 18, 12, 0.58)";
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 265 + 30 - camera * 0.36) % 1850 + 1850) % 1850 - 280;
    const baseY = 720;
    const hh = 95 + hash(i + 20) * 100;
    ctx.beginPath();
    ctx.moveTo(x - 120, baseY);
    ctx.quadraticCurveTo(x - 42, baseY - hh, x, baseY - hh * 0.92);
    ctx.quadraticCurveTo(x + 48, baseY - hh * 1.2, x + 120, baseY);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 18; i += 1) {
    const px = ((i * 191 + 100 - camera * 0.42) % 1560 + 1560) % 1560 - 140;
    const py = 95 + hash(i + 3) * 500;
    const a = 0.18 + Math.max(0, Math.sin(t * 0.8 + i)) * 0.55;
    ctx.fillStyle = `rgba(201, 255, 220, ${a})`;
    ctx.beginPath();
    ctx.arc(px, py + Math.sin(t * 0.6 + i * 2) * 8, i % 4 === 0 ? 1.8 : 1.1, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(3, 13, 9, 0.52)";
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 240 + 130 - camera * 0.7) % 1960 + 1960) % 1960 - 300;
    const base = 660 + hash(i) * 25;
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(x - 10, base - 24, x - 22, base - 35);
    ctx.quadraticCurveTo(x - 3, base - 20, x + 12, base - 44);
    ctx.quadraticCurveTo(x + 12, base - 20, x + 27, base);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMineBackground(ctx, level, p, camera, t) {
  const w = 1280;
  const h = 720;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(0.55, p.skyMid);
  sky.addColorStop(1, "#5a2a16");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(760 - camera * 0.03, 520, 10, 760 - camera * 0.03, 520, 560);
  glow.addColorStop(0, "rgba(255, 158, 77, 0.28)");
  glow.addColorStop(0.5, "rgba(255, 110, 60, 0.08)");
  glow.addColorStop(1, "rgba(255, 110, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(9, 5, 3, 0.92)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 58);
  for (let i = 12; i >= 0; i -= 1) {
    const x = (i / 12) * w;
    const y = 48 + hash(i + 44) * 80 + (i % 3) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(0, 58);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(13, 7, 4, 0.7)";
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 265 + 90 - camera * 0.12) % 1800 + 1800) % 1800 - 260;
    const top = 44 + hash(i) * 20;
    const len = 110 + hash(i + 6) * 160;
    polygon(ctx, [[x - 18, top], [x + 18, top], [x + 2, top + len]]);
    ctx.fill();
  }

  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 318 + 40 - camera * 0.2) % 1900 + 1900) % 1900 - 300;
    const y = 90 + hash(i + 8) * 120;
    const len = 260 + hash(i) * 260;
    ctx.strokeStyle = "rgba(9, 5, 3, 0.65)";
    ctx.lineWidth = 15 + hash(i + 2) * 16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 24, y + len * 0.3, x - 34, y + len * 0.7, x + 8, y + len);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 155, 78, 0.055)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 179, 107, 0.11)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 235 + 130 - camera * 0.32) % 1720 + 1720) % 1720 - 220;
    const y = 95 + hash(i + 4) * 210;
    const y2 = y + 140 + hash(i + 9) * 200;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y2);
    ctx.stroke();
    for (let j = 1; j < 4; j += 1) {
      const yy = y + ((y2 - y) / 4) * j;
      ctx.beginPath();
      ctx.moveTo(x - 3, yy);
      ctx.lineTo(x + 3, yy);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 365 + 170 - camera * 0.28) % 1980 + 1980) % 1980 - 300;
    const y = 118 + hash(i + 14) * 80;
    const r = 5 + hash(i + 3) * 4;
    const lamp = ctx.createRadialGradient(x, y, 1, x, y, 74);
    lamp.addColorStop(0, "rgba(255, 213, 143, 0.9)");
    lamp.addColorStop(0.12, "rgba(255, 176, 83, 0.4)");
    lamp.addColorStop(1, "rgba(255, 142, 62, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(x - 76, y - 76, 152, 152);
    ctx.fillStyle = "#ffd994";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 214, 150, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y - 10);
    ctx.stroke();
  }

  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 182 + 50 - camera * 0.42) % 1580 + 1580) % 1580 - 160;
    const baseY = 690 + hash(i) * 30;
    const bw = 80 + hash(i + 2) * 150;
    const bh = 100 + hash(i + 5) * 150;
    ctx.fillStyle = "rgba(14, 8, 5, 0.72)";
    polygon(ctx, [[x - bw / 2, baseY], [x - bw * 0.35, baseY - bh], [x + bw * 0.2, baseY - bh * 0.82], [x + bw / 2, baseY]]);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 145, 70, 0.09)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const heat = ctx.createLinearGradient(0, 540, 0, 720);
  heat.addColorStop(0, "rgba(255, 103, 36, 0)");
  heat.addColorStop(0.6, "rgba(255, 102, 34, 0.14)");
  heat.addColorStop(1, "rgba(255, 174, 75, 0.24)");
  ctx.fillStyle = heat;
  ctx.fillRect(0, 500, w, 220);

  for (let i = 0; i < 22; i += 1) {
    const x = ((i * 151 + 40 - camera * 0.52) % 1520 + 1520) % 1520 - 120;
    const y = 230 + hash(i + 7) * 390 + Math.sin(t * 0.5 + i) * 8;
    ctx.fillStyle = `rgba(255, 195, 126, ${0.1 + hash(i) * 0.26})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function drawSkyBackground(ctx, level, p, camera, t) {
  const w = 1280;
  const h = 720;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(0.44, p.skyMid);
  sky.addColorStop(1, "#2a6d7b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = 960 - camera * 0.025;
  const sunY = 146;
  const sun = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 280);
  sun.addColorStop(0, "rgba(255, 244, 222, 0.78)");
  sun.addColorStop(0.12, "rgba(255, 225, 193, 0.36)");
  sun.addColorStop(0.48, "rgba(255, 188, 178, 0.1)");
  sun.addColorStop(1, "rgba(255, 188, 178, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - 290, sunY - 290, 580, 580);
  ctx.fillStyle = "rgba(255, 246, 229, 0.78)";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(215, 244, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(sunX, sunY, 98 + i * 54, 22 + i * 13, -0.18, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  for (let layer = 0; layer < 3; layer += 1) {
    const factor = 0.06 + layer * 0.08;
    const yBase = 118 + layer * 84;
    const alpha = 0.16 + layer * 0.07;
    ctx.fillStyle = `rgba(${190 + layer * 8}, ${227 + layer * 4}, 255, ${alpha})`;
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 285 + layer * 90 - camera * factor) % 1850 + 1850) % 1850 - 300;
      const y = yBase + hash(i + layer * 9) * 95;
      const cw = 90 + hash(i + 3 + layer) * 190;
      const ch = 16 + hash(i + 6) * 28;
      ctx.beginPath();
      ctx.ellipse(x, y, cw, ch, 0, 0, TAU);
      ctx.ellipse(x + cw * 0.35, y - ch * 0.4, cw * 0.5, ch * 0.85, 0, 0, TAU);
      ctx.ellipse(x - cw * 0.4, y + ch * 0.2, cw * 0.48, ch * 0.7, 0, 0, TAU);
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(210, 245, 255, 0.09)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 344 + 80 - camera * 0.15) % 1860 + 1860) % 1860 - 300;
    const y = 140 + hash(i + 4) * 180;
    const len = 90 + hash(i + 6) * 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 30, y + len * 0.5, x + len, y + len * 0.8);
    ctx.stroke();
  }

  for (let i = 0; i < 4; i += 1) {
    const x = ((i * 460 + 160 - camera * 0.22) % 2050 + 2050) % 2050 - 300;
    const y = 380 + i * 58 + Math.sin(t * 0.22 + i) * 9;
    const bw = 250 + i * 38;
    ctx.fillStyle = "rgba(8, 25, 38, 0.3)";
    polygon(ctx, [[x - bw / 2, y], [x - bw * 0.2, y - 28], [x + bw * 0.3, y - 16], [x + bw / 2, y + 8], [x + bw * 0.12, y + 28], [x - bw * 0.28, y + 20]]);
    ctx.fill();
    ctx.fillStyle = "rgba(105, 170, 201, 0.16)";
    ctx.fillRect(x - bw * 0.2, y - 14, bw * 0.35, 3);
    ctx.fillStyle = "rgba(198, 243, 255, 0.06)";
    ctx.beginPath();
    ctx.moveTo(x + bw * 0.5, y + 8);
    ctx.lineTo(x + bw * 0.2, y + 90);
    ctx.lineTo(x - bw * 0.1, y + 38);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 5; i += 1) {
    const x = ((i * 325 + 120 - camera * 0.4) % 1760 + 1760) % 1760 - 240;
    const y = 560 + hash(i + 1) * 80;
    const bw = 140 + hash(i + 2) * 170;
    ctx.fillStyle = "rgba(6, 18, 28, 0.42)";
    ctx.beginPath();
    ctx.ellipse(x, y, bw, 22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(219, 250, 255, 0.05)";
    ctx.beginPath();
    ctx.ellipse(x + 8, y - 8, bw * 0.76, 9, 0, 0, TAU);
    ctx.fill();
  }

  for (let i = 0; i < 13; i += 1) {
    const x = ((i * 208 + 60 - camera * 0.48) % 1590 + 1590) % 1590 - 180;
    const y = 80 + hash(i + 3) * 460;
    const blink = 0.5 + Math.sin(t * 0.7 + i) * 0.4;
    ctx.fillStyle = `rgba(230, 252, 255, ${0.1 + blink * 0.2})`;
    ctx.fillRect(x, y, 1 + (i % 2), 7 + (i % 3) * 2);
  }

  for (let i = 0; i < 4; i += 1) {
    const x = ((i * 470 + 400 - camera * 0.53) % 2010 + 2010) % 2010 - 300;
    const y = 180 + hash(i + 8) * 200 + Math.sin(t * 0.35 + i) * 15;
    ctx.strokeStyle = "rgba(221, 251, 255, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x, y - 4, x + 5, y);
    ctx.quadraticCurveTo(x, y + 3, x - 5, y);
    ctx.stroke();
  }
}

function drawVoidBackground(ctx, level, p, camera, t) {
  const w = 1280;
  const h = 720;
  const sky = ctx.createRadialGradient(w * 0.7, h * 0.45, 20, w * 0.7, h * 0.45, 780);
  sky.addColorStop(0, "#2a0d2a");
  sky.addColorStop(0.35, "#120817");
  sky.addColorStop(1, "#040309");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 80; i += 1) {
    const x = ((i * 173 + 30 - camera * (0.05 + (i % 3) * 0.025)) % 1560 + 1560) % 1560 - 140;
    const y = hash(i + 11) * 690;
    const alpha = 0.08 + hash(i + 3) * 0.33;
    ctx.fillStyle = i % 13 === 0 ? `rgba(255, 166, 193, ${alpha})` : `rgba(221, 214, 255, ${alpha})`;
    ctx.fillRect(x, y, i % 17 === 0 ? 2 : 1, i % 17 === 0 ? 2 : 1);
  }

  const haloX = 1430 - camera;
  const haloY = 300;
  const halo = ctx.createRadialGradient(haloX, haloY, 20, haloX, haloY, 540);
  halo.addColorStop(0, "rgba(255, 100, 145, 0.16)");
  halo.addColorStop(0.4, "rgba(167, 94, 255, 0.07)");
  halo.addColorStop(1, "rgba(167, 94, 255, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(-(camera % 120), 0);
  ctx.strokeStyle = "rgba(255, 150, 183, 0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w + 120; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 80, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w + 120, y);
    ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 4; i += 1) {
    const x = ((i * 415 + 230 - camera * 0.2) % 1980 + 1980) % 1980 - 300;
    const y = 80 + hash(i + 6) * 260;
    const cw = 80 + hash(i + 9) * 160;
    const ch = 220 + hash(i) * 300;
    ctx.fillStyle = "rgba(8, 3, 11, 0.55)";
    polygon(ctx, [[x, y], [x + cw, y + ch * 0.2], [x + cw * 0.65, y + ch], [x - cw * 0.3, y + ch * 0.66]]);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 120, 160, 0.06)";
    ctx.stroke();
  }

  const floorGlow = ctx.createLinearGradient(0, 500, 0, 720);
  floorGlow.addColorStop(0, "rgba(159, 53, 122, 0)");
  floorGlow.addColorStop(1, "rgba(207, 71, 132, 0.12)");
  ctx.fillStyle = floorGlow;
  ctx.fillRect(0, 480, w, 240);

  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 276 + 80 - camera * 0.45) % 1820 + 1820) % 1820 - 260;
    const y = 140 + hash(i + 12) * 420 + Math.sin(t * 0.45 + i) * 12;
    ctx.fillStyle = `rgba(255, 151, 181, ${0.05 + hash(i) * 0.08})`;
    ctx.fillRect(x, y, 45 + hash(i + 2) * 90, 1);
  }
}

export function drawForeground(ctx, level, camera, t) {
  const p = makePalette(level);
  const w = 1280;
  ctx.save();
  if (level.bossFight) {
    ctx.globalAlpha = 0.14 + Math.sin(t * 0.7) * 0.03;
    ctx.fillStyle = "rgba(255, 130, 170, 0.2)";
    for (let i = 0; i < 5; i += 1) {
      const y = 70 + i * 155 + Math.sin(t * 0.65 + i) * 7;
      const offset = (camera * 0.6 + i * 170) % w;
      ctx.fillRect(offset, y, 70 + hash(i) * 160, 1);
    }
  } else if (level.theme === "python") {
    ctx.fillStyle = "rgba(2, 11, 7, 0.52)";
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.bezierCurveTo(30, 650, 60, 683, 86, 608);
    ctx.bezierCurveTo(104, 680, 146, 668, 176, 720);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, 720);
    ctx.bezierCurveTo(w - 44, 664, w - 80, 690, w - 112, 610);
    ctx.bezierCurveTo(w - 130, 673, w - 172, 662, w - 196, 720);
    ctx.closePath();
    ctx.fill();
  } else if (level.theme === "c") {
    const haze = ctx.createLinearGradient(0, 630, 0, 720);
    haze.addColorStop(0, "rgba(255, 115, 46, 0)");
    haze.addColorStop(1, "rgba(255, 126, 52, 0.12)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 620, w, 100);
  } else {
    const haze = ctx.createLinearGradient(0, 600, 0, 720);
    haze.addColorStop(0, "rgba(172, 235, 255, 0)");
    haze.addColorStop(1, "rgba(188, 239, 255, 0.07)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 590, w, 130);
  }
  ctx.restore();
}

/* ------------------------------------------------------------
   Platform geometry
   ------------------------------------------------------------ */
export function drawPlatform(ctx, platform, level, t) {
  const p = makePalette(level);
  const { x, y, w, h, style } = platform;
  const isGround = style === "ground" || (h >= 60 && style !== "void");
  const topColor = style === "void" ? "#4a2848" : p.groundTop;
  const bodyColor = style === "void" ? "#1a0d1e" : p.ground;
  const deepColor = style === "void" ? "#07040b" : p.groundDeep;

  ctx.save();

  const shadow = ctx.createLinearGradient(0, y + h, 0, y + h + 40);
  shadow.addColorStop(0, "rgba(0, 0, 0, 0.34)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(x + 8, y + h, Math.max(0, w - 16), 44);

  const body = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 170));
  body.addColorStop(0, bodyColor);
  body.addColorStop(0.18, style === "void" ? "#211125" : p.stone);
  body.addColorStop(1, deepColor);

  if (isGround) {
    ctx.fillStyle = body;
    ctx.fillRect(x, y + 8, w, h - 8);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const sx = x + hash(x + i) * w;
      const sy = y + 22 + hash(y + i) * (h - 28);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 14 + hash(i) * 30, sy + (hash(i + 2) - 0.5) * 16);
      ctx.stroke();
    }
  } else {
    const depth = 20 + Math.min(36, h * 0.6);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + w, y + 8);
    ctx.lineTo(x + w, y + h);
    for (let i = 4; i >= 1; i -= 1) {
      const px = x + (w / 4) * i;
      const py = y + h + (i % 2 === 0 ? depth * (0.35 + hash(x + i) * 0.7) : 3);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (style === "void") {
      ctx.strokeStyle = rgba(p.accent, 0.12);
      for (let i = 0; i < 2; i += 1) {
        const cx = x + w * (0.26 + i * 0.44);
        ctx.beginPath();
        ctx.moveTo(cx, y + 14);
        ctx.lineTo(cx + 8, y + 24);
        ctx.lineTo(cx + 2, y + 34);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = topColor;
  ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = rgba(p.accent, isGround ? 0.34 : 0.55);
  ctx.fillRect(x, y, w, 1.5);
  ctx.fillStyle = rgba("#ffffff", 0.13);
  ctx.fillRect(x + 2, y + 1.5, Math.max(0, w - 4), 1);

  for (let i = 0; i < Math.floor(w / 46); i += 1) {
    const px = x + 12 + hash(x + i * 19) * Math.max(1, w - 24);
    const sprout = hash(x + i * 7);
    if (level.theme === "python" || level.bossFight) {
      const height = 3 + sprout * 8;
      ctx.strokeStyle = rgba(p.accent, 0.23 + sprout * 0.24);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + 2, y - height * 0.7, px + 5 + sprout * 3, y - height);
      ctx.stroke();
    } else if (level.theme === "c" && sprout > 0.55) {
      ctx.fillStyle = rgba(p.accent, 0.25 + sprout * 0.4);
      ctx.fillRect(px, y - 2 - sprout * 4, 1.5, 3 + sprout * 4);
    } else if (level.theme === "java" && sprout > 0.7) {
      ctx.fillStyle = rgba(p.accent, 0.5);
      ctx.beginPath();
      ctx.arc(px, y - 1, 1.2, 0, TAU);
      ctx.fill();
    }
  }

  if (isGround) {
    ctx.strokeStyle = rgba(p.stoneEdge, 0.12);
    ctx.lineWidth = 1;
    const roots = Math.floor(w / 82);
    for (let i = 0; i < roots; i += 1) {
      const rx = x + 20 + hash(x + i * 11) * (w - 40);
      const len = 16 + hash(i + x) * 56;
      ctx.beginPath();
      ctx.moveTo(rx, y + 10);
      ctx.bezierCurveTo(rx - 6, y + len * 0.4, rx + 8, y + len * 0.7, rx - 3, y + len);
      ctx.stroke();
    }
  } else if (level.theme === "java") {
    ctx.fillStyle = rgba(p.accent2, 0.12);
    ctx.fillRect(x + w * 0.16, y + 9, w * 0.22, 1);
    ctx.fillStyle = rgba(p.accent, 0.1);
    ctx.fillRect(x + w * 0.58, y + 10, w * 0.18, 1);
  }

  ctx.restore();
}

export function drawSpike(ctx, spike, level, t) {
  const p = makePalette(level);
  const { x, y, w, h, style } = spike;
  const count = Math.max(1, Math.round(w / 17));
  const wedge = w / count;
  ctx.save();
  const base = ctx.createLinearGradient(0, y + h - 6, 0, y + h + 2);
  base.addColorStop(0, "rgba(12, 7, 10, 0.72)");
  base.addColorStop(1, "rgba(12, 7, 10, 0)");
  ctx.fillStyle = base;
  ctx.fillRect(x - 5, y + h - 4, w + 10, 9);

  for (let i = 0; i < count; i += 1) {
    const sx = x + i * wedge;
    const peak = 8 + hash(x + i * 6.3) * (h - 10);
    const grad = ctx.createLinearGradient(sx, y + h, sx, y + h - peak);
    grad.addColorStop(0, level.bossFight ? "#3d1527" : "#1a2120");
    grad.addColorStop(0.55, rgba(p.danger, 0.75));
    grad.addColorStop(1, "#ffe0e5");
    polygon(ctx, [[sx + 1, y + h], [sx + wedge / 2, y + h - peak], [sx + wedge - 1, y + h]]);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  if (style === "rune" || level.bossFight) {
    ctx.globalAlpha = 0.65 + Math.sin(t * 2.5 + x) * 0.2;
    ctx.strokeStyle = rgba(p.accent, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h + 1);
    ctx.lineTo(x + w - 3, y + h + 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawSpring(ctx, spring, level, t) {
  const p = makePalette(level);
  const { x, y, w, h } = spring;
  const squash = 1 + Math.sin(t * 3.4 + x) * 0.06;
  ctx.save();
  const under = ctx.createRadialGradient(x + w / 2, y + h, 2, x + w / 2, y + h, 46);
  under.addColorStop(0, rgba(p.accent, 0.18));
  under.addColorStop(1, rgba(p.accent, 0));
  ctx.fillStyle = under;
  ctx.fillRect(x + w / 2 - 50, y + h - 6, 100, 50);
  for (let i = 0; i < 3; i += 1) {
    const yy = y + h - i * 5;
    ctx.strokeStyle = rgba(p.accent, 0.38 - i * 0.08);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.bezierCurveTo(x + w * 0.25, yy - 7, x + w * 0.75, yy + 6, x + w - 8, yy);
    ctx.stroke();
  }
  ctx.fillStyle = p.accent;
  roundRect(ctx, x + 2, y - 3, w - 4, 7 * squash, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.38)";
  ctx.fillRect(x + 7, y - 2, w - 14, 1);
  ctx.fillStyle = rgba(p.accent, 0.7);
  polygon(ctx, [[x + w / 2 - 5, y - 15], [x + w / 2, y - 23], [x + w / 2 + 5, y - 15]]);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------
   Collectibles, terminals, gates
   ------------------------------------------------------------ */
export function drawBit(ctx, item, level, t) {
  const p = makePalette(level);
  const bob = Math.sin(t * 2 + item.x * 0.05) * 4;
  const x = item.x;
  const y = item.y + bob;
  ctx.save();
  ctx.globalAlpha = 0.65 + Math.sin(t * 3 + item.x) * 0.15;
  ctx.fillStyle = rgba(p.accent, 0.08);
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, TAU);
  ctx.fill();
  ctx.translate(x, y);
  ctx.rotate(t * 0.9 + item.x * 0.01);
  ctx.fillStyle = rgba(p.accent, 0.8);
  ctx.fillRect(-3.5, -3.5, 7, 7);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-3.5, -3.5, 7, 7);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

export function drawCore(ctx, item, level, t, collected = false) {
  const p = makePalette(level);
  const bob = Math.sin(t * 1.6 + item.x * 0.02) * 6;
  const x = item.x;
  const y = item.y + bob;
  ctx.save();
  if (collected) ctx.globalAlpha = 0.22;
  const halo = ctx.createRadialGradient(x, y, 2, x, y, 45);
  halo.addColorStop(0, rgba(p.accent, collected ? 0.1 : 0.3));
  halo.addColorStop(0.4, rgba(p.accent, 0.08));
  halo.addColorStop(1, rgba(p.accent, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - 46, y - 46, 92, 92);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.45);
  ctx.strokeStyle = rgba(p.accent, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 8, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 21, 0, 0, TAU);
  ctx.stroke();
  ctx.rotate(-t * 0.9);
  ctx.fillStyle = rgba(p.accent2, 0.22);
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(15, 0);
  ctx.lineTo(0, 17);
  ctx.lineTo(-15, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(p.accent, 0.9);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  const sparks = 3;
  for (let i = 0; i < sparks; i += 1) {
    const a = t * 1.4 + (TAU / sparks) * i;
    const r = 27 + Math.sin(t * 2 + i) * 3;
    ctx.fillStyle = rgba(p.accent, 0.45);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 1.3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCheckpoint(ctx, checkpoint, level, t, active) {
  const p = makePalette(level);
  const { x, y } = checkpoint;
  ctx.save();
  const accent = active ? p.accent : "rgba(255, 255, 255, 0.22)";
  const glow = ctx.createRadialGradient(x, y - 45, 2, x, y - 45, active ? 62 : 26);
  glow.addColorStop(0, rgba(active ? p.accent : "#8fa69b", active ? 0.23 : 0.05));
  glow.addColorStop(1, rgba(p.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - 66, y - 112, 132, 124);

  ctx.strokeStyle = active ? rgba(p.accent, 0.3) : "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 78);
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y - 59);
  ctx.rotate(t * 0.7);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = active ? 0.8 : 0.32;
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.rotate(-t * 1.1);
  ctx.fillStyle = active ? rgba(p.accent, 0.6) : "rgba(255, 255, 255, 0.14)";
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 4);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = active ? p.accent : "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x - 7, y - 2, 14, 3);
  drawText(ctx, active ? "SYNC" : "CHECKPOINT", x, y - 94, {
    size: 6,
    color: active ? rgba(p.accent, 0.8) : "rgba(255, 255, 255, 0.28)",
    weight: 600
  });
  ctx.restore();
}

export function drawTerminal(ctx, terminal, level, t, { solved = false, boss = false, shell = 0 } = {}) {
  const p = makePalette(level);
  const { x, y } = terminal;
  const screenColor = boss ? "#ff8eac" : solved ? "#91f3b8" : p.accent;
  const pulse = 0.5 + Math.sin(t * 2.2) * 0.24;
  ctx.save();
  const aura = ctx.createRadialGradient(x, y - 50, 2, x, y - 50, 82);
  aura.addColorStop(0, rgba(screenColor, 0.17 + pulse * 0.1));
  aura.addColorStop(1, rgba(screenColor, 0));
  ctx.fillStyle = aura;
  ctx.fillRect(x - 86, y - 140, 172, 170);

  ctx.fillStyle = "rgba(3, 9, 7, 0.7)";
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 31, 7, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = rgba(p.accent, 0.24);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 21);
  ctx.lineTo(x - 20, y + 2);
  ctx.moveTo(x + 13, y - 21);
  ctx.lineTo(x + 20, y + 2);
  ctx.stroke();

  ctx.fillStyle = "#0d1b15";
  roundRect(ctx, x - 30, y - 56, 60, 38, 3);
  ctx.fill();
  ctx.strokeStyle = rgba(screenColor, 0.55);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#040c08";
  ctx.fillRect(x - 25, y - 52, 50, 29);
  ctx.fillStyle = rgba(screenColor, 0.1);
  ctx.fillRect(x - 25, y - 52, 50, 29);
  ctx.fillStyle = screenColor;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x - 20, y - 45, 20 + (solved ? 16 : Math.sin(t * 1.5) * 7), 1);
  ctx.fillRect(x - 20, y - 40, 29, 1);
  ctx.fillRect(x - 20, y - 35, 12 + Math.sin(t * 2.6) * 5, 1);
  ctx.fillRect(x - 20, y - 30, 23, 1);
  ctx.globalAlpha = 1;

  ctx.fillStyle = Math.floor(t * 2) % 2 === 0 ? screenColor : "transparent";
  ctx.fillRect(x + 4, y - 30, 4, 5);

  ctx.fillStyle = "#15251d";
  ctx.fillRect(x - 7, y - 20, 14, 9);
  ctx.fillStyle = rgba(screenColor, 0.5);
  ctx.fillRect(x - 3, y - 17, 6, 1);

  ctx.fillStyle = boss ? "rgba(255, 142, 172, 0.75)" : solved ? "rgba(145, 243, 184, 0.75)" : rgba(p.accent, 0.7);
  ctx.beginPath();
  ctx.arc(x, y - 65, 2.4, 0, TAU);
  ctx.fill();
  if (!solved) {
    ctx.strokeStyle = rgba(screenColor, 0.35 + pulse * 0.25);
    ctx.beginPath();
    ctx.arc(x, y - 65, 7 + pulse * 5, -0.6, 2.4);
    ctx.stroke();
  }

  const label = boss ? `SHELL ${Math.min(shell + 1, 3)} / 3` : solved ? "COMPILED" : terminal.label;
  drawText(ctx, label, x, y - 88, { size: 8, color: solved ? "#b7ffd1" : boss ? "#ffc0d0" : p.edge, weight: 500, mono: false });
  if (boss) {
    drawText(ctx, "NULL LINK ACTIVE", x, y - 77, { size: 5, color: rgba(p.danger, 0.55), weight: 500 });
  }
  ctx.restore();
}

export function drawDoor(ctx, door, level, t, { open = false } = {}) {
  const p = makePalette(level);
  const { x, y } = door;
  const gateH = 122;
  const gateW = 65;
  const left = x - gateW / 2;
  const top = y - gateH;
  ctx.save();
  const aura = ctx.createRadialGradient(x, y - gateH / 2, 4, x, y - gateH / 2, 90);
  aura.addColorStop(0, rgba(open ? p.accent : p.danger, open ? 0.28 : 0.07));
  aura.addColorStop(1, rgba(p.accent, 0));
  ctx.fillStyle = aura;
  ctx.fillRect(x - 105, top - 70, 210, 220);

  ctx.fillStyle = open ? rgba(p.accent, 0.17) : "rgba(2, 6, 4, 0.8)";
  roundRect(ctx, left + 7, top + 9, gateW - 14, gateH - 9, 30);
  ctx.fill();

  if (open) {
    const portal = ctx.createLinearGradient(0, top, 0, y);
    portal.addColorStop(0, rgba(p.accent, 0.06));
    portal.addColorStop(0.55, rgba(p.accent, 0.32));
    portal.addColorStop(1, rgba(p.accent2, 0.25));
    roundRect(ctx, left + 10, top + 13, gateW - 20, gateH - 19, 26);
    ctx.fillStyle = portal;
    ctx.fill();
    ctx.strokeStyle = rgba(p.accent, 0.5);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      const rr = 9 + i * 8 + Math.sin(t * 1.8 + i) * 2;
      ctx.beginPath();
      ctx.arc(x, top + gateH * 0.52, rr, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i += 1) {
      const a = t * 0.8 + (TAU / 5) * i;
      ctx.fillStyle = rgba(p.accent, 0.5);
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 24, top + gateH * 0.52 + Math.sin(a) * 31, 1.3, 0, TAU);
      ctx.fill();
    }
  }

  ctx.strokeStyle = rgba(open ? p.accent : p.stoneEdge, 0.48);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left, top + 28);
  ctx.quadraticCurveTo(x, top - 8, x + gateW / 2, top + 28);
  ctx.lineTo(x + gateW / 2, y);
  ctx.stroke();

  ctx.strokeStyle = rgba(p.accent, open ? 0.25 : 0.1);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left - 2, y);
  ctx.lineTo(left - 2, top + 28);
  ctx.quadraticCurveTo(x, top - 12, x + gateW / 2 + 2, top + 28);
  ctx.lineTo(x + gateW / 2 + 2, y);
  ctx.stroke();

  if (level.theme === "python") {
    ctx.strokeStyle = "rgba(121, 208, 149, 0.3)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const vx = left + 4 + hash(i + x) * (gateW - 8);
      ctx.beginPath();
      ctx.moveTo(vx, top + 20 + hash(i) * 30);
      ctx.bezierCurveTo(vx + 12, top + 50, vx - 9, top + 72, vx + 4, y - 4);
      ctx.stroke();
      ctx.fillStyle = "rgba(121, 220, 160, 0.26)";
      ctx.beginPath();
      ctx.ellipse(vx + 4, top + 54 + hash(i + 2) * 30, 4, 2, 0.3, 0, TAU);
      ctx.fill();
    }
  } else if (level.theme === "c") {
    ctx.fillStyle = "rgba(255, 170, 88, 0.55)";
    for (let i = 0; i < 5; i += 1) {
      ctx.fillRect(left + 3, top + 34 + i * 16, gateW - 6, 2);
    }
    ctx.strokeStyle = "rgba(255, 160, 80, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 34, top + 20);
    ctx.lineTo(x + 32, y - 12);
    ctx.stroke();
  } else if (level.theme === "java") {
    ctx.strokeStyle = "rgba(183, 231, 255, 0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      ctx.strokeRect(left + 5 + i * 7, top + 33 + i * 13, gateW - 10 - i * 14, 6);
    }
  }

  if (!open) {
    ctx.fillStyle = "#0c0b0d";
    roundRect(ctx, x - 15, top + 56, 30, 36, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 130, 149, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 130, 149, 0.8)";
    ctx.beginPath();
    ctx.arc(x, top + 71, 5, 0, TAU);
    ctx.fill();
    ctx.fillRect(x - 1.5, top + 73, 3, 8);
    ctx.strokeStyle = "rgba(255, 130, 149, 0.26)";
    ctx.beginPath();
    ctx.moveTo(left - 4, top + 55);
    ctx.lineTo(x + gateW / 2 + 4, top + 86);
    ctx.moveTo(x + gateW / 2 + 4, top + 55);
    ctx.lineTo(left - 4, top + 86);
    ctx.stroke();
  }

  drawText(ctx, open ? "COMPILE GATE / OPEN" : door.label || "COMPILE GATE", x, top - 18, {
    size: 7,
    color: open ? rgba(p.accent, 0.9) : "rgba(255, 180, 196, 0.55)",
    weight: 500,
    mono: false
  });
  ctx.restore();
}

/* ------------------------------------------------------------
   Characters & creatures
   ------------------------------------------------------------ */
export function drawPlayer(ctx, player, level, t) {
  const p = makePalette(level);
  const { x, y, w, h, facing, vx, vy, grounded, invuln, doubleJumped } = player;
  if (invuln > 0 && Math.floor(t * 18) % 2 === 0) return;

  const cx = x + w / 2;
  const baseY = y + h;
  const running = grounded && Math.abs(vx) > 25;
  const stride = running ? Math.sin(t * 15) : 0;
  const bob = grounded ? (running ? Math.abs(Math.sin(t * 15)) * 1.4 : Math.sin(t * 2.2) * 0.7) : 0;
  ctx.save();
  ctx.translate(cx, baseY - bob);
  ctx.scale(facing, 1);

  const bodyTop = -38;
  const bodyBottom = -14;

  if (grounded) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.27)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 4, 0, 0, TAU);
    ctx.fill();
  }

  if (!grounded) {
    ctx.strokeStyle = rgba(p.accent, 0.16);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(-12, 21);
    ctx.moveTo(7, 4);
    ctx.lineTo(10, 18);
    ctx.stroke();
  }

  ctx.strokeStyle = "#243a30";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  if (grounded) {
    ctx.beginPath();
    ctx.moveTo(-6, bodyBottom);
    ctx.lineTo(-7 + stride * 6, 0);
    ctx.moveTo(6, bodyBottom);
    ctx.lineTo(7 - stride * 6, 0);
    ctx.stroke();
    ctx.strokeStyle = "#0c1712";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-7 + stride * 6, 0);
    ctx.lineTo(-3 + stride * 7, 0);
    ctx.moveTo(7 - stride * 6, 0);
    ctx.lineTo(11 - stride * 7, 0);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, bodyBottom);
    ctx.lineTo(-9, -6 + Math.min(4, vy * 0.01));
    ctx.moveTo(6, bodyBottom);
    ctx.lineTo(10, -7 + Math.min(4, vy * 0.01));
    ctx.stroke();
  }

  ctx.fillStyle = "#16271f";
  ctx.beginPath();
  ctx.moveTo(-11, bodyBottom);
  ctx.quadraticCurveTo(-15, bodyTop + 5, -13, bodyTop);
  ctx.quadraticCurveTo(0, bodyTop - 4, 13, bodyTop);
  ctx.quadraticCurveTo(15, bodyTop + 6, 11, bodyBottom);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(p.accent, 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = rgba(p.accent, 0.65);
  ctx.fillRect(-10, bodyBottom - 5, 20, 2);
  ctx.fillStyle = rgba(p.accent, 0.17);
  ctx.fillRect(-3, bodyTop + 3, 6, 15);
  ctx.fillStyle = rgba(p.accent2, 0.5);
  ctx.fillRect(-9, bodyTop + 4, 2, 2);

  ctx.strokeStyle = "#13231c";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const armSwing = grounded ? -stride * 5 : -6;
  ctx.beginPath();
  ctx.moveTo(-11, bodyTop + 7);
  ctx.lineTo(-15, bodyTop + 17 + armSwing);
  ctx.moveTo(11, bodyTop + 7);
  ctx.lineTo(15, bodyTop + 17 - armSwing);
  ctx.stroke();
  ctx.fillStyle = "#d6c5ad";
  ctx.beginPath();
  ctx.arc(-15, bodyTop + 18 + armSwing, 2.1, 0, TAU);
  ctx.arc(15, bodyTop + 18 - armSwing, 2.1, 0, TAU);
  ctx.fill();

  const headY = bodyTop - 8;
  ctx.fillStyle = "#cbb69e";
  ctx.beginPath();
  ctx.arc(0, headY, 9, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#263a30";
  ctx.beginPath();
  ctx.arc(0, headY - 1, 9.4, Math.PI * 1.04, Math.PI * 2.02);
  ctx.quadraticCurveTo(5, headY - 9, 0, headY - 10);
  ctx.quadraticCurveTo(-8, headY - 10, -9.4, headY + 1);
  ctx.fill();

  ctx.fillStyle = "#0c1411";
  ctx.fillRect(-7, headY - 4, 14, 3.2);
  ctx.fillStyle = rgba(p.accent, 0.95);
  ctx.fillRect(-5.5, headY - 3.4, 4, 2);
  ctx.fillRect(1.5, headY - 3.4, 4, 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(-4.7, headY - 3, 1, 1);
  ctx.fillRect(2.3, headY - 3, 1, 1);

  ctx.strokeStyle = "rgba(20, 14, 11, 0.65)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-2, headY + 4);
  ctx.lineTo(3, headY + 4);
  ctx.stroke();

  ctx.fillStyle = rgba(p.accent2, 0.85);
  ctx.beginPath();
  ctx.moveTo(-8, headY + 7);
  ctx.quadraticCurveTo(-15 - Math.abs(vx) * 0.02, headY + 11 + Math.sin(t * 7) * 2, -17 - Math.abs(vx) * 0.025, headY + 17);
  ctx.lineTo(-12, headY + 15);
  ctx.quadraticCurveTo(-12, headY + 10, -6, headY + 9);
  ctx.closePath();
  ctx.fill();

  if (doubleJumped && !grounded) {
    ctx.strokeStyle = rgba(p.accent, 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -6, 19, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBug(ctx, bug, level, t) {
  const p = makePalette(level);
  if (bug.dead) return;
  const tint = bug.tint || p.danger;
  const cx = bug.x + bug.w / 2;
  const baseY = bug.y + bug.h;
  const wiggle = Math.sin(t * 8 + bug.x * 0.04);
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, bug.w * 0.43, 4, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const lx = cx - 10 + i * 10;
    const off = i % 2 ? wiggle * 3 : -wiggle * 3;
    ctx.beginPath();
    ctx.moveTo(lx, baseY - 9);
    ctx.quadraticCurveTo(lx + off, baseY - 3, lx + 2 + off * 0.4, baseY + 1);
    ctx.stroke();
  }

  ctx.fillStyle = "#111d19";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 15, bug.w * 0.5, bug.h * 0.4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = rgba(tint, 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = rgba(tint, 0.2);
  ctx.beginPath();
  ctx.ellipse(cx + bug.dir * 3, baseY - 17, bug.w * 0.28, bug.h * 0.19, 0, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 8, baseY - 19);
  ctx.lineTo(cx + 8, baseY - 19);
  ctx.stroke();

  const eyeX = cx + bug.dir * 11;
  const eyeY = baseY - 22;
  ctx.fillStyle = "#f6fff9";
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 3.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#101b16";
  ctx.beginPath();
  ctx.arc(eyeX + bug.dir * 1.1, eyeY + 0.3, 1.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(tint, 0.55);
  ctx.beginPath();
  ctx.arc(eyeX - bug.dir * 1, eyeY - 1, 0.7, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = rgba(tint, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - bug.dir * 20, baseY - 23);
  ctx.lineTo(cx - bug.dir * 27, baseY - 29 + wiggle * 2);
  ctx.stroke();
  ctx.fillStyle = rgba(tint, 0.45);
  ctx.beginPath();
  ctx.arc(cx - bug.dir * 27, baseY - 29 + wiggle * 2, 1.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawNpc(ctx, npc, level, t, { nearby = false, visited = false } = {}) {
  const p = makePalette(level);
  const { x, y, kind, color, name } = npc;
  const bob = Math.sin(t * 1.7 + x) * 2;
  ctx.save();

  const halo = ctx.createRadialGradient(x, y - 30, 2, x, y - 30, 55);
  halo.addColorStop(0, rgba(color, nearby ? 0.2 : 0.1));
  halo.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(x - 58, y - 88, 116, 94);

  if (nearby) {
    ctx.strokeStyle = rgba(color, 0.24 + Math.sin(t * 3) * 0.08);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 32 + Math.sin(t * 2.2) * 3, 7, 0, 0, TAU);
    ctx.stroke();
  }

  ctx.translate(x, y + bob);

  if (kind === "snake") {
    ctx.strokeStyle = "#4e9366";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-20, -4);
    ctx.bezierCurveTo(-28, -20, 18, -23, 14, -39);
    ctx.bezierCurveTo(12, -48, 3, -49, -2, -55);
    ctx.stroke();
    ctx.strokeStyle = rgba(p.accent, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.bezierCurveTo(-23, -18, 8, -22, 10, -36);
    ctx.stroke();
    ctx.fillStyle = "#2f5a3f";
    ctx.beginPath();
    ctx.arc(-3, -56, 7.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d5ffce";
    ctx.beginPath();
    ctx.arc(0, -57, 1.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#8c3e4c";
    ctx.beginPath();
    ctx.moveTo(2, -51);
    ctx.lineTo(5, -47);
    ctx.lineTo(-1, -49);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(-9, -2, 25, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#8dcf9f";
    ctx.beginPath();
    ctx.ellipse(-28, -30, 4, 6, -0.5, 0, TAU);
    ctx.fill();
  } else if (kind === "frog") {
    ctx.fillStyle = "#78ae5a";
    ctx.beginPath();
    ctx.ellipse(0, -16, 19, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#a2d474";
    ctx.beginPath();
    ctx.ellipse(-4, -21, 13, 9, -0.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#e8f7d6";
    ctx.beginPath();
    ctx.arc(-8, -30, 5, 0, TAU);
    ctx.arc(7, -30, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#253318";
    ctx.beginPath();
    ctx.arc(-8, -30, 2, 0, TAU);
    ctx.arc(7, -30, 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#38552c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.fillStyle = "#5e8f48";
    ctx.beginPath();
    ctx.ellipse(-16, -4, 9, 4, -0.3, 0, TAU);
    ctx.ellipse(16, -4, 9, 4, 0.3, 0, TAU);
    ctx.fill();
  } else if (kind === "goblin") {
    ctx.fillStyle = "#54412d";
    ctx.beginPath();
    ctx.ellipse(0, -20, 17, 19, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#725c40";
    ctx.beginPath();
    ctx.ellipse(-2, -29, 13, 10, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d1ab76";
    ctx.beginPath();
    ctx.arc(-6, -31, 2, 0, TAU);
    ctx.arc(6, -31, 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#d1ab76";
    polygon(ctx, [[-14, -18], [-22, -25], [-15, -12]]);
    ctx.fill();
    polygon(ctx, [[13, -18], [21, -25], [14, -12]]);
    ctx.fill();
    ctx.fillStyle = "#39301f";
    roundRect(ctx, -13, -44, 26, 8, 3);
    ctx.fill();
    ctx.fillStyle = "#ffd477";
    ctx.beginPath();
    ctx.arc(-5, -45, 2.5, 0, TAU);
    ctx.fill();
    const lamp = ctx.createRadialGradient(-5, -45, 1, -5, -45, 45);
    lamp.addColorStop(0, "rgba(255, 210, 120, 0.4)");
    lamp.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(-50, -90, 90, 90);
    ctx.fillStyle = "#3d2e20";
    ctx.beginPath();
    ctx.ellipse(0, -5, 17, 5, 0, 0, TAU);
    ctx.fill();
  } else if (kind === "ghost") {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "rgba(180, 205, 230, 0.28)";
    ctx.beginPath();
    ctx.moveTo(-16, -16);
    ctx.quadraticCurveTo(-20, -54, 0, -55);
    ctx.quadraticCurveTo(20, -54, 16, -16);
    for (let i = 0; i < 4; i += 1) {
      const gx = 16 - i * 11;
      ctx.quadraticCurveTo(gx - 5, -7 + Math.sin(t * 3 + i) * 4, gx - 11, -16);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(195, 229, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#dff5ff";
    ctx.beginPath();
    ctx.arc(-6, -38, 2.5, 0, TAU);
    ctx.arc(6, -38, 2.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(215, 242, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -28);
    ctx.quadraticCurveTo(0, -24, 6, -28);
    ctx.stroke();
    ctx.fillStyle = "rgba(140, 170, 200, 0.18)";
    ctx.fillRect(-22, -50, 44, 2);
    ctx.fillStyle = "rgba(160, 197, 230, 0.25)";
    ctx.fillRect(-14, -59, 1.5, 8);
  } else if (kind === "mage") {
    ctx.fillStyle = "#344c62";
    polygon(ctx, [[-19, -3], [-11, -40], [11, -40], [20, -3]]);
    ctx.fill();
    ctx.fillStyle = "#9ac2d8";
    ctx.fillRect(-14, -31, 28, 2);
    ctx.fillStyle = "#cbb69e";
    ctx.beginPath();
    ctx.arc(0, -49, 9.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#20384b";
    ctx.beginPath();
    ctx.arc(0, -52, 10, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(-10, -54, 20, 3);
    ctx.fillStyle = "#0b1217";
    ctx.fillRect(-6, -51, 12, 2.5);
    ctx.fillStyle = "#b5e8ff";
    ctx.fillRect(-5, -50.4, 3, 1.2);
    ctx.fillRect(2, -50.4, 3, 1.2);
    ctx.strokeStyle = "#7f9db0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(13, -31);
    ctx.lineTo(24, -39);
    ctx.stroke();
    ctx.fillStyle = "#d8eaf3";
    roundRect(ctx, 20, -45, 12, 11, 2);
    ctx.fill();
    ctx.strokeStyle = "#8baabb";
    ctx.beginPath();
    ctx.arc(28, -38, 3.5, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(207, 238, 255, 0.35)";
    ctx.beginPath();
    ctx.arc(26, -43, 1.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#253c4d";
    ctx.beginPath();
    ctx.ellipse(0, -2, 19, 4, 0, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(159, 214, 255, 0.24)";
    polygon(ctx, [[-22, -2], [-12, -48], [12, -48], [23, -2]]);
    ctx.fill();
    ctx.strokeStyle = "rgba(195, 231, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(226, 241, 255, 0.24)";
    ctx.beginPath();
    ctx.arc(0, -48, 17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#dce9f4";
    ctx.beginPath();
    ctx.arc(0, -54, 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#344c66";
    ctx.beginPath();
    ctx.arc(0, -56, 9.5, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = "#819bb1";
    ctx.fillRect(-7, -55, 14, 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(-4, -54.4, 3, 1);
    ctx.fillRect(2, -54.4, 3, 1);
    ctx.strokeStyle = "rgba(211, 240, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(0, -62);
    ctx.stroke();
    ctx.strokeStyle = "rgba(190, 230, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, -73, 18, 5, -0.2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = "rgba(190, 230, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(-12, -76, 1.2, 0, TAU);
    ctx.arc(9, -76, 1.2, 0, TAU);
    ctx.fill();
  }

  ctx.restore();

  drawText(ctx, name, x, y - (kind === "oracle" ? 94 : kind === "ghost" ? 76 : 70), {
    size: 8,
    color: "rgba(232, 245, 236, 0.72)",
    weight: 500,
    mono: false
  });

  if (!visited) {
    const markerY = y - (kind === "oracle" ? 105 : kind === "ghost" ? 88 : 82) + Math.sin(t * 2.5) * 2;
    ctx.save();
    ctx.fillStyle = rgba(color, 0.85);
    ctx.beginPath();
    ctx.moveTo(x + 22, markerY - 5);
    ctx.lineTo(x + 27, markerY);
    ctx.lineTo(x + 22, markerY + 5);
    ctx.lineTo(x + 17, markerY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#06130d";
    ctx.font = '600 6px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x + 22, markerY + 0.5);
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   Boss
   ------------------------------------------------------------ */
export function drawBoss(ctx, level, camera, t, state = {}) {
  if (!level.bossFight) return;
  const hp = state.hp ?? level.bossFight.maxHp ?? 3;
  const maxHp = level.bossFight.maxHp ?? 3;
  const defeated = state.defeated || hp <= 0;
  const x = 1440 - camera;
  const y = 287;
  const open = defeated ? 0 : 1;
  const pulse = Math.sin(t * 1.1) * 0.5 + 0.5;
  ctx.save();

  if (x < -600) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha = defeated ? 0.32 : 1;
  const aura = ctx.createRadialGradient(x, y, 18, x, y, 330);
  aura.addColorStop(0, `rgba(255, 123, 163, ${0.16 + pulse * 0.06})`);
  aura.addColorStop(0.4, "rgba(177, 83, 255, 0.07)");
  aura.addColorStop(1, "rgba(177, 83, 255, 0)");
  ctx.fillStyle = aura;
  ctx.fillRect(x - 340, y - 340, 680, 680);

  for (let i = 0; i < 9; i += 1) {
    const a = (TAU / 9) * i + t * 0.06;
    const len = 185 + Math.sin(t * 0.7 + i) * 35;
    const x1 = x + Math.cos(a) * 150;
    const y1 = y + Math.sin(a) * 125;
    const x2 = x + Math.cos(a + 0.12) * len;
    const y2 = y + Math.sin(a + 0.12) * (len * 0.8);
    ctx.strokeStyle = i % 2 ? "rgba(255, 128, 166, 0.15)" : "rgba(171, 133, 255, 0.11)";
    ctx.lineWidth = 1 + (i % 3) * 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(x1 + Math.cos(a + 0.5) * 40, y1 + Math.sin(a + 0.5) * 40, x2, y2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 151, 181, 0.24)";
    ctx.beginPath();
    ctx.arc(x2, y2, 1 + (i % 3), 0, TAU);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 0.24) * 0.05);
  for (let i = maxHp; i > 0; i -= 1) {
    const rr = 82 + i * 36;
    const broken = i > hp;
    ctx.strokeStyle = broken ? "rgba(255, 255, 255, 0.04)" : `rgba(255, 138, 174, ${0.12 + (maxHp - i) * 0.045})`;
    ctx.lineWidth = broken ? 1 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.86, i * 0.35 + Math.sin(t * 0.2) * 0.08, 0, TAU);
    ctx.stroke();
    if (!broken) {
      for (let k = 0; k < 3; k += 1) {
        const a = t * 0.22 + i * 1.4 + k * 2.1;
        ctx.fillStyle = "rgba(255, 183, 207, 0.32)";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.86, 1.4, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  ctx.fillStyle = "#170a16";
  ctx.beginPath();
  ctx.ellipse(x, y, 114, 105, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 142, 173, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#2a1025";
  ctx.beginPath();
  ctx.ellipse(x, y, 92, 82, 0, 0, TAU);
  ctx.fill();
  const iris = ctx.createRadialGradient(x - 12, y - 12, 4, x, y, 74);
  iris.addColorStop(0, "#ffd9e4");
  iris.addColorStop(0.18, "#ff9ab7");
  iris.addColorStop(0.52, "#b73b78");
  iris.addColorStop(1, "#2a0c23");
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.ellipse(x, y, 72, 63 * open + 2, 0, 0, TAU);
  ctx.fill();

  if (!defeated) {
    ctx.strokeStyle = "rgba(255, 225, 235, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      const a = (TAU / 7) * i + t * 0.09;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 12);
      ctx.lineTo(x + Math.cos(a) * 57, y + Math.sin(a) * 49);
      ctx.stroke();
    }
    const pupilX = x + Math.sin(t * 0.4) * 12 + 5;
    const pupilY = y + Math.cos(t * 0.32) * 8;
    ctx.fillStyle = "#09040a";
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, 12, 34, 0.05, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(pupilX - 5, pupilY - 15, 2.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 231, 239, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 71, 61, 0, 0, TAU);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(255, 210, 225, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 52, y);
    ctx.quadraticCurveTo(x, y + 12, x + 52, y);
    ctx.stroke();
  }

  const crackCount = hp < maxHp ? maxHp - hp : 0;
  ctx.strokeStyle = "rgba(255, 206, 223, 0.38)";
  ctx.lineWidth = 1;
  for (let i = 0; i < crackCount * 3; i += 1) {
    const a = hash(i + 22) * TAU;
    const r1 = 88 + hash(i) * 13;
    const r2 = r1 + 14 + hash(i + 4) * 24;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.86);
    ctx.lineTo(x + Math.cos(a + 0.08) * r2, y + Math.sin(a + 0.08) * r2 * 0.86);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 151, 181, 0.22)";
  ctx.fillRect(x - 112, y - 168, 224, 1);
  drawText(ctx, defeated ? "NULL POINTER // TERMINATED" : "NULL POINTER", x, y - 177, {
    size: 8,
    color: defeated ? "rgba(255, 190, 210, 0.4)" : "#ffbfd0",
    weight: 600
  });
  drawText(ctx, defeated ? "no longer uncaught" : "the uncaught exception", x, y - 162, {
    size: 5.5,
    color: "rgba(255, 150, 181, 0.35)",
    weight: 500
  });
  ctx.restore();
}

/* ------------------------------------------------------------
   In-game labels / atmosphere helpers
   ------------------------------------------------------------ */
export function drawWorldLabel(ctx, text, x, y, color, alpha = 0.4) {
  drawText(ctx, text, x, y, {
    size: 6,
    color: rgba(color, alpha),
    weight: 600,
    align: "left"
  });
}

export function drawBigGlyph(ctx, text, x, y, color, alpha) {
  const p = color || "#ffffff";
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  ctx.font = '900 150px "Arial Black", "Segoe UI Black", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export const ART = {
  makePalette,
  drawBackground,
  drawForeground,
  drawPlatform,
  drawSpike,
  drawSpring,
  drawBit,
  drawCore,
  drawCheckpoint,
  drawTerminal,
  drawDoor,
  drawPlayer,
  drawBug,
  drawNpc,
  drawBoss,
  drawWorldLabel,
  drawBigGlyph
};
