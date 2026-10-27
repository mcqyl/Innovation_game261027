/* ============================================================
   CODE RIFT — application controller
   Screen flow, campaign saves, story, terminals, boss shells,
   completion, archive and the Lingbao integration.
   ============================================================ */

import {
  CAMPAIGNS,
  GAME_META,
  KNOWLEDGE,
  LEVELS,
  LEVEL_LOOKUP,
  getCampaign
} from "./levels.js";
import { GameEngine } from "./engine.js";
import { Lingbao } from "./companion.js";
import { audio } from "./audio.js";

const SAVE_KEY = "codeRift.save.v1";
const KNOWLEDGE_IDS = Object.keys(KNOWLEDGE);
const TOTAL_KNOWLEDGE = KNOWLEDGE_IDS.length;
const RANK_ORDER = { S: 4, A: 3, B: 2, C: 1 };
const TONES = new Set(["warn", "error", "success", "card"]);

const byId = (id) => document.getElementById(id);
const pad2 = (value) => String(value).padStart(2, "0");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ESCAPES[char]);

const el = {
  app: byId("app"),
  bootScreen: byId("bootScreen"),
  selectScreen: byId("selectScreen"),
  mapScreen: byId("mapScreen"),
  gameScreen: byId("gameScreen"),
  rotateGateSkip: byId("rotateGateSkip"),

  bootStart: byId("bootStart"),
  bootContinue: byId("bootContinue"),
  bootProgressHint: byId("bootProgressHint"),
  campaignGrid: byId("campaignGrid"),
  selectProgressChip: byId("selectProgressChip"),
  selectAllClear: byId("selectAllClear"),
  selectBack: byId("selectBack"),
  selectKnowledgeTop: byId("selectKnowledgeTop"),
  selectKnowledgeBtn: byId("selectKnowledgeBtn"),

  mapBrand: byId("mapBrand"),
  mapSwitch: byId("mapSwitch"),
  mapKnowledgeTop: byId("mapKnowledgeTop"),
  mapKnowledgeBtn: byId("mapKnowledgeBtn"),
  mapCampaignCode: byId("mapCampaignCode"),
  mapCampaignName: byId("mapCampaignName"),
  mapCampaignTitle: byId("mapCampaignTitle"),
  mapCampaignTagline: byId("mapCampaignTagline"),
  mapCampaignDesc: byId("mapCampaignDesc"),
  mapProgressText: byId("mapProgressText"),
  mapProgressBar: byId("mapProgressBar"),
  mapCampaignDifficulty: byId("mapCampaignDifficulty"),
  mapContinueBtn: byId("mapContinueBtn"),
  mapLevels: byId("mapLevels"),
  missionDrawer: byId("missionDrawer"),
  mapCompanionText: byId("mapCompanionText"),
  mapFooterLeft: byId("mapFooterLeft"),

  gameCampaignCode: byId("gameCampaignCode"),
  gameWorldLabel: byId("gameWorldLabel"),
  gameLevelTitle: byId("gameLevelTitle"),
  gameCanvas: byId("gameCanvas"),
  gameKnowledgeBtn: byId("gameKnowledgeBtn"),
  gamePauseBtn: byId("gamePauseBtn"),
  sceneFlash: byId("sceneFlash"),
  sceneTitle: byId("sceneTitle"),
  sceneKicker: byId("sceneKicker"),
  sceneName: byId("sceneName"),
  sceneSub: byId("sceneSub"),
  questCores: byId("questCores"),
  questTitle: byId("questTitle"),
  questDetail: byId("questDetail"),
  questBar: byId("questBar"),
  bossHud: byId("bossHud"),
  bossHudTitle: byId("bossHudTitle"),
  bossHudTrack: document.querySelector("#bossHud .boss-hud-track"),
  interactHint: byId("interactHint"),
  interactText: byId("interactText"),
  fieldConsole: byId("fieldConsole"),
  fieldProgress: byId("fieldProgress"),
  fieldTitle: byId("fieldTitle"),
  fieldPrompt: byId("fieldPrompt"),
  fieldCode: byId("fieldCode"),
  fieldSteps: byId("fieldSteps"),
  fieldMessage: byId("fieldMessage"),
  fieldHintBtn: byId("fieldHintBtn"),
  heartRow: byId("heartRow"),
  rewindRow: byId("rewindRow"),
  bitCounter: byId("bitCounter"),

  dialogueLayer: byId("dialogueLayer"),
  dialogueShell: byId("dialogueShell"),
  dialoguePortrait: byId("dialoguePortrait"),
  dialogueInitial: byId("dialogueInitial"),
  dialogueWho: byId("dialogueWho"),
  dialogueCounter: byId("dialogueCounter"),
  dialogueText: byId("dialogueText"),
  dialogueNext: byId("dialogueNext"),

  puzzleLayer: byId("puzzleLayer"),
  puzzleClose: byId("puzzleClose"),
  puzzleBranch: byId("puzzleBranch"),
  puzzleLangTag: byId("puzzleLangTag"),
  puzzleBossLabel: byId("puzzleBossLabel"),
  puzzleEyebrow: byId("puzzleEyebrow"),
  puzzleTitle: byId("puzzleTitle"),
  puzzleSubtitle: byId("puzzleSubtitle"),
  puzzleBossBar: byId("puzzleBossBar"),
  puzzleBossShells: byId("puzzleBossShells"),
  puzzleFileName: byId("puzzleFileName"),
  puzzleCode: byId("puzzleCode"),
  puzzleLines: byId("puzzleLines"),
  puzzleLineCount: byId("puzzleLineCount"),
  puzzlePrompt: byId("puzzlePrompt"),
  puzzleAnswerArea: byId("puzzleAnswerArea"),
  puzzleLab: byId("puzzleLab"),
  puzzleLabToggle: byId("puzzleLabToggle"),
  puzzleLabBody: byId("puzzleLabBody"),
  puzzleLesson: byId("puzzleLesson"),
  puzzleTraceCounter: byId("puzzleTraceCounter"),
  puzzleTraceLabel: byId("puzzleTraceLabel"),
  puzzleTraceNote: byId("puzzleTraceNote"),
  puzzleTraceStep: byId("puzzleTraceStep"),
  puzzleTraceReset: byId("puzzleTraceReset"),
  puzzleFeedback: byId("puzzleFeedback"),
  puzzleHintBtn: byId("puzzleHintBtn"),
  puzzleHintText: byId("puzzleHintText"),
  puzzleSubmit: byId("puzzleSubmit"),
  puzzleExit: byId("puzzleExit"),

  pauseLayer: byId("pauseLayer"),
  pauseResume: byId("pauseResume"),
  pauseKnowledge: byId("pauseKnowledge"),
  pauseRestart: byId("pauseRestart"),
  pauseMap: byId("pauseMap"),

  completeLayer: byId("completeLayer"),
  completeRank: byId("completeRank"),
  completeKicker: byId("completeKicker"),
  completeTitle: byId("completeTitle"),
  completeSubtitle: byId("completeSubtitle"),
  completeStats: byId("completeStats"),
  completeConcept: byId("completeConcept"),
  completeQuote: byId("completeQuote"),
  completeNextBtn: byId("completeNextBtn"),
  completeReplayBtn: byId("completeReplayBtn"),
  completeMapBtn: byId("completeMapBtn"),

  knowledgeOverlay: byId("knowledgeOverlay"),
  knowledgeClose: byId("knowledgeClose"),
  knowledgeFilters: byId("knowledgeFilters"),
  knowledgeGrid: byId("knowledgeGrid"),
  knowledgeEmpty: byId("knowledgeEmpty"),
  knowledgeCount: byId("knowledgeCount"),

  endingOverlay: byId("endingOverlay"),
  endingCampaign: byId("endingCampaign"),
  endingSubtitle: byId("endingSubtitle"),
  endingStats: byId("endingStats"),
  endingQuote: byId("endingQuote"),
  endingNote: byId("endingNote"),
  endingAllClear: byId("endingAllClear"),
  endingSelectBtn: byId("endingSelectBtn"),
  endingKnowledgeBtn: byId("endingKnowledgeBtn"),
  endingReplayBtn: byId("endingReplayBtn"),

  toastLayer: byId("toastLayer"),
  soundButtons: document.querySelectorAll("#bootSound, #selectSound, #mapSound, #gameSoundBtn")
};

const state = {
  screen: "boot",
  save: null,
  campaignKey: "python",
  selectedLevelId: null,
  level: null,
  engine: null,
  phase: "idle",
  hud: null,
  runStats: null,
  circuit: null,
  quickQuizOpen: false,
  dialogue: null,
  puzzle: null,
  pauseOpen: false,
  completeOpen: false,
  endingOpen: false,
  endingCampaign: null,
  knowledgeOpen: false,
  knowledgeFilter: "ALL",
  lastKnowledgeFocus: null,
  pendingPrologue: false,
  recent: "",
  companionMood: "neutral",
  lastToast: null,
  sceneTimer: 0,
  dialogueTimer: 0
};

let lingbao = null;

/* ------------------------------------------------------------
   Utilities
   ------------------------------------------------------------ */

function makeDefaultSave() {
  const campaigns = {};
  for (const campaign of CAMPAIGNS) campaigns[campaign.key] = { levels: {} };
  return {
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    prologueSeen: false,
    lastCampaign: "python",
    lastLevel: "",
    knowledge: {},
    campaigns
  };
}

function sanitiseStats(raw) {
  if (!raw || typeof raw !== "object") return null;
  const number = (value) => {
    const converted = Number(value);
    return Number.isFinite(converted) ? converted : 0;
  };
  const stats = {
    id: typeof raw.id === "string" ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "",
    time: number(raw.time),
    bits: number(raw.bits),
    totalBits: number(raw.totalBits),
    cores: number(raw.cores),
    totalCores: number(raw.totalCores),
    damage: number(raw.damage),
    deaths: number(raw.deaths),
    rewinds: number(raw.rewinds),
    mistakes: number(raw.mistakes),
    hints: number(raw.hints),
    boss: Boolean(raw.boss)
  };
  if (Number.isFinite(Number(raw.score)) && raw.score !== undefined) {
    stats.score = number(raw.score);
    stats.rank = RANK_ORDER[raw.rank] ? raw.rank : rankFromScore(stats.score);
  }
  return stats;
}

function normaliseRecord(raw) {
  if (!raw || typeof raw !== "object" || !raw.completed) return null;
  const best = sanitiseStats(raw.best);
  const last = sanitiseStats(raw.last);
  if (best && !Number.isFinite(best.score)) Object.assign(best, rankFor(best));
  if (last && !Number.isFinite(last.score)) Object.assign(last, rankFor(last));
  return {
    completed: true,
    completedAt: Number(raw.completedAt) || Date.now(),
    plays: Number(raw.plays) || 1,
    best,
    last
  };
}

function normaliseSave(raw) {
  const base = makeDefaultSave();
  if (!raw || typeof raw !== "object") return base;
  base.prologueSeen = Boolean(raw.prologueSeen);
  base.lastCampaign = CAMPAIGNS.some((campaign) => campaign.key === raw.lastCampaign)
    ? raw.lastCampaign
    : "python";
  base.lastLevel = LEVEL_LOOKUP[raw.lastLevel] ? raw.lastLevel : "";
  base.createdAt = Number(raw.createdAt) || base.createdAt;
  base.updatedAt = Number(raw.updatedAt) || base.updatedAt;

  if (raw.knowledge && typeof raw.knowledge === "object") {
    for (const id of KNOWLEDGE_IDS) {
      if (raw.knowledge[id]) {
        base.knowledge[id] = Number(raw.knowledge[id]) || Date.now();
      }
    }
  }

  for (const campaign of CAMPAIGNS) {
    const source = raw.campaigns?.[campaign.key]?.levels;
    if (!source || typeof source !== "object") continue;
    for (const level of campaign.levels) {
      const record = normaliseRecord(source[level.id]);
      if (record) base.campaigns[campaign.key].levels[level.id] = record;
    }
  }
  return base;
}

