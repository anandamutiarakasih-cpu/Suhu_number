/**
 * Firebase Realtime Database Live Classroom Sync
 * Mendukung 2 Role: Guru (Admin Proyektor) & Siswa (1 HP per Kelompok)
 * Database: https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/
 */

class FirebaseLiveSync {
    constructor() {
        this.databaseURL = "https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app";
        this.projectId = "suhunumber";
        this.roomCode = "COC-7A";
        this.app = null;
        this.db = null;
        this.isConnected = false;
        this.currentRoomRef = null;
    }

    init() {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK offline.');
            return;
        }

        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp({
                    databaseURL: this.databaseURL,
                    projectId: this.projectId
                });
            } else {
                this.app = firebase.app();
            }

            this.db = firebase.database();

            // Cek URL params jika ada ?room=KODE
            const urlParams = new URLSearchParams(window.location.search);
            const roomParam = urlParams.get('room');
            if (roomParam) {
                this.roomCode = roomParam.toUpperCase().trim();
            } else {
                const savedRoom = localStorage.getItem('coc_active_room');
                if (savedRoom) this.roomCode = savedRoom.toUpperCase().trim();
            }

            // Monitor status koneksi ke server Firebase
            const connectedRef = this.db.ref(".info/connected");
            connectedRef.on("value", (snap) => {
                this.isConnected = (snap.val() === true);
                if (window.engine) {
                    window.engine.updateLiveConnectionUI(this.isConnected);
                }
            });

            this.listenToRoom(this.roomCode);
        } catch (err) {
            console.error('Firebase auto-connect error:', err);
        }
    }

    setRoom(newCode) {
        if (!newCode) return;
        this.roomCode = newCode.toUpperCase().trim();
        try {
            localStorage.setItem('coc_active_room', this.roomCode);
        } catch (e) {}

        this.listenToRoom(this.roomCode);
    }

    listenToRoom(roomCode) {
        if (!this.db) return;
        this.roomCode = roomCode.toUpperCase().trim();

        if (this.currentRoomRef) {
            this.currentRoomRef.off();
        }

        this.currentRoomRef = this.db.ref(`coc_rooms/${this.roomCode}`);
        this.currentRoomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.teams) {
                if (window.engine) {
                    window.engine.syncTeamsFromCloud(data.teams, data.phase);
                }
            }
        }, (err) => {
            console.warn('Notice Firebase RTDB:', err.message);
        });
    }

    // Siswa mendaftarkan kelompoknya ke Room guru
    registerTeamOnCloud(team) {
        if (!this.db || !team || !team.id) return;
        const teamRef = this.db.ref(`coc_rooms/${this.roomCode}/teams/${team.id}`);
        teamRef.set({
            ...team,
            lastUpdated: Date.now()
        }).catch(err => console.warn('Gagal register tim ke cloud:', err));
    }

    // Siswa memperbarui skor kelompok setelah menjawab
    updateTeamScoreOnCloud(teamId, scores, totalScore, currentProgress) {
        if (!this.db || !teamId) return;
        const teamRef = this.db.ref(`coc_rooms/${this.roomCode}/teams/${teamId}`);
        teamRef.update({
            scores: scores,
            totalScore: totalScore,
            currentProgress: currentProgress || "Bermain",
            lastUpdated: Date.now()
        }).catch(err => console.warn('Gagal update skor ke cloud:', err));
    }

    // Guru mengontrol fase game secara global (opsional)
    broadcastGamePhase(phase) {
        if (!this.db) return;
        this.db.ref(`coc_rooms/${this.roomCode}/phase`).set(phase).catch(() => {});
    }

    // Guru mereset sesi room
    resetRoomOnCloud() {
        if (!this.db) return;
        this.db.ref(`coc_rooms/${this.roomCode}/teams`).remove().catch(() => {});
    }

    generateRandomCode() {
        const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const nums = "23456789";
        let code = "COC-";
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        code += nums.charAt(Math.floor(Math.random() * nums.length));
        return code;
    }
}

window.firebaseSync = new FirebaseLiveSync();
