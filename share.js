// Gambar hasil tes (PNG) via Canvas. Semua angka diambil dari hasil tes nyata (entry), tanpa data karangan.
import { t, locale } from './i18n.js';
import { speedText, msText, isNum } from './util.js';

const W = 1080;
const H = 1350;
const C = { bg: '#09090a', panel: '#131417', line: '#25282d', text: '#eef0f2', muted: '#9097a0', faint: '#626972', dl: '#c6f432', ul: '#5ec4ff' };
const MONO = '"JetBrains Mono Variable", ui-monospace, Menlo, Consolas, monospace';
const SANS = '"Instrument Sans Variable", system-ui, "Segoe UI", Roboto, sans-serif';

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load(`600 60px ${MONO}`), document.fonts.load(`500 28px ${MONO}`),
      document.fonts.load(`650 52px ${SANS}`), document.fonts.load(`500 28px ${SANS}`),
    ]);
  } catch { /* gunakan font cadangan */ }
}

function chamfer(ctx, x, y, w, h, c) {
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
  ctx.closePath();
}

function spaced(ctx, text, x, y, spacing, align = 'left') {
  // Teks dengan letter-spacing manual (konsisten di semua browser).
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  chars.forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += widths[i]; });
}

export function dateText(iso) {
  const d = new Date(iso);
  return d.toLocaleString(locale(), { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** entry: bentuk riwayat ({ts, profile, download, upload, latency, jitter, bloatGrade, ...}) */
export async function renderShareImage(entry) {
  await ensureFonts();
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Kepala: logo + merek
  try {
    const logo = await loadImage('/logo.svg');
    const lh = 84; const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, 72, 72, lw, lh);
  } catch { /* logo opsional */ }
  ctx.fillStyle = C.text; ctx.font = `650 52px ${SANS}`; ctx.textAlign = 'left';
  ctx.fillText('PingTest by RLC', 72 + 84 * 0.62 + 28, 118);
  ctx.fillStyle = C.dl; ctx.font = `600 22px ${MONO}`;
  spaced(ctx, t('card.sub').toUpperCase(), 72 + 84 * 0.62 + 28, 154, 4);

  // Tanggal
  ctx.fillStyle = C.muted; ctx.font = `500 28px ${MONO}`; ctx.textAlign = 'right';
  ctx.fillText(dateText(entry.ts), W - 72, 118);

  // Blok Download & Upload
  const block = (label, val, color, y) => {
    ctx.fillStyle = C.panel; chamfer(ctx, 72, y, W - 144, 290, 36); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(72, y, 8, 290);
    ctx.font = `600 28px ${MONO}`; ctx.textAlign = 'left';
    spaced(ctx, label, 120, y + 66, 6);
    ctx.fillStyle = color; ctx.font = `600 170px ${MONO}`;
    ctx.fillText(speedText(val), 112, y + 232);
    ctx.fillStyle = C.muted; ctx.font = `500 40px ${MONO}`; ctx.textAlign = 'right';
    ctx.fillText('Mbps', W - 120, y + 232);
  };
  block(t('gauge.down'), entry.download, C.dl, 220);
  block(t('gauge.up'), entry.upload, C.ul, 540);

  // Latency & Jitter
  const small = (label, val, x) => {
    ctx.fillStyle = C.panel; chamfer(ctx, x, 860, (W - 144 - 24) / 2, 220, 28); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = `600 24px ${MONO}`; ctx.textAlign = 'left';
    spaced(ctx, label, x + 36, 920, 4);
    ctx.fillStyle = C.text; ctx.font = `600 96px ${MONO}`;
    ctx.fillText(msText(val), x + 32, 1030);
    const w = ctx.measureText(msText(val)).width;
    ctx.fillStyle = C.muted; ctx.font = `500 32px ${MONO}`;
    ctx.fillText('ms', x + 32 + w + 14, 1030);
  };
  small(t('card.lat'), entry.latency, 72);
  small(t('card.jit'), entry.jitter, 72 + (W - 144 - 24) / 2 + 24);

  // Info tambahan nyata: profil & bufferbloat (jika ada)
  ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = `500 28px ${MONO}`;
  const profile = entry.profile === 'standar' ? t('his.p.standar') : t('his.p.hemat');
  let info = `${t('card.profile')}: ${profile}`;
  if (entry.bloatGrade) info += `  ·  ${t('card.bloat')}: ${entry.bloatGrade}`;
  if (isNum(entry.bytes) && entry.bytes > 0) info += `  ·  ${(entry.bytes / 1e6).toFixed(1)} MB`;
  ctx.fillText(info, 72, 1136);

  // Kaki
  ctx.fillStyle = C.line; ctx.fillRect(72, 1200, W - 144, 2);
  ctx.fillStyle = C.faint; ctx.font = `500 24px ${MONO}`; ctx.textAlign = 'left';
  ctx.fillText(t('card.measured'), 72, 1252);
  ctx.textAlign = 'right'; ctx.fillStyle = C.muted;
  ctx.fillText(location.host, W - 72, 1252);
  ctx.textAlign = 'left'; ctx.fillStyle = C.faint;
  ctx.fillText('Rogue Logic Creations (RLC)', 72, 1292);

  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
  if (!blob) throw new Error('toBlob');
  return blob;
}


const avg = (arr) => { const v = arr.filter(isNum); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/** Ringkasan nyata dari daftar riwayat (rata-rata hanya dari nilai yang benar-benar terukur). */
export function historyStats(list) {
  return { n: list.length, down: avg(list.map((e) => e.download)), up: avg(list.map((e) => e.upload)), lat: avg(list.map((e) => e.latency)) };
}

const ROWS = 10;
const shortDate = (iso) => new Date(iso).toLocaleString(locale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Gambar PNG riwayat: ringkasan + 10 hasil terbaru. list = riwayat (terbaru dulu). */
export async function renderHistoryImage(list) {
  await ensureFonts();
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  try {
    const logo = await loadImage('/logo.svg');
    const lh = 84; const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, 72, 72, lw, lh);
  } catch { /* logo opsional */ }
  const tx = 72 + 84 * 0.62 + 28;
  ctx.fillStyle = C.text; ctx.font = `650 52px ${SANS}`; ctx.textAlign = 'left';
  ctx.fillText('PingTest by RLC', tx, 118);
  ctx.fillStyle = C.dl; ctx.font = `600 22px ${MONO}`;
  spaced(ctx, t('his.h').toUpperCase(), tx, 154, 4);

  // Kartu ringkasan
  const st = historyStats(list);
  const cw = (W - 144 - 3 * 16) / 4;
  const cards = [
    [t('hs.tests'), String(st.n), C.text],
    [t('hs.avgDown'), speedText(st.down), C.dl],
    [t('hs.avgUp'), speedText(st.up), C.ul],
    [t('hs.avgLat'), msText(st.lat), C.text, isNum(st.lat) ? 'ms' : ''],
  ];
  cards.forEach(([label, val, color, unit], i) => {
    const x = 72 + i * (cw + 16);
    ctx.fillStyle = C.panel; chamfer(ctx, x, 212, cw, 170, 24); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = `600 17px ${MONO}`;
    spaced(ctx, label, x + 22, 256, 2);
    ctx.fillStyle = color; ctx.font = `600 52px ${MONO}`;
    ctx.fillText(val, x + 20, 340);
    if (unit) {
      const w = ctx.measureText(val).width;
      ctx.fillStyle = C.muted; ctx.font = `500 24px ${MONO}`;
      ctx.fillText(unit, x + 20 + w + 8, 340);
    }
  });

  // Tabel
  const shown = list.slice(0, ROWS);
  ctx.fillStyle = C.muted; ctx.font = `600 18px ${MONO}`;
  const cols = { date: 72, down: 640, up: 775, lat: 895, jit: 1008 };
  ctx.textAlign = 'left'; spaced(ctx, t('hs.date'), cols.date, 440, 3);
  ctx.textAlign = 'right';
  [['down', '↓ MBPS'], ['up', '↑ MBPS'], ['lat', 'LAT MS'], ['jit', 'JIT MS']].forEach(([k, l]) => spaced(ctx, l, cols[k], 440, 1, 'right'));
  ctx.fillStyle = C.line; ctx.fillRect(72, 458, W - 144, 2);
  const rowH = 74;
  shown.forEach((e, i) => {
    const y = 460 + i * rowH;
    if (i % 2 === 1) { ctx.fillStyle = C.panel; ctx.fillRect(72, y, W - 144, rowH); }
    const base = y + 47;
    ctx.textAlign = 'left'; ctx.fillStyle = C.text; ctx.font = `500 24px ${MONO}`;
    ctx.fillText(shortDate(e.ts), cols.date + 10, base);
    ctx.textAlign = 'right';
    ctx.font = `600 28px ${MONO}`;
    ctx.fillStyle = C.dl; ctx.fillText(speedText(e.download), cols.down, base);
    ctx.fillStyle = C.ul; ctx.fillText(speedText(e.upload), cols.up, base);
    ctx.fillStyle = C.text; ctx.fillText(msText(e.latency), cols.lat, base);
    ctx.fillStyle = C.muted; ctx.fillText(msText(e.jitter), cols.jit, base);
  });
  if (!shown.length) {
    ctx.fillStyle = C.muted; ctx.font = `500 28px ${MONO}`; ctx.textAlign = 'left';
    ctx.fillText('—', 82, 520);
  }
  ctx.textAlign = 'left'; ctx.fillStyle = C.faint; ctx.font = `500 22px ${MONO}`;
  ctx.fillText(t('hs.recent', { shown: shown.length, n: list.length }), 72, 1240);

  ctx.fillStyle = C.line; ctx.fillRect(72, 1262, W - 144, 2);
  ctx.fillStyle = C.faint; ctx.font = `500 22px ${MONO}`;
  ctx.fillText(t('card.measured'), 72, 1304);
  ctx.textAlign = 'right'; ctx.fillStyle = C.muted;
  ctx.fillText(location.host, W - 72, 1304);

  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
  if (!blob) throw new Error('toBlob');
  return blob;
}

export const canWebShareFiles = (file) => !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] }));
export const canCopyImage = () => !!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write);
