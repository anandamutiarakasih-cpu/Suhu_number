/**
 * Clash of Champions - Kalor Game Engine
 * Mengelola state permainan, multi-tim, sistem poin, alur permainan, dan sinkronisasi Firebase Live
 */

class CoCGameEngine {
    constructor() {
        this.teams = [
            {
                id: 1,
                name: "Tim Joule",
                color: "#f59e0b",
                members: [
                    { name: "Siswa 1", role: "spokesperson" },
                    { name: "Siswa 2", role: "concept" },
                    { name: "Siswa 3", role: "math" },
                    { name: "Siswa 4", role: "verifier" }
                ],
                scores: {
                    chains: 0,
                    matching: 0,
                    cryptarithm: 0,
                    collaboration: 0
                },
                totalScore: 0
            }
        ];
        this.currentTeamIndex = 0;
        this.activeGame = null; // 'chains', 'matching', 'cryptarithm'
        
        // Game A state (Number Chains)
        this.chainIndex = 0;
        this.currentChainItems = [];
        this.draggedItemIndex = null;

        // Game B state (Start Champ)
        this.matchRound = 0; // 0, 1, 2 (4 items per round = 12 items)
        this.selectedScenarioId = null;
        this.currentPairings = {}; // scenarioId -> concept string

        // Game C state (Cryptarithm)
        this.cryptoIndex = 0;
        this.activeInputId = null;

        // Timer
        this.timerSeconds = 0;
        this.timerInterval = null;

        // Collaboration status
        this.collabAgreed = false;
    }

    init() {
        this.checkUrlRoomCode();
        this.setupEventListeners();
        this.updateTeamsUI();
        this.renderLobby();

        // Inisialisasi Firebase Live Sync
        if (window.firebaseSync) {
            window.firebaseSync.init();
        }
    }

    checkUrlRoomCode() {
        try {
            const params = new URLSearchParams(window.location.search);
            const room = params.get('room');
            if (room && window.firebaseSync) {
                window.firebaseSync.roomCode = room.toUpperCase();
            }
        } catch (e) {}
    }

    getCurrentTeam() {
        return this.teams[this.currentTeamIndex] || this.teams[0];
    }

    addTeam(name = "") {
        if (this.teams.length >= 4) return;
        const colors = ["#f59e0b", "#06b6d4", "#a855f7", "#10b981"];
        const defaultNames = ["Tim Joule", "Tim Kelvin", "Tim Celsius", "Tim Newton"];
        const newIndex = this.teams.length;
        this.teams.push({
            id: newIndex + 1,
            name: name || defaultNames[newIndex] || `Tim ${newIndex + 1}`,
            color: colors[newIndex % colors.length],
            members: [
                { name: `Anggota 1`, role: "spokesperson" },
                { name: `Anggota 2`, role: "concept" },
                { name: `Anggota 3`, role: "math" },
                { name: `Anggota 4`, role: "verifier" }
            ],
            scores: { chains: 0, matching: 0, cryptarithm: 0, collaboration: 0 },
            totalScore: 0
        });
        this.updateTeamsUI();
        this.broadcastLive();
    }

    removeTeam(index) {
        if (this.teams.length <= 1) return;
        this.teams.splice(index, 1);
        if (this.currentTeamIndex >= this.teams.length) {
            this.currentTeamIndex = 0;
        }
        this.updateTeamsUI();
        this.broadcastLive();
    }

    updateTeamsUI() {
        const teamContainer = document.getElementById('teamSetupList');
        if (!teamContainer) return;

        teamContainer.innerHTML = '';
        this.teams.forEach((team, tIdx) => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-setup-card';
            teamCard.style.borderColor = team.color;
            teamCard.innerHTML = `
                <div class="team-card-header">
                    <div class="team-title-wrap">
                        <span class="team-color-dot" style="background:${team.color}"></span>
                        <input type="text" class="team-name-input" value="${team.name}" data-team="${tIdx}" placeholder="Nama Kelompok">
                    </div>
                    ${this.teams.length > 1 ? `<button class="btn-remove-team" onclick="engine.removeTeam(${tIdx})" title="Hapus Tim">✕</button>` : ''}
                </div>
                <div class="team-members-grid">
                    ${team.members.map((m, mIdx) => `
                        <div class="member-input-row">
                            <span class="role-badge ${m.role}">
                                ${this.getRoleIcon(m.role)} ${this.getRoleLabel(m.role)}
                            </span>
                            <input type="text" class="member-name-input" 
                                value="${m.name}" 
                                placeholder="Nama Siswa ${mIdx+1}"
                                onchange="engine.updateMemberName(${tIdx}, ${mIdx}, this.value)">
                        </div>
                    `).join('')}
                </div>
            `;
            teamContainer.appendChild(teamCard);
        });

