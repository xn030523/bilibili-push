import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { Card, Subtitle } from '../props';
import { SubtitleStream } from './SubtitleStream';

interface SlideProps {
  title: string;
  cards: Card[];
  subtitles: Subtitle[];
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

export const Slide = ({ title, cards, subtitles, index, total, date }: SlideProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleEnter = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const exitFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progress = `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  // 卡片随进度轮换高亮
  const perCard = durationInFrames / Math.max(1, cards.length);
  const activeIdx = Math.min(cards.length - 1, Math.floor(frame / perCard));

  return (
    <AbsoluteFill
      style={{
        opacity: exitFade,
        fontFamily: 'PingFang SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 顶部标题条 */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 120,
          right: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 8,
              height: 48,
              borderRadius: 4,
              background: 'linear-gradient(180deg, #00e5ff, #2563ff)',
            }}
          />
          <div
            style={{
              fontSize: 50,
              fontWeight: 700,
              color: '#f0f6fc',
              transform: `translateY(${interpolate(titleEnter, [0, 1], [30, 0])}px)`,
              opacity: titleEnter,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ fontSize: 26, color: '#6b7a8a', fontVariantNumeric: 'tabular-nums' }}>
          {progress}
        </div>
      </div>

      {/* 中央大字字幕流 */}
      <SubtitleStream subtitles={subtitles} />

      {/* 底部新闻卡片缩略条 */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 52,
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
        }}
      >
        {cards.map((card, i) => {
          const delay = i * 8;
          const enter = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 110 } });
          const active = i === activeIdx;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 540,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: active ? 'rgba(255,138,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(255,138,0,0.7)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                padding: '16px 22px',
                transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px) scale(${active ? 1.03 : 1})`,
                opacity: active ? 1 : 0.55,
                boxShadow: active ? '0 0 28px rgba(255,138,0,0.25)' : 'none',
              }}
            >
              <div
                style={{
                  background: CATEGORY_COLORS[card.category] ?? '#475569',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {card.category}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: active ? '#ffd9a8' : '#b6c2cf', lineHeight: 1.35, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部日期 */}
      <div style={{ position: 'absolute', left: 120, bottom: 14, fontSize: 22, color: '#5c6b7a' }}>
        {date} · AI 日报
      </div>
    </AbsoluteFill>
  );
};
