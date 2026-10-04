/**
 * TaskBar.js - Tier-III NOC Command & Incident Mission Dispatcher
 * Features natural language AI prompt execution, diagnostic slash commands,
 * and one-click incident simulation chips.
 */

import { audio } from '../engine/AudioManager.js';

export class TaskBar {
  constructor({ container, workflow, onSelectAgent, onOpenAiConfig }) {
    this.container = container;
    this.workflow = workflow;
    this.onSelectAgent = onSelectAgent || (() => {});
    this.onOpenAiConfig = onOpenAiConfig || (() => {});

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="taskbar-card glass-panel" id="taskbarPanel">
        <!-- Input Row -->
        <div class="task-input-row">
          <div class="input-wrapper">
            <span class="prompt-icon">🎮</span>
            <input 
              type="text" 
              id="promptInput" 
              placeholder="Instruksi sprint AI / Command CLI (/help, /host, /gpu, /models, /ping, /clear)..."
              autocomplete="off"
            />
          </div>
          <button class="btn btn-primary" id="btnDispatch">
            <span>Kirim Instruksi</span>
          </button>
        </div>

        <!-- Mission Scenario Chips Row -->
        <div class="preset-scenarios-row">
          <span class="preset-label">Sprint &amp; Simulasi Studio:</span>
          
          <button class="chip-btn chip-amber" id="scenarioPower" title="Simulasi WebGL GPU shader compiler crash & recovery">
            ⚡ Shader Crash (VFX)
          </button>
          
          <button class="chip-btn chip-cyan" id="scenarioThermal" title="Simulasi multiplayer tickrate drop & entity desync">
            🌐 Netcode Desync
          </button>
          
          <button class="chip-btn chip-danger" id="scenarioDdos" title="Sprint baking 12 model 3D .GLB baru & stress test bot">
            📦 Asset 3D Crunch
          </button>
          
          <button class="chip-btn chip-violet" id="scenarioCoffee" title="Sesi rehat pizza dan kopi di Pantry Studio">
            ☕ Pizza &amp; Coffee
          </button>
          
          <button class="chip-btn chip-neutral" id="btnNormalize" title="Reset seluruh sistem ke status build stabil 60 FPS">
            🔄 Build Stabil 100%
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  async handleSlashCommand(cmd) {
    const log = (agent, text, type = 'info') => {
      if (this.workflow && this.workflow.onLogUpdate) {
        this.workflow.onLogUpdate({ agent, text, type });
      }
    };

    const c = cmd.toLowerCase().trim();

    if (c === '/help') {
      audio.playBlip();
      log('CLI HELP', 'Daftar Perintah Terminal Studio:', 'system');
      log('COMMANDS', '/host    : Periksa utilisasi CPU, RAM, & Uptime sistem operasi host', 'info');
      log('COMMANDS', '/gpu     : Periksa status akselerasi NVIDIA RTX 3060 CUDA Worker', 'info');
      log('COMMANDS', '/models  : Periksa status Local Ollama & Google Gemini 2.0 Flash', 'info');
      log('COMMANDS', '/ping    : Ukur latensi round-trip ke WebSocket & REST Bridge Port 8080', 'info');
      log('COMMANDS', '/config  : Buka modal konfigurasi AI Engine & API Key', 'info');
      log('COMMANDS', '/clear   : Bersihkan riwayat log konsol telemetri', 'info');
      log('COMMANDS', 'Teks bebas : Mengirim mandat sprint ke Arthur & armada AI untuk dieksekusi', 'info');
      return;
    }

    if (c === '/clear') {
      audio.playClick();
      if (this.workflow?.terminalLog?.clear) {
        this.workflow.terminalLog.clear();
      }
      log('SYSTEM', 'Konsol telemetri dibersihkan.', 'system');
      return;
    }

    if (c === '/config' || c === '/ai') {
      audio.playClick();
      this.onOpenAiConfig();
      log('AI ENGINE', 'Membuka panel konfigurasi Multi-Tier AI Engine.', 'info');
      return;
    }

    if (c === '/ping') {
      const start = performance.now();
      try {
        const res = await fetch('/health');
        const elapsed = Math.round(performance.now() - start);
        if (res.ok) {
          audio.playSuccess();
          log('PING BENCHMARK', `✅ Latensi server port 8080: ${elapsed}ms (Status: OK)`, 'success');
        } else {
          audio.playAlert();
          log('PING BENCHMARK', `⚠️ Server merespons dengan status: ${res.status}`, 'warning');
        }
      } catch (e) {
        audio.playAlert();
        log('PING BENCHMARK', `❌ Gagal menghubungi server port 8080: ${e.message}`, 'error');
      }
      return;
    }

    if (c === '/host') {
      try {
        const res = await fetch('/api/host-metrics');
        if (res.ok) {
          const data = await res.json();
          const t = data.telemetry;
          audio.playSuccess();
          log('HOST TELEMETRY', `🖥️ Host: ${t.hostname} (${t.platform.toUpperCase()}) | Uptime: ${t.uptimeStr}`, 'system');
          log('HARDWARE CPU', `CPU: ${t.cpuModel} (${t.cpuCores} Cores) | Beban: ${t.cpuPercent}%`, t.cpuPercent > 80 ? 'error' : 'info');
          log('HARDWARE RAM', `RAM: Terpakai ${t.usedMemGB} GB dari ${t.totalMemGB} GB (${t.memPercent}%) | Bebas: ${t.freeMemGB} GB`, 'info');
        } else {
          log('HOST TELEMETRY', 'Gagal membaca telemetri host.', 'error');
        }
      } catch (e) {
        log('HOST TELEMETRY', `Error: ${e.message}`, 'error');
      }
      return;
    }

    if (c === '/gpu') {
      try {
        const res = await fetch('/api/ecosystem-status');
        if (res.ok) {
          const data = await res.json();
          const eco = data.ecosystem;
          audio.playSuccess();
          if (eco && eco.aiStudio) {
            log('GPU WORKER', `🎮 Device: ${eco.aiStudio.name} | Status: ${eco.aiStudio.status.toUpperCase()}`, 'system');
            log('VRAM STATUS', `VRAM Bebas: ${(eco.aiStudio.vramFreeMb / 1024).toFixed(1)} GB | Pipeline: TripoSR 3D Ready`, 'info');
          } else {
            log('GPU WORKER', 'RTX 3060 Worker standby di Port 8005.', 'info');
          }
        }
      } catch (e) {
        log('GPU WORKER', `Error: ${e.message}`, 'error');
      }
      return;
    }

    if (c === '/models') {
      try {
        const res = await fetch('/api/ai-status');
        if (res.ok) {
          const data = await res.json();
          audio.playSuccess();
          log('AI ENGINE STATUS', `Provider Terpilih: [${(data.preferredProvider || 'auto').toUpperCase()}]`, 'system');
          log('GEMINI CLOUD', `Status Gemini 2.0 Flash: ${data.geminiConfigured ? '🟢 TERKONFIGURASI' : '⚪ BELUM ADA KEY'}`, data.geminiConfigured ? 'success' : 'warning');
          log('LOCAL OLLAMA', `Status Ollama: ${data.ollamaOnline ? '🟢 ONLINE' : '⚪ OFFLINE'} | Model: ${(data.ollamaModels || []).join(', ') || 'qwen3:8b'}`, 'info');
        }
      } catch (e) {
        log('AI ENGINE STATUS', `Error: ${e.message}`, 'error');
      }
      return;
    }

    // Unrecognized command
    audio.playAlert();
    log('CLI WARNING', `Perintah "${cmd}" tidak dikenali. Ketik /help untuk melihat opsi.`, 'warning');
  }

  bindEvents() {
    const input = this.container.querySelector('#promptInput');
    const dispatchBtn = this.container.querySelector('#btnDispatch');
    const powerBtn = this.container.querySelector('#scenarioPower');
    const thermalBtn = this.container.querySelector('#scenarioThermal');
    const ddosBtn = this.container.querySelector('#scenarioDdos');
    const coffeeBtn = this.container.querySelector('#scenarioCoffee');
    const normalizeBtn = this.container.querySelector('#btnNormalize');

    const handleDispatch = () => {
      const val = input.value.trim();
      if (val) {
        input.value = '';
        if (val.startsWith('/')) {
          this.handleSlashCommand(val);
        } else {
          this.workflow.runCustomPrompt(val);
        }
      }
    };

    dispatchBtn.addEventListener('click', handleDispatch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleDispatch();
      }
    });

    powerBtn.addEventListener('click', () => {
      this.workflow.runPowerSurgeScenario();
    });

    thermalBtn.addEventListener('click', () => {
      this.workflow.runThermalAlarmScenario();
    });

    ddosBtn.addEventListener('click', () => {
      this.workflow.runCyberDdosScenario();
    });

    coffeeBtn.addEventListener('click', () => {
      this.workflow.runCoffeeBreakScenario();
    });

    normalizeBtn.addEventListener('click', () => {
      this.workflow.runNormalizeScenario();
    });
  }
}

