/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 1 - Number Chains View (Rantai Peristiwa Kalor)
 * 5 Thermal Process Stages with Direct Number Assignment, Question-Level Locking & Realtime Scoring
 */

import { NUMBER_CHAINS_DATA } from '../data/chains-data.js';
import { SyncTimer } from '../components/timer.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';
import { showInGameLeaderboardModal } from '../components/in-game-leaderboard-modal.js';

export function renderGame1View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange, onResetToHome, onNextGame }) {
  loadStyle('css/game1.css?v=2.7');

  let currentStageIndex = 0;
  let stageCards = [];
  let userOrder = {}; // cardIdx (0..4) -> step (1..5)
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let correctStagesCount = 0;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;
  const STAGE_DURATION_SECONDS = 90;

  // Ensure heartbeat is alive
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Listen for phase change from Teacher (e.g. if teacher resets to LOBBY or forces FINISHED)
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase === 'LOBBY' || session.currentPhase === 'FINISHED') {
      cleanup();
      if (onPhaseChange) onPhaseChange(session.currentPhase, session);
    }
  });

  // Check existing session progress to resume where left off
  firebaseService.getSession(sessionCode).then((session) => {
    const answered = session?.teams?.[`team_${teamNumber}`]?.answeredQuestions?.game1 || {};
    // Find next unanswered stage
    for (let i = 0; i < NUMBER_CHAINS_DATA.length; i++) {
      if (!answered[NUMBER_CHAINS_DATA[i].id]) {
        currentStageIndex = i;
        break;
      }
      if (answered[NUMBER_CHAINS_DATA[i].id]?.isCorrect) {
        correctStagesCount++;
      }
      if (i === NUMBER_CHAINS_DATA.length - 1) {
        currentStageIndex = NUMBER_CHAINS_DATA.length; // all done
      }
    }
    loadStage(currentStageIndex);
  }).catch(() => {
    loadStage(0);
  });

  function loadStage(index) {
    if (index >= NUMBER_CHAINS_DATA.length) {
      finishGame1();
      return;
    }

    const data = NUMBER_CHAINS_DATA[index];
    // Shuffle cards so order is randomized
    stageCards = [...data.correctOrder].sort(() => Math.random() - 0.5);

    // Reset user order state for the 5 cards
    userOrder = { 0: null, 1: null, 2: null, 3: null, 4: null };
    isChecking = false;

    renderStageUI(data);
  }

  function renderPreviewSteps() {
    return [1, 2, 3, 4, 5].map((step) => {
      const foundCardIdx = Object.keys(userOrder).find((k) => userOrder[k] === step);
      const isFilled = foundCardIdx !== undefined && userOrder[foundCardIdx] !== null;
      const cardNum = isFilled ? parseInt(foundCardIdx, 10) : null;
      const letter = isFilled ? String.fromCharCode(65 + cardNum) : '';
      const text = isFilled ? stageCards[cardNum] : 'Belum ditentukan — sentuh angka di kartu peristiwa untuk mengisi langkah ini';

      return `
        <div class="tc-preview-step-row ${isFilled ? 'filled' : 'empty'}">
          <div class="tc-preview-step-badge">
            <span class="tc-preview-step-digit">${step}</span>
            <span class="tc-preview-step-lbl">Langkah</span>
          </div>
          <div class="tc-preview-step-content">
            ${isFilled ? `
              <div class="tc-preview-event-tag">📌 PERISTIWA ${letter}</div>
              <div class="tc-preview-text">${text}</div>
            ` : `
              <div class="tc-preview-empty-hint">⏳ ${text}</div>
            `}
          </div>
          <div class="tc-preview-status-icon">
            ${isFilled ? '<span class="tc-check-dot" title="Sudah terisi">✓</span>' : '<span class="tc-wait-dot" title="Menunggu pilihan">⋯</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderStageUI(data) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game1-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 1 • NUMBER CHAINS</span>
            <h2 class="tc-hud-title">RANTAI PERISTIWA KALOR (${currentStageIndex + 1}/${NUMBER_CHAINS_DATA.length})</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game1-timer-container"></div>
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
          <span class="tc-fire-icon">🔥</span>
          <span>Tentukan nomor urutan (1 sampai 5) untuk setiap peristiwa di bawah ini agar menjadi runtutan sains yang tepat!</span>
        </div>

        <!-- Stage Header & Story -->
        <div class="tc-chain-stage-header">
          <h3 class="tc-chain-title">${data.title}</h3>
          <p class="tc-chain-story">${data.story}</p>
          <div class="tc-chain-hint-box">
            <span>💡</span>
            <span><strong>Petunjuk Guru:</strong> ${data.hint}</span>
          </div>
        </div>

        <!-- How To Instruction Pill -->
        <div class="tc-chain-howto-pill">
          <span>👆 Sentuh angka <strong>1, 2, 3, 4, atau 5</strong> pada kotak setiap peristiwa untuk memasukkan urutan kronologisnya.</span>
        </div>

        <!-- 5 Event Cards with Direct Number Choice Grid -->
        <div class="tc-chain-list" id="chain-card-list">
          ${stageCards.map((text, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const currentChosen = userOrder[idx];
            return `
              <div class="tc-chain-card ${currentChosen ? 'filled' : ''}" id="chain-card-${idx}">
                <div class="tc-card-top-row">
                  <div class="tc-event-tag">
                    <span class="tc-event-icon">📌</span>
                    <span>PERISTIWA ${letter}</span>
                  </div>
                  <div class="tc-status-tag" id="status-tag-${idx}">
                    ${currentChosen ? `
                      <span class="tc-badge-filled">
                        <span>Langkah</span>
                        <strong>#${currentChosen}</strong>
                      </span>
                    ` : `
                      <span class="tc-badge-empty">Pilih nomor urutan</span>
                    `}
                  </div>
                </div>

                <p class="tc-card-desc">${text}</p>

                <!-- Responsive Tactile Number Assignment Box -->
                <div class="tc-card-answer-box ${currentChosen ? 'active-box' : ''}">
                  <div class="tc-answer-header">
                    <span class="tc-answer-title">
                      <span class="tc-step-icon">🔢</span>
                      <span>Tentukan Posisi Langkah:</span>
                    </span>
                    <span class="tc-chosen-pill" id="chosen-pill-${idx}">
                      <span>Pilihan:</span>
                      <strong>${currentChosen ? `Langkah ${currentChosen}` : 'Belum Dipilih'}</strong>
                    </span>
                  </div>

                  <div class="tc-btn-group-nums" data-card-idx="${idx}">
                    ${[1, 2, 3, 4, 5].map((num) => `
                      <button
                        type="button"
                        class="tc-num-choice-btn ${currentChosen === num ? 'active' : ''}"
                        data-step-num="${num}"
                        title="Jadikan Peristiwa ${letter} sebagai Langkah ${num}"
                      >
                        <span class="tc-num-digit">${num}</span>
                        <span class="tc-num-label">Langkah</span>
                        <span class="tc-num-check">✓</span>
                      </button>
                    `).join('')}
                  </div>

                  <div class="tc-answer-feedback">
                    <span class="tc-fb-icon">💡</span>
                    <span class="tc-fb-text" id="fb-text-${idx}">
                      ${currentChosen
                        ? `Peristiwa ${letter} ditugaskan pada <strong>Langkah ${currentChosen}</strong>.`
                        : `Klik salah satu tombol angka 1-5 di atas untuk menetapkan nomor urutan peristiwa ini.`}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Live Assembled Chain Sequence Preview Box -->
        <div class="tc-chain-preview-box">
          <div class="tc-preview-title">
            <span>📋</span>
            <span>RANGKAIAN URUTAN PROSES SAINS YANG TERBENTUK:</span>
          </div>
          <div class="tc-preview-steps" id="assembled-preview-steps">
            ${renderPreviewSteps()}
          </div>
        </div>

        <!-- Submit & Verification Button -->
        <div class="tc-chain-actions">
          <button type="button" class="tc-btn tc-btn-primary tc-btn-large" id="btn-submit-chain">
            <span>🔒 KUNCI & PERIKSA JAWABAN SAINS</span>
            <span class="tc-btn-arrow">➔</span>
          </button>
        </div>
      </div>
    `;

    // Attach Network Latency Monitor
    if (detachNet) detachNet();
    const netWrap = container.querySelector('#game-net-badge-wrap');
    if (netWrap) {
      detachNet = networkService.attachBadge(netWrap);
    }

    // In-game Leaderboard button handler
    const btnInGameLB = container.querySelector('#btn-in-game-lb');
    if (btnInGameLB) {
      btnInGameLB.addEventListener('click', () => {
        showInGameLeaderboardModal(sessionCode, teamNumber);
      });
    }

    // Dashboard reset handler
    const resetBtn = container.querySelector('#btn-hud-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', handleResetClick);
    }

    // Initialize Timer for this stage
    const timerBox = container.querySelector('#game1-timer-container');
    if (timerInstance) timerInstance.stop();

    timerInstance = new SyncTimer({
      durationSeconds: STAGE_DURATION_SECONDS,
      onTick: (rem) => {
        if (rem <= 10 && rem > 0) audio.playWarning();
      },
      onTimeUp: () => {
        toast.warning('Waktu tahap ini telah habis! Jawaban saat ini dikunci otomatis.');
        evaluateAnswer(true);
      }
    });
    timerInstance.mount(timerBox);
    timerInstance.start();

    // Attach Button Click Handlers for the 5-button step choice
    const numGroups = container.querySelectorAll('.tc-btn-group-nums');
    numGroups.forEach((group) => {
      const cardIdx = parseInt(group.dataset.cardIdx, 10);
      const letter = String.fromCharCode(65 + cardIdx);

      group.addEventListener('click', (e) => {
        if (isChecking) return;
        const btn = e.target.closest('.tc-num-choice-btn');
        if (!btn) return;

        audio.playClick();
        const chosenStep = parseInt(btn.dataset.stepNum, 10);

        // Check if another card already has this step assigned
        Object.keys(userOrder).forEach((k) => {
          if (parseInt(k, 10) !== cardIdx && userOrder[k] === chosenStep) {
            userOrder[k] = null;
            updateCardVisuals(parseInt(k, 10));
          }
        });

        // Toggle or set
        if (userOrder[cardIdx] === chosenStep) {
          userOrder[cardIdx] = null;
        } else {
          userOrder[cardIdx] = chosenStep;
        }

        updateCardVisuals(cardIdx);

        // Update Live Assembled Sequence Box
        const previewBox = container.querySelector('#assembled-preview-steps');
        if (previewBox) {
          previewBox.innerHTML = renderPreviewSteps();
        }
      });
    });

    // Submit Button Handler
    const submitBtn = container.querySelector('#btn-submit-chain');
    submitBtn.addEventListener('click', () => {
      if (isChecking) return;
      audio.playClick();

      // Validate all 5 cards have distinct steps 1..5
      const chosenValues = Object.values(userOrder).filter((v) => v !== null);
      if (chosenValues.length < 5) {
        toast.warning('Lengkapi urutan semua 5 peristiwa (Langkah 1 sampai 5) sebelum mengunci jawaban!');
        return;
      }

      evaluateAnswer(false);
    });
  }

  function updateCardVisuals(cardIdx) {
    const cardEl = container.querySelector(`#chain-card-${cardIdx}`);
    const statusTag = container.querySelector(`#status-tag-${cardIdx}`);
    const chosenPill = container.querySelector(`#chosen-pill-${cardIdx}`);
    const answerBox = cardEl ? cardEl.querySelector('.tc-card-answer-box') : null;
    const fbText = container.querySelector(`#fb-text-${cardIdx}`);
    const groupEl = container.querySelector(`.tc-btn-group-nums[data-card-idx="${cardIdx}"]`);
    const letter = String.fromCharCode(65 + cardIdx);
    const chosen = userOrder[cardIdx];

    if (!cardEl) return;

    if (chosen) {
      cardEl.classList.add('filled');
      if (answerBox) answerBox.classList.add('active-box');
      if (statusTag) {
        statusTag.innerHTML = `
          <span class="tc-badge-filled">
            <span>Langkah</span>
            <strong>#${chosen}</strong>
          </span>
        `;
      }
      if (chosenPill) {
        chosenPill.innerHTML = `<span>Pilihan:</span><strong>Langkah ${chosen}</strong>`;
      }
      if (fbText) {
        fbText.innerHTML = `Peristiwa ${letter} ditugaskan pada <strong>Langkah ${chosen}</strong>.`;
      }
    } else {
      cardEl.classList.remove('filled');
      if (answerBox) answerBox.classList.remove('active-box');
      if (statusTag) {
        statusTag.innerHTML = `<span class="tc-badge-empty">Pilih nomor urutan</span>`;
      }
      if (chosenPill) {
        chosenPill.innerHTML = `<span>Pilihan:</span><strong>Belum Dipilih</strong>`;
      }
      if (fbText) {
        fbText.innerHTML = `Klik salah satu tombol angka 1-5 di atas untuk menetapkan nomor urutan peristiwa ini.`;
      }
    }

    // Update active button state
    if (groupEl) {
      const btns = groupEl.querySelectorAll('.tc-num-choice-btn');
      btns.forEach((b) => {
        const stepNum = parseInt(b.dataset.stepNum, 10);
        if (stepNum === chosen) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  }

  function handleResetClick() {
    audio.playClick();
    showLabModal({
      title: 'KELUAR DARI GAME 1?',
      contentHtml: `
        <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
          <p style="margin-bottom:0.75rem;">Apakah Anda yakin ingin keluar dari sesi permainan Game 1?</p>
          <div style="background:rgba(239,68,68,0.15); border-left:3px solid #ef4444; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#fca5a5; line-height:1.5;">
            ⚠️ <strong>Perhatian:</strong> Skor yang sudah tersimpan tetap aman di database, namun Anda akan keluar dari room permainan.
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

  async function evaluateAnswer(isTimeout = false) {
    if (isChecking) return;
    isChecking = true;

    const data = NUMBER_CHAINS_DATA[currentStageIndex];
    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    // Check user order matching correctOrder
    const userOrderedText = [1, 2, 3, 4, 5].map((step) => {
      const cardIdx = Object.keys(userOrder).find((k) => userOrder[k] === step);
      return cardIdx !== undefined ? stageCards[cardIdx] : null;
    });

    const isCorrect = !isTimeout && userOrderedText.every((txt, idx) => txt === data.correctOrder[idx]);

    // Disable all choice buttons so locked answers cannot be modified
    const allBtns = container.querySelectorAll('.tc-num-choice-btn, #btn-submit-chain');
    allBtns.forEach((b) => { b.disabled = true; });

    // Submit question answer to Firebase (100 base + 0-20 speed bonus)
    try {
      const res = await firebaseService.submitQuestionAnswer(sessionCode, teamNumber, 'game1', data.id, {
        isCorrect,
        remainingSeconds: remaining,
        totalSeconds: STAGE_DURATION_SECONDS,
        answerData: { userOrder, isTimeout }
      });

      if (isCorrect) {
        audio.playSuccess();
        correctStagesCount++;
        toast.success(`🎉 TEPAT! ${res.scoreResult.breakdownText}`);
      } else {
        audio.playFailure();
        toast.error('❌ Urutan rantai kalor belum tepat. Simak pembahasan sains berikut!');
      }

      showScientificExplanationModal(data, isCorrect, res.scoreResult);
    } catch (err) {
      toast.error('Terjadi kendala saat mengirim skor: ' + err.message);
      showScientificExplanationModal(data, isCorrect, { totalPoints: isCorrect ? 100 : 0 });
    }
  }

  function showScientificExplanationModal(data, isCorrect, scoreResult) {
    const pointsBadge = isCorrect
      ? `<div style="background:rgba(34,197,94,0.15); border:1.5px solid #22c55e; color:#4ade80; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           🏆 +${scoreResult?.totalPoints || 100} POIN (100 Jawaban Benar ${scoreResult?.speedBonus ? `+ ${scoreResult.speedBonus} Bonus Kecepatan` : ''})
         </div>`
      : `<div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; color:#f87171; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           ❌ +0 POIN (Urutan Belum Tepat)
         </div>`;

    const content = `
      <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
        ${pointsBadge}

        <div style="background:rgba(56,189,248,0.1); border-left:3px solid var(--tc-sky); padding:0.85rem 1rem; border-radius:8px; margin-bottom:1.25rem;">
          <h4 style="color:var(--tc-sky); margin-bottom:0.35rem; font-size:0.92rem; font-weight:800;">
            URUTAN KRONOLOGIS ILMIAH YANG BENAR:
          </h4>
          <ol style="padding-left:1.2rem; margin:0; color:#e2e8f0; font-size:0.9rem;">
            ${data.correctOrder.map((step) => `<li style="margin-bottom:0.35rem;">${step}</li>`).join('')}
          </ol>
        </div>

        <div style="background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.08); padding:0.85rem 1rem; border-radius:8px; margin-bottom:1rem;">
          <h4 style="color:var(--tc-yellow); margin-bottom:0.35rem; font-size:0.92rem; font-weight:800;">
            PEMBAHASAN SAINS & PRINSIP KALOR:
          </h4>
          <p style="margin-bottom:0.5rem; color:#cbd5e1; font-size:0.88rem;">${data.explanation.summary}</p>
          <ul style="padding-left:1.1rem; margin:0; color:#cbd5e1; font-size:0.86rem;">
            ${data.explanation.keyPoints.map((pt) => `<li style="margin-bottom:0.25rem;">${pt}</li>`).join('')}
          </ul>
        </div>

        <div style="background:rgba(250,204,21,0.12); border:1px solid rgba(250,204,21,0.35); padding:0.75rem 1rem; border-radius:8px; color:var(--tc-yellow); font-size:0.88rem;">
          💡 <strong>Tahukah Kamu?</strong> ${data.explanation.didYouKnow}
        </div>
      </div>
    `;

    showLabModal({
      title: `Pembahasan Ilmiah: ${data.title}`,
      contentHtml: content,
      confirmText: currentStageIndex < NUMBER_CHAINS_DATA.length - 1 ? 'Lanjut ke Tahap Berikutnya ➔' : 'Tuntaskan Game 1 🏆',
      onConfirm: () => {
        isChecking = false;
        currentStageIndex++;
        loadStage(currentStageIndex);
      }
    });
  }

  async function finishGame1() {
    if (timerInstance) timerInstance.stop();
    toast.info('Menyimpan skor Game 1 ke database...');
    try {
      const res = await firebaseService.submitGame1Score(sessionCode, teamNumber, correctStagesCount, NUMBER_CHAINS_DATA.length);
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
            <div style="font-size:3.5rem; margin-bottom:0.75rem;">🏆</div>
            <div class="tc-badge-lab">GAME 1 SELESAI</div>
            <h2 style="font-size:1.85rem; margin:0.5rem 0;">Number Chains Berhasil Dituntaskan!</h2>
            <p style="color:#94a3b8; margin-bottom:1rem; font-size:0.95rem;">
              Kelompok ${teamNumber} berhasil menyelesaikan ${correctStagesCount} dari ${NUMBER_CHAINS_DATA.length} rantai proses kalor.
            </p>
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:0.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>
            <div style="font-size:1rem; color:#4ade80; font-weight:700; margin-bottom:1.5rem;">
              Akumulasi Skor Sesi: ${res.totalScore} PTS
            </div>

            <!-- Auto-progression action buttons -->
            <div style="margin-top:1.25rem; display:flex; flex-direction:column; gap:0.85rem; align-items:center;">
              <button type="button" class="tc-btn tc-btn-primary tc-btn-large" id="btn-next-to-game2" style="width:100%; max-width:380px; font-size:1.05rem; padding:1.1rem 1.5rem; box-shadow:0 0 25px rgba(249, 115, 22, 0.45);">
                <span>LANJUT KE GAME 2: START CHAMP</span>
                <span class="tc-btn-arrow">➔</span>
              </button>
              <div style="font-size:0.9rem; color:#94a3b8;" id="countdown-game2-text">
                Otomatis lanjut dalam <strong id="countdown-sec" style="color:var(--tc-yellow); font-size:1.1rem;">4</strong> detik...
              </div>
              <button type="button" class="tc-btn tc-btn-ghost" id="btn-complete-lb-btn" style="font-size:0.85rem; color:var(--tc-sky); margin-top:0.25rem;">
                📊 Buka Klasemen Sementara
              </button>
              <button type="button" class="tc-btn tc-btn-ghost" id="btn-complete-exit-link" style="font-size:0.85rem; color:#94a3b8;">
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

      const btnCompLB = container.querySelector('#btn-complete-lb-btn');
      if (btnCompLB) {
        btnCompLB.addEventListener('click', () => {
          showInGameLeaderboardModal(sessionCode, teamNumber);
        });
      }

      // Auto progression handler
      const proceedToGame2 = () => {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
        cleanup();
        if (onNextGame) {
          onNextGame();
        } else if (onPhaseChange) {
          onPhaseChange('GAME2');
        }
      };

      const btnNext = container.querySelector('#btn-next-to-game2');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          audio.playClick();
          proceedToGame2();
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
          proceedToGame2();
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
