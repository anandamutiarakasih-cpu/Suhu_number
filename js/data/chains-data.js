/**
 * Data for Game 1: NUMBER CHAINS – Rantai Peristiwa Kalor
 * Materi IPA Kelas VII SMP
 */

export const NUMBER_CHAINS_DATA = [
  {
    id: "chain_1",
    title: "Perjalanan Es Batu Menjadi Uap Air",
    topic: "Perubahan Wujud & Penyerapan Kalor",
    badge: "Tingkat Dasar",
    story: "Susunlah rantai urutan perubahan wujud zat dari es padat hingga mendidih menjadi uap air saat dipanaskan terus-menerus!",
    hint: "Ingat: sebelum es bisa melebur, suhunya harus naik dulu hingga titik lebur 0°C. Selama melebur dan mendidih, suhu zat tetap konstan!",
    correctOrder: [
      "Es padat bersuhu di bawah 0°C menyerap kalor sehingga suhunya berangsur naik.",
      "Suhu es mencapai titik lebur (0°C) dan mulai berubah wujud menjadi air cair.",
      "Kalor terus diserap pada suhu tetap 0°C hingga seluruh es mencair sempurna (kalor laten lebur).",
      "Air cair menyerap kalor lebih lanjut sehingga suhunya terus meningkat menuju 100°C.",
      "Air mencapai titik didih (100°C) dan mengalami penguapan menjadi uap air bersuhu tinggi."
    ],
    explanation: {
      summary: "Proses pemanasan zat melalui dua tahapan berulang: penaikan suhu (Q = m × c × ΔT) dan perubahan wujud (Q = m × L atau Q = m × U).",
      keyPoints: [
        "<strong>Tahap 1:</strong> Kalor digunakan menaikkan suhu es menuju titik lebur 0°C.",
        "<strong>Tahap 2:</strong> Kalor laten lebur digunakan merenggangkan ikatan molekul es menjadi air pada suhu tetap 0°C.",
        "<strong>Tahap 3:</strong> Kalor digunakan menaikkan suhu air dari 0°C ke 100°C.",
        "<strong>Tahap 4:</strong> Kalor laten uap digunakan mengubah air menjadi uap pada titik didih 100°C."
      ],
      didYouKnow: "Selama perubahan wujud (melebur atau mendidih), suhu zat tidak naik sama sekali meskipun api kompor terus menyala!"
    }
  },
  {
    id: "chain_2",
    title: "Terjadinya Angin Laut di Pesisir Pantai",
    topic: "Konveksi Fluida & Kalor Jenis",
    badge: "Tingkat Menengah",
    story: "Nelayan kembali ke darat pada siang hari dibantu angin laut. Susunlah urutan ilmiah terjadinya angin laut berikut ini!",
    hint: "Daratan memanas lebih cepat daripada air laut karena kalor jenis tanah lebih kecil. Udara panas selalu memuai dan bergerak naik!",
    correctOrder: [
      "Pada siang hari, sinar matahari memancarkan kalor melalui radiasi ke daratan dan lautan secara bersamaan.",
      "Daratan memanas lebih cepat daripada laut karena kalor jenis daratan jauh lebih kecil daripada air laut.",
      "Udara di atas daratan menjadi panas, memuai, dan massa jenisnya berkurang sehingga bergerak naik ke atas.",
      "Tekanan udara di atas daratan menjadi lebih rendah dibandingkan tekanan udara di atas lautan.",
      "Udara sejuk yang bertekanan lebih tinggi dari atas laut bergerak menuju ke daratan (terjadilah Angin Laut)."
    ],
    explanation: {
      summary: "Angin laut adalah contoh nyata perpindahan kalor secara konveksi alami dalam skala besar di atmosfer bumi.",
      keyPoints: [
        "<strong>Kalor Jenis (c):</strong> Air memiliki kalor jenis sangat tinggi (4.200 J/kg°C), sehingga butuh waktu lebih lama untuk menjadi panas dibanding tanah/pasir.",
        "<strong>Perbedaan Tekanan:</strong> Udara darat yang panas naik menciptakan daerah tekanan rendah, memicu aliran udara sejuk bertekanan tinggi dari laut ke darat di siang hari."
      ],
      didYouKnow: "Pada malam hari proses ini berbalik menjadi 'Angin Darat' karena daratan mendingin lebih cepat daripada air laut!"
    }
  },
  {
    id: "chain_3",
    title: "Rahasia Termos Menjaga Air Tetap Panas",
    topic: "Pencegahan Tiga Cara Perpindahan Kalor",
    badge: "Tingkat Menengah",
    story: "Termos dirancang secara cerdas untuk mencegah kehilangan kalor. Susunlah urutan prinsip kerja termos dari lapisan dalam hingga tutupnya!",
    hint: "Dinding kaca mengkilap mencegah radiasi, ruang hampa udara mencegah konduksi dan konveksi, sedangkan sumbat gabus menghentikan penguapan.",
    correctOrder: [
      "Air mendidih dimasukkan ke dalam wadah tabung kaca berlapis ganda.",
      "Ruang hampa udara (vakum) di antara dua dinding kaca menghentikan perpindahan kalor secara konduksi dan konveksi.",
      "Lapisan dinding kaca yang mengkilap keperakan memantulkan kembali pancaran kalor radiasi ke dalam air panas.",
      "Sumbat penutup dari bahan isolator (seperti gabus atau karet) dipasang rapat untuk mencegah konveksi ke udara luar.",
      "Suhu air panas dapat terjaga tahan lama hingga berjam-jam tanpa perlu dipanaskan kembali."
    ],
    explanation: {
      summary: "Termos diciptakan oleh James Dewar untuk mengatasi ketiga metode perpindahan kalor sekaligus: konduksi, konveksi, dan radiasi.",
      keyPoints: [
        "<strong>Ruang Hampa (Vakum):</strong> Tidak ada materi atau partikel, sehingga getaran (konduksi) dan aliran zat (konveksi) mustahil terjadi.",
        "<strong>Permukaan Perak Mengkilap:</strong> Benda mengkilap adalah pemancar dan penyerap radiasi yang sangat buruk, tetapi pemantul radiasi yang sempurna."
      ],
      didYouKnow: "Termos modern dapat menahan suhu air mendidih tetap di atas 70°C selama lebih dari 12 jam!"
    }
  },
  {
    id: "chain_4",
    title: "Siklus Terbentuknya Embun & Pembekuan Air",
    topic: "Pelepasan Kalor & Perubahan Wujud",
    badge: "Tingkat Lanjut",
    story: "Saat suhu lingkungan turun drastis di malam hari, zat melepaskan kalor ke alam. Susunlah urutan pelepasan kalor pada air berikut!",
    hint: "Gas melepas kalor menjadi cair (mengembun), kemudian cair melepas kalor lebih lanjut hingga membeku menjadi padat.",
    correctOrder: [
      "Uap air bersuhu hangat di udara terbuka melepaskan energi kalornya ke lingkungan yang mulai dingin di malam hari.",
      "Suhu uap air turun hingga mencapai titik embun dan mulai mengalami kondensasi (mengembun).",
      "Molekul-molekul uap air merapat dan berubah wujud menjadi butiran embun cair pada daun atau rumput.",
      "Butiran air cair terus melepaskan kalor lebih lanjut hingga suhunya menyentuh 0°C.",
      "Pada suhu 0°C, pelepasan kalor laten pembekuan mengubah tetesan air cair menjadi kristal es padat."
    ],
    explanation: {
      summary: "Mengembun dan membeku adalah proses pelepasan kalor (eksotermik) dari zat menuju ke lingkungan sekitar.",
      keyPoints: [
        "<strong>Pelepasan Kalor:</strong> Jarak antarmolekul semakin merapat seiring energi kinetik termal yang dilepaskan ke udara dingin.",
        "<strong>Titik Beku Air:</strong> Terjadi pada 0°C pada tekanan 1 atmosfer."
      ],
      didYouKnow: "Meskipun membeku mengeluarkan hawa dingin ke es, bagi udara sekitar proses pembekuan justru melepaskan kalor!"
    }
  },
  {
    id: "chain_5",
    title: "Pemuaian Keping Bimetal pada Setrika Otomatis",
    topic: "Pemuaian Panjang & Pengendalian Suhu",
    badge: "Tingkat Lanjut (Master)",
    story: "Setrika listrik otomatis mati sendiri saat sudah terlalu panas. Susunlah cara kerja keping bimetal pengontrol kalor berikut!",
    hint: "Bimetal terdiri dari dua logam dengan koefisien muai berbeda. Logam yang muainya lebih besar akan melengkung ke arah logam yang muainya lebih kecil!",
    correctOrder: [
      "Arus listrik mengalir melalui elemen pemanas setrika sehingga menghasilkan kalor dalam jumlah besar.",
      "Dua keping logam berbeda jenis (bimetal) yang dikeling rapat menerima kalor dan mulai memuai bersama.",
      "Logam A dengan koefisien muai panjang lebih besar memuai lebih panjang daripada logam B.",
      "Keping bimetal melengkung ke arah logam B (logam yang muainya lebih kecil) sehingga mendorong sakelar.",
      "Kontak sakelar listrik terputus otomatis, menghentikan aliran arus pemanas sebelum setrika terlalu panas."
    ],
    explanation: {
      summary: "Bimetal adalah penerapan pemuaian zat padat untuk alat kontrol suhu (termostat) otomatis.",
      keyPoints: [
        "<strong>Koefisien Muai Panjang (α):</strong> Nilai pertambahan panjang per satuan panjang saat suhu naik 1°C.",
        "<strong>Arah Lengkungan:</strong> Selalu melengkung ke arah logam yang koefisien muainya LEBIH KECIL.",
        "<strong>Saat Dingin:</strong> Keping bimetal lurus kembali dan menyambung kontak listrik secara otomatis."
      ],
      didYouKnow: "Prinsip bimetal digunakan pada hampir semua peralatan rumah tangga otomatis: rice cooker, setrika, kulkas, dan alarm kebakaran!"
    }
  }
];
