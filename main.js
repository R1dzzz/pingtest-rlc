import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles.css';

import { SEND_RESULTS_TO_CLOUDFLARE, HISTORY_LIMIT } from './site.config.js';
import { $, $$, speedText, msText, bytesText, dateTimeText, uid, bufferbloat, isNum, escapeHtml } from './util.js';
import { t, onLangChange, applyDom, getLang } from './i18n.js';
import { cssVar, onSettingsChange } from './settings.js';
import { playSound } from './sound.js';
import { createGauge } from './gauge.js';
import { Session, PROFILES, loadEngine } from './engine.js';
import { lineChart } from './charts.js';
import { renderNetInfo, watchNetInfo, readNetInfo } from './netinfo.js';
import {
  loadHistory, addEntry, removeEntry, clearHistory, isStorageAvailable,
  loadPrefs, savePrefs, toCSV, toJSON, downloadText, stamp,
} from './history.js';
import {
  initShell, isMember, getUser, requireMember, onAuthChange, setBusyCheck, toast, openAuth,
  openDialog, closeDialog, wireDialog, refreshLocks,
} from './shell.js';
import { listResults, insertResult, insertMany, deleteResult, deleteAllResults } from './cloud.js';
import { renderShareImage, renderHistoryImage, historyStats, canWebShareFiles, canCopyImage } from './share.js';

initShell();

const els = {
  gauge: $('#gauge'), go: $('#btn-go'), cancel: $('#btn-cancel'), retry: $('#btn-retry'), share: $('#btn-share'),
  status: $('#status'), progress: $('#progress'), bar: $('#bar'), hint: $('#profile-hint'),
  m: { down: $('#m-down'), up: $('#m-up'), lat: $('#m-lat'), jit: $('#m-jit'), bytes: $('#m-bytes'), dur: $('#m-dur') },
  t: { down: $('#t-down'), up: $('#t-up'), lat: $('#t-lat'), jit: $('#t-jit') },
};

const gauge = createGauge(els.gauge);
let state = 'idle';
let session = null;
let current = null; // snapshot terakhir (untuk grafik/diagnostik)
let focusDir = 'down';
let lastEntry = null; // hasil tes terakhir yang selesai (untuk berbagi)
let localHistory = loadHistory(); // riwayat di perangkat (Guest, atau sisa sebelum diunggah)
let history = localHistory;
let cloudLoading = false;
let cloudError = false;
let chartKind = 'thr';
let destroyChart = () => {};
let statusFn = () => t('status.ready');
let noteKey = '';
const tagState = { down: 'wait', up: 'wait', lat: 'wait', jit: 'wait' };

setBusyCheck(() => state === 'running');

/* ---------- Profil ---------- */
const prefs = loadPrefs();
const conn0 = readNetInfo();
let profile = PROFILES[prefs.profile] ? prefs.profile : 'hemat';
function paintProfile() {
  $$('input[name=profile]').forEach((i) => { i.checked = i.value === profile; });
  els.hint.textContent = t(`profile.hint.${profile}`);
}
function setProfile(p) {
  profile = p;
  paintProfile();
  savePrefs({ ...loadPrefs(), profile: p });
}
$$('input[name=profile]').forEach((i) => i.addEventListener('change', () => setProfile(i.value)));
paintProfile();

/* ---------- Tampilan ---------- */
function setStatus(fn) { statusFn = fn; els.status.textContent = fn(); }
function setState(s) {
  state = s;
  els.gauge.dataset.state = s;
  const running = s === 'running';
  els.go.hidden = s !== 'idle';
  els.cancel.hidden = !running;
  els.retry.hidden = s === 'idle' || running;
  els.share.hidden = !(s === 'done' && lastEntry);
  els.progress.hidden = !running;
  $$('input[name=profile]').forEach((i) => { i.disabled = running; });
  gauge.showReadout(s !== 'idle');
}

