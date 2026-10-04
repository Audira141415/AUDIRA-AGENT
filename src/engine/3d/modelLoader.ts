/**
 * modelLoader.ts - GLB / GLTF 3D Model Loader for AUDIRA-AGENT
 *
 * Provides high-performance loading, auto-normalization, and animation
 * management for external 3D models (.glb, .gltf):
 * - Auto-scaling to target height (fits avatar or room scale)
 * - Auto-grounding (aligns model base with floor at y=0)
 * - Shadow casting & receiving setup
 * - PBR material normalization
 * - Skeletal animation mixer & clip indexing
 * - Direct support for TripoSR, Stable Fast 3D, Blender, Mixamo, ReadyPlayerMe models
 */

import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { Avatar } from './avatar'

export interface GLBLoadOptions {
  targetHeight?: number
  groundY?: boolean
  centerXZ?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  roughnessFactor?: number
  metalnessFactor?: number
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

export interface LoadedGLB {
  root: THREE.Group
  rawScene: THREE.Group
  animations: THREE.AnimationClip[]
  mixer?: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  limbs: DetectedLimbs
  hasBones: boolean
  hasWalkAnimation: boolean
  walkAction?: THREE.AnimationAction
  idleAction?: THREE.AnimationAction
  originalBox: THREE.Box3
  originalSize: THREE.Vector3
  dispose: () => void
}

let gltfLoaderInstance: GLTFLoader | null = null

export function getGLTFLoader(): GLTFLoader {
  if (!gltfLoaderInstance) {
    gltfLoaderInstance = new GLTFLoader()
    try {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
      gltfLoaderInstance.setDRACOLoader(dracoLoader)
    } catch (e) {
      console.warn('[modelLoader] DRACOLoader initialization deferred:', e)
    }
  }
  return gltfLoaderInstance
}

/**
 * Loads a GLB/GLTF model from URL, File, Blob, or ArrayBuffer
 */
export async function loadGLB(
  source: string | File | Blob | ArrayBuffer,
  options: GLBLoadOptions = {}
): Promise<LoadedGLB> {
  const loader = getGLTFLoader()
  const opts: Required<GLBLoadOptions> = {
    targetHeight: options.targetHeight ?? 1.85, // Default ~1.85m to match SD Gundam / Humanoid height
    groundY: options.groundY ?? true,
    centerXZ: options.centerXZ ?? true,
    castShadow: options.castShadow ?? true,
    receiveShadow: options.receiveShadow ?? true,
    roughnessFactor: options.roughnessFactor ?? 1.0,
    metalnessFactor: options.metalnessFactor ?? 1.0,
  }

  if (typeof source === 'string' && source.startsWith('preset://')) {
    const presetKey = source.replace('preset://', '')
    return createPresetModel(presetKey, opts)
  }

  let gltf: GLTF
  let blobUrlToRevoke: string | null = null

  try {
    if (typeof source === 'string') {
      gltf = await loader.loadAsync(source)
    } else if (source instanceof ArrayBuffer) {
      gltf = await loader.parseAsync(source, '')
    } else if (source instanceof Blob || source instanceof File) {
      blobUrlToRevoke = URL.createObjectURL(source)
      gltf = await loader.loadAsync(blobUrlToRevoke)
    } else {
      throw new Error('Unsupported source format for GLB loader')
    }
  } finally {
    if (blobUrlToRevoke) {
      URL.revokeObjectURL(blobUrlToRevoke)
    }
  }

  const modelScene = gltf.scene

  // 1. Calculate raw dimensions
  let originalBox = new THREE.Box3().setFromObject(modelScene)
  let originalSize = originalBox.getSize(new THREE.Vector3())

  // 2. Auto-scale to match targetHeight
  if (opts.targetHeight && originalSize.y > 0.001) {
    const scaleFactor = opts.targetHeight / originalSize.y
    modelScene.scale.setScalar(scaleFactor)
  }

  // 3. Compute scaled box
  const scaledBox = new THREE.Box3().setFromObject(modelScene)
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3())

  // 4. Center X/Z and Ground Y at 0
  if (opts.centerXZ) {
    modelScene.position.x = -scaledCenter.x
    modelScene.position.z = -scaledCenter.z
  }
  if (opts.groundY) {
    modelScene.position.y = -scaledBox.min.y
  }

  // 5. Wrap inside a clean pivot root Group
  const root = new THREE.Group()
  root.name = 'GLB_Model_Pivot'
  root.add(modelScene)

