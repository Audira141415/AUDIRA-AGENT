/**
 * avatar.ts - Procedural 3D Chibi Gundam (SD Gundam) Avatar Rig for AUDIRA-AGENT
 *
 * Implements a 100% Three.js procedural Super Deformed (SD) Chibi Gundam Mobile Suit rig:
 * - Iconic V-Fin antennas (4-blade gold/accent crest)
 * - Angled glowing twin optics / Gundam eyes & sensor cameras
 * - Faceplate with classic dual panel-line intake vents & red chin piece
 * - Mobile suit cockpit hatch, collar armor & dual chest air intake grilles
 * - High-mobility thruster backpack with dual vernier rocket exhaust nozzles & beam saber hilts
 * - Articulated shoulder pauldrons, gauntlets, and left-arm SD Gundam defense shield
 * - Right-arm integrated Beam Carbine / Studio Diagnostic Multi-Tool
 * - Armored waist with front & side skirt armor
 * - Flared calf armor, knee guards, and chunky red-soled SD Gundam boots
 * - Custom Mobile Suit classifications & color themes per Studio AI Agent (Arthur, ROUTEX, CHRONOS, RESOLV, CIPHER, etc.)
 *
 * Preserves the exact kinematic hierarchy and heights so all animations
 * (walking, desk typing, meetings, sitting, idle) work 100% seamlessly!
 */

import * as THREE from 'three'
import { ROLE_COLORS } from './layout'
import type { AgentRole, Agent } from './types'

export type Limb = {
  shoulder: THREE.Object3D
  elbow: THREE.Object3D
}

export interface DetectedLimbs {
  leftLeg?: THREE.Object3D
  rightLeg?: THREE.Object3D
  leftKnee?: THREE.Object3D
  rightKnee?: THREE.Object3D
  leftArm?: THREE.Object3D
  rightArm?: THREE.Object3D
  spine?: THREE.Object3D
  head?: THREE.Object3D
}

export type Avatar = {
  group: THREE.Group
  chest: THREE.Object3D
  neck: THREE.Object3D
  head: THREE.Object3D
  hips: THREE.Object3D
  arms: [Limb, Limb]
  legs: [Limb, Limb]
  badge: THREE.Mesh
  glbModel?: THREE.Group
  glbMixer?: THREE.AnimationMixer
  glbClips?: THREE.AnimationClip[]
  glbActions?: Map<string, THREE.AnimationAction>
  glbLimbs?: DetectedLimbs
  glbWalkAction?: THREE.AnimationAction
  glbIdleAction?: THREE.AnimationAction
  glbLocomotionMode?: 'mecha_stride' | 'mecha_hover' | 'auto'
  isGLB?: boolean
}

/* ------------------------------------------------------------ Kinematic Proportions -- */
// Preserved exact hip, thigh, and shin lengths to ensure desk chair & floor alignment
export const HIP_STAND = 0.98
export const HIP_X = 0.13
export const THIGH = 0.48
export const SHIN = 0.46

const TORSO_H = 0.54
const CHEST_Y = TORSO_H // Chest group pivots on top of torso
const SHOULDER_Y = 0.12
const SHOULDER_X = 0.28
const UPPER_ARM = 0.30
const FOREARM = 0.28

/* ------------------------------------------------------------ Mobile Suit Themes -- */
export type GundamTheme = {
  name: string
  classification: string
  primaryArmor: number    // Main body plates (White, Alloy, or Obsidian)
  secondaryArmor: number  // Role accent plates (Chest, shoulders, shield)
  frameColor: number      // Inner frame & mechanical joints (Gunmetal/Titanium)
  cockpitColor: number    // Center chest cockpit hatch & chin goatee
  ventColor: number       // Chest air intake vents (Yellow/Gold/Cyan)
  eyeColor: number        // Glowing optic eyes & camera sensors
  vFinColor: number       // Horns / antenna (Gold, White, or Accent)
  shieldColor: number     // Forearm shield main color
}

