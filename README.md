# 🏆 CHAMPIONS OF CALOR: CLASH OF SCIENCE
### Game Edukasi Kolaboratif IPA SMP Kelas VII – Materi Kalor & Perubahannya
Terinspirasi dari atmosfer kompetisi akademik **Clash of Champions (CoC)**.

---

## 🌟 Tentang Game

**CHAMPIONS OF CALOR** adalah aplikasi game edukasi berbasis web interaktif (*HTML5, CSS3, & Modern Vanilla JavaScript*) yang dirancang khusus untuk pembelajaran kelompok siswa SMP Kelas VII pada materi **Kalor dan Perubahannya**.

Game ini mengadaptasi ketegangan, estetika modern, dan format tantangan ilmiah ala **Clash of Champions**, dengan fokus pada penguatan **4 Keterampilan Kolaborasi Abad 21**:
1. **Works Productively:** Setiap anggota berkontribusi aktif dalam penyelesaian tugas.
2. **Demonstrates Respect:** Menghargai dan mendengarkan gagasan rekan sekelompok.
3. **Compromises:** Mencapai titik temu dan mufakat saat terdapat silang pendapat.
4. **Shared Responsibility:** Memikul tanggung jawab bersama atas keputusan dan capaian skor tim.

---

## 🎮 Tiga Jenis Permainan

### 1. ⛓️ NUMBER CHAINS – Rantai Peristiwa Kalor
- **Tujuan:** Melatih kemampuan mengurutkan kronologi proses fisika kalor secara logis dan ilmiah.
- **Mekanisme:** 
  - Kartu peristiwa disajikan secara acak.
  - Siswa memindahkan kartu menggunakan sistem *Drag & Drop* atau tombol panah ▲/▼.
  - Terdapat 5 tahapan komprehensif:
    1. *Perjalanan Es Batu Menjadi Uap Air* (Pemanasan, kalor laten lebur, dan penguapan).
    2. *Terjadinya Angin Laut di Pantai* (Konveksi alami udara & perbedaan kalor jenis).
    3. *Rahasia Termos Menahan Kalor* (Isolator termal, refleksi perak, dan ruang hampa).
    4. *Proses Pelepasan Kalor: Uap Menjadi Es* (Mengembun dan membeku).
    5. *Keping Bimetal pada Setrika Otomatis* (Pemuaian zat padat & termostat otomatis).
  - Dilengkapi tombol *Petunjuk Diskusi*, feedback visual seketika, dan modal pembahasan konsep lengkap.

### 2. 🎯 START CHAMP – Tantangan Mencocokkan Konsep
- **Tujuan:** Mengidentifikasi dan mengaitkan fenomena nyata dalam kehidupan sehari-hari dengan konsep perpindahan serta perubahan kalor.
- **Mekanisme:**
  - Siswa disajikan 12 kartu fenomena berilustrasi SVG interaktif (3 ronde kompetisi).
  - Siswa menghubungkan kartu peristiwa dengan bank konsep di sampingnya (Konduksi, Konveksi Cairan, Radiasi Termal, Menyerap/Melepas Kalor, Isolator/Konduktor Termal, Pemuaian Panjang, dsb.).
  - Tombol copot pasangan (*unpair*), tombol periksa pasangan, dan pembahasan konsep per ronde.

### 3. ⚡ CRYPTARITHM WAR – Teka-Teki Angka Kalor
- **Tujuan:** Mengasah kemampuan penalaran logis, berhitung matematis, dan pemecahan masalah berdasarkan persamaan kalor.
- **Mekanisme:**
  - Soal teka-teki persamaan kalor ($Q = m \cdot c \cdot \Delta T$, $Q = m \cdot L$, $T_2 = T_1 + \Delta T$, dan Asas Black $Q_{\text{lepas}} = Q_{\text{terima}}$).
  - Digit misterius dikosongkan (contoh: $Q = [A][B]00 \text{ Joule}$, $T_2 = [X]5^\circ\text{C}$, dsb.).
  - Tersedia **Papan Angka Digital (Numpad Touch)** untuk layar sentuh/proyektor serta dukungan keyboard fisik.
  - **Kertas Cakar Digital (Whiteboard Layar Bawaan):** Siswa dapat mencoret-coret rumus dan kalkulasi langsung di layar tanpa perlu kertas tambahan!

