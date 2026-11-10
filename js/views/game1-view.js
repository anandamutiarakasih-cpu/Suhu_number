/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 1 - Number Chains View (Rantai Peristiwa Kalor)
 * 5 Thermal Process Stages with Direct Number Assignment & Scientific Explanations
 */

import { NUMBER_CHAINS_DATA } from '../data/chains-data.js';
import { SyncTimer } from '../components/timer.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';

export function renderGame1View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange, onResetToHome, onNextGame }) {
  loadStyle('css/game1.css?v=2.5');
  let currentStageIndex = 0;
  let stageCards = [];
  let userOrder = {}; // cardIdx (0..4) -> step (1..5)
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let correctStagesCount = 0;
  let isChecking = false;
  let detachNet = null;
  let countdownTimer = null;

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

  loadStage(currentStageIndex);

  function loadStage(index) {
    if (index >= NUMBER_CHAINS_DATA.length) {
      finishGame1();
      return;
    }

    const data = NUMBER_CHAINS_DATA[index];
    // Shuffle cards so order is mixed
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
              <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
              <button type="button" class="tc-btn-hud-reset" id="btn-hud-reset" title="Keluar & Reset ke Dashboard">
                🔄 Ke Dashboard
              </button>
            </div>
            <span class="tc-hud-score-tag">TARGET: 30 PTS</span>
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
            <span>💡 <strong>Petunjuk:</strong> ${data.hint}</span>
          </div>
        </div>

        <!-- Simple Guide Pill -->
        <div class="tc-chain-howto-pill">
          <span>🔢 <strong>Cara Bermain:</strong> Pada tiap kartu peristiwa, sentuh angka <strong>1, 2, 3, 4, atau 5</strong> pada <strong>Kolom Jawaban</strong> untuk menentukan urutan langkah terjadinya dari awal sampai akhir.</span>
        </div>

        <!-- Cards List (Direct Number Input - Lebar Menyesuaikan Android & iOS) -->
        <div class="tc-chain-list" id="chain-cards-container">
          ${stageCards.map((text, idx) => `
            <div class="tc-chain-card" id="chain-card-${idx}" data-idx="${idx}">
              <div class="tc-card-top-row">
                <div class="tc-event-tag">
                  <span class="tc-event-icon">📌</span>
                  <span>PERISTIWA ${String.fromCharCode(65 + idx)}</span>
                </div>
                <div class="tc-status-tag" id="status-tag-${idx}">
                  <span class="tc-badge-empty">⚪ BELUM DIURUTKAN</span>
                </div>
              </div>

              <div class="tc-card-desc">${text}</div>

              <!-- Dedicated Full-Width Kolom Jawaban -->
              <div class="tc-card-answer-box">
                <div class="tc-answer-header">
                  <div class="tc-answer-title-group">
                    <span class="tc-answer-label">🎯 KOLOM JAWABAN:</span>
                    <span class="tc-answer-hint">Pilih urutan langkah terjadinya peristiwa ini (1–5)</span>
                  </div>
                  <div class="tc-chosen-pill" id="chosen-pill-${idx}">
                    <span class="tc-chosen-prefix">Nomor Dipilih:</span>
                    <span class="tc-chosen-val empty" id="chosen-val-${idx}">Belum Ada</span>
                  </div>
                </div>

                <!-- 5-Number Grid Touch Buttons (Besar, Jelas, & Responsif) -->
                <div class="tc-btn-group-nums" data-card="${idx}">
                  ${[1, 2, 3, 4, 5].map((n) => `
                    <button type="button" class="tc-num-choice-btn" data-card="${idx}" data-val="${n}" aria-label="Jadikan urutan ke-${n}" title="Jadikan urutan ke-${n}">
                      <span class="tc-num-check">✓</span>
                      <span class="tc-num-digit">${n}</span>
                      <span class="tc-num-label">Ke-${n}</span>
                    </button>
                  `).join('')}
                </div>

                <!-- Status Feedback Footnote -->
                <div class="tc-answer-feedback" id="answer-feedback-${idx}">
                  <span class="tc-fb-icon">💡</span>
                  <span class="tc-fb-text" id="fb-text-${idx}">Sentuh salah satu nomor di atas untuk menetapkan urutan langkah.</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live Assembled Chain Preview Box -->
        <div class="tc-chain-preview-box">
          <div class="tc-preview-title">⛓️ ALUR RANGKAIAN SAINS YANG ANDA SUSUN:</div>
          <div class="tc-preview-steps" id="preview-steps-container">
            ${renderPreviewSteps()}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="tc-chain-actions">
          <button id="btn-check-chain" class="tc-btn tc-btn-primary tc-btn-large">
            <span>PERIKSA URUTAN RANTAI</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `;

    // Start Timer
    const timerBox = container.querySelector('#game1-timer-container');
    firebaseService.getSession(sessionCode).then((session) => {
      const startTime = session?.phaseStartTime || Date.now();
      const duration = session?.settings?.game1Duration || 180;

      if (timerInstance) timerInstance.stop();
      timerInstance = new SyncTimer({
        container: timerBox,
        durationSec: duration,
        startTimeMs: startTime,
        getServerTime: () => firebaseService.getServerTime(),
        onComplete: () => {
          toast.warning('Waktu Game 1 berakhir!');
          finishGame1();
        }
      });
    });

    // Delegated click handler on the list container for number button selection
    const listEl = container.querySelector('#chain-cards-container');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.tc-num-choice-btn');
        if (!btn || isChecking) return;
        const cardIdx = parseInt(btn.dataset.card, 10);
        const val = parseInt(btn.dataset.val, 10);
        handleNumberSelect(cardIdx, val);
      });
    }

    // Check Button Handler
    const checkBtn = container.querySelector('#btn-check-chain');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (isChecking) return;
        isChecking = true;
        checkCurrentStageOrder();
      });
    }

    // Attach Network Badge
    if (detachNet) detachNet();
    const netWrap = container.querySelector('#game-net-badge-wrap');
    if (netWrap) detachNet = networkService.attachBadge(netWrap);

    // Reset Button Handler
    const btnHudReset = container.querySelector('#btn-hud-reset');
    if (btnHudReset) {
      btnHudReset.addEventListener('click', handleResetClick);
    }
  }

  function handleNumberSelect(cardIdx, num) {
    audio.playClick();

    // Toggle: if clicking the currently selected number, deselect it
    if (userOrder[cardIdx] === num) {
      userOrder[cardIdx] = null;
    } else {
      // Auto-conflict resolution: if another card currently holds this number, clear or swap it
      const prevOwner = Object.keys(userOrder).find((k) => userOrder[k] === num && parseInt(k, 10) !== cardIdx);
      if (prevOwner !== undefined) {
        // Swap values between the two cards
        userOrder[prevOwner] = userOrder[cardIdx];
        updateCardUI(parseInt(prevOwner, 10));
      }
      userOrder[cardIdx] = num;
    }

    updateCardUI(cardIdx);
    updatePreviewUI();
  }

  function updateCardUI(idx) {
    const cardEl = container.querySelector(`#chain-card-${idx}`);
    if (!cardEl) return;

    // Reset evaluation styles when changing selections
    cardEl.classList.remove('correct', 'wrong');

    const val = userOrder[idx];
    const letter = String.fromCharCode(65 + idx);

    if (val !== null) {
      cardEl.classList.add('filled');
    } else {
      cardEl.classList.remove('filled');
    }

    // Update Number Choice Buttons
    const buttons = cardEl.querySelectorAll('.tc-num-choice-btn');
    buttons.forEach((btn) => {
      const bVal = parseInt(btn.dataset.val, 10);
      btn.classList.toggle('active', bVal === val);
    });

    // Update Chosen Number Display Pill (Menampilkan Angka Nomor yg Dipilih Siswa)
    const chosenValEl = cardEl.querySelector(`#chosen-val-${idx}`);
    if (chosenValEl) {
      if (val !== null) {
        chosenValEl.className = 'tc-chosen-val active';
        chosenValEl.innerHTML = `<strong class="tc-chosen-number">${val}</strong> <span class="tc-chosen-sub">(Langkah ke-${val})</span>`;
      } else {
        chosenValEl.className = 'tc-chosen-val empty';
        chosenValEl.innerHTML = `Belum Ada`;
      }
    }

    // Update Status Badge at Card Top
    const statusEl = cardEl.querySelector(`#status-tag-${idx}`);
    if (statusEl) {
      if (val !== null) {
        statusEl.innerHTML = `<span class="tc-badge-filled">✨ URUTAN KE-${val}</span>`;
      } else {
        statusEl.innerHTML = `<span class="tc-badge-empty">⚪ BELUM DIURUTKAN</span>`;
      }
    }

    // Update Footnote Feedback Text
    const fbTextEl = cardEl.querySelector(`#fb-text-${idx}`);
    if (fbTextEl) {
      if (val !== null) {
        fbTextEl.innerHTML = `✓ <strong>Peristiwa ${letter}</strong> dipilih sebagai <strong>Urutan Langkah ke-${val}</strong>. (Ketuk lagi untuk membatalkan)`;
      } else {
        fbTextEl.textContent = 'Sentuh salah satu nomor di atas untuk menetapkan urutan langkah.';
      }
    }
  }

  function updatePreviewUI() {
    const previewContainer = container.querySelector('#preview-steps-container');
    if (previewContainer) {
      previewContainer.innerHTML = renderPreviewSteps();
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

  function checkCurrentStageOrder() {
    const data = NUMBER_CHAINS_DATA[currentStageIndex];

    // 1. Check if all cards have an assigned number
    const emptyIdx = Object.keys(userOrder).find((k) => userOrder[k] === null);
    if (emptyIdx !== undefined) {
      audio.playWrong();
      toast.warning('Tentukan nomor urutan (1–5) untuk semua peristiwa terlebih dahulu!');
      const unassignedCard = container.querySelector(`#chain-card-${emptyIdx}`);
      if (unassignedCard) {
        unassignedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      isChecking = false;
      return;
    }

    // 2. Check if all numbers 1 to 5 are assigned
    const assignedVals = Object.values(userOrder);
    const hasAll = [1, 2, 3, 4, 5].every((n) => assignedVals.includes(n));
    if (!hasAll) {
      audio.playWrong();
      toast.warning('Pastikan semua angka urutan dari 1 sampai 5 terisi lengkap!');
      isChecking = false;
      return;
    }

    // 3. Evaluate correctness for each card
    let allCorrect = true;
    for (let i = 0; i < stageCards.length; i++) {
      const correctRank = data.correctOrder.indexOf(stageCards[i]) + 1;
      const userRank = userOrder[i];
      const cardEl = container.querySelector(`#chain-card-${i}`);
      const statusEl = container.querySelector(`#status-tag-${i}`);

      const fbTextEl = cardEl ? cardEl.querySelector(`#fb-text-${i}`) : null;
      if (userRank === correctRank) {
        if (cardEl) {
          cardEl.classList.add('correct');
          cardEl.classList.remove('wrong');
        }
        if (statusEl) {
          statusEl.innerHTML = `<span class="tc-eval-badge correct">✓ Tepat (Langkah ke-${userRank})</span>`;
        }
        if (fbTextEl) {
          fbTextEl.innerHTML = `🎉 <strong>Tepat Sempurna!</strong> Peristiwa ${String.fromCharCode(65 + i)} memang berada di <strong>Langkah ke-${userRank}</strong>.`;
        }
      } else {
        allCorrect = false;
        if (cardEl) {
          cardEl.classList.add('wrong');
          cardEl.classList.remove('correct');
        }
        if (statusEl) {
          statusEl.innerHTML = `<span class="tc-eval-badge wrong">✕ Posisi Belum Tepat</span>`;
        }
        if (fbTextEl) {
          fbTextEl.innerHTML = `⚠️ Urutan ke-${userRank} belum sesuai alur ilmiah. Silakan ganti ke nomor langkah yang tepat!`;
        }
      }
    }

    if (allCorrect) {
      audio.playCorrect();
      correctStagesCount++;
      toast.success(`🎉 Rantai Tahap ${currentStageIndex + 1} TEPAT SEMPURNA! (+5 Poin)`);

      setTimeout(() => {
        showScientificExplanationModal(data);
      }, 700);
    } else {
      audio.playWrong();
      toast.error('Urutan peristiwa belum tepat. Amati kembali hubungan sebab-akibat proses kalor!');
      isChecking = false;
    }
  }

  function showScientificExplanationModal(data) {
    const content = `
      <div class="tc-modal-explanation">
        <p class="tc-exp-summary" style="font-size:1.05rem; color:var(--tc-sky); margin-bottom:1rem; font-weight:600;">
          ${data.explanation.summary}
        </p>
        <h4 style="font-size:0.9rem; color:#94a3b8; text-transform:uppercase; margin-bottom:0.5rem;">Poin Kunci Konsep Kalor:</h4>
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
          ${data.explanation.keyPoints.map((p) => `
            <li style="background:rgba(255,255,255,0.05); padding:0.6rem 0.85rem; border-radius:8px; border-left:3px solid var(--tc-orange);">
              ${p}
            </li>
          `).join('')}
        </ul>
        <div style="background:rgba(250,204,21,0.12); border:1px solid rgba(250,204,21,0.35); padding:0.75rem 1rem; border-radius:10px; color:var(--tc-yellow); font-size:0.9rem;">
          🌟 <strong>Fakta Sains:</strong> ${data.explanation.didYouKnow}
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
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:1.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
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
