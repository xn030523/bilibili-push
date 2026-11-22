// 像素森林清晨：淡绿天空 + 光斑 + 晨雾 + 层叠松树
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const GROUND = 150;

const BANDS = [
  { y: 0, c: '#bfe3d6' },
  { y: 30, c: '#a8d6c6' },
  { y: 62, c: '#8fc6b2' },
  { y: 94, c: '#7bb8a2' },
];

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const TREE = ['...#...', '..###..', '.#####.', '#######', '...#...', '...#...'];

export const PixelForest = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#bfe3d6', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {BANDS.map((b, i) => {
          const bottom = BANDS[i + 1] ? BANDS[i + 1].y : GROUND;
          return <rect key={i} x={0} y={b.y} width={W} height={bottom - b.y} fill={b.c} />;
        })}

        {/* 太阳光斑 */}
        <rect x={230} y={22} width={14} height={14} fill="#fff7d6" opacity={0.9} />
        <rect x={232} y={24} width={10} height={10} fill="#ffeeb0" />

        {/* 远树（浅绿，小） */}
        {[16, 44, 72, 100, 128, 156, 184, 212, 240, 268, 296].map((tx, i) => (
          <g key={`far-${i}`} transform={`translate(${tx} ${GROUND}) scale(2)`} opacity={0.5}>
            {TREE.flatMap((row, y) =>
              [...row].map((ch, x) =>
                ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y - TREE.length} width={1} height={1} fill="#5da98c" /> : null,
              ),
            )}
          </g>
        ))}

        {/* 地面 */}
        <rect x={0} y={GROUND} width={W} height={H - GROUND} fill="#3e8a63" />

        {/* 近树（深绿，大） */}
        {[0, 40, 84, 132, 180, 228, 276].map((tx, i) => (
          <g key={`near-${i}`} transform={`translate(${tx} ${GROUND}) scale(4)`} opacity={0.95}>
            {TREE.flatMap((row, y) =>
              [...row].map((ch, x) =>
                ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y - TREE.length} width={1} height={1} fill="#1d5e3a" /> : null,
              ),
            )}
          </g>
        ))}

        {/* 晨雾横带 */}
        <rect x={0} y={96} width={W} height={12} fill="#dff3ea" opacity={0.25} />
        <rect x={0} y={120} width={W} height={8} fill="#dff3ea" opacity={0.18} />

        {/* 浮动的光斑 */}
        {Array.from({ length: 16 }).map((_, i) => {
          const px = Math.floor((hash(i * 13.7) * W + frame * 0.3) % W);
          const py = 30 + Math.floor(hash(i * 19.3) * 100);
          return <rect key={i} x={px} y={py} width={2} height={2} fill="#fff7d6" opacity={0.35} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
