// Pengaturan personal. Hanya berlaku untuk Member; Guest selalu memakai bawaan
// (Gelap, Glass OFF, Animasi ON, Suara OFF, dan fitur perangkat nonaktif).
export const DEFAULTS = Object.freeze({
  theme: 'dark',       // 'dark' | 'light' | 'system'
  glass: false,
  motion: true,
  sound: false,
  haptics: true,       // getar saat tombol/hasil tes
  keepAwake: true,     // layar tetap menyala selama tes berjalan
  fullscreen: false,   // sembunyikan bar sistem
  exitConfirm: true,   // konfirmasi sebelum keluar (Android) / sebelum menutup saat tes berjalan (web)
  welcomeSeen: false,  // landing page pertama sudah dilihat (disimpan per akun, bukan pengaturan yang tampil)
});
export const THEMES = ['dark', 'light', 'system'];
const CACHE = 'pingtest-rlc:settings:v1';
const THEME_COLOR = { dark: '#09090a', light: '#f5f6f2' };

let current = { ...DEFAULTS };
const listeners = new Set();
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

export const getSettings = () => ({ ...current });

const bool = (v, d) => (typeof v === 'boolean' ? v : d);

export function sanitize(s) {
  const o = s || {};
  return {
    theme: THEMES.includes(o.theme) ? o.theme : DEFAULTS.theme,
    glass: !!o.glass,
    motion: o.motion !== false,
    sound: !!o.sound,
    haptics: bool(o.haptics, DEFAULTS.haptics),
    keepAwake: bool(o.keepAwake, DEFAULTS.keepAwake),
    fullscreen: bool(o.fullscreen, DEFAULTS.fullscreen),
    exitConfirm: bool(o.exitConfirm, DEFAULTS.exitConfirm),
    welcomeSeen: o.welcomeSeen === true,
  };
}

/** Tema yang benar-benar dipakai ('dark' | 'light'); 'system' mengikuti pengaturan perangkat. */
export function resolvedTheme(mode = current.theme) {
  if (mode === 'system') return mq && !mq.matches ? 'light' : 'dark';
  return mode === 'light' ? 'light' : 'dark';
}

function paintTheme() {
  const d = document.documentElement;
  const r = resolvedTheme();
  d.dataset.theme = r;
  d.dataset.themeMode = current.theme;
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = THEME_COLOR[r];
}

export function applySettings(s) {
  current = sanitize(s);
  const d = document.documentElement;
  d.dataset.glass = current.glass ? 'on' : 'off';
  d.dataset.motion = current.motion ? 'on' : 'off';
  paintTheme();
  listeners.forEach((fn) => { try { fn(getSettings()); } catch { /* abaikan */ } });
}

// Mode "Sistem": ikuti perubahan tema perangkat secara langsung.
if (mq) {
  const onChange = () => {
    if (current.theme !== 'system') return;
    paintTheme();
    listeners.forEach((fn) => { try { fn(getSettings()); } catch { /* abaikan */ } });
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
}

export function resetToGuest() {
  applySettings(DEFAULTS);
  try { localStorage.removeItem(CACHE); } catch { /* abaikan */ }
}

/** Cache lokal agar pengaturan Member langsung terpasang saat halaman dibuka (dibaca skrip di <head>). */
export function cacheSettings(uid) {
  try { localStorage.setItem(CACHE, JSON.stringify({ uid, settings: current })); } catch { /* abaikan */ }
}

export function onSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const motionOn = () => document.documentElement.dataset.motion !== 'off';
