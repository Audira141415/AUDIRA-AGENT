/**
 * Scene controller: owns the Three.js world and drives agent avatars from
 * office state. React only pushes new state in and receives clicks out.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildOffice, type OfficeProps } from './build'
import { buildAvatar } from './avatar'
import { animate, type Activity, type AnimAgent } from './anim'
import { blocked, route, BODY_R } from './nav'
import { DynamicVideoWallTexture } from './DynamicVideoWallTexture'
import { loadGLB, attachGLBToAvatar, detachGLBFromAvatar } from './modelLoader'
import { AssetShowcaseConveyor } from './AssetShowcaseConveyor'
import { StudioSectors } from './StudioSectors'
import {
  CONFERENCE,
  CONFERENCE_CHAIRS,
  deskByIndex,
  DOOR,
  KANBAN_BOARD,
  GARDEN,
  BOOK_NOOK,
  PANTRY_STOOLS,
  PANTRY_STOOL_GAP,
  PANTRY,
  DART,
  LOUNGE,
  RECEPTION,
  deskSeatWorld,
  visitorSpot,
  IDLE_SPOTS as OFFICE_IDLE_SPOTS,
  type Desk,
} from './layout'
import type { Agent, Meeting, Task } from './types'

export type AgentRoutine =
  | 'DESK_WORK'
  | 'INSPECT_CONVEYOR'
  | 'INSPECT_WALL'
  | 'INSPECT_WEAPON_LAB'
  | 'INSPECT_ARMOR_BAY'
  | 'INSPECT_DRONE_HANGAR'
  | 'INSPECT_QUANTUM_LAB'
  | 'PLAYTEST_ARENA'
  | 'ESPRESSO_BREAK'
  | 'WAR_ROOM_STRATEGY'
  | 'COLLEAGUE_COLLAB'
  | 'LOUNGE_BREAK'
  | 'INSPECT_CLUSTER'

export type SceneAgent = AnimAgent & {
  data: Agent
  target: THREE.Vector3 | null
  /** Remaining waypoints from A*; movement follows these, not the raw target. */
  path: { x: number; z: number }[]
  destKey: string
  face: number
  /** Facing to adopt at a seat; set when a desk target is chosen. */
  seatYaw?: number
  walking: number
  meetingTalking: boolean
  bubble: CSS2DObject
  label: CSS2DObject
  bubbleTimer: number
  /** Seconds remaining of the "entering through the door" walk. */
  spawnGate?: number
  /** Set when the agent is leaving: walk out of the door, then despawn. */
  leaving?: boolean
  routine: AgentRoutine
  routineTimer: number
  routineTarget: THREE.Vector3 | null
  routineYaw: number
}

export type SceneEvents = {
  onMonitorClick?: (deskIndex: number) => void
  onAvatarClick?: (name: string) => void
  /** A card on the 3D Kanban wall was clicked. */
  onTaskClick?: (taskId: string) => void
  onVideoWallClick?: () => void
  onServerRackClick?: (rackLabel: string) => void
  onCoffeeMachineClick?: () => void
  onMeetingTableClick?: () => void
  onConveyorPodClick?: (podIndex: number, slotNum: string) => void
  onSectorClick?: (sectorId: string) => void
}


/**
 * Enable shadows only on the objects that matter.
 *
 * A full-scene shadow pass roughly doubles the draw calls and this scene has 551
 * meshes. The sun is the only caster, so the filter takes solids above a size
 * threshold (walls, furniture, vehicles, roof plant) and leaves small trim —
 * frames, sills, rungs — out of the pass. Those contribute almost nothing to the
 * shadow silhouette but cost a full render each.
 */
const SHADOW_MIN = 0.6
function selectiveShadow(root: THREE.Object3D, light: THREE.DirectionalLight) {
  const bb = new THREE.Box3()
  const size = new THREE.Vector3()
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || !m.geometry) return
    bb.setFromObject(m)
    bb.getSize(size)
    const big = Math.max(size.x, size.y, size.z) >= SHADOW_MIN
    m.castShadow = big
    m.receiveShadow = big
  })
  light.castShadow = true
  const cam = light.shadow.camera as THREE.OrthographicCamera
  cam.left = -60
  cam.right = 60
  cam.top = 60
  cam.bottom = -60
  cam.near = 1
  cam.far = 160
  cam.updateProjectionMatrix()
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.bias = -0.0006
  light.shadow.normalBias = 0.02
}

/**
 * Vertical sky gradient. A flat background colour gives the scene no atmosphere:
 * the horizon should be pale and the zenith deeper, which is also what lets the
 * roofline and the distant blocks read against it.
 */
