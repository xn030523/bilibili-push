// 纯类型定义，不 import 任何 Node 内置模块（会被打包进浏览器运行）
export interface SegmentProps {
  id: number;
  title: string;
  narration: string;
  durationInFrames: number;
  audioSrc: string;
}

export interface VideoProps {
  title: string;
  date: string;
  segments: SegmentProps[];
}
