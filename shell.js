// Kerangka bersama semua halaman: bahasa, Pusat Pengaturan, login/daftar, Guest vs Member,
// aksi tertunda (dilanjutkan otomatis setelah login), pemasangan PWA, dan Service Worker.
import { APK_URL, APK_BYTES, ITCH_URL } from './site.config.js';
import { t, locale, initLang, setLang, getLang, onLangChange, applyDom, isManual } from './i18n.js';
import { applySettings, resetToGuest, cacheSettings, getSettings, onSettingsChange, DEFAULTS } from './settings.js';
import {
  haptic, setDeviceState, nativeInfo, isAndroidApp, fullscreenSupported, setFullscreen, onFullscreenExit,
  shareApp, rateApp, openExternal, checkForUpdate, reloadForUpdate, refreshExitLabels, WEB_VERSION,
} from './device.js';
import { setSoundEnabled } from './sound.js';
import {
  cloudConfigured, mayHaveSession, initAuth, signIn, signUp, signOut, requestReset, setNewPassword,
  authErrorKey, loadSettings, saveSettings, rowToSettings,
} from './cloud.js';
import { $, $$ } from './util.js';

const LOCK = '<svg class="padlock" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2zM9 7a3 3 0 0 1 6 0v2H9V7z"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.4 7.4 0 0 0-1.7-1l-.4-2.5a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.6 8.8a.5.5 0 0 0 .1.6l2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3a.5.5 0 0 0 .6.2l2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5a.5.5 0 0 0 .5.4h3.8a.5.5 0 0 0 .5-.4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1a.5.5 0 0 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6l-2-1.6zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';

let member = false;
let user = null;
let pending = null;
let authStarted = null;
let busyCheck = () => false;
const authListeners = new Set();
let authMode = 'login';
let authReason = false;

export const isMember = () => member;
export const getUser = () => user;
export const setBusyCheck = (fn) => { busyCheck = fn; };
export function onAuthChange(fn) { authListeners.add(fn); return () => authListeners.delete(fn); }

/* ---------- Toast ---------- */
let toastTimer;
export function toast(msg) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}

/* ---------- Dialog helper ---------- */
function openDialog(d) {
  if (d.open) return;
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
}
function closeDialog(d) {
  if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
}
function wireDialog(d) {
  d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d); });
  $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => closeDialog(d)));
}
export { openDialog, closeDialog, wireDialog };

/* ---------- Gate Guest / Member ---------- */
export function requireMember(label, fn) {
  if (member) { fn(); return; }
  pending = { label, fn };
  openAuth({ reason: true, mode: 'login' });
}

export function refreshLocks() {
  $$('[data-member]').forEach((el) => {
    if (!el.querySelector(':scope > .padlock')) el.insertAdjacentHTML('beforeend', LOCK);
    el.classList.toggle('locked', !member);
  });
}

/* ---------- Header ---------- */
function buildHeader() {
  const host = $('#actions');
  if (!host) return;
  host.innerHTML = `
    <button type="button" class="langsw" id="btn-lang"><b data-l="id">ID</b><b data-l="en">EN</b></button>
    <button type="button" class="iconbtn" id="btn-settings">${GEAR}</button>
    <button type="button" class="btn ghost sm" id="btn-account"></button>`;
  $('#btn-lang').addEventListener('click', () => {
    const next = getLang() === 'id' ? 'en' : 'id';
    setLang(next, true);
    if (member) saveSettings(getSettings(), next).catch(() => {});
  });
  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-account').addEventListener('click', () => (member ? openSettings() : openAuth({ reason: false, mode: 'login' })));
  paintHeader();
}

function paintHeader() {
  const lang = getLang();
  const other = lang === 'id' ? 'EN' : 'ID';
  const lb = $('#btn-lang');
  if (lb) {
    lb.setAttribute('aria-label', t('lang.aria', { other }));
    lb.querySelectorAll('b').forEach((b) => b.classList.toggle('on', b.dataset.l === lang));
  }
  const sb = $('#btn-settings');
  if (sb) sb.setAttribute('aria-label', t('acct.settingsAria'));
  const ab = $('#btn-account');
  if (ab) {
    if (member && user) {
      const initial = (user.email || '?').trim().charAt(0).toUpperCase();
      ab.className = 'avatarbtn';
      ab.innerHTML = `<span class="ava" aria-hidden="true"></span>`;
      ab.firstChild.textContent = initial;
      ab.setAttribute('aria-label', `${t('acct.accountAria')}: ${user.email}`);
    } else {
      ab.className = 'btn ghost sm';
      ab.textContent = t('acct.login');
      ab.removeAttribute('aria-label');
    }
  }
}

