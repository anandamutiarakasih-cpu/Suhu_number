/**
 * Firebase Realtime Database & Live Sync Manager
 * Database: https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/
 */

class FirebaseLiveSync {
    constructor() {
        this.app = null;
        this.db = null;
        this.isConnected = false;
        this.roomCode = "COC-KALOR-7A";
        this.isBroadcasting = false;

        // Default konfigurasi Firebase terhubung langsung ke database suhunumber
        this.defaultConfig = {
            databaseURL: "https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "suhunumber"
        };

        this.config = this.loadStoredConfig() || this.defaultConfig;
    }

    loadStoredConfig() {
        try {
            const saved = localStorage.getItem('coc_firebase_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.databaseURL) return parsed;
            }
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
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK belum aktif atau offline.');
            this.updateStatusBadge(false, "Mode Lokal (Offline)");
            return;
        }

        const dbUrl = this.config.databaseURL || this.defaultConfig.databaseURL;

        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp({
                    databaseURL: dbUrl,
                    projectId: this.config.projectId || "suhunumber",
                    apiKey: this.config.apiKey || undefined
                });
            } else {
                this.app = firebase.app();
            }

            this.db = firebase.database();
            
            // Monitor status koneksi internal Firebase
            const connectedRef = this.db.ref(".info/connected");
            connectedRef.on("value", (snap) => {
                if (snap.val() === true) {
                    this.isConnected = true;
                    this.updateStatusBadge(true, `Live: ${this.roomCode}`);
                    console.log('Terhubung ke Firebase Realtime Database!');
                } else {
                    this.isConnected = false;
                    this.updateStatusBadge(false, `Menghubungkan: ${this.roomCode}...`);
                }
            });

            this.listenToRoom(this.roomCode);
        } catch (err) {
            console.error('Koneksi Firebase gagal diinisialisasi:', err);
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
        if (!this.db) return;
        this.roomCode = (roomCode || "COC-KALOR-7A").toUpperCase().trim();

        // Lepas listener lama jika ada
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
        }, (error) => {
            console.warn('Firebase RTDB listener notice:', error);
            if (error.code === 'PERMISSION_DENIED') {
                this.updateStatusBadge(false, "Aturan Firebase Terkunci");
                if (window.engine) {
                    window.engine.showToast("⚠️ Firebase: Ubah Rules ke Read/Write: true di Firebase Console");
                }
            }
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
                this.updateStatusBadge(true, `Live: ${this.roomCode}`);
            })
            .catch(err => {
                console.warn('Gagal broadcast skor:', err);
                this.isBroadcasting = false;
                if (err.code === 'PERMISSION_DENIED') {
                    this.updateStatusBadge(false, "Aturan Firebase Terkunci");
                }
            });
    }

    logEvent(message) {
        if (!this.db) return;
        const logRef = this.db.ref(`coc_rooms/${this.roomCode}/logs`).push();
        logRef.set({
            message: message,
            timestamp: Date.now()
        });
    }
}

window.firebaseSync = new FirebaseLiveSync();
