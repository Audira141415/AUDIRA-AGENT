/**
 * Animation layer.
 *
 * Every pose is a pure function of (agent, time) so there is no per-agent
 * animation state to keep in sync — the scene tick simply re-derives the pose
 * each frame from the agent's current activity.
 */
import type { Avatar } from './avatar'

import { HIP_STAND } from './avatar'
import { SEATS } from './layout'

const D = Math.PI / 180
export { HIP_STAND }
/**
 * Seated hip height for an office/meeting chair.
 *
 * NOT a guess: it is the hip Y that puts this rig's feet exactly on the floor for
 * the seated pose below (thigh -86, knee 92), solved by sampling the rig. The
 * chair's seat top is 0.505, so the hip rides 0.011 above it — a hair, which is
 * what "sitting on the seat" means.
 *
 * The previous 0.52 was chosen to match the chair, not the legs, and the legs are
 * what decide whether the feet touch: with the feet 4-5 cm off the floor every
 * sitter looked like they were hovering.
 */
export const HIP_SIT = SEATS.chair.hip

/** Smooth triangle-ish oscillation, deterministic in `t`. */
export function wave(t: number, freq: number, phase = 0): number {
  return Math.sin(t * freq + phase)
}

export type Activity =
  | 'idle'
  | 'walking'
  | 'typing'
  | 'meeting'
  | 'gaming'
  | 'dart'
  | 'sofa'
  | 'garden'
  | 'read'
  | 'coffee'

export type AnimAgent = {
  avatar: Avatar
  activity: Activity
  /** 0..1, ramps in when the activity starts (prevents pose snapping). */
  ease: number
  phase: number
  meetingTalking?: boolean
}

/**
 * Seated pose. `thigh` is the hip angle: -90 places the thigh horizontally
 * forward (the correct seated posture). The first version used -76..-88 *and*
 * had the hip nested under a torso that started too high, so legs read as
 * dangling stubs.
 */
function sit(a: AnimAgent, hipY: number, thigh: number, knee: number) {
  const av = a.avatar
  av.hips.position.y = hipY
  av.hips.rotation.set(0, 0, 0)
  av.chest.rotation.z = 0
  const [L, R] = av.legs
  for (const [leg, sign] of [
    [L, -1],
    [R, 1],
  ] as const) {
    leg.shoulder.rotation.x = thigh * D
    leg.shoulder.rotation.z = sign * 5 * D
    leg.elbow.rotation.x = knee * D
  }
}

function standLegs(a: AnimAgent, t: number) {
  const av = a.avatar
  av.hips.position.y = HIP_STAND
  av.hips.rotation.set(0, 0, 0)
  av.chest.rotation.z = 0
  const [L, R] = av.legs
  L.shoulder.rotation.x = wave(t, 2.2, 0) * 1.2 * D
  R.shoulder.rotation.x = wave(t, 2.2, Math.PI) * 1.2 * D
  L.shoulder.rotation.z = 0
  R.shoulder.rotation.z = 0
  L.elbow.rotation.x = 2 * D
  R.elbow.rotation.x = 2 * D
}

/**
 * Natural Humanoid Walking Gait:
 * Uses biomechanically derived kinematics with:
 * - Proper cadence (frequency ~4.6 rad/s matching foot contact without sliding)
 * - True knee flexion (bends backwards up to 48° during forward swing phase, straightens to 3° at heel strike)
 * - Sinusoidal pelvic vertical bobbing (rising at mid-stance, dipping at double support)
 * - Pelvis lateral sway (roll) and rotational twist (yaw)
 * - Upper torso counter-rotation (yaw & roll) and forward propulsion lean
 * - Natural dual-arm counter-swing with dynamic elbow flexion
 * - Horizon-stabilized head tracking
 */
