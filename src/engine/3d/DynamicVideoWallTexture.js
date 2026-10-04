/**
 * DynamicVideoWallTexture.js - Procedural 9-Screen 3x3 Master Production Wall Canvas Texture
 * Renders real-time 3D Engine FPS waveforms, 3D GLB Asset Pipeline status,
 * Multiplayer netcode tickrate, level biomes, and Studio Directives.
 */

import * as THREE from 'three';

export class DynamicVideoWallTexture {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 512;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.animTimer = 0;
    this.updateThrottle = 0;
    this.customDirectiveText = 'AUDIRA INDIE GAME DEV // SPRINT MILESTONE ALPHA v0.9.4 ON TRACK';
    this.incidentActive = false;
    this.telemetryData = {
      fps: 60.0,
      drawCalls: 342,
      netTickrateHz: 64,
      vramUsedGb: 1.84,
      runwaySlotsActive: 8,
    };

    // Draw initial frame immediately so canvas is never blank
    this.draw();
  }

  setDirective(text) {
    this.customDirectiveText = text;
    this.draw();
  }

  setIncident(active) {
    this.incidentActive = active;
    this.draw();
  }

  update(timeDelta) {
    if (!this.ctx) return;
    this.updateThrottle += timeDelta;
    if (this.updateThrottle < 0.06) return;
    this.updateThrottle = 0;

    this.animTimer += timeDelta * 2.5;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    if (!ctx) return;

    // Background: Dark Cyberpunk High-Tech Studio Wall
    ctx.fillStyle = '#060c18';
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle Cyan Grid Overlay
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const colW = 1024 / 3;
    const rowH = 512 / 3;

    // Header Bar across the top of all 3 columns
    ctx.fillStyle = '#0b1424';
    ctx.fillRect(0, 0, 1024, 38);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(1024, 38);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('🎮 AUDIRA VIRTUAL GAME DEV & 3D ASSET STUDIO // MASTER PRODUCTION WALL', 24, 25);

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`WAKTU SISTEM: ${nowStr} WIB  |  BUILD STATUS: 60 FPS STABLE`, 580, 25);

    // Screen 1 (Top Left): Game Engine & FPS Performance
    this.drawChartPanel(ctx, 16, 48, colW - 32, rowH - 18, 'ENGINE PERFORMANCE & FPS', () => {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('60.0 FPS', 28, 88);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText('DRAWCALLS: 342 | VRAM: 1.84 GB', 28, 106);

      // Frametime Waveform
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      for (let i = 0; i < 240; i += 8) {
        const val = Math.sin(i * 0.12 + this.animTimer) * 10;
        const px = 28 + i;
        const py = 135 + val;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    // Screen 2 (Top Center): 3D Asset Workshop & GLB Pipeline
    this.drawChartPanel(ctx, colW + 16, 48, colW - 32, rowH - 18, '3D ASSET WORKSHOP & .GLB PIPELINE', () => {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11.5px monospace';
      ctx.fillText('ACTIVE MODEL: SD_MECHA_V2.GLB', colW + 28, 76);
      ctx.fillText('POLY: 14.8k Verts | 28.2k Tris', colW + 28, 96);
      ctx.fillText('PBR ATLAS: 2048x2048 (Baked)', colW + 28, 116);
      ctx.fillStyle = '#10b981';
      ctx.fillText('GLTF LOADER: STANDALONE OK', colW + 28, 136);

      // Mini 3D Wireframe Cube Animation
      const cubeCx = colW + 260;
      const cubeCy = 100;
      const rot = this.animTimer * 0.8;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cubeCx - 14, cubeCy - 14, 28, 28);
      ctx.beginPath();
      ctx.arc(cubeCx, cubeCy, 18 + Math.sin(rot) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.stroke();
    });

    // Screen 3 (Top Right): Multiplayer Netcode & Tickrate
    this.drawChartPanel(ctx, colW * 2 + 16, 48, colW - 32, rowH - 18, 'MULTIPLAYER NETCODE & TICKRATE', () => {
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('SERVER TICKRATE: 64 Hz (LOCKED)', colW * 2 + 28, 82);
      ctx.fillStyle = '#10b981';
      ctx.fillText('RTT CLIENT LATENCY: 18.2 ms', colW * 2 + 28, 102);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PACKET LOSS: 0.00% (STABLE)', colW * 2 + 28, 122);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('ACTIVE ROOMS: 8 LOBBIES SYNCED', colW * 2 + 28, 142);
    });

    // Screen 4 (Mid Left): Level Design & Biome Generation
    this.drawChartPanel(ctx, 16, rowH + 42, colW - 32, rowH - 18, 'LEVEL DESIGN & BIOMES', () => {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '11.5px monospace';
      ctx.fillText('ZONE: CYBER SECTOR 07 (MODULAR)', 28, rowH + 74);
      ctx.fillText('NAVMESH: 128x128 GRID BAKED', 28, rowH + 94);
      ctx.fillText('OCCLUSION CULLING: ACTIVE (98%)', 28, rowH + 114);

      // Level Progress Bar
      const grad = ctx.createLinearGradient(28, 0, 260, 0);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(1, '#a855f7');
      ctx.fillStyle = grad;
      ctx.fillRect(28, rowH + 126, 230, 8);
    });

    // Screen 5 (Mid Center): Studio Sprint & Release Status
    const midBg = this.incidentActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.12)';
    ctx.fillStyle = midBg;
    ctx.fillRect(colW + 16, rowH + 42, colW - 32, rowH - 18);
    ctx.strokeStyle = this.incidentActive ? '#ef4444' : '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(colW + 16, rowH + 42, colW - 32, rowH - 18);

    ctx.fillStyle = this.incidentActive ? '#ef4444' : '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      this.incidentActive ? '⚠️ SHADER CRASH / MEMORY SPIKE' : '🚀 SPRINT MILESTONE: ALPHA v0.9.4',
      colW + 36,
      rowH + 74
    );

    ctx.font = '11.5px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('10 AI GAME DEV AGENTS COLLABORATING', colW + 36, rowH + 98);
    ctx.fillText('SPRINT VELOCITY: 94% | DEMO IN 3 DAYS', colW + 36, rowH + 118);

    // Screen 6 (Mid Right): Dynamic Audio & Polyphonic Synth Visualizer
    this.drawChartPanel(ctx, colW * 2 + 16, rowH + 42, colW - 32, rowH - 18, 'DYNAMIC AUDIO SYNTH & FX', () => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px monospace';
      ctx.fillText('POLYPHONIC AUDIO ENGINE: ACTIVE', colW * 2 + 28, rowH + 74);
      ctx.fillText('AUDIO CHANNELS: 8 / 8 STEREO', colW * 2 + 28, rowH + 92);

      // Real-time audio spectrum bars
      for (let b = 0; b < 12; b++) {
        const barH = 15 + Math.abs(Math.sin(this.animTimer * 2 + b * 0.6)) * 26;
        const bx = colW * 2 + 28 + b * 20;
        const by = rowH + 138 - barH;
        ctx.fillStyle = b < 8 ? '#06b6d4' : '#f59e0b';
        ctx.fillRect(bx, by, 14, barH);
      }
    });

    // Bottom Screens (7, 8, 9): Studio Production Directives & Build Stream
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(16, rowH * 2 + 34, 1024 - 32, rowH - 24);
    ctx.strokeStyle = this.customDirectiveText ? '#eab308' : '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, rowH * 2 + 34, 1024 - 32, rowH - 24);

    if (this.customDirectiveText) {
      // Flashing alert badge
      const isFlash = Math.floor(this.animTimer * 2) % 2 === 0;
      ctx.fillStyle = isFlash ? '#eab308' : '#ca8a04';
      ctx.fillRect(28, rowH * 2 + 46, 210, 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('📢 STUDIO SPRINT DIRECTIVE', 34, rowH * 2 + 62);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`"${this.customDirectiveText}"`, 250, rowH * 2 + 63);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText('DISPATCH: SELURUH 10 OPERATOR GAME STUDIO     MILESTONE: ALPHA RELEASE     STATUS: ON TRACK', 32, rowH * 2 + 96);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('AUDIRA VIRTUAL GAME DEV STUDIO     EXECUTIVE PRODUCER: ARTHUR HQ', 32, rowH * 2 + 118);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('LIVE GAME DEV ENGINE LOGS & SPRINT FEEDS:', 32, rowH * 2 + 60);

      const logList = [
        '[10:42:01] [ROUTEX] WebGL build passed. 60 FPS locked, 0 shader compilation errors.',
        '[10:41:45] [VOLTIS] 3D Model .GLB rigged and loaded into scene successfully.',
        '[10:40:12] [AEGIS] 1,420 automated bot playtests completed: 0 crash bugs detected.'
      ];

      logList.forEach((log, idx) => {
        ctx.fillStyle = idx === 0 ? '#38bdf8' : '#64748b';
        ctx.font = '10.5px monospace';
        ctx.fillText(log, 32, rowH * 2 + 82 + idx * 18);
      });
    }

    // Outer Display Bezel Matrix Grid (3x3 screen bezels)
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 7;
    ctx.strokeRect(0, 0, 1024, 512);

    ctx.beginPath();
    ctx.moveTo(colW, 38);
    ctx.lineTo(colW, 512);
    ctx.moveTo(colW * 2, 38);
    ctx.lineTo(colW * 2, 512);
    ctx.moveTo(0, rowH + 34);
    ctx.lineTo(1024, rowH + 34);
    ctx.moveTo(0, rowH * 2 + 28);
    ctx.lineTo(1024, rowH * 2 + 28);
    ctx.stroke();

    this.texture.needsUpdate = true;
  }

  drawChartPanel(ctx, x, y, w, h, title, contentFn) {
    ctx.fillStyle = 'rgba(11, 20, 36, 0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Title label bar
    ctx.fillStyle = '#0f1f38';
    ctx.fillRect(x, y, w, 22);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`[ ${title} ]`, x + 8, y + 15);

    contentFn();
  }
}
