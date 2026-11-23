<div align="center">

<img src="readme-banner.svg" alt="PingTest by RLC" width="100%">

<img src="readme-typing.svg" alt="ping --real --no-simulation" height="44">

<p>
  <a href="https://pingtest-rlc.vercel.app"><img alt="Live" src="https://img.shields.io/badge/LIVE-pingtest--rlc.vercel.app-c6f432?style=for-the-badge&labelColor=0d0f11"></a>
  <a href="https://pingtest-rlc.vercel.app/download"><img alt="Download APK" src="https://img.shields.io/badge/ANDROID-Download%20APK-3ddc84?style=for-the-badge&logo=android&logoColor=white&labelColor=0d0f11"></a>
</p>

<p>
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
  <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-speedtest-F38020?style=flat-square&logo=cloudflare&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel&logoColor=white">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Offline%20shell-5A0FC8?style=flat-square&logo=pwa&logoColor=white">
  <img alt="Android" src="https://img.shields.io/badge/Android-APK%20v2.0.0-3DDC84?style=flat-square&logo=android&logoColor=white">
  <img alt="i18n" src="https://img.shields.io/badge/i18n-ID%20%7C%20EN-c6f432?style=flat-square">
  <img alt="Tema" src="https://img.shields.io/badge/Theme-Dark%20%7C%20Light-9097a0?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue?style=flat-square">
</p>

<img src="readme-rlc-badge.svg" alt="RLC Repository of the Month" width="320">

<sub>Lencana di atas hanyalah elemen dekoratif gaya RLC. Ini <b>bukan</b> penghargaan resmi dari GitHub maupun pihak mana pun.</sub>

</div>

---

## Tentang

**PingTest by RLC** adalah website tes kecepatan dan kualitas internet: download, upload, latency, jitter, dan estimasi bufferbloat, diukur langsung dari browser ke jaringan Cloudflare memakai mesin resmi [`@cloudflare/speedtest`](https://github.com/cloudflare/speedtest) (MIT). Setiap angka berasal dari pengukuran nyata, bukan simulasi.

Dikembangkan oleh **Rogue Logic Creations (RLC)** dari ide **Farid Alfiyansah**, siswa TJKT SMK Tamtama Karanganyar.

## Tampilan

<div align="center">
  <img src="readme-preview-desktop.png" alt="Halaman utama (desktop)" width="62%">
  <img src="readme-preview-welcome.png" alt="Landing pertama (mobile)" width="17%">
  <img src="readme-preview-download.png" alt="Halaman Download (mobile)" width="17%">
</div>

## Fitur

| | |
|---|---|
| **Tes nyata** | Download, upload, latency, jitter, estimasi bufferbloat; profil *Hemat data* dan *Standar*. |
| **Diagnostik RLC** | Kelayakan streaming, video call, game, dan cloud, lengkap dengan saran dan perbandingan dengan tes sebelumnya. |
| **Riwayat** | Tersimpan di perangkat (Guest) atau di akun (Member); ekspor CSV/JSON dan bagikan sebagai gambar. |
| **Akun Member** | Supabase Auth + RLS: setiap akun hanya bisa membaca datanya sendiri. Pengaturan tersinkron lintas perangkat. |
| **Landing pertama** | Ditampilkan sekali per akun (lintas perangkat); Guest sekali per perangkat. |
| **Download APK** | Popup gaya notifikasi iOS dan halaman `/download` mengunduh APK langsung dari website, lengkap dengan SHA-256 yang dihitung saat build. |
| **Dwibahasa & tema** | Indonesia / English, Gelap / Terang / Sistem, mode Glass dan animasi. |
| **PWA** | Dapat dipasang dari Chrome; service worker hanya menyimpan berkas statis publik. |
| **Privasi** | Tanpa cookie pelacak dan tanpa analytics. |

## Teknologi

Vite 8 (multi-page) · JavaScript murni · `@cloudflare/speedtest` · Supabase (Auth + Postgres) · Vercel · Service Worker.


## Developer

**Farid Alfiyansah** — [@r1dzzz](https://github.com/r1dzzz) · Rogue Logic Creations (RLC) · SMK Tamtama Karanganyar, TJKT.

## Lisensi

Kode situs: lihat [LICENSE](LICENSE). `@cloudflare/speedtest` berlisensi MIT. Nama dan logo Claude, ChatGPT, Grok, Kimi, serta logo sekolah dan LPKS X Japan adalah milik masing-masing pemiliknya dan hanya dipakai untuk identifikasi.

<div align="center"><sub>Dibuat dengan ⚡ oleh RLC</sub></div>