function skyGradientTexture(stops = ['#9dc4e8', '#c6dcef', '#e2edf6', '#eef4f8']): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, stops[0])
  grad.addColorStop(0.45, stops[1])
  grad.addColorStop(0.75, stops[2])
  grad.addColorStop(1, stops[3])
  g.fillStyle = grad
  g.fillRect(0, 0, 2, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

export function createScene(
  canvas: HTMLCanvasElement,
  labelHost: HTMLElement,
  events: SceneEvents = {},
) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  // Shadows on, but filtered: a 551-mesh scene cannot afford every object in the
  // shadow pass, so selectiveShadow() keeps the large solids and drops the trim.
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  // Without an explicit tone mapping + exposure the standard materials render
  // flat and muddy, which is what made the office look dim and lifeless.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.55
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // Image-based lighting. Without an environment map every metal and glass surface
  // renders flat and near-black — metalness has nothing to reflect — which is what
  // made the building look like painted cardboard. The room environment is
  // generated, so it costs no asset files.
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)

  const labelRenderer = new CSS2DRenderer({ element: labelHost })
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'

  const scene = new THREE.Scene()
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.90 // fill shadows and deliver bright, clear 3D asset reflections
  // High-Tech Cyber Game Studio Sky & Atmosphere
  const skyStudio = skyGradientTexture(['#030712', '#070e1c', '#0b162c', '#0f203f'])
  scene.background = skyStudio
  // Depth cue: deep atmospheric dark studio fog
  scene.fog = new THREE.Fog(0x070d18, 45, 140)

  // Default to Cyberpunk Game Studio Mode (22:00)
  const hour = 22
  const office: OfficeProps = buildOffice(scene, hour)
  selectiveShadow(office.group, office.sun)
  selectiveShadow(office.streetGroup, office.sun)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
  // Cinematic Game Studio perspective: panoramic vista of all 5 Component Sectors & 56m Grand Conveyor
  camera.position.set(0, 8.2, 5.0)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 2.6, -17.5)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2.25
  controls.minDistance = 3
  // Allow zooming to inspect workstations and wall
  controls.maxDistance = 90
  controls.enablePan = true
  controls.screenSpacePanning = false

  // ---- 9-Screen Master Production Wall (Self-Illuminated LED Display)
  const videoWall = new DynamicVideoWallTexture()
  const videoWallMat = new THREE.MeshBasicMaterial({
    map: videoWall.texture,
  })
  office.boardSurface.material = videoWallMat
  office.boardSurface.userData = { type: 'videoWall', name: 'NOC Master Command Video Wall' }

  // High-Tech Cyan Glow into Room from Video Wall
  const screenLight = new THREE.PointLight(0x06b6d4, 1.8, 32)
  screenLight.position.set(KANBAN_BOARD.x, KANBAN_BOARD.y, KANBAN_BOARD.z + 1.5)
  office.group.add(screenLight)

  // ---- 5 Partitioned Component Exhibition Sectors (Weapons, Armor, 3D GLB, Drones, Quantum Core)
  const studioSectors = new StudioSectors()
  scene.add(studioSectors.group)

  // ---- 3D Asset Moving Conveyor Runway (Grand 56m Wide Expo Runway)
  const conveyor = new AssetShowcaseConveyor()
  scene.add(conveyor.group)

  // Notice: CSS2D Kanban card overlay removed so the 9-Screen Video Wall canvas is 100% clean and unobstructed
  const agents: SceneAgent[] = []
  const byName = new Map<string, SceneAgent>()

  // ---- agent lifecycle -------------------------------------------------------

  function makeAgent(data: Agent): SceneAgent {
    const av = buildAvatar(data.role, data.name, data)
    av.group.userData.agentName = data.name   // picked by the raycaster
    scene.add(av.group)

    const bubbleEl = document.createElement('div')
    bubbleEl.className = 'vp-bubble'
    const bubble = new CSS2DObject(bubbleEl)
    bubble.position.set(0, 2.18, 0)
    av.group.add(bubble)
    bubble.visible = false

    const labelEl = document.createElement('div')
    labelEl.className = 'vp-label'
    const label = new CSS2DObject(labelEl)
    label.position.set(0, 1.95, 0)
    av.group.add(label)

    const a: SceneAgent = {
      data,
      avatar: av,
      activity: 'idle',
      ease: 0,
      phase: Math.random() * Math.PI * 2,
      target: null,
      path: [],
      destKey: '',
      face: 0,
      walking: 0,
      meetingTalking: false,
      bubble,
      label,
      bubbleTimer: 0,
      spawnGate: 0,
      leaving: false,
      routine: 'DESK_WORK',
      routineTimer: 8 + (agents.length * 6) % 36,
      routineTarget: null,
      routineYaw: 0,
    }
    agents.push(a)
    byName.set(data.name, a)
    // Spawn directly at designated desk workstation so all 10 operators are seated and working
    let initialPlaced = false
    const deskIdx = data.deskIndex != null ? data.deskIndex : (agents.length - 1) % 10
    const desk = deskByIndex(deskIdx)
    if (desk) {
      const seat = deskSeatWorld(desk)
      av.group.position.set(seat.x, 0, seat.z)
      a.face = deskSeatYaw(desk)
      av.group.rotation.y = a.face
      a.activity = 'typing'
      a.spawnGate = 0
      initialPlaced = true
    }
    if (!initialPlaced) {
      av.group.position.set(DOOR.x, 0, DOOR.z - 0.9)
      a.spawnGate = 0.5
    }

    if (data.modelUrl) {
      loadAgentGLB(data.name, data.modelUrl)
    }

    return a
  }

  async function loadAgentGLB(name: string, source: string | File | Blob | ArrayBuffer): Promise<boolean> {
    const a = byName.get(name)
    if (!a) return false
    try {
      const loaded = await loadGLB(source, { targetHeight: 1.85 })
      attachGLBToAvatar(a.avatar, loaded)
      return true
    } catch (err) {
      console.warn(`[scene] Failed to load GLB model for ${name}:`, err)
      return false
    }
  }

  function clearAgentGLB(name: string): void {
    const a = byName.get(name)
    if (!a) return
    detachGLBFromAvatar(a.avatar)
  }

  function setAgentLocomotion(name: string, mode: 'auto' | 'mecha_stride' | 'mecha_hover'): void {
    const a = byName.get(name)
    if (a && a.avatar) {
      a.avatar.glbLocomotionMode = mode
    }
  }

  function testWalkAgent(name: string): void {
    const a = byName.get(name)
    if (!a) return
    a.routine = 'INSPECT_CONVEYOR'
    a.routineTimer = 18
    a.routineTarget = new THREE.Vector3(0, 0, -17.2)
    a.routineYaw = Math.PI
    say(a.data.name, 'Menguji mode lokomosi robot mecha di catwalk!', 4500)
  }

  function sendAgentToPantry(name: string): void {
    const a = byName.get(name)
    if (!a) return
    a.routine = 'ESPRESSO_BREAK'
    a.routineTimer = 22
    a.routineTarget = new THREE.Vector3(PANTRY_STOOLS[0] || 27.0, 0, (PANTRY.z || 6.0) + PANTRY_STOOL_GAP)
    a.routineYaw = Math.PI
    say(a.data.name, 'Menuju pantry untuk menyeduh espresso hangat ☕...', 4500)
  }

  function sendAgentToDesk(name: string): void {
    const a = byName.get(name)
    if (!a) return
    a.routine = 'DESK_WORK'
    a.routineTimer = 0
    a.routineTarget = null
    const desk = deskByIndex(a.data.deskIndex ?? 0)
    if (desk) {
      const seat = deskSeatWorld(desk)
      a.target = new THREE.Vector3(seat.x, 0, seat.z)
      a.seatYaw = deskSeatYaw(desk)
    }
    say(a.data.name, 'Kembali ke stasiun kerja studio!', 3500)
  }

  function sendAgentToVideoWall(name: string): void {
    const a = byName.get(name)
    if (!a) return
    a.routine = 'INSPECT_WALL'
    a.routineTimer = 25
    a.routineTarget = new THREE.Vector3(0, 0, KANBAN_BOARD.z + 2.5)
    a.routineYaw = 0
    say(a.data.name, 'Menuju Master Production Wall untuk briefing telemetri!', 4500)
  }

  function sendAgentToRack(name: string, rackLabel = 'RACK-01'): void {
    const a = byName.get(name)
    if (!a) return
    a.routine = 'INSPECT_CLUSTER'
    a.routineTimer = 25
    a.routineTarget = new THREE.Vector3(-KANBAN_BOARD.w / 2 - 2.5, 0, KANBAN_BOARD.z + 1.8)
    a.routineYaw = Math.PI
    say(a.data.name, `Inspeksi thermal ${rackLabel} di cluster server!`, 4500)
  }

  function triggerAllHandsStandup(): void {
    agents.forEach((a, idx) => {
      a.routine = 'WAR_ROOM_STRATEGY'
      a.routineTimer = 35
      const angle = (idx / Math.max(1, agents.length)) * Math.PI * 2
      const radius = 2.4
      a.routineTarget = new THREE.Vector3(
        CONFERENCE.x + Math.cos(angle) * radius,
        0,
        CONFERENCE.z + Math.sin(angle) * radius
      )
      a.routineYaw = angle + Math.PI
    })
    say('Arthur', '📢 ALL-HANDS STANDUP: Seluruh divisi kumpul di meja rapat untuk sinkronisasi!', 6000)
  }

  function setLabel(a: SceneAgent) {
    const el = a.label.element as HTMLDivElement
    el.textContent = a.data.displayName
    el.dataset.status = a.data.status
    el.dataset.role = a.data.role
  }

  function removeAgent(a: SceneAgent) {
    // Detach the CSS2D label and bubble FIRST, explicitly.
    //
    // These are CSS2DObject children of the avatar group. `scene.remove(group)`
    // fires three.js's 'removed' event on the GROUP only — the label and bubble are
    // descendants, so their handler never runs and their DOM elements stay in the
    // overlay forever, frozen at the last projected position. Every killed agent
    // left a nameplate stacked at the doorway. Removing the element by hand is the
    // only reliable way; relying on the 'removed' event does not reach children.
    for (const c of [a.label, a.bubble]) {
      c.removeFromParent()
      const el = c.element as HTMLElement
      el.remove()
    }
    scene.remove(a.avatar.group)
    const i = agents.indexOf(a)
    if (i >= 0) agents.splice(i, 1)
    byName.delete(a.data.name)
  }

  /** Reconcile the avatar list with the latest agent roster. */
  function syncAgents(list: Agent[]) {
    // Removal is deferred: an agent that disappears from the list first walks out
    // of the door, and only despawns once it arrives. `leaving` is what turns a
    // kill into an exit rather than a vanish.
    for (const [name, a] of [...byName]) {
      if (!list.some((x) => x.name === name) && !a.leaving) {
        a.leaving = true
        a.path = []
        a.destKey = ''
      }
    }
    for (const data of list) {
      const existing = byName.get(data.name)
      if (existing && existing.leaving) {
        // It came back before finishing its exit — cancel the exit.
        existing.leaving = false
      }
      if (existing) {
        const changed =
          existing.data.status !== data.status ||
          existing.data.deskIndex !== data.deskIndex ||
          existing.data.currentTaskId !== data.currentTaskId
        const modelChanged = data.modelUrl && data.modelUrl !== existing.data.modelUrl
        existing.data = data
        if (modelChanged) {
          loadAgentGLB(data.name, data.modelUrl!)
        }
        if (changed) {
          existing.ease = 0
          setLabel(existing)
        }
      } else {
        makeAgent(data)
      }
    }
  }

  // ---- destination resolution ------------------------------------------------

  function deskTarget(desk: Desk) {
    // MUST match the chair drawn in build.ts, which reads the same constant.
    const seat = deskSeatWorld(desk)
    return new THREE.Vector3(seat.x, 0, seat.z)
  }

  /**
   * Seat facing so a sitter squares up to the monitor.
   *
   * Derived from geometry, not from a `+Math.PI` guess: the chair is at local
   * +z of the desk and the monitor at local -z, so the facing is simply the
   * direction from the seat to the monitor. The avatar rig's forward is local
   * +Z, which is why this is `atan2(dx, dz)` and not the atan2(x, z) form used
   * for camera-space headings.
   */
  function deskSeatYaw(desk: Desk) {
    const chair = deskSeatWorld(desk)
    // monitor world position: local (0, -0.28) rotated by the desk's facing
    const mx = desk.x + -0.28 * Math.sin(desk.facing)
    const mz = desk.z + -0.28 * Math.cos(desk.facing)
    return Math.atan2(mx - chair.x, mz - chair.z)
  }

  /** Must mirror the chair ring drawn in build.ts — a mismatch parks agents on bare floor. */
  function meetingSeat(i: number) {
    const a = CONFERENCE_CHAIRS.offset + (i % CONFERENCE_CHAIRS.count) * (Math.PI * 2 / CONFERENCE_CHAIRS.count)
    return new THREE.Vector3(
      CONFERENCE.x + Math.cos(a) * CONFERENCE_CHAIRS.ring,
      0,
      CONFERENCE.z + Math.sin(a) * CONFERENCE_CHAIRS.ring,
    )
  }

  /** Facing for a conference chair: toward the table centre, same convention as the desk seat. */
  function meetingSeatYaw(i: number) {
    const a = CONFERENCE_CHAIRS.offset + (i % CONFERENCE_CHAIRS.count) * (Math.PI * 2 / CONFERENCE_CHAIRS.count)
    const cx = CONFERENCE.x + Math.cos(a) * CONFERENCE_CHAIRS.ring
    const cz = CONFERENCE.z + Math.sin(a) * CONFERENCE_CHAIRS.ring
    return Math.atan2(CONFERENCE.x - cx, CONFERENCE.z - cz)
  }

  // Idle lounging spots. Each MUST be walkable — `nav.blocked()` validates them
  // at startup and drops any that land inside furniture, so an agent can never
  // be assigned a destination it cannot reach.
  // Each entry pairs a POSITION with the pose that belongs there, and the prop at
  // that position exists in build.ts. A pose without its prop (or a spot inside
  // furniture) reads as an agent staring at a blank wall.
  // `face` is the heading the agent must hold once it arrives: the avatar's
  // forward is local +Z, so `atan2(dx, dz)` aims it at (dx, dz). Every seated spot
  // needs one, and so does every standing spot — without it the agent keeps the
  // direction it walked in with, which is how a sitter ended up facing the sofa's
  // backrest and the gardener ended up facing a wall.
  // Idle spots come from layout.ts as DATA, so the self-test can assert every one of
  // them is actually reachable — two were silently dead here. The filter stays: an
  // unreachable spot is dropped rather than parking an agent inside furniture.
  const IDLE_SPOTS = OFFICE_IDLE_SPOTS.filter((p) => !blocked(p.x, p.z, BODY_R, { allowSeat: p.seated }))

  const CONVEYOR_SPEECH = [
    'Conveyor pod runway standing by — awaiting 3D asset upload...',
    'All 8 exhibition pods calibrated & ready for GLB models.',
    'Pristine carousel turntable running at 60 FPS in standby mode.',
    'Showcase runway clear of test assets, ready for your designs!',
    'Turntable laser telemetry locked in standby state.',
  ]

  const WALL_SPEECH = [
    'Master Production Video Wall running active monitoring.',
    'Studio viewport rendering at solid 60 FPS.',
    'Awaiting incoming 3D asset pipeline deployment.',
    'WebGL PBR shader pipeline prepped with 0 errors.',
  ]

  const WEAPON_SPEECH = [
    'Memeriksa 3-lane firing range dan laser targeting reticle di Sektor 01.',
    'Kalibrasi railgun dan plasma rifle pada mounting rack magnetik.',
    'Ammunition crates & battery power cells terorganisir rapi.',
    'Tes akurasi tembakan laser range 15M optimal.',
  ]

  const ARMOR_SPEECH = [
    'Inspeksi turntable hidrolik 6.5m dan gantry crane di Sektor 02.',
    'Hydraulic mounting stands menopang exo-suit armor chassis.',
    'Tekanan pneumatik turntable stabil, rotasi siap uji beban.',
    'Pemeriksaan kabel hoist gantry mecha berjalan mulus.',
  ]

  const DRONE_SPEECH = [
    'Hexagonal launch pad Sektor 04 siap untuk uji terbang drone.',
    'Telemetry radar monitor mendeteksi airspace bersih 100%.',
    '4 vertical induction fast-charging pylons terisi penuh.',
    'Uji aerodynamic cage dan gimbal camera drone prototipe.',
  ]

  const QUANTUM_SPEECH = [
    'Tokamak magnetic containment reactor plasma beroperasi 100%.',
    'Cryogenic cooling valves menjaga suhu core reaktor tetap dingin.',
    'VFX particle simulation & laser optics bench terkalibrasi.',
    '4-rack GPU compute cluster stabil pada komputasi raytracing.',
  ]

  const PLAYTEST_SPEECH = [
    'Sesi playtest multiplayer di Cyber Esports Battlestation!',
    'Mencoba arcade cabinet retro Cyber Strike di lounge.',
    'Kalibrasi omnidirectional VR immersion pod treadmill.',
    'Gamepad haptics dan curved 34" monitor RGB sangat responsif.',
  ]

  const ESPRESSO_SPEECH = [
    'Menyeduh double-shot espresso di Cyber Studio Lounge Bar.',
    'Break sejenak di crew lounge sofa sambil cek build log.',
    'Recharge stamina dengan cold energy drink dari cyber chiller.',
  ]

  const WAR_ROOM_SPEECH = [
    'Review simulasi peta ancaman global 3D hologram di War Room.',
    'Monitoring 4-screen video wall: DEFCON status aman di level hijau.',
    'Briefing sprint milestone game engine Three.js & asset runway.',
  ]

  const COLLAB_SPEECH = [
    'Syncing with team on the next sprint milestone.',
    'Checking multiplayer network latency stats.',
    'Great job on the new shader compiler updates!',
    'Reviewing collision hitboxes on the character rig.',
  ]

  const LOUNGE_SPEECH = [
    'Grabbing a quick espresso before the next build.',
    'Testing gamepad haptics in the break lounge.',
    'Hydration break! Studio sprint is on track.',
  ]

  const CLUSTER_SPEECH = [
    'GPU render node thermals steady at 52°C.',
    'Cluster raytracing compute load balanced.',
    'Checking memory bandwidth across nodes.',
  ]

  const STUDIO_CONVERSATIONS: Array<{
    speaker1: string
    text1: string
    speaker2: string
    text2: string
  }> = [
    {
      speaker1: 'ROUTEX',
      text1: 'Frametime terkunci 16.6ms di 60 FPS stabil. Draw calls di catwalk optimal.',
      speaker2: 'Arthur',
      text2: 'Bagus ROUTEX! Pertahankan kestabilan frametime untuk milestone Alpha!'
    },
    {
      speaker1: 'CHRONOS',
      text1: 'NavMesh catwalk 56m dan level Cyber City selesai dikompilasi.',
      speaker2: 'AEGIS',
      text2: 'Siap CHRONOS, 50 bot otomatis QA segera dijalankan untuk audit pathfinding!'
    },
    {
      speaker1: 'VOLTIS',
      text1: 'Topologi polygon 3D mesh .GLB mecha teroptimasi low-poly siap integrasi.',
      speaker2: 'THERMO',
      text2: 'Mantap VOLTIS, custom GLSL shader dan emissive lighting siap diaplikasikan!'
    },
    {
      speaker1: 'RESOLV',
      text1: 'Scripting percabangan dialog questline utama 48 node cerita aktif.',
      speaker2: 'Arthur',
      text2: 'Luar biasa RESOLV! Narrative design dunia cyber studio makin hidup.'
    },
    {
      speaker1: 'CIPHER',
      text1: 'Audio buffer polyphonic stereo synthesizer aktif tanpa lag latency.',
      speaker2: 'KAIROS',
      text2: 'AI combat difficulty scaling tersinkronisasi mulus dengan tempo OST!'
    },
    {
      speaker1: 'NEXUS',
      text1: 'Tactile glassmorphic HUD minimap & inventory layout terkalibrasi tajam.',
      speaker2: 'ROUTEX',
      text2: 'Render overhead SVG HUD nol persen, netcode tickrate tetap 64Hz!'
    },
    {
      speaker1: 'AEGIS',
      text1: '1,420 automated bot playtests lolos dengan zero-crash pada sprint ini.',
      speaker2: 'Arthur',
      text2: 'Pencapaian luar biasa tim QA! Demo siap dipresentasikan ke eksekutif.'
    },
    {
      speaker1: 'KAIROS',
      text1: 'Neural AI behavior tree musuh beradaptasi dengan akurasi pemain.',
      speaker2: 'RESOLV',
      text2: 'Dialog NPC responsif saat musuh berganti taktik combat!'
    },
    {
      speaker1: 'VOLTIS',
      text1: 'Staging conveyor siap menampilkan model mecha 3D resolusi tinggi.',
      speaker2: 'AEGIS',
      text2: 'Collision boundary catwalk terverifikasi aman tanpa clipping!'
    },
    {
      speaker1: 'THERMO',
      text1: 'ACES Filmic tonemapping dan bloom shader terkalibrasi tajam di aula.',
      speaker2: 'CHRONOS',
      text2: 'Kontras pencahayaan senja dan malam di sektor pameran terlihat dramatis!'
    }
  ]

  const AMBIENT_ROLE_THOUGHTS: Record<string, string[]> = {
    DIRECTOR: [
      'Memantau milestone sprint studio: 94% progres tercapai.',
      'Review build Three.js WebGL draw calls berjalan lancar.',
      'Seluruh 10 stasiun kerja divisi game dev terkoordinasi aktif.',
      'Pameran catwalk 56m siap untuk integrasi model GLB baru.'
    ],
    NETWORK: [
      'WebGL tickrate 64Hz, latensi client RTT 18ms zero packet drop.',
      'Occlusion culling sektor 07 mereduksi 40% vertex beban GPU.',
      'Shader buffer swap time di bawah 1.2ms, 60 FPS terkunci stabil.',
      'Websocket stream bridge terhubung aktif ke agent cluster.'
    ],
    NOC_OPS: [
      'Penyusunan biome modular Cyber City berjalan mulus.',
      'NavMesh catwalk 56m selesai dikompilasi untuk navigasi bot.',
      'Dynamic lighting & baking ambient occlusion aula selesai 100%.',
      'Pemeriksaan collision mesh pembatas sektor berjalan optimal.'
    ],
    HELPDESK: [
      'Branching dialog questline utama 48 node cerita aktif.',
      'Balancing formula damage combat sudah sesuai kurva ideal.',
      'Scripting interaksi NPC tactile siap untuk sesi playtest.',
      'Penyusunan alur cerita babak pertama telah dirapikan.'
    ],
    CYBER_SOC: [
      'Sintesis polyphonic stereo buffer berjalan jernih tanpa latency.',
      'Dynamic combat OST bertransisi halus mengikuti fase sprint.',
      'Spatial 3D audio reverberation terkalibrasi presisi di aula.',
      'Mechanical keyboard sound FX terhubung ke typing engine.'
    ],
    ELECTRICAL: [
      'Topologi polygon 3D mesh .GLB mecha teroptimasi low-poly.',
      'Normal map atlas & PBR metalness/roughness terkalibrasi tajam.',
      'Rigging avatar SD Gundam siap untuk export animasi mecha.',
      'Grand conveyor runway siap menampung aset 3D baru.'
    ],
    HVAC: [
      'Compute shader partikel laser 60 FPS sangat stabil.',
      'Post-processing ACES Filmic tonemapping & bloom terkalibrasi.',
      'Simulasi partikel thruster mecha efisien tanpa beban draw call.',
      'Pencahayaan volumetric beam aula komando aktif.'
    ],
    DATABASE: [
      'Tactile cyber-retro HUD minimap terintegrasi responsif.',
      'Komponen SVG & WebGL HUD terkalibrasi tanpa overhead.',
      'Inventory layout & responsive dock tersinkronisasi real-time.',
      'Reactive state management agen sinkron ke inspector panel.'
    ],
    FIRE_SEC: [
      '1,420 automated bot playtests lolos dengan zero crash!',
      'Stress-test 100 entity bersamaan tidak mengalami drop FPS.',
      'Collision detection audit catwalk aman dari kemungkinan clipping.',
      'Sistem audit integritas data aman di DEFCON 5 Green.'
    ],
    AI_SENTRY: [
      'Behavior tree musuh beradaptasi dengan tingkat keahlian pemain.',
      'Dynamic difficulty scaling (DDA) terkalibrasi seimbang.',
      'Neural AI pathfinding merespons layout rute pameran baru.',
      'Algoritma pengambilan keputusan otonom beroperasi optimal.'
    ]
  }

  function updateAgentRoutine(a: SceneAgent, dt: number, index: number) {
    if (currentMeeting && (currentMeeting.state === 'queued' || currentMeeting.state === 'running')) {
      return
    }

    a.routineTimer -= dt
    if (a.routineTimer > 0) return

    const deskIdx = a.data.deskIndex != null ? a.data.deskIndex : (index % 10)
    const desk = deskByIndex(deskIdx)

    if (a.routine !== 'DESK_WORK') {
      // 65% chance to return to desk work, 35% to continue roaming
      if (Math.random() < 0.65 || !desk) {
        a.routine = 'DESK_WORK'
        a.routineTimer = 22 + Math.random() * 26
        return
      }
    }

    // Staggered selection across all 7 sectors and studio activities
    const r = Math.random()
    if (r < 0.12) {
      // Sektor 01: Arsenal & Firing Range
      a.routine = 'INSPECT_WEAPON_LAB'
      a.routineTimer = 14 + Math.random() * 8
      a.routineTarget = new THREE.Vector3(-22.0, 0, -17.5)
      a.routineYaw = -Math.PI / 2
      say(a.data.name, WEAPON_SPEECH[Math.floor(Math.random() * WEAPON_SPEECH.length)], 7000)
    } else if (r < 0.24) {
      // Sektor 02: Exo-Armor & Mecha Bay
      a.routine = 'INSPECT_ARMOR_BAY'
      a.routineTimer = 14 + Math.random() * 8
      a.routineTarget = new THREE.Vector3(-24.0, 0, -0.5)
      a.routineYaw = 0
      say(a.data.name, ARMOR_SPEECH[Math.floor(Math.random() * ARMOR_SPEECH.length)], 7000)
    } else if (r < 0.36) {
      // Sektor 04: Drone & Vehicle Hangar
      a.routine = 'INSPECT_DRONE_HANGAR'
      a.routineTimer = 14 + Math.random() * 8
      a.routineTarget = new THREE.Vector3(-25.5, 0, 14.0)
      a.routineYaw = Math.PI / 2
      say(a.data.name, DRONE_SPEECH[Math.floor(Math.random() * DRONE_SPEECH.length)], 7000)
    } else if (r < 0.48) {
      // Sektor 05: Quantum Core & VFX Lab
      a.routine = 'INSPECT_QUANTUM_LAB'
      a.routineTimer = 14 + Math.random() * 8
      a.routineTarget = new THREE.Vector3(22.0, 0, 16.5)
      a.routineYaw = -Math.PI / 2
      say(a.data.name, QUANTUM_SPEECH[Math.floor(Math.random() * QUANTUM_SPEECH.length)], 7000)
    } else if (r < 0.60) {
      // Cyber Esports Playtest Battlestations & Arcade
      a.routine = 'PLAYTEST_ARENA'
      a.routineTimer = 14 + Math.random() * 8
      const isArcade = Math.random() < 0.5
      a.routineTarget = isArcade ? new THREE.Vector3(9.0, 0, 13.8) : new THREE.Vector3(-6.5, 0, 14.0)
      a.routineYaw = isArcade ? -Math.PI / 2 : Math.PI
      say(a.data.name, PLAYTEST_SPEECH[Math.floor(Math.random() * PLAYTEST_SPEECH.length)], 7000)
    } else if (r < 0.72) {
      // Crew Espresso & Chill-out Lounge
      a.routine = 'ESPRESSO_BREAK'
      a.routineTimer = 14 + Math.random() * 8
      const isBar = Math.random() < 0.5
      a.routineTarget = isBar ? new THREE.Vector3(0, 0, 20.5) : new THREE.Vector3(-8.0, 0, 20.5)
      a.routineYaw = isBar ? 0 : Math.PI / 2
      say(a.data.name, ESPRESSO_SPEECH[Math.floor(Math.random() * ESPRESSO_SPEECH.length)], 7000)
    } else if (r < 0.82) {
      // Executive War Room Strategy
      a.routine = 'WAR_ROOM_STRATEGY'
      a.routineTimer = 14 + Math.random() * 8
      a.routineTarget = new THREE.Vector3(22.0, 0, -8.0)
      a.routineYaw = 0
      say(a.data.name, WAR_ROOM_SPEECH[Math.floor(Math.random() * WAR_ROOM_SPEECH.length)], 7000)
    } else if (r < 0.90) {
      // Sektor 03: Master Video Wall
      a.routine = 'INSPECT_WALL'
      a.routineTimer = 12 + Math.random() * 8
      const px = -2.5 + (index % 3) * 2.5
      a.routineTarget = new THREE.Vector3(px, 0, -17.4)
      a.routineYaw = Math.PI
      say(a.data.name, WALL_SPEECH[Math.floor(Math.random() * WALL_SPEECH.length)], 7000)
    } else {
      // Colleague collaboration
      a.routine = 'COLLEAGUE_COLLAB'
      a.routineTimer = 12 + Math.random() * 10
      const targetDeskIdx = (deskIdx + 1 + (index % 3)) % 10
      const targetDesk = deskByIndex(targetDeskIdx)
      if (targetDesk) {
        const v = visitorSpot(targetDesk)
        a.routineTarget = new THREE.Vector3(v.x, 0, v.z)
        a.routineYaw = Math.atan2(targetDesk.x - v.x, targetDesk.z - v.z)
        say(a.data.name, COLLAB_SPEECH[Math.floor(Math.random() * COLLAB_SPEECH.length)], 7000)
      } else {
        a.routine = 'DESK_WORK'
        a.routineTimer = 20
      }
    }
  }

  /** Decide activity + destination for the coming frames. */
  function retarget(a: SceneAgent, meeting: Meeting | null, index: number) {
    a.seatYaw = undefined

    // 0. entering / leaving: hold at the doorway until the walk completes.
    if (a.spawnGate && a.spawnGate > 0) {
      a.target = null
      a.activity = 'idle'
      a.seatYaw = Math.PI
      return
    }
    if (a.leaving) {
      a.target = new THREE.Vector3(DOOR.x, 0, DOOR.z)
      a.activity = 'idle'
      return
    }

    const st = a.data.status

    // 1. meeting wins over everything while live
    const meetingLive = meeting?.state === 'queued' || meeting?.state === 'running'
    if (meeting && meetingLive && meeting.participants.includes(a.data.name)) {
      const idx = meeting.participants.indexOf(a.data.name)
      const seat = meetingSeat(idx)
      a.target = seat
      a.seatYaw = meetingSeatYaw(idx)
      a.activity = 'meeting'
      a.meetingTalking = meeting.currentSpeaker === a.data.name
      return
    }

    // 2. reviewer walk
    if (st === 'review') {
      const desk = a.data.deskIndex != null ? deskByIndex(a.data.deskIndex) : null
      if (desk) {
        const v = visitorSpot(desk)
        a.target = new THREE.Vector3(v.x, 0, v.z)
        a.activity = 'idle'
        a.seatYaw = Math.atan2(desk.x - v.x, desk.z - v.z)
        return
      }
    }

    // 3. Dynamic Studio Roaming & Work Routines: agents patrol the 5 sectors, inspect conveyor, or code at desks
    if (st !== 'meeting') {
      const deskIdx = a.data.deskIndex != null ? a.data.deskIndex : (index % 10)
      const desk = deskByIndex(deskIdx)

      if (a.routine === 'DESK_WORK' && desk) {
        a.target = deskTarget(desk)
        a.seatYaw = deskSeatYaw(desk)
        a.activity = 'typing'
        return
      }

      if (a.routine === 'INSPECT_WEAPON_LAB' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'INSPECT_ARMOR_BAY' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'INSPECT_DRONE_HANGAR' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'INSPECT_QUANTUM_LAB' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'INSPECT_CONVEYOR' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'INSPECT_WALL' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'PLAYTEST_ARENA' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'typing'
        return
      }

      if (a.routine === 'ESPRESSO_BREAK' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'coffee'
        return
      }

      if (a.routine === 'WAR_ROOM_STRATEGY' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'COLLEAGUE_COLLAB' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      if (a.routine === 'LOUNGE_BREAK' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'coffee'
        return
      }

      if (a.routine === 'INSPECT_CLUSTER' && a.routineTarget) {
        a.target = a.routineTarget
        a.seatYaw = a.routineYaw
        a.activity = 'idle'
        return
      }

      // Default fallback to workstation
      if (desk) {
        a.target = deskTarget(desk)
        a.seatYaw = deskSeatYaw(desk)
        a.activity = 'typing'
        return
      }
    }

    // 5. blocked without a desk: pace in the aisle
    if (st === 'blocked') {
      a.target = new THREE.Vector3(-3 + (index % 3) * 3, 0, 4.6)
      a.activity = 'idle'
      return
    }

    // 6. idle: pick a stable spot so avatars do not clump on the same furniture
    if (!IDLE_SPOTS.length) {
      a.target = new THREE.Vector3(0, 0, 8)
      a.activity = 'idle'
      return
    }
    // Claim an idle spot no other agent holds. Sharing a spot deadlocks both:
    // their bodies block each other in the corridor and neither ever arrives.
    const taken = new Set(
      agents.filter((x) => x !== a && x.target).map((x) => `${x.target!.x.toFixed(1)},${x.target!.z.toFixed(1)}`),
    )
    let spot = IDLE_SPOTS[index % IDLE_SPOTS.length]
    for (let k = 0; k < IDLE_SPOTS.length; k++) {
      const cand = IDLE_SPOTS[(index + k) % IDLE_SPOTS.length]
      if (!taken.has(`${cand.x.toFixed(1)},${cand.z.toFixed(1)}`)) {
        spot = cand
        break
      }
    }
    a.target = new THREE.Vector3(spot.x, 0, spot.z)
    a.activity = spot.act
    a.seatYaw = spot.face
  }

  // ---- simulation ------------------------------------------------------------

  const tmp = new THREE.Vector3()
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  let t = 0
  let raf = 0
  let last = performance.now()
  /** Diagnostics: frame count + last dt, surfaced for the e2e hook. */
  const stats = { frames: 0, lastDt: 0, fps: 0, fpsAt: performance.now(), fpsFrames: 0 }
  /** 2 = full, 1 = no antialias/soft effects, 0 = bare minimum. */
  let quality = 2
  // Adaptive, not locked: the shadow pass at 2048 with 552 casters is heavy for a
  // phone or a software rasteriser. Rather than choosing between "no shadows
  // anywhere" and "unusable on a weak GPU", the shadow resolution steps down with
  // the quality tier and the pass is dropped only at tier 0.
  const qualityLocked = true

  function setQuality(q: number) {
    quality = Math.max(0, Math.min(2, q))
    renderer.setPixelRatio(q === 2 ? Math.min(devicePixelRatio, 2) : 1)
    // tier 2 -> 2048, tier 1 -> 1024, tier 0 -> no shadow pass at all
    renderer.shadowMap.enabled = q > 0
    office.sun.shadow.mapSize.set(q === 2 ? 2048 : 1024, q === 2 ? 2048 : 1024)
    office.sun.shadow.map?.dispose()
    office.sun.shadow.map = null
    if (q < 2) {
      const parent = renderer.domElement.parentElement
      if (parent) renderer.setSize(parent.clientWidth, parent.clientHeight, false)
    }
  }
  void setQuality
  let currentMeeting: Meeting | null = null

  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    // Wall-clock delta, clamped only against tab-switch spikes. A tight clamp
    // (0.05) silently turns the whole office into slow motion on a slow GPU,
    // which is what made avatars appear to crawl.
    const dt = Math.min(0.25, (now - last) / 1000)
    last = now
    t += dt

    stats.frames++
    stats.lastDt = dt
    stats.fpsFrames++
    if (now - stats.fpsAt >= 1000) {
      stats.fps = (stats.fpsFrames * 1000) / (now - stats.fpsAt)
      stats.fpsAt = now
      stats.fpsFrames = 0
      // Step the renderer down when the machine cannot keep up (software WebGL
      // in a VM or a headless browser, or a very weak GPU). Three tiers, and it
      // never steps back up so a struggling machine does not oscillate.
      if (!qualityLocked) {
        if (stats.fps < 12 && quality > 0) setQuality(quality - 1)
        else if (stats.fps < 26 && quality > 1) setQuality(quality - 2)
      }
    }

    agents.forEach((a, i) => {
      updateAgentRoutine(a, dt, i)
      retarget(a, currentMeeting, i)

      const g = a.avatar.group
      if (a.target) {
        // Re-plan only when the destination moved: A* over the nav grid is what
        // keeps walkers out of desks, so movement follows `path`, not a straight
        // line to the target.
        const destKey = `${a.target.x.toFixed(1)},${a.target.z.toFixed(1)}`
        if (destKey !== a.destKey || !a.path.length) {
          a.destKey = destKey
          a.path = route({ x: g.position.x, z: g.position.z }, { x: a.target.x, z: a.target.z })
          if (!a.path.length) a.path = [{ x: a.target.x, z: a.target.z }]
        }

        const leg = a.path[0]
        tmp.set(leg.x - g.position.x, 0, leg.z - g.position.z)
        const dist = tmp.length()
        if (dist < 0.18) {
          a.path.shift()
          if (!a.path.length) {
            g.position.set(a.target.x, g.position.y, a.target.z)
            a.walking = 0
          }
        } else {
          tmp.normalize()
          // Slide along the surface when the next micro-step would enter a prop,
          // so a body never ends up inside furniture after a re-plan.
          const SPEED = 1.8 // m/s, natural humanoid walking pace matching foot-stride frequency
          // Clamp the step to the distance left on THIS leg. Without it a long
          // frame (dt up to 0.25 s -> 0.85 m) overshoots the waypoint, the next
          // frame reverses, and the agent oscillates on the spot forever.
          const step = Math.min(SPEED * dt, dist)
          const nx = g.position.x + tmp.x * step
          const nz = g.position.z + tmp.z * step
          // The A* path is already collision-free; this guard exists only to
          // absorb float drift, so a blocked micro-step nudges toward the
          // waypoint rather than freezing the agent in place.
          if (!blocked(nx, nz, BODY_R * 0.9)) {
            g.position.set(nx, g.position.y, nz)
          } else {
            g.position.x += tmp.x * Math.min(0.05, step)
            g.position.z += tmp.z * Math.min(0.05, step)
          }
          a.face = Math.atan2(tmp.x, tmp.z)
          a.walking = 1
        }
      } else {
        a.walking = 0
      }

      // Tick the entrance gate: while it runs the agent stands at the threshold
      // facing into the room, which is what sells "just walked in".
      if (a.spawnGate && a.spawnGate > 0) {
        a.spawnGate = Math.max(0, a.spawnGate - dt)
        a.walking = 0
      }

      // A leaving agent despawns when it reaches the doorway.
      if (a.leaving && !a.path.length) {
        const dd = Math.hypot(g.position.x - DOOR.x, g.position.z - DOOR.z)
        if (dd < 0.6) {
          removeAgent(a)
          return // forEach callback, not a loop body
        }
      }

      // smooth turn toward the facing direction
      let diff = a.face - g.rotation.y
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      g.rotation.y += diff * Math.min(1, dt * 6)
      g.position.y = 0

      // Face the seat's heading once arrived, when the destination defined one.
      //
      // This has been wrong twice, both times because it tested the POSE instead
      // of the data: first `activity === 'typing' || 'meeting'`, then a hand-kept
      // SEATED set. Each version silently excluded whatever pose was added next —
      // `garden` and `dart` were the latest, so those agents kept the heading they
      // walked in with and ended up with their back to the planter.
      //
      // The question is not "is this a sitting pose", it is "did the destination
      // say which way to look". `retarget()` sets `seatYaw` for every spot that
      // declares `face`, and clears it for those that do not.
      if (a.walking < 0.5 && a.seatYaw !== undefined) {
        a.face = a.seatYaw
      }

      // walking overrides the seated pose until arrival
      const activity: Activity = a.walking > 0.5 ? 'walking' : a.activity
      const anim: AnimAgent = {
        avatar: a.avatar,
        activity,
        ease: a.ease,
        phase: a.phase,
        meetingTalking: a.meetingTalking,
      }
      animate(anim, t, dt)
      a.ease = anim.ease

      // Monitor glow reflects the occupant's state. The screen itself is NEVER
      // hidden: an invisible mesh is skipped by the raycaster, which would make
      // the "peek at screen" click target unreachable whenever nobody is typing.
      if (a.data.deskIndex != null && office.monitors[a.data.deskIndex]) {
        const mat = office.monitors[a.data.deskIndex].material as THREE.MeshStandardMaterial
        const st = a.data.status
        const target = st === 'working' ? 1.9 : st === 'review' ? 1.35 : 0.55
        mat.emissiveIntensity += (target - mat.emissiveIntensity) * Math.min(1, dt * 4)
      }

      // badge bob
      a.avatar.badge.rotation.z = t * 0.8 + a.phase
      a.avatar.badge.position.y = 1.85 + Math.sin(t * 1.6 + a.phase) * 0.03

      // speech bubble lifetime
      if (a.bubbleTimer > 0) {
        a.bubbleTimer -= dt * 1000
        if (a.bubbleTimer <= 0) a.bubble.visible = false
      }

      // keep the speaker's bubble pinned while talking
      if (a.meetingTalking && a.bubbleTimer <= 0) {
        a.bubbleTimer = 1200
        a.bubble.visible = true
      }
    })

    // Ambient studio dialogue loop: ensures 1-2 lively chat bubbles are always active!
    ambientChatTimer -= dt
    if (ambientChatTimer <= 0) {
      triggerAmbientStudioChatter()
      ambientChatTimer = 4.8 + Math.random() * 3.2
    }

    office.animateStreet(dt, t)
    videoWall.update(dt)
    conveyor.update(dt, t)
    studioSectors.update(dt, t)

    controls.update()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  // ---- pointer picking -------------------------------------------------------

  const ray = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function pick(clientX: number, clientY: number) {
    const r = renderer.domElement.getBoundingClientRect()
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1
    ray.setFromCamera(pointer, camera)

    const hits = ray.intersectObjects(scene.children, true)
    for (const h of hits) {
      const ud = h.object.userData as { kind?: string; deskIndex?: number; type?: string }
      // Check for video wall
      if (ud?.type === 'videoWall' || h.object.name === 'kanban-board') {
        events.onVideoWallClick?.()
        return
      }
      if (ud?.kind === 'monitor' && typeof ud.deskIndex === 'number') {
        events.onMonitorClick?.(ud.deskIndex)
        return
      }

      // Walking up the parent tree to catch grouped entities
      let o: THREE.Object3D | null = h.object
      while (o && !o.userData?.agentName && !o.userData?.type) {
        o = o.parent
      }

      if (o?.userData?.type === 'conveyorPod') {
        events.onConveyorPodClick?.(o.userData.podIndex as number, o.userData.slotNum as string)
        return
      }

      if (o?.userData?.type === 'sectorShowcase') {
        events.onSectorClick?.(o.userData.sectorId as string)
        return
      }

      if (o?.userData?.type === 'serverRack') {
        events.onServerRackClick?.((o.userData.label as string) || 'CLUSTER-01 // RENDER-FARM')
        return
      }

      if (o?.userData?.type === 'coffeeMachine') {
        events.onCoffeeMachineClick?.()
        return
      }

      if (o?.userData?.type === 'meetingTable') {
        events.onMeetingTableClick?.()
        return
      }

      if (o?.userData?.agentName) {
        events.onAvatarClick?.(o.userData.agentName as string)
        return
      }
    }
  }

  const onDown = (e: MouseEvent) => {
    pending = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  let pending: { x: number; y: number; t: number } | null = null
  const onUp = (e: MouseEvent) => {
    if (!pending) return
    const moved = Math.hypot(e.clientX - pending.x, e.clientY - pending.y)
    const held = performance.now() - pending.t
    if (moved < 5 && held < 400) pick(e.clientX, e.clientY)
    pending = null
  }

  let hoverRaf = 0
  const onPointerMove = (e: MouseEvent) => {
    if (hoverRaf) return
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0
      const r = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1
      ray.setFromCamera(pointer, camera)

      const hits = ray.intersectObjects(scene.children, true)
      let isInteractive = false
      for (const h of hits) {
        const ud = h.object.userData as { kind?: string; deskIndex?: number; type?: string }
        if (ud?.type === 'videoWall' || h.object.name === 'kanban-board' || (ud?.kind === 'monitor' && typeof ud.deskIndex === 'number')) {
          isInteractive = true
          break
        }
        let o: THREE.Object3D | null = h.object
        while (o && !o.userData?.agentName && !o.userData?.type) {
          o = o.parent
        }
        if (o?.userData?.type === 'conveyorPod' || o?.userData?.type === 'sectorShowcase' || o?.userData?.type === 'serverRack' || o?.userData?.type === 'coffeeMachine' || o?.userData?.type === 'meetingTable' || o?.userData?.agentName) {
          isInteractive = true
          break
        }
      }
      renderer.domElement.style.cursor = isInteractive ? 'pointer' : 'default'
    })
  }

  renderer.domElement.addEventListener('mousedown', onDown)
  renderer.domElement.addEventListener('mouseup', onUp)
  renderer.domElement.addEventListener('mousemove', onPointerMove, { passive: true })

  function resize(w: number, h: number) {
    renderer.setSize(w, h, false)
    labelRenderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  /** Tasks are displayed in the high-tech 9-Screen Video Wall texture and Telemetry HUD. */
  function setTasks(tasks: Task[]) {
    // Dynamic canvas texture on Video Wall handles high-tech visual feeds
  }

  function setMeeting(m: Meeting | null) {
    // A dead meeting must not keep holding seats: treat done/error as no meeting.
    const live = m && (m.state === 'queued' || m.state === 'running') ? m : null
    const hadMeeting = currentMeeting !== null
    currentMeeting = live
    if (!live && hadMeeting) {
      for (const a of agents) {
        a.meetingTalking = false
      }
    }
  }

  function escapeHtml(str: string): string {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  let ambientChatTimer = 1.2 // First bubble pops up 1.2s after studio loads!

  function triggerAmbientStudioChatter() {
    if (agents.length === 0) return

    // 45% chance to trigger an interactive dialogue pair
    if (Math.random() < 0.45 && STUDIO_CONVERSATIONS.length > 0) {
      const convo = STUDIO_CONVERSATIONS[Math.floor(Math.random() * STUDIO_CONVERSATIONS.length)]
      const a1 = byName.get(convo.speaker1)
      const a2 = byName.get(convo.speaker2)
      if (a1 && a2) {
        say(convo.speaker1, convo.text1, 7500)
        setTimeout(() => {
          say(convo.speaker2, convo.text2, 7500)
        }, 2200)
        return
      }
    }

    // Otherwise, pick a candidate agent
    const candidates = agents.filter(a => a.bubbleTimer <= 1000)
    const target = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : agents[Math.floor(Math.random() * agents.length)]

    if (target) {
      const roleKey = (target.data.rawRole || target.data.role || 'DEV').toUpperCase()
      const pool = AMBIENT_ROLE_THOUGHTS[roleKey] || AMBIENT_ROLE_THOUGHTS.DIRECTOR
      const msg = pool[Math.floor(Math.random() * pool.length)]
      say(target.data.name, msg, 7500)
    }
  }

  /** Show a rich cyberpunk speech bubble above the avatar's head. */
  function say(name: string, text: string, ms = 7500) {
    const a = byName.get(name)
    if (!a) return
    const el = a.bubble.element as HTMLDivElement

    const color = a.data.color || '#38bdf8'
    const roleKey = (a.data.rawRole || a.data.role || 'DEV').toUpperCase()
    const badge = a.data.roleConfig?.badge || `🤖 ${roleKey}`
    const icon = badge.split(' ')[0] || '🤖'
    const title = a.data.roleConfig?.title || roleKey

    el.style.setProperty('--bubble-border', color)
    el.style.setProperty('--bubble-glow', `${color}4d`)
    el.style.setProperty('--bubble-color', color)

    el.innerHTML = `
      <div class="vp-bubble-card" style="--bubble-border: ${color}; --bubble-glow: ${color}4d; --bubble-color: ${color};">
        <div class="vp-bubble-header">
          <span class="vp-bubble-badge" style="background: ${color}22; color: ${color}; border: 1px solid ${color}66;">
            ${icon} ${a.data.name}
          </span>
          <span class="vp-bubble-role">${title.split('&')[0].trim()}</span>
        </div>
        <div class="vp-bubble-text">${escapeHtml(text)}</div>
        <div class="vp-bubble-tail" style="border-top-color: ${color};"></div>
      </div>
    `

    a.bubble.visible = true
    a.bubbleTimer = ms
  }

  const skyDay = skyGradientTexture(['#0b1322', '#141f33', '#1e293b', '#334155'])
  const skyNight = skyGradientTexture(['#030712', '#070e1c', '#0b162c', '#0f203f'])
  const skySunset = skyGradientTexture(['#150d2a', '#24143d', '#3b1c3e', '#522b3b'])
  function setHour(h: number) {
    office.applyPalette(h)
    scene.background = (h === 17) ? skySunset : (h >= 18 || h < 6 ? skyNight : skyDay)
    scene.fog = new THREE.Fog(h >= 18 || h < 6 ? 0x070d18 : 0x0b1322, 45, 140)
  }
  setHour(hour)

  function start() {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }
  function dispose() {
    stop()
    renderer.domElement.removeEventListener('mousedown', onDown)
    renderer.domElement.removeEventListener('mouseup', onUp)
    renderer.domElement.removeEventListener('mousemove', onPointerMove)
    conveyor.dispose()
    renderer.dispose()
  }

  return {
    scene,
    camera,
    stats,
    controls,
    office,
    agents,
    byName,
    videoWall,
    conveyor,
    studioSectors,
    syncAgents,
    setTasks,
    setMeeting,
    say,
    loadAgentGLB,
    clearAgentGLB,
    setAgentLocomotion,
    testWalkAgent,
    sendAgentToPantry,
    sendAgentToDesk,
    sendAgentToVideoWall,
    sendAgentToRack,
    triggerAllHandsStandup,
    setHour,
    start,
    stop,
    resize,
    dispose,
    get hour() {
      return hour
    },
  }
}

export type OfficeScene = ReturnType<typeof createScene>
