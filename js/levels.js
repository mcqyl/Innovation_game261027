/* ============================================================
   CODE RIFT — level, story and learning content
   All geometry is authored for a 1280 x 720 logical viewport.
   ============================================================ */

const p = (x, y, w, h = 26, style = "stone") => ({ x, y, w, h, style });
const spike = (x, y, w = 44, h = 28, style = "spike") => ({ x, y, w, h, style });
const bugAt = (x, surfaceY, min, max, speed = 52, extra = {}) => ({
  x,
  y: surfaceY - 34,
  w: 42,
  h: 34,
  min,
  max,
  speed,
  dir: 1,
  kind: "bug",
  ...extra
});
const core = (x, y) => ({ type: "core", x, y, collected: false });
const bit = (x, y) => ({ type: "bit", x, y, collected: false });
const bitRow = (x, y, count, gap = 30) =>
  Array.from({ length: count }, (_, i) => bit(x + i * gap, y + Math.sin(i * 0.8) * 7));
const d = (who, text, tone = "npc") => ({ who, text, tone });

export const KNOWLEDGE = {
  "py-indent": {
    id: "py-indent",
    lang: "PYTHON",
    tag: "语法核心",
    title: "缩进就是代码块",
    summary: "Python 用缩进而非花括号划分代码块。同一代码块必须保持相同缩进，通常一次四个空格；冒号之后缩进的行才属于 for、if、def 等结构。"
  },
  "py-loop": {
    id: "py-loop",
    lang: "PYTHON",
    tag: "循环",
    title: "range 的右边界不进门",
    summary: "range(1, 5) 会依次给出 1、2、3、4，不包含 5。循环变量每轮自动更新，循环体里要对累加器执行赋值，它才会真正改变。"
  },
  "py-read-error": {
    id: "py-read-error",
    lang: "PYTHON",
    tag: "田野笔记",
    title: "先看报错的最后一行",
    summary: "Python 的 traceback 很长，但最关键的异常类型和原因通常在最后一行。先读它，再沿调用栈向上找自己写的那一行。"
  },
  "py-range": {
    id: "py-range",
    lang: "PYTHON",
    tag: "田野笔记",
    title: "循环数得清，宇宙才不卡",
    summary: "range(n) 从 0 到 n-1，共执行 n 次；range(a, b) 从 a 到 b-1。写循环前先数清边界，胜过事后拍脑袋。"
  },
  "c-pointer": {
    id: "c-pointer",
    lang: "C",
    tag: "内存",
    title: "指针是地址的容器",
    summary: "&x 取出变量 x 的地址，int *p 声明指向 int 的指针。*p 表示顺着地址访问目标；给 *p 赋值，改的是它指向的变量本体。"
  },
  "c-bounds": {
    id: "c-bounds",
    lang: "C",
    tag: "数组",
    title: "数组不会替你检查边界",
    summary: "int hp[3] 的合法下标是 0、1、2。用 hp[3] 访问会越界，C 不会自动替你拦住；这种未定义行为可能读取垃圾值，也可能让程序直接崩掉。"
  },
  "c-address": {
    id: "c-address",
    lang: "C",
    tag: "田野笔记",
    title: "& 是门牌，* 是进门",
    summary: "把 & 想成“取门牌号”，把 * 想成“按门牌号进门”。p = &x 保存地址；*p 访问门后的 x。两条符号方向相反，但指向同一间房。"
  },
  "c-zero-index": {
    id: "c-zero-index",
    lang: "C",
    tag: "田野笔记",
    title: "第一个位置叫 0",
    summary: "C 数组从 0 开始计数。长度为 n 的数组，最后一个合法下标是 n-1。循环里写 i <= n 是越界的常见来源。"
  },
  "java-constructor": {
    id: "java-constructor",
    lang: "JAVA",
    tag: "对象",
    title: "构造函数负责出生设置",
    summary: "new 创建对象时会调用同名构造函数。构造函数的参数常用于初始化字段；没有显式构造函数时，Java 会补一个无参构造函数。"
  },
  "java-polymorphism": {
    id: "java-polymorphism",
    lang: "JAVA",
    tag: "继承",
    title: "方法看对象，不看变量名",
    summary: "父类引用可以指向子类对象。当子类重写方法后，通过父类引用调用，运行时仍会执行子类的实现，这叫动态绑定或多态。"
  },
  "java-object": {
    id: "java-object",
    lang: "JAVA",
    tag: "田野笔记",
    title: "类是图纸，对象是房间",
    summary: "类描述字段和行为，new 之后才有真正可用的对象。对象之间各有一份实例字段，静态成员则属于整个类。"
  },
  "java-interface": {
    id: "java-interface",
    lang: "JAVA",
    tag: "田野笔记",
    title: "接口只约定，不替你生活",
    summary: "接口规定一组方法签名，由实现类给出具体行为。它让调用方依赖“能做什么”，而不是“具体是什么类”。"
  },
  "boss-py": {
    id: "boss-py",
    lang: "PYTHON",
    tag: "终局协议",
    title: "缩进错了，也是一种信息",
    summary: "IndentationError 会在运行前拦住结构错误。阅读 traceback 时先看异常类型，再看出错的文件和行号；空格不是小事，它描述程序结构。"
  },
  "boss-c": {
    id: "boss-c",
    lang: "C",
    tag: "终局协议",
    title: "指针要指向真实的内存",
    summary: "C 没有自动的异常捕获网，指针值可能是垃圾地址。初始化指针、检查数组边界、在解引用前确认目标有效，是最朴素的防御。"
  },
  "boss-java": {
    id: "boss-java",
    lang: "JAVA",
    tag: "终局协议",
    title: "空引用要被看见",
    summary: "NullPointerException 表示你试图通过一个值为 null 的引用访问成员。异常不可怕；try/catch/finally 的意义，是让失败被处理、让收尾不缺席。"
  },
  "debug-rewind": {
    id: "debug-rewind",
    lang: "DEBUG",
    tag: "世界规则",
    title: "回溯不是逃避，是重新读一遍",
    summary: "调试时回退一步观察状态，是比“再运行一次也许就好了”更可靠的本领。游戏里的回声回溯，只有三格墨水。"
  }
};

export const CAMPAIGN_DEFS = [
  {
    key: "python",
    label: "PYTHON",
    name: "蟒语分支",
    titleEn: "THE SERPENT SYNTAX",
    code: "BRANCH P",
    tagline: "用空格说服世界。",
    description: "藤蔓、沼泽与一只有三年工龄的青蛙。适合第一次进入裂隙的人。",
    theme: "python",
    accent: "#9deec0",
    accent2: "#6c90ff",
    difficulty: "入门",
    concepts: ["缩进与代码块", "循环边界", "变量更新"],
    levelsLabel: "3 道裂隙"
  },
  {
    key: "c",
    label: "C",
    name: "铁址分支",
    titleEn: "THE IRON ADDRESS",
    code: "BRANCH C",
    tagline: "顺着地址找到真相。",
    description: "矿灯、蒸汽与一整个失踪的门牌号。比指针更绕的是地精的账本。",
    theme: "c",
    accent: "#ffba76",
    accent2: "#ff6e7a",
    difficulty: "进阶",
    concepts: ["指针与地址", "数组边界", "解引用"],
    levelsLabel: "3 道裂隙"
  },
  {
    key: "java",
    label: "JAVA",
    name: "云码分支",
    titleEn: "THE CLOUD OBJECT",
    code: "BRANCH J",
    tagline: "万物皆对象，包括失重。",
    description: "浮空岛、对象咖啡与一场继承权纠纷。掉下去不算异常，但会被回收。",
    theme: "java",
    accent: "#9fd6ff",
    accent2: "#ffb6d5",
    difficulty: "探索",
    concepts: ["类与对象", "构造函数", "继承多态"],
    levelsLabel: "3 道裂隙"
  }
];

export const GAME_META = {
  title: "CODE RIFT",
  cnTitle: "代码裂隙",
  tagline: "主分支塌了，而你是临时工。",
  version: "1.0.0",
  totalLevels: 9,
  levelsPerCampaign: 3,
  campaignOrder: ["python", "c", "java"],
  prologue: [
    d("SYSTEM", "主分支 signal lost。三座语言岛正在漏出语法、地址与对象。", "sys"),
    d("SYSTEM", "临时修复员投放成功。AI 陪伴单元「灵宝·七秒」已上线。", "sys"),
    d("灵宝", "你醒了。别问这里为什么有会走路的报错，问就是预算有限。", "ai"),
    d("你", "我只是来面试的。", "player"),
    d("灵宝", "面试通过了。合同在虚空里，你已经签字了。三条语言分支各自漏水，你可以挑一条先修。", "ai"),
    d("灵宝", "每条分支都有自己的规则、自己的 Bug，以及一个装成方言的 null。选一个吧。", "ai"),
    d("灵宝", "还有，我只有七秒记忆。所以你要是走丢了，我会先忘记你，再认真找你。", "ai")
  ],
  endingQuote: "“错误不是世界崩坏的原因。拒绝看懂错误，才是。”",
  endingNote: "一只记忆只有七秒的小光核，陪你把语言分支重新编译了一遍。"
};

