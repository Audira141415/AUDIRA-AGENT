/**
 * Constants & Configuration for Partitioned Corporate Office AI Visualizer
 */

export const TILE_WIDTH = 56;
export const TILE_HEIGHT = 28;
export const MAP_COLS = 20;
export const MAP_ROWS = 20;

// Corporate Office Roles (Hierarchy: Direktur -> Manager -> Engineer/QA/Ops)
// AUDIRA-DCOS NOC Command Center Roles
export const ROLES = {
  DIRECTOR: {
    id: 'director',
    title: 'Studio Director & Executive Producer',
    defaultName: 'Arthur',
    color: '#eab308', // Executive Gold
    lightColor: '#fde047',
    badge: '👑 DIRECTOR',
    gundamUnit: '🤖 SD G-01 COMMANDER ARTHUR (Studio Lead)',
    avatarHair: '#78716c',
    avatarSuit: '#ca8a04',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(234, 179, 8, 0.4)',
    bio: 'Pimpinan Eksekutif Studio Game. Memegang komando milestone sprint, review build Three.js, dan keputusan arsitektur game.'
  },
  NETWORK: {
    id: 'network',
    title: 'Lead Gameplay & Engine Architect',
    defaultName: 'ROUTEX',
    color: '#06b6d4', // Cyan
    lightColor: '#67e8f9',
    badge: '⚙️ ENGINE ARCH',
    gundamUnit: '🤖 SD G-02 HIGH-SPEED ROUTEX (Engine Core)',
    avatarHair: '#334155',
    avatarSuit: '#0891b2',
    avatarSkin: '#fcd34d',
    deskLight: 'rgba(6, 182, 212, 0.4)',
    bio: 'Arsitek engine 3D Three.js & multiplayer netcode. Mengoptimalkan WebGL draw calls, tickrate 64Hz, dan frametime 60 FPS.'
  },
  NOC_OPS: {
    id: 'noc_ops',
    title: 'Lead Technical Artist & Level Designer',
    defaultName: 'CHRONOS',
    color: '#f59e0b', // Amber
    lightColor: '#fbbf24',
    badge: '🗺️ LEVEL DESIGN',
    gundamUnit: '🤖 SD G-03 MASTER CHRONOS (World Builder)',
    avatarHair: '#475569',
    avatarSuit: '#d97706',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(245, 158, 11, 0.4)',
    bio: 'Penyusun biome level modular, navmesh pathfinding, dynamic lighting, dan occlusion culling aula komando.'
  },
  HELPDESK: {
    id: 'helpdesk',
    title: 'Lead Narrative & Game Designer',
    defaultName: 'RESOLV',
    color: '#3b82f6', // Blue
    lightColor: '#60a5fa',
    badge: '📜 NARRATIVE',
    gundamUnit: '🤖 SD RX-78 RESOLV (Narrative Engine)',
    avatarHair: '#1e293b',
    avatarSuit: '#2563eb',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(59, 130, 246, 0.4)',
    bio: 'Perancang sistem quest, percabangan dialog NPC, balancing combat stats, dan interaksi pemain.'
  },
  CYBER_SOC: {
    id: 'cyber_soc',
    title: 'Lead Audio & Polyphonic Synth Engineer',
    defaultName: 'CIPHER',
    color: '#a855f7', // Violet
    lightColor: '#c084fc',
    badge: '🎵 AUDIO SYNTH',
    gundamUnit: '🤖 SD G-05 BANSHEE CIPHER (Audio Synth)',
    avatarHair: '#0f172a',
    avatarSuit: '#7c3aed',
    avatarSkin: '#fde68a',
    deskLight: 'rgba(168, 85, 247, 0.4)',
    bio: 'Perancang audio prosedural Web Audio, adaptive dynamic soundtrack, sound effects taktil, dan spatial 3D audio.'
  },
  ELECTRICAL: {
    id: 'electrical',
    title: 'Lead 3D Modeler & GLB Asset Specialist',
    defaultName: 'VOLTIS',
    color: '#10b981', // Emerald
    lightColor: '#6ee7b7',
    badge: '📦 3D ASSETS',
    gundamUnit: '🤖 SD G-06 DYNAMIS VOLTIS (3D Asset Rig)',
    avatarHair: '#1e293b',
    avatarSuit: '#059669',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(16, 185, 129, 0.4)',
    bio: 'Spesialis modeling 3D .GLB, rigging karakter mecha, topologi polygon rendah (low-poly), dan optimasi texture atlas.'
  },
  HVAC: {
    id: 'hvac',
    title: 'Physics & Particle Shader Specialist',
    defaultName: 'THERMO',
    color: '#0284c7', // Sky Blue
    lightColor: '#38bdf8',
    badge: '✨ VFX SHADER',
    gundamUnit: '🤖 SD G-07 FROST THERMO (VFX Shader)',
    avatarHair: '#334155',
    avatarSuit: '#0369a1',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(2, 132, 199, 0.4)',
    bio: 'Spesialis custom GLSL/HLSL compute shaders, particle effects, simulasi air & proyektil, dan post-processing bloom.'
  },
  FIRE_SEC: {
    id: 'fire_sec',
    title: 'Lead QA & Automated Bot Playtester',
    defaultName: 'AEGIS',
    color: '#f43f5e', // Rose
    lightColor: '#fda4af',
    badge: '🧪 QA TESTER',
    gundamUnit: '🤖 SD G-08 AEGIS FORTRESS (QA Playtester)',
    avatarHair: '#0f172a',
    avatarSuit: '#e11d48',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(244, 63, 94, 0.4)',
    bio: 'Spesialis automated bot testing, collision detection audit, stress-testing entity, dan verifikasi zero-crash release.'
  },
  AI_SENTRY: {
    id: 'ai_sentry',
    title: 'Autonomous AI Game Director',
    defaultName: 'KAIROS',
    color: '#d946ef', // Fuchsia
    lightColor: '#f0abfc',
    badge: '🤖 AI DIRECTOR',
    gundamUnit: '🤖 SD G-09 NEURAL KAIROS (AI Director)',
    avatarHair: '#3b0764',
    avatarSuit: '#c026d3',
    avatarSkin: '#fae8ff',
    deskLight: 'rgba(217, 70, 239, 0.4)',
    bio: 'Agen AI otonom pengatur dynamic difficulty adjustment (DDA), behavior tree musuh, dan generasi quest prosedural.'
  },
  DATABASE: {
    id: 'database',
    title: 'Lead UI/UX & Cyber-Retro HUD Designer',
    defaultName: 'NEXUS',
    color: '#6366f1', // Indigo
    lightColor: '#a5b4fc',
    badge: '🎮 HUD & UI',
    gundamUnit: '🤖 SD G-10 TITAN NEXUS (HUD & UI Core)',
    avatarHair: '#1e1b4b',
    avatarSuit: '#4f46e5',
    avatarSkin: '#fed7aa',
    deskLight: 'rgba(99, 102, 241, 0.4)',
    bio: 'Spesialis antarmuka pengguna tactile retro-cyber, CSS glassmorphism, minimap spasial, dan inventory layout.'
  }
};

