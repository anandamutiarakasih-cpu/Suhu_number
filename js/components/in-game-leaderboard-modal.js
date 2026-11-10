/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * In-Game Live Leaderboard Modal
 * Allows students to check live standings anytime during gameplay without leaving
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';

export function showInGameLeaderboardModal(sessionCode, myTeamNumber) {
  audio.playClick();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'tc-modal-overlay active';
  modalOverlay.style.zIndex = '9999';

  modalOverlay.innerHTML = `
    <div class="tc-modal-box tc-lb-modal" style="max-width: 720px; width: 95%; max-height: 88vh; display: flex; flex-direction: column;">
      <div class="tc-modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 0.75rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span style="font-size: 1.5rem;">📊</span>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--tc-cream); margin: 0;">KLASEMEN SEMENTARA</h3>
            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #4ade80;">
              <span class="tc-pulse-dot" style="width: 7px; height: 7px;"></span>
              <span>LIVE SINKRONISASI FIREBASE</span>
            </div>
          </div>
        </div>
        <button type="button" class="tc-modal-close-btn" id="btn-close-lb-modal" style="background: rgba(255,255,255,0.08); border: none; color: #cbd5e1; font-size: 1.2rem; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          ✕
        </button>
      </div>

      <div class="tc-modal-body" style="overflow-y: auto; flex-grow: 1; padding-right: 0.25rem;">
        <div id="in-game-lb-content">
          <div style="text-align: center; padding: 2rem; color: #94a3b8;">
            <div class="tc-radar-spinner" style="margin: 0 auto 0.75rem auto;"></div>
            <span>Memuat klasemen realtime...</span>
          </div>
        </div>
      </div>

      <div class="tc-modal-footer" style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.8rem; color: #94a3b8;">💡 Skor otomatis bertambah setelah setiap jawaban dikunci.</span>
        <button type="button" class="tc-btn tc-btn-primary" id="btn-done-lb-modal" style="padding: 0.65rem 1.25rem; font-size: 0.9rem;">
          <span>Tutup & Lanjut Main ➔</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const contentEl = modalOverlay.querySelector('#in-game-lb-content');
  const closeBtn = modalOverlay.querySelector('#btn-close-lb-modal');
  const doneBtn = modalOverlay.querySelector('#btn-done-lb-modal');

  let unsub = null;

  function closeModal() {
    audio.playClick();
    if (unsub) {
      unsub();
      unsub = null;
    }
    if (modalOverlay.parentNode) {
      modalOverlay.parentNode.removeChild(modalOverlay);
    }
  }

  closeBtn.addEventListener('click', closeModal);
  doneBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  unsub = firebaseService.listenToLeaderboard(sessionCode, (teamsList) => {
    if (!contentEl) return;

    if (!teamsList || teamsList.length === 0) {
      contentEl.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:#94a3b8;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
          <p>Belum ada kelompok yang mencatatkan skor.</p>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        ${teamsList.map((t, idx) => {
          const isMyTeam = myTeamNumber && t.teamNumber === parseInt(myTeamNumber, 10);
          const rank = idx + 1;
          const rankBadge = rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`;
          const isTop3 = rank <= 3;

          return `
            <div style="
              background: ${isMyTeam ? 'rgba(249, 115, 22, 0.15)' : 'rgba(30, 41, 59, 0.7)'};
              border: 1.5px solid ${isMyTeam ? 'var(--tc-orange)' : isTop3 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
              border-radius: 12px;
              padding: 0.75rem 0.9rem;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.65rem;
              box-shadow: ${isMyTeam ? '0 0 15px rgba(249, 115, 22, 0.25)' : 'none'};
            ">
              <div style="display:flex; align-items:center; gap:0.65rem; min-width:0; flex-grow:1;">
                <span style="
                  font-family: var(--font-mono);
                  font-weight: 800;
                  font-size: 0.92rem;
                  padding: 0.25rem 0.5rem;
                  border-radius: 6px;
                  background: ${rank === 1 ? 'rgba(250, 204, 21, 0.2)' : rank === 2 ? 'rgba(203, 213, 225, 0.2)' : rank === 3 ? 'rgba(217, 119, 6, 0.2)' : 'rgba(255,255,255,0.05)'};
                  color: ${rank === 1 ? '#facc15' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#fb923c' : '#94a3b8'};
                  flex-shrink: 0;
                ">${rankBadge}</span>

                <div style="min-width:0;">
                  <div style="font-weight:700; color:var(--tc-cream); font-size:0.92rem; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.groupName || `Kelompok ${t.teamNumber}`}</span>
                    ${isMyTeam ? '<span style="font-size:0.68rem; background:var(--tc-orange); color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-weight:800;">KELOMPOK ANDA</span>' : ''}
                  </div>
                  <div style="font-size:0.75rem; color:#94a3b8; display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:2px;">
                    <span>G1: <strong style="color:#bae6fd;">${t.numberChainsScore || 0}</strong></span>
                    <span>•</span>
                    <span>G2: <strong style="color:#bae6fd;">${t.startChampScore || 0}</strong></span>
                    <span>•</span>
                    <span>G3: <strong style="color:#bae6fd;">${t.cryptarithmWarScore || 0}</strong></span>
                    <span>•</span>
                    <span>Benar: <strong style="color:#4ade80;">${t.correctAnswers || 0}</strong></span>
                  </div>
                </div>
              </div>

              <div style="text-align:right; flex-shrink:0;">
                <div style="font-family:var(--font-mono); font-size:1.15rem; font-weight:800; color:${rank === 1 ? 'var(--tc-yellow)' : 'var(--tc-sky)'};">
                  ${(t.totalScore || 0).toLocaleString('id-ID')}
                </div>
                <div style="font-size:0.68rem; color:#94a3b8; font-weight:600;">POIN TOTAL</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  });
}
