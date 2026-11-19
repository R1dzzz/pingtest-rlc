import './styles/main.css';
import { createSpeedTestEngine, readMetrics, estimateBufferbloat, bufferbloatGrade } from './modules/speedtest.js';
import { Speedometer } from './modules/speedometer.js';
import { History } from './modules/history.js';
import { drawHistoryChart } from './modules/chart.js';
import { getConnectionInfo, describeConnection } from './modules/connection.js';
import { exportCSV, exportJSON } from './modules/export.js';

const $ = (id) => document.getElementById(id);

const ui = {
  phase: $('phase-label'),
  btnStart: $('btn-start'),
  btnCancel: $('btn-cancel'),
  btnRetry: $('btn-retry'),

  mDownload: $('m-download'),
  mUpload: $('m-upload'),
  mLatency: $('m-latency'),
  mJitter: $('m-jitter'),

  advLoadedDl: $('adv-loaded-dl'),
  advLoadedUl: $('adv-loaded-ul'),
  advBb: $('adv-bb'),
  advBbGrade: $('adv-bb-grade'),
  advConnType: $('adv-conn-type'),
  advConnDown: $('adv-conn-down'),
  advConnRtt: $('adv-conn-rtt'),

  historyList: $('history-list'),
  historyChart: $('history-chart'),
  btnExportCsv: $('btn-export-csv'),
  btnExportJson: $('btn-export-json'),
  btnClearHist: $('btn-clear-hist'),
};

const gauge = new Speedometer();
const history = new History();

let engine = null;
let running = false;
let cancelled = false;
let currentPhase = 'idle';
let liveFramePending = false;

function init() {
  const conn = getConnectionInfo();
  const desc = describeConnection(conn);
  ui.advConnType.textContent = desc.type;
  ui.advConnDown.textContent = desc.downlink;
  ui.advConnRtt.textContent = desc.rtt;

  renderHistory();

  ui.btnStart.addEventListener('click', startTest);
  ui.btnCancel.addEventListener('click', cancelTest);
  ui.btnRetry.addEventListener('click', startTest);
  ui.btnExportCsv.addEventListener('click', () => {
    const items = history.getAll();
    if (items.length) exportCSV(items);
  });
  ui.btnExportJson.addEventListener('click', () => {
    const items = history.getAll();
    if (items.length) exportJSON(items);
  });
  ui.btnClearHist.addEventListener('click', () => {
    if (!history.getAll().length) return;
    if (confirm('Hapus semua riwayat pengujian di perangkat ini?')) {
      history.clear();
      renderHistory();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderHistory, 200);
  });

  window.addEventListener('pagehide', () => {
    if (running) cancelTest();
  });

  setPhase('idle', 'Siap menguji koneksi Anda');
}

function setPhase(phase, label) {
  currentPhase = phase;
  if (label) ui.phase.textContent = label;
}

function setButtons(state) {
  if (state === 'idle') {
    ui.btnStart.hidden = false;
    ui.btnCancel.hidden = true;
    ui.btnRetry.hidden = true;
    ui.btnStart.disabled = false;
  } else if (state === 'running') {
    ui.btnStart.hidden = true;
    ui.btnCancel.hidden = false;
    ui.btnRetry.hidden = true;
  } else if (state === 'finished') {
    ui.btnStart.hidden = true;
    ui.btnCancel.hidden = true;
    ui.btnRetry.hidden = false;
  }
}

function resetReadout() {
  gauge.reset();
  ui.mDownload.textContent = '—';
  ui.mUpload.textContent = '—';
  ui.mLatency.textContent = '—';
  ui.mJitter.textContent = '—';
  ui.advLoadedDl.textContent = '—';
  ui.advLoadedUl.textContent = '—';
  ui.advBb.textContent = '—';
  ui.advBbGrade.textContent = '—';
  ui.advBbGrade.className = '';
}

async function startTest() {
  if (running) return;
  running = true;
  cancelled = false;

  resetReadout();
  setButtons('running');
  setPhase('connecting', 'Menghubungkan ke Cloudflare edge…');
  gauge.setUnit('Mbps');

  try {
    engine = createSpeedTestEngine();
  } catch (err) {
    console.error(err);
    setPhase('error', 'Gagal menginisialisasi mesin pengujian.');
    running = false;
    setButtons('finished');
    return;
  }

  engine.onResultsChange = ({ type }) => {
    if (!running) return;
    if (type === 'latency') {
      setPhase('latency', 'Mengukur latency…');
      gauge.setUnit('ms');
    } else if (type === 'download') {
      setPhase('download', 'Mengukur kecepatan download…');
      gauge.setUnit('Mbps');
    } else if (type === 'upload') {
      setPhase('upload', 'Mengukur kecepatan upload…');
      gauge.setUnit('Mbps');
    }
    scheduleLiveUpdate();
  };

  engine.onFinish = (results) => {
    if (cancelled) return;
    handleFinish(results);
  };

  engine.onError = (err) => {
    if (cancelled) return;
    console.error('SpeedTest error', err);
    handleError(err);
  };

  try {
    engine.play();
  } catch (err) {
    console.error('Failed to start test', err);
    handleError(err);
  }
}

function cancelTest() {
  if (!running) return;
  cancelled = true;
  running = false;
  try { engine?.cancel(); } catch {}
  setPhase('idle', 'Dibatalkan. Tekan Coba Lagi untuk mengulang.');
  setButtons('finished');
}