function loadSave() {
  try {
    return normaliseSave(JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null"));
  } catch {
    return makeDefaultSave();
  }
}

function persistSave() {
  state.save.updatedAt = Date.now();
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
  } catch {
    // Private browsing can disable storage; the session still works in memory.
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  return `${pad2(minutes)}:${pad2(total % 60)}`;
}

function formatDate(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return `${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

function hexToRgb(hex) {
  const value = String(hex || "").replace("#", "");
  if (value.length !== 6) return "157, 238, 192";
  const number = Number.parseInt(value, 16);
  if (!Number.isFinite(number)) return "157, 238, 192";
  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
}

function applyTheme(campaign) {
  if (!campaign) return resetTheme();
  const accent = campaign.accent || "#9deec0";
  const accent2 = campaign.accent2 || "#6c90ff";
  el.app.dataset.theme = campaign.theme || campaign.key;
  const root = document.documentElement;
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-2", accent2);
  root.style.setProperty("--accent-rgb", hexToRgb(accent));
  root.style.setProperty("--accent-2-rgb", hexToRgb(accent2));
}

function resetTheme() {
  el.app.removeAttribute("data-theme");
  const root = document.documentElement;
  ["--accent", "--accent-2", "--accent-rgb", "--accent-2-rgb"].forEach((property) => {
    root.style.removeProperty(property);
  });
}

function toast(text, tone = "info") {
  const message = String(text || "").trim();
  if (!message || !el.toastLayer) return;
  const now = Date.now();
  if (state.lastToast && state.lastToast.text === message && now - state.lastToast.at < 1600) return;
  state.lastToast = { text: message, at: now };

  const node = document.createElement("div");
  node.className = "toast";
  if (TONES.has(tone)) node.classList.add(`is-${tone}`);
  node.textContent = message;
  el.toastLayer.append(node);
  while (el.toastLayer.children.length > 4) el.toastLayer.firstElementChild?.remove();

  window.setTimeout(() => {
    node.classList.add("is-leaving");
    window.setTimeout(() => node.remove(), 260);
  }, 3400);
}

function setRecent(text) {
  state.recent = String(text || "").slice(0, 220);
  updateCompanionContext();
}

/* ------------------------------------------------------------
   Progression
   ------------------------------------------------------------ */

function getRecord(levelId) {
  const level = LEVEL_LOOKUP[levelId];
  if (!level) return null;
  return state.save.campaigns[level.campaign]?.levels[levelId] || null;
}

function isLevelComplete(levelId) {
  return Boolean(getRecord(levelId)?.completed);
}

function isLevelUnlocked(level) {
  const campaign = getCampaign(level.campaign);
  if (!campaign) return false;
  const index = campaign.levels.findIndex((item) => item.id === level.id);
  if (index <= 0) return true;
  if (level.bossFight) {
    return campaign.levels.slice(0, index).every((item) => isLevelComplete(item.id));
  }
  return isLevelComplete(campaign.levels[index - 1].id);
}

function recommendedLevel(campaign) {
  return campaign.levels.find((level) => isLevelUnlocked(level) && !isLevelComplete(level.id)) || null;
}

function campaignDoneCount(campaign) {
  return campaign.levels.filter((level) => isLevelComplete(level.id)).length;
}

function completedLevelCount() {
  return CAMPAIGNS.reduce((total, campaign) => total + campaignDoneCount(campaign), 0);
}

function hasProgress() {
  return Boolean(
    state.save.lastLevel ||
      Object.keys(state.save.knowledge).length ||
      CAMPAIGNS.some((campaign) => campaignDoneCount(campaign) > 0)
  );
}

function rankFromScore(score) {
  if (score >= 92) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  return "C";
}

function scoreStats(stats) {
  const coreRatio = stats.totalCores > 0 ? clamp(stats.cores / stats.totalCores, 0, 1) : 0;
  const bitRatio = stats.totalBits > 0 ? clamp(stats.bits / stats.totalBits, 0, 1) : 0;
  let score = 58 + coreRatio * 24 + bitRatio * 16;
  score -= stats.mistakes * 7;
  score -= stats.rewinds * 4;
  score -= Math.min(8, stats.damage) * 3;
  score -= stats.hints * 2;
  const par = stats.boss ? 300 : 240;
  if (stats.time <= par) score += 4;
  else if (stats.time > par * 2) score -= 8;
  return clamp(Math.round(score), 0, 100);
}

function rankFor(stats) {
  const score = scoreStats(stats);
  return { score, rank: rankFromScore(score) };
}

function recordCompletion(level, stats) {
  const campaign = getCampaign(level.campaign);
  if (!campaign) return null;
  const bucket = state.save.campaigns[campaign.key].levels;
  const previous = bucket[level.id] || null;
  const ranked = { ...stats, ...rankFor(stats) };
  const record = previous || {
    completed: true,
    completedAt: Date.now(),
    plays: 0,
    best: null,
    last: null
  };

  record.completed = true;
  record.plays = (Number(record.plays) || 0) + 1;
  record.last = ranked;
  record.completedAt = Date.now();
  if (!record.best || ranked.score > record.best.score || (ranked.score === record.best.score && ranked.time < record.best.time)) {
    record.best = ranked;
  }
  bucket[level.id] = record;

  state.save.lastCampaign = campaign.key;
  state.save.lastLevel = level.id;
  persistSave();

  if (level.bossFight?.rewardId) addKnowledge(level.bossFight.rewardId);
  if (level.puzzle?.rewardId) addKnowledge(level.puzzle.rewardId);
  if (stats.rewinds > 0) addKnowledge("debug-rewind", { quiet: true });

  return record;
}

function campaignSummary(campaign) {
  let done = 0;
  let time = 0;
  let cores = 0;
  let totalCores = 0;
  let bits = 0;
  let totalBits = 0;
  let bestRank = "—";
  let bestWeight = 0;

  for (const level of campaign.levels) {
    totalCores += level.collectibles.filter((item) => item.type === "core").length;
    totalBits += level.collectibles.filter((item) => item.type !== "core").length;
    const record = getRecord(level.id);
    if (!record) continue;
    done += 1;
    const stats = record.best || record.last;
    if (!stats) continue;
    time += stats.time || 0;
    cores += stats.cores || 0;
    bits += stats.bits || 0;
    const weight = RANK_ORDER[stats.rank] || 0;
    if (weight > bestWeight) {
      bestWeight = weight;
      bestRank = stats.rank || "C";
    }
  }

  const cards = KNOWLEDGE_IDS.map((id) => KNOWLEDGE[id]).filter((card) => card.lang === campaign.label);
  const archive = cards.filter((card) => state.save.knowledge[card.id]).length;
  return {
    done,
    total: campaign.levels.length,
    time,
    cores,
    totalCores,
    bits,
    totalBits,
    bestRank,
    archive,
    archiveTotal: cards.length
  };
}

function campaignCardState(level) {
  if (isLevelComplete(level.id)) return { done: true, unlocked: true, state: "STABLE" };
  if (isLevelUnlocked(level)) return { done: false, unlocked: true, state: "OPEN" };
  return { done: false, unlocked: false, state: "LOCKED" };
}

/* ------------------------------------------------------------
   Knowledge archive
   ------------------------------------------------------------ */

function addKnowledge(id, { quiet = false } = {}) {
  const card = KNOWLEDGE[id];
  if (!card || state.save.knowledge[id]) return false;
  state.save.knowledge[id] = Date.now();
  persistSave();
  if (!quiet) {
    audio.play("success");
    toast(`知识卡已收录 // ${card.title}`, "card");
  }
  if (state.knowledgeOpen) renderKnowledge();
  return true;
}

function updateCompanionContext() {
  if (!lingbao) return;
  lingbao.setContext(getCompanionContext());
}

function puzzleAnswerText(puzzle) {
  if (!puzzle) return "";
  if (puzzle.type === "choice") {
    return puzzle.options?.[puzzle.correctIndex]?.label || "";
  }
  if (puzzle.type === "fill") {
    return (puzzle.answers || []).join(" 或 ");
  }
  if (puzzle.type === "lines") {
    return `第 ${Number(puzzle.answerLine) + 1} 行`;
  }
  if (puzzle.type === "order") {
    const byId = new Map((puzzle.items || []).map((item) => [item.id, item.label]));
    return (puzzle.solution || []).map((id) => byId.get(id) || id).join(" → ");
  }
  return "";
}

function getCompanionContext() {
  const context = { screen: state.screen, mood: state.companionMood };
  if (state.recent) context.recent = state.recent;

  if (state.screen === "select") {
    context.campaigns = CAMPAIGNS.map((campaign) => ({
      name: campaign.name,
      language: campaign.label,
      done: campaignDoneCount(campaign),
      total: campaign.levels.length
    }));
    return context;
  }

  if (state.screen === "map") {
    const campaign = getCampaign(state.campaignKey);
    if (!campaign) return context;
    const level = state.selectedLevelId ? LEVEL_LOOKUP[state.selectedLevelId] : null;
    context.campaignName = campaign.name;
    context.language = campaign.label;
    context.progress = `${campaignDoneCount(campaign)} / ${campaign.levels.length}`;
    if (level) {
      context.levelTitle = level.title;
      context.objective = level.objective;
      context.concepts = level.concepts;
    }
    return context;
  }

  if (state.screen === "game" && state.level) {
    const campaign = getCampaign(state.level.campaign);
    const hud = state.hud || {};
    context.levelTitle = state.level.title;
    context.language = state.level.language;
    context.campaignName = campaign?.name || "";
    context.levelIndex = state.level.order;
    context.totalLevels = campaign?.levels.length || 3;
    context.objective = state.level.objective;
    context.concepts = state.level.concepts;
    context.cores = hud.cores ?? 0;
    context.totalCores = hud.totalCores ?? 0;
    context.hp = hud.hp ?? 0;
    const circuitState = state.engine?.getCircuitState();
    if (circuitState && !circuitState.solved) {
      const nextPad = state.level.fieldCircuit?.pads?.find((pad) => pad.id === circuitState.nextPadId);
      context.objective = circuitState.objective || context.objective;
      context.circuit = {
        title: circuitState.title,
        objective: circuitState.objective,
        prompt: circuitState.prompt,
        code: circuitState.code,
        progress: circuitState.progress,
        total: circuitState.total,
        solved: circuitState.solved,
        message: circuitState.message,
        nextLabel: nextPad?.label || "",
        coach: nextPad?.coach || ""
      };
    }
    if (state.level.bossFight) {
      const bossState = state.engine?.getBossState();
      context.boss = `${state.level.bossFight.name} · 第 ${Math.min((bossState?.solved || 0) + 1, bossState?.maxHp || 3)} 层`;
    }
    if (state.puzzle) {
      const current = state.puzzle.current;
      const reveal = state.puzzle.solved || state.puzzle.hintUsed || state.puzzle.attempts >= 2;
      context.puzzleTitle = current.title;
      context.puzzleConcept = current.conceptLabel || state.level.concepts?.[0] || "";
      context.puzzleHint = current.hint || "";
      if (reveal) {
        context.puzzleExplanation = current.explanation || "";
        context.puzzleAnswer = puzzleAnswerText(current);
      }
    }
    return context;
  }

  return context;
}

/* ------------------------------------------------------------
   Screens
   ------------------------------------------------------------ */

const SCREEN_NODES = () => [
  ["boot", el.bootScreen],
  ["select", el.selectScreen],
  ["map", el.mapScreen],
  ["game", el.gameScreen]
];

function showScreen(name) {
  state.screen = name;
  for (const [key, node] of SCREEN_NODES()) {
    node?.classList.toggle("is-hidden", key !== name);
  }
}

function syncBodyModal() {
  const blocked = state.knowledgeOpen || state.endingOpen || Boolean(lingbao?.panelOpen);
  document.body.classList.toggle("is-modal-open", blocked);
}

function openBoot() {
  teardownGame();
  showScreen("boot");
  resetTheme();
  audio.setMood("menu");
  renderBoot();
  updateCompanionContext();
}

function openSelect() {
  teardownGame();
  showScreen("select");
  resetTheme();
  audio.setMood("menu");
  renderCampaigns();
  renderSelectMeta();
  updateCompanionContext();
}

function campaignMood(campaignKey) {
  if (campaignKey === "python") return "forest";
  if (campaignKey === "c") return "mine";
  if (campaignKey === "java") return "sky";
  return "menu";
}

function openCampaign(key, { selectedId = null } = {}) {
  const campaign = getCampaign(key);
  if (!campaign) return;
  teardownGame();
  state.campaignKey = campaign.key;
  state.save.lastCampaign = campaign.key;
  persistSave();
  applyTheme(campaign);

  const suggested = selectedId && campaign.levels.some((level) => level.id === selectedId)
    ? LEVEL_LOOKUP[selectedId]
    : null;
  const next = recommendedLevel(campaign);
  state.selectedLevelId = suggested?.id || next?.id || campaign.levels[campaign.levels.length - 1].id;

  showScreen("map");
  renderMap();
  audio.setMood(campaignMood(campaign.key));
  updateCompanionContext();
}

/* ------------------------------------------------------------
   Boot & campaign selector
   ------------------------------------------------------------ */

function renderBoot() {
  const done = completedLevelCount();
  const total = GAME_META.totalLevels;
  if (!hasProgress()) {
    el.bootProgressHint.textContent = "还没有修复记录。先选一门语言，掉进去。";
  } else if (done >= total) {
    el.bootProgressHint.textContent = `三条分支全部稳定 · 知识卡 ${Object.keys(state.save.knowledge).length} / ${TOTAL_KNOWLEDGE}。裂隙已无漏水项目。`;
  } else {
    el.bootProgressHint.textContent = `已修复 ${done} / ${total} 道裂隙 · 知识卡 ${Object.keys(state.save.knowledge).length} / ${TOTAL_KNOWLEDGE}。接着上次的地方继续。`;
  }

  const last = getCampaign(state.save.lastCampaign);
  el.bootContinue.hidden = !hasProgress();
  const label = el.bootContinue.querySelector("span");
  if (label) label.textContent = last ? `继续 ${last.name}` : "继续上次的裂隙";
}

