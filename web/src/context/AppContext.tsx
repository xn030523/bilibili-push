import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  type AccountInfo,
  type ConfigInfo,
  type PublishedVideo,
  type PublishMeta,
  type RunStatus,
  type VideoInfo,
} from '../api';

interface AppState {
  config: ConfigInfo | null;
  account: AccountInfo | null;
  published: PublishedVideo[];
  videos: VideoInfo[];
  meta: PublishMeta | null;
  runStatus: RunStatus;
  loggedIn: boolean;
  refreshConfig: () => Promise<void>;
  refreshBili: () => Promise<void>;
  refreshVideos: () => Promise<void>;
  triggerRun: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigInfo | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [published, setPublished] = useState<PublishedVideo[]>([]);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [meta, setMeta] = useState<PublishMeta | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>({ running: false, startAt: 0, log: '' });

  const refreshConfig = useCallback(async () => {
    setConfig(await api.config());
  }, []);

  const refreshVideos = useCallback(async () => {
    const data = await api.videos();
    setVideos(data.videos);
    setMeta(data.meta);
  }, []);

  const refreshBili = useCallback(async () => {
    const c = await api.config();
    if (!c.bilibili.loggedIn) {
      setAccount(null);
      setPublished([]);
      return;
    }
    try {
      setAccount(await api.account());
    } catch {
      /* 接口异常保持旧数据 */
    }
    try {
      setPublished((await api.published()).videos);
    } catch {
      /* 同上 */
    }
  }, []);

  const triggerRun = useCallback(async () => {
    await api.run();
    setRunStatus((s) => ({ ...s, running: true, log: '' }));
  }, []);

  // 初始加载
  useEffect(() => {
    refreshConfig().catch(() => {});
    refreshVideos().catch(() => {});
    refreshBili().catch(() => {});
  }, [refreshConfig, refreshVideos, refreshBili]);

  // 轮询运行状态；结束后刷新视频列表
  useEffect(() => {
    const t = window.setInterval(async () => {
      try {
        const s = await api.runStatus();
        setRunStatus(s);
        if (!s.running) refreshVideos().catch(() => {});
      } catch {
        /* 后端未启动 */
      }
    }, 2500);
    return () => window.clearInterval(t);
  }, [refreshVideos]);

  const loggedIn = Boolean(config?.bilibili.loggedIn);

  return (
    <Ctx.Provider
      value={{
        config,
        account,
        published,
        videos,
        meta,
        runStatus,
        loggedIn,
        refreshConfig,
        refreshBili,
        refreshVideos,
        triggerRun,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}
