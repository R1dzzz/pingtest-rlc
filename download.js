import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles.css';

import { initShell, toast } from './shell.js';
import { t } from './i18n.js';
import { ANDROID_LATEST, APK_BYTES } from './site.config.js';
import { bytesText } from './util.js';

initShell();

const SHA = typeof __APK_SHA256__ === 'string' ? __APK_SHA256__ : '';
const SIZE = (typeof __APK_SIZE__ === 'number' && __APK_SIZE__) || APK_BYTES;

const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
set('dl-ver', ANDROID_LATEST.versionName);
set('dl-size', bytesText(SIZE));
set('dl-sha', SHA || '—');

const copy = document.getElementById('dl-copy');
if (copy) {
  if (!SHA) copy.hidden = true;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SHA);
      toast(t('dl.copied'));
    } catch {
      toast(t('dl.copyFail'));
    }
  });
}

const apk = document.getElementById('dl-apk');
if (apk) apk.addEventListener('click', () => toast(t('dl.started')));