function renderCampaigns() {
  el.campaignGrid.replaceChildren();

  CAMPAIGNS.forEach((campaign, index) => {
    const done = campaignDoneCount(campaign);
    const next = recommendedLevel(campaign);
    const stable = done === campaign.levels.length;
    const glyphs = { python: "P", c: "C", java: "J" };
    const jitters = { python: "INDENT +1", c: "*0x00FF", java: "NULL?" };
    const buttonLabel = stable ? "重读分支" : done > 0 ? "继续修复" : "进入分支";
    const statusText = stable ? "STABLE" : done > 0 ? "ACTIVE" : "OPEN";
    const statusClass = stable ? "is-stable" : "is-open";

    const levelRows = campaign.levels.map((level, levelIndex) => {
      const levelDone = isLevelComplete(level.id);
      const current = !stable && next?.id === level.id;
      const unlocked = isLevelUnlocked(level);
      const rowState = levelDone ? "CLEAR" : current ? "HERE" : unlocked ? "OPEN" : "LOCK";
      return `<li class="${levelDone ? "is-done" : ""} ${current ? "is-current" : ""}">
        <span>0${levelIndex + 1}</span><b>${esc(level.title)}</b><i>${rowState}</i>
      </li>`;
    }).join("");

    const dots = campaign.levels
      .map((level) => `<i class="${isLevelComplete(level.id) ? "is-done" : ""}"></i>`)
      .join("");

    const card = document.createElement("article");
    card.className = `campaign-card theme-${campaign.key}${stable ? " is-stable" : ""}`;
    card.dataset.campaign = campaign.key;
    card.innerHTML = `
      <div class="campaign-card-top">
        <span class="campaign-index">0${index + 1}</span>
        <span class="campaign-code">${esc(campaign.code)}</span>
        <span class="campaign-status ${statusClass}">${statusText}</span>
      </div>
      <div class="campaign-art" aria-hidden="true">
        <span class="campaign-glyph">${glyphs[campaign.key]}</span>
        <span class="campaign-orbit"></span>
        <span class="campaign-jitter">${jitters[campaign.key]}</span>
      </div>
      <div class="campaign-card-body">
        <span class="campaign-lang">${esc(campaign.label)}</span>
        <h2>${esc(campaign.name)}</h2>
        <p class="campaign-tagline">${esc(campaign.tagline)}</p>
        <p class="campaign-desc">${esc(campaign.description)}</p>
        <div class="campaign-concepts">
          ${campaign.concepts.map((concept) => `<span>${esc(concept)}</span>`).join("")}
        </div>
      </div>
      <div class="campaign-level-preview">
        <div class="preview-head"><span>${esc(campaign.titleEn)}</span><b>${done} / ${campaign.levels.length}</b></div>
        <ul>${levelRows}</ul>
      </div>
      <div class="campaign-card-foot">
        <div class="campaign-dots" aria-hidden="true">${dots}</div>
        <button class="campaign-enter" type="button" data-campaign="${campaign.key}" aria-label="${buttonLabel}${esc(campaign.name)}">
          ${buttonLabel} <span>→</span>
        </button>
      </div>`;
    el.campaignGrid.append(card);
  });
}

function renderSelectMeta() {
  const done = completedLevelCount();
  el.selectProgressChip.innerHTML = `<i></i> ${pad2(done)} / ${pad2(GAME_META.totalLevels)} RIFTS STABILIZED`;
  el.selectAllClear.hidden = done < GAME_META.totalLevels;
}

/* ------------------------------------------------------------
   Campaign map
   ------------------------------------------------------------ */

function renderMap() {
  const campaign = getCampaign(state.campaignKey);
  if (!campaign) return;
  applyTheme(campaign);

  const done = campaignDoneCount(campaign);
  const next = recommendedLevel(campaign);
  const complete = done >= campaign.levels.length;

  el.mapCampaignCode.textContent = campaign.code;
  el.mapCampaignName.textContent = campaign.name;
  el.mapCampaignTitle.textContent = campaign.name;
  el.mapCampaignTagline.textContent = campaign.tagline;
  el.mapCampaignDesc.textContent = campaign.description;
  el.mapProgressText.textContent = `${done} / ${campaign.levels.length}`;
  el.mapProgressBar.style.width = `${Math.round((done / campaign.levels.length) * 100)}%`;
  el.mapCampaignDifficulty.textContent = `难度 / ${campaign.difficulty}`;
  el.mapFooterLeft.textContent = `${campaign.label} BRANCH / INDEPENDENT CAMPAIGN`;

  const messages = {
    python: [
      "“先点路线卡看档案，再按右下角进去。别问我怎么知道你会点错。”",
      "“藤蔓只是装饰。真正会绊你的，是缩进。”",
      "“Null 在终点装成一段没被接纳的空白。你可以先深呼吸。”"
    ],
    c: [
      "“这里每个门牌号都自称是真的。先看任务档案。”",
      "“指针不是箭头，是地址。别让地精听见你混用这两个词。”",
      "“野地址在终点等你。带上 & 和 *，别带侥幸。”"
    ],
    java: [
      "“浮空城的风很大，对象很多，null 也很多。先选路线。”",
      "“继承不等于有出息。动态绑定才认你真身。”",
      "“NullPointer 在终点。它坚持自己只是没被 new 过。”"
    ]
  };
  const voice = messages[campaign.key] || messages.python;
  el.mapCompanionText.textContent = done === 0 ? voice[0] : done === 1 ? voice[1] : voice[2];

  if (complete) {
    el.mapContinueBtn.innerHTML = `重看分支结局 <span class="btn-arrow">→</span>`;
    el.mapContinueBtn.disabled = false;
  } else if (next) {
    const label = next.bossFight ? "挑战 Null 奇点" : done === 0 ? "进入第一关" : "继续下一关";
    el.mapContinueBtn.innerHTML = `${label} <span class="btn-arrow">→</span>`;
    el.mapContinueBtn.disabled = false;
  } else {
    el.mapContinueBtn.innerHTML = `路线维护中 <span class="btn-arrow">→</span>`;
    el.mapContinueBtn.disabled = true;
  }

  renderRouteCards(campaign);
  renderMissionDossier(campaign);
  updateCompanionContext();
}

function renderRouteCards(campaign) {
  el.mapLevels.replaceChildren();

  campaign.levels.forEach((level, index) => {
    const cardState = campaignCardState(level);
    const selected = state.selectedLevelId === level.id;
    const record = getRecord(level.id);
    const rank = record?.best?.rank || record?.last?.rank;
    const cores = level.collectibles.filter((item) => item.type === "core").length;
    const bits = level.collectibles.length - cores;
    const classes = [
      "route-card",
      level.bossFight ? "is-boss" : "",
      cardState.done ? "is-done" : cardState.unlocked ? "is-open" : "is-locked",
      selected ? "is-selected" : ""
    ].filter(Boolean).join(" ");
    const stateLabel = cardState.done ? "STABLE" : level.bossFight && cardState.unlocked ? "NULL SIGNAL" : cardState.state;
    const action = cardState.done ? "重入" : level.bossFight ? "接入" : "进入";
    const node = level.bossFight
      ? `<b>◆</b>`
      : pad2(index + 1);
    const meta = [
      `<span>源核 <b>${cores}</b></span>`,
      `<span>碎片 <b>${bits}</b></span>`,
      rank ? `<span>评定 <b>${esc(rank)}</b></span>` : `<span>${level.bossFight ? "三层壳" : "终端 ×1"}</span>`
    ].join("");

    const article = document.createElement("article");
    article.className = classes;
    article.dataset.level = level.id;
    article.innerHTML = `
      <span class="route-rail"><span class="route-node">${node}</span></span>
      <span class="route-copy">
        <span class="route-top">
          <span>${esc(level.worldLabel)}</span>
          <span class="route-state">${stateLabel}</span>
        </span>
        <h3>${esc(level.title)} <small>${esc(level.titleEn)}</small>
          ${level.bossFight ? `<span class="route-boss-tag">NULL POINT</span>` : ""}
        </h3>
        <span class="route-brief">${esc(level.brief)}</span>
        <span class="route-meta">${meta}</span>
      </span>
      <span class="route-side">
        ${cardState.unlocked
          ? `<button class="route-enter" type="button" data-enter="${level.id}">${action} <span>→</span></button>`
          : `<span class="route-enter">已锁定</span>`}
      </span>`;
    el.mapLevels.append(article);
  });
}

function renderMissionDossier(campaign) {
  const level = state.selectedLevelId ? LEVEL_LOOKUP[state.selectedLevelId] : null;
  if (!level || level.campaign !== campaign.key) {
    el.missionDrawer.innerHTML = `<div class="mission-empty">SELECT A RIFT<br>点一张路线卡，档案会自己展开。</div>`;
    return;
  }

  const unlocked = isLevelUnlocked(level);
  const record = getRecord(level.id);
  const done = Boolean(record?.completed);
  const rank = record?.best?.rank || record?.last?.rank || "";
  const cardId = level.bossFight ? level.bossFight.rewardId : level.puzzle?.rewardId;
  const reward = cardId ? KNOWLEDGE[cardId] : null;
  const hasReward = cardId ? Boolean(state.save.knowledge[cardId]) : false;
  const index = campaign.levels.findIndex((item) => item.id === level.id);
  const earlier = campaign.levels.slice(0, index).filter((item) => !isLevelComplete(item.id));
  const lockCopy = earlier.length
    ? `前置裂隙尚未修复：${earlier.map((item) => item.title).join("、")}。`
    : "路线信号尚未达到可接入强度。";

  const tags = [
    `<span class="accent">${esc(level.language)}</span>`,
    `<span>${esc(level.worldLabel)}</span>`,
    level.bossFight ? `<span class="boss">NULL OVERRIDE</span>` : `<span>${level.enemies?.length || 0} BUGS</span>`
  ].join("");
  const chips = (level.concepts || []).map((concept) => `<span>${esc(concept)}</span>`).join("");
  const npcNames = (level.npcs || []).map((npc) => npc.name).filter(Boolean);

  el.missionDrawer.innerHTML = `
    <div class="mission-dossier">
      <div class="mission-head">
        <span class="mission-index">${pad2(index + 1)}</span>
        <div>
          <h2>${esc(level.title)}</h2>
          <span class="mission-en">${esc(level.titleEn)}</span>
        </div>
      </div>
      <div class="mission-tags">${tags}</div>
      <p class="mission-brief">${esc(level.brief)}</p>
      <div class="mission-objective">
        <span>OBJECTIVE / 当前目标</span>
        <p>${esc(level.objective)}</p>
      </div>
      <div class="mission-block">
        <span class="mini-label">CONCEPTS / 本关知识点</span>
        <div class="mission-chips">${chips}</div>
      </div>
      ${npcNames.length ? `
        <div class="mission-block">
          <span class="mini-label">FIELD CONTACT / 场内在场</span>
          <div class="mission-chips">${npcNames.map((name) => `<span>${esc(name)}</span>`).join("")}</div>
        </div>` : ""}
      <span class="mission-terminal-line">
        <i></i> ${level.bossFight ? "BOSS LINK" : "TERMINAL"} · ${esc(level.terminal?.label || "主分支控制台")}
        ${level.door ? ` → ${esc(level.door.label)}` : " → NULL CORE"}
      </span>
      ${reward ? `
        <div class="mission-reward${hasReward ? " is-locked" : ""}">
          <span class="mission-reward-icon">${esc(reward.lang.slice(0, 2))}</span>
          <div>
            <b>${esc(reward.title)}</b>
            <span>${hasReward ? "知识卡已收录" : "首次修复可收录知识卡"}</span>
          </div>
        </div>` : ""}
      ${done ? `<div class="mission-rank"><span>历史评定 / BEST</span><b>${esc(rank || "C")}</b></div>` : ""}
      ${unlocked ? "" : `<div class="mission-locked-note">${esc(lockCopy)} Null 的监听范围不会因为硬闯而缩小。</div>`}
      ${unlocked
        ? `<button class="btn btn-primary mission-start" type="button" data-start-level="${level.id}">
             ${done ? "重入这道裂隙" : level.bossFight ? "接入主分支控制台" : "启动修复"} <span class="btn-arrow">→</span>
           </button>`
        : `<button class="btn btn-outline mission-start" type="button" disabled>前置裂隙未修复</button>`}
      <p class="mission-note">${done ? "重玩会保留最高评定，知识卡不会重复消耗。" : "答错只记一次失误，不会锁死关卡。"}</p>
    </div>`;
}

/* ------------------------------------------------------------
   Dialogue
   ------------------------------------------------------------ */

