// Supabase (SDK resmi) — login email, sesi, riwayat cloud, dan pengaturan personal.
// Hanya memakai URL proyek + ANON/PUBLISHABLE key (aman di frontend). Service Role Key TIDAK PERNAH dipakai di sini.
// Keamanan data dijaga oleh Row Level Security di database (lihat supabase-schema.sql).
import { isNum } from './util.js';
import { resolvedTheme } from './settings.js';

const URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const cloudConfigured = /^https?:\/\//.test(URL) && KEY.length > 20;

let clientPromise = null;
export function getClient() {
  if (!cloudConfigured) return Promise.reject(new Error('not-configured'));
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }));
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}

/** Ada kemungkinan sesi tersimpan / tautan auth di URL? Jika tidak, SDK tidak perlu dimuat (Guest tetap ringan). */
export function mayHaveSession() {
  if (!cloudConfigured) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) return true;
    }
  } catch { /* abaikan */ }
  return /access_token=|type=recovery|type=signup|error_description=/.test(location.hash);
}

/** Terjemahkan error Supabase menjadi kunci i18n. */
export function authErrorKey(err) {
  if (!err) return 'auth.err.generic';
  if (err.message === 'not-configured') return 'auth.err.notConfigured';
  const code = err.code || '';
  const msg = String(err.message || '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'auth.err.invalid';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'auth.err.exists';
  if (code === 'email_not_confirmed' || msg.includes('not confirmed')) return 'auth.err.unconfirmed';
  if (code === 'weak_password' || msg.includes('password should')) return 'auth.err.weak';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || err.status === 429) return 'auth.err.rate';
  if (code === 'signup_disabled') return 'auth.err.disabled';
  if (err.name === 'AuthRetryableFetchError' || msg.includes('failed to fetch') || msg.includes('network')) return 'auth.err.network';
  return 'auth.err.generic';
}

/* ---------- Auth ---------- */
export async function initAuth(onChange) {
  const sb = await getClient();
  sb.auth.onAuthStateChange((event, session) => { onChange(event, session); });
  const { data } = await sb.auth.getSession();
  return data.session;
}
export async function signUp(email, password) {
  const sb = await getClient();
  const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/' } });
  if (error) throw error;
  // Jika proyek mewajibkan konfirmasi email, session = null.
  return { session: data.session, needsConfirm: !data.session };
}
export async function signIn(email, password) {
  const sb = await getClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}
export async function signOut() {
  const sb = await getClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}
export async function requestReset(email) {
  const sb = await getClient();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
  if (error) throw error;
}
export async function setNewPassword(password) {
  const sb = await getClient();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
}

/* ---------- Riwayat cloud ---------- */
const n = (v, d = 2) => (isNum(v) ? +v.toFixed(d) : null);

export function entryToRow(e) {
  return {
    tested_at: e.ts,
    profile: e.profile === 'standar' ? 'standar' : 'hemat',
    download_mbps: n(e.download), upload_mbps: n(e.upload),
    latency_ms: n(e.latency, 1), jitter_ms: n(e.jitter, 1),
    down_loaded_latency_ms: n(e.downLatency, 1), up_loaded_latency_ms: n(e.upLatency, 1),
    down_loaded_jitter_ms: n(e.downJitter, 1), up_loaded_jitter_ms: n(e.upJitter, 1),
    bufferbloat_ms: n(e.bloat, 1), bufferbloat_grade: e.bloatGrade || null,
    bytes_used: isNum(e.bytes) ? Math.round(e.bytes) : null,
    duration_ms: isNum(e.durationMs) ? Math.round(e.durationMs) : null,
    partial: !!e.partial,
    net: e.net && typeof e.net === 'object' ? e.net : null,
  };
}
const num = (v) => (v === null || v === undefined ? null : Number(v));
export function rowToEntry(r) {
  return {
    id: String(r.id), ts: r.tested_at, profile: r.profile, v: 1,
    download: num(r.download_mbps), upload: num(r.upload_mbps),
    latency: num(r.latency_ms), jitter: num(r.jitter_ms),
    downLatency: num(r.down_loaded_latency_ms), upLatency: num(r.up_loaded_latency_ms),
    downJitter: num(r.down_loaded_jitter_ms), upJitter: num(r.up_loaded_jitter_ms),
    bloat: num(r.bufferbloat_ms), bloatGrade: r.bufferbloat_grade || null,
    bytes: num(r.bytes_used), durationMs: num(r.duration_ms), partial: !!r.partial, net: r.net || null,
  };
}