/* ---------- Dialog Login / Daftar ---------- */
function buildAuthDialog() {
  const d = document.createElement('dialog');
  d.className = 'dlg'; d.id = 'dlg-auth'; d.setAttribute('aria-labelledby', 'auth-title');
  d.innerHTML = `
    <div class="dlg-in">
      <button type="button" class="dlg-x" data-close data-i18n-attr="aria-label:auth.close" aria-label="Tutup">✕</button>
      <h2 id="auth-title"></h2>
      <p class="reason" id="auth-reason" data-i18n="auth.reason"></p>
      <div class="seg" id="auth-tabs" role="tablist">
        <button type="button" role="tab" data-mode="login" data-i18n="auth.login"></button>
        <button type="button" role="tab" data-mode="register" data-i18n="auth.register"></button>
      </div>
      <form id="auth-form" novalidate>
        <label class="fld" id="fld-email"><span data-i18n="auth.email"></span>
          <input type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" required></label>
        <label class="fld" id="fld-pw"><span data-i18n="auth.password"></span>
          <span class="pw"><input type="password" name="password" autocomplete="current-password" required>
          <button type="button" class="link" id="pw-toggle"></button></span></label>
        <label class="fld" id="fld-pw2" hidden><span data-i18n="auth.password2"></span>
          <input type="password" name="password2" autocomplete="new-password"></label>
        <p class="msg" id="auth-msg" role="alert"></p>
        <button class="btn" type="submit" id="auth-submit"></button>
        <div class="alt">
          <button type="button" class="link" id="auth-forgot" data-i18n="auth.forgot"></button>
          <button type="button" class="link" id="auth-back" data-i18n="auth.back" hidden></button>
        </div>
      </form>
      <p class="fine" data-i18n="auth.intro"></p>
    </div>`;
  document.body.append(d);
  applyDom(d);
  wireDialog(d);

  $$('#auth-tabs button', d).forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));
  $('#auth-forgot', d).addEventListener('click', () => setAuthMode('forgot'));
  $('#auth-back', d).addEventListener('click', () => setAuthMode('login'));
  $('#pw-toggle', d).addEventListener('click', () => {
    const i = $('#fld-pw input', d);
    i.type = i.type === 'password' ? 'text' : 'password';
    $('#fld-pw2 input', d).type = i.type;
    paintAuth();
  });
  d.addEventListener('close', () => { if (!member) pending = null; setMsg(''); });
  $('#auth-form', d).addEventListener('submit', onAuthSubmit);
  return d;
}

function setMsg(text, kind = 'err') {
  const m = $('#auth-msg');
  if (!m) return;
  m.textContent = text;
  m.dataset.k = text ? kind : '';
}

function paintAuth() {
  const d = $('#dlg-auth');
  if (!d) return;
  const mode = authMode;
  $('#auth-title', d).textContent = t(`auth.title.${mode === 'recovery' ? 'recovery' : mode}`);
  $('#auth-reason', d).hidden = !authReason;
  $('#auth-tabs', d).hidden = mode === 'forgot' || mode === 'recovery';
  $$('#auth-tabs button', d).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
  $('#fld-email', d).hidden = mode === 'recovery';
  $('#fld-pw', d).hidden = mode === 'forgot';
  $('#fld-pw2', d).hidden = !(mode === 'register' || mode === 'recovery');
  $('#auth-forgot', d).hidden = mode !== 'login';
  $('#auth-back', d).hidden = mode !== 'forgot';
  $('#auth-submit', d).textContent = t(`auth.submit.${mode}`);
  const pw = $('#fld-pw input', d);
  pw.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#pw-toggle', d).textContent = pw.type === 'password' ? t('auth.show') : t('auth.hide');
}

function setAuthMode(mode) {
  authMode = mode;
  setMsg('');
  paintAuth();
}

