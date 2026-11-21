// Dua bahasa: Indonesia (id) dan English (en).
// - Teks HTML bawaan ditulis dalam bahasa Indonesia (baik untuk SEO); saat init, teks itu "diambil"
//   sebagai kamus id untuk kunci yang sama. Kunci dinamis (JS) ada di STR.id di bawah.
// - Deteksi otomatis dari bahasa browser. Pilihan manual (tombol ID/EN) disimpan dan TIDAK PERNAH
//   ditimpa deteksi otomatis berikutnya.

const KEY = 'pingtest-rlc:lang:v1';
export const LANGS = ['id', 'en'];

export const STR = {
  id: {
    'status.ready': 'Siap. Pilih profil lalu tekan MULAI.',
    'status.connect': 'Menghubungi server Cloudflare…',
    'status.latency': 'Mengukur latency…',
    'status.download': 'Mengukur download…',
    'status.upload': 'Mengukur upload…',
    'status.done': 'Tes selesai.',
    'status.donePartial': 'Tes selesai sebagian. {note}',
    'status.failed': 'Tes gagal: {reason}',
    'status.cancelled': 'Tes dibatalkan. Tidak ada hasil yang disimpan.',
    'status.fast': ' Koneksi Anda cepat; profil Hemat data memakai file maksimal 10 MB sehingga bisa mengukur lebih rendah. Pilih Standar untuk hasil lebih akurat.',
    'status.cloudSaved': ' Tersimpan di riwayat akun.',
    'status.cloudFail': ' Gagal menyimpan ke akun (tersimpan di perangkat ini).',
    'gauge.partial': 'HASIL PARSIAL',
    'gauge.failed': 'TES GAGAL',
    'gauge.down': 'DOWNLOAD',
    'gauge.up': 'UPLOAD',
    'tag.wait': 'menunggu',
    'tag.measuring': 'mengukur…',
    'tag.live': 'sementara',
    'tag.done': 'selesai',
    'tag.na': 'tidak tersedia',
    'profile.hint.hemat': 'Maks. ± 48 MB. Cocok untuk kuota terbatas; kurang akurat untuk koneksi di atas ± 100 Mbps.',
    'profile.hint.standar': 'Pengaturan bawaan Cloudflare. Pada koneksi cepat bisa memakai ratusan MB.',
    'consent.cf': 'Dengan menekan MULAI, Anda setuju hasil tes dapat dikumpulkan Cloudflare untuk insight agregat. <a href="#privasi">Detail privasi</a>',
    'consent.nocf': 'Tes mengirim permintaan ke server pengukuran Cloudflare. Hasil tidak dikirim untuk insight agregat. <a href="#privasi">Detail privasi</a>',
    'privacy.cf': 'Cloudflare dapat mengumpulkan hasil tes untuk menghitung insight agregat kualitas internet. Alamat IP Anda tentu terlihat oleh server tujuan, seperti pada setiap koneksi internet.',
    'privacy.nocf': 'Pengiriman hasil ke Cloudflare untuk insight agregat dimatikan pada situs ini. Alamat IP Anda tetap terlihat oleh server pengukuran, seperti pada setiap koneksi internet.',
    'unit.sec': 'dtk',
    'dlat.idle': 'Idle',
    'dlat.down': 'Saat download',
    'dlat.up': 'Saat upload',
    'dlat.na': 'tidak tersedia',
    'dlat.jitter': ' · jitter {v} ms',
    'dlat.unavailable': 'Latency terbebani tidak tersedia: transfer terlalu singkat untuk membebani koneksi (umum pada koneksi sangat cepat dengan profil Hemat data) atau pengukurannya gagal.',
    'bb.none': 'Belum ada data',
    'bb.title': '{label} · naik {ms} ms saat jaringan terbebani',
    'bb.desc': '{desc} Estimasi dari selisih HTTP latency terbebani ({loaded} ms) dan idle ({idle} ms).',
    'bb.unavailable': 'Tidak tersedia: butuh latency idle dan latency terbebani yang sama-sama berhasil diukur.',
    'bb.prompt': 'Jalankan tes untuk melihat estimasi.',
    'bb.l.A+': 'Sangat baik', 'bb.l.A': 'Baik', 'bb.l.B': 'Cukup', 'bb.l.C': 'Kurang baik', 'bb.l.D': 'Buruk', 'bb.l.F': 'Sangat buruk',
    'bb.d.A+': 'Latency hampir tidak naik saat jaringan penuh.',
    'bb.d.A': 'Kenaikan kecil; video call dan game online umumnya aman.',
    'bb.d.B': 'Terasa sedikit saat ada unduhan besar berjalan bersamaan.',
    'bb.d.C': 'Panggilan video/game bisa lag ketika ada unduhan atau unggahan.',
    'bb.d.D': 'Latency melonjak saat jaringan sibuk; aktivitas real-time terganggu.',
    'bb.d.F': 'Latency naik sangat tinggi saat jaringan sibuk.',
    'chart.thr.desc': 'Kecepatan tiap permintaan selama tes ini (Mbps). Permintaan kecil cenderung lebih lambat karena TCP belum "panas".',
    'chart.lat.desc': 'Sampel HTTP latency (ms) berurutan: idle vs saat download/upload berjalan.',
    'chart.his.desc': 'Tren hasil dari riwayat tes (terlama ke terbaru).',
    'chart.empty.thr': 'Jalankan tes untuk melihat grafik throughput.',
    'chart.empty.lat': 'Jalankan tes untuk melihat grafik latency.',
    'chart.empty.his': 'Belum ada riwayat untuk digambar.',
    'chart.touch': 'Sentuh grafik untuk melihat nilai.',
    'chart.title.thr': 'Throughput per permintaan',
    'chart.title.lat': 'Latency per sampel',
    'chart.title.his': 'Tren riwayat',
    'chart.s.down': 'Download', 'chart.s.up': 'Upload', 'chart.s.idle': 'Idle',
    'chart.x.sec': 'detik', 'chart.x.sample': 'sampel ke-', 'chart.x.test': 'tes ke-',
    'chart.pt.req': '{t} dtk · {size}', 'chart.pt.sample': 'sampel #{n}',
    'conn.status': 'Status browser', 'conn.online': 'Online', 'conn.offline': 'Offline', 'conn.unknown': 'Tidak diketahui',
    'conn.eff': 'Tipe efektif', 'conn.down': 'Downlink (estimasi)', 'conn.rtt': 'RTT (estimasi)', 'conn.save': 'Mode hemat data',
    'conn.type': 'Jenis koneksi', 'conn.on': 'Aktif', 'conn.off': 'Nonaktif', 'conn.na': 'Tidak tersedia',
    'conn.note.yes': 'Nilai ini estimasi dari browser, bukan hasil tes, dan bisa berbeda dengan hasil di atas.',
    'conn.note.no': 'Browser ini tidak menyediakan Network Information API (umum pada Safari dan Firefox). Hasil tes tidak terpengaruh.',
    'his.lede.guest': 'Tanpa login, riwayat disimpan hanya di browser ini (LocalStorage), maksimal {n} hasil terakhir.',
    'his.lede.member': 'Riwayat cloud akun Anda. Hanya akun Anda yang dapat membacanya.',
    'his.loading': 'Memuat riwayat akun…',
    'his.cloudError': 'Riwayat akun tidak dapat dimuat saat ini. Periksa koneksi lalu muat ulang halaman.',
    'his.warn.storage': 'Penyimpanan browser tidak tersedia (mungkin mode privat). Riwayat hanya bertahan selama tab ini terbuka.',
    'his.gate': 'Masuk untuk menyimpan riwayat di cloud, mengekspor CSV/JSON, dan membagikan hasil sebagai gambar.',
    'his.import.text': 'Ada {n} hasil tes tersimpan di perangkat ini. Unggah ke akun Anda agar ikut tersimpan di cloud?',
    'his.import.confirm': 'Unggah {n} hasil tes dari perangkat ini ke akun Anda? Data lokal akan dihapus setelah berhasil.',
    'his.import.done': '{n} hasil tes berhasil diunggah ke akun.',
    'his.import.fail': 'Gagal mengunggah riwayat lokal. Data lokal tidak dihapus.',
    'his.clear.confirm': 'Hapus semua riwayat tes Anda?',
    'his.clear.confirmCloud': 'Hapus SEMUA riwayat tes di akun Anda? Tindakan ini tidak dapat dibatalkan.',
    'his.p.hemat': 'Hemat data', 'his.p.standar': 'Standar', 'his.partial': 'parsial',
    'his.share.item': 'Bagikan hasil {d}', 'his.del.item': 'Hapus hasil {d}', 'his.bloat': 'bloat',
    'his.exported': 'Berkas {f} diunduh.',
    'his.exportFail': 'Gagal mengambil seluruh riwayat dari akun.',
    'his.shared': 'Riwayat dibagikan.',
    'his.sharedFallback': 'Berbagi berkas tidak didukung; berkas diunduh.',
    'err.offline': 'Perangkat sedang offline. Sambungkan ke internet lalu coba lagi.',
    'err.http': 'Server pengukuran membalas HTTP {status}. Mungkin dibatasi sementara atau diblokir jaringan Anda.',
    'err.timing': 'Permintaan terlalu lama atau data waktu dari browser tidak tersedia. Coba lagi dengan koneksi yang lebih stabil.',
    'err.generic': 'Tidak dapat menjangkau server pengukuran Cloudflare. Kemungkinan koneksi terputus atau diblokir (VPN, firewall sekolah, pemblokir iklan/DNS). Browser tidak memberi tahu penyebab pastinya.',
    'err.load': 'Gagal memuat mesin pengukur. Periksa koneksi lalu muat ulang halaman.',
    'err.init': 'Mesin pengukur gagal diinisialisasi di browser ini.',
    'err.start': 'Tes tidak dapat dimulai di browser ini.',
    'err.lost': 'Koneksi terputus saat tes berjalan. Hasil tes dibatalkan agar tidak menyesatkan.',
    'note.timeout': 'Tes dihentikan lebih awal karena batas waktu; hasil berasal dari data yang sempat terkumpul.',
    'note.partial': 'Sebagian metrik tidak tersedia karena pengukurannya gagal atau terlalu singkat.',
    // Autentikasi
    'auth.cta': 'Masuk / Daftar',
    'auth.login': 'Masuk', 'auth.register': 'Daftar', 'auth.close': 'Tutup',
    'auth.title.login': 'Masuk ke PingTest', 'auth.title.register': 'Buat akun Member',
    'auth.title.forgot': 'Atur ulang kata sandi', 'auth.title.recovery': 'Kata sandi baru',
    'auth.intro': 'Tes kecepatan tetap bisa dipakai tanpa login. Akun Member membuka riwayat cloud, tema, ekspor, dan berbagi hasil.',
    'auth.reason': 'Fitur ini khusus Member. Masuk atau daftar untuk melanjutkan; tindakan Anda akan dilanjutkan otomatis.',
    'auth.email': 'Email', 'auth.password': 'Kata sandi', 'auth.password2': 'Ulangi kata sandi',
    'auth.show': 'Tampilkan', 'auth.hide': 'Sembunyikan',
    'auth.submit.login': 'Masuk', 'auth.submit.register': 'Buat akun', 'auth.submit.forgot': 'Kirim tautan', 'auth.submit.recovery': 'Simpan kata sandi',
    'auth.forgot': 'Lupa kata sandi?', 'auth.back': 'Kembali ke masuk',
    'auth.busy': 'Memproses…',
    'auth.err.email': 'Masukkan alamat email yang valid.',
    'auth.err.pwShort': 'Kata sandi minimal 8 karakter.',
    'auth.err.pwMatch': 'Kata sandi dan pengulangannya tidak sama.',
    'auth.err.invalid': 'Email atau kata sandi salah.',
    'auth.err.exists': 'Email ini sudah terdaftar. Silakan masuk.',
    'auth.err.unconfirmed': 'Email belum dikonfirmasi. Periksa kotak masuk Anda.',
    'auth.err.weak': 'Kata sandi terlalu lemah. Gunakan kombinasi yang lebih panjang.',
    'auth.err.rate': 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.',
    'auth.err.disabled': 'Pendaftaran sedang dinonaktifkan.',
    'auth.err.network': 'Tidak dapat terhubung ke server akun. Periksa koneksi Anda.',
    'auth.err.generic': 'Terjadi kesalahan. Coba lagi.',
    'auth.err.notConfigured': 'Login belum dikonfigurasi di situs ini (Supabase belum diatur). Tes kecepatan tetap bisa dipakai sebagai Guest.',
    'auth.ok.checkEmail': 'Akun dibuat. Periksa email Anda untuk konfirmasi, lalu masuk.',
    'auth.ok.reset': 'Jika email terdaftar, tautan atur ulang kata sandi telah dikirim.',
    'auth.ok.pwUpdated': 'Kata sandi diperbarui.',
    'auth.ok.signedIn': 'Berhasil masuk.',
    'auth.ok.signedOut': 'Anda telah keluar.',
    // Akun & pengaturan
    'acct.login': 'Masuk', 'acct.settingsAria': 'Pengaturan', 'acct.accountAria': 'Akun',
    'lang.aria': 'Ganti bahasa ke {other}',
    'set.title': 'Pusat Pengaturan',
    'set.lang': 'Bahasa', 'set.langHint': 'Tersedia untuk semua pengunjung.',
    'set.look': 'Tampilan (Member)',
    'set.theme': 'Tema', 'set.dark': 'Gelap', 'set.light': 'Terang',
    'set.glass': 'Glass UI', 'set.motion': 'Animasi', 'set.sound': 'Suara',
    'set.soundHint': 'Nada singkat saat tes mulai, selesai, atau gagal.',
    'set.lock': 'Khusus Member',
    'set.account': 'Akun', 'set.guest': 'Anda memakai situs sebagai Guest.', 'set.signedAs': 'Masuk sebagai {email}',
    'set.logout': 'Keluar',
    'set.app': 'Aplikasi', 'set.install': 'Pasang sebagai aplikasi', 'set.installed': 'Aplikasi sudah terpasang.',
    'set.installNA': 'Pasang lewat menu browser (⋮ → Tambahkan ke layar utama) jika tombol tidak muncul.',
    'set.needsNet': 'Tes kecepatan tetap membutuhkan internet.',
    'set.saved': 'Pengaturan disimpan.',
    'set.saveFail': 'Pengaturan diterapkan, tetapi gagal disimpan ke akun.',
    // Gate
    'gate.theme': 'Mode terang/gelap', 'gate.glass': 'Glass UI', 'gate.motion': 'Pengaturan animasi', 'gate.sound': 'Pengaturan suara',
    'gate.share': 'Berbagi hasil', 'gate.export': 'Ekspor riwayat', 'gate.shareHis': 'Berbagi riwayat',
    // Share
    'share.title': 'Bagikan hasil tes',
    'share.native': 'Bagikan', 'share.download': 'Unduh PNG', 'share.copy': 'Salin gambar',
    'share.copied': 'Gambar disalin.', 'share.downloaded': 'Gambar diunduh.', 'share.sharedOk': 'Dibagikan.',
    'share.fail': 'Gagal membuat gambar.', 'share.copyFail': 'Browser ini tidak mengizinkan penyalinan gambar. Gunakan Unduh PNG.',
    'share.alt': 'Pratinjau gambar hasil tes',
    'share.text': 'Hasil PingTest by RLC: ↓ {down} Mbps · ↑ {up} Mbps · latency {lat} ms · jitter {jit} ms',
    'card.sub': 'Internet Speed Test', 'card.lat': 'LATENCY (HTTP)', 'card.jit': 'JITTER',
    'card.measured': 'Diukur dengan @cloudflare/speedtest', 'card.profile': 'Profil',
    'card.bloat': 'Bufferbloat',
    // About
    'about.age': '{n} tahun',
    'meta.index.title': 'PingTest by RLC — Internet Speed Test & RLC Network Diagnostics',
    'toast.close': 'Tutup',
  },
  en: {
    'skip': 'Skip to content',
    'brand.home': 'PingTest by RLC — home',
    'nav.label': 'Main navigation',
    'nav.test': 'Test', 'nav.diag': 'Diagnostics', 'nav.history': 'History', 'nav.about': 'About',
    'hero.sub': 'Internet speed & quality test',
    'hero.lede': 'Measure download, upload, latency, jitter, and an estimated bufferbloat directly from your browser to the Cloudflare edge network. Every number comes from a real measurement, not a simulation.',
    'gauge.h': 'Speedometer',
    'go.aria': 'Start speed test', 'go.label': 'START',
    'profile.legend': 'Test profile', 'profile.saver': 'Data saver', 'profile.standard': 'Standard',
    'btn.cancel': 'Cancel', 'btn.retry': 'Test again', 'btn.share': 'Share result',
    'ledger.h': 'Test results',
    'm.download': 'Download', 'm.upload': 'Upload', 'm.latency': 'Latency (HTTP)', 'm.jitter': 'Jitter',
    'm.data': 'Data used', 'm.duration': 'Duration',
    'diag.h': 'Advanced diagnostics',
    'diag.lede': 'Latency while the network is idle compared with while it is busy. The difference shows how much queueing (bufferbloat) affects video calls and games.',
    'diag.lat.h': 'Latency: idle vs loaded',
    'diag.lat.fine': 'HTTP latency = response time of an HTTP request to the Cloudflare edge. It is <strong>not</strong> ICMP ping.',
    'diag.bloat.h': 'Bufferbloat estimate',
    'chart.h': 'Charts', 'chart.tabs': 'Chart type', 'chart.thr': 'Throughput', 'chart.lat': 'Latency', 'chart.his': 'History',
    'conn.h': 'Browser connection info',
    'his.h': 'Test history', 'his.csv': 'Export CSV', 'his.json': 'Export JSON', 'his.share': 'Share history', 'his.clear': 'Delete all',
    'his.import': 'Upload to account',
    'his.empty': 'No history yet. Test results will appear here.',
    'how.h': 'How it works, accuracy & privacy',
    'how.measured.h': 'What is measured',
    'how.m1': '<strong>Download &amp; upload</strong> in Mbps (megabits per second), from several HTTP requests of increasing size to the Cloudflare edge.',
    'how.m2': '<strong>Latency</strong> is HTTP latency (request response time), not ICMP ping. <strong>Jitter</strong> is the average difference between consecutive latency samples.',
    'how.m3': '<strong>Loaded latency</strong> is measured while downloads/uploads run; its difference from idle latency is used as the <strong>bufferbloat estimate</strong>.',
    'how.not.h': 'What is not measured',
    'how.not.p': '<strong>Packet loss is not shown</strong> because it requires a TURN server that is not configured on this site. If a metric fails to measure, the site shows “—” and the reason, never a guessed number.',
    'how.priv.h': 'Privacy',
    'how.p1': 'Measurement engine: <a href="https://github.com/cloudflare/speedtest" rel="noopener noreferrer" target="_blank">@cloudflare/speedtest</a> (MIT license). Requests go directly from your browser to <code>speed.cloudflare.com</code>.',
    'how.p3': 'Without logging in, history stays only in your device’s LocalStorage. If you create a Member account, your account and test history are stored in Supabase and can only be read by your own account. This site uses no tracking cookies or analytics.',
    'how.data.h': 'Data usage',
    'how.data.p': 'The <strong>Data saver</strong> profile uses at most about 48 MB. The <strong>Standard</strong> profile stops increasing file sizes once a request takes longer than 1 second, but on fast connections it can still use hundreds of MB. The data actually used is shown after the test.',
    'nav.home': 'Home',
    'meta.about.title': 'About PingTest by RLC — Farid Alfiyansah, SMK Tamtama Karanganyar',
    'meta.about.desc': 'About PingTest by Farid Alfiyansah (XI TJKT 2, SMK Tamtama Karanganyar): profile, the Excellent Japan Class Program with LPKS X Japan, and AI tools. Developed by Rogue Logic Creations (RLC).',
    'about.eyebrow': 'About the project',
    'about.h1': 'About PingTest by RLC', 'about.h1sub': 'Made at SMK Tamtama Karanganyar',
    'about.lede': 'PingTest by RLC is an internet speed and quality testing website. It is developed by Rogue Logic Creations (RLC) from an idea by Farid Alfiyansah, a Computer and Network Engineering (TJKT) student in class XI TJKT 2 at SMK Tamtama Karanganyar.',
    'about.by': 'Compiled by',
    'about.role': 'Idea originator · TJKT · SMK Tamtama Karanganyar',
    'about.dob': 'Date of birth', 'about.age.l': 'Age', 'about.school': 'School', 'about.dept': 'Department',
    'about.gh.aria': 'GitHub profile of Farid Alfiyansah, @r1dzzz',
    'about.school.p': 'The school where Farid studies in the Computer and Network Engineering (TJKT) department.',
    'about.school.visit': 'Visit the school website',
    'about.jp.visit': 'Visit LPKS X Japan',
    'about.ai.lede': 'AI tools that helped the development of PingTest by RLC. The idea, direction, decisions, and ownership of the project remain with Farid and RLC.',
    'about.ai.list': 'List of AI tools',
    'about.ai.fine': 'All logos and names are trademarks of their respective owners, shown only to name the tools used. There is no affiliation with or endorsement from the brand owners.',
    'about.proj.h': 'About the project',
    'about.goal.h': 'Goal',
    'about.goal.p': 'To offer a simple and honest way to check internet quality from a phone or laptop, while serving as a networking learning project: understanding the difference between speed (bandwidth), latency, jitter, and bufferbloat.',
    'about.tech.h': 'Technology',
    'about.tech.p': 'Frontend built with Vite, HTML, CSS, and JavaScript. Measurements use <a href="https://github.com/cloudflare/speedtest" target="_blank" rel="noopener noreferrer">@cloudflare/speedtest</a> (MIT). Member accounts and cloud history use Supabase with Row Level Security. Hosted as a static site on Vercel and installable as an app (PWA).',
    'about.cta': 'Run a test now',
    'foot.credit': '© 2026 Rogue Logic Creations (RLC) · Idea: Farid Alfiyansah · SMK Tamtama Karanganyar, TJKT',
    'foot.nav': 'Footer links', 'foot.engine': 'Measurement engine',
    'meta.index.title': 'PingTest by RLC — Internet Speed Test & RLC Network Diagnostics',
    'meta.index.desc': 'PingTest by RLC: free internet speed test — download, upload, HTTP latency, jitter, and bufferbloat estimate using the Cloudflare measurement engine. A project by Farid Alfiyansah, SMK Tamtama Karanganyar (TJKT).',

    'status.ready': 'Ready. Choose a profile and press START.',
    'status.connect': 'Contacting the Cloudflare server…',
    'status.latency': 'Measuring latency…',
    'status.download': 'Measuring download…',
    'status.upload': 'Measuring upload…',
    'status.done': 'Test complete.',
    'status.donePartial': 'Test partly complete. {note}',
    'status.failed': 'Test failed: {reason}',
    'status.cancelled': 'Test cancelled. No result was saved.',
    'status.fast': ' Your connection is fast; the Data saver profile uses files of at most 10 MB, so it may read lower. Choose Standard for a more accurate result.',
    'status.cloudSaved': ' Saved to your account history.',
    'status.cloudFail': ' Could not save to your account (kept on this device).',
    'gauge.partial': 'PARTIAL RESULT', 'gauge.failed': 'TEST FAILED', 'gauge.down': 'DOWNLOAD', 'gauge.up': 'UPLOAD',
    'tag.wait': 'waiting', 'tag.measuring': 'measuring…', 'tag.live': 'interim', 'tag.done': 'done', 'tag.na': 'unavailable',
    'profile.hint.hemat': 'Max. ~48 MB. Good for limited data plans; less accurate above ~100 Mbps.',
    'profile.hint.standar': 'Cloudflare’s default settings. On fast connections it can use hundreds of MB.',
    'consent.cf': 'By pressing START you agree that the test result may be collected by Cloudflare for aggregated insights. <a href="#privasi">Privacy details</a>',
    'consent.nocf': 'The test sends requests to Cloudflare’s measurement server. Results are not submitted for aggregated insights. <a href="#privasi">Privacy details</a>',
    'privacy.cf': 'Cloudflare may collect test results to compute aggregated insights about internet quality. Your IP address is of course visible to the destination server, as with any internet connection.',
    'privacy.nocf': 'Submitting results to Cloudflare for aggregated insights is turned off on this site. Your IP address is still visible to the measurement server, as with any internet connection.',
    'unit.sec': 's',
    'dlat.idle': 'Idle', 'dlat.down': 'During download', 'dlat.up': 'During upload', 'dlat.na': 'unavailable',
    'dlat.jitter': ' · jitter {v} ms',
    'dlat.unavailable': 'Loaded latency is unavailable: transfers were too short to load the connection (common on very fast connections with the Data saver profile) or the measurement failed.',
    'bb.none': 'No data yet',
    'bb.title': '{label} · up {ms} ms under load',
    'bb.desc': '{desc} Estimated from the difference between loaded HTTP latency ({loaded} ms) and idle ({idle} ms).',
    'bb.unavailable': 'Unavailable: both idle latency and loaded latency must be measured successfully.',
    'bb.prompt': 'Run a test to see the estimate.',
    'bb.l.A+': 'Excellent', 'bb.l.A': 'Good', 'bb.l.B': 'Fair', 'bb.l.C': 'Poor', 'bb.l.D': 'Bad', 'bb.l.F': 'Very bad',
    'bb.d.A+': 'Latency barely rises when the network is busy.',
    'bb.d.A': 'Small increase; video calls and online games are usually fine.',
    'bb.d.B': 'Slightly noticeable while a large download runs at the same time.',
    'bb.d.C': 'Video calls/games may lag during downloads or uploads.',
    'bb.d.D': 'Latency spikes when the network is busy; real-time activity suffers.',
    'bb.d.F': 'Latency rises very high when the network is busy.',
    'chart.thr.desc': 'Speed of each request during this test (Mbps). Small requests tend to be slower because TCP has not "warmed up" yet.',
    'chart.lat.desc': 'Consecutive HTTP latency samples (ms): idle vs while downloading/uploading.',
    'chart.his.desc': 'Trend of results from your history (oldest to newest).',
    'chart.empty.thr': 'Run a test to see the throughput chart.',
    'chart.empty.lat': 'Run a test to see the latency chart.',
    'chart.empty.his': 'No history to plot yet.',
    'chart.touch': 'Touch the chart to see values.',
    'chart.title.thr': 'Throughput per request', 'chart.title.lat': 'Latency per sample', 'chart.title.his': 'History trend',
    'chart.s.down': 'Download', 'chart.s.up': 'Upload', 'chart.s.idle': 'Idle',
    'chart.x.sec': 'seconds', 'chart.x.sample': 'sample #', 'chart.x.test': 'test #',
    'chart.pt.req': '{t} s · {size}', 'chart.pt.sample': 'sample #{n}',
    'conn.status': 'Browser status', 'conn.online': 'Online', 'conn.offline': 'Offline', 'conn.unknown': 'Unknown',
    'conn.eff': 'Effective type', 'conn.down': 'Downlink (estimate)', 'conn.rtt': 'RTT (estimate)', 'conn.save': 'Data saver mode',
    'conn.type': 'Connection type', 'conn.on': 'On', 'conn.off': 'Off', 'conn.na': 'Unavailable',
    'conn.note.yes': 'These values are browser estimates, not test results, and may differ from the results above.',
    'conn.note.no': 'This browser does not provide the Network Information API (common in Safari and Firefox). Test results are not affected.',
    'his.lede.guest': 'Without logging in, history is stored only in this browser (LocalStorage), up to the last {n} results.',
    'his.lede.member': 'Your account’s cloud history. Only your account can read it.',
    'his.loading': 'Loading account history…',
    'his.cloudError': 'Account history cannot be loaded right now. Check your connection and reload the page.',
    'his.warn.storage': 'Browser storage is unavailable (possibly private mode). History only lasts while this tab is open.',
    'his.gate': 'Sign in to save history in the cloud, export CSV/JSON, and share results as an image.',
    'his.import.text': 'There are {n} test results stored on this device. Upload them to your account so they are saved in the cloud too?',
    'his.import.confirm': 'Upload {n} test results from this device to your account? Local data will be deleted after success.',
    'his.import.done': '{n} test results uploaded to your account.',
    'his.import.fail': 'Failed to upload local history. Local data was not deleted.',
    'his.clear.confirm': 'Delete all your test history?',
    'his.clear.confirmCloud': 'Delete ALL test history in your account? This cannot be undone.',
    'his.p.hemat': 'Data saver', 'his.p.standar': 'Standard', 'his.partial': 'partial',
    'his.share.item': 'Share result {d}', 'his.del.item': 'Delete result {d}', 'his.bloat': 'bloat',
    'his.exported': 'File {f} downloaded.',
    'his.exportFail': 'Could not fetch the full history from your account.',
    'his.shared': 'History shared.',
    'his.sharedFallback': 'File sharing is not supported; the file was downloaded.',
    'err.offline': 'This device is offline. Connect to the internet and try again.',
    'err.http': 'The measurement server replied HTTP {status}. It may be temporarily limited or blocked by your network.',
    'err.timing': 'The request took too long or the browser did not provide timing data. Try again on a more stable connection.',
    'err.generic': 'Cannot reach the Cloudflare measurement server. The connection may be down or blocked (VPN, school firewall, ad blocker/DNS). The browser does not reveal the exact cause.',
    'err.load': 'Failed to load the measurement engine. Check your connection and reload the page.',
    'err.init': 'The measurement engine failed to initialise in this browser.',
    'err.start': 'The test cannot be started in this browser.',
    'err.lost': 'The connection dropped during the test. The test was cancelled so the result would not be misleading.',
    'note.timeout': 'The test stopped early because of the time limit; the result uses the data collected so far.',
    'note.partial': 'Some metrics are unavailable because their measurement failed or was too short.',

    'auth.cta': 'Sign in / Register',
    'auth.login': 'Sign in', 'auth.register': 'Register', 'auth.close': 'Close',
    'auth.title.login': 'Sign in to PingTest', 'auth.title.register': 'Create a Member account',
    'auth.title.forgot': 'Reset password', 'auth.title.recovery': 'New password',
    'auth.intro': 'The speed test stays free to use without logging in. A Member account unlocks cloud history, themes, export, and result sharing.',
    'auth.reason': 'This feature is for Members. Sign in or register to continue; your action will resume automatically.',
    'auth.email': 'Email', 'auth.password': 'Password', 'auth.password2': 'Repeat password',
    'auth.show': 'Show', 'auth.hide': 'Hide',
    'auth.submit.login': 'Sign in', 'auth.submit.register': 'Create account', 'auth.submit.forgot': 'Send link', 'auth.submit.recovery': 'Save password',
    'auth.forgot': 'Forgot password?', 'auth.back': 'Back to sign in',
    'auth.busy': 'Working…',
    'auth.err.email': 'Enter a valid email address.',
    'auth.err.pwShort': 'Password must be at least 8 characters.',
    'auth.err.pwMatch': 'The password and its repetition do not match.',
    'auth.err.invalid': 'Incorrect email or password.',
    'auth.err.exists': 'This email is already registered. Please sign in.',
    'auth.err.unconfirmed': 'Email not confirmed yet. Check your inbox.',
    'auth.err.weak': 'Password is too weak. Use a longer combination.',
    'auth.err.rate': 'Too many attempts. Wait a moment and try again.',
    'auth.err.disabled': 'Sign-ups are currently disabled.',
    'auth.err.network': 'Cannot reach the account server. Check your connection.',
    'auth.err.generic': 'Something went wrong. Please try again.',
    'auth.err.notConfigured': 'Sign-in is not configured on this site (Supabase is not set up). The speed test still works as a Guest.',
    'auth.ok.checkEmail': 'Account created. Check your email to confirm, then sign in.',
    'auth.ok.reset': 'If the email is registered, a password reset link has been sent.',
    'auth.ok.pwUpdated': 'Password updated.',
    'auth.ok.signedIn': 'Signed in.',
    'auth.ok.signedOut': 'You have signed out.',
    'acct.login': 'Sign in', 'acct.settingsAria': 'Settings', 'acct.accountAria': 'Account',
    'lang.aria': 'Switch language to {other}',
    'set.title': 'Settings Center',
    'set.lang': 'Language', 'set.langHint': 'Available to all visitors.',
    'set.look': 'Appearance (Members)',
    'set.theme': 'Theme', 'set.dark': 'Dark', 'set.light': 'Light',
    'set.glass': 'Glass UI', 'set.motion': 'Animations', 'set.sound': 'Sound',
    'set.soundHint': 'Short tones when a test starts, finishes, or fails.',
    'set.lock': 'Members only',
    'set.account': 'Account', 'set.guest': 'You are using the site as a Guest.', 'set.signedAs': 'Signed in as {email}',
    'set.logout': 'Sign out',
    'set.app': 'App', 'set.install': 'Install as app', 'set.installed': 'The app is already installed.',
    'set.installNA': 'Install from the browser menu (⋮ → Add to Home screen) if the button does not appear.',
    'set.needsNet': 'The speed test still requires internet.',
    'set.saved': 'Settings saved.',
    'set.saveFail': 'Settings applied, but saving to your account failed.',
    'gate.theme': 'Light/dark mode', 'gate.glass': 'Glass UI', 'gate.motion': 'Animation setting', 'gate.sound': 'Sound setting',
    'gate.share': 'Result sharing', 'gate.export': 'History export', 'gate.shareHis': 'History sharing',
    'share.title': 'Share test result',
    'share.native': 'Share', 'share.download': 'Download PNG', 'share.copy': 'Copy image',
    'share.copied': 'Image copied.', 'share.downloaded': 'Image downloaded.', 'share.sharedOk': 'Shared.',
    'share.fail': 'Failed to create the image.', 'share.copyFail': 'This browser does not allow copying images. Use Download PNG.',
    'share.alt': 'Preview of the test result image',
    'share.text': 'PingTest by RLC result: ↓ {down} Mbps · ↑ {up} Mbps · latency {lat} ms · jitter {jit} ms',
    'card.sub': 'Internet Speed Test', 'card.lat': 'LATENCY (HTTP)', 'card.jit': 'JITTER',
    'card.measured': 'Measured with @cloudflare/speedtest', 'card.profile': 'Profile',
    'card.bloat': 'Bufferbloat',
    'about.age': '{n} years old',
    'toast.close': 'Close',
  },
};

