/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 3 - Cryptarithm War View (Tantangan Hitung Rumus Kalor)
 * 6 Quantitative Heat Physics Challenges with In-App Scratchpad & Keypad
 * Standardized Point System: 100 Base + 0-20 Speed Bonus per Puzzle
 */

import { CRYPTARITHM_DATA, normalizeAnswer } from '../data/cryptarithm-data.js';
import { SyncTimer } from '../components/timer.js';
import { Scratchpad } from '../components/scratchpad.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';
import { showInGameLeaderboardModal } from '../components/in-game-leaderboard-modal.js';

export function renderGame3View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange, onResetToHome, onNextGame }) {
  loadStyle('css/game3.css?v=3.1');

  let currentIndex = 0;
  let userAnswer = '';
  let timerInstance = null;
  let scratchpadInstance = null;
  let sessionUnsubscribe = null;
  let correctCount = 0;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;
  const PUZZLE_DURATION_SECONDS = 90;

  // Ensure heartbeat is alive
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Realtime Session Listener (exit if teacher resets to LOBBY)
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase === 'LOBBY') {
      cleanup();
      if (onPhaseChange) onPhaseChange(session.currentPhase, session);
    }
  });

  // Resume progress if page was refreshed
  firebaseService.getSession(sessionCode).then((session) => {
    const answered = session?.teams?.[`team_${teamNumber}`]?.answeredQuestions?.game3 || {};
    Object.values(answered).forEach((a) => {
      if (a?.isCorrect) correctCount++;
    });

    for (let i = 0; i < CRYPTARITHM_DATA.length; i++) {
      if (!answered[CRYPTARITHM_DATA[i].id]) {
        currentIndex = i;
        break;
      }
      if (i === CRYPTARITHM_DATA.length - 1) {
        currentIndex = CRYPTARITHM_DATA.length;
      }
    }
    loadPuzzle(currentIndex);
  }).catch(() => {
    loadPuzzle(0);
  });

  function loadPuzzle(index) {
    if (index >= CRYPTARITHM_DATA.length) {
      finishGame3();
      return;
    }

    const data = CRYPTARITHM_DATA[index];
    userAnswer = '';
    isChecking = false;

    renderPuzzleUI(data);
  }

  function renderPuzzleUI(data) {
    const diffClass = currentIndex < 2 ? 'easy' : currentIndex < 4 ? 'medium' : 'extreme';

    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game3-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 3 • CRYPTARITHM WAR</span>
            <h2 class="tc-hud-title">HITUNG RUMUS KALOR (${currentIndex + 1}/${CRYPTARITHM_DATA.length})</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game3-timer-container"></div>
          </div>

          <div class="tc-hud-team">
            <div class="tc-hud-team-actions">
              <div id="game-net-badge-wrap"></div>
              <button type="button" class="tc-btn tc-btn-sm" id="btn-in-game-lb" style="background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.4); color:var(--tc-sky); font-weight:700; border-radius:8px; padding:0.35rem 0.65rem;" title="Lihat Klasemen Realtime">
                📊 Klasemen
              </button>
              <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
              <button type="button" class="tc-btn-hud-reset" id="btn-hud-reset" title="Keluar & Reset ke Dashboard">
                🔄 Ke Dashboard
              </button>
            </div>
            <span class="tc-hud-score-tag">100 PTS + BONUS (0-20)</span>
          </div>
        </div>

        <!-- Banner Instruction -->
        <div class="tc-banner-instruction pulse">
          <span class="tc-fire-icon">🧮</span>
          <span>Amati besaran yang diketahui, hitung menggunakan rumus kalor, dan masukkan angka hasil perhitungan!</span>
        </div>

        <!-- Puzzle Main Card -->
        <div class="tc-card tc-crypto-card">
          <div class="tc-crypto-top">
            <div class="tc-crypto-badges-left">
              <span class="tc-crypto-formula-pill">📐 ${data.formula}</span>
              <span class="tc-crypto-diff-pill ${diffClass}">${data.difficulty}</span>
            </div>
            <button type="button" class="tc-btn tc-btn-ghost tc-btn-sm" id="btn-toggle-formula-help" style="color:var(--tc-yellow); border:1px solid rgba(250,204,21,0.3); border-radius:var(--radius-full); font-size:0.82rem; padding:0.35rem 0.75rem;">
              💡 Bantuan Rumus
            </button>
          </div>

          <h3 class="tc-crypto-title">${data.title}</h3>
          <p class="tc-crypto-story">${data.story}</p>

          <!-- Formula Help Box (Collapsible) -->
          <div class="tc-formula-help-box" id="formula-help-box">
            <div class="tc-formula-help-text">
              💡 <strong>Rumus Bantu:</strong> ${data.formulaHelp}<br>
              <span style="font-size:0.82rem; color:#cbd5e1;">${data.hint}</span>
            </div>
          </div>

          <!-- Givens Parameters Section -->
          <div class="tc-givens-section">
            <div class="tc-givens-title">
              <span>📋</span>
              <span>Besaran Yang Diketahui:</span>
            </div>
            <div class="tc-givens-grid">
              ${data.givens.map((g) => `
                <div class="tc-given-chip">
                  <span class="tc-given-icon">${g.icon || '📌'}</span>
                  <div class="tc-given-details">
                    <span class="tc-given-lbl">${g.label}</span>
                    <span class="tc-given-val">${g.value}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Target Answer Slot Box -->
          <div class="tc-target-answer-box" id="target-answer-box">
            <div class="tc-target-prompt">${data.questionPrompt}</div>
            <div class="tc-target-input-row">
              <span class="tc-target-var-label">${data.targetVariable} =</span>
              <input 
                type="text" 
                inputmode="numeric" 
                class="tc-target-input-field" 
                id="target-answer-input" 
                placeholder="Jawaban..." 
                maxlength="10" 
                autocomplete="off"
                value="${userAnswer}"
              />
              <span class="tc-target-unit-label">${data.targetUnit}</span>
            </div>
          </div>

          <!-- On-Screen Numeric Keypad -->
          <div class="tc-keypad-wrap">
            <div class="tc-keypad-grid">
              ${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => `
                <button type="button" class="tc-numpad-btn ${k === 'C' ? 'clear-btn' : k === '⌫' ? 'action-btn' : ''}" data-key="${k === '⌫' ? 'BACK' : k}">
                  ${k}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="tc-crypto-action-bar">
            <button id="btn-toggle-scratch" class="tc-btn tc-btn-secondary" type="button">
              <span>📝 Kertas Cakar Digital</span>
            </button>
            <button id="btn-check-crypto" class="tc-btn tc-btn-primary tc-btn-large" type="button">
              <span>🔒 KUNCI & PERIKSA JAWABAN</span>
              <span class="tc-btn-arrow">➔</span>
            </button>
          </div>
        </div>

        <!-- Floating Slide-up Scratchpad Drawer -->
        <div class="tc-scratchpad-drawer" id="scratchpad-drawer">
          <div class="tc-scratch-header">
            <div class="tc-scratch-title">
              <span>✏️</span>
              <span>Kertas Cakar Digital (Hitung Rumus Kalor)</span>
            </div>
            <div class="tc-scratch-tools">
              <button id="btn-scratch-undo" class="tc-btn-icon" type="button" title="Urungkan Coretan">↩</button>
              <button id="btn-scratch-clear" class="tc-btn-icon" type="button" title="Bersihkan Kertas">🗑️</button>
              <button id="btn-scratch-close" class="tc-btn-icon" type="button" title="Tutup Kertas Cakar">✕</button>
            </div>
          </div>
          <div class="tc-scratch-body">
            <canvas class="tc-scratch-canvas" id="scratch-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    // Timer HUD
    const timerBox = container.querySelector('#game3-timer-container');
    if (timerInstance) timerInstance.stop();

    timerInstance = new SyncTimer({
      durationSeconds: PUZZLE_DURATION_SECONDS,
      onTick: (rem) => {
        if (rem <= 10 && rem > 0) audio.playWarning();
      },
      onTimeUp: () => {
        toast.warning('Waktu tantangan telah habis! Jawaban diperiksa otomatis.');
        evaluateAnswer(data, true);
      }
    });
    timerInstance.mount(timerBox);
    timerInstance.start();

    // Attach Network Latency Monitor
    if (detachNet) detachNet();
    const netWrap = container.querySelector('#game-net-badge-wrap');
    if (netWrap) detachNet = networkService.attachBadge(netWrap);

    const btnInGameLB = container.querySelector('#btn-in-game-lb');
    if (btnInGameLB) {
      btnInGameLB.addEventListener('click', () => {
        showInGameLeaderboardModal(sessionCode, teamNumber);
      });
    }

    const btnHudReset = container.querySelector('#btn-hud-reset');
    if (btnHudReset) {
      btnHudReset.addEventListener('click', handleResetClick);
    }

    // Attach Formula Help Toggle
    const helpBtn = container.querySelector('#btn-toggle-formula-help');
    const helpBox = container.querySelector('#formula-help-box');
    if (helpBtn && helpBox) {
      helpBtn.addEventListener('click', () => {
        audio.playClick();
        helpBox.classList.toggle('show');
        helpBtn.textContent = helpBox.classList.contains('show') ? '✕ Tutup Bantuan' : '💡 Bantuan Rumus';
      });
    }

    // Attach Scratchpad & Keypad Interactions
    attachScratchpad();
    attachInputAndKeypad(data);
  }

  function handleResetClick() {
    audio.playClick();
    showLabModal({
      title: 'KELUAR DARI GAME 3?',
      contentHtml: `
        <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
          <p style="margin-bottom:0.75rem;">
            Apakah Anda yakin ingin keluar dari sesi permainan Game 3?
          </p>
          <div style="background:rgba(239, 68, 68, 0.15); border-left:3px solid #ef4444; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#fca5a5; line-height:1.5;">
            ⚠️ <strong>Perhatian:</strong> Skor yang sudah terkumpul tetap aman di database, namun Anda akan keluar dari room permainan.
          </div>
        </div>
      `,
      confirmText: 'Ya, Keluar ke Dashboard',
      cancelText: 'Batal (Tetap Bermain)',
      onConfirm: async () => {
        cleanup();
        if (onResetToHome) onResetToHome();
      }
    });
  }

  function attachScratchpad() {
    const drawer = container.querySelector('#scratchpad-drawer');
    const toggleBtn = container.querySelector('#btn-toggle-scratch');
    const closeBtn = container.querySelector('#btn-scratch-close');
    const clearBtn = container.querySelector('#btn-scratch-clear');
    const undoBtn = container.querySelector('#btn-scratch-undo');
    const canvasEl = container.querySelector('#scratch-canvas');

    scratchpadInstance = new Scratchpad();
    scratchpadInstance.init(canvasEl);

    toggleBtn.addEventListener('click', () => {
      audio.playClick();
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) {
        setTimeout(() => scratchpadInstance.resize(), 120);
      }
    });

    closeBtn.addEventListener('click', () => {
      audio.playClick();
      drawer.classList.remove('open');
    });

    clearBtn.addEventListener('click', () => {
      audio.playClick();
      scratchpadInstance.clear();
      toast.info('Kertas cakar dibersihkan.');
    });

    undoBtn.addEventListener('click', () => {
      audio.playClick();
      scratchpadInstance.undo();
    });
  }

  function attachInputAndKeypad(data) {
    const inputField = container.querySelector('#target-answer-input');
    const answerBox = container.querySelector('#target-answer-box');
    const keypad = container.querySelector('.tc-keypad-grid');
    const checkBtn = container.querySelector('#btn-check-crypto');

    if (inputField) {
      inputField.addEventListener('focus', () => {
        if (answerBox) answerBox.classList.add('focused');
      });
      inputField.addEventListener('blur', () => {
        if (answerBox) answerBox.classList.remove('focused');
      });
      inputField.addEventListener('input', (e) => {
        userAnswer = e.target.value;
      });
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkBtn.click();
        }
      });
    }

    // Keypad Clicks
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        if (isChecking) return;
        const btn = e.target.closest('.tc-numpad-btn');
        if (!btn) return;
        audio.playClick();

        const key = btn.dataset.key;
        if (key === 'C') {
          userAnswer = '';
        } else if (key === 'BACK') {
          userAnswer = userAnswer.slice(0, -1);
        } else {
          if (userAnswer.length < 10) {
            userAnswer += key;
          }
        }

        if (inputField) {
          inputField.value = userAnswer;
        }
      });
    }

    // Check Answer Button
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (isChecking) return;
        if (!userAnswer || userAnswer.trim() === '') {
          audio.playWarning();
          toast.warning('Silakan masukkan angka jawaban Anda terlebih dahulu.');
          if (inputField) inputField.focus();
          return;
        }
        audio.playClick();
        evaluateAnswer(data, false);
      });
    }
  }

  async function evaluateAnswer(data, isTimeout = false) {
    if (isChecking) return;
    isChecking = true;

    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    // Disable buttons
    const allBtns = container.querySelectorAll('.tc-numpad-btn, #btn-check-crypto, #target-answer-input');
    allBtns.forEach((b) => { b.disabled = true; });

    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedExpected = normalizeAnswer(data.expectedAnswer);
    const normalizedAccepted = (data.acceptedAnswers || []).map(normalizeAnswer);

    const isCorrect = !isTimeout && (
      normalizedUser === normalizedExpected ||
      normalizedAccepted.includes(normalizedUser)
    );

    try {
      const res = await firebaseService.submitQuestionAnswer(sessionCode, teamNumber, 'game3', data.id, {
        isCorrect,
        remainingSeconds: remaining,
        totalSeconds: PUZZLE_DURATION_SECONDS,
        answerData: { userAnswer, isCorrect, isTimeout }
      });

      if (isCorrect) {
        audio.playSuccess();
        correctCount++;
        toast.success(`🎉 TEPAT SEKALI! ${res.scoreResult.breakdownText}`);
      } else {
        audio.playFailure();
        toast.error('❌ Angka belum tepat. Simak pembahasan rumus kalor berikut!');
      }

      setTimeout(() => {
        showSolutionModal(data, isCorrect, res.scoreResult);
      }, 600);
    } catch (err) {
      toast.error('Gagal mengirim skor: ' + err.message);
      showSolutionModal(data, isCorrect, { totalPoints: isCorrect ? 100 : 0, speedBonus: 0 });
    }
  }

  function showSolutionModal(data, isCorrect, scoreResult) {
    const pointsBadge = isCorrect
      ? `<div style="background:rgba(34,197,94,0.15); border:1.5px solid #22c55e; color:#4ade80; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           🏆 +${scoreResult?.totalPoints || 100} POIN (100 Jawaban Benar ${scoreResult?.speedBonus ? `+ ${scoreResult.speedBonus} Bonus Kecepatan` : ''})
         </div>`
      : `<div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; color:#f87171; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           ❌ +0 POIN (Jawaban Kamu: ${userAnswer || '-'} | Kunci: ${data.expectedAnswer} ${data.targetUnit})
         </div>`;

    const content = `
      <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
        ${pointsBadge}

        <div style="background:rgba(56,189,248,0.1); border-left:3px solid var(--tc-sky); padding:0.85rem 1rem; border-radius:8px; margin-bottom:1rem;">
          <h4 style="color:var(--tc-sky); margin-bottom:0.5rem; font-size:0.92rem; font-weight:800;">
            LANGKAH PENYELESAIAN RUMUS (${data.formula}):
          </h4>
          <ol style="margin-left:1.25rem; display:flex; flex-direction:column; gap:0.45rem; padding:0; margin-bottom:0;">
            ${data.solutionSteps.map((step) => `
              <li style="color:#e2e8f0; font-size:0.88rem; line-height:1.5;">${step}</li>
            `).join('')}
          </ol>
        </div>

        <div style="background:rgba(250,204,21,0.12); border:1px solid rgba(250,204,21,0.35); padding:0.75rem 1rem; border-radius:8px; color:var(--tc-yellow); font-size:0.88rem;">
          💡 <strong>Konsep IPA Kalor:</strong> ${data.keyConcept}
        </div>
      </div>
    `;

    showLabModal({
      title: `Solusi Perhitungan: ${data.title}`,
      contentHtml: content,
      confirmText: currentIndex < CRYPTARITHM_DATA.length - 1 ? 'Soal Berikutnya ➔' : 'Tuntaskan Babak 3 🏆',
      onConfirm: () => {
        isChecking = false;
        currentIndex++;
        loadPuzzle(currentIndex);
      }
    });
  }

  async function finishGame3() {
    if (timerInstance) timerInstance.stop();

    toast.info('Menyimpan skor Game 3 ke database...');
    try {
      const res = await firebaseService.submitGame3Score(sessionCode, teamNumber, correctCount, CRYPTARITHM_DATA.length);
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
            <div style="font-size:3.5rem; margin-bottom:0.75rem;">🎉</div>
            <div class="tc-badge-lab">SELURUH BABAK PERMAINAN TUNTAS</div>
            <h2 style="font-size:1.85rem; margin:0.5rem 0;">Cryptarithm War Berhasil Diselesaikan!</h2>
            <p style="color:#94a3b8; margin-bottom:1rem; font-size:0.95rem;">
              Kelompok ${teamNumber} berhasil memecahkan ${correctCount} dari ${CRYPTARITHM_DATA.length} tantangan rumus kalor.
            </p>
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:0.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>
            <div style="font-size:1.25rem; color:var(--tc-yellow); font-weight:800; margin-bottom:1.5rem; font-family:var(--font-mono);">
              TOTAL AKHIR KOMPETISI: ${res.totalScore} POIN
            </div>

            <!-- Auto-progression action buttons -->
            <div style="margin-top:1.25rem; display:flex; flex-direction:column; gap:0.85rem; align-items:center;">
              <button type="button" class="tc-btn tc-btn-primary tc-btn-large" id="btn-next-to-lb" style="width:100%; max-width:380px; font-size:1.05rem; padding:1.1rem 1.5rem; box-shadow:0 0 25px rgba(249, 115, 22, 0.45);">
                <span>LIHAT KLASEMEN AKHIR (LEADERBOARD) 🏆</span>
              </button>
              <div style="font-size:0.9rem; color:#94a3b8;" id="countdown-lb-text">
                Membuka Klasemen Akhir dalam <strong id="countdown-sec" style="color:var(--tc-yellow); font-size:1.1rem;">4</strong> detik...
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

      // Auto progression handler to Leaderboard
      const proceedToLB = () => {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
        cleanup();
        if (onNextGame) {
          onNextGame();
        } else if (onPhaseChange) {
          onPhaseChange('FINISHED');
        }
      };

      const btnNext = container.querySelector('#btn-next-to-lb');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          audio.playClick();
          proceedToLB();
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
          proceedToLB();
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
    if (scratchpadInstance) scratchpadInstance.destroy();
  }

  return {
    destroy: () => cleanup()
  };
}
