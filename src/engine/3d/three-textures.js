import * as THREE from 'three';

/**
 * three-textures.js - Procedural Texture Generators adopted from AUDIRA-DCOS
 * Zero external binary dependencies; generates photorealistic procedural textures at startup.
 */

const textureCache = {};

/**
 * Generates modern dark slate / anthracite tile floor for the NOC command area
 */
export function getSlateTileTexture() {
  if (textureCache['slate_tile']) return textureCache['slate_tile'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Clean bright commercial grey/slate porcelain base
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        const shade = Math.floor(Math.random() * 12) - 6;
        ctx.fillStyle = `rgb(${34 + shade}, ${42 + shade}, ${56 + shade})`;
        ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Micro-speckles for natural honed quartz feel
        ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
        for (let i = 0; i < 12; i++) {
          const rx = x + Math.random() * tileSize;
          const ry = y + Math.random() * tileSize;
          ctx.fillRect(rx, ry, 1.5, 1.5);
        }
      }
    }

    // Tile grout lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  textureCache['slate_tile'] = texture;
  return texture;
}

/**
 * Generates perforated aluminum raised floor plenum tiles (600x600mm) for Data Center White Space / NOC
 */
export function getRaisedFloorTexture() {
  if (textureCache['raised_floor']) return textureCache['raised_floor'];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Brushed anti-static aluminum finish
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle brushed lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 1.5);
    }

    // Perforated airflow holes pattern
    ctx.fillStyle = '#050811';
    for (let y = 24; y < 232; y += 20) {
      for (let x = 24; x < 232; x += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // High-tech tile chamfer border
    ctx.strokeStyle = '#06b6d433';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 250, 250);

    ctx.strokeStyle = '#070a10';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache['raised_floor'] = texture;
  return texture;
}

/**
 * Generates executive dark walnut herringbone / plank parquet wood floor texture
 */