const THEMES: Record<string, GundamTheme> = {
  // Arthur - Managing Director & Executive NOC Lead
  arthur: {
    name: 'Arthur',
    classification: 'G-01 COMMANDER ARTHUR (EXECUTIVE TYPE)',
    primaryArmor: 0xf8fafc,   // Pure Pearl White
    secondaryArmor: 0xeab308, // Executive Gold
    frameColor: 0x334155,     // Titanium Grey
    cockpitColor: 0xd92d20,   // Crimson Red
    ventColor: 0xfbbf24,      // Gold Vents
    eyeColor: 0x00f5ff,       // Radiant Cyan Glow
    vFinColor: 0xffd700,      // Imperial Gold V-Fin
    shieldColor: 0xeab308,
  },
  // ROUTEX - Lead Network & BGP Routing Architect
  routex: {
    name: 'ROUTEX',
    classification: 'G-02 NETWORK ROUTEX (HIGH-MOBILITY TYPE)',
    primaryArmor: 0xf1f5f9,   // Light Alloy White
    secondaryArmor: 0x06b6d4, // Electric Cyan
    frameColor: 0x0f172a,     // Midnight Navy Frame
    cockpitColor: 0x0284c7,   // Cobalt Blue
    ventColor: 0x38bdf8,      // Ice Cyan
    eyeColor: 0x38bdf8,       // Neon Cyan Glow
    vFinColor: 0xffffff,      // Alloy White V-Fin
    shieldColor: 0x0891b2,
  },
  // CHRONOS - Lead Duty Operations & Shift Dispatcher
  chronos: {
    name: 'CHRONOS',
    classification: 'G-03 OPS CHRONOS (HEAVY DUTY SUPERVISOR)',
    primaryArmor: 0x475569,   // Gunmetal Grey
    secondaryArmor: 0xf59e0b, // Hazard Amber
    frameColor: 0x1e293b,     // Dark Graphite
    cockpitColor: 0xd97706,   // Deep Amber Red
    ventColor: 0xfbbf24,      // Amber Gold
    eyeColor: 0xfbbf24,       // Glowing Amber Eyes
    vFinColor: 0xf59e0b,      // Amber Gold V-Fin
    shieldColor: 0xd97706,
  },
  // RESOLV - ITIL Service Desk & Helpdesk Lead
  resolv: {
    name: 'RESOLV',
    classification: 'RX-78 RESOLV (SERVICE DESK PROTOTYPE)',
    primaryArmor: 0xffffff,   // Classic Gundam White
    secondaryArmor: 0x2563eb, // Federation Cobalt Blue
    frameColor: 0x334155,     // Inner Frame Grey
    cockpitColor: 0xef4444,   // Classic Core Red
    ventColor: 0xeab308,      // Classic Yellow Intake Vents
    eyeColor: 0x22c55e,       // Classic Emerald Green Eyes
    vFinColor: 0xfacc15,      // Classic Gold V-Fin
    shieldColor: 0xef4444,    // Classic Red Shield
  },
  // CIPHER - Senior Cyber SOC Analyst & Threat Hunter
  cipher: {
    name: 'CIPHER',
    classification: 'G-05 BANSHEE CIPHER (CYBER SOC STEALTH TYPE)',
    primaryArmor: 0x090d16,   // Obsidian Black
    secondaryArmor: 0x8b5cf6, // Cyber Violet
    frameColor: 0x1e1b4b,     // Deep Indigo
    cockpitColor: 0x6d28d9,   // Royal Violet
    ventColor: 0xc084fc,      // Neon Violet
    eyeColor: 0xd946ef,       // Psycoframe Magenta
    vFinColor: 0xf59e0b,      // Golden Banshee Horns
    shieldColor: 0x4c1d95,
  },
  // VOLTIS - MEP Power & Electrical Engineer
  voltis: {
    name: 'VOLTIS',
    classification: 'G-06 DYNAMIS VOLTIS (MEP POWER GRID TYPE)',
    primaryArmor: 0xf1f5f9,   // Alloy White
    secondaryArmor: 0x10b981, // Emerald Green
    frameColor: 0x1e293b,     // Graphite
    cockpitColor: 0x059669,   // Deep Emerald
    ventColor: 0x34d399,      // Electric Lime
    eyeColor: 0x4ade80,       // High-Voltage Green
    vFinColor: 0xffffff,      // Bright White V-Fin
    shieldColor: 0x059669,
  },
  // THERMO - HVAC Cooling Specialist
  thermo: {
    name: 'THERMO',
    classification: 'G-07 FROST THERMO (CRAC CRYO COOLING TYPE)',
    primaryArmor: 0xffffff,   // Glacier White
    secondaryArmor: 0x0284c7, // Sky Frost Blue
    frameColor: 0x334155,     // Chilled Steel
    cockpitColor: 0x0369a1,   // Frost Navy
    ventColor: 0x38bdf8,      // Ice Blue
    eyeColor: 0x67e8f9,       // Sub-Zero Cyan
    vFinColor: 0xe0f2fe,      // Silver White V-Fin
    shieldColor: 0x0284c7,
  },
  // AEGIS - Physical Security & Access Officer
  aegis: {
    name: 'AEGIS',
    classification: 'G-08 AEGIS FORTRESS (PHYSICAL SECURITY TYPE)',
    primaryArmor: 0x18181b,   // Carbon Black
    secondaryArmor: 0xf43f5e, // Crimson Rose
    frameColor: 0x27272a,     // Reinforced Steel
    cockpitColor: 0xe11d48,   // Ruby Core
    ventColor: 0xfbbf24,      // Gold Vents
    eyeColor: 0xf43f5e,       // Security Ruby
    vFinColor: 0xfbbf24,      // Gold Fortress Crest
    shieldColor: 0xe11d48,
  },
  // KAIROS - Autonomous AI Telemetry Sentry
  kairos: {
    name: 'KAIROS',
    classification: 'G-09 NEURAL KAIROS (AI SENTRY SENTINEL)',
    primaryArmor: 0xfdf4ff,   // Pearlescent White
    secondaryArmor: 0xd946ef, // Neural Magenta
    frameColor: 0x3b0764,     // Deep Magenta Frame
    cockpitColor: 0xc026d3,   // Fuchsia Core
    ventColor: 0xf0abfc,      // Light Magenta
    eyeColor: 0xf472b6,       // Neural Pulse Pink
    vFinColor: 0xffffff,      // White & Magenta V-Fin
    shieldColor: 0xc026d3,
  },
  // NEXUS - Lead Database & SAN Storage Architect
  nexus: {
    name: 'NEXUS',
    classification: 'G-10 TITAN NEXUS (SAN STORAGE CORE)',
    primaryArmor: 0xf1f5f9,   // Alloy White
    secondaryArmor: 0x6366f1, // Indigo Blue
    frameColor: 0x1e293b,     // Dark Graphite
    cockpitColor: 0x4f46e5,   // Deep Indigo
    ventColor: 0x818cf8,      // Neon Cyan/Indigo
    eyeColor: 0x818cf8,       // Glowing Indigo
    vFinColor: 0xf59e0b,      // Gold Crest
    shieldColor: 0x4f46e5,
  },
}

