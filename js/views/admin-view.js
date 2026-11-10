/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Teacher / Admin Mission Control View
 * Monitors 8 teams live, controls game phases, exports CSV, and provides quick simulations.
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { exportSessionToCSV } from '../services/export-service.js';
import { networkService } from '../services/network-service.js';
import { isMobileDevice } from '../utils/device.js';

export function renderAdminView(container, { onExit }) {
  if (isMobileDevice()) {
    container.innerHTML = `
      <div class="tc-view tc-admin-lock-view" style="max-width:540px; margin:2.5rem auto; text-align:center; padding:1.5rem 1rem;">
        <div class="tc-card" style="padding:2.5rem 1.75rem;">
          <div style="font-size:3.5rem; margin-bottom:1rem;">💻</div>
          <div class="tc-badge-lab">AKSES KHUSUS DESKTOP</div>
          <h2 style="font-size:1.6rem; margin:0.75rem 0; color:var(--tc-sky);">Pusat Kendali Guru Hanya untuk Laptop/PC</h2>
          <p style="color:#94a3b8; font-size:0.95rem; line-height:1.6; margin-bottom:1.5rem;">
            Dashboard pemantauan guru dirancang khusus untuk layar lebar (Komputer/Laptop). Smartphone (Android & iPhone) hanya dapat mengakses Mode Siswa untuk bermain.
          </p>
          <button id="btn-back-to-student-mode" class="tc-btn tc-btn-primary tc-btn-large" style="width:100%;">
            <span>Masuk ke Mode Siswa (Beranda)</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
    const btn = container.querySelector('#btn-back-to-student-mode');
    if (btn) btn.addEventListener('click', () => { if (onExit) onExit(); });
    return { destroy: () => {} };
  }

  let activeSessionCode = null;
  let unsubscribe = null;
  let currentSessionData = null;
  let freshnessInterval = null;

  container.innerHTML = `
    <div class="tc-view tc-admin-view">
      <div class="tc-top-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <button id="btn-admin-exit" class="tc-btn tc-btn-ghost">← Mode Siswa / Beranda</button>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div id="admin-net-badge-wrap"></div>
          <div class="tc-badge-lab"><span class="tc-pulse-dot"></span> PUSAT KENDALI LAPTOP GURU (DASHBOARD)</div>
        </div>
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

        <!-- Master Start & Auto-Game Monitor Banner -->
        <div class="tc-card" id="admin-master-control-card" style="margin-bottom: 1.25rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(249,115,22,0.12), rgba(15,23,42,0.95)); border: 2px solid var(--tc-orange); border-radius: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="max-width: 680px;">
              <div class="tc-badge-lab" id="admin-master-badge" style="margin-bottom: 0.35rem;">
                <span class="tc-pulse-dot"></span> MODE OTOMATIS: GURU HANYA MEMANTAU
              </div>
              <h3 id="admin-master-heading" style="font-size: 1.25rem; margin: 0; color: #fff;">
                Menunggu Siswa Masuk ke Lobi...
              </h3>
              <p id="admin-master-desc" style="color: #94a3b8; font-size: 0.88rem; margin: 0.35rem 0 0 0; line-height: 1.5;">
                Saat siswa sudah masuk lobi, klik <strong>"Mulai Permainan"</strong>. Seluruh kelompok akan otomatis bertanding serentak dari <strong>Game 1 ➔ Game 2 ➔ Game 3</strong> secara mandiri tanpa perlu dikontrol lagi oleh guru.
              </p>
            </div>
            <div id="admin-master-action-wrap" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <button id="btn-master-start" class="tc-btn tc-btn-primary tc-btn-large" style="font-size: 1.05rem; font-weight: 800; padding: 0.95rem 1.6rem; box-shadow: 0 0 25px rgba(249,115,22,0.5);">
                <span>🚀 MULAI PERMAINAN SEKARANG</span>
              </button>
              <button id="btn-master-leaderboard" class="tc-btn tc-btn-secondary hidden" style="font-size: 0.95rem; font-weight: 700; padding: 0.85rem 1.25rem;">
                <span>🏆 Buka Leaderboard</span>
              </button>
              <button id="btn-master-back-lobby" class="tc-btn tc-btn-ghost danger hidden" style="font-size: 0.85rem;">
                <span>⏪ Kembalikan ke Lobi</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Master Phase Controller Bar (Manual Override) -->
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
                  <div class="tc-atc-status-wrap" style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end;">
                    <span class="tc-atc-stage-badge" id="atc-stage-${n}" style="font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(255,255,255,0.06); color:#cbd5e1; font-weight:600;">Lobi</span>
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

  // Phase Switch Buttons (Manual Override)
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

  // Master Game Start & Monitor Controls
  const btnMasterStart = container.querySelector('#btn-master-start');
  const btnMasterLB = container.querySelector('#btn-master-leaderboard');
  const btnMasterBackLobby = container.querySelector('#btn-master-back-lobby');
  const masterBadge = container.querySelector('#admin-master-badge');
  const masterHeading = container.querySelector('#admin-master-heading');
  const masterDesc = container.querySelector('#admin-master-desc');

  if (btnMasterStart) {
    btnMasterStart.addEventListener('click', async () => {
      audio.playClick();
      if (!activeSessionCode) {
        toast.warning('Sedang menyiapkan kode sesi...');
        return;
      }
      try {
        btnMasterStart.disabled = true;
        btnMasterStart.innerHTML = '<span>Memulai Seluruh Kelas...</span>';
        await firebaseService.setSessionPhase(activeSessionCode, 'GAME1');
        audio.playPhaseTransition();
        toast.success('🚀 PERMAINAN DIMULAI! Seluruh HP siswa serentak masuk ke Game 1.');
      } catch (err) {
        toast.error('Gagal memulai permainan: ' + err.message);
      } finally {
        btnMasterStart.disabled = false;
      }
    });
  }

  if (btnMasterLB) {
    btnMasterLB.addEventListener('click', async () => {
      audio.playClick();
      if (!activeSessionCode) return;
      try {
        await firebaseService.setSessionPhase(activeSessionCode, 'FINISHED');
        audio.playFanfare();
        toast.success('🏆 Membuka Klasemen Akhir & Podium Juara untuk semua siswa!');
      } catch (err) {
        toast.error('Gagal membuka leaderboard: ' + err.message);
      }
    });
  }

  if (btnMasterBackLobby) {
    btnMasterBackLobby.addEventListener('click', async () => {
      audio.playClick();
      if (!activeSessionCode) return;
      if (confirm('Kembalikan seluruh kelompok ke Lobi Persiapan?')) {
        try {
          await firebaseService.setSessionPhase(activeSessionCode, 'LOBBY');
          toast.info('Seluruh kelompok dikembalikan ke Lobi Persiapan.');
        } catch (err) {
          toast.error('Gagal kembali ke lobi: ' + err.message);
        }
      }
    });
  }

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

  // Attach Network Latency Monitor to Admin Top Bar
  const netBadgeWrap = container.querySelector('#admin-net-badge-wrap');
  const detachNet = netBadgeWrap ? networkService.attachBadge(netBadgeWrap) : () => {};

  function updateTeamsStatus(session) {
    if (!session) return;
    const teams = session.teams || {};
    const now = Date.now();

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
        if (resetBtn) resetBtn.classList.remove('hidden');

        // Evaluate real-time connection freshness from team's heartbeat
        const lastActive = team.lastActive || 0;
        const ageSec = lastActive ? Math.max(0, Math.floor((now - lastActive) / 1000)) : 0;
        const ping = team.latency !== undefined ? `${team.latency}ms` : '';

        if (!lastActive || ageSec < 15) {
          badgeEl.className = 'tc-atc-badge online';
          badgeEl.innerHTML = `<span class="tc-pulse-dot"></span> Online ${ping ? `(${ping})` : ''}`;
        } else if (ageSec < 35) {
          badgeEl.className = 'tc-atc-badge lag';
          badgeEl.innerHTML = `<span class="tc-dot-yellow"></span> Lambat (${ageSec}d)`;
        } else {
          badgeEl.className = 'tc-atc-badge disconnected';
          badgeEl.innerHTML = `<span class="tc-dot-red"></span> Terputus (${ageSec}d)`;
        }

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

        // Update real-time stage progress tag
        const stageEl = card.querySelector(`#atc-stage-${i}`);
        if (stageEl) {
          if ((g1 > 0 && g2 > 0 && g3 > 0) || tot >= 100) {
            stageEl.style.background = 'rgba(234, 179, 8, 0.2)';
            stageEl.style.color = '#fde047';
            stageEl.textContent = '🏁 Tuntas';
          } else if (g2 > 0) {
            stageEl.style.background = 'rgba(168, 85, 247, 0.2)';
            stageEl.style.color = '#c084fc';
            stageEl.textContent = '🧩 Game 3';
          } else if (g1 > 0) {
            stageEl.style.background = 'rgba(56, 189, 248, 0.2)';
            stageEl.style.color = '#38bdf8';
            stageEl.textContent = '⚡ Game 2';
          } else if (session.currentPhase && session.currentPhase !== 'LOBBY') {
            stageEl.style.background = 'rgba(249, 115, 22, 0.2)';
            stageEl.style.color = '#fb923c';
            stageEl.textContent = '⛓️ Game 1';
          } else {
            stageEl.style.background = 'rgba(255,255,255,0.06)';
            stageEl.style.color = '#94a3b8';
            stageEl.textContent = '⏳ Di Lobi';
          }
        }
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

        const stageEl = card.querySelector(`#atc-stage-${i}`);
        if (stageEl) {
          stageEl.style.background = 'rgba(255,255,255,0.06)';
          stageEl.style.color = '#64748b';
          stageEl.textContent = 'Belum Masuk';
        }
      }
    }
  }

  // Periodic refresher to update connection seconds & lag indicators even without data mutations
  freshnessInterval = setInterval(() => {
    if (currentSessionData) {
      updateTeamsStatus(currentSessionData);
    }
  }, 3000);

  function attachSessionListener(code) {
    if (unsubscribe) unsubscribe();

    unsubscribe = firebaseService.listenToSession(code, (session) => {
      if (!session) return;
      currentSessionData = session;

      const activePhase = session.currentPhase || 'LOBBY';

      // Update Master Start & Monitor Banner
      if (activePhase === 'LOBBY') {
        if (btnMasterStart) btnMasterStart.classList.remove('hidden');
        if (btnMasterLB) btnMasterLB.classList.add('hidden');
        if (btnMasterBackLobby) btnMasterBackLobby.classList.add('hidden');
        if (masterBadge) masterBadge.innerHTML = '<span class="tc-pulse-dot"></span> LOBI PERSIAPAN AKTIF';
        if (masterHeading) masterHeading.textContent = 'Menunggu Siswa Masuk ke Lobi...';
        if (masterDesc) masterDesc.textContent = 'Bagikan kode atau link ke siswa. Saat semua kelompok siap, klik "MULAI PERMAINAN SEKARANG". Siswa akan otomatis bertanding serentak dari Game 1 ➔ Game 2 ➔ Game 3 secara mandiri.';
      } else {
        if (btnMasterStart) btnMasterStart.classList.add('hidden');
        if (btnMasterLB) btnMasterLB.classList.remove('hidden');
        if (btnMasterBackLobby) btnMasterBackLobby.classList.remove('hidden');
        if (masterBadge) masterBadge.innerHTML = '<span class="tc-pulse-dot" style="background:#22c55e;"></span> PERMAINAN BERJALAN MANDIRI';
        if (masterHeading) masterHeading.textContent = 'Siswa Sedang Bertanding (Game 1 ➔ Game 2 ➔ Game 3)';
        if (masterDesc) masterDesc.textContent = 'Guru hanya memantau perolehan skor langsung pada papan skor di bawah. Tidak perlu mengontrol perpindahan sesi game.';
      }

      // Update Phase Highlight Buttons
      container.querySelectorAll('.tc-btn-phase').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.phase === activePhase);
      });

      // Update 8 Teams Monitor Cards
      updateTeamsStatus(session);
    });
  }

  // Selalu buat sesi baru bersih di awal sesuai permintaan: reset ulang di awal
  localStorage.removeItem('tc_active_admin_session');
  createSessionNow();

  return {
    destroy: () => {
      if (freshnessInterval) clearInterval(freshnessInterval);
      if (unsubscribe) unsubscribe();
      if (detachNet) detachNet();
    }
  };
}
