/**
 * MultiAgentWorkflow.js - Tier-III NOC Multi-Agent Incident Orchestration Engine
 * Coordinates Arthur (Director), ROUTEX (Network), CHRONOS (Ops), RESOLV (Desk), and CIPHER (Security)
 */

import { AGENT_STATES } from '../utils/constants.js';
import { audio } from '../engine/AudioManager.js';
import { aiReasoning } from '../engine/ai/AIReasoningEngine.js';

export class MultiAgentWorkflow {
  constructor({ registry, pathFinder, terminalLog, spriteRenderer, onLogUpdate }) {
    this.registry = registry;
    this.pathFinder = pathFinder;
    this.terminalLog = terminalLog;
    this.spriteRenderer = spriteRenderer;
    this.onLogUpdate = onLogUpdate || (() => {});

    this.activeScenario = null;
    this.stepTimer = null;
    this.isRunning = false;
  }

  delay(ms) {
    return new Promise(resolve => {
      this.stepTimer = setTimeout(resolve, ms);
    });
  }

  stop() {
    this.isRunning = false;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    for (const agent of this.registry.getAll()) {
      agent.state = AGENT_STATES.IDLE;
    }
    this.onLogUpdate({
      agent: 'NOC HQ',
      text: 'Simulasi insiden dihentikan. Seluruh operator kembali siaga standar.',
      type: 'system'
    });
  }

  // ==============================================================
  // ==============================================================
  // SCENARIO 1: Shader Crash & GPU Memory Leak
  // ==============================================================
  async runPowerSurgeScenario() {
    this.stop();
    this.isRunning = true;
    this.activeScenario = 'Shader Crash & GPU Leak';

    const director = this.registry.getById('audira_lead');
    const routex = this.registry.getById('routex_net');
    const chronos = this.registry.getById('chronos_ops');
    const voltis = this.registry.getById('voltis_mep');
    const cipher = this.registry.getById('cipher_soc');

    audio.playAlert();
    this.onLogUpdate({
      agent: 'ENGINE ALERT',
      text: '⚡ [CRITICAL] WebGL GPU Shader Compiler Crash: Out-of-bounds fragment shader di Sector 07!',
      type: 'error'
    });

    if (chronos) {
      chronos.state = AGENT_STATES.TESTING;
      chronos.speak('Shader error di level modular! Material lighting mengalami unbound texture sampler!');
      chronos.setTask('Inspect Shader Material & Level Mesh Bounds', 'shader_level_debug');
    }
    await this.delay(2800);
    if (!this.isRunning) return;

    if (director) {
      director.state = AGENT_STATES.THINKING;
      director.speak('ROUTEX, deploy fallback shader! VOLTIS, pastikan asset 3D .GLB tidak corrupt.');
      director.setTask('Supervisi Sprint Darurat: WebGL Hotfix Release', 'director_hotfix_bridge');
    }
    await this.delay(2600);
    if (!this.isRunning) return;

    if (routex) {
      routex.state = AGENT_STATES.CODING;
      routex.speak('Hot-reloading shader chunk! Memperbaiki precision floating-point dan buffer binding.');
      routex.setTask('WebGL Pipeline Shader Re-compilation', 'engine_glsl_compiler');
      this.onLogUpdate({
        agent: 'ROUTEX (Engine)',
        text: 'Fragment shader patched. GPU VRAM consumption dropped back to 1.84 GB.',
        type: 'agent'
      });
    }
    await this.delay(2800);
    if (!this.isRunning) return;

    if (voltis) {
      voltis.state = AGENT_STATES.TESTING;
      voltis.speak('Model 3D .GLB divalidasi aman! Topologi mesh dan vertex normal selaras.');
      voltis.setTask('GLB Asset Vertex Normal Validation', 'asset_glb_inspector');
    }
    await this.delay(2600);
    if (!this.isRunning) return;

    if (cipher) {
      cipher.state = AGENT_STATES.TESTING;
      cipher.speak('Audio buffer audio synthesizer tetap sinkron tanpa audio drop.');
      cipher.setTask('Soundscape Latency Buffer Check', 'audio_engine_check');
    }
    await this.delay(2600);
    if (!this.isRunning) return;

    // Resolution
    audio.playSuccess();
    if (chronos) {
      chronos.state = AGENT_STATES.IDLE;
      chronos.speak('Shader compiler sukses! Draw calls stabil di 342, 60.0 FPS terkunci!');
      this.onLogUpdate({
        agent: 'CHRONOS (Level)',
        text: '✅ [RESOLVED] Shader hotfix terpasang. Engine kembali stabil 60 FPS, 0 crash.',
        type: 'success'
      });
    }
    this.isRunning = false;
  }

