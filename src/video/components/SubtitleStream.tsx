import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { ReactNode } from 'react';
import type { Subtitle } from '../props';

interface Props {
  subtitles: Subtitle[];
}

// 关键词高亮：连续数字（含量词）、英文/缩写 → 橙色大字
function renderHighlight(text: string): ReactNode {
  const parts = text.split(/(\d+(?:\.\d+)?[%倍万亿美元]?|[A-Za-z][A-Za-z0-9.\-]*%?)/g);
  return parts.map((p, i) => {
    if (/^\d/.test(p) || /^[A-Za-z]/.test(p)) {
      return (
        <span
          key={i}
          style={{
            color: '#ff8a00',
            fontWeight: 800,
            textShadow: '0 0 22px rgba(255,138,0,0.5)',
          }}
        >
          {p}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export const SubtitleStream = ({ subtitles }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (subtitles.length === 0) return null;

  // 按精确时间轴找当前句
  let idx = subtitles.length - 1;
  for (let i = 0; i < subtitles.length; i++) {
    if (frame < subtitles[i].endFrame) {
      idx = i;
      break;
    }
  }
  const cur = subtitles[idx];
  const start = cur.startFrame;
  const local = frame - start;
  const text = cur.text;

  const enter = spring({ frame: local, fps, config: { damping: 15, stiffness: 150 } });
  const y = interpolate(enter, [0, 1], [52, 0]);
  const scale = interpolate(enter, [0, 1], [0.86, 1]);
  const opacity = interpolate(frame, [start, start + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const prevText = idx > 0 ? subtitles[idx - 1].text : null;
  const prevFade = interpolate(local, [0, 12], [0.45, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const prevUp = interpolate(local, [0, 12], [0, 30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '26%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '0 10%',
      }}
    >
      {/* 上一句残留，向上淡出 */}
      {prevText && local < 12 ? (
        <div
          style={{
            fontSize: 42,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            lineHeight: 1.4,
            maxWidth: '80%',
            transform: `translateY(${-prevUp}px)`,
            opacity: prevFade,
          }}
        >
          {prevText}
        </div>
      ) : null}

      {/* 当前句大字 */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.5,
          maxWidth: '86%',
          transform: `translateY(${y}px) scale(${scale})`,
          opacity,
          textShadow: '0 4px 28px rgba(0,0,0,0.6)',
        }}
      >
        {renderHighlight(text)}
      </div>
    </div>
  );
};