function paintTags() {
  for (const k of ['down', 'up', 'lat', 'jit']) {
    const st = tagState[k];
    els.t[k].textContent = t(`tag.${st}`);
    els.t[k].dataset.k = st === 'live' || st === 'measuring' ? 'live' : st === 'done' ? 'ok' : st === 'na' ? 'na' : '';
  }
}
function setTag(key, st) { tagState[key] = st; paintTags(); }

function paintGaugeTexts() {
  gauge.setLabel(t(focusDir === 'down' ? 'gauge.down' : 'gauge.up'));
  gauge.setNote(noteKey ? t(noteKey) : '');
}

function setFocus(dir, animate = true) {
  focusDir = dir;
  els.gauge.dataset.dir = dir;
  $$('.row[data-focus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === dir)));
  paintGaugeTexts();
  const v = current ? (dir === 'down' ? current.download : current.upload) : null;
  if (animate) gauge.setValue(isNum(v) ? v : null);
}
$$('.row[data-focus]').forEach((b) => b.addEventListener('click', () => {
  if (state === 'running') return;
  setFocus(b.dataset.focus);
}));

function resetUI() {
  current = null;
  noteKey = '';
  for (const k of ['down', 'up', 'lat', 'jit']) tagState[k] = 'wait';
  paintTags();
  els.m.down.textContent = els.m.up.textContent = els.m.lat.textContent = els.m.jit.textContent = '—';
  els.m.bytes.textContent = '—';
  els.m.dur.textContent = '—';
  els.bar.style.width = '0%';
  gauge.reset();
  setFocus('down', false);
  renderDiagnostics();
  renderChart();
}

function paintMetrics(s, final) {
  const put = (key, node, val, fmt) => {
    node.textContent = fmt(val);
    if (isNum(val)) setTag(key, final ? 'done' : 'live');
    else setTag(key, final ? 'na' : 'measuring');
  };
  put('down', els.m.down, s.download, speedText);
  put('up', els.m.up, s.upload, speedText);
  put('lat', els.m.lat, s.latency, msText);
  put('jit', els.m.jit, s.jitter, msText);
  els.m.bytes.textContent = s.bytes > 0 ? '≈ ' + bytesText(s.bytes) : '—';
}

/* ---------- Diagnostik ---------- */
function renderDiagnostics() {
  const s = current;
  const bars = $('#lat-bars');
  const rows = [
    [t('dlat.idle'), s && s.latency, s && s.jitter, '--text'],
    [t('dlat.down'), s && s.downLatency, s && s.downJitter, '--dl'],
    [t('dlat.up'), s && s.upLatency, s && s.upJitter, '--ul'],
  ];
  const max = Math.max(1, ...rows.map((r) => (isNum(r[1]) ? r[1] : 0)));
  bars.innerHTML = rows.map(([name, v, j, cv]) => {
    const w = isNum(v) ? Math.max(3, (v / max) * 100) : 0;
    const val = isNum(v) ? `${msText(v)} ms` : t('dlat.na');
    const jit = isNum(j) ? t('dlat.jitter', { v: msText(j) }) : '';
    return `<div class="bar-row"><div class="bar-top"><span>${escapeHtml(name)}</span><span class="mono">${escapeHtml(val)}<small>${escapeHtml(jit)}</small></span></div><div class="bar-track"><i style="width:${w}%;background:var(${cv})"></i></div></div>`;
  }).join('');
  if (s && state !== 'running' && !isNum(s.downLatency) && !isNum(s.upLatency)) {
    bars.insertAdjacentHTML('beforeend', `<p class="fine">${escapeHtml(t('dlat.unavailable'))}</p>`);
  }

  const bb = s ? bufferbloat(s.latency, s.downLatency, s.upLatency) : null;
  const g = $('#bloat-grade');
  g.textContent = bb ? bb.grade : '—';
  g.dataset.grade = bb ? bb.grade[0] : '';
  $('#bloat-title').textContent = bb
    ? t('bb.title', { label: t(`bb.l.${bb.grade}`), ms: msText(bb.increase) })
    : t('bb.none');
  $('#bloat-desc').textContent = bb
    ? t('bb.desc', { desc: t(`bb.d.${bb.grade}`), loaded: msText(bb.loaded), idle: msText(s.latency) })
    : s && state !== 'running' ? t('bb.unavailable') : t('bb.prompt');
}

/* ---------- Grafik ---------- */
const fmtY = (v) => (v >= 100 ? v.toFixed(0) : String(+v.toFixed(1)));
function renderChart() {
  destroyChart();
  const host = $('#chart');
  const readout = $('#chart-readout');
  const desc = $('#chart-desc');
  const col = { down: cssVar('--dl'), up: cssVar('--ul'), idle: cssVar('--text') };
  if (chartKind === 'thr') {
    desc.textContent = t('chart.thr.desc');
    const pts = (a) => (a || []).map((p) => ({ x: p.t, y: p.mbps, label: t('chart.pt.req', { t: p.t.toFixed(1), size: bytesText(p.bytes) }) }));
    destroyChart = lineChart(host, readout, {
      title: t('chart.title.thr'),
      series: [
        { name: t('chart.s.down'), color: col.down, points: pts(current && current.dlPoints) },
        { name: t('chart.s.up'), color: col.up, points: pts(current && current.ulPoints) },
      ],
      xTitle: t('chart.x.sec'), yUnit: 'Mbps', yFormat: fmtY, xFormat: (v) => v.toFixed(0), emptyText: t('chart.empty.thr'),
    });
  } else if (chartKind === 'lat') {
    desc.textContent = t('chart.lat.desc');
    const pts = (a) => (a || []).map((y, i) => ({ x: i + 1, y, label: t('chart.pt.sample', { n: i + 1 }) }));
    destroyChart = lineChart(host, readout, {
      title: t('chart.title.lat'),
      series: [
        { name: t('chart.s.idle'), color: col.idle, points: pts(current && current.latPoints) },
        { name: t('dlat.down'), color: col.down, points: pts(current && current.downLatPoints) },
        { name: t('dlat.up'), color: col.up, points: pts(current && current.upLatPoints) },
      ],
      xTitle: t('chart.x.sample'), yUnit: 'ms', yFormat: fmtY, emptyText: t('chart.empty.lat'),
    });
  } else {
    desc.textContent = t('chart.his.desc');
    const asc = history.slice().reverse();
    const mk = (key) => asc.map((e, i) => ({ x: i + 1, y: e[key], label: dateTimeText(e.ts) })).filter((p) => isNum(p.y));
    destroyChart = lineChart(host, readout, {
      title: t('chart.title.his'),
      series: [
        { name: t('chart.s.down'), color: col.down, points: mk('download') },
        { name: t('chart.s.up'), color: col.up, points: mk('upload') },
      ],
      xTitle: t('chart.x.test'), yUnit: 'Mbps', yFormat: fmtY, emptyText: t('chart.empty.his'),
    });
  }
}
const tabs = $$('[role=tab]');
tabs.forEach((tb) => {
  tb.addEventListener('click', () => selectTab(tb));
  tb.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(tb);
    let n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    if (n) { e.preventDefault(); selectTab(n); n.focus(); }
  });
});
function selectTab(tb) {
  chartKind = tb.dataset.chart;
  tabs.forEach((x) => { x.setAttribute('aria-selected', String(x === tb)); x.tabIndex = x === tb ? 0 : -1; });
  $('#chart').setAttribute('aria-labelledby', tb.id);
  renderChart();
}
let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderChart, 150); });

