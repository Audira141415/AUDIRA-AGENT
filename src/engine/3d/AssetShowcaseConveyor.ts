/**
 * AssetShowcaseConveyor.ts - Grand 56-Meter Wide & Long Cyber Expo Conveyor Runway
 *
 * Implements a massive, double-lane elevated moving conveyor runway spanning 56 meters
 * (x = -28.0 to +28.0, width/depth = 3.6m, centered at z = -19.8) that connects all 5
 * partitioned component sectors (Weapons, Armor, 3D GLB Models, Drones, Quantum Core).
 *
 * Standby Architecture:
 * - 8 empty rotating exhibition turntable pods (diameter 2.5m) in pristine standby mode
 * - Concentric glowing holographic reticles and [ AWAITING 3D ASSET ] badges
 * - Extensible API: attachAssetToPod() and loadGLBToPod() for live user asset mounting
 * - 56-meter long continuous moving tread texture with dual cyber lane chevron guides
 * - 3.6-meter wide heavy industrial catwalk chassis with neon handrails & tempered glass
 * - Grand sci-fi portal gateway entrance and exit arches at x = ±28.4
 */

import * as THREE from 'three'
import { loadGLB, type LoadedGLB } from './modelLoader'

export interface ShowcasePod {
  group: THREE.Group
  turntable: THREE.Group
  badge: THREE.Sprite
  spotlight: THREE.SpotLight
  reticle: THREE.Group
  x: number
  podIndex: number
  colorHex: number
  colorStr: string
  title: string
  sub: string
  modelRoot?: THREE.Object3D
  loadedGlb?: LoadedGLB
  badgeBaseY?: number
  currentClipName?: string
  animSpeed?: number
  isPlayingAnim?: boolean
  shadingMode?: 'pbr' | 'wireframe' | 'clay' | 'normals'
  origMaterials?: Map<THREE.Mesh, THREE.Material | THREE.Material[]>
}

export class AssetShowcaseConveyor {
  public group: THREE.Group
  private treadMaterial: THREE.MeshStandardMaterial
  private treadTexture: THREE.CanvasTexture
  private pods: ShowcasePod[] = []

  // Grand Track physical dimensions (56 meters long, 3.6 meters wide!)
  public readonly startX = -28.0
  public readonly endX = 28.0
  public readonly trackLength = 56.0
  public readonly trackZ = -19.8
  public readonly trackY = 0.35
  public readonly trackDepth = 3.6
  public readonly beltSpeed = 0.95 // base metres per second

  // Dynamic Catwalk Runway Controls
  public beltSpeedMultiplier = 1.0
  public isBeltPaused = false
  public beltDirection: 1 | -1 = 1
  public isTurntableSpinning = true
  public turntableSpeedMultiplier = 1.0

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'AssetShowcaseConveyor'

    // 1. Build wide scrolling conveyor tread texture
    this.treadTexture = this.createTreadTexture()
    this.treadMaterial = new THREE.MeshStandardMaterial({
      map: this.treadTexture,
      roughness: 0.38,
      metalness: 0.85,
    })

    // 2. Build the grand 56m runway structure
    this.buildRunwayStructure()

    // 3. Build Entrance & Exit Portal Arches
    this.buildPortalArches()

