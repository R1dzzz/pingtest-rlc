export function drawHistoryChart(canvas, items) {
  if (!canvas) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const W = Math.max(1, rect.width);
  const H = Math.max(1, rect.height);

  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (!items || items.length === 0) {
    drawEmpty(ctx, W, H);
    return;
  }

  const data = [...items].reverse().slice(-12);
  const padL = 40, padR = 12, padT = 16, padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const dlValues = data.map((it) => numOrZero(it.download));
  const ulValues = data.map((it) => numOrZero(it.upload));
  const maxVal = Math.max(1, ...dlValues, ...ulValues);
  const yMax = niceCeil(maxVal);

  ctx.strokeStyle = 'rgba(148, 163, 179, 0.12)';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (plotH * i) / gridLines;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(148, 163, 179, 0.65)';
  ctx.font = '10px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (plotH * i) / gridLines;
    const v = yMax - (yMax * i) / gridLines;
    ctx.fillText(formatAxis(v), padL - 6, y);
  }

  const n = data.length;
  const xAt = (i) => (n === 1 ? padL + plotW / 2 : padL + (plotW * i) / (n - 1));
  const yAt = (v) => padT + plotH - (Math.min(v, yMax) / yMax) * plotH;

  drawSeries(ctx, dlValues, xAt, yAt, '#2dd4bf');
  drawSeries(ctx, ulValues, xAt, yAt, '#818cf8');

  drawLegend(ctx, W, padT, W - padR);
}

function drawSeries(ctx, values, xAt, yAt, color) {
  if (!values.length) return;

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = xAt(i);
    const y = yAt(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (values.length > 1) {
    ctx.lineTo(xAt(values.length - 1), yAt(0));
    ctx.lineTo(xAt(0), yAt(0));
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, hexToRgba(color, 0.25));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = xAt(i);
    const y = yAt(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = color;
  values.forEach((v, i) => {
    const x = xAt(i);
    const y = yAt(v);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLegend(ctx, W, top, rightEdge) {
  const items = [
    { label: 'Download', color: '#2dd4bf' },
    { label: 'Upload', color: '#818cf8' },
  ];
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  let x = rightEdge;
  for (const it of items.reverse()) {
    const textW = ctx.measureText(it.label).width;
    ctx.fillStyle = 'rgba(200, 210, 220, 0.75)';
    ctx.fillText(it.label, x, top - 12);
    ctx.fillStyle = it.color;
    ctx.fillRect(x - textW - 14, top - 10, 8, 8);
    x -= textW + 26;
  }
}

function drawEmpty(ctx, W, H) {
  ctx.fillStyle = 'rgba(148, 163, 179, 0.5)';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Belum ada data riwayat', W / 2, H / 2);
}

function niceCeil(v) {
  if (v <= 10) return 10;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  if (v <= 200) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}

function formatAxis(v) {
  if (v >= 1000) return Math.round(v / 1000) + 'k';
  if (v >= 100) return Math.round(v).toString();
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function numOrZero(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}