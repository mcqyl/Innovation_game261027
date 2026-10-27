/* ============================================================
   CODE RIFT — Lingbao, the seven-second AI companion
   Talks to the local /api/companion proxy and falls back to a
   hand-written local coach when the cloud is unavailable.
   ============================================================ */

const MOOD_LABELS = {
  happy: "LINGBAO // 心情不错",
  smug: "LINGBAO // 有点得意",
  worried: "LINGBAO // 替你紧张",
  serious: "LINGBAO // 认真模式",
  calm: "LINGBAO // 稳定输出",
  mystic: "LINGBAO // 故弄玄虚",
  relieved: "LINGBAO // 松一口气",
  neutral: "LINGBAO // 实时提示"
};

function byId(id) {
  return document.getElementById(id);
}

function normalise(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").trim();
}

export class Lingbao {
  constructor({ getContext, onOpen, onClose, onToast } = {}) {
    this.getContext = getContext || (() => ({}));
    this.onOpen = onOpen || (() => {});
    this.onClose = onClose || (() => {});
    this.onToast = onToast || (() => {});

    this.widget = byId("companionWidget");
    this.bubble = byId("companionBubble");
    this.bubbleText = byId("companionBubbleText");
    this.bubbleKicker = this.bubble ? this.bubble.querySelector(".bubble-kicker") : null;
    this.stub = byId("companionStub");
    this.panel = byId("companionPanel");
    this.scrim = byId("companionScrim");
    this.statusEl = byId("companionStatus");
    this.contextPill = byId("aiContextPill");
    this.modelTag = byId("aiModelTag");
    this.messagesEl = byId("aiMessages");
    this.typingEl = byId("aiTyping");
    this.suggestionsEl = byId("aiSuggestions");
    this.form = byId("aiForm");
    this.input = byId("aiInput");
    this.sendBtn = byId("aiSend");
    this.aiPill = byId("gameAiPill");
    this.bootAiStatus = byId("bootAiStatus");
    this.selectAiStatus = byId("selectAiStatus");

    this.history = [];
    this.context = {};
    this.healthState = "checking";
    this.model = "";
    this.panelOpen = false;
    this.minimized = false;
    this.widgetVisible = false;
    this.sending = false;
    this.bubbleTimer = 0;
    this.pendingBubble = "";
    this.lastFocus = null;
    this.lastFallbackToast = 0;
    this.welcomeShown = false;

    this.bind();
    this.checkHealth();
  }

