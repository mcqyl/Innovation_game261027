# Innovation_game261027 · CODE RIFT（代码裂隙）

一款可以边玩边学 Python / C / Java 的 2D 剧情冒险游戏。三种语言分支独立闯关，搭配会聊天、会给提示的 AI 伙伴。

> 本项目为本人参赛作品，仅用于比赛提交与展示，请勿用于商业用途。

## 运行环境

| 项目 | 要求 |
| --- | --- |
| Node.js | 18 及以上（推荐 20 LTS+） |
| 浏览器 | Chrome / Edge / Firefox / Safari 近期版本 |
| 依赖 | 无第三方运行库，零安装 |
| 网络 | 仅 AI 对话功能需要联网，其余玩法可离线 |

## 快速开始

```bash
# 1. 启动本地服务（默认 http://127.0.0.1:4177）
npm start

# 2. 开发模式（文件变更自动重启）
npm run dev
```

也可以用 `node server.js` 直接启动。

## 可选配置（AI 对话）

AI 伙伴功能依赖大模型接口，未配置时游戏本体照常运行。复制 `.env.example` 为 `.env`，按需填写：

```bash
cp .env.example .env
```

```ini
SUB2API_API_KEY=your_api_key_here
SUB2API_BASE_URL=https://api.postboxcenter.xyz/v1
SUB2API_MODEL=deepseek-v4.1-flash
SUB2API_WIRE_API=auto   # auto / responses / chat
HOST=127.0.0.1
PORT=4177
```

> `.env` 已被 `.gitignore` 忽略，请勿将真实密钥提交到仓库。

## 目录结构

```
.
├── index.html        # 页面入口与界面骨架
├── server.js         # 静态资源服务 + AI 接口代理
├── css/              # 样式（全局 / 世界 / 游戏 / 面板）
├── js/               # 逻辑（引擎 / 关卡 / 美术 / 音频 / 伙伴 / 主流程）
├── assets/           # 图标等静态资源
└── package.json
```

## 说明

- 游戏为纯前端实现，`server.js` 仅负责静态托管与 AI 请求转发。
- 建议使用 `npm start` 访问，直接双击 `index.html` 时 AI 功能不可用。
- 提交内容以本仓库为准，不包含任何私密配置与密钥。
