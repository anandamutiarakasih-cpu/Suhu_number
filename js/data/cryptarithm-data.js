/**
 * Data for Game 3: CRYPTARITHM WAR – Teka-Teki Angka Kalor
 * Materi IPA Kelas VII SMP
 */

export const CRYPTARITHM_DATA = [
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
    difficulty: "Level 2 (Menengah)",
    story: "Air bermassa 1 kg pada suhu awal 25°C dipanaskan dengan kalor 84.000 Joule (c air = 4.200 J/kg°C). Carilah digit X pada suhu akhir air [X]5°C!",
    givens: [
      { label: "Massa air (m)", value: "1 kg" },
      { label: "Suhu awal (T₁)", value: "25 °C" },
      { label: "Kalor diserap (Q)", value: "84.000 Joule" },
      { label: "Kalor jenis air (c)", value: "4.200 J/kg°C" }
    ],
    puzzleDisplay: "ΔT = 84000 / 4200 = 20°C  ➔  T_akhir = 25 + 20 = [ X ]5 °C",
    inputs: [
      { id: "X", label: "Digit X (puluhan)", unit: "°C", expected: "4", placeholder: "X", maxLength: 1 }
    ],
    hint: "ΔT = Q / (m × c) = 84.000 / 4.200 = 20°C. Suhu akhir = Suhu awal + ΔT = 25 + 20 = 45°C.",
    solutionSteps: [
      "Hitung kenaikan suhu: ΔT = Q / (m × c)",
      "ΔT = 84.000 / (1 × 4.200) = 20°C",
      "Hitung suhu akhir (T₂): T₂ = T₁ + ΔT",
      "T₂ = 25°C + 20°C = 45°C",
      "Cocokkan dengan pola [ X ]5°C ➔ X = 4!"
    ],
    keyConcept: "Suhu akhir pemanasan adalah suhu awal ditambah dengan besarnya perubahan suhu (ΔT)."
  },
  {
    id: "crypto_4",
    title: "Misteri Kalor Lebur Es Q = [P]0.000 Joule",
    formula: "Q = m × L",
    difficulty: "Level 3 (Perubahan Wujud)",
    story: "Laboratorium menyimpan bongkahan es 0,2 kg pada titik leburnya 0°C. Kalor lebur es diketahui sebesar 336.000 J/kg. Carilah nilai digit P pada total kalor lebur!",
    givens: [
      { label: "Massa es (m)", value: "0,2 kg" },
      { label: "Kalor lebur es (L)", value: "336.000 J/kg" },
      { label: "Suhu es awal", value: "0 °C (siap melebur)" }
    ],
    puzzleDisplay: "Q = 0,2 × 336.000 = 67.200  ➔  [ P ] = Digit pertama (puluh ribuan)",
    inputs: [
      { id: "P", label: "Digit P (angka pertama dari 67.200)", unit: "", expected: "6", placeholder: "P", maxLength: 1 }
    ],
    hint: "0,2 × 336.000 sama dengan 2 × 33.600 = 67.200 Joule. Berapakah angka pertamanya?",
    solutionSteps: [
      "Gunakan rumus kalor laten lebur: Q = m × L",
      "Masukkan nilai: Q = 0,2 kg × 336.000 J/kg",
      "Hitung: Q = 67.200 Joule",
      "Digit puluh ribuan (P) = 6!"
    ],
    keyConcept: "Kalor lebur (L) tidak menaikkan suhu, melainkan merombak susunan partikel padat menjadi cair."
  },
  {
    id: "crypto_5",
    title: "Keseimbangan Termal Asas Black",
    formula: "Q_lepas = Q_terima",
    difficulty: "Level 3 (Asas Black)",
    story: "Air panas 1 kg bersuhu 80°C dicampur dengan air dingin 1 kg bersuhu 20°C di dalam bejana terisolasi. Tentukan suhu akhir campuran [ T ] °C!",
    givens: [
      { label: "Massa air panas (m₁)", value: "1 kg" },
      { label: "Suhu air panas (T₁)", value: "80 °C" },
      { label: "Massa air dingin (m₂)", value: "1 kg" },
      { label: "Suhu air dingin (T₂)", value: "20 °C" }
    ],
    puzzleDisplay: "m₁ × c × (80 - T) = m₂ × c × (T - 20)  ➔  80 - T = T - 20  ➔  2T = 100",
    inputs: [
      { id: "T", label: "Suhu Campuran (T)", unit: "°C", expected: "50", placeholder: "T" }
    ],
    hint: "Karena massa dan kalor jenis kedua air sama, suhu akhir berada persis di tengah-tengah: (80 + 20) / 2.",
    solutionSteps: [
      "Gunakan Asas Black: Q_lepas = Q_terima",
      "m₁ × c × (T₁ - T_campuran) = m₂ × c × (T_campuran - T₂)",
      "Karena m₁ = m₂ dan jenis zatnya sama (air), nilai m dan c bisa dicoret:",
      "80 - T = T - 20",
      "80 + 20 = T + T  ➔  100 = 2T",
      "T = 100 / 2 = 50°C"
    ],
    keyConcept: "Asas Black: Kalor yang dilepaskan benda bersuhu tinggi sama dengan kalor yang diserap benda bersuhu rendah."
  },
  {
    id: "crypto_6",
    title: "Kalkulasi Estafet Kalor Es Menjadi Air Hangat",
    formula: "Q_total = Q₁ (lebur) + Q₂ (panas)",
    difficulty: "Level Master (Puncak CoC)",
    story: "Bongkahan es 1 kg pada suhu 0°C dileburkan seluruhnya menjadi air (L = 330.000 J/kg), lalu dipanaskan hingga suhunya naik 10°C (c = 4.200 J/kg°C). Carilah nilai digit ratus ribuan [ M ] pada total kalor!",
    givens: [
      { label: "Massa es & air (m)", value: "1 kg" },
      { label: "Kalor lebur (L)", value: "330.000 J/kg" },
      { label: "Kenaikan suhu air (ΔT)", value: "10 °C" },
      { label: "Kalor jenis air (c)", value: "4.200 J/kg°C" }
    ],
    puzzleDisplay: "Q₁ = 330.000 J | Q₂ = 42.000 J ➔ Q_total = [ M ]72.000 Joule",
    inputs: [
      { id: "M", label: "Digit M (ratus ribuan)", unit: "", expected: "3", placeholder: "M", maxLength: 1 }
    ],
    hint: "Q_total = 330.000 + (1 × 4.200 × 10) = 330.000 + 42.000 = 372.000 Joule. Berapakah digit M?",
    solutionSteps: [
      "Tahap 1 (Meleburkan es 0°C jadi air 0°C): Q₁ = m × L = 1 × 330.000 = 330.000 Joule",
      "Tahap 2 (Memanaskan air 0°C ke 10°C): Q₂ = m × c × ΔT = 1 × 4.200 × 10 = 42.000 Joule",
      "Total kalor: Q_total = Q₁ + Q₂ = 330.000 + 42.000 = 372.000 Joule",
      "Cocokkan pola [ M ]72.000 ➔ M = 3!"
    ],
    keyConcept: "Proses bertingkat memerlukan perhitungan kalor kumulatif: kalor perubahan wujud ditambah kalor kenaikan suhu."
  }
];