  // 6. Configure shadows and materials
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.castShadow = opts.castShadow
      mesh.receiveShadow = opts.receiveShadow

      // CRITICAL: Compute vertex normals if geometry lacks them!
      // Without vertex normals, Three.js shaders cannot calculate lighting angles,
      // resulting in blinding flat white blowouts across all surfaces.
      if (mesh.geometry) {
        if (!mesh.geometry.attributes.normal) {
          mesh.geometry.computeVertexNormals()
        }
      }

      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            const hasVColors = mesh.geometry && !!mesh.geometry.attributes.color
            if (hasVColors) {
              // Vertex-colored model (diffuse armor colors, decals, panel lines)
              mat.vertexColors = true
              // Keep metalness low (0.05 - 0.15) so specular reflections do NOT wipe out diffuse vertex colors
              mat.metalness = Math.min(0.15, mat.metalness * 0.15)
              mat.roughness = Math.max(0.45, Math.min(0.85, mat.roughness))
              mat.envMapIntensity = 0.35
              mat.color = new THREE.Color(0xffffff)
            } else {
              mat.roughness = Math.min(1, mat.roughness * opts.roughnessFactor)
              mat.metalness = Math.min(0.85, mat.metalness * opts.metalnessFactor)
              mat.envMapIntensity = 0.6
            }
          }
          mat.needsUpdate = true
        })
      }
    }
  })

  // 7. Detect limbs & bones for procedural bone walking (if model is rigged/has limbs)
  const limbs = detectLimbs(modelScene)
  const hasBones = !!(limbs.leftLeg || limbs.rightLeg || limbs.leftArm || limbs.rightArm)

  // 8. Animations and Mixer with Intelligent Fuzzy Clip Matching
  let mixer: THREE.AnimationMixer | undefined
  const actions = new Map<string, THREE.AnimationAction>()
  let walkAction: THREE.AnimationAction | undefined
  let idleAction: THREE.AnimationAction | undefined

  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(modelScene)
    gltf.animations.forEach((clip) => {
      const action = mixer!.clipAction(clip)
      const lowerName = clip.name.toLowerCase()
      actions.set(lowerName, action)

      // Intelligent fuzzy match: match walking/running animations
      if (!walkAction && /walk|run|march|locomot|jog|move|step/i.test(lowerName)) {
        walkAction = action
      }
      // Intelligent fuzzy match: match idle/standing animations
      if (!idleAction && /idle|stand|wait|breath|pose|default/i.test(lowerName)) {
        idleAction = action
      }
    })

    // Fallbacks: If no clip named explicitly 'walk' but clips exist, use clip 0
    if (!walkAction && gltf.animations.length > 0) {
      const firstClipName = gltf.animations[0].name.toLowerCase()
      walkAction = actions.get(firstClipName)
    }
    if (!idleAction && gltf.animations.length > 1) {
      const secondClipName = gltf.animations[1].name.toLowerCase()
      idleAction = actions.get(secondClipName)
    } else if (!idleAction && gltf.animations.length === 1) {
      idleAction = walkAction
    }
  }

  const hasWalkAnimation = !!walkAction

  const dispose = () => {
    if (mixer) {
      mixer.stopAllAction()
      mixer.uncacheRoot(modelScene)
    }
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else if (mesh.material) {
          mesh.material.dispose()
        }
      }
    })
  }

  return {
    root,
    rawScene: modelScene,
    animations: gltf.animations || [],
    mixer,
    actions,
    limbs,
    hasBones,
    hasWalkAnimation,
    walkAction,
    idleAction,
    originalBox,
    originalSize,
    dispose,
  }
}

/**
 * Traverses 3D hierarchy to detect bones, armature nodes, or limb groups
 */
