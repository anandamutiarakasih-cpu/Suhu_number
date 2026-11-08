/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Firebase Service & Realtime Synchronization Engine
 * Dual-Sync: Firebase RTDB + Global Cloud Relay (SSE/REST) + BroadcastChannel + LocalStorage
 */

import { firebaseConfig } from '../config/firebase-config.js';
import { getPredicate } from '../data/predicates.js';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.isFirebaseReady = false;
    this.isOnline = false;
    this.serverTimeOffset = 0;
    this.broadcast = null;
    this.listeners = new Map();
    this.activeSSE = new Map();

    this.initBroadcastChannel();
    this.initFirebase();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcast = new BroadcastChannel('suhu_number_champions');
        this.broadcast.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }
  }

  async initFirebase() {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const { getDatabase, ref, onValue, set, update, get } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
      const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

      this.app = initializeApp(firebaseConfig);
      this.db = firebaseConfig.databaseURL ? getDatabase(this.app, firebaseConfig.databaseURL) : getDatabase(this.app);
      this.auth = getAuth(this.app);
      this.fbRef = ref;
      this.fbOnValue = onValue;
      this.fbSet = set;
      this.fbUpdate = update;
      this.fbGet = get;

      try {
        await signInAnonymously(this.auth);
      } catch (authErr) {
        console.info('ℹ️ Firebase Anonymous Auth notice: sinkronisasi berjalan via RTDB rules langsung.');
      }

      // Server time offset
      const offsetRef = ref(this.db, '.info/serverTimeOffset');
      onValue(offsetRef, (snap) => {
        this.serverTimeOffset = snap.val() || 0;
      });

      // Connection status
      const connRef = ref(this.db, '.info/connected');
      onValue(connRef, (snap) => {
        const val = snap.val();
        this.isOnline = !!val;
        console.log(val ? '🟢 Firebase RTDB Online: ' + firebaseConfig.databaseURL : '🟠 Firebase RTDB Connecting...');
      });

      this.isFirebaseReady = true;
    } catch (err) {
      console.warn('⚠️ Firebase initial connection note (falling back to Cloud Relay & Local):', err.message);
      this.isFirebaseReady = false;
    }
  }

  getServerTime() {
    return Date.now() + this.serverTimeOffset;
  }

  handleBroadcastMessage(msg) {
    if (!msg || !msg.type) return;
    const { sessionCode, data } = msg;
    if (this.listeners.has(sessionCode)) {
      const callbacks = this.listeners.get(sessionCode);
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * NOTIFY SESSION UPDATE ACROSS ALL CHANNELS
   */
  notifySessionUpdate(sessionCode, sessionData) {
    // 1. In-process subscribers
    if (this.listeners.has(sessionCode)) {
      this.listeners.get(sessionCode).forEach((cb) => cb(sessionData));
    }

    // 2. BroadcastChannel for same browser tabs
    if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'SESSION_UPDATE',
        sessionCode,
        data: sessionData
      });
    }

    // 3. LocalStorage persistence
    try {
      localStorage.setItem(`tc_session_${sessionCode}`, JSON.stringify(sessionData));
    } catch (e) {}

    // 4. Global Cloud Relay (Internet Relay for cross-network mobile & laptop)
    this.publishToCloudRelay(sessionCode, sessionData);
  }

  getLocalSession(sessionCode) {
    try {
      const raw = localStorage.getItem(`tc_session_${sessionCode}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async publishToCloudRelay(sessionCode, sessionData) {
    if (!sessionCode || !sessionData) return;
    try {
      await fetch(`https://ntfy.sh/suhu_number_${sessionCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
    } catch (err) {
      // Silently proceed
    }
  }

  async fetchFromCloudRelay(sessionCode) {
    if (!sessionCode) return null;
    try {
      const res = await fetch(`https://ntfy.sh/suhu_number_${sessionCode}/json?poll=1&since=all`);
      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const item = JSON.parse(lines[i]);
          if (item && item.message) {
            const data = JSON.parse(item.message);
            if (data && data.code === sessionCode) {
              return data;
            }
          }
        } catch (e) {}
      }
    } catch (err) {}
    return null;
  }

  listenToCloudRelay(sessionCode, callback) {
    if (!sessionCode || typeof EventSource === 'undefined') return () => {};
    try {
      const eventSource = new EventSource(`https://ntfy.sh/suhu_number_${sessionCode}/sse`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.message) {
            const data = JSON.parse(payload.message);
            if (data && data.code === sessionCode) {
              try {
                localStorage.setItem(`tc_session_${sessionCode}`, JSON.stringify(data));
              } catch (e) {}
              callback(data);
            }
          }
        } catch (e) {}
      };
      return () => {
        eventSource.close();
      };
    } catch (err) {
      return () => {};
    }
  }

  /**
   * CREATE A NEW GAME SESSION
   */
  async createSession(title = 'Sesi Pembelajaran Kalor SMP Kelas VII') {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'TC';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const sessionData = {
      code,
      title,
      createdAt: this.getServerTime(),
      status: 'LOBBY',
      currentPhase: 'LOBBY',
      phaseStartTime: null,
      phaseDuration: 0,
      teams: {},
      settings: {
        game1Duration: 180, // Number Chains
        game2Duration: 180, // Start Champ
        game3Duration: 240, // Cryptarithm War
        maxTeams: 8
      }
    };

    if (this.isFirebaseReady && this.db) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${code}`);
        await this.fbSet(sRef, sessionData);
      } catch (e) {
        console.warn('Firebase set session error:', e);
      }
    }

    this.notifySessionUpdate(code, sessionData);
    return sessionData;
  }

  /**
   * JOIN SESSION & REGISTER TEAM (1 to 8)
   */
  async joinSession(sessionCode, teamNumber, teamName, members) {
    const num = parseInt(teamNumber, 10);
    if (isNaN(num) || num < 1 || num > 8) {
      throw new Error('Nomor kelompok harus berada di antara 1 sampai 8.');
    }

    let session = await this.getSession(sessionCode);
    if (!session) {
      throw new Error(`Sesi dengan kode ${sessionCode} tidak ditemukan.`);
    }

    if (session.status !== 'LOBBY') {
      throw new Error('Permainan sudah dimulai atau sedang berjalan.');
    }

    if (session.teams && session.teams[`team_${num}`] && session.teams[`team_${num}`].claimed) {
      const mySaved = this.getStoredTeamSession();
      if (!mySaved || mySaved.teamNumber !== num || mySaved.sessionCode !== sessionCode) {
        throw new Error(`Kelompok ${num} sudah diambil oleh perangkat lain.`);
      }
    }

    const teamData = {
      number: num,
      name: (teamName || `Kelompok ${num}`).trim(),
      members: Array.isArray(members) ? members : [],
      claimed: true,
      ready: true,
      joinedAt: this.getServerTime(),
      scores: {
        game1: 0,
        game2: 0,
        game3: 0,
        total: 0
      },
      progress: {
        game1Submitted: false,
        game2Submitted: false,
        game3Submitted: false
      },
      predicate: 'Temperature Rookie'
    };

    if (!session.teams) session.teams = {};
    session.teams[`team_${num}`] = teamData;

    if (this.isFirebaseReady && this.db) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${num}`);
        await this.fbSet(teamRef, teamData);
      } catch (e) {
        console.warn('Firebase join error:', e);
      }
    }

    this.notifySessionUpdate(sessionCode, session);
    this.saveTeamSession(sessionCode, num, teamName);

    return { success: true, teamNumber: num, sessionCode };
  }

  /**
   * SET SESSION PHASE (ADMIN CONTROL)
   */
  async setSessionPhase(sessionCode, phase) {
    let session = await this.getSession(sessionCode);
    if (!session) throw new Error('Sesi tidak ditemukan.');

    let duration = 0;
    if (phase === 'GAME1') duration = session.settings?.game1Duration || 180;
    else if (phase === 'GAME2') duration = session.settings?.game2Duration || 180;
    else if (phase === 'GAME3') duration = session.settings?.game3Duration || 240;
    else if (phase === 'FINISHED') duration = 0;

    session.status = phase;
    session.currentPhase = phase;
    session.phaseStartTime = this.getServerTime();
    session.phaseDuration = duration;

    if (this.isFirebaseReady && this.db) {
      try {
        const sessionRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        await this.fbUpdate(sessionRef, {
          status: phase,
          currentPhase: phase,
          phaseStartTime: session.phaseStartTime,
          phaseDuration: duration
        });
      } catch (e) {
        console.warn('Firebase setPhase error:', e);
      }
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * SUBMIT GAME 1 (NUMBER CHAINS - MAX 30 PTS)
   */
  async submitGame1Score(sessionCode, teamNumber, correctCount, totalStages = 5) {
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];
    
    // Each stage correct = 5 pts (5 x 5 = 25 pts)
    let score = correctCount * 5;
    // Perfect bonus = +5 pts if all 5 are correct
    if (correctCount === totalStages) {
      score += 5;
    }
    score = Math.min(30, Math.round(score * 10) / 10);

    team.scores.game1 = score;
    team.scores.total = Math.min(100, Math.round((team.scores.game1 + (team.scores.game2 || 0) + (team.scores.game3 || 0)) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game1Submitted = true;

    if (this.isFirebaseReady && this.db) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        await this.fbUpdate(teamRef, {
          'scores/game1': score,
          'scores/total': team.scores.total,
          'progress/game1Submitted': true,
          predicate: team.predicate
        });
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score,
      totalScore: team.scores.total,
      correctCount,
      totalStages,
      isPerfect: correctCount === totalStages
    };
  }

  /**
   * SUBMIT GAME 2 (START CHAMP MATCHING - MAX 35 PTS)
   */
  async submitGame2Score(sessionCode, teamNumber, correctCount, totalItems = 12, speedBonus = 0) {
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];

    // Base score: 2.5 pts per correct match (12 x 2.5 = 30 pts)
    let score = (correctCount * 2.5) + (Number(speedBonus) || 0);
    score = Math.min(35, Math.round(score * 10) / 10);

    team.scores.game2 = score;
    team.scores.total = Math.min(100, Math.round(((team.scores.game1 || 0) + score + (team.scores.game3 || 0)) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game2Submitted = true;

    if (this.isFirebaseReady && this.db) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        await this.fbUpdate(teamRef, {
          'scores/game2': score,
          'scores/total': team.scores.total,
          'progress/game2Submitted': true,
          predicate: team.predicate
        });
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score,
      totalScore: team.scores.total,
      correctCount,
      totalItems
    };
  }

  /**
   * SUBMIT GAME 3 (CRYPTARITHM WAR - MAX 35 PTS)
   */
  async submitGame3Score(sessionCode, teamNumber, correctCount, totalItems = 6, speedBonus = 0) {
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];

    // Base score: 5.0 pts per correct calculation (6 x 5.0 = 30 pts)
    let score = (correctCount * 5.0) + (Number(speedBonus) || 0);
    score = Math.min(35, Math.round(score * 10) / 10);

    team.scores.game3 = score;
    team.scores.total = Math.min(100, Math.round(((team.scores.game1 || 0) + (team.scores.game2 || 0) + score) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game3Submitted = true;

    if (this.isFirebaseReady && this.db) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        await this.fbUpdate(teamRef, {
          'scores/game3': score,
          'scores/total': team.scores.total,
          'progress/game3Submitted': true,
          predicate: team.predicate
        });
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score,
      totalScore: team.scores.total,
      correctCount,
      totalItems
    };
  }

  /**
   * RESET SESSION (CLEAR SCORES TO ZERO)
   */
  async resetSession(sessionCode) {
    const session = await this.getSession(sessionCode);
    if (!session) return;

    session.status = 'LOBBY';
    session.currentPhase = 'LOBBY';
    session.phaseStartTime = null;
    session.phaseDuration = 0;
    if (session.teams) {
      Object.keys(session.teams).forEach((k) => {
        session.teams[k].scores = { game1: 0, game2: 0, game3: 0, total: 0 };
        session.teams[k].progress = { game1Submitted: false, game2Submitted: false, game3Submitted: false };
        session.teams[k].predicate = 'Temperature Rookie';
      });
    }

    if (this.isFirebaseReady && this.db) {
      try {
        const sessionRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        await this.fbSet(sessionRef, session);
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * SIMULATE 8 TEAMS FOR QUICK CLASS DEMONSTRATION
   */
  async simulate8Teams(sessionCode) {
    const session = await this.getSession(sessionCode);
    if (!session) return null;

    const sampleNames = [
      'Tim Joule (SMP 1)',
      'Kalor Squad',
      'Kelompok Kelvin',
      'Termo Warrior',
      'Al-Jazari Science',
      'Laskar Kalor 7A',
      'Champions of Celsius',
      'Energi Surya Team'
    ];

    const sampleMembers = [
      [{ name: 'Ahmad Faiz', absen: '02' }, { name: 'Annisa Putri', absen: '05' }, { name: 'Bagas Pratama', absen: '08' }],
      [{ name: 'Dimas Arya', absen: '11' }, { name: 'Fatimah Zahra', absen: '14' }, { name: 'Gilang Ramadhan', absen: '17' }],
      [{ name: 'Hana Farida', absen: '20' }, { name: 'Irfan Hakim', absen: '23' }, { name: 'Jihan Nabila', absen: '26' }],
      [{ name: 'Kevin Sanjaya', absen: '29' }, { name: 'Laila Sari', absen: '01' }, { name: 'Muhammad Rizky', absen: '04' }],
      [{ name: 'Nadia Safitri', absen: '07' }, { name: 'Oscar Maulana', absen: '10' }, { name: 'Putri Ayu', absen: '13' }],
      [{ name: 'Qori Alamsyah', absen: '16' }, { name: 'Rendra Putra', absen: '19' }, { name: 'Siti Rahma', absen: '22' }],
      [{ name: 'Taufik Hidayat', absen: '25' }, { name: 'Umar Dani', absen: '28' }, { name: 'Vina Pandu', absen: '03' }],
      [{ name: 'Wahyu Nugroho', absen: '06' }, { name: 'Yusuf Habibi', absen: '09' }, { name: 'Zahra Cantika', absen: '12' }]
    ];

    // Realistic varied scores matching 30 / 35 / 35
    const sampleScores = [
      { g1: 30, g2: 34.5, g3: 35 },     // 99.5 - Champion
      { g1: 27.5, g2: 32, g3: 32.5 },   // 92.0 - Champion
      { g1: 25, g2: 30, g3: 30 },       // 85.0 - Expert
      { g1: 25, g2: 27.5, g3: 28 },     // 80.5 - Expert
      { g1: 22.5, g2: 25, g3: 25 },     // 72.5 - Challenger
      { g1: 20, g2: 24, g3: 22 },       // 66.0 - Challenger
      { g1: 17.5, g2: 22.5, g3: 20 },   // 60.0 - Explorer
      { g1: 15, g2: 18, g3: 15 }        // 48.0 - Rookie
    ];

    if (!session.teams) session.teams = {};

    for (let i = 1; i <= 8; i++) {
      const idx = i - 1;
      const sc = sampleScores[idx];
      const total = Math.min(100, Math.round((sc.g1 + sc.g2 + sc.g3) * 10) / 10);

      session.teams[`team_${i}`] = {
        number: i,
        name: sampleNames[idx],
        members: sampleMembers[idx],
        claimed: true,
        ready: true,
        joinedAt: this.getServerTime() - (idx * 5000),
        scores: {
          game1: sc.g1,
          game2: sc.g2,
          game3: sc.g3,
          total
        },
        progress: {
          game1Submitted: true,
          game2Submitted: true,
          game3Submitted: true
        },
        predicate: getPredicate(total).title
      };
    }

    if (this.isFirebaseReady && this.db) {
      try {
        const teamsRef = this.fbRef(this.db, `sessions/${sessionCode}/teams`);
        await this.fbSet(teamsRef, session.teams);
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * LISTEN TO SESSION IN REALTIME (FIREBASE + CLOUD RELAY + STORAGE)
   */
  listenToSession(sessionCode, callback) {
    if (!this.listeners.has(sessionCode)) {
      this.listeners.set(sessionCode, new Set());
    }
    this.listeners.get(sessionCode).add(callback);

    // Initial load
    this.getSession(sessionCode).then((s) => {
      if (s) callback(s);
    });

    // 1. Firebase Live Listener
    if (this.isFirebaseReady && this.db) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        this.fbOnValue(sRef, (snap) => {
          const val = snap.val();
          if (val) {
            this.notifySessionUpdate(sessionCode, val);
          }
        });
      } catch (e) {}
    }

    // 2. Global Cloud Relay SSE Listener
    const cleanupSSE = this.listenToCloudRelay(sessionCode, (data) => {
      if (this.listeners.has(sessionCode)) {
        this.listeners.get(sessionCode).forEach((cb) => cb(data));
      }
    });

    // 3. Storage event for multi-tab
    const storageHandler = (e) => {
      if (e.key === `tc_session_${sessionCode}` && e.newValue) {
        try {
          const val = JSON.parse(e.newValue);
          callback(val);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      if (this.listeners.has(sessionCode)) {
        this.listeners.get(sessionCode).delete(callback);
      }
      if (cleanupSSE) cleanupSSE();
      window.removeEventListener('storage', storageHandler);
    };
  }

  /**
   * GET SESSION (FIREBASE -> CLOUD RELAY -> LOCALSTORAGE)
   */
  async getSession(sessionCode) {
    // 1. Firebase RTDB
    if (this.isFirebaseReady && this.db) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const snap = await this.fbGet(sRef);
        if (snap.exists()) {
          const val = snap.val();
          try {
            localStorage.setItem(`tc_session_${sessionCode}`, JSON.stringify(val));
          } catch (e) {}
          return val;
        }
      } catch (e) {}
    }

    // 2. Global Cloud Relay
    const cloudSession = await this.fetchFromCloudRelay(sessionCode);
    if (cloudSession) {
      try {
        localStorage.setItem(`tc_session_${sessionCode}`, JSON.stringify(cloudSession));
      } catch (e) {}
      return cloudSession;
    }

    // 3. Fallback to LocalStorage
    return this.getLocalSession(sessionCode);
  }

  saveTeamSession(sessionCode, teamNumber, teamName) {
    const cred = { sessionCode, teamNumber, teamName, savedAt: Date.now() };
    localStorage.setItem('tc_team_session', JSON.stringify(cred));
  }

  getStoredTeamSession() {
    try {
      const raw = localStorage.getItem('tc_team_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  clearStoredTeamSession() {
    localStorage.removeItem('tc_team_session');
  }
}

export const firebaseService = new FirebaseService();
