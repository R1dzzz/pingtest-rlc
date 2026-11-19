// Grafik garis SVG ringan (tanpa library). Sentuh/arahkan untuk melihat nilai titik terdekat.
import { escapeHtml, isNum } from './util.js';

function niceStep(range, n) {
  const raw = range / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / mag;
  return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
}

/**
 * opts: { series: [{name,color,points:[{x,y,label}]}], xTitle, yTitle, yFormat(v), emptyText }
 * Mengembalikan fungsi destroy.
 */
export function lineChart(host, readout, opts) {
  host.replaceChildren();
  const series = opts.series.map((s) => ({ ...s, points: s.points.filter((p) => isNum(p.x) && isNum(p.y)) }));
  const all = series.flatMap((s) => s.points);
  if (!all.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = opts.emptyText || 'Belum ada data.';
    host.append(p);
    readout.textContent = '';
    return () => {};
  }

  const W = Math.max(260, Math.floor(host.clientWidth || 320));
  const H = 220;
  const pad = { l: 44, r: 12, t: 12, b: 30 };
  let xmin = Math.min(...all.map((p) => p.x));
  let xmax = Math.max(...all.map((p) => p.x));
  if (xmin === xmax) { xmin -= 0.5; xmax += 0.5; }
  const ymax0 = Math.max(...all.map((p) => p.y));
  const step = niceStep(Math.max(ymax0, 1e-6), 4);
  const ymax = Math.ceil(ymax0 / step) * step || step;
  const X = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * (W - pad.l - pad.r);
  const Y = (y) => H - pad.b - (y / ymax) * (H - pad.t - pad.b);
  const yf = opts.yFormat || ((v) => String(+v.toFixed(2)));

  let g = '';
  for (let v = 0; v <= ymax + 1e-9; v += step) {
    g += `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`;
    g += `<text class="axis" x="${pad.l - 6}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${escapeHtml(yf(v))}</text>`;
  }
  const xt = opts.xFormat || ((v) => String(Math.round(v)));
  for (let i = 0; i <= 4; i++) {
    const v = xmin + ((xmax - xmin) * i) / 4;
    g += `<text class="axis" x="${X(v).toFixed(1)}" y="${H - 12}" text-anchor="${i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}">${escapeHtml(xt(v))}</text>`;
  }
  if (opts.xTitle) g += `<text class="axis-title" x="${W - pad.r}" y="${H - 1}" text-anchor="end">${escapeHtml(opts.xTitle)}</text>`;

  for (const s of series) {
    if (!s.points.length) continue;
    const pts = s.points.slice().sort((a, b) => a.x - b.x);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (pts.length <= 60) {
      for (const p of pts) g += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${s.color}"/>`;
    }
  }
  g += '<line class="cross" id="cx" x1="0" x2="0" y1="' + pad.t + '" y2="' + (H - pad.b) + '" style="display:none"/>';
  g += '<circle id="cdot" r="5" fill="none" stroke="#fff" stroke-width="2" style="display:none"/>';

  host.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeHtml(opts.title || 'Grafik')}">${g}</svg>`;
  const svg = host.firstChild;
  const cx = svg.querySelector('#cx');
  const dot = svg.querySelector('#cdot');

  const legend = series.filter((s) => s.points.length).map((s) => `<span><i style="background:${s.color}"></i>${escapeHtml(s.name)}</span>`).join('');
  const lg = document.createElement('div');
  lg.className = 'legend';
  lg.innerHTML = legend;
  host.append(lg);
  readout.textContent = 'Sentuh grafik untuk melihat nilai.';

  function near(ev) {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    let best = null;
    let bd = Infinity;
    for (const s of series) {
      for (const p of s.points) {
        const d = Math.abs(X(p.x) - px);
        if (d < bd) { bd = d; best = { s, p }; }
      }
    }
    if (!best) return;
    cx.setAttribute('x1', X(best.p.x)); cx.setAttribute('x2', X(best.p.x)); cx.style.display = '';
    dot.setAttribute('cx', X(best.p.x)); dot.setAttribute('cy', Y(best.p.y)); dot.style.display = '';
    readout.textContent = `${best.s.name}: ${yf(best.p.y)}${opts.yUnit ? ' ' + opts.yUnit : ''} · ${best.p.label || xt(best.p.x)}`;
  }
  svg.addEventListener('pointermove', near);
  svg.addEventListener('pointerdown', near);
  return () => { svg.removeEventListener('pointermove', near); svg.removeEventListener('pointerdown', near); };
}
