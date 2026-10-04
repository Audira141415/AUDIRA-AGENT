/**
 * AIConfigModal.js - Multi-Tier AI Engine & LLM Configuration Modal
 * Allows switching between Google Gemini API, Local Ollama LLM, and Cyber Studio Personas,
 * setting API Keys, selecting models, and conducting live 1-click latency & reasoning tests.
 */

import { aiReasoning } from '../engine/ai/AIReasoningEngine.js';
import { audio } from '../engine/AudioManager.js';

export class AIConfigModal {
  constructor({ container, onConfigSaved } = {}) {
    this.container = container;
    this.onConfigSaved = onConfigSaved || (() => {});
    this.isOpen = false;
    this.currentStatus = null;
    this.selectedProvider = 'auto';

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-config-modal-backdrop" id="aiConfigBackdrop" style="display: none;">
        <div class="ai-config-modal glass-panel" id="aiConfigModalCard">
          <!-- Modal Header -->
          <div class="ai-config-header">
            <div class="ai-config-title-box">
              <div class="ai-engine-icon-pulse">🤖</div>
              <div>
                <h3 class="ai-config-title">AI ENGINE // MULTI-TIER LLM ORCHESTRATION</h3>
                <p class="ai-config-subtitle">Google Gemini 2.0 Flash • Local Ollama LLM • 10 Cyber Studio Personas</p>
              </div>
            </div>
            <button class="ai-config-close-btn" id="btnAiConfigClose" title="Tutup Modal (Esc)">✕</button>
          </div>

          <!-- Active Engine Status Strip -->
          <div class="ai-status-strip">
            <div class="status-metric-box">
              <span class="metric-title">STATUS ENGINE:</span>
              <span class="metric-badge" id="aiStatusBadge">🟢 STANDBY</span>
            </div>
            <div class="status-metric-box">
              <span class="metric-title">PROVIDER AKTIF:</span>
              <span class="metric-val" id="aiActiveProviderVal">AUTO (HYBRID)</span>
            </div>
            <div class="status-metric-box">
              <span class="metric-title">LATENCY TEST:</span>
              <span class="metric-val" id="aiLatencyVal" style="color: #38bdf8;">-- ms</span>
            </div>
          </div>

          <!-- Modal Scrollable Content -->
          <div class="ai-config-body custom-scrollbar">
            <!-- 1. Preferred Provider Selector -->
            <div class="ai-config-section">
              <label class="section-label">PILIH MODE PROVIDER UTAMA:</label>
              <div class="provider-cards-grid">
                <div class="provider-card active" data-provider="auto" id="cardProviderAuto">
                  <div class="card-radio-dot"></div>
                  <div class="card-info">
                    <div class="card-title">⚡ Auto (Hybrid Fallback)</div>
                    <div class="card-desc">Otomatis memilih Gemini jika API Key ada, lalu Ollama lokal, lalu Studio Personas.</div>
                  </div>
                  <span class="card-pill">REKOMENDASI</span>
                </div>

                <div class="provider-card" data-provider="gemini" id="cardProviderGemini">
                  <div class="card-radio-dot"></div>
                  <div class="card-info">
                    <div class="card-title">✨ Google Gemini 2.0 Flash</div>
                    <div class="card-desc">Penalaran awan LLM mutakhir berkecepatan tinggi, respons cerdas & kontekstual.</div>
                  </div>
                  <span class="card-pill" style="color: #60a5fa; border-color: rgba(96, 165, 250, 0.4);">CLOUD API</span>
                </div>

                <div class="provider-card" data-provider="ollama" id="cardProviderOllama">
                  <div class="card-radio-dot"></div>
                  <div class="card-info">
                    <div class="card-title">🦙 Local Ollama LLM</div>
                    <div class="card-desc">Model offline lokal (Port 11434) berjalan pada akselerasi NVIDIA RTX 3060.</div>
                  </div>
                  <span class="card-pill" style="color: #34d399; border-color: rgba(52, 211, 153, 0.4);">LOCAL CUDA</span>
                </div>

                <div class="provider-card" data-provider="persona" id="cardProviderPersona">
                  <div class="card-radio-dot"></div>
                  <div class="card-info">
                    <div class="card-title">💻 Cyber Studio Personas</div>
                    <div class="card-desc">Sistem deterministik 10 spesialis studio lokal berkecepatan sub-millisecond.</div>
                  </div>
                  <span class="card-pill" style="color: #fbbf24; border-color: rgba(251, 191, 36, 0.4);">OFFLINE FAST</span>
                </div>
              </div>
            </div>

            <!-- 2. Google Gemini API Key Input -->
            <div class="ai-config-section" id="secGeminiConfig">
              <div class="section-label-row">
                <label class="section-label">GOOGLE GEMINI API KEY:</label>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="helper-link">
                  Dapatkan API Key Gratis di Google AI Studio ↗
                </a>
              </div>
              <div class="api-key-input-box">
                <input 
                  type="password" 
                  id="inputGeminiApiKey" 
                  class="styled-api-input" 
                  placeholder="Masukkan AIzaSy... (Akan disimpan lokal & di backend)"
                  autocomplete="off"
                />
                <button type="button" class="btn-toggle-eye" id="btnToggleApiKeyEye" title="Tampilkan / Sembunyikan API Key">👁️</button>
              </div>
              <div class="api-key-hint" id="geminiKeyStatusText">
                Status: Memeriksa konfigurasi API Key...
              </div>
            </div>

            <!-- 3. Local Ollama Model Configuration -->
            <div class="ai-config-section" id="secOllamaConfig">
              <div class="section-label-row">
                <label class="section-label">MODEL LOCAL OLLAMA (PORT 11434):</label>
                <span class="helper-tag" id="ollamaDaemonStatus">MEMERIKSA PORT 11434...</span>
              </div>
              <div class="ollama-select-row">
                <select id="selectOllamaModel" class="styled-select">
                  <option value="qwen3:8b">qwen3:8b (Direkomendasikan)</option>
                  <option value="llama3">llama3</option>
                  <option value="deepseek-r1">deepseek-r1</option>
                  <option value="mistral">mistral</option>
                  <option value="custom">Input Model Lain...</option>
                </select>
                <input 
                  type="text" 
                  id="inputCustomOllamaModel" 
                  class="styled-api-input" 
                  placeholder="Nama model kustom..." 
                  style="display: none; flex: 1;"
                />
              </div>
            </div>

            <!-- 4. Interactive 1-Click Test Bench -->
            <div class="ai-config-section test-bench-section">
              <label class="section-label">BENCHMARK &amp; UJI PENALARAN AI LIVE:</label>
              <div class="test-bench-input-row">
                <input 
                  type="text" 
                  id="inputTestPrompt" 
                  class="styled-api-input" 
                  value="Arthur, laporkan kesiapan engine Three.js dan pipeline asset 3D."
                  placeholder="Tulis pesan pengujian..."
                />
                <button type="button" class="btn btn-primary" id="btnRunAiTest">
                  <span>🧪 Uji Koneksi</span>
                </button>
              </div>

              <!-- Test Result Console Output -->
              <div class="test-bench-console" id="testBenchConsole">
                <div class="console-placeholder">
                  Klik tombol <strong>"🧪 Uji Koneksi"</strong> untuk mengukur latensi round-trip dan respons penalaran LLM.
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="ai-config-footer">
            <span class="save-status-msg" id="aiSaveStatusMsg"></span>
            <div class="footer-btn-group">
              <button type="button" class="btn btn-secondary" id="btnAiConfigCancel">Batal</button>
              <button type="button" class="btn btn-primary" id="btnAiConfigSave">
                <span>💾 Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#aiConfigBackdrop');
    const closeBtn = this.container.querySelector('#btnAiConfigClose');
    const cancelBtn = this.container.querySelector('#btnAiConfigCancel');
    const saveBtn = this.container.querySelector('#btnAiConfigSave');
    const eyeBtn = this.container.querySelector('#btnToggleApiKeyEye');
    const apiKeyInput = this.container.querySelector('#inputGeminiApiKey');
    const testBtn = this.container.querySelector('#btnRunAiTest');
    const modelSelect = this.container.querySelector('#selectOllamaModel');
    const customModelInput = this.container.querySelector('#inputCustomOllamaModel');

    // Close actions
    const handleClose = () => this.close();
    closeBtn?.addEventListener('click', handleClose);
    cancelBtn?.addEventListener('click', handleClose);
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) handleClose();
    });

    // Eye toggle for password
    eyeBtn?.addEventListener('click', () => {
      if (apiKeyInput) {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
      }
    });

    // Provider cards selection
    const cards = this.container.querySelectorAll('.provider-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedProvider = card.dataset.provider || 'auto';
        audio.playClick();
      });
    });

    // Ollama custom model toggle
    modelSelect?.addEventListener('change', () => {
      if (modelSelect.value === 'custom') {
        if (customModelInput) customModelInput.style.display = 'block';
      } else {
        if (customModelInput) customModelInput.style.display = 'none';
      }
    });

    // Run AI Test Bench
    testBtn?.addEventListener('click', async () => {
      await this.runAiTestProbe();
    });

    // Save Configuration
    saveBtn?.addEventListener('click', async () => {
      await this.saveConfiguration();
    });
  }

  async open() {
    this.isOpen = true;
    const backdrop = this.container.querySelector('#aiConfigBackdrop');
    if (backdrop) backdrop.style.display = 'flex';
    audio.playModalOpen();

    await this.refreshStatus();
  }

  close() {
    this.isOpen = false;
    const backdrop = this.container.querySelector('#aiConfigBackdrop');
    if (backdrop) backdrop.style.display = 'none';
    audio.playModalClose();
  }

  async refreshStatus() {
    const status = await aiReasoning.getAiStatus();
    this.currentStatus = status;

    const apiKeyInput = this.container.querySelector('#inputGeminiApiKey');
    const keyStatusText = this.container.querySelector('#geminiKeyStatusText');
    const ollamaStatusTag = this.container.querySelector('#ollamaDaemonStatus');
    const selectOllama = this.container.querySelector('#selectOllamaModel');
    const aiStatusBadge = this.container.querySelector('#aiStatusBadge');
    const aiActiveProviderVal = this.container.querySelector('#aiActiveProviderVal');

    // Update stored local key if available
    const localKey = localStorage.getItem('audira_gemini_api_key') || '';
    if (apiKeyInput && !apiKeyInput.value && localKey) {
      apiKeyInput.value = localKey;
    }

    if (keyStatusText) {
      if (localKey || status.geminiConfigured) {
        keyStatusText.innerHTML = `🟢 <strong style="color: #10b981;">API Key Terkonfigurasi</strong> (Gemini 2.0 Flash aktif)`;
      } else {
        keyStatusText.innerHTML = `⚪ <span style="color: #94a3b8;">API Key belum diisi. Menggunakan fallback Ollama / Persona lokal.</span>`;
      }
    }

    // Update Ollama models & tag
    if (ollamaStatusTag) {
      if (status.ollamaOnline) {
        ollamaStatusTag.textContent = '🟢 OLLAMA ONLINE (Port 11434)';
        ollamaStatusTag.style.color = '#34d399';
        ollamaStatusTag.style.borderColor = 'rgba(52, 211, 153, 0.4)';
      } else {
        ollamaStatusTag.textContent = '⚪ OLLAMA STANDBY / OFFLINE';
        ollamaStatusTag.style.color = '#94a3b8';
        ollamaStatusTag.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }
    }

    if (selectOllama && status.ollamaModels && status.ollamaModels.length > 0) {
      // Clear and populate with detected models
      selectOllama.innerHTML = '';
      status.ollamaModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `${m} (Terdeteksi di Host)`;
        selectOllama.appendChild(opt);
      });
      const customOpt = document.createElement('option');
      customOpt.value = 'custom';
      customOpt.textContent = 'Input Model Lain...';
      selectOllama.appendChild(customOpt);
    }

    // Update active provider selection
    const pref = status.preferredProvider || 'auto';
    this.selectedProvider = pref;
    const cards = this.container.querySelectorAll('.provider-card');
    cards.forEach(c => {
      c.classList.toggle('active', c.dataset.provider === pref);
    });

    if (aiActiveProviderVal) {
      aiActiveProviderVal.textContent = pref.toUpperCase();
    }
    if (aiStatusBadge) {
      aiStatusBadge.textContent = '🟢 SIAGA';
    }
  }

  async runAiTestProbe() {
    const testPromptInput = this.container.querySelector('#inputTestPrompt');
    const testConsole = this.container.querySelector('#testBenchConsole');
    const testBtn = this.container.querySelector('#btnRunAiTest');
    const latencyVal = this.container.querySelector('#aiLatencyVal');

    const promptText = testPromptInput?.value.trim() || 'Arthur, laporkan kesiapan engine Three.js.';

    audio.playClick();
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.innerHTML = `<span>⏳ Menguji...</span>`;
    }

    if (testConsole) {
      testConsole.innerHTML = `
        <div style="color: #38bdf8; font-family: monospace; font-size: 11px;">
          [PROBE] Mengirim telemetri prompt ke AI Engine... Target: Arthur (Studio Director)
        </div>
      `;
    }

    try {
      const res = await aiReasoning.testAiConnection(promptText);

      if (latencyVal) {
        latencyVal.textContent = `${res.latencyMs} ms`;
        latencyVal.style.color = res.latencyMs < 200 ? '#10b981' : res.latencyMs < 800 ? '#38bdf8' : '#fbbf24';
      }

      if (testConsole) {
        testConsole.innerHTML = `
          <div style="font-family: monospace; font-size: 11px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.15); padding-bottom: 4px;">
            <span style="color: #10b981;">✅ KONEKSI BERHASIL // PROVIDER: [${res.provider.toUpperCase()}]</span>
            <span style="color: #38bdf8; font-weight: bold;">⚡ ${res.latencyMs}ms</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-bottom: 6px; line-height: 1.4;">
            💭 <em>${res.thought}</em>
          </div>
          <div style="font-size: 12px; color: #f8fafc; line-height: 1.4; background: rgba(56, 189, 248, 0.08); padding: 8px; border-radius: 6px; border: 1px solid rgba(56, 189, 248, 0.2);">
            <strong>Arthur:</strong> "${res.reply}"
          </div>
        `;
      }
      audio.playSuccess();
    } catch (err) {
      if (testConsole) {
        testConsole.innerHTML = `
          <div style="color: #f43f5e; font-family: monospace; font-size: 11px;">
            ❌ Gagal melakukan uji AI: ${err.message}
          </div>
        `;
      }
      audio.playAlert();
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = `<span>🧪 Uji Koneksi</span>`;
      }
    }
  }

  async saveConfiguration() {
    const apiKeyInput = this.container.querySelector('#inputGeminiApiKey');
    const selectOllama = this.container.querySelector('#selectOllamaModel');
    const customModelInput = this.container.querySelector('#inputCustomOllamaModel');
    const saveMsg = this.container.querySelector('#aiSaveStatusMsg');
    const saveBtn = this.container.querySelector('#btnAiConfigSave');

    let ollamaModel = selectOllama?.value || 'qwen3:8b';
    if (ollamaModel === 'custom' && customModelInput && customModelInput.value.trim()) {
      ollamaModel = customModelInput.value.trim();
    }

    const payload = {
      preferredProvider: this.selectedProvider,
      geminiApiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
      ollamaModel
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>💾 Menyimpan...</span>`;
    }

    try {
      const res = await aiReasoning.saveAiConfig(payload);
      audio.playSuccess();

      if (saveMsg) {
        saveMsg.textContent = '✅ Konfigurasi AI berhasil disimpan!';
        saveMsg.style.color = '#10b981';
      }

      this.onConfigSaved(payload);

      setTimeout(() => {
        if (saveMsg) saveMsg.textContent = '';
        this.close();
      }, 1000);
    } catch (err) {
      audio.playAlert();
      if (saveMsg) {
        saveMsg.textContent = `❌ Gagal menyimpan: ${err.message}`;
        saveMsg.style.color = '#f43f5e';
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>💾 Simpan Konfigurasi</span>`;
      }
    }
  }
}
