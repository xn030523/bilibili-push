import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import cron from 'node-cron';
import { loadConfig, saveConfig, applyEnv, type AppConfig } from './config.js';
import { generateQrcode, pollQrcode } from './auth.js';
import { getCookies, getAccount, getPublishedVideos } from './bili.js';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'output');
const LOG_DIR = path.join(ROOT, 'logs');

const app = express();
app.use(cors());
app.use(express.json());

// 启动即注入配置（供 pipeline 读 DEEPSEEK_API_KEY 等）
applyEnv(loadConfig());

// ---------- 运行状态与日志 ----------
interface RunState {
  running: boolean;
  startAt: number;
  log: string[];
}
const runState: RunState = { running: false, startAt: 0, log: [] };

function appendLog(line: string) {
  runState.log.push(line);
  if (runState.log.length > 2000) runState.log.splice(0, runState.log.length - 2000);
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOG_DIR, 'run.log'), line + '\n');
}

let cronTask: ReturnType<typeof cron.schedule> | null = null;
function syncCron(cfg: AppConfig) {
  cronTask?.stop();
  cronTask = null;
  if (cfg.schedule.enabled && cron.validate(cfg.schedule.cron)) {
    cronTask = cron.schedule(cfg.schedule.cron, () => {
      appendLog(`[${new Date().toISOString()}] 定时任务触发`);
      triggerRun();
    });
    appendLog(`定时任务已启用：${cfg.schedule.cron}`);
  }
}

// 后台跑完整管道，不阻塞 HTTP
function triggerRun() {
  if (runState.running) return;
  runState.running = true;
  runState.startAt = Date.now();
  runState.log = [];
  appendLog(`[${new Date().toISOString()}] 开始生成（采集→改写→TTS→渲染）`);

  const child = spawn('npx', ['tsx', 'src/index.ts'], { cwd: ROOT, shell: true });
  const onData = (d: Buffer) => appendLog(d.toString());
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  child.on('close', (code) => {
    runState.running = false;
    appendLog(`[${new Date().toISOString()}] 结束，退出码 ${code}`);
  });
}

// ---------- API ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

app.get('/api/config', (_req, res) => {
  const c = loadConfig();
  const sessdata = c.bilibili.sessdata || process.env.BILI_SESSDATA || '';
  const biliJct = c.bilibili.biliJct || process.env.BILI_JCT || '';
  res.json({
    deepseekApiKey: c.deepseekApiKey || process.env.DEEPSEEK_API_KEY ? '已设置' : '',
    bilibili: {
      loggedIn: Boolean(sessdata && biliJct),
      dedeuserid: c.bilibili.dedeuserid,
    },
    schedule: c.schedule,
  });
});

app.post('/api/config', (req, res) => {
  const c = loadConfig();
  const b = req.body ?? {};
  if (typeof b.deepseekApiKey === 'string' && b.deepseekApiKey) c.deepseekApiKey = b.deepseekApiKey;
  if (b.schedule) {
    if (typeof b.schedule.cron === 'string') c.schedule.cron = b.schedule.cron;
    if (typeof b.schedule.enabled === 'boolean') c.schedule.enabled = b.schedule.enabled;
  }
  saveConfig(c);
  applyEnv(c);
  syncCron(c);
  res.json({ ok: true });
});

