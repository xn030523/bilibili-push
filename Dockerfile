# 生产镜像：node + ffmpeg + 中文字体 + Remotion 渲染用 Chrome Headless Shell
FROM node:20-slim

# Remotion 渲染需要的系统库 + ffmpeg + 中文字体
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libx11-6 libxcb1 libxext6 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先装依赖（利用层缓存）
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 再拷源码
COPY . .

# 下载 Remotion 渲染用的 Chrome Headless Shell
RUN npx remotion browser ensure

# 构建前端面板
RUN npm run build:web

# 运行时数据目录
VOLUME ["/app/output", "/app/logs"]

EXPOSE 3000
CMD ["npx", "tsx", "src/server/server.ts"]
