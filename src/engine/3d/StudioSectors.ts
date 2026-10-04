/**
 * StudioSectors.ts - Comprehensive High-Tech Partitioned Sectors (Ruangan Sekat-Sekat)
 *
 * Fully utilizes the entire 68m x 52m Grand Cyber Game Studio & Production Floor (x: -34 to +34, z: -26 to +26):
 *
 * 1. SEKTOR 01 (x: -33 to -14, z: -25 to -9): ARSENAL & WEAPON R&D LAB (Ruang Senjata)
 *    - 3-Lane High-Tech Firing Range with laser guide lines, distance decals, target reticles.
 *    - Magnetic weapon racks with modular sci-fi firearms (Railguns, Plasma Rifles, Blades).
 *    - Heavy weapon calibration workbench with rotating holographic schematics & ammo crates.
 *
 * 2. SEKTOR 02 (x: -33 to -14, z: -9 to +8): EXO-ARMOR & MECHA WORKSHOP (Ruang Armor & Mecha)
 *    - 6.5m Hydraulic Lift Turntable with hazard stripes and perimeter cyan rim lighting.
 *    - Overhead Industrial Gantry Crane with electric hoist trolley and heavy cables.
 *    - 2 Power Armor Rigging Stanchions with hydraulic clamp arms and diagnostic umbilicals.
 *    - Mecha engineering command console with multi-screen diagnostics & tool chests.
 *
 * 3. SEKTOR 03 (x: -14 to +14, z: -26 to -17): 3D GLB AVATAR VAULT & PRODUCTION WALL
 *    - Master 9-screen video wall, central stasis scanner podium with holographic emitters.
 *
 * 4. SEKTOR 04 (x: -33 to -14, z: +8 to +24): AUTONOMOUS DRONES & VEHICLE HANGAR (Ruang Drone & Wahana)
 *    - 2 Elevated Hexagonal Drone Landing/Launch Pads with glowing green chevrons and "H" markings.
 *    - Drone flight test safety cage with laser mesh boundaries.
 *    - 4 automated vertical induction fast-charging pylons with LED level gauges.
 *    - Flight telemetry radar workstation with dual flight joysticks & avionics benches.
 *
 * 5. SEKTOR 05 (x: +14 to +33, z: +8 to +24): QUANTUM CORE & VFX PARTICLE LAB (Ruang Reaktor & Core FX)
 *    - Tokamak Magnetic Containment Fusion Reactor with rotating, pulsing violet plasma core.
 *    - High-voltage energy busway conduits and cryogenic liquid cooling pipes.
 *    - VFX particle simulation bench with laser optics, prisms, and holographic beam splitters.
 *    - High-density 4-rack GPU compute supercluster with liquid reservoir tanks.
 *    - Chemical/Radiation decontamination airlock station.
 *
 * 6. CYBER PLAYTEST ARENA & CREW ESPRESSO LOUNGE (x: -14 to +14, z: +8 to +24):
 *    - 4-station Pro Gaming Esports Battlestations with curved RGB monitors & liquid-cooled PCs.
 *    - 3 Retro Cyber Arcade Machines with glowing marquees (Cyber Strike, Mecha Force, Space Pilot).
 *    - VR Immersion Simulator Holo-Pod with circular omnidirectional treadmill ring.
 *    - Cyber Studio Crew Espresso & Refreshment Bar with quartz counter, chrome espresso machine & bar stools.
 *    - Chill-out curved lounge sofa, glass coffee table, and ambient uplighting.
 *
 * 7. EXECUTIVE WAR ROOM & MISSION STRATEGY HUB (x: +14 to +33, z: -25 to +8):
 *    - Rotating 3D Holographic Global Threat/Terrain Map projecting above conference table.
 *    - 4-Screen Mission Presentation Video Wall (DEFCON status, satellite feeds, server loads).
 *    - Briefing podium with interactive touch holographic display.
 */

import * as THREE from 'three'

export class StudioSectors {
  public group: THREE.Group
  private animatedProps: { mesh: THREE.Object3D; update: (dt: number, t: number) => void }[] = []

  constructor() {
    this.group = new THREE.Group()
    this.group.name = 'StudioSectors'

    this.buildPartitionWalls()
    this.buildSector01Arsenal()
    this.buildSector02ExoArmor()
    this.buildSector03CenterVault()
    this.buildSector04DroneHangar()
    this.buildSector05QuantumLab()
    this.buildCyberArenaAndLounge()
    this.buildWarRoomEnhancements()
  }

  /* ------------------------------------------------------------- 0. UTILITIES -- */

  /**
   * Generates crisp canvas neon signboards
   */
  private createNeonSign(
    title: string,
    colorHexStr: string,
    colorHex: number,
    w = 4.8,
    h = 0.9,
    pos: THREE.Vector3 = new THREE.Vector3(),
    rotY = 0,
    sectorId?: string
  ) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 100
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'rgba(7, 13, 24, 0.95)'
    ctx.strokeStyle = colorHexStr
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(8, 8, 496, 84, 12)
    ctx.fill()
    ctx.stroke()

