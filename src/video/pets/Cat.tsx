// 像素橘猫：坐姿，尖耳 + 摆动尾巴
import { PixelLayer, usePetMotion, petPosition, EYE_OPEN, EYE_SHUT, type PetProps } from './shared';

const WIDTH = 26;
const R = (s: string) => s.padEnd(WIDTH, '.');

const BODY = [
  R('.........OO'),
  R('........OOOO'),
  R('..O.....OOO'),
  R('.OOO....OO'),
  R('.OOOOOOOOOOOOOOO'),
  R('OOOOOOOOOOOOOOOOOO'),
  R('OWWWWWWWOOOOOOOOOO'),
  R('OWWWWWWWWOOOOOOOOO'),
  R('OWWWWWWWWWOOOOOOOOO'),
  R('OWWWWWWWWWWOOOOOOOO'),
  R('OWWWWWWWWWWWOOOOOOO'),
  R('.OWWWWWWWWWWOOOOOO'),
  R('.OOOOOOOOOOOOOOOOO'),
  R('..OOOOOOOOOOOOOOOO'),
  R('..OOOWWWWWWWWOOOO'),
  R('..OOOWWWWWWWWOOOO'),
  R('..OOOWWWWWWWOOOOO'),
  R('...OOOOOOOOOOOOOO'),
  R('...OOOOOOOOOOOOO'),
];
const HEIGHT = BODY.length;

const TAIL_UP = ['...O.', '..OO.', '.OO..', '.OO..', 'OO...', 'OO...'];
const TAIL_DOWN = ['OO...', 'OO...', '.OO..', '.OO..', '..OO.', '...O.'];

const PALETTE: Record<string, string> = {
  O: '#e89a3c',
  W: '#f7efe6',
  K: '#2a1a0a',
};

const EYE_X = 3;
const EYE_Y = 7;
const MOUTH_X = 2.2;
const MOUTH_Y = 9.4;
const MOUTH_W = 2.4;
const TAIL_X = 17;
const TAIL_Y = 12;

export const Cat = ({ isTalking = false, px = 12, left, top, right = 80, bottom = 180, inline }: PetProps) => {
  const { frame, fps, bob, blink, mouthH } = usePetMotion(!!isTalking);
  const tails = [TAIL_UP, TAIL_DOWN];
  const tail = tails[Math.floor(frame / (fps * 0.6)) % tails.length];
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