function dialogueInitialFor(who) {
  const name = String(who || "");
  if (!name) return "?";
  if (name === "SYSTEM") return "S";
  if (name === "灵宝") return "灵";
  if (name === "NULL") return "N";
  return name.slice(0, 1);
}

function beginDialogue(lines, { onDone = null, kind = "story" } = {}) {
  const usable = (lines || []).filter((line) => line && line.text);
  if (!usable.length) {
    onDone?.();
    refreshEnginePause();
    return;
  }

  window.clearTimeout(state.dialogueTimer);
  state.engine?.pause();
  state.dialogue = {
    lines: usable,
    index: 0,
    onDone,
    kind,
    typing: false,
    fullText: "",
    shown: 0,
    lastFocus: document.activeElement
  };
  el.dialogueLayer.classList.remove("is-hidden");
  renderDialogueLine();
  window.setTimeout(() => {
    if (state.dialogue) el.dialogueNext.focus({ preventScroll: true });
  }, 80);
}

function renderDialogueLine() {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  const line = dialogue.lines[dialogue.index];
  window.clearTimeout(state.dialogueTimer);

  el.dialogueShell.className = `dialogue-shell tone-${line.tone || "npc"}`;
  el.dialogueWho.textContent = line.who || "未知信号";
  el.dialogueInitial.textContent = dialogueInitialFor(line.who);
  el.dialogueCounter.textContent = `${pad2(dialogue.index + 1)} / ${pad2(dialogue.lines.length)}`;
  el.dialogueNext.innerHTML = dialogue.index === dialogue.lines.length - 1
    ? "结束 <span>SPACE</span>"
    : "继续 <span>SPACE</span>";

  const full = String(line.text);
  dialogue.fullText = full;
  dialogue.shown = 0;
  dialogue.typing = true;
  el.dialogueText.textContent = "";

  const caret = document.createElement("span");
  caret.className = "caret";
  el.dialogueText.append(caret);

  const step = full.length > 90 ? 14 : full.length > 46 ? 20 : 28;
  const tick = () => {
    if (!state.dialogue || state.dialogue !== dialogue) return;
    dialogue.shown += 1;
    el.dialogueText.textContent = full.slice(0, dialogue.shown);
    if (dialogue.shown < full.length) {
      el.dialogueText.append(caret);
      state.dialogueTimer = window.setTimeout(tick, step);
    } else {
      dialogue.typing = false;
      caret.remove();
    }
  };
  state.dialogueTimer = window.setTimeout(tick, step);
}

function revealDialogueLine() {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  window.clearTimeout(state.dialogueTimer);
  dialogue.typing = false;
  dialogue.shown = dialogue.fullText.length;
  el.dialogueText.textContent = dialogue.fullText;
}

function advanceDialogue() {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  if (dialogue.typing) {
    revealDialogueLine();
    return;
  }
  if (dialogue.index < dialogue.lines.length - 1) {
    dialogue.index += 1;
    audio.play("ui");
    renderDialogueLine();
  } else {
    closeDialogue();
  }
}

function closeDialogue() {
  const dialogue = state.dialogue;
  if (!dialogue) return;
  window.clearTimeout(state.dialogueTimer);
  state.dialogue = null;
  el.dialogueLayer.classList.add("is-hidden");
  el.dialogueNext.blur();
  const done = dialogue.onDone;
  done?.();
  updateCompanionContext();
  refreshEnginePause();
}

/* ------------------------------------------------------------
   Game lifecycle
   ------------------------------------------------------------ */

function refreshEnginePause() {
  const engine = state.engine;
  if (!engine || state.screen !== "game") return;
  const blocked = Boolean(
    state.dialogue ||
      state.puzzle ||
      state.pauseOpen ||
      state.completeOpen ||
      state.endingOpen ||
      state.knowledgeOpen ||
      state.quickQuizOpen ||
      lingbao?.quizOpen ||
      lingbao?.panelOpen
  );
  if (blocked) {
    engine.pause();
  } else if (!engine.finished) {
    engine.resume();
  }
}

function clearSceneTimer() {
  window.clearTimeout(state.sceneTimer);
  el.sceneTitle.classList.remove("is-visible");
}

function showSceneTitle(level, campaign) {
  clearSceneTimer();
  el.sceneKicker.textContent = `RIFT ENTRY / ${campaign.label}`;
  el.sceneName.textContent = level.title;
  el.sceneSub.textContent = `${level.worldLabel} / ${level.titleEn}`;
  void el.sceneTitle.offsetWidth;
  el.sceneTitle.classList.add("is-visible");
  state.sceneTimer = window.setTimeout(() => {
    el.sceneTitle.classList.remove("is-visible");
  }, 4400);

  el.sceneFlash.classList.remove("is-active");
  void el.sceneFlash.offsetWidth;
  el.sceneFlash.classList.add("is-active");
  window.setTimeout(() => el.sceneFlash.classList.remove("is-active"), 520);
}

function resetGameChrome() {
  el.questCores.textContent = "源核 0/0";
  el.questTitle.textContent = "正在建立裂隙连接";
  el.questDetail.textContent = "终端信号接入中。";
  el.questBar.style.width = "0%";
  el.bossHud.hidden = true;
  el.bossHudTrack?.replaceChildren();
  el.interactHint.classList.add("is-hidden");
  el.interactText.textContent = "交互";
  el.bitCounter.textContent = "000";
  el.heartRow.replaceChildren();
  el.rewindRow.replaceChildren();
  resetCircuitUi();
  clearSceneTimer();
}

function renderGameChrome(level, campaign) {
  el.gameCampaignCode.textContent = `${campaign.label} BRANCH`;
  el.gameWorldLabel.textContent = level.worldLabel;
  el.gameLevelTitle.textContent = level.title;
  el.questTitle.textContent = level.objective;
  el.questDetail.textContent = level.mission;
  el.questCores.textContent = level.bossFight ? `壳 0/${level.bossFight.maxHp || 3}` : "源核 0/0";
  el.questBar.style.width = "0%";
  el.bossHud.hidden = !level.bossFight;
  if (level.bossFight) {
    el.bossHudTitle.textContent = level.bossFight.name || "NULL POINTER";
    el.bossHudTrack?.replaceChildren(
      ...Array.from({ length: level.bossFight.maxHp || 3 }, () => {
        const segment = document.createElement("span");
        segment.className = "boss-seg";
        return segment;
      })
    );
  } else {
    el.bossHudTrack?.replaceChildren();
  }
  if (level.fieldCircuit && !level.bossFight) updateCircuitUi(null);
  else resetCircuitUi();
  el.interactHint.classList.add("is-hidden");
  el.bitCounter.textContent = "000";
}

function updateHud(hud) {
  state.hud = hud;
  const heartCount = Math.max(1, Number(hud.maxHp) || 3);
  if (el.heartRow.childElementCount !== heartCount) {
    el.heartRow.replaceChildren(
      ...Array.from({ length: heartCount }, () => document.createElement("i"))
    );
  }
  [...el.heartRow.children].forEach((node, index) => {
    node.classList.toggle("is-empty", index >= hud.hp);
  });
  el.heartRow.setAttribute("aria-label", `生命值 ${hud.hp}`);

  const inkCount = Math.max(1, Number(hud.maxInk) || 3);
  if (el.rewindRow.childElementCount !== inkCount) {
    el.rewindRow.replaceChildren(
      ...Array.from({ length: inkCount }, () => document.createElement("i"))
    );
  }
  [...el.rewindRow.children].forEach((node, index) => {
    node.classList.toggle("is-empty", index >= hud.ink);
  });
  el.rewindRow.setAttribute("aria-label", `回溯墨水 ${hud.ink}`);

  el.bitCounter.textContent = String(hud.bits || 0).padStart(3, "0");

  if (hud.boss) {
    el.questCores.textContent = `壳 ${hud.bossSolved || 0}/${hud.bossMax || 3}`;
    el.questBar.style.width = `${Math.round(((hud.bossSolved || 0) / Math.max(1, hud.bossMax || 3)) * 100)}%`;
    el.questTitle.textContent = hud.bossDefeated ? "NullPointer 已被捕获" : state.level?.objective || "击破三层壳";
    if (hud.bossDefeated) {
      el.questDetail.textContent = "三层逻辑壳全部碎裂。主分支控制台正在重新编译。";
    } else {
      el.questDetail.textContent = `接入主分支控制台，已达 ${hud.bossSolved || 0} / ${hud.bossMax || 3} 层。`;
    }
    el.bossHud.hidden = false;
    if (el.bossHudTrack) {
      [...el.bossHudTrack.children].forEach((node, index) => {
        node.classList.toggle("is-broken", index < (hud.bossSolved || 0));
      });
    }
  } else {
    const circuit = hud.circuit;
    if (circuit && !circuit.solved) {
      const ratio = circuit.total ? circuit.progress / circuit.total : 0;
      el.questCores.textContent = `回路 ${circuit.progress}/${circuit.total}`;
      el.questBar.style.width = `${Math.round(ratio * 60)}%`;
      el.questTitle.textContent = "接通场域回路";
      el.questDetail.textContent = state.level?.fieldCircuit?.objective
        || "按代码的执行顺序接通场景里的中继。";
    } else if (!hud.terminalSolved) {
      el.questCores.textContent = "终端待修复";
      el.questBar.style.width = "70%";
      el.questTitle.textContent = state.level?.objective || "修复当前裂隙";
      el.questDetail.textContent = circuit?.solved
        ? "回路已闭合。终端恢复供电，接入它完成最后判定。"
        : state.level?.mission || "找到终端并完成修复。";
    } else {
      el.questCores.textContent = "编译门解锁";
      el.questBar.style.width = "100%";
      el.questTitle.textContent = "裂隙已修复";
      el.questDetail.textContent = "终端已修复，编译门解锁。去把出口撞开。";
    }
    el.bossHud.hidden = true;
  }
  updateCompanionContext();
}

function updateCircuitUi(circuit = state.circuit) {
  const level = state.level;
  if (!level?.fieldCircuit || level.bossFight) {
    el.fieldConsole.classList.add("is-hidden");
    return;
  }
  el.fieldConsole.classList.remove("is-hidden");
  el.fieldConsole.classList.toggle("is-solved", Boolean(circuit?.solved));
  const progress = Math.max(0, Number(circuit?.progress) || 0);
  const total = Math.max(1, Number(circuit?.total) || level.fieldCircuit.solution.length);
  el.fieldProgress.textContent = `${progress} / ${total}`;
  el.fieldTitle.textContent = circuit?.title || level.fieldCircuit.title;
  el.fieldPrompt.textContent = circuit?.prompt || level.fieldCircuit.prompt;
  const codeNode = el.fieldCode.querySelector("code") || el.fieldCode;
  codeNode.textContent = circuit?.code || level.fieldCircuit.code;
  el.fieldMessage.textContent = circuit?.message
    || (circuit?.solved ? "回路闭合。去接入终端。" : "靠近中继，按 E 接通。");
  el.fieldHintBtn.disabled = Boolean(circuit?.solved);
  el.fieldHintBtn.textContent = circuit?.solved ? "已闭合" : "灵宝指路";

  el.fieldSteps.replaceChildren();
  const steps = circuit?.steps || level.fieldCircuit.solution.map((id, index) => {
    const pad = level.fieldCircuit.pads.find((item) => item.id === id);
    return { index, label: pad?.label || `中继 ${index + 1}`, active: false };
  });
  steps.forEach((step, index) => {
    const chip = document.createElement("span");
    chip.className = "field-step";
    if (step.active) chip.classList.add("is-active");
    else if (index === progress) chip.classList.add("is-next");
    const number = document.createElement("i");
    number.textContent = String(index + 1).padStart(2, "0");
    chip.append(number, document.createTextNode(step.active ? step.label : index === progress ? "下一个" : "未接通"));
    el.fieldSteps.append(chip);
  });
}

function resetCircuitUi() {
  el.fieldConsole.classList.add("is-hidden");
  el.fieldConsole.classList.remove("is-solved");
  el.fieldSteps.replaceChildren();
  el.fieldMessage.textContent = "";
  el.fieldHintBtn.disabled = false;
  el.fieldHintBtn.textContent = "灵宝指路";
}

function handleCircuit(payload) {
  if (!payload) return;
  state.circuit = payload;
  updateCircuitUi(payload);
  if (payload.type === "wrong") {
    state.companionMood = "serious";
    state.recent = payload.message || "回路顺序不对。";
    const expected = payload.expected;
    if (!state.dialogue && !state.puzzle && !state.quickQuizOpen) {
      lingbao?.say(
        expected
          ? `顺序不对。${payload.pad?.why || ""} 先把「${expected.label}」接通。${expected.coach || ""}`
          : payload.message || "顺序不对，回到代码第一行重新读。",
        { mood: "serious", timeout: 7800 }
      );
    }
  } else if (payload.type === "progress" || payload.type === "repeat") {
    state.recent = payload.message || state.recent;
  }
  updateCompanionContext();
}