  bind() {
    byId("companionButton")?.addEventListener("click", () => this.openPanel());
    byId("companionBubbleOpen")?.addEventListener("click", () => this.openPanel());
    byId("companionClose")?.addEventListener("click", () => this.closePanel());
    this.scrim?.addEventListener("click", () => this.closePanel());
    byId("companionToggle")?.addEventListener("click", () => this.minimize());
    byId("companionRestore")?.addEventListener("click", () => this.restore());
    byId("selectCompanionBtn")?.addEventListener("click", () => this.openPanel());
    byId("mapCompanionBtn")?.addEventListener("click", () => this.openPanel());
    byId("pauseCompanion")?.addEventListener("click", () => this.openPanel());

    this.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });
    this.input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        this.submit();
      }
    });
    this.input?.addEventListener("input", () => {
      this.input.style.height = "auto";
      this.input.style.height = `${Math.min(104, this.input.scrollHeight)}px`;
    });
    this.suggestionsEl?.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || this.sending) return;
      const text = button.dataset.prompt || button.textContent.trim();
      this.submit(text);
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (!this.panelOpen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          this.closePanel();
        }
      },
      true
    );

    this.updateContextPill();
    this.renderSuggestions();
  }

  async checkHealth() {
    const previous = this.healthState;
    this.healthState = "checking";
    this.updateStatus();
    try {
      const response = await fetch("/api/health", {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(6000)
      });
      if (!response.ok) throw new Error("health failed");
      const data = await response.json();
      this.healthState = data.aiConfigured ? "online" : "offline";
      this.model = data.model || "";
    } catch {
      this.healthState = "offline";
      this.model = "";
    }
    this.updateStatus(previous);
  }

  updateStatus(previous = "") {
    const online = this.healthState === "online";
    const checking = this.healthState === "checking";
    if (this.bootAiStatus) {
      this.bootAiStatus.textContent = checking
        ? "正在同步远端意识…"
        : online
          ? "远端意识已上线 · 灵宝在门后"
          : "本地共鸣模式 · 云端暂离";
    }
    if (this.selectAiStatus) {
      this.selectAiStatus.textContent = checking
        ? "正在同步远端意识"
        : online
          ? `远端意识在线${this.model ? ` · ${this.model}` : ""}`
          : "本地缓存在线 · 云端暂离";
    }
    if (this.statusEl) {
      this.statusEl.classList.toggle("is-offline", !online && !checking);
      this.statusEl.textContent = this.sending
        ? "正在组织嘴欠的措辞…"
        : checking
          ? "正在建立远端意识…"
          : online
            ? "远端意识在线 · 灵宝醒着"
            : "本地知识缓存 · 云端暂离";
    }
    if (this.modelTag) this.modelTag.textContent = online ? "CLOUD" : checking ? "SYNC" : "LOCAL";
    if (this.aiPill) {
      this.aiPill.classList.toggle("is-offline", !online && !checking);
      this.aiPill.innerHTML = `<i></i> ${online ? "LINGBAO LINK" : checking ? "LINGBAO SYNC" : "LINGBAO LOCAL"}`;
      this.aiPill.title = online
        ? `AI 伙伴已连接${this.model ? `：${this.model}` : ""}`
        : "云端未连接，灵宝使用本地知识缓存";
    }
    if (previous && previous !== this.healthState && this.healthState === "offline" && previous !== "checking") {
      this.onToast("灵宝切换到了本地知识缓存。它说云端只是短暂走神。", "warn");
    }
  }

  setContext(context = {}) {
    this.context = context && typeof context === "object" ? context : {};
    this.updateContextPill();
    this.renderSuggestions();
  }

  updateContextPill() {
    if (!this.contextPill) return;
    const ctx = this.context || {};
    let text = "当前上下文：主菜单";
    if (ctx.screen === "game" && ctx.levelTitle) {
      text = `当前上下文：${ctx.levelTitle}${ctx.puzzleTitle ? ` · ${ctx.puzzleTitle}` : ""}${ctx.boss ? ` · ${ctx.boss}` : ""}`;
    } else if (ctx.screen === "map") {
      text = `当前上下文：${ctx.campaignName || "关卡星图"} · 路线规划`;
    } else if (ctx.screen === "select") {
      text = "当前上下文：语言分支选择";
    } else if (ctx.levelTitle) {
      text = `当前上下文：${ctx.levelTitle}`;
    }
    this.contextPill.textContent = text;
    this.contextPill.title = ctx.objective ? `当前目标：${ctx.objective}` : text;
  }

  suggestionsFor() {
    const ctx = this.context || {};
    if (ctx.puzzleTitle) {
      const concept = ctx.puzzleConcept ? `「${ctx.puzzleConcept}」` : "这个知识点";
      return ["给我一个提示，别直接说答案", `解释一下${concept}`, "这题最容易错在哪？"];
    }
    if (ctx.screen === "game") {
      return ["这关我该注意什么？", "解释本关知识点", "给我一句不嘴欠的提示"];
    }
    if (ctx.screen === "map") {
      return ["推荐下一关吗？", "这个分支在讲什么？", "我状态很差，鼓励我一下"];
    }
    if (ctx.screen === "select") {
      return ["我该选哪门语言？", "三条分支有什么区别？", "只玩一条分支够吗？"];
    }
    return ["这游戏怎么玩？", "你是谁，真的只有七秒记忆？", "讲个和学习有关的冷笑话"];
  }

  renderSuggestions() {
    if (!this.suggestionsEl) return;
    const items = this.suggestionsFor().slice(0, 3);
    this.suggestionsEl.replaceChildren();
    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.prompt = item;
      button.textContent = item;
      this.suggestionsEl.append(button);
    }
  }

  showWidget({ enter = true } = {}) {
    if (!this.widget) return;
    this.widgetVisible = true;
    this.minimized = false;
    this.widget.classList.remove("is-hidden");
    this.stub?.classList.add("is-hidden");
    if (enter) {
      this.widget.classList.remove("is-entering");
      void this.widget.offsetWidth;
      this.widget.classList.add("is-entering");
      window.setTimeout(() => this.widget.classList.remove("is-entering"), 700);
    }
  }

  hideWidget() {
    this.widgetVisible = false;
    this.widget?.classList.add("is-hidden");
    this.stub?.classList.add("is-hidden");
    this.hideBubble();
  }

  minimize() {
    this.minimized = true;
    this.widget?.classList.add("is-hidden");
    this.stub?.classList.remove("is-hidden");
    this.hideBubble();
  }

  restore() {
    this.showWidget({ enter: true });
    if (this.pendingBubble) {
      const text = this.pendingBubble;
      this.pendingBubble = "";
      window.setTimeout(() => this.say(text, { timeout: 7200 }), 350);
    }
  }

  say(text, { mood = "neutral", timeout = 7200 } = {}) {
    if (!this.widget || !this.bubble || !this.bubbleText) return;
    const clean = normalise(text);
    if (!clean) return;
    if (this.minimized) {
      this.pendingBubble = clean;
      return;
    }
    if (!this.widgetVisible) this.showWidget({ enter: true });
    this.bubbleKicker.textContent = MOOD_LABELS[mood] || MOOD_LABELS.neutral;
    this.bubbleText.textContent = clean;
    this.bubble.classList.remove("is-hidden");
    window.clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => this.hideBubble(), Math.max(2600, timeout));
  }

  hideBubble() {
    window.clearTimeout(this.bubbleTimer);
    this.bubble?.classList.add("is-hidden");
  }

  openPanel() {
    if (!this.panel || this.panelOpen) return;
    this.panelOpen = true;
    this.lastFocus = document.activeElement;
    this.hideBubble();
    this.panel.classList.remove("is-hidden");
    this.panel.setAttribute("aria-hidden", "false");
    this.scrim?.classList.remove("is-hidden");
    document.body.classList.add("is-modal-open");
    if (!this.welcomeShown) {
      this.welcomeShown = true;
      const ctx = this.context || {};
      const place = ctx.levelTitle || (ctx.screen === "map" ? "关卡星图" : "主菜单");
      this.appendMessage(
        "assistant",
        `我来了。七秒记忆已加载，大概。你现在在「${place}」，问提示、问代码，或者单纯吐槽都行。`,
        { note: "初次连接 · 灵宝" }
      );
    }
    this.updateStatus();
    this.updateContextPill();
    this.renderSuggestions();
    this.scrollToBottom();
    this.onOpen();
    if (this.healthState !== "online") window.setTimeout(() => this.checkHealth(), 250);
    window.setTimeout(() => {
      if (this.panelOpen && window.matchMedia("(min-width: 860px)").matches) this.input?.focus();
    }, 300);
  }

  closePanel() {
    if (!this.panel || !this.panelOpen) return;
    this.panelOpen = false;
    this.panel.classList.add("is-hidden");
    this.panel.setAttribute("aria-hidden", "true");
    this.scrim?.classList.add("is-hidden");
    document.body.classList.remove("is-modal-open");
    this.onClose();
    if (this.lastFocus instanceof HTMLElement) {
      this.lastFocus.focus({ preventScroll: true });
    }
  }

  scrollToBottom() {
    if (!this.messagesEl) return;
    window.requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }

  appendFormattedText(container, content) {
    const pieces = normalise(content).split(/(`[^`]+`)/g);
    for (const piece of pieces) {
      if (!piece) continue;
      if (piece.startsWith("`") && piece.endsWith("`") && piece.length > 2) {
        const code = document.createElement("code");
        code.textContent = piece.slice(1, -1);
        container.append(code);
      } else {
        container.append(document.createTextNode(piece));
      }
    }
  }

  appendMessage(role, content, { note = "", error = false, addHistory = true } = {}) {
    if (!this.messagesEl) return;
    const clean = normalise(content);
    if (!clean) return;
    const wrap = document.createElement("div");
    wrap.className = `ai-msg${role === "user" ? " is-user" : ""}${error ? " is-error" : ""}`;

    const avatar = document.createElement("span");
    avatar.className = "ai-msg-avatar";
    avatar.textContent = role === "user" ? "你" : "灵";

    const body = document.createElement("div");
    body.className = "ai-msg-body";
    const meta = document.createElement("div");
    meta.className = "ai-msg-meta";
    const who = document.createElement("span");
    who.textContent = role === "user" ? "INTERN" : "LINGBAO // 7s";
    meta.append(who);

    const bubble = document.createElement("div");
    bubble.className = "ai-msg-bubble";
    this.appendFormattedText(bubble, clean);
    body.append(meta, bubble);

    if (note) {
      const foot = document.createElement("small");
      foot.className = "ai-msg-note";
      foot.textContent = note;
      body.append(foot);
    }

    wrap.append(avatar, body);
    this.messagesEl.append(wrap);
    if (addHistory) {
      this.history.push({ role, content: clean });
      if (this.history.length > 16) this.history.splice(0, this.history.length - 16);
    }
    this.scrollToBottom();
  }

  setTyping(typing) {
    this.sending = typing;
    this.typingEl?.classList.toggle("is-hidden", !typing);
    if (this.sendBtn) this.sendBtn.disabled = typing;
    this.updateStatus();
    if (typing) this.scrollToBottom();
  }

  async submit(textOverride) {
    if (this.sending) return;
    const text = normalise(textOverride ?? this.input?.value ?? "");
    if (!text) {
      this.input?.focus();
      return;
    }
    if (this.input) {
      this.input.value = "";
      this.input.style.height = "auto";
    }
    this.appendMessage("user", text);
    this.setTyping(true);
    this.context = { ...this.getContext() };
    this.updateContextPill();

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 36000);
    try {
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          messages: this.history.slice(-12),
          context: this.context
        }),
        signal: controller.signal
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok || !data || !data.ok || typeof data.text !== "string") {
        throw Object.assign(new Error(data?.error || "远端意识没有回应"), { offline: true });
      }
      this.healthState = "online";
      this.model = data.model || this.model;
      this.updateStatus();
      this.appendMessage("assistant", data.text, { note: "云端共鸣 · 已连接" });
    } catch (error) {
      this.healthState = "offline";
      this.updateStatus();
      const reply = this.localReply(text, this.context);
      this.appendMessage("assistant", reply, { note: "本地知识缓存 · 云端暂离" });
      const now = Date.now();
      if (now - this.lastFallbackToast > 30000) {
        this.lastFallbackToast = now;
        this.onToast(
          error?.name === "AbortError"
            ? "灵宝等了太久，改成本地共鸣。它说远端大概被 null 绊住了。"
            : "云端意识没有回应，灵宝已切换到本地共鸣。",
          "warn"
        );
      }
    } finally {
      window.clearTimeout(timer);
      this.setTyping(false);
      this.renderSuggestions();
      this.scrollToBottom();
    }
  }

  localReply(text, context = {}) {
    const raw = String(text || "");
    const lower = raw.toLowerCase();
    const level = context.levelTitle || "当前裂隙";
    const concept =
      context.puzzleConcept ||
      (Array.isArray(context.concepts) && context.concepts[0]) ||
      "当前知识点";
    const hint = context.puzzleHint || "";
    const explanation = context.puzzleExplanation || "";
    const answer = context.puzzleAnswer || "";
    const asksAnswer = /答案|直接说|选哪|选哪个|输出什么|结果是|多少/.test(raw);
    const asksHint = /提示|卡住|不会|帮我|怎么做|思路|救命/.test(raw);
    const asksExplain = /解释|为什么|原理|概念|区别|是什么/.test(raw);

    if (/你是谁|七秒|记忆|你是真人|名字/.test(raw)) {
      return "我是灵宝·七秒，一颗从异常日志里孵出来的薄荷色光核。记忆只有七秒是真的，但我会在这七秒里很认真地陪你读代码。你刚才问了什么来着？";
    }

    if (/怎么玩|操作|按键|控制|跳|暂停/.test(raw)) {
      return "A / D 移动，SPACE 二段跳，E 和 NPC、终端、编译门互动，Z 消耗墨水回溯到几秒前。ESC 暂停。别踩红色尖刺，Bug 可以从上方踩扁，我没有让你从正面证明勇敢。";
    }

    if (/选哪|哪门|语言|分支/.test(raw)) {
      return "Python 分支像会说话的森林，适合先熟悉规则；C 分支玩指针和地址，坑更深但很过瘾；Java 分支在浮空城上讲对象、构造和继承。三条进度互相独立，选错不会把你困住，我只会用七秒鄙视你一次。";
    }

    if (/谢谢|谢了|感谢/.test(raw)) {
      return "不用谢。七秒之后我会忘记你谢过我，但我会保留这个『刚才好像被夸了』的好心情。继续修裂隙吧，实习生。";
    }

    if (answer && asksAnswer) {
      return `本地缓存里写着：${answer}。${explanation || "把它代回代码里走一遍，比记住这个答案更值钱。"}这句是本地知识卡给的底气，云端恢复后我还能再换种说法。`;
    }

    if (hint && (asksHint || asksExplain || /这题|这里/.test(raw))) {
      return `先别急着提交。${hint}${explanation ? `真要我说原理的话：${explanation}` : ""}先自己走完这一步，我负责在旁边装作没有紧张。`;
    }

    if (explanation && (asksExplain || lower.includes("why"))) {
      return `${concept} 的关键在这里：${explanation}你可以把它读成一句人话，再回代码里找对应的那一行。`;
    }

    if (context.puzzleTitle) {
      return `你现在在「${context.puzzleTitle}」里：${context.objective || "先看懂代码，再做判断"}。${hint || "把变量的值一步步写在纸上，别让它们在你脑子里偷偷改名。"}卡住就问，我七秒后会忘掉，但这一题不会。`;
    }

    if (context.objective) {
      return `${level} 的当前目标是：${context.objective}。${hint || "先往右走，看到终端就按 E；终端比剧情更有耐心。"}${context.recent ? `刚才发生了：${String(context.recent).replace(/[。！？!?；;，,\s]+$/, "")}。` : ""}`;
    }

    if (context.screen === "map") {
      return "这是分支路线。先完成两道普通裂隙，Null 奇点才会在末尾显形。点左边的路线卡看任务档案，路线卡右下角才是真的进关。别只在星图上散步。";
    }

    if (context.screen === "select") {
      return "三条语言分支都是完整的一套关卡，进度互不影响。先挑一个你愿意被它折磨的语言，进去之后主菜单还能回来换。犹豫超过七秒的话，我会随机替你选……大概。";
    }

    return "我在。云端暂时离席，但本地知识缓存还在，问当前目标、操作、知识点或题目提示都可以。复杂推理我会弱一点，不过安慰你来一句还是够用的。";
  }
}