/* ---------- Riwayat ---------- */
const HEART_SHARE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 16.1c-.8 0-1.5.3-2 .8l-7-4.1c.1-.2.1-.5.1-.7s0-.5-.1-.7l6.9-4c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .2 0 .5.1.7l-6.9 4A3 3 0 1 0 6 15c.8 0 1.5-.3 2.1-.8l7.1 4.1c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 2.9-2.8z"/></svg>';

function renderHistory() {
  const member = isMember();
  const ol = $('#history');
  $('#his-lede').textContent = member ? t('his.lede.member') : t('his.lede.guest', { n: HISTORY_LIMIT });
  $('#his-gate').hidden = member;
  $('#his-gate-text').textContent = t('his.gate');
  const importable = member && localHistory.length > 0;
  $('#his-import-box').hidden = !importable;
  if (importable) $('#his-import-text').textContent = t('his.import.text', { n: localHistory.length });
  const warn = $('#his-warn');
  const msg = cloudLoading ? t('his.loading') : cloudError ? t('his.cloudError') : !member && !isStorageAvailable() ? t('his.warn.storage') : '';
  warn.hidden = !msg;
  warn.textContent = msg;
  $('#his-empty').hidden = history.length > 0 || cloudLoading;
  ['#exp-csv', '#exp-json', '#his-share'].forEach((s) => { $(s).disabled = member && history.length === 0; });
  $('#his-clear').disabled = history.length === 0;
  ol.innerHTML = history.map((e) => {
    const d = dateTimeText(e.ts);
    return `
    <li data-id="${escapeHtml(e.id)}">
      <div class="h-when">${escapeHtml(d)}<span>${e.profile === 'hemat' ? t('his.p.hemat') : t('his.p.standar')}${e.partial ? ' · ' + t('his.partial') : ''}</span></div>
      <div class="h-vals">
        <span class="dl"><b>${speedText(e.download)}</b> ↓ Mbps</span>
        <span class="ul"><b>${speedText(e.upload)}</b> ↑ Mbps</span>
        <span><b>${msText(e.latency)}</b> ms</span>
        <span>jitter <b>${msText(e.jitter)}</b></span>
        ${e.bloatGrade ? `<span>${t('his.bloat')} <b>${escapeHtml(e.bloatGrade)}</b></span>` : ''}
      </div>
      <div class="h-act">
        <button class="x" type="button" data-act="share" data-member aria-label="${escapeHtml(t('his.share.item', { d }))}">${HEART_SHARE}</button>
        <button class="x" type="button" data-act="del" aria-label="${escapeHtml(t('his.del.item', { d }))}">✕</button>
      </div>
    </li>`;
  }).join('');
  refreshLocks();
}

