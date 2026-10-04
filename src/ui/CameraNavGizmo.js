/**
 * CameraNavGizmo.js - 3D Camera Pan / Geser & Sector Navigation HUD Gizmo
 *
 * Provides on-screen directional pan buttons (⬆/⬇/⬅/➡), elevation (🔼/🔽),
 * zoom (➕/➖), Orbit vs Pan mode toggle (allowing left-click mouse drag to pan across the room),
 * and 1-click teleport navigation to all 10 cyber studio sectors.
 */

import { audio } from '../engine/AudioManager.js';
import { SECTOR_LOCATIONS } from '../engine/AudiraOffice3D.js';

export class CameraNavGizmo {
  constructor({ container, engine3D, onNavigateSector }) {
    this.container = container;
    this.engine3D = engine3D;
    this.onNavigateSector = onNavigateSector || (() => {});

    this.isExpanded = true;
    this.activeMode = 'orbit'; // 'orbit' | 'pan'
    this.panStep = 4.0; // distance in meters per step
    this.activeSector = 'hall';

    this.render();
  }

  setEngine3D(engine3D) {
    this.engine3D = engine3D;
  }

  setNavMode(mode) {
    this.activeMode = mode;
    if (this.engine3D) {
      this.engine3D.setNavMode(mode);
    }
    const btnOrbit = this.container.querySelector('#navModeOrbit');
    const btnPan = this.container.querySelector('#navModePan');
    const tipEl = this.container.querySelector('#navPanModeNotice');

    if (btnOrbit) btnOrbit.classList.toggle('active', mode === 'orbit');
    if (btnPan) btnPan.classList.toggle('active', mode === 'pan');
    if (tipEl) {
      tipEl.style.display = mode === 'pan' ? 'block' : 'none';
    }
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const body = this.container.querySelector('.nav-gizmo-body');
    const toggleIcon = this.container.querySelector('#btnNavGizmoMinMax .toggle-icon');
    const wrapper = this.container.querySelector('.nav-gizmo-card');

    if (body) body.style.display = this.isExpanded ? 'block' : 'none';
    if (toggleIcon) toggleIcon.textContent = this.isExpanded ? '−' : '＋';
    if (wrapper) wrapper.classList.toggle('minimized', !this.isExpanded);
  }

