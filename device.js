// Jembatan perangkat: fitur yang sama untuk website dan aplikasi Android.
//  - Di aplikasi Android (WebView), `window.RLCNative` disediakan oleh kode native (getar sungguhan,
//    layar tetap menyala, layar penuh, dialog konfirmasi keluar, berbagi, dll).
//  - Di website, tiap fitur memakai API browser yang setara (Vibration, Screen Wake Lock, Fullscreen,
//    Web Share, beforeunload) dan diam-diam tidak aktif jika browser tidak mendukungnya.
// Semua fitur ini hanya aktif untuk Member (diatur lewat setDeviceState dari shell.js).
import { ITCH_URL } from './site.config.js';
import { t } from './i18n.js';

const N = typeof window !== 'undefined' && window.RLCNative && typeof window.RLCNative === 'object' ? window.RLCNative : null;
const call = (name, ...args) => { try { return N && typeof N[name] === 'function' ? N[name](...args) : undefined; } catch { return undefined; } };

const lastSent = {};
/** Kirim ke native hanya jika nilainya berubah (hindari panggilan berulang). */
const callOnce = (name, ...args) => { const k = JSON.stringify(args); if (lastSent[name] === k) return; lastSent[name] = k; call(name, ...args); };

export const isAndroidApp = () => !!N;
export const WEB_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const WEB_BUILD = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

const state = { member: false, settings: null, running: false };
let wakeLock = null;

/** Info aplikasi Android terpasang: { versionName, versionCode, packageName } atau null di website. */
export function nativeInfo() {
  if (!N) return null;
  try { const o = JSON.parse(call('appInfo') || 'null'); return o && typeof o === 'object' ? o : null; } catch { return null; }
}

/* ---------- Getar (haptic) ---------- */
const PATTERNS = { tap: 12, toggle: 14, start: [20], done: [22, 45, 30], error: [70, 50, 70] };
export function haptic(kind = 'tap') {
  if (!state.member || !state.settings || !state.settings.haptics) return;
  if (N) { call('haptic', kind); return; }
  try { if (navigator.vibrate) navigator.vibrate(PATTERNS[kind] || PATTERNS.tap); } catch { /* abaikan */ }
}

/* ---------- Layar tetap menyala saat tes ---------- */
async function syncWake() {
  const want = state.member && state.settings && state.settings.keepAwake && state.running;
  if (N) { callOnce('keepScreenOn', !!want); return; }
  try {
    if (want && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      const lock = await navigator.wakeLock.request('screen');
      wakeLock = lock;
      lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
    } else if (!want && wakeLock) {
      const lock = wakeLock; wakeLock = null;
      await lock.release();
    }
  } catch { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncWake(); });

/* ---------- Layar penuh ---------- */
function fsWanted() { return !!(state.member && state.settings && state.settings.fullscreen); }
export function webFullscreenActive() { return !!document.fullscreenElement; }
/** Di website, requestFullscreen butuh gestur pengguna: panggil dari handler klik. */
export async function setFullscreen(on) {
  if (N) { callOnce('setFullscreen', !!on); return true; }
  try {
    if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) { await document.documentElement.requestFullscreen(); return true; }
    if (!on && document.fullscreenElement && document.exitFullscreen) { await document.exitFullscreen(); return true; }
    return !!document.fullscreenEnabled;
  } catch { return false; }
}
export const fullscreenSupported = () => !!N || !!document.fullscreenEnabled;
/** Dipanggil saat pengguna keluar dari layar penuh lewat tombol sistem/Esc di website. */
export function onFullscreenExit(fn) {
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) fn(); });
}

/* ---------- Konfirmasi keluar ---------- */
function syncExit() {
  const on = !!(state.member && state.settings && state.settings.exitConfirm);
  if (N) callOnce('setExitConfirm', on, t('exit.title'), t('exit.msg'), t('exit.yes'), t('exit.no'));
}
// Website: peringatan bawaan browser hanya saat tes sedang berjalan (agar tidak mengganggu).
window.addEventListener('beforeunload', (e) => {
  if (!N && state.member && state.settings && state.settings.exitConfirm && state.running) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------- Sinkronisasi dari shell/main ---------- */
export function setDeviceState({ member, settings }) {
  if (member !== undefined) state.member = !!member;
  if (settings) state.settings = settings;
  syncExit();
  syncWake();
  // Aplikasi Android: terapkan layar penuh langsung. Website: hanya keluar dari layar penuh jika tidak lagi diinginkan.
  if (N) callOnce('setFullscreen', fsWanted());
  else if (!fsWanted() && document.fullscreenElement) setFullscreen(false);
}
export function setTestRunning(on) { state.running = !!on; syncWake(); }
export const refreshExitLabels = syncExit;

/* ---------- Bagikan & nilai aplikasi ---------- */
export async function shareApp() {
  const title = 'PingTest by RLC';
  const text = t('app.share.text');
  const url = location.origin + '/';
  if (N) { call('share', title, text, url); return 'native'; }
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied'; } catch { return 'fail'; }
}
export function rateApp() {
  if (N) { call('openUrl', ITCH_URL); return; }
  window.open(ITCH_URL, '_blank', 'noopener,noreferrer');
}
export function openExternal(url) { if (N) call('openUrl', url); else window.open(url, '_blank', 'noopener,noreferrer'); }

/* ---------- Pemeriksa pembaruan ---------- */
/** Hasil: { ok, web: {current, latest, build, isNew}, app: {installed, latest, isNew, apk} | null } */
export async function checkForUpdate() {
  let info;
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('http ' + res.status);
    info = await res.json();
  } catch { return { ok: false }; }
  const web = { current: WEB_VERSION, latest: info.web && info.web.version, build: info.web && info.web.build };
  web.isNew = !!web.build && web.build !== WEB_BUILD && WEB_BUILD !== 'dev';
  let app = null;
  const nat = nativeInfo();
  if (nat && info.android) {
    app = {
      installed: nat.versionName, installedCode: Number(nat.versionCode) || 0,
      latest: info.android.versionName, latestCode: Number(info.android.versionCode) || 0,
      apk: info.android.apk, itch: info.android.itch,
    };
    app.isNew = app.latestCode > app.installedCode;
  }
  return { ok: true, web, app };
}

/** Terapkan pembaruan web: muat ulang setelah service worker diperbarui. */
export async function reloadForUpdate() {
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) await reg.update();
  } catch { /* abaikan */ }
  location.reload();
}