async function loadCloud() {
  cloudLoading = true; cloudError = false;
  renderHistory();
  try {
    history = await listResults(HISTORY_LIMIT);
  } catch {
    cloudError = true;
    history = [];
  }
  cloudLoading = false;
  renderHistory();
  if (chartKind === 'his') renderChart();
}

onAuthChange(({ member, changed }) => {
  if (!changed) return;
  if (member) {
    localHistory = loadHistory();
    loadCloud();
  } else {
    cloudError = false; cloudLoading = false;
    localHistory = loadHistory();
    history = localHistory;
    renderHistory();
    if (chartKind === 'his') renderChart();
  }
  setState(state);
});

$('#history').addEventListener('click', async (ev) => {
  const b = ev.target.closest('button.x');
  if (!b) return;
  const id = b.closest('li').dataset.id;
  const entry = history.find((e) => e.id === id);
  if (b.dataset.act === 'share') {
    if (entry) requireMember(t('gate.share'), () => openShare(entry));
    return;
  }
  if (isMember()) {
    try { await deleteResult(id); } catch { toast(t('his.cloudError')); return; }
    history = history.filter((e) => e.id !== id);
  } else {
    history = removeEntry(id);
    localHistory = history;
  }
  renderHistory();
  if (chartKind === 'his') renderChart();
});

$('#his-clear').addEventListener('click', async () => {
  if (!history.length) return;
  if (isMember()) {
    if (!window.confirm(t('his.clear.confirmCloud'))) return;
    try { await deleteAllResults(getUser().id); } catch { toast(t('his.cloudError')); return; }
    history = [];
  } else {
    if (!window.confirm(t('his.clear.confirm'))) return;
    history = clearHistory();
    localHistory = history;
  }
  renderHistory();
  if (chartKind === 'his') renderChart();
});

