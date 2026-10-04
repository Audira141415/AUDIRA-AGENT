/**
 * SidebarNav.js - AUDIRA-DCOS Style High-Tech Left Sidebar Navigation Menu
 * Provides full mission command, camera presets, agent roster, incident triggers, and system metrics.
 */

import { audio } from '../engine/AudioManager.js';

export class SidebarNav {
  constructor({
    container,
    engine3D,
    registry,
    workflow,
    bridge,
    onSelectAgent,
    onOpenVideoWall,
    onOpenAssetManager,
    onOpenAssetLibrary,
    onToggleInspector,
    onToggleTerminal,
    onToggleZen,
    onOpenAddAgent,
    onOpenAiConfig
  }) {
    this.container = container;
    this.engine3D = engine3D;
    this.registry = registry;
    this.workflow = workflow;
    this.bridge = bridge;
    this.onSelectAgent = onSelectAgent || (() => {});
    this.onOpenVideoWall = onOpenVideoWall || (() => {});
    this.onOpenAssetManager = onOpenAssetManager || (() => {});
    this.onOpenAssetLibrary = onOpenAssetLibrary || (() => {});
    this.onToggleInspector = onToggleInspector || (() => {});
    this.onToggleTerminal = onToggleTerminal || (() => {});
    this.onToggleZen = onToggleZen || (() => {});
    this.onOpenAddAgent = onOpenAddAgent || (() => {});
    this.onOpenAiConfig = onOpenAiConfig || (() => {});

    this.isCollapsed = false;
    this.activeLighting = 'night';
    this.isLofiActive = false;
    this.isMuted = false;
    this.sectionState = this.loadSectionState();

    this.render();
  }

  loadSectionState() {
    try {
      const saved = localStorage.getItem('audira_sidebar_sections_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      views: true,       // Komando & Views (default open)
      camera: true,      // Preset Kamera 3D (default open)
      agents: true,      // Armada AI Agents (default open)
      scenarios: false,  // Sprint & Scenarios (default collapsed for neatness!)
      ambience: false,   // Suasana & Audio (default collapsed for neatness!)
    };
  }

  saveSectionState() {
    try {
      localStorage.setItem('audira_sidebar_sections_v2', JSON.stringify(this.sectionState));
    } catch (e) {}
  }

  toggleSection(key, forceState = null) {
    const currentState = !!this.sectionState[key];
    const newState = forceState !== null ? forceState : !currentState;
    this.sectionState[key] = newState;
    this.saveSectionState();

    const groupEl = this.container.querySelector(`.sidebar-accordion-group[data-section-key="${key}"]`);
    if (groupEl) {
      groupEl.classList.toggle('is-open', newState);
      groupEl.classList.toggle('is-collapsed', !newState);
      const body = groupEl.querySelector('.accordion-body');
      if (body) {
        body.style.display = newState ? 'flex' : 'none';
      }
    }
  }

  expandAllSections() {
    Object.keys(this.sectionState).forEach((key) => {
      this.toggleSection(key, true);
    });
  }

  collapseAllSections() {
    Object.keys(this.sectionState).forEach((key) => {
      this.toggleSection(key, false);
    });
  }

  refresh() {
    this.render();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    const sidebar = this.container.querySelector('.dcos-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', this.isCollapsed);
    }
    document.body.classList.toggle('sidebar-collapsed', this.isCollapsed);
    // Trigger window resize so Three.js adjusts its viewport seamlessly
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }

