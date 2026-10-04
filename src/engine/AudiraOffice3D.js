/**
 * AudiraOffice3D.js - Three.js 3D Virtual NOC Command Center Engine Adapter
 * Integrates 3D low-poly procedural world, rigged avatars, dynamic lighting,
 * and the 9-Screen NOC Video Wall with AUDIRA-DCOS NOC agents.
 */

import * as THREE from 'three';
import { createScene } from './3d/scene';

export const SECTOR_LOCATIONS = {
  hall: { target: [0, 2.6, -17.5], cam: [0, 8.2, 5.0], label: 'Studio Floor (Panoramik)' },
  video_wall: { target: [0, 4.2, -24.5], cam: [0, 6.0, -10.0], label: 'Master Production Wall' },
  dev_desks: { target: [0, 2.0, -8.0], cam: [0, 6.5, 2.0], label: 'Stasiun Operator AI' },
  sector_arsenal: { target: [-23.5, 2.2, -17.0], cam: [-23.5, 6.5, -7.0], label: 'Sektor 01 // Arsenal Senjata' },
  sector_mecha: { target: [-23.5, 2.8, 0.0], cam: [-23.5, 7.5, 10.0], label: 'Sektor 02 // Mecha Bay' },
  sector_drone: { target: [-23.5, 2.5, 16.0], cam: [-23.5, 7.0, 24.5], label: 'Sektor 04 // Drone Hangar' },
  sector_quantum: { target: [23.5, 2.8, 16.0], cam: [23.5, 7.5, 24.5], label: 'Sektor 05 // Quantum Core' },
  sector_arcade: { target: [0, 2.0, 16.0], cam: [0, 6.0, 24.5], label: 'Sektor 06 // Cyber Arena' },
  sector_pantry: { target: [14.0, 2.0, 18.0], cam: [14.0, 5.5, 24.5], label: 'Crew Lounge & Espresso' },
  sector_warroom: { target: [23.5, 2.2, -8.0], cam: [23.5, 6.5, 0.0], label: 'War Room Holo-Globe' },
  sector_racks: { target: [-10.0, 2.0, -9.0], cam: [-10.0, 5.5, -2.0], label: 'Server Rack Cluster' },
  conveyor_runway: { target: [0, 1.8, -19.8], cam: [0, 5.0, -11.0], label: 'Runway Catwalk Pameran Bergerak 56m' },
  top_down: { target: [0, 0, -5.0], cam: [0, 48, -4.9], label: 'Pandangan Atas (Top-Down)' }
};

export class AudiraOffice3D {
  constructor({
    canvas,
    labelHost,
    registry,
    onSelectAgent,
    onInteractObject,
    onOpenVideoWall,
    onServerRackClick,
    onCoffeeMachineClick,
    onMeetingTableClick,
    onConveyorPodClick,
    onSectorClick,
  }) {
    this.canvas = canvas;
    this.labelHost = labelHost;
    this.registry = registry;
    this.onSelectAgent = onSelectAgent || (() => {});
    this.onInteractObject = onInteractObject || (() => {});
    this.onOpenVideoWall = onOpenVideoWall || (() => {});
    this.onServerRackClick = onServerRackClick || (() => {});
    this.onCoffeeMachineClick = onCoffeeMachineClick || (() => {});
    this.onMeetingTableClick = onMeetingTableClick || (() => {});
    this.onConveyorPodClick = onConveyorPodClick || (() => {});
    this.onSectorClick = onSectorClick || (() => {});

    this.selectedAgentId = 'audira_lead';
    this.scene = null;
    this.lastSpeechMap = new Map();

    // Map AUDIRA-DCOS NOC agents to 3D desks & roles (10 Specialized Consoles)
    this.agentSlotMap = {
      audira_lead: { role: 'ceo', deskIndex: 0 },          // Arthur / Director Desk
      routex_net:  { role: 'backend', deskIndex: 1 },      // ROUTEX / Network BGP Console
      chronos_ops: { role: 'orchestrator', deskIndex: 2 }, // CHRONOS / Operations Duty Console
      resolv_desk: { role: 'frontend', deskIndex: 3 },     // RESOLV / Service Desk Console
      cipher_soc:  { role: 'qa', deskIndex: 4 },           // CIPHER / Cyber SOC Threat Console
      voltis_mep:  { role: 'devops', deskIndex: 5 },       // VOLTIS / MEP Electrical Console
      thermo_hvac: { role: 'hvac', deskIndex: 6 },         // THERMO / HVAC Thermodynamics Console
      nexus_san:   { role: 'database', deskIndex: 7 },     // NEXUS / SAN Storage Console
      aegis_sec:   { role: 'fire_sec', deskIndex: 8 },     // AEGIS / Automated QA Bot Playtester Console
      kairos_ai:   { role: 'ai_sentry', deskIndex: 9 },    // KAIROS / Autonomous AI Telemetry Console
    };

    this.init();
  }

