// Informasi koneksi dari browser (Network Information API). Hanya ada di sebagian
// browser (umumnya Chrome/Android). Nilainya ESTIMASI browser, bukan hasil tes.
import { isNum } from './util.js';

export function getConnection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

export function readNetInfo() {
  const c = getConnection();
  return {
    online: typeof navigator.onLine === 'boolean' ? navigator.onLine : null,
    supported: !!c,
    effectiveType: c && c.effectiveType ? String(c.effectiveType) : null,
    downlink: c && isNum(c.downlink) ? c.downlink : null,
    rtt: c && isNum(c.rtt) ? c.rtt : null,
    saveData: c && typeof c.saveData === 'boolean' ? c.saveData : null,
    type: c && c.type ? String(c.type) : null,
  };
}

export function renderNetInfo(dl) {
  const n = readNetInfo();
  const rows = [
    ['Status browser', n.online === null ? 'Tidak diketahui' : n.online ? 'Online' : 'Offline'],
  ];
  if (n.supported) {
    rows.push(['Tipe efektif', n.effectiveType ? n.effectiveType.toUpperCase() : 'Tidak tersedia']);
    rows.push(['Downlink (estimasi)', n.downlink !== null ? n.downlink + ' Mbps' : 'Tidak tersedia']);
    rows.push(['RTT (estimasi)', n.rtt !== null ? n.rtt + ' ms' : 'Tidak tersedia']);
    rows.push(['Mode hemat data', n.saveData === null ? 'Tidak tersedia' : n.saveData ? 'Aktif' : 'Nonaktif']);
    rows.push(['Jenis koneksi', n.type || 'Tidak tersedia']);
  }
  dl.replaceChildren();
  for (const [k, v] of rows) {
    const wrap = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = k;
    dd.textContent = v;
    wrap.append(dt, dd);
    dl.append(wrap);
  }
  return n;
}

export function watchNetInfo(cb) {
  const c = getConnection();
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  if (c && c.addEventListener) c.addEventListener('change', cb);
}
