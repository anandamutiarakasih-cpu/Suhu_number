/**
 * CHAMPIONS OF CALOR: CLASH OF SCIENCE
 * Network Latency & Connection Health Service
 * Monitors round-trip latency, detects lag/disconnects, triggers notifications, and coordinates heartbeats.
 */

import { firebaseConfig } from '../config/firebase-config.js';
import { firebaseService } from './firebase-service.js';
import { audio } from './audio-service.js';
import { toast } from '../components/notification.js';

class NetworkService {
  constructor() {
    this.status = 'ONLINE'; // 'ONLINE' | 'LAG' | 'OFFLINE'
    this.latencyMs = 45;
    this.listeners = new Set();
    this.pingInterval = null;
    this.heartbeatInterval = null;
    this.currentSessionCode = null;
    this.currentTeamNumber = null;
    this.lastToastState = null;
    this.consecutiveFailures = 0;
    this.isChecking = false;

    this.init();
  }

  init() {
    // 1. Browser online/offline event listeners
    window.addEventListener('online', () => {
      this.consecutiveFailures = 0;
      this.checkLatency();
    });

    window.addEventListener('offline', () => {
      this.setStatus('OFFLINE', null);
    });

    // 2. Start periodic ping measurement (lightweight, every 25 seconds)
    this.checkLatency();
    this.pingInterval = setInterval(() => {
      this.checkLatency();
    }, 25000);
  }

  /**
   * Measure HTTP/RTDB Round-Trip Ping
   */
  async checkLatency() {
    if (this.isChecking) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('OFFLINE', null);
      return;
    }

    this.isChecking = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const pingTarget = firebaseConfig.databaseURL
      ? `${firebaseConfig.databaseURL}/.json?shallow=true`
      : 'https://suhunumber-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true';

    const tStart = performance.now();

    try {
      await fetch(pingTarget, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const tEnd = performance.now();
      const latency = Math.round(tEnd - tStart);

      this.consecutiveFailures = 0;

      if (latency >= 1500) {
        this.setStatus('LAG', latency);
      } else {
        this.setStatus('ONLINE', Math.min(latency, 120));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= 3) {
        this.setStatus('OFFLINE', null);
      } else {
        this.setStatus('LAG', 500);
      }
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Update Status and notify subscribers / show toasts
   */
  setStatus(newStatus, latency) {
    const prevStatus = this.status;
    this.status = newStatus;
    if (latency !== null) {
      this.latencyMs = latency;
    }

    // Only notify user if actually disconnected or reconnected (quietly handle LAG without sound/toasts)
    if (newStatus !== this.lastToastState) {
      if (newStatus === 'OFFLINE') {
        toast.error('❌ Koneksi internet terputus. Mencoba menyambung kembali...');
        this.lastToastState = 'OFFLINE';
      } else if (newStatus === 'ONLINE' && prevStatus === 'OFFLINE') {
        toast.success(`🟢 Koneksi internet kembali aktif.`);
        this.lastToastState = 'ONLINE';
      }
    }

    // Notify registered UI subscribers
    this.notifyListeners();

    // Trigger student heartbeat if active
    if (this.currentSessionCode && this.currentTeamNumber) {
      firebaseService.sendHeartbeat(this.currentSessionCode, this.currentTeamNumber, this.latencyMs);
    }
  }

  /**
   * Start sending heartbeats for a student team
   */
  startHeartbeat(sessionCode, teamNumber) {
    this.currentSessionCode = sessionCode;
    this.currentTeamNumber = teamNumber;

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    // Initial heartbeat
    firebaseService.sendHeartbeat(sessionCode, teamNumber, this.latencyMs);

    // Every 20 seconds (lightweight, avoids choking school network)
    this.heartbeatInterval = setInterval(() => {
      firebaseService.sendHeartbeat(this.currentSessionCode, this.currentTeamNumber, this.latencyMs);
    }, 20000);
  }

  stopHeartbeat() {
    this.currentSessionCode = null;
    this.currentTeamNumber = null;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
    // Send initial status immediately
    callback(this.getStatusInfo());
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    const info = this.getStatusInfo();
    this.listeners.forEach((cb) => {
      try { cb(info); } catch (e) {}
    });
  }

  getStatusInfo() {
    return {
      status: this.status,
      latencyMs: this.latencyMs,
      isLag: this.status === 'LAG',
      isOffline: this.status === 'OFFLINE',
      isOnline: this.status === 'ONLINE',
      label: this.status === 'ONLINE'
        ? `Online • ${this.latencyMs}ms`
        : this.status === 'LAG'
        ? `Lag • ${this.latencyMs}ms`
        : 'Terputus'
    };
  }

  /**
   * Helper to attach a live reactive connection badge into any DOM container
   */
  attachBadge(containerElement) {
    if (!containerElement) return () => {};

    const badge = document.createElement('div');
    badge.className = `tc-net-badge ${this.status.toLowerCase()}`;
    badge.title = `Koneksi Server: ${this.getStatusInfo().label}`;
    badge.innerHTML = `
      <span class="tc-net-dot"></span>
      <span class="tc-net-label">${this.getStatusInfo().label}</span>
    `;

    containerElement.appendChild(badge);

    const unsub = this.onStatusChange((info) => {
      badge.className = `tc-net-badge ${info.status.toLowerCase()}`;
      badge.title = `Koneksi Server: ${info.label}`;
      const labelEl = badge.querySelector('.tc-net-label');
      if (labelEl) labelEl.textContent = info.label;
    });

    return () => {
      unsub();
      badge.remove();
    };
  }
}

export const networkService = new NetworkService();
