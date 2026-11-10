/**
 * Data for Game 1: NUMBER CHAINS – Rantai Peristiwa Kalor
 * Materi IPA Kelas VII SMP
 * Format Baru: Ringkas, Mudah Dipahami, dengan Kata Kunci & Ikon Ilmiah
 */

export const NUMBER_CHAINS_DATA = [
  {
    id: "chain_1",
    title: "Perjalanan Es Batu Menjadi Uap Air",
    topic: "Perubahan Wujud & Penyerapan Kalor",
    badge: "Level 1 • Dasar",
    story: "Bongkahan es batu bersuhu dingin di dalam panci dipanaskan terus-menerus hingga menjadi uap air. Urutkan 5 tahapan perubahannya dari awal sampai akhir!",
    hint: "Suhu es harus naik dulu ke 0°C sebelum mencair. Selama mencair & mendidih, suhu zat tetap konstan!",
    steps: [
      {
        id: "s1",
        step: 1,
        icon: "🧊",
        title: "Es Memanas Menuju 0°C",
        desc: "Suhu es padat di bawah 0°C menyerap kalor sehingga suhunya berangsur naik menuju titik lebur 0°C."
      },
      {
        id: "s2",
        step: 2,
        icon: "💧",
        title: "Es Mulai Melebur pada 0°C",
        desc: "Es mulai berubah wujud menjadi air pada suhu tetap 0°C (proses peleburan zat padat)."
      },
      {
        id: "s3",
        step: 3,
        icon: "🌊",
        title: "Es Mencair Sempurna Jadi Air 0°C",
        desc: "Seluruh es telah mencair sempurna menjadi air dingin bersuhu 0°C berkat kalor laten lebur."
      },
      {
        id: "s4",
        step: 4,
        icon: "♨️",
        title: "Air Memanas Menuju 100°C",
        desc: "Air cair terus menyerap kalor sehingga suhunya meningkat bertahap dari 0°C menuju titik didih 100°C."
      },
      {
        id: "s5",
        step: 5,
        icon: "💨",
        title: "Air Mendidih & Menjadi Uap Air",
        desc: "Air mencapai 100°C dan mendidih, menguap menjadi uap air bersuhu tinggi yang membubung ke udara."
      }
    ],
    explanation: {
      summary: "Pemanasan zat mengalami dua proses bergantian: penaikan suhu (Q = m × c × ΔT) dan perubahan wujud pada suhu konstan (Q = m × L atau Q = m × U).",
      keyPoints: [
        "<strong>Tahap 1 & 2:</strong> Es padat naik suhunya ke 0°C, lalu melebur menjadi air pada suhu tetap 0°C.",
        "<strong>Tahap 3 & 4:</strong> Air cair naik suhunya dari 0°C menuju titik didih 100°C.",
        "<strong>Tahap 5:</strong> Air mendidih dan berubah menjadi uap air pada suhu tetap 100°C."
      ],
      didYouKnow: "Selama es mencair atau air mendidih, suhu termometer tidak akan naik sama sekali meskipun api kompor terus menyala!"
    }
  },
  {
    id: "chain_2",
    title: "Terjadinya Angin Laut di Pesisir Pantai",
    topic: "Konveksi Fluida & Kalor Jenis",
    badge: "Level 2 • Menengah",
    story: "Pada siang hari yang cerah, hembusan angin sejuk bertiup dari arah laut menuju daratan. Urutkan tahapan ilmiah terjadinya angin laut berikut ini!",
    hint: "Kalor jenis daratan lebih kecil dibanding laut, sehingga daratan lebih cepat panas. Udara panas selalu memuai dan bergerak naik!",
    steps: [
      {
        id: "s1",
        step: 1,
        icon: "☀️",
        title: "Matahari Memancarkan Kalor ke Pantai",
        desc: "Sinar matahari memancarkan kalor radiasi secara serentak ke wilayah daratan dan air lautan."
      },
      {
        id: "s2",
        step: 2,
        icon: "🏖️",
        title: "Daratan Memanas Lebih Cepat dari Laut",
        desc: "Tanah dan pasir pantai cepat panas karena kalor jenis daratan jauh lebih kecil dibanding air laut."
      },
      {
        id: "s3",
        step: 3,
        icon: "🎈",
        title: "Udara Panas Daratan Memuai & Naik",
        desc: "Udara di atas daratan memanas, memuai, dan massa jenisnya mengecil sehingga bergerak naik ke atas."
      },
      {
        id: "s4",
        step: 4,
        icon: "📉",
        title: "Terbentuk Tekanan Rendah di Daratan",
        desc: "Naiknya udara panas menciptakan ruang bertekanan rendah (L) di atas permukaan daratan."
      },
      {
        id: "s5",
        step: 5,
        icon: "⛵",
        title: "Udara Sejuk dari Laut Bertiup ke Darat",
        desc: "Udara sejuk bertekanan tinggi dari atas lautan bergerak masuk ke darat, menghasilkan Angin Laut."
      }
    ],
    explanation: {
      summary: "Angin laut adalah peristiwa perpindahan kalor secara konveksi alami di atmosfer bumi akibat perbedaan kalor jenis antara daratan dan lautan.",
      keyPoints: [
        "<strong>Kalor Jenis Air Tinggi:</strong> Air butuh waktu lama untuk panas dan lama untuk dingin.",
        "<strong>Konveksi Udara:</strong> Udara panas naik digantikan aliran udara sejuk bertekanan tinggi dari laut di siang hari."
      ],
      didYouKnow: "Di malam hari terjadi proses kebalikannya yaitu Angin Darat, karena daratan mendingin jauh lebih cepat daripada air laut!"
    }
  },
  {
    id: "chain_3",
    title: "Rahasia Termos Menjaga Air Tetap Panas",
    topic: "Pencegahan Perpindahan Kalor",
    badge: "Level 2 • Menengah",
    story: "Termos dirancang khusus untuk menghentikan tiga cara perpindahan kalor. Urutkan cara kerja komponen termos dari lapisan dalam sampai tutupnya!",
    hint: "Kaca perak memantulkan radiasi, ruang hampa udara menghentikan konduksi & konveksi, dan sumbat mencegah penguapan.",
    steps: [
      {
        id: "s1",
        step: 1,
        icon: "🫖",
        title: "Air Mendidih Dituang ke Tabung Kaca",
        desc: "Air panas bersuhu tinggi dimasukkan ke dalam wadah tabung kaca berlapis ganda."
      },
      {
        id: "s2",
        step: 2,
        icon: "🪞",
        title: "Dinding Perak Memantulkan Radiasi",
        desc: "Lapisan kaca mengkilap keperakan memantulkan kembali radiasi panas agar tidak memancar keluar."
      },
      {
        id: "s3",
        step: 3,
        icon: "🚫",
        title: "Ruang Hampa (Vakum) Menahan Panas",
        desc: "Celah vakum tanpa udara di antara dua dinding kaca menghentikan konduksi dan konveksi kalor."
      },
      {
        id: "s4",
        step: 4,
        icon: "🧴",
        title: "Sumbat Isolator Menutup Rapat Termos",
        desc: "Tutup dari bahan isolator (gabus/plastik tebal) dipasang rapat untuk mencegah konveksi ke udara luar."
      },
      {
        id: "s5",
        step: 5,
        icon: "⏰",
        title: "Suhu Air Terjaga Hangat Berjam-jam",
        desc: "Kalor tidak dapat keluar melalui konduksi, konveksi, maupun radiasi, sehingga air tahan panas berjam-jam."
      }
    ],
    explanation: {
      summary: "Termos (Dewar Flask) dirancang untuk memblokir ketiga mekanisme perpindahan kalor sekaligus: konduksi, konveksi, dan radiasi.",
      keyPoints: [
        "<strong>Dinding Perak:</strong> Menolak dan memantulkan radiasi termal.",
        "<strong>Ruang Hampa:</strong> Mencegah konduksi dan konveksi karena tidak ada partikel medium perantara.",
        "<strong>Sumbat Isolator:</strong> Menghalangi pelepasan uap dan konveksi langsung ke udara ruangan."
      ],
      didYouKnow: "Termos modern berkualitas dapat menjaga air tetap panas di atas 70°C selama lebih dari 12 hingga 24 jam!"
    }
  },
  {
    id: "chain_4",
    title: "Siklus Terbentuknya Embun & Pembekuan",
    topic: "Pelepasan Kalor & Perubahan Wujud",
    badge: "Level 3 • Lanjut",
    story: "Saat suhu lingkungan turun drastis di malam hari hingga subuh, air melepaskan kalor ke udara dingin. Urutkan peristiwa pelepasan kalor pada air berikut!",
    hint: "Gas melepas kalor menjadi cair (mengembun), lalu cair melepas kalor lebih lanjut hingga membeku pada 0°C.",
    steps: [
      {
        id: "s1",
        step: 1,
        icon: "☁️",
        title: "Uap Air Hangat Melepaskan Kalor",
        desc: "Uap air di udara terbuka melepaskan energi panasnya ke lingkungan yang mulai mendingin di malam hari."
      },
      {
        id: "s2",
        step: 2,
        icon: "🌡️",
        title: "Suhu Uap Air Turun ke Titik Embun",
        desc: "Penurunan suhu uap air menyentuh titik embun sehingga uap air mulai mengalami proses kondensasi."
      },
      {
        id: "s3",
        step: 3,
        icon: "🌿",
        title: "Molekul Gas Berubah Jadi Tetesan Embun",
        desc: "Molekul uap air merapat dan berubah wujud menjadi butiran embun cair pada daun atau rumput."
      },
      {
        id: "s4",
        step: 4,
        icon: "❄️",
        title: "Tetesan Air Melepas Kalor Menuju 0°C",
        desc: "Embun cair terus melepaskan kalor ke udara malam yang semakin dingin hingga suhunya mencapai 0°C."
      },
      {
        id: "s5",
        step: 5,
        icon: "💎",
        title: "Air Membeku Jadi Kristal Es Padat",
        desc: "Pada suhu 0°C, pelepasan kalor laten pembekuan mengubah air cair menjadi kristal es padat."
      }
    ],
    explanation: {
      summary: "Mengembun dan membeku adalah contoh proses eksotermik (pelepasan kalor) dari zat menuju ke lingkungan sekitarnya.",
      keyPoints: [
        "<strong>Kondensasi (Mengembun):</strong> Gas melepas kalor menjadi cairan.",
        "<strong>Pembekuan:</strong> Cairan melepas kalor laten pembekuan menjadi padatan pada titik beku 0°C."
      ],
      didYouKnow: "Ketika air membeku di alam bebas, proses pembekuan justru melepaskan sejumlah kalor ke udara di sekitarnya!"
    }
  },
  {
    id: "chain_5",
    title: "Pemuaian Bimetal pada Sakelar Setrika Listrik",
    topic: "Pemuaian Panjang & Termostat Suhu",
    badge: "Level 3 • Master",
    story: "Setrika otomatis dapat mati sendiri saat sudah terlalu panas dan menyala lagi saat dingin. Urutkan alur kerja keping bimetal pengontrol kalor berikut!",
    hint: "Logam dengan koefisien muai lebih besar akan melengkung ke arah logam yang muainya lebih kecil!",
    steps: [
      {
        id: "s1",
        step: 1,
        icon: "⚡",
        title: "Arus Mengalir & Elemen Setrika Memanas",
        desc: "Arus listrik mengalir melewati elemen pemanas setrika sehingga menghasilkan energi kalor dalam jumlah besar."
      },
      {
        id: "s2",
        step: 2,
        icon: "🔥",
        title: "Keping Bimetal Menerima Kalor",
        desc: "Dua keping logam berbeda jenis (A dan B) yang dikeling rapat menyerap kalor dan mulai memuai bersama."
      },
      {
        id: "s3",
        step: 3,
        icon: "📏",
        title: "Logam A Memuai Lebih Panjang dari Logam B",
        desc: "Logam A memiliki koefisien muai panjang lebih besar dibanding logam B, sehingga memuai lebih panjang."
      },
      {
        id: "s4",
        step: 4,
        icon: "↩️",
        title: "Bimetal Melengkung & Mendorong Sakelar",
        desc: "Keping bimetal terpaksa melengkung ke arah logam B (yang muainya lebih kecil) dan menekan kontak sakelar."
      },
      {
        id: "s5",
        step: 5,
        icon: "🛑",
        title: "Kontak Listrik Terputus Otomatis",
        desc: "Arus listrik terputus otomatis sehingga pemanas berhenti bekerja sebelum setrika mengalami panas berlebih."
      }
    ],
    explanation: {
      summary: "Bimetal adalah alat sensor dan sakelar otomatis (termostat) yang memanfaatkan perbedaan laju pemuaian panjang antara dua jenis logam.",
      keyPoints: [
        "<strong>Koefisien Muai Panjang (α):</strong> Tingkat pertambahan panjang logam per kenaikan 1°C.",
        "<strong>Arah Lengkungan:</strong> Selalu melengkung ke arah logam yang koefisien muainya LEBIH KECIL.",
        "<strong>Saat Dingin:</strong> Bimetal lurus kembali dan menyambungkan kontak arus listrik secara otomatis."
      ],
      didYouKnow: "Prinsip bimetal digunakan pada hampir semua alat rumah tangga otomatis: setrika, rice cooker, kulkas, pemanggang roti, hingga alarm kebakaran!"
    }
  }
];

// Helper to get correct order texts for compatibility
NUMBER_CHAINS_DATA.forEach((chain) => {
  chain.correctOrder = chain.steps.map((s) => s.desc);
});
