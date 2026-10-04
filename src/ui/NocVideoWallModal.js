/**
 * NocVideoWallModal.js - High-Tech NOC Master Video Wall HUD Modal
 * Adopted directly from AUDIRA-DCOS (datacenter-dashboard)
 * Allows the user to inspect real-time SCADA telemetry and broadcast official
 * HQ Executive Directives live onto the 3D Video Wall canvas in the office!
 */

import { audio } from '../engine/AudioManager.js';

export class NocVideoWallModal {
  constructor({ container, videoWallTexture, onBroadcastDirective, onClearDirective }) {
    this.container = container;
    this.videoWallTexture = videoWallTexture;
    this.onBroadcastDirective = onBroadcastDirective || (() => {});
    this.onClearDirective = onClearDirective || (() => {});

    this.isOpen = false;
    this.activeTab = 'directive';

    this.presetDirectives = [
      '🎮 SPRINT MILESTONE: Alpha v0.9.4 Feature Freeze - Seluruh tim fokus polishing & zero-bug release.',
      '📦 3D ASSET WORKSHOP: Pipeline model .GLB terintegrasi, draw calls di bawah 400.',
      '🚀 DEMO DAY READY: Build Three.js 60 FPS stabil di mobile & desktop.',
      '🌐 MULTIPLAYER READY: Netcode tickrate 64Hz dengan lag compensation aktif.',
      '🎵 AUDIO SYNTH: Dynamic OST adaptif terkalibrasi dengan gameplay combat.',
      '👥 TEAM CELEBRATION: Milestone selesai lebih awal, pizza & coffee break di pantry studio!'
    ];

    this.render();
  }

  open() {
    this.isOpen = true;
    this.render();
    const modalEl = this.container.querySelector('.noc-videowall-backdrop');
    if (modalEl) modalEl.classList.add('visible');
    audio.playBeep(880, 0.08, 'sine');
  }

  close() {
    this.isOpen = false;
    const modalEl = this.container.querySelector('.noc-videowall-backdrop');
    if (modalEl) modalEl.classList.remove('visible');
  }

