/**
 * AddAgentModal.js - High-Tech Operator Onboarding Modal (AUDIRA-DCOS Style)
 * Allows administrators to commission new AI specialists to the 3D NOC fleet.
 */

import { audio } from '../engine/AudioManager.js';

export class AddAgentModal {
  constructor({ container, registry, onAgentAdded }) {
    this.container = container;
    this.registry = registry;
    this.onAgentAdded = onAgentAdded || (() => {});

    this.isOpen = false;

    // Presets for Game Dev Studio Fleet
    this.presets = [
      {
        name: 'VOLTIS',
        role: 'ELECTRICAL',
        color: '#10b981',
        icon: '📦',
        task: 'Modeling mecha armor & weapon asset .GLB beresolusi tinggi',
        thought: 'Optimasi topologi polygon 3D mesh .glb siap export ke scene.',
        desc: 'Lead 3D Modeler & GLB Asset Specialist'
      },
      {
        name: 'THERMO',
        role: 'HVAC',
        color: '#0284c7',
        icon: '✨',
        task: 'Mengerjakan compute shader partikel laser & dynamic lighting',
        thought: 'Simulasi physics ragdoll & particle burst berjalan lancar.',
        desc: 'Physics & Particle Shader Specialist'
      },
      {
        name: 'AEGIS',
        role: 'FIRE_SEC',
        color: '#f43f5e',
        icon: '🧪',
        task: 'Stress-testing 1,420 automated bot playtests (0 crash bugs)',
        thought: 'Stress-test 100 entity bersamaan tidak mengalami drop FPS.',
        desc: 'Lead QA & Automated Bot Playtester'
      },
      {
        name: 'NEXUS',
        role: 'DATABASE',
        color: '#6366f1',
        icon: '🎮',
        task: 'Desain cyber-retro tactile HUD & responsive inventory UI',
        thought: 'Komponen SVG & WebGL HUD terkalibrasi tajam tanpa overhead.',
        desc: 'Lead UI/UX & Cyber-Retro HUD Designer'
      },
      {
        name: 'KAIROS',
        role: 'AI_SENTRY',
        color: '#d946ef',
        icon: '🤖',
        task: 'Tuning neural AI pathfinding & dynamic difficulty scaling',
        thought: 'Algoritma AI lawan beradaptasi dengan tingkat keahlian pemain.',
        desc: 'Autonomous AI Game Director'
      }
    ];

    this.render();
  }

  open() {
    this.isOpen = true;
    this.render();
    audio.playBeep(660, 0.08, 'sine');
  }