---

## 👥 Fitur Kolaborasi & Manajemen Kelompok
- **Mode Multi-Tim:** Mendukung kompetisi antarkelompok (1 hingga 4 tim sekaligus: Tim Joule, Tim Kelvin, Tim Celsius, Tim Newton).
- **Pembagian Peran Siswa (3–4 Siswa per Tim):**
  - 👑 **Juru Bicara:** Memimpin presentasi dan mengambil keputusan akhir.
  - 🔍 **Pakar Konsep:** Menganalisis hukum dan teori fisika kalor.
  - 🔢 **Master Hitung:** Memimpin kalkulasi matematis persamaan kalor.
  - ⚖️ **Verifikator:** Memastikan seluruh anggota setuju dan sepakat.
- **Protokol Kesepakatan Tim:** Sebelum mengirim jawaban, kelompok dapat mengunci konsensus dan mendapatkan **+25 Bonus Poin Kolaborasi**.

---

## 📊 Sistem Penilaian & Sertifikat
- Skor otomatis untuk setiap tantangan yang benar (+100 hingga +150 poin).
- Bonus kecepatan dan bonus kolaborasi kelompok.
- Papan skor dan timer langsung (*live stopwatch*).
- **Podium Juara Akhir:** Menampilkan Juara 1, 2, 3, dan Finalis lengkap dengan rincian perolehan poin tiap game.
- **Cetak Laporan / Sertifikat Juara:** Fitur cetak ramah kertas (*print stylesheet*) untuk mencetak piagam penghargaan dan rekap nilai guru.

---

## 🚀 Cara Menjalankan & Deploy ke Vercel

### Opsi A: Jalankan Langsung di Komputer / Laptop (Offline 100%)
1. Cukup buka file `index.html` dengan klik dua kali di browser mana saja (Google Chrome, Microsoft Edge, Safari, Firefox).
2. Tidak membutuhkan server atau instalasi apapun.

### Opsi B: Deploy ke Vercel (1 Menit)
Proyek ini dibuat menggunakan standar **HTML, CSS, dan JavaScript murni** (Zero Build Step), sehingga otomatis terdeteksi oleh Vercel:

#### Cara 1: Menggunakan Vercel Dashboard (GitHub / Git)
1. Unggah folder proyek ini ke repositori GitHub Anda.
2. Masuk ke [vercel.com](https://vercel.com) dan klik **"Add New" ➔ "Project"**.
3. Pilih repositori GitHub Anda.
4. Klik tombol **"Deploy"** (biarkan pengaturan *Framework Preset* ke *Other* karena Vercel otomatis melayani situs statis).
5. Aplikasi langsung aktif dan dapat diakses publik melalui URL `https://nama-proyek.vercel.app`!

#### Cara 2: Menggunakan Vercel CLI
```bash
npm i -g vercel
vercel
```
Tekan Enter untuk mengikuti panduan terminal, dan aplikasi akan langsung online!

---

## 💻 Spesifikasi Teknis
- **Bahasa:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Efek Audio:** Web Audio API (Sintesis suara *in-browser*, tanpa file MP3 eksternal, 100% andal tanpa risiko gagal muat).
- **Efek Visual:** Kanvas Konfeti Kemenangan, Animasi CSS, dan Ilustrasi Vektor SVG Murni.
- **Responsivitas:** Mendukung layar proyektor kelas (Full HD/HD), laptop guru & siswa, tablet, dan ponsel.
- **Penyimpanan / Akun:** Tanpa registrasi akun atau login, langsung mulai bermain secara instan.