export function getWoodParquetTexture() {
  if (textureCache['wood_parquet']) return textureCache['wood_parquet'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#261b14';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 32;
    const plankWidth = 128;

    for (let y = 0; y < 512; y += plankHeight) {
      const offsetX = ((y / plankHeight) % 2) * (plankWidth / 2);
      for (let x = -plankWidth; x < 512 + plankWidth; x += plankWidth) {
        const actualX = x + offsetX;
        const toneVar = Math.sin(actualX * 0.05 + y * 0.08) * 12;
        const r = Math.floor(42 + toneVar);
        const g = Math.floor(29 + toneVar * 0.7);
        const b = Math.floor(22 + toneVar * 0.5);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(actualX, y, plankWidth - 1, plankHeight - 1);

        ctx.strokeStyle = '#140c08';
        ctx.lineWidth = 1;
        ctx.strokeRect(actualX, y, plankWidth, plankHeight);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache['wood_parquet'] = texture;
  return texture;
}

/**
 * Generates conference room acoustic woven carpet texture
 */
export function getCarpetTexture() {
  if (textureCache['carpet']) return textureCache['carpet'];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#101d2d';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const isOdd = ((x + y) / 4) % 2 === 0;
        ctx.fillStyle = isOdd ? 'rgba(30, 58, 95, 0.4)' : 'rgba(10, 20, 35, 0.4)';
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  textureCache['carpet'] = texture;
  return texture;
}

/**
 * Creates ultra-sharp monitor screen texture with high-contrast glowing code / telemetry / radar graphics
 */
export function createMonitorTexture(theme = 'graph') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, 512, 320);

    const borderColor = theme === 'code' ? '#06b6d4' : theme === 'graph' ? '#8b5cf6' : theme === 'terminal' ? '#10b981' : '#38bdf8';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 508, 316);

    // Title bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 4, 504, 28);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 32);
    ctx.lineTo(508, 32);
    ctx.stroke();

    // Window controls
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(18, 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(32, 18, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(46, 18, 5, 0, Math.PI * 2); ctx.fill();

    // Title text
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    const title = theme === 'code' ? 'workspace://audira-core/src/main.rs [RUNNING]' :
                  theme === 'graph' ? 'AUDIRA DC TELEMETRY // REAL-TIME NOC METRICS' :
                  theme === 'terminal' ? 'bash - audira@dcos-node-01: ~ (SSH-2.0)' :
                  'AIRSPACE & PERIMETER RADAR // ACTIVE SWEEP';
    ctx.fillText(title, 64, 22);

    ctx.fillStyle = '#065f46';
    ctx.fillRect(430, 8, 70, 18);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('● ACTIVE', 440, 21);

    if (theme === 'code') {
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(4, 33, 90, 283);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText('📁 src', 14, 52);
      ctx.fillText('  📄 main.rs', 14, 70);
      ctx.fillText('  📄 dcos.rs', 14, 88);
      ctx.fillText('  📄 net.rs', 14, 106);
      ctx.fillText('  📄 rack.rs', 14, 124);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(94, 33, 30, 283);
      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      for (let l = 1; l <= 14; l++) {
        ctx.fillText(l.toString(), 102, 36 + l * 19);
      }

      const tokens = [
        [{ c: '#c084fc', t: 'pub async fn ' }, { c: '#38bdf8', t: 'render_3d_pipeline' }, { c: '#e2e8f0', t: '() -> ' }, { c: '#4ade80', t: 'Result<()>' }, { c: '#e2e8f0', t: ' {' }],
        [{ c: '#64748b', t: '    // Initialize Three.js scene & GLB asset runway' }],
        [{ c: '#c084fc', t: '    let ' }, { c: '#e2e8f0', t: 'mut engine = ' }, { c: '#38bdf8', t: 'ThreeEngine' }, { c: '#e2e8f0', t: '::init().' }, { c: '#f59e0b', t: 'await' }, { c: '#e2e8f0', t: '?;' }],
        [{ c: '#c084fc', t: '    let ' }, { c: '#e2e8f0', t: 'frame_rate: ' }, { c: '#4ade80', t: 'f64' }, { c: '#e2e8f0', t: ' = ' }, { c: '#f43f5e', t: '60.0' }, { c: '#e2e8f0', t: '; // FPS' }],
        [{ c: '#c084fc', t: '    let ' }, { c: '#e2e8f0', t: 'runway_status = ' }, { c: '#4ade80', t: 'CatwalkState::Synced' }, { c: '#e2e8f0', t: ';' }],
        [{ c: '#f59e0b', t: '    loop ' }, { c: '#e2e8f0', t: '{' }],
        [{ c: '#c084fc', t: '        let ' }, { c: '#e2e8f0', t: 'frame = engine.' }, { c: '#38bdf8', t: 'poll_frame' }, { c: '#e2e8f0', t: '().' }, { c: '#f59e0b', t: 'await' }, { c: '#e2e8f0', t: ';' }],
        [{ c: '#f59e0b', t: '        if ' }, { c: '#e2e8f0', t: 'frame.has_glb_mesh() {' }],
        [{ c: '#e2e8f0', t: '            ' }, { c: '#f43f5e', t: 'render_pod_turntable' }, { c: '#e2e8f0', t: '(&frame);' }],
        [{ c: '#e2e8f0', t: '        }' }],
        [{ c: '#e2e8f0', t: '    }' }],
        [{ c: '#e2e8f0', t: '}' }]
      ];

      tokens.forEach((line, rowIdx) => {
        let lx = 132;
        const ly = 55 + rowIdx * 19;
        line.forEach(tok => {
          ctx.fillStyle = tok.c;
          ctx.fillText(tok.t, lx, ly);
          lx += ctx.measureText(tok.t).width;
        });
      });

    } else if (theme === 'graph') {
      const cards = [
        { label: 'RENDER FPS', val: '60.0', color: '#10b981' },
        { label: 'CATWALK RUNWAY', val: '8 SLOTS', color: '#06b6d4' },
        { label: 'GPU VRAM ALLOC', val: '1.84 GB', color: '#3b82f6' },
        { label: 'NETCODE TICK', val: '64 Hz', color: '#8b5cf6' }
      ];
      cards.forEach((c, i) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(16 + i * 122, 42, 114, 52);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(16 + i * 122, 42, 114, 52);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(c.label, 24 + i * 122, 58);

        ctx.fillStyle = c.color;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(c.val, 24 + i * 122, 82);
      });

      ctx.fillStyle = '#090e1a';
      ctx.fillRect(16, 106, 480, 198);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(16, 106, 480, 198);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 140; y < 300; y += 38) {
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(492, y); ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(20, 270);
      for (let x = 20; x <= 492; x += 12) {
        const y = 200 + Math.sin(x * 0.04) * 45 + Math.cos(x * 0.09) * 22;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(492, 290);
      ctx.lineTo(20, 290);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 140, 0, 290);
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(20, 270);
      for (let x = 20; x <= 492; x += 12) {
        const y = 200 + Math.sin(x * 0.04) * 45 + Math.cos(x * 0.09) * 22;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (theme === 'terminal') {
      ctx.fillStyle = '#040d08';
      ctx.fillRect(10, 40, 492, 270);

      ctx.fillStyle = '#10b981';
      ctx.font = '12px monospace';
      ctx.fillText('root@audira-studio:~# systemctl status game-engine-cluster', 22, 64);
      ctx.fillStyle = '#34d399';
      ctx.fillText('● game-engine.service - AUDIRA 3D Game Dev & Asset Studio Engine', 22, 86);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('     Loaded: loaded (/etc/systemd/system/game-engine.service; enabled)', 22, 106);
      ctx.fillText('     Active: active (running) since Wed 2026-09-30 08:00:12 WIB', 22, 126);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('   Main PID: 1042 (threejs-renderer)', 22, 146);
      ctx.fillText('      Tasks: 48 (limit: 4915)', 22, 166);
      ctx.fillText('     Memory: 4.2G (max: 64.0G, swap: 0B)', 22, 186);
      ctx.fillStyle = '#10b981';
      ctx.fillText('     CGroup: /system.slice/game-engine.service', 22, 206);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Sep 30 23:28:10 studio kernel: [THREE.JS] WebGL renderer initialized: 60 FPS', 22, 234);
      ctx.fillText('Sep 30 23:29:45 studio runway[2210]: Runway 56m 8-slot conveyor synchronized OK', 22, 254);
      ctx.fillStyle = '#4ade80';
      ctx.fillText('root@audira-studio:~# █', 22, 284);

    } else {
      const cx = 256;
      const cy = 175;
      const r = 115;

      ctx.fillStyle = '#03101c';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      [0.25, 0.5, 0.75, 1.0].forEach(f => {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r * f, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 4, Math.PI / 8);
      ctx.closePath();
      ctx.fill();

      const blips = [
        { x: cx - 45, y: cy - 35, label: 'NODE-01', color: '#10b981' },
        { x: cx + 55, y: cy - 20, label: 'PDU-A', color: '#10b981' },
        { x: cx + 30, y: cy + 60, label: 'CHILLER', color: '#38bdf8' },
        { x: cx - 65, y: cy + 40, label: 'UPS-2N', color: '#10b981' },
        { x: cx + 15, y: cy - 70, label: 'FSS-CYL', color: '#f59e0b' }
      ];
      blips.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(b.label, b.x + 8, b.y + 3);
      });
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates energy-saving sleep / standby monitor screen texture
 */
export function createSleepMonitorTexture() {
  if (textureCache['monitor_sleep']) return textureCache['monitor_sleep'];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, 256, 160);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 160);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(128, 72, 14, -Math.PI * 0.75, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 56);
    ctx.lineTo(128, 72);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STANDBY // ENERGY SAVER', 128, 102);
    ctx.textAlign = 'start';
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache['monitor_sleep'] = texture;
  return texture;
}
