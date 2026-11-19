// Pembungkus @cloudflare/speedtest. Semua angka berasal dari library (tidak ada simulasi).
import { SEND_RESULTS_TO_CLOUDFLARE } from './site.config.js';
import { isNum } from './util.js';

// Set pengukuran bawaan library v1.17.0 (ditulis eksplisit agar perilaku stabil).
const STANDARD = [
  { type: 'latency', numPackets: 1 },
  { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency', numPackets: 20 },
  { type: 'download', bytes: 1e5, count: 9 },
  { type: 'download', bytes: 1e6, count: 8 },
  { type: 'upload', bytes: 1e5, count: 8 },
  { type: 'upload', bytes: 1e6, count: 6 },
  { type: 'download', bytes: 1e7, count: 6 },
  { type: 'upload', bytes: 1e7, count: 4 },
  { type: 'download', bytes: 2.5e7, count: 4 },
  { type: 'upload', bytes: 2.5e7, count: 4 },
  { type: 'download', bytes: 1e8, count: 3 },
  { type: 'upload', bytes: 5e7, count: 3 },
  { type: 'download', bytes: 2.5e8, count: 2 },
];

// Hemat data: file terbesar 10 MB, batas atas teoretis ± 48 MB.
const SAVER = [
  { type: 'latency', numPackets: 1 },
  { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency', numPackets: 10 },
  { type: 'download', bytes: 1e5, count: 4 },
  { type: 'download', bytes: 1e6, count: 4 },
  { type: 'upload', bytes: 1e5, count: 4 },
  { type: 'upload', bytes: 1e6, count: 3 },
  { type: 'download', bytes: 1e7, count: 2 },
  { type: 'upload', bytes: 1e7, count: 2 },
];

export const PROFILES = {
  hemat: {
    id: 'hemat', label: 'Hemat data',
    hint: 'Maks. ± 48 MB. Cocok untuk kuota terbatas; kurang akurat untuk koneksi di atas ± 100 Mbps.',
    measurements: SAVER, abortRequestDuration: 12000, abortTestDuration: 60000,
  },
  standar: {
    id: 'standar', label: 'Standar',
    hint: 'Pengaturan bawaan Cloudflare. Pada koneksi cepat bisa memakai ratusan MB.',
    measurements: STANDARD, abortRequestDuration: 15000, abortTestDuration: 90000,
  },
};

let EngineClass = null;
export async function loadEngine() {
  if (!EngineClass) {
    const mod = await import('@cloudflare/speedtest');
    EngineClass = mod.default;
  }
  return EngineClass;
}

const num = (fn) => {
  try {
    const v = fn();
    return isNum(v) ? v : null;
  } catch {
    return null;
  }
};
const mbps = (bps) => (isNum(bps) ? bps / 1e6 : null);

function plannedCounts(measurements) {
  const p = { latency: 0, download: 0, upload: 0 };
  for (const m of measurements) {
    if (m.type === 'latency') p.latency += m.numPackets;
    else if (m.type === 'download' || m.type === 'upload') p[m.type] += m.count;
  }
  return p;
}

export function snapshotOf(results, t0) {
  const dlPts = (num(() => results.getDownloadBandwidthPoints().length) !== null ? results.getDownloadBandwidthPoints() : []);
  const ulPts = (num(() => results.getUploadBandwidthPoints().length) !== null ? results.getUploadBandwidthPoints() : []);
  const arr = (fn) => { try { const a = fn(); return Array.isArray(a) ? a.filter(isNum) : []; } catch { return []; } };
  const pts = (list) => list
    .filter((p) => isNum(p.bps))
    .map((p) => ({ t: Math.max(0, (new Date(p.measTime).getTime() - t0) / 1000), mbps: p.bps / 1e6, bytes: p.bytes, size: isNum(p.transferSize) ? p.transferSize : 0 }));
  const d = pts(dlPts);
  const u = pts(ulPts);
  const lat = arr(() => results.getUnloadedLatencyPoints());
  const dLat = arr(() => results.getDownLoadedLatencyPoints());
  const uLat = arr(() => results.getUpLoadedLatencyPoints());
  // Tanpa titik data nyata, library bisa mengembalikan 0; itu bukan hasil ukur -> dianggap tidak tersedia.
  const ifPts = (n, min, v) => (n >= min && isNum(v) ? v : null);
  return {
    download: ifPts(d.length, 1, mbps(num(() => results.getDownloadBandwidth()))),
    upload: ifPts(u.length, 1, mbps(num(() => results.getUploadBandwidth()))),
    latency: ifPts(lat.length, 1, num(() => results.getUnloadedLatency())),
    jitter: ifPts(lat.length, 2, num(() => results.getUnloadedJitter())),
    downLatency: ifPts(dLat.length, 1, num(() => results.getDownLoadedLatency())),
    downJitter: ifPts(dLat.length, 2, num(() => results.getDownLoadedJitter())),
    upLatency: ifPts(uLat.length, 1, num(() => results.getUpLoadedLatency())),
    upJitter: ifPts(uLat.length, 2, num(() => results.getUpLoadedJitter())),
    dlPoints: d,
    ulPoints: u,
    latPoints: lat,
    downLatPoints: dLat,
    upLatPoints: uLat,
    bytes: [...d, ...u].reduce((s, p) => s + p.size, 0),
  };
}

function describeError(msg, status) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Perangkat sedang offline. Periksa Wi-Fi atau data seluler lalu coba lagi.';
  }
  if (isNum(status) && status > 0) {
    return `Server pengukuran membalas HTTP ${status}. Mungkin dibatasi sementara atau diblokir jaringan Anda.`;
  }
  const m = String(msg || '').toLowerCase();
  if (m.includes('timing') || m.includes('timeout')) {
    return 'Permintaan terlalu lama atau data waktu dari browser tidak tersedia. Coba lagi dengan koneksi yang lebih stabil.';
  }
  return 'Tidak dapat menjangkau server pengukuran Cloudflare. Kemungkinan koneksi terputus atau diblokir (VPN, firewall sekolah, pemblokir iklan/DNS). Browser tidak memberi tahu penyebab pastinya.';
}

