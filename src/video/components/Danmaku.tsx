import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface DanmakuItem {
  text: string;
  y: number; // 0~1 的垂直位置
  speed: number; // 越小越快
  color: string;
}

const DANMAKU: DanmakuItem[] = [
  { text: '来了来了', y: 0.14, speed: 7, color: '#ffffff' },
  { text: 'AI 日报准时报道', y: 0.24, speed: 5.5, color: '#7db8ff' },
  { text: '这期信息量好大', y: 0.34, speed: 6.5, color: '#ffd54f' },
  { text: '前排围观', y: 0.44, speed: 8, color: '#ffffff' },
  { text: '像素史莱姆好可爱', y: 0.54, speed: 6, color: '#ff8a80' },
  { text: '已三连', y: 0.64, speed: 7.5, color: '#ffffff' },
];

export const Danmaku = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {DANMAKU.map((d, i) => {
        // 每条弹幕错开出现，全程循环
        const travelFrames = Math.round(durationInFrames * 0.55);
        const gap = Math.floor(durationInFrames / DANMAKU.length);
        const t = frame - i * gap;
        if (t < 0 || t > travelFrames) return null;

        const x = interpolate(t, [0, travelFrames], [1920, -700]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${d.y * 100}%`,
              left: x,
              fontSize: 44,
              fontWeight: 600,
              color: d.color,
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(0,0,0,0.85)',
              opacity: 0.92,
            }}
          >
            {d.text}
          </div>
        );
      })}
    </div>
  );
};
