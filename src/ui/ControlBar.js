/**
 * ControlBar.js - Top Header & Live 3D Studio Telemetry Breadcrumb Bar
 * Placed at the top of the main viewport alongside the Left Sidebar.
 */

import { audio } from '../engine/AudioManager.js';

export class ControlBar {
  constructor({
    container,
    engine3D,
    registry,
    bridge,
    onSelectAgent,
    onOpenVideoWall,
    onOpenAssetManager,
    onOpenAiConfig,
    onToggleInspector,
    onToggleTerminal,
    onToggleZen,
    onToggleSidebar,
    onToggleRunwayDeck
  }) {
    this.container = container;
    this.engine3D = engine3D;
    this.registry = registry;
    this.bridge = bridge;
    this.onSelectAgent = onSelectAgent || (() => {});
    this.onOpenVideoWall = onOpenVideoWall || (() => {});
    this.onOpenAssetManager = onOpenAssetManager || (() => {});
    this.onOpenAiConfig = onOpenAiConfig || (() => {});
    this.onToggleInspector = onToggleInspector || (() => {});
    this.onToggleTerminal = onToggleTerminal || (() => {});
    this.onToggleZen = onToggleZen || (() => {});
    this.onToggleSidebar = onToggleSidebar || (() => {});
    this.onToggleRunwayDeck = onToggleRunwayDeck || (() => {});

    this.isZen = false;

    this.render();
  }

  setBridgeConnected(connected) {
    const pill = this.container.querySelector('#topBridgePill');
    if (pill) {
      if (connected) {
        pill.classList.add('online');
        pill.querySelector('.pill-text').textContent = 'Bridge: Live';
      } else {
        pill.classList.remove('online');
        pill.querySelector('.pill-text').textContent = 'Studio Local';
      }
    }
  }

  updateHostMetrics(data) {
    if (!data) return;
    const cpuEl = this.container.querySelector('#topMetricCpu');
    const ramEl = this.container.querySelector('#topMetricRam');
    const hostEl = this.container.querySelector('#topMetricHost');

    if (cpuEl) {
      cpuEl.textContent = `${data.cpuPercent}% (${data.cpuCores} Cores)`;
      cpuEl.style.color = data.cpuPercent > 80 ? '#f43f5e' : data.cpuPercent > 50 ? '#fbbf24' : '#38bdf8';
    }
    if (ramEl) {
      ramEl.textContent = `${data.usedMemGB} / ${data.totalMemGB} GB (${data.memPercent}%)`;
      ramEl.style.color = data.memPercent > 85 ? '#f43f5e' : '#10b981';
    }
    if (hostEl) {
      hostEl.textContent = `${data.hostname} (${data.uptimeStr})`;
    }
  }

