// Pengaturan situs yang aman dipakai di browser (tanpa rahasia / API key).

// Library @cloudflare/speedtest secara bawaan mengirim ringkasan hasil tes ke Cloudflare
// (https://speed.cloudflare.com/__results) untuk insight agregat kualitas internet.
// Ubah ke `false` jika Anda ingin mematikan pengiriman itu. Teks privasi di situs
// akan menyesuaikan otomatis.
export const SEND_RESULTS_TO_CLOUDFLARE = true;

// Batas jumlah riwayat yang disimpan di LocalStorage (yang terlama dibuang).
export const HISTORY_LIMIT = 100;

export const STORAGE_KEY = 'pingtest-rlc:history:v1';
export const PREF_KEY = 'pingtest-rlc:prefs:v1';

// Unduhan aplikasi Android (dibuat dengan webtoappcreator.com).
// APK disimpan di repo ini dan dilayani dari root situs. Ganti APK_BYTES jika berkas APK diperbarui.
export const APK_URL = '/PingTest-by-RLC-Studio.apk';
export const APK_BYTES = 6196441;
export const ITCH_URL = 'https://f-alfiyansah.itch.io/pingtest-by-rlc';
