// B站扫码登录：生成二维码 → 轮询 → 取出 SESSDATA / bili_jct / DedeUserID
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const HEADERS = {
  'User-Agent': UA,
  Referer: 'https://www.bilibili.com/',
  Origin: 'https://www.bilibili.com',
};

async function biliGet(url: string): Promise<any> {
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`B站请求失败 HTTP ${resp.status}`);
  return resp.json();
}

export interface QrcodeInfo {
  url: string;
  qrcodeKey: string;
}

export async function generateQrcode(): Promise<QrcodeInfo> {
  const data = await biliGet(
    'https://passport.bilibili.com/x/passport-login/web/qrcode/generate',
  );
  if (data.code !== 0) throw new Error(`生成二维码失败: ${JSON.stringify(data)}`);
  return { url: data.data.url, qrcodeKey: data.data.qrcode_key };
}

export type PollResult =
  | { status: 'success'; sessdata: string; biliJct: string; dedeuserid: string }
  | { status: 'waiting' }
  | { status: 'scanned' }
  | { status: 'expired' };

function pickFromArray(cookies: any[] | undefined, name: string): string {
  if (!Array.isArray(cookies)) return '';
  return cookies.find((c) => c?.name === name)?.value ?? '';
}

function pickFromSetCookie(setCookies: string[], name: string): string {
  for (const sc of setCookies) {
    const first = sc.split(';')[0].trim();
    const eq = first.indexOf('=');
    if (eq > 0 && first.slice(0, eq) === name) return decodeURIComponent(first.slice(eq + 1));
  }
  return '';
}

export async function pollQrcode(qrcodeKey: string): Promise<PollResult> {
  const resp = await fetch(
    `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${encodeURIComponent(qrcodeKey)}`,
    { headers: HEADERS },
  );
  const data = await resp.json();
  const inner = data?.data ?? {};
  // 注意：外层 code 恒为 0，真正的扫码状态在 data.code
  const code = typeof inner.code === 'number' ? inner.code : data.code;

  if (code === 0) {
    // 三路兜底提取登录态：
    // 1) Set-Cookie 响应头（最常见）
    const setCookies =
      typeof resp.headers.getSetCookie === 'function' ? resp.headers.getSetCookie() : [];
    // 2) JSON 里的 cookie_info.cookies 数组
    const cookieArr = inner.cookie_info?.cookies;
    const pick = (name: string) =>
      pickFromSetCookie(setCookies, name) || pickFromArray(cookieArr, name);

    let sessdata = pick('SESSDATA');
    let biliJct = pick('bili_jct');
    let dedeuserid = pick('DedeUserID');

    // 3) 老接口：cookie 直接拼在 data.url 的 query 里
    if (!sessdata && typeof inner.url === 'string') {
      try {
        const q = new URLSearchParams(inner.url.split('?')[1] ?? '');
        sessdata = q.get('SESSDATA') ?? '';
        biliJct = biliJct || (q.get('bili_jct') ?? '');
        dedeuserid = dedeuserid || (q.get('DedeUserID') ?? '');
      } catch {
        /* ignore */
      }
    }

    if (!sessdata || !biliJct) {
      // 便于排查：把原始返回打到服务端日志
      console.error(
        `[login] poll 成功但未解析到 cookie。set-cookie 数=${setCookies.length}, cookie_info=${
          cookieArr ? cookieArr.map((c: any) => c?.name).join(',') : '无'
        }, url=${typeof inner.url === 'string' ? inner.url.slice(0, 80) : '无'}`,
      );
    }

    return { status: 'success', sessdata, biliJct, dedeuserid };
  }
  if (code === 86101) return { status: 'waiting' };
  if (code === 86090) return { status: 'scanned' };
  if (code === 86038) return { status: 'expired' };
  return { status: 'waiting' };
}
