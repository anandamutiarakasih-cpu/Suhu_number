/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Firebase Service & Realtime Synchronization Engine
 * Dual-Sync: Firebase RTDB (CDN/Compat/Modular) + Global Cloud Relay (SSE/REST) + BroadcastChannel + LocalStorage
 */

import { firebaseConfig } from '../config/firebase-config.js';
import { getPredicate } from '../data/predicates.js';
import { calculateQuestionScore } from './score-service.js';

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
    this.readyPromise = null;

    this.initBroadcastChannel();
    this.readyPromise = this.initFirebase();
  }

  async ensureReady() {
    if (this.isFirebaseReady) return true;
    if (this.readyPromise) {
      await this.readyPromise;
      return this.isFirebaseReady;
    }
    this.readyPromise = this.initFirebase();
    await this.readyPromise;
    return this.isFirebaseReady;
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
    // 1. Wait up to 3 seconds for window.firebase from CDN if in browser
    if (typeof window !== 'undefined') {
      const start = Date.now();
      while (Date.now() - start < 3000) {
        if (window.firebase && typeof window.firebase.database === 'function') {
          break;
        }
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    // 1. Try global window.firebase from CDN first (fastest & most reliable)
    if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.database === 'function') {
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

        return true;
      } catch (e) {
        console.warn('CDN Firebase init error:', e);
      }
    }

    // 2. Fallback to modular dynamic import
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getDatabase, ref, onValue, set, update, get } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

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
      this.isOnline = true;
      console.log('🟢 Firebase RTDB Initialized via Modular ESM');
      return true;
    } catch (err) {
      console.warn('⚠️ Firebase initialization error:', err.message);
      this.isFirebaseReady = false;
      return false;
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
  }

  getLocalSession(sessionCode) {
    try {
      const raw = localStorage.getItem(`tc_session_${sessionCode}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * CREATE A NEW GAME SESSION (INSTANT & NON-BLOCKING)
   */
  async createSession(title = 'Sesi Pembelajaran Kalor SMP Kelas VII') {
    await this.ensureReady();
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

    // Reliable write to Firebase RTDB
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${code}`);
        await this.fbSet(sRef, sessionData);
        console.log(`🟢 Firebase session created in RTDB: sessions/${code}`);
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
    await this.ensureReady();
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

    const now = this.getServerTime();
    const teamData = {
      number: num,
      name: (teamName || `Kelompok ${num}`).trim(),
      members: Array.isArray(members) ? members : [],
      claimed: true,
      ready: true,
      joinedAt: now,
      scores: {
        game1: 0,
        game2: 0,
        game3: 0,
        total: 0
      },
      correctAnswers: {
        game1: 0,
        game2: 0,
        game3: 0,
        total: 0
      },
      answeredQuestions: {
        game1: {},
        game2: {},
        game3: {}
      },
      completionTime: 0,
      progress: {
        game1Submitted: false,
        game2Submitted: false,
        game3Submitted: false
      },
      predicate: 'Temperature Rookie',
      status: 'LOBBY'
    };

    if (!session.teams) session.teams = {};
    session.teams[`team_${num}`] = teamData;

    // Leaderboard dedicated node for ultra-fast, isolated room queries
    if (!session.leaderboard) session.leaderboard = {};
    const lbEntry = {
      groupId: `team_${num}`,
      groupName: teamData.name,
      teamNumber: num,
      numberChainsScore: 0,
      startChampScore: 0,
      cryptarithmWarScore: 0,
      totalScore: 0,
      correctAnswers: 0,
      completionTime: 0,
      status: 'LOBBY',
      updatedAt: now
    };
    session.leaderboard[`team_${num}`] = lbEntry;

    this.sessionsCache.set(sessionCode, session);

    // Non-blocking background sync to Firebase RTDB
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const p = this.fbUpdate(rootRef, {
          [`teams/team_${num}`]: teamData,
          [`leaderboard/team_${num}`]: lbEntry
        });
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
    await this.ensureReady();
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
      correctAnswers: {
        game1: 0,
        game2: 0,
        game3: 0,
        total: 0
      },
      answeredQuestions: {
        game1: {},
        game2: {},
        game3: {}
      },
      completionTime: 0,
      progress: {
        game1Submitted: false,
        game2Submitted: false,
        game3Submitted: false
      },
      predicate: 'Temperature Rookie',
      status: 'LOBBY'
    };

    if (!session.teams) session.teams = {};
    session.teams[`team_${num}`] = resetTeam;

    if (!session.leaderboard) session.leaderboard = {};
    delete session.leaderboard[`team_${num}`];

    this.sessionsCache.set(sessionCode, session);

    // Non-blocking background sync to Firebase RTDB
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const teamRef = this.fbRef(this.db, `sessions/${sessionCode}/teams/team_${num}`);
        this.fbSet(teamRef, resetTeam).catch(() => {});
        const lbRef = this.fbRef(this.db, `sessions/${sessionCode}/leaderboard/team_${num}`);
        this.fbSet(lbRef, null).catch(() => {});
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
    await this.ensureReady();
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
   * SUBMIT QUESTION ANSWER (STANDARDIZED: 100 PTS BASE + 0-20 SPEED BONUS)
   * Prevents duplicate scoring on refresh, locks answers, updates leaderboard in realtime
   */
  async submitQuestionAnswer(sessionCode, teamNumber, gameKey, questionId, { isCorrect, remainingSeconds = 0, totalSeconds = 60, answerData = null }) {
    await this.ensureReady();
    const num = parseInt(teamNumber, 10);
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${num}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${num}`];
    if (!team.scores) team.scores = { game1: 0, game2: 0, game3: 0, total: 0 };
    if (!team.correctAnswers) team.correctAnswers = { game1: 0, game2: 0, game3: 0, total: 0 };
    if (!team.answeredQuestions) team.answeredQuestions = { game1: {}, game2: {}, game3: {} };
    if (!team.answeredQuestions[gameKey]) team.answeredQuestions[gameKey] = {};

    // 1. Check if already answered -> PREVENT DUPLICATE SCORING
    if (team.answeredQuestions[gameKey][questionId]) {
      const existing = team.answeredQuestions[gameKey][questionId];
      return {
        success: true,
        alreadyAnswered: true,
        scoreResult: {
          isCorrect: existing.isCorrect,
          basePoints: existing.basePoints || 0,
          speedBonus: existing.speedBonus || 0,
          totalPoints: existing.score || 0,
          breakdownText: existing.breakdownText || `${existing.score || 0} Poin (Telah Terkunci)`
        },
        currentScore: team.scores[gameKey] || 0,
        totalScore: team.scores.total || 0,
        correctCount: team.correctAnswers[gameKey] || 0
      };
    }

    // 2. Compute score using standardized calculation
    const scoreResult = calculateQuestionScore({ isCorrect, remainingSeconds, totalSeconds });
    const now = this.getServerTime();

    // 3. Record answer locking
    team.answeredQuestions[gameKey][questionId] = {
      isCorrect: scoreResult.isCorrect,
      score: scoreResult.totalPoints,
      basePoints: scoreResult.basePoints,
      speedBonus: scoreResult.speedBonus,
      breakdownText: scoreResult.breakdownText,
      answerData,
      answeredAt: now
    };

    // 4. Accumulate points and correct answer count
    team.scores[gameKey] = (team.scores[gameKey] || 0) + scoreResult.totalPoints;
    if (scoreResult.isCorrect) {
      team.correctAnswers[gameKey] = (team.correctAnswers[gameKey] || 0) + 1;
      team.correctAnswers.total = (team.correctAnswers.total || 0) + 1;
    }

    // 5. Accumulate total score & completion time
    const timeSpent = Math.max(0, totalSeconds - remainingSeconds);
    team.completionTime = (team.completionTime || 0) + timeSpent;
    team.scores.total = (team.scores.game1 || 0) + (team.scores.game2 || 0) + (team.scores.game3 || 0);
    team.predicate = getPredicate(team.scores.total).title;
    team.status = 'PLAYING';

    // 6. Update Leaderboard Entry
    if (!session.leaderboard) session.leaderboard = {};
    session.leaderboard[`team_${num}`] = {
      groupId: `team_${num}`,
      groupName: team.name,
      teamNumber: num,
      numberChainsScore: team.scores.game1 || 0,
      startChampScore: team.scores.game2 || 0,
      cryptarithmWarScore: team.scores.game3 || 0,
      totalScore: team.scores.total,
      correctAnswers: team.correctAnswers.total || 0,
      completionTime: team.completionTime || 0,
      status: 'PLAYING',
      updatedAt: now
    };

    this.sessionsCache.set(sessionCode, session);

    // 7. Atomic multi-location Firebase RTDB sync
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const updates = {
          [`teams/team_${num}/scores/${gameKey}`]: team.scores[gameKey],
          [`teams/team_${num}/scores/total`]: team.scores.total,
          [`teams/team_${num}/correctAnswers/${gameKey}`]: team.correctAnswers[gameKey],
          [`teams/team_${num}/correctAnswers/total`]: team.correctAnswers.total,
          [`teams/team_${num}/completionTime`]: team.completionTime,
          [`teams/team_${num}/predicate`]: team.predicate,
          [`teams/team_${num}/status`]: 'PLAYING',
          [`teams/team_${num}/answeredQuestions/${gameKey}/${questionId}`]: team.answeredQuestions[gameKey][questionId],
          [`leaderboard/team_${num}`]: session.leaderboard[`team_${num}`]
        };
        const p = this.fbUpdate(rootRef, updates);
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);

    return {
      success: true,
      alreadyAnswered: false,
      scoreResult,
      currentScore: team.scores[gameKey],
      totalScore: team.scores.total,
      correctCount: team.correctAnswers[gameKey]
    };
  }

  /**
   * SUBMIT GAME 1 (NUMBER CHAINS COMPLETION)
   */
  async submitGame1Score(sessionCode, teamNumber, correctCount, totalStages = 5) {
    await this.ensureReady();
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];
    if (!team.progress) team.progress = {};
    team.progress.game1Submitted = true;
    team.status = 'PLAYING';

    team.scores.total = (team.scores.game1 || 0) + (team.scores.game2 || 0) + (team.scores.game3 || 0);
    team.predicate = getPredicate(team.scores.total).title;

    if (!session.leaderboard) session.leaderboard = {};
    session.leaderboard[`team_${teamNumber}`] = {
      groupId: `team_${teamNumber}`,
      groupName: team.name,
      teamNumber: parseInt(teamNumber, 10),
      numberChainsScore: team.scores.game1 || 0,
      startChampScore: team.scores.game2 || 0,
      cryptarithmWarScore: team.scores.game3 || 0,
      totalScore: team.scores.total,
      correctAnswers: team.correctAnswers?.total || 0,
      completionTime: team.completionTime || 0,
      status: 'PLAYING',
      updatedAt: this.getServerTime()
    };

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        this.fbUpdate(rootRef, {
          [`teams/team_${teamNumber}/progress/game1Submitted`]: true,
          [`teams/team_${teamNumber}/scores/total`]: team.scores.total,
          [`teams/team_${teamNumber}/predicate`]: team.predicate,
          [`leaderboard/team_${teamNumber}`]: session.leaderboard[`team_${teamNumber}`]
        }).catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score: team.scores.game1 || 0,
      totalScore: team.scores.total,
      correctCount: team.correctAnswers?.game1 || correctCount,
      totalStages
    };
  }

  /**
   * SUBMIT GAME 2 (START CHAMP MATCHING COMPLETION)
   */
  async submitGame2Score(sessionCode, teamNumber, correctCount, totalItems = 12) {
    await this.ensureReady();
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];
    if (!team.progress) team.progress = {};
    team.progress.game2Submitted = true;
    team.status = 'PLAYING';

    team.scores.total = (team.scores.game1 || 0) + (team.scores.game2 || 0) + (team.scores.game3 || 0);
    team.predicate = getPredicate(team.scores.total).title;

    if (!session.leaderboard) session.leaderboard = {};
    session.leaderboard[`team_${teamNumber}`] = {
      groupId: `team_${teamNumber}`,
      groupName: team.name,
      teamNumber: parseInt(teamNumber, 10),
      numberChainsScore: team.scores.game1 || 0,
      startChampScore: team.scores.game2 || 0,
      cryptarithmWarScore: team.scores.game3 || 0,
      totalScore: team.scores.total,
      correctAnswers: team.correctAnswers?.total || 0,
      completionTime: team.completionTime || 0,
      status: 'PLAYING',
      updatedAt: this.getServerTime()
    };

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        this.fbUpdate(rootRef, {
          [`teams/team_${teamNumber}/progress/game2Submitted`]: true,
          [`teams/team_${teamNumber}/scores/total`]: team.scores.total,
          [`teams/team_${teamNumber}/predicate`]: team.predicate,
          [`leaderboard/team_${teamNumber}`]: session.leaderboard[`team_${teamNumber}`]
        }).catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score: team.scores.game2 || 0,
      totalScore: team.scores.total,
      correctCount: team.correctAnswers?.game2 || correctCount,
      totalItems
    };
  }

  /**
   * SUBMIT GAME 3 (CRYPTARITHM WAR COMPLETION)
   */
  async submitGame3Score(sessionCode, teamNumber, correctCount, totalItems = 6) {
    await this.ensureReady();
    const session = await this.getSession(sessionCode);
    if (!session || !session.teams || !session.teams[`team_${teamNumber}`]) {
      throw new Error('Data kelompok tidak ditemukan.');
    }

    const team = session.teams[`team_${teamNumber}`];
    if (!team.progress) team.progress = {};
    team.progress.game3Submitted = true;
    team.status = 'FINISHED';

    team.scores.total = (team.scores.game1 || 0) + (team.scores.game2 || 0) + (team.scores.game3 || 0);
    team.predicate = getPredicate(team.scores.total).title;

    if (!session.leaderboard) session.leaderboard = {};
    session.leaderboard[`team_${teamNumber}`] = {
      groupId: `team_${teamNumber}`,
      groupName: team.name,
      teamNumber: parseInt(teamNumber, 10),
      numberChainsScore: team.scores.game1 || 0,
      startChampScore: team.scores.game2 || 0,
      cryptarithmWarScore: team.scores.game3 || 0,
      totalScore: team.scores.total,
      correctAnswers: team.correctAnswers?.total || 0,
      completionTime: team.completionTime || 0,
      status: 'FINISHED',
      updatedAt: this.getServerTime()
    };

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbUpdate) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        this.fbUpdate(rootRef, {
          [`teams/team_${teamNumber}/progress/game3Submitted`]: true,
          [`teams/team_${teamNumber}/status`]: 'FINISHED',
          [`teams/team_${teamNumber}/scores/total`]: team.scores.total,
          [`teams/team_${teamNumber}/predicate`]: team.predicate,
          [`leaderboard/team_${teamNumber}`]: session.leaderboard[`team_${teamNumber}`]
        }).catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return {
      success: true,
      score: team.scores.game3 || 0,
      totalScore: team.scores.total,
      correctCount: team.correctAnswers?.game3 || correctCount,
      totalItems
    };
  }

  /**
   * RESET SESSION (CLEAR SCORES TO ZERO & RESET LEADERBOARD)
   */
  async resetSession(sessionCode) {
    await this.ensureReady();
    const session = await this.getSession(sessionCode);
    if (!session) return;

    session.status = 'LOBBY';
    session.currentPhase = 'LOBBY';
    session.phaseStartTime = null;
    session.phaseDuration = 0;
    session.leaderboard = {};

    if (session.teams) {
      Object.keys(session.teams).forEach((k) => {
        session.teams[k].scores = { game1: 0, game2: 0, game3: 0, total: 0 };
        session.teams[k].correctAnswers = { game1: 0, game2: 0, game3: 0, total: 0 };
        session.teams[k].answeredQuestions = { game1: {}, game2: {}, game3: {} };
        session.teams[k].completionTime = 0;
        session.teams[k].status = 'LOBBY';
        session.teams[k].progress = { game1Submitted: false, game2Submitted: false, game3Submitted: false };
        session.teams[k].predicate = 'Temperature Rookie';

        if (session.teams[k].claimed) {
          session.leaderboard[k] = {
            groupId: k,
            groupName: session.teams[k].name,
            teamNumber: session.teams[k].number,
            numberChainsScore: 0,
            startChampScore: 0,
            cryptarithmWarScore: 0,
            totalScore: 0,
            correctAnswers: 0,
            completionTime: 0,
            status: 'LOBBY',
            updatedAt: this.getServerTime()
          };
        }
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
   * Populates realistic points using 100-pt + speed bonus scale across all 3 games
   */
  async simulate8Teams(sessionCode) {
    await this.ensureReady();
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
      { g1: 580, g2: 1350, g3: 710, correct: 23, time: 260 }, // 2640 - Champion
      { g1: 520, g2: 1210, g3: 650, correct: 21, time: 290 }, // 2380 - Champion
      { g1: 480, g2: 1080, g3: 590, correct: 19, time: 330 }, // 2150 - Expert
      { g1: 440, g2: 960,  g3: 510, correct: 17, time: 360 }, // 1910 - Expert
      { g1: 400, g2: 820,  g3: 450, correct: 15, time: 390 }, // 1670 - Challenger
      { g1: 350, g2: 700,  g3: 380, correct: 13, time: 420 }, // 1430 - Challenger
      { g1: 300, g2: 600,  g3: 320, correct: 11, time: 440 }, // 1220 - Explorer
      { g1: 220, g2: 480,  g3: 200, correct: 8,  time: 470 }  // 900  - Rookie
    ];

    if (!session.teams) session.teams = {};
    if (!session.leaderboard) session.leaderboard = {};
    const now = this.getServerTime();

    for (let i = 1; i <= 8; i++) {
      const idx = i - 1;
      const sc = sampleScores[idx];
      const total = sc.g1 + sc.g2 + sc.g3;

      const teamObj = {
        number: i,
        name: sampleNames[idx],
        members: sampleMembers[idx],
        claimed: true,
        ready: true,
        joinedAt: now - (idx * 5000),
        scores: {
          game1: sc.g1,
          game2: sc.g2,
          game3: sc.g3,
          total
        },
        correctAnswers: {
          game1: Math.min(5, Math.round(sc.g1 / 115)),
          game2: Math.min(12, Math.round(sc.g2 / 110)),
          game3: Math.min(6, Math.round(sc.g3 / 115)),
          total: sc.correct
        },
        answeredQuestions: {
          game1: {},
          game2: {},
          game3: {}
        },
        completionTime: sc.time,
        progress: {
          game1Submitted: true,
          game2Submitted: true,
          game3Submitted: true
        },
        status: 'FINISHED',
        predicate: getPredicate(total).title
      };

      session.teams[`team_${i}`] = teamObj;

      session.leaderboard[`team_${i}`] = {
        groupId: `team_${i}`,
        groupName: teamObj.name,
        teamNumber: i,
        numberChainsScore: sc.g1,
        startChampScore: sc.g2,
        cryptarithmWarScore: sc.g3,
        totalScore: total,
        correctAnswers: sc.correct,
        completionTime: sc.time,
        status: 'FINISHED',
        updatedAt: now - (idx * 3000)
      };
    }

    this.sessionsCache.set(sessionCode, session);

    if (this.isFirebaseReady && this.db && this.fbRef && this.fbSet) {
      try {
        const rootRef = this.fbRef(this.db, `sessions/${sessionCode}`);
        const p = this.fbUpdate(rootRef, {
          teams: session.teams,
          leaderboard: session.leaderboard
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }

    this.notifySessionUpdate(sessionCode, session);
    return session;
  }

  /**
   * LISTEN TO LEADERBOARD REALTIME
   * Connects to Firebase RTDB leaderboard node with multi-criteria sorting:
   * 1. totalScore DESC
   * 2. correctAnswers DESC
   * 3. completionTime ASC
   */
  listenToLeaderboard(sessionCode, callback) {
    if (!sessionCode) return () => {};
    const cleanCode = String(sessionCode).trim().toUpperCase();

    const compileLeaderboard = (session) => {
      if (!session) return [];
      const teamMap = new Map();

      // 1. Ingest session.teams
      if (session.teams && typeof session.teams === 'object') {
        Object.values(session.teams).forEach((t) => {
          if (!t) return;
          const num = parseInt(t.number || t.teamNumber, 10);
          if (isNaN(num)) return;
          const totalScore = Number(t.scores?.total ?? t.totalScore ?? 0);
          const corr = typeof t.correctAnswers === 'object' ? (t.correctAnswers?.total || 0) : Number(t.correctAnswers || 0);
          const time = Number(t.completionTime || 0);
          teamMap.set(num, {
            groupId: `team_${num}`,
            groupName: (t.name || `Kelompok ${num}`).trim(),
            teamNumber: num,
            numberChainsScore: Number(t.scores?.game1 ?? t.numberChainsScore ?? 0),
            startChampScore: Number(t.scores?.game2 ?? t.startChampScore ?? 0),
            cryptarithmWarScore: Number(t.scores?.game3 ?? t.cryptarithmWarScore ?? 0),
            totalScore,
            correctAnswers: corr,
            completionTime: time,
            status: t.status || (t.progress?.game3Submitted ? 'FINISHED' : 'PLAYING'),
            claimed: Boolean(t.claimed),
            updatedAt: t.lastActive || t.joinedAt || 0
          });
        });
      }

      // 2. Overlay / Merge session.leaderboard
      if (session.leaderboard && typeof session.leaderboard === 'object') {
        Object.values(session.leaderboard).forEach((lb) => {
          if (!lb) return;
          const num = parseInt(lb.teamNumber, 10);
          if (isNaN(num)) return;
          const existing = teamMap.get(num) || {
            groupId: `team_${num}`,
            groupName: `Kelompok ${num}`,
            teamNumber: num,
            numberChainsScore: 0,
            startChampScore: 0,
            cryptarithmWarScore: 0,
            totalScore: 0,
            correctAnswers: 0,
            completionTime: 0,
            status: 'PLAYING',
            claimed: true,
            updatedAt: 0
          };

          existing.groupName = lb.groupName || existing.groupName;
          existing.numberChainsScore = Math.max(existing.numberChainsScore, Number(lb.numberChainsScore || 0));
          existing.startChampScore = Math.max(existing.startChampScore, Number(lb.startChampScore || 0));
          existing.cryptarithmWarScore = Math.max(existing.cryptarithmWarScore, Number(lb.cryptarithmWarScore || 0));
          existing.totalScore = Math.max(existing.totalScore, Number(lb.totalScore || 0));
          existing.correctAnswers = Math.max(existing.correctAnswers, Number(lb.correctAnswers || 0));
          if (lb.completionTime) existing.completionTime = Number(lb.completionTime);
          if (lb.status) existing.status = lb.status;
          if (lb.updatedAt) existing.updatedAt = Number(lb.updatedAt);
          teamMap.set(num, existing);
        });
      }

      let list = Array.from(teamMap.values());

      // Filter: only show active teams that either claimed a slot, have scores > 0, or custom name
      const activeList = list.filter((t) => t.claimed || t.totalScore > 0 || (t.groupName && t.groupName !== `Kelompok ${t.teamNumber}`));
      if (activeList.length > 0) {
        list = activeList;
      }

      // Sort: 1. Total Score DESC, 2. Correct Answers DESC, 3. Completion Time ASC
      list.sort((a, b) => {
        const scoreA = Number(a.totalScore) || 0;
        const scoreB = Number(b.totalScore) || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        const corrA = Number(a.correctAnswers) || 0;
        const corrB = Number(b.correctAnswers) || 0;
        if (corrB !== corrA) {
          return corrB - corrA;
        }

        const timeA = Number(a.completionTime) || 0;
        const timeB = Number(b.completionTime) || 0;
        return timeA - timeB;
      });

      return list;
    };

    return this.listenToSession(cleanCode, (session) => {
      const sortedList = compileLeaderboard(session);
      callback(sortedList, session);
    });
  }

  /**
   * LISTEN TO SESSION IN REALTIME (FIREBASE RTDB + STORAGE)
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

    // 1. Single Live Firebase RTDB Listener per sessionCode
    if (!this.activeSubscriptions.has(cleanCode)) {
      let fbUnsub = null;
      let isCancelled = false;

      this.ensureReady().then(() => {
        if (isCancelled) return;
        if (this.isFirebaseReady && this.db && this.fbRef && this.fbOnValue) {
          try {
            const sRef = this.fbRef(this.db, `sessions/${cleanCode}`);
            fbUnsub = this.fbOnValue(sRef, (snap) => {
              const val = typeof snap.val === 'function' ? snap.val() : null;
              if (val) {
                this.notifySessionUpdate(cleanCode, val);
              }
            });
          } catch (e) {
            console.warn('Firebase onValue attach error:', e);
          }
        }
      });

      this.activeSubscriptions.set(cleanCode, () => {
        isCancelled = true;
        if (typeof fbUnsub === 'function') {
          try { fbUnsub(); } catch (e) {}
        }
      });
    }

    // 2. Storage event for multi-tab
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
   * GET SESSION (MEMORY -> LOCALSTORAGE -> FIREBASE RTDB)
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

    // 3. Firebase RTDB
    await this.ensureReady();
    if (this.isFirebaseReady && this.db && this.fbRef && this.fbGet) {
      try {
        const sRef = this.fbRef(this.db, `sessions/${cleanCode}`);
        const snap = await this.fbGet(sRef);
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
      } catch (e) {
        console.warn('Firebase getSession error:', e);
      }
    }

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