export async function listResults(limit = 100) {
  const sb = await getClient();
  const { data, error } = await sb.from('test_results').select('*').order('tested_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data.map(rowToEntry);
}
export async function insertResult(entry) {
  const sb = await getClient();
  const { data, error } = await sb.from('test_results').insert(entryToRow(entry)).select().single();
  if (error) throw error;
  return rowToEntry(data);
}
export async function insertMany(entries) {
  if (!entries.length) return;
  const sb = await getClient();
  const { error } = await sb.from('test_results').insert(entries.map(entryToRow));
  if (error) throw error;
}
export async function deleteResult(id) {
  const sb = await getClient();
  const { error } = await sb.from('test_results').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteAllResults(uid) {
  const sb = await getClient();
  // RLS membatasi ke baris milik sendiri; filter user_id dibutuhkan karena DELETE tanpa filter ditolak PostgREST.
  const { error } = await sb.from('test_results').delete().eq('user_id', uid);
  if (error) throw error;
}

/* ---------- Pengaturan personal ---------- */
// Kolom `theme/glass/motion/sound/lang` sudah ada sejak versi 1. Pengaturan baru (mode tema "system",
// getar, layar tetap menyala, layar penuh, konfirmasi keluar) disimpan di kolom jsonb `prefs`
// (lihat supabase-migration-v2.sql). Jika kolom itu belum ada, aplikasi tetap jalan: nilai baru
// hanya disimpan di perangkat sampai migrasi dijalankan.
let prefsColumn = true;
const isPrefsError = (e) => !!e && (e.code === '42703' || e.code === 'PGRST204' || /prefs/i.test(String(e.message || '')));

export async function loadSettings() {
  const sb = await getClient();
  if (prefsColumn) {
    const r = await sb.from('user_settings').select('theme,glass,motion,sound,lang,prefs').maybeSingle();
    if (!r.error) return r.data || null;
    if (!isPrefsError(r.error)) throw r.error;
    prefsColumn = false;
  }
  const { data, error } = await sb.from('user_settings').select('theme,glass,motion,sound,lang').maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Ubah baris database menjadi objek pengaturan aplikasi. */
export function rowToSettings(row) {
  const p = (row && row.prefs && typeof row.prefs === 'object') ? row.prefs : {};
  return {
    theme: ['dark', 'light', 'system'].includes(p.themeMode) ? p.themeMode : row.theme,
    glass: row.glass, motion: row.motion, sound: row.sound,
    haptics: p.haptics, keepAwake: p.keepAwake, fullscreen: p.fullscreen, exitConfirm: p.exitConfirm,
  };
}

export async function saveSettings(s, lang) {
  const sb = await getClient();
  const base = {
    theme: s.theme === 'system' ? resolvedTheme('system') : s.theme, // kolom lama hanya menerima dark/light
    glass: s.glass, motion: s.motion, sound: s.sound, updated_at: new Date().toISOString(),
  };
  if (lang) base.lang = lang;
  if (prefsColumn) {
    const prefs = { themeMode: s.theme, haptics: s.haptics, keepAwake: s.keepAwake, fullscreen: s.fullscreen, exitConfirm: s.exitConfirm };
    const r = await sb.from('user_settings').upsert({ ...base, prefs }, { onConflict: 'user_id' });
    if (!r.error) return;
    if (!isPrefsError(r.error)) throw r.error;
    prefsColumn = false;
  }
  const { error } = await sb.from('user_settings').upsert(base, { onConflict: 'user_id' });
  if (error) throw error;
}
