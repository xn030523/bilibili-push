// 像素狐狸：尖脸 + 大耳朵 + 白色尾尖的大尾巴
import { PixelLayer, usePetMotion, petPosition, EYE_OPEN, EYE_SHUT, type PetProps } from './shared';

const WIDTH = 26;
const R = (s: string) => s.padEnd(WIDTH, '.');

const BODY = [
  R('...........OO'),
  R('..........OOOO'),
  R('...O......OOO'),
  R('..OOO.....OO'),
  R('..OOOOOOOOOOOOO'),
  R('.OOOOOOOOOOOOOOO'),
  R('.OWWWWOOOOOOOOOO'),
  R('.OWWWWWWOOOOOOOO'),
  R('OOWWWWWWWWOOOOOO'),
  R('OWWWWWWWWWWOOOOO'),
  R('OWWWWWWWWWWWOOOO'),
  R('.OWWWWWWWWWWOOO'),
  R('.OOOOOOOOOOOOOOO'),
  R('..OOOOOOOOOOOOOO'),
  R('..OOWWWWWWWWOOOO'),
  R('..OOWWWWWWWWOOOO'),
  R('..OOWWWWWWWOOOOO'),
  R('...OOOOOOOOOOOOO'),
  R('...OOOOOOOOOOOO'),
];
const HEIGHT = BODY.length;

const TAIL_UP = ['...OO', '..OOO', '.OOOO', 'OOOOW', 'OOOW.', 'OOO..', 'OOO..'];
const TAIL_DOWN = ['OOO..', 'OOO..', 'OOOW.', 'OOOOW', '.OOOO', '..OOO', '...OO'];

const PALETTE: Record<string, string> = {
  O: '#e07a3f',
  W: '#f7efe6',
  K: '#2a1a0a',
};

const EYE_X = 3;
const EYE_Y = 7;
const MOUTH_X = 1.5;
const MOUTH_Y = 8.4;
const MOUTH_W = 2;
const TAIL_X = 16;
const TAIL_Y = 9;

export const Fox = ({ isTalking = false, px = 12, left, top, right = 80, bottom = 180, inline }: PetProps) => {
  const { frame, fps, bob, blink, mouthH } = usePetMotion(!!isTalking);
  const tails = [TAIL_UP, TAIL_DOWN];
  const tail = tails[Math.floor(frame / (fps * 0.7)) % tails.length];
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
        <PixelLayer matrix={tail} palette={PALETTE} offsetX={TAIL_X} offsetY={TAIL_Y} />
        <PixelLayer matrix={blink ? EYE_SHUT : EYE_OPEN} palette={PALETTE} offsetX={EYE_X} offsetY={EYE_Y} />
        <rect x={MOUTH_X} y={MOUTH_Y} width={MOUTH_W} height={mouthH} fill="#2a1a0a" />
      </svg>
    </div>
  );
};
