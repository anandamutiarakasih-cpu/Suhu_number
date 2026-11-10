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
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';

export function renderGame2View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange, onResetToHome, onNextGame }) {
  loadStyle('css/game2.css?v=2.4');
  const ROUND_SIZE = 4;
  const TOTAL_ROUNDS = Math.ceil(START_CHAMP_DATA.length / ROUND_SIZE); // 3 rounds
  let currentRound = 0;
  let userSelections = {}; // itemId -> selectedOption
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let totalCorrectMatches = 0;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;

  // Ensure heartbeat is alive
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Realtime Session Listener (only force exit if teacher resets to LOBBY or forces FINISHED)
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase === 'LOBBY' || session.currentPhase === 'FINISHED') {
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
            <span class="tc-badge-lab">BABAK 1 • START CHAMP</span>
            <h2 class="tc-hud-title">COCOKKAN KONSEP KALOR (RONDE ${currentRound + 1}/${TOTAL_ROUNDS})</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game2-timer-container"></div>
          </div>

          <div class="tc-hud-team">
            <div class="tc-hud-team-actions">
              <div id="game-net-badge-wrap"></div>
              <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
              <button type="button" class="tc-btn-hud-reset" id="btn-hud-reset" title="Keluar & Reset ke Dashboard">
                🔄 Ke Dashboard
              </button>
            </div>
            <span class="tc-hud-score-tag">TARGET: 50 PTS</span>
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

    if (detachNet) detachNet();
    const netWrap = container.querySelector('#game-net-badge-wrap');
    if (netWrap) detachNet = networkService.attachBadge(netWrap);

    const btnHudReset = container.querySelector('#btn-hud-reset');
    if (btnHudReset) {
      btnHudReset.addEventListener('click', handleResetClick);
    }
  }

  function handleResetClick() {
    audio.playClick();
    showLabModal({
      title: 'PERINGATAN RESET KE DASHBOARD',
      contentHtml: `
        <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
          <p style="margin-bottom:0.75rem;">
            Apakah Anda yakin ingin keluar dari permainan dan kembali ke Dashboard awal?
          </p>
          <div style="background:rgba(239, 68, 68, 0.15); border-left:3px solid #ef4444; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#fca5a5; line-height:1.5;">
            ⚠️ <strong>Perhatian:</strong> Seluruh data sesi dan progres permainan Anda akan <strong>direset</strong> dan kembali ke <strong>Dashboard awal</strong>.
          </div>
        </div>
      `,
      confirmText: 'Ya, Reset & Ke Dashboard',
      cancelText: 'Batal (Tetap Bermain)',
      onConfirm: async () => {
        cleanup();
        if (onResetToHome) onResetToHome();
      }
    });
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
    // Calculate speed bonus based on remaining time fraction
    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    toast.info('Menyimpan skor Babak 1: Start Champ ke database...');
    try {
      const speedBonus = remaining > 15 ? 5 : Math.round((remaining / 180) * 5 * 10) / 10;
      const res = await firebaseService.submitGame2Score(sessionCode, teamNumber, totalCorrectMatches, START_CHAMP_DATA.length, speedBonus);
      audio.playFanfare();

      container.innerHTML = `
        <div class="tc-view tc-game-complete-card">
          <div class="tc-card" style="text-align:center; max-width:580px; margin:2.5rem auto; padding:2.5rem 1.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.5rem;">
              <div id="complete-net-badge-wrap"></div>
              <button type="button" class="tc-btn-hud-reset" id="btn-complete-reset" title="Keluar dari sesi permainan">
                🚪 Keluar Sesi
              </button>
            </div>
            <div style="font-size:3.5rem; margin-bottom:0.75rem;">⚡</div>
            <div class="tc-badge-lab">BABAK 1 SELESAI</div>
            <h2 style="font-size:1.85rem; margin:0.5rem 0;">Start Champ Berhasil Dituntaskan!</h2>
            <p style="color:#94a3b8; margin-bottom:1rem; font-size:0.95rem;">
              Kelompok ${teamNumber} berhasil mencocokkan ${totalCorrectMatches} dari ${START_CHAMP_DATA.length} peristiwa konsep kalor.
            </p>
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:1.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>

            <!-- Auto-progression action buttons -->
            <div style="margin-top:1.25rem; display:flex; flex-direction:column; gap:0.85rem; align-items:center;">
              <button type="button" class="tc-btn tc-btn-primary tc-btn-large" id="btn-next-to-game3" style="width:100%; max-width:380px; font-size:1.05rem; padding:1.1rem 1.5rem; box-shadow:0 0 25px rgba(249, 115, 22, 0.45);">
                <span>LANJUT KE BABAK 2: CRYPTARITHM WAR</span>
                <span class="tc-btn-arrow">➔</span>
              </button>
              <div style="font-size:0.9rem; color:#94a3b8;" id="countdown-game3-text">
                Otomatis lanjut dalam <strong id="countdown-sec" style="color:var(--tc-yellow); font-size:1.1rem;">4</strong> detik...
              </div>
              <button type="button" class="tc-btn tc-btn-ghost" id="btn-complete-exit-link" style="font-size:0.85rem; color:#94a3b8; margin-top:0.25rem;">
                ← Keluar dari Sesi Permainan
              </button>
            </div>
          </div>
        </div>
      `;

      if (detachNet) detachNet();
      const compWrap = container.querySelector('#complete-net-badge-wrap');
      if (compWrap) detachNet = networkService.attachBadge(compWrap);

      const btnCompReset = container.querySelector('#btn-complete-reset');
      if (btnCompReset) btnCompReset.addEventListener('click', handleResetClick);

      const btnExitLink = container.querySelector('#btn-complete-exit-link');
      if (btnExitLink) btnExitLink.addEventListener('click', handleResetClick);

      // Auto progression handler
      const proceedToGame3 = () => {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
        cleanup();
        if (onNextGame) {
          onNextGame();
        } else if (onPhaseChange) {
          onPhaseChange('GAME3');
        }
      };

      const btnNext = container.querySelector('#btn-next-to-game3');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          audio.playClick();
          proceedToGame3();
        });
      }

      let secondsLeft = 4;
      const countEl = container.querySelector('#countdown-sec');
      countdownTimer = setInterval(() => {
        secondsLeft--;
        if (countEl) countEl.textContent = secondsLeft;
        if (secondsLeft <= 0) {
          clearInterval(countdownTimer);
          countdownTimer = null;
          proceedToGame3();
        }
      }, 1000);

      if (onGameCompleted) onGameCompleted(res.score);
    } catch (err) {
      toast.error('Gagal mengirim skor: ' + err.message);
    }
  }

  function cleanup() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (timerInstance) timerInstance.stop();
    if (sessionUnsubscribe) sessionUnsubscribe();
    if (detachNet) detachNet();
  }

  return {
    destroy: () => cleanup()
  };
}
