import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import type { VideoProps } from './props';
import { Slide } from './components/Slide';
import { PixelPet } from './components/PixelPet';
import { Danmaku } from './components/Danmaku';

export const MainVideo = ({ title, date, segments }: VideoProps) => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: '#060d24' }}>
      {segments.map((seg) => {
        const seq = (
          <Sequence key={seg.id} from={from} durationInFrames={seg.durationInFrames}>
            <Slide title={seg.title} cards={seg.cards} subtitles={seg.subtitles} index={seg.id} total={segments.length} date={date} />
            <Audio src={staticFile(seg.audioSrc)} />
          </Sequence>
        );
        from += seg.durationInFrames;
        return seq;
      })}

      {/* 全局层：像素宠物 + 弹幕 */}
      <PixelPet />
      <Danmaku />
    </AbsoluteFill>
  );
};
