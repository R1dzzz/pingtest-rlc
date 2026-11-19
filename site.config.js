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
