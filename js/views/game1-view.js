/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Game 1 - Number Chains View (Rantai Peristiwa Kalor)
 * 5 Thermal Process Stages with Interactive Ordering & Scientific Explanations
 */

import { NUMBER_CHAINS_DATA } from '../data/chains-data.js';
import { SyncTimer } from '../components/timer.js';
import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';

export function renderGame1View(container, { sessionCode, teamNumber, onGameCompleted, onPhaseChange }) {
  let currentStageIndex = 0;
  let stageCards = [];
  let timerInstance = null;
  let sessionUnsubscribe = null;
  let correctStagesCount = 0;
  let isChecking = false;

  // Listen for phase change from Teacher
  sessionUnsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;
    if (session.currentPhase && session.currentPhase !== 'GAME1') {
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
    // Shuffle cards initially
    stageCards = [...data.correctOrder].sort(() => Math.random() - 0.5);

    renderStageUI(data);
  }

  function renderStageUI(data) {
    container.innerHTML = `
      <div class="tc-view tc-game-view tc-game1-view">
        <!-- Top Game HUD -->
        <div class="tc-game-hud">
          <div class="tc-hud-badge">
            <span class="tc-badge-lab">GAME 1 • NUMBER CHAINS</span>
            <h2 class="tc-hud-title">RANTAI PERISTIWA KALOR (${currentStageIndex + 1}/5)</h2>
          </div>

          <div class="tc-hud-center">
            <div id="game1-timer-container"></div>
          </div>

          <div class="tc-hud-team">
            <span class="tc-hud-team-tag">KELOMPOK ${teamNumber}</span>
            <span class="tc-hud-score-tag">TARGET: 30 PTS</span>
          </div>
        </div>

        <!-- Banner Instruction -->
        <div class="tc-banner-instruction pulse">
          <span class="tc-fire-icon">🔥</span>
          <span>Susun peristiwa di bawah ini menjadi urutan proses yang runtut dan benar secara sains!</span>
        </div>

        <!-- Stage Header & Story -->
        <div class="tc-chain-stage-header">
          <h3 class="tc-chain-title">${data.title}</h3>
          <p class="tc-chain-story">${data.story}</p>
          <div class="tc-chain-hint-box">
            <span>💡 <strong>Petunjuk:</strong> ${data.hint}</span>
          </div>
        </div>

        <!-- Draggable & Button-controlled Cards List -->
        <div class="tc-chain-list" id="chain-cards-container">
          ${renderCardItems(stageCards)}
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

    attachCardInteractions();
  }

  function renderCardItems(cards) {
    return cards.map((text, idx) => `
      <div class="tc-chain-item" data-index="${idx}" draggable="true">
        <div class="tc-chain-num">${idx + 1}</div>
        <div class="tc-chain-text">${text}</div>
        <div class="tc-chain-controls">
          <button type="button" class="tc-btn-move btn-move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} title="Pindah Naik">▲</button>
          <button type="button" class="tc-btn-move btn-move-down" data-index="${idx}" ${idx === cards.length - 1 ? 'disabled' : ''} title="Pindah Turun">▼</button>
        </div>
      </div>
    `).join('');
  }

  function attachCardInteractions() {
    const listEl = container.querySelector('#chain-cards-container');
    const checkBtn = container.querySelector('#btn-check-chain');

    // Move Up / Move Down buttons for mobile ease of use
    listEl.addEventListener('click', (e) => {
      const upBtn = e.target.closest('.btn-move-up');
      const downBtn = e.target.closest('.btn-move-down');

      if (upBtn && !upBtn.disabled) {
        audio.playClick();
        const idx = parseInt(upBtn.dataset.index, 10);
        if (idx > 0) {
          const temp = stageCards[idx];
          stageCards[idx] = stageCards[idx - 1];
          stageCards[idx - 1] = temp;
          refreshCards();
        }
      } else if (downBtn && !downBtn.disabled) {
        audio.playClick();
        const idx = parseInt(downBtn.dataset.index, 10);
        if (idx < stageCards.length - 1) {
          const temp = stageCards[idx];
          stageCards[idx] = stageCards[idx + 1];
          stageCards[idx + 1] = temp;
          refreshCards();
        }
      }
    });

    // Drag and drop for desktop
    let draggedIndex = null;
    listEl.querySelectorAll('.tc-chain-item').forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        draggedIndex = parseInt(item.dataset.index, 10);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const dropIndex = parseInt(item.dataset.index, 10);
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
          audio.playClick();
          const movedItem = stageCards.splice(draggedIndex, 1)[0];
          stageCards.splice(dropIndex, 0, movedItem);
          refreshCards();
        }
      });
    });

    // Check chain order
    checkBtn.addEventListener('click', () => {
      if (isChecking) return;
      isChecking = true;
      checkCurrentStageOrder();
    });
  }

  function refreshCards() {
    const listEl = container.querySelector('#chain-cards-container');
    if (!listEl) return;
    listEl.innerHTML = renderCardItems(stageCards);
    attachCardInteractions();
  }

  function checkCurrentStageOrder() {
    const data = NUMBER_CHAINS_DATA[currentStageIndex];
    let isCorrect = true;

    const items = container.querySelectorAll('.tc-chain-item');
    for (let i = 0; i < stageCards.length; i++) {
      if (stageCards[i] === data.correctOrder[i]) {
        items[i].classList.add('correct');
        items[i].classList.remove('wrong');
      } else {
        isCorrect = false;
        items[i].classList.add('wrong');
        items[i].classList.remove('correct');
      }
    }

    if (isCorrect) {
      audio.playCorrect();
      correctStagesCount++;
      toast.success(`🎉 Rantai Tahap ${currentStageIndex + 1} TEPAT SEMPURNA! (+5 Poin)`);

      setTimeout(() => {
        showScientificExplanationModal(data);
      }, 700);
    } else {
      audio.playWrong();
      toast.error('Urutan rantai belum tepat. Diskusikan kembali bersama kelompok!');
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
    cleanup();
    toast.info('Menyimpan skor Game 1 ke database...');
    try {
      const res = await firebaseService.submitGame1Score(sessionCode, teamNumber, correctStagesCount, NUMBER_CHAINS_DATA.length);
      audio.playFanfare();

      container.innerHTML = `
        <div class="tc-view tc-game-complete-card">
          <div class="tc-card" style="text-align:center; max-width:580px; margin:3rem auto; padding:3rem 2rem;">
            <div style="font-size:4rem; margin-bottom:1rem;">🏆</div>
            <div class="tc-badge-lab">GAME 1 SELESAI</div>
            <h2 style="font-size:2rem; margin:0.5rem 0;">Number Chains Berhasil Dituntaskan!</h2>
            <p style="color:#94a3b8; margin-bottom:1.5rem;">
              Kelompok ${teamNumber} berhasil menyelesaikan ${correctStagesCount} dari ${NUMBER_CHAINS_DATA.length} rantai proses kalor.
            </p>
            <div style="font-size:2.5rem; font-weight:800; color:var(--tc-orange); margin-bottom:1.5rem; font-family:var(--font-mono);">
              +${res.score} POIN
            </div>
            <p style="font-size:0.9rem; color:var(--tc-sky);">
              Menunggu guru membuka babak Game 2: Start Champ...
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
