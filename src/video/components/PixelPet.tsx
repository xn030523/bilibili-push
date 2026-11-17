import { useCurrentFrame, useVideoConfig } from 'remotion';

// 像素猫头（12x12），o = 橙色主体
const CAT = [
  '...oo....oo...',
  '..oooo..oooo..',
  '.oooooooooooo.',
  'oooooooooooooo',
  'oooooooooooooo',
  'oooooooooooooo',
  'oooooooooooooo',
  '.oooooooooooo.',
  '..oooooooooo..',
  '...oooooooo...',
  '....oooooo....',
  '.....oooo.....',
];

export const PixelPet = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bob = Math.sin(frame / 12) * 6; // 上下浮动
  const sway = Math.sin(frame / 30) * 3; // 左右微摆
  const blink = frame % (fps * 3) < 6; // 每 3 秒眨眼

  const px = 14; // 每像素放大倍数
  const w = CAT[0].length;
  const h = CAT.length;

  const cells: { x: number; y: number }[] = [];
  CAT.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'o') cells.push({ x, y });
    }
  });

  return (
    <div
      style={{
        position: 'absolute',
        right: 80,
        bottom: 64,
        transform: `translateY(${bob}px) rotate(${sway}deg)`,
        transformOrigin: 'bottom center',
      }}
    >
      <svg
        width={w * px}
        height={h * px}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="crispEdges"
        style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))' }}
      >
        {/* 身体 */}
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={1} height={1} fill="#ff9d00" />
        ))}
        {/* 眼睛 */}
        {blink ? (
          <g fill="#1a1a1a">
            <rect x={3} y={4} width={2} height={0.8} />
            <rect x={7} y={4} width={2} height={0.8} />
          </g>
        ) : (
          <g fill="#1a1a1a">
            <rect x={3} y={3.2} width={2} height={2.4} />
            <rect x={7} y={3.2} width={2} height={2.4} />
          </g>
        )}
        {/* 嘴 */}
        <rect x={5.2} y={6.6} width={1.6} height={0.9} fill="#c96b00" />
      </svg>
    </div>
  );
};
