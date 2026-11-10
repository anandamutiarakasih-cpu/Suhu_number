/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Synchronized Waiting Lounge View (Kelompok Menunggu Instruksi Guru)
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { showLabModal } from '../components/modal.js';
import { toast } from '../components/notification.js';
import { networkService } from '../services/network-service.js';

export function renderWaitingView(container, { sessionCode, teamNumber, onPhaseChange, onCancel }) {
  let unsubscribe = null;

  container.innerHTML = `
    <div class="tc-view tc-waiting-view">
      <!-- Top Action Bar -->
      <div class="tc-top-bar" style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <button id="btn-cancel-waiting-top" class="tc-btn tc-btn-ghost danger" type="button" title="Keluar dan ganti kelompok">
          ← Batalkan & Ganti Kelompok
        </button>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div id="student-net-badge-wrap"></div>
          <div class="tc-session-tag">KODE SESI: <strong>${sessionCode}</strong></div>
        </div>
      </div>

      <!-- Top Status Banner -->
      <header class="tc-waiting-header">
        <div class="tc-badge-lab">
          <span class="tc-pulse-dot"></span>
          LOBI PERSIAPAN • SINKRONISASI KELAS AKTIF
        </div>
        <h2 class="tc-waiting-title">Ruang Tunggu Kelompok</h2>
      </header>

      <!-- Active Team Profile Box -->
      <div class="tc-card tc-my-team-card" id="my-team-box">
        <div class="tc-team-avatar">⚡</div>
        <div class="tc-my-team-info">
          <div class="tc-my-team-number">KELOMPOK ${teamNumber}</div>
          <h3 class="tc-my-team-name" id="my-team-name-display">Memuat nama...</h3>
          <div class="tc-my-team-members" id="my-team-members-display"></div>
        </div>
        <div class="tc-my-team-actions">
          <div class="tc-team-status-badge ready">SIAP BERTANDING</div>
          <button id="btn-cancel-waiting-card" class="tc-btn-cancel-waiting" type="button" title="Batalkan status siap kelompok ini">
            <span>✕ Batalkan</span>
          </button>
        </div>
      </div>

      <!-- Sync Status Notice -->
      <div class="tc-sync-notice">
        <div class="tc-radar-spinner"></div>
        <div class="tc-sync-text">
          <strong>Menunggu Instruksi Guru / Admin...</strong>
          <span>Tetap berada di halaman ini. Layar HP kelompok akan otomatis beralih saat guru memulai babak permainan!</span>
        </div>
      </div>

      <!-- 8 Teams Grid Status -->
      <div class="tc-all-teams-section">
        <h4 class="tc-section-title">STATUS 8 KELOMPOK DALAM SESI</h4>
        <div class="tc-lobby-grid" id="lobby-teams-grid">
          ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `
            <div class="tc-lobby-team-card" id="lobby-team-${n}">
              <div class="tc-lobby-team-num">${n}</div>
              <div class="tc-lobby-team-details">
                <div class="tc-lobby-team-name">Kelompok ${n}</div>
                <div class="tc-lobby-team-status">Menunggu...</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach Network Health Badge & Start Team Heartbeat
  const netBadgeWrap = container.querySelector('#student-net-badge-wrap');
  const detachNet = netBadgeWrap ? networkService.attachBadge(netBadgeWrap) : () => {};
  networkService.startHeartbeat(sessionCode, teamNumber);

  // Handle Cancel Action
  const handleCancelClick = () => {
    audio.playClick();
    showLabModal({
      title: 'BATALKAN PENDAFTARAN?',
      contentHtml: `
        <div style="font-size: 0.95rem; color: #f1f5f9; line-height: 1.6;">
          <p style="margin-bottom: 0.8rem;">
            Yakin ingin membatalkan status siap bertanding untuk <strong>Kelompok ${teamNumber}</strong>?
          </p>
          <div style="background: rgba(239, 68, 68, 0.12); border-left: 3px solid #ef4444; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.85rem; color: #fca5a5;">
            Slot <strong>Kelompok ${teamNumber}</strong> akan dilepaskan sehingga Anda atau kelompok lain dapat memilih nomor kelompok ini kembali.
          </div>
        </div>
      `,
      confirmText: 'Ya, Batalkan',
      cancelText: 'Tetap Menunggu',
      onConfirm: async () => {
        try {
          networkService.stopHeartbeat();
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          toast.info('Melepaskan slot kelompok...');
          await firebaseService.leaveSession(sessionCode, teamNumber);
          toast.success(`Pendaftaran Kelompok ${teamNumber} dibatalkan.`);
          if (onCancel) {
            onCancel();
          }
        } catch (err) {
          toast.error('Gagal membatalkan: ' + (err.message || 'Terjadi kesalahan'));
        }
      }
    });
  };

  const btnCancelTop = container.querySelector('#btn-cancel-waiting-top');
  const btnCancelCard = container.querySelector('#btn-cancel-waiting-card');
  const btnCancelLink = container.querySelector('#btn-cancel-waiting-link');

  if (btnCancelTop) btnCancelTop.addEventListener('click', handleCancelClick);
  if (btnCancelCard) btnCancelCard.addEventListener('click', handleCancelClick);
  if (btnCancelLink) btnCancelLink.addEventListener('click', handleCancelClick);

  // Realtime Session Listener
  unsubscribe = firebaseService.listenToSession(sessionCode, (session) => {
    if (!session) return;

    // Check Phase Change
    if (session.currentPhase && session.currentPhase !== 'LOBBY') {
      audio.playPhaseTransition();
      if (unsubscribe) unsubscribe();
      if (onPhaseChange) {
        onPhaseChange(session.currentPhase, session);
      }
      return;
    }

    // Update My Team Profile
    const myTeam = session.teams ? session.teams[`team_${teamNumber}`] : null;
    if (session.teams && (!myTeam || !myTeam.claimed)) {
      networkService.stopHeartbeat();
      toast.warning(`Slot Kelompok ${teamNumber} telah dikosongkan atau direset oleh Guru.`);
      if (unsubscribe) unsubscribe();
      if (onCancel) onCancel();
      return;
    }

    if (myTeam) {
      const nameEl = container.querySelector('#my-team-name-display');
      const membersEl = container.querySelector('#my-team-members-display');
      if (nameEl) nameEl.textContent = myTeam.name || `Kelompok ${teamNumber}`;
      if (membersEl) {
        const listStr = (myTeam.members || [])
          .map((m) => `${m.name} (Absen ${m.absen})`)
          .join(' • ');
        membersEl.textContent = listStr || 'Belum ada anggota terdaftar';
      }
    }

    // Update 8 Teams Grid
    const teams = session.teams || {};
    for (let i = 1; i <= 8; i++) {
      const card = container.querySelector(`#lobby-team-${i}`);
      if (!card) continue;
      const t = teams[`team_${i}`];

      if (t && t.claimed) {
        card.classList.add('joined');
        card.querySelector('.tc-lobby-team-name').textContent = t.name || `Kelompok ${i}`;
        card.querySelector('.tc-lobby-team-status').innerHTML = `
          <span class="tc-dot-green"></span> Siap (${(t.members || []).length} siswa)
        `;
      } else {
        card.classList.remove('joined');
        card.querySelector('.tc-lobby-team-name').textContent = `Kelompok ${i}`;
        card.querySelector('.tc-lobby-team-status').textContent = 'Belum Masuk';
      }
    }
  });

  return {
    destroy: () => {
      if (unsubscribe) unsubscribe();
      if (detachNet) detachNet();
    }
  };
}