  close() {
    this.isOpen = false;
    const modal = this.container.querySelector('.add-agent-backdrop');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="add-agent-backdrop ${this.isOpen ? 'visible' : ''}">
        <div class="add-agent-modal glass-panel">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <span class="modal-icon">➕</span>
              <div>
                <h3 class="modal-title">ONBOARDING OPERATOR BARU // GAME DEV FLEET</h3>
                <span class="modal-sub">TAMBAHKAN SPESIALIS AI KE GAME STUDIO 3D</span>
              </div>
            </div>
            <button class="modal-close-btn" id="btnAddAgentClose" title="Tutup Modal (Esc)">✕</button>
          </div>

          <!-- Body -->
          <div class="modal-body custom-scrollbar">
            <!-- Preset Quick-Select Cards -->
            <div class="form-section">
              <div class="section-label">⚡ TEMPLATE OPERATOR CEPAT (GAME DEV STUDIO):</div>
              <div class="preset-cards-grid">
                ${this.presets.map((p, idx) => `
                  <button class="preset-card-btn" data-preset-idx="${idx}">
                    <span class="preset-icon" style="background: ${p.color}20; color: ${p.color}; border: 1px solid ${p.color}40">
                      ${p.icon}
                    </span>
                    <div class="preset-info">
                      <span class="preset-name">${p.name}</span>
                      <span class="preset-desc">${p.desc}</span>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Custom Form Fields -->
            <form class="agent-form" id="newAgentForm">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="agentNameInput">Nama Operator / Codename:</label>
                  <input 
                    type="text" 
                    id="agentNameInput" 
                    placeholder="Contoh: VOLTIS, AURA, VORTEX..." 
                    required 
                    autocomplete="off"
                  />
                </div>

                <div class="form-group flex-1">
                  <label for="agentRoleSelect">Peran &amp; Divisi Spesialisasi:</label>
                  <select id="agentRoleSelect">
                    <option value="ELECTRICAL">📦 3D Modeler &amp; GLB Asset Specialist</option>
                    <option value="NETWORK">⚙️ Engine &amp; Gameplay Architect</option>
                    <option value="NOC_OPS">🗺️ Level Designer &amp; Environment</option>
                    <option value="HELPDESK">📜 Narrative &amp; Quest Designer</option>
                    <option value="CYBER_SOC">🎵 Audio Synth &amp; SFX Engineer</option>
                    <option value="HVAC">✨ Physics &amp; VFX Shader Specialist</option>
                    <option value="FIRE_SEC">🧪 QA &amp; Automated Playtester</option>
                    <option value="DATABASE">🎮 UI/UX &amp; Retro HUD Designer</option>
                    <option value="AI_SENTRY">🤖 Autonomous AI Game Director</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Warna Identitas (Badge Color):</label>
                  <div class="color-palette-picker" id="colorPicker">
                    ${[
                      { c: '#10b981', l: 'Emerald' },
                      { c: '#0284c7', l: 'Sky' },
                      { c: '#06b6d4', l: 'Cyan' },
                      { c: '#a855f7', l: 'Violet' },
                      { c: '#f43f5e', l: 'Rose' },
                      { c: '#fbbf24', l: 'Amber' },
                      { c: '#d946ef', l: 'Fuchsia' },
                    ].map((col, i) => `
                      <button 
                        type="button" 
                        class="color-chip ${i === 0 ? 'selected' : ''}" 
                        data-color="${col.c}" 
                        style="background: ${col.c}" 
                        title="${col.l}">
                      </button>
                    `).join('')}
                  </div>
                </div>

                <div class="form-group flex-1">
                  <label for="agentIconSelect">Ikon Badge Avatar:</label>
                  <select id="agentIconSelect">
                    <option value="📦">📦 Kotak Aset (3D Modeler / GLB)</option>
                    <option value="⚙️">⚙️ Roda Gigi (Engine / Architecture)</option>
                    <option value="🗺️">🗺️ Peta (Level Design / Biome)</option>
                    <option value="📜">📜 Naskah (Narrative / Quest)</option>
                    <option value="🎵">🎵 Not Musik (Audio / Synth)</option>
                    <option value="✨">✨ Kilau (VFX Shader / Physics)</option>
                    <option value="🧪">🧪 Tabung Reaksi (QA / Playtester)</option>
                    <option value="🎮">🎮 Gamepad (HUD / UI/UX)</option>
                    <option value="🤖">🤖 Robot (AI Autonomous)</option>
                    <option value="👑">👑 Mahkota (Director / Lead)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="agentTaskInput">Mandat / Tugas Awal:</label>
                <input 
                  type="text" 
                  id="agentTaskInput" 
                  placeholder="Contoh: Optimasi shader partikel atau animasi rig .GLB" 
                  value="Siaga di stasiun kerja game studio"
                  required 
                  autocomplete="off"
                />
              </div>

              <div class="form-group">
                <label for="agentThoughtInput">Telemetri Pikiran Awal (Inner Monologue):</label>
                <input 
                  type="text" 
                  id="agentThoughtInput" 
                  placeholder="Contoh: Menguji frame rate 60 FPS dan stabilitas mesh .GLB" 
                  value="Memantau pipeline produksi dan performa build 3D."
                  autocomplete="off"
                />
              </div>

              <!-- 3D Avatar Model Type: Procedural SD Gundam vs Custom GLB -->
              <div class="form-section-model" style="margin-top: 14px; padding: 12px; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.25); border-radius: 8px;">
                <label style="font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
                  📦 MODEL 3D AVATAR (.GLB / GLTF):
                </label>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <button type="button" class="btn btn-secondary btn-sm" id="btnModelProcedural" style="flex: 1; border-color: rgba(56, 189, 248, 0.6); background: rgba(56, 189, 248, 0.15);">
                    🤖 SD Gundam Prosedural
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btnModelCustomGLB" style="flex: 1;">
                    📁 Upload / Custom .GLB
                  </button>
                </div>
                <div id="glbUploadContainer" style="display: none; flex-direction: column; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="file" id="glbFileInput" accept=".glb,.gltf" style="display: none;" />
                    <button type="button" class="btn btn-secondary btn-sm" id="btnBrowseGLB" style="white-space: nowrap;">
                      📤 Pilih File .glb
                    </button>
                    <span id="glbFileName" style="font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      Belum ada file dipilih (misal: TripoSR / Blender)
                    </span>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span style="font-size: 11px; color: #64748b; white-space: nowrap;">Atau URL:</span>
                    <input type="text" id="glbUrlInput" placeholder="https://... atau /models/sample_ai_worker.glb" style="font-size: 11px; padding: 4px 8px; flex: 1;" />
                    <button type="button" class="btn btn-secondary btn-xs" id="btnSampleGLB" style="padding: 3px 8px; font-size: 10px; white-space: nowrap; border-color: rgba(56, 189, 248, 0.4);">
                      ⚡ Contoh GLB
                    </button>
                  </div>
                </div>
              </div>

              <!-- Footer Buttons -->
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="btnCancelAdd">Batal</button>
                <button type="submit" class="btn btn-primary" id="btnSubmitAdd">
                  <span>🚀 Deploy ke Aula 3D</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backdrop = this.container.querySelector('.add-agent-backdrop');
    const closeBtn = this.container.querySelector('#btnAddAgentClose');
    const cancelBtn = this.container.querySelector('#btnCancelAdd');
    const form = this.container.querySelector('#newAgentForm');
    const nameInput = this.container.querySelector('#agentNameInput');
    const roleSelect = this.container.querySelector('#agentRoleSelect');
    const iconSelect = this.container.querySelector('#agentIconSelect');
    const taskInput = this.container.querySelector('#agentTaskInput');
    const thoughtInput = this.container.querySelector('#agentThoughtInput');
    const colorChips = this.container.querySelectorAll('.color-chip');

    let selectedColor = '#10b981';

    colorChips.forEach(chip => {
      chip.addEventListener('click', () => {
        colorChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedColor = chip.dataset.color;
      });
    });

    // Preset cards
    const presetBtns = this.container.querySelectorAll('.preset-card-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.presetIdx, 10);
        const p = this.presets[idx];
        if (p) {
          if (nameInput) nameInput.value = p.name;
          if (roleSelect) roleSelect.value = p.role;
          if (iconSelect) iconSelect.value = p.icon;
          if (taskInput) taskInput.value = p.task;
          if (thoughtInput) thoughtInput.value = p.thought;

          // Select matching color chip
          selectedColor = p.color;
          colorChips.forEach(chip => {
            if (chip.dataset.color === p.color) {
              chip.classList.add('selected');
            } else {
              chip.classList.remove('selected');
            }
          });
          audio.playClick();
        }
      });
    });

    const handleClose = () => {
      this.close();
    };

    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) handleClose();
    });

    // Model selection logic (.glb vs procedural)
    let customModelUrl = null;
    let customModelName = null;

    const btnModelProcedural = this.container.querySelector('#btnModelProcedural');
    const btnModelCustomGLB = this.container.querySelector('#btnModelCustomGLB');
    const glbUploadContainer = this.container.querySelector('#glbUploadContainer');
    const glbFileInput = this.container.querySelector('#glbFileInput');
    const btnBrowseGLB = this.container.querySelector('#btnBrowseGLB');
    const glbFileName = this.container.querySelector('#glbFileName');
    const glbUrlInput = this.container.querySelector('#glbUrlInput');

    if (btnModelProcedural && btnModelCustomGLB && glbUploadContainer) {
      btnModelProcedural.addEventListener('click', () => {
        btnModelProcedural.style.borderColor = 'rgba(56, 189, 248, 0.6)';
        btnModelProcedural.style.background = 'rgba(56, 189, 248, 0.15)';
        btnModelCustomGLB.style.borderColor = '';
        btnModelCustomGLB.style.background = '';
        glbUploadContainer.style.display = 'none';
        customModelUrl = null;
        customModelName = null;
      });

      btnModelCustomGLB.addEventListener('click', () => {
        btnModelCustomGLB.style.borderColor = 'rgba(56, 189, 248, 0.6)';
        btnModelCustomGLB.style.background = 'rgba(56, 189, 248, 0.15)';
        btnModelProcedural.style.borderColor = '';
        btnModelProcedural.style.background = '';
        glbUploadContainer.style.display = 'flex';
      });

      if (btnBrowseGLB && glbFileInput) {
        btnBrowseGLB.addEventListener('click', () => glbFileInput.click());
        glbFileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            customModelName = file.name;
            glbFileName.textContent = `✓ ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
            glbFileName.style.color = '#38bdf8';
            customModelUrl = URL.createObjectURL(file);
          }
        });
      }

      const btnSampleGLB = this.container.querySelector('#btnSampleGLB');
      if (btnSampleGLB && glbUrlInput) {
        btnSampleGLB.addEventListener('click', () => {
          const samplePath = '/models/sample_ai_worker.glb';
          glbUrlInput.value = samplePath;
          customModelUrl = samplePath;
          customModelName = 'sample_ai_worker.glb';
          glbFileName.textContent = '✓ sample_ai_worker.glb (Sample 3D Model)';
          glbFileName.style.color = '#38bdf8';
        });
      }

      if (glbUrlInput) {
        glbUrlInput.addEventListener('input', () => {
          if (glbUrlInput.value.trim()) {
            customModelUrl = glbUrlInput.value.trim();
            customModelName = customModelUrl.split('/').pop() || 'model.glb';
            glbFileName.textContent = `URL: ${customModelName}`;
            glbFileName.style.color = '#38bdf8';
          }
        });
      }
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (!name) return;

        const role = roleSelect.value;
        const icon = iconSelect.value;
        const initialTask = taskInput.value.trim() || 'Siaga di stasiun konsol';
        const initialThought = thoughtInput.value.trim() || 'Memantau kesiapan parameter operasional.';

        const createdAgent = this.registry.addAgent({
          name,
          role,
          icon,
          color: selectedColor,
          initialTask,
          initialThought,
          modelUrl: customModelUrl,
          modelName: customModelName
        });

        audio.playSuccess();
        this.close();
        this.onAgentAdded(createdAgent);
      });
    }
  }
}
