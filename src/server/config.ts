import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface BilibiliAuth {
  sessdata: string;
  biliJct: string;
  dedeuserid: string;
}

export interface AppConfig {
  bilibili: BilibiliAuth;
}

const defaults: AppConfig = {
  bilibili: { sessdata: '', biliJct: '', dedeuserid: '' },
};

export function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      bilibili: { ...defaults.bilibili, ...(parsed.bilibili ?? {}) },
    };
  } catch {
    return structuredClone(defaults);
  }
}

export function saveConfig(config: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}
