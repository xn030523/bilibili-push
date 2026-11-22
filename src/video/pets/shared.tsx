// 宠物共享层：像素矩阵渲染 + 通用动画 + 统一定位
import type { CSSProperties } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// 所有宠物统一的 props：视频右下角定位 / 封面居中定位
export interface PetProps {
  isTalking?: boolean;
  px?: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  inline?: boolean; // true 时不绝对定位，交给父容器（封面 flex 居中）
}

// 把像素矩阵里的每个非空字符转成一个 1x1 <rect>
export interface PixelLayerProps {
  matrix: string[];
  palette: Record<string, string>;
  offsetX?: number;
  offsetY?: number;
}

export const PixelLayer = ({ matrix, palette, offsetX = 0, offsetY = 0 }: PixelLayerProps) => (
  <>
    {matrix.flatMap((row, y) =>
      [...row].map((ch, x) => {
        const fill = palette[ch];
        if (!fill) return null;
        return (
          <rect key={`${x}-${y}`} x={offsetX + x} y={offsetY + y} width={1} height={1} fill={fill} />
        );
      }),
    )}
  </>
);

// 通用眼睛：睁眼圆点 / 闭眼横线（字符 K 的颜色由各宠物 palette 决定）
export const EYE_OPEN = ['.KK.', 'KKKK', '.KK.'];
export const EYE_SHUT = ['....', 'KKKK', '....'];

// 通用动作：呼吸式上下浮动 + 周期眨眼 + 说话时嘴巴开合
export function usePetMotion(isTalking: boolean) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bob = Math.sin((frame / fps) * ((Math.PI * 2) / 1.6)) * 5; // 约 1.6s 浮动周期
  const blink = frame % Math.round(fps * 3.5) < 6; // 约 3.5s 眨一次，闭 6 帧
  const mouthH = isTalking ? (frame % 8 < 4 ? 2 : 1) : 0.9; // 说话嘴巴开合
  return { frame, fps, bob, blink, mouthH };
}

// 传了 left/top 用左上定位（封面居中），否则右下定位（视频默认）
export function petPosition(p: PetProps, bob: number): CSSProperties {
  if (p.inline) {
    return { position: 'relative', transform: `translateY(${bob}px)` };
  }
  const { left, top, right = 80, bottom = 180 } = p;
  const pos = left !== undefined || top !== undefined ? { left, top } : { right, bottom };
  return {
    position: 'absolute',
    ...pos,
    transform: `translateY(${bob}px)`,
    transformOrigin: 'bottom center',
  };
}