  updateEcosystemHealth(eco) {
    if (!eco) return;
    const dcosEl = this.container.querySelector('#topMetricDcos');
    const gpuEl = this.container.querySelector('#topMetricGpu');
    const aiEl = this.container.querySelector('#topMetricAi');

    if (dcosEl && eco.dcos) {
      const isOnline = eco.dcos.status === 'online';
      dcosEl.textContent = isOnline ? 'ONLINE' : 'STANDBY';
      dcosEl.style.color = isOnline ? '#10b981' : '#64748b';
      const pill = dcosEl.closest('.scada-pill');
      if (pill) {
        pill.setAttribute('title', `AUDIRA-DCOS: ${eco.dcos.status.toUpperCase()} (Port ${eco.dcos.port})`);
        const dot = pill.querySelector('.dot-online');
        if (dot) dot.style.background = isOnline ? '#10b981' : '#64748b';
      }
    }

    if (gpuEl && eco.aiStudio) {
      const isOnline = eco.aiStudio.status === 'online';
      const vramStr = eco.aiStudio.vramFreeMb ? `${(eco.aiStudio.vramFreeMb / 1024).toFixed(1)}G` : '12G';
      gpuEl.textContent = isOnline ? `RTX 3060 (${vramStr})` : 'OFFLINE';
      gpuEl.style.color = isOnline ? '#10b981' : '#64748b';
      const pill = gpuEl.closest('.scada-pill');
      if (pill) {
        pill.setAttribute('title', `AUDIRA 3D GPU Worker: ${eco.aiStudio.name} (VRAM Free: ${eco.aiStudio.vramFreeMb} MB)`);
        const dot = pill.querySelector('.dot-online');
        if (dot) dot.style.background = isOnline ? '#10b981' : '#64748b';
      }
    }

    if (aiEl && eco.ollama) {
      const isOllamaOnline = eco.ollama.status === 'online';
      const isGemini = eco.gemini?.status === 'configured';
      const label = isGemini ? 'GEMINI + OLLAMA' : isOllamaOnline ? `OLLAMA (${eco.ollama.models?.length || 0}M)` : 'LOCAL PERSONA';
      aiEl.textContent = label;
      aiEl.style.color = (isGemini || isOllamaOnline) ? '#38bdf8' : '#fbbf24';
      const pill = aiEl.closest('.scada-pill');
      if (pill) {
        pill.setAttribute('title', `AI Reasoning: ${label}. Ready for live dispatch & comm-links.`);
        const dot = pill.querySelector('.dot-online');
        if (dot) dot.style.background = (isGemini || isOllamaOnline) ? '#38bdf8' : '#fbbf24';
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="topbar-inner glass-panel">
        <!-- Left: Sidebar Toggle & Breadcrumb Navigation -->
        <div class="topbar-breadcrumb">
          <button class="topbar-menu-toggle-btn" id="topBtnToggleSidebar" title="Buka / Tutup Sidebar Menu (Ctrl+B)">
            <span class="menu-icon">☰</span>
            <span class="menu-label">MENU</span>
          </button>
          <span class="bc-root">AUDIRA STUDIO</span>
          <span class="bc-sep">/</span>
          <span class="bc-section">AI Game Dev &amp; 3D Workshop</span>
          <span class="bc-sep">/</span>
          <span class="bc-current">Virtual Studio 3D</span>
          <span class="facility-pill">ALPHA v0.9.4</span>
        </div>

        <!-- Center: Live Real Hardware & System Telemetry Badges -->
        <div class="topbar-telemetry">
          <div class="scada-pill" title="Real Host CPU Utilization">
            <span class="dot-online"></span>
            <span class="pill-label">CPU:</span>
            <span class="pill-val" id="topMetricCpu" style="color: #38bdf8; font-weight: 700;">Loading...</span>
          </div>

          <div class="scada-pill" title="Real Host Memory (RAM) Allocation">
            <span class="dot-online"></span>
            <span class="pill-label">RAM:</span>
            <span class="pill-val" id="topMetricRam" style="color: #10b981; font-weight: 700;">Loading...</span>
          </div>

          <div class="scada-pill" title="3D Catwalk Runway Status">
            <span class="dot-online"></span>
            <span class="pill-label">RUNWAY:</span>
            <span class="pill-val" id="topMetricRunway" style="color: #38bdf8; font-weight: 700;">8 SLOTS 56M</span>
          </div>

          <div class="scada-pill" title="AUDIRA Studio Hub (DCOS) Status">
            <span class="dot-online"></span>
            <span class="pill-label">STUDIO HUB:</span>
            <span class="pill-val" id="topMetricDcos" style="color: #10b981; font-weight: 700;">ONLINE</span>
          </div>

          <div class="scada-pill" title="NVIDIA RTX 3060 CUDA 3D Worker Status">
            <span class="dot-online"></span>
            <span class="pill-label">3D GPU:</span>
            <span class="pill-val" id="topMetricGpu" style="color: #10b981; font-weight: 700;">RTX 3060</span>
          </div>

          <div class="scada-pill" id="topBtnAiConfig" title="Autonomous AI Reasoning Engine - Klik untuk Konfigurasi Multi-Tier LLM" style="cursor: pointer;">
            <span class="dot-online" style="background: #38bdf8;"></span>
            <span class="pill-label">AI CORE:</span>
            <span class="pill-val" id="topMetricAi" style="color: #38bdf8; font-weight: 700;">OLLAMA (6M)</span>
          </div>
        </div>

        <!-- Right: Action Buttons & Modal Trigger -->
        <div class="topbar-actions">
          <!-- 3D Asset & GLB Pipeline Workshop Trigger -->
          <button class="topbar-cta-btn topbar-cta-glb" id="topBtnAssetManager" title="Buka 3D Asset Workshop & Upload Model .GLB" style="border-color: #38bdf8; background: linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(37, 99, 235, 0.3));">
            <span class="cta-icon">📤</span>
            <span class="cta-text">UPLOAD ASSET .GLB</span>
          </button>

          <!-- Master Production Wall 9-Screen Trigger -->
          <button class="topbar-cta-btn" id="topBtnVideoWall" title="Buka Kontrol Telemetri & Siaran Arahan Master Production Wall 9-Layar">
            <span class="cta-pulse"></span>
            <span class="cta-text">MASTER PRODUCTION WALL</span>
          </button>

          <!-- Drawer & Console Toggles -->
          <div class="topbar-toggle-group">
            <button class="topbar-icon-btn" id="topBtnInspector" title="Buka / Tutup Drawer Operator">
              <span>📋</span>
            </button>
            <button class="topbar-icon-btn" id="topBtnTerminal" title="Buka / Tutup Console Telemetri">
              <span>📟</span>
            </button>
            <button class="topbar-icon-btn" id="topBtnZen" title="Zen Mode: Sembunyikan UI untuk Visual 3D Penuh">
              <span>👁️</span>
            </button>
          </div>

          <!-- Network Bridge Pill -->
          <div class="bridge-pill local" id="topBridgePill">
            <span class="bridge-dot"></span>
            <span class="pill-text">Studio Local</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnToggleSidebar = this.container.querySelector('#topBtnToggleSidebar');
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        this.onToggleSidebar();
        audio.playBlip();
      });
    }

