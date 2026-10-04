/**
 * AgentInspector.js - Sleek Tier-III NOC Agent Telemetry Drawer
 * Slides in from the right when an agent is clicked or inspected.
 * Features:
 * - Live 3D Holographic Model Preview with 360° turntable mouse drag
 * - Dedicated "Reset ke Visual Bawaan" (Revert to original SD Gundam)
 * - 1-Click GLB upload and Mecha Locomotion Mode selector (Stride vs Hover)
 * - Camera focus, dispatch actions, and SCADA sub-system metrics
 */

import { AGENT_STATES } from '../utils/constants.js';
import { AvatarPreviewViewport } from './AvatarPreviewViewport.js';
import { aiReasoning } from '../engine/ai/AIReasoningEngine.js';
import { audio } from '../engine/AudioManager.js';

export class AgentInspector {
  constructor({
    container,
    registry,
    engine3D = null,
    onFocusAgent,
    onSendToVideoWall,
    onSendToDesk,
    onSendToPantry,
    onChangeModel,
    onResetModel,
    onSetLocomotion,
    onTestWalk,
    onOpenAiConfig,
  }) {
    this.container = container;
    this.registry = registry;
    this.engine3D = engine3D;
    this.onFocusAgent = onFocusAgent || (() => {});
    this.onSendToVideoWall = onSendToVideoWall || (() => {});
    this.onSendToDesk = onSendToDesk || (() => {});
    this.onSendToPantry = onSendToPantry || (() => {});
    this.onChangeModel = onChangeModel || (() => {});
    this.onResetModel = onResetModel || (() => {});
    this.onSetLocomotion = onSetLocomotion || (() => {});
    this.onTestWalk = onTestWalk || (() => {});
    this.onOpenAiConfig = onOpenAiConfig || (() => {});

    this.currentAgent = null;
    this.isOpen = false;
    this.previewViewport = null;

    this.render();
  }

  setEngine3D(engine3D) {
    this.engine3D = engine3D;
  }

  setAgent(agent) {
    this.currentAgent = agent;
    this.open();
    this.update();
  }

  open() {
    this.isOpen = true;
    const panel = this.container.querySelector('.inspector-drawer');
    if (panel) {
      panel.classList.add('open');
    }
    if (this.previewViewport) {
      this.previewViewport.resize();
      this.previewViewport.start();
      if (this.currentAgent) {
        this.previewViewport.updateAvatar(this.currentAgent, this.engine3D);
      }
    }
  }

