// 独立的 Node 脚本：读 script.json + ffprobe 音频时长，生成 props.json
// 同时把音频复制到 public/audio/（Remotion staticFile 目录）
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'output');
const PUBLIC_AUDIO = path.join(ROOT, 'public', 'audio');

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

function getDuration(file: string): number {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ])
    .toString()
    .trim();
  return parseFloat(out);
}

function main() {
  const raw = fs.readFileSync(path.join(OUTPUT, 'script.json'), 'utf8');
  const { guid, script } = JSON.parse(raw) as {
    guid: string;
    script: { title: string; segments: ScriptSegment[] };
  };

  const date = guid.replace('daily-', '');
  fs.mkdirSync(PUBLIC_AUDIO, { recursive: true });

  const segments = script.segments.map((seg) => {
    const name = `seg_${String(seg.id).padStart(2, '0')}.mp3`;
    const audioAbs = path.join(OUTPUT, 'audio', name);
    fs.copyFileSync(audioAbs, path.join(PUBLIC_AUDIO, name));

    const dur = getDuration(audioAbs);
    return {
      id: seg.id,
      title: seg.title,
      narration: seg.narration,
      cards: seg.cards ?? [],
      durationInFrames: Math.ceil((dur + 0.35) * 30),
      audioSrc: `audio/${name}`, // 相对 public 目录
    };
  });

  const props = { title: script.title, date, segments };
  fs.writeFileSync(path.join(OUTPUT, 'props.json'), JSON.stringify(props, null, 2), 'utf8');
  console.log(`props.json 已生成：${segments.length} 段`);
}

main();
