<p align="center">
  <h1 align="center">🐋 AI 日报 · Aihot Daily</h1>
  <p align="center">
    <b>AI 新闻 → 像素风动画 → 自动发布 B站</b>，全自动一条龙 🚀<br/>
    <i>AI news → pixel-art video → auto-publish to Bilibili, fully automated.</i>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Remotion-4-0b84f3" alt="Remotion"/>
    <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" alt="React"/>
    <img src="https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white" alt="Node"/>
    <img src="https://img.shields.io/badge/DeepSeek-API-4d6bfe" alt="DeepSeek"/>
  </p>
</p>

---

## ✨ 这是什么 · What is this

一只像素风**大肥鱼**（DeepSeek 鲸鱼）每天帮你把 AI 圈新闻做成活泼的动画视频，自动发到 B站。

它是一条完整的自动化流水线：**采集新闻 → DeepSeek 改写 → Edge-TTS 逐句配音 → Remotion 渲染像素动画 → 自动投稿**，还配了一个漂漂亮亮的 Web 管理面板，扫个码、点个按钮，剩下的交给它。 🐋

> A pixel-art whale automates your daily AI news video and publishes it to Bilibili — collect, rewrite, voice, render, publish, all in one pipeline, with a clean web dashboard.

## 🎬 亮点 · Highlights

- 🐋 **大肥鱼主播**：像素鲸鱼会眨眼、甩尾、喷水、**开口说话**，还会上下漂浮卖萌
- 🌌 **像素风背景**：星空、月亮、云朵、远山、海浪，全是像素块拼的，和死板的纯色背景说再见
- 🗣️ **字幕口播严格对齐**：逐句 TTS，每句字幕时长 = 那句音频的真实时长，不会「说的和显示的对不上」
- 🎨 **统一封面**：像素背景 + 大肥鱼 + 固定标题版式，每期视觉一致、一眼认出是你
- 🖥️ **Web 管理面板**（React + Ant Design）：
  - 📱 B站**扫码登录**，Cookie 自动保存
  - 👤 账户信息：头像 / 昵称 / 等级 / 粉丝
  - 🎞️ 成片**直接内嵌播放**，标题 / 封面 / 描述 / 标签一眼看全
  - 📊 已发布视频的播放 / 点赞 / 弹幕 / 评论 / 收藏
  - ⏰ 定时任务（cron）
- ☁️ **三种部署**：本地 / GitHub Actions 免费定时 / Docker

## 🧱 技术栈 · Stack

| 层 | 技术 |
|---|---|
| 视频渲染 | Remotion · React · ffmpeg |
| 文案改写 | DeepSeek API |
| 配音 | Edge-TTS |
| 面板前端 | Vite · React 19 · Ant Design |
| 面板后端 | Express · node-cron |
| 语言 | TypeScript |

## 🚀 快速开始 · Quick Start

```bash
# 1. 装依赖
npm install --legacy-peer-deps

# 2. 配置 DeepSeek 密钥
cp .env.example .env
#    编辑 .env，填 DEEPSEEK_API_KEY=sk-...

# 3. 启动面板
npm run dev
```

浏览器打开 **http://localhost:5173**（或 `npm run start` 后打开 http://localhost:3000）。

在面板里：**扫码登录 B站** → 点「立即生成」→ 泡杯咖啡等几分钟 ☕ → 成片自动投稿 B站。

> 首次渲染会自动下载 Chrome Headless Shell，需联网。

## ⚙️ 配置 · Configuration

| 位置 | 内容 | 说明 |
|---|---|---|
| `.env` | `DEEPSEEK_API_KEY` | DeepSeek 密钥（改写文案用） |
| `.env` | `BILI_SESSDATA` / `BILI_JCT` | 可选，投稿登录态 |
| `config.json` | 面板扫码登录后自动生成 | B站 Cookie、密钥、定时 |

> 以上文件都在 `.gitignore` 里，**不会泄露**。

## ☁️ 部署 · Deployment

### 方式一：GitHub Actions（免费定时自动发布）⭐

不占自己服务器，云端每天定时跑完整流程并自动投稿：

1. 把项目推到 GitHub 仓库
2. `Settings → Secrets and variables → Actions` 添加 3 个 Secret：`DEEPSEEK_API_KEY`、`BILI_SESSDATA`、`BILI_JCT`
3. `Actions → AI 日报自动发布 → Run workflow` 手动触发测试
4. 默认北京时间每天 8:00（改 `.github/workflows/publish.yml` 里的 `cron`，注意是 **UTC**）

### 方式二：Docker

```bash
docker compose up -d --build
# 面板 http://<服务器IP>:3000
```

### 方式三：裸机 + systemd

详见 [DEPLOY.md](DEPLOY.md)，或直接用 `deploy/aihot.service`。

## 📁 目录结构 · Structure

```
├── src/
│   ├── index.ts               # 管道入口：采集→改写→配音→封面→渲染→发布
│   ├── pipeline/              # collect / rewrite / tts / publish / store
│   ├── video/                 # Remotion 视频（MainVideo / Cover / 像素组件）
│   └── server/                # 面板后端（Express）
├── web/                       # 面板前端（Vite + React + Ant Design）
├── .github/workflows/         # GitHub Actions 定时自动发布
├── Dockerfile / docker-compose.yml
├── deploy/aihot.service       # systemd 单元
├── README.md / DEPLOY.md
└── .env.example
```

## ❓ 常见问题 · FAQ

**Q：投稿失败，日志提示 geetest / 风控？**
A：GitHub runner 是海外 IP，B站对海外/异地投稿会弹人机验证。改用 Docker/裸机部署到亚太区 VPS（如 Oracle Cloud 新加坡/东京）更稳。

**Q：Cookie 多久过期？**
A：`SESSDATA` 约 30 天。过期后重新扫码登录即可（面板一键操作）。

**Q：cron 时间不对？**
A：GitHub Actions 的 cron 是 **UTC**，北京时间 = UTC + 8。

**Q：视频里中文变方框？**
A：服务器缺中文字体，装 `fonts-noto-cjk`（Docker 镜像已内置）。

---

<p align="center">
  <sub>Made with 🐋 and lots of ☕ · 用大肥鱼和咖啡因驱动</sub>
</p>