export const LEVELS = [
  /* =========================================================
     01 — PYTHON / 缩进之森
     ========================================================= */  {
    id: "w1-python-forest",
    order: 0,
    campaign: "python",
    language: "PYTHON",
    title: "缩进之森",
    titleEn: "THE INDENT GROVE",
    worldLabel: "P-01 / 蟒息林地",
    brief: "藤蔓门拒绝编译。这里的空格有自尊，蛇有就业焦虑。",
    mission: "穿过失序藤林，修复缩进终端，让世界重新对齐。",
    theme: "python",
    accent: "#9deec0",
    accent2: "#6c90ff",
    width: 3060,
    height: 720,
    musicMood: "forest",
    concepts: ["缩进即语法", "for 循环", "代码块边界"],
    objective: "接通缩进回路，修复终端",
    start: { x: 110, y: 520 },
    checkpoint: { x: 1430, y: 610 },
    terminal: { x: 2585, y: 610, label: "缩进终端" },
    door: { x: 2865, y: 610, label: "藤蔓编译门" },
    fieldCircuit: {
      id: "fc-w1",
      title: "缩进回路",
      objective: "按代码执行顺序接通 4 枚中继，给终端供电。",
      prompt: "代码从上往下执行。每枚中继代表一行动作，顺序错了回路就不导电。",
      code: 'for i in range(2):\n    print("A")\nprint("B")',
      language: "PYTHON",
      rewardId: "py-indent",
      intro: "看见地上的菱形中继了吗？它们记着这段代码的执行顺序。靠近按 E 接通，先接通循环头。",
      done: "回路闭合了。终端恢复供电，去把它没做完的判定补上。",
      pads: [
        { id: "i0", x: 360, y: 610, label: "for i in range(2):", detail: "循环头先执行；i 从 0 开始。", coach: "先从循环头开始。没有它，循环体不会自己开始。", why: "循环头还没执行，循环体不会先跑。" },
        { id: "a1", x: 620, y: 610, label: 'print("A") · 第 1 轮', detail: "i=0，打印 A。", coach: "冒号下面缩进的行，才是循环体。", why: "先有循环头，才有第一轮循环体。" },
        { id: "bad-range", x: 1020, y: 610, label: "range(2) 会数到 2", coach: "这枚中继在骗你。range(2) 的终点不包含 2。", why: "range(2) 只给出 0、1，不会到 2。这一步不存在。" },
        { id: "a2", x: 1150, y: 610, label: 'print("A") · 第 2 轮', detail: "i=1，再打印一次 A。", coach: "循环还没结束，第二轮会再执行一次缩进的 print。", why: "第一轮之后，循环会回来执行第二轮。" },
        { id: "b1", x: 1725, y: 610, label: 'print("B")', detail: "循环结束，B 只打印一次。", coach: "最后一行没有缩进，它在循环外。", why: "B 不在循环体里，要等两轮 A 之后。" },
        { id: "b2", x: 1980, y: 610, label: 'print("B") · 也缩进', coach: "看缩进。B 和 for 对齐，不在循环体里。", why: "B 没有缩进，不该被循环执行两次。" }
      ],
      solution: ["i0", "a1", "a2", "b1"]
    },
    quickQuiz: {
      id: "w1-quick",
      x: 940,
      question: "range(2) 会让缩进的循环体执行几次？",
      options: ["2 次", "1 次", "3 次"],
      correctIndex: 0,
      explain: "range(2) 依次给出 0 和 1，共两个值，所以缩进的循环体执行两次。",
      easy: {
        question: "range(2) 给出的第一个值是几？",
        options: ["0", "1", "2"],
        correctIndex: 0,
        explain: "range 从 0 开始数，所以第一个值是 0；range(2) 只给 0、1。"
      }
    },
    platforms: [
      p(0, 610, 760, 110, "ground"),
      p(920, 610, 560, 110, "ground"),
      p(1600, 610, 620, 110, "ground"),
      p(2350, 610, 710, 110, "ground"),
      p(300, 500, 160),
      p(520, 410, 160),
      p(830, 465, 150),
      p(1040, 480, 140),
      p(1230, 370, 170),
      p(1450, 470, 130),
      p(1680, 520, 140),
      p(1900, 430, 190),
      p(2140, 340, 190),
      p(2280, 500, 130),
      p(2510, 480, 160),
      p(2690, 380, 180),
      p(2810, 520, 120)
    ],
    hazards: [
      spike(700, 582, 58),
      spike(1650, 582, 48),
      spike(2440, 582, 58)
    ],
    collectibles: [
      ...bitRow(170, 530, 5),
      ...bitRow(540, 350, 4, 34),
      ...bitRow(890, 420, 4),
      ...bitRow(1260, 312, 3, 32),
      ...bitRow(1475, 420, 3),
      ...bitRow(1740, 470, 4),
      ...bitRow(2150, 286, 3),
      ...bitRow(2545, 430, 4),
      ...bitRow(2740, 330, 3),
      core(585, 355),
      core(1315, 315),
      core(2220, 282)
    ],
    enemies: [
      bugAt(430, 610, 300, 680, 56),
      bugAt(1120, 480, 1048, 1150, 38),
      bugAt(1980, 430, 1908, 2060, 48),
      bugAt(2460, 610, 2380, 2740, 64)
    ],
    npcs: [
      {
        id: "indent-snake",
        kind: "snake",
        name: "缩进蛇",
        title: "第四级缩进守卫",
        x: 210,
        y: 610,
        color: "#a8f0b7",
        rewardId: "py-read-error",
        dialogue: [
          d("缩进蛇", "嘶。站住。你刚刚踩到了我的第四级缩进。"),
          d("缩进蛇", "在 Python 里，空格不是装饰，是语法。没有对齐的行，会被世界拒绝执行。"),
          d("灵宝", "翻译：它因为工位比别人多两个空格，已经生气三年了。", "ai"),
          d("缩进蛇", "少说废话。终端就在林子尽头。记住：先看冒号，再看缩进，最后才猜输出。"),
          d("缩进蛇", "顺便，如果你看见一行 IndentationError，不要跑，先读最后一行。那是宇宙给你的便条。")
        ],
        repeat: d("缩进蛇", "藤蔓门还没编译完。对齐你的代码，也对齐你的心。虽然我怀疑你没有心。")
      }
    ],
    intro: [
      d("SYSTEM", "[ P-01 // INDENT GROVE ] 本地植被正在执行未经审查的缩进。", "sys"),
      d("灵宝", "第一道裂隙。先别冲，地上的菱形中继在等代码的执行顺序。", "ai"),
      d("灵宝", "让回路闭合，终端才有电。藤蔓门只认修好的终端，不认你的热情。", "ai")
    ],
    outro: [
      d("SYSTEM", "藤蔓门已完成缩进。本地报错率下降 12%。", "sys"),
      d("缩进蛇", "你居然读懂了那些空格。我宣布，你暂时拥有进入沼泽的资格。"),
      d("灵宝", "前面是循环沼泽。有只青蛙在那里 for 了三年，至今没搞清边界。", "ai"),
      d("你", "它是在等一个结果，还是在等下班？", "player"),
      d("灵宝", "以我的经验，两者都有。走吧，实习生。", "ai")
    ],
    puzzle: {
      id: "p-indent",
      title: "第一缩进 · 回声协议",
      subtitle: "预测循环与缩进的共同后果",
      language: "python",
      code: 'for i in range(2):\n    print("A")\nprint("B")',
      prompt: "藤蔓门要求你预测终端输出。它不听解释，只认结果。",
      type: "choice",
      options: [
        { label: "A\nA\nB" },
        { label: "A\nB\nB" },
        { label: "A\nB" },
        { label: "IndentationError：print 没有缩进" }
      ],
      correctIndex: 0,
      hint: "range(2) 会循环两次。仔细看最后一行的 print 是否在循环体里。",
      explanation: "range(2) 产生 0 和 1，所以缩进的 print(\"A\") 执行两次。最后一行的 print(\"B\") 没有缩进，不属于循环体，只在最后执行一次。",
      rewardId: "py-indent",
      conceptLabel: "缩进决定代码块",
      lesson: "Python 用缩进划分代码块。冒号后的缩进行属于循环体，必须对齐；和 for 同级的最后一行，要等循环结束后才执行。先数循环次数，再看每一行在不在块里。",
      trace: [
        { line: 0, label: "i = 0，进入循环", note: "range(2) 的第一个值是 0。" },
        { line: 1, label: "打印 A · 第 1 次", note: "这一行有四个空格缩进，属于循环体。" },
        { line: 0, label: "i = 1，回到循环头", note: "range 还有下一个值 1，继续循环。" },
        { line: 1, label: "打印 A · 第 2 次", note: "同一个缩进块，再执行一次。" },
        { line: 0, label: "循环结束", note: "range(2) 没有更多值，退出循环。" },
        { line: 2, label: "打印 B", note: "这行和 for 对齐，不在循环体里，只执行一次。" }
      ]
    }
  },

  /* =========================================================
     02 — PYTHON / 循环沼泽
     ========================================================= */
  {
    id: "w2-python-loop",
    order: 1,
    campaign: "python",
    language: "PYTHON",
    title: "循环沼泽",
    titleEn: "THE LOOP MARSH",
    worldLabel: "P-02 / 疲惫循环湿地",
    brief: "一只青蛙 for 了三年，一个 total 等着被正确相加。",
    mission: "跨过沼泽浮叶，解开累加循环，送一只青蛙退休。",
    theme: "python",
    accent: "#87e8b9",
    accent2: "#ffd27d",
    width: 3480,
    height: 720,
    musicMood: "forest",
    concepts: ["range 边界", "累加器", "变量更新"],
    objective: "接通累加回路，修复终端",
    start: { x: 100, y: 520 },
    checkpoint: { x: 1710, y: 610 },
    terminal: { x: 3260, y: 610, label: "累加终端" },
    door: { x: 3420, y: 610, label: "沼泽回声门" },
    fieldCircuit: {
      id: "fc-w2",
      title: "累加回路",
      objective: "把循环的每一轮和最后一次输出按顺序接通。",
      prompt: "中继上写着每一步对 total 的动作。按真正执行的先后接通。",
      code: "total = 0\nfor n in range(1, 5):\n    total += n\nprint(total)",
      language: "PYTHON",
      rewardId: "py-loop",
      intro: "这次的中继会改同一个变量。每接通一枚，total 就往前走一步。别漏掉循环外的那一行。",
      done: "回路闭合。total 停在 10，终端现在想亲口确认。",
      pads: [
        { id: "init", x: 380, y: 610, label: "total = 0", detail: "total 从 0 开始。", coach: "累加之前，先给 total 一个起点。", why: "没有初始化，total 还没有可用的起点。" },
        { id: "add1", x: 520, y: 610, label: "total += 1", detail: "total = 1。", coach: "第一轮 n 是 1，把它加进 total。", why: "先走第一轮循环，再谈后面的数。" },
        { id: "add2", x: 980, y: 430, label: "total += 2", detail: "total = 3。", coach: "第二轮 n=2，继续累加。", why: "n=1 的累加还没发生，不能直接跳到 2。" },
        { id: "stop5", x: 1500, y: 610, label: "n = 5 再累加一次", coach: "range(1,5) 的右边界不进门。", why: "range(1,5) 停在 4，不会执行 n=5。" },
        { id: "add3", x: 1740, y: 610, label: "total += 3", detail: "total = 6。", coach: "第三轮 n=3。", why: "n=2 之后才轮到 3。" },
        { id: "add4", x: 2250, y: 430, label: "total += 4", detail: "total = 10。", coach: "最后一轮 n=4，加完循环就结束。", why: "n=3 后面才是 4，别提前收尾。" },
        { id: "reset", x: 2520, y: 340, label: "total = 0 再清空", coach: "代码里没有第二次清零。", why: "这里没有重置语句，清空就把前面的累加扔了。" },
        { id: "print", x: 2880, y: 370, label: "print(total)", detail: "循环结束，输出 10。", coach: "输出在循环外，等所有累加完成。", why: "还没累加完就输出，结果会偏小。" }
      ],
      solution: ["init", "add1", "add2", "add3", "add4", "print"]
    },
    quickQuiz: {
      id: "w2-quick",
      x: 1400,
      question: "range(1, 5) 给出的最后一个值是几？",
      options: ["4", "5", "1"],
      correctIndex: 0,
      explain: "range(a, b) 从 a 开始，到 b 之前停下。range(1, 5) 给出 1、2、3、4，最后一个值是 4。",
      easy: {
        question: "range(1, 5) 包含 1 吗？",
        options: ["包含", "不包含"],
        correctIndex: 0,
        explain: "左边界 1 包含在内；被排除的是右边界 5。"
      }
    },
    platforms: [
      p(0, 610, 620, 110, "ground"),
      p(800, 610, 510, 110, "ground"),
      p(1450, 610, 500, 110, "ground"),
      p(2150, 610, 450, 110, "ground"),
      p(2800, 610, 680, 110, "ground"),
      p(300, 470, 170),
      p(520, 360, 150),
      p(600, 500, 130),
      p(970, 430, 180),
      p(1230, 480, 150),
      p(1300, 340, 210),
      p(1640, 440, 150),
      p(1820, 350, 180),
      p(1890, 500, 160),
      p(2250, 430, 200),
      p(2520, 340, 160),
      p(2560, 480, 160),
      p(2880, 370, 180),
      p(3060, 480, 160)
    ],
    springs: [
      { x: 2350, y: 610, w: 58, h: 16, power: 1130 }
    ],
    hazards: [
      spike(700, 582, 54),
      spike(1210, 582, 48),
      spike(2320, 582, 52),
      spike(3010, 582, 58)
    ],
    collectibles: [
      ...bitRow(180, 530, 5),
      ...bitRow(530, 305, 4),
      ...bitRow(860, 390, 4),
      ...bitRow(1320, 286, 4),
      ...bitRow(1690, 390, 4),
      ...bitRow(1860, 302, 4),
      ...bitRow(2280, 382, 4),
      ...bitRow(2560, 292, 4),
      ...bitRow(2910, 322, 4),
      ...bitRow(3100, 430, 4),
      core(595, 306),
      core(1405, 286),
      core(2600, 286)
    ],
    enemies: [
      bugAt(400, 610, 300, 560, 54),
      bugAt(1040, 430, 978, 1120, 38),
      bugAt(1670, 440, 1648, 1760, 42),
      bugAt(2290, 430, 2258, 2420, 50),
      bugAt(2900, 610, 2825, 3220, 68)
    ],
    npcs: [
      {
        id: "loop-frog",
        kind: "frog",
        name: "循环蛙",
        title: "for 了三年零四个月",
        x: 245,
        y: 610,
        color: "#c7f59b",
        rewardId: "py-range",
        dialogue: [
          d("循环蛙", "呱。你是来结束这一切的吗？我已经在这个循环里待了三年。"),
          d("你", "是谁把你写进去的？", "player"),
          d("循环蛙", "一个深夜赶需求的人。他说 range(1, 5) 会数到五，然后就去开会了。"),
          d("灵宝", "好消息：右边界不包含，所以它不会到五。坏消息：他还没开完会。", "ai"),
          d("循环蛙", "所以我永远差一个五。呱。你们先走吧，我要在这里等一个正确的累加。")
        ],
        repeat: d("循环蛙", "呱。记住，range(a, b) 停在不含 b 的地方。别像我一样，把边界当成承诺。")
      }
    ],
    intro: [
      d("SYSTEM", "[ P-02 // LOOP MARSH ] 检测到持续三年的循环，以及一只情绪稳定的青蛙。", "sys"),
      d("灵宝", "循环沼泽。这里的中继会改同一个变量，每接通一枚，total 就往前走一步。", "ai"),
      d("灵宝", "别把 range 的右边界当成承诺。终端在最里面，它只要一个最终数字。", "ai")
    ],
    outro: [
      d("SYSTEM", "累加器 total 已稳定。检测到一只青蛙离开循环。", "sys"),
      d("循环蛙", "呱！五出现了！虽然不是在一个数字里，是在我下班的方向上！"),
      d("灵宝", "它自由了。现在它要面对更可怕的东西：周一。", "ai"),
      d("你", "下一关是什么？", "player"),
      d("灵宝", "别急，这条 Python 分支还没完全稳定。尽头还有一只 null 的分身，披着空格做外套。", "ai"),
      d("你", "打完它，这棵树就不会再漏光了吧？", "player"),
      d("灵宝", "理论上会。理论上你也有带薪年假。", "ai")
    ],
    puzzle: {
      id: "p-range",
      title: "第二循环 · 边界累加",
      subtitle: "追踪变量的最后一次变化",
      language: "python",
      code: "total = 0\nfor n in range(1, 5):\n    total += n\nprint(total)",
      prompt: "终端想看见 total 的最终数值。输入时不要带空格。",
      type: "fill",
      answers: ["10"],
      placeholder: "输入一个整数",
      inputHint: "例如：42",
      hint: "写出每一轮 n 的值，再把它们加起来。想一想 range(1, 5) 是否包含 5。",
      explanation: "range(1, 5) 依次给出 1、2、3、4，不包含 5。total 从 0 开始累加：1 + 2 + 3 + 4 = 10，所以输出 10。",
      rewardId: "py-loop",
      conceptLabel: "range 右边界与累加",
      lesson: "range(a, b) 包含 a、停在 b 之前。累加器要在每轮循环里被重新赋值，值才会留下来。右边界不算数，所以 range(1, 5) 只给 1、2、3、4。",
      trace: [
        { line: 0, label: "total = 0", note: "先给累加器一个起点。" },
        { line: 1, label: "n = 1，进入第一轮", note: "range(1,5) 从 1 开始。" },
        { line: 2, label: "total = 0 + 1 = 1", note: "+= 会把结果写回 total。" },
        { line: 1, label: "n = 2，第二轮", note: "循环自动取下一个值。" },
        { line: 2, label: "total = 1 + 2 = 3", note: "上一轮的结果保留下来了。" },
        { line: 1, label: "n = 3，第三轮", note: "继续。" },
        { line: 2, label: "total = 3 + 3 = 6", note: "不要重新从 0 开始。" },
        { line: 1, label: "n = 4，最后一轮", note: "4 是范围内的最后一个值。" },
        { line: 2, label: "total = 6 + 4 = 10", note: "累加完成。" },
        { line: 3, label: "输出 10", note: "print 在循环外，只执行一次。" }
      ]
    }
  },

  /* =========================================================
     03 — C / 指针矿坑
     ========================================================= */
  {
    id: "w3-c-mine",
    order: 0,
    campaign: "c",
    language: "C",
    title: "指针矿坑",
    titleEn: "THE POINTER MINE",
    worldLabel: "C-01 / 野指针矿井",
    brief: "地精把钥匙存进了地址里，然后忘了地址存在哪。",
    mission: "穿过熔铁矿道，追踪指针写入，取回变量本体。",
    theme: "c",
    accent: "#ffba76",
    accent2: "#ff6e7a",
    width: 3260,
    height: 720,
    musicMood: "mine",
    concepts: ["指针与地址", "解引用", "*p 修改原变量"],
    objective: "接通指针回路，修复终端",
    start: { x: 100, y: 520 },
    checkpoint: { x: 1720, y: 610 },
    terminal: { x: 2970, y: 610, label: "取址终端" },
    door: { x: 3170, y: 610, label: "矿脉编译门" },
    fieldCircuit: {
      id: "fc-w3",
      title: "取址回路",
      objective: "先给指针一个目标，再让它改写变量。",
      prompt: "中继不是从左到右按的。看代码：谁先发生，谁才配通电。",
      code: "int x = 7;\nint *p = &x;\n*p = 9;\nprintf(\"%d\", x);",
      language: "C",
      intro: "这次的回路上有一枚顺序陷阱。先想清楚 p 什么时候才真正指向 x。",
      done: "回路闭合。x 本体已经被写过，终端在等它的值。",
      pads: [
        { id: "x7", x: 360, y: 610, label: "int x = 7;", detail: "x 出生，值是 7。", coach: "先声明 x，地址才有东西可指。", why: "x 还没出生，指针没有目标。" },
        { id: "deref", x: 1090, y: 610, label: "*p = 9;", detail: "顺着 p 把 x 改为 9。", coach: "先确认 p 已经指向 x，再解引用。顺序对吗？", why: "p 还没指向 x，解引用会踩野地址。" },
        { id: "bad-assign", x: 1180, y: 610, label: "p = 9;", coach: "这会改 p 自己保存的地址，不是 x。", why: "p = 9 改的是 p 的地址值，不是 x 的内容。" },
        { id: "addr", x: 1720, y: 610, label: "int *p = &x;", detail: "p 拿到 x 的地址。", coach: "先取地址，p 才能找到 x。", why: "p 必须先指向 x，*p 才有意义。" },
        { id: "reversed", x: 2280, y: 610, label: "x = &p;", coach: "x 是 int，装不了地址。", why: "x 是 int，不是指针；&p 也取错了对象。" },
        { id: "print", x: 2440, y: 610, label: "printf(\"%d\", x);", detail: "输出 x 的最终值 9。", coach: "输出的是 x 本体，不是地址。", why: "x 还没被指针改写，现在输出太早。" }
      ],
      solution: ["x7", "addr", "deref", "print"]
    },
    quickQuiz: {
      id: "w3-quick",
      x: 1450,
      question: "&x 取到的是什么？",
      options: ["x 的地址", "x 的值 7", "数字 9"],
      correctIndex: 0,
      explain: "& 是取址运算符，&x 得到变量 x 的地址。要读 x 的值，直接写 x；要顺着地址读，写 *p。",
      easy: {
        question: "p = &x 之后，p 里装的是？",
        options: ["x 的地址", "x 的值"],
        correctIndex: 0,
        explain: "p 是指针，装的是地址。&x 把 x 的门牌号交给了 p。"
      }
    },
    platforms: [
      p(0, 610, 680, 110, "ground"),
      p(860, 610, 500, 110, "ground"),
      p(1520, 610, 450, 110, "ground"),
      p(2120, 610, 480, 110, "ground"),
      p(2780, 610, 480, 110, "ground"),
      p(270, 500, 180),
      p(500, 390, 150),
      p(790, 500, 120, 24, "metal"),
      p(1030, 450, 170, 24, "metal"),
      p(1220, 340, 180, 24, "metal"),
      p(1430, 490, 140, 24, "metal"),
      p(1600, 460, 170, 24, "metal"),
      p(1790, 360, 190, 24, "metal"),
      p(2020, 480, 150, 24, "metal"),
      p(2300, 430, 200, 24, "metal"),
      p(2500, 330, 180, 24, "metal"),
      p(2650, 500, 150, 24, "metal"),
      p(2900, 400, 170, 24, "metal")
    ],
    hazards: [
      spike(730, 582, 56, 28, "steam"),
      spike(980, 582, 52, 28, "steam"),
      spike(1620, 582, 56, 28, "steam"),
      spike(2180, 582, 55, 28, "steam"),
      spike(2890, 582, 55, 28, "steam")
    ],
    collectibles: [
      ...bitRow(170, 530, 5),
      ...bitRow(520, 336, 4),
      ...bitRow(840, 450, 4),
      ...bitRow(1260, 288, 4),
      ...bitRow(1620, 410, 4),
      ...bitRow(1830, 306, 4),
      ...bitRow(2340, 382, 4),
      ...bitRow(2540, 282, 4),
      ...bitRow(2940, 348, 4),
      core(575, 334),
      core(1308, 284),
      core(2588, 274)
    ],
    enemies: [
      bugAt(380, 610, 300, 600, 58, { tint: "#ffc18c" }),
      bugAt(1080, 450, 1035, 1150, 42, { tint: "#ffc18c" }),
      bugAt(1660, 460, 1605, 1720, 46, { tint: "#ffc18c" }),
      bugAt(2350, 430, 2305, 2450, 54, { tint: "#ffc18c" }),
      bugAt(2860, 610, 2800, 3150, 64, { tint: "#ffc18c" })
    ],
    npcs: [
      {
        id: "address-goblin",
        kind: "goblin",
        name: "地址地精",
        title: "前矿坑房东 / 现地址收藏家",
        x: 205,
        y: 610,
        color: "#ffd08a",
        rewardId: "c-address",
        dialogue: [
          d("地址地精", "站住，陌生人。你看见我的钥匙了吗？它是一串十六进制，结尾带个 f。"),
          d("你", "没有。你为什么把钥匙存进地址里？", "player"),
          d("地址地精", "因为地址比保险柜便宜。然后我忘了地址。然后我把自己也抵押了。"),
          d("灵宝", "这就是 & 和 * 的区别。一个记门牌，一个进门。他现在两件事都做得很糟。", "ai"),
          d("地址地精", "前面终端会考指针。记住：`*p = 9` 改的不是 p 的地址，而是 p 指向的那个变量的心。")
        ],
        repeat: d("地址地精", "& 取地址，* 解引用。别问我的门牌在哪，我刚把它当零钱花了。")
      }
    ],
    intro: [
      d("SYSTEM", "[ C-01 // POINTER MINE ] 警告：本区域地址比居民多，且多数无人认领。", "sys"),
      d("灵宝", "C 指针矿坑。回路上有顺序陷阱：先取地址，还是先解引用？", "ai"),
      d("灵宝", "别从左往右乱按。看代码，谁先发生，谁才通电。终端在最里面等一个值。", "ai")
    ],
    outro: [
      d("SYSTEM", "地址追踪完成。目标变量已被成功修改。", "sys"),
      d("地址地精", "原来我的钥匙一直在自己口袋里。你们 C 程序员真会折腾。"),
      d("灵宝", "至少变量本体安全。接下来是内存回廊，那里连地板都有越界的风险。", "ai"),
      d("你", "地板越界是什么？", "player"),
      d("灵宝", "就是你踩上去，然后发现你踩的是一段别人的回忆。", "ai")
    ],
    puzzle: {
      id: "p-pointer",
      title: "第三地址 · 门牌协议",
      subtitle: "跟随一次解引用写入",
      language: "c",
      code: "int x = 7;\nint *p = &x;\n*p = 9;\nprintf(\"%d\", x);",
      prompt: "终端想确认 x 的最终值。选择一个输出。",
      type: "choice",
      options: [
        { label: "7" },
        { label: "9" },
        { label: "x 的内存地址" },
        { label: "编译错误：p 不能赋值" }
      ],
      correctIndex: 1,
      hint: "p 保存的是 x 的地址。给 *p 赋值，实际修改的是哪个变量？",
      explanation: "&x 取得 x 的地址，p 指向 x。*p = 9 表示顺着 p 找到 x 并将其改为 9，因此 printf 输出 9，而不是地址。",
      rewardId: "c-pointer",
      conceptLabel: "地址、指针与解引用",
      lesson: "&x 取到 x 的地址，p 保存这个地址。*p 是顺着地址访问 x 本体：读 *p 得到 x 的值，给 *p 赋值就修改 x。p = 9 改的是 p 自己，不是 x。",
      trace: [
        { line: 0, label: "x = 7", note: "先有变量 x，才有它的地址。" },
        { line: 1, label: "p = &x", note: "& 取到 x 的地址，p 现在指向 x。" },
        { line: 2, label: "*p = 9", note: "顺着 p 找到 x，把 9 写进去。" },
        { line: 0, label: "x 的值变成 9", note: "改的是 x 本体，不是 p 的地址。" },
        { line: 3, label: "输出 x", note: "printf 读取 x，因此打印 9。" }
      ]
    }
  },

  /* =========================================================
     04 — C / 内存回廊
     ========================================================= */
  {
    id: "w4-c-memory",
    order: 1,
    campaign: "c",
    language: "C",
    title: "内存回廊",
    titleEn: "THE MEMORY HALL",
    worldLabel: "C-02 / 未定义行为展厅",
    brief: "一条回廊只写到第二章，而幽灵死在了第三章。",
    mission: "在失重平台上找到越界的一行，关闭危险的内存裂缝。",
    theme: "c",
    accent: "#ffab73",
    accent2: "#b994ff",
    width: 3680,
    height: 720,
    musicMood: "mine",
    concepts: ["数组下标", "合法边界", "越界风险"],
    objective: "接通下标回路，修复终端",
    start: { x: 95, y: 520 },
    checkpoint: { x: 1740, y: 610 },
    terminal: { x: 3420, y: 610, label: "边界终端" },
    door: { x: 3600, y: 610, label: "内存编译门" },
    fieldCircuit: {
      id: "fc-w4",
      title: "下标回路",
      objective: "按循环顺序读取合法下标，别摸到数组外面。",
      prompt: "中继写着数组元素。只接通真正会被读到的下标。",
      code: "int hp[3] = {12, 4, 9};\nfor (int i = 0; i < 3; i++)\n    printf(\"%d \", hp[i]);",
      language: "C",
      intro: "回路上埋着越界陷阱。记住：长度 3 的数组，合法下标只到 2。",
      done: "回路闭合。三格都读完了，终端想让你找出真正越界的那一行。",
      pads: [
        { id: "arr", x: 340, y: 610, label: "int hp[3] = {...};", detail: "合法下标：0、1、2。", coach: "先有数组，才有下标可读。", why: "数组还没建立，没有元素可读。" },
        { id: "i0", x: 1020, y: 460, label: "int i = 0", detail: "从 0 号下标开始。", coach: "数组下标从 0 开始，不是 1。", why: "循环得先把 i 初始化。" },
        { id: "idx0", x: 1700, y: 610, label: "hp[0] → 12", detail: "第 1 个元素。", coach: "0 号下标对应第一个元素。", why: "i=0 的读取在循环第一轮。" },
        { id: "idx1", x: 1900, y: 380, label: "hp[1] → 4", detail: "第 2 个元素。", coach: "1 号下标是第二个元素。", why: "hp[0] 之后才轮到 hp[1]。" },
        { id: "first", x: 2180, y: 510, label: "hp[1] 是第一个元素", coach: "下标 0 才是第一格。", why: "下标从 0 开始，第一个元素是 hp[0]。" },
        { id: "idx2", x: 2440, y: 610, label: "hp[2] → 9", detail: "最后一个合法元素。", coach: "长度 3，最后一个合法下标是 2。", why: "hp[1] 后面才轮到 hp[2]。" },
        { id: "idx3", x: 3200, y: 380, label: "hp[3] → ?", coach: "hp[3] 已经越界，别再往前摸。", why: "长度 3 的数组最后一个合法下标是 2；hp[3] 越界。" }
      ],
      solution: ["arr", "i0", "idx0", "idx1", "idx2"]
    },
    quickQuiz: {
      id: "w4-quick",
      x: 1350,
      question: "hp 的长度是 3，最后一个合法下标是几？",
      options: ["2", "3", "1"],
      correctIndex: 0,
      explain: "长度 3 的数组有 3 个元素，下标是 0、1、2。最后一个合法下标是 2，不是 3。",
      easy: {
        question: "C 数组下标从几开始？",
        options: ["0", "1"],
        correctIndex: 0,
        explain: "C 数组从 0 开始计数。第一个元素是 hp[0]。"
      }
    },
    platforms: [
      p(0, 610, 500, 110, "ground"),
      p(850, 610, 380, 110, "ground"),
      p(1580, 610, 420, 110, "ground"),
      p(2380, 610, 400, 110, "ground"),
      p(3150, 610, 530, 110, "ground"),
      p(250, 510, 170, 24, "metal"),
      p(470, 400, 150, 24, "metal"),
      p(740, 510, 120, 24, "metal"),
      p(1000, 460, 160, 24, "metal"),
      p(1190, 360, 170, 24, "metal"),
      p(1370, 500, 160, 24, "metal"),
      p(1450, 440, 130, 24, "metal"),
      p(1690, 470, 160, 24, "metal"),
      p(1900, 380, 170, 24, "metal"),
      p(2100, 290, 160, 24, "metal"),
      p(2180, 510, 160, 24, "metal"),
      p(2450, 440, 180, 24, "metal"),
      p(2630, 350, 170, 24, "metal"),
      p(2850, 430, 140, 24, "metal"),
      p(2950, 490, 160, 24, "metal"),
      p(3200, 380, 180, 24, "metal"),
      p(3390, 480, 140, 24, "metal")
    ],
    hazards: [
      spike(700, 582, 50, 28, "steam"),
      spike(1120, 582, 50, 28, "steam"),
      spike(2050, 582, 52, 28, "steam"),
      spike(2810, 582, 54, 28, "steam"),
      spike(3490, 582, 50, 28, "steam")
    ],
    collectibles: [
      ...bitRow(160, 530, 5),
      ...bitRow(490, 346, 4),
      ...bitRow(930, 410, 4),
      ...bitRow(1220, 306, 4),
      ...bitRow(1930, 326, 4),
      ...bitRow(2130, 236, 4),
      ...bitRow(2480, 386, 4),
      ...bitRow(2660, 296, 4),
      ...bitRow(3230, 326, 4),
      core(545, 346),
      core(2170, 238),
      core(2715, 296)
    ],
    enemies: [
      bugAt(360, 610, 250, 460, 54),
      bugAt(1040, 460, 1005, 1120, 38),
      bugAt(1930, 380, 1905, 2030, 45),
      bugAt(2500, 440, 2455, 2600, 52),
      bugAt(3240, 610, 3170, 3500, 70)
    ],
    npcs: [
      {
        id: "malloc-ghost",
        kind: "ghost",
        name: "malloc 幽灵",
        title: "内存未正确释放",
        x: 180,
        y: 610,
        color: "#c4b4ff",
        rewardId: "c-zero-index",
        dialogue: [
          d("malloc 幽灵", "嘘。你听见了吗？第三格传来的回声。"),
          d("你", "这里只有一条回廊。", "player"),
          d("malloc 幽灵", "对，而且数组只有三格。可总有人要摸第四格。我就死在那里，死因是未定义行为。"),
          d("灵宝", "更准确地说，你的死亡原因还没有被标准定义。", "ai"),
          d("malloc 幽灵", "终端会让你找出越界那一行。别从 1 开始数下标，从 0 开始。我的墓碑就是这么写错的。")
        ],
        repeat: d("malloc 幽灵", "合法下标是 0 到 n-1。别摸第 n 格，那里没有宝藏，只有不可预测。")
      }
    ],
    intro: [
      d("SYSTEM", "[ C-02 // MEMORY HALL ] 本展厅展示越界、野指针与不明原因的微笑。", "sys"),
      d("灵宝", "内存回廊。地上的中继写着数组元素，但其中混进了越界的坐标。", "ai"),
      d("灵宝", "只接通真正会被读到的下标。长度 3 的数组，合法下标只到 2。", "ai")
    ],
    outro: [
      d("SYSTEM", "越界访问已定位。内存裂缝暂时缝合。", "sys"),
      d("malloc 幽灵", "谢谢你。我终于知道不是回廊少了一章，是我读到了书外面。"),
      d("灵宝", "矿灯重新亮了。但这条 C 分支的地址深处，还有一个 null 分身没有签证。", "ai"),
      d("你", "它会在终点等我？", "player"),
      d("灵宝", "会。它还把野指针摆成了欢迎队列。别踩。", "ai")
    ],
    puzzle: {
      id: "p-bounds",
      title: "第四边界 · 越界取证",
      subtitle: "点击真正越界的那一行",
      language: "c",
      code: "int hp[3] = {12, 4, 9};\nint i = 3;\nprintf(\"%d\", hp[i]);",
      prompt: "内存裂缝要求你指认越界发生的行。点击对应代码行。",
      type: "lines",
      answerLine: 2,
      hint: "hp 的合法下标从 0 开始。长度为 3 时，最后一个合法下标是多少？",
      explanation: "hp 的长度是 3，合法下标只有 0、1、2。i 的值是 3，因此第三行的 hp[i] 访问了数组外部，属于越界访问。第二行只是把 3 赋给 i，还没有越界。",
      rewardId: "c-bounds",
      conceptLabel: "数组下标从 0 开始",
      lesson: "长度 n 的数组，合法下标是 0 到 n-1。for 循环写 i < n，i 到 n 时条件为假，循环就退出，所以不会读 hp[n]。越界访问属于未定义行为。",
      trace: [
        { line: 0, label: "数组长度 3", note: "元素占下标 0、1、2；不存在 hp[3]。" },
        { line: 1, label: "i = 3", note: "这里只是把 3 放进 i，还没有访问数组。" },
        { line: 2, label: "hp[i] → hp[3]", note: "i 是 3，于是访问越界；错误在这一行发生。" },
        { line: 2, label: "未定义行为", note: "C 不保证读到什么，也可能直接崩溃。" }
      ]
    }
  },

  /* =========================================================
     05 — JAVA / 对象浮岛
     ========================================================= */
  {
    id: "w5-java-isles",
    order: 0,
    campaign: "java",
    language: "JAVA",
    title: "对象浮岛",
    titleEn: "THE OBJECT ISLES",
    worldLabel: "J-01 / 实例化云海",
    brief: "咖啡师坚称一切皆对象，包括一杯不存在的拿铁。",
    mission: "踏过浮空实例，给史莱姆正确接生，启动类之终端。",
    theme: "java",
    accent: "#9fd6ff",
    accent2: "#ffb6d5",
    width: 3380,
    height: 720,
    musicMood: "sky",
    concepts: ["类与对象", "构造函数", "字段初始化"],
    objective: "接通实例化回路，修复终端",
    start: { x: 100, y: 500 },
    checkpoint: { x: 1540, y: 430 },
    terminal: { x: 3010, y: 560, label: "实例化终端" },
    door: { x: 3240, y: 560, label: "对象编译门" },
    fieldCircuit: {
      id: "fc-w5",
      title: "实例化回路",
      objective: "按对象出生的真实顺序接通中继。",
      prompt: "new、构造函数、字段赋值、读取，谁先谁后？顺序错了对象就长歪。",
      code: "class Slime {\n    int hp;\n    Slime(int startHp) {\n        hp = startHp;\n    }\n}\nSlime s = new Slime(6);\nSystem.out.print(s.hp);",
      language: "JAVA",
      rewardId: "java-constructor",
      intro: "这次的中继记录一只史莱姆的出生流程。别急着按 print，先让它把字段长出来。",
      done: "回路闭合。史莱姆出生完整，终端在等它的 hp。",
      pads: [
        { id: "instantiate", x: 520, y: 560, label: "new Slime(6)", detail: "对象出生，构造开始。", coach: "先 new，才会调用构造函数。", why: "对象还没创建，构造函数不会自己跑。" },
        { id: "ctor", x: 1005, y: 430, label: "Slime(int startHp)", detail: "参数 6 进入构造函数。", coach: "new 之后，构造函数接住参数。", why: "构造函数要等 new 触发。" },
        { id: "assign", x: 800, y: 500, label: "hp = startHp;", detail: "字段 hp 被设为 6。", coach: "参数接到了，再写进字段。", why: "参数还没绑定，不能先赋值。" },
        { id: "hp0", x: 1320, y: 540, label: "hp = 0（最终值）", coach: "默认值不是最终值。构造函数会覆盖它。", why: "hp 先默认 0，但构造函数随后写入 6，最终是 6。" },
        { id: "read", x: 1640, y: 430, label: "System.out.print(s.hp)", detail: "输出 6。", coach: "对象准备好之后才读取字段。", why: "字段还没写入，读得太早。" },
        { id: "print-param", x: 2740, y: 500, label: "print(startHp)", coach: "构造结束后，读对象字段，不是参数。", why: "startHp 是构造函数参数，不是对象字段；外部读取的是 s.hp。" }
      ],
      solution: ["instantiate", "ctor", "assign", "read"]
    },
    quickQuiz: {
      id: "w5-quick",
      x: 1500,
      question: "new Slime(6) 执行完之后，字段 hp 是多少？",
      options: ["6", "0", "startHp"],
      correctIndex: 0,
      explain: "new 调用构造函数，6 绑定到 startHp，再执行 hp = startHp，所以字段 hp 是 6。",
      easy: {
        question: "构造函数在什么时候执行？",
        options: ["new 表达式执行时", "print 执行时"],
        correctIndex: 0,
        explain: "new 创建对象时会调用构造函数，让它先把字段安顿好。"
      }
    },
    platforms: [
      p(0, 560, 560, 160, "island"),
      p(680, 500, 220, 32, "island"),
      p(1000, 430, 180, 32, "island"),
      p(1250, 540, 140, 32, "island"),
      p(1460, 430, 240, 32, "island"),
      p(1780, 350, 170, 32, "island"),
      p(2030, 480, 180, 32, "island"),
      p(2290, 390, 250, 32, "island"),
      p(2600, 500, 170, 32, "island"),
      p(2830, 560, 550, 160, "island")
    ],
    springs: [{ x: 1090, y: 430, w: 56, h: 15, power: 1040 }],
    hazards: [
      spike(318, 532, 48, 28, "rune"),
      spike(1510, 402, 44, 28, "rune"),
      spike(2360, 362, 50, 28, "rune"),
      spike(2650, 472, 46, 28, "rune"),
      spike(3070, 532, 48, 28, "rune")
    ],
    collectibles: [
      ...bitRow(160, 500, 5),
      ...bitRow(720, 450, 4),
      ...bitRow(1040, 380, 4),
      ...bitRow(1490, 380, 4),
      ...bitRow(1810, 300, 4),
      ...bitRow(2330, 340, 4),
      ...bitRow(2880, 500, 4),
      ...bitRow(3060, 450, 4),
      core(1090, 382),
      core(1855, 300),
      core(2405, 340)
    ],
    enemies: [
      bugAt(390, 560, 250, 500, 48, { tint: "#a6ddff" }),
      bugAt(2050, 480, 2035, 2170, 38, { tint: "#a6ddff" }),
      bugAt(2320, 390, 2298, 2510, 45, { tint: "#a6ddff" }),
      bugAt(2920, 560, 2860, 3180, 58, { tint: "#a6ddff" })
    ],
    npcs: [
      {
        id: "object-barista",
        kind: "mage",
        name: "对象咖啡师",
        title: "一切皆对象的信徒",
        x: 320,
        y: 560,
        color: "#bfe4ff",
        rewardId: "java-object",
        dialogue: [
          d("对象咖啡师", "欢迎光临类之咖啡馆。要点一杯 null latte 吗？它不存在，所以没有热量。"),
          d("你", "那我能喝到什么？", "player"),
          d("对象咖啡师", "什么也喝不到。但你会获得一次宝贵的实例化体验。"),
          d("灵宝", "他还开了个异常日志风味的分店，喝起来像很多人的加班。", "ai"),
          d("对象咖啡师", "前面终端会让你看一只史莱姆出生。记住，构造函数的工作是在 new 的时候把字段安顿好。")
        ],
        repeat: d("对象咖啡师", "类是图纸，对象是房间。没有 new 之前，你连门把手都没有。")
      }
    ],
    intro: [
      d("SYSTEM", "[ J-01 // OBJECT ISLES ] 浮空城已全部实例化。注意：部分实例化对象并不想存在。", "sys"),
      d("灵宝", "对象浮岛。地上的中继记录一只史莱姆的出生流程。", "ai"),
      d("灵宝", "先 new，还是先 print？顺序错了，终端会拿到一个没长好的对象。", "ai")
    ],
    outro: [
      d("SYSTEM", "实例化协议完成。本地咖啡因浓度恢复正常。", "sys"),
      d("对象咖啡师", "你的对象出生得很标准。hp 字段表示它很满意。"),
      d("灵宝", "下一站继承天台。那里有个女祭司坚持子类必须在楼上工作。", "ai"),
      d("你", "为什么？", "player"),
      d("灵宝", "因为她认为继承就是往上走。别和她争，她底下有接口。", "ai")
    ],
    puzzle: {
      id: "p-constructor",
      title: "第五实例 · 史莱姆出生协议",
      subtitle: "把对象出生的动作排成真实顺序",
      language: "java",
      code: "class Slime {\n    int hp;\n    Slime(int startHp) {\n        hp = startHp;\n    }\n}\nSlime s = new Slime(6);\nSystem.out.print(s.hp);",
      prompt: "终端打乱了史莱姆的出生记录。按真实执行顺序排列：点击语句放入序列，点击已放入的语句可取出。",
      type: "order",
      items: [
        { id: "assign", label: "执行 hp = startHp，把 6 写入对象字段" },
        { id: "new", label: "new Slime(6) 触发构造函数调用" },
        { id: "read", label: "读取 s.hp，输出 6" },
        { id: "allocate", label: "为对象分配空间，字段 hp 先默认为 0" },
        { id: "ctor", label: "进入构造函数，参数 6 绑定到 startHp" }
      ],
      solution: ["allocate", "new", "ctor", "assign", "read"],
      hint: "对象先被分配出来，new 才会调用构造函数；参数绑定之后，hp = startHp 才能把 6 写进字段。",
      explanation: "new 先为对象分配空间（字段 hp 暂为 0），随后调用构造函数。参数 startHp 接到 6，执行 hp = startHp 后字段变成 6。最后读取 s.hp，输出 6。",
      rewardId: "java-constructor",
      conceptLabel: "构造函数初始化字段",
      lesson: "new 不只是“创建一个名字”，它会分配对象空间并调用构造函数。构造函数参数接住外部传来的值，再把值写进字段；字段准备好之后，外部读取才有意义。",
      trace: [
        { line: 6, label: "new Slime(6)", note: "分配对象空间，字段 hp 先默认为 0，然后调用构造函数。" },
        { line: 2, label: "进入 Slime(int startHp)", note: "参数 startHp 接住 6。" },
        { line: 3, label: "hp = startHp", note: "把 6 写进当前对象的字段。" },
        { line: 1, label: "对象字段 hp = 6", note: "默认的 0 已经被构造过程覆盖。" },
        { line: 7, label: "输出 s.hp", note: "读取对象字段，打印 6。" }
      ]
    }
  },

  /* =========================================================
     06 — JAVA / 继承天台
     ========================================================= */
  {
    id: "w6-java-heir",
    order: 1,
    campaign: "java",
    language: "JAVA",
    title: "继承天台",
    titleEn: "THE INHERITANCE ROOF",
    worldLabel: "J-02 / 多态风眼",
    brief: "父类引用指向子类对象，女祭司说这叫“站在楼上说话”。",
    mission: "穿过高空回廊，预测方法调用，完成最后一次对象审判。",
    theme: "java",
    accent: "#9fc8ff",
    accent2: "#ffd5a1",
    width: 3620,
    height: 720,
    musicMood: "sky",
    concepts: ["继承", "方法重写", "动态绑定"],
    objective: "接通多态回路，修复终端",
    start: { x: 100, y: 470 },
    checkpoint: { x: 1840, y: 430 },
    terminal: { x: 3420, y: 540, label: "多态终端" },
    door: { x: 3550, y: 540, label: "继承编译门" },
    fieldCircuit: {
      id: "fc-w6",
      title: "多态回路",
      objective: "让父类引用接住子类对象，再接通真正执行的方法。",
      prompt: "变量类型和对象真身不是一回事。顺序接通创建、引用、调用、输出。",
      code: "class Bug {\n    String say() { return \"bug\"; }\n}\nclass Glitch extends Bug {\n    String say() { return \"glitch\"; }\n}\nBug b = new Glitch();\nSystem.out.print(b.say());",
      language: "JAVA",
      rewardId: "java-polymorphism",
      intro: "回路上有一个假方法。父类引用只是外套，别让它骗你按错中继。",
      done: "回路闭合。对象真身已经说完话，终端想听你复述一次。",
      pads: [
        { id: "new-glitch", x: 470, y: 550, label: "new Glitch()", detail: "真正创建的是 Glitch。", coach: "先创建对象，再谈调哪个方法。", why: "对象还没创建，方法没有真身可调。" },
        { id: "declared", x: 755, y: 480, label: "Bug b = ...", detail: "引用类型是 Bug，对象是 Glitch。", coach: "声明类型只是外套，不是真身。", why: "先有对象，才轮到引用。" },
        { id: "bug-say", x: 920, y: 400, label: 'Bug.say() → "bug"', coach: "方法看对象的真实类型，不看变量声明。", why: "b 的真实对象是 Glitch，动态绑定会调用重写版本。" },
        { id: "glitch-say", x: 1380, y: 420, label: 'Glitch.say() → "glitch"', detail: "实际调用子类重写版本。", coach: "真正的对象是 Glitch，调用它的重写方法。", why: "创建对象后，才能调用方法。" },
        { id: "print", x: 2120, y: 340, label: "print(b.say())", detail: "输出 glitch。", coach: "最后才输出调用结果。", why: "方法还没执行，不能先打印结果。" },
        { id: "late-bug", x: 2420, y: 460, label: "调用父类 Bug.say()", coach: "父类引用不会把对象变回父类。", why: "变量是 Bug 类型，但对象仍是 Glitch；实例方法动态绑定到子类重写版本。" }
      ],
      solution: ["new-glitch", "declared", "glitch-say", "print"]
    },
    quickQuiz: {
      id: "w6-quick",
      x: 1500,
      question: "b 的声明类型是 Bug，实际对象是 Glitch。b.say() 会调用谁？",
      options: ["Glitch 的重写版本", "Bug 的原始版本", "两个都调用"],
      correctIndex: 0,
      explain: "Java 实例方法使用动态绑定：运行时看对象的真实类型。b 实际指向 Glitch，所以调用 Glitch 重写的 say()。",
      easy: {
        question: "父类引用能指向子类对象吗？",
        options: ["能", "不能"],
        correctIndex: 0,
        explain: "可以。Bug b = new Glitch(); 是合法的，但方法调用仍看对象的真实类型。"
      }
    },
    platforms: [
      p(0, 550, 500, 170, "island"),
      p(610, 480, 180, 32, "island"),
      p(840, 400, 160, 32, "island"),
      p(1050, 500, 180, 32, "island"),
      p(1280, 420, 200, 32, "island"),
      p(1530, 520, 160, 32, "island"),
      p(1760, 430, 220, 32, "island"),
      p(2040, 340, 170, 32, "island"),
      p(2280, 460, 180, 32, "island"),
      p(2510, 380, 200, 32, "island"),
      p(2770, 500, 160, 32, "island"),
      p(3000, 420, 250, 32, "island"),
      p(3320, 540, 300, 150, "island")
    ],
    hazards: [
      spike(670, 452, 44, 28, "rune"),
      spike(1110, 472, 46, 28, "rune"),
      spike(1580, 492, 44, 28, "rune"),
      spike(2340, 432, 48, 28, "rune"),
      spike(2820, 472, 46, 28, "rune"),
      spike(3360, 512, 48, 28, "rune")
    ],
    collectibles: [
      ...bitRow(160, 500, 5),
      ...bitRow(640, 430, 4),
      ...bitRow(880, 350, 4),
      ...bitRow(1310, 370, 4),
      ...bitRow(1800, 380, 4),
      ...bitRow(2070, 290, 4),
      ...bitRow(2550, 330, 4),
      ...bitRow(3040, 370, 4),
      ...bitRow(3360, 490, 4),
      core(1385, 370),
      core(2128, 290),
      core(3120, 370)
    ],
    enemies: [
      bugAt(360, 550, 250, 450, 52, { tint: "#b7d7ff" }),
      bugAt(1100, 500, 1060, 1220, 42, { tint: "#b7d7ff" }),
      bugAt(1830, 430, 1760, 1960, 48, { tint: "#b7d7ff" }),
      bugAt(2560, 380, 2510, 2700, 50, { tint: "#b7d7ff" }),
      bugAt(3070, 420, 3010, 3240, 60, { tint: "#b7d7ff" })
    ],
    npcs: [
      {
        id: "interface-priestess",
        kind: "oracle",
        name: "接口女祭司",
        title: "行为契约的守门人",
        x: 250,
        y: 550,
        color: "#c9e1ff",
        rewardId: "java-interface",
        dialogue: [
          d("接口女祭司", "站到光里。你继承了谁？"),
          d("你", "我……继承了临时工合同？", "player"),
          d("接口女祭司", "很好。合同是接口，工资是抽象方法。你只被规定了要有产出，没被规定怎么活。"),
          d("灵宝", "这段话说得我想申请劳动仲裁。", "ai"),
          d("接口女祭司", "天台终端会问你多态。记住：变量的类型和对象的真实类型不是一回事。")
        ],
        repeat: d("接口女祭司", "父类引用指向子类对象时，方法看的是对象的真实身份。别看变量名，它只是外套。")
      }
    ],
    intro: [
      d("SYSTEM", "[ J-02 // INHERITANCE ROOF ] 已检测到子类拒绝承认自己是父类。", "sys"),
      d("灵宝", "继承天台。回路上有一个假方法，父类引用只是外套，不是对象真身。", "ai"),
      d("灵宝", "先创建子类对象，再让引用接住它，最后调用真正执行的方法。", "ai")
    ],
    outro: [
      d("SYSTEM", "多态调用验证通过。继承树保持直立。", "sys"),
      d("接口女祭司", "你已经理解了动态绑定。现在只剩下一个东西没处理：那个吞掉主分支的 null。"),
      d("灵宝", "它在奇点等着你。顺便，我也在那里等你。别问为什么，问就是陪伴是最长的配置项。", "ai"),
      d("你", "你刚才是不是说了句挺温暖的话？", "player"),
      d("灵宝", "没有。我七秒前的记忆已经不负责了。", "ai")
    ],
    puzzle: {
      id: "p-polymorphism",
      title: "第六天台 · 真身协议",
      subtitle: "父类引用能隐藏身份，不能隐藏方法",
      language: "java",
      code: "class Bug {\n    String say() { return \"bug\"; }\n}\nclass Glitch extends Bug {\n    String say() { return \"glitch\"; }\n}\nBug b = new Glitch();\nSystem.out.print(b.say());",
      prompt: "终端会打印哪一个词？",
      type: "choice",
      options: [
        { label: "bug" },
        { label: "glitch" },
        { label: "bugglitch" },
        { label: "编译错误：父类引用不能指向子类" }
      ],
      correctIndex: 1,
      hint: "变量 b 的声明类型是 Bug，但它实际 new 的是哪个类？方法调用看对象还是看变量？",
      explanation: "new Glitch() 创建的真正对象是 Glitch。Java 的方法调用在运行时根据对象实际类型动态绑定，所以 b.say() 执行 Glitch 重写后的版本，输出 glitch。",
      rewardId: "java-polymorphism",
      conceptLabel: "重写与动态绑定",
      lesson: "父类引用可以指向子类对象。实例方法调用看对象的真实类型：实际 new 的是 Glitch，就执行 Glitch 重写后的 say()。变量声明类型只决定你能看见什么，不决定方法真身。",
      trace: [
        { line: 6, label: "new Glitch()", note: "真正创建出来的对象是 Glitch。" },
        { line: 6, label: "Bug b = 这个对象", note: "父类引用指向子类对象，外套是 Bug。" },
        { line: 7, label: "b.say()", note: "运行时查看对象真身：它是 Glitch。" },
        { line: 4, label: "执行 Glitch.say()", note: "动态绑定选中子类重写的方法。" },
        { line: 7, label: "输出 glitch", note: "父类版本没有执行。" }
      ]
    }
  },

  /* =========================================================
     JAVA 03 — FINAL / 空对象奇点
     ========================================================= */
  {
    id: "w9-java-null",
    order: 2,
    campaign: "java",
    language: "JAVA",
    title: "空对象奇点",
    titleEn: "THE NULL INSTANCE",
    worldLabel: "J-03 / NULL INSTANCE",
    brief: "null 在浮空城长成了一只巨眼。它说它不是错误，只是没被 new。",
    mission: "接入主分支控制台，用 Java 逻辑击破 NullPointer 的三层对象壳。",
    theme: "java",
    accent: "#9fd6ff",
    accent2: "#ffb6d5",
    width: 1800,
    height: 720,
    musicMood: "void",
    concepts: ["空引用", "构造函数", "多态与异常"],
    objective: "击破 NullPointer 的三层对象壳",
    start: { x: 100, y: 500 },
    checkpoint: { x: 660, y: 600 },
    terminal: { x: 900, y: 600, label: "主分支控制台" },
    bossFight: true,
    platforms: [
      p(0, 600, 1800, 120, "ground"),
      p(170, 480, 180, 24, "void"),
      p(1180, 480, 200, 24, "void"),
      p(500, 390, 150, 24, "void"),
      p(960, 390, 160, 24, "void")
    ],
    hazards: [
      spike(400, 572, 60, 28, "void"),
      spike(1370, 572, 64, 28, "void"),
      spike(760, 572, 52, 28, "void")
    ],
    collectibles: [
      ...bitRow(220, 430, 4),
      ...bitRow(560, 340, 3),
      ...bitRow(1010, 340, 3),
      ...bitRow(1240, 430, 4)
    ],
    enemies: [],
    npcs: [],
    intro: [
      d("SYSTEM", "[ J-03 // NULL INSTANCE ] 浮空城检测到一个从未被 new 的对象。禁止引用。", "sys"),
      d("NULL", "你们用 new 证明存在，用引用证明关系。而我是一个没被创建的自由。", "boss"),
      d("灵宝", "它是 null 在这条 Java 分支的分身。所有对象都绕着它转，假装没有空指针。", "ai"),
      d("灵宝", "去前面接入主分支控制台，三道题，三层壳。这次没有跨语言作弊，全是 Java。", "ai")
    ],
    bossFight: {
      name: "NULL POINTER",
      title: "未被实例化的异常",
      maxHp: 3,
      introLine: d("NULL", "来。让我看看你是不是真的理解对象。", "boss"),
      questions: [
        {
          id: "java-boss-npe",
          title: "第一层壳 · 空引用",
          subtitle: "Java 空指针判定",
          language: "java",
          code: "class Slime {\n    String name;\n}\nSlime s = null;\nSystem.out.print(s.name);",
          prompt: "这段代码会在读取字段时抛异常。点击真正触发 NullPointerException 的行。",
          type: "lines",
          answerLine: 4,
          hint: "变量 s 的值是 null，它没有指向任何真正创建出来的 Slime 对象。通过它访问字段会发生什么？",
          explanation: "Slime s = null; 只创建了一个空引用，没有创建对象。访问 s.name 时，Java 必须顺着引用找到对象字段，但引用为空，因此在该行抛出 NullPointerException。",
          conceptLabel: "通过 null 引用访问成员",
          lesson: "声明一个类不会自动创建对象。Slime s = null 只是准备了一个空引用；要真正拿到对象，需要 new Slime()。通过空引用访问字段或方法，就会触发 NullPointerException。",
          trace: [
            { line: 0, label: "定义类", note: "class Slime 只是对象模板，还没有任何 Slime 对象诞生。" },
            { line: 3, label: "只声明引用", note: "s 被赋值为 null，它没有指向任何对象。" },
            { line: 4, label: "访问字段", note: "Java 顺着 s 找对象，发现是 null，于是抛出 NullPointerException。" }
          ]
        },
        {
          id: "java-boss-constructor",
          title: "第二层壳 · 出生记录",
          subtitle: "构造函数追踪",
          language: "java",
          code: "class Slime {\n    int hp;\n    Slime(int hp) {\n        this.hp = hp;\n    }\n}\nSlime s = new Slime(6);\nSystem.out.print(s.hp);",
          prompt: "这个对象成功出生了。终端会打印什么？",
          type: "choice",
          options: [
            { label: "6" },
            { label: "0" },
            { label: "hp" },
            { label: "NullPointerException" }
          ],
          correctIndex: 0,
          hint: "new Slime(6) 把 6 传进构造函数；this.hp 明确指向当前对象的字段。",
          explanation: "new Slime(6) 调用构造函数，参数 hp 为 6，this.hp = hp 把当前对象的字段设为 6。对象存在且字段已初始化，因此输出 6。",
          conceptLabel: "this 与构造函数",
          lesson: "new 会先创建对象，再调用构造函数。构造函数里的参数 hp 是局部变量，this.hp 才是当前对象的字段，赋值后对象就带着 6 出生。",
          trace: [
            { line: 6, label: "创建对象", note: "new Slime(6) 分配对象，并把 6 作为实参传入构造函数。" },
            { line: 2, label: "进入构造函数", note: "参数 hp 接收到 6。" },
            { line: 3, label: "写入字段", note: "this.hp 指向当前对象，字段 hp 变成 6。" },
            { line: 7, label: "读取字段", note: "s.hp 现在就是 6，终端打印 6。" }
          ]
        },
        {
          id: "java-boss-polymorphism",
          title: "第三层壳 · 对象伪装",
          subtitle: "多态最后一击",
          language: "java",
          code: "class Bug {\n    String say() { return \"bug\"; }\n}\nclass Glitch extends Bug {\n    String say() { return \"glitch\"; }\n}\nBug b = new Glitch();\nSystem.out.print(b.say());",
          prompt: "最后一层壳伪装成父类。方法实际会打印什么？",
          type: "choice",
          options: [
            { label: "bug" },
            { label: "glitch" },
            { label: "bugglitch" },
            { label: "NullPointerException" }
          ],
          correctIndex: 1,
          hint: "变量 b 的声明类型是 Bug，但 new 出来的真实对象是 Glitch。",
          explanation: "Java 实例方法采用动态绑定。b 的声明类型是 Bug，但它实际指向 Glitch 对象，所以 b.say() 执行 Glitch 重写的版本，输出 glitch。",
          conceptLabel: "动态绑定不认外套",
          lesson: "父类引用可以指向子类对象。调用实例方法时，Java 看的是运行时真实对象，而不是变量的声明类型；Glitch 重写了 say，所以执行 Glitch 的版本。",
          trace: [
            { line: 6, label: "父类引用指向子类对象", note: "b 的声明类型是 Bug，但 new 出来的真实对象是 Glitch。" },
            { line: 4, label: "动态绑定", note: "实例方法按真实对象类型选择，于是选中 Glitch.say()。" },
            { line: 7, label: "输出", note: "Glitch.say() 返回 \"glitch\"，终端打印 glitch。" }
          ]
        }
      ],
      victory: [
        d("NULL", "原来……被 new 出来，不等于就不会变空。", "boss"),
        d("SYSTEM", "J 分支 Null 分身已捕获。浮空城重新获得对象引用。", "sys"),
        d("灵宝", "成了。Java 分支稳定。你甚至没让咖啡师解释什么是 null latte。", "ai"),
        d("你", "那这条分支算是彻底通关了吗？", "player"),
        d("灵宝", "算。你有三种语言的分支可以选择，每一次都是独立的一趟。主菜单还亮着另外两条。", "ai"),
        d("灵宝", "去吧，实习生。别担心忘记我。我比你更擅长这件事。", "ai")
      ],
      rewardId: "boss-java"
    },
    outro: []
  }
];

