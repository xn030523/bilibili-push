// 赛博霓虹：暗紫底 + 横向网格 + 霓虹建筑竖条 + 湿地面倒影 + 浮动光点
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const HORIZON = 112;

const BUILDINGS = [40, 70, 100, 130, 160, 190, 220, 250, 280];
const buildingH = (i: number) => 24 + ((i * 37) % 52);
const buildingColor = (i: number) => (i % 2 === 0 ? '#2de2ff' : '#ff2ec4');

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
        {[20, 45, 72, 98].map((y, i) => (
          <rect key={y} x={0} y={y} width={W} height={1} fill="#ff2ec4" opacity={0.1 + i * 0.03} />
        ))}

        {/* 建筑竖条霓虹（青/粉交替，微闪烁） */}
        {BUILDINGS.map((x, i) => {
          const h = buildingH(i);
          const color = buildingColor(i);
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

        {/* 霓虹地平线 */}
        <rect x={0} y={HORIZON - 1} width={W} height={2} fill="#2de2ff" opacity={0.6} />

        {/* 地面（深紫，非纯黑） */}
        <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="#0f0a1c" />

        {/* 地面霓虹光晕（地平线附近的青/粉反光） */}
        <rect x={0} y={HORIZON} width={W} height={8} fill="#2de2ff" opacity={0.14} />
        <rect x={0} y={HORIZON + 8} width={W} height={6} fill="#ff2ec4" opacity={0.1} />

        {/* 建筑倒影（湿地面反光，向下分段渐隐） */}
        {BUILDINGS.map((x, i) => {
          const color = buildingColor(i);
          return (
            <g key={`ref-${i}`}>
              <rect x={x} y={HORIZON + 1} width={3} height={10} fill={color} opacity={0.2} />
              <rect x={x} y={HORIZON + 12} width={3} height={8} fill={color} opacity={0.12} />
              <rect x={x} y={HORIZON + 21} width={3} height={6} fill={color} opacity={0.06} />
            </g>
          );
        })}

        {/* 地面水平网格（向下渐疏） */}
        {[134, 150, 170].map((y, i) => (
          <rect key={y} x={0} y={y} width={W} height={1} fill="#2de2ff" opacity={0.08 - i * 0.02} />
        ))}

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
