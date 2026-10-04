/**
 * AvatarPreviewViewport.js - Interactive 3D Miniature Model Preview Viewport
 *
 * Provides a dedicated, high-performance Three.js 3D miniature showcase inside the
 * Agent Inspector drawer:
 * - 360° interactive turntable rotation with mouse/touch drag
 * - Renders either custom GLB models (mecha, robots) or procedural SD Gundam avatars
 * - 3-point high-contrast sci-fi studio lighting with glowing holographic reticle
 * - Automatic frame-budget conservation (renders only while drawer is open)
 */

import * as THREE from 'three'
import { buildAvatar } from '../engine/3d/avatar.js'

export class AvatarPreviewViewport {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.isRunning = false
    this.animationFrameId = null
    this.currentModel = null

    // Interaction state
    this.isDragging = false
    this.previousMouseX = 0
    this.turntableAngle = 0
    this.autoRotateSpeed = 0.65 // rad/s

    // 1. Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
    this.camera.position.set(0, 1.25, 3.2)
    this.camera.lookAt(0, 0.85, 0)

    // 3. Scene setup
    this.scene = new THREE.Scene()

    // 4. Studio Lighting
    this.setupLighting()

    // 5. Turntable Pedestal
    this.previewGroup = new THREE.Group()
    this.scene.add(this.previewGroup)
    this.buildTurntable()

    // 6. Bind Mouse / Touch Events for 360° dragging
    this.bindEvents()

    // Resize initial
    this.resize()
  }

  setupLighting() {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.75)
    this.scene.add(ambient)

    // Key front-top light (Neutral white for true colors)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35)
    keyLight.position.set(2.5, 4.0, 3.0)
    this.scene.add(keyLight)

    // Subtle cyan rim light from back-left
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9)
    rimLight.position.set(-2.5, 2.5, -2.5)
    this.scene.add(rimLight)

    // Pedestal floor underglow
    const underglow = new THREE.PointLight(0x06b6d4, 0.8, 6)
    underglow.position.set(0, 0.1, 0)
    this.scene.add(underglow)
  }

  buildTurntable() {
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x070c17,
      roughness: 0.35,
      metalness: 0.85,
    })
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.12, 32), plinthMat)
    plinth.position.y = 0.06
    this.previewGroup.add(plinth)

    // Glowing perimeter neon ring
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
    })
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.02, 8, 36), ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.12
    this.previewGroup.add(ring)

    // Concentric inner reticle
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.012, 8, 24), ringMat)
    innerRing.rotation.x = Math.PI / 2
    innerRing.position.y = 0.125
    this.previewGroup.add(innerRing)
  }

  bindEvents() {
    const onDown = (clientX) => {
      this.isDragging = true
      this.previousMouseX = clientX
    }

    const onMove = (clientX) => {
      if (!this.isDragging) return
      const deltaX = clientX - this.previousMouseX
      this.turntableAngle += deltaX * 0.015
      this.previewGroup.rotation.y = this.turntableAngle
      this.previousMouseX = clientX
    }

    const onUp = () => {
      this.isDragging = false
    }

    this.canvas.addEventListener('mousedown', (e) => onDown(e.clientX))
    window.addEventListener('mousemove', (e) => onMove(e.clientX))
    window.addEventListener('mouseup', onUp)

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) onDown(e.touches[0].clientX)
    }, { passive: true })
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) onMove(e.touches[0].clientX)
    }, { passive: true })
    window.addEventListener('touchend', onUp)
  }

  /**
   * Loads or updates the displayed avatar (Custom GLB or Procedural SD Gundam)
   */
  updateAvatar(agent, engine3D) {
    // 1. Remove previous avatar model
    if (this.currentModel) {
      this.previewGroup.remove(this.currentModel)
      this.currentModel = null
    }

    if (!agent) return

    // Case A: Custom GLB Skin is active on this operator
    if (agent.modelUrl || agent.modelName) {
      let liveGLB = null
      if (engine3D && engine3D.scene && engine3D.scene.byName) {
        const sceneAgent = engine3D.scene.byName.get(agent.name)
        if (sceneAgent && sceneAgent.avatar && sceneAgent.avatar.glbModel) {
          liveGLB = sceneAgent.avatar.glbModel
        }
      }

      if (liveGLB) {
        // Clone live GLB model hierarchy
        const clone = liveGLB.clone(true)
        clone.position.set(0, 0.12, 0)
        clone.rotation.set(0, 0, 0)

        clone.traverse((child) => {
          if (child.isMesh && child.geometry && !child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals()
          }
        })

        // Normalize scale to fit nicely in 1.5m preview box
        const bbox = new THREE.Box3().setFromObject(clone)
        const size = bbox.getSize(new THREE.Vector3())
        if (size.y > 0.001) {
          const targetH = 1.45
          const factor = targetH / size.y
          clone.scale.multiplyScalar(factor)
        }

        // Ensure grounded on turntable
        const postBox = new THREE.Box3().setFromObject(clone)
        clone.position.y = 0.12 - postBox.min.y + 0.12

        this.currentModel = clone
        this.previewGroup.add(this.currentModel)
        return
      }
    }

    // Case B: Default Procedural SD Gundam Avatar
    const avatar = buildAvatar(agent.role || 'backend', agent.name, agent)
    const gundamGroup = avatar.group
    gundamGroup.position.set(0, 0.12, 0)
    gundamGroup.rotation.set(0, 0, 0)
    gundamGroup.scale.set(0.9, 0.9, 0.9)

    this.currentModel = gundamGroup
    this.previewGroup.add(this.currentModel)
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    const width = rect.width || 280
    const height = rect.height || 180

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer.setSize(width, height, false)
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    let lastTime = performance.now()

    const tick = (now) => {
      if (!this.isRunning) return
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      // Smooth auto-rotation when not actively being dragged by user
      if (!this.isDragging) {
        this.turntableAngle += this.autoRotateSpeed * dt
        this.previewGroup.rotation.y = this.turntableAngle
      }

      this.renderer.render(this.scene, this.camera)
      this.animationFrameId = requestAnimationFrame(tick)
    }

    this.animationFrameId = requestAnimationFrame(tick)
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  dispose() {
    this.stop()
    this.renderer.dispose()
  }
}
