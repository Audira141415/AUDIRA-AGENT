/**
 * AgentRegistry.js - 5-Agent Corporate Hierarchy (CEO, Manager, Dev, QA, DevOps)
 */

import { Agent } from './Agent.js';
import { ROLES, OFFICE_ZONES } from '../utils/constants.js';

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.initAgents();
  }

  initAgents() {
    // 1. Arthur - Studio Director & Executive Producer
    const director = new Agent({
      id: 'audira_lead',
      name: 'Arthur',
      role: 'DIRECTOR',
      roleConfig: ROLES.DIRECTOR,
      deskCoord: { x: 5, y: 5 }
    });
    director.currentTask = 'Memimpin sprint milestone Alpha v0.9.4 & review build Three.js';
    director.innerMonologue = 'Seluruh 10 divisi studio game sinkron. Target rilis demo 3 hari lagi.';
    this.agents.set(director.id, director);

    // 2. ROUTEX - Lead Gameplay & Engine Architect
    const routex = new Agent({
      id: 'routex_net',
      name: 'ROUTEX',
      role: 'NETWORK',
      roleConfig: ROLES.NETWORK,
      deskCoord: { x: 9, y: 3 }
    });
    routex.currentTask = 'Optimasi WebGL draw calls (60 FPS terkunci) & multiplayer netcode';
    routex.innerMonologue = 'Frametime 16.6ms stabil. Latensi client RTT 18ms zero packet drop.';
    this.agents.set(routex.id, routex);

    // 3. CHRONOS - Lead Technical Artist & Level Designer
    const chronos = new Agent({
      id: 'chronos_ops',
      name: 'CHRONOS',
      role: 'NOC_OPS',
      roleConfig: ROLES.NOC_OPS,
      deskCoord: { x: 11, y: 3 }
    });
    chronos.currentTask = 'Menyusun modular level Cyber City & baking occlusion culling';
    chronos.innerMonologue = 'NavMesh sektor 07 selesai dikompilasi, siap uji navigasi bot.';
    this.agents.set(chronos.id, chronos);

    // 4. RESOLV - Lead Narrative & Game Designer
    const resolv = new Agent({
      id: 'resolv_desk',
      name: 'RESOLV',
      role: 'HELPDESK',
      roleConfig: ROLES.HELPDESK,
      deskCoord: { x: 13, y: 3 }
    });
    resolv.currentTask = 'Menulis percabangan dialog quest NPC & combat balance stats';
    resolv.innerMonologue = 'Scripting questline utama rampung, 48 node cerita aktif.';
    this.agents.set(resolv.id, resolv);

    // 5. CIPHER - Lead Audio & Polyphonic Synth Engineer
    const cipher = new Agent({
      id: 'cipher_soc',
      name: 'CIPHER',
      role: 'CYBER_SOC',
      roleConfig: ROLES.CYBER_SOC,
      deskCoord: { x: 15, y: 3 }
    });
    cipher.currentTask = 'Merancang polyphonic synth audio FX & dynamic combat OST';
    cipher.innerMonologue = 'Audio buffer stereo terisi sempurna tanpa latency lag.';
    this.agents.set(cipher.id, cipher);

    // 6. VOLTIS - Lead 3D Modeler & GLB Asset Specialist
    const voltis = new Agent({
      id: 'voltis_mep',
      name: 'VOLTIS',
      role: 'ELECTRICAL',
      roleConfig: ROLES.ELECTRICAL,
      deskCoord: { x: 5, y: 7 }
    });
    voltis.currentTask = 'Modeling mecha armor & weapon asset .GLB beresolusi tinggi';
    voltis.innerMonologue = 'Optimasi topologi polygon 3D mesh .glb siap export ke scene.';
    this.agents.set(voltis.id, voltis);

    // 7. THERMO - Physics & Particle Shader Specialist
    const thermo = new Agent({
      id: 'thermo_hvac',
      name: 'THERMO',
      role: 'HVAC',
      roleConfig: ROLES.HVAC,
      deskCoord: { x: 9, y: 7 }
    });
    thermo.currentTask = 'Mengerjakan compute shader partikel laser & dynamic lighting';
    thermo.innerMonologue = 'Simulasi physics ragdoll & particle burst berjalan lancar.';
    this.agents.set(thermo.id, thermo);

    // 8. NEXUS - Lead UI/UX & Cyber-Retro HUD Designer
    const nexus = new Agent({
      id: 'nexus_san',
      name: 'NEXUS',
      role: 'DATABASE',
      roleConfig: ROLES.DATABASE,
      deskCoord: { x: 11, y: 7 }
    });
    nexus.currentTask = 'Desain cyber-retro tactile HUD & responsive inventory UI';
    nexus.innerMonologue = 'Komponen SVG & WebGL HUD terkalibrasi tajam tanpa overhead.';
    this.agents.set(nexus.id, nexus);

    // 9. AEGIS - Lead QA & Automated Bot Playtester
    const aegis = new Agent({
      id: 'aegis_sec',
      name: 'AEGIS',
      role: 'FIRE_SEC',
      roleConfig: ROLES.FIRE_SEC,
      deskCoord: { x: 13, y: 7 }
    });
    aegis.currentTask = 'Stress-testing 1,420 automated bot playtests (0 crash bugs)';
    aegis.innerMonologue = 'Stress-test 100 entity bersamaan tidak mengalami drop FPS.';
    this.agents.set(aegis.id, aegis);

    // 10. KAIROS - Autonomous AI Game Director
    const kairos = new Agent({
      id: 'kairos_ai',
      name: 'KAIROS',
      role: 'AI_SENTRY',
      roleConfig: ROLES.AI_SENTRY,
      deskCoord: { x: 15, y: 7 }
    });
    kairos.currentTask = 'Tuning neural AI pathfinding & dynamic difficulty scaling';
    kairos.innerMonologue = 'Algoritma AI lawan beradaptasi dengan tingkat keahlian pemain.';
    this.agents.set(kairos.id, kairos);

    // Load any custom added agents from localStorage
    this.loadCustomAgents();
  }

  loadCustomAgents() {
    try {
      const stored = localStorage.getItem('audira_custom_agents');
      if (stored) {
        const list = JSON.parse(stored);
        for (const data of list) {
          if (!this.agents.has(data.id)) {
            const ag = new Agent(data);
            ag.currentTask = data.currentTask || 'Siaga di stasiun kerja NOC';
            ag.innerMonologue = data.innerMonologue || 'Memantau kesiapan sistem';
            ag.modelUrl = data.modelUrl || null;
            ag.modelName = data.modelName || null;
            this.agents.set(ag.id, ag);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load custom agents:', e);
    }
  }

  saveCustomAgents() {
    try {
      const coreIds = [
        'audira_lead',
        'routex_net',
        'chronos_ops',
        'resolv_desk',
        'cipher_soc',
        'voltis_mep',
        'thermo_hvac',
        'nexus_san',
        'aegis_sec',
        'kairos_ai'
      ];
      const customList = this.getAll().filter(a => !coreIds.includes(a.id)).map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        roleConfig: a.roleConfig,
        deskCoord: a.deskCoord,
        currentTask: a.currentTask,
        innerMonologue: a.innerMonologue,
        modelUrl: a.modelUrl || null,
        modelName: a.modelName || null,
      }));
      localStorage.setItem('audira_custom_agents', JSON.stringify(customList));
    } catch (e) {
      console.warn('Failed to save custom agents:', e);
    }
  }

  addAgent(agentData) {
    const id = agentData.id || `agent_${agentData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    
    // Choose appropriate role configuration
    const roleKey = (agentData.role || 'NOC_OPS').toUpperCase();
    const roleConfig = agentData.roleConfig || ROLES[roleKey] || {
      id: id,
      title: agentData.title || `${agentData.name} Specialist`,
      color: agentData.color || '#38bdf8',
      lightColor: agentData.color || '#38bdf8',
      badge: `${agentData.icon || '🤖'} ${roleKey}`,
      bio: agentData.bio || `Operator spesialis ${agentData.role} pada fasilitas data center Tier-III.`
    };

    // Calculate grid desk coordinate
    const agentCount = this.agents.size;
    const deskCoord = agentData.deskCoord || {
      x: 7 + (agentCount % 5) * 2,
      y: 5 + Math.floor(agentCount / 5) * 2
    };

    const newAgent = new Agent({
      id,
      name: agentData.name,
      role: roleKey,
      roleConfig,
      deskCoord
    });

    newAgent.currentTask = agentData.initialTask || 'Bertugas di stasiun kerja konsol';
    newAgent.innerMonologue = agentData.initialThought || 'Memantau kesiapan parameter operasional data center.';
    newAgent.modelUrl = agentData.modelUrl || null;
    newAgent.modelName = agentData.modelName || null;

    this.agents.set(id, newAgent);
    this.saveCustomAgents();
    return newAgent;
  }

  removeAgent(id) {
    const coreIds = ['audira_lead', 'routex_net', 'chronos_ops', 'resolv_desk', 'cipher_soc'];
    if (coreIds.includes(id)) {
      return false; // Prevent removing core squad
    }
    const res = this.agents.delete(id);
    this.saveCustomAgents();
    return res;
  }

  getAll() {
    return Array.from(this.agents.values());
  }

  getById(id) {
    return this.agents.get(id);
  }

  getByRole(role) {
    if (!role) return null;
    const r = role.toUpperCase();
    const roleAliases = {
      CEO: 'DIRECTOR',
      DIRECTOR: 'DIRECTOR',
      PM: 'NETWORK',
      NET: 'NETWORK',
      NETWORK: 'NETWORK',
      DEV: 'NOC_OPS',
      OPS: 'NOC_OPS',
      NOC_OPS: 'NOC_OPS',
      QA: 'HELPDESK',
      DESK: 'HELPDESK',
      HELPDESK: 'HELPDESK',
      DEVOPS: 'CYBER_SOC',
      SOC: 'CYBER_SOC',
      CYBER_SOC: 'CYBER_SOC',
      ELECTRICAL: 'ELECTRICAL',
      MEP: 'ELECTRICAL',
      HVAC: 'HVAC',
      COOLING: 'HVAC',
      SECURITY: 'FIRE_SEC',
      FIRE_SEC: 'FIRE_SEC',
      AI_SENTRY: 'AI_SENTRY'
    };
    const target = roleAliases[r] || r;
    return Array.from(this.agents.values()).find(a => a.role === target || a.role === r);
  }

  updateAll(dt, pathFinder, allowAutonomous = true) {
    for (const agent of this.agents.values()) {
      agent.update(dt, pathFinder, allowAutonomous);
    }
  }
}
