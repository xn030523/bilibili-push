import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'processed.json');

interface Store {
  processed: string[];
}

export function loadStore(): Store {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data?.processed)) return data as Store;
    return { processed: [] };
  } catch {
    return { processed: [] };
  }
}

export function saveStore(store: Store): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

// 处理成功后调用，防止中途失败导致重复采集
export function markProcessed(guid: string): void {
  const store = loadStore();
  if (!store.processed.includes(guid)) {
    store.processed.push(guid);
    saveStore(store);
  }
}
