// 独立的 Node 脚本：读 script.json → 逐句 TTS → 逐句时长 → 字幕时间轴 → props.json
// 关键：字幕按「每句音频的真实时长」分配帧，保证口播与字幕精确对齐
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { synthesize } from '../pipeline/tts.js';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'output');
const AUDIO_DIR = path.join(OUTPUT, 'audio');
const PUBLIC_AUDIO = path.join(ROOT, 'public', 'audio');
const FPS = 30;

// 与渲染端保持一致：按句末标点拆句
const SPLIT_RE = /(?<=[。！？；])/;

interface Card {
  title: string;
  summary: string;
  category: string;
}
interface ScriptSegment {
  id: number;
  title: string;
  narration: string;
  cards: Card[];
}

function splitSentences(text: string): string[] {
  return text
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getDuration(file: string): number {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file],
  )
    .toString()
    .trim();
  return parseFloat(out);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function concatMp3(files: string[], out: string) {
  const listPath = path.join(AUDIO_DIR, `_concat_${path.basename(out, '.mp3')}.txt`);
  fs.writeFileSync(listPath, files.map((f) => `file '${f}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', out], {
    stdio: 'inherit',
  });
  fs.unlinkSync(listPath);
}

async function main() {
  const raw = fs.readFileSync(path.join(OUTPUT, 'script.json'), 'utf8');
  const { guid, script } = JSON.parse(raw) as {
    guid: string;
    script: {
      title: string;
      style?: string;
      pet?: string;
      voice?: string;
      segments: ScriptSegment[];
    };
  };
  const date = guid.replace('daily-', '');
  const style = script.style || 'night';
  const pet = script.pet || 'whale';
  const voice = script.voice || 'zh-CN-YunyangNeural';
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_AUDIO, { recursive: true });

  const segments = [];
  for (const seg of script.segments) {
    const sentences = splitSentences(seg.narration);
    const base = `seg_${pad2(seg.id)}`;

    // 1. 逐句 TTS
    const sentFiles: string[] = [];
    for (let i = 0; i < sentences.length; i++) {
      const f = path.join(AUDIO_DIR, `${base}_s${pad2(i)}.mp3`);
      if (!fs.existsSync(f)) {
        process.stdout.write(`  TTS ${base}_s${pad2(i)} (${sentences[i].length}字)\n`);
        await synthesize(sentences[i], f, voice);
        await new Promise((r) => setTimeout(r, 250)); // 句间限速，避免触发 Edge 连接重置
      }
      sentFiles.push(f);
    }

    // 2. 每句真实时长
    const durations = sentFiles.map(getDuration);

    // 3. 字幕时间轴（浮点秒累计 → 帧，无累积误差）
    const subtitles: { text: string; startFrame: number; endFrame: number }[] = [];
    let cursorSec = 0;
    sentences.forEach((text, i) => {
      const startFrame = Math.round(cursorSec * FPS);
      cursorSec += durations[i];
      const endFrame = Math.round(cursorSec * FPS);
      subtitles.push({ text, startFrame, endFrame });
    });
    const durationInFrames = Math.max(1, Math.round(cursorSec * FPS));

    // 4. 拼接成整段音频
    const segAudio = path.join(AUDIO_DIR, `${base}.mp3`);
    concatMp3(sentFiles, segAudio);
    const audioSrc = `audio/${base}.mp3`;
    fs.copyFileSync(segAudio, path.join(PUBLIC_AUDIO, `${base}.mp3`));

    segments.push({
      id: seg.id,
      title: seg.title,
      narration: seg.narration,
      cards: seg.cards ?? [],
      durationInFrames,
      audioSrc,
      subtitles,
    });
    console.log(`${base}: ${sentences.length} 句, ${durationInFrames} 帧 (${cursorSec.toFixed(1)}s)`);
  }

  const props = { title: script.title, date, style, pet, voice, segments };
  fs.writeFileSync(path.join(OUTPUT, 'props.json'), JSON.stringify(props, null, 2), 'utf8');
  console.log(`props.json 已生成：${segments.length} 段`);
}

main().catch((e) => {
  console.error('gen-props 失败:', e);
  process.exit(1);
});