        // Add event listeners to team name inputs
        document.querySelectorAll('.team-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.team);
                this.teams[idx].name = e.target.value.trim() || `Tim ${idx+1}`;
                this.updateScoreboards();
                this.broadcastLive();
            });
        });

        this.updateScoreboards();
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

    updateMemberName(teamIdx, memberIdx, name) {
        if (this.teams[teamIdx] && this.teams[teamIdx].members[memberIdx]) {
            this.teams[teamIdx].members[memberIdx].name = name.trim() || `Siswa ${memberIdx+1}`;
            this.broadcastLive();
        }
    }

    updateScoreboards() {
        // Update top bar team info
        const curTeam = this.getCurrentTeam();
        const curTeamEl = document.getElementById('topActiveTeam');
        if (curTeamEl && curTeam) {
            curTeamEl.innerHTML = `
                <span class="active-team-indicator" style="background:${curTeam.color}"></span>
                <span class="active-team-name">${curTeam.name}</span>
            `;
        }

        const scoreEl = document.getElementById('topTeamScore');
        if (scoreEl && curTeam) {
            scoreEl.textContent = `${curTeam.totalScore} Poin`;
        }

        // Update multi-team tab if multiple teams
        const multiTeamBar = document.getElementById('multiTeamBar');
        if (multiTeamBar) {
            if (this.teams.length > 1) {
                multiTeamBar.classList.remove('hidden');
                multiTeamBar.innerHTML = this.teams.map((t, idx) => `
                    <button class="team-tab-btn ${idx === this.currentTeamIndex ? 'active' : ''}" 
                        style="border-color:${t.color}" 
                        onclick="engine.switchTeam(${idx})">
                        <span class="tab-dot" style="background:${t.color}"></span>
                        <span>${t.name}</span>
                        <strong class="tab-score">${t.totalScore} pt</strong>
                    </button>
                `).join('');
            } else {
                multiTeamBar.classList.add('hidden');
            }
        }
    }

    switchTeam(index) {
        if (index >= 0 && index < this.teams.length) {
            this.currentTeamIndex = index;
            window.soundFx.playClick();
            this.updateScoreboards();
            if (this.activeGame === 'chains') this.renderChainStage();
            if (this.activeGame === 'matching') this.renderMatchRound();
            if (this.activeGame === 'cryptarithm') this.renderCryptoStage();
        }
    }

    addPoints(category, points) {
        const team = this.getCurrentTeam();
        if (!team) return;
        team.scores[category] += points;
        team.totalScore = team.scores.chains + team.scores.matching + team.scores.cryptarithm + team.scores.collaboration;
        this.updateScoreboards();
        this.broadcastLive();
    }

    broadcastLive() {
        if (window.firebaseSync && window.firebaseSync.isConnected) {
            window.firebaseSync.broadcastTeams(this.teams);
        }
    }

    syncFromFirebase(remoteTeams) {
        if (!remoteTeams || !Array.isArray(remoteTeams)) return;
        this.teams = remoteTeams;
        this.updateScoreboards();
        if (this.activeGame === null) {
            this.updateTeamsUI();
        }
        this.showToast("⚡ Skor sinkron live via Firebase!");
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

    // Screen Navigation
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
        this.updateScoreboards();
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
    }

    renderChainStage() {
        const data = NUMBER_CHAINS_DATA[this.chainIndex];
        if (!data) {
            this.showGameCompleteModal("Game A: Number Chains Selesai!", "Selamat! Tim berhasil menyelesaikan seluruh rantai peristiwa kalor dengan sangat baik.", () => {
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

        // Shuffle cards
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

            // Drag and drop listeners
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
            this.addPoints('chains', 100);
            
            if (this.collabAgreed) {
                this.addPoints('collaboration', 25);
            }

            feedbackEl.innerHTML = `
                <div class="feedback-box success animate-bounce-in">
                    <div class="fb-icon">🎉</div>
                    <div class="fb-text">
                        <h4>URUTAN SEMPURNA! (+100 Poin ${this.collabAgreed ? '+ 25 Bonus Kolaborasi' : ''})</h4>
                        <p>Kelompok berhasil menata seluruh tahapan kalor dengan sangat presisi!</p>
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
                        <p>Perhatikan kartu bertanda merah. Diskusikan kembali bersama anggota kelompok untuk memperbaiki urutannya!</p>
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
            this.showGameCompleteModal("🏆 Selesai Game A: Number Chains!", "Luar biasa! Rantai peristiwa kalor berhasil dituntaskan.", () => {
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
            this.addPoints('matching', 100);
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
                        <p>Periksa kembali kartu yang bertanda merah. Diskusikan konsep perpindahan kalor yang paling relevan!</p>
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

        document.getElementById('modalExpFact').innerHTML = "<em>Kunci Sains:</em> Perhatikan apakah terjadi perpindahan materi partikel (konveksi), getaran antarpartikel padat (konduksi), atau pancaran gelombang (radiasi)!";
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

        // Initialize scratchpad canvas
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

        // Givens
        const givensEl = document.getElementById('cryptoGivensList');
        givensEl.innerHTML = data.givens.map(g => `
            <div class="given-pill">
                <span class="given-label">${g.label}</span>
                <strong class="given-val">${g.value}</strong>
            </div>
        `).join('');

        // Math Puzzle Box
        document.getElementById('cryptoEquationDisplay').innerHTML = `<code>${data.puzzleDisplay}</code>`;

        // Input slots
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
            this.addPoints('cryptarithm', 150);
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
                    "Kunci Sukses Hitung Kalor: Selalu pastikan satuan massa (kg), kalor jenis (J/kg°C), dan perubahan suhu (°C) sudah seragam!"
                );
            }, 600);
        } else {
            window.soundFx.playWrong();
            feedbackEl.innerHTML = `
                <div class="feedback-box error animate-shake">
                    <div class="fb-icon">⚠️</div>
                    <div class="fb-text">
                        <h4>Angka Belum Tepat!</h4>
                        <p>Gunakan Kertas Cakar Digital untuk menghitung ulang atau klik tombol Petunjuk untuk berdiskusi bersama tim.</p>
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
    // COLLABORATION PROTOCOL
    // ----------------------------------------------------
    openCollaborationModal() {
        window.soundFx.playClick();
        const modal = document.getElementById('collabModal');
        const team = this.getCurrentTeam();
        if (!team) return;

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
    // FIREBASE LIVE MODAL
    // ----------------------------------------------------
    openFirebaseModal() {
        window.soundFx.playClick();
        const modal = document.getElementById('firebaseModal');
        if (!modal) return;

        const currentRoom = window.firebaseSync ? window.firebaseSync.roomCode : "COC-KALOR-7A";
        document.getElementById('fbRoomInput').value = currentRoom;

        const currentCfg = window.firebaseSync ? window.firebaseSync.config : {};
        if (currentCfg && currentCfg.apiKey) {
            document.getElementById('fbConfigInput').value = JSON.stringify(currentCfg, null, 2);
        }

        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom}`;
        document.getElementById('fbShareLink').value = shareUrl;

        modal.classList.remove('hidden');
    }

    closeFirebaseModal() {
        window.soundFx.playClick();
        document.getElementById('firebaseModal').classList.add('hidden');
    }

    saveFirebaseConfig() {
        const roomInput = document.getElementById('fbRoomInput').value.trim();
        const cfgText = document.getElementById('fbConfigInput').value.trim();

        if (window.firebaseSync) {
            if (roomInput) {
                window.firebaseSync.roomCode = roomInput.toUpperCase();
            }

            if (cfgText) {
                try {
                    const parsed = JSON.parse(cfgText);
                    window.firebaseSync.saveConfig(parsed);
                    window.firebaseSync.init();
                    this.showToast("🔥 Konfigurasi Firebase tersimpan!");
                } catch (e) {
                    alert("Format JSON konfigurasi Firebase tidak valid!");
                    return;
                }
            } else {
                window.firebaseSync.listenToRoom(window.firebaseSync.roomCode);
            }
        }

        this.closeFirebaseModal();
        this.updateScoreboards();
    }

    copyShareLink() {
        const shareInput = document.getElementById('fbShareLink');
        if (shareInput) {
            shareInput.select();
            navigator.clipboard.writeText(shareInput.value).then(() => {
                this.showToast("📋 Link Room berhasil disalin ke clipboard!");
                window.soundFx.playClick();
            }).catch(() => {
                this.showToast("Pilih dan salin teks link manual.");
            });
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

        const sortedTeams = [...this.teams].sort((a, b) => b.totalScore - a.totalScore);
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
                        <div class="score-row"><span>Rantai Peristiwa:</span> <strong>${team.scores.chains} pt</strong></div>
                        <div class="score-row"><span>Mencocokkan Konsep:</span> <strong>${team.scores.matching} pt</strong></div>
                        <div class="score-row"><span>Kriptaritma Kalor:</span> <strong>${team.scores.cryptarithm} pt</strong></div>
                        <div class="score-row"><span>Bonus Kolaborasi:</span> <strong>${team.scores.collaboration} pt</strong></div>
                    </div>
                    <div class="podium-members">
                        ${team.members.map(m => `<span>${this.getRoleIcon(m.role)} ${m.name}</span>`).join(' • ')}
                    </div>
                </div>
            `;
        }).join('');
    }

    printCertificate() {
        window.soundFx.playClick();
        window.print();
    }

    // ----------------------------------------------------
    // CONFETTI EFFECT
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // UTILITIES
    // ----------------------------------------------------
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    setupEventListeners() {
        // Fullscreen toggle
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

        // Sound toggle
        const btnSound = document.getElementById('btnToggleSound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                const isMuted = window.soundFx.toggleMute();
                btnSound.textContent = isMuted ? '🔇 Bisu' : '🔊 Suara';
                btnSound.classList.toggle('muted', isMuted);
            });
        }

        // Toggle scratchpad whiteboard
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

// Global Game Engine Instance
window.engine = new CoCGameEngine();
window.addEventListener('DOMContentLoaded', () => {
    window.engine.init();
});
