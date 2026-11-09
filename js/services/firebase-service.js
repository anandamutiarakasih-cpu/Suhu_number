/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Firebase Service & Realtime Synchronization Engine
 * Dual-Sync: Firebase RTDB (CDN/Compat/Modular) + Global Cloud Relay (SSE/REST) + BroadcastChannel + LocalStorage
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
    this.activeSubscriptions = new Map();
    this.activeSSE = new Map();
    this.sessionsCache = new Map();

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
    // 1. Try global window.firebase from CDN first (fastest & most reliable)
    if (typeof window !== 'undefined' && window.firebase) {
      try {
        if (!window.firebase.apps || !window.firebase.apps.length) {
          this.app = window.firebase.initializeApp(firebaseConfig);
        } else {
          this.app = window.firebase.app();
        }
        this.db = firebaseConfig.databaseURL ? window.firebase.database(this.app, firebaseConfig.databaseURL) : window.firebase.database();
        this.fbRef = (db, path) => db.ref(path);
        this.fbSet = (ref, val) => ref.set(val);
        this.fbUpdate = (ref, val) => ref.update(val);
        this.fbOnValue = (ref, cb) => {
          if (typeof ref.on === 'function') {
            ref.on('value', cb);
            return () => {
              try { ref.off('value', cb); } catch (e) {}
            };
          }
          return () => {};
        };
        this.fbGet = (ref) => (ref.get ? ref.get() : ref.once('value'));
        this.isFirebaseReady = true;
        this.isOnline = true;
        console.log('🟢 Firebase RTDB Initialized via CDN:', firebaseConfig.databaseURL);

        // Listen for server time offset & connection
        const offsetRef = this.db.ref('.info/serverTimeOffset');
        offsetRef.on('value', (snap) => {
          this.serverTimeOffset = snap.val() || 0;
        });

        const connRef = this.db.ref('.info/connected');
        connRef.on('value', (snap) => {
          this.isOnline = !!snap.val();
        });

        return;
      } catch (e) {
        console.warn('CDN Firebase init error:', e);
      }
    }

    // 2. Fallback to modular dynamic import
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const { getDatabase, ref, onValue, set, update, get } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

      this.app = initializeApp(firebaseConfig);
      this.db = firebaseConfig.databaseURL ? getDatabase(this.app, firebaseConfig.databaseURL) : getDatabase(this.app);
      this.fbRef = ref;
      this.fbOnValue = (r, cb) => onValue(r, cb);
      this.fbSet = set;
      this.fbUpdate = update;
      this.fbGet = get;

      const offsetRef = ref(this.db, '.info/serverTimeOffset');
      onValue(offsetRef, (snap) => {
        this.serverTimeOffset = snap.val() || 0;
      });

      const connRef = ref(this.db, '.info/connected');
      onValue(connRef, (snap) => {
        this.isOnline = !!snap.val();
      });

      this.isFirebaseReady = true;
      console.log('🟢 Firebase RTDB Initialized via Modular ESM');
    } catch (err) {
      console.warn('⚠️ Firebase initial note (falling back to Cloud Relay & LocalStorage):', err.message);
      this.isFirebaseReady = false;
    }
  }

  getServerTime() {
    return Date.now() + this.serverTimeOffset;
  }

  handleBroadcastMessage(msg) {
    if (!msg || !msg.type) return;
    const { sessionCode, data } = msg;
    if (data) {
      this.sessionsCache.set(sessionCode, data);
    }
    if (this.listeners.has(sessionCode)) {
      const callbacks = this.listeners.get(sessionCode);
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * NOTIFY SESSION UPDATE ACROSS ALL CHANNELS
   */
  notifySessionUpdate(sessionCode, sessionData) {
    if (!sessionCode || !sessionData) return;

    // Cache in memory
    this.sessionsCache.set(sessionCode, sessionData);

    // In-process subscribers
    if (this.listeners.has(sessionCode)) {
      this.listeners.get(sessionCode).forEach((cb) => cb(sessionData));
    }

    // BroadcastChannel for same browser tabs
    if (this.broadcast) {
      try {
        this.broadcast.postMessage({
          type: 'SESSION_UPDATE',
          sessionCode,
          data: sessionData
        });
      } catch (e) {}
    }

    // LocalStorage persistence
    try {
      localStorage.setItem(`tc_session_${sessionCode}`, JSON.stringify(sessionData));
    } catch (e) {}

    // Global Cloud Relay (Internet Relay for cross-network mobile & laptop)
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
      fetch(`https://ntfy.sh/suhu_number_${sessionCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      }).catch(() => {});
    } catch (err) {}
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
              this.sessionsCache.set(sessionCode, data);
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
   * CREATE A NEW GAME SESSION (INSTANT & NON-BLOCKING)
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
        game1Duration: 180,
        game2Duration: 180,
        game3Duration: 240,
        maxTeams: 8
      }
    };

    // Cache immediately in memory & storage
    this.sessionsCache.set(code, sessionData);
    try {
      localStorage.setItem(`tc_session_${code}`, JSON.stringify(sessionData));
    } catch (e) {}

    // Non-blocking background write to Firebase RTDB
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${code}`);
        const p = this.fbSet(sRef, sessionData);
        if (p && typeof p.catch === 'function') {
          p.catch((e) => console.warn('Firebase set session background:', e));
        }
      } catch (e) {
        console.warn('Firebase ref error:', e);
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

    if (session.status === 'FINISHED') {
      throw new Error('Sesi permainan ini sudah selesai.');
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

    this.sessionsCache.set(sessionCode, session);

    // Non-blocking background sync
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${num}`);
        const p = this.fbSet(teamRef, teamData);
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    this.saveTeamSession(sessionCode, num, teamName);

    return { success: true, teamNumber: num, sessionCode, currentPhase: session.currentPhase || 'LOBBY' };
  }

  /**
   * LEAVE SESSION & RELEASE TEAM SLOT (CALLED BY STUDENT OR TEACHER)
   */
  async leaveSession(sessionCode, teamNumber) {
    const num = parseInt(teamNumber, 10);
    if (isNaN(num) || num < 1 || num > 8) {
      return { success: false, error: 'Nomor kelompok tidak valid.' };
    }

    let session = await this.getSession(sessionCode);
    if (!session) {
      this.clearStoredTeamSession();
      return { success: false, error: 'Sesi tidak ditemukan.' };
    }

    const resetTeam = {
      number: num,
      name: `Kelompok ${num}`,
      members: [],
      claimed: false,
      ready: false,
      joinedAt: null,
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
    session.teams[`team_${num}`] = resetTeam;

    this.sessionsCache.set(sessionCode, session);

    // Non-blocking background sync to Firebase RTDB
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${num}`);
        const p = this.fbSet(teamRef, resetTeam);
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {
        console.warn('Firebase leaveSession sync error:', e);
      }
    }

    this.notifySessionUpdate(sessionCode, session);
    this.clearStoredTeamSession();

    return { success: true, teamNumber: num };
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
    session.updatedAt = this.getServerTime();

    this.sessionsCache.set(sessionCode, session);

    // Background Firebase sync
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const sessionRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const p = this.fbUpdate(sessionRef, {
          status: phase,
          currentPhase: phase,
          phaseStartTime: session.phaseStartTime,
          phaseDuration: duration,
          updatedAt: session.updatedAt
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * SEND TEAM HEARTBEAT & LATENCY TO TEACHER
   */
  sendHeartbeat(sessionCode, teamNumber, latency = 0) {
    if (!sessionCode || !teamNumber) return;
    const now = this.getServerTime();

    const session = this.sessionsCache.get(sessionCode);
    if (session?.teams?.[`team_${teamNumber}`]) {
      session.teams[`team_${teamNumber}`].lastActive = now;
      session.teams[`team_${teamNumber}`].latency = latency;
    }

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        this.fbUpdate(teamRef, {
          lastActive: now,
          latency: latency
        }).catch(() => {});
      } catch (e) {}
    }
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
    let score = correctCount * 5;
    if (correctCount === totalStages) {
      score += 5; // Perfect 5/5 bonus
    }
    score = Math.min(30, Math.round(score * 10) / 10);

    team.scores.game1 = score;
    team.scores.total = Math.min(100, Math.round((team.scores.game1 + (team.scores.game2 || 0) + (team.scores.game3 || 0)) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game1Submitted = true;

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        const p = this.fbUpdate(teamRef, {
          'scores/game1': score,
          'scores/total': team.scores.total,
          'progress/game1Submitted': true,
          predicate: team.predicate
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
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
    let score = (correctCount * 2.5) + (Number(speedBonus) || 0);
    score = Math.min(35, Math.round(score * 10) / 10);

    team.scores.game2 = score;
    team.scores.total = Math.min(100, Math.round(((team.scores.game1 || 0) + score + (team.scores.game3 || 0)) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game2Submitted = true;

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        const p = this.fbUpdate(teamRef, {
          'scores/game2': score,
          'scores/total': team.scores.total,
          'progress/game2Submitted': true,
          predicate: team.predicate
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
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
    let score = (correctCount * 5.0) + (Number(speedBonus) || 0);
    score = Math.min(35, Math.round(score * 10) / 10);

    team.scores.game3 = score;
    team.scores.total = Math.min(100, Math.round(((team.scores.game1 || 0) + (team.scores.game2 || 0) + score) * 10) / 10);
    team.predicate = getPredicate(team.scores.total).title;
    if (!team.progress) team.progress = {};
    team.progress.game3Submitted = true;

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${teamNumber}`);
        const p = this.fbUpdate(teamRef, {
          'scores/game3': score,
          'scores/total': team.scores.total,
          'progress/game3Submitted': true,
          predicate: team.predicate
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
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

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const sessionRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const p = this.fbSet(sessionRef, session);
        if (p && typeof p.catch === 'function') p.catch(() => {});
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

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const teamsRef = this.fbRef(this.db, `sessions/${sessionCode}/teams`);
        const p = this.fbSet(teamsRef, session.teams);
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * LISTEN TO SESSION IN REALTIME (FIREBASE + CLOUD RELAY + STORAGE)
   */
  listenToSession(sessionCode, callback) {
    if (!sessionCode) return () => {};
    const cleanCode = String(sessionCode).trim().toUpperCase();

    if (!this.listeners.has(cleanCode)) {
      this.listeners.set(cleanCode, new Set());
    }
    this.listeners.get(cleanCode).add(callback);

    // Initial immediate response from cache or local
    const current = this.sessionsCache.get(cleanCode) || this.getLocalSession(cleanCode);
    if (current) {
      try { callback(current); } catch (e) {}
    }

    this.getSession(cleanCode).then((s) => {
      if (s) {
        try { callback(s); } catch (e) {}
      }
    });

    // 1. Single Live Firebase Listener per sessionCode
    if (!this.activeSubscriptions.has(cleanCode)) {
      let fbUnsub = null;
      if (this.isFirebaseReady && this.db && this.fbRef && this.fbOnValue) {
        try {
          const sRef = this.fbRef(this.db, `sessions/${cleanCode}`);
          fbUnsub = this.fbOnValue(sRef, (snap) => {
            const val = typeof snap.val === 'function' ? snap.val() : null;
            if (val) {
              this.notifySessionUpdate(cleanCode, val);
            }
          });
        } catch (e) {}
      }

      // 2. Global Cloud Relay SSE Listener
      const cleanupSSE = this.listenToCloudRelay(cleanCode, (data) => {
        if (data && data.code === cleanCode) {
          this.notifySessionUpdate(cleanCode, data);
        }
      });

      this.activeSubscriptions.set(cleanCode, () => {
        if (typeof fbUnsub === 'function') {
          try { fbUnsub(); } catch (e) {}
        }
        if (typeof cleanupSSE === 'function') {
          try { cleanupSSE(); } catch (e) {}
        }
      });
    }

    // 3. Storage event for multi-tab
    const storageHandler = (e) => {
      if (e.key === `tc_session_${cleanCode}` && e.newValue) {
        try {
          const val = JSON.parse(e.newValue);
          callback(val);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      if (this.listeners.has(cleanCode)) {
        this.listeners.get(cleanCode).delete(callback);
        if (this.listeners.get(cleanCode).size === 0) {
          this.listeners.delete(cleanCode);
          if (this.activeSubscriptions.has(cleanCode)) {
            const unsub = this.activeSubscriptions.get(cleanCode);
            if (typeof unsub === 'function') unsub();
            this.activeSubscriptions.delete(cleanCode);
          }
        }
      }
      window.removeEventListener('storage', storageHandler);
    };
  }

  /**
   * GET SESSION (MEMORY -> LOCALSTORAGE -> FIREBASE -> CLOUD RELAY)
   */
  async getSession(sessionCode) {
    if (!sessionCode) return null;
    const cleanCode = String(sessionCode).trim().toUpperCase();

    // 1. In-memory cache (0ms instant)
    if (this.sessionsCache.has(cleanCode)) {
      return this.sessionsCache.get(cleanCode);
    }

    // 2. LocalStorage (0ms instant)
    const local = this.getLocalSession(cleanCode);
    if (local) {
      this.sessionsCache.set(cleanCode, local);
      return local;
    }

    // 3. Firebase RTDB with fast 1.5s timeout (never hangs)
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbGet) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${cleanCode}`);
        const fetchPromise = Promise.resolve(this.fbGet(sRef));
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
        const snap = await Promise.race([fetchPromise, timeoutPromise]);
        if (snap) {
          const val = typeof snap.val === 'function' ? snap.val() : (snap.exists && snap.exists() ? snap.val() : null);
          if (val) {
            try {
              localStorage.setItem(`tc_session_${cleanCode}`, JSON.stringify(val));
            } catch (e) {}
            this.sessionsCache.set(cleanCode, val);
            return val;
          }
        }
      } catch (e) {}
    }

    // 4. Global Cloud Relay with fast timeout
    try {
      const relayPromise = this.fetchFromCloudRelay(cleanCode);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
      const cloudSession = await Promise.race([relayPromise, timeoutPromise]);
      if (cloudSession) {
        try {
          localStorage.setItem(`tc_session_${cleanCode}`, JSON.stringify(cloudSession));
        } catch (e) {}
        this.sessionsCache.set(cleanCode, cloudSession);
        return cloudSession;
      }
    } catch (e) {}

    return null;
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
