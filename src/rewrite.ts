import 'dotenv/config';
import type { NewsItem } from './collect.js';

const API_KEY = process.env.DEEPSEEK_API_KEY ?? '';
const BASE = 'https://api.deepseek.com';
const MODEL = 'deepseek-chat';

export interface Card {
  title: string;
  summary: string;
  category: string;
}

export interface Segment {
  id: number;
  title: string; // 分镜大标题
  narration: string; // 口播稿（逐字稿）
  cards: Card[]; // 该分镜展示的新闻卡片
}

export interface VideoScript {
  title: string;
  desc: string;
  tag: string;
  segments: Segment[];
}

const SYSTEM_PROMPT = `你是 B 站 AI 资讯频道的视频文案编辑。我给你当天抓到的 AI 新闻列表（每条含标题、摘要、分类），你要把它做成口播视频脚本。

要求：
1. 输出必须是 JSON（不要输出 JSON 以外的任何内容），格式如下：
{
  "title": "视频标题（≤80字，抓眼球）",
  "desc": "视频简介（100-200字）",
  "tag": "8-10个标签，逗号分隔",
  "segments": [
    {
      "id": 1,
      "title": "分镜大标题（≤16字）",
      "narration": "该分镜口播稿（逐字稿）",
      "cards": [
        {"title": "新闻标题", "summary": "一句话摘要（≤30字）", "category": "分类"},
        {"title": "新闻标题2", "summary": "一句话摘要（≤30字）", "category": "分类"}
      ]
    }
  ]
}

2. segments 3-5 段，每段 2-4 张 cards。cards 从新闻列表里选取，尽量覆盖重要新闻：
   - title 保留新闻原标题的意思
   - summary 提炼成一句话（20-30 字，适合放幻灯片）
   - category 用列表里的分类

3. 口播稿要求：口语化，像真人主播播报；全文 350-500 字（约 80-110 秒）；narration 是逐字稿，直接念就通顺。

4. title 独立吸引人，不照抄新闻标题。

只输出 JSON。`;

export async function rewriteDaily(news: NewsItem[]): Promise<VideoScript> {
  if (!API_KEY) {
    throw new Error('未设置 DEEPSEEK_API_KEY，请在 .env 里填写后重跑');
  }

  const newsText = news
    .map((n, i) => `${i + 1}. [${n.category}] ${n.title}：${n.summary}`)
    .join('\n');

  const userPrompt = `当天抓到的 AI 新闻列表：\n\n${newsText || '（无）'}\n\n请按 system 要求改写为口播视频脚本 JSON。`;

  const resp = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DeepSeek API 错误 ${resp.status}: ${text.slice(0, 300)}`);
  }

  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new Error('DeepSeek 返回内容为空');
  }

  return JSON.parse(content) as VideoScript;
}
