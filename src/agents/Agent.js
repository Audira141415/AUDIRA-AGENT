/**
 * Agent.js - Enhanced Autonomous AI Agent with Directional Facing & Energy System
 */

import { AGENT_STATES, DIRECTIONS } from '../utils/constants.js';
import { audio } from '../engine/AudioManager.js';

export class Agent {
  constructor({ id, name, role, roleConfig, deskCoord }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.roleConfig = roleConfig;
    this.deskCoord = deskCoord;

    // Grid Coordinates & Facing Direction
    this.x = deskCoord.x;
    this.y = deskCoord.y;
    this.facing = DIRECTIONS.SOUTH_EAST;

    // Navigation & Movement
    this.targetCoord = { ...deskCoord };
    this.path = [];
    this.moveSpeed = 3.2; // Tiles per second

    // Realistic State & Energy Metrics - Active working mode at duty station
    this.state = AGENT_STATES.CODING;
    this.energy = 95; // 0 - 100%
    this.currentTask = 'Standby for instructions';
    this.currentTool = null;
    this.tokensUsed = 0;
    this.innerMonologue = 'Monitoring system queue.';
    this.memory = {};
    this.logs = [];

    // Dialogue & Speech Bubble
    this.speechText = null;
    this.speechTimer = 0;

    // Timers & Cooldowns
    this.footstepTimer = 0;
    this.typeSoundTimer = 0;
    this.autonomousTimer = 10 + Math.random() * 8; // Autonomous behavior trigger
  }

  // Update loop for agent
  update(dt, pathFinder, allowAutonomous = true) {
    // 1. Dialogue Bubble Expiry
    if (this.speechTimer > 0) {
      this.speechTimer -= dt;
      if (this.speechTimer <= 0) {
        this.speechText = null;
      }
    }

    // 2. Energy Consumption & Replenishment
    if (this.state === AGENT_STATES.CODING || this.state === AGENT_STATES.TESTING || this.state === AGENT_STATES.DEPLOYING) {
      this.energy = Math.max(10, this.energy - dt * 1.5);
    } else if (this.state === AGENT_STATES.COFFEE || this.state === AGENT_STATES.RESTING) {
      this.energy = Math.min(100, this.energy + dt * 12);
    } else {
      // Gentle idle recovery
      this.energy = Math.min(100, this.energy + dt * 0.3);
    }

    // 3. Navigation along Waypoints
    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const step = this.moveSpeed * dt;

      // Update Facing Direction based on movement vector
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? DIRECTIONS.SOUTH_EAST : DIRECTIONS.NORTH_WEST;
      } else {
        this.facing = dy > 0 ? DIRECTIONS.SOUTH_WEST : DIRECTIONS.NORTH_EAST;
      }

      if (dist <= step) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();

        if (this.path.length === 0) {
          if (this.state === AGENT_STATES.WALKING) {
            this.state = AGENT_STATES.IDLE;
          }
        }
      } else {
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }

      // Footstep sound sync
      this.footstepTimer += dt;
      if (this.footstepTimer > 0.28) {
        this.footstepTimer = 0;
        audio.playStep();
      }
    }

    // 4. Mechanical Keyboard Sound Sync
    if (this.state === AGENT_STATES.CODING) {
      this.typeSoundTimer += dt;
      if (this.typeSoundTimer > 0.08) {
        this.typeSoundTimer = 0;
        audio.playKeyboardClick();
      }
    }

    // 5. Autonomous Micro-Behaviors when completely Idle
    if (allowAutonomous && this.state === AGENT_STATES.IDLE && this.path.length === 0) {
      this.autonomousTimer -= dt;
      if (this.autonomousTimer <= 0) {
        this.triggerAutonomousMicroAction(pathFinder);
        this.autonomousTimer = 18 + Math.random() * 15;
      }
    }
  }

  // Autonomous life simulation
  triggerAutonomousMicroAction(pathFinder) {
    // If energy is below 45%, walk to coffee machine
    if (this.energy < 50) {
      this.speak('Energy getting low. Quick espresso recharge!');
      this.navigateTo(3, 14, pathFinder);
      this.state = AGENT_STATES.COFFEE;
      audio.playCoffee();
      return;
    }

    const microThoughts = {
      PM: [
        'Reviewing Q4 product roadmap & sprint velocity.',
        'Analyzing user feedback tickets from Discord channel.',
        'Double-checking API specs before assigning next sprint.'
      ],
      DEV: [
        'Refactoring abstract factory pattern in service layer.',
        'Benchmarking Rust vs Node.js worker performance.',
        'Reading release notes for TypeScript 5.6.'
      ],
      QA: [
        'Simulating edge cases for high-concurrency race conditions.',
        'Checking code coverage report: 97.8% lines covered.',
        'Inspecting automated browser subagent test recording.'
      ],
      DEVOPS: [
        'Reviewing CPU load metrics across Kubernetes worker nodes.',
        'Optimizing Docker multi-stage build cache layer.',
        'Rotating cluster TLS certificates.'
      ]
    };

    const thoughts = microThoughts[this.role] || microThoughts.DEV;
    const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
    this.innerMonologue = randomThought;
  }

  navigateTo(destX, destY, pathFinder) {
    const computedPath = pathFinder.findPath(this.x, this.y, destX, destY);
    if (computedPath.length > 0) {
      this.path = computedPath;
      this.state = AGENT_STATES.WALKING;
    }
  }

  returnToDesk(pathFinder) {
    this.navigateTo(this.deskCoord.x, this.deskCoord.y, pathFinder);
  }

  speak(text, duration = 3.6) {
    this.speechText = text;
    this.speechTimer = duration;
    audio.playBlip(this.roleConfig.id === 'dev' ? 720 : 540);
    this.addLog(`"${text}"`, 'dialogue');
  }

  setTask(taskDescription, toolName = null) {
    this.currentTask = taskDescription;
    this.currentTool = toolName;
    if (toolName) {
      this.addLog(`Executing tool [${toolName}] for task: ${taskDescription}`, 'tool');
    } else {
      this.addLog(`Starting task: ${taskDescription}`, 'task');
    }
  }

  setThought(thought) {
    this.innerMonologue = thought;
  }

  addLog(message, category = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.logs.unshift({
      timestamp,
      message,
      category
    });

    if (this.logs.length > 80) {
      this.logs.pop();
    }
  }

  consumeTokens(tokens) {
    this.tokensUsed += tokens;
  }

  drinkCoffee() {
    this.energy = 100;
    this.state = AGENT_STATES.COFFEE;
    audio.playCoffee();
    this.speak('Espresso boost! Energy restored to 100% ☕');
  }

  workAtDesk() {
    this.state = AGENT_STATES.CODING;
  }
}