function chooseQuickQuiz(circuit, hp) {
  const base = state.level?.quickQuiz;
  if (!base) return null;
  const struggle = (circuit?.mistakes || 0) >= 2 || (Number.isFinite(hp) ? hp : 3) <= 1;
  if (struggle && base.easy) {
    return { ...base.easy, id: base.id, explain: base.easy.explain || base.explain };
  }
  return base;
}

function handleCompanionCue(payload) {
  if (!payload || payload.type !== "quiz" || state.quickQuizOpen) return;
  if (state.phase !== "playing" || state.dialogue || state.puzzle || state.pauseOpen || state.knowledgeOpen) return;
  const quiz = chooseQuickQuiz(payload.circuit, payload.hp);
  if (!quiz) return;
  const struggle = (payload.circuit?.mistakes || 0) >= 2 || (payload.hp ?? 3) <= 1;
  const opened = lingbao?.askQuiz({
    quiz,
    struggle,
    note: struggle ? "刚才中继接错了几次，换一个最小的问法。答错不扣血。" : undefined,
    onAnswer: ({ correct }) => {
      if (correct) {
        const reward = state.engine?.rewardQuickQuiz();
        state.recent = "随堂一问答对了，回路认知奖励到账。";
        toast(`INSIGHT + 回路理解正确 · 墨水 +${reward?.inkGained || 0} · 碎片 +${reward?.bitsGained || 0}`, "success");
        audio.play("success");
      } else {
        state.companionMood = "worried";
        state.recent = "随堂一问答错了，灵宝把解释留在了气泡里。";
        toast("答错不扣血。把解释读完后继续。", "warn");
      }
      updateCompanionContext();
    },
    onClose: () => {
      state.quickQuizOpen = false;
      refreshEnginePause();
      updateCompanionContext();
    }
  });
  if (!opened) return;
  state.quickQuizOpen = true;
  state.engine?.pause();
  state.companionMood = "serious";
  updateCompanionContext();
}

function handleCircuitSolved({ circuit } = {}) {
  const level = state.level;
  if (!level) return;
  const rewardId = circuit?.rewardId || level.fieldCircuit?.rewardId || level.puzzle?.rewardId;
  if (rewardId) addKnowledge(rewardId);
  state.recent = "场域回路闭合，终端恢复供电。";
  updateCircuitUi(circuit || state.circuit);
  updateCompanionContext();
}

function teardownGame() {
  clearSceneTimer();
  window.clearTimeout(state.dialogueTimer);
  if (state.engine) {
    try {
      state.engine.destroy();
    } catch {
      // The engine may already be mid-frame during a page transition.
    }
  }
  state.engine = null;
  state.level = null;
  state.hud = null;
  state.runStats = null;
  state.circuit = null;
  state.quickQuizOpen = false;
  state.phase = "idle";
  state.dialogue = null;
  state.puzzle = null;
  state.pauseOpen = false;
  state.completeOpen = false;
  state.endingOpen = false;
  state.endingCampaign = null;
  state.knowledgeOpen = false;

  el.dialogueLayer.classList.add("is-hidden");
  el.puzzleLayer.classList.add("is-hidden");
  el.pauseLayer.classList.add("is-hidden");
  el.completeLayer.classList.add("is-hidden");
  el.endingOverlay.classList.add("is-hidden");
  el.knowledgeOverlay.classList.add("is-hidden");
  el.bossHud.hidden = true;
  el.interactHint.classList.add("is-hidden");
  resetGameChrome();
  resetCircuitUi();
  setPuzzleLabOpen(false);
  resetPuzzleTrace();

  if (lingbao?.quizOpen) lingbao.endQuiz({ silent: true });
  if (lingbao?.panelOpen) lingbao.closePanel();
  lingbao?.hideWidget();
  lingbao?.hideBubble();
  syncBodyModal();
}

function startLevel(levelId) {
  const level = LEVEL_LOOKUP[levelId];
  if (!level) return;
  if (!isLevelUnlocked(level)) {
    audio.play("locked");
    toast("前置裂隙还没修复。Null 不会为热情开门。", "warn");
    return;
  }
  const campaign = getCampaign(level.campaign);
  if (!campaign) return;

  audio.unlock();
  teardownGame();
  state.campaignKey = level.campaign;
  state.selectedLevelId = level.id;
  state.level = level;
  state.phase = "intro";
  state.pendingPrologue = !state.save.prologueSeen;
  state.companionMood = "neutral";
  state.recent = `进入「${level.title}」。`;

  state.save.lastCampaign = campaign.key;
  state.save.lastLevel = level.id;
  persistSave();

  applyTheme(campaign);
  showScreen("game");
  renderGameChrome(level, campaign);
  audio.setMood(level.musicMood || campaignMood(campaign.key));
  showSceneTitle(level, campaign);

  try {
    state.engine = new GameEngine({
      canvas: el.gameCanvas,
      level,
      audio,
      callbacks: {
        onHud: updateHud,
        onInteract: (target) => {
          if (target) {
            el.interactText.textContent = target.label;
            el.interactHint.classList.remove("is-hidden");
          } else {
            el.interactHint.classList.add("is-hidden");
          }
        },
        onDialogue: handleNpcDialogue,
        onPuzzle: (payload) => openPuzzle(payload),
        onCircuit: handleCircuit,
        onCompanionCue: handleCompanionCue,
        onCircuitSolved: handleCircuitSolved,
        onDoor: () => handleDoor(level),
        onCheckpoint: ({ x }) => {
          state.recent = `检查点已同步（x=${Math.round(x)}）。`;
          updateCompanionContext();
        },
        onHint: ({ text, mood }) => {
          state.companionMood = mood || "neutral";
          setRecent(text);
          lingbao?.say(text, { mood: mood || "neutral", timeout: 8600 });
          if (String(text).includes("回溯完成")) addKnowledge("debug-rewind");
        },
        onToast: (text, tone) => toast(text, tone),
        onTerminalSolved: () => {
          state.recent = "终端修复完成，编译门已解锁。";
          updateCompanionContext();
        }
      }
    });
    state.engine.start();
  } catch (error) {
    console.error("[code-rift] failed to boot level", error);
    toast("裂隙加载失败。灵宝建议先退回星图重试。", "error");
    openCampaign(campaign.key);
    return;
  }

  lingbao?.showWidget({ enter: true });
  updateCompanionContext();

  const intro = [];
  if (state.pendingPrologue) intro.push(...GAME_META.prologue);
  intro.push(...(level.intro || []));

  beginDialogue(intro, {
    kind: "intro",
    onDone: () => {
      if (state.pendingPrologue) {
        state.save.prologueSeen = true;
        state.pendingPrologue = false;
        persistSave();
      }
      state.phase = "playing";
      state.recent = level.bossFight
        ? "主分支控制台就在前方，三层壳正在等你。"
        : `目标：${level.objective}`;
      updateCompanionContext();
      refreshEnginePause();
      window.setTimeout(() => {
        if (state.screen !== "game" || !state.engine || state.engine.finished) return;
        if (level.fieldCircuit && !level.bossFight) return;
        const bubble = level.bossFight
          ? "先靠近主分支控制台，按 E 接入。答对一层，壳就碎一层。"
          : `目标：${level.objective}。看到终端就按 E，别和它先讲道理。`;
        lingbao?.say(bubble, { mood: "serious", timeout: 8600 });
      }, 500);
    }
  });
}

function handleNpcDialogue(payload) {
  if (!payload?.lines?.length) {
    if (payload?.firstTime && payload?.rewardId) addKnowledge(payload.rewardId);
    refreshEnginePause();
    return;
  }
  beginDialogue(payload.lines, {
    kind: "npc",
    onDone: () => {
      if (payload.firstTime && payload.rewardId) addKnowledge(payload.rewardId);
      state.recent = `和「${payload.npc?.name || "场中人"}」谈过话。`;
      updateCompanionContext();
    }
  });
}

/* ------------------------------------------------------------
   Terminals & boss shells
   ------------------------------------------------------------ */

function fileExtensionFor(level) {
  if (level.language === "PYTHON") return "py";
  if (level.language === "C") return "c";
  return "java";
}

function updateBossShells() {
  const boss = state.engine?.getBossState();
  if (!boss) return;
  const nodes = [...el.puzzleBossShells.children];
  nodes.forEach((node, index) => node.classList.toggle("is-broken", index < boss.solved));
  el.puzzleBossLabel.textContent = `BOSS // SHELL ${Math.min(boss.solved + 1, boss.maxHp)}/${boss.maxHp}`;
}

function setPuzzleLabOpen(open) {
  const allowed = Boolean(state.puzzle?.current?.lesson || state.puzzle?.current?.trace?.length);
  const next = Boolean(open && allowed);
  el.puzzleLab.classList.toggle("is-open", next);
  el.puzzleLab.classList.toggle("is-hidden", !allowed);
  el.puzzleLabToggle.setAttribute("aria-expanded", String(next));
  el.puzzleLabBody.hidden = !next;
}

function clearPuzzleTraceHighlight() {
  el.puzzleCode.querySelectorAll(".is-trace").forEach((node) => node.classList.remove("is-trace"));
  el.puzzleLines.querySelectorAll(".is-trace").forEach((node) => node.classList.remove("is-trace"));
}

function renderPuzzleTrace() {
  const puzzle = state.puzzle;
  const steps = puzzle?.current?.trace || [];
  const index = Number.isInteger(puzzle?.traceIndex) ? puzzle.traceIndex : -1;
  const shown = Math.max(0, index + 1);
  el.puzzleTraceCounter.textContent = `${shown} / ${steps.length}`;
  if (!steps.length) {
    el.puzzleTraceLabel.textContent = "没有可追踪步骤";
    el.puzzleTraceNote.textContent = "先读一遍代码，再回到答案。";
    el.puzzleTraceStep.disabled = true;
    return;
  }
  el.puzzleTraceStep.disabled = false;
  clearPuzzleTraceHighlight();
  if (index < 0) {
    el.puzzleTraceLabel.textContent = "准备执行";
    el.puzzleTraceNote.textContent = "点“下一步”，让代码在眼前跑一遍。";
    el.puzzleTraceStep.textContent = "下一步执行 →";
    return;
  }
  const step = steps[index];
  el.puzzleTraceLabel.textContent = step.label || `第 ${index + 1} 步`;
  el.puzzleTraceNote.textContent = step.note || "";
  el.puzzleTraceStep.textContent = index >= steps.length - 1 ? "重新执行 ↺" : "下一步执行 →";
  const target = puzzle.current.type === "lines"
    ? el.puzzleLines.querySelector(`.code-line[data-line="${step.line}"]`)
    : el.puzzleCode.querySelector(`.code-row[data-line="${step.line}"]`);
  if (target) {
    target.classList.add("is-trace");
    const scroller = target.closest(".code-scroll");
    if (scroller) {
      const targetTop = target.offsetTop - scroller.clientHeight / 2 + target.offsetHeight / 2;
      scroller.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }
}

function stepPuzzleTrace() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  const steps = puzzle.current?.trace || [];
  if (!steps.length) return;
  const index = Number.isInteger(puzzle.traceIndex) ? puzzle.traceIndex : -1;
  if (index >= steps.length - 1) {
    puzzle.traceIndex = -1;
  } else {
    puzzle.traceIndex = index + 1;
  }
  renderPuzzleTrace();
  audio.play("ui");
}

function resetPuzzleTrace() {
  if (state.puzzle) state.puzzle.traceIndex = -1;
  clearPuzzleTraceHighlight();
  el.puzzleTraceCounter.textContent = `0 / ${state.puzzle?.current?.trace?.length || 0}`;
  el.puzzleTraceLabel.textContent = "准备执行";
  el.puzzleTraceNote.textContent = "点“下一步”，让代码在眼前跑一遍。";
  el.puzzleTraceStep.textContent = "下一步执行 →";
  el.puzzleTraceStep.disabled = false;
}

function renderPuzzleCodeRows(code) {
  const codeNode = el.puzzleCode.querySelector("code") || el.puzzleCode;
  codeNode.replaceChildren();
  String(code || "").split("\n").forEach((text, index) => {
    const row = document.createElement("span");
    row.className = "code-row";
    row.dataset.line = String(index);
    row.textContent = text || " ";
    codeNode.append(row);
  });
}

