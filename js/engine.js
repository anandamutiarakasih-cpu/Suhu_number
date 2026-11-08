/**
 * Clash of Champions - Kalor Game Engine
 * Mendukung 2 Peran Utama:
 * 1. GURU (Admin Proyektor): Membuka kode room, mengawasi leaderboard live seluruh kelompok.
 * 2. SISWA (1 HP per Kelompok 3-4 Orang): Memasukkan kode room, mendaftarkan nama tim, dan memainkan Game A, B, C.
 * Terhubung langsung ke Firebase Realtime Database.
 */

class CoCGameEngine {
    constructor() {
        // Role state: 'guru' atau 'siswa'
        this.currentRole = 'siswa';

        // Data kelompok siswa di HP ini
        this.myStudentTeam = this.loadStoredStudentTeam() || {
            id: "team_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1000),
            name: "Tim Joule",
            color: "#f59e0b",
            members: [
                { name: "Siswa 1", role: "spokesperson" },
                { name: "Siswa 2", role: "concept" },
                { name: "Siswa 3", role: "math" },
                { name: "Siswa 4", role: "verifier" }
            ],
            scores: { chains: 0, matching: 0, cryptarithm: 0, collaboration: 0 },
            totalScore: 0,
            currentProgress: "Lobby"
        };

        // Seluruh tim dalam room (didapat dari Firebase untuk Guru & Ranking Siswa)
        this.allRoomTeams = [];

        // Game play state
        this.activeGame = null; // 'chains', 'matching', 'cryptarithm'

        // Game A state (Number Chains)
        this.chainIndex = 0;
        this.currentChainItems = [];
        this.draggedItemIndex = null;

        // Game B state (Start Champ)
        this.matchRound = 0; // 0, 1, 2
        this.selectedScenarioId = null;
        this.currentPairings = {};

        // Game C state (Cryptarithm)
        this.cryptoIndex = 0;
        this.activeInputId = null;

        // Timer
        this.timerSeconds = 0;
        this.timerInterval = null;

        // Collaboration status
        this.collabAgreed = false;
    }