$('#his-login').addEventListener('click', () => openAuth({ reason: false, mode: 'login' }));

$('#his-import').addEventListener('click', async () => {
  const n = localHistory.length;
  if (!n || !isMember()) return;
  if (!window.confirm(t('his.import.confirm', { n }))) return;
  try {
    await insertMany(localHistory.slice().reverse());
    localHistory = clearHistory();
    toast(t('his.import.done', { n }));
    await loadCloud();
  } catch {
    toast(t('his.import.fail'));
  }
});

async function fullHistory() {
  if (!isMember()) return history;
  try { return await listResults(1000); } catch { toast(t('his.exportFail')); return null; }
}

async function doExport(kind) {
  const list = await fullHistory();
  if (!list) return;
  const csv = kind === 'csv';
  const name = `pingtest-rlc-${stamp()}.${csv ? 'csv' : 'json'}`;
  downloadText(name, csv ? toCSV(list) : toJSON(list), csv ? 'text/csv;charset=utf-8' : 'application/json');
  toast(t('his.exported', { f: name }));
}
$('#exp-csv').addEventListener('click', () => requireMember(t('gate.export'), () => doExport('csv')));
$('#exp-json').addEventListener('click', () => requireMember(t('gate.export'), () => doExport('json')));

$('#his-share').addEventListener('click', () => requireMember(t('gate.shareHis'), async () => {
  const list = await fullHistory();
  if (!list) return;
  if (!list.length) { toast(t('his.empty')); return; }
  openHistoryShare(list);
}));

/* ---------- Bagikan hasil sebagai PNG ---------- */
let shareUrl = null;
function buildShareDialog() {
  const d = document.createElement('dialog');
  d.className = 'dlg'; d.id = 'dlg-share'; d.setAttribute('aria-labelledby', 'share-title');
  d.innerHTML = `
    <div class="dlg-in">
      <button type="button" class="dlg-x" data-close data-i18n-attr="aria-label:auth.close" aria-label="Tutup">✕</button>
      <h2 id="share-title" data-i18n="share.title"></h2>
      <img id="share-img" class="share-img" alt="" width="540" height="675">
      <p class="fine" id="share-msg" role="status"></p>
      <div class="share-actions">
        <button class="btn" type="button" id="sh-native" hidden data-i18n="share.native"></button>
        <button class="btn ghost" type="button" id="sh-dl" data-i18n="share.download"></button>
        <button class="btn ghost" type="button" id="sh-copy" hidden data-i18n="share.copy"></button>
      </div>
    </div>`;
  document.body.append(d);
  applyDom(d);
  wireDialog(d);
  d.addEventListener('close', () => { if (shareUrl) { URL.revokeObjectURL(shareUrl); shareUrl = null; } $('#share-img').removeAttribute('src'); });
  return d;
}

async function openShare(entry) {
  return openImageShare({
    render: () => renderShareImage(entry), titleKey: 'share.title', altKey: 'share.alt', stampName: 'result',
    text: () => t('share.text', { down: speedText(entry.download), up: speedText(entry.upload), lat: msText(entry.latency), jit: msText(entry.jitter) }),
  });
}

async function openHistoryShare(list) {
  const st = historyStats(list);
  return openImageShare({
    render: () => renderHistoryImage(list), titleKey: 'share.histTitle', altKey: 'share.histAlt', stampName: 'history',
    text: () => t('share.histText', { n: st.n, down: speedText(st.down), up: speedText(st.up), lat: msText(st.lat) }),
  });
}

