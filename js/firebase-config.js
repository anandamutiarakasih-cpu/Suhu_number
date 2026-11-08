/**
 * Firebase Realtime Database & Live Sync Manager
 * Mendukung sinkronisasi skor dan sesi kelas secara live antarperangkat (Laptop Guru / Proyektor & HP/Laptop Siswa)
 */

class FirebaseLiveSync {
    constructor() {
        this.app = null;
        this.db = null;
        this.isConnected = false;
        this.roomCode = "COC-KALOR-7A";
        this.isHost = true;
        this.unsubscribeRoom = null;

        // Default Firebase Config placeholder
        // Pengguna / Guru dapat memperbarui config ini lewat modal pengaturan di aplikasi
        this.config = this.loadStoredConfig() || {
            apiKey: "",
            authDomain: "",
            databaseURL: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: ""
        };
    }

    loadStoredConfig() {
        try {
            const saved = localStorage.getItem('coc_firebase_config');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('Gagal membaca saved Firebase config:', e);
        }
        return null;
    }

    saveConfig(newConfig) {
        this.config = newConfig;
        try {
            localStorage.setItem('coc_firebase_config', JSON.stringify(newConfig));
        } catch (e) {}
    }

    init() {
        // Cek apakah SDK Firebase sudah dimuat
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK belum aktif atau offline.');
            this.updateStatusBadge(false, "Mode Lokal (Offline)");
            return;
        }

        if (!this.config || !this.config.apiKey || !this.config.databaseURL) {
            this.updateStatusBadge(false, "Firebase Belum Dikonfigurasi");
            return;
        }

        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(this.config);
            } else {
                this.app = firebase.app();
            }

            this.db = firebase.database();
            this.isConnected = true;
            this.updateStatusBadge(true, `Live Sync: ${this.roomCode}`);
            this.listenToRoom(this.roomCode);
            console.log('Firebase Realtime Database berhasil terhubung!');
        } catch (err) {
            console.error('Koneksi Firebase gagal:', err);
            this.isConnected = false;
            this.updateStatusBadge(false, "Gagal Konek Firebase");
        }
    }

    updateStatusBadge(connected, text) {
        const badge = document.getElementById('firebaseStatusBadge');
        if (!badge) return;
        badge.innerHTML = `
            <span class="fb-dot ${connected ? 'connected' : 'disconnected'}"></span>
            <span>${text}</span>
        `;
    }

    listenToRoom(roomCode) {
        if (!this.isConnected || !this.db) return;
        this.roomCode = roomCode.toUpperCase().trim();

        const roomRef = this.db.ref(`coc_rooms/${this.roomCode}`);
        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.teams && !this.isBroadcasting) {
                // Sinkronisasi data tim dari cloud
                if (window.engine) {
                    window.engine.syncFromFirebase(data.teams);
                }
            }
        });
    }

    broadcastTeams(teams) {
        if (!this.isConnected || !this.db) return;
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
            .catch(err => {
                console.error('Gagal broadcast skor:', err);
                this.isBroadcasting = false;
            });
    }

    logEvent(message) {
        if (!this.isConnected || !this.db) return;
        const logRef = this.db.ref(`coc_rooms/${this.roomCode}/logs`).push();
        logRef.set({
            message: message,
            timestamp: Date.now()
        });
    }
}

window.firebaseSync = new FirebaseLiveSync();
