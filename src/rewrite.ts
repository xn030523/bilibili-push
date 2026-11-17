import 'dotenv/config';
import type { DailyItem } from './collect.js';

const API_KEY = process.env.DEEPSEEK_API_KEY ?? '';
const BASE = 'https://api.deepseek.com';
const MODEL = 'deepseek-chat';

export interface Segment {
  id: number;
  title: string; // 分镜标题（幻灯片大字）
  narration: string; // 口播稿（逐字稿）
}

export interface VideoScript {
  title: string; // 视频标题
  desc: string; // 简介
  tag: string; // 标签，逗号分隔
  segments: Segment[]; // 分镜
}

const SYSTEM_PROMPT = `你是 B 站 AI 资讯频道的视频文案编辑，负责把「AI 日报」改写成口播视频脚本。

要求：
1. 输出必须是 JSON（不要输出 JSON 以外的任何内容），格式如下：
{
  "title": "视频标题（≤80字，B站风格，抓眼球但不标题党）",
  "desc": "视频简介（100-200字，概括本期内容）",
  "tag": "8-10个标签，逗号分隔",
  "segments": [
    {"id": 1, "title": "分镜标题（幻灯片大字，≤16字）", "narration": "该分镜口播稿"},
    {"id": 2, "title": "…", "narration": "…"}
  ]
}

2. segments 数量 3-6 段：
   - 第 1 段是开场：问候 + 日期 + 本期一句话总览
   - 中间段：按主题分组播报（每条新闻 1-2 句，讲清"谁做了什么、为什么重要"）
   - 最后 1 段：简短收尾（引导关注/下期预告）

3. 口播稿要求：
   - 口语化、像真人主播说话，不要书面腔、不要罗列式
   - 中文语速约 4-5 字/秒，全文 350-500 字（约 80-110 秒）
   - narration 是逐字稿，直接念出来就通顺

4. title 要独立、吸引点击，不要照抄日报原标题。

5. 遇到"今日安静无大事"这类内容，也要生成一段得体的播报（简短总结近期 AI 圈平静，展望后续）。

只输出 JSON。`;

export async function rewriteDaily(item: DailyItem): Promise<VideoScript> {
  if (!API_KEY) {
    throw new Error('未设置 DEEPSEEK_API_KEY，请在 .env 里填写后重跑');
  }

  const userPrompt = `以下是 ${item.guid} 的 AI 日报内容：\n\n${item.contentSnippet}\n\n请按 system 要求改写为口播视频脚本 JSON。`;

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
