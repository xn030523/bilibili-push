import Parser from 'rss-parser';
import { FEEDS } from './feeds.js';
import { loadStore } from './store.js';

export interface DailyItem {
  guid: string; // daily-YYYY-MM-DD，稳定主键
  title: string; // "AIHOT 日报 · 日期 — 主标题"
  link: string; // 站内日报页
  content: string; // 原始 HTML：导语 + 分类 + 标题链接
  contentSnippet: string; // 纯文本，喂给 LLM 用
  pubDate: string;
  isoDate?: string;
}

const parser = new Parser();

// 拉 AI 日报，返回尚未处理过的期数（按 guid 去重）
export async function collectDaily(): Promise<DailyItem[]> {
  const feed = await parser.parseURL(FEEDS.daily);
  const store = loadStore();
  return feed.items
    .filter((item) => item.guid && !store.processed.includes(item.guid))
    .map((item) => ({
      guid: item.guid!,
      title: item.title ?? '',
      link: item.link ?? '',
      content: item.content ?? '',
      contentSnippet: item.contentSnippet ?? '',
      pubDate: item.pubDate ?? '',
      isoDate: item.isoDate,
    }));
}