let lang = 'id';
let manual = false;
const defaults = {}; // teks bawaan HTML (Indonesia) per kunci
const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function write(v) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* abaikan */ }
}

export function detectLang() {
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'id']);
  for (const l of list) {
    const c = String(l || '').toLowerCase();
    if (c.startsWith('id') || c.startsWith('in')) return 'id';
    if (c.startsWith('en')) return 'en';
  }
  return 'en';
}

export const getLang = () => lang;
export const isManual = () => manual;
export const locale = () => (lang === 'en' ? 'en-GB' : 'id-ID');

export function t(key, params) {
  let s;
  if (lang === 'en') s = STR.en[key];
  if (s === undefined) s = STR.id[key];
  if (s === undefined) s = defaults[key];
  if (s === undefined) s = key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
  return s;
}

function snapshot(root) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in defaults)) defaults[k] = el.textContent;
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const k = el.dataset.i18nHtml;
    if (!(k in defaults)) defaults[k] = el.innerHTML;
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, k] = pair.split(':');
      if (k && !(k in defaults)) defaults[k] = el.getAttribute(attr) || '';
    }
  });
}

export function applyDom(root = document) {
  snapshot(root);
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, k] = pair.split(':');
      if (k) el.setAttribute(attr, t(k));
    }
  });
}

