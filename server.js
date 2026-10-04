/**
 * server.js - Node.js WebSocket & HTTP Ingestion Server for Real AI Agents
 * Includes Persistent 3D Asset Upload & Showcase State Engine (Conveyor, Sectors, Agent Skins)
 * Allows external frameworks (CrewAI, LangGraph, AutoGen, custom LLMs) and 3D Asset Studio
 * to stream actions, telemetry, speech, and persist models permanently to disk.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'models', 'uploads');
const SHOWCASE_STATE_FILE = path.join(DATA_DIR, 'showcase_state.json');

// --- Real Host Hardware & OS Telemetry Poller ---
let lastCpuMeasure = { idle: 0, total: 0 };
function getCpuUtilization() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  const idleDiff = idle - lastCpuMeasure.idle;
  const totalDiff = total - lastCpuMeasure.total;
  lastCpuMeasure = { idle, total };
  if (totalDiff <= 0) return 14;
  const usage = Math.round((1 - idleDiff / totalDiff) * 100);
  return Math.min(100, Math.max(1, usage));
}

function getHostTelemetry() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  const cpus = os.cpus();
  const cpuModel = cpus[0]?.model ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'Host Multi-Core CPU';
  const cpuCores = cpus.length;
  const cpuUsage = getCpuUtilization();

  const uptimeSec = Math.floor(os.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const uptimeStr = `${hours}h ${minutes}m`;

  return {
    platform: os.platform(),
    hostname: os.hostname(),
    cpuModel,
    cpuCores,
    cpuPercent: cpuUsage,
    totalMemGB: (totalMem / (1024 ** 3)).toFixed(1),
    usedMemGB: (usedMem / (1024 ** 3)).toFixed(1),
    freeMemGB: (freeMem / (1024 ** 3)).toFixed(1),
    memPercent,
    uptimeSec,
    uptimeStr,
    timestamp: Date.now()
  };
}

// Ensure necessary directories exist on startup
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial state helper
function readShowcaseState() {
  try {
    if (fs.existsSync(SHOWCASE_STATE_FILE)) {
      const raw = fs.readFileSync(SHOWCASE_STATE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Storage] Error reading showcase_state.json:', err.message);
  }
  return {
    conveyor: {},
    sectors: {},
    agentSkins: {},
    lastUpdated: Date.now()
  };
}

function writeShowcaseState(state) {
  try {
    state.lastUpdated = Date.now();
    fs.writeFileSync(SHOWCASE_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error writing showcase_state.json:', err.message);
    return false;
  }
}

const AI_CONFIG_FILE = path.join(DATA_DIR, 'ai_config.json');

function readAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    preferredProvider: 'auto',
    ollamaModel: 'qwen3:8b'
  };
}

function writeAiConfig(cfg) {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

// --- Multi-Service Ecosystem Health Checker ---
let cachedEcosystemHealth = {
  dcos: { status: 'offline', port: 3214, name: 'AUDIRA-DCOS' },
  aiStudio: { status: 'offline', port: 8005, name: 'RTX 3060 3D Worker' },
  ollama: { status: 'offline', port: 11434, name: 'Local Ollama AI', models: [] },
  gemini: { status: 'standby' },
  timestamp: Date.now()
};

async function pingUrl(url, timeoutMs = 1500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    return null;
  }
}

async function checkEcosystemHealth() {
  const cfg = readAiConfig();
  const hasGemini = !!(cfg.geminiApiKey || process.env.GEMINI_API_KEY);

  // 1. Check AUDIRA-DCOS
  const dcosRes = await pingUrl('http://localhost:3214');
  const dcosOk = dcosRes && dcosRes.status < 500;

  // 2. Check AUDIRA 3D AI Studio GPU Worker
  const studioRes = await pingUrl('http://localhost:8005/health');
  let studioData = null;
  if (studioRes && studioRes.ok) {
    try { studioData = await studioRes.json(); } catch (e) {}
  }

  // 3. Check Ollama
  const ollamaRes = await pingUrl('http://localhost:11434/api/tags');
  let ollamaModels = [];
  if (ollamaRes && ollamaRes.ok) {
    try {
      const data = await ollamaRes.json();
      ollamaModels = (data.models || []).map(m => m.name);
    } catch (e) {}
  }

  cachedEcosystemHealth = {
    dcos: {
      status: dcosOk ? 'online' : 'offline',
      port: 3214,
      name: 'AUDIRA Studio Hub (DCOS)'
    },
    aiStudio: {
      status: studioData ? 'online' : 'offline',
      port: 8005,
      name: studioData?.gpu_name || 'NVIDIA RTX 3060 (12GB VRAM)',
      vramFreeMb: studioData?.vram_free_mb || 0,
      triposrActive: !!studioData?.triposr_active
    },
    ollama: {
      status: ollamaModels.length > 0 ? 'online' : 'offline',
      port: 11434,
      name: 'Local Ollama LLM',
      models: ollamaModels
    },
    gemini: {
      status: hasGemini ? 'configured' : 'standby'
    },
    timestamp: Date.now()
  };

  return cachedEcosystemHealth;
}

// Initial health check trigger
checkEcosystemHealth().catch(() => {});

// --- AI Reasoning Personas & Multi-Tier Engine ---
const AGENT_PERSONAS = {
  audira_lead: {
    name: 'Arthur',
    role: 'Studio Director & Executive Producer',
    system: 'You are Arthur, Lead Studio Director & Executive Producer of AUDIRA 3D AI Game Studio. You oversee Three.js engine sprints, 3D GLB asset pipelines, agent task coordination, and gameplay production milestones. Respond authoritatively, professionally, and concisely in Indonesian (1 to 2 sentences max).'
  },
  routex_net: {
    name: 'ROUTEX',
    role: 'Lead Gameplay & Engine Architect',
    system: 'You are ROUTEX, Lead Gameplay & Engine Architect at AUDIRA 3D AI Game Studio. You specialize in Three.js WebGL draw calls, 60 FPS frame pacing, 64Hz multiplayer netcode, and packet prediction. Respond technically, precisely, and concisely in Indonesian (1 to 2 sentences max).'
  },
  chronos_ops: {
    name: 'CHRONOS',
    role: 'Lead Technical Artist & Level Designer',
    system: 'You are CHRONOS, Lead Technical Artist & Level Designer at AUDIRA 3D AI Game Studio. You design modular level biomes, 56m catwalk NavMesh pathfinding, studio dynamic lighting, and occlusion culling. Respond calmly, technically, and concisely in Indonesian (1 to 2 sentences max).'
  },
  cipher_soc: {
    name: 'CIPHER',
    role: 'Lead Audio & Polyphonic Synth Engineer',
    system: 'You are CIPHER, Lead Audio & Polyphonic Synth Engineer at AUDIRA 3D AI Game Studio. You engineer procedural Web Audio synthesis, adaptive dynamic soundtracks, spatial 3D audio, and asset encryption integrity. Respond with high alertness, precision, and concisely in Indonesian (1 to 2 sentences max).'
  },
  voltis_mep: {
    name: 'VOLTIS',
    role: 'Lead 3D Modeler & GLB Asset Specialist',
    system: 'You are VOLTIS, Lead 3D Modeler & GLB Asset Specialist at AUDIRA 3D AI Game Studio. You manage 3D .GLB model imports, low-poly mesh topology, PBR textures, and 3D conveyor runway staging. Respond with 3D modeling precision and concisely in Indonesian (1 to 2 sentences max).'
  },
  resolv_desk: {
    name: 'RESOLV',
    role: 'Lead Narrative & Game Systems Designer',
    system: 'You are RESOLV, Lead Narrative & Game Systems Designer at AUDIRA 3D AI Game Studio. You craft quest branching, NPC dialog trees, combat balancing, and operator sprint triage. Respond helpfully, proactively, and concisely in Indonesian (1 to 2 sentences max).'
  },
  thermo_vfx: {
    name: 'THERMO',
    role: 'Physics & Particle Shader Specialist',
    system: 'You are THERMO, Physics & Particle Shader Specialist at AUDIRA 3D AI Game Studio. You engineer custom GLSL compute shaders, particle systems, fluid simulations, and post-processing bloom. Respond with shader precision and concisely in Indonesian (1 to 2 sentences max).'
  },
  aegis_qa: {
    name: 'AEGIS',
    role: 'Lead QA & Automated Bot Playtester',
    system: 'You are AEGIS, Lead QA & Automated Bot Playtester at AUDIRA 3D AI Game Studio. You conduct automated bot stress testing, collision bounds verification, and ensure zero-crash releases. Respond with high alertness and concisely in Indonesian (1 to 2 sentences max).'
  },
  kairos_ai: {
    name: 'KAIROS',
    role: 'Autonomous AI Game Director',
    system: 'You are KAIROS, Autonomous AI Game Director at AUDIRA 3D AI Game Studio. You govern dynamic difficulty adjustment (DDA), enemy behavior trees, and procedural narrative encounters. Respond with analytical strategic foresight in Indonesian (1 to 2 sentences max).'
  },
  nexus_hud: {
    name: 'NEXUS',
    role: 'Lead UI/UX & Cyber-Retro HUD Designer',
    system: 'You are NEXUS, Lead UI/UX & Cyber-Retro HUD Designer at AUDIRA 3D AI Game Studio. You build tactile dark glassmorphism interfaces, spatial minimaps, and responsive game command layouts. Respond with design aesthetic flair in Indonesian (1 to 2 sentences max).'
  }
};

async function callGeminiAPI(apiKey, systemInstruction, message, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const contents = [];
  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 250
    }
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  clearTimeout(timer);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    text: reply.trim(),
    thought: `Penalaran kognitif diproses melalui Google Gemini 2.0 Flash.`
  };
}

async function callOllamaAPI(systemInstruction, message, history = [], model = 'qwen3:8b') {
  const messages = [
    { role: 'system', content: systemInstruction }
  ];
  for (const h of history.slice(-4)) {
    messages.push({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.text
    });
  }
  messages.push({ role: 'user', content: `${message} (Jawab langsung dalam bahasa Indonesia secara ringkas 1-2 kalimat).` });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        num_predict: 500,
        temperature: 0.6
      }
    }),
    signal: controller.signal
  });
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}`);
  }

  const data = await res.json();
  let content = (data.message?.content || '').trim();
  const thinking = (data.message?.thinking || `Penalaran kognitif dieksekusi dengan model ${model}.`).trim();

  if (!content && thinking) {
    const sentences = thinking.split(/(?<=[.!?\n])\s+/).filter(s => s.trim().length > 10);
    const candidate = sentences.reverse().find(s => !s.toLowerCase().startsWith('okay') && !s.toLowerCase().startsWith('i need') && !s.toLowerCase().startsWith('first'));
    content = candidate ? candidate.replace(/^[\s\n*"-]+/, '').replace(/["-]+$/, '') : 'Seluruh parameter sistem beroperasi dalam ambang batas normal.';
  }

  return {
    text: content.trim(),
    thought: thinking.trim()
  };
}

function fallbackPersona(agentId, agentName, agentRole, query) {
  const q = (query || '').toLowerCase();
  const role = (agentRole || '').toUpperCase();
  const name = (agentName || 'Operator').toLowerCase();

  if (role.includes('DIRECTOR') || name === 'arthur') {
    if (q.includes('status') || q.includes('laporan') || q.includes('sprint') || q.includes('progres')) {
      return {
        text: 'Seluruh workstation studio 3D dan Master Production Wall beroperasi normal. Koordinasi armada developer AI berada pada efisiensi 99.8% dan sprint Alpha on-track.',
        thought: 'Memeriksa integritas pipeline asset 3D .GLB dan load balance stasiun kerja Three.js.'
      };
    }
    return {
      text: 'Menerima transmisi dari HQ. Sebagai Studio Director, saya memastikan seluruh arsitektur spasial Three.js, pipeline asset 3D, dan stabilitas gameplay berada di standar tertinggi.',
      thought: 'Menjaga arahan strategis sprint game dev dan orkestrasi tugas antar operator.'
    };
  }

  if (role.includes('NETWORK') || role.includes('ENGINE') || name === 'routex') {
    return {
      text: 'Frametime terkunci pada 16.6ms (60 FPS stabil). Netcode tickrate 64Hz dan WebSocket link port 8080 sinkron dengan latency sub-millisecond.',
      thought: 'Menganalisis WebGL draw calls, delta compression paket data, dan packet prediction.'
    };
  }

  if (role.includes('LEVEL') || role.includes('ARTIST') || name === 'chronos') {
    return {
      text: 'NavMesh catwalk 56m dan level modular Cyber City selesai dikompilasi. Occlusion culling aktif menjaga draw calls di bawah ambang batas 350.',
      thought: 'Inspeksi dynamic lighting, shadow map resolution, dan navmesh pathfinding agent di aula.'
    };
  }

  if (role.includes('AUDIO') || role.includes('SYNTH') || name === 'cipher') {
    return {
      text: 'Synthesizer audio prosedural stereo aktif tanpa latensi. Enkripsi hash dan integritas payload model .GLB tervalidasi 100% aman.',
      thought: 'Menjaga dynamic music adaptive stems dan memvalidasi checksum payload 3D model.'
    };
  }

  if (role.includes('MODEL') || role.includes('ASSET') || name === 'voltis') {
    return {
      text: 'Topologi polygon 3D mesh .GLB mecha dan props teroptimasi low-poly. PBR material siap ditampilkan di catwalk runway 8 slot.',
      thought: 'Pemeriksaan binding texture atlas PBR, normal maps, dan bounding box auto-centering.'
    };
  }

  if (role.includes('NARRATIVE') || role.includes('GAME') || name === 'resolv') {
    return {
      text: 'Scripting percabangan dialog quest dan sistem combat balancing telah diintegrasikan. Seluruh bug sprint teralokasikan ke pipeline QA.',
      thought: 'Menyusun state machine dialog NPC dan memvalidasi flow gameplay player.'
    };
  }

  if (role.includes('VFX') || role.includes('SHADER') || role.includes('HVAC') || name === 'thermo') {
    return {
      text: 'Compute particle shader terkompilasi optimal. Post-processing bloom dan tonemapping terkunci 60 FPS tanpa thermal throttling.',
      thought: 'Memeriksa buffer alokasi partikel GPU dan presisi floating-point fragment shader.'
    };
  }

  if (role.includes('QA') || role.includes('TEST') || role.includes('FIRE_SEC') || name === 'aegis') {
    return {
      text: 'Automated bot suite mengeksekusi 500 iterasi validasi collision bounds. Hasil audit: 0 crash, 0 desync, build siap rilis.',
      thought: 'Menjalankan stress test physics engine Three.js dan verifikasi garbage collection.'
    };
  }

  if (role.includes('SENTRY') || role.includes('AI DIRECTOR') || name === 'kairos') {
    return {
      text: 'Dynamic Difficulty Adjustment (DDA) aktif memetakan kurva intensitas permainan. Behavior tree musuh beradaptasi dengan taktik pemain.',
      thought: 'Menghitung model pacing gameplay dan transisi event prosedural.'
    };
  }

  if (role.includes('HUD') || role.includes('UI') || role.includes('DATABASE') || name === 'nexus') {
    return {
      text: 'Antarmuka Cyber Dark Glassmorphism terkalibrasi presisi dengan palet HSL. Seluruh drawer dan minimap spasial responsif.',
      thought: 'Audit kontras visual, micro-animation transitions, dan kenyamanan komando operator.'
    };
  }

  return {
    text: `Operator ${agentName || 'AI'} siap mengeksekusi instruksi "${query}". Telemetri lokal standby.`,
    thought: 'Menyesuaikan prioritas komputasi sesuai arahan pusat komando studio 3D.'
  };
}

async function aiReason(agentId, agentName, agentRole, message, history = []) {
  const cfg = readAiConfig();
  const apiKey = cfg.geminiApiKey || process.env.GEMINI_API_KEY;

  const defaultSystem = `You are ${agentName || 'Arthur'}, a specialized AI Operator at AUDIRA 3D AI Game Studio. Role: ${agentRole || 'Studio Director'}. Respond concisely, authoritatively, and technically in Indonesian (1 to 2 sentences max). Focus on 3D game dev, Three.js, GLB assets, and game engine production.`;
  const persona = AGENT_PERSONAS[agentId] || { system: defaultSystem };
  const systemInstruction = persona.system || defaultSystem;

  // 1. Try Gemini if configured
  if (apiKey) {
    try {
      const res = await callGeminiAPI(apiKey, systemInstruction, message, history);
      return { success: true, provider: 'gemini', ...res };
    } catch (err) {
      console.warn('[AI Reason] Gemini API attempt failed, falling back:', err.message);
    }
  }

  // 2. Try Local Ollama
  if (cachedEcosystemHealth.ollama.status === 'online') {
    try {
      const model = cachedEcosystemHealth.ollama.models.includes('qwen3:8b') ? 'qwen3:8b' : (cachedEcosystemHealth.ollama.models[0] || 'qwen3:8b');
      const res = await callOllamaAPI(systemInstruction, message, history, model);
      return { success: true, provider: 'ollama', model, ...res };
    } catch (err) {
      console.warn('[AI Reason] Ollama attempt failed, falling back:', err.message);
    }
  }

  // 3. Fallback to domain persona
  const fallback = fallbackPersona(agentId, agentName, agentRole, message);
  return { success: true, provider: 'persona', ...fallback };
}

async function aiDispatch(promptText, activeAgents = []) {
  const p = (promptText || '').toLowerCase();
  let category = 'GENERAL_STUDIO';
  let primaryName = 'Arthur';
  let secondaryName = 'ROUTEX';
  let directorBrief = `Mandat studio "${promptText}" diterima dan dialokasikan ke spesialis terkait.`;
  let specialistTask = `Pemeriksaan dan mitigasi sistem terkait "${promptText}".`;
  let supportTask = 'Pemantauan dampak sekunder dan sinkronisasi log studio.';

  if (p.includes('grafis') || p.includes('fps') || p.includes('shader') || p.includes('vfx') || p.includes('render') || p.includes('drawcall')) {
    category = '3D_GRAPHICS_ENGINE';
    primaryName = 'ROUTEX';
    secondaryName = 'CHRONOS';
    directorBrief = 'Optimasi pipeline grafis Three.js! Pastikan frametime stabil 60 FPS dan shader terkompilasi.';
    specialistTask = 'Audit WebGL Draw Calls & Shader Uniforms';
    supportTask = 'Monitoring VRAM Buffer Allocation & Occlusion Culling';
  } else if (p.includes('asset') || p.includes('model') || p.includes('glb') || p.includes('runway') || p.includes('catwalk') || p.includes('mecha') || p.includes('pod') || p.includes('slot')) {
    category = '3D_ASSET_PIPELINE';
    primaryName = 'VOLTIS';
    secondaryName = 'Arthur';
    directorBrief = 'Mandat 3D Asset Runway diterima! Validasi skala GLB, topologi polygon, dan penempatan slot pod.';
    specialistTask = 'GLB Mesh Topology & PBR Material Inspection';
    supportTask = 'Catwalk Runway 56m Slot Staging & Auto-Rotation Sync';
  } else if (p.includes('jaringan') || p.includes('network') || p.includes('ping') || p.includes('multiplayer') || p.includes('latency') || p.includes('tickrate') || p.includes('socket')) {
    category = 'NETCODE_MULTIPLAYER';
    primaryName = 'ROUTEX';
    secondaryName = 'CIPHER';
    directorBrief = 'Sinkronisasi netcode multiplayer! Pastikan tickrate 64Hz terkunci dan jitter terkompensasi.';
    specialistTask = 'Tickrate 64Hz State Serialization & Packet Prediction';
    supportTask = 'WebSocket Link Port 8080 Telemetry & Rate-Limiting';
  } else if (p.includes('audio') || p.includes('musik') || p.includes('sound') || p.includes('sfx') || p.includes('synth') || p.includes('suara')) {
    category = 'AUDIO_SYNTHESIS';
    primaryName = 'CIPHER';
    secondaryName = 'RESOLV';
    directorBrief = 'Produksi audio & synth studio! Kalibrasi oscillator polifonik Web Audio dan dynamic stems.';
    specialistTask = 'Polyphonic Stereo Audio Buffer Synthesis';
    supportTask = 'Spatial 3D Sound FX & Event Trigger Binding';
  } else if (p.includes('level') || p.includes('biome') || p.includes('quest') || p.includes('cerita') || p.includes('dialog') || p.includes('gameplay')) {
    category = 'GAMEPLAY_NARRATIVE';
    primaryName = 'RESOLV';
    secondaryName = 'CHRONOS';
    directorBrief = 'Integrasi gameplay & narasi! Selesaikan percabangan questline dan navigasi biome level.';
    specialistTask = 'NPC Dialog Tree & Quest State Machine Scripting';
    supportTask = 'NavMesh Level Pathfinding & Trigger Zone Calibration';
  } else if (p.includes('keamanan') || p.includes('security') || p.includes('anticheat') || p.includes('cheat') || p.includes('exploit') || p.includes('hash')) {
    category = 'SECURITY_INTEGRITY';
    primaryName = 'CIPHER';
    secondaryName = 'ROUTEX';
    directorBrief = 'Protokol keamanan engine! Aktifkan verifikasi hash integritas model 3D dan anti-exploit.';
    specialistTask = 'GLB Asset Signature Verification & Payload Protection';
    supportTask = 'Packet Tamper Detection & Client Validation';
  }

  // Find actual agent objects
  const primaryAgent = activeAgents.find(a => a.name.toLowerCase() === primaryName.toLowerCase()) || activeAgents[0];
  const secondaryAgent = activeAgents.find(a => a.name.toLowerCase() === secondaryName.toLowerCase()) || activeAgents[1] || activeAgents[0];

  return {
    success: true,
    category,
    directorBrief,
    specialistTask,
    supportTask,
    primaryAgent: primaryAgent?.name || primaryName,
    secondaryAgent: secondaryAgent?.name || secondaryName
  };
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = req.url || '/';
  const urlObj = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // 1. Health check
  if (req.method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
    return;
  }

  // 1b. Real Host System Telemetry (Hardware, RAM, CPU, Uptime)
  if (req.method === 'GET' && pathname === '/api/host-metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, telemetry: getHostTelemetry() }));
    return;
  }

  // 1c. Multi-Service Ecosystem Health Status
  if (req.method === 'GET' && pathname === '/api/ecosystem-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ecosystem: cachedEcosystemHealth }));
    return;
  }

  // 1d. AI Engine Status & Models
  if (req.method === 'GET' && pathname === '/api/ai-status') {
    const cfg = readAiConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      geminiConfigured: !!(cfg.geminiApiKey || process.env.GEMINI_API_KEY),
      ollamaOnline: cachedEcosystemHealth.ollama.status === 'online',
      ollamaModels: cachedEcosystemHealth.ollama.models,
      preferredProvider: cfg.preferredProvider
    }));
    return;
  }

  // 1e. Configure AI Engine (Set Gemini API Key or preferred provider)
  if (req.method === 'POST' && pathname === '/api/ai-config') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const cur = readAiConfig();
        if (payload.geminiApiKey !== undefined) cur.geminiApiKey = payload.geminiApiKey.trim();
        if (payload.preferredProvider) cur.preferredProvider = payload.preferredProvider;
        if (payload.ollamaModel) cur.ollamaModel = payload.ollamaModel;
        writeAiConfig(cur);
        checkEcosystemHealth();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, config: { ...cur, geminiApiKey: cur.geminiApiKey ? '***' : '' } }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 1f. Real AI Chat Comm-Link Endpoint (Gemini -> Ollama -> Persona fallback)
  if (req.method === 'POST' && pathname === '/api/ai-chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { agentId, agentName, agentRole, message, history } = payload;
        const result = await aiReason(agentId, agentName, agentRole, message, history || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 1g. Real AI High-Level Command Dispatcher Endpoint
  if (req.method === 'POST' && pathname === '/api/ai-dispatch') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { promptText, activeAgents } = payload;
        const result = await aiDispatch(promptText, activeAgents || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 2. HTTP POST endpoint: /api/agent-event
  if (req.method === 'POST' && pathname === '/api/agent-event') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        broadcast(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, broadcastedTo: wss.clients.size }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. HTTP POST: /api/upload-model (Upload binary 3D .glb / .gltf directly to disk)
  if (req.method === 'POST' && pathname === '/api/upload-model') {
    const rawFilename = urlObj.searchParams.get('filename') || req.headers['x-filename'] || `model_${Date.now()}.glb`;
    // Clean and sanitize filename to prevent directory traversal
    const safeFilename = path.basename(decodeURIComponent(rawFilename)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFilePath = path.join(UPLOADS_DIR, safeFilename);

    const writeStream = fs.createWriteStream(targetFilePath);
    let bytesReceived = 0;

    req.on('data', chunk => {
      bytesReceived += chunk.length;
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log(`[Storage] Uploaded 3D Model: ${safeFilename} (${(bytesReceived / 1024).toFixed(1)} KB)`);
      const publicUrl = `/models/uploads/${safeFilename}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        filename: safeFilename,
        url: publicUrl,
        size: bytesReceived,
        timestamp: Date.now()
      }));
    });

    writeStream.on('error', (err) => {
      console.error('[Storage] Error writing uploaded model:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `File write failed: ${err.message}` }));
    });
    return;
  }

  // 4. HTTP GET: /api/uploaded-models (List all available 3D models on disk)
  if (req.method === 'GET' && pathname === '/api/uploaded-models') {
    try {
      const files = fs.readdirSync(UPLOADS_DIR);
      const models = files
        .filter(f => f.toLowerCase().endsWith('.glb') || f.toLowerCase().endsWith('.gltf'))
        .map(filename => {
          const stats = fs.statSync(path.join(UPLOADS_DIR, filename));
          return {
            filename,
            url: `/models/uploads/${filename}`,
            size: stats.size,
            mtime: stats.mtimeMs
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: models.length, models }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4b. HTTP POST / DELETE: /api/delete-model (Delete a model file from disk & unmount from showcase)
  if ((req.method === 'POST' || req.method === 'DELETE') && pathname === '/api/delete-model') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        let filename = urlObj.searchParams.get('filename');
        if (!filename && body) {
          try { filename = JSON.parse(body).filename; } catch (e) {}
        }
        if (!filename) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Filename parameter is required' }));
          return;
        }

        const safeFilename = path.basename(decodeURIComponent(filename)).replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetFilePath = path.join(UPLOADS_DIR, safeFilename);

        if (fs.existsSync(targetFilePath)) {
          fs.unlinkSync(targetFilePath);
          console.log(`[Storage] Deleted model from disk: ${safeFilename}`);
        }

        // Also clean up any active showcase references
        const modelUrl = `/models/uploads/${safeFilename}`;
        const state = readShowcaseState();
        let stateChanged = false;

        // Clean from conveyor
        if (state.conveyor) {
          for (const [slot, data] of Object.entries(state.conveyor)) {
            if (data?.modelUrl === modelUrl || data?.fileName === safeFilename) {
              delete state.conveyor[slot];
              stateChanged = true;
            }
          }
        }
        // Clean from sectors
        if (state.sectors) {
          for (const [sec, data] of Object.entries(state.sectors)) {
            if (data?.modelUrl === modelUrl || data?.fileName === safeFilename) {
              delete state.sectors[sec];
              stateChanged = true;
            }
          }
        }
        // Clean from agent skins
        if (state.agentSkins) {
          for (const [ag, data] of Object.entries(state.agentSkins)) {
            if (data?.modelUrl === modelUrl || data?.modelName === safeFilename) {
              delete state.agentSkins[ag];
              stateChanged = true;
            }
          }
        }

        if (stateChanged) {
          writeShowcaseState(state);
          broadcast({
            type: 'SHOWCASE_STATE_UPDATED',
            state,
            timestamp: Date.now()
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, deleted: safeFilename, stateUpdated: stateChanged }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Deletion failed: ${err.message}` }));
      }
    });
    return;
  }

  // 5. HTTP GET: /api/showcase-state (Fetch active persistent showcase placement)
  if (req.method === 'GET' && pathname === '/api/showcase-state') {
    const state = readShowcaseState();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, state }));
    return;
  }

  // 6. HTTP POST: /api/showcase-state (Save/update showcase placement)
  if (req.method === 'POST' && pathname === '/api/showcase-state') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const currentState = readShowcaseState();

        if (payload.conveyor) {
          currentState.conveyor = { ...currentState.conveyor, ...payload.conveyor };
        }
        if (payload.sectors) {
          currentState.sectors = { ...currentState.sectors, ...payload.sectors };
        }
        if (payload.agentSkins) {
          currentState.agentSkins = { ...currentState.agentSkins, ...payload.agentSkins };
        }

        writeShowcaseState(currentState);

        // Broadcast updated state to all connected clients
        broadcast({
          type: 'SHOWCASE_STATE_UPDATED',
          state: currentState,
          timestamp: Date.now()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state: currentState }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 7. HTTP POST: /api/clear-showcase (Clear a specific pod, sector, or agent skin)
  if (req.method === 'POST' && pathname === '/api/clear-showcase') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { type, id } = JSON.parse(body || '{}');
        const currentState = readShowcaseState();

        if (type === 'conveyor' && id !== undefined) {
          delete currentState.conveyor[id];
        } else if (type === 'sector' && id !== undefined) {
          delete currentState.sectors[id];
        } else if (type === 'agent' && id !== undefined) {
          delete currentState.agentSkins[id];
        } else if (type === 'all') {
          currentState.conveyor = {};
          currentState.sectors = {};
        }

        writeShowcaseState(currentState);

        broadcast({
          type: 'SHOWCASE_STATE_UPDATED',
          state: currentState,
          timestamp: Date.now()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state: currentState }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 7b. HTTP GET: /api/ecosystem-assets (Scan local studio + AUDIRA-3D-AI-Studio models)
  if (req.method === 'GET' && pathname === '/api/ecosystem-assets') {
    try {
      const results = [];
      const seenFilenames = new Set();

      // 1. Scan Local AUDIRA-AGENT models
      if (fs.existsSync(UPLOADS_DIR)) {
        const localFiles = fs.readdirSync(UPLOADS_DIR);
        for (const file of localFiles) {
          if (file.toLowerCase().endsWith('.glb') || file.toLowerCase().endsWith('.gltf')) {
            const fullPath = path.join(UPLOADS_DIR, file);
            const stats = fs.statSync(fullPath);
            seenFilenames.add(file.toLowerCase());
            results.push({
              filename: file,
              displayName: file.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '').toUpperCase(),
              source: 'AUDIRA Cyber Studio (Local)',
              sourceType: 'local',
              fullPath,
              url: `/models/uploads/${file}`,
              size: stats.size,
              mtime: stats.mtimeMs,
              isImported: true
            });
          }
        }
      }

      // 2. Scan AUDIRA-3D-AI-Studio worker output directories
      const aiStudioDirs = [
        'F:\\AUDIRA-3D-AI-Studio\\apps\\web\\dist\\models',
        'F:\\AUDIRA-3D-AI-Studio\\apps\\api\\apps\\web\\public',
        'F:\\AUDIRA-3D-AI-Studio\\.cache\\tmp'
      ];

      for (const dir of aiStudioDirs) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              if (file.toLowerCase().endsWith('.glb') || file.toLowerCase().endsWith('.gltf')) {
                const fullPath = path.join(dir, file);
                const stats = fs.statSync(fullPath);
                const isImported = seenFilenames.has(file.toLowerCase());
                results.push({
                  filename: file,
                  displayName: file.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '').toUpperCase(),
                  source: 'AUDIRA 3D AI Studio (RTX 3060 Worker)',
                  sourceType: 'ai_studio',
                  fullPath,
                  url: isImported ? `/models/uploads/${file}` : null,
                  size: stats.size,
                  mtime: stats.mtimeMs,
                  isImported
                });
              }
            }
          } catch (e) {}
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: results.length, assets: results }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 7c. HTTP POST: /api/ecosystem-import (Copy 3D AI Studio asset to local repository)
  if (req.method === 'POST' && pathname === '/api/ecosystem-import') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { sourcePath, filename } = payload;
        if (!sourcePath || !fs.existsSync(sourcePath)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Source file does not exist' }));
          return;
        }

        const safeFilename = path.basename(filename || sourcePath).replace(/[^a-zA-Z0-9._-]/g, '_');
        const targetUploadPath = path.join(UPLOADS_DIR, safeFilename);

        fs.copyFileSync(sourcePath, targetUploadPath);

        // Also copy to dist/ if dist folder exists
        const distUploads = path.join(__dirname, 'dist', 'models', 'uploads');
        if (fs.existsSync(distUploads)) {
          fs.copyFileSync(sourcePath, path.join(distUploads, safeFilename));
        }

        console.log(`[Ecosystem Bridge] Imported model: ${safeFilename} from ${sourcePath}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          filename: safeFilename,
          url: `/models/uploads/${safeFilename}`,
          size: fs.statSync(targetUploadPath).size
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 7d. HTTP POST: /api/runway-preset (Apply curated 3D theme layout to showcase)
  if (req.method === 'POST' && pathname === '/api/runway-preset') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const presetName = payload.preset || 'mecha_expo';
        const state = readShowcaseState();

        if (presetName === 'clear_standby') {
          state.conveyor = {};
        } else if (presetName === 'mecha_expo') {
          state.conveyor = {
            0: { modelUrl: '/models/uploads/gundam_3d_model.glb', fileName: 'gundam_3d_model.glb', title: '✦ [ SLOT 01 ] GUNDAM PRIME', sub: '[ MECHA EXPO ]', targetHeight: 3.2, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
            1: { modelUrl: '/models/uploads/gundam_3d_model_2_.glb', fileName: 'gundam_3d_model_2_.glb', title: '✦ [ SLOT 02 ] GUNDAM STRIKE', sub: '[ MECHA EXPO ]', targetHeight: 3.2, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
            2: { modelUrl: '/models/uploads/mecha_robot_3d_model_Clone1.glb', fileName: 'mecha_robot_3d_model_Clone1.glb', title: '✦ [ SLOT 03 ] TITAN MECHA', sub: '[ MECHA EXPO ]', targetHeight: 3.0, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
            3: { modelUrl: '/models/uploads/red_mech_robot_3d_model.glb', fileName: 'red_mech_robot_3d_model.glb', title: '✦ [ SLOT 04 ] RED APEX MECH', sub: '[ MECHA EXPO ]', targetHeight: 3.4, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
          };
        } else if (presetName === 'fantasy_warlords') {
          state.conveyor = {
            ...state.conveyor,
            4: { modelUrl: '/models/uploads/fantasy_armored_warlord_3d_model.glb', fileName: 'fantasy_armored_warlord_3d_model.glb', title: '✦ [ SLOT 05 ] ARMORED WARLORD', sub: '[ WARLORD EXPO ]', targetHeight: 3.0, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
            5: { modelUrl: '/models/uploads/robot_dragon_3d_model.glb', fileName: 'robot_dragon_3d_model.glb', title: '✦ [ SLOT 06 ] CYBER DRAGON', sub: '[ BEAST EXPO ]', targetHeight: 3.5, shadingMode: 'pbr', animSpeed: 1.0, timestamp: Date.now() },
          };
        }

        writeShowcaseState(state);
        broadcast({
          type: 'SHOWCASE_STATE_UPDATED',
          state,
          preset: presetName,
          timestamp: Date.now()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, preset: presetName, state }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 8. Static file serving for /models/...
  if ((req.method === 'GET' || req.method === 'HEAD') && pathname.startsWith('/models/')) {
    const cleanPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, 'public', cleanPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.glb' ? 'model/gltf-binary' : ext === '.gltf' ? 'model/gltf+json' : 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'public, max-age=3600'
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404);
  res.end('Not Found');
});

// Setup WebSocket Server
const wss = new WebSocketServer({ server });

function broadcast(data) {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log(`[WebSocket] Browser client connected. Total clients: ${wss.clients.size}`);

  // Send initial welcome with current persistent showcase state & real host telemetry
  const state = readShowcaseState();
  const telemetry = getHostTelemetry();
  ws.send(JSON.stringify({
    type: 'WELCOME_SYNC',
    role: 'PM',
    action: 'idle',
    speech: 'Connected to external AI Agent stream server!',
    task: 'Listening for live events',
    showcaseState: state,
    hostTelemetry: telemetry,
    ecosystemHealth: cachedEcosystemHealth
  }));

  ws.send(JSON.stringify({
    type: 'HOST_METRICS_UPDATE',
    telemetry,
    timestamp: Date.now()
  }));

  ws.send(JSON.stringify({
    type: 'ECOSYSTEM_HEALTH_UPDATE',
    ecosystem: cachedEcosystemHealth,
    timestamp: Date.now()
  }));

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected. Total clients: ${wss.clients.size}`);
  });
});

// Periodic real-time host hardware telemetry broadcast every 2.5 seconds
setInterval(() => {
  if (wss.clients.size > 0) {
    const telemetry = getHostTelemetry();
    broadcast({
      type: 'HOST_METRICS_UPDATE',
      telemetry,
      timestamp: Date.now()
    });
  }
}, 2500);

// Periodic multi-service ecosystem health check every 4.5 seconds
setInterval(async () => {
  try {
    await checkEcosystemHealth();
    if (wss.clients.size > 0) {
      broadcast({
        type: 'ECOSYSTEM_HEALTH_UPDATE',
        ecosystem: cachedEcosystemHealth,
        timestamp: Date.now()
      });
    }
  } catch (e) {}
}, 4500);

server.listen(PORT, () => {
  console.log(`
======================================================
🏢 Audira Office Agent Bridge & 3D Storage Running
======================================================
- HTTP Endpoint   : http://localhost:${PORT}/api/agent-event
- Model Upload API: http://localhost:${PORT}/api/upload-model
- Showcase State  : http://localhost:${PORT}/api/showcase-state
- Uploaded Models : http://localhost:${PORT}/api/uploaded-models
- WebSocket       : ws://localhost:${PORT}
- Health Check    : http://localhost:${PORT}/health

Permanent 3D Model Storage: public/models/uploads/
State Registry File: data/showcase_state.json
======================================================
  `);
});
