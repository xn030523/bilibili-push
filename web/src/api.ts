async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${r.status}`);
  }
  return r.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${r.status}`);
  }
  return r.json();
}

export interface ConfigInfo {
  deepseekApiKey: string;
  bilibili: { loggedIn: boolean; dedeuserid: string };
  schedule: { cron: string; enabled: boolean };
}

export interface QrInfo {
  url: string;
  qrcodeKey: string;
  qrcodeDataUrl: string;
}

export type PollResult =
  | { status: 'success' }
  | { status: 'waiting' }
  | { status: 'scanned' }
  | { status: 'expired' };

export interface RunStatus {
  running: boolean;
  startAt: number;
  log: string;
}

export interface VideoInfo {
  name: string;
  size: number;
  mtime: number;
  rel: string;
}

export interface AccountInfo {
  mid: number;
  uname: string;
  face: string;
  level: number;
  vip: boolean;
  coins: number;
  following: number;
  follower: number;
}

export interface PublishedVideo {
  bvid: string;
  title: string;
  cover: string;
  pubtime: number;
  play: number;
  like: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
}

export interface PublishMeta {
  title: string;
  desc: string;
  tag: string;
  date: string;
  video: string;
  cover: string;
  status: 'draft' | 'published' | 'failed';
  bvid: string;
  aid: number;
  publishedAt: number;
  updatedAt: number;
}

export const api = {
  health: () => get<{ ok: boolean }>('/api/health'),
  config: () => get<ConfigInfo>('/api/config'),
  saveConfig: (b: { deepseekApiKey?: string; schedule?: { cron: string; enabled: boolean } }) =>
    post('/api/config', b),
  qrcode: () => get<QrInfo>('/api/login/qrcode'),
  poll: (key: string) => get<PollResult>(`/api/login/poll?qrcode_key=${encodeURIComponent(key)}`),
  loginStatus: () => get<{ loggedIn: boolean }>('/api/login/status'),
  run: () => post<{ ok: boolean }>('/api/run'),
  runStatus: () => get<RunStatus>('/api/run/status'),
  logs: () => get<{ log: string }>('/api/logs'),
  videos: () => get<{ videos: VideoInfo[]; meta: PublishMeta | null }>('/api/videos'),
  videoFile: (rel: string) => `/api/videos/file?rel=${encodeURIComponent(rel)}`,
  cover: () => '/api/videos/cover',
  account: () => get<AccountInfo>('/api/bili/account'),
  published: () => get<{ videos: PublishedVideo[] }>('/api/bili/published'),
};
