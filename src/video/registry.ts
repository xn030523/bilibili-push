// 风格 / 宠物注册表：AI 输出的枚举名 → 渲染组件
import type { FC } from 'react';
import { PixelNight } from './styles/PixelNight';
import { PixelSunset } from './styles/PixelSunset';
import { PixelNeon } from './styles/PixelNeon';
import { PixelSnow } from './styles/PixelSnow';
import { PixelForest } from './styles/PixelForest';
import { Whale } from './pets/Whale';
import { Cat } from './pets/Cat';
import { Robot } from './pets/Robot';
import { Fox } from './pets/Fox';
import { Penguin } from './pets/Penguin';
import type { PetProps } from './pets/shared';

export const STYLES: Record<string, FC> = {
  night: PixelNight,
  sunset: PixelSunset,
  neon: PixelNeon,
  snow: PixelSnow,
  forest: PixelForest,
};

export const PETS: Record<string, FC<PetProps>> = {
  whale: Whale,
  cat: Cat,
  robot: Robot,
  fox: Fox,
  penguin: Penguin,
};

// 找不到名字时回退到默认，保证链路不因 AI 输出异常而崩溃
export const getStyle = (name?: string): FC => STYLES[name ?? 'night'] ?? PixelNight;
export const getPet = (name?: string): FC<PetProps> => PETS[name ?? 'whale'] ?? Whale;