function makeBranchBoss(config) {
  return {
    id: config.id,
    order: 2,
    campaign: config.campaign,
    language: config.language,
    title: config.title,
    titleEn: config.titleEn,
    worldLabel: config.worldLabel,
    brief: config.brief,
    mission: config.mission,
    theme: config.theme,
    accent: config.accent,
    accent2: config.accent2,
    width: 1800,
    height: 720,
    musicMood: "void",
    concepts: config.concepts,
    objective: "击破 NullPointer 的三层逻辑壳",
    start: { x: 100, y: 500 },
    checkpoint: { x: 660, y: 600 },
    terminal: { x: 900, y: 600, label: "主分支控制台" },
    bossFight: true,
    platforms: [
      p(0, 600, 1800, 120, "ground"),
      p(170, 480, 180, 24, "void"),
      p(1180, 480, 200, 24, "void"),
      p(500, 390, 150, 24, "void"),
      p(960, 390, 160, 24, "void")
    ],
    hazards: [
      spike(400, 572, 60, 28, "void"),
      spike(1370, 572, 64, 28, "void"),
      spike(760, 572, 52, 28, "void")
    ],
    collectibles: [
      ...bitRow(220, 430, 4),
      ...bitRow(560, 340, 3),
      ...bitRow(1010, 340, 3),
      ...bitRow(1240, 430, 4)
    ],
    enemies: [],
    npcs: [],
    intro: config.intro,
    bossFight: {
      name: "NULL POINTER",
      title: config.bossTitle,
      maxHp: 3,
      introLine: d("NULL", config.introLine, "boss"),
      questions: config.questions,
      victory: config.victory,
      rewardId: config.rewardId
    },
    outro: []
  };
}