export function openAuth({ reason = false, mode = 'login' } = {}) {
  const d = $('#dlg-auth') || buildAuthDialog();
  authReason = reason;
  authMode = mode;
  setMsg(cloudConfigured ? '' : t('auth.err.notConfigured'));
  paintAuth();
  openDialog(d);
  setTimeout(() => { const f = $('#fld-email input', d); if (f && !f.closest('[hidden]')) f.focus(); }, 60);
  if (cloudConfigured) ensureAuthStarted().catch(() => {});
}

async function onAuthSubmit(ev) {
  ev.preventDefault();
  const d = $('#dlg-auth');
  const f = ev.currentTarget;
  const email = f.email.value.trim();
  const pw = f.password.value;
  const pw2 = f.password2.value;
  const mode = authMode;
  setMsg('');
  if (!cloudConfigured) { setMsg(t('auth.err.notConfigured')); return; }
  if (mode !== 'recovery' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setMsg(t('auth.err.email')); return; }
  if ((mode === 'register' || mode === 'recovery') && pw.length < 8) { setMsg(t('auth.err.pwShort')); return; }
  if ((mode === 'register' || mode === 'recovery') && pw !== pw2) { setMsg(t('auth.err.pwMatch')); return; }
  if (mode === 'login' && !pw) { setMsg(t('auth.err.invalid')); return; }

  const btn = $('#auth-submit', d);
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = t('auth.busy');
  try {
    await ensureAuthStarted();
    if (mode === 'login') {
      await signIn(email, pw);
    } else if (mode === 'register') {
      const r = await signUp(email, pw);
      if (r.needsConfirm) { setMsg(t('auth.ok.checkEmail'), 'ok'); setAuthMode('login'); setMsg(t('auth.ok.checkEmail'), 'ok'); }
    } else if (mode === 'forgot') {
      await requestReset(email);
      setMsg(t('auth.ok.reset'), 'ok');
    } else if (mode === 'recovery') {
      await setNewPassword(pw);
      setMsg(t('auth.ok.pwUpdated'), 'ok');
      setTimeout(() => closeDialog(d), 900);
    }
  } catch (e) {
    setMsg(t(authErrorKey(e)));
  } finally {
    btn.disabled = false;
    btn.textContent = label;
    paintAuth();
  }
}

/* ---------- Sesi ---------- */
function ensureAuthStarted() {
  if (!cloudConfigured) return Promise.reject(new Error('not-configured'));
  if (!authStarted) {
    authStarted = (async () => {
      // Jangan memuat SDK saat tes kecepatan berjalan agar hasil ukur tidak terganggu.
      while (busyCheck()) await new Promise((r) => setTimeout(r, 800));
      const session = await initAuth((event, s) => {
        // Hindari memanggil Supabase langsung di dalam callback (lihat dokumentasi SDK).
        setTimeout(() => applySession(s, event), 0);
      });
      return session;
    })();
    authStarted.catch(() => { authStarted = null; });
  }
  return authStarted;
}

async function applySession(session, event) {
  const nowMember = !!(session && session.user);
  const wasMember = member;
  const sameUser = nowMember && user && user.id === session.user.id;

  if (event === 'PASSWORD_RECOVERY') {
    openAuth({ reason: false, mode: 'recovery' });
  }

  if (nowMember) {
    user = { id: session.user.id, email: session.user.email || '' };
    member = true;
    if (!sameUser) await pullSettings();
  } else {
    member = false;
    user = null;
    resetToGuest();
    setSoundEnabled(false);
  }
  setDeviceState({ member, settings: getSettings() });
  paintHeader();
  refreshLocks();
  paintSettings();
  authListeners.forEach((fn) => { try { fn({ member, user, event, changed: member !== wasMember || !sameUser }); } catch { /* abaikan */ } });

  if (member && !wasMember) {
    const d = $('#dlg-auth');
    if (d && d.open) closeDialog(d);
    if (event === 'SIGNED_IN') toast(t('auth.ok.signedIn'));
    if (pending) {
      const p = pending; pending = null;
      setTimeout(() => { try { p.fn(); } catch { /* abaikan */ } }, 200);
    }
  }
  if (!member && wasMember && event === 'SIGNED_OUT') toast(t('auth.ok.signedOut'));
}

