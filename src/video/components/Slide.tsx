import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface SlideProps {
  title: string;
  index: number;
  total: number;
  date: string;
}

export const Slide = ({ title, index, total, date }: SlideProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 标题 spring 弹入
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 110, mass: 0.8 } });
  const titleY = interpolate(enter, [0, 1], [140, 0]);
  const titleOpacity = interpolate(frame, [0, 12], [0, 1]);

  // 背景光晕缓慢漂移
  const glowX = 1400 + Math.sin(frame / 40) * 120;
  const glowY = 200 + Math.cos(frame / 55) * 80;

  // 出场淡出
  const exitFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progress = `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <AbsoluteFill style={{ opacity: exitFade, overflow: 'hidden' }}>
      {/* 背景渐变 */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, #060d24 0%, #0a1a40 50%, #050b1e 100%)',
        }}
      />
      {/* 漂移光晕 */}
      <div
        style={{
          position: 'absolute',
          left: glowX,
          top: glowY,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,229,255,0.22) 0%, rgba(30,90,255,0.08) 45%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* 网格 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(96,156,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(96,156,255,0.06) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />

      {/* 顶部装饰线 */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 80,
          width: interpolate(enter, [0, 1], [0, 240]),
          height: 6,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #00e5ff, #2563ff)',
        }}
      />

      {/* 标题 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: `translateY(${titleY - 60}px)`,
          opacity: titleOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#eaf6ff',
            padding: '0 160px',
            textShadow: '0 0 40px rgba(0,229,255,0.5)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
      </div>

      {/* 进度 */}
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: 100,
          fontSize: 40,
          color: '#7db8ff',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {progress}
      </div>

      {/* 底部信息条 */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 96,
        }}
      >
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #00e5ff, #2563ff)',
          }}
        />
        <div style={{ marginTop: 28, fontSize: 30, color: '#8fbfff' }}>{date} · AI 日报</div>
      </div>
    </AbsoluteFill>
  );
};
