/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Main Controller & View Router
 */

import { particleService } from './services/particle-service.js';
import { firebaseService } from './services/firebase-service.js';
import { audio } from './services/audio-service.js';
import { toast } from './components/notification.js';
import { showLabModal } from './components/modal.js';
import { networkService } from './services/network-service.js';
import { renderHomeView } from './views/home-view.js';
import { renderRegisterView } from './views/register-view.js';
import { renderWaitingView } from './views/waiting-view.js';
import { renderAdminView } from './views/admin-view.js';
import { renderGame1View } from './views/game1-view.js';
import { renderGame2View } from './views/game2-view.js';
import { renderGame3View } from './views/game3-view.js';
import { renderLeaderboardView } from './views/leaderboard-view.js';
import { loadStyle, preloadStyle } from './utils/asset-loader.js';
import { isMobileDevice } from './utils/device.js';

class ChampionsOfCalorApp {
  constructor() {
    this.appContainer = document.getElementById('app-main');
    this.canvas = document.getElementById('bg-canvas');
    this.currentViewInstance = null;
    this.currentRoute = null;
    this.state = {
      sessionCode: null,
      teamNumber: null
    };
  }

  init() {
    // Start Thermal Particles Background
    if (this.canvas) {
      particleService.init(this.canvas);
    }

    // Attach Refresh / BeforeUnload & Back Warning Handlers
    this.setupRefreshGuards();

    // Check if the page load was triggered by a browser refresh/reload
    let isPageReload = false;
    try {
      if (sessionStorage.getItem('tc_reloaded') === '1') {
        isPageReload = true;
        sessionStorage.removeItem('tc_reloaded');
      }
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0 && navEntries[0].type === 'reload') {
        isPageReload = true;
      } else if (performance.navigation && performance.navigation.type === 1) {
        isPageReload = true;
      }
    } catch (e) {}

    // Reset previous stored session so page refresh returns cleanly and resets to initial start
    firebaseService.clearStoredTeamSession();
    localStorage.removeItem('tc_active_admin_session');
    this.state.sessionCode = null;
    this.state.teamNumber = null;