const stripUndef = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function pullSettings() {
  try {
    const row = await loadSettings();
    if (row) {
      applySettings({ ...getSettings(), ...stripUndef(rowToSettings(row)) });
      if (row.lang && !isManual() && row.lang !== getLang()) { setLang(row.lang, true); }
      else if (isManual() && row.lang !== getLang()) { saveSettings(getSettings(), getLang()).catch(() => {}); }
    } else {
      // Pengguna baru: simpan bawaan + pilihan bahasa manual (jika ada).
      applySettings(DEFAULTS);
      saveSettings(getSettings(), isManual() ? getLang() : null).catch(() => {});
    }
  } catch {
    applySettings(getSettings()); // pertahankan nilai lokal jika cloud gagal
  }
  setSoundEnabled(getSettings().sound);
  cacheSettings(user && user.id);
}

export async function logout() {
  try { await signOut(); } catch { toast(t('auth.err.network')); }
}

/* ---------- Pusat Pengaturan ---------- */
function buildSettingsDialog() {
  const d = document.createElement('dialog');
  d.className = 'dlg'; d.id = 'dlg-settings'; d.setAttribute('aria-labelledby', 'set-title');
  d.innerHTML = `
    <div class="dlg-in">
      <button type="button" class="dlg-x" data-close data-i18n-attr="aria-label:auth.close" aria-label="Tutup">✕</button>
      <h2 id="set-title" data-i18n="set.title"></h2>

      <section class="set-sec">
        <h3 data-i18n="set.lang"></h3>
        <div class="seg" id="set-lang">
          <button type="button" data-lang="id">Bahasa Indonesia</button>
          <button type="button" data-lang="en">English</button>
        </div>
        <p class="fine" data-i18n="set.langHint"></p>
      </section>

      <section class="set-sec">
        <h3 data-i18n="set.look"></h3>
        <div class="set-row"><span data-i18n="set.theme"></span>
          <div class="seg" id="set-theme">
            <button type="button" data-theme="dark" data-member><span data-i18n="set.dark"></span></button>
            <button type="button" data-theme="light" data-member><span data-i18n="set.light"></span></button>
            <button type="button" data-theme="system" data-member><span data-i18n="set.system"></span></button>
          </div>
        </div>
        <div class="set-row"><span data-i18n="set.glass"></span>
          <button type="button" class="switch" role="switch" id="sw-glass" data-key="glass" data-member aria-label="Glass UI"><i></i></button></div>
        <div class="set-row"><span data-i18n="set.motion"></span>
          <button type="button" class="switch" role="switch" id="sw-motion" data-key="motion" data-member data-i18n-attr="aria-label:set.motion" aria-label="Animasi"><i></i></button></div>
        <div class="set-row"><span><span data-i18n="set.sound"></span><small class="fine" data-i18n="set.soundHint"></small></span>
          <button type="button" class="switch" role="switch" id="sw-sound" data-key="sound" data-member data-i18n-attr="aria-label:set.sound" aria-label="Suara"><i></i></button></div>
      </section>

      <section class="set-sec">
        <h3 data-i18n="set.device"></h3>
        <div class="set-row" data-feat="haptics"><span><span data-i18n="set.haptics"></span><small class="fine" data-i18n="set.hapticsHint"></small></span>
          <button type="button" class="switch" role="switch" data-key="haptics" data-member data-i18n-attr="aria-label:set.haptics" aria-label="Haptic"><i></i></button></div>
        <div class="set-row" data-feat="keepAwake"><span><span data-i18n="set.keepAwake"></span><small class="fine" data-i18n="set.keepAwakeHint"></small></span>
          <button type="button" class="switch" role="switch" data-key="keepAwake" data-member data-i18n-attr="aria-label:set.keepAwake" aria-label="Keep screen on"><i></i></button></div>
        <div class="set-row" data-feat="fullscreen"><span><span data-i18n="set.fullscreen"></span><small class="fine" data-i18n="set.fullscreenHint"></small></span>
          <button type="button" class="switch" role="switch" data-key="fullscreen" data-member data-i18n-attr="aria-label:set.fullscreen" aria-label="Fullscreen"><i></i></button></div>
        <div class="set-row" data-feat="exitConfirm"><span><span data-i18n="set.exitConfirm"></span><small class="fine" id="exit-hint"></small></span>
          <button type="button" class="switch" role="switch" data-key="exitConfirm" data-member data-i18n-attr="aria-label:set.exitConfirm" aria-label="Exit confirmation"><i></i></button></div>
      </section>

      <section class="set-sec">
        <h3 data-i18n="set.about"></h3>
        <div id="app-ver" class="app-ver"></div>
        <div class="set-btns">
          <button type="button" class="btn ghost sm" id="btn-update" data-member data-i18n="upd.check"></button>
          <button type="button" class="btn ghost sm" id="btn-shareapp" data-member data-i18n="app.share"></button>
          <button type="button" class="btn ghost sm" id="btn-rate" data-member data-i18n="app.rate"></button>
        </div>
        <div id="upd-msg" class="upd" role="status" aria-live="polite"></div>
      </section>

      <section class="set-sec">
        <h3 data-i18n="set.account"></h3>
        <p class="fine" id="set-acct"></p>
        <button type="button" class="btn ghost sm" id="set-acct-btn"></button>
      </section>

      <section class="set-sec dl-section"${isAndroidApp() ? ' hidden' : ''}>
        <h3 data-i18n="set.app"></h3>
        <p class="fine" data-i18n="set.app.lede"></p>
        <ul class="dl-list">
          <li><a class="dl-item" href="${ITCH_URL}" target="_blank" rel="noopener noreferrer">
            <span class="dl-ico"><img src="/brand-itchio.svg" alt="" width="28" height="28"></span>
            <span class="dl-txt"><b data-i18n="set.itch"></b><small data-i18n="set.itch.sub"></small></span></a></li>
          <li><div class="dl-item off" role="group" aria-disabled="true">
            <span class="dl-ico dl-ico-text" aria-hidden="true">APK</span>
            <span class="dl-txt"><b data-i18n="set.apkpure"></b><small data-i18n="set.apkpure.sub"></small></span>
            <span class="dl-badge" data-i18n="set.soon"></span></div></li>
          <li><a class="dl-item primary" href="${APK_URL}" download>
            <span class="dl-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16"/></svg></span>
            <span class="dl-txt"><b data-i18n="set.apk"></b><small id="apk-meta"></small></span></a></li>
        </ul>
        <p class="fine" data-i18n="set.apk.note"></p>
        <p class="fine" data-i18n="set.needsNet"></p>
      </section>
    </div>`;
  document.body.append(d);
  applyDom(d);
  wireDialog(d);

  $$('#set-lang button', d).forEach((b) => b.addEventListener('click', () => {
    setLang(b.dataset.lang, true);
    if (member) saveSettings(getSettings(), b.dataset.lang).catch(() => {});
  }));
  $$('#set-theme button', d).forEach((b) => b.addEventListener('click', () => {
    requireMember(t('gate.theme'), () => updateSetting('theme', b.dataset.theme));
  }));
  $$('.switch', d).forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.key;
    requireMember(t(`gate.${key}`), async () => {
      const next = !getSettings()[key];
      if (key === 'fullscreen') {
        const ok = await setFullscreen(next); // di website harus dipanggil dari klik pengguna
        if (next && !ok) { toast(t('set.fsFail')); return; }
      }
      updateSetting(key, next);
    });
  }));
  $('#btn-update', d).addEventListener('click', () => requireMember(t('gate.update'), runUpdateCheck));
  $('#btn-shareapp', d).addEventListener('click', () => requireMember(t('gate.shareApp'), async () => {
    const r = await shareApp();
    if (r === 'copied') toast(t('app.share.copied')); else if (r === 'fail') toast(t('app.share.fail'));
  }));
  $('#btn-rate', d).addEventListener('click', () => requireMember(t('gate.rateApp'), () => rateApp()));
  $('#set-acct-btn', d).addEventListener('click', () => {
    if (member) { logout(); closeDialog(d); } else { closeDialog(d); openAuth({ reason: false, mode: 'login' }); }
  });
  return d;
}

