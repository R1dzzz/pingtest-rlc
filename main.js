import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles.css';

import { SEND_RESULTS_TO_CLOUDFLARE, HISTORY_LIMIT } from './site.config.js';
import { $, $$, speedText, msText, bytesText, dateTimeText, uid, bufferbloat, isNum, escapeHtml } from './util.js';
import { createGauge } from './gauge.js';
import { Session, PROFILES, loadEngine } from './engine.js';
import { lineChart } from './charts.js';
import { renderNetInfo, watchNetInfo, readNetInfo } from './netinfo.js';
import {
  loadHistory, addEntry, removeEntry, clearHistory, isStorageAvailable,
  loadPrefs, savePrefs, toCSV, toJSON, downloadText, stamp,
} from './history.js';

const COLORS = { down: '#c6f432', up: '#5ec4ff', idle: '#eef0f2' };

const els = {
  gauge: $('#gauge'), go: $('#btn-go'), cancel: $('#btn-cancel'), retry: $('#btn-retry'),
  status: $('#status'), progress: $('#progress'), bar: $('#bar'), hint: $('#profile-hint'),
  m: { down: $('#m-down'), up: $('#m-up'), lat: $('#m-lat'), jit: $('#m-jit'), bytes: $('#m-bytes'), dur: $('#m-dur') },
  t: { down: $('#t-down'), up: $('#t-up'), lat: $('#t-lat'), jit: $('#t-jit') },
};

const gauge = createGauge(els.gauge);
let state = 'idle';
let session = null;
let current = null; // snapshot terakhir (untuk grafik/diagnostik)
let focusDir = 'down';
let history = loadHistory();
let chartKind = 'thr';
let destroyChart = () => {};

/* ---------- Profil ---------- */
const prefs = loadPrefs();
const conn0 = readNetInfo();
let profile = PROFILES[prefs.profile] ? prefs.profile : 'hemat';
function setProfile(p) {
  profile = p;
  $$('input[name=profile]').forEach((i) => { i.checked = i.value === p; });
  els.hint.textContent = PROFILES[p].hint;
  savePrefs({ ...loadPrefs(), profile: p });
}
$$('input[name=profile]').forEach((i) => i.addEventListener('change', () => setProfile(i.value)));
setProfile(profile);

/* ---------- Tampilan ---------- */
function setStatus(t) { els.status.textContent = t; }
function setState(s) {
  state = s;
  els.gauge.dataset.state = s;
  const running = s === 'running';
  els.go.hidden = s !== 'idle';
  els.cancel.hidden = !running;
  els.retry.hidden = s === 'idle' || running;
  els.progress.hidden = !running;
  $$('input[name=profile]').forEach((i) => { i.disabled = running; });
  gauge.showReadout(s !== 'idle');
}

function setTag(key, text, kind) {
  const n = els.t[key];
  n.textContent = text;
  n.dataset.k = kind || '';
}

