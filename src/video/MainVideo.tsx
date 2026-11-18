import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import type { VideoProps } from './props';
import { Slide } from './components/Slide';
import { WhalePet } from './components/WhalePet';
import { PixelBackground } from './components/PixelBackground';

export const MainVideo = ({ title, date, segments }: VideoProps) => {
  let from = 0;
  return (
    <AbsoluteFill>
      {/* 底层：像素风背景 */}
      <PixelBackground />

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

      {/* 全局层：鲸鱼宠物 */}
      <WhalePet isTalking />
    </AbsoluteFill>
  );
};
