import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface BilibiliAuth {
  sessdata: string;
  biliJct: string;
  dedeuserid: string;
}

export interface ScheduleConfig {
  cron: string;
  enabled: boolean;
}

export interface AppConfig {
  deepseekApiKey: string;
  bilibili: BilibiliAuth;
  schedule: ScheduleConfig;
}

const defaults: AppConfig = {
  deepseekApiKey: '',
  bilibili: { sessdata: '', biliJct: '', dedeuserid: '' },
  schedule: { cron: '0 8 * * *', enabled: false },
};

export function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      deepseekApiKey: parsed.deepseekApiKey ?? '',
      bilibili: { ...defaults.bilibili, ...(parsed.bilibili ?? {}) },
      schedule: { ...defaults.schedule, ...(parsed.schedule ?? {}) },
    };
  } catch {
    return structuredClone(defaults);
  }
}

export function saveConfig(config: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

// 把配置注入 process.env，供 pipeline 使用（rewrite.ts 读 DEEPSEEK_API_KEY）
export function applyEnv(config: AppConfig): void {
  if (config.deepseekApiKey) process.env.DEEPSEEK_API_KEY = config.deepseekApiKey;
  if (config.bilibili.sessdata) process.env.BILI_SESSDATA = config.bilibili.sessdata;
  if (config.bilibili.biliJct) process.env.BILI_JCT = config.bilibili.biliJct;
}
