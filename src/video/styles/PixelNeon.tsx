// 赛博霓虹：暗紫底 + 横向网格 + 霓虹建筑竖条 + 浮动光点
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const HORIZON = 120;

export const PixelNeon = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0a0616', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {/* 夜空 */}
        <rect x={0} y={0} width={W} height={HORIZON} fill="#0d0a20" />
        <rect x={0} y={0} width={W} height={HORIZON} fill="rgba(40,20,80,0.25)" />

        {/* 横向网格线，越靠下越密 */}
        {[20, 45, 72, 98, 112].map((y, i) => (
          <rect key={y} x={0} y={y} width={W} height={1} fill="#ff2ec4" opacity={0.1 + i * 0.03} />
        ))}

        {/* 霓虹地平线 */}
        <rect x={0} y={HORIZON - 1} width={W} height={2} fill="#2de2ff" opacity={0.6} />

        {/* 地面 */}
        <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="#08050f" />

        {/* 建筑竖条霓虹（青/粉交替，微闪烁） */}
        {[40, 70, 100, 130, 160, 190, 220, 250, 280].map((x, i) => {
          const h = 24 + ((i * 37) % 52);
          const color = i % 2 === 0 ? '#2de2ff' : '#ff2ec4';
          const blink = frame % 30 < 15 ? 0.9 : 0.5;
          return (
            <g key={x} opacity={blink}>
              <rect x={x} y={HORIZON - h} width={3} height={h} fill={color} opacity={0.25} />
              <rect x={x} y={HORIZON - 2} width={3} height={2} fill={color} />
              {Array.from({ length: Math.floor(h / 6) }).map((_, j) => (
                <rect key={j} x={x} y={HORIZON - h + 2 + j * 6} width={1} height={1} fill={color} opacity={0.8} />
              ))}
            </g>
          );
        })}

        {/* 浮动霓虹光点 */}
        {Array.from({ length: 24 }).map((_, i) => {
          const px = (i * 53 + frame) % W;
          const py = (i * 29) % HORIZON;
          return (
            <rect key={i} x={px} y={py} width={1} height={1} fill={i % 2 ? '#2de2ff' : '#ff2ec4'} opacity={0.5} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