export function updateSetting(key, value) {
  const next = { ...getSettings(), [key]: value };
  applySettings(next);
  setSoundEnabled(next.sound);
  cacheSettings(user && user.id);
  paintSettings();
  saveSettings(next, isManual() ? getLang() : null).then(() => toast(t('set.saved'))).catch(() => toast(t('set.saveFail')));
}

async function runUpdateCheck() {
  const box = $('#upd-msg');
  if (!box) return;
  box.innerHTML = `<p class="fine">${t('upd.checking')}</p>`;
  const r = await checkForUpdate();
  if (!r.ok) { box.innerHTML = `<p class="fine bad">${t('upd.fail')}</p>`; return; }
  const parts = [];
  if (r.web.isNew) {
    parts.push(`<p>${t('upd.webNew', { v: r.web.latest })}</p><button type="button" class="btn sm" id="upd-reload">${t('upd.reload')}</button>`);
  } else {
    parts.push(`<p class="ok">${t('upd.webOk', { v: r.web.current })}</p>`);
  }
  if (r.app) {
    if (r.app.isNew) {
      parts.push(`<p>${t('upd.appNew', { v: r.app.latest, cur: r.app.installed })}</p>
        <div class="set-btns"><a class="btn sm" href="${r.app.apk}" download>${t('upd.apk')}</a>
        <button type="button" class="btn ghost sm" id="upd-itch">${t('upd.itch')}</button></div>`);
    } else {
      parts.push(`<p class="ok">${t('upd.appOk', { v: r.app.installed })}</p>`);
    }
  }
  box.innerHTML = parts.join('');
  const rl = $('#upd-reload', box); if (rl) rl.addEventListener('click', reloadForUpdate);
  const it = $('#upd-itch', box); if (it) it.addEventListener('click', () => openExternal(ITCH_URL));
  haptic(r.web.isNew || (r.app && r.app.isNew) ? 'done' : 'tap');
}

