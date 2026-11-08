/**
 * Data for Game B: START CHAMP – Tantangan Mencocokkan Konsep
 * Materi IPA Kelas VII SMP
 */

const START_CHAMP_DATA = [
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
            <path d="M45 65 Q 45 45 48 40" stroke="#ef4444" stroke-width="2.5" fill="none" marker-end="url(#arrow)"/>
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
        explanation: "Radiasi adalah perpindahan kalor tanpa zat perantara melalui pancaran gelombang elektromagnetik. Udara adalah isolator yang buruk, sehingga kehangatan api unggun sampai ke tubuh kita melalui radiasi inframerah."
    },
    {
        id: "match_4",
        title: "Es Batu Meleleh di Atas Meja",
        category: "Perubahan Wujud",
        correctConcept: "Menyerap Kalor (Mencair)",
        scenario: "Sepotong es batu diletakkan di piring pada suhu ruang (28°C). Beberapa menit kemudian es mengecil dan berubah wujud menjadi air cair.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="72" rx="38" ry="12" fill="#0284c7" opacity="0.4"/>
            <polygon points="40,35 60,35 70,55 50,55" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.5"/>
            <polygon points="40,35 50,55 35,68 25,48" fill="#7dd3fc" stroke="#bae6fd" stroke-width="1.5"/>
            <polygon points="50,55 70,55 60,68 40,68" fill="#0284c7" stroke="#bae6fd" stroke-width="1.5"/>
            <circle cx="58" cy="70" r="3" fill="#bae6fd"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Es Meleleh di Meja</text>
        </svg>`,
        options: ["Menyerap Kalor (Mencair)", "Melepas Kalor (Membeku)", "Menyublim (Gas)", "Konveksi Bebas"],
        explanation: "Mencair (melebur) adalah peristiwa perubahan wujud zat dari padat menjadi cair yang memerlukan atau menyerap energi kalor dari lingkungan sekitarnya ($Q = m \\cdot L$)."
    },
    {
        id: "match_5",
        title: "Titik Air di Luar Gelas Es Teh Dingin",
        category: "Perubahan Wujud",
        correctConcept: "Melepas Kalor (Mengembun)",
        scenario: "Dinding luar gelas yang berisi minuman es teh menjadi basah dan dipenuhi butiran-butiran air, padahal gelas tidak bocor sama sekali.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="32" y="25" width="36" height="52" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
            <rect x="34" y="38" width="32" height="37" fill="#b45309" opacity="0.6"/>
            <rect x="42" y="44" width="8" height="8" rx="1" fill="#e0f2fe"/>
            <circle cx="28" cy="45" r="2" fill="#38bdf8"/>
            <circle cx="71" cy="52" r="2.5" fill="#38bdf8"/>
            <circle cx="70" cy="65" r="2" fill="#38bdf8"/>
            <circle cx="29" cy="62" r="2.5" fill="#38bdf8"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Embun pada Gelas</text>
        </svg>`,
        options: ["Melepas Kalor (Mengembun)", "Menyerap Kalor (Mencair)", "Konduksi Zat Padat", "Kebocoran Kapiler"],
        explanation: "Mengembun terjadi saat uap air di udara bersentuhan dengan dinding gelas yang dingin. Uap air melepaskan kalor ke dinding gelas sehingga suhunya turun dan berubah wujud menjadi tetesan air cair."
    },
    {
        id: "match_6",
        title: "Pakaian Basah Kering di Bawah Matahari",
        category: "Perubahan Wujud",
        correctConcept: "Menyerap Kalor (Menguap)",
        scenario: "Baju seragam sekolah yang baru dicuci basah digantung di jemuran luar ruangan, setelah terkena panas terik matahari menjadi kering sempurna.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <line x1="10" y1="25" x2="90" y2="25" stroke="#94a3b8" stroke-width="2"/>
            <path d="M35 30 L65 30 L75 42 L67 48 L61 40 L61 68 L39 68 L39 40 L33 48 L25 42 Z" fill="#3b82f6"/>
            <circle cx="80" cy="18" r="8" fill="#facc15"/>
            <path d="M45 20 Q 42 12 47 6" stroke="#e0f2fe" stroke-width="1.5" fill="none"/>
            <path d="M55 20 Q 52 12 57 6" stroke="#e0f2fe" stroke-width="1.5" fill="none"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Jemuran Pakaian</text>
        </svg>`,
        options: ["Menyerap Kalor (Menguap)", "Melepas Kalor (Mengkristal)", "Konduksi Dingin", "Membeku"],
        explanation: "Menguap adalah proses perubahan wujud zat dari cair menjadi gas. Molekul air pada kain menyerap energi kalor dari sinar matahari sehingga energi kinetiknya meningkat dan lepas ke udara bebas."
    },
    {
        id: "match_7",
        title: "Pegangan Spatula Berbahan Kayu / Ebonit",
        category: "Sifat Penghantar Kalor",
        correctConcept: "Isolator Termal",
        scenario: "Ibu memasak menggoreng ikan menggunakan spatula logam yang bagian gagang pegangannya dilapisi bahan kayu atau ebonit agar tangan tidak melepuh.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="65" width="28" height="20" rx="3" fill="#64748b"/>
            <line x1="38" y1="65" x2="60" y2="35" stroke="#94a3b8" stroke-width="5"/>
            <rect x="58" y="20" width="12" height="25" rx="3" fill="#b45309" stroke="#78350f" stroke-width="2" transform="rotate(-35 60 25)"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Gagang Spatula Kayu</text>
        </svg>`,
        options: ["Isolator Termal", "Konduktor Termal Baik", "Radiator Gelombang", "Sublimasi"],
        explanation: "Isolator termal adalah benda atau zat yang sangat sukar atau lambat menghantarkan kalor. Kayu, plastik, dan ebonit dimanfaatkan sebagai gagang peralatan masak untuk mencegah konduksi ke tangan."
    },
    {
        id: "match_8",
        title: "Dasar Panci Memakai Tembaga / Aluminium",
        category: "Sifat Penghantar Kalor",
        correctConcept: "Konduktor Termal yang Baik",
        scenario: "Peralatan memasak koki profesional sering menggunakan panci dengan bagian alas bawah terbuat dari tembaga atau aluminium tebal.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 40 L75 40 L70 70 L30 70 Z" fill="#475569"/>
            <rect x="28" y="70" width="44" height="8" rx="2" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
            <path d="M35 84 Q 50 78 65 84" stroke="#f97316" stroke-width="3" fill="none"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Alas Panci Tembaga</text>
        </svg>`,
        options: ["Konduktor Termal yang Baik", "Isolator Termal Kuat", "Penyerap Gelombang", "Termosfer"],
        explanation: "Konduktor termal adalah zat yang sangat cepat dan mudah menghantarkan kalor. Logam tembaga dan aluminium memiliki konduktivitas termal sangat tinggi, membuat masakan matang merata dan hemat energi."
    },
    {
        id: "match_9",
        title: "Panel Pemanas Air Surya Berwarna Hitam",
        category: "Radiasi & Warna",
        correctConcept: "Penyerap Radiasi Termal Maksimal",
        scenario: "Permukaan panel pemanas air tenaga surya yang dipasang di atap rumah selalu dicat dengan warna hitam doff/pekat, bukan putih berkilap.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="22" y="30" width="56" height="42" rx="3" fill="#090d16" stroke="#334155" stroke-width="2"/>
            <line x1="36" y1="30" x2="36" y2="72" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="50" y1="30" x2="50" y2="72" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="64" y1="30" x2="64" y2="72" stroke="#38bdf8" stroke-width="1.5"/>
            <polygon points="15,18 20,28 10,28" fill="#facc15"/>
            <polygon points="40,12 43,20 37,20" fill="#facc15"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Panel Surya Hitam</text>
        </svg>`,
        options: ["Penyerap Radiasi Termal Maksimal", "Pemantul Cahaya Sempurna", "Konveksi Tertutup", "Isolator Alami"],
        explanation: "Benda berwarna hitam atau gelap adalah penyerap sekaligus pemancar radiasi kalor terbaik. Warna hitam menyerap hampir seluruh spektrum radiasi matahari dan mengubahnya menjadi energi panas."
    },
    {
        id: "match_10",
        title: "Kapur Barus di Lemari Semakin Mengecil",
        category: "Perubahan Wujud",
        correctConcept: "Menyerap Kalor (Menyublim)",
        scenario: "Sebuah bola kapur barus (kamper) diletakkan di sudut lemari pakaian. Setelah sebulan, bola kamper mengecil tanpa meninggalkan jejak cairan basah.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="55" r="16" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
            <path d="M42 34 Q 45 24 50 16" stroke="#c084fc" stroke-width="2" stroke-dasharray="2,2" fill="none"/>
            <path d="M56 34 Q 58 25 54 18" stroke="#c084fc" stroke-width="2" stroke-dasharray="2,2" fill="none"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Kapur Barus Mengecil</text>
        </svg>`,
        options: ["Menyerap Kalor (Menyublim)", "Melepas Kalor (Membeku)", "Konduksi Molekuler", "Pengembunan Gas"],
        explanation: "Menyublim adalah perubahan wujud zat dari padat langsung menjadi gas. Proses ini memerlukan/menyerap kalor dari udara sekitarnya, sehingga kapur barus padat berubah menjadi partikel gas harum."
    },
    {
        id: "match_11",
        title: "Celah Sambungan Rel Kereta Api",
        category: "Aplikasi Pemuaian",
        correctConcept: "Mengantisipasi Pemuaian Panjang",
        scenario: "Sambungan antara dua batang rel kereta api baja selalu diberi celah rongga beberapa milimeter dan tidak dipasang saling merapat.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="50" width="32" height="12" fill="#64748b" stroke="#94a3b8" stroke-width="1.5"/>
            <rect x="53" y="50" width="32" height="12" fill="#64748b" stroke="#94a3b8" stroke-width="1.5"/>
            <line x1="49" y1="40" x2="49" y2="72" stroke="#ef4444" stroke-width="2" stroke-dasharray="2,2"/>
            <circle cx="50" cy="22" r="7" fill="#f59e0b"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Celah Pemuaian Rel</text>
        </svg>`,
        options: ["Mengantisipasi Pemuaian Panjang", "Mencegah Konveksi Besi", "Meredam Radiasi Rel", "Penyusutan Permanen"],
        explanation: "Zat padat seperti rel baja akan memuai (bertambah panjang) ketika menyerap panas terik matahari di siang hari. Pemberian celah mencegah batang rel mendesak satu sama lain hingga melengkung berbahaya."
    },
    {
        id: "match_12",
        title: "Nelayan Berlayar Melaut pada Malam Hari",
        category: "Perpindahan Kalor & Alam",
        correctConcept: "Angin Darat (Konveksi Udara Alami)",
        scenario: "Para nelayan tradisional di pantai mulai bertolak melaut mencari ikan pada malam hari menggunakan perahu layar yang didorong angin menuju lepas pantai.",
        iconSvg: `<svg viewBox="0 0 100 100" class="concept-svg" xmlns="http://www.w3.org/2000/svg">
            <path d="M70 20 Q 75 25 72 32 Q 80 28 82 22 Z" fill="#fef08a"/>
            <path d="M30 65 L60 65 L55 75 L35 75 Z" fill="#78350f"/>
            <polygon points="45,40 45,64 58,64" fill="#f8fafc"/>
            <path d="M15 50 Q 25 46 38 52" stroke="#38bdf8" stroke-width="2" fill="none"/>
            <path d="M10 60 Q 20 56 32 62" stroke="#38bdf8" stroke-width="2" fill="none"/>
            <text x="50" y="95" font-size="8" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">Nelayan Melaut Malam</text>
        </svg>`,
        options: ["Angin Darat (Konveksi Udara Alami)", "Angin Lembah (Radiasi Laut)", "Konduksi Air Laut", "Mencairnya Es Kutub"],
        explanation: "Pada malam hari, daratan lebih cepat melepaskan kalor daripada lautan (karena kalor jenis tanah lebih kecil). Udara di atas laut lebih hangat dan bergerak naik, digantikan aliran udara sejuk dari darat ke laut (Angin Darat)."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { START_CHAMP_DATA };
}