function detectLimbs(root: THREE.Object3D): DetectedLimbs {
  const limbs: DetectedLimbs = {}

  root.traverse((child) => {
    const name = child.name.toLowerCase()

    // Left Leg / Thigh / Upper Leg
    if (!limbs.leftLeg && /^(.*)(l_thigh|thigh[._]l|left.*(upleg|thigh|upperleg)|l.*leg|leg[._]l)(.*)$/i.test(name)) {
      limbs.leftLeg = child
    }
    // Right Leg / Thigh / Upper Leg
    else if (!limbs.rightLeg && /^(.*)(r_thigh|thigh[._]r|right.*(upleg|thigh|upperleg)|r.*leg|leg[._]r)(.*)$/i.test(name)) {
      limbs.rightLeg = child
    }
    // Left Knee / Shin / Lower Leg
    else if (!limbs.leftKnee && /^(.*)(l_calf|calf[._]l|shin[._]l|knee[._]l|left.*(calf|shin|lowerleg|knee))(.*)$/i.test(name)) {
      limbs.leftKnee = child
    }
    // Right Knee / Shin / Lower Leg
    else if (!limbs.rightKnee && /^(.*)(r_calf|calf[._]r|shin[._]r|knee[._]r|right.*(calf|shin|lowerleg|knee))(.*)$/i.test(name)) {
      limbs.rightKnee = child
    }
    // Left Arm / Shoulder / Upper Arm
    else if (!limbs.leftArm && /^(.*)(l_arm|arm[._]l|upperarm[._]l|left.*(arm|upperarm|shoulder)|bicep[._]l)(.*)$/i.test(name)) {
      limbs.leftArm = child
    }
    // Right Arm / Shoulder / Upper Arm
    else if (!limbs.rightArm && /^(.*)(r_arm|arm[._]r|upperarm[._]r|right.*(arm|upperarm|shoulder)|bicep[._]r)(.*)$/i.test(name)) {
      limbs.rightArm = child
    }
    // Spine / Chest / Torso
    else if (!limbs.spine && /^(.*)(spine|chest|torso|body)(.*)$/i.test(name) && !name.includes('leg') && !name.includes('arm')) {
      limbs.spine = child
    }
    // Head / Neck
    else if (!limbs.head && /^(.*)(head|neck)(.*)$/i.test(name)) {
      limbs.head = child
    }
  })

  return limbs
}

/**
 * Attaches a loaded GLB model to an agent's Avatar rig
 */
export function attachGLBToAvatar(av: Avatar, glb: LoadedGLB): void {
  // If an existing GLB is already attached, clean it up
  if (av.glbModel && av.glbModel.parent) {
    av.glbModel.parent.remove(av.glbModel)
  }

  av.glbModel = glb.root
  av.glbMixer = glb.mixer
  av.glbClips = glb.animations
  av.glbActions = glb.actions
  av.glbLimbs = glb.limbs
  av.glbWalkAction = glb.walkAction
  av.glbIdleAction = glb.idleAction
  av.glbLocomotionMode = 'auto'
  av.isGLB = true

  // Hide procedural SD Gundam body & floating halo badge
  if (av.hips) av.hips.visible = false
  if (av.badge) av.badge.visible = false

  // Attach GLB root to the main avatar kinematic group
  av.group.add(glb.root)

  console.log(`[modelLoader] Successfully attached GLB to avatar: ${av.group.name || 'unnamed'} (hasWalkAnimation: ${glb.hasWalkAnimation}, hasBones: ${glb.hasBones})`)
}

/**
 * Restores the procedural SD Gundam avatar and removes the GLB model
 */
export function detachGLBFromAvatar(av: Avatar): void {
  if (av.glbModel && av.glbModel.parent) {
    av.glbModel.parent.remove(av.glbModel)
    av.glbModel = undefined
  }
  av.glbMixer = undefined
  av.glbClips = undefined
  av.glbActions = undefined
  av.glbLimbs = undefined
  av.glbWalkAction = undefined
  av.glbIdleAction = undefined
  av.glbLocomotionMode = undefined
  av.isGLB = false

  // Unhide procedural SD Gundam body
  if (av.hips) av.hips.visible = true
  if (av.badge) av.badge.visible = true

  console.log(`[modelLoader] Successfully detached GLB from avatar: ${av.group.name || 'unnamed'} - Restored SD Gundam rig.`)
}

/**
 * Creates a procedural 3D model for quick testing and built-in preset pipelines
 */
