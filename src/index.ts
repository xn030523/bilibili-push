import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { collectDaily, collectAll } from './pipeline/collect.js';
import { rewriteDaily, type VideoScript } from './pipeline/rewrite.js';
import { synthesize } from './pipeline/tts.js';
import { publish } from './pipeline/publish.js';
import { markProcessed } from './pipeline/store.js';

const OUTPUT_DIR = path.join(process.cwd(), 'output');
const pad = (n: number) => String(n).padStart(2, '0');

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function loadCachedScript(guid: string): VideoScript | null {
  const p = path.join(OUTPUT_DIR, 'script.json');
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    if (data?.guid === guid && data?.script) return data.script as VideoScript;
  } catch {
    /* ignore */
  }
  return null;
}

function saveScript(guid: string, script: VideoScript) {
  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'script.json'),
    JSON.stringify({ guid, script }, null, 2),
    'utf8',
  );
}

async function main() {
  const dailies = await collectDaily();
  console.log(`未处理日报 ${dailies.length} 期\n`);

  const latest = dailies[0];
  if (!latest) {
    console.log('没有新日报，退出');
    return;
  }

  const date = latest.guid.replace('daily-', '');
  console.log('最新一期:', latest.guid, `(${date})`);

  // 1. 采集当天新闻详情
  const news = await collectAll();
  console.log(`采集到最近 26 小时新闻 ${news.length} 条\n`);

  // 2. 脚本（缓存优先）
  let script = loadCachedScript(latest.guid);
  if (!script) {
    console.log('调用 DeepSeek 改写…\n');
    script = await rewriteDaily(news);
    saveScript(latest.guid, script);
  } else {
    console.log('复用缓存脚本\n');
  }
  console.log('标题:', script.title);
  console.log('分段:', script.segments.length);

  // 3. 逐段配音
  const audioDir = path.join(OUTPUT_DIR, 'audio');
  ensureDir(audioDir);
  for (const seg of script.segments) {
    const out = path.join(audioDir, `seg_${pad(seg.id)}.mp3`);
    if (fs.existsSync(out)) {
      console.log(`  配音 seg_${seg.id}: 已存在，跳过`);
      continue;
    }
    await synthesize(seg.narration, out);
    console.log(`  配音 seg_${seg.id}: OK`);
  }

  // 4. 封面（Remotion 渲染：像素背景 + 大肥鱼 + 固定标题版式，与成片视觉统一）
  const coverPath = path.join(OUTPUT_DIR, 'cover.png');
  const coverPropsPath = path.join(OUTPUT_DIR, 'cover-props.json');
  fs.writeFileSync(coverPropsPath, JSON.stringify({ title: script.title, date }));
  execSync(
    `npx remotion still Cover "${coverPath}" --props=${coverPropsPath} --image-format=png`,
    { stdio: 'inherit' },
  );
  console.log('封面:', coverPath);

  // 5. Remotion 渲染动画成片
  console.log('\nRemotion 渲染动画成片…');
  execSync('npx tsx src/video/gen-props.ts', { stdio: 'inherit' });
  const finalPath = path.join(OUTPUT_DIR, 'final.mp4');
  execSync(`npx remotion render AihotDaily "${finalPath}" --props=output/props.json`, {
    stdio: 'inherit',
  });
  console.log('\n成片:', finalPath);

  // 成片已生成 = 本期处理完成，标记防重复（发布失败也不重渲染）
  markProcessed(latest.guid);

  // 6. 发布元数据落盘（面板据此展示「标题/封面/描述/标签/发布状态」）
  const desc = ['今日 AI 资讯速览', ...script.segments.map((s) => `· ${s.title}`)].join('\n');
  const tag = 'AI,人工智能,科技';
  const metaPath = path.join(OUTPUT_DIR, 'publish.json');
  const meta = {
    title: script.title,
    desc,
    tag,
    date,
    video: 'final.mp4',
    cover: 'cover.png',
    status: 'draft',
    bvid: '',
    aid: 0,
    publishedAt: 0,
    updatedAt: Date.now(),
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

  // 7. 投稿（有 B站登录态时自动发布；无登录态仅本地生成）
  const sessdata = process.env.BILI_SESSDATA;
  const biliJct = process.env.BILI_JCT;
  if (sessdata && biliJct) {
    try {
      const result = await publish({
        videoPath: finalPath,
        coverPath,
        cookies: { SESSDATA: sessdata, bili_jct: biliJct },
        title: script.title,
        desc,
        tag,
      });
      meta.status = 'published';
      meta.bvid = result.bvid;
      meta.aid = result.aid;
      meta.publishedAt = Date.now();
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    } catch (e) {
      console.error('投稿失败（视频已生成）:', e);
      meta.status = 'failed';
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    }
  } else {
    console.log('未配置 B站登录态，跳过投稿（可在面板扫码登录后重试）');
  }
}

main().catch((e) => {
  console.error('运行失败:', e);
  process.exit(1);
});