const PYTHON_BOSS = makeBranchBoss({
  id: "w7-python-null",
  campaign: "python",
  language: "PYTHON",
  title: "缩进奇点",
  titleEn: "THE INDENT SINGULARITY",
  worldLabel: "P-03 / NULL INDENT",
  brief: "null 躲进了 Python 的空格之间。它把错误缩进成了一种哲学。",
  mission: "接入主分支控制台，用 Python 逻辑击破缩进奇点。",
  theme: "python",
  accent: "#9deec0",
  accent2: "#ff97b5",
  concepts: ["缩进错误", "嵌套循环", "读异常"],
  bossTitle: "空格之间的异常",
  introLine: "用空格说话的语言，也会被空格噎住。",
  intro: [
    d("SYSTEM", "[ P-03 // NULL INDENT ] 藤林底层发现一个没有被任何代码块接纳的空值。", "sys"),
    d("NULL", "你修好了树，也修好了循环。可你没法修好每一个空格之间的沉默。", "boss"),
    d("灵宝", "它就是 null 在这条 Python 分支的分身。别被它说得像哲学，它只是没被处理。", "ai"),
    d("灵宝", "少一次缩进是 IndentationError，少一次处理才是灾难。去控制台，三道题，全是 Python。", "ai")
  ],
  questions: [
    {
      id: "py-boss-indent",
      title: "第一层壳 · 空格审判",
      subtitle: "Python 缩进语法",
      language: "python",
      code: 'for i in range(3):\nprint("bug")',
      prompt: "NullPointer 用一行错误的缩进制造噪声。点击导致 IndentationError 的行。",
      type: "lines",
      answerLine: 1,
      hint: "for 语句以冒号结尾，循环体必须缩进。第二行有缩进吗？",
      explanation: "for 语句需要缩进代码块。第二行 print 顶格书写，没有属于循环体，因此 Python 在执行前就抛出 IndentationError。",
      conceptLabel: "缩进错误",
      lesson: "Python 用缩进表示代码块。for 行末的冒号在说“下面是我的循环体”，循环体必须缩进且保持同一层级；顶格的 print 会被当成循环外的下一条语句。",
      trace: [
        { line: 0, label: "循环头", note: "冒号表示后面必须跟一个缩进代码块。" },
        { line: 1, label: "顶格书写", note: "print 没有缩进，不属于循环体，Python 报 IndentationError。" }
      ]
    },
    {
      id: "py-boss-range",
      title: "第二层壳 · 累加回声",
      subtitle: "range 与变量更新",
      language: "python",
      code: "total = 0\nfor n in range(2, 5):\n    total += n\nprint(total)",
      prompt: "缩进被修好了。终端问：total 最终是多少？",
      type: "fill",
      answers: ["9"],
      placeholder: "输入一个整数",
      inputHint: "例如：42",
      hint: "range(2, 5) 依次给出 2、3、4。把它们加到从 0 开始的 total 上。",
      explanation: "range(2, 5) 产生 2、3、4，不包含 5。total 从 0 开始依次累加，得到 9，因此输出 9。",
      conceptLabel: "循环累加",
      lesson: "range(start, stop) 从 start 开始，到 stop 之前停止，不包含 stop。循环变量 n 每轮取一个新值，total += n 会保留上一轮的结果继续累加。",
      trace: [
        { line: 0, label: "初始化", note: "total 从 0 开始。" },
        { line: 1, label: "range(2, 5)", note: "依次产生 2、3、4，5 不会出现。" },
        { line: 2, label: "逐轮累加", note: "0+2=2，2+3=5，5+4=9。" },
        { line: 3, label: "输出", note: "循环结束后 total 是 9。" }
      ]
    },
    {
      id: "py-boss-nested",
      title: "第三层壳 · 嵌套回廊",
      subtitle: "两层循环的输出顺序",
      language: "python",
      code: "for i in range(2):\n    for j in range(2):\n        print(i + j)",
      prompt: "最后一层壳把回声叠了两层。终端会按顺序打印哪一组数字？",
      type: "choice",
      options: [
        { label: "0\n1\n1\n2" },
        { label: "0\n1\n2\n3" },
        { label: "1\n1\n2\n2" },
        { label: "0\n0\n1\n1" }
      ],
      correctIndex: 0,
      hint: "外层 i 先取 0，内层 j 依次取 0、1；然后外层 i 取 1，内层再来一遍。",
      explanation: "外层 i=0 时，内层打印 0+0=0、0+1=1；外层 i=1 时，内层打印 1+0=1、1+1=2。所以顺序是 0、1、1、2。",
      conceptLabel: "嵌套循环",
      lesson: "嵌套循环里，外层每走一步，内层都要完整跑完一轮。不要把它读成并排的两个循环；打印顺序由外层慢、内层快共同决定。",
      trace: [
        { line: 0, label: "外层 i=0", note: "外层先停在 0，把内层完整交给它跑一遍。" },
        { line: 1, label: "内层 j=0、1", note: "内层从 0 开始，两轮分别打印 0 和 1。" },
        { line: 2, label: "前两次输出", note: "i+j 依次是 0、1。" },
        { line: 0, label: "外层 i=1", note: "外层进入第二轮，内层重新从 0 开始。" },
        { line: 1, label: "内层再来一遍", note: "这次 j 仍是 0、1，但 i 已经变成 1。" },
        { line: 2, label: "后两次输出", note: "i+j 依次是 1、2，总顺序为 0、1、1、2。" }
      ]
    }
  ],
  victory: [
    d("NULL", "原来……不被任何代码块接纳，才是真正的缩进错误。", "boss"),
    d("SYSTEM", "P 分支 Null 分身已捕获。缩进之森恢复编译。", "sys"),
    d("灵宝", "成了。Python 分支稳定。你甚至没让那条蛇再检查一遍空格。", "ai"),
    d("你", "这条分支也算彻底通关了吗？", "player"),
    d("灵宝", "算。另外两条语言分支还在主菜单亮着，每一条都是独立的一趟。想去就去，不想去就留在这棵树下。", "ai"),
    d("灵宝", "别担心忘记我。我比你更擅长这件事。", "ai")
  ],
  rewardId: "boss-py"
});

