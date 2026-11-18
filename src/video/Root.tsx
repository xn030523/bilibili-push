import { Composition, registerRoot } from 'remotion';
import { MainVideo } from './MainVideo';
import { Cover } from './Cover';
import type { VideoProps } from './props';

const defaultProps: VideoProps = { title: '', date: '', segments: [] };

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AihotDaily"
        component={MainVideo as never}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const p = props as unknown as VideoProps;
          return {
            durationInFrames: p.segments.reduce((s, seg) => s + seg.durationInFrames, 0),
          };
        }}
      />
      <Composition
        id="Cover"
        component={Cover as never}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ title: '', date: '' }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