function resolveGundamTheme(
  role: AgentRole | string,
  name?: string,
  agentData?: Partial<Agent>,
): GundamTheme {
  const normName = (name || '').toLowerCase()
  const normRole = String(role || '').toLowerCase()

  // Match by name first
  if (normName.includes('arthur') || normName.includes('audira')) return THEMES.arthur
  if (normName.includes('routex')) return THEMES.routex
  if (normName.includes('chronos')) return THEMES.chronos
  if (normName.includes('resolv')) return THEMES.resolv
  if (normName.includes('cipher')) return THEMES.cipher
  if (normName.includes('voltis')) return THEMES.voltis
  if (normName.includes('thermo')) return THEMES.thermo
  if (normName.includes('aegis')) return THEMES.aegis
  if (normName.includes('kairos')) return THEMES.kairos
  if (normName.includes('nexus')) return THEMES.nexus

  // Match by role
  if (normRole === 'ceo' || normRole === 'director') return THEMES.arthur
  if (normRole === 'backend' || normRole === 'network') return THEMES.routex
  if (normRole === 'orchestrator' || normRole === 'noc_ops') return THEMES.chronos
  if (normRole === 'frontend' || normRole === 'helpdesk') return THEMES.resolv
  if (normRole === 'qa' || normRole === 'cyber_soc') return THEMES.cipher
  if (normRole === 'devops' || normRole === 'electrical') return THEMES.voltis
  if (normRole === 'hvac') return THEMES.thermo
  if (normRole === 'fire_sec' || normRole === 'security') return THEMES.aegis
  if (normRole === 'ai_sentry') return THEMES.kairos
  if (normRole === 'database' || normRole === 'san') return THEMES.nexus

  // Procedural custom theme
  const customHex = agentData?.color ? parseInt(agentData.color.replace('#', ''), 16) : null
  const fallbackColor = customHex ?? (ROLE_COLORS[normRole] ?? 0x38bdf8)

  return {
    name: name || 'Gundam Agent',
    classification: `SD-CUSTOM GUNDAM (${String(role).toUpperCase()})`,
    primaryArmor: 0xf8fafc,
    secondaryArmor: fallbackColor,
    frameColor: 0x334155,
    cockpitColor: 0xd92d20,
    ventColor: 0xf59e0b,
    eyeColor: fallbackColor,
    vFinColor: 0xffd700,
    shieldColor: fallbackColor,
  }
}

