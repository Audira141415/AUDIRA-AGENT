/**
 * ServerRackInspector.js - GPU Render Farm 42U Cluster Telemetry HUD
 * Opens when a GPU cluster rack is clicked directly in the 3D studio.
 * Features:
 * - GPU Cluster Core vs Exhaust Delta-T thermal telemetry
 * - PSU 1 & 2 dual-rail redundancy status
 * - Interactive blade units (RU-01 to RU-42) with CPU/GPU & Fan RPM gauges
 * - Instant 1-Click "Tugaskan Agen" (walks selected agent to this rack in 3D)
 * - Emergency thermal purge simulation
 */

import { audio } from '../engine/AudioManager.js';

export class ServerRackInspector {
  constructor({ container, onAssignAgentToRack, onLogUpdate } = {}) {
    this.container = container;
    this.onAssignAgentToRack = onAssignAgentToRack || (() => {});
    this.onLogUpdate = onLogUpdate || (() => {});
    this.isOpen = false;
    this.currentRack = null;

    this.render();
  }

  open(rackData) {
    this.currentRack = typeof rackData === 'string' ? { label: rackData } : rackData;
    this.isOpen = true;
    this.update();
    const modal = this.container.querySelector('#serverRackModal');
    if (modal) {
      modal.classList.add('active');
    }
    audio.playClick();
  }

  close() {
    this.isOpen = false;
    const modal = this.container.querySelector('#serverRackModal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  update() {
    if (!this.currentRack) return;
    const label = this.currentRack.label || 'CLUSTER-01 // RENDER-FARM';
    const titleEl = this.container.querySelector('#rackTitle');
    if (titleEl) titleEl.textContent = label;

    // Deterministic pseudo-telemetry based on rack name
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const coldTemp = (19.5 + (hash % 25) / 10).toFixed(1);
    const hotTemp = (32.0 + (hash % 40) / 10).toFixed(1);
    const deltaT = (hotTemp - coldTemp).toFixed(1);
    const powerDraw = (3.8 + (hash % 25) / 10).toFixed(2);
    const fanRpm = 3800 + (hash % 1200);

    const elCold = this.container.querySelector('#rackColdTemp');
    if (elCold) elCold.textContent = `${coldTemp}°C`;

    const elHot = this.container.querySelector('#rackHotTemp');
    if (elHot) elHot.textContent = `${hotTemp}°C`;

    const elDelta = this.container.querySelector('#rackDeltaT');
    if (elDelta) elDelta.textContent = `+${deltaT}°C`;

    const elPower = this.container.querySelector('#rackPower');
    if (elPower) elPower.textContent = `${powerDraw} kW`;

    const elFan = this.container.querySelector('#rackFanRpm');
    if (elFan) elFan.textContent = `${fanRpm} RPM`;
  }

  render() {
    this.container.innerHTML = `
      <div class="server-rack-modal-backdrop" id="serverRackModal">
        <div class="server-rack-card glass-panel">
          <!-- Header -->
          <div class="rack-header">
            <div class="rack-title-box">
              <span class="rack-icon">🖧</span>
              <div>
                <h3 class="rack-title" id="rackTitle">CLUSTER-01 // RENDER-FARM</h3>
                <span class="rack-subtitle">TIER-III 42U HIGH-DENSITY SERVER ENCLOSURE</span>
              </div>
            </div>
            <div class="rack-header-badges">
              <span class="status-badge live-pulse">ACTIVE 2N</span>
              <button class="rack-close-btn" id="btnRackClose">✕</button>
            </div>
          </div>

          <!-- Thermal & Power Telemetry Row -->
          <div class="rack-telemetry-grid">
            <div class="rack-stat-box cold">
              <span class="stat-label">COLD AISLE INFLOW</span>
              <span class="stat-val" id="rackColdTemp">20.4°C</span>
              <span class="stat-sub">CRAC Setpoint 21°C</span>
            </div>
            <div class="rack-stat-box hot">
              <span class="stat-label">HOT AISLE EXHAUST</span>
              <span class="stat-val" id="rackHotTemp">33.8°C</span>
              <span class="stat-sub">Delta-T <span id="rackDeltaT">+13.4°C</span></span>
            </div>
            <div class="rack-stat-box power">
              <span class="stat-label">LOAD POWER DRAW</span>
              <span class="stat-val" id="rackPower">4.82 kW</span>
              <span class="stat-sub">PSU-A/B Redundant 96%</span>
            </div>
            <div class="rack-stat-box fan">
              <span class="stat-label">COOLING FAN ARRAY</span>
              <span class="stat-val" id="rackFanRpm">4250 RPM</span>
              <span class="stat-sub">PWM Auto-Throttled</span>
            </div>
          </div>

          <!-- 42U Blade Slots List -->
          <div class="blade-slots-container">
            <div class="blade-header">
              <span>BLADE NODES (RU-01 s/d RU-08)</span>
              <span class="blade-count">8 / 8 ONLINE</span>
            </div>
            <div class="blade-grid">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                <div class="blade-row">
                  <div class="blade-unit-id">RU-0${i}</div>
                  <div class="blade-specs">
                    <span class="blade-name">Blade Node #${i} [Xeon/RTX]</span>
                    <span class="blade-load">CPU ${35 + i * 5}% // GPU ${40 + i * 6}%</span>
                  </div>
                  <div class="blade-status">
                    <span class="blade-dot dot-online"></span>
                    <span class="blade-temp">${36 + i * 2}°C</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Footer -->
          <div class="rack-actions-footer">
            <button class="btn btn-secondary btn-sm" id="btnThermalPurge">
              <span>⚡ Thermal Purge 100%</span>
            </button>
            <button class="btn btn-primary btn-sm" id="btnAssignAgentRack">
              <span>🚶 Tugaskan Agen ke Rack</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = this.container.querySelector('#btnRackClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    const modal = this.container.querySelector('#serverRackModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    const btnPurge = this.container.querySelector('#btnThermalPurge');
    if (btnPurge) {
      btnPurge.addEventListener('click', () => {
        audio.playAlert();
        btnPurge.textContent = '⚡ Purge Berjalan (5800 RPM)...';
        btnPurge.style.borderColor = '#fbbf24';
        btnPurge.style.color = '#fbbf24';
        const hotEl = this.container.querySelector('#rackHotTemp');
        if (hotEl) hotEl.textContent = '26.8°C';
        this.onLogUpdate({
          agent: 'GPU CLUSTER COOLING',
          text: `Thermal Purge diaktifkan pada ${this.currentRack?.label || 'Rack'}: Fan GPU dinaikkan ke 100% PWM.`,
          type: 'warning'
        });
        setTimeout(() => {
          btnPurge.textContent = '⚡ Thermal Purge 100%';
          btnPurge.style.borderColor = '';
          btnPurge.style.color = '';
        }, 3000);
      });
    }

    const btnAssign = this.container.querySelector('#btnAssignAgentRack');
    if (btnAssign) {
      btnAssign.addEventListener('click', () => {
        if (this.currentRack) {
          this.onAssignAgentToRack(this.currentRack.label);
          this.close();
        }
      });
    }
  }
}
