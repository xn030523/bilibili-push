import { useCurrentFrame, useVideoConfig } from 'remotion';

// DeepSeek 蓝白像素鲸鱼（26x23），头朝左、尾巴朝右。
// 像素矩阵来自开源项目 dsh-whale-pet（Apache-2.0 协议，可商用）。

// 鲸鱼身体（18 行 x 26 列）
const BODY = [
  '..........................',
  '........BBBBB.............',
  '.....BBBBBBBBBB...........',
  '...BBBBBBBBBBBBB..........',
  '..BBBBBBBBBBBBBBB.........',
  '.BBBBBBBBBBBBBBBB.........',
  '.BBBBBBBBBBBBBBBBB........',
  'BBWWWWWBBBBBBBBBBB.BBB....',
  'BBWWWWWWWBBBBBBBBBBBBB....',
  'BBBWWWWWWWBBBBBBBBBBBB....',
  'BBBWWWWWWWWBBBBBBBBBBB....',
  '.BBBWWWWWWWWBBBBBBBBBB....',
  '.BBBBWWWWWWWWBBBBBBBB.....',
  '..BBBWWBWWWWWWBBBBBB......',
  '...BBBWBBWWWWWWBBBB.......',
  '....BBBBBBBWWWWWWBBBB.....',
  '.....BBBBBBBBBBBBWBBBB....',
  '.......BBBBBBBBBBB........',
];

// 尾巴：上抬 / 中摆 / 下垂
const TAIL_UP = [
  '.BB......',
  'BBB......',
  'BBB....BB',
  'BBBB..BBB',
  '.BBBBBBBB',
  '..BBBBBB.',
  '..BBBB...',
];

const TAIL_DOWN = [
  '.......BB',
  '......BBB',
  '.BB..BBBB',
  'BBBBBBBBB',
  'BBBBBBBB.',
  '..BBBBB..',
  '..BBBB...',
];

const TAIL_LOW = [
  '.........',
  '.........',
  '.........',
  '.........',
  '.BB......',
  'BBBB.....',
  'BBBBBB...',
  '.BBBBBBBB',
  '...BBBBBB',
  '.....BBB.',
];

// 眼睛：睁眼 / 闭眼
const EYE_OPEN = [
  'WWW..',
  'BWWW.',
  'WWWWW',
  '.WWW.',
];

const EYE_SHUT = [
  '.....',
  '.....',
  'WWWWW',
  '.....',
];

// 喷水
const SPOUT = [
  'S...S',
  '.S.S.',
  'S.S.S',
  '..S..',
  '..S..',
];

const PALETTE: Record<string, string> = {
  B: '#5068b2', // 蓝，身体
  W: '#ffffff', // 白，肚皮/脸
  S: '#a9c8ff', // 喷水，浅蓝
  L: '#7fa6e8', // 水波
};

// 坐标常量
const WIDTH = 26;
const BODY_ROWS = 18;
const SPOUT_ROWS = 5;
const HEIGHT = BODY_ROWS + SPOUT_ROWS; // 23
const BODY_Y = SPOUT_ROWS; // 5：身体位于顶部 5 行喷水空间的下方
const SPOUT_X = 8;
const TAIL_X = 17;
const TAIL_Y = BODY_Y + 7; // 12：尾巴接在身体后段（身体第 7 行起）
const EYE_X = 13;
const EYE_Y = 8; // 相对 BODY 矩阵

// 嘴巴：头部前端。头朝左，身体第 8 行（绝对 y=13）左侧第 2 列开始是白色脸部，
// 第 9~10 行左侧第 3 列起为白色下颌。嘴巴放在蓝色吻端与白色下颌的交界处，
// x=1.4~3.8、y(相对身体)=8.4，正好贴着头的前缘，且与眼睛（EYE_Y=8）同高、位于其前方。
const MOUTH_X = 1.4;
const MOUTH_Y = BODY_Y + 8.4;
const MOUTH_W = 2.4;

interface PixelLayerProps {
  matrix: string[];
  offsetX?: number;
  offsetY?: number;
}

// 把像素矩阵里的每个非透明字符转成一个 1x1 的 <rect>
const PixelLayer = ({ matrix, offsetX = 0, offsetY = 0 }: PixelLayerProps) => (
  <>
    {matrix.flatMap((row, y) =>
      [...row].map((ch, x) => {
        const fill = PALETTE[ch];
        if (!fill) return null;
        return (
          <rect
            key={`${x}-${y}`}
            x={offsetX + x}
            y={offsetY + y}
            width={1}
            height={1}
            fill={fill}
          />
        );
      }),
    )}
  </>
);

interface WhalePetProps {
  isTalking: boolean;
}

export const WhalePet = ({ isTalking }: WhalePetProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 呼吸式上下浮动，周期约 1.6 秒
  const bob = Math.sin((frame / fps) * ((Math.PI * 2) / 1.6)) * 5;

  // 尾巴每约 0.8 秒换一个姿态：上抬 → 中摆 → 下垂，循环甩尾
  const tails = [TAIL_UP, TAIL_DOWN, TAIL_LOW];
  const tail = tails[Math.floor(frame / (fps * 0.8)) % tails.length];

  // 每约 3.5 秒眨一次眼，闭合约 6 帧
  const blink = frame % Math.round(fps * 3.5) < 6;

  // 每约 5 秒喷一次水，持续约 18 帧
  const spouting = frame % Math.round(fps * 5) < 18;

  // 说话时嘴巴快速开合：4 帧张开 2px，4 帧收窄 1px；不说话时保持闭合细线
  const mouthHeight = isTalking ? (frame % 8 < 4 ? 2 : 1) : 0.9;

  const px = 12; // 每像素放大倍数，整体约 312 x 276

  return (
    <div
      style={{
        position: 'absolute',
        right: 80,
        bottom: 64,
        transform: `translateY(${bob}px)`,
        transformOrigin: 'bottom center',
      }}
    >
      <svg
        width={WIDTH * px}
        height={HEIGHT * px}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        shapeRendering="crispEdges"
        style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))' }}
      >
        {/* 身体 */}
        <PixelLayer matrix={BODY} offsetY={BODY_Y} />
        {/* 尾巴 */}
        <PixelLayer matrix={tail} offsetX={TAIL_X} offsetY={TAIL_Y} />
        {/* 眼睛（画在尾巴之后，避免尾根盖住眼角） */}
        <PixelLayer
          matrix={blink ? EYE_SHUT : EYE_OPEN}
          offsetX={EYE_X}
          offsetY={BODY_Y + EYE_Y}
        />
        {/* 嘴巴 */}
        <rect x={MOUTH_X} y={MOUTH_Y} width={MOUTH_W} height={mouthHeight} fill="#1a1a1a" />
        {/* 喷水 */}
        {spouting && <PixelLayer matrix={SPOUT} offsetX={SPOUT_X} />}
      </svg>
    </div>
  );
};
