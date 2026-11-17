import { useCurrentFrame, useVideoConfig } from 'remotion';

// 像素史莱姆图案（配合全息蓝主题），每个字符一个像素
// # = 主体蓝，o = 深蓝描边，. = 高光白
const SLIME = [
  '..oooooooo..',
  '.o########o.',
  'o##########o',
  'o#.##.##.##o',
  'o##########o',
  'o#........#o',
  'o#........#o',
  'o#...##...#o',
  'o#..####..#o',
  'o##########o',
  '.o########o.',
  '..oooooooo..',
];

const COLORS: Record<string, string> = {
  o: '#1a3a6b',
  '#': '#2e7bff',
  '.': '#bde3ff',
};

export const PixelPet = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 上下浮动
  const bob = Math.sin(frame / 10) * 7;
  // 每 3 秒眨眼约 6 帧
  const blink = frame % (fps * 3) < 6;

  const px = 16; // 每像素放大倍数
  const cells: { x: number; y: number; c: string }[] = [];
  SLIME.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (COLORS[c]) cells.push({ x, y, c });
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        right: 90,
        bottom: 80,
        transform: `translateY(${bob}px)`,
        opacity: 0.95,
      }}
    >
      <svg
        width={SLIME[0].length * px}
        height={SLIME.length * px}
        viewBox={`0 0 ${SLIME[0].length} ${SLIME.length}`}
        shapeRendering="crispEdges"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(46,123,255,0.45))' }}
      >
        {cells.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={COLORS[p.c]} />
        ))}
        {/* 眼睛：眨眼时画横线 */}
        {blink ? (
          <g fill="#0a1a40">
            <rect x={3.5} y={5.5} width={3} height={0.7} />
            <rect x={8.5} y={5.5} width={3} height={0.7} />
          </g>
        ) : (
          <g fill="#0a1a40">
            <rect x={4} y={5} width={2} height={2.2} />
            <rect x={9} y={5} width={2} height={2.2} />
          </g>
        )}
      </svg>
    </div>
  );
};