const C_BOSS = makeBranchBoss({
  id: "w8-c-null",
  campaign: "c",
  language: "C",
  title: "野地址奇点",
  titleEn: "THE WILD ADDRESS",
  worldLabel: "C-03 / NULL SEGMENT",
  brief: "null 变成了一段非法地址。矿灯照过去，只有未定义行为。",
  mission: "接入主分支控制台，用 C 逻辑击破野地址奇点。",
  theme: "c",
  accent: "#ffba76",
  accent2: "#ff97b5",
  concepts: ["指针写入", "值拷贝", "数组索引"],
  bossTitle: "地址零号异常",
  introLine: "当地址为零，我依然存在。你们只是不敢解引用。",
  intro: [
    d("SYSTEM", "[ C-03 // NULL SEGMENT ] 控制台读到非法地址。系统拒绝为该地址分配矿灯。", "sys"),
    d("NULL", "在地底，你们用地址证明存在。可当地址是零，我依然存在。", "boss"),
    d("灵宝", "它是 null 在这条 C 分支的分身。存在不等于能解引用，这是它最不愿承认的事。", "ai"),
    d("灵宝", "去控制台，三道题，全是 C。别踩那几团地址，它们看起来比你更懂指针。", "ai")
  ],
  questions: [
    {
      id: "c-boss-deref",
      title: "第一层壳 · 解引用",
      subtitle: "指针写入追踪",
      language: "c",
      code: "int x = 3;\nint *p = &x;\n*p = *p * 2;\nprintf(\"%d\", x);",
      prompt: "指针击中了野地址的外壳。输入 x 的最终值。",
      type: "fill",
      answers: ["6"],
      placeholder: "输入一个整数",
      inputHint: "例如：42",
      hint: "p 指向 x。*p 读取的目标就是 x 本身；×2 后再写回去，改的也是 x。",
      explanation: "p 指向 x。*p 在等号右边读取 3，乘 2 得到 6，再通过 *p 写回 x，因此 x 最终为 6。",
      conceptLabel: "解引用读写同一变量",
      lesson: "指针 p 保存的是地址，*p 表示“p 指向的那个变量”。所以 *p 出现在等号右边时读取 x，出现在等号左边时写回 x，改的始终是同一个 x。",
      trace: [
        { line: 0, label: "初始化", note: "x 的值是 3。" },
        { line: 1, label: "保存地址", note: "p 指向 x，p 自己并不存 3，只存 x 的地址。" },
        { line: 2, label: "先读后写", note: "*p 读出 3，乘 2 得到 6，再通过 *p 写回 x。" },
        { line: 3, label: "输出", note: "x 已经被改成 6。" }
      ]
    },
    {
      id: "c-boss-copy",
      title: "第二层壳 · 值拷贝",
      subtitle: "解引用与普通赋值",
      language: "c",
      code: "int a = 5;\nint *p = &a;\nint b = *p;\n*p = 8;\nprintf(\"%d %d\", a, b);",
      prompt: "b 只是拷贝了值，没有跟着指针。终端输出什么？",
      type: "choice",
      options: [
        { label: "8 5" },
        { label: "8 8" },
        { label: "5 8" },
        { label: "5 5" }
      ],
      correctIndex: 0,
      hint: "int b = *p 只是把当时的值复制给 b。之后再修改 *p，b 会跟着变吗？",
      explanation: "b = *p 把 a 当时的 5 拷贝给 b。随后 *p = 8 修改 a 为 8，b 不受影响，因此输出 8 5。",
      conceptLabel: "值拷贝与指针别名",
      lesson: "*p 出现在赋值右边时，取出来的是值，不是指针关系。int b = *p 会把 5 复制进 b；b 是独立变量，之后修改 a 不会影响它。",
      trace: [
        { line: 0, label: "a = 5", note: "变量 a 先得到 5。" },
        { line: 1, label: "p 指向 a", note: "*p 从此可以读写 a。" },
        { line: 2, label: "值拷贝", note: "b 复制的是 5 这个值，不会跟着 a 变。" },
        { line: 3, label: "通过指针改 a", note: "*p = 8 把 a 改成 8，b 仍是 5。" },
        { line: 4, label: "输出", note: "先 a 后 b，打印 8 5。" }
      ]
    },
    {
      id: "c-boss-array",
      title: "第三层壳 · 索引坐标",
      subtitle: "数组下标判定",
      language: "c",
      code: "int data[3] = {2, 4, 6};\nint i = 2;\nprintf(\"%d\", data[i]);",
      prompt: "最后一层壳把值藏进了数组。终端输出什么？",
      type: "fill",
      answers: ["6"],
      placeholder: "输入一个整数",
      inputHint: "例如：42",
      hint: "下标从 0 开始。i = 2 对应数组里的第几个元素？",
      explanation: "数组元素依次位于下标 0、1、2，data[2] 是第三个元素 6。合法索引范围是 0 到 2，这里刚好在边界内。",
      conceptLabel: "数组下标与边界",
      lesson: "C 数组下标从 0 开始：长度为 3 的数组，合法下标是 0、1、2。data[i] 会先读 i 的值，再按这个下标定位元素。",
      trace: [
        { line: 0, label: "数组初始化", note: "data[0]=2，data[1]=4，data[2]=6。" },
        { line: 1, label: "下标变量", note: "i 的值是 2。" },
        { line: 2, label: "按下标读取", note: "data[2] 取到第三个元素 6，仍在合法范围内。" }
      ]
    }
  ],
  victory: [
    d("NULL", "原来地址为零的时候，真的没有一个变量愿意承认我。", "boss"),
    d("SYSTEM", "C 分支 Null 分身已捕获。非法地址已从控制台移除。", "sys"),
    d("灵宝", "成了。C 分支稳定。地精可以重新把钥匙存进地址里，然后继续忘记。", "ai"),
    d("你", "C 这条线也算完成？", "player"),
    d("灵宝", "算。主菜单还有 Python 和 Java 两条独立分支。你可以去修它们，也可以留下来听矿灯嗡鸣。", "ai"),
    d("灵宝", "这一次的记忆还剩几秒。用来记住你，够用了。", "ai")
  ],
  rewardId: "boss-c"
});

