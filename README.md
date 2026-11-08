# 🏆 CHAMPIONS OF CALOR: CLASH OF SCIENCE
### Game Edukasi Kolaboratif IPA SMP Kelas VII – Materi Kalor & Perubahannya
Terinspirasi dari atmosfer kompetisi akademik **Clash of Champions (CoC)**.

---

## 🌟 Sistem 2 Peran dalam 1 Website (Guru & Siswa)

Aplikasi ini menggunakan **satu link website yang sama** dengan 2 mode tampilan terintegrasi:

### 1. 👨‍🏫 Peran GURU (Dasbor Admin & Pengawas di Laptop)
- **Perangkat:** Laptop / Komputer Guru di meja (tanpa perlu proyektor).
- **Fitur Utama Guru:**
  - **Kode Room Sesi Kelas (Contoh: `COC-7A`):** Guru cukup memberikan kode room ini ke siswa atau membagikan link ke grup WhatsApp kelas.
  - **Salin Kode & Tautan Siswa:** Sekali klik untuk menyalin kode room atau link bergabung siswa.
  - **Dasbor Aktivitas & Klasemen Live (Realtime Firebase):** Guru mengawasi seluruh kelompok langsung dari layar laptop:
    - Jumlah total kelompok yang bergabung.
    - Kelompok yang sedang memimpin perolehan nilai.
    - Soal / tantangan apa yang sedang dikerjakan masing-masing kelompok (*misal: "Tim Joule sedang di Game A Rantai 3", "Tim Newton sedang di Game C Soal 4"*).
    - Skor tiap game (Rantai, Konsep, Kriptaritma, Bonus Kolaborasi) dan skor total.
    - Skor otomatis bergerak naik secara realtime tanpa perlu refresh halaman.
  - **Tindakan Guru:** Mengumumkan pemenang / membuka panggung juara akhir (Podium) dan mencetak piagam/rekapitulasi nilai siswa.

### 2. 📱 Peran SISWA (Gawai HP Kelompok – 1 HP untuk 3–4 Siswa)
- **Perangkat:** Cukup **1 HP pintar untuk satu kelompok** (digunakan bersama oleh 3–4 siswa yang berdiskusi).
- **Alur Siswa di HP:**
  1. Siswa membuka web game di HP dan memilih **📱 Arena Siswa (HP Kelompok)**.
  2. Masukkan **Kode Room dari Guru** (misal: `COC-7A`).
  3. Masukkan **Nama Kelompok** (misal: *Tim Joule*, *Tim Newton*, *Tim Kelvin*).
  4. Masukkan **Nama 3–4 Anggota** beserta peran kolaborasi:
     - 👑 **Juru Bicara:** Memimpin presentasi dan keputusan akhir kelompok.
     - 🔍 **Pakar Konsep:** Menganalisis fenomena fisika kalor.
     - 🔢 **Master Hitung:** Menghitung rumus matematis persamaan kalor.
     - ⚖️ **Verifikator:** Memastikan seluruh anggota tim telah sepakat.
  5. Mainkan 3 jenis game (Game A: Number Chains, Game B: Start Champ, Game C: Cryptarithm War).
  6. Setiap kali kelompok menjawab benar, skor kelompok dan progres aktivitasnya **seketika langsung terkirim ke laptop guru melalui Firebase Realtime Database**!
  7. Pada layar HP siswa terdapat status bar sticky: *Nama Tim • Peringkat di Kelas • Poin Total*.

---

## 🎮 Tiga Jenis Permainan Materi Kalor SMP Kelas VII

### 1. ⛓️ NUMBER CHAINS – Rantai Peristiwa Kalor
- **Tujuan:** Melatih kemampuan mengurutkan kronologi proses fisika kalor secara logis.
- **Mekanisme:** Kartu disajikan acak. Siswa menggeser urutan kartu menggunakan tombol panah ▲/▼ atau touch drag di HP.
- **5 Tahapan:**
  1. *Perjalanan Es Batu Menjadi Uap Air* (Pemanasan es, kalor laten lebur 0°C, air mendidih, penguapan 100°C).
  2. *Terjadinya Angin Laut di Pesisir Pantai* (Konveksi alami udara & perbedaan kalor jenis tanah vs air).
  3. *Rahasia Termos Menahan Kalor* (Lapisan perak pantulkan radiasi, ruang hampa isolasi konduksi/konveksi, tutup penyekat).
  4. *Proses Pelepasan Kalor: Uap Menjadi Es* (Mengembun dan membeku melepaskan kalor laten).
  5. *Keping Bimetal pada Setrika Otomatis* (Pemuaian termal logam & termostat saklar otomatis).

### 2. 🎯 START CHAMP – Tantangan Mencocokkan Konsep
- **Tujuan:** Mengidentifikasi dan mencocokkan fenomena kehidupan nyata dengan konsep perpindahan serta perubahan kalor.
- **Mekanisme:** 12 kasus fenomena berilustrasi vektor SVG (3 ronde kompetisi). Siswa mengetuk kartu kasus, lalu mengetuk konsep fisika yang cocok di HP.

### 3. ⚡ CRYPTARITHM WAR – Teka-Teki Angka Kalor
- **Tujuan:** Mengasah daya nalar matematis persamaan kalor ($Q = m \cdot c \cdot \Delta T$, $Q = m \cdot L$, $T_2 = T_1 + \Delta T$, dan Asas Black).
- **Mekanisme:** Digit angka misterius yang hilang (misal: $Q = [A][B]00 \text{ Joule}$, $T_2 = [X]5^\circ\text{C}$). Tersedia **Papan Angka Sentuh (Touch Numpad)** di HP dan **Kertas Cakar Digital (Digital Whiteboard)** di layar HP.

---

## 🔥 Integrasi Firebase Realtime Database
- **URL Database Aktif:** `https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/`
- **Aturan Akses (Rules) di Firebase Console:**
  ```json
  {
    "rules": {
      "coc_rooms": {
        "$roomCode": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
  ```
  *(Atau dalam mode uji coba kelas: `{ "rules": { ".read": true, ".write": true } }`)*

---

## 🚀 Cara Menjalankan & Deploy ke Vercel

### Jalankan di Komputer / HP
Cukup buka file `index.html` di browser laptop (untuk Guru) dan browser HP (untuk Siswa).

### Deploy ke Vercel
1. Unggah folder proyek ini ke repositori GitHub: `https://github.com/anandamutiarakasih-cpu/Suhu_number`.
2. Masuk ke [vercel.com](https://vercel.com) ➔ **Add New Project** ➔ Pilih repositori GitHub.
3. Klik **Deploy**.
4. Guru membuka link di laptop proyektor (`?role=guru`), siswa membuka link di HP masing-masing (`?role=siswa`).
