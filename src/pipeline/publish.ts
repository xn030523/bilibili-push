import fs from 'node:fs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export interface BiliCookies {
  SESSDATA: string;
  bili_jct: string;
  [key: string]: string;
}

export interface PublishConfig {
  videoPath: string;
  coverPath: string;
  cookies: BiliCookies;
  title: string;
  desc: string;
  tag: string;
  tid?: number; // 分区 ID，默认 231（科技→数码）
  human_type2?: number; // 新分区 ID，默认 1012（科技数码）
}

interface Preupload {
  auth: string;
  biz_id: number;
  chunk_size: number;
  endpoint: string;
  upos_uri: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cookieHeader(c: BiliCookies): string {
  return Object.entries(c)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function commonHeaders(c: BiliCookies): Record<string, string> {
  return {
    'User-Agent': UA,
    Referer: 'https://member.bilibili.com/',
    Origin: 'https://member.bilibili.com',
    Cookie: cookieHeader(c),
  };
}

// 1. 上传封面
async function uploadCover(c: BiliCookies, coverPath: string): Promise<string> {
  const b64 = fs.readFileSync(coverPath).toString('base64');
  const body = new URLSearchParams({
    csrf: c.bili_jct,
    cover: `data:image/png;base64,${b64}`,
  });
  const resp = await fetch(`https://member.bilibili.com/x/vu/web/cover/up?ts=${Date.now()}`, {
    method: 'POST',
    headers: { ...commonHeaders(c), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const j = (await resp.json()) as { code: number; message?: string; data?: { url?: string } };
  if (j.code !== 0) throw new Error(`封面上传失败: ${JSON.stringify(j)}`);
  return j.data!.url!;
}

// 2. 预上传
async function preupload(c: BiliCookies, filename: string, size: number): Promise<Preupload> {
  const params = new URLSearchParams({
    name: filename,
    size: String(size),
    r: 'upos',
    profile: 'ugcfx/bup',
    ssl: '0',
    version: '2.10.4.0',
    build: '2140000',
    webVersion: '2.13.0',
  });
  const resp = await fetch(`https://member.bilibili.com/preupload?${params}`, {
    headers: commonHeaders(c),
  });
  const j = (await resp.json()) as Preupload & { OK?: number };
  if (j.OK !== 1) throw new Error(`预上传失败: ${JSON.stringify(j)}`);
  return j;
}

// 3. upos 元数据
async function uposMeta(
  pre: Preupload,
  size: number,
): Promise<{ uploadId: string; url: string }> {
  const url = `https:${pre.endpoint}/${pre.upos_uri.replace('upos://', '')}`;
  const params = new URLSearchParams({
    uploads: '',
    output: 'json',
    profile: 'ugcfx/bup',
    filesize: String(size),
    partsize: String(pre.chunk_size),
    biz_id: String(pre.biz_id),
  });
  const resp = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: { 'X-Upos-Auth': pre.auth, 'User-Agent': UA },
  });
  const j = (await resp.json()) as { OK?: number; upload_id?: string };
  if (j.OK !== 1) throw new Error(`upos 元数据失败: ${JSON.stringify(j)}`);
  return { uploadId: j.upload_id!, url };
}

// 4. 分块上传
async function uploadChunks(
  url: string,
  auth: string,
  uploadId: string,
  videoPath: string,
  size: number,
  chunkSize: number,
): Promise<string[]> {
  const chunks = Math.ceil(size / chunkSize);
  const fd = fs.openSync(videoPath, 'r');
  const buf = Buffer.alloc(chunkSize);
  const etags: string[] = [];

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const bytesRead = fs.readSync(fd, buf, 0, chunkSize, start);
    const data = buf.subarray(0, bytesRead);
    const params = new URLSearchParams({
      uploadId,
      chunks: String(chunks),
      total: String(size),
      chunk: String(i),
      size: String(bytesRead),
      partNumber: String(i + 1),
      start: String(start),
      end: String(start + bytesRead),
    });

    let ok = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const resp = await fetch(`${url}?${params}`, {
          method: 'PUT',
          headers: {
            'X-Upos-Auth': auth,
            'Content-Type': 'application/octet-stream',
            'User-Agent': UA,
          },
          body: data,
        });
        if (resp.ok) {
          const etag = (resp.headers.get('etag') ?? 'etag').replace(/"/g, '');
          etags.push(etag);
          ok = true;
          break;
        }
      } catch {
        /* 重试 */
      }
      await sleep(3000);
    }
    if (!ok) throw new Error(`分块 ${i + 1}/${chunks} 上传失败`);
    console.log(`  分块 ${i + 1}/${chunks} OK`);
  }
  fs.closeSync(fd);
  return etags;
}

// 5. 完成通知
async function finalize(
  url: string,
  auth: string,
  uploadId: string,
  bizId: number,
  filename: string,
  etags: string[],
): Promise<void> {
  const params = new URLSearchParams({
    name: filename,
    uploadId,
    biz_id: String(bizId),
    output: 'json',
    profile: 'ugcfx/bup',
  });
  const parts = etags.map((eTag, i) => ({ partNumber: i + 1, eTag }));
  const resp = await fetch(`${url}?${params}`, {
    method: 'POST',
    headers: {
      'X-Upos-Auth': auth,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': UA,
    },
    body: JSON.stringify({ parts }),
  });
  const j = (await resp.json()) as { OK?: number };
  if (j.OK !== 1) throw new Error(`完成通知失败: ${JSON.stringify(j)}`);
}

// 6. 提交稿件
async function submit(
  c: BiliCookies,
  cfg: PublishConfig,
  coverUrl: string,
  stem: string,
  cid: number,
): Promise<{ aid: number; bvid: string }> {
  const payload: Record<string, unknown> = {
    videos: [{ filename: stem, title: cfg.title, desc: '', cid }],
    cover: coverUrl,
    cover43: '',
    title: cfg.title,
    copyright: 1,
    tid: cfg.tid ?? 231,
    tag: cfg.tag,
    desc_format_id: 9999,
    desc: cfg.desc,
    recreate: -1,
    dynamic: '',
    interactive: 0,
    act_reserve_create: 0,
    no_disturbance: 0,
    no_reprint: 0,
    subtitle: { open: 0, lan: '' },
    dolby: 0,
    lossless_music: 0,
    up_selection_reply: false,
    up_close_reply: false,
    up_close_danmu: false,
    web_os: 3,
    csrf: c.bili_jct,
  };
  if (cfg.human_type2) payload.human_type2 = cfg.human_type2;

  // 预热 geetest
  await fetch('https://member.bilibili.com/x/geetest/pre/add', {
    headers: commonHeaders(c),
  }).catch(() => undefined);

  const resp = await fetch(
    `https://member.bilibili.com/x/vu/web/add/v3?ts=${Date.now()}&csrf=${c.bili_jct}`,
    {
      method: 'POST',
      headers: { ...commonHeaders(c), 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    },
  );
  const j = (await resp.json()) as {
    code: number;
    message?: string;
    data?: { aid: number; bvid: string };
  };
  if (j.code !== 0) throw new Error(`add/v3 提交失败: ${JSON.stringify(j)}`);
  return j.data!;
}

// 主入口：完整投稿流程
export async function publish(cfg: PublishConfig): Promise<{ aid: number; bvid: string; coverUrl: string }> {
  const filename = cfg.videoPath.split('/').pop()!;
  const size = fs.statSync(cfg.videoPath).size;
  const csrf = cfg.cookies.bili_jct;
  if (!csrf || !cfg.cookies.SESSDATA) {
    throw new Error('缺少 B 站登录态：需要 SESSDATA 和 bili_jct');
  }

  console.log(`== 开始上传发布 == ${filename} (${size} bytes)`);

  const coverUrl = await uploadCover(cfg.cookies, cfg.coverPath);
  console.log('封面已上传:', coverUrl);

  const pre = await preupload(cfg.cookies, filename, size);
  console.log(`预上传 OK: biz_id=${pre.biz_id} chunk_size=${pre.chunk_size}`);

  const { uploadId, url } = await uposMeta(pre, size);
  console.log(`upos 元数据 OK: upload_id=${uploadId}`);

  const etags = await uploadChunks(url, pre.auth, uploadId, cfg.videoPath, size, pre.chunk_size);

  await finalize(url, pre.auth, uploadId, pre.biz_id, filename, etags);
  console.log('上传完成通知 OK');

  const stem = pre.upos_uri.split('/').pop()!.replace(/\.[^.]+$/, '');
  const cid = pre.biz_id;
  console.log(`稿件 filename=${stem} cid=${cid}`);

  const data = await submit(cfg.cookies, cfg, coverUrl, stem, cid);
  console.log(`== 发布成功 == aid=${data.aid} bvid=${data.bvid}`);
  console.log(`链接: https://www.bilibili.com/video/${data.bvid}`);

  return { ...data, coverUrl };
}
