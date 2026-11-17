import fs from 'node:fs';
import path from 'node:path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// 云扬：男声，新闻播报风格，适合 AI 资讯
const VOICE = process.env.TTS_VOICE ?? 'zh-CN-YunyangNeural';

export async function synthesize(text: string, outPath: string, retries = 4): Promise<string> {
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });

  for (let attempt = 0; attempt < retries; attempt++) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      // msedge-tts v2 的 toFile 第一个参数是目录，且固定生成 dir/audio.mp3
      const { audioFilePath } = await tts.toFile(dir, text);
      tts.close();
      if (audioFilePath !== outPath) {
        fs.renameSync(audioFilePath, outPath);
      }
      return outPath;
    } catch (e) {
      tts.close();
      if (attempt === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}
