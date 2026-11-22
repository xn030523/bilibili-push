// 像素机器人：方形头 + 闪烁天线 + LED 双眼 + 宽 LED 嘴
import { PixelLayer, usePetMotion, petPosition, EYE_OPEN, EYE_SHUT, type PetProps } from './shared';

const WIDTH = 26;
const R = (s: string) => s.padEnd(WIDTH, '.');

const BODY = [
  R('..........M'),
  R('..........M'),
  R('...MMMMMMMMMMMMMMMMMMMM'),
  R('...MDDDDDDDDDDDDDDDDDM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MWWWWWWWWWWWWWWWWWM'),
  R('...MDDDDDDDDDDDDDDDDDM'),
  R('...MMMMMMMMMMMMMMMMMMMM'),
  R('.....MMMMMMMMMMMMMMM'),
  R('.....MDDDDDDDDDDDDM'),
  R('.....MWWWWWWWWWWWWM'),
  R('.....MWWWWWWWWWWWWM'),
  R('.....MMMMMMMMMMMMMMM'),
  R('.....MM...MM...MM...MM'),
  R('.....MM...MM...MM...MM'),
];
const HEIGHT = BODY.length;

const PALETTE: Record<string, string> = {
  M: '#9aa7b8',
  D: '#5c6773',
  W: '#dfe8f0',
  K: '#2de2ff', // LED 眼
};

const EYE_Y = 6;
const MOUTH_X = 8;
const MOUTH_Y = 9.4;
const MOUTH_W = 6;

export const Robot = ({ isTalking = false, px = 12, left, top, right = 80, bottom = 180, inline }: PetProps) => {
  const { frame, bob, blink, mouthH } = usePetMotion(!!isTalking);
  const pos = petPosition({ left, top, right, bottom, inline }, bob);
  const antennaOn = frame % 20 < 10;

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
        {/* 天线尖闪烁 */}
        <rect x={10} y={0} width={1} height={1} fill={antennaOn ? '#2de2ff' : '#5c6773'} />
        {/* LED 双眼 */}
        <PixelLayer matrix={blink ? EYE_SHUT : EYE_OPEN} palette={PALETTE} offsetX={6} offsetY={EYE_Y} />
        <PixelLayer matrix={blink ? EYE_SHUT : EYE_OPEN} palette={PALETTE} offsetX={14} offsetY={EYE_Y} />
        {/* LED 嘴 */}
        <rect x={MOUTH_X} y={MOUTH_Y} width={MOUTH_W} height={mouthH} fill="#2de2ff" />
      </svg>
    </div>
  );
};
