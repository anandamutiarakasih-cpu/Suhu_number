/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 3 - Cryptarithm War View (Heat Formula Puzzles & Scratchpad)
 * 6 Academic Calculation Challenges with Keypad & Digital Whiteboard (Max 35 Pts)
 */

import { CRYPTARITHM_DATA } from '../data/cryptarithm-data.js';
import { SyncTimer } from '../components/timer.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';
import { Scratchpad } from '../components/scratchpad.js';
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';

export function renderGame3View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange, onResetToHome, onNextGame }) {
  loadStyle('css/game3.css?v=2.4');
  let currentIndex = 0;
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let correctCount = 0;
  let activeInputId = null;
  let inputValues = {}; // inputId -> string
  let scratchpadInstance = null;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;

  // Ensure heartbeat is alive
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Realtime Session Listener (only force exit if teacher resets to LOBBY)
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase === 'LOBBY') {
      cleanup();
      if (onPhaseChange) onPhaseChange('LOBBY', session);
    }
  });

  loadPuzzle(currentIndex);

  function loadPuzzle(index) {
    if (index >= CRYPTARITHM_DATA.length) {
      finishGame3();
      return;
    }

    const data = CRYPTARITHM_DATA[index];
    inputValues = {};
    activeInputId = data.inputs[0]?.id || null;

    renderPuzzleUI(data);
  }

  function renderPuzzleUI(data) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game3-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 3 • CRYPTARITHM WAR</span>
            <h2 class="tc-hud-title">TEKA-TEKI ANGKA KALOR (${currentIndex + 1}/6)</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game3-timer-container"></div>
          </div>

          <div class="tc-hud-team">
            <div class="tc-hud-team-actions">
              <div id="game-net-badge-wrap"></div>
              <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
              <button type="button" class="tc-btn-hud-reset" id="btn-hud-reset" title="Keluar & Reset ke Dashboard">
                🔄 Ke Dashboard
              </button>
            </div>
            <span class="tc-hud-score-tag">TARGET: 35 PTS</span>
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
                    value="${inputValues[inp.id] || ''}" 
                    placeholder="?" 
                    readonly 
                  />
                  <span class="tc-crypto-unit">${inp.unit}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- On-screen Numeric Keypad -->
          <div class="tc-numpad-wrap">
            <div class="tc-numpad-grid">
              <button type="button" class="tc-numpad-btn" data-key="1">1</button>
              <button type="button" class="tc-numpad-btn" data-key="2">2</button>
              <button type="button" class="tc-numpad-btn" data-key="3">3</button>
              <button type="button" class="tc-numpad-btn" data-key="4">4</button>
              <button type="button" class="tc-numpad-btn" data-key="5">5</button>
              <button type="button" class="tc-numpad-btn" data-key="6">6</button>
              <button type="button" class="tc-numpad-btn" data-key="7">7</button>
              <button type="button" class="tc-numpad-btn" data-key="8">8</button>
              <button type="button" class="tc-numpad-btn" data-key="9">9</button>
              <button type="button" class="tc-numpad-btn action-btn clear-btn" data-key="C">C</button>
              <button type="button" class="tc-numpad-btn" data-key="0">0</button>
              <button type="button" class="tc-numpad-btn action-btn" data-key="BACK">⌫</button>
            </div>
          </div>

          <!-- Submit Action -->
          <div style="text-align:center;">
            <button id="btn-check-crypto" class="tc-btn tc-btn-primary tc-btn-large">
              <span>PERIKSA JAWABAN</span>
              <span>✓</span>
            </button>
          </div>
        </div>

        <!-- Floating Kertas Cakar Button -->
        <button id="btn-toggle-scratch" class="tc-scratchpad-toggle" title="Buka Kertas Cakar Digital">
          <span>✏️</span>
          <span>Kertas Cakar</span>
        </button>

        <!-- Scratchpad Drawer Overlay -->
        <div id="scratchpad-drawer" class="tc-scratchpad-drawer">
          <div class="tc-scratch-header">
            <div style="font-weight:700; color:var(--tc-cream); display:flex; align-items:center; gap:0.5rem;">
              <span>✏️</span> <span>KERTAS CAKAR DIGITAL</span>
            </div>
            <div class="tc-scratch-tools">
              <button id="btn-scratch-clear" class="tc-btn tc-btn-sm tc-btn-ghost danger">Bersihkan</button>
              <button id="btn-scratch-undo" class="tc-btn tc-btn-sm tc-btn-secondary">Undo</button>
              <button id="btn-scratch-close" class="tc-btn tc-btn-sm tc-btn-outline">✕ Tutup</button>
            </div>
          </div>
          <canvas id="scratch-canvas" class="tc-scratch-canvas"></canvas>
        </div>
      </div>
    `;

    // Timer HUD
    const timerBox = container.querySelector('#game3-timer-container');
    firebaseService.getSession(sessionCode).then((session) => {
      const startTime = session?.phaseStartTime || Date.now();
      const duration = session?.settings?.game3Duration || 240;

      if (timerInstance) timerInstance.stop();
      timerInstance = new SyncTimer({
        container: timerBox,
        durationSec: duration,
        startTimeMs: startTime,
        getServerTime: () => firebaseService.getServerTime(),
        onComplete: () => {
          toast.warning('Waktu Game 3 berakhir!');
          finishGame3();
        }
      });
    });

    initScratchpadDrawer();
    attachKeypadInteractions(data);

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

  function initScratchpadDrawer() {
    const toggleBtn = container.querySelector('#btn-toggle-scratch');
    const drawer = container.querySelector('#scratchpad-drawer');
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
        const targetInput = data.inputs.find((i) => i.id === activeInputId);
        const maxLen = targetInput?.maxLength || 6;
        if (currentVal.length < maxLen) {
          inputValues[activeInputId] = currentVal + key;
        }
      }

      // Update input slot text
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

      isChecking = true;
      evaluatePuzzle(data);
    });
  }

  function evaluatePuzzle(data) {
    let isAllCorrect = true;

    for (const inp of data.inputs) {
      const userVal = (inputValues[inp.id] || '').trim();
      const expected = String(inp.expected).trim();
      if (userVal !== expected) {
        isAllCorrect = false;
      }
    }

    if (isAllCorrect) {
      audio.playCorrect();
      correctCount++;
      toast.success(`🎉 TEPAT! Teka-teki ${currentIndex + 1} berhasil dipecahkan!`);

      setTimeout(() => {
        showSolutionModal(data);
      }, 700);
    } else {
      audio.playWrong();
      toast.error('Angka belum tepat. Cek kembali perhitungan atau gunakan kertas cakar!');
      isChecking = false;
    }
  }

  function showSolutionModal(data) {
    const content = `
      <div class="tc-modal-explanation">
        <p style="font-size:1rem; color:var(--tc-sky); margin-bottom:1rem; font-weight:700;">
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
      confirmText: currentIndex < CRYPTARITHM_DATA.length - 1 ? 'Soal Berikutnya ➔' : 'Tuntaskan Game 3 🏆',
      onConfirm: () => {
        isChecking = false;
        currentIndex++;
        loadPuzzle(currentIndex);
      }
    });
  }

  async function finishGame3() {
    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    toast.info('Menyimpan skor Game 3 ke database...');
    try {
      const speedBonus = remaining > 20 ? 5 : Math.round((remaining / 240) * 5 * 10) / 10;
      const res = await firebaseService.submitGame3Score(sessionCode, teamNumber, correctCount, CRYPTARITHM_DATA.length, speedBonus);
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
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:0.75rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>
            <div style="font-size:1.15rem; color:var(--tc-yellow); font-weight:700; margin-bottom:1.5rem;">
              TOTAL AKHIR KELOMPOK: ${res.totalScore} POIN
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

      // Auto progression handler
      const proceedToLeaderboard = () => {
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
          proceedToLeaderboard();
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
          proceedToLeaderboard();
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