/**
 * Satu sesi tes. Callback:
 *  onStart(), onUpdate({snap, activity, progress}), onDone({snap, partial, durationMs, note}),
 *  onFail({reason}), onCancel()
 */
export class Session {
  constructor(profileId, cb) {
    this.profile = PROFILES[profileId] || PROFILES.hemat;
    this.cb = cb;
    this.engine = null;
    this.ended = false;
    this.errors = [];
    this.progress = 0;
    this.activity = 'connect';
    this.planned = plannedCounts(this.profile.measurements);
    this.t0 = 0;
    this._offline = () => this.fail('Koneksi terputus saat tes berjalan. Hasil tes dibatalkan agar tidak menyesatkan.');
  }

  async start() {
    this.t0 = Date.now();
    this.cb.onStart && this.cb.onStart();
    if (navigator.onLine === false) {
      this.fail('Perangkat sedang offline. Sambungkan ke internet lalu coba lagi.');
      return;
    }
    let Engine;
    try {
      Engine = await loadEngine();
    } catch {
      this.fail('Gagal memuat mesin pengukur. Periksa koneksi lalu muat ulang halaman.');
      return;
    }
    if (this.ended) return;

    const cfg = {
      autoStart: false,
      measurements: this.profile.measurements,
      abortRequestDuration: this.profile.abortRequestDuration,
      abortTestDuration: this.profile.abortTestDuration,
    };
    if (!SEND_RESULTS_TO_CLOUDFLARE) cfg.logAimApiUrl = null;

    try {
      this.engine = new Engine(cfg);
    } catch {
      this.fail('Mesin pengukur gagal diinisialisasi di browser ini.');
      return;
    }
    const e = this.engine;
    e.onResultsChange = ({ type }) => this._change(type);
    e.onFinish = (results) => this._finish(results);
    e.onError = (error, status) => { this.errors.push({ error: String(error), status }); };

    window.addEventListener('offline', this._offline);
    // Penjaga: jika 25 detik tidak ada hasil sama sekali, anggap gagal.
    this.watchdog = setTimeout(() => {
      if (!this.gotAny) this.fail(describeError(this.errors.length ? this.errors[0].error : '', this.errors.length ? this.errors[0].status : undefined));
    }, 25000);

    try {
      e.play();
    } catch {
      this.fail('Tes tidak dapat dimulai di browser ini.');
    }
  }

  _snap() {
    return snapshotOf(this.engine.results, this.t0);
  }

  _change(type) {
    if (this.ended || !this.engine) return;
    this.gotAny = true;
    if (type === 'latency') this.activity = 'latency';
    else if (type === 'download') this.activity = 'download';
    else if (type === 'upload') this.activity = 'upload';
    const snap = this._snap();
    const raw = this.engine.results.raw || {};
    let done = 0;
    let total = 0;
    const parts = [
      ['latency', snap.latPoints.length],
      ['download', snap.dlPoints.length],
      ['upload', snap.ulPoints.length],
    ];
    for (const [k, n] of parts) {
      done += n;
      total += raw[k] && raw[k].finished ? n : this.planned[k];
    }
    if (total > 0) this.progress = Math.max(this.progress, Math.min(0.97, done / total));
    this.cb.onUpdate && this.cb.onUpdate({ snap, activity: this.activity, progress: this.progress });
  }

  _finish(results) {
    if (this.ended) return;
    const snap = snapshotOf(results, this.t0);
    const have = [snap.download, snap.upload, snap.latency].filter(isNum).length;
    this._cleanup();
    this.ended = true;
    if (have === 0) {
      const first = this.errors[0];
      this.cb.onFail && this.cb.onFail({ reason: describeError(first ? first.error : '', first ? first.status : undefined) });
      return;
    }
    const raw = results.raw || {};
    const partial = !isNum(snap.download) || !isNum(snap.upload) || !isNum(snap.latency);
    let note = '';
    if (raw.error) note = 'Tes dihentikan lebih awal karena batas waktu; hasil berasal dari data yang sempat terkumpul.';
    else if (partial) note = 'Sebagian metrik tidak tersedia karena pengukurannya gagal atau terlalu singkat.';
    this.cb.onDone && this.cb.onDone({
      snap, partial: partial || !!raw.error, note,
      durationMs: num(() => results.getTotalDurationMs()) ?? Date.now() - this.t0,
      errorCount: this.errors.length,
    });
  }

  _cleanup() {
    clearTimeout(this.watchdog);
    window.removeEventListener('offline', this._offline);
  }

  _teardown() {
    this._cleanup();
    const e = this.engine;
    this.engine = null;
    if (e) {
      try { e.onResultsChange = () => {}; e.onFinish = () => {}; e.onError = () => {}; } catch { /* abaikan */ }
      try { e.pause(); } catch { /* abaikan */ }
    }
  }

  fail(reason) {
    if (this.ended) return;
    this.ended = true;
    this._teardown();
    this.cb.onFail && this.cb.onFail({ reason });
  }

  cancel() {
    if (this.ended) return;
    this.ended = true;
    this._teardown();
    this.cb.onCancel && this.cb.onCancel();
  }
}
