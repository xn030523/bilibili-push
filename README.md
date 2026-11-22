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

它是一条完整的自动化流水线：**采集新闻 → DeepSeek 改写 → Edge-TTS 逐句配音 → Remotion 渲染像素动画 → 自动投稿**。没有笨重的网页后台，登录、发布全在**终端**里完成，几个命令搞定一切。 🐋

> A pixel-art whale automates your daily AI news video and publishes it to Bilibili — collect, rewrite, voice, render, publish, all driven from the command line.

## 🎬 亮点 · Highlights

- 🐋 **大肥鱼主播**：像素鲸鱼会眨眼、甩尾、喷水、**开口说话**，还会上下漂浮卖萌
- 🌌 **像素风背景**：星空、月亮、云朵、远山、海浪，全是像素块拼的
- 🗣️ **字幕口播严格对齐**：逐句 TTS，每句字幕时长 = 那句音频的真实时长
- 🎨 **统一封面**：像素背景 + 大肥鱼 + 固定标题版式，每期视觉一致
- 📱 **终端扫码登录**：一条命令在终端生成二维码，手机扫完 Cookie 自动写入 `config.json`
- 🛡️ **合规标题**：改写 prompt 内置防「不实信息」约束，避免耸动/夸大标题被 B站审核退回
- ☁️ **免费定时**：GitHub Actions 每天自动跑，不占自己服务器

## 🧱 技术栈 · Stack

| 层 | 技术 |
|---|---|
| 视频渲染 | Remotion · React · ffmpeg |
| 文案改写 | DeepSeek API |
| 配音 | Edge-TTS |
| 扫码登录 | qrcode（终端二维码） |
| 语言 | TypeScript |

## 🚀 快速开始 · Quick Start

```bash
# 1. 装依赖
npm install --legacy-peer-deps

# 2. 配置 DeepSeek 密钥
cp .env.example .env
#    编辑 .env，填 DEEPSEEK_API_KEY=sk-...

# 3. 终端扫码登录 B站（Cookie 自动写入 config.json）
npm run login

# 4. 一键跑完整流程（采集→改写→配音→渲染→发布）
npm run publish
```

跑第 4 步时泡杯咖啡等几分钟 ☕，成片会自动投稿 B站。

> 首次渲染会自动下载 Chrome Headless Shell，需联网。

## ⚙️ 配置 · Configuration

| 位置 | 内容 | 说明 |
|---|---|---|
| `.env` | `DEEPSEEK_API_KEY` | DeepSeek 密钥（改写文案用） |
| `config.json` | `npm run login` 扫码后自动生成 | B站 Cookie（本地投稿用） |
| GitHub Secrets | `BILI_SESSDATA` / `BILI_JCT` | 云端自动投稿登录态 |

> 以上文件都在 `.gitignore` 里，**不会泄露**。

## ☁️ 部署 · Deployment

### GitHub Actions（免费定时自动发布）⭐

不占自己服务器，云端每天定时跑完整流程并自动投稿：

1. 把项目推到 GitHub 仓库
2. `Settings → Secrets and variables → Actions` 添加 3 个 Secret：`DEEPSEEK_API_KEY`、`BILI_SESSDATA`、`BILI_JCT`
3. `Actions → AI 日报自动发布 → Run workflow` 手动触发测试
4. 默认北京时间每天 8:00（改 `.github/workflows/publish.yml` 里的 `cron`，注意是 **UTC**）

> GitHub Actions 的 `BILI_SESSDATA` / `BILI_JCT` 是本机 `npm run login` 后从 `config.json` 里抄过去的，两处保持一致即可。

## 📁 目录结构 · Structure

```
├── src/
│   ├── index.ts               # 管道入口：采集→改写→配音→封面→渲染→发布
│   ├── pipeline/              # collect / rewrite / tts / publish / store / feeds
│   ├── video/                 # Remotion 视频（MainVideo / Cover / 像素组件）
│   └── server/                # auth（扫码）/ bili（账户）/ config / qrlogin（登录脚本）
├── .github/workflows/         # GitHub Actions 定时自动发布
├── README.md
└── .env.example
```

## ❓ 常见问题 · FAQ

**Q：投稿失败，日志提示 geetest / 风控？**
A：GitHub runner 是海外 IP，B站对海外/异地投稿会弹人机验证。可考虑部署到亚太区 VPS（如 Oracle Cloud 新加坡/东京）更稳。

**Q：Cookie 多久过期？**
A：`SESSDATA` 约 30 天。过期后重新跑 `npm run login` 扫码即可，然后同步更新 GitHub Secrets。

**Q：视频被退回「不实信息」？**
A：标题/内容踩了 B站不实信息红线。本项目改写 prompt 已内置防夸大约束，若仍被退回，检查当天新闻源里是否有未证实的说法，或在 `src/pipeline/rewrite.ts` 里进一步收紧措辞。

**Q：cron 时间不对？**
A：GitHub Actions 的 cron 是 **UTC**，北京时间 = UTC + 8。

**Q：视频里中文变方框？**
A：服务器缺中文字体，装 `fonts-noto-cjk`（工作流里已内置）。

---

<p align="center">
  <sub>Made with 🐋 and lots of ☕ · 用大肥鱼和咖啡因驱动</sub>
</p>