function createPresetModel(presetKey: string, opts: Required<GLBLoadOptions>): LoadedGLB {
  const modelScene = new THREE.Group()
  const matPrimary = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  })
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.2,
  })
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.7,
    roughness: 0.3,
  })
  const matJoint = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.95,
    roughness: 0.15,
  })

  const limbs: DetectedLimbs = {}

  if (presetKey === 'mecha') {
    // SD / Mecha Robot with fully animated humanoid limbs
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.5), matPrimary)
    torso.position.y = 1.35
    modelScene.add(torso)
    limbs.spine = torso

    const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), matAccent)
    chestCore.rotation.x = Math.PI / 2
    chestCore.position.set(0, 1.45, 0.26)
    modelScene.add(chestCore)

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.4), matGold)
    head.position.set(0, 2.05, 0)
    modelScene.add(head)
    limbs.head = head

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.08), matAccent)
    visor.position.set(0, 2.05, 0.21)
    modelScene.add(visor)

    // Left Arm
    const leftArm = new THREE.Group()
    leftArm.name = 'LeftArm'
    leftArm.position.set(-0.55, 1.7, 0)
    const lShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.35), matGold)
    leftArm.add(lShoulder)
    const lBicep = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), matPrimary)
    lBicep.position.y = -0.4
    leftArm.add(lBicep)
    modelScene.add(leftArm)
    limbs.leftArm = leftArm

    // Right Arm
    const rightArm = new THREE.Group()
    rightArm.name = 'RightArm'
    rightArm.position.set(0.55, 1.7, 0)
    const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.35), matGold)
    rightArm.add(rShoulder)
    const rBicep = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), matPrimary)
    rBicep.position.y = -0.4
    rightArm.add(rBicep)
    modelScene.add(rightArm)
    limbs.rightArm = rightArm

    // Left Leg
    const leftLeg = new THREE.Group()
    leftLeg.name = 'LeftLeg'
    leftLeg.position.set(-0.25, 0.9, 0)
    const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.3), matPrimary)
    lThigh.position.y = -0.45
    leftLeg.add(lThigh)
    modelScene.add(leftLeg)
    limbs.leftLeg = leftLeg

    // Right Leg
    const rightLeg = new THREE.Group()
    rightLeg.name = 'RightLeg'
    rightLeg.position.set(0.25, 0.9, 0)
    const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.3), matPrimary)
    rThigh.position.y = -0.45
    rightLeg.add(rThigh)
    modelScene.add(rightLeg)
    limbs.rightLeg = rightLeg
  } else if (presetKey === 'drone') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.7), matPrimary)
    chassis.position.y = 0.8
    modelScene.add(chassis)

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), matAccent)
    eye.position.set(0, 0.8, 0.36)
    modelScene.add(eye)

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8), matJoint)
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = angle
      arm.position.set(Math.cos(angle) * 0.45, 0.8, Math.sin(angle) * 0.45)
      modelScene.add(arm)

      const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.06), matAccent)
      rotor.position.set(Math.cos(angle) * 0.85, 0.86, Math.sin(angle) * 0.85)
      modelScene.add(rotor)
    }
  } else if (presetKey === 'weapon') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.9), matPrimary)
    receiver.position.y = 0.7
    modelScene.add(receiver)

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), matJoint)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.75, 0.7)
    modelScene.add(barrel)

    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4), matAccent)
    scope.rotation.x = Math.PI / 2
    scope.position.set(0, 0.9, 0.1)
    modelScene.add(scope)
  } else if (presetKey === 'core') {
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.5, 24), matPrimary)
    vessel.position.y = 0.85
    modelScene.add(vessel)

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.06, 12, 32), matAccent)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.85
    modelScene.add(ring)
  } else {
    // Speeder
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.8, 12), matPrimary)
    fuselage.rotation.x = Math.PI / 2
    fuselage.position.y = 0.5
    modelScene.add(fuselage)

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), matAccent)
    cockpit.position.set(0, 0.6, 0.1)
    cockpit.scale.set(0.8, 0.7, 1.5)
    modelScene.add(cockpit)
  }

  // Calculate box and scale
  const originalBox = new THREE.Box3().setFromObject(modelScene)
  const originalSize = originalBox.getSize(new THREE.Vector3())
  if (opts.targetHeight && originalSize.y > 0.001) {
    const s = opts.targetHeight / originalSize.y
    modelScene.scale.setScalar(s)
  }
  const scaledBox = new THREE.Box3().setFromObject(modelScene)
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
  if (opts.centerXZ) {
    modelScene.position.x = -scaledCenter.x
    modelScene.position.z = -scaledCenter.z
  }
  if (opts.groundY) {
    modelScene.position.y = -scaledBox.min.y
  }

  const root = new THREE.Group()
  root.name = `GLB_Preset_${presetKey}`
  root.add(modelScene)

  const dispose = () => {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
      }
    })
    matPrimary.dispose()
    matAccent.dispose()
    matGold.dispose()
    matJoint.dispose()
  }

  return {
    root,
    rawScene: modelScene,
    animations: [],
    actions: new Map(),
    limbs,
    hasBones: !!(limbs.leftLeg || limbs.rightLeg),
    hasWalkAnimation: false,
    originalBox,
    originalSize,
    dispose,
  }
}

