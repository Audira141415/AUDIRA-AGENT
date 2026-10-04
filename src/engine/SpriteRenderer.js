/**
 * SpriteRenderer.js - Ultra-Detailed Pixel Art with Corporate Room Partitions & Cubicles
 */

import { TILE_WIDTH, TILE_HEIGHT, OBJ_TYPES, TILE_TYPES, AGENT_STATES, DIRECTIONS } from '../utils/constants.js';

export class SpriteRenderer {
  constructor() {
    this.animTime = 0;
    this.lightingMode = 'night';
    this.confettiParticles = [];
  }

  update(dt) {
    this.animTime += dt;

    if (this.confettiParticles.length > 0) {
      for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
        const p = this.confettiParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.rotation += p.vRot * dt;
        p.life -= dt;
        if (p.life <= 0) {
          this.confettiParticles.splice(i, 1);
        }
      }
    }
  }

  setLightingMode(mode) {
    this.lightingMode = mode;
  }

  spawnConfetti(screenX, screenY) {
    const colors = ['#f59e0b', '#38bdf8', '#a855f7', '#fbbf24', '#34d399', '#f43f5e', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 130;
      this.confettiParticles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        vRot: (Math.random() - 0.5) * 12,
        rotation: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 2.0 + Math.random() * 0.8,
        size: 3 + Math.random() * 3.5
      });
    }
  }

  gridToScreen(gx, gy) {
    const sx = (gx - gy) * (TILE_WIDTH / 2);
    const sy = (gx + gy) * (TILE_HEIGHT / 2);
    return { sx, sy };
  }

  // ==========================================
  // FLOOR TILES RENDERING
  // ==========================================
  renderTile(ctx, gx, gy, type) {
    const { sx, sy } = this.gridToScreen(gx, gy);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;

    ctx.save();

    if (type === TILE_TYPES.WINDOW_SKYLINE) {
      this.drawSkylineWindow(ctx, sx, sy, hw, hh, gx);
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();

    if (type === TILE_TYPES.FLOOR_CARPET_EXECUTIVE) {
      // 1. Ruang Direktur: Royal Navy Carpet with Gold Trim Seam
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#d97706'; // Gold perimeter border
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Delicate luxury inner pattern
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.strokeRect(sx - 4, sy - 2, 8, 4);
    } else if (type === TILE_TYPES.FLOOR_CARPET_BOARDROOM) {
      // 2. Boardroom Carpet: Executive Woven Charcoal
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (type === TILE_TYPES.FLOOR_PANTRY) {
      // 3. Pantry: Warm Cafe Hexagonal Tile
      const isAlt = (gx + gy) % 2 === 0;
      ctx.fillStyle = isAlt ? '#292524' : '#1c1917';
      ctx.fill();
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else if (type === TILE_TYPES.FLOOR_SERVER) {
      // 4. Datacenter: Anti-Static High-Tech Cyber Tile
      ctx.fillStyle = '#080d1a';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const pulse = Math.sin(this.animTime * 3 + gx) > 0;
      ctx.fillStyle = pulse ? '#38bdf8' : '#075985';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    } else if (type === TILE_TYPES.FLOOR_DARK) {
      // 5. Dev Bullpen: Modern Concrete Slate
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // 6. Polished Walnut Hardwood (Corridor & Manager Room)
      const isAlt = (gx + gy) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1a2234' : '#151c2b';
      ctx.fill();
      ctx.strokeStyle = '#0e131d';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Skyline Windows on North exterior wall
  drawSkylineWindow(ctx, sx, sy, hw, hh, colIdx) {
    const wallHeight = 52;

    ctx.fillStyle = '#050811';
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx + hw, sy - wallHeight);
    ctx.lineTo(sx - hw, sy - wallHeight);
    ctx.closePath();
    ctx.clip();

    const skyGrad = ctx.createLinearGradient(sx, sy - wallHeight - 20, sx, sy);
    if (this.lightingMode === 'sunset') {
      skyGrad.addColorStop(0, '#3b0764');
      skyGrad.addColorStop(0.6, '#9a3412');
      skyGrad.addColorStop(1, '#ea580c');
    } else if (this.lightingMode === 'day') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#93c5fd');
    } else {
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.7, '#0c152e');
      skyGrad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(sx - hw - 20, sy - wallHeight - 20, hw * 2 + 40, wallHeight + 40);

    // Skyscraper Silhouettes
    ctx.fillStyle = '#060a17';
    const bHeight = 18 + (colIdx % 4) * 10;
    ctx.fillRect(sx - 8, sy - bHeight - 4, 18, bHeight + 10);

    const winColor = this.lightingMode === 'sunset' ? '#fde047' : '#38bdf8';
    ctx.fillStyle = winColor;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        if (Math.sin(this.animTime * 2 + colIdx + r + c) > -0.3) {
          ctx.fillRect(sx - 5 + c * 8, sy - bHeight + 2 + r * 6, 3, 2);
        }
      }
    }

    ctx.restore();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx, sy - hh - wallHeight);
    ctx.moveTo(sx + hw, sy);
    ctx.lineTo(sx + hw, sy - wallHeight);
    ctx.stroke();
  }

  // ==========================================
  // INTERIOR ROOM PARTITIONS & SKAT-SKAT RUANGAN
  // ==========================================
  renderPartition(ctx, p) {
    const { sx, sy } = this.gridToScreen(p.x, p.y);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const wallHeight = 36; // Mid-height architectural glass partition

    ctx.save();
    ctx.translate(sx, sy);

    if (p.type === 'h_glass' || p.type === 'v_glass' || p.type === 'corner') {
      // 1. Sleek Aluminum Frame
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;

      // 2. Tinted Frosted Glass Panes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)'; // Cyan glass tint
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';

      ctx.beginPath();
      if (p.type === 'h_glass') {
        // Horizontal Glass Partition (along South face)
        ctx.moveTo(-hw, 0);
        ctx.lineTo(0, hh);
        ctx.lineTo(0, hh - wallHeight);
        ctx.lineTo(-hw, -wallHeight);
        ctx.closePath();
      } else if (p.type === 'v_glass') {
        // Vertical Glass Partition (along East face)
        ctx.moveTo(0, -hh);
        ctx.lineTo(hw, 0);
        ctx.lineTo(hw, -wallHeight);
        ctx.lineTo(0, -hh - wallHeight);
        ctx.closePath();
      } else {
        // Corner Post
        ctx.moveTo(-hw, 0);
        ctx.lineTo(0, hh);
        ctx.lineTo(hw, 0);
        ctx.lineTo(hw, -wallHeight);
        ctx.lineTo(0, hh - wallHeight);
        ctx.lineTo(-hw, -wallHeight);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();

      // Glass shine reflection line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, -wallHeight + 6);
      ctx.lineTo(4, -4);
      ctx.stroke();
    } else if (p.type === 'h_wall' || p.type === 'v_wall') {
      // Solid Interior Acoustic Drywall Partition
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(0, hh);
      ctx.lineTo(0, hh - wallHeight);
      ctx.lineTo(-hw, -wallHeight);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.type === 'door') {
      // Doorway Arch Header & Room Signboard
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -wallHeight - 12, 32, 14);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-16, -wallHeight - 12, 32, 14);

      if (p.label) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 7.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, 0, -wallHeight - 2);
      }

      // Open Door Frame Posts
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -wallHeight);
      ctx.lineTo(-16, 4);
      ctx.moveTo(16, -wallHeight);
      ctx.lineTo(16, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // FLOOR FIBER-OPTIC CONDUITS
  // ==========================================
  renderFloorConduits(ctx, conduitPath) {
    if (!conduitPath || conduitPath.length < 2) return;

    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0369a1';
    ctx.beginPath();

    conduitPath.forEach((pt, idx) => {
      const { sx, sy } = this.gridToScreen(pt.x, pt.y);
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    const totalPts = conduitPath.length;
    const pulseProgress = (this.animTime * 3.5) % totalPts;
    const curIdx = Math.floor(pulseProgress);
    const nextIdx = (curIdx + 1) % totalPts;
    const t = pulseProgress - curIdx;

    const p1 = this.gridToScreen(conduitPath[curIdx].x, conduitPath[curIdx].y);
    const p2 = this.gridToScreen(conduitPath[nextIdx].x, conduitPath[nextIdx].y);

    const px = p1.sx + (p2.sx - p1.sx) * t;
    const py = p1.sy + (p2.sy - p1.sy) * t;

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // FURNITURE & ROOM OBJECTS
  // ==========================================
  renderObject(ctx, obj) {
    const { sx, sy } = this.gridToScreen(obj.x, obj.y);

    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (obj.type) {
      case OBJ_TYPES.DESK_CEO:
        this.drawCeoDesk(ctx, obj);
        break;

      case OBJ_TYPES.DESK_MANAGER:
        this.drawManagerDesk(ctx, obj);
        break;

      case OBJ_TYPES.DESK_DEV_CUBICLE:
      case OBJ_TYPES.DESK_QA_CUBICLE:
        this.drawCubicleWorkstation(ctx, obj);
        break;

      case OBJ_TYPES.SERVER_RACK:
        this.drawServerRack(ctx, obj);
        break;

      case OBJ_TYPES.WHITEBOARD:
        this.drawWhiteboard(ctx, obj);
        break;

      case OBJ_TYPES.COFFEE_BAR:
        this.drawCoffeeBar(ctx, obj);
        break;

      case OBJ_TYPES.WATER_COOLER:
        this.drawWaterCooler(ctx, obj);
        break;

      case OBJ_TYPES.SOFA_EXECUTIVE:
        this.drawExecutiveSofa(ctx, obj);
        break;

      case OBJ_TYPES.SOFA_PANTRY:
        this.drawPantrySofa(ctx, obj);
        break;

      case OBJ_TYPES.PLANT:
        this.drawPlant(ctx, obj);
        break;

      case OBJ_TYPES.MEETING_TABLE:
        this.drawMeetingTable(ctx, obj);
        break;

      case OBJ_TYPES.BOOKSHELF_EXECUTIVE:
        this.drawExecutiveBookshelf(ctx, obj);
        break;
    }

    ctx.restore();
  }

  // Ruang Direktur: L-Shaped Luxury Mahogany Desk with Brass Nameplate
  drawCeoDesk(ctx, obj) {
    // Executive desk surface
    ctx.fillStyle = '#451a03'; // Rich dark mahogany
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(28, 2);
    ctx.lineTo(0, 16);
    ctx.lineTo(-28, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309'; // Gold edge trim
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Solid Wood Pedestal Bases
    ctx.fillStyle = '#291205';
    ctx.fillRect(-26, 2, 6, 16);
    ctx.fillRect(20, 2, 6, 16);

    // Executive Laptop & Gold Lamp
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-6, -18, 14, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -16, 10, 6);

    // Brass Desk Nameplate ("ARTHUR - CEO")
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-5, 5, 10, 3);

    // High-back Executive Leather Armchair
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();
  }

  // Ruang Manager: Alice's Standing Workstation
  drawManagerDesk(ctx, obj) {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(24, 2);
    ctx.lineTo(0, 14);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.stroke();

    // Laptop & Notebook
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -22, 14, 10);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(-4, -20, 10, 6);

    // Chair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 16, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Engineering Bullpen: Cubicle with Acoustic Partition Screens (Skat Meja)
  drawCubicleWorkstation(ctx, obj) {
    const isDev = obj.type === OBJ_TYPES.DESK_DEV_CUBICLE;
    const accentColor = isDev ? '#38bdf8' : '#fbbf24';

    // 1. Fabric Acoustic Cubicle Partition Screens (Skat Meja)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;

    // Back partition screen
    ctx.fillRect(-26, -26, 32, 28);
    ctx.strokeRect(-26, -26, 32, 28);

    // Acoustic fabric texture lines
    ctx.fillStyle = isDev ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    ctx.fillRect(-24, -24, 28, 24);

    // Sticky notes on cubicle wall
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-20, -20, 5, 5);
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(-12, -20, 5, 5);

    // 2. Desk Slab
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(24, 2);
    ctx.lineTo(0, 14);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fill();

    // 3. Dual Ultrawide Displays
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-10, -28, 22, 12, 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Glowing screen with syntax highlighting
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(-8, -26, 18, 8);
    ctx.shadowBlur = 0;

    // Chair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 16, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.stroke();
  }

  // Server Datacenter Racks
  drawServerRack(ctx, obj) {
    ctx.fillStyle = '#070b14';
    ctx.fillRect(-15, -44, 30, 48);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-15, -44, 30, 48);

    for (let i = 0; i < 5; i++) {
      const y = -40 + i * 8.5;
      ctx.fillStyle = '#161e2e';
      ctx.fillRect(-12, y, 24, 6.5);

      const blink = Math.sin(this.animTime * 7 + i * 1.5) > 0;
      ctx.fillStyle = blink ? '#34d399' : '#065f46';
      ctx.fillRect(-9, y + 2, 2, 2);

      const blink2 = Math.sin(this.animTime * 10 + i * 2.2) > 0;
      ctx.fillStyle = blink2 ? '#38bdf8' : '#0369a1';
      ctx.fillRect(-5, y + 2, 2, 2);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, y + 2, 6, 2);
    }
  }

  // Whiteboard Kanban
  drawWhiteboard(ctx, obj) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-18, -32, 36, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-16, -30, 32, 28);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-14, -28, 6, 6);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-6, -28, 6, 6);
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(2, -28, 6, 6);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-10, -16);
    ctx.lineTo(0, -16);
    ctx.lineTo(0, -9);
    ctx.lineTo(10, -9);
    ctx.stroke();
  }

  // Commercial Espresso Coffee Bar
  drawCoffeeBar(ctx, obj) {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(22, 2);
    ctx.lineTo(0, 13);
    ctx.lineTo(-22, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#292524';
    ctx.fillRect(-20, 2, 40, 13);

    // Espresso Machine
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-10, -25, 20, 18);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(-10, -25, 20, 18);

    for (let s = 0; s < 3; s++) {
      const steamAge = (this.animTime * 1.5 + s * 0.4) % 1;
      const steamY = -27 - steamAge * 16;
      const steamX = Math.sin(this.animTime * 3 + s) * 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - steamAge) * 0.45})`;
      ctx.beginPath();
      ctx.arc(steamX, steamY, 2 + steamAge * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Water Cooler
  drawWaterCooler(ctx, obj) {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-6, -14, 12, 18);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.arc(0, -20, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Executive Chesterfield Leather Sofa (Ruang Direktur)
  drawExecutiveSofa(ctx, obj) {
    ctx.fillStyle = '#3f1d0b'; // Rich leather brown
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(22, 3);
    ctx.lineTo(0, 13);
    ctx.lineTo(-22, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#271004';
    ctx.fillRect(-22, -14, 44, 14);
    ctx.fillStyle = '#b45309'; // Gold tufted buttons
    ctx.fillRect(-14, -8, 4, 4);
    ctx.fillRect(0, -8, 4, 4);
    ctx.fillRect(10, -8, 4, 4);
  }

  // Pantry Sofa
  drawPantrySofa(ctx, obj) {
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(20, 3);
    ctx.lineTo(0, 13);
    ctx.lineTo(-20, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#3730a3';
    ctx.fillRect(-20, -14, 40, 14);
  }

  // Executive Bookshelf
  drawExecutiveBookshelf(ctx, obj) {
    ctx.fillStyle = '#291205'; // Mahogany bookshelf
    ctx.fillRect(-12, -32, 24, 36);

    const colors = ['#dc2626', '#1d4ed8', '#047857', '#d97706'];
    for (let s = 0; s < 3; s++) {
      const y = -28 + s * 10;
      ctx.fillStyle = '#1c0c03';
      ctx.fillRect(-10, y + 8, 20, 2);
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = colors[(s + b) % colors.length];
        ctx.fillRect(-9 + b * 4.5, y + 1, 3.5, 8);
      }
    }
  }

  // Boardroom Meeting Conference Table
  drawMeetingTable(ctx, obj) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center Hologram Projector
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Office Plant
  drawPlant(ctx, obj) {
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(7, 2);
    ctx.lineTo(5, 12);
    ctx.lineTo(-5, 12);
    ctx.closePath();
    ctx.fill();

    const sway = Math.sin(this.animTime * 2.2 + obj.x) * 2;
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(sway - 5, -8, 6, 0, Math.PI * 2);
    ctx.arc(sway + 6, -10, 7, 0, Math.PI * 2);
    ctx.arc(sway, -17, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // AGENT CHARACTER RENDERING
  // ==========================================
  renderAgent(ctx, agent, isSelected = false) {
    const { sx, sy } = this.gridToScreen(agent.x, agent.y);

    ctx.save();
    ctx.translate(sx, sy);

    const roleConfig = agent.roleConfig;
    const isWalking = agent.state === AGENT_STATES.WALKING;
    const isCoding = agent.state === AGENT_STATES.CODING;
    const isCoffee = agent.state === AGENT_STATES.COFFEE;

    let legOffset = 0;
    let bobY = 0;
    if (isWalking) {
      legOffset = Math.sin(this.animTime * 14) * 3;
      bobY = Math.abs(Math.sin(this.animTime * 14)) * 2.2;
    } else if (isCoding) {
      bobY = Math.sin(this.animTime * 20) * 1.2;
    } else {
      bobY = Math.sin(this.animTime * 3) * 0.8;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, isSelected ? 14 : 11, isSelected ? 7 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = roleConfig.color;
      ctx.shadowColor = roleConfig.color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 4, 14, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const charY = -bobY;

    // Legs & Shoes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4 + legOffset, charY - 6, 3, 7);
    ctx.fillRect(1 - legOffset, charY - 6, 3, 7);

    ctx.fillStyle = '#334155';
    ctx.fillRect(-5 + legOffset, charY, 4, 2);
    ctx.fillRect(1 - legOffset, charY, 4, 2);

    // Torso / Suit
    ctx.fillStyle = roleConfig.avatarSuit;
    ctx.fillRect(-6, charY - 18, 12, 12);
    ctx.fillStyle = roleConfig.id === 'ceo' ? '#f59e0b' : '#ffffff'; // CEO Gold tie
    ctx.fillRect(-1.5, charY - 18, 3, 5);

    // Arms
    if (isCoding) {
      const tHand = Math.sin(this.animTime * 24) * 2;
      ctx.fillStyle = roleConfig.avatarSkin;
      ctx.fillRect(-8, charY - 13 + tHand, 4, 4);
      ctx.fillRect(4, charY - 13 - tHand, 4, 4);
    } else if (isCoffee) {
      ctx.fillStyle = roleConfig.avatarSuit;
      ctx.fillRect(-8, charY - 16, 2, 8);
      ctx.fillRect(4, charY - 16, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, charY - 18, 4, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(7, charY - 19, 2, 2);
    } else {
      ctx.fillStyle = roleConfig.avatarSuit;
      ctx.fillRect(-8, charY - 16, 2, 8);
      ctx.fillRect(6, charY - 16, 2, 8);
      ctx.fillStyle = roleConfig.avatarSkin;
      ctx.fillRect(-8, charY - 8, 2, 2);
      ctx.fillRect(6, charY - 8, 2, 2);
    }

    // Head
    ctx.fillStyle = roleConfig.avatarSkin;
    ctx.fillRect(-5, charY - 26, 10, 8);

    // Eye Blinking
    const blinkCycle = (this.animTime + (agent.x * 2)) % 3.8;
    const isBlinking = blinkCycle < 0.14;
    ctx.fillStyle = '#0f172a';
    if (isBlinking) {
      ctx.fillRect(-3, charY - 22, 2, 1);
      ctx.fillRect(1, charY - 22, 2, 1);
    } else {
      ctx.fillRect(-3, charY - 23, 2, 2);
      ctx.fillRect(1, charY - 23, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, charY - 23, 1, 1);
      ctx.fillRect(1, charY - 23, 1, 1);
    }

    // Hair
    ctx.fillStyle = roleConfig.avatarHair;
    ctx.fillRect(-6, charY - 29, 12, 4);
    ctx.fillRect(-6, charY - 26, 2, 3);
    ctx.fillRect(4, charY - 26, 2, 3);

    // Accessories
    if (roleConfig.id === 'ceo') {
      // Golden cufflink accent
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-8, charY - 10, 2, 1);
      ctx.fillRect(6, charY - 10, 2, 1);
    } else if (roleConfig.id === 'dev') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, charY - 24, 3, 2);
      ctx.strokeRect(1, charY - 24, 3, 2);
    } else if (roleConfig.id === 'pm') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, charY - 25, 1, 4);
      ctx.fillRect(5, charY - 25, 1, 4);
      ctx.fillRect(-6, charY - 28, 12, 1.2);
    }

    // Name Tag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(-18, charY - 39, 36, 12);
    ctx.strokeStyle = roleConfig.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, charY - 39, 36, 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${roleConfig.badge}: ${agent.name}`, 0, charY - 30);

    // Floating Status
    this.renderAgentStatusEffects(ctx, agent, charY);

    ctx.restore();
  }

  renderAgentStatusEffects(ctx, agent, charY) {
    if (agent.state === AGENT_STATES.THINKING) {
      ctx.save();
      ctx.translate(15, charY - 34);
      ctx.rotate(this.animTime * 4.5);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚙️', 0, 4);
      ctx.restore();
    } else if (agent.state === AGENT_STATES.CODING) {
      const sparkY = -43 - (this.animTime * 18 % 8);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px sans-serif';
      ctx.fillText('⚡', 15, sparkY);
    } else if (agent.state === AGENT_STATES.TESTING) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px sans-serif';
      ctx.fillText('🔍', 15, charY - 34);
    } else if (agent.state === AGENT_STATES.DEPLOYING) {
      ctx.fillStyle = '#34d399';
      ctx.font = '13px sans-serif';
      ctx.fillText('🚀', 15, charY - 34);
    }

    if (agent.speechText) {
      this.drawSpeechBubble(ctx, agent.speechText, charY - 45, agent.roleConfig.color);
    }
  }

  drawSpeechBubble(ctx, text, topY, borderColor) {
    ctx.font = '9.5px "Outfit", sans-serif';
    const textMetrics = ctx.measureText(text);
    const bubbleWidth = Math.min(190, Math.max(85, textMetrics.width + 20));
    const bubbleHeight = 24;
    const bx = -bubbleWidth / 2;
    const by = topY - bubbleHeight;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.moveTo(-4, by + bubbleHeight);
    ctx.lineTo(0, by + bubbleHeight + 5);
    ctx.lineTo(4, by + bubbleHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    let displayText = text;
    if (text.length > 34) {
      displayText = text.substring(0, 32) + '...';
    }
    ctx.fillText(displayText, 0, by + 15);
  }

  renderConfetti(ctx) {
    if (this.confettiParticles.length === 0) return;
    ctx.save();
    for (const p of this.confettiParticles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    ctx.restore();
  }
}
