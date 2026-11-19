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
  return d.toLocaleString('id-ID', {
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
 */
export function bufferbloat(idle, downLoaded, upLoaded) {
  const loaded = [downLoaded, upLoaded].filter(isNum);
  if (!isNum(idle) || !loaded.length) return null;
  const worst = Math.max(...loaded);
  const increase = Math.max(0, worst - idle);
  const grades = [
    [5, 'A+', 'Sangat baik', 'Latency hampir tidak naik saat jaringan penuh.'],
    [30, 'A', 'Baik', 'Kenaikan kecil; video call dan game online umumnya aman.'],
    [60, 'B', 'Cukup', 'Terasa sedikit saat ada unduhan besar berjalan bersamaan.'],
    [200, 'C', 'Kurang baik', 'Panggilan video/game bisa lag ketika ada unduhan atau unggahan.'],
    [400, 'D', 'Buruk', 'Latency melonjak saat jaringan sibuk; aktivitas real-time terganggu.'],
    [Infinity, 'F', 'Sangat buruk', 'Latency naik sangat tinggi saat jaringan sibuk.'],
  ];
  const g = grades.find((x) => increase < x[0]);
  return { increase, grade: g[1], label: g[2], desc: g[3], loaded: worst };
}
