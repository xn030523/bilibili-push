# 部署到服务器

面板 = React 前端（Vite 构建产物）+ Express 后端（`src/server/`）。后端负责扫码登录、密钥/定时配置、触发完整管道（采集→改写→TTS→渲染）。

## 本地开发

```bash
npm install --legacy-peer-deps
npm run dev
```

- 前端：http://localhost:5173 （Vite，代理 /api → 后端 3000）
- 后端：http://localhost:3000

## 方案 A：Docker（推荐，一条命令）

服务器需已装 Docker。

```bash
# 1. 传代码到服务器
git clone <你的仓库> /opt/aihot-bili   # 或 scp 上传

# 2. 构建并启动
cd /opt/aihot-bili
docker compose up -d --build
```

- 面板：http://<服务器IP>:3000
- 数据持久化在 `./config.json`、`./output/`、`./logs/`
- 首次用面板「扫码登录」保存 B站 Cookie，改密钥，开定时，即可全自动

## 方案 B：裸机 + systemd（Ubuntu/Debian）

```bash
# 1. 系统依赖
sudo apt update
sudo apt install -y ffmpeg fonts-noto-cjk fonts-noto-color-emoji nodejs npm

# 2. Remotion 渲染浏览器（首次）
npx remotion browser ensure

# 3. 装依赖 + 构建前端
cd /opt/aihot-bili
npm install --legacy-peer-deps
npm run build:web

# 4. 注册 systemd 服务
sudo cp deploy/aihot.service /etc/systemd/system/aihot.service
sudo systemctl daemon-reload
sudo systemctl enable --now aihot
```

- 日志：`journalctl -u aihot -f`，运行日志：`/opt/aihot-bili/logs/run.log`
- 面板：http://<服务器IP>:3000

## 端口 / 反向代理（可选）

面板默认 3000 端口。用 Nginx 反代并加域名：

```nginx
server {
  listen 80;
  server_name aihot.example.com;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
}
```

## 说明

- 配置存 `config.json`（密钥、B站 Cookie、cron 表达式），不要提交进 git。
- `cron` 表达式按**服务器本地时区**运行；Docker 默认 UTC，需先 `TZ=Asia/Shanghai` 或用 UTC 换算。
- 完整管道一次约几分钟（TTS 逐句 + Remotion 渲染），期间面板实时显示日志。