function setFocus(dir, animate = true) {
  focusDir = dir;
  els.gauge.dataset.dir = dir;
  $$('.row[data-focus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === dir)));
  gauge.setLabel(dir === 'down' ? 'DOWNLOAD' : 'UPLOAD');
  const v = current ? (dir === 'down' ? current.download : current.upload) : null;
  if (animate) gauge.setValue(isNum(v) ? v : null);
}
$$('.row[data-focus]').forEach((b) => b.addEventListener('click', () => {
  if (state === 'running') return;
  setFocus(b.dataset.focus);
}));

function resetUI() {
  current = null;
  for (const k of ['down', 'up', 'lat', 'jit']) { setTag(k, 'menunggu'); }
  els.m.down.textContent = els.m.up.textContent = els.m.lat.textContent = els.m.jit.textContent = '—';
  els.m.bytes.textContent = '—';
  els.m.dur.textContent = '—';
  els.bar.style.width = '0%';
  gauge.reset();
  setFocus('down', false);
  gauge.setNote('');
  renderDiagnostics();
  renderChart();
}

function paintMetrics(s, final) {
  const put = (key, node, val, fmt) => {
    node.textContent = fmt(val);
    if (isNum(val)) setTag(key, final ? 'selesai' : 'sementara', final ? 'ok' : 'live');
    else setTag(key, final ? 'tidak tersedia' : 'mengukur…', final ? 'na' : 'live');
  };
  put('down', els.m.down, s.download, speedText);
  put('up', els.m.up, s.upload, speedText);
  put('lat', els.m.lat, s.latency, msText);
  put('jit', els.m.jit, s.jitter, msText);
  els.m.bytes.textContent = s.bytes > 0 ? '≈ ' + bytesText(s.bytes) : '—';
}

const ACTIVITY = {
  connect: 'Menghubungi server Cloudflare…',
  latency: 'Mengukur latency…',
  download: 'Mengukur download…',
  upload: 'Mengukur upload…',
};

/* ---------- Diagnostik ---------- */
function renderDiagnostics() {
  const s = current;
  const bars = $('#lat-bars');
  const rows = [
    ['Idle', s && s.latency, s && s.jitter, 'idle'],
    ['Saat download', s && s.downLatency, s && s.downJitter, 'down'],
    ['Saat upload', s && s.upLatency, s && s.upJitter, 'up'],
  ];
  const max = Math.max(1, ...rows.map((r) => (isNum(r[1]) ? r[1] : 0)));
  bars.innerHTML = rows.map(([name, v, j, k]) => {
    const w = isNum(v) ? Math.max(3, (v / max) * 100) : 0;
    const val = isNum(v) ? `${msText(v)} ms` : 'tidak tersedia';
    const jit = isNum(j) ? ` · jitter ${msText(j)} ms` : '';
    return `<div class="bar-row"><div class="bar-top"><span>${name}</span><span class="mono">${val}<small>${jit}</small></span></div><div class="bar-track"><i style="width:${w}%;background:${COLORS[k]}"></i></div></div>`;
  }).join('');
  if (s && state !== 'running' && !isNum(s.downLatency) && !isNum(s.upLatency)) {
    bars.insertAdjacentHTML('beforeend', '<p class="fine">Latency terbebani tidak tersedia: transfer terlalu singkat untuk membebani koneksi (umum pada koneksi sangat cepat dengan profil Hemat data) atau pengukurannya gagal.</p>');
  }

  const bb = s ? bufferbloat(s.latency, s.downLatency, s.upLatency) : null;
  const g = $('#bloat-grade');
  g.textContent = bb ? bb.grade : '—';
  g.dataset.grade = bb ? bb.grade[0] : '';
  $('#bloat-title').textContent = bb ? `${bb.label} · naik ${msText(bb.increase)} ms saat jaringan terbebani` : 'Belum ada data';
  $('#bloat-desc').textContent = bb
    ? `${bb.desc} Estimasi dari selisih HTTP latency terbebani (${msText(bb.loaded)} ms) dan idle (${msText(s.latency)} ms).`
    : s && state !== 'running'
      ? 'Tidak tersedia: butuh latency idle dan latency terbebani yang sama-sama berhasil diukur.'
      : 'Jalankan tes untuk melihat estimasi.';
}

/* ---------- Grafik ---------- */
function renderChart() {
  destroyChart();
  const host = $('#chart');
  const readout = $('#chart-readout');
  const desc = $('#chart-desc');
  if (chartKind === 'thr') {
    desc.textContent = 'Kecepatan tiap permintaan selama tes ini (Mbps). Permintaan kecil cenderung lebih lambat karena TCP belum "panas".';
    const pts = (a) => (a || []).map((p) => ({ x: p.t, y: p.mbps, label: `${p.t.toFixed(1)} dtk · ${bytesText(p.bytes)}` }));
    destroyChart = lineChart(host, readout, {
      title: 'Throughput per permintaan',
      series: [
        { name: 'Download', color: COLORS.down, points: pts(current && current.dlPoints) },
        { name: 'Upload', color: COLORS.up, points: pts(current && current.ulPoints) },
      ],
      xTitle: 'detik', yUnit: 'Mbps', yFormat: (v) => (v >= 100 ? v.toFixed(0) : String(+v.toFixed(1))),
      xFormat: (v) => v.toFixed(0), emptyText: 'Jalankan tes untuk melihat grafik throughput.',
    });
  } else if (chartKind === 'lat') {
    desc.textContent = 'Sampel HTTP latency (ms) berurutan: idle vs saat download/upload berjalan.';
    const pts = (a) => (a || []).map((y, i) => ({ x: i + 1, y, label: `sampel #${i + 1}` }));
    destroyChart = lineChart(host, readout, {
      title: 'Latency per sampel',
      series: [
        { name: 'Idle', color: COLORS.idle, points: pts(current && current.latPoints) },
        { name: 'Saat download', color: COLORS.down, points: pts(current && current.downLatPoints) },
        { name: 'Saat upload', color: COLORS.up, points: pts(current && current.upLatPoints) },
      ],
      xTitle: 'sampel ke-', yUnit: 'ms', yFormat: (v) => (v >= 100 ? v.toFixed(0) : String(+v.toFixed(1))),
      emptyText: 'Jalankan tes untuk melihat grafik latency.',
    });
  } else {
    desc.textContent = 'Tren hasil dari riwayat tes (terlama ke terbaru).';
    const asc = history.slice().reverse();
    const mk = (key) => asc.map((e, i) => ({ x: i + 1, y: e[key], label: dateTimeText(e.ts) })).filter((p) => isNum(p.y));
    destroyChart = lineChart(host, readout, {
      title: 'Tren riwayat',
      series: [
        { name: 'Download', color: COLORS.down, points: mk('download') },
        { name: 'Upload', color: COLORS.up, points: mk('upload') },
      ],
      xTitle: 'tes ke-', yUnit: 'Mbps', yFormat: (v) => (v >= 100 ? v.toFixed(0) : String(+v.toFixed(1))),
      emptyText: 'Belum ada riwayat untuk digambar.',
    });
  }
}
const tabs = $$('[role=tab]');
tabs.forEach((t) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(t);
    let n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    if (n) { e.preventDefault(); selectTab(n); n.focus(); }
  });
});
function selectTab(t) {
  chartKind = t.dataset.chart;
  tabs.forEach((x) => { x.setAttribute('aria-selected', String(x === t)); x.tabIndex = x === t ? 0 : -1; });
  $('#chart').setAttribute('aria-labelledby', t.id);
  renderChart();
}
let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderChart, 150); });

