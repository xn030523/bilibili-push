export function fmtSize(n: number) {
  if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(0) + ' KB';
  return n + ' B';
}

export function fmtTime(ms: number) {
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

// 计数类数据（播放/点赞/弹幕/评论/收藏）统一千分位
export function formatCount(n: number) {
  return n.toLocaleString('zh-CN');
}