  get videoWall() {
    return this.scene?.videoWall;
  }

  init() {
    this.scene = createScene(this.canvas, this.labelHost, {
      onVideoWallClick: () => {
        this.onOpenVideoWall();
      },
      onServerRackClick: (rackLabel) => {
        this.onServerRackClick(rackLabel);
      },
      onCoffeeMachineClick: () => {
        this.onCoffeeMachineClick();
      },
      onMeetingTableClick: () => {
        this.onMeetingTableClick();
      },
      onConveyorPodClick: (podIndex, slotNum) => {
        this.onConveyorPodClick(podIndex, slotNum);
      },
      onSectorClick: (sectorId) => {
        this.onSectorClick(sectorId);
      },
      onMonitorClick: (deskIndex) => {
        const found = Object.entries(this.agentSlotMap).find(
          ([, cfg]) => cfg.deskIndex === deskIndex
        );
        if (found) {
          const agent = this.registry.getById(found[0]);
          if (agent) {
            this.onSelectAgent(agent);
            this.onInteractObject({
              label: `Stasiun Kerja Game Studio 3D: ${agent.name} (${agent.role})`
            });
          }
        }
      },
      onAvatarClick: (name) => {
        const agent = this.registry.getAll().find(
          (a) => a.name.toLowerCase() === name.toLowerCase()
        );
        if (agent) {
          this.selectedAgentId = agent.id;
          this.onSelectAgent(agent);
          this.focusAgent(agent.id);
          this.speakAgent(agent.name, agent.innerMonologue || agent.currentTask || 'Siaga di stasiun kerja game dev!');
        }
      },
      onTaskClick: (taskId) => {
        this.onInteractObject({
          label: `Sprint Task Game Studio: #${taskId}`
        });
      },
    });

    // Populate NOC mission-critical tickets on 3D board
    this.syncBoardTasks();

    // Initial agent sync
    this.syncAgents();

    // Resize observer
    const parent = this.canvas.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => {
        this.scene.resize(parent.clientWidth, parent.clientHeight);
      });
      this.resizeObserver.observe(parent);
      this.scene.resize(parent.clientWidth, parent.clientHeight);
    }

    // Start render loop
    this.scene.start();

    // Periodic sync with AUDIRA's AgentRegistry
    this.syncInterval = setInterval(() => {
      this.syncAgents();
    }, 200);
  }

  syncBoardTasks() {
    const defaultTasks = [
      {
        id: 'DEV-101',
        title: 'WebGL Draw Calls Culling & 60 FPS Engine Optimization',
        status: 'running',
        assignee: 'ROUTEX',
        priority: 1,
      },
      {
        id: 'DEV-102',
        title: 'Cyber City Sector 07 NavMesh & Level Geometry Bake',
        status: 'done',
        assignee: 'CHRONOS',
        priority: 1,
      },
      {
        id: 'DEV-103',
        title: 'Branching Dialogue Tree & Quest Combat Balancing',
        status: 'review',
        assignee: 'RESOLV',
        priority: 2,
      },
      {
        id: 'DEV-104',
        title: 'Low-Poly Mecha 3D Model (.GLB) Rigging & Normal Atlas',
        status: 'ready',
        assignee: 'VOLTIS',
        priority: 2,
      },
    ];
    this.scene.setTasks(defaultTasks);
  }

  syncAgents() {
    if (!this.scene) return;

    const audiraAgents = this.registry.getAll();
    const agentsPayload = audiraAgents.map((a, idx) => {
      let slot = this.agentSlotMap[a.id];
      if (!slot) {
        const avatarRoles = ['backend', 'frontend', 'orchestrator', 'qa'];
        const chosenRole = avatarRoles[idx % avatarRoles.length];
        const chosenDesk = idx < 10 ? idx : (idx % 10);
        slot = { role: chosenRole, deskIndex: chosenDesk };
        this.agentSlotMap[a.id] = slot;
      }
      
      // Map AUDIRA state to 3D status (case-insensitive)
      // Default state for operators is active working at their duty workstation
      const st = String(a.state || 'working').toLowerCase();
      let status = 'working';
      if (['coffee', 'resting', 'pantry'].includes(st)) {
        status = 'idle';
      } else if (st === 'meeting') {
        status = 'meeting';
      } else if (st === 'thinking' || st === 'review' || st === 'inspecting') {
        status = 'review';
      } else if (st === 'blocked') {
        status = 'blocked';
      } else {
        status = 'working';
      }

      // Check for new speech text to trigger 3D speech bubble
      if (a.speechText && this.lastSpeechMap.get(a.id) !== a.speechText) {
        this.lastSpeechMap.set(a.id, a.speechText);
        this.scene.say(a.name, a.speechText, 8000);
      }

      return {
        name: a.name,
        displayName: `${a.name} (${a.role})`,
        role: slot.role,
        deskIndex: slot.deskIndex,
        status: status,
        currentTaskId: a.currentTask,
        id: a.id,
        color: a.roleConfig?.color,
        rawRole: a.role,
        modelUrl: a.modelUrl || a.roleConfig?.modelUrl,
        modelName: a.modelName || a.roleConfig?.modelName,
        roleConfig: a.roleConfig,
      };
    });

    this.scene.syncAgents(agentsPayload);

    // If meeting is active in AUDIRA, sync meeting table state
    const inMeeting = audiraAgents.filter((a) => a.state === 'MEETING');
    if (inMeeting.length > 0) {
      this.hasActiveMeeting = true;
      this.scene.setMeeting({
        id: 'studio-sprint-briefing',
        topic: 'AUDIRA Studio Sprint Briefing',
        participants: inMeeting.map((a) => a.name),
        moderator: 'Arthur',
        mode: 'auto',
        state: 'running',
        phase: 'discussion',
        currentSpeaker: inMeeting[0]?.name || null,
        turns: [],
        minutes: '',
      });
    } else if (this.hasActiveMeeting) {
      this.hasActiveMeeting = false;
      this.scene.setMeeting(null);
    }
  }

  followAgent(agentId) {
    const agent = this.registry.getById(agentId);
    if (!agent || !this.scene) return;

    const target3D = this.scene.byName.get(agent.name);
    if (target3D && target3D.avatar) {
      const pos = target3D.avatar.group.position;
      const controls = this.scene.controls;
      if (controls) {
        controls.target.set(pos.x, 1.35, pos.z);
        // Position camera in the open aisle facing the operator with room for speech bubble
        const offsetX = pos.x <= 0 ? 2.3 : -2.3;
        this.scene.camera.position.set(pos.x + offsetX, 2.05, pos.z + 3.1);
      }
    }
  }

  focusArthur() {
    this.followAgent('audira_lead');
  }

  setTopDownView() {
    if (!this.scene) return;
    this.scene.controls.target.set(0, 0, -5.0);
    this.scene.camera.position.set(0, 48, -4.9);
  }

  centerCamera() {
    if (!this.scene) return;
    this.scene.controls.target.set(0, 3.0, -15.0);
    this.scene.camera.position.set(0, 6.2, 1.5);
  }

  focusVideoWall() {
    if (!this.scene) return;
    // Focus directly on the 22m 9-screen Video Wall on the North wall
    this.scene.controls.target.set(0, 4.2, -24.5);
    this.scene.camera.position.set(0, 6.0, -10.0);
  }

  setZoom(factor) {
    if (!this.scene) return;
    const cam = this.scene.camera;
    cam.zoom = Math.max(0.5, Math.min(2.5, cam.zoom * factor));
    cam.updateProjectionMatrix();
  }

  panCamera(direction, step = 3.5) {
    if (!this.scene || !this.scene.camera || !this.scene.controls) return;
    const cam = this.scene.camera;
    const controls = this.scene.controls;

    // Calculate camera horizontal forward direction in XZ plane
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    // Perpendicular horizontal right vector
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const delta = new THREE.Vector3();

    switch (direction) {
      case 'forward':
      case 'up':
        delta.addScaledVector(forward, step);
        break;
      case 'backward':
      case 'down':
        delta.addScaledVector(forward, -step);
        break;
      case 'left':
        delta.addScaledVector(right, -step);
        break;
      case 'right':
        delta.addScaledVector(right, step);
        break;
      case 'elevate_up':
        delta.y = step * 0.75;
        break;
      case 'elevate_down':
        delta.y = -step * 0.75;
        break;
    }

    // Displace both target and camera position together to pan view
    controls.target.add(delta);
    cam.position.add(delta);

    // Clamp coordinates within 68m x 52m grand cyber studio boundaries
    controls.target.x = Math.max(-32, Math.min(32, controls.target.x));
    controls.target.z = Math.max(-24, Math.min(24, controls.target.z));
    controls.target.y = Math.max(0.5, Math.min(15, controls.target.y));

    cam.position.x = Math.max(-40, Math.min(40, cam.position.x));
    cam.position.z = Math.max(-35, Math.min(35, cam.position.z));
    cam.position.y = Math.max(1.8, Math.min(55, cam.position.y));

    controls.update();
  }

  zoomCamera(delta) {
    if (!this.scene || !this.scene.camera || !this.scene.controls) return;
    const cam = this.scene.camera;
    const controls = this.scene.controls;

    const offset = new THREE.Vector3().subVectors(cam.position, controls.target);
    const factor = delta > 0 ? 0.85 : 1.18;
    offset.multiplyScalar(factor);

    const dist = offset.length();
    if (dist >= 2.5 && dist <= 90) {
      cam.position.addVectors(controls.target, offset);
      controls.update();
    }
  }

  setNavMode(mode) {
    if (!this.scene || !this.scene.controls) return;
    const controls = this.scene.controls;
    this.navMode = mode;
    if (mode === 'pan') {
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    } else {
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    }
  }

  smoothFlyTo(targetPos, camPos, durationMs = 750) {
    if (!this.scene || !this.scene.controls || !this.scene.camera) return;
    const controls = this.scene.controls;
    const camera = this.scene.camera;

    if (this._flyAnimationId) {
      cancelAnimationFrame(this._flyAnimationId);
      this._flyAnimationId = null;
    }

    const startTarget = controls.target.clone();
    const startCam = camera.position.clone();
    const endTarget = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
    const endCam = new THREE.Vector3(camPos[0], camPos[1], camPos[2]);

    const startTime = performance.now();

    const animateFly = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      // Cubic ease-out: 1 - pow(1 - t, 3)
      const ease = 1 - Math.pow(1 - progress, 3);

      controls.target.lerpVectors(startTarget, endTarget, ease);
      camera.position.lerpVectors(startCam, endCam, ease);
      controls.update();

      if (progress < 1.0) {
        this._flyAnimationId = requestAnimationFrame(animateFly);
      } else {
        this._flyAnimationId = null;
      }
    };
    this._flyAnimationId = requestAnimationFrame(animateFly);
  }

  flyToSector(sectorKey, smooth = true) {
    if (!this.scene || !this.scene.controls) return;
    const sec = SECTOR_LOCATIONS[sectorKey];
    if (!sec) return;

    if (smooth) {
      this.smoothFlyTo(sec.target, sec.cam);
    } else {
      this.scene.controls.target.set(sec.target[0], sec.target[1], sec.target[2]);
      this.scene.camera.position.set(sec.cam[0], sec.cam[1], sec.cam[2]);
      this.scene.controls.update();
    }
  }

  focusConveyorPod(podIndex, smooth = true) {
    if (!this.scene?.conveyor || !this.scene.controls) return;
    const pods = this.scene.conveyor.getPods();
    const pod = pods[podIndex];
    if (pod) {
      const podX = pod.x;
      const target = [podX, 1.8, -19.8];
      const cam = [podX, 4.4, -13.6];
      if (smooth) {
        this.smoothFlyTo(target, cam, 700);
      } else {
        this.scene.controls.target.set(podX, 1.8, -19.8);
        this.scene.camera.position.set(podX, 4.4, -13.6);
        this.scene.controls.update();
      }
    }
  }

  setConveyorSpeed(speed) {
    if (this.scene?.conveyor?.setSpeedMultiplier) {
      this.scene.conveyor.setSpeedMultiplier(speed);
    }
  }

  toggleConveyor(pause) {
    if (this.scene?.conveyor?.togglePause) {
      return this.scene.conveyor.togglePause(pause);
    }
    return false;
  }

  setConveyorDirection(dir) {
    if (this.scene?.conveyor?.setDirection) {
      this.scene.conveyor.setDirection(dir);
    }
  }

  setConveyorTurntable(spin, speed) {
    if (this.scene?.conveyor?.setTurntableSpin) {
      this.scene.conveyor.setTurntableSpin(spin, speed);
    }
  }

  getConveyorState() {
    if (this.scene?.conveyor?.getRunwayState) {
      return this.scene.conveyor.getRunwayState();
    }
    return null;
  }

  async applyConveyorPreset(presetName) {
    if (this.scene?.conveyor?.applyThemePreset) {
      await this.scene.conveyor.applyThemePreset(presetName);
      return true;
    }
    return false;
  }

  resetCamera() {
    this.flyToSector('hall');
  }

  setLightingMode(mode) {
    if (!this.scene) return;
    if (mode === 'day') {
      this.scene.setHour(12);
    } else if (mode === 'sunset') {
      this.scene.setHour(17);
    } else {
      this.scene.setHour(22);
    }
  }

  loadAgentGLB(agentName, source) {
    if (this.scene && this.scene.loadAgentGLB) {
      return this.scene.loadAgentGLB(agentName, source);
    }
    return Promise.resolve(false);
  }

  clearAgentGLB(agentName) {
    if (this.scene && this.scene.clearAgentGLB) {
      this.scene.clearAgentGLB(agentName);
    }
  }

  setAgentLocomotion(agentName, mode) {
    if (this.scene && this.scene.setAgentLocomotion) {
      this.scene.setAgentLocomotion(agentName, mode);
    }
  }

  testWalkAgent(agentName) {
    if (this.scene && this.scene.testWalkAgent) {
      this.scene.testWalkAgent(agentName);
    }
  }

  sendAgentToPantry(agentName) {
    if (this.scene && this.scene.sendAgentToPantry) {
      this.scene.sendAgentToPantry(agentName);
    }
  }

  sendAgentToDesk(agentName) {
    if (this.scene && this.scene.sendAgentToDesk) {
      this.scene.sendAgentToDesk(agentName);
    }
  }

  sendAgentToVideoWall(agentName) {
    if (this.scene && this.scene.sendAgentToVideoWall) {
      this.scene.sendAgentToVideoWall(agentName);
    }
  }

  sendAgentToRack(agentName, rackLabel) {
    if (this.scene && this.scene.sendAgentToRack) {
      this.scene.sendAgentToRack(agentName, rackLabel);
    }
  }

  triggerAllHandsStandup() {
    if (this.scene && this.scene.triggerAllHandsStandup) {
      this.scene.triggerAllHandsStandup();
    }
  }

  async mountSectorGLB(sectorId, source, customHeight) {
    if (!this.scene || !this.scene.studioSectors) return false;
    try {
      const { loadGLB } = await import('./3d/modelLoader');
      const targetHeight = customHeight ??
        (sectorId === 'mecha' ? 4.2 : sectorId === 'drone' ? 1.6 : sectorId === 'weapon' ? 1.2 : 2.8);
      const loaded = await loadGLB(source, {
        targetHeight,
        groundY: true,
      });
      this.scene.studioSectors.mountAssetToSector(sectorId, loaded.root);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to mountSectorGLB:', e);
      return false;
    }
  }

  async loadConveyorGLB(podIndex, source, title, sub, targetHeight, clipName, animSpeed, shadingMode) {
    if (!this.scene || !this.scene.conveyor) return false;
    try {
      await this.scene.conveyor.loadGLBToPod(podIndex, source, title, sub, targetHeight, clipName, animSpeed, shadingMode);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to loadConveyorGLB:', e);
      return false;
    }
  }

  setConveyorPodShading(podIndex, mode) {
    if (!this.scene || !this.scene.conveyor) return false;
    try {
      this.scene.conveyor.setPodShadingMode(podIndex, mode);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to setConveyorPodShading:', e);
      return false;
    }
  }

  setConveyorPodAnimation(podIndex, clipName, speed) {
    if (!this.scene || !this.scene.conveyor) return false;
    try {
      this.scene.conveyor.setPodAnimation(podIndex, clipName, speed);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to setConveyorPodAnimation:', e);
      return false;
    }
  }

  toggleConveyorPodAnimation(podIndex, isPlaying) {
    if (!this.scene || !this.scene.conveyor) return false;
    try {
      this.scene.conveyor.togglePodAnimation(podIndex, isPlaying);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to toggleConveyorPodAnimation:', e);
      return false;
    }
  }

  clearConveyorPod(podIndex) {
    if (!this.scene || !this.scene.conveyor) return false;
    try {
      this.scene.conveyor.clearPod(podIndex);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to clearConveyorPod:', e);
      return false;
    }
  }

  clearSector(sectorId) {
    if (!this.scene || !this.scene.studioSectors) return false;
    try {
      this.scene.studioSectors.clearSectorAsset(sectorId);
      return true;
    } catch (e) {
      console.warn('[AudiraOffice3D] Failed to clearSector:', e);
      return false;
    }
  }

  speakAgent(agentName, text, ms = 7500) {
    if (this.scene && this.scene.say) {
      this.scene.say(agentName, text, ms);
    }
  }

  dispose() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.scene) this.scene.dispose();
  }
}
