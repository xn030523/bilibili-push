import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// 逻辑像素网格：320×180，在 1920×1080 下每格放大 6 倍。
// 所有元素（星星、云、山、浪）都按整数网格用 <rect> 拼出来，不做平滑渐变。
const W = 320;
const H = 180;
const HORIZON = 146;

const COLOR = {
  base: '#0b0f1a',
  farMountain: '#111a2c',
  nearMountain: '#0c1320',
  waveBack: '#101c31',
  waveFront: '#091220',
  waveGlint: '#274b7c',
  moon: '#1d2a48',
  moonCrater: '#26375a',
} as const;

// 夜空分层色带：纯色块从深到浅堆叠，交界处用像素抖动过渡。
const SKY_BANDS = [
  { y: 0, color: COLOR.base },
  { y: 22, color: '#0c111e' },
  { y: 46, color: '#0e1525' },
  { y: 72, color: '#111a2e' },
  { y: 98, color: '#152138' },
  { y: 122, color: '#1a2a46' },
];

// 确定性伪随机：星星/云的位置在每次渲染、每一帧都保持一致。
const hash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

interface Star {
  x: number;
  y: number;
  w: number;
  color: string;
  opacity: number;
  twinkle: boolean;
  phase: number;
  speed: number;
}

const STAR_TONES = [
  { color: '#e8f0ff', opacity: 0.85 },
  { color: '#a9c2e8', opacity: 0.62 },
  { color: '#708fbe', opacity: 0.45 },
  { color: '#4d6893', opacity: 0.34 },
];

// 星星只落在上方的天区和地平线附近，主动避开中央字幕区（约 y 66–108）。
const STARS: Star[] = Array.from({ length: 130 }, (_, i) => {
  const r1 = hash(i * 4.13 + 1.7);
  const r2 = hash(i * 7.71 + 3.1);
  const r3 = hash(i * 11.37 + 5.9);
  const r4 = hash(i * 3.29 + 8.3);
  const r5 = hash(i * 5.83 + 0.4);

  const upperSky = r5 < 0.7;
  const tone = STAR_TONES[Math.floor(r3 * STAR_TONES.length)];

  return {
    x: Math.floor(r1 * W),
    y: upperSky ? 20 + Math.floor(r2 * 40) : 112 + Math.floor(r2 * 26),
    w: r4 < 0.12 ? 2 : 1,
    color: tone.color,
    opacity: tone.opacity,
    twinkle: r3 > 0.55,
    phase: r4,
    speed: r5,
  };
});

// 星星闪烁：慢周期 + 离散透明度档位，看上去是像素点的亮灭而不是柔和呼吸。
const starOpacity = (star: Star, frame: number, fps: number) => {
  if (!star.twinkle) return star.opacity;
  const period = fps * (2.6 + star.speed * 3); // 2.6s – 5.6s
  const t = (((frame / period) % 1) + star.phase) % 1;
  const v = Math.sin(t * Math.PI * 2);
  if (v > 0.6) return Math.min(1, star.opacity + 0.5);
  if (v > 0) return Math.min(1, star.opacity + 0.15);
  return star.opacity * 0.55;
};

interface Run {
  x: number;
  y: number;
  w: number;
}

// 把字符画行里的连续 '#' 合并成一条条像素 rect。
const toRuns = (rows: string[]): Run[] => {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x += 1) {
      const on = x < row.length && row[x] === '#';
      if (on && start === -1) start = x;
      if (!on && start !== -1) {
        runs.push({ x: start, y, w: x - start });
        start = -1;
      }
    }
  });
  return runs;
};

interface CloudDef {
  x: number;
  y: number;
  speed: number;
  color: string;
  rows: string[];
}

interface Cloud extends CloudDef {
  runs: Run[];
  width: number;
}

// 云只出现在画面上部（y 20–55），不会经过中央字幕，也不遮挡底部卡片。
const CLOUD_DEFS: CloudDef[] = [
  {
    x: 12,
    y: 30,
    speed: 0.05,
    color: '#131d31',
    rows: ['...#####....', '.#########..', '############', '############'],
  },
  {
    x: 96,
    y: 24,
    speed: 0.035,
    color: '#111a2c',
    rows: ['..####....', '########..', '##########', '##########', '##########'],
  },
  {
    x: 168,
    y: 40,
    speed: 0.07,
    color: '#16223a',
    rows: ['...####...', '.########.', '##########', '##########'],
  },
  {
    x: 236,
    y: 27,
    speed: 0.045,
    color: '#121c30',
    rows: ['..#####..', '#########', '#########', '.#######.'],
  },
];

const CLOUDS: Cloud[] = CLOUD_DEFS.map((def) => ({
  ...def,
  runs: toRuns(def.rows),
  width: Math.max(...def.rows.map((row) => row.length)),
}));

// 像素月牙，右上角低亮度点缀。
const MOON = ['..####..', '.####...', '####....', '####....', '####....', '.####...', '..####..'];
const MOON_RUNS = toRuns(MOON);

const farRidge = (x: number) =>
  9 +
  4.4 * Math.sin(x / 21 + 1.4) +
  2.6 * Math.sin(x / 8.7 + 0.3) +
  1.4 * Math.sin(x / 3.7 + 2.1);

const nearRidge = (x: number) =>
  6 +
  3.1 * Math.sin(x / 15 + 2.6) +
  1.9 * Math.sin(x / 6.2 + 1.2) +
  1.1 * Math.sin(x / 2.7 + 0.8);

const backCrest = (x: number, frame: number) =>
  Math.round(149 + 2.1 * Math.sin(x / 13 + frame / 55) + 1.0 * Math.sin(x / 5.3 - frame / 80));

