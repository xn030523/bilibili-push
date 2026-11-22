// 像素日落：紫→橙渐变天空 + 落日 + 逆光山剪影 + 飞鸟掠过
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const W = 320;
const H = 180;
const HORIZON = 142;

const BANDS = [
  { y: 0, c: '#251a38' },
  { y: 16, c: '#332048' },
  { y: 34, c: '#4a2757' },
  { y: 52, c: '#66335f' },
  { y: 70, c: '#874560' },
  { y: 88, c: '#a95a58' },
  { y: 106, c: '#c97549' },
  { y: 124, c: '#e2913b' },
  { y: 138, c: '#f5b354' },
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

const ridge = (x: number) => 8 + 3.6 * Math.sin(x / 18 + 1.3) + 1.8 * Math.sin(x / 7.1 + 2.8);

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
        <g transform="translate(126 74)" opacity={0.95}>
          {SUN.flatMap((row, y) =>
            [...row].map((ch, x) =>
              ch === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#ffd979" /> : null,
            ),
          )}
        </g>

        {/* 逆光山剪影 */}
        {Array.from({ length: W / 2 }).map((_, i) => {
          const x = i * 2;
          const h = Math.max(1, Math.round(ridge(x)));
          const top = HORIZON - h;
          return <rect key={i} x={x} y={top} width={2} height={H - top} fill="#241832" />;
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
