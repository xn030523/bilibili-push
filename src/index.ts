import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { collectDaily, collectAll } from './collect.js';
import { rewriteDaily, type VideoScript } from './rewrite.js';
import { synthesize } from './tts.js';
import { buildCoverSvg, renderSvg } from './render.js';

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

  // 4. 封面（静态图，投稿用）
  const coverPath = path.join(OUTPUT_DIR, 'cover.png');
  await renderSvg(buildCoverSvg(script.title, date), coverPath);
  console.log('封面:', coverPath);

  // 5. Remotion 渲染动画成片
  console.log('\nRemotion 渲染动画成片…');
  execSync('npx tsx src/video/gen-props.ts', { stdio: 'inherit' });
  const finalPath = path.join(OUTPUT_DIR, 'final.mp4');
  execSync(`npx remotion render AihotDaily "${finalPath}" --props=output/props.json`, {
    stdio: 'inherit',
  });
  console.log('\n成片:', finalPath);
}

main().catch((e) => {
  console.error('运行失败:', e);
  process.exit(1);
});