  render() {
    this.container.innerHTML = `
      <div class="nav-gizmo-card glass-panel ${this.isExpanded ? '' : 'minimized'}">
        <!-- Gizmo Header -->
        <div class="nav-gizmo-header">
          <div class="nav-gizmo-title">
            <span class="gizmo-icon">🧭</span>
            <span class="gizmo-label">NAVIGASI &amp; GESER 3D</span>
          </div>

          <!-- Interaction Mode Toggle (Putar vs Geser) -->
          <div class="nav-mode-toggle-group">
            <button class="nav-mode-chip ${this.activeMode === 'orbit' ? 'active' : ''}" id="navModeOrbit" title="Mode Putar (Orbit): Klik &amp; Tarik untuk Memutar Kamera">
              <span class="chip-icon">🔄</span>
              <span class="chip-label">PUTAR</span>
            </button>
            <button class="nav-mode-chip ${this.activeMode === 'pan' ? 'active' : ''}" id="navModePan" title="Mode Geser (Pan): Klik &amp; Tarik untuk Menggeser Ruangan">
              <span class="chip-icon">✋</span>
              <span class="chip-label">GESER</span>
            </button>
          </div>

          <button class="nav-gizmo-minmax-btn" id="btnNavGizmoMinMax" title="Kecilkan / Besarkan Gizmo">
            <span class="toggle-icon">${this.isExpanded ? '−' : '＋'}</span>
          </button>
        </div>

        <!-- Gizmo Body (Collapsible) -->
        <div class="nav-gizmo-body" style="display: ${this.isExpanded ? 'block' : 'none'};">
          <!-- Active Mode Notice when in PAN mode -->
          <div class="nav-pan-notice" id="navPanModeNotice" style="display: ${this.activeMode === 'pan' ? 'block' : 'none'};">
            <span class="notice-pulse"></span>
            <span>Mode Geser Aktif: Klik &amp; geser mouse / trackpad kiri untuk meluncur di studio!</span>
          </div>

          <!-- Top Row: D-Pad Directional Pan & Altitude / Zoom Controls -->
          <div class="nav-controls-row">
            <!-- 3D Pan Directional D-Pad -->
            <div class="nav-dpad-container" title="Gunakan Tombol Arah untuk Menggeser Posisi Kamera">
              <div class="dpad-cross">
                <button class="dpad-btn dpad-up" id="dpadUp" title="Geser Maju / Utara (Forward)">
                  <span>▲</span>
                  <small>MAJU</small>
                </button>
                <button class="dpad-btn dpad-left" id="dpadLeft" title="Geser Kiri / Barat (West)">
                  <span>◀</span>
                  <small>KIRI</small>
                </button>
                <button class="dpad-btn dpad-center" id="dpadCenter" title="Reset ke Pandangan Panoramik Studio Floor">
                  <span>🏠</span>
                  <small>RESET</small>
                </button>
                <button class="dpad-btn dpad-right" id="dpadRight" title="Geser Kanan / Timur (East)">
                  <span>▶</span>
                  <small>KANAN</small>
                </button>
                <button class="dpad-btn dpad-down" id="dpadDown" title="Geser Mundur / Selatan (Backward)">
                  <small>MUNDUR</small>
                  <span>▼</span>
                </button>
              </div>
            </div>

            <!-- Altitude & Zoom Column -->
            <div class="nav-altitude-zoom-col">
              <div class="nav-action-group">
                <span class="col-title">ZOOM</span>
                <div class="btn-pair">
                  <button class="nav-action-btn" id="btnZoomIn" title="Perbesar (Zoom In)">➕</button>
                  <button class="nav-action-btn" id="btnZoomOut" title="Perkecil (Zoom Out)">➖</button>
                </div>
              </div>

              <div class="nav-action-group">
                <span class="col-title">TINGGI</span>
                <div class="btn-pair">
                  <button class="nav-action-btn" id="btnElevateUp" title="Kamera Naik (Elevate Up)">🔼</button>
                  <button class="nav-action-btn" id="btnElevateDown" title="Kamera Turun (Elevate Down)">🔽</button>
                </div>
              </div>

              <!-- Pan Step Distance Selector -->
              <div class="nav-speed-group">
                <span class="col-title">JARAK</span>
                <div class="speed-chips">
                  <button class="speed-chip ${this.panStep === 2.5 ? 'active' : ''}" data-step="2.5" title="Geser Halus (2.5m)">2.5m</button>
                  <button class="speed-chip ${this.panStep === 5.0 ? 'active' : ''}" data-step="5.0" title="Geser Sedang (5m)">5m</button>
                  <button class="speed-chip ${this.panStep === 10.0 ? 'active' : ''}" data-step="10.0" title="Geser Cepat (10m)">10m</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sector Quick-Jump Teleport Grid -->
          <div class="nav-sectors-section">
            <div class="sectors-header">
              <span class="sec-header-title">TELEPORTASI SEKTOR LENGKAP</span>
              <span class="sec-header-badge">13 LOKASI</span>
            </div>

            <div class="nav-sectors-grid">
              <button class="sector-teleport-btn active" data-sector="hall" title="Pusat Aula Studio Panoramic">
                <span class="s-icon">🎥</span>
                <span class="s-name">Studio Floor</span>
              </button>

              <button class="sector-teleport-btn" data-sector="conveyor_runway" title="Catwalk Conveyor Pameran Bergerak 56m">
                <span class="s-icon">🏃‍♂️</span>
                <span class="s-name">Runway 56m</span>
              </button>

              <button class="sector-teleport-btn" data-sector="video_wall" title="Master 9-Screen Video Wall">
                <span class="s-icon">🖥️</span>
                <span class="s-name">Prod Wall</span>
              </button>

              <button class="sector-teleport-btn" data-sector="dev_desks" title="Meja Stasiun Operator AI">
                <span class="s-icon">💻</span>
                <span class="s-name">Operator Desks</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_arsenal" title="Sektor 01: Firing Range & Senjata">
                <span class="s-icon">🔫</span>
                <span class="s-name">Sektor 01 Arsenal</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_mecha" title="Sektor 02: Turntable Mecha & Crane">
                <span class="s-icon">🦾</span>
                <span class="s-name">Sektor 02 Mecha</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_drone" title="Sektor 04: Drone Hangar & Helipad">
                <span class="s-icon">🛸</span>
                <span class="s-name">Sektor 04 Drone</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_quantum" title="Sektor 05: Quantum Tokamak Core">
                <span class="s-icon">⚛️</span>
                <span class="s-name">Sektor 05 Quantum</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_arcade" title="Sektor 06: Cyber Arena Esports & VR">
                <span class="s-icon">🕹️</span>
                <span class="s-name">Sektor 06 Arena</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_pantry" title="Pantry Lounge & Espresso Bar">
                <span class="s-icon">☕</span>
                <span class="s-name">Pantry Lounge</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_warroom" title="War Room Strategi Holo-Globe">
                <span class="s-icon">🌐</span>
                <span class="s-name">War Room Globe</span>
              </button>

              <button class="sector-teleport-btn" data-sector="sector_racks" title="Kluster Rak Server SCADA Tier-III">
                <span class="s-icon">🗄️</span>
                <span class="s-name">Server Racks</span>
              </button>

              <button class="sector-teleport-btn" data-sector="top_down" title="Pandangan Atas Peta Denah 68x52m">
                <span class="s-icon">🛰️</span>
                <span class="s-name">Top-Down Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Mode toggles (Orbit vs Pan)
    const btnOrbit = this.container.querySelector('#navModeOrbit');
    const btnPan = this.container.querySelector('#navModePan');

    if (btnOrbit) {
      btnOrbit.addEventListener('click', () => {
        audio.playBlip();
        this.setNavMode('orbit');
      });
    }

    if (btnPan) {
      btnPan.addEventListener('click', () => {
        audio.playBlip();
        this.setNavMode('pan');
      });
    }

    // Min / Max toggle
    const btnMinMax = this.container.querySelector('#btnNavGizmoMinMax');
    if (btnMinMax) {
      btnMinMax.addEventListener('click', () => {
        audio.playBlip();
        this.toggleExpand();
      });
    }

    // Pan D-Pad Actions
    const dpadUp = this.container.querySelector('#dpadUp');
    const dpadDown = this.container.querySelector('#dpadDown');
    const dpadLeft = this.container.querySelector('#dpadLeft');
    const dpadRight = this.container.querySelector('#dpadRight');
    const dpadCenter = this.container.querySelector('#dpadCenter');

    if (dpadUp) {
      dpadUp.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('forward', this.panStep);
      });
    }

    if (dpadDown) {
      dpadDown.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('backward', this.panStep);
      });
    }

    if (dpadLeft) {
      dpadLeft.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('left', this.panStep);
      });
    }

    if (dpadRight) {
      dpadRight.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('right', this.panStep);
      });
    }

    if (dpadCenter) {
      dpadCenter.addEventListener('click', () => {
        audio.playBlip();
        if (this.engine3D) this.engine3D.resetCamera();
        this.updateActiveSectorBtn('hall');
      });
    }

    // Zoom & Elevation
    const btnZoomIn = this.container.querySelector('#btnZoomIn');
    const btnZoomOut = this.container.querySelector('#btnZoomOut');
    const btnElevateUp = this.container.querySelector('#btnElevateUp');
    const btnElevateDown = this.container.querySelector('#btnElevateDown');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.zoomCamera(1);
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.zoomCamera(-1);
      });
    }

    if (btnElevateUp) {
      btnElevateUp.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('elevate_up', this.panStep);
      });
    }

    if (btnElevateDown) {
      btnElevateDown.addEventListener('click', () => {
        audio.playKey();
        if (this.engine3D) this.engine3D.panCamera('elevate_down', this.panStep);
      });
    }

    // Pan Step Distance Chips
    const speedChips = this.container.querySelectorAll('.speed-chip');
    speedChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        audio.playBlip();
        speedChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.panStep = parseFloat(chip.dataset.step) || 4.0;
      });
    });

    // Sector Teleport Buttons
    const sectorBtns = this.container.querySelectorAll('.sector-teleport-btn');
    sectorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.playBlip();
        const sectorKey = btn.dataset.sector;
        this.updateActiveSectorBtn(sectorKey);
        if (this.engine3D) {
          this.engine3D.flyToSector(sectorKey);
        }
        this.onNavigateSector(sectorKey);
      });
    });
  }

  updateActiveSectorBtn(sectorKey) {
    this.activeSector = sectorKey;
    const sectorBtns = this.container.querySelectorAll('.sector-teleport-btn');
    sectorBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sector === sectorKey);
    });
  }
}
