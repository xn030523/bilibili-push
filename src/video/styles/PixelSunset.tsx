// 像素日落：紫→橙渐变天空 + 落日 + 双层山剪影 + 落日余晖反光 + 飞鸟掠过
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const HORIZON = 140;

const BANDS = [
  { y: 0, c: '#251a38' },
  { y: 16, c: '#332048' },
  { y: 34, c: '#4a2757' },
  { y: 52, c: '#66335f' },
  { y: 70, c: '#874560' },
  { y: 88, c: '#a95a58' },
  { y: 106, c: '#c97549' },
  { y: 124, c: '#e2913b' },
];

// 落日的像素圆
const SUN = [
  '.....########.....',
  '...############...',
  '..##############..',
  '.################.',
  '##################',
  '##################',
  '.################.',
  '..##############..',
  '...############...',
  '.....########.....',
];

const farRidge = (x: number) => 7 + 3.2 * Math.sin(x / 16 + 2.1) + 1.4 * Math.sin(x / 6.3 + 1.0);
const nearRidge = (x: number) => 6 + 2.6 * Math.sin(x / 12 + 4.3) + 1.2 * Math.sin(x / 5.1 + 0.6);

export const PixelSunset = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#251a38', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {BANDS.map((b, i) => {
          const bottom = BANDS[i + 1] ? BANDS[i + 1].y : HORIZON;
          return <rect key={i} x={0} y={b.y} width={W} height={bottom - b.y} fill={b.c} />;
        })}

        {/* 落日 */}
        <g transform="translate(126 72)" opacity={0.95}>
          {SUN.flatMap((row, y) =>
            [...row].map((ch, x) =>
              ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#ffd979" /> : null,
            ),
          )}
        </g>

        {/* 远山剪影（暖紫，靠近地平线） */}
        {Array.from({ length: W / 2 }).map((_, i) => {
          const x = i * 2;
          const h = Math.max(1, Math.round(farRidge(x)));
          const top = HORIZON - h;
          return <rect key={`far-${i}`} x={x} y={top} width={2} height={HORIZON + 10 - top} fill="#3a2148" />;
        })}

        {/* 落日余晖反光带（地平线暖橙渐暗） */}
        <rect x={0} y={HORIZON + 4} width={W} height={8} fill="#d8843e" opacity={0.5} />
        <rect x={0} y={HORIZON + 12} width={W} height={5} fill="#8a3c55" opacity={0.45} />

        {/* 近山剪影（更深，填满底部） */}
        {Array.from({ length: W / 2 }).map((_, i) => {
          const x = i * 2;
          const h = Math.max(1, Math.round(nearRidge(x)));
          const top = HORIZON + 14 - h;
          return <rect key={`near-${i}`} x={x} y={top} width={2} height={H - top} fill="#160f22" />;
        })}

        {/* 飞鸟（3 只，缓慢右移的 V 形） */}
        {[0, 1, 2].map((k) => {
          const bx = Math.round((140 + k * 46 + frame * 0.4) % W);
          const by = 40 + k * 14;
          return (
            <g key={k} transform={`translate(${bx} ${by})`} fill="#1a1426">
              <rect x={0} y={0} width={2} height={1} />
              <rect x={2} y={1} width={2} height={1} />
              <rect x={4} y={0} width={2} height={1} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
