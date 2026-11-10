/**
 * Data for Game 3: CRYPTARITHM WAR – Tantangan Hitung Rumus Kalor
 * Materi IPA Kelas VII SMP
 * Format Baru: Jelas, Ramah Siswa, Menguji Pemahaman Fisika Nyata
 */

export const CRYPTARITHM_DATA = [
  {
    id: "crypto_1",
    title: "Mencari Nilai Kalor Jenis (c)",
    formula: "Q = m × c × ΔT",
    formulaHelp: "c = Q / (m × ΔT)",
    difficulty: "Level 1 • Pemula",
    story: "Laboratorium sains sedang menguji sampel zat cair bermassa 2 kg. Untuk menaikkan suhu zat tersebut sebesar 10°C, diperlukan kalor sebesar 200 Joule. Berapakah nilai kalor jenis (c) zat tersebut?",
    givens: [
      { label: "Kalor diserap (Q)", value: "200 Joule", icon: "🔥" },
      { label: "Massa zat (m)", value: "2 kg", icon: "📦" },
      { label: "Kenaikan suhu (ΔT)", value: "10 °C", icon: "🌡️" }
    ],
    questionPrompt: "Hitunglah nilai Kalor Jenis (c) zat cair tersebut:",
    targetVariable: "c",
    targetUnit: "J/kg°C",
    expectedAnswer: "10",
    acceptedAnswers: ["10"],
    hint: "Gunakan rumus: c = Q / (m × ΔT) = 200 / (2 × 10).",
    solutionSteps: [
      "Tulis rumus dasar kalor: Q = m × c × ΔT",
      "Ubah rumus untuk mencari c: c = Q / (m × ΔT)",
      "Masukkan angka yang diketahui: c = 200 / (2 × 10)",
      "Hitung penyebutnya: 2 × 10 = 20",
      "Bagi hasilnya: c = 200 / 20 = 10 J/kg°C!"
    ],
    keyConcept: "Kalor jenis (c) menyatakan banyaknya kalor yang diperlukan untuk menaikkan suhu 1 kg zat sebesar 1°C."
  },
  {
    id: "crypto_2",
    title: "Menghitung Total Kalor Pemanasan (Q)",
    formula: "Q = m × c × ΔT",
    formulaHelp: "Q = m × c × ΔT",
    difficulty: "Level 2 • Menengah",
    story: "Sebuah balok aluminium bermassa 3 kg dengan kalor jenis 400 J/kg°C dipanaskan hingga suhunya naik sebesar 5°C. Berapakah total energi kalor (Q) yang diserap aluminium?",
    givens: [
      { label: "Massa aluminium (m)", value: "3 kg", icon: "📦" },
      { label: "Kalor jenis (c)", value: "400 J/kg°C", icon: "⚛️" },
      { label: "Kenaikan suhu (ΔT)", value: "5 °C", icon: "🌡️" }
    ],
    questionPrompt: "Hitunglah total energi Kalor (Q) yang diserap aluminium:",
    targetVariable: "Q",
    targetUnit: "Joule",
    expectedAnswer: "6000",
    acceptedAnswers: ["6000", "6.000"],
    hint: "Kalikan bertahap: Q = 3 × 400 × 5. Hitung dulu 3 × 400 = 1.200, lalu kalikan 5.",
    solutionSteps: [
      "Gunakan rumus kalor: Q = m × c × ΔT",
      "Masukkan nilai: Q = 3 kg × 400 J/kg°C × 5°C",
      "Kalikan massa dengan kalor jenis: 3 × 400 = 1.200",
      "Kalikan dengan perubahan suhu: 1.200 × 5 = 6.000 Joule!"
    ],
    keyConcept: "Energi kalor berbanding lurus dengan massa, kalor jenis, dan perubahan suhu benda."
  },
  {
    id: "crypto_3",
    title: "Menentukan Suhu Akhir Pemanasan Air",
    formula: "ΔT = Q / (m × c)  ➔  T_akhir = T_awal + ΔT",
    formulaHelp: "ΔT = Q / (m × c) lalu T₂ = T₁ + ΔT",
    difficulty: "Level 2 • Menengah",
    story: "Air 1 kg bersuhu awal 25°C dipanaskan dengan kalor sebesar 84.000 Joule. Jika kalor jenis air adalah 4.200 J/kg°C, berapakah suhu akhir (T_akhir) air tersebut?",
    givens: [
      { label: "Massa air (m)", value: "1 kg", icon: "💧" },
      { label: "Suhu awal (T_awal)", value: "25 °C", icon: "🌡️" },
      { label: "Kalor diserap (Q)", value: "84.000 Joule", icon: "🔥" },
      { label: "Kalor jenis air (c)", value: "4.200 J/kg°C", icon: "⚛️" }
    ],
    questionPrompt: "Berapakah Suhu Akhir (T_akhir) air setelah dipanaskan?",
    targetVariable: "T_akhir",
    targetUnit: "°C",
    expectedAnswer: "45",
    acceptedAnswers: ["45"],
    hint: "Cari dulu kenaikan suhunya: ΔT = 84.000 / (1 × 4.200) = 20°C. Lalu tambahkan ke suhu awal: 25 + 20.",
    solutionSteps: [
      "Hitung kenaikan suhu (ΔT): ΔT = Q / (m × c)",
      "ΔT = 84.000 / (1 × 4.200) = 84.000 / 4.200 = 20°C",
      "Hitung suhu akhir: T_akhir = T_awal + ΔT",
      "T_akhir = 25°C + 20°C = 45°C!"
    ],
    keyConcept: "Suhu akhir pemanasan didapat dari suhu mula-mula ditambah pertambahan suhunya (ΔT)."
  },
  {
    id: "crypto_4",
    title: "Menghitung Kalor Lebur Bongkahan Es",
    formula: "Q = m × L",
    formulaHelp: "Q = m × L (tanpa perubahan suhu)",
    difficulty: "Level 3 • Perubahan Wujud",
    story: "Sebongkah es bermassa 0,2 kg pada suhu titik leburnya 0°C hendak dicairkan seluruhnya menjadi air 0°C. Kalor lebur es diketahui sebesar 336.000 J/kg. Berapakah kalor (Q) yang dibutuhkan?",
    givens: [
      { label: "Massa es (m)", value: "0,2 kg", icon: "🧊" },
      { label: "Kalor lebur es (L)", value: "336.000 J/kg", icon: "❄️" },
      { label: "Suhu es awal", value: "0 °C (titik lebur)", icon: "🌡️" }
    ],
    questionPrompt: "Hitung total Kalor Lebur (Q) yang diperlukan es:",
    targetVariable: "Q",
    targetUnit: "Joule",
    expectedAnswer: "67200",
    acceptedAnswers: ["67200", "67.200"],
    hint: "Rumus melebur: Q = m × L. Kalikan 0,2 dengan 336.000 (sama dengan 2 × 33.600).",
    solutionSteps: [
      "Gunakan rumus kalor perubahan wujud: Q = m × L",
      "Masukkan nilai: Q = 0,2 kg × 336.000 J/kg",
      "Hitung: 0,2 × 336.000 = 67.200 Joule!"
    ],
    keyConcept: "Kalor lebur (L) tidak menaikkan suhu zat, melainkan merenggangkan ikatan molekul es padat menjadi air cair."
  },
  {
    id: "crypto_5",
    title: "Keseimbangan Termal Campuran (Asas Black)",
    formula: "Q_lepas = Q_terima",
    formulaHelp: "T_campuran = (T₁ + T₂) / 2 (jika massa dan zat sama)",
    difficulty: "Level 3 • Asas Black",
    story: "Air panas 1 kg bersuhu 80°C dicampur dengan air dingin 1 kg bersuhu 20°C di dalam wadah terisolasi sempurna. Berapakah suhu akhir campuran (T_campuran) saat mencapai kesetimbangan termal?",
    givens: [
      { label: "Massa air panas (m₁)", value: "1 kg (T₁ = 80°C)", icon: "♨️" },
      { label: "Massa air dingin (m₂)", value: "1 kg (T₂ = 20°C)", icon: "🧊" },
      { label: "Kalor jenis kedua air (c)", value: "Sama (Air)", icon: "💧" }
    ],
    questionPrompt: "Tentukan Suhu Akhir Campuran (T_campuran):",
    targetVariable: "T_campuran",
    targetUnit: "°C",
    expectedAnswer: "50",
    acceptedAnswers: ["50"],
    hint: "Karena massa dan jenis cairannya sama, suhu campuran tepat berada di tengah rata-rata: (80 + 20) / 2 = 50°C.",
    solutionSteps: [
      "Terapkan hukum Asas Black: Q_lepas = Q_terima",
      "m₁ × c × (T₁ - T) = m₂ × c × (T - T₂)",
      "Karena m₁ = m₂ = 1 kg dan zatnya sama, persamaan menjadi sederhana:",
      "80 - T = T - 20",
      "80 + 20 = T + T  ➔  100 = 2T",
      "T_campuran = 100 / 2 = 50°C!"
    ],
    keyConcept: "Asas Black: Jumlah kalor yang dilepaskan benda bersuhu tinggi sama dengan kalor yang diserap benda bersuhu rendah."
  },
  {
    id: "crypto_6",
    title: "Kalkulasi Estafet Kalor Es Menjadi Air Hangat",
    formula: "Q_total = Q₁ (lebur) + Q₂ (panas)",
    formulaHelp: "Q_total = (m × L) + (m × c × ΔT)",
    difficulty: "Level Master • Puncak Kalor",
    story: "Es 1 kg bersuhu 0°C dileburkan tuntas menjadi air (L = 330.000 J/kg), kemudian air tersebut dipanaskan suhunya naik sebesar 10°C (c = 4.200 J/kg°C). Berapakah total kalor (Q_total) untuk kedua tahapan tersebut?",
    givens: [
      { label: "Massa es/air (m)", value: "1 kg", icon: "📦" },
      { label: "Kalor lebur es (L)", value: "330.000 J/kg", icon: "❄️" },
      { label: "Kenaikan suhu air (ΔT)", value: "10 °C", icon: "🌡️" },
      { label: "Kalor jenis air (c)", value: "4.200 J/kg°C", icon: "⚛️" }
    ],
    questionPrompt: "Hitung Total Energi Kalor (Q_total) kedua tahapan:",
    targetVariable: "Q_total",
    targetUnit: "Joule",
    expectedAnswer: "372000",
    acceptedAnswers: ["372000", "372.000"],
    hint: "Jumlahkan: Q₁ = 1 × 330.000 = 330.000 Joule. Q₂ = 1 × 4.200 × 10 = 42.000 Joule. Q_total = Q₁ + Q₂.",
    solutionSteps: [
      "Tahap 1 (Melebur es 0°C): Q₁ = m × L = 1 × 330.000 = 330.000 Joule",
      "Tahap 2 (Memanaskan air 0°C ke 10°C): Q₂ = m × c × ΔT = 1 × 4.200 × 10 = 42.000 Joule",
      "Jumlahkan total kalor: Q_total = 330.000 + 42.000 = 372.000 Joule!"
    ],
    keyConcept: "Proses bertahap memerlukan penjumlahan kalor perubahan wujud (Q laten) ditambah kalor perubahan suhu (Q sensibel)."
  }
];

// Helper normalizer
export function normalizeAnswer(ans) {
  if (ans === undefined || ans === null) return '';
  return String(ans).trim().replace(/\./g, '').replace(/,/g, '');
}
