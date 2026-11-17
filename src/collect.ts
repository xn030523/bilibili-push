import Parser from 'rss-parser';
import { FEEDS } from './feeds.js';
import { loadStore } from './store.js';

export interface DailyItem {
  guid: string; // daily-YYYY-MM-DD
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  isoDate?: string;
}

// 单条新闻（来自 all.xml，含摘要和分类）
export interface NewsItem {
  guid: string;
  title: string;
  summary: string;
  category: string;
  link: string;
  pubDate: string;
  isoDate?: string;
}

const parser = new Parser();

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

// 采集最近若干小时内的新闻（含标题、摘要、分类）
export async function collectAll(sinceHours = 26): Promise<NewsItem[]> {
  const feed = await parser.parseURL(FEEDS.all);
  const cutoff = Date.now() - sinceHours * 3600 * 1000;
  return feed.items
    .filter((item) => {
      const t = item.isoDate ? new Date(item.isoDate).getTime() : 0;
      return t >= cutoff;
    })
    .map((item) => ({
      guid: item.guid ?? '',
      title: item.title ?? '',
      summary: item.contentSnippet ?? '',
      category: item.categories?.[0] ?? 'AI 资讯',
      link: item.link ?? '',
      pubDate: item.pubDate ?? '',
      isoDate: item.isoDate,
    }));
}