function walkLegs(a: AnimAgent, t: number, speed = 1) {
  const av = a.avatar
  const phi = t * 4.6 * speed + a.phase
  const [L, R] = av.legs

  // 1. Pelvis / Hips Kinematics
  // Smooth vertical bobbing: highest at mid-stance (passing over straight leg), lowest at double support
  av.hips.position.y = HIP_STAND - 0.024 + Math.cos(phi * 2) * 0.022
  // Pelvic roll (lateral weight shift toward stance leg)
  av.hips.rotation.z = Math.sin(phi) * 2.2 * D
  // Pelvic yaw (twisting forward into the stepping hip)
  av.hips.rotation.y = -Math.sin(phi) * 3.8 * D

  // 2. Leg Cycles
  // Left Leg:
  const sinL = Math.sin(phi)
  const cosL = Math.cos(phi)
  // Thigh pitch: negative X = forward, positive X = backward
  L.shoulder.rotation.x = sinL * 24 * D
  L.shoulder.rotation.z = -1.5 * D
  // Knee flexion: bends backward (positive X) during forward swing (when cosL < 0)
  // Reaches peak flexion ~48° at mid-swing, straightens to 3° at heel strike
  const swingL = Math.max(0, -cosL)
  L.elbow.rotation.x = 3 * D + Math.pow(swingL, 1.4) * 44 * D + Math.max(0, sinL) * 10 * D

  // Right Leg (180° out of phase):
  const phiR = phi + Math.PI
  const sinR = Math.sin(phiR)
  const cosR = Math.cos(phiR)
  R.shoulder.rotation.x = sinR * 24 * D
  R.shoulder.rotation.z = 1.5 * D
  const swingR = Math.max(0, -cosR)
  R.elbow.rotation.x = 3 * D + Math.pow(swingR, 1.4) * 44 * D + Math.max(0, sinR) * 10 * D

  // 3. Upper Body / Torso Counter-Balance
  // Chest counter-rotates against the pelvis yaw to maintain dynamic balance
  av.chest.rotation.y = Math.sin(phi) * 4.2 * D
  // Natural purposeful forward lean
  av.chest.rotation.x = 4.0 * D
  // Chest lateral counter-roll
  av.chest.rotation.z = -Math.sin(phi) * 1.8 * D

  // 4. Arms Swing (Natural Pendulum)
  // Left arm swings forward when left leg is backward (sinL > 0)
  av.arms[0].shoulder.rotation.x = -sinL * 22 * D
  av.arms[1].shoulder.rotation.x = sinL * 22 * D
  // Slight lateral arm clearance from torso & side skirts
  av.arms[0].shoulder.rotation.z = -8 * D - Math.max(0, sinL) * 3 * D
  av.arms[1].shoulder.rotation.z = 8 * D + Math.max(0, -sinL) * 3 * D
  // Dynamic elbow flexion (bends more on forward swing up to 34°, straightens on backswing to 12°)
  av.arms[0].elbow.rotation.x = -12 * D - Math.max(0, -sinL) * 22 * D
  av.arms[1].elbow.rotation.x = -12 * D - Math.max(0, sinL) * 22 * D

  // 5. Head Tracking & Stability
  av.head.rotation.y = -Math.sin(phi) * 1.2 * D
  av.head.rotation.x = 2.0 * D + Math.cos(phi * 2) * 1.2 * D
  av.neck.rotation.x = 0
}

/** Seated at a desk, typing on the keyboard and operating the mouse. */
function typing(a: AnimAgent, t: number) {
  const av = a.avatar
  sit(a, HIP_SIT, SEATS.chair.thigh, SEATS.chair.knee)

  // Natural human working posture: leaning slightly forward toward the desk
  av.chest.rotation.x = 4.0 * D
  av.chest.rotation.y = wave(t, 0.35, a.phase) * 1.2 * D
  av.neck.rotation.x = 6 * D
  // Head tilted down toward the desk surface, monitors, and keyboard
  av.head.rotation.x = 10 * D
  av.head.rotation.y = wave(t, 0.6, a.phase) * 3 * D

  const [L, R] = av.arms

  // Left Arm: forearms resting on desk, active typing on home row keyboard keys
  L.shoulder.rotation.x = -20 * D
  L.shoulder.rotation.z = 12 * D // Angled inward toward keyboard
  L.shoulder.rotation.y = -2 * D
  // Subtle mechanical keystroke rhythm
  const lKeyTap = wave(t, 8.5, a.phase) * 1.5 * D + wave(t, 12.5, a.phase + 0.8) * 0.8 * D
  L.elbow.rotation.x = -52 * D + lKeyTap

  // Right Arm: forearms resting on desk, operating mouse and numeric keypad
  R.shoulder.rotation.x = -19 * D
  R.shoulder.rotation.z = -7 * D // Angled inward slightly to mouse position
  R.shoulder.rotation.y = wave(t, 1.4, a.phase) * 1.8 * D // Micro mouse navigation glide
  const rMouseTap = wave(t, 6.0, a.phase + 1.5) * 1.2 * D
  R.elbow.rotation.x = -53 * D + rMouseTap
}

