# AI 日报 · 自动生成与发布

每天自动采集 AI 新闻 → DeepSeek 改写 → Edge-TTS 逐句配音 → Remotion 渲染像素风动画 → 自动投稿 B站。

全流程一条龙，配一个 Web 管理面板：扫码登录、密钥管理、定时任务、视频预览、播放数据一屏看全。

## 功能特性

- **全自动流水线**：采集 → 改写 → 配音 → 渲染 → 发布，无人值守
- **像素风动画**：字多、字幕活泼、大肥鱼宠物开口说话、像素背景（非死图讲解）
- **字幕精确对齐**：逐句 TTS，每句音频的真实时长 = 该句字幕时长，口播与字幕严格同步
- **统一封面**：像素背景 + 大肥鱼 + 固定标题版式，每期视觉一致
- **Web 管理面板**（React + Ant Design）：
  - B站扫码登录（自动保存 cookie）
  - 账户信息（头像/昵称/等级/粉丝）
  - DeepSeek 密钥管理
  - 定时任务（cron）
  - 成片直接内嵌播放 + 标题/封面/描述/标签
  - 已发布视频的播放量/点赞/弹幕/评论/收藏
- **三种部署**：本地 / GitHub Actions（免费定时）/ Docker

## 技术栈

TypeScript · Remotion · React · Express · Ant Design · DeepSeek API · Edge-TTS · ffmpeg

## 环境要求

- Node.js 20+
- ffmpeg（Remotion 渲染）
- Chrome Headless Shell（Remotion 首次运行自动下载）
- 中文字体（Linux 需装 `fonts-noto-cjk`，否则视频中文变方框）

## 目录结构

```
├── src/
│   ├── index.ts               # 管道入口：采集→改写→配音→封面→渲染→发布
│   ├── pipeline/              # 采集/改写/TTS/发布/存储
│   ├── video/                 # Remotion 视频（MainVideo / Cover / 像素组件）
│   └── server/                # 管理面板后端（Express）
├── web/                       # 管理面板前端（Vite + React + Ant Design）
├── .github/workflows/         # GitHub Actions 定时自动发布
├── Dockerfile / docker-compose.yml
├── deploy/aihot.service       # systemd 单元
└── DEPLOY.md                  # 部署详细说明
```

## 快速开始（本地）

```bash
npm install --legacy-peer-deps

# 1. 配置 DeepSeek 密钥
cp .env.example .env
# 编辑 .env 填入 DEEPSEEK_API_KEY=sk-...

# 2. 启动面板
npm run dev
```

浏览器打开 **http://localhost:5173**（或 `npm run start` 后打开 http://localhost:3000）。

在面板里：**扫码登录 B站** → 点「立即生成」→ 等待几分钟 → 成片自动投稿 B站。

> 首次渲染会自动下载 Chrome Headless Shell，需联网。

## 配置

所有配置项（不提交进 git）：

| 位置 | 内容 |
|---|---|
| `.env` | `DEEPSEEK_API_KEY`（DeepSeek 密钥）、`BILI_SESSDATA` / `BILI_JCT`（可选） |
| `config.json` | 面板扫码登录后自动生成（B站 cookie、密钥、定时） |

## 部署

三种方式，详见 [DEPLOY.md](DEPLOY.md)：

### 方式一：GitHub Actions（免费定时自动发布）

不占自己服务器，每天定时在云端跑完整流程并自动投稿。步骤：

1. 把本项目推到 GitHub 仓库
2. 仓库 → Settings → Secrets and variables → Actions，添加 3 个 Secret：
   - `DEEPSEEK_API_KEY`
   - `BILI_SESSDATA`（本地面板扫码登录后 `config.json` 里 `bilibili.sessdata` 的值）
   - `BILI_JCT`（同上 `bilibili.biliJct`）
3. Actions → `AI 日报自动发布` → Run workflow 手动触发测试
4. 定时默认北京时间每天 8:00（改 `.github/workflows/publish.yml` 里的 cron，注意是 UTC）

### 方式二：Docker

```bash
docker compose up -d --build
# 面板 http://<服务器IP>:3000
```

### 方式三：裸机 + systemd

见 [DEPLOY.md](DEPLOY.md)，或直接 `deploy/aihot.service`。

## 注意事项

- **B站 Cookie 会过期**（`SESSDATA` 约 30 天），过期后投稿失败，需重新扫码登录更新。
- **GitHub runner 是海外 IP**，B站对海外/异地 IP 投稿可能触发人机验证导致失败；若遇「geetest/风控」，改用 Docker/裸机部署到亚太区 VPS（如 Oracle Cloud 新加坡/东京）更稳。
- **cron 是 UTC 时区**，北京时间 = UTC + 8。
- `config.json`、`.env`、`output/`、`logs/` 已在 `.gitignore`，不会泄露密钥或产物。