/* ------------------------------------------------------------ Main Builder -- */
export function buildAvatar(
  role: AgentRole | string,
  name?: string,
  agentData?: Partial<Agent>,
): Avatar {
  const theme = resolveGundamTheme(role, name, agentData)
  const group = new THREE.Group()

  // Materials
  const matPrimary = new THREE.MeshStandardMaterial({
    color: theme.primaryArmor,
    roughness: 0.32,
    metalness: 0.28,
  })
  const matSecondary = new THREE.MeshStandardMaterial({
    color: theme.secondaryArmor,
    roughness: 0.35,
    metalness: 0.35,
  })
  const matFrame = new THREE.MeshStandardMaterial({
    color: theme.frameColor,
    roughness: 0.55,
    metalness: 0.7,
  })
  const matCockpit = new THREE.MeshStandardMaterial({
    color: theme.cockpitColor,
    roughness: 0.35,
    metalness: 0.25,
  })
  const matVent = new THREE.MeshStandardMaterial({
    color: theme.ventColor,
    roughness: 0.3,
    metalness: 0.4,
  })
  const matVFin = new THREE.MeshStandardMaterial({
    color: theme.vFinColor,
    roughness: 0.2,
    metalness: 0.82,
  })
  const matEyes = new THREE.MeshStandardMaterial({
    color: theme.eyeColor,
    emissive: theme.eyeColor,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  })
  const matHeadCamera = new THREE.MeshStandardMaterial({
    color: 0x00f5ff,
    emissive: 0x00f5ff,
    emissiveIntensity: 1.6,
    roughness: 0.1,
  })
  const matRearCamera = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.4,
    roughness: 0.1,
  })
  const matThruster = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  })
  const matBlack = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.8,
    metalness: 0.2,
  })

  // =========================================================================
  // 1. HIPS & WAIST UNIT (Centered at HIP_STAND = 0.98)
  // =========================================================================
  const hips = new THREE.Group()
  hips.position.y = HIP_STAND
  group.add(hips)

  // Center Crotch Block (with classic V chevron)
  const crotch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.15), matPrimary)
  crotch.position.set(0, -0.06, 0.08)
  hips.add(crotch)

  const crotchV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), matVent)
  crotchV.position.set(0, -0.05, 0.16)
  hips.add(crotchV)

  // Front Skirt Armor Plates (Left & Right)
  for (const side of [-1, 1]) {
    const frontSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.04), matPrimary)
    frontSkirt.position.set(side * 0.1, -0.08, 0.14)
    frontSkirt.rotation.set(-0.16, side * 0.12, 0)
    hips.add(frontSkirt)

    // Side Skirt Boxes (Thigh Hip Armor)
    const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.16), matSecondary)
    sideSkirt.position.set(side * 0.21, -0.08, 0)
    hips.add(sideSkirt)
  }

  // Rear Skirt Armor Plate
  const rearSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.04), matPrimary)
  rearSkirt.position.set(0, -0.08, -0.14)
  rearSkirt.rotation.x = 0.16
  hips.add(rearSkirt)

  // =========================================================================
  // 2. LEGS & CHUNKY SD GUNDAM BOOTS
  // =========================================================================
  const makeLeg = (side: number): Limb => {
    const hipJoint = new THREE.Group()
    hipJoint.position.set(side * HIP_X, 0, 0)
    hips.add(hipJoint)

    // Armored Thigh
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, THIGH, 0.16), matPrimary)
    thigh.position.y = -THIGH / 2
    hipJoint.add(thigh)

    // Inner mechanical thigh cylinder
    const thighCore = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, THIGH, 8), matFrame)
    thighCore.position.y = -THIGH / 2
    hipJoint.add(thighCore)

    // Knee Joint
    const knee = new THREE.Group()
    knee.position.y = -THIGH
    hipJoint.add(knee)

    // Knee Armor Cap (protrudes forward)
    const kneeCap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.09), matSecondary)
    kneeCap.position.set(0, 0.02, 0.08)
    knee.add(kneeCap)

    // Chunky Flared Mecha Calf / Shin Armor
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.2, SHIN, 0.2), matPrimary)
    shin.position.y = -SHIN / 2
    knee.add(shin)

    // Rear Calf Thruster Fin
    const calfFin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.08), matFrame)
    calfFin.position.set(0, -SHIN / 2, -0.12)
    knee.add(calfFin)

    // Ankle Armor Ring / Collar
    const ankleCollar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.22), matSecondary)
    ankleCollar.position.set(0, -SHIN + 0.08, 0)
    knee.add(ankleCollar)

    // SD Gundam Mecha Boot Body
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.32), matPrimary)
    foot.position.set(0, -SHIN + 0.05, 0.05)
    knee.add(foot)

    // Front Toe Armor Plate
    const toeCap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.12), matSecondary)
    toeCap.position.set(0, -SHIN + 0.04, 0.17)
    knee.add(toeCap)

    // Red / Accent Sole Plate (Sits flush on floor y=0)
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.32), matCockpit)
    sole.position.set(0, -SHIN + 0.015, 0.05)
    knee.add(sole)

    return { shoulder: hipJoint, elbow: knee }
  }
  const legs: [Limb, Limb] = [makeLeg(-1), makeLeg(1)]

  // =========================================================================
  // 3. TORSO & ABDOMINAL SPINE
  // =========================================================================
  // Abdominal Mechanical Spine (child of hips)
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.22), matFrame)
  spine.position.y = TORSO_H / 2 - 0.1
  hips.add(spine)

  // Chest Group (child of hips at CHEST_Y)
  const chest = new THREE.Group()
  chest.position.y = CHEST_Y
  hips.add(chest)

  // Upper Chest Armor
  const chestArmor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.3), matSecondary)
  chestArmor.position.y = -0.06
  chest.add(chestArmor)

  // Cockpit Hatch (center red block with bevel)
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.1), matCockpit)
  cockpit.position.set(0, -0.07, 0.16)
  chest.add(cockpit)

  // Dual Air Intake Vents (Yellow / Gold grilles)
  for (const side of [-1, 1]) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.04), matVent)
    vent.position.set(side * 0.14, 0.02, 0.16)
    chest.add(vent)

    // Neck Collar Armor Flanges
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.16), matVent)
    collar.position.set(side * 0.12, 0.1, 0)
    chest.add(collar)
  }

  // =========================================================================
  // 4. BACKPACK BOOSTER UNIT (Verniers & Sabers)
  // =========================================================================
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.16), matFrame)
  backpack.position.set(0, -0.04, -0.18)
  chest.add(backpack)

  // Dual Vernier Thruster Bells (Rocket Exhaust)
  for (const side of [-1, 1]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.1, 12), matFrame)
    nozzle.position.set(side * 0.08, -0.14, -0.22)
    nozzle.rotation.x = 0.3
    chest.add(nozzle)

    const flameGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), matThruster)
    flameGlow.position.set(side * 0.08, -0.17, -0.23)
    flameGlow.rotation.x = 0.3
    chest.add(flameGlow)

    // Beam Saber Hilts (mounted at top corners of backpack)
    const saberHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), matPrimary)
    saberHilt.position.set(side * 0.11, 0.14, -0.16)
    saberHilt.rotation.set(-0.25, 0, side * 0.18)
    chest.add(saberHilt)
  }

  // =========================================================================
  // 5. NECK & HIGH-TECH HYDRAULIC COLLAR
  // =========================================================================
  const neck = new THREE.Group()
  neck.position.y = 0.12
  chest.add(neck)

  const neckCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12), matFrame)
  neckCylinder.position.y = 0.04
  neck.add(neckCylinder)

  // =========================================================================
  // 6. CHIBI SD GUNDAM HEAD (The Signature Masterpiece)
  // =========================================================================
  const head = new THREE.Group()
  head.position.y = 0.12
  neck.add(head)

  // Main Cranial Helmet Skull (Chunky SD proportions)
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.44), matPrimary)
  helmet.position.y = 0.08
  head.add(helmet)

  // Central Mohawk / Helmet Crest
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.48), matPrimary)
  crest.position.set(0, 0.28, 0)
  head.add(crest)

  // Front Optical Sensor Camera (Cyan glow)
  const frontCam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), matHeadCamera)
  frontCam.position.set(0, 0.29, 0.25)
  head.add(frontCam)

  // Rear Optical Sensor Camera (Red glow)
  const rearCam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.04), matRearCamera)
  rearCam.position.set(0, 0.29, -0.24)
  head.add(rearCam)

  // Forehead Visor Brow (Slanted forward brow overhang)
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.14), matPrimary)
  brow.position.set(0, 0.14, 0.21)
  brow.rotation.x = -0.18
  head.add(brow)

  // Side Cheek Armor Guards & Temple Armor
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.18), matPrimary)
    cheek.position.set(side * 0.22, 0.02, 0.12)
    head.add(cheek)

    // Vulcan Ear Pods (Circular exhaust/comms pods)
    const earPod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), matFrame)
    earPod.position.set(side * 0.25, 0.08, 0)
    earPod.rotation.z = Math.PI / 2
    head.add(earPod)
  }

  // --- THE ICONIC V-FIN ANTENNA ---
  // Center Red / Gold Pentagonal Crest Block
  const vFinCenter = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.06), matCockpit)
  vFinCenter.position.set(0, 0.18, 0.24)
  head.add(vFinCenter)

  // Main V-Fin Horns (Left & Right)
  for (const side of [-1, 1]) {
    // Primary Outer Horn
    const mainHorn = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.3, 0.02), matVFin)
    mainHorn.position.set(side * 0.11, 0.3, 0.24)
    mainHorn.rotation.set(0.12, 0, side * -0.58)
    head.add(mainHorn)

    // Secondary Inner Horn (Classic 4-blade Gundam antenna)
    const subHorn = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.018), matVFin)
    subHorn.position.set(side * 0.06, 0.24, 0.24)
    subHorn.rotation.set(0.12, 0, side * -0.3)
    head.add(subHorn)
  }

  // --- EYES & FACEPLATE ---
  // Recessed Dark Visor Cavity
  const eyeCavity = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.06), matBlack)
  eyeCavity.position.set(0, 0.06, 0.21)
  head.add(eyeCavity)

  // Glowing Gundam Eyes (Angled fiercely)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.025), matEyes)
    eye.position.set(side * 0.08, 0.06, 0.235)
    eye.rotation.z = side * -0.14
    head.add(eye)
  }

  // Slanted White Mouth Faceplate
  const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.1), matPrimary)
  faceplate.position.set(0, -0.04, 0.2)
  faceplate.rotation.x = -0.15
  head.add(faceplate)

  // Twin Horizontal Intake Slits (Classic RX-78 Mouth Vents)
  const vent1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.014, 0.015), matBlack)
  vent1.position.set(0, -0.02, 0.252)
  head.add(vent1)

  const vent2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.015), matBlack)
  vent2.position.set(0, -0.055, 0.248)
  head.add(vent2)

  // Iconic Red Chin Bar (The Legendary Gundam Goatee)
  const redChin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.09), matCockpit)
  redChin.position.set(0, -0.11, 0.21)
  head.add(redChin)

  // =========================================================================
  // 7. ARMS, MECHA PAULDRONS, SHIELD & CARBINE
  // =========================================================================
  const makeArm = (side: number): Limb => {
    const shoulder = new THREE.Group()
    shoulder.position.set(side * SHOULDER_X, SHOULDER_Y, 0)
    chest.add(shoulder)

    // Chunky Mecha Shoulder Pauldron Armor Box
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), matSecondary)
    pauldron.position.set(0, -0.04, 0)
    shoulder.add(pauldron)

    // Pauldron Top Accent Trim
    const pauldronTrim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.24), matPrimary)
    pauldronTrim.position.set(0, 0.06, 0)
    shoulder.add(pauldronTrim)

    // Upper Arm (Mechanical Bicep)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.11, UPPER_ARM, 0.11), matPrimary)
    upper.position.y = -UPPER_ARM / 2
    shoulder.add(upper)

    // Elbow Joint
    const elbow = new THREE.Group()
    elbow.position.y = -UPPER_ARM
    shoulder.add(elbow)

    // Armored Forearm Gauntlet
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.13, FOREARM, 0.13), matPrimary)
    fore.position.y = -FOREARM / 2
    elbow.add(fore)

    // Wrist Armor Cuff
    const wristCuff = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.14), matSecondary)
    wristCuff.position.y = -FOREARM + 0.02
    elbow.add(wristCuff)

    // Mecha Articulated Fist
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.09), matFrame)
    hand.position.y = -FOREARM - 0.04
    elbow.add(hand)

    // Left Arm Equipment: SD Gundam Defense Shield
    if (side === -1) {
      const shieldGroup = new THREE.Group()
      shieldGroup.position.set(-0.12, -FOREARM / 2, 0.04)
      elbow.add(shieldGroup)

      const shieldMat = new THREE.MeshStandardMaterial({
        color: theme.shieldColor,
        roughness: 0.35,
        metalness: 0.35,
      })
      // Main Shield Plate
      const shieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.22), shieldMat)
      shieldGroup.add(shieldPlate)

      // White Upper Shield Border
      const shieldBorder = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.08, 0.23), matPrimary)
      shieldBorder.position.set(0, 0.15, 0)
      shieldGroup.add(shieldBorder)

      // Center Gold Star / AUDIRA NOC Shield Emblem
      const star = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.08), matVent)
      star.rotation.x = Math.PI / 4
      shieldGroup.add(star)
    }

    // Right Arm Equipment: Integrated Beam Carbine / Fiber Diagnostic Tool
    if (side === 1) {
      const blasterGroup = new THREE.Group()
      blasterGroup.position.set(0.11, -FOREARM / 2, 0.05)
      elbow.add(blasterGroup)

      // Blaster Main Receiver Box
      const blasterBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.18), matFrame)
      blasterGroup.add(blasterBody)

      // Carbine Barrel (Points forward, aligned with arm)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), matFrame)
      barrel.position.set(0, 0, 0.14)
      barrel.rotation.x = Math.PI / 2
      blasterGroup.add(barrel)

      // Glowing Cyan Muzzle Lens
      const muzzleLens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.02, 8),
        matHeadCamera,
      )
      muzzleLens.position.set(0, 0, 0.27)
      muzzleLens.rotation.x = Math.PI / 2
      blasterGroup.add(muzzleLens)
    }

    return { shoulder, elbow }
  }
  const arms: [Limb, Limb] = [makeArm(-1), makeArm(1)]

  // =========================================================================
  // 8. FLOATING ROLE HALO BADGE
  // =========================================================================
  // Floats at y=2.18 above the V-Fin
  const badge = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.028, 8, 24),
    new THREE.MeshStandardMaterial({
      color: theme.secondaryArmor,
      emissive: theme.secondaryArmor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    }),
  )
  badge.rotation.x = Math.PI / 2
  badge.position.y = 2.18
  group.add(badge)

  // Enable shadows
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true
      o.receiveShadow = false
    }
  })

  return { group, chest, neck, head, hips, arms, legs, badge }
}
