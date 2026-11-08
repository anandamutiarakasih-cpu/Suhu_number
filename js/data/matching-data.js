/**
 * Data for Game 2: START CHAMP – Tantangan Mencocokkan Konsep
 * Materi IPA Kelas VII SMP
 */

export const START_CHAMP_DATA = [
  {
    id: "match_1",
    title: "Sendok Logam Terasa Panas",
    category: "Perpindahan Kalor",
    correctConcept: "Konduksi Termal",
    scenario: "Sendok logam yang dicelupkan ke dalam mangkuk kuah bakso panas, lama-kelamaan bagian ujung pegangannya ikut terasa panas di tangan.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="70" rx="40" ry="18" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
        <path d="M15 70 C 15 88, 85 88, 85 70 Z" fill="#b45309" opacity="0.3"/>
        <path d="M40 75 Q 60 20 70 8" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" fill="none"/>
        <circle cx="70" cy="8" r="4" fill="#ef4444"/>
        <path d="M42 55 Q 46 45 42 35" stroke="#f97316" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
        <path d="M52 58 Q 56 48 52 38" stroke="#f97316" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.8"/>
        <circle cx="42" cy="73" r="5" fill="#f59e0b"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Mangkuk Sup & Sendok</text>
    </svg>`,
    options: ["Konduksi Termal", "Konveksi Termal", "Radiasi Termal", "Isolator Alami"],
    explanation: "Konduksi adalah perpindahan kalor melalui medium zat padat tanpa disertai perpindahan molekul penyusunnya. Getaran atom logam mentransfer energi kalor dari ujung sendok yang tercelup ke ujung lainnya."
  },
  {
    id: "match_2",
    title: "Air Berputar Saat Direbus",
    category: "Perpindahan Kalor",
    correctConcept: "Konveksi Cairan",
    scenario: "Saat merebus air di dalam panci bening, butir beras atau gelembung terlihat bergerak naik di tengah dan turun di bagian pinggir secara memutar.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="30" width="50" height="42" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <path d="M20 30 L80 30" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <path d="M45 65 Q 45 45 48 40" stroke="#ef4444" stroke-width="2.5" fill="none"/>
        <path d="M55 65 Q 55 45 52 40" stroke="#ef4444" stroke-width="2.5" fill="none"/>
        <path d="M35 42 Q 32 55 35 62" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <path d="M65 42 Q 68 55 65 62" stroke="#0ea5e9" stroke-width="2" fill="none"/>
        <path d="M35 85 Q 50 72 65 85 Q 50 82 35 85 Z" fill="#f97316"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Panci Mendidih</text>
    </svg>`,
    options: ["Konveksi Cairan", "Konduksi Termal", "Radiasi Elektromagnetik", "Mengkristal"],
    explanation: "Konveksi adalah perpindahan kalor pada fluida (cair atau gas) disertai perpindahan molekulnya akibat perbedaan massa jenis. Air bagian bawah memanas, memuai, massa jenisnya mengecil, lalu naik ke atas."
  },
  {
    id: "match_3",
    title: "Hangatnya Duduk Dekat Api Unggun",
    category: "Perpindahan Kalor",
    correctConcept: "Radiasi Termal",
    scenario: "Saat berkemah malam hari di udara pegunungan yang dingin, tubuh terasa hangat seketika saat duduk mengelilingi kobaran api unggun tanpa menyentuhnya.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <line x1="25" y1="75" x2="75" y2="75" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>
        <line x1="30" y1="70" x2="70" y2="80" stroke="#451a03" stroke-width="5" stroke-linecap="round"/>
        <path d="M50 20 Q 65 45 60 70 Q 50 73 40 70 Q 35 45 50 20 Z" fill="#f97316"/>
        <path d="M50 35 Q 58 50 55 70 Q 50 71 45 70 Q 42 50 50 35 Z" fill="#facc15"/>
        <path d="M72 40 Q 80 50 75 60" stroke="#f59e0b" stroke-dasharray="2,3" stroke-width="2" fill="none"/>
        <path d="M28 40 Q 20 50 25 60" stroke="#f59e0b" stroke-dasharray="2,3" stroke-width="2" fill="none"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Api Unggun Malam</text>
    </svg>`,
    options: ["Radiasi Termal", "Konduksi Logam", "Konveksi Alami", "Penyusutan Suhu"],
    explanation: "Radiasi adalah perpindahan kalor dalam bentuk gelombang elektromagnetik (inframerah) tanpa memerlukan medium perantara sama sekali, memancar lurus dengan kecepatan cahaya."
  },
  {
    id: "match_4",
    title: "Es Batu Meleleh di Meja Makan",
    category: "Perubahan Wujud",
    correctConcept: "Menerima Kalor (Mencair)",
    scenario: "Balok es batu diletakkan di atas piring terbuka pada suhu ruang 28°C. Lama kelamaan balok es mengecil dan berubah seluruhnya menjadi genangan air.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="75" rx="35" ry="10" fill="#0284c7" opacity="0.4"/>
        <rect x="35" y="42" width="22" height="22" rx="3" fill="#bae6fd" stroke="#0284c7" stroke-width="2" transform="rotate(15 46 53)"/>
        <rect x="48" y="48" width="18" height="18" rx="2" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.5" transform="rotate(-10 57 57)"/>
        <path d="M20 30 Q 30 20 50 25" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,3" fill="none"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Es Melebur</text>
    </svg>`,
    options: ["Menerima Kalor (Mencair)", "Melepas Kalor (Membeku)", "Kapasitas Kalor Nol", "Menyublim Gas"],
    explanation: "Proses mencair (peleburan) adalah perubahan wujud dari padat menjadi cair yang membutuhkan penyerapan kalor (endotermik) dari lingkungan untuk merenggangkan ikatan kisi kristal zat padat."
  },
  {
    id: "match_5",
    title: "Air Menjadi Uap Saat Mendidih",
    category: "Perubahan Wujud",
    correctConcept: "Menguap (Evaporasi/Didih)",
    scenario: "Air di dalam teko yang terus dipanaskan sampai suhu 100°C mengeluarkan bunyi siulan dan menghasilkan hembusan gas putih tebal dari corongnya.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 65 L70 65 L65 45 L35 45 Z" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
        <path d="M35 45 Q 50 40 65 45" stroke="#94a3b8" stroke-width="2" fill="none"/>
        <path d="M68 50 L85 40 L82 35" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M85 35 Q 92 25 88 18 Q 96 15 90 8" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="3,3" fill="none"/>
        <path d="M35 75 Q 50 68 65 75" fill="#ef4444"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Teko Mendidih</text>
    </svg>`,
    options: ["Menguap (Evaporasi/Didih)", "Mengembun Alami", "Radiasi Benda Hitam", "Pemuaian Panjang"],
    explanation: "Menguap adalah perubahan wujud dari cair menjadi gas yang memerlukan energi kalor laten penguapan (Q = m × U) untuk melepaskan molekul cairan menjadi fase gas bebas."
  },
  {
    id: "match_6",
    title: "Tetesan Air di Dinding Luar Gelas Es",
    category: "Perubahan Wujud",
    correctConcept: "Mengembun (Kondensasi)",
    scenario: "Saat memesan es teh manis, bagian luar dinding gelas kaca basah dan dipenuhi titik-titik air padahal gelasnya sama sekali tidak bocor.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <polygon points="30,25 70,25 65,80 35,80" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <polygon points="32,45 68,45 64,78 36,78" fill="#b45309" opacity="0.6"/>
        <circle cx="28" cy="40" r="2" fill="#38bdf8"/>
        <circle cx="27" cy="55" r="2.5" fill="#38bdf8"/>
        <circle cx="72" cy="45" r="2" fill="#38bdf8"/>
        <circle cx="73" cy="62" r="2.5" fill="#38bdf8"/>
        <circle cx="30" cy="70" r="1.5" fill="#38bdf8"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Gelas Es Teh</text>
    </svg>`,
    options: ["Mengembun (Kondensasi)", "Membeku Kristal", "Konduksi Vakum", "Penyerapan Kalor"],
    explanation: "Uap air di udara sekitar gelas melepaskan kalor ke dinding gelas yang sangat dingin (suhu rendah). Akibatnya, uap air tersebut mengalami kondensasi (mengembun) menjadi butiran air cair."
  },
  {
    id: "match_7",
    title: "Cairan Agar-Agar Menjadi Padat",
    category: "Perubahan Wujud",
    correctConcept: "Melepas Kalor (Membeku)",
    scenario: "Ibu memasak larutan agar-agar mendidih lalu menuangnya ke dalam cetakan dan mendiamkannya hingga mengeras menjadi puding kenyal yang padat.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 45 L35 75 L65 75 L75 45 Z" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
        <ellipse cx="50" cy="45" rx="25" ry="8" fill="#f472b6" stroke="#be185d" stroke-width="1.5"/>
        <path d="M45 25 Q 40 35 48 40" stroke="#94a3b8" stroke-dasharray="2,2" stroke-width="1.5" fill="none"/>
        <path d="M55 25 Q 60 35 52 40" stroke="#94a3b8" stroke-dasharray="2,2" stroke-width="1.5" fill="none"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Cetakan Puding</text>
    </svg>`,
    options: ["Melepas Kalor (Membeku)", "Menyerap Kalor Gas", "Konveksi Atmosfer", "Penyubliman"],
    explanation: "Membeku adalah proses perubahan wujud dari cair menjadi padat. Dalam proses ini zat melepaskan kalor laten pembekuan ke udara sekitar hingga suhunya turun dan strukturnya memadat."
  },
  {
    id: "match_8",
    title: "Asap Cerobong Pabrik Naik ke Angkasa",
    category: "Perpindahan Kalor",
    correctConcept: "Konveksi Gas (Udara Panas)",
    scenario: "Gas buang dan asap sisa pembakaran pada cerobong industri selalu membubung tinggi ke atas langit dan tidak pernah mengendap di bawah.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="42" y="50" width="16" height="35" fill="#334155" stroke="#64748b" stroke-width="2"/>
        <path d="M40 50 L60 50" stroke="#94a3b8" stroke-width="3"/>
        <circle cx="50" cy="40" r="7" fill="#64748b" opacity="0.6"/>
        <circle cx="56" cy="30" r="10" fill="#94a3b8" opacity="0.5"/>
        <circle cx="48" cy="18" r="13" fill="#cbd5e1" opacity="0.4"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Cerobong Asap</text>
    </svg>`,
    options: ["Konveksi Gas (Udara Panas)", "Radiasi Panas", "Isolator Udara", "Kondensasi Asap"],
    explanation: "Gas yang panas akibat pembakaran mengalami pemuaian sehingga kerapatan partikel (massa jenis)-nya menjadi jauh lebih kecil daripada udara dingin di sekitarnya, membuatnya terdorong naik ke atas (konveksi gas)."
  },
  {
    id: "match_9",
    title: "Gagang Panci Terbuat dari Kayu / Bakelit",
    category: "Sifat Termal Bahan",
    correctConcept: "Isolator Termal",
    scenario: "Badan panci penggorengan dibuat dari aluminium yang cepat panas, namun tangkai pegangannya sengaja dilapisi kayu atau plastik ebonit.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="65" cy="55" rx="25" ry="15" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
        <rect x="15" y="52" width="28" height="7" rx="3.5" fill="#78350f" stroke="#b45309" stroke-width="2"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Panci & Gagang Kayu</text>
    </svg>`,
    options: ["Isolator Termal", "Konduktor Super", "Penyerap Radiasi", "Bahan Mudah Melebur"],
    explanation: "Isolator termal adalah bahan yang sukar atau lambat menghantarkan kalor karena elektron valensinya terikat kuat. Kayu dan plastik digunakan pada pegangan agar tangan juru masak aman dari sengatan panas."
  },
  {
    id: "match_10",
    title: "Kapur Barus Mengecil Tanpa Basah",
    category: "Perubahan Wujud",
    correctConcept: "Menyublim (Sublimasi)",
    scenario: "Bola kapur barus (kamper) wangi diletakkan di dalam lemari pakaian. Setelah dua minggu, bola mengecil dan menghilang tanpa meninggalkan jejak basah sama sekali.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="65" r="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <path d="M40 45 Q 43 35 48 30" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,3" fill="none"/>
        <path d="M52 48 Q 58 38 54 28" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-dasharray="2,3" fill="none"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Kamper Lemari</text>
    </svg>`,
    options: ["Menyublim (Sublimasi)", "Menguap Cairan", "Melepas Kalor Laten", "Mengkristal Salju"],
    explanation: "Menyublim adalah perubahan wujud zat dari padat langsung menjadi gas tanpa melalui fase cair terlebih dahulu, yang membutuhkan penyerapan kalor dari udara sekitar lemari."
  },
  {
    id: "match_11",
    title: "Sinar Matahari Terasa Hangat di Kulit",
    category: "Perpindahan Kalor",
    correctConcept: "Radiasi Melalui Ruang Hampa",
    scenario: "Energi panas matahari mampu melintasi ruang angkasa sejauh 150 juta kilometer yang hampa udara hingga sampai ke bumi dan menghangatkan tubuh kita.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="18" fill="#facc15" stroke="#f59e0b" stroke-width="3"/>
        <line x1="50" y1="18" x2="50" y2="8" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <line x1="50" y1="82" x2="50" y2="92" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <line x1="18" y1="50" x2="8" y2="50" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <line x1="82" y1="50" x2="92" y2="50" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <text x="50" y="98" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Matahari</text>
    </svg>`,
    options: ["Radiasi Melalui Ruang Hampa", "Konveksi Gravitasi", "Konduksi Atmosfer", "Embun Fototermal"],
    explanation: "Karena antara matahari dan atmosfer bumi terdapat ruang hampa (vakum mutlak), kalor hanya dapat berpindah secara radiasi berupa pancaran gelombang elektromagnetik tanpa butuh partikel medium apa pun."
  },
  {
    id: "match_12",
    title: "Suhu Es Nol Derajat Saat Melebur",
    category: "Konsep Kalor",
    correctConcept: "Kalor Laten Lebur",
    scenario: "Termometer yang dimasukkan ke dalam wadah berisi campuran es dan air yang sedang mencair tetap menunjukkan angka 0°C sampai seluruh es tuntas meleleh.",
    iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="46" y="20" width="8" height="55" rx="4" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
        <circle cx="50" cy="75" r="9" fill="#ef4444"/>
        <line x1="50" y1="70" x2="50" y2="50" stroke="#ef4444" stroke-width="3"/>
        <rect x="25" y="70" width="14" height="14" rx="2" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
        <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Termometer 0°C</text>
    </svg>`,
    options: ["Kalor Laten Lebur", "Pelepasan Suhu Nol", "Kapasitas Termal Maksimal", "Konduktivitas Nol"],
    explanation: "Kalor laten adalah kalor 'tersembunyi' yang tidak digunakan untuk menaikkan suhu zat, melainkan sepenuhnya digunakan untuk memutuskan ikatan antarmolekul agar wujud es berubah menjadi cairan."
  }
];