    if (isPageReload) {
      // Clear URL query parameters on refresh so it strictly returns to clean initial start
      try {
        if (typeof window !== 'undefined' && window.history && window.location) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      // Reset sesuai perangkat: Mobile (Android/iPhone) ke Beranda Siswa, Desktop ke Dashboard Guru
      if (isMobileDevice()) {
        this.navigate('home');
        setTimeout(() => {
          toast.info('Sesi dimuat ulang: Anda berada di Beranda / Mode Siswa.');
        }, 400);
      } else {
        this.navigate('admin');
        setTimeout(() => {
          toast.info('Halaman dimuat ulang: Sesi permainan telah direset ulang ke awal di Dashboard Guru.');
        }, 400);
      }
      return;
    }

    // Check if session code was passed in URL (e.g. ?session=TC1234) on initial fresh load
    let urlCode = null;
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const rawCode = urlParams.get('session');
        if (rawCode) urlCode = rawCode.trim().toUpperCase();
      }
    } catch (e) {}

    if (urlCode) {
      this.state.sessionCode = urlCode;
      this.navigate('register', { sessionCode: urlCode });
    } else if (isMobileDevice()) {
      // Akses Android & iPhone otomatis langsung berada di Beranda / Mode Siswa
      this.navigate('home');
    } else {
      // Akses Desktop / Laptop otomatis langsung berada di Dashboard Guru
      this.navigate('admin');
    }
  }

  shouldWarnOnRefresh() {
    if (this.currentRoute && this.currentRoute !== 'home' && this.currentRoute !== 'admin') {
      return true;
    }
    if (this.state.sessionCode || this.state.teamNumber) {
      return true;
    }
    return false;
  }

  async resetToHome() {
    networkService.stopHeartbeat();
    const isStudent = Boolean(this.state.sessionCode && this.state.teamNumber);
    if (isStudent) {
      try {
        await firebaseService.leaveSession(this.state.sessionCode, this.state.teamNumber);
      } catch (e) {}
    }
    firebaseService.clearStoredTeamSession();
    localStorage.removeItem('tc_active_admin_session');
    this.state.sessionCode = null;
    this.state.teamNumber = null;

    // Clean URL query params if any
    try {
      if (typeof window !== 'undefined' && window.history && window.location) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {}

    if (isStudent || isMobileDevice()) {
      this.navigate('home');
    } else {
      this.navigate('admin');
    }
  }

  setupRefreshGuards() {
    // 1. Native browser beforeunload warning (browser reload button, tab close, pull refresh)
    window.addEventListener('beforeunload', (e) => {
      try {
        sessionStorage.setItem('tc_reloaded', '1');
      } catch (err) {}
      if (this.shouldWarnOnRefresh()) {
        e.preventDefault();
        const msg = 'Data sesi dan progres permainan akan direset dan kembali ke Dashboard awal jika dimuat ulang.';
        e.returnValue = msg;
        return msg;
      }
    });

    // 2. On actual unload / pagehide: release slot and clear stored session
    window.addEventListener('pagehide', () => {
      try {
        sessionStorage.setItem('tc_reloaded', '1');
      } catch (err) {}
      if (this.shouldWarnOnRefresh()) {
        if (this.state.sessionCode && this.state.teamNumber) {
          firebaseService.leaveSession(this.state.sessionCode, this.state.teamNumber);
        }
        firebaseService.clearStoredTeamSession();
        localStorage.removeItem('tc_active_admin_session');
      }
    });

    // 3. Intercept Keyboard Refresh (F5, Ctrl+R, Cmd+R)
    window.addEventListener('keydown', (e) => {
      if (
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))
      ) {
        if (this.shouldWarnOnRefresh()) {
          e.preventDefault();
          audio.playClick();
          showLabModal({
            title: 'PERINGATAN REFRESH HALAMAN',
            contentHtml: `
              <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
                <p style="margin-bottom:0.75rem;">
                  Apakah Anda yakin ingin memuat ulang halaman web?
                </p>
                <div style="background:rgba(239, 68, 68, 0.15); border-left:3px solid #ef4444; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#fca5a5; line-height:1.5;">
                  ⚠️ <strong>Perhatian:</strong> Jika direfresh, seluruh data sesi permainan Anda akan <strong>direset</strong> dan kembali ke <strong>awal di Dashboard</strong>.
                </div>
              </div>
            `,
            confirmText: 'Ya, Reset & Ke Dashboard',
            cancelText: 'Batal (Tetap Bermain)',
            onConfirm: async () => {
              toast.info('Mereset permainan ke dashboard awal...');
              await this.resetToHome();
            }
          });
        }
      }
    });

    // 4. Intercept Mobile / Android Back Button & Navigation
    window.addEventListener('popstate', () => {
      if (this.shouldWarnOnRefresh()) {
        // Prevent accidental back navigation by pushing current state back
        try {
          history.pushState(null, document.title, window.location.href);
        } catch (e) {}

        audio.playClick();
        showLabModal({
          title: 'PERINGATAN KELUAR KE DASHBOARD',
          contentHtml: `
            <div style="font-size:0.95rem; color:#f1f5f9; line-height:1.6;">
              <p style="margin-bottom:0.75rem;">
                Apakah Anda yakin ingin keluar dari sesi permainan?
              </p>
              <div style="background:rgba(239, 68, 68, 0.15); border-left:3px solid #ef4444; padding:0.85rem 1rem; border-radius:8px; font-size:0.88rem; color:#fca5a5; line-height:1.5;">
                ⚠️ <strong>Perhatian:</strong> Jika keluar, seluruh data sesi permainan Anda akan <strong>direset</strong> dan kembali ke <strong>awal di Dashboard</strong>.
              </div>
            </div>
          `,
          confirmText: 'Ya, Reset & Ke Dashboard',
          cancelText: 'Batal (Tetap Bermain)',
          onConfirm: async () => {
            toast.info('Mereset permainan ke dashboard awal...');
            await this.resetToHome();
          }
        });
      }
    });
  }

  routeByPhase(phase) {
    audio.playPhaseTransition();
    const phaseNames = {
      'LOBBY': 'Lobi Persiapan',
      'GAME1': 'Game 1: Number Chains',
      'GAME2': 'Game 2: Start Champ',
      'GAME3': 'Game 3: Cryptarithm War',
      'FINISHED': 'Klasemen Akhir (Leaderboard)'
    };
    const title = phaseNames[phase] || phase;
    toast.info(`Beralih serentak ke fase: ${title}`);

    switch (phase) {
      case 'LOBBY':
        this.navigate('waiting');
        break;
      case 'GAME1':
        this.navigate('game1');
        break;
      case 'GAME2':
        this.navigate('game2');
        break;
      case 'GAME3':
        this.navigate('game3');
        break;
      case 'FINISHED':
        this.navigate('leaderboard');
        break;
      default:
        this.navigate('waiting');
    }
  }

  navigate(route, params = {}) {
    if (this.currentViewInstance && typeof this.currentViewInstance.destroy === 'function') {
      this.currentViewInstance.destroy();
      this.currentViewInstance = null;
    }

    this.currentRoute = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Track navigation in browser history for mobile back gesture interception
    try {
      if (route !== 'home') {
        history.pushState({ route }, document.title, window.location.href);
      }
    } catch (e) {}

    switch (route) {
      case 'home':
        this.currentViewInstance = renderHomeView(this.appContainer, {
          onJoinTeam: (sessionCode) => {
            this.state.sessionCode = sessionCode;
            this.navigate('register', { sessionCode });
          },
          onOpenAdmin: () => {
            if (isMobileDevice()) {
              toast.warning('Akses Terbatas: Pusat Kendali Guru hanya dapat diakses melalui Desktop / Laptop.');
              return;
            }
            this.navigate('admin');
          }
        });
        break;

      case 'register':
        this.currentViewInstance = renderRegisterView(this.appContainer, {
          sessionCode: params.sessionCode || this.state.sessionCode,
          onRegistered: (code, num, currentPhase) => {
            this.state.sessionCode = code;
            this.state.teamNumber = num;
            if (currentPhase && currentPhase !== 'LOBBY') {
              this.routeByPhase(currentPhase);
            } else {
              this.navigate('waiting');
            }
          },
          onBack: () => {
            this.navigate('home');
          }
        });
        break;

      case 'waiting':
        preloadStyle('css/game1.css?v=3.0');
        this.currentViewInstance = renderWaitingView(this.appContainer, {
          sessionCode: this.state.sessionCode,
          teamNumber: this.state.teamNumber,
          onPhaseChange: (newPhase) => {
            this.routeByPhase(newPhase);
          },
          onCancel: () => {
            this.state.teamNumber = null;
            this.navigate('register', { sessionCode: this.state.sessionCode });
          }
        });
        break;

      case 'admin':
        if (isMobileDevice()) {
          toast.warning('Akses Terbatas: Pusat Kendali Guru hanya dapat diakses melalui Desktop / Laptop.');
          this.navigate('home');
          break;
        }
        this.currentViewInstance = renderAdminView(this.appContainer, {
          onExit: () => {
            this.navigate('home');
          }
        });
        break;

      case 'game1':
        loadStyle('css/game1.css?v=3.0');
        preloadStyle('css/game2.css?v=3.0');
        this.currentViewInstance = renderGame1View(this.appContainer, {
          sessionCode: this.state.sessionCode,
          teamNumber: this.state.teamNumber,
          onResetToHome: () => this.resetToHome(),
          onNextGame: () => {
            this.navigate('game2');
          },
          onGameCompleted: () => {},
          onPhaseChange: (newPhase) => {
            this.routeByPhase(newPhase);
          }
        });
        break;

      case 'game2':
        loadStyle('css/game2.css?v=3.0');
        preloadStyle('css/game3.css?v=3.0');
        this.currentViewInstance = renderGame2View(this.appContainer, {
          sessionCode: this.state.sessionCode,
          teamNumber: this.state.teamNumber,
          onResetToHome: () => this.resetToHome(),
          onNextGame: () => {
            this.navigate('game3');
          },
          onGameCompleted: () => {
            // Completed Game 2
          },
          onPhaseChange: (newPhase) => {
            this.routeByPhase(newPhase);
          }
        });
        break;

      case 'game3':
        loadStyle('css/game3.css?v=3.0');
        preloadStyle('css/leaderboard.css?v=3.0');
        this.currentViewInstance = renderGame3View(this.appContainer, {
          sessionCode: this.state.sessionCode,
          teamNumber: this.state.teamNumber,
          onResetToHome: () => this.resetToHome(),
          onNextGame: () => {
            this.navigate('leaderboard');
          },
          onGameCompleted: () => {
            // Completed Game 3
          },
          onPhaseChange: (newPhase) => {
            this.routeByPhase(newPhase);
          }
        });
        break;

      case 'leaderboard':
        loadStyle('css/leaderboard.css?v=3.0');
        this.currentViewInstance = renderLeaderboardView(this.appContainer, {
          sessionCode: this.state.sessionCode,
          teamNumber: this.state.teamNumber,
          onHome: () => {
            this.resetToHome();
          },
          onPhaseChange: (newPhase) => {
            this.routeByPhase(newPhase);
          }
        });
        break;

      default:
        this.navigate('home');
    }
  }
}

// Bootstrap application safely (handles both fast-load and DOMContentLoaded)
function startApp() {
  const app = new ChampionsOfCalorApp();
  app.init();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
