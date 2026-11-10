/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Standardized Scoring Engine for All 3 Mini-Games
 *
 * Point Rules:
 * - Jawaban Benar: 100 poin
 * - Jawaban Salah: 0 poin
 * - Bonus Kecepatan: 0–20 poin (dihitung proporsional berdasarkan sisa waktu)
 * - Tidak Menjawab / Waktu Habis: 0 poin
 * - Satu soal hanya dapat menghasilkan poin satu kali
 * - Refresh halaman tidak menyebabkan poin berulang
 */

export const POINT_CONFIG = {
  CORRECT_BASE_POINTS: 100,
  WRONG_POINTS: 0,
  MAX_SPEED_BONUS: 20,
  UNANSWERED_POINTS: 0
};

/**
 * Calculate score for a single question / stage
 * @param {Object} params
 * @param {boolean} params.isCorrect - Apakah jawaban benar
 * @param {number} [params.remainingSeconds=0] - Sisa waktu saat submit
 * @param {number} [params.totalSeconds=60] - Durasi total soal
 * @returns {Object} { isCorrect, basePoints, speedBonus, totalPoints, breakdownText }
 */
export function calculateQuestionScore({ isCorrect, remainingSeconds = 0, totalSeconds = 60 }) {
  if (!isCorrect) {
    return {
      isCorrect: false,
      basePoints: POINT_CONFIG.WRONG_POINTS,
      speedBonus: 0,
      totalPoints: POINT_CONFIG.WRONG_POINTS,
      breakdownText: '0 Poin (Jawaban Belum Tepat)'
    };
  }

  let speedBonus = 0;
  if (totalSeconds > 0 && remainingSeconds > 0) {
    const ratio = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
    speedBonus = Math.round(ratio * POINT_CONFIG.MAX_SPEED_BONUS);
  }

  const totalPoints = POINT_CONFIG.CORRECT_BASE_POINTS + speedBonus;
  const breakdownText = speedBonus > 0
    ? `+${totalPoints} POIN (+100 Benar, +${speedBonus} Bonus Cepat)`
    : `+${totalPoints} POIN (Jawaban Benar)`;

  return {
    isCorrect: true,
    basePoints: POINT_CONFIG.CORRECT_BASE_POINTS,
    speedBonus,
    totalPoints,
    breakdownText
  };
}

/**
 * Format score into display badge
 */
export function formatScoreBadge(score) {
  return `${Number(score || 0).toLocaleString('id-ID')} PTS`;
}