function paintAppInfo(d) {
  const box = $('#app-ver', d);
  if (!box) return;
  if (!member) { box.innerHTML = `<p class="fine">${t('app.ver.guest')}</p>`; return; }
  const nat = nativeInfo();
  box.innerHTML = `<dl class="kv"><div><dt>${t('app.ver.web')}</dt><dd>${WEB_VERSION}</dd></div>` +
    (nat ? `<div><dt>${t('app.ver.android')}</dt><dd>${nat.versionName} (${nat.versionCode})</dd></div>` : '') + '</dl>';
}

function paintSettings() {
  const d = $('#dlg-settings');
  if (!d) return;
  const s = getSettings();
  $$('#set-lang button', d).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  $$('#set-theme button', d).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === s.theme)));
  $$('.switch', d).forEach((b) => b.setAttribute('aria-checked', String(!!s[b.dataset.key])));
  $('#set-acct', d).textContent = member && user ? t('set.signedAs', { email: user.email }) : t('set.guest');
  $('#set-acct-btn', d).textContent = member ? t('set.logout') : t('auth.cta');
  $('#apk-meta', d).textContent = t('set.apk.meta', { size: (APK_BYTES / 1048576).toLocaleString(locale(), { maximumFractionDigits: 1 }) + ' MB' });
  const showFeat = { haptics: isAndroidApp() || !!navigator.vibrate, keepAwake: isAndroidApp() || 'wakeLock' in navigator, fullscreen: fullscreenSupported(), exitConfirm: true };
  $$('[data-feat]', d).forEach((r) => { r.hidden = !showFeat[r.dataset.feat]; });
  $('#exit-hint', d).textContent = t(isAndroidApp() ? 'set.exitHintApp' : 'set.exitHintWeb');
  paintAppInfo(d);
  refreshExitLabels();
  refreshLocks();
}

export function openSettings() {
  const d = $('#dlg-settings') || buildSettingsDialog();
  paintSettings();
  openDialog(d);
}

/* ---------- PWA ---------- */
function setupPwa() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }
}

/* ---------- Init ---------- */
export function initShell() {
  initLang();
  buildHeader();
  refreshLocks();
  onLangChange(() => { paintHeader(); paintAuth(); paintSettings(); });
  setupPwa();
  onSettingsChange((st) => setDeviceState({ settings: st }));
  onFullscreenExit(() => { if (member && getSettings().fullscreen && !isAndroidApp()) updateSetting('fullscreen', false); });
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, .btn, [role="switch"], [role="tab"], .go')) haptic('tap');
  }, { passive: true });
  setDeviceState({ member: false, settings: getSettings() });
  if (mayHaveSession()) ensureAuthStarted().catch(() => {});
  // Keadaan awal Guest: pastikan pengaturan personal memakai bawaan sampai sesi terbukti ada.
  if (!mayHaveSession()) resetToGuest();
}