    loadStoredStudentTeam() {
        try {
            const saved = localStorage.getItem('coc_student_team');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return null;
    }

    saveStudentTeam() {
        try {
            localStorage.setItem('coc_student_team', JSON.stringify(this.myStudentTeam));
        } catch (e) {}
    }

    init() {
        this.detectInitialRole();
        this.setupEventListeners();
        this.renderRoleUI();
        this.renderStudentSetupForm();

        // Inisialisasi koneksi Firebase
        if (window.firebaseSync) {
            window.firebaseSync.init();
        }

        // Tampilkan layar awal
        this.showScreen('screenLobby');
    }

    detectInitialRole() {
        const params = new URLSearchParams(window.location.search);
        const roleParam = params.get('role');
        if (roleParam === 'guru' || roleParam === 'admin') {
            this.currentRole = 'guru';
        } else if (roleParam === 'siswa') {
            this.currentRole = 'siswa';
        } else {
            // Jika layar lebar (> 992px) dan bukan HP, tawarkan default atau cek localStorage
            const savedRole = localStorage.getItem('coc_user_role');
            if (savedRole) {
                this.currentRole = savedRole;
            } else if (window.innerWidth >= 992) {
                this.currentRole = 'guru'; // Laptop default guru
            } else {
                this.currentRole = 'siswa'; // HP default siswa
            }
        }
    }

    setRole(role) {
        if (role !== 'guru' && role !== 'siswa') return;
        this.currentRole = role;
        try {
            localStorage.setItem('coc_user_role', role);
        } catch (e) {}

        window.soundFx.playClick();
        this.renderRoleUI();

        if (this.currentRole === 'guru') {
            this.showToast("👨‍🏫 Beralih ke Tampilan Guru (Layar Proyektor)");
            this.renderTeacherLiveMonitor();
        } else {
            this.showToast("📱 Beralih ke Tampilan Siswa (Gawai HP)");
            this.updateStudentHeader();
        }
    }

    renderRoleUI() {
        const btnRoleGuru = document.getElementById('btnRoleGuru');
        const btnRoleSiswa = document.getElementById('btnRoleSiswa');
        const viewGuru = document.getElementById('viewGuru');
        const viewSiswa = document.getElementById('viewSiswa');

        if (this.currentRole === 'guru') {
            if (btnRoleGuru) btnRoleGuru.classList.add('active');
            if (btnRoleSiswa) btnRoleSiswa.classList.remove('active');
            if (viewGuru) viewGuru.classList.remove('hidden');
            if (viewSiswa) viewSiswa.classList.add('hidden');
        } else {
            if (btnRoleGuru) btnRoleGuru.classList.remove('active');
            if (btnRoleSiswa) btnRoleSiswa.classList.add('active');
            if (viewGuru) viewGuru.classList.add('hidden');
            if (viewSiswa) viewSiswa.classList.remove('hidden');
        }

        // Update Room Code Displays
        const roomCode = window.firebaseSync ? window.firebaseSync.roomCode : "COC-7A";
        document.querySelectorAll('.active-room-display').forEach(el => el.textContent = roomCode);

        this.updateStudentHeader();
        this.renderTeacherLiveMonitor();
    }

    updateLiveConnectionUI(isConnected) {
        const dot = document.getElementById('liveStatusDot');
        if (dot) {
            dot.className = `live-dot ${isConnected ? 'online' : 'offline'}`;
        }
        const roomCode = window.firebaseSync ? window.firebaseSync.roomCode : "COC-7A";
        document.querySelectorAll('.active-room-display').forEach(el => el.textContent = roomCode);
    }

    // ----------------------------------------------------
    // ROLE SISWA: REGISTRASI & KONTROL TIM HP
    // ----------------------------------------------------
    renderStudentSetupForm() {
        const team = this.myStudentTeam;
        const nameInput = document.getElementById('studentTeamNameInput');
        if (nameInput) nameInput.value = team.name;

        const membersContainer = document.getElementById('studentMembersSetupList');
        if (!membersContainer) return;

        membersContainer.innerHTML = team.members.map((m, idx) => `
            <div class="student-member-row">
                <span class="role-badge ${m.role}">
                    ${this.getRoleIcon(m.role)} ${this.getRoleLabel(m.role)}
                </span>
                <input type="text" class="member-name-input" 
                    value="${m.name}" 
                    placeholder="Nama Siswa ${idx + 1}"
                    onchange="engine.updateStudentMemberName(${idx}, this.value)">
            </div>
        `).join('');

        this.updateStudentHeader();
    }

    updateStudentMemberName(idx, val) {
        if (this.myStudentTeam.members[idx]) {
            this.myStudentTeam.members[idx].name = val.trim() || `Siswa ${idx + 1}`;
            this.saveStudentTeam();
            this.broadcastMyStudentTeam();
        }
    }

    saveStudentTeamDetails() {
        const nameInput = document.getElementById('studentTeamNameInput');
        if (nameInput && nameInput.value.trim()) {
            this.myStudentTeam.name = nameInput.value.trim();
        }

        const roomInput = document.getElementById('studentRoomInputLobby');
        if (roomInput && roomInput.value.trim()) {
            const code = roomInput.value.trim().toUpperCase();
            if (window.firebaseSync) {
                window.firebaseSync.setRoom(code);
            }
        }

        this.saveStudentTeam();
        this.broadcastMyStudentTeam();
        window.soundFx.playCorrect();
        this.showToast(`✅ Tim "${this.myStudentTeam.name}" siap bertanding!`);
        this.updateStudentHeader();
    }

    joinStudentRoomByCode() {
        const input = document.getElementById('studentRoomInputTop') || document.getElementById('studentRoomInputLobby');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        if (!code) {
            this.showToast("Masukkan kode dari guru terlebih dahulu!");
            window.soundFx.playWrong();
            return;
        }

        if (window.firebaseSync) {
            window.firebaseSync.setRoom(code);
            this.broadcastMyStudentTeam();
            window.soundFx.playCorrect();
            this.showToast(`🎉 Berhasil bergabung ke Room: ${code}`);
            this.renderRoleUI();
        }
    }

    broadcastMyStudentTeam() {
        if (window.firebaseSync) {
            window.firebaseSync.registerTeamOnCloud(this.myStudentTeam);
        }
    }

    updateStudentHeader() {
        const teamNameEl = document.getElementById('studentHeaderTeamName');
        if (teamNameEl) teamNameEl.textContent = this.myStudentTeam.name;

        const scoreEl = document.getElementById('studentHeaderScore');
        if (scoreEl) scoreEl.textContent = `${this.myStudentTeam.totalScore} Poin`;

        // Hitung peringkat tim ini di antara semua tim di kelas
        const rankEl = document.getElementById('studentHeaderRank');
        if (rankEl) {
            const myRank = this.getMyTeamRank();
            const totalTeams = Math.max(this.allRoomTeams.length, 1);
            rankEl.innerHTML = `Peringkat <strong>#${myRank}</strong> dari ${totalTeams} Kelompok`;
        }
    }

    getMyTeamRank() {
        if (!this.allRoomTeams || this.allRoomTeams.length === 0) return 1;
        const sorted = [...this.allRoomTeams].sort((a, b) => b.totalScore - a.totalScore);
        const idx = sorted.findIndex(t => t.id === this.myStudentTeam.id);
        return idx !== -1 ? idx + 1 : 1;
    }

    // ----------------------------------------------------
    // ROLE GURU: DASBOR PENGAWASAN LAPTOP
    // ----------------------------------------------------
    renderTeacherLiveMonitor() {
        const container = document.getElementById('teacherLiveLeaderboardTable');
        const roomCode = window.firebaseSync ? window.firebaseSync.roomCode : "COC-7A";
        document.querySelectorAll('.active-room-display').forEach(el => el.textContent = roomCode);

        // Hitung statistik kelas realtime
        const totalTeams = this.allRoomTeams.length;
        const statTotal = document.getElementById('statTotalTeams');
        if (statTotal) statTotal.textContent = totalTeams;

        const sorted = [...this.allRoomTeams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        
        const statLeading = document.getElementById('statLeadingTeam');
        if (statLeading) {
            statLeading.textContent = (sorted.length > 0 && sorted[0].name) ? sorted[0].name : '-';
        }

        const statAvg = document.getElementById('statAvgScore');
        if (statAvg) {
            if (totalTeams > 0) {
                const sum = sorted.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
                statAvg.textContent = Math.round(sum / totalTeams);
            } else {
                statAvg.textContent = "0";
            }
        }

        if (!container) return;

        if (totalTeams === 0) {
            container.innerHTML = `
                <div class="empty-teams-notice">
                    <div style="font-size:2.2rem; margin-bottom:8px;">⏳</div>
                    <h4>Belum Ada Kelompok Siswa yang Bergabung</h4>
                    <p>Berikan kode room ke siswa: <strong style="color:var(--gold-light); font-size:1.2rem;">${roomCode}</strong></p>
                    <small style="color:var(--text-muted)">Setiap kelompok (1 HP per 3–4 siswa) memasukkan kode room ini untuk mulai bertanding.</small>
                </div>
            `;
            return;
        }

        const medals = ['🥇', '🥈', '🥉', '⭐'];

        container.innerHTML = `
            <div class="leaderboard-table-header">
                <span>Peringkat</span>
                <span>Nama Kelompok & Anggota</span>
                <span>Aktivitas Soal Saat Ini</span>
                <span>Skor Total</span>
            </div>
            ${sorted.map((t, idx) => `
                <div class="leaderboard-table-row ${idx === 0 ? 'rank-gold' : ''}">
                    <div class="rank-badge-cell">
                        <span class="medal-icon">${medals[idx] || '⭐'}</span>
                        <strong>#${idx + 1}</strong>
                    </div>
                    <div class="team-info-cell">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="team-color-dot" style="background:${t.color || '#f59e0b'}"></span>
                            <strong style="font-size:1.1rem; color:#fff;">${t.name}</strong>
                        </div>
                        <div class="members-subtext">
                            ${t.members && Array.isArray(t.members) ? t.members.map(m => m.name).join(' • ') : ''}
                        </div>
                        <div class="score-breakdown-tags">
                            <span class="breakdown-pill">⛓️ Rantai: ${t.scores ? t.scores.chains : 0}</span>
                            <span class="breakdown-pill">🎯 Konsep: ${t.scores ? t.scores.matching : 0}</span>
                            <span class="breakdown-pill">⚡ Kripto: ${t.scores ? t.scores.cryptarithm : 0}</span>
                            <span class="breakdown-pill collab">🤝 Kolaborasi: ${t.scores ? t.scores.collaboration : 0}</span>
                        </div>
                    </div>
                    <div class="progress-cell">
                        <span class="progress-tag">${t.currentProgress || 'Bermain'}</span>
                    </div>
                    <div class="score-cell">
                        <strong class="score-num">${t.totalScore || 0}</strong>
                        <small>pt</small>
                    </div>
                </div>
            `).join('')}
        `;
    }

    teacherGenerateNewCode() {
        window.soundFx.playClick();
        if (!window.firebaseSync) return;
        const newCode = window.firebaseSync.generateRandomCode();
        window.firebaseSync.setRoom(newCode);
        this.allRoomTeams = [];
        this.renderRoleUI();
        this.showToast(`✨ Kode Room baru dibuat: ${newCode}`);
    }

    teacherResetSession() {
        if (!confirm("Apakah Anda yakin ingin mereset seluruh data kelompok untuk sesi kelas ini?")) return;
        window.soundFx.playClick();
        if (window.firebaseSync) {
            window.firebaseSync.resetRoomOnCloud();
        }
        this.allRoomTeams = [];
        this.renderTeacherLiveMonitor();
        this.showToast("🔄 Sesi kelas telah dibersihkan.");
    }

    copyTeacherCodeOnly() {
        const code = window.firebaseSync ? window.firebaseSync.roomCode : "COC-7A";
        navigator.clipboard.writeText(code).then(() => {
            window.soundFx.playCorrect();
            this.showToast(`📋 Kode "${code}" berhasil disalin!`);
        }).catch(() => {
            this.showToast(`Kode room: ${code}`);
        });
    }

    copyTeacherFullLink() {
        const code = window.firebaseSync ? window.firebaseSync.roomCode : "COC-7A";
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${code}&role=siswa`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            window.soundFx.playCorrect();
            this.showToast("📋 Link Room siswa berhasil disalin ke clipboard!");
        }).catch(() => {
            this.showToast(`Link siswa: ${shareUrl}`);
        });
    }

    // Sinkronisasi data tim dari Firebase
    syncTeamsFromCloud(teamsObj) {
        if (!teamsObj) {
            this.allRoomTeams = [];
            this.renderTeacherLiveMonitor();
            return;
        }

        this.allRoomTeams = Object.values(teamsObj);
        this.renderTeacherLiveMonitor();
        this.updateStudentHeader();

        // Indikasi denyut data masuk
        const dot = document.getElementById('liveStatusDot');
        if (dot) {
            dot.classList.add('pulse');
            setTimeout(() => dot.classList.remove('pulse'), 600);
        }
    }

    // ----------------------------------------------------
    // SISTEM POIN KELOMPOK SISWA
    // ----------------------------------------------------
    addPoints(category, points, progressName) {
        this.myStudentTeam.scores[category] += points;
        this.myStudentTeam.totalScore = 
            this.myStudentTeam.scores.chains + 
            this.myStudentTeam.scores.matching + 
            this.myStudentTeam.scores.cryptarithm + 
            this.myStudentTeam.scores.collaboration;
        
        if (progressName) {
            this.myStudentTeam.currentProgress = progressName;
        }

        this.saveStudentTeam();
        this.updateStudentHeader();

        // Sinkronisasi realtime ke Firebase
        if (window.firebaseSync) {
            window.firebaseSync.updateTeamScoreOnCloud(
                this.myStudentTeam.id,
                this.myStudentTeam.scores,
                this.myStudentTeam.totalScore,
                this.myStudentTeam.currentProgress
            );
        }
    }

    getRoleIcon(role) {
        switch(role) {
            case 'spokesperson': return '👑';
            case 'concept': return '🔍';
            case 'math': return '🔢';
            case 'verifier': return '⚖️';
            default: return '👤';
        }
    }

    getRoleLabel(role) {
        switch(role) {
            case 'spokesperson': return 'Juru Bicara';
            case 'concept': return 'Pakar Konsep';
            case 'math': return 'Master Hitung';
            case 'verifier': return 'Verifikator';
            default: return 'Anggota';
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerSeconds = 0;
        const timerDisplay = document.getElementById('gameTimerDisplay');
        if (timerDisplay) timerDisplay.textContent = "00:00";

        this.timerInterval = setInterval(() => {
            this.timerSeconds++;
            const mins = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
            const secs = String(this.timerSeconds % 60).padStart(2, '0');
            if (timerDisplay) {
                timerDisplay.textContent = `${mins}:${secs}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.app-screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            target.scrollTop = 0;
        }
    }

    renderLobby() {
        this.activeGame = null;
        this.stopTimer();
        this.showScreen('screenLobby');
        this.renderRoleUI();
    }

    // ----------------------------------------------------
    // GAME A: NUMBER CHAINS
    // ----------------------------------------------------
    startNumberChains() {
        this.activeGame = 'chains';
        this.chainIndex = 0;
        this.showScreen('screenNumberChains');
        window.soundFx.playStart();
        this.startTimer();
        this.renderChainStage();
        this.broadcastMyStudentTeam();
    }

    renderChainStage() {
        const data = NUMBER_CHAINS_DATA[this.chainIndex];
        if (!data) {
            this.showGameCompleteModal("Game A: Number Chains Selesai!", "Selamat! Tim berhasil menyelesaikan seluruh rantai peristiwa kalor.", () => {
                this.renderLobby();
            });
            return;
        }

        const progEl = document.getElementById('chainProgressText');
        if (progEl) progEl.textContent = `Tantangan ${this.chainIndex + 1} dari ${NUMBER_CHAINS_DATA.length}`;
        const progBar = document.getElementById('chainProgressBar');
        if (progBar) progBar.style.width = `${((this.chainIndex) / NUMBER_CHAINS_DATA.length) * 100}%`;

        document.getElementById('chainTitle').textContent = data.title;
        document.getElementById('chainBadge').textContent = data.badge;
        document.getElementById('chainTopic').textContent = `Topik: ${data.topic}`;
        document.getElementById('chainStory').textContent = data.story;

        this.currentChainItems = [...data.correctOrder];
        this.shuffleArray(this.currentChainItems);
        if (this.isChainCorrect() && this.currentChainItems.length > 2) {
            const temp = this.currentChainItems[0];
            this.currentChainItems[0] = this.currentChainItems[1];
            this.currentChainItems[1] = temp;
        }

        this.renderChainCards();
        this.resetCollaborationConsent();
        document.getElementById('chainFeedback').innerHTML = '';
        document.getElementById('btnNextChain').classList.add('hidden');
        document.getElementById('btnCheckChain').classList.remove('hidden');

        // Update progress status di Firebase
        this.addPoints('chains', 0, `Game A (Rantai ${this.chainIndex + 1}/5)`);
    }

    renderChainCards() {
        const container = document.getElementById('chainSlotsContainer');
        container.innerHTML = '';

        this.currentChainItems.forEach((text, idx) => {
            const card = document.createElement('div');
            card.className = 'chain-card';
            card.draggable = true;
            card.dataset.index = idx;

            card.innerHTML = `
                <div class="chain-slot-number">${idx + 1}</div>
                <div class="chain-card-text">${text}</div>
                <div class="chain-card-actions">
                    <button class="btn-card-move up" onclick="engine.moveChainCard(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Pindah ke Atas">▲</button>
                    <button class="btn-card-move down" onclick="engine.moveChainCard(${idx}, 1)" ${idx === this.currentChainItems.length - 1 ? 'disabled' : ''} title="Pindah ke Bawah">▼</button>
                </div>
            `;

            card.addEventListener('dragstart', (e) => {
                this.draggedItemIndex = idx;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.chain-card').forEach(c => c.classList.remove('drag-over'));
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                if (this.draggedItemIndex !== null && this.draggedItemIndex !== idx) {
                    const movedItem = this.currentChainItems.splice(this.draggedItemIndex, 1)[0];
                    this.currentChainItems.splice(idx, 0, movedItem);
                    window.soundFx.playMove();
                    this.renderChainCards();
                }
            });

            container.appendChild(card);
        });
    }

    moveChainCard(idx, direction) {
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= this.currentChainItems.length) return;
        
        const temp = this.currentChainItems[idx];
        this.currentChainItems[idx] = this.currentChainItems[targetIdx];
        this.currentChainItems[targetIdx] = temp;
        
        window.soundFx.playMove();
        this.renderChainCards();
    }

