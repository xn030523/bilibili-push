// 纯类型定义，不 import 任何 Node 内置模块（会被打包进浏览器运行）
export interface Card {
  title: string;
  summary: string;
  category: string;
}

export interface Subtitle {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface SegmentProps {
  id: number;
  title: string;
  narration: string;
  cards: Card[];
  durationInFrames: number;
  audioSrc: string;
  subtitles: Subtitle[];
}

export interface VideoProps {
  title: string;
  date: string;
  segments: SegmentProps[];
}
