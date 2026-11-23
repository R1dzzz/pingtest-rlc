// Landing pertama (sekali per akun / per perangkat untuk Guest) dan popup unduhan APK gaya iOS.
import {
  onAuthChange, isMember, isBusy, welcomeSeenLocal, welcomeSeenByAccount, markWelcomeSeen, toast,
} from './shell.js';
import { mayHaveSession } from './cloud.js';
import { t, applyDom, onLangChange } from './i18n.js';
import { APK_URL, APK_BYTES } from './site.config.js';
import { bytesText } from './util.js';

const POP_KEY = 'pingtest-rlc:dlpop:v1'; // { until:<ms>, done:<bool> } — status popup per perangkat
const SNOOZE_MS = 7 * 24 * 3600 * 1000;
const AUTH_WAIT_MS = 4000;

const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* abaikan */ } };
const isApp = () => document.documentElement.dataset.app === 'android';
const isStandalone = () => {
  try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; }
};
const apkSize = () => bytesText(typeof __APK_SIZE__ === 'number' && __APK_SIZE__ ? __APK_SIZE__ : APK_BYTES);

function popState() {
  try { return JSON.parse(lsGet(POP_KEY) || '{}') || {}; } catch { return {}; }
}
const popAllowed = () => {
  if (isApp() || isStandalone()) return false;
  const s = popState();
  return !s.done && !(s.until && Date.now() < s.until);
};

/* ---------- Landing ---------- */
let landing = null;

function showLanding(onDone) {
  if (landing) return;
  const d = document.createElement('dialog');
  d.className = 'wl';
  d.setAttribute('aria-labelledby', 'wl-h');
  d.innerHTML = `
    <div class="wl-in">
      <span class="wl-grid" aria-hidden="true"></span><span class="wl-glow" aria-hidden="true"></span>
      <div class="wl-logo"><img src="/logo.svg" alt="" width="36" height="44"></div>
      <p class="eyebrow" data-i18n="welcome.eyebrow"></p>
      <h2 id="wl-h" data-i18n="welcome.title"></h2>
      <p class="wl-sub" data-i18n="welcome.sub"></p>
      <ul class="wl-feats">
        <li><b data-i18n="welcome.f1"></b><small data-i18n="welcome.f1d"></small></li>
        <li><b data-i18n="welcome.f2"></b><small data-i18n="welcome.f2d"></small></li>
        <li><b data-i18n="welcome.f3"></b><small data-i18n="welcome.f3d"></small></li>
      </ul>
      <div class="wl-act">
        <button type="button" class="btn" data-act="go" data-i18n="welcome.cta"></button>
        <button type="button" class="btn ghost" data-act="skip" data-i18n="welcome.skip"></button>
      </div>
    </div>`;
  document.body.appendChild(d);
  applyDom(d);
  const off = onLangChange(() => applyDom(d));
  landing = d;
  const finish = () => {
    if (landing !== d) return;
    landing = null;
    off();
    markWelcomeSeen();
    d.close();
    d.remove();
    onDone && onDone();
  };
  d.addEventListener('click', (e) => { if (e.target.closest('[data-act]')) finish(); });
  d.addEventListener('cancel', (e) => { e.preventDefault(); finish(); });
  d._finish = finish;
  d.showModal();
  d.querySelector('[data-act=go]').focus();
}

/* ---------- Popup unduhan (gaya notifikasi iOS) ---------- */
let pop = null;

function showPopup() {
  if (pop || !popAllowed()) return;
  if (isBusy()) { setTimeout(showPopup, 5000); return; } // jangan ganggu tes yang sedang berjalan
  if (document.querySelector('dialog[open]')) { setTimeout(showPopup, 4000); return; }
  const d = document.createElement('dialog');
  d.className = 'ios';
  d.setAttribute('aria-labelledby', 'ios-h');
  d.setAttribute('aria-describedby', 'ios-b');
  d.innerHTML = `
    <div class="ios-body">
      <img class="ios-icon" src="/icon-192.png" alt="" width="60" height="60">
      <h2 id="ios-h" data-i18n="dlpop.title"></h2>
      <p id="ios-b"></p>
    </div>
    <div class="ios-btns">
      <button type="button" data-act="no" data-i18n="dlpop.no"></button>
      <button type="button" data-act="yes" data-i18n="dlpop.yes"></button>
    </div>`;
  document.body.appendChild(d);
  const paint = () => { applyDom(d); d.querySelector('#ios-b').textContent = t('dlpop.body', { size: apkSize() }); };
  paint();
  const off = onLangChange(paint);
  pop = d;
  const close = () => { if (pop !== d) return; pop = null; off(); d.close(); d.remove(); };
  const later = () => { lsSet(POP_KEY, JSON.stringify({ until: Date.now() + SNOOZE_MS })); close(); };
  const download = () => {
    lsSet(POP_KEY, JSON.stringify({ done: true }));
    // Unduh langsung berkas APK dari website ini (tanpa pengalihan ke toko aplikasi).
    const a = document.createElement('a');
    a.href = APK_URL;
    a.download = 'PingTest-by-RLC-Studio.apk';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    close();
    toast(t('dl.started'));
  };
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b) (b.dataset.act === 'yes' ? download : later)();
  });
  d.addEventListener('cancel', (e) => { e.preventDefault(); later(); });
  d.showModal();
  d.querySelector('[data-act=yes]').focus();
}

/* ---------- Alur awal ---------- */
export function initWelcome() {
  let decided = false;

  // Guest yang sudah melihat landing lalu mendaftar/masuk: akunnya ikut tercatat "sudah dilihat" (lintas perangkat).
  onAuthChange(({ member, changed }) => {
    if (member && changed && welcomeSeenLocal() && !welcomeSeenByAccount()) markWelcomeSeen();
  });

  const decide = () => {
    if (decided) return;
    decided = true;
    const member = isMember();
    let seen;
    if (member) {
      seen = welcomeSeenByAccount();
      // Akun baru di perangkat yang sudah pernah menampilkan landing sebagai Guest: catat diam-diam.
      if (!seen && welcomeSeenLocal()) { markWelcomeSeen(); seen = true; }
    } else {
      seen = welcomeSeenLocal();
    }
    if (!seen) showLanding(() => setTimeout(showPopup, 1200));
    else setTimeout(showPopup, 2500);
  };

  // Jika sesi mungkin ada, tunggu Supabase memastikan status akun (tanpa berkedip). Maks 4 detik.
  if (mayHaveSession()) {
    const off = onAuthChange(() => {
      off();
      if (!decided) { clearTimeout(timer); decide(); }
      else if (isMember() && landing && welcomeSeenByAccount()) landing._finish(); // akun ternyata sudah pernah melihat
    });
    const timer = setTimeout(decide, AUTH_WAIT_MS);
  } else {
    decide();
  }
}
