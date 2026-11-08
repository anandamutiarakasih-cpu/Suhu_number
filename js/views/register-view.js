/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Team Registration View (Kelompok 1 - 8 & Dynamic Roster with Roles)
 */

import { firebaseService } from '../services/firebase-service.js';
import { audio } from '../services/audio-service.js';
import { toast } from '../components/notification.js';

export async function renderRegisterView(container, { sessionCode, onRegistered, onBack }) {
  // Loading state while connecting to session
  container.innerHTML = `
    <div class="tc-view tc-register-view">
      <div class="tc-card" style="text-align: center; max-width: 480px; margin: 4rem auto; padding: 2.5rem 1.5rem;">
        <div class="tc-radar-spinner" style="margin: 0 auto 1.5rem auto; width: 42px; height: 42px;"></div>
        <h3 style="font-size: 1.3rem; margin-bottom: 0.4rem;">Menghubungkan ke Sesi ${sessionCode}...</h3>
        <p style="color: #94a3b8; font-size: 0.88rem;">Menyinkronkan data kelas dari database online...</p>
      </div>
    </div>
  `;

  let session = await firebaseService.getSession(sessionCode);
  if (!session) {
    await new Promise((r) => setTimeout(r, 1000));
    session = await firebaseService.getSession(sessionCode);
  }

  if (!session) {
    toast.error(`Sesi ${sessionCode} belum ditemukan. Pastikan Guru telah membuat sesi di laptop.`);
    if (onBack) onBack();
    return;
  }

  const existingTeams = session.teams || {};
  let selectedNumber = 1;

  for (let i = 1; i <= 8; i++) {
    if (!existingTeams[`team_${i}`] || !existingTeams[`team_${i}`].claimed) {
      selectedNumber = i;
      break;
    }
  }

  const roleTemplates = [
    { label: 'Juru Bicara', icon: '📢' },
    { label: 'Konseptor IPA', icon: '💡' },
    { label: 'Ahli Hitungan', icon: '🧮' },
    { label: 'Penguji Jawaban', icon: '🔍' }
  ];

  container.innerHTML = `
    <div class="tc-view tc-register-view">
      <div class="tc-top-bar">
        <button id="btn-reg-back" class="tc-btn tc-btn-ghost">← Kembali</button>
        <div class="tc-session-tag">SESI KELAS: <strong>${sessionCode}</strong></div>
      </div>

      <div class="tc-card tc-reg-card">
        <div class="tc-card-header">
          <div class="tc-badge-lab">REGISTRASI KELOMPOK SISWA</div>
          <h2 class="tc-card-title">Pilih Nomor Kelompok & Anggota</h2>
          <p class="tc-card-subtitle">Satu kelompok beranggotakan 3–4 siswa menggunakan 1 gawai HP bersama-sama.</p>
        </div>

        <form id="form-team-reg" class="tc-form">
          <!-- Step 1: Pick Team Number 1 - 8 -->
          <div class="tc-form-section">
            <label class="tc-form-label">PILIH NOMOR KELOMPOK (1–8)</label>
            <div class="tc-team-selector" id="team-selector-grid">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                const isClaimed = existingTeams[`team_${n}`] && existingTeams[`team_${n}`].claimed;
                const isSelected = n === selectedNumber && !isClaimed;
                return `
                  <button 
                    type="button" 
                    class="tc-team-num-btn ${isClaimed ? 'claimed' : ''} ${isSelected ? 'selected' : ''}" 
                    data-team="${n}"
                    ${isClaimed ? 'disabled title="Kelompok ini sudah diambil HP lain"' : ''}
                  >
                    <span class="tc-num-val">${n}</span>
                    <span class="tc-num-status">${isClaimed ? 'Terisi' : 'Tersedia'}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Step 2: Team Name -->
          <div class="tc-form-section">
            <label for="input-team-name" class="tc-form-label">NAMA KELOMPOK</label>
            <input 
              type="text" 
              id="input-team-name" 
              class="tc-input" 
              placeholder="Contoh: Tim Joule / Kalor Squad / Al-Jazari" 
              value="Kelompok ${selectedNumber}" 
              required
            />
          </div>

          <!-- Step 3: Members Roster with CoC Roles -->
          <div class="tc-form-section">
            <div class="tc-section-header-flex">
              <label class="tc-form-label">ANGGOTA KELOMPOK & NOMOR ABSEN</label>
              <button type="button" id="btn-add-member" class="tc-btn tc-btn-sm tc-btn-secondary">
                + Tambah Anggota
              </button>
            </div>
            
            <div id="members-list-container" class="tc-members-container">
              <!-- Default 3 member rows -->
              ${[0, 1, 2].map((idx) => `
                <div class="tc-member-row" data-index="${idx}">
                  <input type="text" class="tc-input tc-input-member-name" placeholder="Nama Siswa ${idx + 1}" required />
                  <input type="number" class="tc-input tc-input-member-absen" placeholder="No. Absen" min="1" max="50" required />
                  <button type="button" class="tc-btn-icon tc-btn-remove-member" title="Hapus" ${idx < 2 ? 'disabled' : ''}>×</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Submit Button -->
          <div class="tc-form-actions">
            <button type="submit" class="tc-btn tc-btn-primary tc-btn-large tc-btn-block" id="btn-submit-reg">
              <span>GABUNG KE LOBI PERSIAPAN</span>
              <span>⚡</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const grid = container.querySelector('#team-selector-grid');
  const inputTeamName = container.querySelector('#input-team-name');
  const membersContainer = container.querySelector('#members-list-container');
  const btnAddMember = container.querySelector('#btn-add-member');
  const btnBack = container.querySelector('#btn-reg-back');
  const form = container.querySelector('#form-team-reg');

  // Handle Team Number Selection
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.tc-team-num-btn');
    if (!btn || btn.disabled) return;
    audio.playClick();

    grid.querySelectorAll('.tc-team-num-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedNumber = parseInt(btn.dataset.team, 10);

    if (/^Kelompok\s\d+$/i.test(inputTeamName.value)) {
      inputTeamName.value = `Kelompok ${selectedNumber}`;
    }
  });

  // Add Member Row
  btnAddMember.addEventListener('click', () => {
    const count = membersContainer.querySelectorAll('.tc-member-row').length;
    if (count >= 4) {
      toast.warning('Maksimal 4 siswa per kelompok.');
      return;
    }
    audio.playClick();

    const row = document.createElement('div');
    row.className = 'tc-member-row';
    row.dataset.index = count;
    row.innerHTML = `
      <input type="text" class="tc-input tc-input-member-name" placeholder="Nama Siswa ${count + 1}" required />
      <input type="number" class="tc-input tc-input-member-absen" placeholder="No. Absen" min="1" max="50" required />
      <button type="button" class="tc-btn-icon tc-btn-remove-member" title="Hapus">×</button>
    `;
    membersContainer.appendChild(row);
  });

  // Remove Member Row
  membersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tc-btn-remove-member');
    if (!btn || btn.disabled) return;
    const row = btn.closest('.tc-member-row');
    if (row && membersContainer.querySelectorAll('.tc-member-row').length > 2) {
      audio.playClick();
      row.remove();
    }
  });

  // Back Button
  btnBack.addEventListener('click', () => {
    audio.playClick();
    if (onBack) onBack();
  });

  // Submit Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    audio.playClick();

    const teamName = inputTeamName.value.trim() || `Kelompok ${selectedNumber}`;
    const nameInputs = membersContainer.querySelectorAll('.tc-input-member-name');
    const absenInputs = membersContainer.querySelectorAll('.tc-input-member-absen');

    const members = [];
    for (let i = 0; i < nameInputs.length; i++) {
      const name = nameInputs[i].value.trim();
      const absen = absenInputs[i].value.trim();
      if (!name || !absen) {
        toast.error('Lengkapi semua nama dan nomor absen anggota.');
        return;
      }
      members.push({ name, absen, role: roleTemplates[i % roleTemplates.length].label });
    }

    const submitBtn = container.querySelector('#btn-submit-reg');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Menyimpan ke Ruang Kelas...</span>';

    try {
      await firebaseService.joinSession(sessionCode, selectedNumber, teamName, members);
      toast.success(`Kelompok ${selectedNumber} berhasil terdaftar!`);
      audio.playCorrect();
      if (onRegistered) {
        onRegistered(sessionCode, selectedNumber);
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>GABUNG KE LOBI PERSIAPAN</span><span>⚡</span>';
      toast.error(err.message || 'Gagal mendaftar ke sesi.');
    }
  });
}
