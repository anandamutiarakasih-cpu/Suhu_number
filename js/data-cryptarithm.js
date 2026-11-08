/**
 * Data for Game C: CRYPTARITHM WAR – Teka-Teki Angka Kalor
 * Materi IPA Kelas VII SMP
 */

const CRYPTARITHM_DATA = [
    {
        id: "crypto_1",
        title: "Teka-Teki Kalor Jenis Zat",
        formula: "Q = m × c × ΔT",
        difficulty: "Level 1 (Pemula)",
        story: "Siswa laboratorium sedang menguji sampel zat cair. Kalor yang diserap sebesar 200 Joule untuk menaikkan suhu 2 kg zat sebesar 10°C. Carilah nilai kalor jenis zat tersebut!",
        givens: [
            { label: "Kalor diserap (Q)", value: "200 Joule" },
            { label: "Massa zat (m)", value: "2 kg" },
            { label: "Perubahan suhu (ΔT)", value: "10 °C" }
        ],
        puzzleDisplay: "200 = 2 × [ c ] × 10  ➔  200 = 20 × [ c ]",
        inputs: [
            { id: "c", label: "Nilai c", unit: "J/kg°C", expected: "10", placeholder: "c" }
        ],
        hint: "Bagi nilai Q (200) dengan hasil kali m dan ΔT (2 × 10 = 20).",
        solutionSteps: [
            "Gunakan rumus dasar kalor: Q = m × c × ΔT",
            "Masukkan nilai yang diketahui: 200 = 2 × c × 10",
            "Sederhanakan perkalian: 200 = 20 × c",
            "Hitung nilai c: c = 200 / 20 = 10 J/kg°C"
        ],
        keyConcept: "Kalor jenis (c) menyatakan banyaknya kalor yang dibutuhkan untuk menaikkan suhu 1 kg zat sebesar 1°C."
    },
    {
        id: "crypto_2",
        title: "Sandi Angka Kalor Q = [A][B]00 Joule",
        formula: "Q = m × c × ΔT",
        difficulty: "Level 2 (CoC Classic)",
        story: "Sebuah balok aluminium dipanaskan di atas pemanas burner. Berdasarkan data kalor jenis dan perubahan suhu, carilah digit sandi A dan B pada kalor yang diserap!",
        givens: [
            { label: "Massa aluminium (m)", value: "3 kg" },
            { label: "Kalor jenis aluminium (c)", value: "400 J/kg°C" },
            { label: "Kenaikan suhu (ΔT)", value: "5 °C" }
        ],
        puzzleDisplay: "Q = 3 × 400 × 5 = [ A ][ B ]00 Joule",
        inputs: [
            { id: "A", label: "Digit A (ribuan)", unit: "", expected: "6", placeholder: "A", maxLength: 1 },
            { id: "B", label: "Digit B (ratusan)", unit: "", expected: "0", placeholder: "B", maxLength: 1 }
        ],
        hint: "Kalikan bertahap: 3 × 400 = 1.200, lalu 1.200 × 5 = ?",
        solutionSteps: [
            "Gunakan rumus: Q = m × c × ΔT",
            "Kalikan: Q = 3 kg × 400 J/kg°C × 5°C",
            "Q = 1.200 × 5 = 6.000 Joule",
            "Pola teka-teki: [ A ][ B ]00 = 6000 Joule",
            "Maka didapat digit A = 6 dan digit B = 0!"
        ],
        keyConcept: "Massa yang lebih besar atau perubahan suhu yang lebih tinggi membutuhkan kalor yang berlipat ganda."
    },
    {
        id: "crypto_3",
        title: "Sandi Termometer Suhu Akhir [X]5°C",
        formula: "ΔT = Q / (m × c)",
        difficulty: "Level 3 (Tantangan Suhu)",
        story: "Air bermassa 0,5 kg bersuhu awal 25°C dipanaskan dengan kalor 63.000 J. Termometer digital menunjukkan suhu akhir [X]5°C. Tentukan digit angka X!",
        givens: [
            { label: "Massa air (m)", value: "0,5 kg" },
            { label: "Kalor jenis air (c)", value: "4.200 J/kg°C" },
            { label: "Suhu awal (T₁)", value: "25 °C" },
            { label: "Kalor diberikan (Q)", value: "63.000 Joule" }
        ],
        puzzleDisplay: "T₂ = 25°C + ΔT = [ X ]5°C",
        inputs: [
            { id: "X", label: "Digit X (puluhan T₂)", unit: "", expected: "5", placeholder: "X", maxLength: 1 }
        ],
        hint: "Hitung m × c = 0,5 × 4.200 = 2.100. Lalu cari ΔT = 63.000 / 2.100. Terakhir tambahkan suhu awal 25°C!",
        solutionSteps: [
            "Kapasitas kalor air: m × c = 0,5 kg × 4.200 J/kg°C = 2.100 J/°C",
            "Kenaikan suhu: ΔT = Q / (m × c) = 63.000 / 2.100 = 30°C",
            "Suhu akhir: T₂ = T₁ + ΔT = 25°C + 30°C = 55°C",
            "Pola teka-teki: [ X ]5°C = 55°C",
            "Maka digit X = 5!"
        ],
        keyConcept: "Suhu akhir (T₂) adalah penjumlahan dari suhu awal ditambah kenaikan suhu (ΔT)."
    },
    {
        id: "crypto_4",
        title: "Sandi Kalor Lebur Es [M] Kilogram",
        formula: "Q = m × L",
        difficulty: "Level 2 (Perubahan Wujud)",
        story: "Es batu bersuhu 0°C dipanaskan hingga seluruhnya melebur sempurna menjadi air 0°C. Carilah massa es batu misterius [M] yang dicairkan!",
        givens: [
            { label: "Kalor yang diserap (Q)", value: "668.000 Joule" },
            { label: "Kalor lebur es (L)", value: "334.000 J/kg" }
        ],
        puzzleDisplay: "668.000 = [ M ] × 334.000",
        inputs: [
            { id: "M", label: "Massa Es [M]", unit: "kg", expected: "2", placeholder: "M" }
        ],
        hint: "Pada perubahan wujud es melebur, gunakan rumus Q = m × L. Bagi Q dengan L untuk mencari massa!",
        solutionSteps: [
            "Pada proses peleburan, suhu tidak berubah: Q = m × L",
            "668.000 = m × 334.000",
            "m = 668.000 / 334.000 = 2 kg",
            "Maka massa es [M] = 2 kg!"
        ],
        keyConcept: "Kalor lebur (L) adalah kalor yang diperlukan 1 kg zat padat untuk berubah wujud menjadi cair pada titik leburnya."
    },
    {
        id: "crypto_5",
        title: "Kriptaritma Asas Black: Suhu Campuran [K][L]°C",
        formula: "Q_lepas = Q_terima",
        difficulty: "Level 3 (Kesetimbangan Termal)",
        story: "Satu kilogram air panas 80°C dicampur dengan satu kilogram air dingin 20°C dalam wadah isolasi tanpa ada kalor yang keluar. Carilah digit suhu akhir campuran [K][L]°C!",
        givens: [
            { label: "Air panas (m₁, T₁)", value: "1 kg, 80 °C" },
            { label: "Air dingin (m₂, T₂)", value: "1 kg, 20 °C" },
            { label: "Kalor jenis air (c)", value: "Sama (4.200 J/kg°C)" }
        ],
        puzzleDisplay: "80 - Tc = Tc - 20  ➔  100 = 2 × Tc  ➔  Tc = [ K ][ L ]°C",
        inputs: [
            { id: "K", label: "Digit K (puluhan)", unit: "", expected: "5", placeholder: "K", maxLength: 1 },
            { id: "L", label: "Digit L (satuan)", unit: "", expected: "0", placeholder: "L", maxLength: 1 }
        ],
        hint: "Karena massa kedua air sama persis, suhu campuran tepat berada di tengah-tengah antara 80°C dan 20°C: (80 + 20) / 2 = ?",
        solutionSteps: [
            "Asas Black: Kalor yang dilepaskan air panas = Kalor yang diserap air dingin",
            "m₁ × c × (80 - Tc) = m₂ × c × (Tc - 20)",
            "Karena massa dan kalor jenis sama: 80 - Tc = Tc - 20",
            "Pindahkan suku sejenis: 80 + 20 = 2 × Tc => 100 = 2 × Tc",
            "Tc = 100 / 2 = 50°C",
            "Maka digit K = 5 dan digit L = 0!"
        ],
        keyConcept: "Asas Black menyatakan energi kalor selalu kekal: kalor yang dilepas benda panas sama dengan kalor yang diterima benda dingin."
    },
    {
        id: "crypto_6",
        title: "Grand Battle CoC: Kriptaritma Tembaga [P][Q]°C",
        formula: "Q = m × c × ΔT",
        difficulty: "Level Master CoC",
        story: "Sebongkah tembaga murni 2 kg menyerap kalor sebesar 7.800 Joule. Jika kalor jenis tembaga 390 J/kg°C, tentukan digit puluhan P dan satuan Q pada kenaikan suhu ΔT = [P][Q]°C!",
        givens: [
            { label: "Massa tembaga (m)", value: "2 kg" },
            { label: "Kalor jenis tembaga (c)", value: "390 J/kg°C" },
            { label: "Kalor diberikan (Q)", value: "7.800 Joule" }
        ],
        puzzleDisplay: "7.800 = 2 × 390 × ΔT  ➔  7.800 = 780 × [ P ][ Q ]",
        inputs: [
            { id: "P", label: "Digit P (puluhan)", unit: "", expected: "1", placeholder: "P", maxLength: 1 },
            { id: "Q", label: "Digit Q (satuan)", unit: "", expected: "0", placeholder: "Q", maxLength: 1 }
        ],
        hint: "Hitung perkalian 2 × 390 = 780. Lalu bagi 7.800 dengan 780!",
        solutionSteps: [
            "Rumus kalor: Q = m × c × ΔT",
            "7.800 = 2 × 390 × ΔT",
            "7.800 = 780 × ΔT",
            "ΔT = 7.800 / 780 = 10°C",
            "Pola teka-teki: [ P ][ Q ]°C = 10°C",
            "Maka digit P = 1 dan digit Q = 0!"
        ],
        keyConcept: "Tembaga memiliki kalor jenis relatif kecil (390 J/kg°C), sehingga cepat mengalami kenaikan suhu saat diberi kalor."
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CRYPTARITHM_DATA };
}
