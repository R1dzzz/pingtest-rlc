// Informasi koneksi dari browser (Network Information API). Hanya ada di sebagian
// browser (umumnya Chrome/Android). Nilainya ESTIMASI browser, bukan hasil tes.
import { isNum } from './util.js';
import { t } from './i18n.js';

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
  const na = t('conn.na');
  const rows = [
    [t('conn.status'), n.online === null ? t('conn.unknown') : n.online ? t('conn.online') : t('conn.offline')],
  ];
  if (n.supported) {
    rows.push([t('conn.eff'), n.effectiveType ? n.effectiveType.toUpperCase() : na]);
    rows.push([t('conn.down'), n.downlink !== null ? n.downlink + ' Mbps' : na]);
    rows.push([t('conn.rtt'), n.rtt !== null ? n.rtt + ' ms' : na]);
    rows.push([t('conn.save'), n.saveData === null ? na : n.saveData ? t('conn.on') : t('conn.off')]);
    rows.push([t('conn.type'), n.type || na]);
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
