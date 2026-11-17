import sharp from 'sharp';

export const W = 1920;
export const H = 1080;

// 中文字体：本地 macOS 用 PingFang，Linux 服务器用 Noto Sans CJK
const FONT = 'PingFang SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif';

function esc(s: string): string {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  );
}

function gridLines(): string {
  const lines: string[] = [];
  for (let x = 0; x <= W; x += 120) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(96,156,255,0.07)" stroke-width="1"/>`);
  }
  for (let y = 0; y <= H; y += 120) {
    lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(96,156,255,0.07)" stroke-width="1"/>`);
  }
  return lines.join('');
}

function defs(): string {
  return `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#060d24"/>
    <stop offset="0.5" stop-color="#0a1a40"/>
    <stop offset="1" stop-color="#050b1e"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.78" cy="0.18" r="0.65">
    <stop offset="0" stop-color="rgba(0,229,255,0.30)"/>
    <stop offset="0.5" stop-color="rgba(30,90,255,0.10)"/>
    <stop offset="1" stop-color="rgba(0,0,0,0)"/>
  </radialGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#00e5ff"/>
    <stop offset="1" stop-color="#2563ff"/>
  </linearGradient>
</defs>`;
}

export function buildSlideSvg(title: string, index: number, total: number, date: string): string {
  const progress = `${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${defs()}
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${gridLines()}
<rect x="80" y="80" width="240" height="6" fill="url(#bar)" rx="3"/>
<text x="960" y="520" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="88" font-weight="700" fill="#eaf6ff">${esc(title)}</text>
<text x="${W - 100}" y="140" text-anchor="end" font-family="${FONT}" font-size="40" fill="#7db8ff">${progress}</text>
<rect x="80" y="${H - 120}" width="${W - 160}" height="4" fill="url(#bar)" rx="2"/>
<text x="80" y="${H - 56}" font-family="${FONT}" font-size="30" fill="#8fbfff">${esc(date)} · AI 日报</text>
</svg>`;
}

function wrapTitle(title: string): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of title) {
    cur += ch;
    if (cur.length >= 14) {
      lines.push(cur);
      cur = '';
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [title];
}

export function buildCoverSvg(title: string, date: string): string {
  const lines = wrapTitle(title);
  const lineHeight = 130;
  const startY = 500 - ((lines.length - 1) * lineHeight) / 2;
  const titleText = lines
    .map(
      (l, i) =>
        `<text x="960" y="${startY + i * lineHeight}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-size="104" font-weight="700" fill="#eaf6ff">${esc(l)}</text>`,
    )
    .join('');

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${defs()}
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${gridLines()}
<rect x="80" y="80" width="240" height="6" fill="url(#bar)" rx="3"/>
<text x="960" y="240" text-anchor="middle" font-family="${FONT}" font-size="40" fill="#7db8ff">AI 日报 · ${esc(date)}</text>
${titleText}
<rect x="80" y="${H - 120}" width="${W - 160}" height="4" fill="url(#bar)" rx="2"/>
<text x="80" y="${H - 56}" font-family="${FONT}" font-size="30" fill="#8fbfff">AI 科技资讯 · 每日速览</text>
</svg>`;
}

export async function renderSvg(svg: string, outPath: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}