const frontCrest = (x: number, frame: number) =>
  Math.round(154 + 1.7 * Math.sin(x / 11 - frame / 48) + 0.9 * Math.sin(x / 4.7 + frame / 72 + 1.7));

export const PixelNight = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 山体视差：远山更慢，近山稍快
  const farOffset = frame * 0.04;
  const nearOffset = frame * 0.07;

  return (
    <AbsoluteFill
      style={{
        background: COLOR.base,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
      >
        {/* 夜空色带（纯色块分层） */}
        {SKY_BANDS.map((band, i) => {
          const next = SKY_BANDS[i + 1];
          const bottom = next ? next.y : HORIZON;
          return (
            <rect
              key={`band-${i}`}
              x={0}
              y={band.y}
              width={W}
              height={bottom - band.y}
              fill={band.color}
            />
          );
        })}

        {/* 色带交界处的棋盘格像素抖动 */}
        {SKY_BANDS.slice(1).map((band, i) => (
          <g key={`dither-${i}`}>
            {Array.from({ length: W / 2 }).map((_, cell) =>
              cell % 2 === 0 ? (
                <rect
                  key={cell}
                  x={cell * 2}
                  y={band.y - 1}
                  width={2}
                  height={1}
                  fill={band.color}
                />
              ) : null,
            )}
          </g>
        ))}

        {/* 淡淡的像素网格，只铺在天空区域 */}
        <g fill="rgba(120,160,220,0.035)">
          {Array.from({ length: W / 8 }).map((_, i) => (
            <rect key={`grid-v-${i}`} x={(i + 1) * 8} y={0} width={1} height={HORIZON} />
          ))}
          {Array.from({ length: HORIZON / 8 }).map((_, i) => (
            <rect key={`grid-h-${i}`} x={0} y={(i + 1) * 8} width={W} height={1} />
          ))}
        </g>

        {/* 像素星空（缓慢亮灭） */}
        {STARS.map((star, i) => (
          <rect
            key={`star-${i}`}
            x={star.x}
            y={star.y}
            width={star.w}
            height={1}
            fill={star.color}
            opacity={starOpacity(star, frame, fps)}
          />
        ))}

        {/* 像素月牙 */}
        <g transform="translate(264 20)" opacity={0.8}>
          {MOON_RUNS.map((run, i) => (
            <rect key={`moon-${i}`} x={run.x} y={run.y} width={run.w} height={1} fill={COLOR.moon} />
          ))}
          <rect x={2} y={2} width={1} height={1} fill={COLOR.moonCrater} />
          <rect x={4} y={4} width={1} height={1} fill={COLOR.moonCrater} />
        </g>

        {/* 像素云（缓慢横向漂移，移出右侧后从左侧重新进入） */}
        {CLOUDS.map((cloud, i) => {
          const span = W + cloud.width + 12;
          const x = Math.round((cloud.x + frame * cloud.speed) % span);
          return (
            <g key={`cloud-${i}`} transform={`translate(${x} ${cloud.y})`} opacity={0.9}>
              {cloud.runs.map((run, j) => (
                <rect
                  key={j}
                  x={run.x}
                  y={run.y}
                  width={run.w}
                  height={1}
                  fill={cloud.color}
                />
              ))}
            </g>
          );
        })}

        {/* 地平线附近的像素辉光（分阶纯色块） */}
        <rect x={0} y={120} width={W} height={10} fill="#1c3357" opacity={0.12} />
        <rect x={0} y={130} width={W} height={8} fill="#24456f" opacity={0.12} />
        <rect x={0} y={138} width={W} height={8} fill="#2d5587" opacity={0.1} />

        {/* 远山剪影 */}
        {Array.from({ length: W / 2 }).map((_, i) => {
          const x = i * 2;
          const h = Math.max(1, Math.round(farRidge(x - farOffset)));
          const top = HORIZON - h;
          return (
            <rect
              key={`far-${i}`}
              x={x}
              y={top}
              width={2}
              height={H - top}
              fill={COLOR.farMountain}
            />
          );
        })}

        {/* 近山剪影 */}
        {Array.from({ length: W / 2 }).map((_, i) => {
          const x = i * 2;
          const h = Math.max(1, Math.round(nearRidge(x - nearOffset)));
          const top = 150 - h;
          return (
            <rect
              key={`near-${i}`}
              x={x}
              y={top}
              width={2}
              height={H - top}
              fill={COLOR.nearMountain}
            />
          );
        })}

        {/* 远处波浪 */}
        {Array.from({ length: W }).map((_, x) => {
          const crest = backCrest(x, frame);
          return (
            <rect
              key={`wave-back-${x}`}
              x={x}
              y={crest}
              width={1}
              height={H - crest}
              fill={COLOR.waveBack}
            />
          );
        })}

        {/* 近处波浪 */}
        {Array.from({ length: W }).map((_, x) => {
          const crest = frontCrest(x, frame);
          return (
            <rect
              key={`wave-front-${x}`}
              x={x}
              y={crest}
              width={1}
              height={H - crest}
              fill={COLOR.waveFront}
            />
          );
        })}

        {/* 波峰上的像素反光（避开右下角宠物区域） */}
        {Array.from({ length: W }).map((_, x) => {
          const shimmer = (x + Math.floor(frame / 14)) % 11 === 0;
          const inPetZone = x >= 268 && x <= 314;
          if (!shimmer || inPetZone) return null;
          const crest = frontCrest(x, frame);
          return (
            <rect
              key={`glint-${x}`}
              x={x}
              y={crest}
              width={1}
              height={1}
              fill={COLOR.waveGlint}
              opacity={0.5}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