function applyMeta() {
  document.documentElement.lang = lang;
  const page = document.body && document.body.dataset.page;
  const tk = `meta.${page}.title`;
  const dk = `meta.${page}.desc`;
  if (page) {
    const title = t(tk); const desc = t(dk);
    if (title !== tk) {
      document.title = title;
      const ogt = document.querySelector('meta[property="og:title"]'); if (ogt) ogt.content = title;
    }
    if (desc !== dk) {
      const md = document.querySelector('meta[name="description"]'); if (md) md.content = desc;
      const ogd = document.querySelector('meta[property="og:description"]'); if (ogd) ogd.content = desc;
    }
  }
  const loc = document.querySelector('meta[property="og:locale"]');
  if (loc) loc.content = lang === 'en' ? 'en_GB' : 'id_ID';
}

export function initLang() {
  // Simpan teks Indonesia bawaan HTML (meta ikut disimpan) sebelum diterjemahkan.
  const page = document.body && document.body.dataset.page;
  if (page) {
    defaults[`meta.${page}.title`] = document.title;
    const md = document.querySelector('meta[name="description"]');
    if (md) defaults[`meta.${page}.desc`] = md.content;
  }
  const s = read();
  if (s && s.manual && LANGS.includes(s.lang)) { lang = s.lang; manual = true; } // pilihan manual menang
  else { lang = detectLang(); manual = false; }
  applyDom();
  applyMeta();
}

/** Ganti bahasa. fromUser=true menandai pilihan manual (tidak akan ditimpa deteksi). */
export function setLang(next, fromUser = true) {
  if (!LANGS.includes(next)) return;
  lang = next;
  if (fromUser) { manual = true; write({ lang, manual: true }); }
  applyDom();
  applyMeta();
  listeners.forEach((fn) => { try { fn(lang); } catch { /* abaikan */ } });
}

export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