    // Inner subtle glow border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(14, 14, 484, 72)

    ctx.fillStyle = colorHexStr
    ctx.font = 'bold 22px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, 256, 50)

    const tex = new THREE.CanvasTexture(canvas)
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.96 })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    plane.position.copy(pos)
    plane.rotation.y = rotY
    if (sectorId) {
      plane.userData = { type: 'sectorShowcase', sectorId }
    }
    this.group.add(plane)

    // Double sided back plate
    const backMat = new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.9, roughness: 0.2 })
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.06), backMat)
    backPlate.position.copy(pos)
    backPlate.rotation.y = rotY
    if (sectorId) {
      backPlate.userData = { type: 'sectorShowcase', sectorId }
    }
    this.group.add(backPlate)

    // Dedicated entrance downlight
    const light = new THREE.PointLight(colorHex, 0.85, 9)
    light.position.set(pos.x, pos.y - 0.4, pos.z)
    this.group.add(light)
  }

  /**
   * Generates yellow/black diagonal hazard stripes canvas texture
   */
  private createHazardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, 256, 64)

    ctx.fillStyle = '#f59e0b'
    const stripeW = 32
    for (let x = -64; x < 320; x += stripeW * 2) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + stripeW, 0)
      ctx.lineTo(x + stripeW - 32, 64)
      ctx.lineTo(x - 32, 64)
      ctx.closePath()
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  }

  /* --------------------------------------------------- 1. PARTITION WALLS -- */

  /**
   * Builds glass architectural dividing walls, entrance portals & illuminated headers
   */
  private buildPartitionWalls() {
    const wallH = 4.2
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.1,
    })

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.9,
    })

    const neonSeam = (color: number) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.2,
      })

    // Helper to construct a wall with a centered doorway opening
    const buildWallWithDoor = (
      p1: { x: number; z: number },
      p2: { x: number; z: number },
      doorCenter: { x: number; z: number },
      doorWidth: number,
      signTitle: string,
      signColorStr: string,
      signColorHex: number,
      rotY: number,
      sectorId?: string
    ) => {
      const isAlongX = Math.abs(p2.z - p1.z) < 0.1
      const totalLen = isAlongX ? Math.abs(p2.x - p1.x) : Math.abs(p2.z - p1.z)
      const minVal = isAlongX ? Math.min(p1.x, p2.x) : Math.min(p1.z, p2.z)
      const maxVal = isAlongX ? Math.max(p1.x, p2.x) : Math.max(p1.z, p2.z)
      const doorCoord = isAlongX ? doorCenter.x : doorCenter.z
      const d1 = doorCoord - doorWidth / 2
      const d2 = doorCoord + doorWidth / 2

      // Segment 1: from minVal to d1
      const len1 = d1 - minVal
      if (len1 > 0.5) {
        const c1 = minVal + len1 / 2
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(isAlongX ? len1 : 0.08, wallH, isAlongX ? 0.08 : len1),
          glassMat
        )
        glass.position.set(isAlongX ? c1 : p1.x, wallH / 2, isAlongX ? p1.z : c1)
        this.group.add(glass)
      }

      // Segment 2: from d2 to maxVal
      const len2 = maxVal - d2
      if (len2 > 0.5) {
        const c2 = d2 + len2 / 2
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(isAlongX ? len2 : 0.08, wallH, isAlongX ? 0.08 : len2),
          glassMat
        )
        glass.position.set(isAlongX ? c2 : p1.x, wallH / 2, isAlongX ? p1.z : c2)
        this.group.add(glass)
      }

      // Top lintel beam over the entire span
      const topBeam = new THREE.Mesh(
        new THREE.BoxGeometry(isAlongX ? totalLen : 0.3, 0.35, isAlongX ? 0.3 : totalLen),
        frameMat
      )
      topBeam.position.set(
        isAlongX ? (p1.x + p2.x) / 2 : p1.x,
        wallH + 0.15,
        isAlongX ? p1.z : (p1.z + p2.z) / 2
      )
      this.group.add(topBeam)

      // Doorway portal frame pillars
      for (const offset of [-doorWidth / 2, doorWidth / 2]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH + 0.2, 0.3), frameMat)
        col.position.set(
          isAlongX ? doorCoord + offset : p1.x,
          (wallH + 0.2) / 2,
          isAlongX ? p1.z : doorCoord + offset
        )
        this.group.add(col)

        // Glowing vertical portal light stripe
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(isAlongX ? 0.08 : 0.32, wallH, isAlongX ? 0.32 : 0.08),
          neonSeam(signColorHex)
        )
        strip.position.set(
          isAlongX ? doorCoord + offset : p1.x,
          wallH / 2,
          isAlongX ? p1.z : doorCoord + offset
        )
        this.group.add(strip)
      }

      // Signboard above portal
      this.createNeonSign(
        signTitle,
        signColorStr,
        signColorHex,
        doorWidth - 0.4,
        0.85,
        new THREE.Vector3(doorCenter.x, wallH + 0.2, doorCenter.z),
        rotY,
        sectorId
      )
    }

    // 1. Partition dividing Sector 01 (Arsenal) and Sector 02 (Mecha Bay) at z = -9.0
    // Spans from x: -33.5 to -14.0, doorway at x = -24.0 (width: 4.6m)
    buildWallWithDoor(
      { x: -33.5, z: -9.0 },
      { x: -14.0, z: -9.0 },
      { x: -24.0, z: -9.0 },
      4.6,
      '[ SEKTOR 01 // ARSENAL & WEAPON R&D ]',
      '#f59e0b',
      0xf59e0b,
      0,
      'weapon'
    )

    // 2. Partition dividing Sector 02 (Mecha Bay) and Sector 04 (Drone Hangar) at z = +8.0
    // Spans from x: -33.5 to -14.0, doorway at x = -24.0 (width: 4.6m)
    buildWallWithDoor(
      { x: -33.5, z: 8.0 },
      { x: -14.0, z: 8.0 },
      { x: -24.0, z: 8.0 },
      4.6,
      '[ SEKTOR 02 // EXO-ARMOR & MECHA BAY ]',
      '#eab308',
      0xeab308,
      0,
      'mecha'
    )

    // 3. Partition dividing Sector 04 (Drone Hangar) and South-Center (Cyber Arena) at x = -14.0
    // Spans from z: +8.0 to +25.5, doorway at z = 16.5 (width: 4.6m)
    buildWallWithDoor(
      { x: -14.0, z: 8.0 },
      { x: -14.0, z: 25.5 },
      { x: -14.0, z: 16.5 },
      4.6,
      '[ SEKTOR 04 // VEHICLE & DRONE HANGAR ]',
      '#10b981',
      0x10b981,
      Math.PI / 2,
      'drone'
    )

    // 4. Partition dividing South-Center (Cyber Arena) and Sector 05 (Quantum Lab) at x = +14.0
    // Spans from z: +8.0 to +25.5, doorway at z = 16.5 (width: 4.6m)
    buildWallWithDoor(
      { x: 14.0, z: 8.0 },
      { x: 14.0, z: 25.5 },
      { x: 14.0, z: 16.5 },
      4.6,
      '[ SEKTOR 05 // QUANTUM CORE & VFX LAB ]',
      '#c084fc',
      0xc084fc,
      -Math.PI / 2,
      'quantum'
    )

    // 5. Partition dividing Sector 05 (Quantum Lab) and East War Room at z = +8.0
    // Spans from x: +14.0 to +33.5, doorway at x = +24.0 (width: 4.6m)
    buildWallWithDoor(
      { x: 14.0, z: 8.0 },
      { x: 33.5, z: 8.0 },
      { x: 24.0, z: 8.0 },
      4.6,
      '[ SEKTOR 05 // HIGH-ENERGY CONDUIT VAULT ]',
      '#818cf8',
      0x818cf8,
      0,
      'quantum'
    )

    // 6. South-Center Cyber Arena Portal Sign (facing north toward command hall)
    this.createNeonSign(
      '[ CYBER PLAYTEST ARENA & ESPRESSO LOUNGE ]',
      '#38bdf8',
      0x38bdf8,
      6.4,
      0.9,
      new THREE.Vector3(0, wallH + 0.2, 8.0),
      0
    )
  }

  /* --------------------------------------------------------- 2. SEKTOR 01: ARSENAL -- */

  /**
   * SEKTOR 01: ARSENAL & WEAPON R&D LAB (x: -33 to -14, z: -25 to -9)
   */
  private buildSector01Arsenal() {
    const g = new THREE.Group()
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 })
    const gunMetalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 })
    const orangeNeon = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 2.8 })
    const redLaser = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })

    /* ---- A. 3-Lane Target Firing Range (x: -32 to -22, z: -24 to -12) ---- */
    const lanesZ = [-22.5, -17.5, -12.5]

    lanesZ.forEach((lz, idx) => {
      // 1. Shooting Booth Partition Glass Dividers
      const divider = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 2.2, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.25 })
      )
      divider.position.set(-20.0, 1.1, lz + 2.4)
      g.add(divider)

      // Booth firing bench
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.05, 0.6), steelMat)
      bench.position.set(-18.5, 0.52, lz)
      g.add(bench)

      // Digital touch control terminal on firing bench
      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04), orangeNeon)
      monitor.position.set(-18.5, 1.25, lz)
      monitor.rotation.y = -Math.PI / 2
      g.add(monitor)

      // Laser guide line on floor stretching to the target wall
      const laserTrack = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.02, 0.06), redLaser)
      laserTrack.position.set(-25.5, 0.015, lz)
      g.add(laserTrack)

      // Distance floor decals (5M, 10M, 15M)
      for (let dist = 5; dist <= 15; dist += 5) {
        const decal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.8), orangeNeon)
        decal.position.set(-18.5 - dist * 0.9, 0.016, lz)
        g.add(decal)
      }

      // 2. Reactive Target Reticle & Silhouette on West Wall (x = -33.6)
      const targetPlate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.4), gunMetalMat)
      targetPlate.position.set(-33.5, 1.8, lz)
      g.add(targetPlate)

      // Concentric glowing target rings
      for (const r of [0.5, 0.3, 0.12]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 24), orangeNeon)
        ring.rotation.y = Math.PI / 2
        ring.position.set(-33.4, 1.8, lz)
        g.add(ring)
      }

      // Animated pulsing target spotlight
      const spot = new THREE.PointLight(0xf59e0b, 0.6, 6)
      spot.position.set(-32.0, 2.8, lz)
      g.add(spot)
    })

    /* ---- B. Heavy Weapon Wall Display Vaults (Along North Wall at z = -25.2) ---- */
    const rackWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 3.2, 0.2), gunMetalMat)
    rackWall.position.set(-24.0, 2.0, -25.3)
    g.add(rackWall)

    // 4 Horizontal illuminated mounting rails
    for (let row = 0; row < 4; row++) {
      const y = 1.0 + row * 0.7
      const rail = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.08, 0.06), orangeNeon)
      rail.position.set(-24.0, y, -25.18)
      g.add(rail)
    }

    // Procedural Mounted Weapons: Heavy Railguns, Carbines, Plasma Blades
    for (let i = 0; i < 6; i++) {
      const wx = -30.0 + i * 2.4
      const wy = 1.7 + (i % 2) * 0.7

      const weaponGroup = new THREE.Group()
      weaponGroup.position.set(wx, wy, -25.1)

      // Gun Receiver & Barrel
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.08), steelMat)
      weaponGroup.add(receiver)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 10), gunMetalMat)
      barrel.rotation.z = Math.PI / 2
      barrel.position.set(0.65, 0.02, 0)
      weaponGroup.add(barrel)
      const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.06), orangeNeon)
      magazine.position.set(0.1, -0.16, 0)
      weaponGroup.add(magazine)
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 10), gunMetalMat)
      scope.rotation.z = Math.PI / 2
      scope.position.set(0.05, 0.16, 0)
      weaponGroup.add(scope)

      g.add(weaponGroup)
    }

    /* ---- C. Central Weapon Calibration & Gunsmith Workbench (x: -17.5, z: -18) ---- */
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 1.4), steelMat)
    bench.position.set(-17.5, 0.47, -18.0)
    bench.userData = { type: 'sectorShowcase', sectorId: 'weapon' }
    g.add(bench)

    // Holographic exploded weapon blueprint emitter in center
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.02, 8, 32), orangeNeon)
    holoRing.rotation.x = Math.PI / 2
    holoRing.position.set(-17.5, 1.1, -18.0)
    holoRing.userData = { type: 'sectorShowcase', sectorId: 'weapon' }
    g.add(holoRing)
    this.animatedProps.push({
      mesh: holoRing,
      update: (dt, t) => {
        holoRing.rotation.z = t * 0.8
        holoRing.position.y = 1.1 + Math.sin(t * 2) * 0.04
      },
    })

    /* ---- D. Ammunition & Power Core Stacks (x: -17.5, z: -12) ---- */
    for (let i = 0; i < 6; i++) {
      const cx = -18.5 + (i % 2) * 0.9
      const cz = -12.5 + Math.floor(i / 2) * 0.85
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.75), gunMetalMat)
      crate.position.set(cx, 0.32, cz)
      g.add(crate)

      const band = new THREE.Mesh(new THREE.BoxGeometry(0.77, 0.12, 0.77), orangeNeon)
      band.position.set(cx, 0.32, cz)
      g.add(band)
    }

    this.group.add(g)
  }

  /* --------------------------------------------------------- 3. SEKTOR 02: EXO-ARMOR -- */

  /**
   * SEKTOR 02: EXO-ARMOR & MECHA BAY (x: -33 to -14, z: -9 to +8)
   */
  private buildSector02ExoArmor() {
    const g = new THREE.Group()
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 })
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.25, metalness: 0.85 })
    const cyanLight = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 })

    /* ---- A. 6.5m Hydraulic Lift Turntable (x: -24.0, z: -0.5) ---- */
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.35, 0.25, 36), steelMat)
    turntable.position.set(-24.0, 0.125, -0.5)
    turntable.userData = { type: 'sectorShowcase', sectorId: 'mecha' }
    g.add(turntable)

    // Outer Hazard Warning Striped Rim
    const hazardMat = new THREE.MeshBasicMaterial({ map: this.createHazardTexture() })
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.26, 36, 1, true), hazardMat)
    rim.position.set(-24.0, 0.13, -0.5)
    rim.userData = { type: 'sectorShowcase', sectorId: 'mecha' }
    g.add(rim)

    // Glowing cyan perimeter ring
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.04, 8, 48), cyanLight)
    glowRing.rotation.x = Math.PI / 2
    glowRing.position.set(-24.0, 0.26, -0.5)
    glowRing.userData = { type: 'sectorShowcase', sectorId: 'mecha' }
    g.add(glowRing)

    // 4 Hydraulic Lifting Pistons around turntable perimeter
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const px = -24.0 + Math.cos(a) * 3.45
      const pz = -0.5 + Math.sin(a) * 3.45

      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 16), goldMat)
      piston.position.set(px, 0.6, pz)
      g.add(piston)

      const innerShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16), steelMat)
      innerShaft.position.set(px, 1.1, pz)
      g.add(innerShaft)
    }

    /* ---- B. Heavy Overhead Industrial Gantry Crane ---- */
    // Dual yellow I-Beams spanning across the ceiling at y = 5.2 from x = -33.5 to -14.5
    for (const bz of [-2.0, 1.0]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(19.0, 0.45, 0.35), goldMat)
      beam.position.set(-24.0, 5.2, bz)
      g.add(beam)
    }

    // Crane Trolley Carriage with hoist hook suspended over the turntable
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.4), steelMat)
    trolley.position.set(-24.0, 5.0, -0.5)
    g.add(trolley)

    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), steelMat)
    cable.position.set(-24.0, 3.8, -0.5)
    g.add(cable)

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 18, Math.PI * 1.5), goldMat)
    hook.position.set(-24.0, 2.6, -0.5)
    g.add(hook)

    /* ---- C. 2 Exo-Suit Power Armor Staging Stanchions (x: -17.5, z: -4.5 and +3.5) ---- */
    for (const sz of [-4.5, 3.5]) {
      const stanchion = new THREE.Group()
      stanchion.position.set(-17.5, 0, sz)

      // Heavy mounting base
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.8), steelMat)
      base.position.y = 0.125
      stanchion.add(base)

      // Vertical spine tower
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 0.35), goldMat)
      spine.position.set(0, 1.9, -0.7)
      stanchion.add(spine)

      // Articulated hydraulic clamp arms
      for (const armY of [1.6, 2.4]) {
        const clamp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), steelMat)
        clamp.position.set(0, armY, -0.2)
        stanchion.add(clamp)
      }

      // Procedural Exo-Suit Chestplate & Torso Frame
      const armorTorso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.55), steelMat)
      armorTorso.position.set(0, 1.8, 0)
      stanchion.add(armorTorso)

      // Reactor arc core in chest
      const arcReactor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), cyanLight)
      arcReactor.rotation.x = Math.PI / 2
      arcReactor.position.set(0, 1.95, 0.28)
      stanchion.add(arcReactor)

      g.add(stanchion)
    }

    /* ---- D. Mecha Diagnostics & Engineering Console (x: -30.5, z: -0.5) ---- */
    const consoleDesk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 3.8), steelMat)
    consoleDesk.position.set(-30.5, 0.47, -0.5)
    g.add(consoleDesk)

    // Triple Diagnostic Monitors
    for (let mi = -1; mi <= 1; mi++) {
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.9), cyanLight)
      mon.position.set(-30.3, 1.3, -0.5 + mi * 1.05)
      mon.rotation.y = mi * 0.18
      g.add(mon)
    }

    // Heavy tool chest with chrome drawers
    const toolChest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
    toolChest.position.set(-30.5, 0.6, 2.4)
    g.add(toolChest)

    this.group.add(g)
  }

  /* --------------------------------------------------------- 4. SEKTOR 03: CENTER VAULT -- */

  /**
   * SEKTOR 03: 3D GLB AVATAR VAULT (x: -14 to +14, z: -26 to -17)
   */
  private buildSector03CenterVault() {
    const g = new THREE.Group()
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.9, roughness: 0.2 })
    const cyanNeon = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 })

    // Central Stasis Hologram Scanner Podium (in front of Master Video Wall)
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.25, 32), steelMat)
    stage.position.set(0, 0.12, -23.2)
    g.add(stage)

    // Concentric glowing stasis scanner rings
    for (const r of [1.6, 2.2]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 36), cyanNeon)
      ring.rotation.x = Math.PI / 2
      ring.position.set(0, 0.26, -23.2)
      g.add(ring)
    }

    // 4 Vertical holographic projector pillars
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const px = Math.cos(a) * 2.1
      const pz = -23.2 + Math.sin(a) * 2.1

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 12), steelMat)
      post.position.set(px, 1.1, pz)
      g.add(post)

      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cyanNeon)
      emitter.position.set(px, 2.2, pz)
      g.add(emitter)
    }

    this.group.add(g)
  }

  /* --------------------------------------------------------- 5. SEKTOR 04: DRONES -- */

  /**
   * SEKTOR 04: AUTONOMOUS DRONES & VEHICLE HANGAR (x: -33 to -14, z: +8 to +24)
   */
  private buildSector04DroneHangar() {
    const g = new THREE.Group()
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.3 })
    const greenNeon = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 2.8 })
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 })

    /* ---- A. 2 Elevated Hexagonal Drone Launch / Landing Pads ---- */
    const pads = [
      { x: -25.5, z: 14.0 },
      { x: -19.0, z: 20.5 },
    ]

    pads.forEach((pos, idx) => {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.3, 6), carbonMat)
      pad.position.set(pos.x, 0.15, pos.z)
      pad.userData = { type: 'sectorShowcase', sectorId: 'drone' }
      g.add(pad)

      const padBorder = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.04, 6, 6), greenNeon)
      padBorder.rotation.x = Math.PI / 2
      padBorder.position.set(pos.x, 0.31, pos.z)
      padBorder.userData = { type: 'sectorShowcase', sectorId: 'drone' }
      g.add(padBorder)

      // Landing "H" decal on pad surface
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 1.6), greenNeon)
      h1.position.set(pos.x - 0.5, 0.31, pos.z)
      g.add(h1)
      const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 1.6), greenNeon)
      h2.position.set(pos.x + 0.5, 0.31, pos.z)
      g.add(h2)
      const hMid = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.02, 0.16), greenNeon)
      hMid.position.set(pos.x, 0.31, pos.z)
      g.add(hMid)

      // Dedicated corner beacon light
      const beacon = new THREE.PointLight(0x10b981, 0.8, 8)
      beacon.position.set(pos.x, 1.8, pos.z)
      g.add(beacon)
    })

    /* ---- B. Procedural Prototype Drone resting on Pad 1 ---- */
    const droneGroup = new THREE.Group()
    droneGroup.position.set(-25.5, 0.7, 14.0)

    // Drone central body pod
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.65), carbonMat)
    droneGroup.add(body)
    const sensorEye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), greenNeon)
    sensorEye.position.set(0, -0.08, 0.32)
    droneGroup.add(sensorEye)

    // 4 Quadcopter Arms & Rotors
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), carbonMat)
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = a
      arm.position.set(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45)
      droneGroup.add(arm)

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), steelMat)
      motor.position.set(Math.cos(a) * 0.85, 0.07, Math.sin(a) * 0.85)
      droneGroup.add(motor)

      const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.015, 0.06), greenNeon)
      rotor.position.set(Math.cos(a) * 0.85, 0.15, Math.sin(a) * 0.85)
      droneGroup.add(rotor)
    }

    g.add(droneGroup)

    /* ---- C. 4 Automated Fast-Charging Pylons along West Wall (x = -33.2) ---- */
    for (let i = 0; i < 4; i++) {
      const pz = 11.0 + i * 2.2
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.2, 0.5), steelMat)
      pylon.position.set(-33.2, 1.1, pz)
      g.add(pylon)

      // Glowing LED charge level gauges
      for (let bar = 0; bar < 4; bar++) {
        const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.35), greenNeon)
        gauge.position.set(-33.0, 0.8 + bar * 0.25, pz)
        g.add(gauge)
      }
    }

    /* ---- D. Flight Telemetry & Airspace Radar Workstation (x: -18.0, z: 12.0) ---- */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 3.2), carbonMat)
    desk.position.set(-18.0, 0.47, 12.0)
    g.add(desk)

    // Curved Flight Radar Displays
    for (let mi = -1; mi <= 1; mi++) {
      const mon = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.85), greenNeon)
      mon.position.set(-17.8, 1.3, 12.0 + mi * 0.95)
      mon.rotation.y = mi * 0.2
      g.add(mon)
    }

    this.group.add(g)
  }

  /* --------------------------------------------------------- 6. SEKTOR 05: QUANTUM LAB -- */

  /**
   * SEKTOR 05: QUANTUM CORE & VFX PARTICLE LAB (x: +14 to +33, z: +8 to +24)
   */
  private buildSector05QuantumLab() {
    const g = new THREE.Group()
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.95, roughness: 0.15 })
    const purpleNeon = new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 3.2 })
    const blueGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38 })

    /* ---- A. Tokamak Magnetic Containment Fusion Reactor (x: 24.0, z: 16.5) ---- */
    const corePos = new THREE.Vector3(24.0, 0, 16.5)

    // Reactor stepped pedestal base
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.4, 32), steelMat)
    base1.position.set(corePos.x, 0.2, corePos.z)
    base1.userData = { type: 'sectorShowcase', sectorId: 'quantum' }
    g.add(base1)

    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.4, 32), steelMat)
    base2.position.set(corePos.x, 0.6, corePos.z)
    base2.userData = { type: 'sectorShowcase', sectorId: 'quantum' }
    g.add(base2)

    // Central Quartz Containment Vessel
    const quartzCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 3.0, 32, 1, true),
      blueGlass
    )
    quartzCylinder.position.set(corePos.x, 2.3, corePos.z)
    quartzCylinder.userData = { type: 'sectorShowcase', sectorId: 'quantum' }
    g.add(quartzCylinder)

    // Rotating Magnetic Tokamak Ring
    const plasmaRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.12, 16, 48), purpleNeon)
    plasmaRing.rotation.x = Math.PI / 2
    plasmaRing.position.set(corePos.x, 2.3, corePos.z)
    plasmaRing.userData = { type: 'sectorShowcase', sectorId: 'quantum' }
    g.add(plasmaRing)
    this.animatedProps.push({
      mesh: plasmaRing,
      update: (dt, t) => {
        plasmaRing.rotation.z = t * 1.5
        plasmaRing.position.y = 2.3 + Math.sin(t * 3) * 0.1
      },
    })

    // Pulsing Core Plasma Sphere
    const plasmaCore = new THREE.Mesh(new THREE.SphereGeometry(0.65, 24, 24), purpleNeon)
    plasmaCore.position.set(corePos.x, 2.3, corePos.z)
    g.add(plasmaCore)

    // Top Magnetic Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.1, 0.5, 32), steelMat)
    cap.position.set(corePos.x, 4.0, corePos.z)
    g.add(cap)

    // Reactor Core Glow Light
    const coreLight = new THREE.PointLight(0xc084fc, 1.8, 14)
    coreLight.position.set(corePos.x, 2.3, corePos.z)
    g.add(coreLight)

    /* ---- B. High-Density 4-Rack GPU Compute Supercluster (x: 30.5, z: 11 to 19) ---- */
    for (let r = 0; r < 4; r++) {
      const rz = 11.5 + r * 2.2
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 0.9), steelMat)
      rack.position.set(30.5, 1.4, rz)
      g.add(rack)

      // Blinking status LEDs on rack faces
      for (let l = 0; l < 6; l++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.65), purpleNeon)
        led.position.set(29.93, 0.6 + l * 0.35, rz)
        g.add(led)
      }
    }

    /* ---- C. VFX Particle Simulation & Laser Optics Bench (x: 18.0, z: 11.5) ---- */
    const opticsBench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 1.4), steelMat)
    opticsBench.position.set(18.0, 0.47, 11.5)
    g.add(opticsBench)

    // Laser Prism & Beam Splitters
    const prism = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.45, 3), purpleNeon)
    prism.position.set(18.0, 1.15, 11.5)
    g.add(opticsBench)

    this.group.add(g)
  }

  /* --------------------------------------------------------- 7. CYBER ARENA & LOUNGE -- */

  /**
   * CYBER PLAYTEST ARENA, PRO BATTLESTATIONS & CREW ESPRESSO LOUNGE (x: -14 to +14, z: +8 to +24)
   */
  private buildCyberArenaAndLounge() {
    const g = new THREE.Group()
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 })
    const cyanNeon = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.5 })
    const magentaNeon = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 2.5 })

    /* ---- A. 4-Station Pro Gaming / Playtest Battlestations (x: -9 to -2, z: 12 to 16) ---- */
    for (let station = 0; station < 4; station++) {
      const sx = -8.5 + (station % 2) * 4.2
      const sz = 12.5 + Math.floor(station / 2) * 3.5

      // Gaming Desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.76, 1.1), deskMat)
      desk.position.set(sx, 0.38, sz)
      g.add(desk)

      // Dual Curved 34" Gaming Monitors
      for (const mx of [-0.55, 0.55]) {
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), cyanNeon)
        mon.position.set(sx + mx, 1.05, sz - 0.25)
        mon.rotation.y = mx > 0 ? -0.15 : 0.15
        g.add(mon)
      }

      // Liquid-Cooled RGB PC Tower
      const pc = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.6), deskMat)
      pc.position.set(sx + 0.95, 1.05, sz)
      g.add(pc)
      const pcLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.5), magentaNeon)
      pcLed.position.set(sx + 0.8, 1.05, sz)
      g.add(pcLed)

      // Ergonomic Pro Gaming Chair
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 0.65), deskMat)
      chair.position.set(sx, 0.62, sz + 0.65)
      g.add(chair)
    }

    /* ---- B. 3 Retro Cyber Arcade Machines (x: 8.5 to 12.5, z: 11 to 17) ---- */
    const arcadeThemes = [
      { name: 'CYBER STRIKE', col: 0x38bdf8, z: 11.5 },
      { name: 'MECHA FORCE', col: 0xf59e0b, z: 13.8 },
      { name: 'SPACE PILOT', col: 0xa855f7, z: 16.1 },
    ]

    arcadeThemes.forEach((arc) => {
      const arcMat = new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.8, roughness: 0.3 })
      const screenMat = new THREE.MeshStandardMaterial({ color: arc.col, emissive: arc.col, emissiveIntensity: 2.2 })

      // Main cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.95), arcMat)
      cabinet.position.set(10.5, 1.05, arc.z)
      g.add(cabinet)

      // Slanted CRT Screen
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.05), screenMat)
      screen.position.set(10.0, 1.35, arc.z)
      screen.rotation.y = Math.PI / 2
      screen.rotation.x = 0.25
      g.add(screen)

      // Glowing Top Marquee
      const marquee = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.06), screenMat)
      marquee.position.set(10.0, 1.95, arc.z)
      marquee.rotation.y = Math.PI / 2
      g.add(marquee)
    })

    /* ---- C. VR Immersion Simulator Holo-Pod (x: 5.5, z: 20.0) ---- */
    const vrPod = new THREE.Group()
    vrPod.position.set(5.5, 0, 20.0)

    // Circular omnidirectional treadmill ring
    const baseRing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.25, 28), deskMat)
    baseRing.position.y = 0.125
    vrPod.add(baseRing)

    const glowRim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.04, 8, 36), cyanNeon)
    glowRim.rotation.x = Math.PI / 2
    glowRim.position.y = 0.26
    vrPod.add(glowRim)

    // Overhead Cable Boom Stanchion
    const boomPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 12), deskMat)
    boomPost.position.set(0, 1.6, -1.35)
    vrPod.add(boomPost)

    const boomArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.6), deskMat)
    boomArm.position.set(0, 3.15, -0.6)
    vrPod.add(boomArm)

    g.add(vrPod)

    /* ---- D. Cyber Studio Crew Espresso & Refreshment Bar (x: -3 to +3, z: 22.0) ---- */
    const barCounter = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 1.1, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x090e1a, metalness: 0.9, roughness: 0.2 })
    )
    barCounter.position.set(0, 0.55, 22.0)
    g.add(barCounter)

    // Chrome Commercial Espresso Machine
    const espressoMachine = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.65, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xdde4ec, metalness: 0.95, roughness: 0.1 })
    )
    espressoMachine.position.set(-1.2, 1.42, 22.0)
    g.add(espressoMachine)

    // 4 Chrome High-Top Bar Stools
    for (let s = -2; s <= 2; s++) {
      if (s === 0) continue
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 16), cyanNeon)
      stool.position.set(s * 1.3, 0.375, 20.8)
      g.add(stool)
    }

    this.group.add(g)
  }

  /* --------------------------------------------------------- 8. WAR ROOM ENHANCEMENTS -- */

  /**
   * EXECUTIVE STRATEGY & WAR ROOM ENHANCEMENTS (x: +14 to +33, z: -25 to +8)
   */
  private buildWarRoomEnhancements() {
    const g = new THREE.Group()
    const warRoomX = 22.0
    const warRoomZ = -8.0
    const cyanNeon = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.8 })
    const redAlert = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 2.8 })

    // 1. Rotating 3D Holographic Globe / Tactical Threat Map above Conference Table
    const globeWireframe = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.65 })
    )
    globeWireframe.position.set(warRoomX, 2.4, warRoomZ)
    g.add(globeWireframe)

    // Tactical threat rings rotating around globe
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.025, 8, 36), redAlert)
    ring1.rotation.x = Math.PI / 3
    ring1.position.set(warRoomX, 2.4, warRoomZ)
    g.add(ring1)

    this.animatedProps.push({
      mesh: globeWireframe,
      update: (dt, t) => {
        globeWireframe.rotation.y = t * 0.4
        ring1.rotation.z = -t * 0.6
      },
    })

    // 2. Grand 4-Screen Mission Presentation Video Wall along North Wall (x: 22, z: -25.2)
    for (let scr = 0; scr < 4; scr++) {
      const sx = 16.5 + scr * 3.6
      const screen = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 0.08), cyanNeon)
      screen.position.set(sx, 3.2, -25.2)
      g.add(screen)
    }

    this.group.add(g)
  }

  private mountedSectorAssets: Map<string, THREE.Object3D> = new Map()

  /**
   * Mounts a custom user GLB 3D asset into a specific showroom sector
   */
  public mountAssetToSector(sectorId: 'weapon' | 'mecha' | 'drone' | 'quantum', model: THREE.Object3D) {
    const existing = this.mountedSectorAssets.get(sectorId)
    if (existing) {
      this.group.remove(existing)
    }

    if (sectorId === 'mecha') {
      // Mount on turntable at x: -24.0, z: -0.5, y: 0.25
      model.position.set(-24.0, 0.26, -0.5)
    } else if (sectorId === 'weapon') {
      // Mount on calibration bench at x: -17.5, y: 0.95, z: -18.0
      model.position.set(-17.5, 0.95, -18.0)
    } else if (sectorId === 'drone') {
      // Mount on helipad 1 at x: -25.5, y: 0.32, z: 14.0
      model.position.set(-25.5, 0.32, 14.0)
    } else if (sectorId === 'quantum') {
      // Mount inside containment chamber at x: 24.0, y: 1.2, z: 16.5
      model.position.set(24.0, 1.2, 16.5)
    }

    this.mountedSectorAssets.set(sectorId, model)
    this.group.add(model)
  }

  public clearSectorAsset(sectorId: 'weapon' | 'mecha' | 'drone' | 'quantum') {
    const existing = this.mountedSectorAssets.get(sectorId)
    if (existing) {
      this.group.remove(existing)
      this.mountedSectorAssets.delete(sectorId)
    }
  }

  /* ------------------------------------------------------------- 9. ANIMATION -- */

  /**
   * Per-frame animation tick
   */
  public update(dt: number, t: number) {
    this.animatedProps.forEach((prop) => prop.update(dt, t))
  }
}
