/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Final Championship Leaderboard View (Olympic Podium, 8 Teams Table & Mobile Card List)
 * Connected Realtime with Firebase RTDB, Multi-Criteria Sorting & Rank Animations
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { particleService } from '../services/particle-service.js';
import { getPredicate } from '../data/predicates.js';
import { exportSessionToCSV } from '../services/export-service.js';
import { networkService } from '../services/network-service.js';
import { loadStyle } from '../utils/asset-loader.js';

export function renderLeaderboardView(container, { sessionCode, teamNumber, isAdmin = false, onHome, onPhaseChange }) {
  loadStyle('css/leaderboard.css?v=3.3');
  const effectiveSessionCode = sessionCode || (typeof localStorage !== 'undefined' ? (localStorage.getItem('tc_active_admin_session') || firebaseService.getStoredTeamSession()?.sessionCode) : null);
  let sessionUnsubscribe = null;
  let currentSession = null;
  let detachNet = null;
  let previousRanks = new Map(); // teamNumber -> rank
  let expandedTeamCards = new Set(); // tracks which cards are expanded in mobile view

  container.innerHTML = `
    <div class="tc-view tc-leaderboard-view">
      <!-- Header Banner -->
      <header class="tc-lb-header">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <div id="lb-net-badge-wrap"></div>
          <div class="tc-session-tag">SESI KELAS: <strong>${effectiveSessionCode || '-'}</strong></div>
        </div>

        <div class="tc-live-indicator-pill">
          <span class="tc-pulse-dot" style="background:#4ade80;"></span>
          <span>REALTIME DATABASE TERHUBUNG</span>
        </div>

        <h1 class="tc-lb-title">
          JUARA GAME <span class="tc-text-gradient">KALOR</span>
        </h1>
        <p style="color:#94a3b8; font-size:0.95rem; margin-top:0.25rem;">
          Peringkat Kompetisi Sains 8 Kelompok • Diperbarui Secara Otomatis
        </p>
      </header>

      <!-- Olympic Style Podium for Top 3 (Desktop & Mobile) -->
      <div class="tc-podium-container" id="podium-container">
        <!-- Rendered dynamically -->
      </div>

      <!-- Action & Export Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
        <h3 class="tc-table-title">
          <span>🏆</span>
          <span>Rekapitulasi Skor & Peringkat Kelompok</span>
        </h3>
        <button id="btn-lb-export-csv" class="tc-btn tc-btn-sm tc-btn-secondary" type="button">
          📥 Unduh Rekap (CSV)
        </button>
      </div>

      <!-- Desktop View: Complete 8 Teams Ranking Table -->
      <div class="tc-card tc-lb-desktop-card">
        <div class="tc-table-responsive">
          <table class="tc-lb-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>KELOMPOK</th>
                <th>NUMBER CHAINS</th>
                <th>START CHAMP</th>
                <th>CRYPTARITHM WAR</th>
                <th>TOTAL POIN</th>
                <th>BENAR</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody id="lb-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile View: Modern Card List (No Horizontal Overflow) -->
      <div class="tc-lb-mobile-card-list" id="lb-mobile-card-list">
        <!-- Dynamically populated -->
      </div>

      <!-- Predicate Reference Legend -->
      <div class="tc-predicate-legend-card" style="margin-top:2rem;">
        <h4 class="tc-legend-title">TINGKAT PREDIKAT KELULUSAN KALOR</h4>
        <div class="tc-legend-grid">
          <div class="tc-legend-item champion">
            <span class="tc-leg-badge">🏆</span>
            <div>
              <strong>Thermo Champion</strong>
              <small>Master Kalor (≥ 86%)</small>
            </div>
          </div>
          <div class="tc-legend-item expert">
            <span class="tc-leg-badge">⚡</span>
            <div>
              <strong>Thermo Expert</strong>
              <small>Pemahaman Sangat Baik (76–85%)</small>
            </div>
          </div>
          <div class="tc-legend-item challenger">
            <span class="tc-leg-badge">🔬</span>
            <div>
              <strong>Science Challenger</strong>
              <small>Kompetensi Solid (66–75%)</small>
            </div>
          </div>
          <div class="tc-legend-item explorer">
            <span class="tc-leg-badge">🧭</span>
            <div>
              <strong>Thermo Explorer</strong>
              <small>Konsep Dasar (56–65%)</small>
            </div>
          </div>
          <div class="tc-legend-item rookie">
            <span class="tc-leg-badge">🧪</span>
            <div>
              <strong>Temperature Rookie</strong>
              <small>Perdalam Rumus (&lt; 56%)</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="tc-lb-footer" style="text-align:center; margin-top:2.5rem; margin-bottom:2rem;">
        <button id="btn-lb-home" class="tc-btn tc-btn-primary tc-btn-large" type="button">
          <span>${isAdmin ? 'KEMBALI KE DASHBOARD GURU' : 'KEMBALI KE DASHBOARD'}</span>
          <span>🏠</span>
        </button>
      </div>
    </div>
  `;

  // Audio Fanfare & Particle celebration burst
  audio.playFanfare();
  setTimeout(() => {
    particleService.burst(window.innerWidth / 2, window.innerHeight / 3, 60);
  }, 400);

  const podiumEl = container.querySelector('#podium-container');
  const tableBody = container.querySelector('#lb-table-body');
  const mobileListEl = container.querySelector('#lb-mobile-card-list');
  const btnExport = container.querySelector('#btn-lb-export-csv');
  const btnHome = container.querySelector('#btn-lb-home');

  // Attach Network Latency Monitor
  const netWrap = container.querySelector('#lb-net-badge-wrap');
  if (netWrap) {
    detachNet = networkService.attachBadge(netWrap);
  }

  btnExport.addEventListener('click', () => {
    audio.playClick();
    if (currentSession) {
      exportSessionToCSV(effectiveSessionCode, currentSession);
    }
  });

  btnHome.addEventListener('click', () => {
    audio.playClick();
    cleanup();
    if (onHome) onHome();
  });

  // Mobile Card List Toggle Handler (Event Delegation)
  if (mobileListEl) {
    mobileListEl.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.tc-card-detail-toggle-btn');
      if (!toggleBtn) return;
      audio.playClick();
      const tNum = parseInt(toggleBtn.dataset.teamNum, 10);
      const drawer = mobileListEl.querySelector(`#drawer-team-${tNum}`);
      if (!drawer) return;

      if (expandedTeamCards.has(tNum)) {
        expandedTeamCards.delete(tNum);
        drawer.classList.remove('open');
        toggleBtn.innerHTML = `<span>Rincian Nilai 3 Game</span><span>▼</span>`;
      } else {
        expandedTeamCards.add(tNum);
        drawer.classList.add('open');
        toggleBtn.innerHTML = `<span>Sembunyikan Rincian</span><span>▲</span>`;
      }
    });
  }

  // Realtime Leaderboard Listener
  sessionUnsubscribe = firebaseService.listenToLeaderboard(effectiveSessionCode, (sortedTeams, session) => {
    if (!session) return;
    currentSession = session;

    // Check if teacher reset to LOBBY (only redirect student views, allow admin to stay)
    if (session.currentPhase && session.currentPhase === 'LOBBY' && !isAdmin) {
      audio.playPhaseTransition();
      cleanup();
      if (onPhaseChange) onPhaseChange('LOBBY', session);
      return;
    }

    if (!sortedTeams || sortedTeams.length === 0) {
      podiumEl.innerHTML = `
        <div class="tc-lb-empty-box">
          <div class="tc-lb-empty-icon">⏳</div>
          <p>Belum ada perolehan skor dalam sesi ini. Permainan baru dimulai!</p>
        </div>
      `;
      tableBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center; padding:2rem; color:#94a3b8;">Menunggu perolehan poin dari para peserta...</td></tr>
      `;
      mobileListEl.innerHTML = `
        <div class="tc-lb-empty-box">
          <div class="tc-lb-empty-icon">⏳</div>
          <p>Belum ada perolehan skor dalam sesi ini. Permainan baru dimulai!</p>
        </div>
      `;
      return;
    }

    // Determine rank changes
    const newRanks = new Map();
    sortedTeams.forEach((t, idx) => {
      newRanks.set(t.teamNumber, idx + 1);
    });

    // Render Podium Top 3 (2nd, 1st, 3rd)
    const first = sortedTeams[0] || null;
    const second = sortedTeams[1] || null;
    const third = sortedTeams[2] || null;

    podiumEl.innerHTML = `
      <!-- 2nd Place -->
      <div class="tc-podium-spot second">
        <div class="tc-podium-team">
          <div class="tc-podium-medal">🥈</div>
          <div class="tc-podium-name">${second ? (second.groupName || `Kelompok ${second.teamNumber}`) : '-'}</div>
          <div class="tc-podium-score">${second ? Number(second.totalScore || 0).toLocaleString('id-ID') : 0} PTS</div>
          <div class="tc-podium-predicate">${second ? getPredicate(second.totalScore).title : '-'}</div>
        </div>
        <div class="tc-podium-pedestal p2">
          <span>2</span>
        </div>
      </div>

      <!-- 1st Place (Champion) -->
      <div class="tc-podium-spot first">
        <div class="tc-podium-team">
          <div class="tc-podium-crown">👑</div>
          <div class="tc-podium-medal gold">🏆</div>
          <div class="tc-podium-name">${first ? (first.groupName || `Kelompok ${first.teamNumber}`) : '-'}</div>
          <div class="tc-podium-score gold">${first ? Number(first.totalScore || 0).toLocaleString('id-ID') : 0} PTS</div>
          <div class="tc-podium-predicate">${first ? getPredicate(first.totalScore).title : '-'}</div>
        </div>
        <div class="tc-podium-pedestal p1">
          <span>1</span>
        </div>
      </div>

      <!-- 3rd Place -->
      <div class="tc-podium-spot third">
        <div class="tc-podium-team">
          <div class="tc-podium-medal">🥉</div>
          <div class="tc-podium-name">${third ? (third.groupName || `Kelompok ${third.teamNumber}`) : '-'}</div>
          <div class="tc-podium-score">${third ? Number(third.totalScore || 0).toLocaleString('id-ID') : 0} PTS</div>
          <div class="tc-podium-predicate">${third ? getPredicate(third.totalScore).title : '-'}</div>
        </div>
        <div class="tc-podium-pedestal p3">
          <span>3</span>
        </div>
      </div>
    `;

    // Render Desktop Table Rows
    tableBody.innerHTML = sortedTeams.map((t, idx) => {
      const currentRank = idx + 1;
      const prevRank = previousRanks.get(t.teamNumber);
      let rankShiftBadge = '';
      if (prevRank !== undefined) {
        if (prevRank > currentRank) {
          rankShiftBadge = `<span class="tc-rank-shift-pill up">▲ +${prevRank - currentRank}</span>`;
        } else if (prevRank < currentRank) {
          rankShiftBadge = `<span class="tc-rank-shift-pill down">▼ -${currentRank - prevRank}</span>`;
        }
      }

      const isMyTeam = teamNumber && t.teamNumber === parseInt(teamNumber, 10);
      const statusClass = t.status === 'FINISHED' ? 'finished' : t.status === 'PLAYING' ? 'playing' : 'lobby';
      const statusLabel = t.status === 'FINISHED' ? 'TUNTAS 🏁' : t.status === 'PLAYING' ? 'BERMAIN ⚡' : 'LOBI';

      return `
        <tr class="${isMyTeam ? 'highlight-my-team' : ''}">
          <td class="tc-col-rank">
            <span class="tc-rank-badge ${idx < 3 ? `rank-${idx + 1}` : ''}">
              ${idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
            </span>
            ${rankShiftBadge}
          </td>
          <td class="tc-col-name">
            <strong>${t.groupName || `Kelompok ${t.teamNumber}`}</strong>
            <small>Kelompok ${t.teamNumber}${isMyTeam ? ' • 👤 KELOMPOK ANDA' : ''}</small>
          </td>
          <td class="tc-col-num">${t.numberChainsScore || 0}</td>
          <td class="tc-col-num">${t.startChampScore || 0}</td>
          <td class="tc-col-num">${t.cryptarithmWarScore || 0}</td>
          <td class="tc-col-total">${Number(t.totalScore || 0).toLocaleString('id-ID')}</td>
          <td class="tc-col-num" style="color:#4ade80;">${t.correctAnswers || 0} Benar</td>
          <td>
            <span class="tc-status-pill ${statusClass}">${statusLabel}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Render Mobile Cards List
    mobileListEl.innerHTML = sortedTeams.map((t, idx) => {
      const currentRank = idx + 1;
      const isTop3 = currentRank <= 3;
      const rankBadge = currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : `#${currentRank}`;
      const isMyTeam = teamNumber && t.teamNumber === parseInt(teamNumber, 10);
      const isExpanded = expandedTeamCards.has(t.teamNumber);
      const statusClass = t.status === 'FINISHED' ? 'finished' : t.status === 'PLAYING' ? 'playing' : 'lobby';
      const statusLabel = t.status === 'FINISHED' ? 'TUNTAS 🏁' : t.status === 'PLAYING' ? 'BERMAIN ⚡' : 'LOBI';

      return `
        <div class="tc-mobile-team-card ${isMyTeam ? 'highlight-my-team' : ''}" id="mobile-card-team-${t.teamNumber}">
          <div class="tc-card-main-row">
            <div class="tc-card-left-info">
              <div class="tc-card-rank-badge ${isTop3 ? `top-${currentRank}` : ''}">
                ${rankBadge}
              </div>
              <div class="tc-card-titles">
                <div class="tc-card-team-name">
                  <span>${t.groupName || `Kelompok ${t.teamNumber}`}</span>
                  ${isMyTeam ? '<span style="font-size:0.65rem; background:var(--tc-orange); color:#fff; padding:0.1rem 0.35rem; border-radius:4px; font-weight:800;">ANDA</span>' : ''}
                </div>
                <div class="tc-card-team-sub">
                  <span>Kel. ${t.teamNumber}</span>
                  <span>•</span>
                  <span style="color:#4ade80; font-weight:700;">${t.correctAnswers || 0} Benar</span>
                  <span>•</span>
                  <span class="tc-status-pill ${statusClass}" style="font-size:0.65rem; padding:0.15rem 0.45rem;">${statusLabel}</span>
                </div>
              </div>
            </div>

            <div class="tc-card-right-score">
              <div class="tc-card-total-val">${Number(t.totalScore || 0).toLocaleString('id-ID')}</div>
              <div class="tc-card-total-lbl">TOTAL POIN</div>
            </div>
          </div>

          <!-- Expandable Detail Trigger -->
          <button type="button" class="tc-card-detail-toggle-btn" data-team-num="${t.teamNumber}">
            <span>${isExpanded ? 'Sembunyikan Rincian' : 'Rincian Nilai 3 Game'}</span>
            <span>${isExpanded ? '▲' : '▼'}</span>
          </button>

          <!-- Drawer Breakdown -->
          <div class="tc-card-detail-drawer ${isExpanded ? 'open' : ''}" id="drawer-team-${t.teamNumber}">
            <div class="tc-card-breakdown-grid">
              <div class="tc-card-breakdown-item">
                <div class="tc-card-breakdown-lbl">G1: Chains</div>
                <div class="tc-card-breakdown-val">${t.numberChainsScore || 0}</div>
              </div>
              <div class="tc-card-breakdown-item">
                <div class="tc-card-breakdown-lbl">G2: Champ</div>
                <div class="tc-card-breakdown-val">${t.startChampScore || 0}</div>
              </div>
              <div class="tc-card-breakdown-item">
                <div class="tc-card-breakdown-lbl">G3: Crypto</div>
                <div class="tc-card-breakdown-val">${t.cryptarithmWarScore || 0}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Save previous ranks for transition indicator
    previousRanks = newRanks;
  });

  function cleanup() {
    if (sessionUnsubscribe) sessionUnsubscribe();
    if (detachNet) detachNet();
  }

  return {
    destroy: cleanup
  };
}