/** Seated in the conference room; raises a hand on the speaking turn. */
function meeting(a: AnimAgent, t: number) {
  const av = a.avatar
  sit(a, HIP_SIT, SEATS.chair.thigh, SEATS.chair.knee)
  const talking = !!a.meetingTalking
  av.chest.rotation.x = (talking ? -5 : 9) * D
  av.chest.rotation.y = talking ? 0 : wave(t, 0.35, a.phase) * 9 * D
  av.neck.rotation.x = (talking ? -5 : 5) * D
  av.head.rotation.x = (talking ? 1 : 7) * D
  av.head.rotation.y = (talking ? wave(t, 0.6, a.phase) * 5 : wave(t, 0.4, a.phase) * 18) * D
  const [L, R] = av.arms
  const k = talking ? 1 : 0.2
  // Raised hand: shoulder forward ~50-80 deg, elbow folded — never above the head.
  R.shoulder.rotation.x = (-42 - k * 36) * D
  R.shoulder.rotation.z = (10 + k * 14) * D
  R.elbow.rotation.x = (-58 + k * 26) * D
  L.shoulder.rotation.x = (-34 - (1 - k) * 10) * D
  L.shoulder.rotation.z = -14 * D
  L.elbow.rotation.x = (-62 - (1 - k) * 14) * D
  av.hips.position.y = HIP_SIT + wave(t, 1.5, a.phase) * 0.012
}

/** Lounging on the sofa, controller in hand. */
function gaming(a: AnimAgent, t: number) {
  const av = a.avatar
  sit(a, SEATS.sofa.hip, SEATS.sofa.thigh, SEATS.sofa.knee)
  av.chest.rotation.x = -12 * D
  av.chest.rotation.y = wave(t, 0.4, a.phase) * 6 * D
  av.head.rotation.x = 10 * D
  av.head.rotation.y = wave(t, 1.4, a.phase) * 8 * D
  const [L, R] = av.arms
  L.shoulder.rotation.x = -46 * D
  R.shoulder.rotation.x = -46 * D
  L.shoulder.rotation.z = -16 * D
  R.shoulder.rotation.z = 16 * D
  L.elbow.rotation.x = -70 * D + wave(t, 6, a.phase) * 4 * D
  R.elbow.rotation.x = -70 * D + wave(t, 6, a.phase + 2) * 4 * D
}

/** Throwing at the dartboard: alternating arm wind-up. */
function dart(a: AnimAgent, t: number) {
  const av = a.avatar
  standLegs(a, t)
  // the throw cycle repeats every ~2.4s
  const c = (t * 0.42 + a.phase) % 1
  const raise = c < 0.5 ? c * 2 : Math.max(0, 1 - (c - 0.5) * 4)
  av.chest.rotation.y = -8 * D
  av.head.rotation.x = -6 * D
  const [L, R] = av.arms
  R.shoulder.rotation.x = (-24 - raise * 78) * D
  R.shoulder.rotation.z = (10 + raise * 10) * D
  R.elbow.rotation.x = (-40 + raise * 20) * D
  L.shoulder.rotation.x = -20 * D
  L.elbow.rotation.x = -30 * D
}

/**
 * Crouched at the planter, tending plants.
 *
 * Every number here was solved against the rig, not chosen. The rig has no waist
 * joint — `chest` pivots at the TOP of the torso, so leaning forward moves the
 * head about 12 cm and the hands not at all. Standing up, the hands cannot reach
 * below y=1.13, while the planter's leaves sit at 0.82. A crouch is therefore the
 * only pose that reaches the bed, and the crouch has to be REAL: the previous one
 * used hip 0.46 with thigh -74, which measured 13 cm of leg THROUGH the floor
 * (the floor hid it) and a knee 0.46 m forward — the same as sitting. That is why
 * it read as a person sitting in mid-air with no chair.
 *
 * Solved: hip 0.634, thigh -50, knee 115. Feet plant at 0.000, the knee comes
 * 0.368 forward (vs 0.479 seated — clearly a crouch), and the hands land on the
 * leaves at 0.820 with zero error.
 */
