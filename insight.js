// Analisis hasil: menafsirkan angka tes NYATA menjadi perkiraan kelayakan penggunaan, saran, dan
// perbandingan dengan tes sebelumnya. Tidak ada angka karangan; ambang bersifat perkiraan umum
// (bukan jaminan) dan nilai yang tidak terukur diberi status "na".
import { isNum } from './util.js';

const GOOD_BLOAT = new Set(['A+', 'A', 'B']);
const rank = { good: 2, ok: 1, poor: 0 };

/** Ambang: nilai terukur -> 'good' | 'ok' | 'poor' | 'na'. */
function byMin(v, good, ok) { if (!isNum(v)) return 'na'; return v >= good ? 'good' : v >= ok ? 'ok' : 'poor'; }
function worst(levels) {
  if (levels.includes('na')) return 'na';
  return levels.reduce((a, b) => (rank[b] < rank[a] ? b : a), 'good');
}

export function useCases(e) {
  const dl = e.download, ul = e.upload, lat = e.latency, jit = e.jitter;
  const bloatOk = !e.bloatGrade ? 'ok' : GOOD_BLOAT.has(e.bloatGrade) ? 'good' : (e.bloatGrade === 'C' ? 'ok' : 'poor');
  const latLvl = (g, o) => (!isNum(lat) ? 'na' : lat <= g ? 'good' : lat <= o ? 'ok' : 'poor');
  const jitLvl = (g, o) => (!isNum(jit) ? 'na' : jit <= g ? 'good' : jit <= o ? 'ok' : 'poor');
  return [
    { key: 'web', level: byMin(dl, 5, 1.5) },
    { key: 'hd', level: byMin(dl, 8, 4) },
    { key: 'uhd', level: byMin(dl, 25, 15) },
    { key: 'call', level: worst([byMin(dl, 3, 1.5), byMin(ul, 3, 1.5), latLvl(100, 200), jitLvl(30, 60)]) },
    { key: 'game', level: worst([latLvl(50, 100), jitLvl(15, 30), isNum(lat) ? bloatOk : 'na']) },
    { key: 'cloud', level: byMin(ul, 10, 3) },
  ];
}

/** Daftar kunci saran (i18n `ins.tip.*`) berdasarkan kondisi yang benar-benar terukur. */
export function tips(e, partial) {
  const out = [];
  if (partial) out.push('partial');
  if (isNum(e.latency) && e.latency > 100) out.push('latency');
  if (isNum(e.jitter) && e.jitter > 30) out.push('jitter');
  if (e.bloatGrade && ['D', 'F'].includes(e.bloatGrade)) out.push('bloat');
  if (isNum(e.download) && isNum(e.upload) && e.download >= 20 && e.upload < e.download * 0.05) out.push('uplink');
  if (isNum(e.download) && e.download < 3) out.push('slow');
  if (!out.length && e.download != null) out.push('great');
  return out;
}

/** Selisih terhadap tes sebelumnya: { down, up, lat } dalam persen (null jika tak bisa dibandingkan). */
export function compare(cur, prev) {
  if (!prev) return null;
  const pct = (a, b) => (isNum(a) && isNum(b) && b > 0 ? ((a - b) / b) * 100 : null);
  return { down: pct(cur.download, prev.download), up: pct(cur.upload, prev.upload), lat: pct(cur.latency, prev.latency) };
}
