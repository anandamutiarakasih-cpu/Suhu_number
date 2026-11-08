/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Teacher / Admin Mission Control View
 * Monitors 8 teams live, controls game phases, exports CSV, and provides quick simulations.
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { exportSessionToCSV } from '../services/export-service.js';

export function renderAdminView(container, { onExit }) {
  let activeSessionCode = null;
  let unsubscribe = null;
  let currentSessionData = null;

  container.innerHTML = `
    <div class="tc-view tc-admin-view">
      <div class="tc-top-bar">
        <button id="btn-admin-exit" class="tc-btn tc-btn-ghost">← Kembali ke Beranda</button>
        <div class="tc-badge-lab"><span class="tc-pulse-dot"></span> PUSAT KENDALI LAPTOP GURU</div>
      </div>

      <div class="tc-admin-cockpit" id="admin-cockpit-main">
        <!-- Dashboard Top Header -->
        <div class="tc-cockpit-header">
          <div>
            <div class="tc-badge-lab">KONTROL KELAS MULTIPLAYER</div>
            <h2 class="tc-cockpit-title">Pusat Kendali Sesi & Pemantauan 8 Kelompok</h2>
          </div>
          
          <div class="tc-cockpit-session-box" id="session-box-controls">
            <div class="tc-code-display">
              <span class="tc-code-lbl">KODE SESI SISWA:</span>
              <span class="tc-code-val" id="disp-session-code">MEMBUAT KODE...</span>
            </div>
            <div class="tc-code-btn-group">
              <button id="btn-copy-code" class="tc-btn tc-btn-sm tc-btn-outline" title="Salin Kode Sesi">📋 Salin</button>
              <button id="btn-copy-link" class="tc-btn tc-btn-sm tc-btn-secondary" title="Salin Link HP Siswa">🔗 Salin Link HP</button>
              <button id="btn-create-new-session" class="tc-btn tc-btn-sm tc-btn-primary" title="Buat Kode Sesi Baru">+ Sesi Baru</button>
            </div>
          </div>
        </div>

        <!-- Master Phase Controller Bar -->
        <div class="tc-card tc-phase-bar-card">
          <div class="tc-phase-bar-title">KENDALI FASE PERMAINAN (SERENTAK TERSINKRON KE SELURUH HP SISWA)</div>
          <div class="tc-phase-btn-row">
            <button class="tc-btn tc-btn-phase active" data-phase="LOBBY" id="phase-btn-lobby">
              <span class="tc-phase-num">0</span>
              <span>Lobi Persiapan</span>
            </button>
            <button class="tc-btn tc-btn-phase" data-phase="GAME1" id="phase-btn-g1">
              <span class="tc-phase-num">1</span>
              <span>Game 1: Number Chains</span>
            </button>
            <button class="tc-btn tc-btn-phase" data-phase="GAME2" id="phase-btn-g2">
              <span class="tc-phase-num">2</span>
              <span>Game 2: Start Champ</span>
            </button>
            <button class="tc-btn tc-btn-phase" data-phase="GAME3" id="phase-btn-g3">
              <span class="tc-phase-num">3</span>
              <span>Game 3: Cryptarithm War</span>
            </button>
            <button class="tc-btn tc-btn-phase gold" data-phase="FINISHED" id="phase-btn-finish">
              <span class="tc-phase-num">🏆</span>
              <span>Buka Leaderboard</span>
            </button>
          </div>
        </div>

        <!-- Quick Tools Bar -->
        <div class="tc-admin-tools-row">
          <button id="btn-export-csv" class="tc-btn tc-btn-secondary">
            <span>📥 Unduh Rekap Hasil (CSV)</span>
          </button>
          <button id="btn-simulate-teams" class="tc-btn tc-btn-outline" title="Isi otomatis 8 kelompok contoh untuk simulasi cepat">
            <span>⚡ Simulasi 8 Kelompok Uji</span>
          </button>
          <button id="btn-reset-session" class="tc-btn tc-btn-ghost danger">
            <span>🔄 Reset Nilai Sesi</span>
          </button>
        </div>

        <!-- Live Teams Monitoring Grid (8 Teams) -->
        <div class="tc-admin-monitor-section">
          <div class="tc-monitor-header-row">
            <h3 class="tc-monitor-title">Live Scoreboard 8 Kelompok</h3>
            <span class="tc-live-indicator"><span class="tc-pulse-dot"></span> PEMBARUAN OTOMATIS REALTIME</span>
          </div>

          <div class="tc-admin-teams-grid" id="admin-teams-grid">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `
              <div class="tc-card tc-admin-team-card" id="admin-team-card-${n}">
                <div class="tc-atc-top">
                  <div class="tc-atc-num">KELOMPOK ${n}</div>
                  <div class="tc-atc-status-wrap" style="display: flex; align-items: center; gap: 0.4rem;">
                    <span class="tc-atc-badge offline" id="atc-badge-${n}">Belum Masuk</span>
                    <button type="button" class="tc-btn-reset-slot hidden" id="atc-reset-${n}" data-team="${n}" title="Keluarkan & kosongkan slot Kelompok ${n}">
                      ✕ Reset
                    </button>
                  </div>
                </div>
                <h4 class="tc-atc-name" id="atc-name-${n}">-</h4>
                <div class="tc-atc-members" id="atc-members-${n}">-</div>

                <div class="tc-atc-scores">
                  <div class="tc-score-col">
                    <span class="tc-sc-lbl">G1 (30)</span>
                    <strong class="tc-sc-val" id="atc-g1-${n}">0</strong>
                  </div>
                  <div class="tc-score-col">
                    <span class="tc-sc-lbl">G2 (35)</span>
                    <strong class="tc-sc-val" id="atc-g2-${n}">0</strong>
                  </div>
                  <div class="tc-score-col">
                    <span class="tc-sc-lbl">G3 (35)</span>
                    <strong class="tc-sc-val" id="atc-g3-${n}">0</strong>
                  </div>
                  <div class="tc-score-col total">
                    <span class="tc-sc-lbl">TOTAL (100)</span>
                    <strong class="tc-sc-val" id="atc-total-${n}">0</strong>
                  </div>
                </div>

                <div class="tc-atc-footer">
                  <span class="tc-atc-predicate" id="atc-pred-${n}">Temperature Rookie</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const btnExit = container.querySelector('#btn-admin-exit');
  btnExit.addEventListener('click', () => {
    audio.playClick();
    if (unsubscribe) unsubscribe();
    if (onExit) onExit();
  });

  const btnCreateSession = container.querySelector('#btn-create-new-session');
  const btnCopyCode = container.querySelector('#btn-copy-code');
  const btnCopyLink = container.querySelector('#btn-copy-link');
  const btnExportCSV = container.querySelector('#btn-export-csv');
  const btnSimulate = container.querySelector('#btn-simulate-teams');
  const btnReset = container.querySelector('#btn-reset-session');
  const dispCode = container.querySelector('#disp-session-code');

  // Create Session Function
  async function createSessionNow() {
    audio.playClick();
    btnCreateSession.disabled = true;
    btnCreateSession.textContent = 'Membuat...';
    try {
      const session = await firebaseService.createSession();
      activeSessionCode = session.code;
      dispCode.textContent = activeSessionCode;
      localStorage.setItem('tc_active_admin_session', activeSessionCode);
      toast.success(`Kode Sesi ${activeSessionCode} berhasil dibuat & aktif!`);
      attachSessionListener(activeSessionCode);
    } catch (err) {
      console.warn('createSession fallback:', err);
      // Instant guaranteed fallback
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let code = 'TC';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      activeSessionCode = code;
      dispCode.textContent = activeSessionCode;
      localStorage.setItem('tc_active_admin_session', activeSessionCode);
      toast.success(`Kode Sesi ${activeSessionCode} aktif!`);
      attachSessionListener(activeSessionCode);
    } finally {
      btnCreateSession.disabled = false;
      btnCreateSession.textContent = '+ Sesi Baru';
    }
  }

  btnCreateSession.addEventListener('click', () => {
    createSessionNow();
  });

  // Copy Code
  btnCopyCode.addEventListener('click', () => {
    audio.playClick();
    if (!activeSessionCode || activeSessionCode === 'MEMBUAT KODE...') {
      toast.warning('Sedang menyiapkan kode sesi...');
      return;
    }
    navigator.clipboard.writeText(activeSessionCode).then(() => {
      toast.success(`Kode ${activeSessionCode} disalin ke clipboard!`);
    }).catch(() => {
      prompt('Salin Kode Sesi Guru:', activeSessionCode);
    });
  });

  // Copy Direct Link for Student Mobile Devices
  btnCopyLink.addEventListener('click', () => {
    audio.playClick();
    if (!activeSessionCode || activeSessionCode === 'MEMBUAT KODE...') {
      toast.warning('Sedang menyiapkan kode sesi...');
      return;
    }
    const studentUrl = new URL(window.location.origin + window.location.pathname);
    studentUrl.searchParams.set('session', activeSessionCode);
    navigator.clipboard.writeText(studentUrl.toString()).then(() => {
      toast.success('Link HP Siswa disalin! Bagikan ke grup kelas WhatsApp.');
    }).catch(() => {
      prompt('Salin Link HP Siswa:', studentUrl.toString());
    });
  });

  // Phase Switch Buttons
  const phaseButtons = container.querySelectorAll('.tc-btn-phase');
  phaseButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      audio.playClick();
      if (!activeSessionCode) {
        toast.warning('Buat sesi terlebih dahulu.');
        return;
      }
      const targetPhase = btn.dataset.phase;
      try {
        await firebaseService.setSessionPhase(activeSessionCode, targetPhase);
        audio.playPhaseTransition();
        toast.success(`Fase berhasil dialihkan ke: ${targetPhase}`);
      } catch (err) {
        toast.error('Gagal mengubah fase: ' + err.message);
      }
    });
  });

  // Export CSV
  btnExportCSV.addEventListener('click', () => {
    audio.playClick();
    if (!activeSessionCode || !currentSessionData) {
      toast.warning('Belum ada sesi aktif atau data kelompok.');
      return;
    }
    exportSessionToCSV(activeSessionCode, currentSessionData);
  });

  // Simulate 8 Teams
  btnSimulate.addEventListener('click', async () => {
    audio.playClick();
    if (!activeSessionCode) {
      toast.warning('Buat sesi terlebih dahulu.');
      return;
    }
    btnSimulate.disabled = true;
    btnSimulate.innerHTML = '<span>Menyiapkan 8 Kelompok...</span>';
    try {
      await firebaseService.simulate8Teams(activeSessionCode);
      toast.success('8 kelompok simulasi berhasil diaktifkan dengan nilai contoh.');
      audio.playCorrect();
    } catch (err) {
      toast.error('Gagal simulasi: ' + err.message);
    } finally {
      btnSimulate.disabled = false;
      btnSimulate.innerHTML = '<span>⚡ Simulasi 8 Kelompok Uji</span>';
    }
  });

  // Reset Session
  btnReset.addEventListener('click', async () => {
    audio.playClick();
    if (!activeSessionCode) {
      toast.warning('Belum ada sesi yang aktif.');
      return;
    }
    if (confirm(`Yakin ingin mereset seluruh nilai kelompok pada sesi ${activeSessionCode}?`)) {
      await firebaseService.resetSession(activeSessionCode);
      toast.info('Nilai sesi berhasil direset ke nol.');
    }
  });

  // Handle Teacher Reset / Kick Single Team Slot
  const teamsGrid = container.querySelector('#admin-teams-grid');
  if (teamsGrid) {
    teamsGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.tc-btn-reset-slot');
      if (!btn) return;
      const teamNum = parseInt(btn.dataset.team, 10);
      if (!teamNum || !activeSessionCode) return;
      audio.playClick();
      if (confirm(`Keluarkan dan kosongkan slot Kelompok ${teamNum}? Perangkat siswa akan dibatalkan pendaftarannya.`)) {
        try {
          await firebaseService.leaveSession(activeSessionCode, teamNum);
          toast.info(`Slot Kelompok ${teamNum} berhasil dikosongkan.`);
        } catch (err) {
          toast.error('Gagal mereset slot: ' + err.message);
        }
      }
    });
  }

  function attachSessionListener(code) {
    if (unsubscribe) unsubscribe();

    unsubscribe = firebaseService.listenToSession(code, (session) => {
      if (!session) return;
      currentSessionData = session;

      // Update Phase Highlight
      const activePhase = session.currentPhase || 'LOBBY';
      container.querySelectorAll('.tc-btn-phase').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.phase === activePhase);
      });

      // Update 8 Teams Monitor Cards
      const teams = session.teams || {};
      for (let i = 1; i <= 8; i++) {
        const team = teams[`team_${i}`];
        const card = container.querySelector(`#admin-team-card-${i}`);
        if (!card) continue;

        const badgeEl = card.querySelector(`#atc-badge-${i}`);
        const nameEl = card.querySelector(`#atc-name-${i}`);
        const memEl = card.querySelector(`#atc-members-${i}`);
        const g1El = card.querySelector(`#atc-g1-${i}`);
        const g2El = card.querySelector(`#atc-g2-${i}`);
        const g3El = card.querySelector(`#atc-g3-${i}`);
        const totEl = card.querySelector(`#atc-total-${i}`);
        const predEl = card.querySelector(`#atc-pred-${i}`);
        const resetBtn = card.querySelector(`#atc-reset-${i}`);

        if (team && team.claimed) {
          card.classList.add('active-team');
          badgeEl.className = 'tc-atc-badge online';
          badgeEl.textContent = 'Terkoneksi';
          if (resetBtn) resetBtn.classList.remove('hidden');

          nameEl.textContent = team.name || `Kelompok ${i}`;
          const mList = (team.members || []).map((m) => `${m.name} (${m.absen})`).join(', ');
          memEl.textContent = mList || 'Belum ada anggota';

          const g1 = team.scores?.game1 || 0;
          const g2 = team.scores?.game2 || 0;
          const g3 = team.scores?.game3 || 0;
          const tot = team.scores?.total || 0;

          g1El.textContent = g1;
          g2El.textContent = g2;
          g3El.textContent = g3;
          totEl.textContent = tot;
          predEl.textContent = team.predicate || 'Temperature Rookie';
        } else {
          card.classList.remove('active-team');
          badgeEl.className = 'tc-atc-badge offline';
          badgeEl.textContent = 'Belum Masuk';
          if (resetBtn) resetBtn.classList.add('hidden');
          nameEl.textContent = '-';
          memEl.textContent = '-';
          g1El.textContent = '0';
          g2El.textContent = '0';
          g3El.textContent = '0';
          totEl.textContent = '0';
          predEl.textContent = 'Temperature Rookie';
        }
      }
    });
  }

  // Check saved admin session or create immediately
  const existingCode = localStorage.getItem('tc_active_admin_session');
  if (existingCode && existingCode.startsWith('TC')) {
    activeSessionCode = existingCode;
    dispCode.textContent = activeSessionCode;
    attachSessionListener(activeSessionCode);
  } else {
    createSessionNow();
  }

  return {
    destroy: () => {
      if (unsubscribe) unsubscribe();
    }
  };
}