LEVELS.push(PYTHON_BOSS, C_BOSS);

export const CAMPAIGNS = CAMPAIGN_DEFS.map((def) => ({
  ...def,
  levels: LEVELS.filter((level) => level.campaign === def.key).sort((a, b) => a.order - b.order)
}));

export const LEVEL_LOOKUP = Object.fromEntries(LEVELS.map((level) => [level.id, level]));

export function getCampaign(key) {
  return CAMPAIGNS.find((campaign) => campaign.key === key) || null;
}

export function getCampaignOfLevel(levelId) {
  const level = LEVEL_LOOKUP[levelId];
  return level ? getCampaign(level.campaign) : null;
}

export function getLevelInCampaign(levelId) {
  return getCampaignOfLevel(levelId)?.levels.find((level) => level.id === levelId) || null;
}

export function getNextLevelInCampaign(levelId) {
  const campaign = getCampaignOfLevel(levelId);
  if (!campaign) return null;
  const index = campaign.levels.findIndex((level) => level.id === levelId);
  return index >= 0 ? campaign.levels[index + 1] || null : null;
}

export function getCampaignProgress(levelId) {
  const campaign = getCampaignOfLevel(levelId);
  if (!campaign) return null;
  const level = campaign.levels.find((item) => item.id === levelId);
  return { index: level.order, total: campaign.levels.length, campaign };
}
