import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { Card } from '../props';

interface SlideProps {
  title: string;
  cards: Card[];
  index: number;
  total: number;
  date: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI 模型': '#2e7bff',
  'AI 产品': '#8b5cf6',
  '行业动态': '#00b894',
  '论文': '#e17055',
  '教程': '#00cec9',
  '观点': '#f0a020',
};

export const Slide = ({ title, cards, index, total, date }: SlideProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleEnter = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const exitFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progress = `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <AbsoluteFill
      style={{
        background: '#0d1117',
        opacity: exitFade,
        padding: '72px 120px',
        fontFamily: 'PingFang SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif',
      }}
    >
      {/* 分镜标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 44 }}>
        <div
          style={{
            width: 8,
            height: 52,
            borderRadius: 4,
            background: 'linear-gradient(180deg, #00e5ff, #2563ff)',
          }}
        />
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: '#f0f6fc',
            transform: `translateY(${interpolate(titleEnter, [0, 1], [36, 0])}px)`,
            opacity: titleEnter,
          }}
        >
          {title}
        </div>
      </div>

      {/* 新闻卡片列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {cards.map((card, i) => {
          const delay = i * 7;
          const enter = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 110 } });
          const y = interpolate(enter, [0, 1], [56, 0]);
          const opacity = interpolate(frame, [delay, delay + 12], [0, 1]);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 16,
                padding: '30px 36px',
                transform: `translateY(${y}px)`,
                opacity,
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  color: '#475569',
                  width: 52,
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  background: CATEGORY_COLORS[card.category] ?? '#475569',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 600,
                  padding: '6px 18px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {card.category}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 34, fontWeight: 600, color: '#e6edf3', lineHeight: 1.35 }}>
                  {card.title}
                </div>
                {card.summary ? (
                  <div style={{ fontSize: 26, color: '#8b98a5', marginTop: 6, lineHeight: 1.45 }}>
                    {card.summary}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部信息 */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 26, color: '#6b7a8a' }}>{date} · AI 日报</div>
        <div style={{ fontSize: 26, color: '#6b7a8a', fontVariantNumeric: 'tabular-nums' }}>
          {progress}
        </div>
      </div>
    </AbsoluteFill>
  );
};
