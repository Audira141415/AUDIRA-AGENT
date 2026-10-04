/**
 * OfficeEngine.js - Isometric Canvas Engine with Depth-Sorted Room Partitions
 */

import { SpriteRenderer } from './SpriteRenderer.js';
import { OBJ_TYPES } from '../utils/constants.js';
import { audio } from './AudioManager.js';

export class OfficeEngine {
  constructor({ canvas, tileMap, registry, pathFinder, onSelectAgent, onInteractObject }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileMap = tileMap;
    this.registry = registry;
    this.pathFinder = pathFinder;
    this.onSelectAgent = onSelectAgent || (() => {});
    this.onInteractObject = onInteractObject || (() => {});

    this.renderer = new SpriteRenderer();
    this.lightingMode = 'night';

    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.05,
      targetZoom: 1.05,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      camStartX: 0,
      camStartY: 0,
      followAgentId: null
    };

    this.selectedAgentId = null;
    this.lastTime = performance.now();
    this.animationFrameId = null;

    this.initCanvasSize();
    this.initEvents();
    this.centerCamera();
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false;
  }

  centerCamera() {
    const centerGridX = this.tileMap.cols / 2;
    const centerGridY = this.tileMap.rows / 2;
    const { sx, sy } = this.renderer.gridToScreen(centerGridX, centerGridY);
    this.camera.x = sx;
    this.camera.y = sy - 30;
  }

  setLightingMode(mode) {
    this.lightingMode = mode;
    this.renderer.setLightingMode(mode);
  }

  initEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.camera.isDragging = true;
      this.camera.dragStartX = e.clientX;
      this.camera.dragStartY = e.clientY;
      this.camera.camStartX = this.camera.x;
      this.camera.camStartY = this.camera.y;
      this.camera.followAgentId = null;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.camera.isDragging) return;
      const dx = (e.clientX - this.camera.dragStartX) / this.camera.zoom;
      const dy = (e.clientY - this.camera.dragStartY) / this.camera.zoom;
      this.camera.x = this.camera.camStartX - dx;
      this.camera.y = this.camera.camStartY - dy;
    });

    window.addEventListener('mouseup', () => {
      this.camera.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.setZoom(this.camera.targetZoom * zoomFactor);
    }, { passive: false });

    // Click on Agent or Room Furniture
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - this.width / 2) / this.camera.zoom + this.camera.x;
      const worldY = (mouseY - this.height / 2) / this.camera.zoom + this.camera.y;

      // 1. Check if clicked an Agent
      let clickedAgent = null;
      for (const agent of this.registry.getAll()) {
        const { sx, sy } = this.renderer.gridToScreen(agent.x, agent.y);
        const dist = Math.hypot(worldX - sx, worldY - (sy - 15));
        if (dist < 26) {
          clickedAgent = agent;
          break;
        }
      }

      if (clickedAgent) {
        this.selectedAgentId = clickedAgent.id;
        this.camera.followAgentId = clickedAgent.id;
        this.onSelectAgent(clickedAgent);
        return;
      }

      // 2. Check if clicked Furniture
      let clickedObj = null;
      for (const obj of this.tileMap.objects) {
        const { sx, sy } = this.renderer.gridToScreen(obj.x, obj.y);
        const dist = Math.hypot(worldX - sx, worldY - (sy - 10));
        if (dist < 24) {
          clickedObj = obj;
          break;
        }
      }

      if (clickedObj) {
        this.handleObjectInteraction(clickedObj);
      }
    });
  }

  handleObjectInteraction(obj) {
    if (obj.type === OBJ_TYPES.DESK_CEO) {
      const ceo = this.registry.getByRole('CEO');
      if (ceo) {
        ceo.speak('Quarterly revenue is up 32%. Engineering execution looks solid.');
      }
    } else if (obj.type === OBJ_TYPES.COFFEE_BAR) {
      audio.playCoffee();
      const dev = this.registry.getByRole('DEV');
      if (dev) {
        dev.drinkCoffee();
      }
    } else if (obj.type === OBJ_TYPES.SERVER_RACK) {
      audio.playServerDiagnostic();
      const ops = this.registry.getByRole('DEVOPS');
      if (ops) {
        ops.speak('Datacenter security normal. Latency to Cloudflare edge: 8ms.');
      }
    } else if (obj.type === OBJ_TYPES.WHITEBOARD) {
      const pm = this.registry.getByRole('PM');
      if (pm) {
        pm.speak('Sprint roadmap: Q4 Enterprise Multi-Agent System on track.');
      }
    }
    this.onInteractObject(obj);
  }

  setZoom(val) {
    this.camera.targetZoom = Math.max(0.55, Math.min(2.4, val));
  }

  followAgent(agentId) {
    this.camera.followAgentId = agentId;
    this.selectedAgentId = agentId;
  }

  start() {
    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  update(dt) {
    this.renderer.update(dt);
    this.registry.updateAll(dt, this.pathFinder, true);

    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.15;

    if (this.camera.followAgentId) {
      const agent = this.registry.getById(this.camera.followAgentId);
      if (agent) {
        const { sx, sy } = this.renderer.gridToScreen(agent.x, agent.y);
        this.camera.x += (sx - this.camera.x) * 0.1;
        this.camera.y += (sy - 20 - this.camera.y) * 0.1;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Atmospheric Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    if (this.lightingMode === 'sunset') {
      bgGrad.addColorStop(0, '#1c1028');
      bgGrad.addColorStop(1, '#0e0715');
    } else if (this.lightingMode === 'day') {
      bgGrad.addColorStop(0, '#0e1626');
      bgGrad.addColorStop(1, '#080c14');
    } else {
      bgGrad.addColorStop(0, '#060910');
      bgGrad.addColorStop(1, '#030508');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Render Floor Tiles
    for (let y = 0; y < this.tileMap.rows; y++) {
      for (let x = 0; x < this.tileMap.cols; x++) {
        const type = this.tileMap.tiles[y][x];
        this.renderer.renderTile(ctx, x, y, type);
      }
    }

    // 2. Render Floor Optical Conduits
    this.renderer.renderFloorConduits(ctx, this.tileMap.conduitPath);

    // 3. Collect Renderables for Isometric Depth Sorting (Y-Sorting)
    const renderables = [];

    // Add Interior Room Partitions
    for (const p of this.tileMap.partitions) {
      renderables.push({
        ySort: (p.x + p.y) * 100 + 40,
        render: () => this.renderer.renderPartition(ctx, p)
      });
    }

    // Add Furniture Objects
    for (const obj of this.tileMap.objects) {
      renderables.push({
        ySort: (obj.x + obj.y) * 100 + 50,
        render: () => this.renderer.renderObject(ctx, obj)
      });
    }

    // Add Agents
    for (const agent of this.registry.getAll()) {
      const isSelected = agent.id === this.selectedAgentId;
      renderables.push({
        ySort: (agent.x + agent.y) * 100 + 60,
        render: () => this.renderer.renderAgent(ctx, agent, isSelected)
      });
    }

    renderables.sort((a, b) => a.ySort - b.ySort);

    for (const item of renderables) {
      item.render();
    }

    // 4. Render Celebration Confetti
    this.renderer.renderConfetti(ctx);

    ctx.restore();
  }
}
