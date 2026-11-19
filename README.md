# PingTest by RLC

Internet speed & network quality test — powered by Cloudflare Speed Test engine.

- **Product**: PingTest by RLC
- **Developer**: Rogue Logic Creations (RLC)
- **Idea Originator**: Farid Alfiyansah — SMK Tamtama Karanganyar, TJKT
- **Stack**: Vite + Vanilla JS + `@cloudflare/speedtest`
- **Hosting**: Vercel (static)
- **Repository name**: `pingtest-by-rlc`

---

## ⚠️ Sebelum Upload — Ganti URL Canonical

Setelah deploy ke Vercel, ganti `https://pingtest-by-rlc.vercel.app/` di:

- `index.html` (canonical, og:url, og:image, twitter:image, structured data)
- `about.html` (canonical, og:url)
- `public/robots.txt` (Sitemap)
- `public/sitemap.xml` (loc)

---

## Persyaratan

- Node.js 18+ (untuk build lokal — opsional jika pakai Vercel)
- Akun GitHub
- Akun Vercel (gratis)

**Pengguna Android murni** tidak butuh Node.js di HP — Vercel build otomatis.

---

## Struktur
