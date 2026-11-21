/* PingTest by RLC — Service Worker
 * Tujuan: aplikasi dapat dipasang (PWA) dan menampilkan halaman offline yang jelas.
 * Prinsip keamanan/privasi:
 *  - Hanya menangani permintaan GET ke origin yang sama (berkas statis situs).
 *  - Permintaan lintas-origin (Cloudflare speed test, Supabase, avatar GitHub) TIDAK disentuh sama sekali,
 *    jadi tidak ada hasil tes, token, atau data akun yang masuk cache. Speed test selalu butuh internet.
 *  - Cache hanya berisi berkas publik yang sama untuk semua pengunjung (HTML, JS, CSS, ikon, font).
 */
const BUILD = '__BUILD_ID__';
const CACHE = 'pingtest-rlc-' + BUILD;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/logo.svg', '/favicon.svg', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pingtest-rlc-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const STATIC_RE = /\.(?:js|css|png|svg|ico|webp|woff2|webmanifest)$/;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // lintas-origin: biarkan browser menanganinya
  if (url.pathname === '/sw.js') return;

  // Halaman: jaringan dulu (selalu terbaru), cadangan dari cache, terakhir halaman offline.
  if (req.mode === 'navigate') {
    const key = url.origin + url.pathname; // abaikan query/hash agar token di URL tidak ikut tersimpan
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(key)) || (await caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Aset statis (nama berhash, tidak berubah): cache dulu, isi dari jaringan jika belum ada.
  if (url.pathname.startsWith('/assets/') || STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});
