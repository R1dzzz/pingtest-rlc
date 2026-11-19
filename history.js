// Riwayat tes di LocalStorage + ekspor CSV / JSON.
// Jika LocalStorage tidak tersedia (mode privat, dll.), riwayat hanya hidup selama tab terbuka.
import { HISTORY_LIMIT, STORAGE_KEY, PREF_KEY } from './site.config.js';
import { isNum } from './util.js';

let memory = [];
let storageOk = true;

function validEntry(e) {
  return e && typeof e === 'object' && typeof e.id === 'string' && typeof e.ts === 'string' && !Number.isNaN(Date.parse(e.ts));
}

export function isStorageAvailable() {
  return storageOk;
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    memory = Array.isArray(arr) ? arr.filter(validEntry).slice(0, HISTORY_LIMIT) : [];
    storageOk = true;
  } catch {
    storageOk = false;
  }
  return memory.slice();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

export function addEntry(entry) {
  memory = [entry, ...memory].slice(0, HISTORY_LIMIT);
  persist();
  return memory.slice();
}

export function removeEntry(id) {
  memory = memory.filter((e) => e.id !== id);
  persist();
  return memory.slice();
}

export function clearHistory() {
  memory = [];
  try { localStorage.removeItem(STORAGE_KEY); } catch { storageOk = false; }
  return [];
}

export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch { return {}; }
}
export function savePrefs(p) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* abaikan */ }
}

const CSV_COLUMNS = [
  ['id', (e) => e.id],
  ['timestamp_iso', (e) => e.ts],
  ['profile', (e) => e.profile],
  ['download_mbps', (e) => e.download],
  ['upload_mbps', (e) => e.upload],
  ['http_latency_idle_ms', (e) => e.latency],
  ['jitter_idle_ms', (e) => e.jitter],
  ['http_latency_download_loaded_ms', (e) => e.downLatency],
  ['http_latency_upload_loaded_ms', (e) => e.upLatency],
  ['jitter_download_loaded_ms', (e) => e.downJitter],
  ['jitter_upload_loaded_ms', (e) => e.upJitter],
  ['bufferbloat_increase_ms', (e) => e.bloat],
  ['bufferbloat_grade', (e) => e.bloatGrade],
  ['data_used_mb', (e) => (isNum(e.bytes) ? +(e.bytes / 1e6).toFixed(2) : null)],
  ['duration_s', (e) => (isNum(e.durationMs) ? +(e.durationMs / 1000).toFixed(1) : null)],
  ['partial', (e) => e.partial],
  ['browser_effective_type', (e) => e.net && e.net.effectiveType],
  ['browser_downlink_estimate_mbps', (e) => e.net && e.net.downlink],
  ['browser_rtt_estimate_ms', (e) => e.net && e.net.rtt],
];

function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Cegah formula injection di spreadsheet untuk sel teks.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCSV(list) {
  const head = CSV_COLUMNS.map((c) => c[0]).join(',');
  const rows = list.map((e) => CSV_COLUMNS.map((c) => csvCell(c[1](e))).join(','));
  return '﻿' + [head, ...rows].join('\r\n') + '\r\n';
}

export function toJSON(list) {
  return JSON.stringify({
    app: 'PingTest by RLC',
    note: 'Latency adalah HTTP latency ke edge Cloudflare, bukan ICMP ping. Kecepatan dalam Mbps (megabit per detik).',
    exportedAt: new Date().toISOString(),
    count: list.length,
    results: list,
  }, null, 2);
}

export function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