// 扫码登录：生成二维码（返回 dataURL 便于前端 <img> 直接显示）
let qrcodeKeyCache: string | null = null;
app.get('/api/login/qrcode', async (_req, res) => {
  try {
    const { url, qrcodeKey } = await generateQrcode();
    qrcodeKeyCache = qrcodeKey;
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 1 });
    res.json({ url, qrcodeKey, qrcodeDataUrl: dataUrl });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/login/poll', async (req, res) => {
  const key = (req.query.qrcode_key as string) || qrcodeKeyCache;
  if (!key) return res.status(400).json({ error: '缺少 qrcode_key，请先获取二维码' });
  try {
    const result = await pollQrcode(key);
    if (result.status === 'success') {
      const c = loadConfig();
      c.bilibili = {
        sessdata: result.sessdata,
        biliJct: result.biliJct,
        dedeuserid: result.dedeuserid,
      };
      saveConfig(c);
      applyEnv(c);
      qrcodeKeyCache = null;
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/login/status', (_req, res) => {
  const c = loadConfig();
  const sessdata = c.bilibili.sessdata || process.env.BILI_SESSDATA || '';
  const biliJct = c.bilibili.biliJct || process.env.BILI_JCT || '';
  res.json({ loggedIn: Boolean(sessdata && biliJct) });
});

// 账户信息（昵称/头像/UID/等级）
app.get('/api/bili/account', async (_req, res) => {
  const cookies = getCookies();
  if (!cookies) return res.status(401).json({ error: '未登录' });
  try {
    res.json(await getAccount(cookies));
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// 已发布视频 + 播放量等数据
app.get('/api/bili/published', async (_req, res) => {
  const cookies = getCookies();
  if (!cookies) return res.status(401).json({ error: '未登录' });
  try {
    res.json({ videos: await getPublishedVideos(cookies) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.post('/api/run', (_req, res) => {
  if (runState.running) return res.json({ ok: true, alreadyRunning: true });
  triggerRun();
  res.json({ ok: true });
});

app.get('/api/run/status', (_req, res) => {
  res.json({
    running: runState.running,
    startAt: runState.startAt,
    log: runState.log.slice(-500).join(''),
  });
});

app.get('/api/logs', (_req, res) => {
  const p = path.join(LOG_DIR, 'run.log');
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  res.json({ log: text.slice(-20000) });
});

// 视频列表：扫描 output 下所有 mp4
app.get('/api/videos', (_req, res) => {
  const list: { name: string; size: number; mtime: number; rel: string }[] = [];
  const walk = (dir: string, base: string) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, path.join(base, e.name));
      else if (e.name.endsWith('.mp4')) {
        const st = fs.statSync(full);
        list.push({ name: e.name, size: st.size, mtime: st.mtimeMs, rel: path.join(base, e.name) });
      }
    }
  };
  walk(OUTPUT_DIR, '');
  list.sort((a, b) => b.mtime - a.mtime);

  // 发布元数据（标题/描述/标签/发布状态），供面板展示「发了什么」
  let meta: Record<string, unknown> | null = null;
  try {
    meta = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'publish.json'), 'utf8'));
  } catch {
    /* 尚未生成 */
  }
  res.json({ videos: list, meta });
});

// 下载视频（预览成片）
app.get('/api/videos/file', (req, res) => {
  const rel = String(req.query.rel ?? '');
  const abs = path.resolve(OUTPUT_DIR, rel);
  if (!abs.startsWith(OUTPUT_DIR) || !fs.existsSync(abs)) return res.status(404).json({ error: 'not found' });
  res.sendFile(abs);
});

// 封面图
app.get('/api/videos/cover', (_req, res) => {
  const coverPath = path.join(OUTPUT_DIR, 'cover.png');
  if (!fs.existsSync(coverPath)) return res.status(404).json({ error: 'no cover' });
  res.sendFile(coverPath);
});

// 生产环境托管前端静态资源
const dist = path.join(ROOT, 'web', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (_req, res) => {
    res
      .type('html')
      .send(
        '前端尚未构建。请运行 <code>npm run build:web</code>，或开发模式访问 <a href="http://localhost:5173">http://localhost:5173</a>',
      );
  });
}

const PORT = Number(process.env.PANEL_PORT ?? 3000);
app.listen(PORT, () => {
  appendLog(`管理面板已启动：http://localhost:${PORT}`);
  console.log(`管理面板：http://localhost:${PORT}`);
  syncCron(loadConfig());
});