    isChainCorrect() {
        const correct = NUMBER_CHAINS_DATA[this.chainIndex].correctOrder;
        return this.currentChainItems.every((item, i) => item === correct[i]);
    }

    checkChainAnswer() {
        const data = NUMBER_CHAINS_DATA[this.chainIndex];
        const correctOrder = data.correctOrder;
        let matchedCount = 0;
        const cards = document.querySelectorAll('.chain-card');

        this.currentChainItems.forEach((item, i) => {
            if (item === correctOrder[i]) {
                matchedCount++;
                cards[i].classList.add('correct');
                cards[i].classList.remove('incorrect');
            } else {
                cards[i].classList.add('incorrect');
                cards[i].classList.remove('correct');
            }
        });

        const feedbackEl = document.getElementById('chainFeedback');

        if (matchedCount === correctOrder.length) {
            window.soundFx.playCorrect();
            const bonusCollab = this.collabAgreed ? 25 : 0;
            this.addPoints('chains', 100, `Game A (Rantai ${this.chainIndex + 1} Selesai)`);
            if (bonusCollab > 0) {
                this.addPoints('collaboration', bonusCollab);
            }

            feedbackEl.innerHTML = `
                <div class="feedback-box success animate-bounce-in">
                    <div class="fb-icon">🎉</div>
                    <div class="fb-text">
                        <h4>URUTAN SEMPURNA! (+100 Poin ${this.collabAgreed ? '+ 25 Bonus Kolaborasi' : ''})</h4>
                        <p>Kelompok berhasil menata seluruh tahapan kalor dengan presisi!</p>
                    </div>
                </div>
            `;

            document.getElementById('btnCheckChain').classList.add('hidden');
            document.getElementById('btnNextChain').classList.remove('hidden');

            setTimeout(() => {
                this.showExplanationModal(
                    data.title,
                    data.explanation.summary,
                    data.explanation.keyPoints,
                    data.explanation.didYouKnow
                );
            }, 800);
        } else {
            window.soundFx.playWrong();
            feedbackEl.innerHTML = `
                <div class="feedback-box error animate-shake">
                    <div class="fb-icon">⚠️</div>
                    <div class="fb-text">
                        <h4>Urutan Belum Tepat (${matchedCount}/${correctOrder.length} Benar)</h4>
                        <p>Perhatikan kartu bertanda merah. Diskusikan kembali bersama anggota kelompok!</p>
                    </div>
                </div>
            `;
        }
    }

