import { defineConfig } from 'vite';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ANDROID_LATEST, APK_URL, ITCH_URL } from './site.config.js';

const root = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
// ID build unik per build: dipakai service worker, version.json, dan pemeriksa pembaruan di aplikasi.
const BUILD_ID = Date.now().toString(36);

// Ukuran & SHA-256 APK dihitung saat build agar halaman Download tidak pernah memakai angka usang.
let APK_SIZE = 0;
let APK_SHA = '';
try {
  const buf = readFileSync(resolve(root, 'PingTest-by-RLC-Studio.apk'));
  APK_SIZE = buf.length;
  APK_SHA = createHash('sha256').update(buf).digest('hex');
} catch { /* APK tidak ada: halaman menampilkan tanda strip */ }

// Alamat situs untuk canonical, Open Graph, sitemap, dan robots.
// Prioritas: variabel SITE_URL (opsional, atur di Vercel) → domain produksi Vercel → tebakan default.
function siteUrl() {
  const env = process.env.SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (v) return 'https://' + v.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return 'https://pingtest-rlc.vercel.app';
}

// File statis yang disalin apa adanya ke dist/ (semua berada di root repo agar mudah diunggah dari HP).
const STATIC_FILES = [
  'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'og-image.png', 'manifest.webmanifest', 'logo.svg',
  'brand-claude.svg', 'brand-chatgpt.svg', 'brand-grok.svg', 'brand-kimi.svg',
  'logo-smk-tamtama.webp', 'logo-lpks-x-japan.webp', 'offline.html', 'brand-itchio.svg', 'PingTest-by-RLC-Studio.apk',
];

function rlcSite() {
  const site = siteUrl();
  const rewrite = (req, _res, next) => {
    const path = (req.url || '').split('?')[0];
    const map = { '/about': '/about.html', '/download': '/download.html' };
    if (map[path]) req.url = map[path] + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    next();
  };
  return {
    name: 'rlc-site',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('__SITE_URL__', site).replaceAll('__APK_VERSION__', ANDROID_LATEST.versionName),
    },
    generateBundle() {
      for (const f of STATIC_FILES) {
        this.emitFile({ type: 'asset', fileName: f, source: readFileSync(resolve(root, f)) });
      }
      // Service Worker: sisipkan ID build agar cache lama dibuang setiap ada deploy baru.
      this.emitFile({
        type: 'asset', fileName: 'sw.js',
        source: readFileSync(resolve(root, 'sw.js'), 'utf8').replace('__BUILD_ID__', BUILD_ID),
      });
      // version.json: dipakai Pemeriksa Pembaruan (website & aplikasi Android). Tidak berisi data pribadi.
      let apkBytes = 0;
      try { apkBytes = statSync(resolve(root, 'PingTest-by-RLC-Studio.apk')).size; } catch { /* APK tidak ada */ }
      this.emitFile({
        type: 'asset', fileName: 'version.json',
        source: JSON.stringify({
          web: { version: pkg.version, build: BUILD_ID },
          android: { ...ANDROID_LATEST, apk: APK_URL, apkBytes, itch: ITCH_URL },
        }, null, 2) + '\n',
      });
      this.emitFile({
        type: 'asset', fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n  <url><loc>${site}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n  <url><loc>${site}/download</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n</urlset>\n`,
      });
    },
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  publicDir: false,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version), __BUILD_ID__: JSON.stringify(BUILD_ID),
    __APK_SHA256__: JSON.stringify(APK_SHA), __APK_SIZE__: JSON.stringify(APK_SIZE),
  },
  plugins: [rlcSite()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { main: resolve(root, 'index.html'), about: resolve(root, 'about.html'), download: resolve(root, 'download.html') },
    },
  },
});
