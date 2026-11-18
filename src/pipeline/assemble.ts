import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const execFileP = promisify(execFile);

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, (err, _stdout, stderr) => {
      if (err) {
        reject(new Error(`${cmd} ${args.join(' ')} 失败: ${stderr?.slice(-500)}`));
      } else {
        resolve();
      }
    });
  });
}

async function getDuration(file: string): Promise<number> {
  const { stdout } = await execFileP('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  return parseFloat(stdout.trim());
}

// 单段：幻灯片循环 + 旁白，时长 = 音频 + 0.35s 尾白
export async function buildSegment(slide: string, audio: string, out: string): Promise<void> {
  const dur = await getDuration(audio);
  const total = dur + 0.35;
  await run('ffmpeg', [
    '-y', '-loop', '1', '-framerate', '30', '-i', slide,
    '-i', audio,
    '-t', total.toFixed(2),
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage',
    '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
    '-shortest', out,
  ]);
}

// 拼接所有段
export async function concatSegments(files: string[], out: string): Promise<void> {
  const listPath = path.join(path.dirname(out), 'concat.txt');
  fs.writeFileSync(listPath, files.map((f) => `file '${f}'`).join('\n'), 'utf8');
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', out]);
}

// 响度标准化到 -16 LUFS（B 站建议）
export async function loudnorm(input: string, out: string): Promise<void> {
  await run('ffmpeg', [
    '-y', '-i', input,
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
    '-movflags', '+faststart', out,
  ]);
}