  setBridgeStatus(connected) {
    const el = this.container.querySelector('#sidebarBridgeStatus');
    if (el) {
      if (connected) {
        el.className = 'sidebar-bridge-status online';
        el.querySelector('.bridge-text').textContent = 'Live Bridge: Terhubung';
      } else {
        el.className = 'sidebar-bridge-status local';
        el.querySelector('.bridge-text').textContent = 'Studio Local Mode';
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="dcos-sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebarPanel">
        <!-- Sidebar Brand Header -->
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="sidebar-logo">🎮</span>
            <div class="sidebar-brand-text">
              <span class="brand-name">AUDIRA STUDIO</span>
              <span class="brand-badge">AI GAME DEV &amp; 3D</span>
            </div>
          </div>
          <button class="sidebar-toggle-btn" id="btnToggleSidebar" title="Ciutkan / Lebarkan Menu (Ctrl+B)">
            <span class="toggle-icon">◀</span>
          </button>
        </div>

        <!-- Navigation Scrollable Body -->
        <div class="sidebar-body custom-scrollbar">
          <!-- TOP GROUP ACTIONS TOOLBAR -->
          <div class="sidebar-group-toolbar">
            <span class="group-toolbar-title">PILIHAN FITUR // GRUP</span>
            <div class="group-toolbar-btns">
              <button type="button" class="btn-group-toggle" id="btnSidebarExpandAll" title="Buka Semua Grup">⊞ Buka Semua</button>
              <button type="button" class="btn-group-toggle" id="btnSidebarCollapseAll" title="Tutup Semua Grup">⊟ Ringkas</button>
            </div>
          </div>

          <!-- GROUP 1: PUSAT KOMANDO (COMMAND & VIEWS) -->
          <div class="sidebar-accordion-group ${this.sectionState.views ? 'is-open' : 'is-collapsed'}" data-section-key="views" id="secGroupViews">
            <div class="accordion-header" data-section-key="views" title="Klik untuk Buka / Tutup Grup">
              <div class="accordion-title-box">
                <span class="acc-icon">🎮</span>
                <span class="acc-title">KOMANDO &amp; VIEWS</span>
                <span class="acc-badge">4</span>
              </div>
              <span class="acc-chevron">▼</span>
            </div>
            
            <div class="accordion-body" id="accBodyViews" style="display: ${this.sectionState.views ? 'flex' : 'none'};">
              <button class="nav-item active" id="navItemNoc3D">
                <span class="nav-icon">🎮</span>
                <span class="nav-label">Virtual Studio 3D</span>
                <span class="nav-badge pulse">LIVE</span>
              </button>

              <button class="nav-item nav-item-highlight" id="navItemVideoWall">
                <span class="nav-icon">🖥️</span>
                <span class="nav-label">Master Production Wall</span>
                <span class="nav-badge glow">9-LAYAR</span>
              </button>

              <button class="nav-item nav-item-highlight" id="navItemAssetLibrary" style="border-color: rgba(16, 185, 129, 0.4);">
                <span class="nav-icon">📂</span>
                <span class="nav-label">Manajemen Aset GLB</span>
                <span class="nav-badge glow" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">REPOSITORY</span>
              </button>

              <button class="nav-item nav-item-highlight" id="navItemAssetManager" style="border-color: rgba(56, 189, 248, 0.4);">
                <span class="nav-icon">⚡</span>
                <span class="nav-label">Pasang &amp; Deploy GLB</span>
                <span class="nav-badge glow" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">WORKSHOP</span>
              </button>

              <button class="nav-item nav-item-highlight" id="navItemAiConfig" style="border-color: rgba(168, 85, 247, 0.4);">
                <span class="nav-icon">🤖</span>
                <span class="nav-label">AI Engine &amp; LLM</span>
                <span class="nav-badge glow" style="background: rgba(168, 85, 247, 0.2); color: #c084fc;">MULTI-TIER</span>
              </button>
            </div>
          </div>

          <!-- GROUP 2: PRESET KAMERA 3D -->
          <div class="sidebar-accordion-group ${this.sectionState.camera ? 'is-open' : 'is-collapsed'}" data-section-key="camera" id="secGroupCamera">
            <div class="accordion-header" data-section-key="camera" title="Klik untuk Buka / Tutup Grup">
              <div class="accordion-title-box">
                <span class="acc-icon">🎥</span>
                <span class="acc-title">PRESET KAMERA 3D</span>
                <span class="acc-badge">5</span>
              </div>
              <span class="acc-chevron">▼</span>
            </div>

            <div class="accordion-body" id="accBodyCamera" style="display: ${this.sectionState.camera ? 'flex' : 'none'};">
              <div class="camera-grid">
                <button class="cam-grid-btn active" id="camBtnHall" title="Pandangan Panoramik Studio Floor">
                  <span>🎥</span>
                  <span class="btn-text">Studio Floor</span>
                </button>
                <button class="cam-grid-btn" id="camBtnRunway" title="Fokus ke Catwalk Conveyor Pameran Bergerak 56m">
                  <span>🏃‍♂️</span>
                  <span class="btn-text">Runway 56m</span>
                </button>
                <button class="cam-grid-btn" id="camBtnWall" title="Fokus ke Production Wall 9-Layar">
                  <span>📺</span>
                  <span class="btn-text">Prod Wall</span>
                </button>
                <button class="cam-grid-btn" id="camBtnArthur" title="Fokus ke Meja Lead Producer Arthur">
                  <span>👤</span>
                  <span class="btn-text">Arthur Lead</span>
                </button>
                <button class="cam-grid-btn" id="camBtnTop" title="Pandangan Atas Top-Down Studio">
                  <span>🛰️</span>
                  <span class="btn-text">Top-Down</span>
                </button>
              </div>
            </div>
          </div>

          <!-- GROUP 3: ARMADA DEVELOPER (AGENTS) -->
          <div class="sidebar-accordion-group ${this.sectionState.agents ? 'is-open' : 'is-collapsed'}" data-section-key="agents" id="secGroupAgents">
            <div class="accordion-header" data-section-key="agents" title="Klik untuk Buka / Tutup Grup">
              <div class="accordion-title-box">
                <span class="acc-icon">🤖</span>
                <span class="acc-title">ARMADA AI AGENTS</span>
                <span class="acc-badge">${this.registry.getAll().length}</span>
              </div>
              <div class="accordion-actions">
                <button class="add-agent-quick-btn" id="btnOpenAddAgent" title="Onboard Operator Game Dev Baru">
                  <span>+ TAMBAH</span>
                </button>
                <span class="acc-chevron">▼</span>
              </div>
            </div>
            
            <div class="accordion-body" id="accBodyAgents" style="display: ${this.sectionState.agents ? 'flex' : 'none'};">
              <div class="agent-roster-list">
                ${this.registry.getAll().map(agent => `
                  <button class="agent-nav-row" data-agent-id="${agent.id}" title="${agent.roleConfig?.gundamUnit || agent.name}">
                    <span class="agent-nav-badge" style="background-color: ${agent.roleConfig?.color || '#38bdf8'}">
                      ${(agent.roleConfig?.badge || '🤖').split(' ')[0]}
                    </span>
                    <div class="agent-nav-info">
                      <span class="agent-nav-name">${agent.name}</span>
                      <span class="agent-nav-role">${agent.role}</span>
                    </div>
                    <span class="agent-nav-status dot-online"></span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- GROUP 4: SIMULASI SPRINT & INSIDEN STUDIO -->
          <div class="sidebar-accordion-group ${this.sectionState.scenarios ? 'is-open' : 'is-collapsed'}" data-section-key="scenarios" id="secGroupScenarios">
            <div class="accordion-header" data-section-key="scenarios" title="Klik untuk Buka / Tutup Grup">
              <div class="accordion-title-box">
                <span class="acc-icon">⚡</span>
                <span class="acc-title">SPRINT &amp; SKENARIO</span>
                <span class="acc-badge">5</span>
              </div>
              <span class="acc-chevron">▼</span>
            </div>

            <div class="accordion-body" id="accBodyScenarios" style="display: ${this.sectionState.scenarios ? 'flex' : 'none'};">
              <div class="incident-buttons-list">
                <button class="incident-btn btn-power" id="sideIncidentPower">
                  <span class="inc-icon">⚡</span>
                  <span class="inc-text">Shader Crash (VFX)</span>
                </button>
                <button class="incident-btn btn-thermal" id="sideIncidentThermal">
                  <span class="inc-icon">🌐</span>
                  <span class="inc-text">Netcode Desync</span>
                </button>
                <button class="incident-btn btn-ddos" id="sideIncidentDdos">
                  <span class="inc-icon">📦</span>
                  <span class="inc-text">Asset 3D Crunch</span>
                </button>
                <button class="incident-btn btn-coffee" id="sideIncidentCoffee">
                  <span class="inc-icon">☕</span>
                  <span class="inc-text">Pizza &amp; Coffee</span>
                </button>
                <button class="incident-btn btn-reset" id="sideIncidentReset">
                  <span class="inc-icon">🔄</span>
                  <span class="inc-text">Build Stabil 100%</span>
                </button>
              </div>
            </div>
          </div>

          <!-- GROUP 5: SUASANA & PREFERENSI -->
          <div class="sidebar-accordion-group ${this.sectionState.ambience ? 'is-open' : 'is-collapsed'}" data-section-key="ambience" id="secGroupAmbience">
            <div class="accordion-header" data-section-key="ambience" title="Klik untuk Buka / Tutup Grup">
              <div class="accordion-title-box">
                <span class="acc-icon">💡</span>
                <span class="acc-title">SUASANA &amp; PREFERENSI</span>
                <span class="acc-badge">3</span>
              </div>
              <span class="acc-chevron">▼</span>
            </div>
            
            <div class="accordion-body" id="accBodyAmbience" style="display: ${this.sectionState.ambience ? 'flex' : 'none'};">
              <div class="lighting-select-row">
                <button class="light-chip ${this.activeLighting === 'night' ? 'active' : ''}" data-light="night" title="Cyberpunk Night (Default)">
                  🌙 Malam
                </button>
                <button class="light-chip ${this.activeLighting === 'sunset' ? 'active' : ''}" data-light="sunset" title="Golden Sunset">
                  🌅 Senja
                </button>
                <button class="light-chip ${this.activeLighting === 'day' ? 'active' : ''}" data-light="day" title="Daylight Studio">
                  ☀️ Siang
                </button>
              </div>

              <div class="audio-control-row">
                <button class="audio-btn" id="sideBtnLofi">
                  <span class="audio-icon">🎵</span>
                  <span class="audio-label">Lo-Fi Beats</span>
                </button>
                <button class="audio-btn" id="sideBtnMute">
                  <span class="audio-icon">🔊</span>
                  <span class="audio-label">Sound FX</span>
                </button>
              </div>

              <button class="zen-toggle-btn" id="sideBtnZen">
                <span class="zen-icon">👁️</span>
                <span class="zen-text">Zen Mode (Fullscreen 3D)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Footer Status -->
        <div class="sidebar-footer">
          <div class="sidebar-bridge-status local" id="sidebarBridgeStatus">
            <span class="pulse-indicator"></span>
            <span class="bridge-text">Studio Local Mode</span>
          </div>
          <div class="facility-telemetry-mini">
            <span>ALPHA v0.9 // 60 FPS</span>
            <span class="uptime-text">BUILD GREEN</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Collapse / Expand toggle
    const toggleBtn = this.container.querySelector('#btnToggleSidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleCollapse();
        const icon = toggleBtn.querySelector('.toggle-icon');
        if (icon) icon.textContent = this.isCollapsed ? '▶' : '◀';
      });
    }

    // Accordion Toolbar: Buka Semua & Ringkas
    const btnExpandAll = this.container.querySelector('#btnSidebarExpandAll');
    if (btnExpandAll) {
      btnExpandAll.addEventListener('click', () => {
        this.expandAllSections();
        audio.playClick();
      });
    }

    const btnCollapseAll = this.container.querySelector('#btnSidebarCollapseAll');
    if (btnCollapseAll) {
      btnCollapseAll.addEventListener('click', () => {
        this.collapseAllSections();
        audio.playClick();
      });
    }

    // Accordion Group Header Click (Expand / Collapse)
    const accordionHeaders = this.container.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        // Jangan toggle jika user mengklik tombol "+ TAMBAH" di header
        if (e.target.closest('#btnOpenAddAgent')) return;
        const key = header.dataset.sectionKey;
        if (key) {
          this.toggleSection(key);
          audio.playClick();
        }
      });
    });

    // Master Video Wall Button
    const btnVideoWall = this.container.querySelector('#navItemVideoWall');
    if (btnVideoWall) {
      btnVideoWall.addEventListener('click', () => {
        this.onOpenVideoWall();
        audio.playClick();
      });
    }

    // GLB Asset Library Button
    const btnAssetLibrary = this.container.querySelector('#navItemAssetLibrary');
    if (btnAssetLibrary) {
      btnAssetLibrary.addEventListener('click', () => {
        if (this.onOpenAssetLibrary) this.onOpenAssetLibrary();
        else this.onOpenAssetManager('library');
        audio.playClick();
      });
    }

    // 3D Asset Workshop Button
    const btnAssetManager = this.container.querySelector('#navItemAssetManager');
    if (btnAssetManager) {
      btnAssetManager.addEventListener('click', () => {
        this.onOpenAssetManager('deploy');
        audio.playClick();
      });
    }

    // AI Engine & LLM Configuration Button
    const btnAiConfig = this.container.querySelector('#navItemAiConfig');
    if (btnAiConfig) {
      btnAiConfig.addEventListener('click', () => {
        this.onOpenAiConfig();
        audio.playClick();
      });
    }

    // Camera preset buttons
    const camBtns = this.container.querySelectorAll('.cam-grid-btn');
    const setActiveCam = (btn) => {
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };

    const camHall = this.container.querySelector('#camBtnHall');
    if (camHall) {
      camHall.addEventListener('click', () => {
        setActiveCam(camHall);
        if (this.engine3D) this.engine3D.centerCamera();
        audio.playClick();
      });
    }

    const camRunway = this.container.querySelector('#camBtnRunway');
    if (camRunway) {
      camRunway.addEventListener('click', () => {
        setActiveCam(camRunway);
        if (this.engine3D) this.engine3D.flyToSector('conveyor_runway');
        audio.playClick();
      });
    }

    const camWall = this.container.querySelector('#camBtnWall');
    if (camWall) {
      camWall.addEventListener('click', () => {
        setActiveCam(camWall);
        if (this.engine3D) this.engine3D.focusVideoWall();
        audio.playClick();
      });
    }

    const camArthur = this.container.querySelector('#camBtnArthur');
    if (camArthur) {
      camArthur.addEventListener('click', () => {
        setActiveCam(camArthur);
        if (this.engine3D) this.engine3D.focusArthur();
        audio.playClick();
      });
    }

    const camTop = this.container.querySelector('#camBtnTop');
    if (camTop) {
      camTop.addEventListener('click', () => {
        setActiveCam(camTop);
        if (this.engine3D) this.engine3D.setTopDownView();
        audio.playClick();
      });
    }

    // Add Agent Button
    const btnAddAgent = this.container.querySelector('#btnOpenAddAgent');
    if (btnAddAgent) {
      btnAddAgent.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onOpenAddAgent();
        audio.playClick();
      });
    }

    // Agent roster clicks
    const agentRows = this.container.querySelectorAll('.agent-nav-row');
    agentRows.forEach(row => {
      row.addEventListener('click', () => {
        const agentId = row.dataset.agentId;
        const agent = this.registry.getById(agentId);
        if (agent) {
          this.onSelectAgent(agent);
          if (this.engine3D) {
            this.engine3D.followAgent(agent.id);
            this.engine3D.speakAgent(agent.name, agent.innerMonologue || agent.currentTask || 'Siaga di stasiun kerja game dev!');
          }
          audio.playClick();
        }
      });
    });

    // Incident scenario triggers
    const incPower = this.container.querySelector('#sideIncidentPower');
    if (incPower) {
      incPower.addEventListener('click', () => {
        if (this.workflow) this.workflow.runPowerSurgeScenario();
      });
    }

    const incThermal = this.container.querySelector('#sideIncidentThermal');
    if (incThermal) {
      incThermal.addEventListener('click', () => {
        if (this.workflow) this.workflow.runThermalAlarmScenario();
      });
    }

    const incDdos = this.container.querySelector('#sideIncidentDdos');
    if (incDdos) {
      incDdos.addEventListener('click', () => {
        if (this.workflow) this.workflow.runCyberDdosScenario();
      });
    }

    const incCoffee = this.container.querySelector('#sideIncidentCoffee');
    if (incCoffee) {
      incCoffee.addEventListener('click', () => {
        if (this.workflow) this.workflow.runCoffeeBreakScenario();
      });
    }

    const incReset = this.container.querySelector('#sideIncidentReset');
    if (incReset) {
      incReset.addEventListener('click', () => {
        if (this.workflow) this.workflow.runNormalizeScenario();
      });
    }

    // Lighting toggles
    const lightChips = this.container.querySelectorAll('.light-chip');
    lightChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const mode = chip.dataset.light;
        this.activeLighting = mode;
        lightChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (this.engine3D) this.engine3D.setLightingMode(mode);
        audio.playClick();
      });
    });

    // Lo-Fi Beats
    const btnLofi = this.container.querySelector('#sideBtnLofi');
    if (btnLofi) {
      btnLofi.addEventListener('click', () => {
        this.isLofiActive = !this.isLofiActive;
        btnLofi.classList.toggle('active', this.isLofiActive);
        if (this.isLofiActive) {
          audio.startLofiBeats();
        } else {
          audio.stopLofiBeats();
        }
      });
    }

    // Mute Audio
    const btnMute = this.container.querySelector('#sideBtnMute');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        audio.toggleMute();
        btnMute.querySelector('.audio-icon').textContent = this.isMuted ? '🔇' : '🔊';
        btnMute.classList.toggle('muted', this.isMuted);
      });
    }

    // Zen Mode
    const btnZen = this.container.querySelector('#sideBtnZen');
    if (btnZen) {
      btnZen.addEventListener('click', () => {
        this.onToggleZen();
      });
    }

    // Keyboard shortcut: Ctrl+B to toggle sidebar
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleCollapse();
      }
    });
  }
}