    nextChainStage() {
        window.soundFx.playClick();
        this.chainIndex++;
        if (this.chainIndex < NUMBER_CHAINS_DATA.length) {
            this.renderChainStage();
        } else {
            this.showGameCompleteModal("🏆 Selesai Game A: Number Chains!", "Luar biasa! Seluruh rantai peristiwa kalor berhasil dituntaskan.", () => {
                this.renderLobby();
            });
        }
    }

    showChainHint() {
        window.soundFx.playClick();
        const data = NUMBER_CHAINS_DATA[this.chainIndex];
        this.showInfoModal("💡 Petunjuk Diskusi Tim", data.hint);
    }

    // ----------------------------------------------------
    // GAME B: START CHAMP (Mencocokkan Konsep)
    // ----------------------------------------------------
    startStartChamp() {
        this.activeGame = 'matching';
        this.matchRound = 0;
        this.showScreen('screenStartChamp');
        window.soundFx.playStart();
        this.startTimer();
        this.renderMatchRound();
        this.broadcastMyStudentTeam();
    }

    renderMatchRound() {
        const startIndex = this.matchRound * 4;
        const roundItems = START_CHAMP_DATA.slice(startIndex, startIndex + 4);

        if (roundItems.length === 0) {
            this.showGameCompleteModal("🏆 Game B: Start Champ Selesai!", "Selamat! Semua konsep perpindahan & perubahan kalor berhasil dipasangkan.", () => {
                this.renderLobby();
            });
            return;
        }

        document.getElementById('matchProgressText').textContent = `Ronde ${this.matchRound + 1} dari 3 (Tantangan ${startIndex + 1}-${startIndex + roundItems.length})`;
        document.getElementById('matchProgressBar').style.width = `${((this.matchRound) / 3) * 100}%`;

        this.currentPairings = {};
        this.selectedScenarioId = null;
        document.getElementById('matchFeedback').innerHTML = '';
        document.getElementById('btnNextMatch').classList.add('hidden');
        document.getElementById('btnCheckMatch').classList.remove('hidden');

        // Render Scenarios
        const scenarioContainer = document.getElementById('matchScenariosContainer');
        scenarioContainer.innerHTML = '';
        roundItems.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'match-scenario-card';
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="card-visual-wrap">
                    ${item.iconSvg}
                </div>
                <div class="card-info-wrap">
                    <span class="category-tag">${item.category}</span>
                    <h4 class="scenario-title">${item.title}</h4>
                    <p class="scenario-desc">${item.scenario}</p>
                    <div class="paired-badge-slot" id="slot_${item.id}">
                        <span class="placeholder-text">Klik kartu ini lalu pilih konsep di samping 👉</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.soundFx.playClick();
                document.querySelectorAll('.match-scenario-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedScenarioId = item.id;
            });

