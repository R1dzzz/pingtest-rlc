// Pengaturan tampilan personal. Hanya berlaku untuk Member; Guest selalu memakai bawaan
// (Gelap, Glass OFF, Animasi ON, Suara OFF).
export const DEFAULTS = Object.freeze({ theme: 'dark', glass: false, motion: true, sound: false });
const CACHE = 'pingtest-rlc:settings:v1';
const THEME_COLOR = { dark: '#09090a', light: '#f5f6f2' };

let current = { ...DEFAULTS };
const listeners = new Set();

export const getSettings = () => ({ ...current });

function sanitize(s) {
  return {
    theme: s && s.theme === 'light' ? 'light' : 'dark',
    glass: !!(s && s.glass),
    motion: !(s && s.motion === false),
    sound: !!(s && s.sound),
  };
}

export function applySettings(s) {
  current = sanitize(s);
  const d = document.documentElement;
  d.dataset.theme = current.theme;
  d.dataset.glass = current.glass ? 'on' : 'off';
  d.dataset.motion = current.motion ? 'on' : 'off';
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = THEME_COLOR[current.theme];
  listeners.forEach((fn) => { try { fn(getSettings()); } catch { /* abaikan */ } });
}

export function resetToGuest() {
  applySettings(DEFAULTS);
  try { localStorage.removeItem(CACHE); } catch { /* abaikan */ }
}

/** Cache lokal agar tema Member langsung terpasang saat halaman dibuka (dibaca skrip di <head>). */
export function cacheSettings(uid) {
  try { localStorage.setItem(CACHE, JSON.stringify({ uid, settings: current })); } catch { /* abaikan */ }
}

export function onSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const motionOn = () => document.documentElement.dataset.motion !== 'off';