    // 4. Create the 8 moving exhibition pods (clean empty standby mode)
    this.createPods()
  }

  /**
   * Procedural dynamic conveyor tread canvas texture with double-lane chevrons and neon boundaries
   */
  private createTreadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Base dark titanium
    ctx.fillStyle = '#080d1a'
    ctx.fillRect(0, 0, 1024, 512)

    // Ribbed steel treads
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 4
    for (let x = 0; x < 1024; x += 16) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 512)
      ctx.stroke()
    }

    // Dual-lane central divider
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 6
    ctx.setLineDash([24, 16])
    ctx.beginPath()
    ctx.moveTo(0, 256)
    ctx.lineTo(1024, 256)
    ctx.stroke()
    ctx.setLineDash([])

    // High-tech illuminated cyan chevron arrows (> > > >) on Lane 1
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let x = 32; x < 1024; x += 96) {
      ctx.beginPath()
      ctx.moveTo(x, 60)
      ctx.lineTo(x + 36, 130)
      ctx.lineTo(x, 200)
      ctx.stroke()
    }

    // Illuminated cyan chevron arrows (> > > >) on Lane 2
    for (let x = 32; x < 1024; x += 96) {
      ctx.beginPath()
      ctx.moveTo(x, 310)
      ctx.lineTo(x + 36, 380)
      ctx.lineTo(x, 450)
      ctx.stroke()
    }

    // Outer edge neon boundary lines
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(0, 12)
    ctx.lineTo(1024, 12)
    ctx.moveTo(0, 500)
    ctx.lineTo(1024, 500)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.repeat.set(24, 1)
    return tex
  }

  /**
   * Constructs the grand 56-meter wide conveyor catwalk platform
   */
  private buildRunwayStructure() {
    const width = this.trackLength + 0.8
    const depth = this.trackDepth
    const height = this.trackY

    // 1. Lower chassis frame (dark brushed metallic)
    const chassisGeo = new THREE.BoxGeometry(width, height, depth)
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x070c17,
      roughness: 0.35,
      metalness: 0.9,
    })
    const chassis = new THREE.Mesh(chassisGeo, chassisMat)
    chassis.position.set(0, height / 2, this.trackZ)
    this.group.add(chassis)

    // 2. Moving conveyor belt top surface
    const beltGeo = new THREE.PlaneGeometry(width - 0.2, depth - 0.3)
    const beltMesh = new THREE.Mesh(beltGeo, this.treadMaterial)
    beltMesh.rotation.x = -Math.PI / 2
    beltMesh.position.set(0, height + 0.006, this.trackZ)
    this.group.add(beltMesh)

    // 3. Side curb trims (bevelled cyber rails)
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.85,
    })
    const frontCurb = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 0.16), curbMat)
    frontCurb.position.set(0, height + 0.06, this.trackZ + depth / 2 - 0.08)
    this.group.add(frontCurb)

    const backCurb = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, 0.16), curbMat)
    backCurb.position.set(0, height + 0.06, this.trackZ - depth / 2 + 0.08)
    this.group.add(backCurb)

    // 4. Tempered glass balustrades (front & back)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.08,
      metalness: 0.2,
    })
    const glassH = 0.72
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, glassH, 0.03), glassMat)
    frontGlass.position.set(0, height + glassH / 2 + 0.08, this.trackZ + depth / 2 - 0.08)
    this.group.add(frontGlass)

    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, glassH, 0.03), glassMat)
    backGlass.position.set(0, height + glassH / 2 + 0.08, this.trackZ - depth / 2 + 0.08)
    this.group.add(backGlass)

    // 5. Glowing cyber handrails on top of glass
    const frontRailMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    })
    const frontRail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, width - 0.6, 16), frontRailMat)
    frontRail.rotation.z = Math.PI / 2
    frontRail.position.set(0, height + glassH + 0.08, this.trackZ + depth / 2 - 0.08)
    this.group.add(frontRail)

    const backRailMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })
    const backRail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, width - 0.6, 16), backRailMat)
    backRail.rotation.z = Math.PI / 2
    backRail.position.set(0, height + glassH + 0.08, this.trackZ - depth / 2 + 0.08)
    this.group.add(backRail)

    // 6. Cyan Underglow strip beneath the conveyor platform (spaced along 56m)
    for (const lx of [-24.0, -16.0, -8.0, 0, 8.0, 16.0, 24.0]) {
      const underglow = new THREE.PointLight(0x06b6d4, 1.1, 14)
      underglow.position.set(lx, 0.15, this.trackZ)
      this.group.add(underglow)
    }
  }

  /**
   * Builds grand portal gateway arches at the far left and right ends (x = ±28.4)
   */
  private buildPortalArches() {
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.9,
    })
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.8,
    })

    const makeArch = (xPos: number, isEntry: boolean) => {
      const g = new THREE.Group()
      g.position.set(xPos, 0, this.trackZ)

      // Left & right pillars
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 0.5), archMat)
      p1.position.set(0, 1.9, -1.75)
      g.add(p1)

      const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.8, 0.5), archMat)
      p2.position.set(0, 1.9, 1.75)
      g.add(p2)

      // Top crossbeam
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 3.9), archMat)
      top.position.set(0, 3.8, 0)
      g.add(top)

      // Neon portal border ring
      const ring1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.7, 0.08), glowMat)
      ring1.position.set(isEntry ? 0.2 : -0.2, 1.85, -1.7)
      g.add(ring1)

      const ring2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.7, 0.08), glowMat)
      ring2.position.set(isEntry ? 0.2 : -0.2, 1.85, 1.7)
      g.add(ring2)

      const topGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.5), glowMat)
      topGlow.position.set(isEntry ? 0.2 : -0.2, 3.6, 0)
      g.add(topGlow)

      // Portal indicator beacon light
      const beacon = new THREE.PointLight(isEntry ? 0x38bdf8 : 0x10b981, 1.6, 12)
      beacon.position.set(0, 3.4, 0)
      g.add(beacon)

      this.group.add(g)
    }

    makeArch(this.startX - 0.4, true)
    makeArch(this.endX + 0.4, false)
  }

  /**
   * Creates holographic text sprite badge floating above turntable
   */
  private createHoloBadge(title: string, sub: string, colorHex: string): THREE.Sprite {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'rgba(7, 13, 24, 0.90)'
    ctx.strokeStyle = colorHex
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(16, 16, 480, 96, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(title, 256, 56)

    ctx.fillStyle = colorHex
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(sub, 256, 88)

    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(2.4, 0.6, 1.0)
    return sprite
  }

  /**
   * Creates glowing neon physical slot number plaque on the front and rear of each plinth
   */
  private createSlotPlate(slotNum: string, colorHex: number, colorStr: string): THREE.Group {
    const group = new THREE.Group()

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#070d18'
    ctx.strokeStyle = colorStr
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.roundRect(8, 8, 240, 112, 14)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('RUNWAY', 128, 38)

    ctx.fillStyle = colorStr
    ctx.font = '900 52px monospace'
    ctx.fillText(`SLOT ${slotNum}`, 128, 92)

    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: colorHex,
      emissiveMap: tex,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.75,
    })

    const plateGeo = new THREE.BoxGeometry(0.72, 0.32, 0.04)

    // Front plate facing camera (+z)
    const frontMesh = new THREE.Mesh(plateGeo, mat)
    frontMesh.position.set(0, 0.16, 1.34)
    group.add(frontMesh)

    // Rear plate facing -z
    const rearMesh = new THREE.Mesh(plateGeo, mat)
    rearMesh.position.set(0, 0.16, -1.34)
    rearMesh.rotation.y = Math.PI
    group.add(rearMesh)

    return group
  }

  /**
   * Holographic standby reticle on the turntable surface
   */
  private createStandbyReticle(colorHex: number): THREE.Group {
    const g = new THREE.Group()
    const glowMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    })

    // Outer target ring
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.015, 8, 32), glowMat)
    ring1.rotation.x = Math.PI / 2
    ring1.position.y = 0.015
    g.add(ring1)

    // Inner target ring
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.012, 8, 24), glowMat)
    ring2.rotation.x = Math.PI / 2
    ring2.position.y = 0.015
    g.add(ring2)

    // Center crosshair pips
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      const pip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.01, 0.02), glowMat)
      pip.position.set(Math.cos(angle) * 0.65, 0.015, Math.sin(angle) * 0.65)
      pip.rotation.y = -angle
      g.add(pip)
    }

    return g
  }

  /**
   * Spawns the 8 exhibition pods spanning the 56m runway in clean standby mode
   */
  private createPods() {
    const podConfigs = [
      { num: '01', color: '#38bdf8', colorHex: 0x38bdf8 },
      { num: '02', color: '#06b6d4', colorHex: 0x06b6d4 },
      { num: '03', color: '#10b981', colorHex: 0x10b981 },
      { num: '04', color: '#f59e0b', colorHex: 0xf59e0b },
      { num: '05', color: '#eab308', colorHex: 0xeab308 },
      { num: '06', color: '#a855f7', colorHex: 0xa855f7 },
      { num: '07', color: '#ec4899', colorHex: 0xec4899 },
      { num: '08', color: '#38bdf8', colorHex: 0x38bdf8 },
    ]

    const spacing = this.trackLength / podConfigs.length
    podConfigs.forEach((cfg, i) => {
      const initialX = this.startX + 2.0 + i * spacing
      const podGroup = new THREE.Group()
      podGroup.position.set(initialX, this.trackY, this.trackZ)
      podGroup.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }

      // 1. Sleek wide circular plinth base (diameter 2.5m)
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.85,
      })
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.2, 32), plinthMat)
      plinth.position.y = 0.1
      plinth.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      podGroup.add(plinth)

      // Glowing neon ring around plinth
      const ringMat = new THREE.MeshStandardMaterial({
        color: cfg.colorHex,
        emissive: cfg.colorHex,
        emissiveIntensity: 2.6,
      })
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.03, 8, 36), ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.18
      ring.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      podGroup.add(ring)

      // Rotating Model Turntable
      const turntable = new THREE.Group()
      turntable.position.y = 0.2
      turntable.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      podGroup.add(turntable)

      // Standby holographic reticle on the turntable
      const reticle = this.createStandbyReticle(cfg.colorHex)
      turntable.add(reticle)

      // Glowing Physical Slot Number Plate on Plinth
      const slotPlate = this.createSlotPlate(cfg.num, cfg.colorHex, cfg.color)
      slotPlate.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      slotPlate.traverse((child) => {
        child.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      })
      podGroup.add(slotPlate)

      // Floating Hologram Badge with prominent Slot Number
      const title = `✦ [ SLOT ${cfg.num} ] STANDBY`
      const sub = '[ SIAP MENAMPUNG ASSET ]'
      const badge = this.createHoloBadge(title, sub, cfg.color)
      badge.position.set(0, 1.55, 0)
      badge.userData = { type: 'conveyorPod', podIndex: i, slotNum: cfg.num }
      podGroup.add(badge)

      // Overhead Spotlight illuminating model
      const spotlight = new THREE.SpotLight(cfg.colorHex, 2.0, 14, Math.PI / 3.2, 0.4)
      spotlight.position.set(0, 4.8, 0)
      spotlight.target = turntable
      podGroup.add(spotlight)
      podGroup.add(spotlight.target)

      this.group.add(podGroup)

      this.pods.push({
        group: podGroup,
        turntable,
        badge,
        spotlight,
        reticle,
        x: initialX,
        podIndex: i,
        colorHex: cfg.colorHex,
        colorStr: cfg.color,
        title,
        sub,
      })
    })
  }

  /**
   * Attaches a real 3D Object or GLB mesh to a specific pod
   */
  public attachAssetToPod(index: number, object: THREE.Object3D, title?: string, sub?: string) {
    const pod = this.pods[index]
    if (!pod) return

    if (pod.modelRoot) {
      pod.turntable.remove(pod.modelRoot)
    }
    object.userData = { type: 'conveyorPod', podIndex: index, slotNum: `0${index + 1}` }
    pod.modelRoot = object
    pod.turntable.add(object)

    // Calculate actual model top to position badge and overhead spotlight dynamically
    const box = new THREE.Box3().setFromObject(object)
    const modelHeight = Math.max(box.max.y, 2.8)
    pod.badgeBaseY = modelHeight + 0.65

    if (title || sub) {
      if (title) pod.title = title
      if (sub) pod.sub = sub
      pod.group.remove(pod.badge)
      pod.badge = this.createHoloBadge(pod.title, pod.sub, pod.colorStr)
      pod.badge.position.set(0, pod.badgeBaseY, 0)
      pod.group.add(pod.badge)
    }

    if (pod.spotlight) {
      pod.spotlight.position.set(0, modelHeight + 2.4, 0)
      pod.spotlight.distance = modelHeight + 6.0
    }
  }

  /**
   * Loads a GLB file directly onto a specific pod with grand visual scaling (default 3.0m),
   * with optional animation clip selection, speed multiplier, and shading mode.
   */
  public async loadGLBToPod(
    index: number,
    glbSource: string | File | Blob,
    title?: string,
    sub?: string,
    customTargetHeight?: number,
    clipName?: string,
    animSpeed?: number,
    shadingMode?: 'pbr' | 'wireframe' | 'clay' | 'normals'
  ) {
    const pod = this.pods[index]
    if (!pod) return

    try {
      // Default to 3.0m height: imposing, majestic, and fits the 2.5m turntable plinth beautifully!
      const targetHeight = customTargetHeight ?? 3.0
      const glb = await loadGLB(glbSource, {
        targetHeight,
        groundY: true,
        castShadow: true,
        receiveShadow: true,
      })

      if (pod.modelRoot) {
        pod.turntable.remove(pod.modelRoot)
      }
      if (pod.loadedGlb) {
        pod.loadedGlb.dispose()
      }

      pod.loadedGlb = glb
      glb.root.userData = { type: 'conveyorPod', podIndex: index, slotNum: `0${index + 1}` }
      pod.modelRoot = glb.root
      pod.turntable.add(glb.root)

      // Cache original mesh materials for non-destructive shading mode switching
      pod.origMaterials = new Map()
      glb.root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          if (mesh.material) {
            pod.origMaterials!.set(mesh, mesh.material)
          }
        }
      })

      // Setup Animation Action
      pod.isPlayingAnim = true
      pod.animSpeed = animSpeed ?? 1.0
      if (glb.animations.length > 0 && glb.actions.size > 0) {
        // Stop all other actions
        glb.actions.forEach(a => a.stop())

        let actionToPlay: THREE.AnimationAction | undefined
        if (clipName && glb.actions.has(clipName)) {
          actionToPlay = glb.actions.get(clipName)
          pod.currentClipName = clipName
        } else if (clipName) {
          // Fuzzy find by partial name
          for (const [name, act] of glb.actions.entries()) {
            if (name.toLowerCase().includes(clipName.toLowerCase())) {
              actionToPlay = act
              pod.currentClipName = name
              break
            }
          }
        }

        if (!actionToPlay) {
          // Default to walk, idle, or first available clip
          actionToPlay = glb.walkAction || glb.idleAction || Array.from(glb.actions.values())[0]
          pod.currentClipName = glb.animations[0]?.name || 'default'
        }

        if (actionToPlay) {
          actionToPlay.reset()
          actionToPlay.setEffectiveTimeScale(pod.animSpeed)
          actionToPlay.play()
        }
      }

      // Apply initial shading mode if requested
      if (shadingMode && shadingMode !== 'pbr') {
        this.setPodShadingMode(index, shadingMode)
      } else {
        pod.shadingMode = 'pbr'
      }

      // Calculate actual model top in pod space to float badge and position spotlight
      const box = new THREE.Box3().setFromObject(glb.root)
      const modelTopY = Math.max(box.max.y, targetHeight)
      pod.badgeBaseY = modelTopY + 0.65

      if (pod.spotlight) {
        pod.spotlight.position.set(0, modelTopY + 2.4, 0)
        pod.spotlight.distance = modelTopY + 6.0
      }

      if (title || sub) {
        const slotNumStr = `SLOT 0${index + 1}`
        let cleanTitle = title || 'CUSTOM ASSET'
        if (!cleanTitle.includes('SLOT')) {
          cleanTitle = `[ ${slotNumStr} ] ${cleanTitle.replace(/^✦\s*/, '')}`
        }
        pod.title = cleanTitle
        pod.sub = sub || '[ 360° LIVE ASSET ]'
        pod.group.remove(pod.badge)
        pod.badge = this.createHoloBadge(pod.title, pod.sub, pod.colorStr)
        pod.badge.position.set(0, pod.badgeBaseY, 0)
        pod.group.add(pod.badge)
      }
    } catch (err) {
      console.warn(`[AssetShowcaseConveyor] Failed to load GLB to pod ${index}:`, err)
    }
  }

  /**
   * Switches shading mode for a specific runway pod:
   * - 'pbr': Restores original realistic textures, normal maps, and diffuse materials
   * - 'wireframe': Cyber neon cyan/green wireframe topology
   * - 'clay': Studio clay/MatCap sculpt finish
   * - 'normals': RGB normal vector orientation
   */
  public setPodShadingMode(index: number, mode: 'pbr' | 'wireframe' | 'clay' | 'normals') {
    const pod = this.pods[index]
    if (!pod || !pod.loadedGlb || !pod.origMaterials) return

    pod.shadingMode = mode
    pod.loadedGlb.root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const original = pod.origMaterials!.get(mesh)
        if (!original) return

        if (mode === 'pbr') {
          mesh.material = original
        } else if (mode === 'wireframe') {
          mesh.material = new THREE.MeshBasicMaterial({
            color: pod.colorHex || 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.88,
          })
        } else if (mode === 'clay') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xd4d8e0,
            roughness: 0.65,
            metalness: 0.08,
            flatShading: false,
          })
        } else if (mode === 'normals') {
          mesh.material = new THREE.MeshNormalMaterial({
            wireframe: false,
          })
        }
      }
    })
  }

  /**
   * Switches active animation clip and speed on a specific runway pod
   */
  public setPodAnimation(index: number, clipName?: string, speed?: number) {
    const pod = this.pods[index]
    if (!pod || !pod.loadedGlb || !pod.loadedGlb.mixer) return

    if (typeof speed === 'number') {
      pod.animSpeed = Math.max(0.1, Math.min(3.0, speed))
    }

    if (clipName && pod.loadedGlb.actions.has(clipName)) {
      const glb = pod.loadedGlb
      glb.actions.forEach(a => a.fadeOut(0.2))
      const targetAction = glb.actions.get(clipName)!
      targetAction.reset()
      targetAction.setEffectiveTimeScale(pod.animSpeed ?? 1.0)
      targetAction.fadeIn(0.2).play()
      pod.currentClipName = clipName
      pod.isPlayingAnim = true
    } else if (speed !== undefined) {
      pod.loadedGlb.actions.forEach(a => a.setEffectiveTimeScale(speed))
    }
  }

  /**
   * Toggles play/pause for animations on a specific pod
   */
  public togglePodAnimation(index: number, isPlaying?: boolean) {
    const pod = this.pods[index]
    if (!pod || !pod.loadedGlb || !pod.loadedGlb.mixer) return

    pod.isPlayingAnim = isPlaying !== undefined ? isPlaying : !pod.isPlayingAnim
  }

  /**
   * Clears any model from a specific pod back to clean standby mode
   */
  public clearPod(index: number) {
    const pod = this.pods[index]
    if (!pod) return

    if (pod.modelRoot) {
      pod.turntable.remove(pod.modelRoot)
      pod.modelRoot = undefined
    }
    if (pod.loadedGlb) {
      pod.loadedGlb.dispose()
      pod.loadedGlb = undefined
    }
    if (pod.origMaterials) {
      pod.origMaterials.clear()
    }

    pod.shadingMode = 'pbr'
    pod.currentClipName = undefined
    pod.animSpeed = 1.0
    pod.isPlayingAnim = true

    pod.badgeBaseY = 1.55
    const slotNumStr = `SLOT 0${index + 1}`
    pod.title = `✦ [ ${slotNumStr} ] STANDBY`
    pod.sub = '[ AWAITING 3D ASSET ]'
    pod.group.remove(pod.badge)
    pod.badge = this.createHoloBadge(pod.title, pod.sub, pod.colorStr)
    pod.badge.position.set(0, 1.55, 0)
    pod.group.add(pod.badge)

    if (pod.spotlight) {
      pod.spotlight.position.set(0, 4.8, 0)
      pod.spotlight.distance = 14
    }
  }

  /**
   * Returns list of pods for external inspection
   */
  public getPods(): ShowcasePod[] {
    return this.pods
  }

  /**
   * Sets catwalk conveyor speed multiplier (0.1x to 4.0x)
   */
  public setSpeedMultiplier(multiplier: number) {
    this.beltSpeedMultiplier = Math.max(0.0, Math.min(5.0, multiplier))
    if (this.beltSpeedMultiplier > 0) {
      this.isBeltPaused = false
    }
  }

  /**
   * Toggles pause / resume for the catwalk conveyor belt
   */
  public togglePause(paused?: boolean): boolean {
    this.isBeltPaused = paused !== undefined ? paused : !this.isBeltPaused
    return this.isBeltPaused
  }

  /**
   * Sets belt movement direction: 1 = rightwards (+x), -1 = leftwards (-x)
   */
  public setDirection(dir: 1 | -1) {
    this.beltDirection = dir === -1 ? -1 : 1
  }

  /**
   * Toggles or adjusts 360° turntable spin
   */
  public setTurntableSpin(enabled: boolean, speedMultiplier = 1.0) {
    this.isTurntableSpinning = enabled
    this.turntableSpeedMultiplier = Math.max(0.1, Math.min(4.0, speedMultiplier))
  }

  /**
   * Returns current runway telemetric controls state
   */
  public getRunwayState() {
    return {
      beltSpeedMultiplier: this.beltSpeedMultiplier,
      isBeltPaused: this.isBeltPaused,
      beltDirection: this.beltDirection,
      isTurntableSpinning: this.isTurntableSpinning,
      turntableSpeedMultiplier: this.turntableSpeedMultiplier,
      effectiveSpeed: this.isBeltPaused ? 0 : this.beltSpeed * this.beltSpeedMultiplier * this.beltDirection
    }
  }

  /**
   * Applies 1-click curated exhibition presets
   */
  public async applyThemePreset(preset: 'mecha_expo' | 'fantasy_warlords' | 'clear_standby') {
    if (preset === 'clear_standby') {
      for (let i = 0; i < this.pods.length; i++) {
        this.clearPod(i)
      }
      return
    }

    if (preset === 'mecha_expo') {
      const mechaModels = [
        { path: '/models/uploads/gundam_3d_model.glb', title: 'GUNDAM RX-78 PRIME', sub: '[ MECHA EXPO - SLOT 01 ]', height: 3.2 },
        { path: '/models/uploads/gundam_3d_model_2_.glb', title: 'GUNDAM STRIKE UNIT 2', sub: '[ MECHA EXPO - SLOT 02 ]', height: 3.2 },
        { path: '/models/uploads/mecha_robot_3d_model_Clone1.glb', title: 'CYBER TITAN MECHA', sub: '[ MECHA EXPO - SLOT 03 ]', height: 3.0 },
        { path: '/models/uploads/red_mech_robot_3d_model.glb', title: 'RED APEX COMBAT MECH', sub: '[ MECHA EXPO - SLOT 04 ]', height: 3.4 },
      ]
      for (let i = 0; i < mechaModels.length; i++) {
        const m = mechaModels[i]
        await this.loadGLBToPod(i, m.path, m.title, m.sub, m.height, undefined, 1.0, 'pbr')
      }
    } else if (preset === 'fantasy_warlords') {
      const beastModels = [
        { path: '/models/uploads/fantasy_armored_warlord_3d_model.glb', title: 'ARMORED WARLORD', sub: '[ WARLORD EXPO - SLOT 05 ]', height: 3.0 },
        { path: '/models/uploads/robot_dragon_3d_model.glb', title: 'CYBER DRAGON COLOSSUS', sub: '[ BEAST EXPO - SLOT 06 ]', height: 3.5 },
      ]
      for (let i = 0; i < beastModels.length; i++) {
        const m = beastModels[i]
        await this.loadGLBToPod(4 + i, m.path, m.title, m.sub, m.height, undefined, 1.0, 'pbr')
      }
    }
  }

  /**
   * Main per-frame update loop called from scene.ts animation frame
   */
  public update(dt: number, totalTime: number) {
    const effectiveSpeed = this.isBeltPaused ? 0 : this.beltSpeed * this.beltSpeedMultiplier * this.beltDirection

    if (this.treadTexture && !this.isBeltPaused) {
      this.treadTexture.offset.x -= dt * 0.18 * this.beltSpeedMultiplier * this.beltDirection
    }

    this.pods.forEach((pod) => {
      pod.x += effectiveSpeed * dt

      // Seamless wrap-around for both forward and reverse runway motion
      if (effectiveSpeed > 0 && pod.x > this.endX) {
        pod.x = this.startX + (pod.x - this.endX)
      } else if (effectiveSpeed < 0 && pod.x < this.startX) {
        pod.x = this.endX - (this.startX - pod.x)
      }

      pod.group.position.x = pod.x

      // 360° Turntable Rotation
      if (this.isTurntableSpinning) {
        pod.turntable.rotation.y += dt * 0.75 * this.turntableSpeedMultiplier
      }

      const baseBadgeY = pod.badgeBaseY ?? (pod.modelRoot ? 3.65 : 1.55)
      pod.badge.position.y = baseBadgeY + Math.sin(totalTime * 2.2 + pod.x) * 0.04

      if (pod.loadedGlb && pod.loadedGlb.mixer && pod.isPlayingAnim !== false) {
        const speed = pod.animSpeed ?? 1.0
        pod.loadedGlb.mixer.update(dt * speed)
      }
    })
  }

  /**
   * Cleanup and dispose GPU resources
   */
  public dispose() {
    this.treadTexture.dispose()
    this.treadMaterial.dispose()
    this.pods.forEach((p) => {
      if (p.loadedGlb) {
        p.loadedGlb.dispose()
      }
    })
  }
}
