import { AbsoluteFill, useVideoConfig } from 'remotion';
import { PixelBackground } from './components/PixelBackground';
import { WhalePet } from './components/WhalePet';

const FONT = 'PingFang SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif';

// 固定版式参数：后续每期封面只替换 title/date 文字，布局不变
const TITLE_SIZE = 96;
const TITLE_LINE_HEIGHT = 130;
const CHARS_PER_LINE = 14;
const WHALE_PX = 20; // 大肥鱼放大倍数（26 列 x 20 = 520px 宽）

interface CoverProps {
  title: string;
  date: string;
}

function wrapTitle(title: string): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of title) {
    cur += ch;
    if (cur.length >= CHARS_PER_LINE) {
      lines.push(cur);
      cur = '';
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [title];
}

export const Cover = ({ title, date }: CoverProps) => {
  const { width } = useVideoConfig(); // 1920
  const lines = wrapTitle(title);
  const startY = 700 - ((lines.length - 1) * TITLE_LINE_HEIGHT) / 2;

  return (
    <AbsoluteFill style={{ background: '#0b0f1a', overflow: 'hidden' }}>
      {/* 像素风背景（与视频同款） */}
      <PixelBackground />

      {/* 大肥鱼：居中，位于标题上方 */}
      <WhalePet px={WHALE_PX} left={(width - 26 * WHALE_PX) / 2} top={90} />

      {/* 顶部日期 */}
      <div
        style={{
          position: 'absolute',
          top: 52,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 40,
          fontWeight: 600,
          color: '#7db8ff',
          letterSpacing: 2,
        }}
      >
        AI 日报 · {date}
      </div>

      {/* 主标题（固定字号/行高/居中） */}
      <div
        style={{
          position: 'absolute',
          top: startY,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT,
        }}
      >
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontSize: TITLE_SIZE,
              fontWeight: 700,
              color: '#eaf6ff',
              lineHeight: `${TITLE_LINE_HEIGHT}px`,
              textShadow: '0 4px 24px rgba(0,0,0,0.65)',
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* 底部副标题 */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          width: '100%',
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 30,
          color: '#8fbfff',
          letterSpacing: 2,
        }}
      >
        AI 科技资讯 · 每日速览
      </div>
    </AbsoluteFill>
  );
};
