import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles.css';

import { initShell } from './shell.js';
import { t, locale, onLangChange } from './i18n.js';

initShell();

// Usia dihitung otomatis dari tanggal lahir (04 Oktober 2007), mengikuti tanggal perangkat hari ini.
function ageFrom(dobIso, now = new Date()) {
  const [y, m, d] = dobIso.split('-').map(Number);
  let age = now.getFullYear() - y;
  const before = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  if (before) age -= 1;
  return age;
}

function paintFacts() {
  const ageEl = document.getElementById('age');
  if (ageEl) ageEl.textContent = t('about.age', { n: ageFrom(ageEl.dataset.dob) });
  const dob = document.getElementById('dob');
  if (dob) {
    const [y, m, d] = dob.getAttribute('datetime').split('-').map(Number);
    dob.textContent = new Date(y, m - 1, d).toLocaleDateString(locale(), { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
paintFacts();
onLangChange(paintFacts);

// Avatar GitHub asli (jika bisa dimuat). Jika gagal/offline, placeholder logo RLC tetap tampil.
const box = document.getElementById('avatar');
if (box) {
  const img = new Image();
  img.alt = '';
  img.width = 96;
  img.height = 96;
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    box.replaceChildren(img);
    box.classList.add('has-photo');
  };
  img.src = 'https://github.com/r1dzzz.png?size=192';
}
