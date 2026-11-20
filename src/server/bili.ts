// B站账户信息 + 投稿列表（播放量等），复用已保存的登录态
import { loadConfig } from './config.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export interface BiliCookies {
  SESSDATA: string;
  bili_jct: string;
  DedeUserID?: string;
}

export function getCookies(): BiliCookies | null {
  const c = loadConfig();
  const SESSDATA = c.bilibili.sessdata || process.env.BILI_SESSDATA || '';
  const bili_jct = c.bilibili.biliJct || process.env.BILI_JCT || '';
  if (!SESSDATA || !bili_jct) return null;
  const cookies: BiliCookies = { SESSDATA, bili_jct };
  if (c.bilibili.dedeuserid) cookies.DedeUserID = c.bilibili.dedeuserid;
  return cookies;
}

function cookieHeader(c: BiliCookies): string {
  return Object.entries(c)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function biliGet(url: string, c: BiliCookies, referer = 'https://www.bilibili.com/'): Promise<any> {
  const resp = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: referer, Cookie: cookieHeader(c) },
  });
  return resp.json();
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

export async function getAccount(c: BiliCookies): Promise<AccountInfo> {
  const j = await biliGet('https://api.bilibili.com/x/web-interface/nav', c);
  if (j.code !== 0) throw new Error(`获取账户失败: ${j.message || JSON.stringify(j)}`);
  const d = j.data ?? {};
  return {
    mid: d.mid ?? 0,
    uname: d.uname ?? '',
    face: d.face ?? '',
    level: d.level_info?.current_level ?? 0,
    vip: d.vipStatus === 1,
    coins: d.money ?? 0,
    following: d.attention ?? 0,
    follower: d.fans ?? 0,
  };
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

// 创作中心稿件列表（带播放量），登录态下可用
export async function getPublishedVideos(c: BiliCookies): Promise<PublishedVideo[]> {
  const j = await biliGet(
    'https://member.bilibili.com/x/web/archives?status=is_pubing,pubed,not_pubed&pn=1&ps=30&interactive=1',
    c,
    'https://member.bilibili.com/platform/upload-manager/article',
  );
  if (j.code !== 0) throw new Error(`获取投稿列表失败: ${j.message || JSON.stringify(j)}`);

  const list = j.data?.arc_audits ?? j.data?.archives ?? [];
  return list.map((item: any) => {
    // 创作中心真实字段：大写 Archive + 顶层 stat
    const arc = item.Archive ?? item.archive ?? item ?? {};
    const stat = item.stat ?? item.count ?? {};
    return {
      bvid: arc.bvid ?? '',
      title: arc.title ?? '',
      cover: arc.cover ?? '',
      pubtime: arc.pubtime ?? arc.ptime ?? 0,
      play: stat.view ?? arc.play ?? 0,
      like: stat.like ?? 0,
      danmaku: stat.danmaku ?? 0,
      reply: stat.reply ?? 0,
      favorite: stat.favorite ?? 0,
      coin: stat.coin ?? 0,
      share: stat.share ?? 0,
    };
  });
}
