import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

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
];

function rlcSite() {
  const site = siteUrl();
  const rewrite = (req, _res, next) => {
    const path = (req.url || '').split('?')[0];
    if (path === '/about') req.url = '/about.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    next();
  };
  return {
    name: 'rlc-site',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('__SITE_URL__', site),
    },
    generateBundle() {
      for (const f of STATIC_FILES) {
        this.emitFile({ type: 'asset', fileName: f, source: readFileSync(resolve(root, f)) });
      }
      this.emitFile({
        type: 'asset', fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>\n  <url><loc>${site}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>\n`,
      });
    },
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [rlcSite()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { main: resolve(root, 'index.html'), about: resolve(root, 'about.html') },
    },
  },
});
