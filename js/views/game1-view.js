/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 1 - Number Chains View (Rantai Peristiwa Kalor)
 * Redesigned: Direct Up/Down Reordering, Intuitive Tactile Controls, and Fair Partial Scoring
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
  loadStyle('css/game1.css?v=3.3');

  let currentStageIndex = 0;
  let currentSteps = []; // array of 5 step objects in current user order
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let correctStagesCount = 0;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;
  const STAGE_DURATION_SECONDS = 90;

  // Heartbeat active
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Realtime session phase listener
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase === 'LOBBY' || session.currentPhase === 'FINISHED') {
      cleanup();
      if (onPhaseChange) onPhaseChange(session.currentPhase, session);
    }
  });

  // Resume progress if page was refreshed
  firebaseService.getSession(sessionCode).then((session) => {
    const answered = session?.teams?.[`team_${teamNumber}`]?.answeredQuestions?.game1 || {};
    for (let i = 0; i < NUMBER_CHAINS_DATA.length; i++) {
      if (!answered[NUMBER_CHAINS_DATA[i].id]) {
        currentStageIndex = i;
        break;
      }
      if (answered[NUMBER_CHAINS_DATA[i].id]?.isCorrect) {
        correctStagesCount++;
      }
      if (i === NUMBER_CHAINS_DATA.length - 1) {
        currentStageIndex = NUMBER_CHAINS_DATA.length; // All done
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
    // Start with a randomized initial order of the 5 steps
    currentSteps = [...data.steps].sort(() => Math.random() - 0.5);
    isChecking = false;

    renderStageUI(data);
  }

  function renderStageUI(data) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game1-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 1 • NUMBER CHAINS</span>
            <h2 class="tc-hud-title">RANTAI PROSES KALOR (${currentStageIndex + 1}/${NUMBER_CHAINS_DATA.length})</h2>
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

        <!-- Stage Header & Story -->
        <div class="tc-chain-stage-header">
          <div class="tc-chain-badge-pill">${data.badge} • ${data.topic}</div>
          <h3 class="tc-chain-title">${data.title}</h3>
          <div class="tc-chain-story-box">
            ${data.story}
          </div>
          <div class="tc-chain-hint-pill">
            <span>💡</span>
            <span><strong>Petunjuk Guru:</strong> ${data.hint}</span>
          </div>
        </div>

        <!-- How To Instruction Bar -->
        <div class="tc-chain-instruction-bar">
          <span>💡 <strong>CARA MUDAH:</strong> Tekan tombol besar <strong>[▲] / [▼]</strong> ATAU <strong>ketuk kartu</strong> untuk langsung menukar posisi urutan!</span>
        </div>

        <!-- 5 Interactive Reorderable Cards -->
        <div class="tc-reorder-list" id="reorder-cards-list">
          ${renderCardsHTML()}
        </div>

        <!-- Bottom Action Bar -->
        <div class="tc-chain-bottom-bar">
          <button type="button" class="tc-btn tc-btn-secondary" id="btn-shuffle-chain">
            <span>🔀 Acak Ulang Posisi</span>
          </button>
          <button type="button" class="tc-btn tc-btn-primary tc-btn-large" id="btn-submit-chain">
            <span>🔒 KUNCI & PERIKSA URUTAN SAINS</span>
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

    // In-game Leaderboard button
    const btnInGameLB = container.querySelector('#btn-in-game-lb');
    if (btnInGameLB) {
      btnInGameLB.addEventListener('click', () => {
        showInGameLeaderboardModal(sessionCode, teamNumber);
      });
    }

    // Dashboard reset button
    const resetBtn = container.querySelector('#btn-hud-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', handleResetClick);
    }

    // Initialize Timer
    const timerBox = container.querySelector('#game1-timer-container');
    if (timerInstance) timerInstance.stop();

    timerInstance = new SyncTimer({
      durationSeconds: STAGE_DURATION_SECONDS,
      onTick: (rem) => {
        if (rem <= 10 && rem > 0) audio.playWarning();
      },
      onTimeUp: () => {
        toast.warning('Waktu tahap ini habis! Urutan saat ini otomatis dikunci & diperiksa.');
        evaluateSequence(true);
      }
    });
    timerInstance.mount(timerBox);
    timerInstance.start();

    // Attach Card Reordering Interactions
    attachReorderInteractions(data);
  }

  let selectedIdxForSwap = null;

  function renderCardsHTML() {
    return currentSteps.map((item, idx) => {
      const stepNum = idx + 1;
      const isFirst = idx === 0;
      const isLast = idx === currentSteps.length - 1;
      const isSelected = selectedIdxForSwap === idx;

      return `
        <div class="tc-card tc-reorder-card ${isSelected ? 'selected' : ''}" data-idx="${idx}" id="step-card-${idx}">
          <div class="tc-reorder-num-badge">
            <span class="tc-badge-step-digit">${stepNum}</span>
            <span class="tc-badge-step-lbl">${isFirst ? 'Awal' : isLast ? 'Akhir' : 'Langkah'}</span>
          </div>

          <div class="tc-reorder-content" title="Ketuk untuk menukar posisi">
            <div class="tc-reorder-heading">
              <span class="tc-reorder-icon">${item.icon}</span>
              <span>${item.title}</span>
            </div>
            <p class="tc-reorder-desc">${item.desc}</p>
            <span class="tc-reorder-swap-hint">${isSelected ? '⚡ Terpilih! Ketuk kartu lain untuk menukar.' : '👆 Ketuk kartu ini untuk menukar posisi'}</span>
          </div>

          <div class="tc-reorder-ctrls">
            <button type="button" class="tc-move-btn btn-move-up" data-idx="${idx}" ${isFirst ? 'disabled' : ''} title="Pindahkan langkah ke atas" aria-label="Naik">
              ▲
            </button>
            <button type="button" class="tc-move-btn btn-move-down" data-idx="${idx}" ${isLast ? 'disabled' : ''} title="Pindahkan langkah ke bawah" aria-label="Turun">
              ▼
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function moveCard(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    if (fromIdx < 0 || fromIdx >= currentSteps.length || toIdx < 0 || toIdx >= currentSteps.length) return;

    // 1. Swap elements in the currentSteps array
    const temp = currentSteps[fromIdx];
    currentSteps[fromIdx] = currentSteps[toIdx];
    currentSteps[toIdx] = temp;

    // 2. Clear active swap selection
    selectedIdxForSwap = null;

    // 3. Re-render the 5 cards cleanly
    refreshCardsUI();
  }

  function refreshCardsUI() {
    const listEl = container.querySelector('#reorder-cards-list');
    if (listEl) {
      listEl.innerHTML = renderCardsHTML();
    }
  }

  function attachReorderInteractions(data) {
    const listEl = container.querySelector('#reorder-cards-list');
    const submitBtn = container.querySelector('#btn-submit-chain');
    const shuffleBtn = container.querySelector('#btn-shuffle-chain');

    if (!listEl) return;

    // Delegated click listener on list container
    listEl.addEventListener('click', (e) => {
      if (isChecking) return;

      const upBtn = e.target.closest('.btn-move-up');
      const downBtn = e.target.closest('.btn-move-down');

      // 1. Click on Up Button
      if (upBtn) {
        e.stopPropagation();
        if (upBtn.disabled || upBtn.hasAttribute('disabled')) return;
        const idx = parseInt(upBtn.dataset.idx, 10);
        if (!isNaN(idx) && idx > 0) {
          audio.playClick();
          moveCard(idx, idx - 1);
        }
        return;
      }

      // 2. Click on Down Button
      if (downBtn) {
        e.stopPropagation();
        if (downBtn.disabled || downBtn.hasAttribute('disabled')) return;
        const idx = parseInt(downBtn.dataset.idx, 10);
        if (!isNaN(idx) && idx < currentSteps.length - 1) {
          audio.playClick();
          moveCard(idx, idx + 1);
        }
        return;
      }

      // If clicked inside the controls container, never trigger card selection
      if (e.target.closest('.tc-reorder-ctrls')) {
        return;
      }

      // 3. Click or tap anywhere on the Card (Tap-to-Swap)
      const card = e.target.closest('.tc-reorder-card');
      if (card) {
        const clickedIdx = parseInt(card.dataset.idx, 10);
        if (isNaN(clickedIdx)) return;

        audio.playClick();

        if (selectedIdxForSwap === null) {
          selectedIdxForSwap = clickedIdx;
          refreshCardsUI();
          toast.info(`Kartu #${clickedIdx + 1} dipilih. Sekarang ketuk kartu tujuan untuk menukar posisi.`);
        } else if (selectedIdxForSwap === clickedIdx) {
          // Deselect when clicking same card
          selectedIdxForSwap = null;
          refreshCardsUI();
        } else {
          // Swap selected card with clicked card
          const fromIdx = selectedIdxForSwap;
          const toIdx = clickedIdx;
          moveCard(fromIdx, toIdx);
          toast.success(`Berhasil menukar Langkah #${fromIdx + 1} dengan Langkah #${toIdx + 1}!`);
        }
      }
    });

    // Shuffle Button
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        if (isChecking) return;
        audio.playClick();
        selectedIdxForSwap = null;
        currentSteps.sort(() => Math.random() - 0.5);
        refreshCardsUI();
        toast.info('Urutan kartu diacak ulang.');
      });
    }

    // Submit & Lock Button
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (isChecking) return;
        audio.playClick();
        evaluateSequence(false);
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

  async function evaluateSequence(isTimeout = false) {
    if (isChecking) return;
    isChecking = true;

    const data = NUMBER_CHAINS_DATA[currentStageIndex];
    const remaining = timerInstance ? timerInstance.getRemainingSeconds() : 0;
    if (timerInstance) timerInstance.stop();

    // Lock all buttons
    const allBtns = container.querySelectorAll('.tc-move-btn, #btn-submit-chain, #btn-shuffle-chain');
    allBtns.forEach((b) => { b.disabled = true; });

    // Compare each position with data.steps
    // data.steps[i] represents what should be at position i (step: i + 1)
    let matchedCount = 0;
    const matchResults = currentSteps.map((item, idx) => {
      const correctItemAtThisPos = data.steps[idx];
      const isMatch = item.id === correctItemAtThisPos.id;
      if (isMatch) matchedCount++;
      return {
        userItem: item,
        correctItem: correctItemAtThisPos,
        isMatch,
        correctStep: item.step // where this userItem actually belongs
      };
    });

    const isAllCorrect = matchedCount === data.steps.length;

    // Calculate score: 20 points per correctly placed step (Max 100 base)
    const basePoints = matchedCount * 20;
    let speedBonus = 0;
    if (matchedCount >= 3 && remaining > 0) {
      speedBonus = Math.round((remaining / STAGE_DURATION_SECONDS) * 20 * (matchedCount / 5));
    }
    const totalPoints = basePoints + speedBonus;

    // Submit question answer to Firebase
    try {
      const res = await firebaseService.submitQuestionAnswer(sessionCode, teamNumber, 'game1', data.id, {
        isCorrect: isAllCorrect,
        remainingSeconds: remaining,
        totalSeconds: STAGE_DURATION_SECONDS,
        answerData: {
          userOrder: currentSteps.map((s) => s.id),
          matchedCount,
          totalPoints,
          isTimeout
        }
      });

      if (isAllCorrect) {
        audio.playSuccess();
        correctStagesCount++;
        toast.success(`🎉 SEMPURNA! Seluruh 5 rantai kalor tepat urutannya! (+${totalPoints} Poin)`);
      } else if (matchedCount >= 3) {
        audio.playSuccess();
        toast.success(`👍 BAGUS! ${matchedCount} dari 5 urutan rantai kalor tepat (+${totalPoints} Poin).`);
      } else {
        audio.playFailure();
        toast.info(`Urutan belum optimal (${matchedCount} dari 5 tepat). Simak pembahasan sains berikut! (+${totalPoints} Poin)`);
      }

      showScientificExplanationModal(data, matchedCount, totalPoints, speedBonus, matchResults);
    } catch (err) {
      toast.error('Kendala mengirim skor: ' + err.message);
      showScientificExplanationModal(data, matchedCount, totalPoints, speedBonus, matchResults);
    }
  }

  function showScientificExplanationModal(data, matchedCount, totalPoints, speedBonus, matchResults) {
    const pointsBadge = totalPoints > 0
      ? `<div style="background:rgba(34,197,94,0.15); border:1.5px solid #22c55e; color:#4ade80; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           🏆 +${totalPoints} POIN DIPEROLEH (${matchedCount}/5 Posisi Tepat ${speedBonus > 0 ? `+ ${speedBonus} Bonus Cepat` : ''})
         </div>`
      : `<div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; color:#f87171; padding:0.6rem 1rem; border-radius:10px; font-weight:800; font-family:var(--font-mono); margin-bottom:1rem; font-size:1.1rem; text-align:center;">
           ❌ +0 POIN (Seluruh Urutan Belum Tepat)
         </div>`;

    const content = `
      <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
        ${pointsBadge}

        <div style="background:rgba(56,189,248,0.1); border-left:3px solid var(--tc-sky); padding:0.85rem 1rem; border-radius:8px; margin-bottom:1.25rem;">
          <h4 style="color:var(--tc-sky); margin-bottom:0.5rem; font-size:0.92rem; font-weight:800;">
            URUTAN KRONOLOGIS ILMIAH YANG BENAR:
          </h4>
          <div style="display:flex; flex-direction:column; gap:0.45rem;">
            ${data.steps.map((s, idx) => `
              <div style="background:rgba(15,23,42,0.6); padding:0.45rem 0.75rem; border-radius:6px; font-size:0.88rem; display:flex; align-items:center; gap:0.5rem;">
                <span style="font-weight:800; color:var(--tc-yellow); font-family:var(--font-mono); min-width:26px;">#${idx + 1}</span>
                <span>${s.icon} <strong>${s.title}</strong> — ${s.desc}</span>
              </div>
            `).join('')}
          </div>
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
      title: `Hasil Evaluasi Sains: ${data.title}`,
      contentHtml: content,
      confirmText: currentStageIndex < NUMBER_CHAINS_DATA.length - 1 ? 'Lanjut ke Tantangan Berikutnya ➔' : 'Tuntaskan Game 1 🏆',
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
              Kelompok ${teamNumber} berhasil menyelesaikan 5 rantai proses kalor.
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
