// 终端扫码登录 B站：生成二维码 → 手机扫 → 自动写回 config.json
import QRCode from 'qrcode';
import { generateQrcode, pollQrcode } from './auth.js';
import { loadConfig, saveConfig } from './config.js';
import { getAccount } from './bili.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('正在生成登录二维码…\n');
  const qr = await generateQrcode();

  // 在终端画 ASCII 二维码（复用 qrcode 包，无需额外依赖）
  const qrText = await QRCode.toString(qr.url, { type: 'terminal', small: true });
  console.log(qrText);
  console.log('请用手机 Bilibili App 扫码并确认登录（二维码约 3 分钟内有效）…\n');

  const start = Date.now();
  while (Date.now() - start < 3 * 60 * 1000) {
    await sleep(2000);
    const res = await pollQrcode(qr.qrcodeKey);

    if (res.status === 'success') {
      if (!res.sessdata || !res.biliJct) {
        console.error('⚠️ 扫码成功但未解析到 Cookie，请重新运行 `npm run login`。');
        return;
      }

      const config = loadConfig();
      config.bilibili.sessdata = res.sessdata;
      config.bilibili.biliJct = res.biliJct;
      config.bilibili.dedeuserid = res.dedeuserid || config.bilibili.dedeuserid;
      saveConfig(config);

      console.log('\n✅ 登录成功，已写入 config.json');
      try {
        const acc = await getAccount({
          SESSDATA: res.sessdata,
          bili_jct: res.biliJct,
          DedeUserID: res.dedeuserid,
        });
        console.log(`   账号：${acc.uname}（UID ${acc.mid}）`);
        console.log(
          `   等级：Lv${acc.level}${acc.vip ? ' · 大会员' : ''} · 粉丝 ${acc.follower} · 硬币 ${acc.coins}`,
        );
      } catch (e) {
        console.log('   （账户信息获取失败：', (e as Error).message, '）');
      }
      return;
    }

    if (res.status === 'scanned') console.log('已扫码，请在手机上点「确认登录」…');
    if (res.status === 'expired') {
      console.error('二维码已过期，请重新运行 `npm run login`。');
      return;
    }
    // waiting：静默等待，不刷屏
  }

  console.error('登录超时，请重新运行 `npm run login`。');
}

main().catch((e) => {
  console.error('登录失败:', e);
  process.exit(1);
});