  // ==============================================================
  // SCENARIO 2: Multiplayer Netcode Desync & Tickrate Drop
  // ==============================================================
  async runThermalAlarmScenario() {
    this.stop();
    this.isRunning = true;
    this.activeScenario = 'Multiplayer Netcode Desync';

    const director = this.registry.getById('audira_lead');
    const routex = this.registry.getById('routex_net');
    const chronos = this.registry.getById('chronos_ops');

    audio.playAlert();
    this.onLogUpdate({
      agent: 'NETCODE ALERT',
      text: '🌐 [WARNING] Tickrate Drop terdeteksi: Lobi 04 mengalami entity position desync!',
      type: 'error'
    });

    if (routex) {
      routex.state = AGENT_STATES.TESTING;
      routex.speak('Desync pada entity synchronization! Mengaktifkan client-side prediction reconciliation!');
      routex.setTask('Rollback Netcode & State Snapshot Interpolation', 'netcode_rollback_sync');
    }
    await this.delay(2800);
    if (!this.isRunning) return;

    if (director) {
      director.state = AGENT_STATES.THINKING;
      director.speak('Kunci server tickrate pada 64 Hz! Pastikan lag compensation adil untuk semua ping.');
    }
    await this.delay(2400);
    if (!this.isRunning) return;

    if (chronos) {
      chronos.state = AGENT_STATES.CODING;
      chronos.speak('NavMesh sync terkonfirmasi. Collision bounds antar entitas 100% akurat.');
      chronos.setTask('Spatial Hash Grid & Entity Bounds Audit', 'spatial_grid_audit');
      this.onLogUpdate({
        agent: 'CHRONOS (Level)',
        text: 'Spatial Grid: Entity bounds reconciled. Zero rubberbanding.',
        type: 'agent'
      });
    }
    await this.delay(2600);
    if (!this.isRunning) return;

    audio.playSuccess();
    if (routex) {
      routex.state = AGENT_STATES.IDLE;
      routex.speak('Netcode kembali optimal! RTT latensi 18.2ms, packet loss 0.00%.');
      this.onLogUpdate({
        agent: 'ROUTEX (Engine)',
        text: '✅ [RESOLVED] Multiplayer netcode tersinkronisasi sempurna pada 64 Hz.',
        type: 'success'
      });
    }
    this.isRunning = false;
  }

  // ==============================================================
  // SCENARIO 3: 3D Asset Workshop Crunch (.GLB Baking Sprint)
  // ==============================================================
  async runCyberDdosScenario() {
    this.stop();
    this.isRunning = true;
    this.activeScenario = '3D Asset & GLB Baking Sprint';

    const director = this.registry.getById('audira_lead');
    const voltis = this.registry.getById('voltis_mep');
    const aegis = this.registry.getById('aegis_sec');
    const resolv = this.registry.getById('resolv_desk');
    const cipher = this.registry.getById('cipher_soc');

    audio.playAlert();
    this.onLogUpdate({
      agent: 'ASSET PIPELINE',
      text: '📦 [SPRINT] 12 Model 3D .GLB baru siap di-bake ke Texture Atlas PBR 2048px!',
      type: 'system'
    });

    if (voltis) {
      voltis.state = AGENT_STATES.TESTING;
      voltis.speak('Memulai automated UV unwrapping & PBR material baking untuk armada model .glb!');
      voltis.setTask('Automated Texture Atlas Packing & Mesh LOD Generation', 'blender_glb_bake');
    }
    await this.delay(2800);
    if (!this.isRunning) return;

    if (aegis) {
      aegis.state = AGENT_STATES.CODING;
      aegis.speak('Menjalankan stress-test 100 bot sekaligus dengan model 3D .glb baru!');
      aegis.setTask('Automated Stress Testing 100 Spawned Entities', 'qa_bot_swarm_test');
      this.onLogUpdate({
        agent: 'AEGIS (QA)',
        text: 'Bot Swarm Test: 100 mecha entities spawned smoothly with zero FPS drop.',
        type: 'agent'
      });
    }
    await this.delay(2800);
    if (!this.isRunning) return;

    if (director) {
      director.state = AGENT_STATES.THINKING;
      director.speak('Visual luar biasa! Pastikan model .glb terkompresi Draco untuk loading instan.');
    }
    await this.delay(2400);
    if (!this.isRunning) return;

    if (resolv) {
      resolv.state = AGENT_STATES.THINKING;
      resolv.speak('Menghubungkan item model baru ke database inventory quest pemain.');
      resolv.setTask('Quest Item Drop & Inventory Binding', 'quest_item_binding');
    }
    await this.delay(2600);
    if (!this.isRunning) return;

    audio.playSuccess();
    if (voltis) {
      voltis.state = AGENT_STATES.IDLE;
      voltis.speak('Seluruh model 3D .GLB berhasil di-bake & terintegrasi ke aula 3D!');
      this.onLogUpdate({
        agent: 'VOLTIS (3D Modeler)',
        text: '✅ [COMPLETED] 3D Asset .GLB Pipeline sukses. Model siap pakai di game.',
        type: 'success'
      });
    }
    this.isRunning = false;
  }

