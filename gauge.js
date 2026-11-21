// Speedometer SVG. Skala logaritmik 0–1000 Mbps agar kecepatan rendah dan tinggi sama-sama terbaca.
import { speedText } from './util.js';
import { motionOn } from './settings.js';

const NS = 'http://www.w3.org/2000/svg';
const CX = 160, CY = 150, R = 118, A0 = -120, A1 = 120, MAXV = 1000;
const TICKS = [0, 5, 10, 25, 50, 100, 250, 500, 1000];

export const valueToFrac = (v) => (v > 0 ? Math.min(1, Math.log10(1 + v) / Math.log10(1 + MAXV)) : 0);
const fracToDeg = (f) => A0 + f * (A1 - A0);
const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const f1 = (n) => n.toFixed(2);

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.append(n);
  return n;
}

export function createGauge(host) {
  const svg = el('svg', { viewBox: '0 0 320 268', 'aria-hidden': 'true', focusable: 'false', class: 'gauge-svg' });
  const [x0, y0] = polar(R, A0);
  const [x1, y1] = polar(R, A1);
  const arc = `M${f1(x0)} ${f1(y0)}A${R} ${R} 0 1 1 ${f1(x1)} ${f1(y1)}`;
  const L = R * ((A1 - A0) * Math.PI) / 180;

  el('path', { d: arc, class: 'g-track', fill: 'none' }, svg);

  // Garis skala
  const ticks = el('g', { class: 'g-ticks' }, svg);
  for (let i = 0; i <= 40; i++) {
    const deg = fracToDeg(i / 40);
    const [a, b] = polar(R + 9, deg);
    const [c, d] = polar(R + 12, deg);
    el('line', { x1: f1(a), y1: f1(b), x2: f1(c), y2: f1(d) }, ticks);
  }
  for (const v of TICKS) {
    const deg = fracToDeg(valueToFrac(v));
    const [a, b] = polar(R + 9, deg);
    const [c, d] = polar(R + 18, deg);
    el('line', { x1: f1(a), y1: f1(b), x2: f1(c), y2: f1(d), class: 'major' }, ticks);
    const [tx, ty] = polar(R + 31, deg);
    const t = el('text', { x: f1(tx), y: f1(ty + 3.5), 'text-anchor': 'middle', class: 'g-tick-label' }, ticks);
    t.textContent = v === 1000 ? '1k' : String(v);
  }

  const prog = el('path', {
    d: arc, class: 'g-prog', fill: 'none',
    'stroke-dasharray': f1(L), 'stroke-dashoffset': f1(L),
  }, svg);

  const needle = el('g', { class: 'g-needle' }, svg);
  needle.style.transformOrigin = `${CX}px ${CY}px`;
  needle.style.transform = `rotate(${A0}deg)`;
  el('polygon', { points: `${CX - 3.5},${CY} ${CX},${CY - R + 12} ${CX + 3.5},${CY}` }, needle);
  el('circle', { cx: CX, cy: CY, r: 7, class: 'g-hub' }, svg);

  const label = el('text', { x: CX, y: 118, 'text-anchor': 'middle', class: 'g-label' }, svg);
  const value = el('text', { x: CX, y: 172, 'text-anchor': 'middle', class: 'g-value' }, svg);
  const unit = el('text', { x: CX, y: 194, 'text-anchor': 'middle', class: 'g-unit' }, svg);
  const note = el('text', { x: CX, y: 250, 'text-anchor': 'middle', class: 'g-note' }, svg);
  unit.textContent = 'Mbps';
  host.append(svg);

  let shown = 0;
  let raf = 0;

  function paint(v, f) {
    value.textContent = speedText(v);
    prog.style.strokeDashoffset = f1(L * (1 - f));
    needle.style.transform = `rotate(${fracToDeg(f)}deg)`;
  }

  const reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduce = () => !motionOn() || (reduceMq && reduceMq.matches);

  return {
    // Menampilkan nilai hasil ukur. Jarum hanya bergerak ke nilai yang benar-benar terukur.
    setValue(v) {
      cancelAnimationFrame(raf);
      if (!Number.isFinite(v)) { // tidak ada hasil ukur: tampilkan "—", bukan 0
        shown = 0; value.textContent = '—';
        prog.style.strokeDashoffset = f1(L); needle.style.transform = `rotate(${A0}deg)`;
        return;
      }
      const target = Number.isFinite(v) ? v : 0;
      const from = shown;
      if (reduce() || from === target) { shown = target; paint(target, valueToFrac(target)); return; }
      const t0 = performance.now();
      const dur = 650;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        const cur = from + (target - from) * e;
        shown = cur;
        value.textContent = speedText(cur);
        if (k < 1) raf = requestAnimationFrame(step);
        else { shown = target; value.textContent = speedText(target); }
      };
      prog.style.strokeDashoffset = f1(L * (1 - valueToFrac(target)));
      needle.style.transform = `rotate(${fracToDeg(valueToFrac(target))}deg)`;
      raf = requestAnimationFrame(step);
    },
    reset() { cancelAnimationFrame(raf); shown = 0; paint(0, 0); label.textContent = ''; note.textContent = ''; },
    setLabel(t) { label.textContent = t; },
    setNote(t) { note.textContent = t; },
    setUnit(t) { unit.textContent = t; },
    showReadout(on) { svg.classList.toggle('no-readout', !on); },
  };
}
