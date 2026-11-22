import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import type { VideoProps } from './props';
import { Slide } from './components/Slide';
import { getStyle, getPet } from './registry';

export const MainVideo = ({ title, date, style, pet, segments }: VideoProps) => {
  const Background = getStyle(style);
  const Pet = getPet(pet);
  let from = 0;
  return (
    <AbsoluteFill>
      {/* 底层：按 style 选择的像素风背景 */}
      <Background />

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

      {/* 全局层：按 pet 选择的宠物主播 */}
      <Pet isTalking />
    </AbsoluteFill>
  );
};
