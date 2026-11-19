const STORAGE_KEY = 'pingtest_rlc_history_v1';
const MAX_ITEMS = 20;

export class History {
  constructor() {
    this.items = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((it) => it && typeof it.ts === 'number').slice(0, MAX_ITEMS);
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items.slice(0, MAX_ITEMS)));
    } catch {}
  }

  add(entry) {
    const item = {
      ts: Date.now(),
      download: numberOrNull(entry.download),
      upload: numberOrNull(entry.upload),
      latency: numberOrNull(entry.latency),
      jitter: numberOrNull(entry.jitter),
      downLoadedLatency: numberOrNull(entry.downLoadedLatency),
      upLoadedLatency: numberOrNull(entry.upLoadedLatency),
      bufferbloat: numberOrNull(entry.bufferbloat),
      bufferbloatGrade: entry.bufferbloatGrade || null,
      connectionType: entry.connectionType || null,
    };
    this.items.unshift(item);
    this.items = this.items.slice(0, MAX_ITEMS);
    this._save();
    return item;
  }

  clear() {
    this.items = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  getAll() { return [...this.items]; }
}

function numberOrNull(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}