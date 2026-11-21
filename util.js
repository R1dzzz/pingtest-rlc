import { locale } from './i18n.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export { isNum };

export function speedText(mbps) {
  if (!isNum(mbps)) return '—';
  if (mbps >= 100) return mbps.toFixed(0);
  if (mbps >= 10) return mbps.toFixed(1);
  return mbps.toFixed(2);
}

export function msText(ms) {
  if (!isNum(ms)) return '—';
  return ms >= 100 ? ms.toFixed(0) : ms.toFixed(1);
}

export function bytesText(bytes) {
  if (!isNum(bytes)) return '—';
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return Math.max(1, Math.round(bytes / 1e3)) + ' KB';
}

export function dateTimeText(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale(), {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Estimasi bufferbloat = kenaikan HTTP latency saat koneksi terbebani (download/upload)
 * dibanding saat idle. Ini estimasi, bukan pengukuran standar bufferbloat penuh.
 * Label & deskripsi diterjemahkan di UI lewat kunci bb.l.<grade> dan bb.d.<grade>.
 */
export function bufferbloat(idle, downLoaded, upLoaded) {
  const loaded = [downLoaded, upLoaded].filter(isNum);
  if (!isNum(idle) || !loaded.length) return null;
  const worst = Math.max(...loaded);
  const increase = Math.max(0, worst - idle);
  const limits = [[5, 'A+'], [30, 'A'], [60, 'B'], [200, 'C'], [400, 'D'], [Infinity, 'F']];
  const grade = limits.find((x) => increase < x[0])[1];
  return { increase, grade, loaded: worst };
}
