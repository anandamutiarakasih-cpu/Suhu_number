# CHAMPIONS OF CALOR: CLASH OF SCIENCE
> **Permainan Pembelajaran IPA Materi KALOR untuk Siswa SMP Kelas VII**  
> *Format Kompetisi Akademik Terinspirasi dari Clash of Champions (CoC)*

---

## 1. Tentang Aplikasi

**CHAMPIONS OF CALOR: CLASH OF SCIENCE** adalah aplikasi web edukatif interaktif bertema laboratorium sains futuristik yang dirancang untuk pembelajaran materi **Kalor tingkat SMP Kelas VII**.

Aplikasi ini menggunakan konsep kompetisi antarkelompok (hingga **8 kelompok**) yang mengutamakan:
- Keterampilan kolaborasi & musyawarah
- Ketelitian & daya ingat ilmiah
- Pemecahan masalah & perhitungan matematis rumus kalor
- Pemahaman mendalam konsep perpindahan dan perubahan kalor

---

## 2. Struktur 3 Game & Sistem Penilaian (Total 100 Poin)

| No | Babak Permainan | Konsep & Mekanisme | Skor Maksimal |
|:---:|---|---|:---:|
| **1** | **NUMBER CHAINS**<br>*(Rantai Peristiwa Kalor)* | Menyusun kartu proses dan perubahan kalor secara runtut dan kronologis. Terdapat 5 tahap tantangan ilmiah (peleburan es, angin laut, termos air, pengembunan, dan bimetal) dilengkapi fitur geser/naik-turun kartu dan ulasan sains instan. | **30 Pts** |
| **2** | **START CHAMP**<br>*(Mencocokkan Konsep)* | Mengidentifikasi dan mencocokkan 12 ilustrasi peristiwa kalor sehari-hari dengan konsep perpindahan kalor (konduksi, konveksi, radiasi) dan perubahan wujud zat. Dibagi dalam 3 ronde dinamis. | **35 Pts** |
| **3** | **CRYPTARITHM WAR**<br>*(Teka-Teki Angka Kalor)* | Memecahkan 6 teka-teki rumus kuantitatif kalor ($Q = m \cdot c \cdot \Delta T$, $Q = m \cdot L$, Asas Black) dengan keypad angka layar sentuh dan whiteboard digital (*Kertas Cakar*) in-app. | **35 Pts** |
| | **TOTAL KESELURUHAN** | | **100 Pts** |

### Tingkat Predikat Kelulusan Kalor:
- **86 – 100 Poin**: 🏆 **Thermo Champion** *(Penguasaan luar biasa materi kalor SMP!)*
- **76 – 85 Poin**: ⚡ **Thermo Expert** *(Pemahaman konsep & daya hitung yang sangat baik)*
- **66 – 75 Poin**: 🔬 **Science Challenger** *(Kompetensi sains solid & runtut)*
- **56 – 65 Poin**: 🧭 **Thermo Explorer** *(Mulai memahami konsep dasar kalor)*
- **0 – 55 Poin**: 🧪 **Temperature Rookie** *(Terus berlatih & perdalam rumus fisika)*

---

## 3. Sistem Menghubungkan Game Siswa & Guru

Aplikasi menggunakan arsitektur **Single Page Application (SPA)** dengan sinkronisasi realtime multi-tier:
- **Firebase Realtime Database (RTDB)**: `https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/`
- **Global Cloud Relay (SSE/REST)**: Memastikan koneksi antarperangkat lintas jaringan (WiFi sekolah, paket data 4G HP, tethering) 100% tersambung tanpa kendala.
- **BroadcastChannel & LocalStorage**: Pengujian cepat multi-tab di laptop yang sama.

### Alur Guru (Laptop / PC):
1. Buka web, pilih kartu **"Pusat Kendali Guru (Login Admin)"**.
2. Masukkan kode akses instruktur: `THERMO2026`.
3. Klik tombol **"+ Sesi Baru"** untuk menghasilkan Kode Sesi 6 karakter (misal: `TC4829`).
4. Klik **"🔗 Salin Link HP"** atau **"📋 Salin Kode"** lalu bagikan ke siswa.
5. Kendalikan jalannya kompetisi secara terpusat lewat **Bilah Kendali Fase**:
   - `[0] Lobi Persiapan`: Siswa masuk dan mendaftarkan kelompok.
   - `[1] Game 1: Number Chains`: Semua HP siswa serentak masuk ke Game 1!
   - `[2] Game 2: Start Champ`: Semua HP siswa serentak masuk ke Game 2!
   - `[3] Game 3: Cryptarithm War`: Semua HP siswa serentak masuk ke Game 3!
   - `[🏆] Buka Leaderboard`: Semua HP siswa serentak menampilkan podium juara dan rekap nilai akhir.
6. Pantau perolehan skor 8 kelompok secara live pada **Live Scoreboard**.
7. Klik **"📥 Unduh Rekap Hasil (CSV)"** untuk mengekspor nilai ke Excel.
8. Gunakan tombol **"⚡ Simulasi 8 Kelompok Uji"** untuk demonstrasi kelas instan.

### Alur Siswa (1 HP per Kelompok 3–4 Siswa):
1. Buka tautan dari guru di gawai HP.
2. Masukkan Kode Sesi Guru (misal `TC4829`) -> Klik **"Masuk Permainan"**.
3. Pilih nomor kelompok (Kelompok 1 sampai 8) yang masih tersedia.
4. Masukkan nama kelompok dan daftar anggota beserta nomor absen.
5. Klik **"Gabung ke Lobi Persiapan"**.
6. Layar HP akan otomatis berpindah mengikuti babak permainan yang dipilih oleh guru di laptop.

---

## 4. Panduan Menjalankan Secara Lokal

1. Buka terminal di folder project:
   ```bash
   cd "d:\Suhu Number"
   ```
2. Jalankan server lokal:
   ```bash
   npx serve .
   ```
3. Buka browser pada alamat yang tertera (misal `http://localhost:3000`).