            scenarioContainer.appendChild(card);
        });

        // Concepts
        const conceptContainer = document.getElementById('matchConceptsContainer');
        conceptContainer.innerHTML = '';
        const concepts = roundItems.map(i => i.correctConcept);
        this.shuffleArray(concepts);

        concepts.forEach((concept) => {
            const btn = document.createElement('button');
            btn.className = 'concept-choice-btn';
            btn.textContent = concept;
            btn.dataset.concept = concept;

            btn.addEventListener('click', () => {
                if (!this.selectedScenarioId) {
                    this.showToast("Pilih salah satu kartu peristiwa di sebelah kiri terlebih dahulu!");
                    window.soundFx.playWrong();
                    return;
                }

                window.soundFx.playClick();
                this.currentPairings[this.selectedScenarioId] = concept;
                
                const slot = document.getElementById(`slot_${this.selectedScenarioId}`);
                if (slot) {
                    slot.innerHTML = `
                        <span class="paired-tag">
                            🔗 ${concept}
                            <button class="btn-unpair" onclick="event.stopPropagation(); engine.unpairMatch('${this.selectedScenarioId}')">✕</button>
                        </span>
                    `;
                }

                this.updateConceptButtonsState();
            });

            conceptContainer.appendChild(btn);
        });

        this.updateConceptButtonsState();
        this.addPoints('matching', 0, `Game B (Ronde ${this.matchRound + 1}/3)`);
    }

    unpairMatch(scenarioId) {
        delete this.currentPairings[scenarioId];
        const slot = document.getElementById(`slot_${scenarioId}`);
        if (slot) {
            slot.innerHTML = `<span class="placeholder-text">Klik kartu ini lalu pilih konsep di samping 👉</span>`;
        }
        this.updateConceptButtonsState();
        window.soundFx.playClick();
    }

    updateConceptButtonsState() {
        const pairedValues = Object.values(this.currentPairings);
        document.querySelectorAll('.concept-choice-btn').forEach(btn => {
            if (pairedValues.includes(btn.dataset.concept)) {
                btn.classList.add('used');
            } else {
                btn.classList.remove('used');
            }
        });
    }

    checkMatchAnswer() {
        const startIndex = this.matchRound * 4;
        const roundItems = START_CHAMP_DATA.slice(startIndex, startIndex + 4);

        if (Object.keys(this.currentPairings).length < roundItems.length) {
            this.showToast("Silakan pasangkan semua 4 kartu peristiwa dengan konsep terlebih dahulu!");
            window.soundFx.playWrong();
            return;
        }

        let correctCount = 0;
        const feedbackDetails = [];

        roundItems.forEach(item => {
            const chosen = this.currentPairings[item.id];
            const isCorrect = (chosen === item.correctConcept);
            const cardEl = document.querySelector(`.match-scenario-card[data-id="${item.id}"]`);

            if (isCorrect) {
                correctCount++;
                if (cardEl) {
                    cardEl.classList.add('correct');
                    cardEl.classList.remove('incorrect');
                }
            } else {
                if (cardEl) {
                    cardEl.classList.add('incorrect');
                    cardEl.classList.remove('correct');
                }
            }

            feedbackDetails.push({
                title: item.title,
                chosen: chosen,
                correct: item.correctConcept,
                isCorrect: isCorrect,
                explanation: item.explanation
            });
        });

        const feedbackEl = document.getElementById('matchFeedback');

        if (correctCount === roundItems.length) {
            window.soundFx.playCorrect();
            this.addPoints('matching', 100, `Game B (Ronde ${this.matchRound + 1} Selesai)`);
            if (this.collabAgreed) this.addPoints('collaboration', 25);

            feedbackEl.innerHTML = `
                <div class="feedback-box success animate-bounce-in">
                    <div class="fb-icon">🎯</div>
                    <div class="fb-text">
                        <h4>LUAR BIASA! SEMUA PASANGAN TEPAT! (+100 Poin)</h4>
                        <p>Kelompok berhasil mengidentifikasi seluruh konsep kalor pada kehidupan nyata.</p>
                    </div>
                </div>
            `;

            document.getElementById('btnCheckMatch').classList.add('hidden');
            document.getElementById('btnNextMatch').classList.remove('hidden');

            setTimeout(() => {
                this.showMatchRoundExplanationModal(feedbackDetails);
            }, 600);
        } else {
            window.soundFx.playWrong();
            feedbackEl.innerHTML = `
                <div class="feedback-box error animate-shake">
                    <div class="fb-icon">⚠️</div>
                    <div class="fb-text">
                        <h4>${correctCount} dari ${roundItems.length} Pasangan Tepat</h4>
                        <p>Periksa kembali kartu yang bertanda merah. Diskusikan konsep perpindahan kalor yang relevan!</p>
                    </div>
                </div>
            `;
        }
    }

    nextMatchRound() {
        window.soundFx.playClick();
        this.matchRound++;
        if (this.matchRound < 3) {
            this.renderMatchRound();
        } else {
            this.showGameCompleteModal("🏆 Selesai Game B: Start Champ!", "Hebat sekali! 12 tantangan mencocokkan konsep kalor berhasil diselesaikan.", () => {
                this.renderLobby();
            });
        }
    }

    showMatchRoundExplanationModal(details) {
        const modal = document.getElementById('explanationModal');
        document.getElementById('modalExpTitle').textContent = `Pembahasan Konsep Ronde ${this.matchRound + 1}`;
        document.getElementById('modalExpSummary').textContent = "Berikut adalah ulasan ilmiah dari setiap peristiwa kalor yang dipasangkan:";

        const listEl = document.getElementById('modalExpKeyPoints');
        listEl.innerHTML = details.map(d => `
            <li style="margin-bottom: 12px;">
                <strong>${d.title}:</strong> Konsep tepat adalah <span class="badge-accent">${d.correct}</span>.<br>
                <small style="color:#cbd5e1">${d.explanation}</small>
            </li>
        `).join('');

        document.getElementById('modalExpFact').innerHTML = "<em>Kunci Sains:</em> Perhatikan apakah terjadi perpindahan materi partikel (konveksi), getaran partikel padat (konduksi), atau pancaran gelombang (radiasi)!";
        modal.classList.remove('hidden');
    }

    // ----------------------------------------------------
    // GAME C: CRYPTARITHM WAR
    // ----------------------------------------------------
    startCryptarithm() {
        this.activeGame = 'cryptarithm';
        this.cryptoIndex = 0;
        this.showScreen('screenCryptarithm');
        window.soundFx.playStart();
        this.startTimer();
        this.renderCryptoStage();
        this.broadcastMyStudentTeam();

        setTimeout(() => {
            const canvas = document.getElementById('scratchpadCanvas');
            if (canvas && window.scratchpad) {
                window.scratchpad.init(canvas);
            }
        }, 150);
    }

    renderCryptoStage() {
        const data = CRYPTARITHM_DATA[this.cryptoIndex];
        if (!data) {
            this.showGameCompleteModal("🏆 Game C: Cryptarithm War Selesai!", "Kalian adalah para juara logika dan perhitungan kalor CoC!", () => {
                this.renderLobby();
            });
            return;
        }

        document.getElementById('cryptoProgressText').textContent = `Teka-Teki ${this.cryptoIndex + 1} dari ${CRYPTARITHM_DATA.length}`;
        document.getElementById('cryptoProgressBar').style.width = `${((this.cryptoIndex) / CRYPTARITHM_DATA.length) * 100}%`;

        document.getElementById('cryptoTitle').textContent = data.title;
        document.getElementById('cryptoBadge').textContent = data.difficulty;
        document.getElementById('cryptoFormula').textContent = `Rumus: ${data.formula}`;
        document.getElementById('cryptoStory').textContent = data.story;

        const givensEl = document.getElementById('cryptoGivensList');
        givensEl.innerHTML = data.givens.map(g => `
            <div class="given-pill">
                <span class="given-label">${g.label}</span>
                <strong class="given-val">${g.value}</strong>
            </div>
        `).join('');

        document.getElementById('cryptoEquationDisplay').innerHTML = `<code>${data.puzzleDisplay}</code>`;

        const inputsContainer = document.getElementById('cryptoInputsContainer');
        inputsContainer.innerHTML = '';
        data.inputs.forEach((inp, idx) => {
            const group = document.createElement('div');
            group.className = 'crypto-input-group';
            group.innerHTML = `
                <label class="crypto-input-label">${inp.label}</label>
                <div class="input-unit-wrap">
                    <input type="text" 
                        class="crypto-digit-input ${inp.maxLength === 1 ? 'single-char' : ''}" 
                        id="input_${inp.id}" 
                        placeholder="${inp.placeholder}" 
                        maxlength="${inp.maxLength || 8}"
                        autocomplete="off">
                    ${inp.unit ? `<span class="unit-label">${inp.unit}</span>` : ''}
                </div>
            `;
            inputsContainer.appendChild(group);

            const inputEl = group.querySelector('input');
            inputEl.addEventListener('focus', () => {
                this.activeInputId = `input_${inp.id}`;
            });

            if (idx === 0) {
                this.activeInputId = `input_${inp.id}`;
                setTimeout(() => inputEl.focus(), 100);
            }
        });

        document.getElementById('cryptoFeedback').innerHTML = '';
        document.getElementById('btnNextCrypto').classList.add('hidden');
        document.getElementById('btnCheckCrypto').classList.remove('hidden');

        this.addPoints('cryptarithm', 0, `Game C (Soal ${this.cryptoIndex + 1}/6)`);
    }

    numpadInput(char) {
        if (!this.activeInputId) return;
        const input = document.getElementById(this.activeInputId);
        if (!input) return;

        window.soundFx.playClick();
        if (input.maxLength && input.value.length >= input.maxLength) {
            input.value = char;
        } else {
            input.value += char;
        }
    }

    numpadBackspace() {
        if (!this.activeInputId) return;
        const input = document.getElementById(this.activeInputId);
        if (!input) return;
        window.soundFx.playClick();
        input.value = input.value.slice(0, -1);
    }

    numpadClear() {
        if (!this.activeInputId) return;
        const input = document.getElementById(this.activeInputId);
        if (!input) return;
        window.soundFx.playClick();
        input.value = '';
    }

    checkCryptoAnswer() {
        const data = CRYPTARITHM_DATA[this.cryptoIndex];
        let allCorrect = true;

        data.inputs.forEach(inp => {
            const inputEl = document.getElementById(`input_${inp.id}`);
            const userVal = inputEl ? inputEl.value.trim().toLowerCase() : '';
            const expectedVal = inp.expected.trim().toLowerCase();

            if (userVal === expectedVal) {
                if (inputEl) {
                    inputEl.classList.add('correct');
                    inputEl.classList.remove('incorrect');
                }
            } else {
                allCorrect = false;
                if (inputEl) {
                    inputEl.classList.add('incorrect');
                    inputEl.classList.remove('correct');
                }
            }
        });

        const feedbackEl = document.getElementById('cryptoFeedback');

        if (allCorrect) {
            window.soundFx.playCorrect();
            this.addPoints('cryptarithm', 150, `Game C (Soal ${this.cryptoIndex + 1} Terpecahkan)`);
            if (this.collabAgreed) this.addPoints('collaboration', 25);

            feedbackEl.innerHTML = `
                <div class="feedback-box success animate-bounce-in">
                    <div class="fb-icon">⚡</div>
                    <div class="fb-text">
                        <h4>SOLUSI TEPAT! TEKA-TEKI TERPECAHKAN! (+150 Poin)</h4>
                        <p>Perhitungan dan deduksi logika kelompok sangat akurat!</p>
                    </div>
                </div>
            `;

            document.getElementById('btnCheckCrypto').classList.add('hidden');
            document.getElementById('btnNextCrypto').classList.remove('hidden');

            setTimeout(() => {
                this.showExplanationModal(
                    `Solusi: ${data.title}`,
                    data.keyConcept,
                    data.solutionSteps,
                    "Kunci Sukses Hitung Kalor: Selalu pastikan satuan massa (kg), kalor jenis (J/kg°C), dan suhu (°C) sudah seragam!"
                );
            }, 600);
        } else {
            window.soundFx.playWrong();
            feedbackEl.innerHTML = `
                <div class="feedback-box error animate-shake">
                    <div class="fb-icon">⚠️</div>
                    <div class="fb-text">
                        <h4>Angka Belum Tepat!</h4>
                        <p>Gunakan Kertas Cakar Digital untuk menghitung ulang atau berdiskusi bersama anggota kelompok.</p>
                    </div>
                </div>
            `;
        }
    }

    nextCryptoStage() {
        window.soundFx.playClick();
        this.cryptoIndex++;
        if (this.cryptoIndex < CRYPTARITHM_DATA.length) {
            this.renderCryptoStage();
        } else {
            this.showGameCompleteModal("🏆 Selesai Game C: Cryptarithm War!", "Kalian resmi dinobatkan sebagai Ahli Perhitungan Kalor!", () => {
                this.renderLobby();
            });
        }
    }

    showCryptoHint() {
        window.soundFx.playClick();
        const data = CRYPTARITHM_DATA[this.cryptoIndex];
        this.showInfoModal("💡 Petunjuk Hitungan", data.hint);
    }

    // ----------------------------------------------------
    // PROTOKOL KOLABORASI
    // ----------------------------------------------------
    openCollaborationModal() {
        window.soundFx.playClick();
        const modal = document.getElementById('collabModal');
        const team = this.myStudentTeam;

        document.getElementById('collabTeamName').textContent = team.name;
        document.getElementById('collabMembersList').innerHTML = team.members.map(m => `
            <div class="collab-member-item">
                <span class="role-icon">${this.getRoleIcon(m.role)}</span>
                <div>
                    <strong>${m.name}</strong>
                    <div class="role-text">${this.getRoleLabel(m.role)}</div>
                </div>
            </div>
        `).join('');

        modal.classList.remove('hidden');
    }

    confirmCollaboration() {
        window.soundFx.playCorrect();
        this.collabAgreed = true;
        document.getElementById('collabModal').classList.add('hidden');
        this.showToast("🤝 Kesepakatan Tim Terkunci! Bonus Kolaborasi aktif!");

        const banner = document.getElementById('collabStatusBanner');
        if (banner) {
            banner.innerHTML = `✅ <strong>Kesepakatan Tim Siap!</strong> Seluruh anggota telah menyetujui jawaban ini.`;
            banner.classList.add('agreed');
        }
    }

    resetCollaborationConsent() {
        this.collabAgreed = false;
        const banner = document.getElementById('collabStatusBanner');
        if (banner) {
            banner.innerHTML = `⏳ <strong>Konsensus Tim:</strong> Diskusikan jawaban bersama tim sebelum memeriksa!`;
            banner.classList.remove('agreed');
        }
    }

    // ----------------------------------------------------
    // MODALS & NOTIFICATIONS
    // ----------------------------------------------------
    showExplanationModal(title, summary, keyPoints, didYouKnow) {
        const modal = document.getElementById('explanationModal');
        document.getElementById('modalExpTitle').textContent = title;
        document.getElementById('modalExpSummary').textContent = summary;

        const listEl = document.getElementById('modalExpKeyPoints');
        listEl.innerHTML = keyPoints.map(p => `<li>${p}</li>`).join('');

        document.getElementById('modalExpFact').innerHTML = didYouKnow ? `<em>Fakta Sains:</em> ${didYouKnow}` : '';
        modal.classList.remove('hidden');
    }

    closeExplanationModal() {
        window.soundFx.playClick();
        document.getElementById('explanationModal').classList.add('hidden');
    }

    showInfoModal(title, text) {
        const modal = document.getElementById('infoModal');
        document.getElementById('infoModalTitle').textContent = title;
        document.getElementById('infoModalBody').innerHTML = `<p>${text}</p>`;
        modal.classList.remove('hidden');
    }

    closeInfoModal() {
        window.soundFx.playClick();
        document.getElementById('infoModal').classList.add('hidden');
    }

    showGameCompleteModal(title, message, onDone) {
        window.soundFx.playFanfare();
        this.triggerConfetti();

        const modal = document.getElementById('completeModal');
        document.getElementById('completeModalTitle').textContent = title;
        document.getElementById('completeModalMessage').textContent = message;

        const btn = document.getElementById('btnCompleteDone');
        btn.onclick = () => {
            modal.classList.add('hidden');
            if (onDone) onDone();
        };

        modal.classList.remove('hidden');
    }

    showToast(message) {
        const toast = document.getElementById('gameToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2600);
    }

    // ----------------------------------------------------
    // FINAL PODIUM & RECAP
    // ----------------------------------------------------
    showFinalPodium() {
        this.activeGame = null;
        this.stopTimer();
        this.showScreen('screenPodium');
        window.soundFx.playFanfare();
        this.triggerConfetti();

        // Gunakan allRoomTeams jika ada, jika belum gunakan tim lokal
        const teamsToSort = (this.allRoomTeams.length > 0) ? this.allRoomTeams : [this.myStudentTeam];
        const sortedTeams = [...teamsToSort].sort((a, b) => b.totalScore - a.totalScore);
        const podiumContainer = document.getElementById('podiumRankings');
        
        podiumContainer.innerHTML = sortedTeams.map((team, rank) => {
            const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '⭐ Finalis'];
            const medalClass = ['rank-1', 'rank-2', 'rank-3', 'rank-4'][rank] || 'rank-4';
            return `
                <div class="podium-card ${medalClass}">
                    <div class="podium-badge">${medals[rank]}</div>
                    <h3 class="podium-team-name">${team.name}</h3>
                    <div class="podium-score-highlight">${team.totalScore} <span>Poin</span></div>
                    <div class="podium-score-breakdown">
                        <div class="score-row"><span>Rantai Peristiwa:</span> <strong>${team.scores ? team.scores.chains : 0} pt</strong></div>
                        <div class="score-row"><span>Mencocokkan Konsep:</span> <strong>${team.scores ? team.scores.matching : 0} pt</strong></div>
                        <div class="score-row"><span>Kriptaritma Kalor:</span> <strong>${team.scores ? team.scores.cryptarithm : 0} pt</strong></div>
                        <div class="score-row"><span>Bonus Kolaborasi:</span> <strong>${team.scores ? team.scores.collaboration : 0} pt</strong></div>
                    </div>
                    <div class="podium-members">
                        ${team.members && Array.isArray(team.members) ? team.members.map(m => `<span>${this.getRoleIcon(m.role)} ${m.name}</span>`).join(' • ') : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    printCertificate() {
        window.soundFx.playClick();
        window.print();
    }

    triggerConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#3b82f6', '#facc15'];

        for (let i = 0; i < 120; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 4 + 3,
                speedX: (Math.random() - 0.5) * 4,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 6
            });
        }

        let animationFrame;
        const startTime = Date.now();

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            if (Date.now() - startTime < 4500) {
                animationFrame = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrame);
            }
        };

        render();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        const btnFullscreen = document.getElementById('btnToggleFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                window.soundFx.playClick();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    btnFullscreen.textContent = '⤓ Normal';
                } else {
                    document.exitFullscreen().catch(() => {});
                    btnFullscreen.textContent = '⤢ Layar Penuh';
                }
            });
        }

        const btnSound = document.getElementById('btnToggleSound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const isMuted = window.soundFx.toggleMute();
                btnSound.textContent = isMuted ? '🔇 Bisu' : '🔊 Suara';
                btnSound.classList.toggle('muted', isMuted);
            });
        }

        const btnScratch = document.getElementById('btnToggleScratchpad');
        const scratchDrawer = document.getElementById('scratchpadDrawer');
        if (btnScratch && scratchDrawer) {
            btnScratch.addEventListener('click', () => {
                window.soundFx.playClick();
                scratchDrawer.classList.toggle('open');
                if (scratchDrawer.classList.contains('open') && window.scratchpad) {
                    setTimeout(() => window.scratchpad.resize(), 100);
                }
            });
        }

        const btnCloseScratch = document.getElementById('btnCloseScratchpad');
        if (btnCloseScratch && scratchDrawer) {
            btnCloseScratch.addEventListener('click', () => {
                window.soundFx.playClick();
                scratchDrawer.classList.remove('open');
            });
        }
    }
}

window.engine = new CoCGameEngine();
window.addEventListener('DOMContentLoaded', () => {
    window.engine.init();
});
