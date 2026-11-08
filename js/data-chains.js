/**
 * Data for Game A: NUMBER CHAINS – Rantai Peristiwa Kalor
 * Materi IPA Kelas VII SMP
 */

const NUMBER_CHAINS_DATA = [
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
        hint: "Mulai dari air panas di dalam tabung, pantulan radiasi oleh lapisan perak, isolasi vakum, hingga tutup penyekat konveksi di bagian atas.",
        correctOrder: [
            "Air mendidih dituangkan ke dalam tabung kaca berdinding ganda pada termos.",
            "Dinding kaca bagian dalam dilapisi perak mengkilap untuk memantulkan kembali radiasi kalor ke dalam air.",
            "Ruang hampa udara (vakum) di antara dinding ganda mencegah perpindahan kalor secara konduksi dan konveksi.",
            "Sumbat atau tutup termos berbahan isolator (plastik atau gabus) mencegah udara panas keluar secara konveksi.",
            "Aliran kalor ke lingkungan luar terputus total sehingga suhu air panas dapat bertahan hingga berjam-jam."
        ],
        explanation: {
            summary: "Termos (diciptakan oleh Sir James Dewar) mengatasi ketiga mekanisme perpindahan kalor sekaligus:",
            keyPoints: [
                "<strong>Lapisan Perak Mengkilap:</strong> Menghentikan Radiasi (memantulkan gelombang elektromagnetik kalor kembali ke dalam wadah).",
                "<strong>Ruang Hampa (Vakum):</strong> Menghentikan Konduksi & Konveksi (tidak ada partikel zat perantara untuk menghantarkan getaran atau aliran kalor).",
                "<strong>Tutup Isolator:</strong> Menghentikan Konveksi udara keluar wadah."
            ],
            didYouKnow: "Prinsip termos juga digunakan astronot pada pakaian ruang angkasa untuk menahan suhu ekstrem antariksa!"
        }
    },
    {
        id: "chain_4",
        title: "Proses Pelepasan Kalor: Uap Menjadi Es",
        topic: "Perubahan Wujud yang Melepaskan Kalor",
        badge: "Tingkat Menengah",
        story: "Tidak semua proses kalor membutuhkan pemanasan. Susunlah urutan pendinginan dari uap air panas hingga membeku menjadi es!",
        hint: "Perubahan wujud yang melepaskan kalor meliputi: mengembun (gas ke cair) dan membeku (cair ke padat).",
        correctOrder: [
            "Uap air bersuhu di atas 100°C melepaskan kalor ke lingkungan dingin sehingga suhunya turun.",
            "Pada titik embun (100°C), uap air melepaskan kalor laten uap dan mengembun menjadi air cair.",
            "Air cair terus melepaskan kalor sehingga suhunya berangsur turun dari 100°C mendekati 0°C.",
            "Pada suhu 0°C (titik beku), air melepaskan kalor laten pembekuan tanpa mengalami perubahan suhu.",
            "Seluruh partikel merapat membentuk kisi kristal padat sehingga terbentuk es batu padat seutuhnya."
        ],
        explanation: {
            summary: "Pendinginan adalah proses perpindahan kalor dari benda ke lingkungan karena suhu lingkungan lebih rendah.",
            keyPoints: [
                "<strong>Mengembun:</strong> Gas ➔ Cair (Proses Melepas Kalor).",
                "<strong>Membeku:</strong> Cair ➔ Padat (Proses Melepas Kalor).",
                "<strong>Asas Kalor:</strong> Kalor selalu berpindah secara spontan dari benda bersuhu lebih tinggi ke lingkungan bersuhu lebih rendah."
            ],
            didYouKnow: "Ketika air membeku di dalam freezer kulkas, air tersebut 'membuang' kalor ke udara di belakang kulkas melalui pipa kondensor!"
        }
    },
    {
        id: "chain_5",
        title: "Keping Bimetal pada Setrika Listrik Otomatis",
        topic: "Pemuaian Zat Padat & Aplikasi Kalor",
        badge: "Tingkat Lanjut",
        story: "Setrika otomatis dapat mati sendiri saat terlalu panas. Susunlah urutan kerja keping bimetal pengatur suhu setrika!",
        hint: "Bimetal terdiri dari dua logam berbeda koefisien muai. Logam yang memuai lebih panjang akan melengkungkan kepingan dan memutus saklar.",
        correctOrder: [
            "Arus listrik mengalir melalui elemen pemanas setrika dan menghasilkan energi kalor.",
            "Keping bimetal yang terdiri dari dua keping logam berbeda koefisien muai menerima kalor yang sama.",
            "Logam dengan koefisien muai lebih besar mengalami pertambahan panjang lebih besar dibanding pasangannya.",
            "Perbedaan pertambahan panjang memaksa keping bimetal melengkung ke arah logam berkoefisien muai lebih kecil.",
            "Lengkungan bimetal mengangkat dan memutus kontak saklar listrik sehingga pemanasan setrika otomatis terhenti."
        ],
        explanation: {
            summary: "Bimetal memanfaatkan perbedaan laju pemuaian panjang antara dua logam yang dikeling menyatu.",
            keyPoints: [
                "<strong>Saat Panas:</strong> Bimetal melengkung ke arah logam yang koefisien muainya <em>lebih kecil</em> (memutus saklar arus listrik).",
                "<strong>Saat Dingin:</strong> Bimetal lurus kembali dan saklar menyala lagi secara otomatis (berfungsi sebagai termostat otomatis)."
            ],
            didYouKnow: "Prinsip bimetal ini juga digunakan pada alarm detektor kebakaran dan saklar pemutus oven microwave!"
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NUMBER_CHAINS_DATA };
}
