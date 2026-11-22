// 像素雪夜：冷蓝夜空 + 冷星 + 飘雪 + 雪地 + 松树剪影
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const GROUND = 148;

const BANDS = [
  { y: 0, c: '#0a1424' },
  { y: 22, c: '#0d1a30' },
  { y: 48, c: '#12243c' },
  { y: 78, c: '#172e4a' },
  { y: 108, c: '#1d3858' },
];

const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// 松树矩阵（三角 + 树干）
const TREE = ['...#...', '..###..', '.#####.', '#######', '...#...', '...#...'];

export const PixelSnow = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0a1424', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {/* 夜空色带 */}
        {BANDS.map((b, i) => {
          const bottom = BANDS[i + 1] ? BANDS[i + 1].y : GROUND;
          return <rect key={i} x={0} y={b.y} width={W} height={bottom - b.y} fill={b.c} />;
        })}

        {/* 冷色星星 */}
        {Array.from({ length: 60 }).map((_, i) => {
          const x = Math.floor(hash(i * 3.7) * W);
          const y = Math.floor(hash(i * 7.3) * 120);
          return <rect key={i} x={x} y={y} width={1} height={1} fill="#bcd6ff" opacity={0.3 + hash(i) * 0.5} />;
        })}

        {/* 雪地 */}
        <rect x={0} y={GROUND} width={W} height={H - GROUND} fill="#e8f2ff" />
        <rect x={0} y={GROUND} width={W} height={2} fill="#ffffff" />

        {/* 松树剪影 */}
        {[24, 88, 156, 224, 288].map((tx, i) => (
          <g key={i} transform={`translate(${tx} ${GROUND}) scale(3)`} opacity={0.9}>
            {TREE.flatMap((row, y) =>
              [...row].map((ch, x) =>
                ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y - TREE.length} width={1} height={1} fill="#123524" /> : null,
              ),
            )}
          </g>
        ))}

        {/* 飘雪（三层视差下落） */}
        {Array.from({ length: 60 }).map((_, i) => {
          const speed = 0.3 + hash(i * 5.1) * 0.7;
          const x = Math.floor(hash(i * 11.3) * W);
          const y = Math.floor((hash(i * 17.7) * H + frame * speed) % H);
          const s = hash(i * 23.1) > 0.7 ? 2 : 1;
          return <rect key={i} x={x} y={y} width={s} height={s} fill="#ffffff" opacity={0.7} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