  // ==============================================================
  // SCENARIO 4: Pantry Coffee Break & Focus Recharge
  // ==============================================================
  async runCoffeeBreakScenario() {
    this.stop();
    this.isRunning = true;
    this.activeScenario = 'Pantry Coffee Break';

    const agents = this.registry.getAll();
    const director = this.registry.getById('audira_lead');

    audio.playSuccess();
    this.onLogUpdate({
      agent: 'NOC HQ',
      text: '☕ [ANNOUNCEMENT] Sesi rehat kopi & evaluasi berkala di Pantry Eksekutif dimulai.',
      type: 'system'
    });

    if (director) {
      director.speak('Kerja hebat tim, seluruh metrik SLA tercapai. Mari rehat sejenak di pantry!');
    }
    await this.delay(1800);
    if (!this.isRunning) return;

    for (const a of agents) {
      a.state = AGENT_STATES.COFFEE;
      a.energy = Math.min(100, a.energy + 25);
    }

    const routex = this.registry.getById('routex_net');
    if (routex) routex.speak('Espresso hangat sambil meninjau grafik trafik link internasional.');
    await this.delay(2600);
    if (!this.isRunning) return;

    const cipher = this.registry.getById('cipher_soc');
    if (cipher) cipher.speak('Zero intrusion hari ini, waktu yang tepat untuk secangkir kopi hitam.');
    await this.delay(2600);
    if (!this.isRunning) return;

    this.onLogUpdate({
      agent: 'NOC HQ',
      text: '⚡ Energi seluruh operator pulih 100%. Tim kembali siap bertugas di konsol.',
      type: 'success'
    });

    for (const a of agents) {
      a.state = AGENT_STATES.IDLE;
    }
    this.isRunning = false;
  }

  // ==============================================================
  // SCENARIO 5: Full Normalization
  // ==============================================================
  runNormalizeScenario() {
    this.stop();
    for (const a of this.registry.getAll()) {
      a.state = AGENT_STATES.CODING;
    }
    audio.playSuccess();
    this.onLogUpdate({
      agent: 'NOC HQ',
      text: '🔄 [NORMALISASI] Seluruh subsistem Tier-III kembali ke status OPTIMAL (Hijau).',
      type: 'success'
    });
  }

  // ==============================================================
  // CUSTOM PROMPT DISPATCHER
  // ==============================================================
  async runCustomPrompt(promptText) {
    this.stop();
    this.isRunning = true;
    this.activeScenario = `AI Directive: ${promptText}`;

    this.onLogUpdate({
      agent: 'AI DISPATCHER',
      text: `📢 MEMPROSES MANDAT SPRINT: "${promptText}"`,
      type: 'system'
    });

    const reasoning = await aiReasoning.reasonDirective(promptText, this.registry.getAll());
    const { director, directorBrief, primary, specialistTask, secondary, supportTask, summary } = reasoning;

    audio.playAlert();

    // 1. Director Acknowledgment & Delegation
    if (director) {
      director.state = AGENT_STATES.THINKING;
      director.speak(directorBrief);
      director.setTask(promptText, 'hq_mandate_delegate');
      this.onLogUpdate({
        agent: `${director.name} (Director)`,
        text: directorBrief,
        type: 'agent'
      });
    }

    await this.delay(2600);
    if (!this.isRunning) return;

    // 2. Primary Specialist Action
    if (primary) {
      primary.state = AGENT_STATES.CODING;
      const ackText = `Mengeksekusi mandat: ${specialistTask}`;
      primary.speak(ackText);
      primary.setTask(specialistTask, 'specialist_execution');
      this.onLogUpdate({
        agent: `${primary.name} (${primary.role})`,
        text: `Tugas aktif: ${specialistTask}`,
        type: 'agent'
      });
    }

    await this.delay(2600);
    if (!this.isRunning) return;

    // 3. Secondary Specialist Support
    if (secondary) {
      secondary.state = AGENT_STATES.TESTING;
      secondary.speak(`Mendukung deployment: ${supportTask}`);
      secondary.setTask(supportTask, 'support_validation');
      this.onLogUpdate({
        agent: `${secondary.name} (${secondary.role})`,
        text: `Validasi: ${supportTask}`,
        type: 'agent'
      });
    }

    await this.delay(2800);
    if (!this.isRunning) return;

    audio.playSuccess();
    this.onLogUpdate({
      agent: 'COMMAND HQ',
      text: `✅ ${summary}`,
      type: 'success'
    });
    this.isRunning = false;
  }

  // Backward compatibility aliases
  runPaymentScenario() { return this.runPowerSurgeScenario(); }
  runHotfixScenario() { return this.runThermalAlarmScenario(); }
  runStandupMeeting() { return this.runCoffeeBreakScenario(); }
}