async function openImageShare({ render, titleKey, altKey, stampName, text }) {
  const d = $('#dlg-share') || buildShareDialog();
  const msg = $('#share-msg', d);
  const img = $('#share-img', d);
  const title = $('#share-title', d);
  title.setAttribute('data-i18n', titleKey);
  title.textContent = t(titleKey);
  msg.textContent = '';
  img.alt = t(altKey);
  img.removeAttribute('src');
  openDialog(d);
  let blob;
  try {
    blob = await render();
  } catch {
    msg.textContent = t('share.fail');
    return;
  }
  if (shareUrl) URL.revokeObjectURL(shareUrl);
  shareUrl = URL.createObjectURL(blob);
  img.src = shareUrl;
  const fname = `pingtest-rlc-${stampName}-${stamp()}.png`;
  const file = new File([blob], fname, { type: 'image/png' });
  const native = $('#sh-native', d);
  const copy = $('#sh-copy', d);
  native.hidden = !canWebShareFiles(file);
  copy.hidden = !canCopyImage();
  native.onclick = async () => {
    try {
      await navigator.share({ files: [file], title: 'PingTest by RLC', text: text() });
      msg.textContent = t('share.sharedOk');
    } catch (e) { if (e && e.name !== 'AbortError') msg.textContent = t('share.fail'); }
  };
  $('#sh-dl', d).onclick = () => {
    const a = document.createElement('a');
    a.href = shareUrl; a.download = fname; document.body.append(a); a.click(); a.remove();
    msg.textContent = t('share.downloaded');
  };
  copy.onclick = async () => {
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); msg.textContent = t('share.copied'); }
    catch { msg.textContent = t('share.copyFail'); }
  };
}
els.share.addEventListener('click', () => { if (lastEntry) requireMember(t('gate.share'), () => openShare(lastEntry)); });

/* ---------- Menjalankan tes ---------- */
const ACTIVITY = { connect: 'status.connect', latency: 'status.latency', download: 'status.download', upload: 'status.upload' };

function entryFrom(snap, partial, durationMs) {
  const bb = bufferbloat(snap.latency, snap.downLatency, snap.upLatency);
  const r = (v, d) => (isNum(v) ? +v.toFixed(d) : null);
  return {
    id: uid(), ts: new Date().toISOString(), profile, v: 1,
    download: r(snap.download, 2), upload: r(snap.upload, 2),
    latency: r(snap.latency, 1), jitter: r(snap.jitter, 1),
    downLatency: r(snap.downLatency, 1), upLatency: r(snap.upLatency, 1),
    downJitter: r(snap.downJitter, 1), upJitter: r(snap.upJitter, 1),
    bloat: bb ? +bb.increase.toFixed(1) : null, bloatGrade: bb ? bb.grade : null,
    bytes: snap.bytes || null, durationMs: isNum(durationMs) ? Math.round(durationMs) : null, partial,
    net: (({ effectiveType, downlink, rtt, saveData, type }) => ({ effectiveType, downlink, rtt, saveData, type }))(readNetInfo()),
  };
}

async function saveResult(entry) {
  // Member: simpan ke cloud; jika gagal, simpan lokal agar hasil tidak hilang. Guest: simpan lokal.
  if (isMember()) {
    try {
      const saved = await insertResult(entry);
      history = [saved, ...history].slice(0, HISTORY_LIMIT);
      renderHistory();
      if (chartKind === 'his') renderChart();
      return 'cloud';
    } catch {
      localHistory = addEntry(entry);
      renderHistory();
      return 'cloudFail';
    }
  }
  localHistory = addEntry(entry);
  history = localHistory;
  renderHistory();
  if (chartKind === 'his') renderChart();
  return 'local';
}

