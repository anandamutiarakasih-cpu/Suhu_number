/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 3 - Cryptarithm War View (Formula Puzzles & Calculations)
 * 6 Quantitative Heat Challenges with In-App Scratchpad & Keypad
 * Standardized Point System: 100 Base + 0-20 Speed Bonus per Puzzle
 */

import { CRYPTARITHM_DATA } from '../data/cryptarithm-data.js';
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
  loadStyle('css/game3.css?v=2.7');

  let currentIndex = 0;
  let inputValues = {};
  let activeInputId = null;
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

  // Realtime Session Listener (only force exit if teacher resets to LOBBY)
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
    // Count already correct
    Object.values(answered).forEach((a) => {
      if (a?.isCorrect) correctCount++;
    });

    for (let i = 0; i < CRYPTARITHM_DATA.length; i++) {
      if (!answered[CRYPTARITHM_DATA[i].id]) {
        currentIndex = i;
        break;
      }
      if (i === CRYPTARITHM_DATA.length - 1) {
        currentIndex = CRYPTARITHM_DATA.length; // All done
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
    inputValues = {};
    activeInputId = data.inputs[0]?.id || null;
    isChecking = false;

    renderPuzzleUI(data);
  }

  function renderPuzzleUI(data) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game3-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 3 • CRYPTARITHM WAR</span>
            <h2 class="tc-hud-title">TEKA-TEKI ANGKA KALOR (${currentIndex + 1}/${CRYPTARITHM_DATA.length})</h2>
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
          <span>Analisis parameter yang diketahui, hitung variabel kalor, dan temukan angka yang tepat!</span>
        </div>

        <!-- Puzzle Main Card -->
        <div class="tc-card tc-crypto-card">
          <div class="tc-crypto-top">
            <span class="tc-crypto-formula-pill">${data.formula}</span>
            <span class="tc-difficulty-badge ${currentIndex < 2 ? 'easy' : currentIndex < 4 ? 'medium' : 'extreme'}">${data.difficulty}</span>
          </div>

          <h3 class="tc-crypto-title">${data.title}</h3>
          <p class="tc-crypto-story">${data.story}</p>

          <!-- Givens Parameters Grid -->
          <div class="tc-givens-grid">
            ${data.givens.map((g) => `
              <div class="tc-given-chip">
                <span class="tc-given-lbl">${g.label}:</span>
                <span class="tc-given-val">${g.value}</span>
              </div>
            `).join('')}
          </div>

          <!-- Equation Display Box -->
          <div class="tc-equation-box">
            <div class="tc-equation-text">${data.puzzleDisplay}</div>

            <div class="tc-inputs-row">
              ${data.inputs.map((inp) => `
                <div class="tc-crypto-input-group">
                  <span class="tc-crypto-input-lbl">${inp.label}:</span>
                  <input 
                    type="text" 
                    class="tc-crypto-input-slot ${activeInputId === inp.id ? 'active-input' : ''}" 
                    id="input-${inp.id}" 
                    data-id="${inp.id}" 
                    readonly 
                    placeholder="${inp.placeholder || '?'}"
                    value="${inputValues[inp.id] || ''}">
                  <span class="tc-crypto-unit">${inp.unit}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- On-Screen Numeric Keypad -->
          <div class="tc-numpad-container">
            <div class="tc-numpad-grid">
              ${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => `
                <button type="button" class="tc-numpad-btn ${k === 'C' ? 'clear' : k === '⌫' ? 'backspace' : ''}" data-key="${k === '⌫' ? 'BACK' : k}">
                  ${k}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="tc-crypto-actions">
            <button id="btn-toggle-scratch" class="tc-btn tc-btn-secondary" type="button">
              <span>📝 Buka Kertas Cakar</span>
            </button>
            <button id="btn-check-crypto" class="tc-btn tc-btn-primary tc-btn-large" type="button">
              <span>🔒 KUNCI & PERIKSA JAWABAN</span>
              <span class="tc-btn-arrow">➔</span>
            </button>
          </div>
        </div>

        <!-- Floating Slide-up Scratchpad Drawer -->
        <div class="tc-scratchpad-drawer" id="scratchpad-drawer">
          <div class="tc-scratchpad-header">
            <div class="tc-scratch-title">
              <span>✏️</span>
              <span>Kertas Cakar Digital (Hitung Rumus Kalor)</span>
            </div>
            <div class="tc-scratch-actions">
              <button id="btn-scratch-undo" class="tc-btn-icon" type="button" title="Undo">↩</button>
              <button id="btn-scratch-clear" class="tc-btn-icon" type="button" title="Bersihkan">🗑️</button>
              <button id="btn-scratch-close" class="tc-btn-icon" type="button" title="Tutup">✕</button>
            </div>
          </div>
          <div class="tc-scratchpad-body">
            <canvas id="scratch-canvas"></canvas>
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
        toast.warning('Waktu teka-teki ini telah habis! Jawaban diperiksa otomatis.');
        evaluatePuzzle(data, true);
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

    // Attach Keypad & Scratchpad
    attachScratchpad();
    attachKeypadInteractions(data);
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

  function attachKeypadInteractions(data) {
    const keypad = container.querySelector('.tc-numpad-grid');
    const inputSlots = container.querySelectorAll('.tc-crypto-input-slot');
    const checkBtn = container.querySelector('#btn-check-crypto');

    // Click input slot to focus
    inputSlots.forEach((slot) => {
      slot.addEventListener('click', () => {
        audio.playClick();
        activeInputId = slot.dataset.id;
        inputSlots.forEach((s) => s.classList.remove('active-input'));
        slot.classList.add('active-input');
      });
    });

    // Keypad clicks
    keypad.addEventListener('click', (e) => {
      if (isChecking) return;
      const btn = e.target.closest('.tc-numpad-btn');
      if (!btn || !activeInputId) return;
      audio.playClick();

      const key = btn.dataset.key;
      let currentVal = inputValues[activeInputId] || '';

      if (key === 'C') {
        inputValues[activeInputId] = '';
      } else if (key === 'BACK') {
        inputValues[activeInputId] = currentVal.slice(0, -1);
      } else {
        const inpConfig = data.inputs.find((i) => i.id === activeInputId);
        const maxLen = inpConfig?.maxLength || 6;
        if (currentVal.length < maxLen) {
          inputValues[activeInputId] = currentVal + key;
        }
      }

      // Update input slot value
      const targetSlot = container.querySelector(`#input-${activeInputId}`);
      if (targetSlot) {
        targetSlot.value = inputValues[activeInputId];
      }
    });

    // Check Answers
    checkBtn.addEventListener('click', () => {
      if (isChecking) return;

      // Ensure all inputs filled
      for (const inp of data.inputs) {
        if (!inputValues[inp.id] || inputValues[inp.id].trim() === '') {
          toast.warning(`Silakan masukkan angka untuk "${inp.label}" terlebih dahulu.`);
          return;
        }
      }

      evaluatePuzzle(data, false);
    });
  }

  async function evaluatePuzzle(data, isTimeout = false) {
    if (isChecking) return;
    isChecking = true;

    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    // Disable buttons to lock inputs
    const allBtns = container.querySelectorAll('.tc-numpad-btn, #btn-check-crypto');
    allBtns.forEach((b) => { b.disabled = true; });

    let isAllCorrect = !isTimeout;
    if (!isTimeout) {
      for (const inp of data.inputs) {
        const userVal = (inputValues[inp.id] || '').trim();
        const expected = String(inp.expected).trim();
        if (userVal !== expected) {
          isAllCorrect = false;
        }
      }
    }

    try {
      const res = await firebaseService.submitQuestionAnswer(sessionCode, teamNumber, 'game3', data.id, {
        isCorrect: isAllCorrect,
        remainingSeconds: remaining,
        totalSeconds: PUZZLE_DURATION_SECONDS,
        answerData: { inputValues, isTimeout }
      });

      if (isAllCorrect) {
        audio.playCorrect();
        correctCount++;
        toast.success(`🎉 TEPAT! ${res.scoreResult.breakdownText}`);
      } else {
        audio.playWrong();
        toast.error('❌ Angka belum tepat. Simak langkah solusi rumus kalor berikut!');
      }

      setTimeout(() => {
        showSolutionModal(data, isAllCorrect, res.scoreResult);
      }, 700);
    } catch (err) {
      toast.error('Gagal mengirim skor: ' + err.message);
      showSolutionModal(data, isAllCorrect, { totalPoints: isAllCorrect ? 100 : 0 });
    }
  }

  function showSolutionModal(data, isCorrect, scoreResult) {
    const pointsBadge = isCorrect
      ? `<div style="background:rgba(34,197,94,0.15); border:1.5px solid #22c55e; color:#4ade80; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           🏆 +${scoreResult?.totalPoints || 100} POIN (100 Jawaban Benar ${scoreResult?.speedBonus ? `+ ${scoreResult.speedBonus} Bonus Kecepatan` : ''})
         </div>`
      : `<div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; color:#f87171; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           ❌ +0 POIN (Perhitungan Belum Tepat)
         </div>`;

    const content = `
      <div class="tc-modal-explanation">
        ${pointsBadge}

        <p style="font-size:1rem; color:var(--tc-sky); margin-bottom:0.85rem; font-weight:700;">
          Langkah Penyelesaian Rumus ${data.formula}:
        </p>
        <ol style="margin-left:1.25rem; display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.25rem;">
          ${data.solutionSteps.map((step) => `
            <li style="color:var(--tc-cream); line-height:1.5;">${step}</li>
          `).join('')}
        </ol>
        <div style="background:rgba(250,204,21,0.12); border:1px solid rgba(250,204,21,0.35); padding:0.75rem 1rem; border-radius:10px; color:var(--tc-yellow); font-size:0.9rem;">
          💡 <strong>Konsep IPA:</strong> ${data.keyConcept}
        </div>
      </div>
    `;

    showLabModal({
      title: `Solusi Perhitungan: ${data.title}`,
      contentHtml: content,
      confirmText: currentIndex < CRYPTARITHM_DATA.length - 1 ? 'Soal Berikutnya ➔' : 'Tuntaskan Babak 2 🏆',
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
              Kelompok ${teamNumber} berhasil memecahkan ${correctCount} dari ${CRYPTARITHM_DATA.length} teka-teki rumus kalor.
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