// Agent Action States
export const AGENT_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  THINKING: 'thinking',
  CODING: 'coding',
  TESTING: 'testing',
  DEPLOYING: 'deploying',
  DISCUSSING: 'discussing',
  COFFEE: 'coffee',
  RESTING: 'resting',
  ERROR: 'error',
  SUCCESS: 'success'
};

// 4-Way Character Sprites
export const DIRECTIONS = {
  SOUTH_EAST: 'se',
  SOUTH_WEST: 'sw',
  NORTH_EAST: 'ne',
  NORTH_WEST: 'nw'
};

// Lighting Modes
export const LIGHTING_MODES = {
  DAY: { id: 'day', label: '☀️ Daylight Studio' },
  SUNSET: { id: 'sunset', label: '🌅 Golden Hour' },
  NIGHT: { id: 'night', label: '🌙 Cyberpunk Night' }
};

// Corporate Office Room Zones & Doorways (Tile Coordinates: x, y)
export const OFFICE_ZONES = {
  // 1. Ruang Direktur / CEO Executive Suite (X: 1..6, Y: 1..6)
  CEO_DESK: { x: 3, y: 3, label: 'Meja Direktur Utama', targetWalk: { x: 4, y: 4 } },
  CEO_LOUNGE: { x: 2, y: 5, label: 'Sofa Eksekutif Direktur', targetWalk: { x: 3, y: 5 } },
  CEO_DOOR: { x: 6, y: 4, label: 'Pintu Ruang Direktur' },

  // 2. Ruang Manager / PM Private Office (X: 7..12, Y: 1..6)
  MANAGER_DESK: { x: 9, y: 3, label: 'Meja Manager', targetWalk: { x: 10, y: 4 } },
  MANAGER_BOARD: { x: 8, y: 1, label: 'Whiteboard Manager', targetWalk: { x: 8, y: 2 } },
  MANAGER_DOOR: { x: 10, y: 6, label: 'Pintu Ruang Manager' },

  // 3. Ruang Rapat / Boardroom (X: 13..18, Y: 1..6)
  BOARDROOM_TABLE: { x: 16, y: 3, label: 'Meja Konferensi Boardroom', targetWalk: { x: 16, y: 4 } },
  BOARDROOM_DOOR: { x: 14, y: 6, label: 'Pintu Boardroom' },

  // 4. Engineering Bullpen & Cubicles (X: 8..14, Y: 10..18)
  DEV_CUBICLE: { x: 9, y: 13, label: 'Kubikel Dev (Bob)', targetWalk: { x: 10, y: 13 } },
  QA_CUBICLE: { x: 13, y: 13, label: 'Kubikel QA (Chloe)', targetWalk: { x: 12, y: 13 } },

  // 5. Ruang Server / Datacenter Terisolasi (X: 15..19, Y: 10..18)
  SERVER_ROOM: { x: 17, y: 13, label: 'Ruang Server Datacenter', targetWalk: { x: 16, y: 12 } },
  SERVER_DOOR: { x: 15, y: 11, label: 'Pintu Ruang Server' },

  // 6. Pantry & Breakroom (X: 1..7, Y: 10..18)
  COFFEE_MACHINE: { x: 3, y: 16, label: 'Espresso Bar', targetWalk: { x: 4, y: 16 } },
  WATER_COOLER: { x: 1, y: 15, label: 'Water Dispenser', targetWalk: { x: 2, y: 15 } },
  PANTRY_SOFA: { x: 4, y: 13, label: 'Sofa Santai Pantry', targetWalk: { x: 4, y: 12 } },

  // 7. Koridor Tengah
  CORRIDOR_CENTER: { x: 10, y: 8, label: 'Koridor Utama', targetWalk: { x: 10, y: 8 } }
};

