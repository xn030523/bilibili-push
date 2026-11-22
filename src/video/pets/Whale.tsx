// DeepSeek 蓝白像素鲸鱼（26x23），头朝左、尾巴朝右。
// 像素矩阵来自开源项目 dsh-whale-pet（Apache-2.0 协议，可商用）。
import { PixelLayer, usePetMotion, petPosition, type PetProps } from './shared';

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
const EYE_OPEN = ['WWW..', 'BWWW.', 'WWWWW', '.WWW.'];

const EYE_SHUT = ['.....', '.....', 'WWWWW', '.....'];

// 喷水
const SPOUT = ['S...S', '.S.S.', 'S.S.S', '..S..', '..S..'];

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
const TAIL_Y = BODY_Y + 7; // 12
const EYE_X = 13;
const EYE_Y = 8; // 相对 BODY 矩阵

const MOUTH_X = 1.4;
const MOUTH_Y = BODY_Y + 8.4;
const MOUTH_W = 2.4;

export const Whale = ({ isTalking = false, px = 12, left, top, right = 80, bottom = 180, inline }: PetProps) => {
  const { frame, fps, bob, blink, mouthH } = usePetMotion(!!isTalking);

  // 尾巴每约 0.8 秒换一个姿态：上抬 → 中摆 → 下垂，循环甩尾
  const tails = [TAIL_UP, TAIL_DOWN, TAIL_LOW];
  const tail = tails[Math.floor(frame / (fps * 0.8)) % tails.length];

  // 每约 5 秒喷一次水，持续约 18 帧
  const spouting = frame % Math.round(fps * 5) < 18;

  const pos = petPosition({ left, top, right, bottom, inline }, bob);

  return (
    <div style={pos}>
      <svg
        width={WIDTH * px}
        height={HEIGHT * px}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        shapeRendering="crispEdges"
        style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))' }}
      >
        {/* 身体 */}
        <PixelLayer matrix={BODY} palette={PALETTE} offsetY={BODY_Y} />
        {/* 尾巴 */}
        <PixelLayer matrix={tail} palette={PALETTE} offsetX={TAIL_X} offsetY={TAIL_Y} />
        {/* 眼睛（画在尾巴之后，避免尾根盖住眼角） */}
        <PixelLayer
          matrix={blink ? EYE_SHUT : EYE_OPEN}
          palette={PALETTE}
          offsetX={EYE_X}
          offsetY={BODY_Y + EYE_Y}
        />
        {/* 嘴巴 */}
        <rect x={MOUTH_X} y={MOUTH_Y} width={MOUTH_W} height={mouthH} fill="#1a1a1a" />
        {/* 喷水 */}
        {spouting && <PixelLayer matrix={SPOUT} palette={PALETTE} offsetX={SPOUT_X} />}
      </svg>
    </div>
  );
};
