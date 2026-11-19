const ARC_LENGTH = 502.65;
const CX = 160;
const CY = 160;
const R = 120;

function deg2rad(d) { return (d * Math.PI) / 180; }

function polarToXY(angleDeg, r) {
  const rad = deg2rad(angleDeg);
  return {
    x: CX + r * Math.sin(rad),
    y: CY - r * Math.cos(rad),
  };
}

function niceMax(value) {
  const presets = [1, 2, 5, 10, 20, 25, 50, 75, 100, 150, 250, 500, 750, 1000, 2500, 5000];
  if (!value || value <= 0) return 5;
  for (const p of presets) if (value <= p) return p;
  return Math.ceil(value / 1000) * 1000;
}

function formatValue(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '0.00';
  if (v >= 1000) return v.toFixed(0);
  if (v >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

export class Speedometer {
  constructor() {
    this.arc = document.getElementById('gauge-arc');
    this.arcBg = document.getElementById('gauge-arc-bg');
    this.dot = document.getElementById('gauge-dot');
    this.valueEl = document.getElementById('gauge-value');
    this.unitEl = document.getElementById('gauge-unit');
    this.ticksEl = document.getElementById('gauge-ticks');
    this.labels = [
      document.getElementById('gauge-lbl-0'),
      document.getElementById('gauge-lbl-1'),
      document.getElementById('gauge-lbl-2'),
      document.getElementById('gauge-lbl-3'),
      document.getElementById('gauge-lbl-4'),
    ];

    this.current = 0;
    this.target = 0;
    this.max = 5;
    this.raf = null;

    this.arc.style.strokeDasharray = `0 ${ARC_LENGTH}`;
    this.arc.style.strokeDashoffset = '0';

    this._drawTicks();
    this._updateLabels();
    this._apply(0);
  }

  _drawTicks() {
    if (!this.ticksEl) return;
    const frag = document.createDocumentFragment();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = -120 + t * 240;
      const isMajor = i % 6 === 0;
      const rOuter = 118;
      const rInner = isMajor ? 106 : 112;
      const p1 = polarToXY(angle, rOuter);
      const p2 = polarToXY(angle, rInner);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x.toFixed(2));
      line.setAttribute('y1', p1.y.toFixed(2));
      line.setAttribute('x2', p2.x.toFixed(2));
      line.setAttribute('y2', p2.y.toFixed(2));
      if (isMajor) line.setAttribute('class', 'is-major');
      frag.appendChild(line);
    }
    this.ticksEl.appendChild(frag);
  }

  _updateLabels() {
    const values = [0, this.max * 0.25, this.max * 0.5, this.max * 0.75, this.max];
    this.labels.forEach((el, i) => {
      if (!el) return;
      const v = values[i];
      el.textContent = v >= 100 ? Math.round(v).toString() : formatTrim(v);
    });
  }

  setUnit(unit) {
    this.unitEl.textContent = unit;
  }

  setMax(max) {
    const nextMax = niceMax(max);
    if (nextMax !== this.max) {
      this.max = nextMax;
      this._updateLabels();
      this._apply(this.target);
    }
  }

  setValue(value, { animate = true } = {}) {
    this.target = Math.max(0, value || 0);
    if (this.target > this.max) this.setMax(this.target);

    if (!animate) {
      this.current = this.target;
      this._apply(this.current);
      return;
    }

    if (this.raf) return;
    const loop = () => {
      const diff = this.target - this.current;
      if (Math.abs(diff) < 0.02) {
        this.current = this.target;
        this._apply(this.current);
        this.raf = null;
        return;
      }
      this.current += diff * 0.18;
      this._apply(this.current);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  _apply(value) {
    const ratio = this.max > 0 ? Math.min(1, Math.max(0, value / this.max)) : 0;
    const filled = ratio * ARC_LENGTH;
    this.arc.style.strokeDasharray = `${filled} ${ARC_LENGTH}`;

    const angle = -120 + ratio * 240;
    const pos = polarToXY(angle, R);
    this.dot.setAttribute('cx', pos.x.toFixed(2));
    this.dot.setAttribute('cy', pos.y.toFixed(2));

    this.valueEl.textContent = formatValue(value);
  }

  reset() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.current = 0;
    this.target = 0;
    this.max = 5;
    this._updateLabels();
    this._apply(0);
    this.unitEl.textContent = 'Mbps';
  }
}

function formatTrim(v) {
  if (v >= 100) return Math.round(v).toString();
  if (v >= 10) return v.toFixed(1).replace(/\.0$/, '');
  return v.toFixed(2).replace(/\.?0+$/, '');
}