function garden(a: AnimAgent, t: number) {
  const av = a.avatar
  const k = Math.min(1, a.ease)
  const m = (v: number) => v * k
  for (const [leg, sign] of [
    [av.legs[0], -1],
    [av.legs[1], 1],
  ] as const) {
    leg.shoulder.rotation.x = m(-50 * D)
    leg.shoulder.rotation.z = sign * m(9 * D)
    leg.elbow.rotation.x = m(115 * D)
  }
  av.hips.position.y = HIP_STAND - (HIP_STAND - 0.634) * k
  // Torso folds FORWARD over the bed (positive chest leans toward local +Z).
  av.chest.rotation.x = m(35 * D)
  av.chest.rotation.y = wave(t, 0.5, a.phase) * 8 * D
  av.neck.rotation.x = m(12 * D)
  av.head.rotation.x = m(16 * D)
  av.head.rotation.y = wave(t, 0.65, a.phase) * 14 * D
  const [L, R] = av.arms
  // Both hands reach down onto the leaves; one works in a small repeated motion.
  const work = wave(t, 2.1, a.phase)
  L.shoulder.rotation.x = m(-30 * D) + work * 4 * D
  L.shoulder.rotation.z = m(-12 * D)
  L.elbow.rotation.x = m(-40 * D) + work * 6 * D
  R.shoulder.rotation.x = m(-32 * D) - work * 5 * D
  R.shoulder.rotation.z = m(12 * D)
  R.elbow.rotation.x = m(-42 * D) - work * 7 * D
}

/** Seated in the armchair with a book: page turns every few seconds. */
function read(a: AnimAgent, t: number) {
  const av = a.avatar
  sit(a, SEATS.nook.hip, SEATS.nook.thigh, SEATS.nook.knee)
  av.chest.rotation.x = -14 * D
  av.chest.rotation.y = wave(t, 0.28, a.phase) * 5 * D
  av.neck.rotation.x = 14 * D
  av.head.rotation.x = 12 * D
  // slow scan across the page
  av.head.rotation.y = wave(t, 0.22, a.phase) * 12 * D
  const [L, R] = av.arms
  // both forearms up in front of the chest, holding the book open
  L.shoulder.rotation.x = -34 * D
  L.shoulder.rotation.z = -22 * D
  L.elbow.rotation.x = -78 * D
  R.shoulder.rotation.x = -34 * D
  R.shoulder.rotation.z = 22 * D
  R.elbow.rotation.x = -78 * D
  // a page turn every ~7 s
  const turn = ((t * 0.14 + a.phase) % 1) < 0.12 ? 1 : 0
  R.elbow.rotation.x += turn * -10 * D
  R.shoulder.rotation.z += turn * -8 * D
}

/** Perched on a pantry stool with a mug: sip, lower, glance around. */
function coffee(a: AnimAgent, t: number) {
  const av = a.avatar
  // stools are counter height, so the hip rides higher than a desk chair
  sit(a, SEATS.stool.hip, SEATS.stool.thigh, SEATS.stool.knee)
  const sip = Math.max(0, wave(t, 0.55, a.phase))
  av.chest.rotation.x = (-4 - sip * 5) * D
  av.chest.rotation.y = wave(t, 0.3, a.phase) * 7 * D
  av.neck.rotation.x = (-2 - sip * 6) * D
  av.head.rotation.x = (5 - sip * 10) * D
  av.head.rotation.y = wave(t, 0.4, a.phase) * 16 * D
  const [L, R] = av.arms
  // right hand carries the mug up to the mouth on the sip beat
  R.shoulder.rotation.x = (-40 - sip * 34) * D
  R.shoulder.rotation.z = (12 + sip * 4) * D
  R.elbow.rotation.x = (-64 + sip * 46) * D
  // left hand rests on the counter
  L.shoulder.rotation.x = -28 * D
  L.shoulder.rotation.z = -16 * D
  L.elbow.rotation.x = -52 * D
}

