/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 2 - Start Champ View (Concept Matching with Illustrated Scenarios)
 * 12 Heat Transfer & State Change Challenges in 3 Dynamic Rounds (Max 35 Pts)
 */

import { START_CHAMP_DATA } from '../data/matching-data.js';
import { SyncTimer } from '../components/timer.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';

export function renderGame2View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange }) {
  const ROUND_SIZE = 4;
  const TOTAL_ROUNDS = Math.ceil(START_CHAMP_DATA.length / ROUND_SIZE); // 3 rounds
  let currentRound = 0;
  let userSelections = {}; // itemId -> selectedOption
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let totalCorrectMatches = 0;
  let isChecking = false;

  // Realtime Session Listener
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase && session.currentPhase !== 'GAME2') {
      cleanup();
      if (onPhaseChange) onPhaseChange(session.currentPhase, session);
    }
  });

  loadRound(currentRound);

  function loadRound(roundIndex) {
    if (roundIndex >= TOTAL_ROUNDS) {
      finishGame2();
      return;
    }

    const startIdx = roundIndex * ROUND_SIZE;
    const roundItems = START_CHAMP_DATA.slice(startIdx, startIdx + ROUND_SIZE);

    renderRoundUI(roundItems);
  }

  function renderRoundUI(roundItems) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game2-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 2 • START CHAMP</span>
            <h2 class="tc-hud-title">COCOKKAN KONSEP KALOR (RONDE ${currentRound + 1}/${TOTAL_ROUNDS})</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game2-timer-container"></div>
          </div>

          <div class="tc-hud-team">
            <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
            <span class="tc-hud-score-tag">TARGET: 35 PTS</span>
          </div>
        </div>

        <!-- Banner Instruction -->
        <div class="tc-banner-instruction pulse">
          <span class="tc-fire-icon">🔬</span>
          <span>Amati ilustrasi peristiwa sehari-hari di bawah ini dan pasangkan dengan konsep kalor yang tepat!</span>
        </div>

        <!-- 4 Matching Cards Grid -->
        <div class="tc-matching-grid" id="matching-cards-grid">
          ${roundItems.map((item) => `
            <div class="tc-match-card" id="card-${item.id}" data-id="${item.id}">
              <div class="tc-match-svg-wrap">
                ${item.iconSvg}
              </div>
              <div class="tc-match-cat">${item.category}</div>
              <h3 class="tc-match-title">${item.title}</h3>
              <p class="tc-match-desc">${item.scenario}</p>

              <div class="tc-options-label">PILIH KONSEP YANG TEPAT:</div>
              <div class="tc-options-grid">
                ${item.options.map((opt) => `
                  <button type="button" class="tc-option-btn ${userSelections[item.id] === opt ? 'selected' : ''}" 
                    data-id="${item.id}" data-option="${opt}">
                    ${opt}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Submit Button -->
        <div class="tc-match-actions">
          <button id="btn-check-match" class="tc-btn tc-btn-primary tc-btn-large">
            <span>PERIKSA JAWABAN RONDE ${currentRound + 1}</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `;

    // Timer HUD
    const timerBox = container.querySelector('#game2-timer-container');
    firebaseService.getSession(sessionCode).then((session) => {
      const startTime = session?.phaseStartTime || Date.now();
      const duration = session?.settings?.game2Duration || 180;

      if (timerInstance) timerInstance.stop();
      timerInstance = new SyncTimer({
        container: timerBox,
        durationSec: duration,
        startTimeMs: startTime,
        getServerTime: () => firebaseService.getServerTime(),
        onComplete: () => {
          toast.warning('Waktu Game 2 berakhir!');
          finishGame2();
        }
      });
    });

    attachInteractions(roundItems);
  }

  function attachInteractions(roundItems) {
    const grid = container.querySelector('#matching-cards-grid');
    const checkBtn = container.querySelector('#btn-check-match');

    // Option Button Click
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.tc-option-btn');
      if (!btn || isChecking) return;
      audio.playClick();

      const itemId = btn.dataset.id;
      const option = btn.dataset.option;

      // Deselect siblings
      const card = container.querySelector(`#card-${itemId}`);
      card.querySelectorAll('.tc-option-btn').forEach((b) => b.classList.remove('selected'));

      btn.classList.add('selected');
      userSelections[itemId] = option;
    });

    // Check Answers
    checkBtn.addEventListener('click', () => {
      if (isChecking) return;

      // Verify all items in this round have a selection
      for (const item of roundItems) {
        if (!userSelections[item.id]) {
          toast.warning(`Silakan pilih jawaban untuk kartu "${item.title}" terlebih dahulu.`);
          return;
        }
      }

      isChecking = true;
      evaluateRound(roundItems);
    });
  }

  function evaluateRound(roundItems) {
    let roundCorrectCount = 0;

    roundItems.forEach((item) => {
      const card = container.querySelector(`#card-${item.id}`);
      const selected = userSelections[item.id];
      const isCorrect = selected === item.correctConcept;

      if (isCorrect) {
        roundCorrectCount++;
        totalCorrectMatches++;
        card.classList.add('card-correct');
        const correctBtn = card.querySelector(`[data-option="${item.correctConcept}"]`);
        if (correctBtn) correctBtn.classList.add('option-correct');
      } else {
        card.classList.add('card-wrong');
        const wrongBtn = card.querySelector(`[data-option="${selected}"]`);
        if (wrongBtn) wrongBtn.classList.add('option-wrong');
        const correctBtn = card.querySelector(`[data-option="${item.correctConcept}"]`);
        if (correctBtn) correctBtn.classList.add('option-correct');
      }
    });

    if (roundCorrectCount === roundItems.length) {
      audio.playCorrect();
      toast.success(`🎉 Luar Biasa! Semua ${roundItems.length} konsep di Ronde ${currentRound + 1} benar!`);
    } else {
      audio.playWrong();
      toast.info(`Ronde ${currentRound + 1}: ${roundCorrectCount} dari ${roundItems.length} konsep tepat.`);
    }

    setTimeout(() => {
      showRoundExplanationModal(roundItems);
    }, 800);
  }

  function showRoundExplanationModal(roundItems) {
    const content = `
      <div class="tc-modal-explanation">
        <p style="font-size:0.95rem; color:var(--tc-sky); margin-bottom:1rem; font-weight:600;">
          Ulasan Ilmiah Konsep Kalor Ronde ${currentRound + 1}:
        </p>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${roundItems.map((item) => `
            <div style="background:rgba(255,255,255,0.05); padding:0.75rem 1rem; border-radius:10px; border-left:4px solid var(--tc-orange);">
              <div style="font-weight:700; color:var(--tc-cream); margin-bottom:0.25rem;">${item.title} ➔ <span style="color:var(--tc-yellow);">${item.correctConcept}</span></div>
              <div style="font-size:0.88rem; color:#94a3b8; line-height:1.4;">${item.explanation}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    showLabModal({
      title: `Pembahasan Ronde ${currentRound + 1} (${roundItems.length} Konsep)`,
      contentHtml: content,
      confirmText: currentRound < TOTAL_ROUNDS - 1 ? 'Lanjut ke Ronde Berikutnya ➔' : 'Tuntaskan Game 2 🏆',
      onConfirm: () => {
        isChecking = false;
        currentRound++;
        loadRound(currentRound);
      }
    });
  }

  async function finishGame2() {
    cleanup();
    toast.info('Menyimpan skor Game 2 ke database...');
    try {
      // Calculate speed bonus based on remaining time fraction
      const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
      const speedBonus = remaining > 15 ? 5 : Math.round((remaining / 180) * 5 * 10) / 10;

      const res = await firebaseService.submitGame2Score(sessionCode, teamNumber, totalCorrectMatches, START_CHAMP_DATA.length, speedBonus);
      audio.playFanfare();

      container.innerHTML = `
        <div class="tc-view tc-game-complete-card">
          <div class="tc-card" style="text-align:center; max-width:580px; margin:3rem auto; padding:3rem 2rem;">
            <div style="font-size:4rem; margin-bottom:1rem;">⚡</div>
            <div class="tc-badge-lab">GAME 2 SELESAI</div>
            <h2 style="font-size:2rem; margin:0.5rem 0;">Start Champ Berhasil Dituntaskan!</h2>
            <p style="color:#94a3b8; margin-bottom:1.5rem;">
              Kelompok ${teamNumber} berhasil mencocokkan ${totalCorrectMatches} dari ${START_CHAMP_DATA.length} peristiwa konsep kalor.
            </p>
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:1.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>
            <p style="font-size:0.9rem; color:var(--tc-sky);">
              Menunggu instruksi guru untuk membuka babak Game 3: Cryptarithm War...
            </p>
          </div>
        </div>
      `;

      if (onGameCompleted) onGameCompleted(res.score);
    } catch (err) {
      toast.error('Gagal mengirim skor: ' + err.message);
    }
  }

  function cleanup() {
    if (timerInstance) timerInstance.stop();
    if (sessionUnsubscribe) sessionUnsubscribe();
  }

  return {
    destroy: () => cleanup()
  };
}