function start() {
  if (state === 'running') return;
  lastEntry = null;
  resetUI();
  setState('running');
  paintGaugeTexts();
  setStatus(() => t(ACTIVITY.connect));
  playSound('start');
  const t0 = performance.now();
  const tick = setInterval(() => {
    if (state !== 'running') { clearInterval(tick); return; }
    els.m.dur.textContent = ((performance.now() - t0) / 1000).toFixed(0) + ' ' + t('unit.sec');
  }, 500);

  session = new Session(profile, {
    onUpdate({ snap, activity, progress }) {
      current = snap;
      paintMetrics(snap, false);
      els.bar.style.width = Math.round(progress * 100) + '%';
      setStatus(() => t(ACTIVITY[activity] || ACTIVITY.connect));
      if (activity === 'download' || activity === 'upload') {
        const dir = activity === 'download' ? 'down' : 'up';
        els.gauge.dataset.dir = dir;
        focusDir = dir;
        paintGaugeTexts();
        const v = dir === 'down' ? snap.download : snap.upload;
        if (isNum(v)) gauge.setValue(v);
        $$('.row[data-focus]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.focus === dir)));
      }
      renderDiagnostics();
      if (chartKind !== 'his') renderChart();
    },
    async onDone({ snap, partial, note, durationMs }) {
      clearInterval(tick);
      current = snap;
      const entry = entryFrom(snap, partial, durationMs);
      lastEntry = entry;
      setState('done');
      playSound('done');
      els.bar.style.width = '100%';
      paintMetrics(snap, true);
      els.m.dur.textContent = isNum(durationMs) ? (durationMs / 1000).toFixed(1) + ' ' + t('unit.sec') : '—';
      noteKey = partial ? 'gauge.partial' : '';
      setFocus('down');
      renderDiagnostics();
      renderChart();
      const fast = profile === 'hemat' && isNum(snap.download) && snap.download > 60;
      let saveNote = '';
      const base = () => (partial ? t('status.donePartial', { note: t(note || 'note.partial') }) : t('status.done')) + (fast ? t('status.fast') : '');
      setStatus(() => base());
      const where = await saveResult(entry);
      saveNote = where;
      setStatus(() => base() + (saveNote === 'cloud' ? t('status.cloudSaved') : saveNote === 'cloudFail' ? t('status.cloudFail') : ''));
    },
    onFail({ reason }) {
      clearInterval(tick);
      setState('failed');
      playSound('error');
      const keep = current;
      noteKey = 'gauge.failed';
      gauge.setValue(null);
      paintGaugeTexts();
      setStatus(() => t('status.failed', { reason: t(reason.key, reason.params) }));
      if (keep) paintMetrics(keep, true);
      else for (const k of ['down', 'up', 'lat', 'jit']) setTag(k, 'na');
      renderDiagnostics();
    },
    onCancel() {
      clearInterval(tick);
      setState('cancelled');
      current = null;
      resetUI();
      setStatus(() => t('status.cancelled'));
    },
  });
  session.start();
}

els.go.addEventListener('click', start);
els.retry.addEventListener('click', start);
els.cancel.addEventListener('click', () => { if (session) session.cancel(); setState('idle'); });

/* ---------- Teks yang bergantung bahasa / tema ---------- */
function paintStaticTexts() {
  $('#consent').innerHTML = t(SEND_RESULTS_TO_CLOUDFLARE ? 'consent.cf' : 'consent.nocf');
  $('#privacy-cf').textContent = t(SEND_RESULTS_TO_CLOUDFLARE ? 'privacy.cf' : 'privacy.nocf');
}
function paintConn() {
  const n = renderNetInfo($('#conn'));
  $('#conn-note').textContent = t(n.supported ? 'conn.note.yes' : 'conn.note.no');
}

function repaintAll() {
  paintProfile();
  paintStaticTexts();
  paintConn();
  paintTags();
  paintGaugeTexts();
  els.status.textContent = statusFn();
  renderDiagnostics();
  renderChart();
  renderHistory();
  if (state === 'running') els.m.dur.textContent = els.m.dur.textContent.replace(/\s\S+$/, ' ' + t('unit.sec'));
}
onLangChange(repaintAll);
onSettingsChange(() => { renderDiagnostics(); renderChart(); });
watchNetInfo(paintConn);

/* ---------- Inisialisasi ---------- */
paintStaticTexts();
paintConn();
renderHistory();
resetUI();
setState('idle');
setStatus(() => t('status.ready'));
void getLang;

// Muat mesin pengukur saat browser idle agar tombol MULAI langsung responsif (kecuali mode hemat data aktif).
if (!conn0.saveData) {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
  idle(() => { loadEngine().catch(() => {}); });
}