function renderOrderAnswer() {
  const puzzle = state.puzzle;
  const current = puzzle?.current;
  if (!puzzle || current?.type !== "order") return;
  const items = current.items || [];
  if (!Array.isArray(puzzle.order)) puzzle.order = [];
  const pool = items.filter((item) => !puzzle.order.includes(item.id));

  const wrap = document.createElement("div");
  wrap.className = "answer-order";
  const kicker = document.createElement("div");
  kicker.className = "order-kicker";
  const label = document.createElement("span");
  label.textContent = "EXECUTION ORDER";
  const count = document.createElement("b");
  count.textContent = `${puzzle.order.length} / ${items.length}`;
  kicker.append(label, count);

  const sequence = document.createElement("div");
  sequence.className = "order-sequence";
  if (!puzzle.order.length) {
    const placeholder = document.createElement("span");
    placeholder.className = "order-placeholder";
    placeholder.textContent = "从下面的语句里挑第一步";
    sequence.append(placeholder);
  }
  puzzle.order.forEach((id, index) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "order-placed";
    button.dataset.orderIndex = String(index);
    const number = document.createElement("i");
    number.textContent = pad2(index + 1);
    button.append(number, document.createTextNode(item.label));
    button.title = "点击移出序列";
    button.addEventListener("click", () => {
      if (state.puzzle?.solved) return;
      puzzle.order.splice(index, 1);
      audio.play("ui");
      renderOrderAnswer();
      updatePuzzleSubmitAvailability();
    });
    sequence.append(button);
  });

  const poolWrap = document.createElement("div");
  poolWrap.className = "order-pool";
  pool.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "order-chip";
    button.textContent = item.label;
    button.addEventListener("click", () => {
      if (state.puzzle?.solved) return;
      if (puzzle.order.length >= items.length) return;
      puzzle.order.push(item.id);
      audio.play("ui");
      renderOrderAnswer();
      updatePuzzleSubmitAvailability();
    });
    poolWrap.append(button);
  });

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "text-btn order-reset";
  reset.textContent = "清空重排";
  reset.addEventListener("click", () => {
    if (state.puzzle?.solved) return;
    puzzle.order = [];
    audio.play("ui");
    renderOrderAnswer();
    updatePuzzleSubmitAvailability();
  });

  wrap.append(kicker, sequence, poolWrap, reset);
  el.puzzleAnswerArea.replaceChildren(wrap);
}

function renderPuzzleLab(puzzle) {
  const hasLab = Boolean(puzzle?.lesson || puzzle?.trace?.length);
  if (!hasLab) {
    setPuzzleLabOpen(false);
    el.puzzleLab.classList.add("is-hidden");
    return;
  }
  el.puzzleLesson.textContent = puzzle.lesson || "先读代码，再让执行过程走一遍。";
  if (state.puzzle) state.puzzle.traceIndex = -1;
  setPuzzleLabOpen(true);
  renderPuzzleTrace();
}

function loadPuzzleQuestion(payload) {
  const { source, puzzle, questionIndex = 0 } = payload;
  if (!puzzle) return;
  const level = state.level;
  const campaign = level ? getCampaign(level.campaign) : null;
  if (!level || !campaign) return;

  if (!state.puzzle) {
    state.engine?.pause();
    state.puzzle = {
      source,
      attempts: 0,
      hintUsed: false,
      solved: false,
      lockClose: false
    };
    el.puzzleLayer.classList.remove("is-hidden");
  }

  const puzzleState = state.puzzle;
  puzzleState.source = source;
  puzzleState.boss = source === "boss";
  puzzleState.current = puzzle;
  puzzleState.questionIndex = questionIndex;
  puzzleState.attempts = 0;
  puzzleState.hintUsed = false;
  puzzleState.hintRevealed = false;
  puzzleState.solved = false;
  puzzleState.lockClose = false;
  puzzleState.selectedIndex = null;
  puzzleState.selectedLine = null;
  puzzleState.order = [];
  puzzleState.traceIndex = -1;
  puzzleState.value = "";

  el.puzzleBranch.textContent = campaign.label.slice(0, 1);
  el.puzzleLangTag.textContent = level.language;
  el.puzzleBossLabel.hidden = !puzzleState.boss;
  el.puzzleBossBar.hidden = !puzzleState.boss;
  el.puzzleEyebrow.textContent = puzzleState.boss
    ? `BOSS LINK / SHELL ${questionIndex + 1} OF ${level.bossFight?.maxHp || 3}`
    : "ROGUE TERMINAL / REPAIR PROTOCOL";
  el.puzzleTitle.textContent = puzzle.title;
  el.puzzleSubtitle.textContent = puzzle.subtitle || "";
  el.puzzleFileName.textContent = `${String(puzzle.id || "rift_fix").replace(/-/g, "_")}.${fileExtensionFor(level)}`;
  el.puzzleLineCount.textContent = String(String(puzzle.code || "").split("\n").length);
  el.puzzlePrompt.textContent = puzzle.prompt || "读懂代码，再做判断。";
  updateBossShells();

  el.puzzleFeedback.className = "puzzle-feedback is-hidden";
  el.puzzleFeedback.replaceChildren();
  el.puzzleHintText.hidden = true;
  el.puzzleHintText.textContent = puzzle.hint || "";
  el.puzzleHintBtn.disabled = false;
  el.puzzleHintBtn.innerHTML = "<i>?</i> 让灵宝提示";
  el.puzzleSubmit.hidden = true;
  el.puzzleSubmit.disabled = false;
  el.puzzleSubmit.innerHTML = `写入修复 <span>ENTER</span>`;
  el.puzzleExit.hidden = false;
  el.puzzleClose.disabled = false;
  el.puzzleClose.removeAttribute("aria-disabled");

  const linesMode = puzzle.type === "lines";
  el.puzzleCode.hidden = linesMode;
  el.puzzleLines.classList.toggle("is-hidden", !linesMode);
  renderPuzzleCodeRows(puzzle.code || "");
  el.puzzleLines.replaceChildren();
  el.puzzleAnswerArea.replaceChildren();

  if (linesMode) {
    const codeLines = String(puzzle.code || "").split("\n");
    codeLines.forEach((text, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-line";
      button.dataset.line = String(index);
      const number = document.createElement("i");
      number.textContent = pad2(index + 1);
      const code = document.createElement("code");
      code.textContent = text || " ";
      button.append(number, code);
      button.addEventListener("click", () => selectPuzzleLine(index, button));
      el.puzzleLines.append(button);
    });
    const note = document.createElement("div");
    note.className = "answer-fill-hint";
    note.innerHTML = "<span>点击左侧真正出错的那一行</span><span>LINE SELECT</span>";
    el.puzzleAnswerArea.append(note);
  } else if (puzzle.type === "choice") {
    (puzzle.options || []).forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-option";
      button.dataset.index = String(index);
      const badge = document.createElement("span");
      badge.className = "option-index";
      badge.textContent = String.fromCharCode(65 + index);
      const label = document.createElement("span");
      label.className = "option-label";
      label.textContent = option.label;
      button.append(badge, label);
      button.addEventListener("click", () => selectPuzzleOption(index));
      el.puzzleAnswerArea.append(button);
    });
  } else if (puzzle.type === "order") {
    renderOrderAnswer();
  } else {
    const wrap = document.createElement("div");
    wrap.className = "answer-fill";
    wrap.innerHTML = `
      <div class="answer-fill-row">
        <span>&gt;</span>
        <input id="puzzleFillInput" type="text" autocomplete="off" spellcheck="false"
          placeholder="${esc(puzzle.placeholder || "输入结果")}" aria-label="输入答案">
      </div>
      <div class="answer-fill-hint"><span>${esc(puzzle.inputHint || "只填最终结果")}</span><span>ENTER TO COMMIT</span></div>`;
    el.puzzleAnswerArea.append(wrap);
    const input = wrap.querySelector("input");
    input.addEventListener("input", () => {
      if (!state.puzzle) return;
      state.puzzle.value = input.value;
      updatePuzzleSubmitAvailability();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        submitPuzzle();
      }
    });
    if (!window.matchMedia("(pointer: coarse)").matches) {
      window.setTimeout(() => input.focus({ preventScroll: true }), 140);
    }
  }

  updateBossShells();
  updatePuzzleSubmitAvailability();
  renderPuzzleLab(puzzle);
  updateCompanionContext();
}

function openPuzzle(payload) {
  if (!payload?.puzzle) {
    toast("控制台返回了空题。灵宝建议先离开再接入一次。", "warn");
    return;
  }
  if (state.knowledgeOpen) closeKnowledge();
  if (state.dialogue) return;
  loadPuzzleQuestion(payload);
  audio.play("ui");
}

function selectPuzzleOption(index) {
  const puzzle = state.puzzle;
  if (!puzzle || puzzle.solved) return;
  puzzle.selectedIndex = index;
  [...el.puzzleAnswerArea.querySelectorAll(".answer-option")].forEach((button, buttonIndex) => {
    button.classList.toggle("is-selected", buttonIndex === index);
    button.classList.remove("is-wrong");
  });
  updatePuzzleSubmitAvailability();
}

function selectPuzzleLine(index, button) {
  const puzzle = state.puzzle;
  if (!puzzle || puzzle.solved) return;
  puzzle.selectedLine = index;
  [...el.puzzleLines.querySelectorAll(".code-line")].forEach((node) => {
    node.classList.toggle("is-selected", node === button);
    node.classList.remove("is-wrong");
  });
  updatePuzzleSubmitAvailability();
}

function updatePuzzleSubmitAvailability() {
  const puzzle = state.puzzle;
  if (!puzzle || puzzle.solved) return;
  let ready = false;
  if (puzzle.current?.type === "choice") ready = Number.isInteger(puzzle.selectedIndex);
  else if (puzzle.current?.type === "fill") ready = Boolean(String(puzzle.value || "").trim());
  else if (puzzle.current?.type === "lines") ready = Number.isInteger(puzzle.selectedLine);
  else if (puzzle.current?.type === "order") {
    ready = Array.isArray(puzzle.order)
      && puzzle.order.length === (puzzle.current.items || []).length;
  }
  el.puzzleSubmit.hidden = !ready;
  el.puzzleSubmit.disabled = !ready;
}

function showPuzzleFeedback(kind, title, message) {
  el.puzzleFeedback.className = `puzzle-feedback ${kind === "success" ? "is-success" : "is-error"}`;
  el.puzzleFeedback.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = title;
  el.puzzleFeedback.append(strong, document.createTextNode(message));
}

function normaliseFill(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function puzzleIsCorrect(puzzle, answerState) {
  if (puzzle.type === "choice") return answerState.selectedIndex === puzzle.correctIndex;
  if (puzzle.type === "lines") return answerState.selectedLine === puzzle.answerLine;
  if (puzzle.type === "order") {
    const expected = puzzle.solution || [];
    return expected.length === answerState.order.length
      && expected.every((id, index) => id === answerState.order[index]);
  }
  const value = normaliseFill(answerState.value);
  return (puzzle.answers || []).some((answer) => normaliseFill(answer) === value);
}

function markPuzzleWrong() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  const type = puzzle.current.type;
  if (type === "choice" && Number.isInteger(puzzle.selectedIndex)) {
    const option = el.puzzleAnswerArea.querySelectorAll(".answer-option")[puzzle.selectedIndex];
    option?.classList.add("is-wrong");
    option?.classList.remove("is-selected");
    puzzle.selectedIndex = null;
  } else if (type === "lines" && Number.isInteger(puzzle.selectedLine)) {
    const line = el.puzzleLines.querySelectorAll(".code-line")[puzzle.selectedLine];
    line?.classList.add("is-wrong");
    line?.classList.remove("is-selected");
    puzzle.selectedLine = null;
  } else if (type === "order") {
    const sequence = el.puzzleAnswerArea.querySelector(".order-sequence");
    sequence?.classList.add("is-wrong");
    sequence?.querySelectorAll(".order-placed").forEach((node) => node.classList.add("is-wrong"));
    window.setTimeout(() => {
      sequence?.classList.remove("is-wrong");
      sequence?.querySelectorAll(".order-placed").forEach((node) => node.classList.remove("is-wrong"));
    }, 900);
  }
  updatePuzzleSubmitAvailability();
}

function submitPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  if (puzzle.solved) {
    finishSolvedPuzzle();
    return;
  }
  if (el.puzzleSubmit.hidden) return;

  const answer = {
    selectedIndex: puzzle.selectedIndex,
    selectedLine: puzzle.selectedLine,
    order: Array.isArray(puzzle.order) ? [...puzzle.order] : [],
    value: puzzle.value
  };
  if (!puzzleIsCorrect(puzzle.current, answer)) {
    puzzle.attempts += 1;
    state.engine?.registerMistake();
    audio.play("locked");
    markPuzzleWrong();
    const prompt = puzzle.attempts >= 2
      ? "还是没对上。灵宝把执行过程摊开了，点「下一步执行」逐行走一遍，再改答案。"
      : puzzle.current.type === "lines"
        ? "这条路径不对。沿代码逐行看：哪一行先越界、解引用或让流程提前结束？"
        : puzzle.current.type === "fill"
          ? "先别猜。把表达式拆开，按执行顺序算出真正的值。"
          : puzzle.current.type === "order"
            ? "先后顺序还不对。想一想：谁先创建对象，谁才拿到参数，字段又是什么时候被写入？"
            : "还不是它。再看看变量真正指向的对象或下标，别急着换答案。";
    showPuzzleFeedback("error", `COMPILE FAILED // 尝试 ${puzzle.attempts}`, prompt);
    if (puzzle.attempts >= 2) setPuzzleLabOpen(true);
    if (puzzle.current.type === "fill") {
      const input = el.puzzleAnswerArea.querySelector("input");
      input?.focus();
      input?.select();
    }
    updateCompanionContext();
    return;
  }

  puzzle.solved = true;
  audio.play("success");
  if (puzzle.current.type === "choice") {
    const option = el.puzzleAnswerArea.querySelectorAll(".answer-option")[puzzle.current.correctIndex];
    option?.classList.add("is-correct");
    option?.classList.remove("is-wrong", "is-selected");
    el.puzzleAnswerArea.querySelectorAll(".answer-option").forEach((node) => {
      node.disabled = true;
    });
  } else if (puzzle.current.type === "lines") {
    const line = el.puzzleLines.querySelectorAll(".code-line")[puzzle.current.answerLine];
    line?.classList.add("is-correct");
    line?.classList.remove("is-wrong", "is-selected");
    el.puzzleLines.querySelectorAll(".code-line").forEach((node) => {
      node.disabled = true;
    });
  } else if (puzzle.current.type === "order") {
    el.puzzleAnswerArea.querySelectorAll(".order-placed").forEach((node) => {
      node.classList.add("is-correct");
      node.classList.remove("is-wrong");
      node.disabled = true;
    });
    el.puzzleAnswerArea.querySelectorAll(".order-chip, .order-reset").forEach((node) => {
      node.disabled = true;
    });
  } else {
    const input = el.puzzleAnswerArea.querySelector("input");
    if (input) input.disabled = true;
  }

  el.puzzleHintBtn.disabled = true;
  el.puzzleExit.hidden = true;
  updatePuzzleSubmitAvailability();

  const isBoss = puzzle.boss;
  if (isBoss) {
    const bossState = state.engine?.solveBossShell();
    const finalShell = !bossState || bossState.hp <= 0;
    if (finalShell) {
      state.engine?.defeatBoss();
      puzzle.lockClose = true;
      el.puzzleClose.disabled = true;
      el.puzzleClose.setAttribute("aria-disabled", "true");
      el.puzzleSubmit.innerHTML = `终结奇点 <span>ENTER</span>`;
    } else {
      el.puzzleSubmit.innerHTML = `迎接下一层 <span>ENTER</span>`;
    }
    el.puzzleSubmit.hidden = false;
    el.puzzleSubmit.disabled = false;
    showPuzzleFeedback(
      "success",
      finalShell ? "SHELL BREAK // 第三层壳碎裂" : `SHELL BREAK // 第 ${puzzle.questionIndex + 1} 层碎裂`,
      `${puzzle.current.explanation} ${puzzle.current.conceptLabel ? `概念已确认：${puzzle.current.conceptLabel}。` : ""}`
    );
    updateBossShells();
    state.recent = finalShell ? "NullPointer 的三层壳已全部碎裂。" : `击破第 ${puzzle.questionIndex + 1} 层对象壳。`;
  } else {
    state.engine?.solveTerminal();
    addKnowledge(puzzle.current.rewardId);
    el.puzzleSubmit.innerHTML = `完成修复 <span>ENTER</span>`;
    el.puzzleSubmit.hidden = false;
    el.puzzleSubmit.disabled = false;
    showPuzzleFeedback(
      "success",
      "COMPILE OK // 修复已写入",
      `${puzzle.current.explanation} ${puzzle.current.conceptLabel ? `概念归档：${puzzle.current.conceptLabel}。` : ""}`
    );
    state.recent = "终端修复完成，编译门已解锁。";
  }
  updateCompanionContext();
}

function finishSolvedPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle?.solved) return;
  if (puzzle.boss && puzzle.lockClose) {
    const level = state.level;
    closePuzzle(true);
    if (level) handleBossDefeated(level);
    return;
  }
  if (puzzle.boss) {
    const nextIndex = (state.engine?.getBossState()?.solved) || puzzle.questionIndex + 1;
    const question = state.level?.bossFight?.questions?.[nextIndex];
    if (question) {
      loadPuzzleQuestion({ source: "boss", puzzle: question, questionIndex: nextIndex });
      return;
    }
  }
  closePuzzle(true);
}

function closePuzzle(force = false) {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  if (puzzle.lockClose && !force) return;
  state.puzzle = null;
  el.puzzleLayer.classList.add("is-hidden");
  el.puzzleFeedback.className = "puzzle-feedback is-hidden";
  el.puzzleFeedback.replaceChildren();
  state.recent = state.recent || "离开终端。";
  updateCompanionContext();
  refreshEnginePause();
}

function revealPuzzleHint() {
  const puzzle = state.puzzle;
  if (!puzzle || puzzle.solved) return;
  if (puzzle.hintRevealed) {
    puzzle.hintRevealed = false;
    el.puzzleHintText.hidden = true;
    el.puzzleHintBtn.innerHTML = "<i>?</i> 让灵宝提示";
    return;
  }
  puzzle.hintRevealed = true;
  puzzle.hintUsed = true;
  state.engine?.registerHint();
  el.puzzleHintText.hidden = false;
  el.puzzleHintText.textContent = puzzle.current.hint || "先读最后一行输出，再回头读循环条件。";
  el.puzzleHintBtn.innerHTML = "<i>×</i> 收起提示";
  state.companionMood = "serious";
  setRecent(`终端提示：${puzzle.current.hint || "先观察变量。"}`);
  updateCompanionContext();
}

/* ------------------------------------------------------------
   Level completion and campaign ending
   ------------------------------------------------------------ */

function handleDoor(level) {
  if (!state.engine || !state.level) return;
  if (state.phase === "cleared") return;
  state.phase = "cleared";
  const stats = state.engine.finishRun();
  state.engine.pause();
  state.runStats = stats;
  recordCompletion(level, stats);
  if (state.engine?.getStats().rewinds > 0) addKnowledge("debug-rewind", { quiet: true });
  updateCompanionContext();

  const outro = level.outro || [];
  if (outro.length) {
    beginDialogue(outro, {
      kind: "outro",
      onDone: () => showComplete(level, stats)
    });
  } else {
    showComplete(level, stats);
  }
}

function handleBossDefeated(level) {
  if (!state.engine || !state.level) return;
  if (state.phase === "cleared") return;
  state.phase = "cleared";
  const stats = state.engine.finishRun();
  state.engine.pause();
  state.runStats = stats;
  recordCompletion(level, stats);
  updateCompanionContext();

  const victory = level.bossFight?.victory || [];
  lingbao?.hideWidget();
  if (victory.length) {
    beginDialogue(victory, {
      kind: "victory",
      onDone: () => showCampaignEnding(level.campaign)
    });
  } else {
    showCampaignEnding(level.campaign);
  }
}

function buildStatCell(label, value, emphasis = false) {
  const cell = document.createElement("div");
  const caption = document.createElement("span");
  caption.textContent = label;
  const valueNode = document.createElement("b");
  if (emphasis) {
    const em = document.createElement("em");
    em.textContent = value;
    valueNode.append(em);
  } else {
    valueNode.textContent = value;
  }
  cell.append(caption, valueNode);
  return cell;
}

function getNextLevel(level) {
  const campaign = getCampaign(level.campaign);
  if (!campaign) return null;
  const index = campaign.levels.findIndex((item) => item.id === level.id);
  return campaign.levels[index + 1] || null;
}

function showComplete(level, stats) {
  const ranked = rankFor(stats);
  const campaign = getCampaign(level.campaign);
  const next = getNextLevel(level);
  const card = level.puzzle?.rewardId ? KNOWLEDGE[level.puzzle.rewardId] : null;
  state.completeOpen = true;
  state.engine?.pause();

  el.completeRank.textContent = ranked.rank;
  el.completeRank.className = ranked.rank === "S" ? "rank-s" : ranked.rank === "A" ? "rank-a" : "";
  el.completeKicker.textContent = `${level.worldLabel.split(" / ")[0]} / CLEARED`;
  el.completeTitle.textContent = level.title;
  el.completeSubtitle.textContent = `${campaign?.name || "本分支"} · ${level.puzzle?.conceptLabel || "裂隙修复"} 已通过验证。${level.outro?.[0]?.text || "编译门重新合拢，世界暂时不漏。"}`;
  el.completeStats.replaceChildren(
    buildStatCell("TIME", formatTime(stats.time)),
    buildStatCell("CORES", `${stats.cores}/${stats.totalCores}`),
    buildStatCell("FRAGMENTS", `${stats.bits}/${stats.totalBits}`),
    buildStatCell("MISTAKES", String(stats.mistakes))
  );

  el.completeConcept.replaceChildren();
  if (card) {
    const icon = document.createElement("span");
    icon.className = "complete-concept-icon";
    icon.textContent = "KC";
    const copy = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = card.title;
    const summary = document.createElement("span");
    summary.textContent = card.summary;
    copy.append(title, summary);
    const tag = document.createElement("small");
    tag.textContent = "ARCHIVED";
    el.completeConcept.append(icon, copy, tag);
  }

  const aiLine = (level.outro || []).find((line) => line.tone === "ai") || (level.outro || []).at(-1);
  el.completeQuote.textContent = aiLine ? `“${aiLine.text}”` : GAME_META.endingQuote;

  if (next) {
    const label = next.bossFight ? "前往 Null 奇点" : "前往下一道裂隙";
    el.completeNextBtn.innerHTML = `${label} <span class="btn-arrow">→</span>`;
    el.completeNextBtn.dataset.level = next.id;
  } else {
    el.completeNextBtn.innerHTML = `返回星图 <span class="btn-arrow">→</span>`;
    el.completeNextBtn.dataset.level = "";
  }

  el.completeLayer.classList.remove("is-hidden");
  updateCompanionContext();
  refreshEnginePause();
  window.setTimeout(() => el.completeNextBtn.focus({ preventScroll: true }), 90);
}

function completeToMap() {
  const campaign = state.level ? state.level.campaign : state.campaignKey;
  openCampaign(campaign);
}

function showCampaignEnding(campaignKey) {
  const campaign = getCampaign(campaignKey);
  if (!campaign) return;
  const summary = campaignSummary(campaign);
  state.endingOpen = true;
  state.endingCampaign = campaign.key;
  state.campaignKey = campaign.key;
  state.engine?.pause();
  lingbao?.hideWidget();
  lingbao?.hideBubble();
  if (lingbao?.panelOpen) lingbao.closePanel();

  applyTheme(campaign);
  el.endingCampaign.textContent = campaign.label;
  el.endingSubtitle.textContent = `${campaign.name}的 Null 分身已被捕获并解释。你留下了 ${summary.archive} / ${summary.archiveTotal} 张本分支知识卡。`;
  el.endingQuote.textContent = GAME_META.endingQuote;
  el.endingNote.textContent = GAME_META.endingNote;
  el.endingAllClear.hidden = completedLevelCount() < GAME_META.totalLevels;
  el.endingStats.replaceChildren(
    buildStatCell("BEST TIME", formatTime(summary.time)),
    buildStatCell("SOURCE CORES", `${summary.cores}/${summary.totalCores}`),
    buildStatCell("ARCHIVE", `${summary.archive}/${summary.archiveTotal}`),
    buildStatCell("RANK", summary.bestRank, true)
  );

  el.endingOverlay.classList.remove("is-hidden");
  audio.setMood("void");
  state.recent = `${campaign.name}已稳定，NullPointer 被捕获。`;
  syncBodyModal();
  updateCompanionContext();
  refreshEnginePause();
  window.setTimeout(() => el.endingSelectBtn.focus({ preventScroll: true }), 100);
}

function endingBackToSelect() {
  if (!state.endingOpen) return;
  const campaignKey = state.endingCampaign || state.campaignKey;
  el.endingOverlay.classList.add("is-hidden");
  state.endingOpen = false;
  state.endingCampaign = null;
  syncBodyModal();
  audio.setMood("menu");
  openSelect();
}

function endingReplay() {
  const campaign = getCampaign(state.endingCampaign || state.campaignKey);
  if (!campaign) return;
  const boss = campaign.levels[campaign.levels.length - 1];
  el.endingOverlay.classList.add("is-hidden");
  state.endingOpen = false;
  syncBodyModal();
  startLevel(boss.id);
}

/* ------------------------------------------------------------
   Knowledge overlay
   ------------------------------------------------------------ */

