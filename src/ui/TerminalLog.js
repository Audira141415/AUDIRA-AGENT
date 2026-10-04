/**
 * TerminalLog.js - 3D AI Game Studio Telemetry & Operations Console
 * Displays live agent events, engine telemetry, and game production subsystem health.
 * Fully collapsible to keep the 3D Studio screen unobstructed.
 */

export class TerminalLog {
  constructor({ container }) {
    this.container = container;
    this.activeTab = 'logs'; // 'logs' | 'health'
    this.filter = 'all';     // 'all' | 'alert' | 'agent' | 'system'
    this.isMinimized = false;
    this.logs = [];

    // Game Engine & Studio Subsystem metrics
    this.subsystems = [
      { name: 'WebGL 3D Render Pipeline', status: 'optimal', value: '60.0 FPS (16.6ms)', badge: 'Three.js r186' },
      { name: '3D Asset .GLB Parser', status: 'optimal', value: '14.8k Verts (Baked)', badge: 'Draco / GLTF' },
      { name: 'Multiplayer Netcode Host', status: 'optimal', value: 'Tickrate 64Hz (18ms)', badge: 'Lag Compensation' },
      { name: 'Polyphonic Audio Synth', status: 'optimal', value: '8 Stereo Channels', badge: 'Web Audio API' },
      { name: 'QA Automated Bot Suite', status: 'optimal', value: '1,420 Tests Passed', badge: '0 Crash Bugs' },
    ];

    this.render();
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const card = this.container.querySelector('.terminal-card');
    if (card) {
      if (this.isMinimized) {
        card.classList.add('minimized');
      } else {
        card.classList.remove('minimized');
      }
    }
  }

  clear() {
    this.logs = [];
    this.renderFeed();
  }

  addLog({ agent, text, type = 'info' }) {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    this.logs.unshift({ time, agent, text, type });
    if (this.logs.length > 120) this.logs.pop();
    this.renderFeed();
  }

  render() {
    this.container.innerHTML = `
      <div class="terminal-card glass-panel ${this.isMinimized ? 'minimized' : ''}" id="terminalPanel">
        <!-- Header Bar -->
        <div class="terminal-header">
          <div class="header-left">
            <span class="status-pulse-dot"></span>
            <span class="terminal-title">STUDIO TELEMETRI &amp; LOG ENGINE</span>
            <span class="events-badge" id="eventCount">${this.logs.length} events</span>
          </div>

          <!-- Nav Tabs -->
          <div class="terminal-nav-tabs">
            <button class="t-tab-btn ${this.activeTab === 'logs' ? 'active' : ''}" data-tab="logs">
              <span>🖥️ Event Log</span>
            </button>
            <button class="t-tab-btn ${this.activeTab === 'health' ? 'active' : ''}" data-tab="health">
              <span>📊 Studio Health</span>
            </button>
          </div>

          <!-- Header Controls -->
          <div class="terminal-actions">
            <button class="t-btn" id="tBtnClear" title="Bersihkan Log">Clear</button>
            <button class="t-btn minimize-btn" id="tBtnToggle" title="Minimize / Expand">
              ${this.isMinimized ? '□' : '_'}
            </button>
          </div>
        </div>

        <!-- Filter Pills Bar (Only for Log Tab) -->
        <div class="terminal-filter-bar ${this.activeTab === 'logs' ? '' : 'hidden'}" id="filterBar">
          <span class="filter-label">Filter:</span>
          ${['all', 'alert', 'agent', 'system'].map(f => `
            <button class="filter-chip ${this.filter === f ? 'active' : ''}" data-filter="${f}">
              ${f.toUpperCase()}
            </button>
          `).join('')}
        </div>

        <!-- TAB 1: Live Event Feed -->
        <div class="tab-pane ${this.activeTab === 'logs' ? 'active' : ''}" id="paneLogs">
          <div class="terminal-feed custom-scrollbar" id="terminalFeed">
            <div class="log-line system">
              <span class="t-time">00:00:00</span>
              <span class="t-badge sys">STUDIO HQ</span>
              <span class="t-msg">Pusat Komando Virtual Game Studio &amp; Master Production Wall Siaga Penuh.</span>
            </div>
          </div>
        </div>

        <!-- TAB 2: SCADA Subsystem Health Matrix -->
        <div class="tab-pane ${this.activeTab === 'health' ? 'active' : ''}" id="paneHealth">
          <div class="health-matrix-grid custom-scrollbar">
            ${this.subsystems.map(sub => `
              <div class="health-row">
                <div class="health-info">
                  <span class="sub-indicator dot-healthy"></span>
                  <span class="sub-label">${sub.name}</span>
                </div>
                <div class="health-meta">
                  <span class="sub-val">${sub.value}</span>
                  <span class="sub-badge">${sub.badge}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderFeed();
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#tBtnToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleMinimize();
        toggleBtn.textContent = this.isMinimized ? '□' : '_';
      });
    }

    const clearBtn = this.container.querySelector('#tBtnClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clear());
    }

    const tabBtns = this.container.querySelectorAll('.t-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterBar = this.container.querySelector('#filterBar');
        if (filterBar) {
          if (this.activeTab === 'logs') filterBar.classList.remove('hidden');
          else filterBar.classList.add('hidden');
        }

        const paneLogs = this.container.querySelector('#paneLogs');
        const paneHealth = this.container.querySelector('#paneHealth');
        if (paneLogs && paneHealth) {
          if (this.activeTab === 'logs') {
            paneLogs.classList.add('active');
            paneHealth.classList.remove('active');
          } else {
            paneLogs.classList.remove('active');
            paneHealth.classList.add('active');
          }
        }
      });
    });

    const filterChips = this.container.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.filter = chip.dataset.filter;
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderFeed();
      });
    });
  }

  renderFeed() {
    const feed = this.container.querySelector('#terminalFeed');
    const countEl = this.container.querySelector('#eventCount');
    if (countEl) countEl.textContent = `${this.logs.length} events`;
    if (!feed) return;

    const filtered = this.logs.filter(l => {
      if (this.filter === 'all') return true;
      if (this.filter === 'alert') return l.type === 'error' || l.type === 'alert';
      if (this.filter === 'agent') return l.type === 'agent' || l.type === 'coding' || l.type === 'testing';
      if (this.filter === 'system') return l.type === 'system' || l.type === 'success';
      return true;
    });

    if (filtered.length === 0) {
      feed.innerHTML = `
        <div class="log-empty-placeholder">
          Tidak ada event log yang sesuai dengan filter '${this.filter}'.
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered.map(l => {
      let badgeClass = 'sys';
      let badgeText = l.agent || 'SYSTEM';

      if (l.type === 'error' || l.type === 'alert') {
        badgeClass = 'error';
      } else if (l.type === 'agent') {
        badgeClass = 'agent';
      } else if (l.type === 'success') {
        badgeClass = 'success';
      }

      return `
        <div class="log-line ${l.type || 'info'}">
          <span class="t-time">${l.time}</span>
          <span class="t-badge ${badgeClass}">${badgeText}</span>
          <span class="t-msg">${l.text}</span>
        </div>
      `;
    }).join('');
  }

  // Compatibility helpers
  resetPipeline() {}
  updatePipelineStage() {}
  switchTab(tab) {
    const btn = this.container.querySelector(`.t-tab-btn[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
}