    const btnAiConfig = this.container.querySelector('#topBtnAiConfig');
    if (btnAiConfig) {
      btnAiConfig.addEventListener('click', () => {
        this.onOpenAiConfig();
        audio.playClick();
      });
    }

    const pillRunway = this.container.querySelector('#topMetricRunway')?.closest('.scada-pill');
    if (pillRunway) {
      pillRunway.style.cursor = 'pointer';
      pillRunway.addEventListener('click', () => {
        this.onToggleRunwayDeck();
        if (this.engine3D?.flyToSector) {
          this.engine3D.flyToSector('conveyor_runway');
        }
        audio.playClick();
      });
    }

    const btnAssetManager = this.container.querySelector('#topBtnAssetManager');
    if (btnAssetManager) {
      btnAssetManager.addEventListener('click', () => {
        this.onOpenAssetManager();
        audio.playClick();
      });
    }

    const btnVideoWall = this.container.querySelector('#topBtnVideoWall');
    if (btnVideoWall) {
      btnVideoWall.addEventListener('click', () => {
        this.onOpenVideoWall();
        audio.playClick();
      });
    }

    const btnInspector = this.container.querySelector('#topBtnInspector');
    if (btnInspector) {
      btnInspector.addEventListener('click', () => {
        this.onToggleInspector();
        audio.playClick();
      });
    }

    const btnTerminal = this.container.querySelector('#topBtnTerminal');
    if (btnTerminal) {
      btnTerminal.addEventListener('click', () => {
        this.onToggleTerminal();
        audio.playClick();
      });
    }

    const btnZen = this.container.querySelector('#topBtnZen');
    if (btnZen) {
      btnZen.addEventListener('click', () => {
        this.isZen = !this.isZen;
        this.onToggleZen(this.isZen);
        btnZen.classList.toggle('active', this.isZen);
        audio.playClick();
      });
    }
  }
}