  close() {
    this.isOpen = false;
    const panel = this.container.querySelector('.inspector-drawer');
    if (panel) {
      panel.classList.remove('open');
    }
    if (this.previewViewport) {
      this.previewViewport.stop();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      if (!this.currentAgent) {
        this.currentAgent = this.registry.getById('audira_lead') || this.registry.getAll()[0];
      }
      this.open();
      this.update();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="inspector-drawer ${this.isOpen ? 'open' : ''}" id="inspectorDrawer">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="header-avatar-box">
            <div class="agent-avatar-badge" id="inspBadge">AI</div>
            <div class="agent-meta">
              <h3 id="inspName">Arthur</h3>
              <span class="role-pill" id="inspRole">DIRECTOR // HQ</span>
              <div class="gundam-unit-pill" id="inspGundamUnit" style="font-size: 11px; color: #38bdf8; margin-top: 5px; font-family: monospace; display: flex; align-items: center; gap: 4px; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.25);">
                <span id="inspGundamName">🤖 SD G-01 COMMANDER ARTHUR</span>
              </div>
            </div>
          </div>
          
          <div class="drawer-header-actions">
            <button class="icon-btn-sm" id="inspFocusBtn" title="Fokus Kamera 3D ke Operator">🎯</button>
            <button class="icon-btn-sm close-btn" id="inspCloseBtn" title="Tutup Panel (✕)">✕</button>
          </div>
        </div>

        <!-- Drawer Scrollable Body -->
        <div class="drawer-body custom-scrollbar">
          <!-- Status & SLA Reliability Indicator -->
          <div class="status-indicator-row">
            <span class="status-dot dot-idle" id="inspStatusDot"></span>
            <span class="status-text" id="inspStatus">SIAGA / STANDBY</span>
            <span class="token-counter" id="inspSla">SLA: 99.98%</span>
          </div>

          <!-- Energy & Cognitive Focus Bar -->
          <div class="energy-meter-container">
            <div class="energy-meta">
              <span class="energy-label">⚡ Stamina & Fokus Konsol</span>
              <span class="energy-val" id="inspEnergyVal">95%</span>
            </div>
            <div class="energy-track">
              <div class="energy-bar" id="inspEnergyBar" style="width: 95%"></div>
            </div>
          </div>

          <!-- Interactive 3D Model Visual Preview Showcase -->
          <div class="info-block" style="background: rgba(10, 16, 28, 0.75); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 10px; margin-bottom: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
            <div class="block-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #f8fafc;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8;"></span>
                VISUAL PREVIEW 3D // HOLOGRAM
              </span>
              <span id="inspPreviewTypeBadge" style="font-size: 10px; font-family: monospace; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 2px 8px; border-radius: 12px;">
                🤖 SD GUNDAM BAWAAN
              </span>
            </div>

            <!-- 3D Miniature Canvas Container with Drag-to-Rotate -->
            <div style="position: relative; width: 100%; height: 190px; border-radius: 8px; overflow: hidden; background: radial-gradient(circle at center, #0f1c32 0%, #050a14 100%); border: 1px solid rgba(56, 189, 248, 0.25);">
              <canvas id="inspVisualCanvas" style="width: 100%; height: 100%; display: block; outline: none; cursor: grab;"></canvas>
              
              <!-- Holographic Corner Accents -->
              <div style="position: absolute; top: 6px; left: 8px; font-size: 9px; font-family: monospace; color: rgba(56, 189, 248, 0.7); pointer-events: none;">
                [TURNTABLE 360°]
              </div>
              <div style="position: absolute; bottom: 6px; right: 8px; font-size: 9px; font-family: monospace; color: rgba(148, 163, 184, 0.7); pointer-events: none;">
                🖱️ DRAG TO ROTATE
              </div>
            </div>

            <!-- Model Actions: Upload Skin & Explicit Reset to Default -->
            <div style="margin-top: 10px; display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" id="btnInspUploadGLB" style="flex: 1; padding: 6px 10px; font-size: 11px; font-family: monospace; border-color: #38bdf8; color: #38bdf8; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;">
                📤 Ganti Skin .GLB
              </button>
              <button class="btn btn-sm" id="btnInspResetVisual" style="flex: 1; padding: 6px 10px; font-size: 11px; font-family: monospace; border: 1px solid rgba(244, 63, 94, 0.5); background: rgba(244, 63, 94, 0.15); color: #fb7185; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer;" title="Reset kembali ke visual SD Gundam bawaan">
                🔄 Reset ke Bawaan
              </button>
            </div>

            <!-- Visual Status Banner -->
            <div id="inspVisualStatusBanner" style="margin-top: 8px; font-size: 10.5px; font-family: monospace; color: #94a3b8; background: rgba(8, 14, 26, 0.6); padding: 5px 8px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
              <span id="inspVisualStatusText">Status: Visual bawaan aktif (SD Gundam)</span>
              <span id="inspVisualPoly">PBR High-Fi</span>
            </div>

            <!-- Locomotion Mode Selector (Appears for Mecha / GLB) -->
            <div id="inspLocomotionBox" style="display: none; margin-top: 8px; background: rgba(8, 14, 26, 0.4); padding: 6px; border-radius: 6px; border: 1px dashed rgba(56, 189, 248, 0.25);">
              <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-bottom: 4px;">LOKOMOSI ROBOT / MECHA:</div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm" id="btnModeMechaStride" style="flex: 1; padding: 3px 6px; font-size: 10px; font-family: monospace; border: 1px solid #38bdf8; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-radius: 4px; cursor: pointer;" title="Hentakan langkah kaki hidrolik mecha">
                  🤖 Mecha Stride
                </button>
                <button class="btn btn-sm" id="btnModeMechaHover" style="flex: 1; padding: 3px 6px; font-size: 10px; font-family: monospace; border: 1px solid rgba(148, 163, 184, 0.3); background: transparent; color: #94a3b8; border-radius: 4px; cursor: pointer;" title="Melayang terbang dengan jet thruster">
                  🚀 Jet Hover
                </button>
              </div>
            </div>
            <input type="file" id="inspGLBFileInput" accept=".glb,.gltf" style="display: none;" />
          </div>

          <!-- Active Objective / Directive -->
          <div class="info-block">
            <div class="block-label">MANDAT SPRINT AKTIF</div>
            <p class="task-desc" id="inspTask">Memimpin sprint milestone Alpha v0.9.4 &amp; review build Three.js</p>
          </div>

          <!-- Inner Monologue / Chain-of-Thought -->
          <div class="info-block">
            <div class="block-label">TELEMETRI PIKIRAN // CHAIN-OF-THOUGHT</div>
            <div class="thought-bubble-box" id="inspThought">
              "Seluruh 10 divisi studio game sinkron. Target rilis demo 3 hari lagi."
            </div>
          </div>

          <!-- Game Studio Role Responsibility -->
          <div class="info-block subsystem-block">
            <div class="block-label">DIVISI &amp; STACK GAME DEV</div>
            <div class="subsystem-grid" id="inspSubsystem">
              <div class="sub-item">
                <span class="sub-name">Area Tanggung Jawab:</span>
                <span class="sub-val" id="inspSubArea">Engine &amp; 3D Assets</span>
              </div>
              <div class="sub-item">
                <span class="sub-name">Engine / Tools:</span>
                <span class="sub-val" id="inspSubTool">Three.js, GLTF, WebGL, Web Audio</span>
              </div>
            </div>
          </div>

          <!-- COMM-LINK 1-ON-1 DIRECT AGENT CHAT -->
            <div class="commlink-header">
              <span class="commlink-title">💬 COMM-LINK // 1-ON-1 AGENT CHAT</span>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="commlink-ai-badge" id="commlinkAiBadge" style="cursor: pointer; font-size: 9px; padding: 2px 7px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-family: monospace; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" title="Klik untuk konfigurasi AI Engine & API Key">
                  <span>🤖</span> AI ENGINE ⚙️
                </span>
                <button class="quick-chat-chip" id="btnCommlinkClear" title="Bersihkan riwayat percakapan">Bersihkan</button>
              </div>
            </div>
            
            <div class="commlink-feed custom-scrollbar" id="commlinkFeed">
              <div class="chat-bubble-msg agent">
                Saluran transmisi terhubung. Ada instruksi atau laporan yang ingin Anda konsultasikan?
              </div>
            </div>

            <div class="commlink-chips-row" id="commlinkChipsContainer">
              <button class="quick-chat-chip commlink-chip" data-query="Laporan status operasional divisi kamu">📊 Status</button>
              <button class="quick-chat-chip commlink-chip" data-query="Bagaimana beban kerja dan stabilitas sistem saat ini?">⚡ Beban Sistem</button>
              <button class="quick-chat-chip commlink-chip" data-query="Apa rekomendasi optimasi untuk milestone berikutnya?">💡 Rekomendasi</button>
            </div>

            <div class="commlink-input-row">
              <input 
                type="text" 
                class="commlink-input" 
                id="commlinkInput" 
                placeholder="Transmisi pesan ke operator..." 
                autocomplete="off"
              />
              <button class="commlink-send-btn" id="btnCommlinkSend">Kirim</button>
            </div>
          </div>

          <!-- Operator Quick Commands -->
          <div class="info-block">
            <div class="block-label">ARAHAN CEPAT OPERATOR</div>
            <div class="action-buttons-row">
              <button class="btn btn-secondary btn-sm" id="btnInspDesk" title="Kembali ke Konsol Meja">🪑 Meja</button>
              <button class="btn btn-secondary btn-sm" id="btnInspWall" title="Berjalan ke Video Wall">📺 Video Wall</button>
              <button class="btn btn-secondary btn-sm" id="btnInspTestWalk" style="border-color: #38bdf8; color: #38bdf8; font-weight: bold;" title="Uji Coba Berjalan di Catwalk 3D">🚶 Test Jalan</button>
              <button class="btn btn-secondary btn-sm" id="btnInspPantry" title="Rehat Sejenak ke Pantry">☕ Pantry</button>
            </div>
          </div>

          <!-- Execution Stream Mini-Feed -->
          <div class="info-block logs-section">
            <div class="block-label">LOG AKTIVITAS TERAKHIR</div>
            <div class="mini-logs" id="inspLogs">
              <div class="mini-log-entry empty">Belum ada catatan aktivitas baru</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Initialize Miniature 3D Visual Preview Viewport
    const canvas = this.container.querySelector('#inspVisualCanvas');
    if (canvas) {
      this.previewViewport = new AvatarPreviewViewport(canvas);
    }

    const closeBtn = this.container.querySelector('#inspCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Comm-Link Direct Agent Chat functionality
    const commlinkInput = this.container.querySelector('#commlinkInput');
    const commlinkSend = this.container.querySelector('#btnCommlinkSend');
    const commlinkFeed = this.container.querySelector('#commlinkFeed');
    const commlinkClear = this.container.querySelector('#btnCommlinkClear');
    const commlinkChips = this.container.querySelectorAll('.commlink-chip');

    const handleSendCommLink = async (messageText) => {
      const text = messageText || (commlinkInput ? commlinkInput.value.trim() : '');
      if (!text || !this.currentAgent) return;
      if (commlinkInput) commlinkInput.value = '';

      audio.playClick();

      // Append user bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'chat-bubble-msg user';
      userBubble.textContent = text;
      commlinkFeed.appendChild(userBubble);

      // Typing indicator
      const typingBubble = document.createElement('div');
      typingBubble.className = 'chat-bubble-msg agent typing';
      typingBubble.textContent = `${this.currentAgent.name} sedang menganalisis transmisi...`;
      commlinkFeed.appendChild(typingBubble);
      commlinkFeed.scrollTop = commlinkFeed.scrollHeight;

      // Call AI reasoning
      const res = await aiReasoning.chatWithAgent(this.currentAgent, text);

      // Remove typing indicator
      typingBubble.remove();

      // Append agent reply
      const agentBubble = document.createElement('div');
      agentBubble.className = 'chat-bubble-msg agent';
      if (res.thought) {
        const safeThought = res.thought.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeText = res.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        agentBubble.innerHTML = `
          <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-bottom: 5px; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 4px; line-height: 1.3;">
            💭 <em>${safeThought}</em>
          </div>
          <div style="line-height: 1.4;">${safeText}</div>
        `;
      } else {
        agentBubble.textContent = res.text;
      }
      commlinkFeed.appendChild(agentBubble);
      commlinkFeed.scrollTop = commlinkFeed.scrollHeight;

      // Update agent state & 3D speech bubble
      if (res.thought) {
        this.currentAgent.innerMonologue = res.thought;
      }
      if (res.task) {
        this.currentAgent.currentTask = res.task;
      }
      this.currentAgent.speak(res.text);
      if (this.engine3D) {
        this.engine3D.speakAgent(this.currentAgent.name, res.text, 6500);
        this.engine3D.focusAgent(this.currentAgent.name);
      }
      this.update();
    };

    if (commlinkSend && commlinkInput) {
      commlinkSend.addEventListener('click', () => handleSendCommLink());
      commlinkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSendCommLink();
      });
    }

    // Dynamic prompt chip delegation
    const commlinkChipsContainer = this.container.querySelector('#commlinkChipsContainer');
    if (commlinkChipsContainer) {
      commlinkChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.commlink-chip');
        if (chip && chip.dataset.query) {
          handleSendCommLink(chip.dataset.query);
        }
      });
    }

    // Click AI Badge to open AI Configuration Modal
    const commlinkAiBadge = this.container.querySelector('#commlinkAiBadge');
    if (commlinkAiBadge) {
      commlinkAiBadge.addEventListener('click', () => {
        audio.playClick();
        this.onOpenAiConfig();
      });
    }

    if (commlinkClear && commlinkFeed) {
      commlinkClear.addEventListener('click', () => {
        if (this.currentAgent) {
          aiReasoning.clearChatHistory(this.currentAgent.id);
          commlinkFeed.innerHTML = `
            <div class="chat-bubble-msg agent">
              Saluran transmisi dibersihkan. Siaga menerima arahan baru.
            </div>
          `;
          audio.playClick();
        }
      });
    }

    const focusBtn = this.container.querySelector('#inspFocusBtn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (this.currentAgent) {
          this.onFocusAgent(this.currentAgent.id);
        }
      });
    }

    const btnDesk = this.container.querySelector('#btnInspDesk');
    if (btnDesk) {
      btnDesk.addEventListener('click', () => {
        if (this.currentAgent) {
          this.currentAgent.state = AGENT_STATES.IDLE;
          this.currentAgent.speak('Kembali siaga di stasiun meja kerja konsol.');
          this.onSendToDesk(this.currentAgent);
          this.update();
        }
      });
    }

    const btnWall = this.container.querySelector('#btnInspWall');
    if (btnWall) {
      btnWall.addEventListener('click', () => {
        if (this.currentAgent) {
          this.currentAgent.state = AGENT_STATES.TESTING;
          this.currentAgent.speak('Meninjau telemetri langsung di Master Video Wall 9-Layar.');
          this.onSendToVideoWall(this.currentAgent);
          this.update();
        }
      });
    }

    const btnPantry = this.container.querySelector('#btnInspPantry');
    if (btnPantry) {
      btnPantry.addEventListener('click', () => {
        if (this.currentAgent) {
          this.currentAgent.drinkCoffee();
          this.currentAgent.speak('Rehat sejenak menikmati kopi di lounge.');
          this.onSendToPantry(this.currentAgent);
          this.update();
        }
      });
    }

    const btnTestWalk = this.container.querySelector('#btnInspTestWalk');
    if (btnTestWalk) {
      btnTestWalk.addEventListener('click', () => {
        if (this.currentAgent) {
          this.onTestWalk(this.currentAgent);
        }
      });
    }

    // Locomotion Mode Buttons
    const btnStride = this.container.querySelector('#btnModeMechaStride');
    const btnHover = this.container.querySelector('#btnModeMechaHover');

    if (btnStride) {
      btnStride.addEventListener('click', () => {
        if (this.currentAgent) {
          this.currentAgent.locomotionMode = 'mecha_stride';
          this.onSetLocomotion(this.currentAgent, 'mecha_stride');
          this.registry.saveCustomAgents();
          this.update();
        }
      });
    }

    if (btnHover) {
      btnHover.addEventListener('click', () => {
        if (this.currentAgent) {
          this.currentAgent.locomotionMode = 'mecha_hover';
          this.onSetLocomotion(this.currentAgent, 'mecha_hover');
          this.registry.saveCustomAgents();
          this.update();
        }
      });
    }

    // Upload & Reset Model Buttons
    const btnUploadGLB = this.container.querySelector('#btnInspUploadGLB');
    const glbFileInput = this.container.querySelector('#inspGLBFileInput');
    const btnResetVisual = this.container.querySelector('#btnInspResetVisual');

    if (btnUploadGLB && glbFileInput) {
      btnUploadGLB.addEventListener('click', () => glbFileInput.click());
      glbFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && this.currentAgent) {
          this.onChangeModel(this.currentAgent, file, file.name);
          setTimeout(() => {
            if (this.previewViewport) {
              this.previewViewport.updateAvatar(this.currentAgent, this.engine3D);
            }
            this.update();
          }, 350);
        }
      });
    }

    // Prominent "Reset ke Visual Bawaan" Action
    if (btnResetVisual) {
      btnResetVisual.addEventListener('click', () => {
        if (this.currentAgent) {
          this.onResetModel(this.currentAgent);
          if (this.previewViewport) {
            this.previewViewport.updateAvatar(this.currentAgent, this.engine3D);
          }
          this.update();
        }
      });
    }

    // Escape key closes inspector
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  update() {
    if (!this.currentAgent) return;

    const a = this.currentAgent;

    const badge = this.container.querySelector('#inspBadge');
    const name = this.container.querySelector('#inspName');
    const role = this.container.querySelector('#inspRole');
    const status = this.container.querySelector('#inspStatus');
    const statusDot = this.container.querySelector('#inspStatusDot');
    const sla = this.container.querySelector('#inspSla');
    const energyVal = this.container.querySelector('#inspEnergyVal');
    const energyBar = this.container.querySelector('#inspEnergyBar');
    const task = this.container.querySelector('#inspTask');
    const thought = this.container.querySelector('#inspThought');
    const subArea = this.container.querySelector('#inspSubArea');
    const subTool = this.container.querySelector('#inspSubTool');
    const logsEl = this.container.querySelector('#inspLogs');

    // 3D Visual Preview UI elements
    const previewBadge = this.container.querySelector('#inspPreviewTypeBadge');
    const visualStatusText = this.container.querySelector('#inspVisualStatusText');
    const btnResetVisual = this.container.querySelector('#btnInspResetVisual');
    const locBox = this.container.querySelector('#inspLocomotionBox');
    const btnStride = this.container.querySelector('#btnModeMechaStride');
    const btnHover = this.container.querySelector('#btnModeMechaHover');

    const hasCustomSkin = !!(a.modelName || a.modelUrl);

    if (hasCustomSkin) {
      if (previewBadge) {
        previewBadge.textContent = '📦 MODEL KUSTOM (GLB)';
        previewBadge.style.color = '#38bdf8';
        previewBadge.style.background = 'rgba(56, 189, 248, 0.2)';
        previewBadge.style.borderColor = '#38bdf8';
      }
      if (visualStatusText) {
        visualStatusText.textContent = `Status: Skin Kustom Aktif (${a.modelName || 'GLB'})`;
        visualStatusText.style.color = '#38bdf8';
      }
      if (btnResetVisual) {
        btnResetVisual.style.border = '1px solid rgba(244, 63, 94, 0.7)';
        btnResetVisual.style.background = 'rgba(244, 63, 94, 0.25)';
        btnResetVisual.style.color = '#fda4af';
        btnResetVisual.title = 'Kembalikan ke visual SD Gundam bawaan';
      }
      if (locBox) locBox.style.display = 'block';

      const isHover = a.locomotionMode === 'mecha_hover';
      if (btnStride && btnHover) {
        if (isHover) {
          btnHover.style.border = '1px solid #38bdf8';
          btnHover.style.background = 'rgba(56, 189, 248, 0.25)';
          btnHover.style.color = '#38bdf8';
          btnStride.style.border = '1px solid rgba(148, 163, 184, 0.3)';
          btnStride.style.background = 'transparent';
          btnStride.style.color = '#94a3b8';
        } else {
          btnStride.style.border = '1px solid #38bdf8';
          btnStride.style.background = 'rgba(56, 189, 248, 0.25)';
          btnStride.style.color = '#38bdf8';
          btnHover.style.border = '1px solid rgba(148, 163, 184, 0.3)';
          btnHover.style.background = 'transparent';
          btnHover.style.color = '#94a3b8';
        }
      }
    } else {
      if (previewBadge) {
        previewBadge.textContent = '🤖 SD GUNDAM BAWAAN';
        previewBadge.style.color = '#10b981';
        previewBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        previewBadge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
      }
      if (visualStatusText) {
        visualStatusText.textContent = `Status: Visual bawaan aktif (${a.roleConfig?.gundamUnit || 'SD Gundam'})`;
        visualStatusText.style.color = '#94a3b8';
      }
      if (btnResetVisual) {
        btnResetVisual.style.border = '1px solid rgba(148, 163, 184, 0.25)';
        btnResetVisual.style.background = 'rgba(15, 23, 42, 0.4)';
        btnResetVisual.style.color = '#94a3b8';
        btnResetVisual.title = 'Visual sudah dalam kondisi bawaan';
      }
      if (locBox) locBox.style.display = 'none';
    }

    // Refresh 3D miniature preview model
    if (this.previewViewport && this.isOpen) {
      this.previewViewport.updateAvatar(a, this.engine3D);
    }

    if (name) name.textContent = a.name;
    if (badge) {
      badge.textContent = a.roleConfig?.badge?.split(' ')[0] || 'AI';
      badge.style.background = `linear-gradient(135deg, ${a.roleConfig?.color || '#38bdf8'}, #1e293b)`;
    }
    if (role) {
      role.textContent = `${a.role} // ${a.roleConfig?.title || 'Operator'}`;
      role.style.borderColor = a.roleConfig?.color || '#38bdf8';
      role.style.color = a.roleConfig?.color || '#38bdf8';
    }

    const gundamName = this.container.querySelector('#inspGundamName');
    if (gundamName) {
      gundamName.textContent = a.roleConfig?.gundamUnit || `🤖 SD-CUSTOM GUNDAM // ${a.role}`;
    }

    // Status mapping
    if (status && statusDot) {
      statusDot.className = 'status-dot';
      const st = String(a.state || 'IDLE').toUpperCase();
      switch (st) {
        case 'CODING':
        case 'WORKING':
          status.textContent = 'EKSEKUSI TEKNIS';
          statusDot.classList.add('dot-coding');
          break;
        case 'THINKING':
        case 'REVIEW':
          status.textContent = 'ANALISIS INSIDEN';
          statusDot.classList.add('dot-thinking');
          break;
        case 'TESTING':
          status.textContent = 'DIAGNOSTIK SCADA';
          statusDot.classList.add('dot-testing');
          break;
        case 'COFFEE':
          status.textContent = 'REHAT PANTRY';
          statusDot.classList.add('dot-coffee');
          break;
        default:
          status.textContent = 'SIAGA OPERASIONAL';
          statusDot.classList.add('dot-idle');
      }
    }

    if (sla) sla.textContent = `SLA: 99.98%`;

    const energy = Math.round(a.energy || 95);
    if (energyVal) energyVal.textContent = `${energy}%`;
    if (energyBar) {
      energyBar.style.width = `${energy}%`;
      if (energy > 50) {
        energyBar.style.background = 'linear-gradient(90deg, #10b981, #38bdf8)';
      } else if (energy > 20) {
        energyBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
      } else {
        energyBar.style.background = 'linear-gradient(90deg, #ef4444, #f43f5e)';
      }
    }

    if (task) task.textContent = a.currentTask || 'Siaga di stasiun meja kerja studio.';
    if (thought) thought.textContent = a.innerMonologue ? `"${a.innerMonologue}"` : '"Memantau performa build engine 60 FPS."';

    // Subsystem responsibilities for Game Dev Studio
    const subMap = {
      Arthur: { area: 'Game Direction & Studio Lead', tool: 'Three.js, Engine Architecture, Roadmap' },
      ROUTEX: { area: 'Netcode & Multiplayer State Sync', tool: 'WebSockets, UDP Telemetry, Client Interpolation' },
      CHRONOS: { area: 'Level Design & Modular 3D Biomes', tool: 'NavMesh Baking, Occlusion Culling, Blender, ProBuilder' },
      RESOLV: { area: 'Physics & Collision Solver', tool: 'Cannon.js, Raycast Systems, RigidBody Telemetry' },
      CIPHER: { area: 'Shader Engineering & Anti-Cheat', tool: 'GLSL, Post-Processing, Memory Sanitizer' },
      VOLTIS: { area: 'PBR Lighting & Global Illumination', tool: 'Three.js PMREM, ACES Tone Mapping, Volumetric Lights' },
      THERMO: { area: 'Thermal & GPU Profiler', tool: 'WebGL Drawcalls, VRAM Budget, Thermal Throttling' },
      NEXUS: { area: 'Game Database & Asset Pipeline', tool: 'GLTF Dracoloader, IndexedDB, Asset Bundler' },
      AEGIS: { area: 'Network Security & SOC Defense', tool: 'DDoS Scrubber, Packet Integrity, WAF' },
      KAIROS: { area: 'Enemy AI & Behavior Trees', tool: 'Finite State Machines, Pathfinding, Combat Logic' }
    };

    const sInfo = subMap[a.name] || { area: `${a.role} Systems`, tool: 'Custom Development Stack' };
    if (subArea) subArea.textContent = sInfo.area;
    if (subTool) subTool.textContent = sInfo.tool;

    // Dynamically update role-tailored prompt chips if agent changed
    if (this.renderedAgentChipsId !== a.id) {
      this.renderedAgentChipsId = a.id;
      const chipsContainer = this.container.querySelector('#commlinkChipsContainer');
      if (chipsContainer) {
        const promptChips = aiReasoning.getAgentPromptChips(a);
        chipsContainer.innerHTML = promptChips.map(c => `
          <button class="quick-chat-chip commlink-chip" data-query="${c.query.replace(/"/g, '&quot;')}">${c.label}</button>
        `).join('');
      }
    }

    // Render Recent logs
    if (logsEl) {
      if (a.recentLogs && a.recentLogs.length > 0) {
        logsEl.innerHTML = a.recentLogs.slice(-4).map(l => `
          <div class="mini-log-entry">
            <span class="mini-log-time">${l.time || 'NOW'}</span>
            <span class="mini-log-msg">${l.msg || l}</span>
          </div>
        `).join('');
      } else {
        logsEl.innerHTML = `<div class="mini-log-entry empty">Operator siaga di workstation ${a.name}.</div>`;
      }
    }
  }

  dispose() {
    if (this.previewViewport) {
      this.previewViewport.dispose();
    }
  }
}
