# PingTest by RLC

Website tes kecepatan & kualitas internet (download, upload, HTTP latency, jitter, estimasi bufferbloat).
Frontend-only (Vite + JavaScript), memakai mesin ukur resmi [`@cloudflare/speedtest`](https://github.com/cloudflare/speedtest) (MIT).

- Developer: Rogue Logic Creations (RLC)
- Ide: Farid Alfiyansah — SMK Tamtama Karanganyar, TJKT
- Build command: `npm run build` · Output directory: `dist`

## Struktur file (datar, tanpa folder)

Semua file ada di root repo supaya bisa diunggah sekaligus dari browser HP.

```
pingtest-by-rlc/
├── index.html              Halaman utama (tes, diagnostik, riwayat, penjelasan)
├── about.html              Halaman Tentang (Disusun oleh + My AI Team)
├── main.js                 Logika halaman utama
├── about.js                Avatar GitHub (dengan placeholder jika gagal)
├── engine.js               Pembungkus @cloudflare/speedtest + profil tes
├── gauge.js                Speedometer SVG
├── charts.js               Grafik garis SVG
├── history.js              Riwayat LocalStorage + ekspor CSV/JSON
├── netinfo.js              Info koneksi browser (Network Information API)
├── util.js                 Fungsi bantu + estimasi bufferbloat
├── site.config.js          Pengaturan (mis. kirim hasil ke Cloudflare)
├── styles.css              Seluruh gaya
├── vite.config.js          Konfigurasi Vite (+ sitemap, robots, URL situs)
├── vercel.json             URL bersih (/about) + header keamanan
├── package.json            Dependensi
├── package-lock.json       Versi terkunci
├── manifest.webmanifest    Web manifest
├── logo.svg                Logo RLC (vektor dari logo Anda)
├── favicon.svg / favicon.ico / apple-touch-icon.png
├── icon-192.png / icon-512.png / icon-maskable-512.png
├── og-image.png            Gambar pratinjau (Open Graph / Twitter)
└── brand-claude.svg, brand-chatgpt.svg, brand-grok.svg, brand-kimi.svg
```

`sitemap.xml` dan `robots.txt` dibuat otomatis saat build (ada di `dist/`).

## Upload ke GitHub lewat HP Android (tanpa terminal)

1. Ekstrak `pingtest-by-rlc.zip` (aplikasi **Files by Google** → ketuk file zip → **Ekstrak**).
2. Buka **github.com** di Chrome, login, lalu buka **github.com/new**.
   - Repository name: `pingtest-by-rlc`
   - Pilih Public atau Private (keduanya bisa di-deploy Vercel), jangan centang "Add a README".
   - Ketuk **Create repository**.
3. Di halaman repo kosong, ketuk tautan **uploading an existing file**.
4. Ketuk **choose your files**, buka folder hasil ekstrak, **pilih semua file** (ketuk lama lalu "Pilih semua"), lalu ketuk Buka/Pilih.
   - Jika Chrome HP memakai tampilan mobile dan tombol tidak muncul, aktifkan **Situs desktop** di menu ⋮ Chrome.
   - Pastikan semua file berada di **root** (tidak ada folder), termasuk `package.json`.
5. Tunggu semua file selesai terunggah, isi pesan commit (mis. `Initial commit`), ketuk **Commit changes**.

## Deploy ke Vercel lewat HP

1. Buka **vercel.com**, login dengan **Continue with GitHub**.
2. Ketuk **Add New… → Project**, pilih repo `pingtest-by-rlc` → **Import** (beri izin akses GitHub jika diminta).
3. Framework Preset akan terdeteksi **Vite**. Pastikan:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Ketuk **Deploy**, tunggu 1–2 menit sampai muncul "Congratulations".

### Cara memeriksa hasilnya

- Buka URL Vercel Anda, tekan **MULAI**, tunggu tes selesai. Pastikan angka download/upload/latency muncul.
- Buka `/about`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`.
- Tes lagi lalu cek bagian **Riwayat**; coba **Ekspor CSV/JSON**.
- Jika Vercel memberi domain selain `pingtest-by-rlc.vercel.app`, build otomatis memakai domain produksi Vercel untuk canonical/sitemap. Untuk domain kustom, tambahkan Environment Variable `SITE_URL` (mis. `https://namadomain.com`) di Vercel → Settings → Environment Variables, lalu **Redeploy**.

## SEO: langkah setelah online

1. Buka **search.google.com/search-console**, tambahkan URL situs Anda (jenis "URL prefix").
2. Kirim `https://DOMAIN-ANDA/sitemap.xml` di menu **Sitemaps**.
3. Pakai **URL Inspection → Request indexing** untuk `/` dan `/about`.

Indexing Google butuh waktu (hari hingga minggu); tidak ada yang bisa menjamin peringkat tertentu.

## Mengubah sesuatu

Lewat GitHub di HP: buka file → ikon pensil ✏️ → ubah → **Commit changes**. Vercel otomatis deploy ulang.

- Teks halaman Tentang: `about.html`
- Matikan pengiriman hasil ke Cloudflare: `site.config.js` → `SEND_RESULTS_TO_CLOUDFLARE = false`
- Warna: variabel di bagian atas `styles.css`

## Catatan teknis & kejujuran pengukuran

- Semua angka berasal dari `@cloudflare/speedtest`; tidak ada angka simulasi. Metrik yang gagal diukur ditampilkan "—" beserta alasannya.
- **Latency = HTTP latency** ke edge Cloudflare, bukan ICMP ping.
- **Packet loss tidak ditampilkan** karena butuh server TURN yang tidak dikonfigurasi.
- **Bufferbloat** hanya estimasi: selisih HTTP latency saat terbebani vs idle, dikelompokkan A+–F.
- Latency terbebani hanya tersedia bila transfer cukup lama untuk membebani koneksi.
- Jarum speedometer bergerak setiap satu pengukuran selesai (bukan aliran kontinu), karena library melaporkan hasil per permintaan.
- Library mengirim ringkasan hasil ke Cloudflare (`speed.cloudflare.com/__results`) untuk insight agregat. Hal ini dijelaskan di situs. Situs ini sendiri tidak punya backend, akun, cookie, atau analitik.
- Profil **Hemat data** memakai maks. ± 48 MB dan kurang akurat untuk koneksi di atas ± 100 Mbps. Profil **Standar** memakai pengaturan bawaan Cloudflare.
- Avatar di halaman Tentang dimuat dari `github.com/r1dzzz.png`; jika gagal, tampil placeholder logo RLC.

## Lisensi & merek dagang pihak ketiga

- `@cloudflare/speedtest` — MIT.
- Font Instrument Sans dan JetBrains Mono (via `@fontsource-variable`) — SIL OFL 1.1.
- Logo Claude, ChatGPT/OpenAI, Grok, Kimi (SVG dari paket `@lobehub/icons-static-svg`, MIT) serta ikon GitHub adalah merek dagang pemiliknya, dipakai hanya untuk menyebut alat yang digunakan, tanpa afiliasi.
- Lisensi kode proyek ini belum ditentukan; tambahkan file `LICENSE` sesuai pilihan Anda.