/** Relaxed sit on the sofa without a controller. */
function sofa(a: AnimAgent, t: number) {
  const av = a.avatar
  sit(a, SEATS.sofa.hip, SEATS.sofa.thigh, SEATS.sofa.knee)
  av.chest.rotation.x = 10 * D
  av.chest.rotation.y = wave(t, 0.3, a.phase) * 5 * D
  av.neck.rotation.x = -6 * D
  av.head.rotation.y = wave(t, 0.45, a.phase) * 22 * D
  const [L, R] = av.arms
  L.shoulder.rotation.x = -30 * D
  L.shoulder.rotation.z = -18 * D
  L.elbow.rotation.x = -46 * D
  R.shoulder.rotation.x = -30 * D
  R.shoulder.rotation.z = 18 * D
  R.elbow.rotation.x = -46 * D
  av.hips.position.y = 0.54 + wave(t, 1.1, a.phase) * 0.01
}

const TABLE: Record<Activity, (a: AnimAgent, t: number) => void> = {
  idle: (a, t) => {
    standLegs(a, t)
    const av = a.avatar
    av.chest.rotation.x = 0
    av.chest.rotation.y = 0
    av.head.rotation.y = wave(t, 0.35, a.phase) * 16 * D
    const [L, R] = av.arms
    L.shoulder.rotation.x = -6 * D
    R.shoulder.rotation.x = -6 * D
    L.shoulder.rotation.z = -4 * D
    R.shoulder.rotation.z = 4 * D
    L.elbow.rotation.x = -12 * D
    R.elbow.rotation.x = -12 * D
  },
  walking: (a, t) => walkLegs(a, t, 1),
  typing,
  meeting,
  gaming,
  dart,
  sofa,
  garden,
  read,
  coffee,
}