function renderKnowledge() {
  const unlocked = KNOWLEDGE_IDS.filter((id) => state.save.knowledge[id]);
  el.knowledgeCount.textContent = `${unlocked.length} / ${TOTAL_KNOWLEDGE}`;
  [...el.knowledgeFilters.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.knowledgeFilter);
  });

  const list = KNOWLEDGE_IDS
    .map((id) => KNOWLEDGE[id])
    .filter((card) => state.knowledgeFilter === "ALL" || card.lang === state.knowledgeFilter);

  const empty = unlocked.length === 0;
  el.knowledgeGrid.hidden = empty;
  el.knowledgeEmpty.hidden = !empty;
  el.knowledgeGrid.replaceChildren();

  if (empty) return;

  for (const card of list) {
    const known = Boolean(state.save.knowledge[card.id]);
    const node = document.createElement("article");
    node.className = `knowledge-card${known ? "" : " is-locked"}`;

    const head = document.createElement("div");
    head.className = "knowledge-card-head";
    const lang = document.createElement("span");
    lang.className = "knowledge-card-lang";
    lang.textContent = card.lang;
    const tag = document.createElement("span");
    tag.className = "knowledge-card-tag";
    tag.textContent = known ? card.tag : "未解读";
    head.append(lang, tag);

    const title = document.createElement("h3");
    title.textContent = known ? card.title : "未解读信号";
    const summary = document.createElement("p");
    summary.textContent = known ? card.summary : "修复对应的裂隙、和场中人交谈，或者先学会撞墙之后回滚，就能把这张卡捞出来。";
    const foot = document.createElement("div");
    foot.className = "knowledge-card-foot";
    const status = document.createElement("span");
    if (known) {
      const dot = document.createElement("i");
      status.append(dot, document.createTextNode("已收录"));
    } else {
      status.textContent = "未收录";
    }
    const stamp = document.createElement("span");
    stamp.textContent = known ? formatDate(state.save.knowledge[card.id]) : "???";
    foot.append(status, stamp);

    node.append(head, title, summary, foot);
    el.knowledgeGrid.append(node);
  }
}

function openKnowledge() {
  if (state.knowledgeOpen || state.quickQuizOpen || lingbao?.quizOpen) return;
  state.lastKnowledgeFocus = document.activeElement;
  state.knowledgeOpen = true;
  lingbao?.hideBubble();
  if (lingbao?.panelOpen) lingbao.closePanel();
  renderKnowledge();
  el.knowledgeOverlay.classList.remove("is-hidden");
  el.knowledgeOverlay.style.zIndex = "9250";
  audio.play("ui");
  syncBodyModal();
  refreshEnginePause();
  window.setTimeout(() => el.knowledgeClose.focus({ preventScroll: true }), 60);
}

function closeKnowledge() {
  if (!state.knowledgeOpen) return;
  state.knowledgeOpen = false;
  el.knowledgeOverlay.classList.add("is-hidden");
  syncBodyModal();
  refreshEnginePause();
  if (state.lastKnowledgeFocus instanceof HTMLElement) {
    state.lastKnowledgeFocus.focus({ preventScroll: true });
  }
  state.lastKnowledgeFocus = null;
}

/* ------------------------------------------------------------
   Pause
   ------------------------------------------------------------ */

function openPause() {
  if (state.screen !== "game" || !state.engine || state.engine.finished) return;
  if (state.quickQuizOpen || lingbao?.quizOpen) return;
  if (state.dialogue || state.puzzle || state.completeOpen || state.endingOpen || state.knowledgeOpen) return;
  state.pauseOpen = true;
  state.engine.pause();
  lingbao?.hideBubble();
  el.pauseLayer.classList.remove("is-hidden");
  audio.play("ui");
  refreshEnginePause();
  window.setTimeout(() => el.pauseResume.focus({ preventScroll: true }), 70);
}

function closePause() {
  if (!state.pauseOpen) return;
  state.pauseOpen = false;
  el.pauseLayer.classList.add("is-hidden");
  refreshEnginePause();
}

/* ------------------------------------------------------------
   Completion actions
   ------------------------------------------------------------ */

function completeNext() {
  const nextId = el.completeNextBtn.dataset.level;
  if (nextId && LEVEL_LOOKUP[nextId]) {
    startLevel(nextId);
  } else {
    const campaign = state.level ? state.level.campaign : state.campaignKey;
    openCampaign(campaign);
  }
}

function completeReplay() {
  const level = state.level;
  el.completeLayer.classList.add("is-hidden");
  state.completeOpen = false;
  if (!level) {
    openCampaign(state.campaignKey);
    return;
  }
  startLevel(level.id);
}

/* ------------------------------------------------------------
   Event wiring
   ------------------------------------------------------------ */

function bindStaticEvents() {
  el.rotateGateSkip?.addEventListener("click", () => {
    document.body.classList.add("portrait-ok");
  });
  el.bootStart.addEventListener("click", () => {
    audio.unlock();
    audio.play("ui");
    openSelect();
  });
  el.bootContinue.addEventListener("click", () => {
    audio.unlock();
    audio.play("ui");
    openCampaign(state.save.lastCampaign || "python", { selectedId: state.save.lastLevel });
  });
  el.selectBack.addEventListener("click", () => {
    audio.play("ui");
    openBoot();
  });
  el.mapBrand.addEventListener("click", () => {
    audio.play("ui");
    openBoot();
  });
  el.mapSwitch.addEventListener("click", () => {
    audio.play("ui");
    openSelect();
  });

  el.campaignGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".campaign-card");
    if (!card) return;
    audio.play("ui");
    openCampaign(card.dataset.campaign);
  });

  el.mapContinueBtn.addEventListener("click", () => {
    const campaign = getCampaign(state.campaignKey);
    if (!campaign) return;
    if (campaignDoneCount(campaign) >= campaign.levels.length) {
      audio.play("ui");
      showCampaignEnding(campaign.key);
      return;
    }
    const next = recommendedLevel(campaign);
    if (next) {
      audio.play("ui");
      startLevel(next.id);
    }
  });

  el.mapLevels.addEventListener("click", (event) => {
    const enter = event.target.closest("[data-enter]");
    if (enter) {
      event.stopPropagation();
      startLevel(enter.dataset.enter);
      return;
    }
    const card = event.target.closest(".route-card");
    if (!card) return;
    selectLevelFromMap(card.dataset.level);
  });

  el.mapLevels.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("button")) return;
    const card = event.target.closest(".route-card");
    if (!card) return;
    event.preventDefault();
    selectLevelFromMap(card.dataset.level);
  });

  el.missionDrawer.addEventListener("click", (event) => {
    const start = event.target.closest("[data-start-level]");
    if (!start || start.disabled) return;
    startLevel(start.dataset.startLevel);
  });

  el.mapKnowledgeTop.addEventListener("click", openKnowledge);
  el.mapKnowledgeBtn.addEventListener("click", openKnowledge);
  el.selectKnowledgeTop.addEventListener("click", openKnowledge);
  el.selectKnowledgeBtn.addEventListener("click", openKnowledge);
  el.gameKnowledgeBtn.addEventListener("click", () => {
    if (state.dialogue || state.puzzle || state.quickQuizOpen || lingbao?.quizOpen) return;
    openKnowledge();
  });
  el.pauseKnowledge.addEventListener("click", openKnowledge);

  el.gamePauseBtn.addEventListener("click", () => {
    if (state.pauseOpen) closePause();
    else openPause();
  });

  el.dialogueNext.addEventListener("click", advanceDialogue);
  el.dialogueLayer.addEventListener("click", (event) => {
    if (event.target === el.dialogueLayer) advanceDialogue();
  });

  el.puzzleClose.addEventListener("click", () => closePuzzle(false));
  el.puzzleExit.addEventListener("click", () => closePuzzle(false));
  el.puzzleHintBtn.addEventListener("click", revealPuzzleHint);
  el.puzzleSubmit.addEventListener("click", submitPuzzle);
  el.puzzleLabToggle.addEventListener("click", () => {
    setPuzzleLabOpen(el.puzzleLabToggle.getAttribute("aria-expanded") !== "true");
    audio.play("ui");
  });
  el.puzzleTraceStep.addEventListener("click", stepPuzzleTrace);
  el.puzzleTraceReset.addEventListener("click", resetPuzzleTrace);
  el.fieldHintBtn.addEventListener("click", () => {
    if (state.engine && state.level?.fieldCircuit) {
      state.engine.revealCircuitHint();
      audio.play("ui");
    }
  });

  el.pauseResume.addEventListener("click", closePause);
  el.pauseRestart.addEventListener("click", () => {
    const level = state.level;
    el.pauseLayer.classList.add("is-hidden");
    state.pauseOpen = false;
    if (level) startLevel(level.id);
    else openCampaign(state.campaignKey);
  });
  el.pauseMap.addEventListener("click", () => {
    const campaign = state.level ? state.level.campaign : state.campaignKey;
    el.pauseLayer.classList.add("is-hidden");
    state.pauseOpen = false;
    openCampaign(campaign);
  });

  el.completeNextBtn.addEventListener("click", completeNext);
  el.completeReplayBtn.addEventListener("click", completeReplay);
  el.completeMapBtn.addEventListener("click", completeToMap);

  el.knowledgeClose.addEventListener("click", closeKnowledge);
  el.knowledgeOverlay.addEventListener("click", (event) => {
    if (event.target === el.knowledgeOverlay) closeKnowledge();
  });
  el.knowledgeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.knowledgeFilter = button.dataset.filter;
    renderKnowledge();
    audio.play("ui");
  });

  el.endingSelectBtn.addEventListener("click", endingBackToSelect);
  el.endingKnowledgeBtn.addEventListener("click", openKnowledge);
  el.endingReplayBtn.addEventListener("click", endingReplay);

  el.soundButtons.forEach((button) => {
    button.addEventListener("click", () => {
      audio.unlock();
      audio.toggle();
      audio.play("ui");
    });
  });

  window.addEventListener("pointerdown", () => audio.unlock(), { once: true });
  window.addEventListener("keydown", () => audio.unlock(), { once: true });

  document.addEventListener("keydown", handleGlobalKeys, true);

  document.addEventListener("visibilitychange", () => {
    audio.setMutedForVisibility(document.hidden);
    if (document.hidden && state.screen === "game" && state.engine && !state.engine.finished) {
      openPause();
    }
  });
}

function selectLevelFromMap(levelId) {
  const level = LEVEL_LOOKUP[levelId];
  if (!level) return;
  state.selectedLevelId = level.id;
  audio.play("ui");
  renderRouteCards(getCampaign(state.campaignKey));
  renderMissionDossier(getCampaign(state.campaignKey));
  updateCompanionContext();
}

function isTextTarget(target) {
  return Boolean(
    target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
  );
}

function handleGlobalKeys(event) {
  if (lingbao?.panelOpen || lingbao?.quizOpen || state.quickQuizOpen) return;

  if (event.code === "Escape") {
    if (state.knowledgeOpen) {
      event.preventDefault();
      closeKnowledge();
      return;
    }
    if (state.endingOpen) {
      event.preventDefault();
      endingBackToSelect();
      return;
    }
    if (state.completeOpen) {
      event.preventDefault();
      el.completeLayer.classList.add("is-hidden");
      state.completeOpen = false;
      completeToMap();
      return;
    }
    if (state.puzzle) {
      event.preventDefault();
      closePuzzle(false);
      return;
    }
    if (state.pauseOpen) {
      event.preventDefault();
      closePause();
      return;
    }
    if (state.dialogue) return;
    if (state.screen === "game" && state.engine) {
      event.preventDefault();
      openPause();
    } else if (state.screen === "map") {
      event.preventDefault();
      audio.play("ui");
      openSelect();
    } else if (state.screen === "select") {
      event.preventDefault();
      audio.play("ui");
      openBoot();
    }
    return;
  }

  if (isTextTarget(event.target)) return;

  if (state.dialogue) {
    if (event.code === "Space" || event.code === "Enter") {
      if (event.target.closest("button")) return;
      event.preventDefault();
      advanceDialogue();
    }
    return;
  }

  if (state.puzzle) {
    if (event.code === "Enter" && !event.target.closest("button")) {
      event.preventDefault();
      submitPuzzle();
    }
    return;
  }

  if (state.knowledgeOpen || state.endingOpen || state.completeOpen || state.pauseOpen) return;

  if (state.screen === "boot" && event.code === "Enter" && !event.target.closest("button")) {
    event.preventDefault();
    el.bootStart.click();
  }
}

/* ------------------------------------------------------------
   Boot the application
   ------------------------------------------------------------ */

function init() {
  state.save = loadSave();
  el.knowledgeOverlay.style.zIndex = "9250";

  lingbao = new Lingbao({
    getContext: getCompanionContext,
    onToast: (text, tone) => toast(text, tone),
    onOpen: () => {
      if (state.screen === "game" && state.engine) state.engine.pause();
      updateCompanionContext();
      syncBodyModal();
    },
    onClose: () => {
      refreshEnginePause();
      syncBodyModal();
    }
  });

  bindStaticEvents();
  audio.syncButtons();
  audio.setMood("menu");
  showScreen("boot");
  resetTheme();
  renderBoot();
  renderCampaigns();
  renderSelectMeta();
  updateCompanionContext();
}

init();
