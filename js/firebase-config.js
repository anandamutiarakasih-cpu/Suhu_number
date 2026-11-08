/**
 * Firebase Realtime Database Live Classroom Sync
 * Otomatis terhubung ke: https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/
 */

class FirebaseLiveSync {
    constructor() {
        this.databaseURL = "https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app";
        this.projectId = "suhunumber";
        this.roomCode = "COC-7A"; // Default room code yang mudah diucapkan di kelas
        this.app = null;
        this.db = null;
        this.isConnected = false;
        this.isBroadcasting = false;
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
                this.updateUIStatus();
            });

            // Langsung dengarkan room aktif
            this.listenToRoom(this.roomCode);
        } catch (err) {
            console.error('Firebase auto-connect error:', err);
        }
    }

    updateUIStatus() {
        // Update badge siswa & guru
        const codeDisplays = document.querySelectorAll('.active-room-display');
        codeDisplays.forEach(el => el.textContent = this.roomCode);

        const statusDot = document.getElementById('liveStatusDot');
        if (statusDot) {
            statusDot.className = `live-dot ${this.isConnected ? 'online' : 'offline'}`;
        }
    }

    setRoom(newCode) {
        if (!newCode) return;
        this.roomCode = newCode.toUpperCase().trim();
        try {
            localStorage.setItem('coc_active_room', this.roomCode);
        } catch (e) {}

        this.listenToRoom(this.roomCode);
        this.updateUIStatus();
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
            if (data && data.teams && !this.isBroadcasting) {
                if (window.engine) {
                    window.engine.syncFromFirebase(data.teams);
                }
            }
        }, (err) => {
            console.warn('Notice Firebase RTDB:', err.message);
        });
    }

    broadcastTeams(teams) {
        if (!this.db) return;
        this.isBroadcasting = true;

        const payload = {
            roomCode: this.roomCode,
            updatedAt: Date.now(),
            teams: teams
        };

        this.db.ref(`coc_rooms/${this.roomCode}`).set(payload)
            .then(() => {
                this.isBroadcasting = false;
            })
            .catch(() => {
                this.isBroadcasting = false;
            });
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