/** Apply the pose for this frame. `dt` ramps `ease` so transitions are not snaps. */
export function animate(a: AnimAgent, t: number, dt: number) {
  // Handle external GLB 3D models (Mecha, Robots, Characters, TripoSR, Mixamo, Blender)
  if (a.avatar.isGLB && a.avatar.glbModel) {
    const glb = a.avatar.glbModel
    const av = a.avatar
    const isWalking = a.activity === 'walking'

    // 1. If GLB has embedded skeletal animations (Mixamo, Blender, or baked GLTF animations)
    if (av.glbMixer) {
      av.glbMixer.update(dt)

      const targetAction = isWalking
        ? (av.glbWalkAction || Array.from(av.glbActions?.values() || [])[0])
        : (av.glbIdleAction || Array.from(av.glbActions?.values() || [])[0])

      if (targetAction && !targetAction.isRunning()) {
        av.glbActions?.forEach((act) => {
          if (act !== targetAction) act.fadeOut(0.25)
        })
        targetAction.reset().fadeIn(0.25).play()
      }
    }

    // 2. Procedural Skeletal Bone Locomotion (if model has bones or limb nodes, but no baked walk clip)
    const limbs = av.glbLimbs
    const hasLimbs = !!(limbs && (limbs.leftLeg || limbs.rightLeg || limbs.leftArm || limbs.rightArm))

    if (hasLimbs && !av.glbWalkAction) {
      if (isWalking) {
        const walkCycle = t * 7.5
        const legAmp = 0.48
        const armAmp = 0.38

        // Swing legs in natural mechanical opposition
        if (limbs.leftLeg) limbs.leftLeg.rotation.x = Math.sin(walkCycle) * legAmp
        if (limbs.rightLeg) limbs.rightLeg.rotation.x = -Math.sin(walkCycle) * legAmp

        // Bend knees on backward stride
        if (limbs.leftKnee) limbs.leftKnee.rotation.x = Math.max(0, -Math.sin(walkCycle)) * 0.45
        if (limbs.rightKnee) limbs.rightKnee.rotation.x = Math.max(0, Math.sin(walkCycle)) * 0.45

        // Counter-swing arms
        if (limbs.leftArm) limbs.leftArm.rotation.x = -Math.sin(walkCycle) * armAmp
        if (limbs.rightArm) limbs.rightArm.rotation.x = Math.sin(walkCycle) * armAmp

        // Torso & head natural kinetic roll
        if (limbs.spine) limbs.spine.rotation.z = Math.sin(walkCycle) * 0.04
        if (limbs.head) limbs.head.rotation.y = -Math.sin(walkCycle) * 0.05

        // Natural mechanical body bounce
        glb.position.y = Math.abs(Math.sin(walkCycle)) * 0.06
        glb.rotation.z = Math.sin(walkCycle) * 0.035
        glb.rotation.x = 0.05
      } else {
        // Return bones to neutral rest pose smoothly
        if (limbs.leftLeg) limbs.leftLeg.rotation.x *= 0.85
        if (limbs.rightLeg) limbs.rightLeg.rotation.x *= 0.85
        if (limbs.leftKnee) limbs.leftKnee.rotation.x *= 0.85
        if (limbs.rightKnee) limbs.rightKnee.rotation.x *= 0.85
        if (limbs.leftArm) limbs.leftArm.rotation.x *= 0.85
        if (limbs.rightArm) limbs.rightArm.rotation.x *= 0.85
        if (limbs.spine) limbs.spine.rotation.z *= 0.85

        // Idle breathing and slight body sway
        glb.position.y = Math.sin(t * 1.8 + a.phase) * 0.012
        glb.rotation.set(0, Math.sin(t * 0.8 + a.phase) * 0.02, 0)
      }
      return
    }

    // 3. Procedural Heavy Combat Mecha Gait (For solid/rigid robot models without bones)
    if (!av.glbWalkAction) {
      const mode = av.glbLocomotionMode || 'mecha_stride'

      if (mode === 'mecha_hover') {
        // Jet Hover Flight Mode (Aerodynamic glide & thruster elevation)
        if (isWalking) {
          glb.position.y = 0.22 + Math.sin(t * 4.0) * 0.035
          glb.rotation.x = 0.16 // aerodynamic forward flight pitch
          glb.rotation.z = Math.sin(t * 2.5) * 0.045 // banking roll
          glb.rotation.y = 0
        } else {
          // Hovering at station
          glb.position.y = 0.14 + Math.sin(t * 2.2 + a.phase) * 0.02
          glb.rotation.set(0, Math.sin(t * 0.8 + a.phase) * 0.03, 0)
        }
      } else {
        // Mecha Stride (Heavy hydraulic robot step & weight shift)
        if (isWalking) {
          const strideSpeed = 6.8 // heavy mechanical cadence
          const stride = t * strideSpeed

          // Hydraulic step: foot rise & ground impact shock
          glb.position.y = Math.abs(Math.sin(stride)) * 0.09

          // Lateral roll (shifting massive chassis weight onto supporting leg)
          glb.rotation.z = Math.sin(stride) * 0.075

          // Forward kinetic pitch (momentum lean)
          glb.rotation.x = 0.085

          // Torso counter-yaw torque
          glb.rotation.y = Math.cos(stride) * 0.045
        } else {
          // Standing / Idle at duty station (Never sink rigid mechas through the floor)
          glb.position.y = Math.sin(t * 1.6 + a.phase) * 0.01
          glb.rotation.x = 0
          glb.rotation.z = 0
          glb.rotation.y = Math.sin(t * 0.6 + a.phase) * 0.025
        }
      }
    }
    return
  }

  a.ease = Math.min(1, a.ease + dt * 3.5)
  const fn = TABLE[a.activity] || TABLE.idle
  fn(a, t)
  // blend the first frames in from a neutral posture
  const e = a.ease
  if (e < 1) {
    const av = a.avatar
    av.chest.rotation.x *= e
    av.chest.rotation.y *= e
    av.head.rotation.x *= e
    av.head.rotation.y *= e
  }
}

/**
 * Every activity the pose table implements. Kept alongside `TABLE` so adding a
 * walk-in-the-park to the union without a pose (or vice versa) is a type error.
 */
export const ACTIVITIES: Activity[] = Object.keys(TABLE) as Activity[]