function handleFinish(results) {
  running = false;
  const metrics = readMetrics({ results });

  renderFinalMetrics(metrics);

  gauge.setUnit('Mbps');
  gauge.setMax(Math.max(metrics.download || 0, metrics.upload || 0, 1));
  gauge.setValue(metrics.download || 0);

  setPhase('complete', 'Pengujian selesai.');
  setButtons('finished');

  const bb = estimateBufferbloat(metrics.latency, metrics.downLoadedLatency, metrics.upLoadedLatency);
  const bbGrade = bufferbloatGrade(bb);
  const conn = describeConnection(getConnectionInfo());

  history.add({
    download: metrics.download,
    upload: metrics.upload,
    latency: metrics.latency,
    jitter: metrics.jitter,
    downLoadedLatency: metrics.downLoadedLatency,
    upLoadedLatency: metrics.upLoadedLatency,
    bufferbloat: bb,
    bufferbloatGrade: bbGrade,
    connectionType: conn.type,
  });
  renderHistory();
}

function handleError(err) {
  running = false;
  const msg = err && err.message ? err.message : 'Kesalahan tidak diketahui';
  setPhase('error', `Gagal: ${msg}. Periksa koneksi Anda lalu coba lagi.`);
  setButtons('finished');
}

function scheduleLiveUpdate() {
  if (liveFramePending) return;
  liveFramePending = true;
  requestAnimationFrame(() => {
    liveFramePending = false;
    if (!running && currentPhase !== 'complete') return;
    const m = readMetrics(engine);

    if (currentPhase === 'latency') {
      const lat = m.currentLatency ?? m.latency;
      if (lat != null) {
        gauge.setMax(Math.max(100, lat * 1.5));
        gauge.setValue(lat);
      }
    } else if (currentPhase === 'download') {
      const v = Math.max(m.currentDownload || 0, m.download || 0);
      gauge.setValue(v);
    } else if (currentPhase === 'upload') {
      const v = Math.max(m.currentUpload || 0, m.upload || 0);
      gauge.setValue(v);
    }

    if (m.latency != null) ui.mLatency.textContent = fmt(m.latency);
    if (m.jitter != null) ui.mJitter.textContent = fmt(m.jitter);
    if (m.download != null && m.download > 0) ui.mDownload.textContent = fmt(m.download);
    if (m.upload != null && m.upload > 0) ui.mUpload.textContent = fmt(m.upload);

    if (m.downLoadedLatency != null) ui.advLoadedDl.textContent = `${fmt(m.downLoadedLatency)} ms`;
    if (m.upLoadedLatency != null) ui.advLoadedUl.textContent = `${fmt(m.upLoadedLatency)} ms`;

    const bb = estimateBufferbloat(m.latency, m.downLoadedLatency, m.upLoadedLatency);
    if (bb != null) {
      ui.advBb.textContent = `${fmt(bb)} ms`;
      const grade = bufferbloatGrade(bb);
      ui.advBbGrade.textContent = grade || '—';
      ui.advBbGrade.className = grade ? `grade-${grade.charAt(0).toLowerCase()}` : '';
    }
  });
}

function renderFinalMetrics(m) {
  ui.mDownload.textContent = m.download != null ? fmt(m.download) : '—';
  ui.mUpload.textContent = m.upload != null ? fmt(m.upload) : '—';
  ui.mLatency.textContent = m.latency != null ? fmt(m.latency) : '—';
  ui.mJitter.textContent = m.jitter != null ? fmt(m.jitter) : '—';

  ui.advLoadedDl.textContent = m.downLoadedLatency != null ? `${fmt(m.downLoadedLatency)} ms` : 'Tidak tersedia';
  ui.advLoadedUl.textContent = m.upLoadedLatency != null ? `${fmt(m.upLoadedLatency)} ms` : 'Tidak tersedia';

  const bb = estimateBufferbloat(m.latency, m.downLoadedLatency, m.upLoadedLatency);
  if (bb != null) {
    ui.advBb.textContent = `${fmt(bb)} ms`;
    const grade = bufferbloatGrade(bb);
    ui.advBbGrade.textContent = grade || '—';
    ui.advBbGrade.className = grade ? `grade-${grade.charAt(0).toLowerCase()}` : '';
  } else {
    ui.advBb.textContent = 'Tidak tersedia';
    ui.advBbGrade.textContent = '—';
    ui.advBbGrade.className = '';
  }
}

function renderHistory() {
  const items = history.getAll();

  drawHistoryChart(ui.historyChart, items);

  const has = items.length > 0;
  ui.btnExportCsv.disabled = !has;
  ui.btnExportJson.disabled = !has;
  ui.btnClearHist.disabled = !has;

  ui.historyList.innerHTML = '';
  if (!has) {
    const li = document.createElement('li');
    li.className = 'history__empty';
    li.textContent = 'Belum ada riwayat. Jalankan tes pertama Anda.';
    ui.historyList.appendChild(li);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const it of items.slice(0, 8)) {
    const li = document.createElement('li');
    li.className = 'history__item';

    const time = document.createElement('span');
    time.className = 'history__item-time';
    time.textContent = formatTime(it.ts);

    const main = document.createElement('span');
    main.className = 'history__item-main';
    const dl = it.download != null ? fmt(it.download) : '—';
    const ul = it.upload != null ? fmt(it.upload) : '—';
    const lat = it.latency != null ? fmt(it.latency) : '—';
    main.innerHTML = `↓ <strong>${dl}</strong> · ↑ <strong>${ul}</strong> · <strong>${lat}</strong> ms`;

    const meta = document.createElement('span');
    meta.className = 'history__item-main';
    meta.style.fontSize = '11px';
    meta.style.color = 'var(--text-3)';
    const jit = it.jitter != null ? `${fmt(it.jitter)} ms` : '—';
    meta.textContent = `Jitter ${jit}`;

    li.appendChild(time);
    li.appendChild(main);
    li.appendChild(meta);
    frag.appendChild(li);
  }
  ui.historyList.appendChild(frag);
}

function fmt(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toFixed(0);
  if (v >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

init();