  render() {
    this.container.innerHTML = `
      <div class="noc-videowall-backdrop ${this.isOpen ? 'visible' : ''}">
        <div class="noc-videowall-modal glass-panel">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-title-box">
              <span class="header-icon">🎮</span>
              <div>
                <div class="header-title">GAME DEV STUDIO // 9-SCREEN MASTER PRODUCTION WALL</div>
                <div class="header-sub">AUDIRA VIRTUAL AI INDIE GAME DEV &amp; 3D ASSET WORKSHOP</div>
              </div>
            </div>
            <button class="modal-close-btn" id="btnModalClose" title="Tutup Modal (Esc)">✕</button>
          </div>

          <!-- Tabs Navigation -->
          <div class="modal-tabs">
            <button class="tab-btn ${this.activeTab === 'directive' ? 'active' : ''}" data-tab="directive">
              📢 Broadcast Studio Directive
            </button>
            <button class="tab-btn ${this.activeTab === 'engine_3d' ? 'active' : ''}" data-tab="engine_3d">
              🎮 Engine &amp; 3D Assets
            </button>
            <button class="tab-btn ${this.activeTab === 'network_sec' ? 'active' : ''}" data-tab="network_sec">
              🌐 Netcode &amp; QA Bots
            </button>
          </div>

          <!-- Tab Content Area -->
          <div class="modal-body">
            ${this.renderActiveTabContent()}
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="footer-status">
              <span class="pulse-dot"></span>
              <span class="footer-status-text">
                Layar 3D: ${this.videoWallTexture.customDirectiveText ? 'Arahan Direksi Terpasang' : 'Feed Standar Aktif'}
              </span>
            </div>
            <div class="footer-actions">
              <button class="chip-btn chip-danger" id="btnClearDirective">
                ↺ Lepas Arahan / Reset Feed Normal
              </button>
              <button class="chip-btn chip-neutral" id="btnFooterClose">Tutup</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderActiveTabContent() {
    if (this.activeTab === 'directive') {
      return `
        <div class="tab-directive-content">
          <!-- Current Live Directive Display -->
          <div class="current-directive-banner">
            <div class="banner-badge">STATUS VIDEO WALL 3D SAAT INI</div>
            <div class="banner-text">"${this.videoWallTexture.customDirectiveText || 'Menampilkan Feed Telemetri 9 Layar Standar'}"</div>
          </div>

          <!-- Broadcast Custom Input Form -->
          <form id="directiveForm" class="directive-input-form">
            <label class="input-label">PASANG ARAHAN / PERINGATAN BARU KE LAYAR 3D:</label>
            <div class="input-group">
              <input 
                type="text" 
                id="directiveInput" 
                class="text-input" 
                placeholder="Ketik instruksi resmi atau peringatan insiden..."
                maxlength="120"
                required
              />
              <button type="submit" class="submit-btn" id="btnSubmitDirective">
                <span>⚡ Siarkan ke Layar 3D</span>
              </button>
            </div>
          </form>

          <!-- Preset Directive Chips -->
          <div class="preset-section">
            <div class="preset-title">PILIH TEMPLATE ARAHAN RESMI CEPAT:</div>
            <div class="preset-grid">
              ${this.presetDirectives.map(preset => `
                <button class="preset-card-btn" data-preset="${preset}">
                  <span class="preset-bullet">▸</span>
                  <span class="preset-text">${preset}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'engine_3d') {
      return `
        <div class="tab-metrics-content">
          <div class="telemetry-grid">
            <div class="metric-card">
              <div class="metric-label">THREE.JS RENDER PIPELINE</div>
              <div class="metric-value text-emerald">60.0 <span class="unit">FPS</span></div>
              <div class="metric-sub">Frametime: 16.6ms (Locked &amp; Smooth)</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">3D ASSET RUNWAY</div>
              <div class="metric-value text-cyan">8 / 8 <span class="unit">Slots</span></div>
              <div class="metric-sub">56m Catwalk Turntable Staging Active</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">GPU VRAM ALLOCATION</div>
              <div class="metric-value text-amber">1.84 <span class="unit">GB</span></div>
              <div class="metric-sub">NVIDIA RTX 3060 (12GB) CUDA Active</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">DRAW CALLS &amp; TOPOLOGY</div>
              <div class="metric-value text-emerald">342 <span class="unit">Calls</span></div>
              <div class="metric-sub">PBR Shaders &amp; Low-Poly Meshes Baked</div>
            </div>
          </div>
          <div class="system-status-box">
            <div class="box-title">🎮 STATUS GAME ENGINE &amp; WORKSHOP 3D:</div>
            <ul class="status-list">
              <li>✓ Three.js WebGL Engine running at locked 60 FPS (Zero Stutter)</li>
              <li>✓ 3D Conveyor Runway 56m synchronized with 8-slot turntable auto-rotation</li>
              <li>✓ PBR Shader Topologies &amp; Texture Maps compiled without GPU memory leak</li>
              <li>✓ TripoSR 360° AI 3D Generative Worker connected on port 8005</li>
            </ul>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'network_sec') {
      return `
        <div class="tab-metrics-content">
          <div class="telemetry-grid">
            <div class="metric-card">
              <div class="metric-label">MULTIPLAYER TICKRATE</div>
              <div class="metric-value text-cyan">64 <span class="unit">Hz</span></div>
              <div class="metric-sub">Client RTT Latency: 18.2ms (Zero Loss)</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">AUTOMATED QA BOT RUNS</div>
              <div class="metric-value text-purple">1,420 <span class="unit">Passed</span></div>
              <div class="metric-sub">Zero Crash Bugs on Sprint Alpha</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">WEBSOCKET BROADCAST</div>
              <div class="metric-value text-emerald">100 <span class="unit">% Up</span></div>
              <div class="metric-sub">Bridge Port 8080 Synchronized</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">ASSET INTEGRITY AUDIT</div>
              <div class="metric-value text-cyan">100 <span class="unit">%</span></div>
              <div class="metric-sub">SHA-256 Payload Validated &amp; Tamper-Free</div>
            </div>
          </div>
          <div class="system-status-box">
            <div class="box-title">🛡️ STATUS NETCODE &amp; QA AUTOMATION:</div>
            <ul class="status-list">
              <li>✓ Snapshot interpolation &amp; delta compression active across 8 game rooms</li>
              <li>✓ 50 automated bot playtesters active on NavMesh catwalk 56m</li>
              <li>✓ Real-time multi-agent communication bridge online (sub-ms ping)</li>
              <li>✓ Anti-cheat &amp; asset payload verification active</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  bindEvents() {
    const btnClose = this.container.querySelector('#btnModalClose');
    const btnFooterClose = this.container.querySelector('#btnFooterClose');
    const backdrop = this.container.querySelector('.noc-videowall-backdrop');
    const btnClear = this.container.querySelector('#btnClearDirective');

    if (btnClose) btnClose.addEventListener('click', () => this.close());
    if (btnFooterClose) btnFooterClose.addEventListener('click', () => this.close());
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Tabs Switcher
    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.render();
      });
    });

    // Clear Directive button
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.videoWallTexture.setDirective(null);
        this.onClearDirective();
        audio.playBeep(440, 0.1, 'sine');
        this.render();
      });
    }

    // Custom Directive Form Submission
    const form = this.container.querySelector('#directiveForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.container.querySelector('#directiveInput');
        const text = input ? input.value.trim() : '';
        if (text) {
          this.videoWallTexture.setDirective(text);
          this.onBroadcastDirective(text);
          audio.playSuccess();
          this.render();
        }
      });
    }

    // Preset Directive Cards
    const presetBtns = this.container.querySelectorAll('.preset-card-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-preset');
        if (text) {
          this.videoWallTexture.setDirective(text);
          this.onBroadcastDirective(text);
          audio.playSuccess();
          this.render();
        }
      });
    });
  }
}
