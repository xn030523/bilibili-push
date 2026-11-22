// 像素企鹅：黑白身 + 黄喙黄脚 + 拍动鳍翅
import { PixelLayer, usePetMotion, petPosition, EYE_OPEN, EYE_SHUT, type PetProps } from './shared';

const WIDTH = 26;
const R = (s: string) => s.padEnd(WIDTH, '.');

const BODY = [
  R('........BBBBBB'),
  R('......BBBBBBBBBB'),
  R('.....BBBBBBBBBBBB'),
  R('....BBWWWWWWBBBBB'),
  R('....BBWWWWWWWBBBB'),
  R('....BBWWWWWWWWBBB'),
  R('.....BWWWWWWWWBB'),
  R('......BBBBBBBBBB'),
  R('....BBBBBBBBBBBB'),
  R('...BBWWWWWWWWWBBB'),
  R('...BBWWWWWWWWWWBB'),
  R('...BBWWWWWWWWWWBB'),
  R('...BBWWWWWWWWWBBB'),
  R('...BBWWWWWWWWWBBB'),
  R('....BBWWWWWWWWBB'),
  R('.....BBBBBBBBBBB'),
  R('.....YYY.....YYY'),
  R('.....YYY.....YYY'),
];
const HEIGHT = BODY.length;

const WING_UP = ['BB.', 'BB.', 'BB.'];
const WING_DOWN = ['BB..', 'BB..', 'BB..'];

const PALETTE: Record<string, string> = {
  B: '#1c2430',
  W: '#f2f5f8',
  Y: '#f5c04a',
  K: '#0a0a0a',
};

const EYE_X = 5;
const EYE_Y = 4;
const MOUTH_X = 3;
const MOUTH_Y = 5.5;
const MOUTH_W = 2;
const WING_X = 9;
const WING_Y = 8;

export const Penguin = ({ isTalking = false, px = 12, left, top, right = 80, bottom = 180, inline }: PetProps) => {
  const { frame, fps, bob, blink, mouthH } = usePetMotion(!!isTalking);
  const wings = [WING_UP, WING_DOWN];
  const wing = wings[Math.floor(frame / (fps * 0.5)) % wings.length];
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
        <PixelLayer matrix={BODY} palette={PALETTE} />
        <PixelLayer matrix={wing} palette={PALETTE} offsetX={WING_X} offsetY={WING_Y} />
        <PixelLayer matrix={blink ? EYE_SHUT : EYE_OPEN} palette={PALETTE} offsetX={EYE_X} offsetY={EYE_Y} />
        <rect x={MOUTH_X} y={MOUTH_Y} width={MOUTH_W} height={mouthH} fill="#f5c04a" />
      </svg>
    </div>
  );
};
