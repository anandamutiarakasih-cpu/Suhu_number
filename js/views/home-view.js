/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Home View - Gateway Role & Session Selector
 */

import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';
import { showLabModal } from '../components/modal.js';
import { isMobileDevice } from '../utils/device.js';

export function renderHomeView(container, { onJoinTeam, onOpenAdmin }) {
  const isMuted = audio.isMuted();
  const isMobile = isMobileDevice();

  container.innerHTML = `
    <div class="tc-view tc-home-view">
      <!-- Audio Toggle Button -->
      <button class="tc-audio-btn ${isMuted ? 'muted' : ''}" id="btn-audio-toggle" title="Toggle Suara">
        <span class="tc-audio-icon">${isMuted ? '🔇' : '🔊'}</span>
      </button>

      <!-- Thermal Lab Science Branding -->
      <header class="tc-home-header">
        <div class="tc-badge-lab">
          <span class="tc-pulse-dot"></span>
          LABORATORIUM FISIKA KALOR SMP KELAS VII
        </div>
        <h1 class="tc-main-title">
          GAME <span class="tc-text-gradient">KALOR</span>
        </h1>
        <div class="tc-sub-title">CLASH OF SCIENCE • IPA SMP KELAS VII</div>
        <p class="tc-home-desc">
          Game edukasi sains interaktif terinspirasi Clash of Champions. 
          8 kelompok siswa bertanding kolaboratif menguji rantai peristiwa kalor, 
          pencocokan konsep, dan pemecahan teka-teki rumus matematika kalor!
        </p>
      </header>

      <!-- 2 Main Role Cards -->
      <div class="tc-role-grid">
        <!-- Student Team Card -->
        <div class="tc-card tc-role-card tc-role-student">
          <div class="tc-role-badge">PESERTA DIDIK (GAWAI HP)</div>
          <div class="tc-role-icon">📱</div>
          <h2 class="tc-role-name">Kelompok Siswa</h2>
          <p class="tc-role-info">
            Satu HP untuk satu kelompok (3–4 siswa). Masukkan kode sesi dari guru, daftarkan anggota, dan bertanding bersama!
          </p>

          <form id="form-quick-join" class="tc-join-form">
            <div class="tc-input-group">
              <label for="input-session-code">KODE SESI GURU</label>
              <input 
                type="text" 
                id="input-session-code" 
                class="tc-input" 
                placeholder="Contoh: TC4829" 
                maxlength="8" 
                required 
                autocomplete="off"
              />
            </div>
            <button type="submit" class="tc-btn tc-btn-primary tc-btn-block">
              <span>MASUK PERMAINAN</span>
              <span class="tc-btn-arrow">➔</span>
            </button>
          </form>
        </div>

        <!-- Teacher / Admin Card -->
        <div class="tc-card tc-role-card tc-role-admin">
          <div class="tc-role-badge admin">${isMobile ? '🔒 KHUSUS LAPTOP / DESKTOP' : 'GURU / INSTRUKTUR (LAPTOP)'}</div>
          <div class="tc-role-icon">💻</div>
          <h2 class="tc-role-name">Pusat Kendali Guru</h2>
          <p class="tc-role-info">
            Pantau 8 kelompok secara live dari laptop, kendalikan timer & babak serentak, serta unduh rekap nilai CSV tanpa proyektor.
          </p>
          <div class="tc-admin-action-wrap">
            <button id="btn-goto-admin" class="tc-btn ${isMobile ? 'tc-btn-secondary' : 'tc-btn-primary'} tc-btn-block">
              <span>${isMobile ? 'AKSES KHUSUS LAPTOP GURU 🔒' : 'BUAT KODE SESI / KENDALI GURU'}</span>
              <span class="tc-btn-arrow">➔</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3 Challenge Showcase Overview (Number Chains, Start Champ, Cryptarithm War) -->
      <div class="tc-preview-bar">
        <div class="tc-preview-item">
          <span class="tc-item-num">01</span>
          <div class="tc-item-content">
            <strong>Number Chains</strong>
            <span>Rantai Urutan Peristiwa Kalor (100 Pts/Soal + Bonus)</span>
          </div>
        </div>
        <div class="tc-preview-item">
          <span class="tc-item-num">02</span>
          <div class="tc-item-content">
            <strong>Start Champ</strong>
            <span>Mencocokkan Konsep & Ilustrasi Kalor (100 Pts/Soal + Bonus)</span>
          </div>
        </div>
        <div class="tc-preview-item">
          <span class="tc-item-num">03</span>
          <div class="tc-item-content">
            <strong>Cryptarithm War</strong>
            <span>Teka-Teki Angka & Rumus Kalor (100 Pts/Soal + Bonus)</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Audio Toggle
  const audioBtn = container.querySelector('#btn-audio-toggle');
  audioBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    audioBtn.classList.toggle('muted', muted);
    audioBtn.querySelector('.tc-audio-icon').textContent = muted ? '🔇' : '🔊';
    toast.info(muted ? 'Suara dinonaktifkan' : 'Suara diaktifkan');
  });

  // Student Quick Join
  const formJoin = container.querySelector('#form-quick-join');
  formJoin.addEventListener('submit', (e) => {
    e.preventDefault();
    audio.playClick();
    let code = container.querySelector('#input-session-code').value.trim().toUpperCase();
    if (!code) {
      toast.error('Masukkan kode sesi terlebih dahulu.');
      return;
    }
    if (!code.startsWith('TC') && code.length === 4) {
      code = 'TC' + code;
    }
    if (onJoinTeam) onJoinTeam(code);
  });

  // Admin Portal Button (Desktop Only)
  const btnAdmin = container.querySelector('#btn-goto-admin');
  btnAdmin.addEventListener('click', () => {
    audio.playClick();
    if (isMobile) {
      showLabModal({
        title: 'AKSES GURU KHUSUS DESKTOP',
        contentHtml: `
          <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
            <p style="margin-bottom:0.75rem;">
              Pusat Kendali Guru dirancang khusus untuk layar besar <strong>Komputer atau Laptop (Desktop)</strong> agar guru dapat mengawasi nilai dan progres 8 kelompok secara serentak.
            </p>
            <div style="background:rgba(56, 189, 248, 0.15); border-left:3px solid #38bdf8; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#bae6fd; line-height:1.5;">
              📱 <strong>Penggunaan di HP:</strong> Siswa menggunakan HP untuk bergabung ke permainan. Silakan gunakan kartu <strong>Kelompok Siswa</strong> di atas dengan memasukkan kode sesi.
            </div>
          </div>
        `,
        confirmText: 'Mengerti (Mode Siswa)',
        onConfirm: () => {}
      });
      return;
    }
    if (onOpenAdmin) onOpenAdmin();
  });

  return {
    destroy: () => {}
  };
}