// Tile Types
export const TILE_TYPES = {
  FLOOR_WOOD: 1,
  FLOOR_DARK: 2,
  FLOOR_CARPET_EXECUTIVE: 3, // Karpet mewah ruang bos
  FLOOR_CARPET_BOARDROOM: 4, // Karpet ruang rapat
  FLOOR_SERVER: 5,           // Lantai anti-static ruang server
  FLOOR_PANTRY: 6,           // Keramik pantry
  WALL_NORTH: 10,
  WALL_WEST: 11,
  WINDOW_SKYLINE: 12,
  GLASS_PARTITION_H: 13,     // Sekat Kaca Horizontal
  GLASS_PARTITION_V: 14,     // Sekat Kaca Vertikal
  DOORWAY_ARCH: 15           // Bukaan Pintu Ruangan
};

// Furniture / Object Types
export const OBJ_TYPES = {
  DESK_CEO: 100,             // Meja kayu mahogani mewah Direktur
  DESK_MANAGER: 101,         // Meja Manager
  DESK_DEV_CUBICLE: 102,     // Kubikel Dev bersekat
  DESK_QA_CUBICLE: 103,      // Kubikel QA bersekat
  SERVER_RACK: 105,
  WHITEBOARD: 106,
  COFFEE_BAR: 107,
  WATER_COOLER: 108,
  SOFA_EXECUTIVE: 109,
  SOFA_PANTRY: 110,
  PLANT: 111,
  MEETING_TABLE: 112,
  BOOKSHELF_EXECUTIVE: 113,
  WATER_DISPENSER: 114
};