/* ---------- Riwayat ---------- */
function renderHistory() {
  const ol = $('#history');
  $('#his-empty').hidden = history.length > 0;
  $('#his-warn').hidden = isStorageAvailable();
  ['#exp-csv', '#exp-json', '#his-clear'].forEach((s) => { $(s).disabled = history.length === 0; });
  ol.innerHTML = history.map((e) => `
    <li data-id="${escapeHtml(e.id)}">
      <div class="h-when">${escapeHtml(dateTimeText(e.ts))}<span>${e.profile === 'hemat' ? 'Hemat data' : 'Standar'}${e.partial ? ' · parsial' : ''}</span></div>
      <div class="h-vals">
        <span class="dl"><b>${speedText(e.download)}</b> ↓ Mbps</span>
        <span class="ul"><b>${speedText(e.upload)}</b> ↑ Mbps</span>
        <span><b>${msText(e.latency)}</b> ms</span>
        <span>jitter <b>${msText(e.jitter)}</b></span>
        ${e.bloatGrade ? `<span>bloat <b>${escapeHtml(e.bloatGrade)}</b></span>` : ''}
      </div>
      <button class="x" type="button" aria-label="Hapus hasil ${escapeHtml(dateTimeText(e.ts))}">✕</button>
    </li>`).join('');
}
$('#history').addEventListener('click', (ev) => {
  const b = ev.target.closest('button.x');
  if (!b) return;
  history = removeEntry(b.closest('li').dataset.id);
  renderHistory();
  if (chartKind === 'his') renderChart();
});
$('#his-clear').addEventListener('click', () => {
  if (!history.length) return;
  if (window.confirm('Hapus semua riwayat tes dari browser ini?')) {
    history = clearHistory();
    renderHistory();
    if (chartKind === 'his') renderChart();
  }
});
$('#exp-csv').addEventListener('click', () => downloadText(`pingtest-rlc-${stamp()}.csv`, toCSV(history), 'text/csv;charset=utf-8'));
$('#exp-json').addEventListener('click', () => downloadText(`pingtest-rlc-${stamp()}.json`, toJSON(history), 'application/json'));

