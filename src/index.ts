import fs from 'node:fs';
import path from 'node:path';
import { collectDaily } from './collect.js';
import { rewriteDaily, type VideoScript } from './rewrite.js';
import { synthesize } from './tts.js';
import { buildSlideSvg, buildCoverSvg, renderSvg } from './render.js';
import { buildSegment, concatSegments, loudnorm } from './assemble.js';

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
  const items = await collectDaily();
  console.log(`未处理日报 ${items.length} 期\n`);

  const latest = items[0];
  if (!latest) {
    console.log('没有新日报，退出');
    return;
  }

  const date = latest.guid.replace('daily-', '');
  console.log('最新一期:', latest.guid, `(${date})`);

  // 1. 脚本（缓存优先）
  let script = loadCachedScript(latest.guid);
  if (!script) {
    console.log('调用 DeepSeek 改写…\n');
    script = await rewriteDaily(latest);
    saveScript(latest.guid, script);
  } else {
    console.log('复用缓存脚本\n');
  }
  console.log('标题:', script.title);

  // 2. 逐段配音
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

  // 3. 幻灯片
  const slideDir = path.join(OUTPUT_DIR, 'slides');
  ensureDir(slideDir);
  for (const seg of script.segments) {
    const svg = buildSlideSvg(seg.title, seg.id, script.segments.length, date);
    await renderSvg(svg, path.join(slideDir, `slide_${pad(seg.id)}.png`));
    console.log(`  幻灯片 seg_${seg.id}: OK`);
  }

  // 4. 封面
  const coverPath = path.join(OUTPUT_DIR, 'cover.png');
  await renderSvg(buildCoverSvg(script.title, date), coverPath);
  console.log('封面:', coverPath);

  // 5. 合成每段视频
  const videoDir = path.join(OUTPUT_DIR, 'video');
  ensureDir(videoDir);
  const segVideos: string[] = [];
  for (const seg of script.segments) {
    const slide = path.join(slideDir, `slide_${pad(seg.id)}.png`);
    const audio = path.join(audioDir, `seg_${pad(seg.id)}.mp3`);
    const out = path.join(videoDir, `seg_${pad(seg.id)}.mp4`);
    if (fs.existsSync(out)) {
      console.log(`  合成 seg_${seg.id}: 已存在，跳过`);
    } else {
      await buildSegment(slide, audio, out);
      console.log(`  合成 seg_${seg.id}: OK`);
    }
    segVideos.push(out);
  }

  // 6. 拼接 + 响度标准化
  const rawPath = path.join(OUTPUT_DIR, 'raw.mp4');
  await concatSegments(segVideos, rawPath);
  console.log('拼接:', rawPath);

  const finalPath = path.join(OUTPUT_DIR, 'final.mp4');
  await loudnorm(rawPath, finalPath);
  console.log('\n成片:', finalPath);
}

main().catch((e) => {
  console.error('运行失败:', e);
  process.exit(1);
});