/* ---------- Menjalankan tes ---------- */
function start() {
  if (state === 'running') return;
  resetUI();
  setState('running');
  gauge.setLabel('DOWNLOAD');
  setStatus(ACTIVITY.connect);
  const t0 = performance.now();
  const tick = setInterval(() => {
    if (state !== 'running') { clearInterval(tick); return; }
    $('#m-dur').textContent = ((performance.now() - t0) / 1000).toFixed(0) + ' dtk';
  }, 500);

  session = new Session(profile, {
    onUpdate({ snap, activity, progress }) {
      current = snap;
      paintMetrics(snap, false);
      els.bar.style.width = Math.round(progress * 100) + '%';
      setStatus(ACTIVITY[activity] || ACTIVITY.connect);
      if (activity === 'download' || activity === 'upload') {
        const dir = activity === 'download' ? 'down' : 'up';
        els.gauge.dataset.dir = dir;
        focusDir = dir;
        gauge.setLabel(dir === 'down' ? 'DOWNLOAD' : 'UPLOAD');
        const v = dir === 'down' ? snap.download : snap.upload;
        if (isNum(v)) gauge.setValue(v);
        $$('.row[data-focus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === dir)));
      }
      renderDiagnostics();
      if (chartKind !== 'his') renderChart();
    },
    onDone({ snap, partial, note, durationMs }) {
      clearInterval(tick);
      current = snap;
      setState('done');
      els.bar.style.width = '100%';
      paintMetrics(snap, true);
      els.m.dur.textContent = isNum(durationMs) ? (durationMs / 1000).toFixed(1) + ' dtk' : '—';
      setFocus('down');
      const bb = bufferbloat(snap.latency, snap.downLatency, snap.upLatency);
      renderDiagnostics();
      renderChart();
      let msg = partial ? 'Tes selesai sebagian. ' + note : 'Tes selesai.';
      if (profile === 'hemat' && isNum(snap.download) && snap.download > 60) {
        msg += ' Koneksi Anda cepat; profil Hemat data memakai file maksimal 10 MB sehingga bisa mengukur lebih rendah. Pilih Standar untuk hasil lebih akurat.';
      }
      setStatus(msg);
      gauge.setNote(partial ? 'HASIL PARSIAL' : '');
      history = addEntry({
        id: uid(), ts: new Date().toISOString(), profile, v: 1,
        download: isNum(snap.download) ? +snap.download.toFixed(2) : null,
        upload: isNum(snap.upload) ? +snap.upload.toFixed(2) : null,
        latency: isNum(snap.latency) ? +snap.latency.toFixed(1) : null,
        jitter: isNum(snap.jitter) ? +snap.jitter.toFixed(1) : null,
        downLatency: isNum(snap.downLatency) ? +snap.downLatency.toFixed(1) : null,
        upLatency: isNum(snap.upLatency) ? +snap.upLatency.toFixed(1) : null,
        downJitter: isNum(snap.downJitter) ? +snap.downJitter.toFixed(1) : null,
        upJitter: isNum(snap.upJitter) ? +snap.upJitter.toFixed(1) : null,
        bloat: bb ? +bb.increase.toFixed(1) : null,
        bloatGrade: bb ? bb.grade : null,
        bytes: snap.bytes || null,
        durationMs: isNum(durationMs) ? Math.round(durationMs) : null,
        partial,
        net: (({ effectiveType, downlink, rtt, saveData, type }) => ({ effectiveType, downlink, rtt, saveData, type }))(readNetInfo()),
      });
      renderHistory();
      if (chartKind === 'his') renderChart();
    },
    onFail({ reason }) {
      clearInterval(tick);
      setState('failed');
      const keep = current;
      gauge.setValue(null);
      gauge.setNote('TES GAGAL');
      setStatus('Tes gagal: ' + reason);
      if (keep) paintMetrics(keep, true);
      else for (const k of ['down', 'up', 'lat', 'jit']) setTag(k, 'tidak tersedia', 'na');
      renderDiagnostics();
    },
    onCancel() {
      clearInterval(tick);
      setState('cancelled');
      current = null;
      resetUI();
      setStatus('Tes dibatalkan. Tidak ada hasil yang disimpan.');
    },
  });
  session.start();
}

els.go.addEventListener('click', start);
els.retry.addEventListener('click', start);
els.cancel.addEventListener('click', () => { if (session) session.cancel(); setState('idle'); });

/* ---------- Inisialisasi ---------- */
$('#privacy-cf').textContent = SEND_RESULTS_TO_CLOUDFLARE
  ? 'Cloudflare dapat mengumpulkan hasil tes untuk menghitung insight agregat kualitas internet. Alamat IP Anda tentu terlihat oleh server tujuan, seperti pada setiap koneksi internet.'
  : 'Pengiriman hasil ke Cloudflare untuk insight agregat dimatikan pada situs ini. Alamat IP Anda tetap terlihat oleh server pengukuran, seperti pada setiap koneksi internet.';
if (!SEND_RESULTS_TO_CLOUDFLARE) $('.consent').textContent = 'Tes mengirim permintaan ke server pengukuran Cloudflare. Hasil tidak dikirim untuk insight agregat.';

function paintConn() {
  const n = renderNetInfo($('#conn'));
  $('#conn-note').textContent = n.supported
    ? 'Nilai ini estimasi dari browser, bukan hasil tes, dan bisa berbeda dengan hasil di atas.'
    : 'Browser ini tidak menyediakan Network Information API (umum pada Safari dan Firefox). Hasil tes tidak terpengaruh.';
}
paintConn();
watchNetInfo(paintConn);

renderHistory();
resetUI();
setState('idle');

// Muat mesin pengukur saat browser idle agar tombol MULAI langsung responsif (kecuali mode hemat data aktif).
if (!conn0.saveData) {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  idle(() => { loadEngine().catch(() => {}); });
}
void HISTORY_LIMIT;
