/**
 * RunwayControlDeck.js - Grand 56-Meter Catwalk Runway Interactive Controls Deck
 *
 * Provides a tactile Dark Glassmorphism floating HUD deck to control:
 * - Conveyor Speed (0.5x Slow/Inspect, 1.0x Standard, 2.0x Turbo)
 * - Belt Motion (Play / Pause, Forward / Reverse)
 * - 360° Turntable Synchronous Spin
 * - 1-Click Curated Expo Presets (Cyber Mecha Expo, Fantasy Warlords, Clear Standby)
 * - 8-Slot Quick Cinematic Fly-To & Inspection Trigger
 * - 1-Click Ecosystem Sync Bridge
 */

import { audio } from '../engine/AudioManager.js';

export class RunwayControlDeck {
  constructor({ container, engine3D, onOpenAssetManager, onOpenSlotWorkshop, onNotification }) {
    this.container = container;
    this.engine3D = engine3D;
    this.onOpenAssetManager = onOpenAssetManager || (() => {});
    this.onOpenSlotWorkshop = onOpenSlotWorkshop || (() => {});
    this.onNotification = onNotification || (() => {});

    this.isMinimized = false;
    this.isVisible = true;
    this.currentSpeed = 1.0;
    this.isPaused = false;
    this.direction = 1;
    this.isTurntable = true;
    this.activePreset = null;

    this.render();
    this.bindEvents();
    this.syncState();
  }

  render() {
    this.container.innerHTML = `
      <div class="runway-deck-wrapper" id="runwayDeckWrapper">
        <!-- Floating Deck Glass Panel -->
        <div class="runway-deck-panel glass-panel">
          <!-- Deck Header Bar -->
          <div class="runway-deck-header">
            <div class="deck-title-group">
              <span class="deck-pulse-dot"></span>
              <span class="deck-badge">RUNWAY 56M</span>
              <span class="deck-title">CATWALK EXPO CONTROLS</span>
              <span class="deck-speed-chip" id="deckSpeedDisplay">1.0x (CRUISE)</span>
            </div>
            <div class="deck-header-actions">
              <button type="button" class="deck-btn-icon" id="btnDeckFocusRunway" title="Arahkan Kamera ke Runway Catwalk 56m">
                <span>🎥</span>
              </button>
              <button type="button" class="deck-btn-icon" id="btnDeckToggleMinimize" title="Kecilkan / Buka Deck Kontrol">
                <span id="deckMinIcon">➖</span>
              </button>
            </div>
          </div>

          <!-- Deck Body (Collapsible) -->
          <div class="runway-deck-body" id="runwayDeckBody">
            <!-- Row 1: Motion Controls & Turntable Deck -->
            <div class="deck-controls-row">
              <!-- Play / Pause Toggle -->
              <button type="button" class="deck-ctrl-btn active" id="btnDeckTogglePause" title="Jeda atau Jalankan Catwalk Runway">
                <span class="ctrl-icon" id="deckPauseIcon">⏸</span>
                <span class="ctrl-text" id="deckPauseText">JEDA RUNWAY</span>
              </button>

              <!-- Speed Multiplier Buttons -->
              <div class="deck-speed-group">
                <span class="group-label">SPEED:</span>
                <button type="button" class="deck-speed-btn" data-speed="0.5" title="0.5x - Kecepatan Lambat untuk Inspeksi Model">0.5x</button>
                <button type="button" class="deck-speed-btn active" data-speed="1.0" title="1.0x - Kecepatan Jelajah Normal">1.0x</button>
                <button type="button" class="deck-speed-btn" data-speed="2.0" title="2.0x - Mode Turbo Hyper Expo">2.0x</button>
              </div>

              <!-- Direction Toggle -->
              <button type="button" class="deck-ctrl-btn" id="btnDeckToggleDirection" title="Ubah Arah Gerakan Runway Catwalk">
                <span class="ctrl-icon" id="deckDirIcon">⇥</span>
                <span class="ctrl-text" id="deckDirText">ARAH: MAJU</span>
              </button>

              <!-- 360 Turntable Spin Toggle -->
              <button type="button" class="deck-ctrl-btn active" id="btnDeckToggleTurntable" title="Aktifkan atau Kunci Putaran 360° Turntable Pod">
                <span class="ctrl-icon">🔄</span>
                <span class="ctrl-text" id="deckTurntableText">360° TURNTABLE: ON</span>
              </button>
            </div>

            <!-- Row 2: Curated Theme Presets & Quick Actions -->
            <div class="deck-presets-row">
              <span class="presets-label">⚡ PRESET PAMERAN:</span>
              <button type="button" class="deck-preset-btn" data-preset="mecha_expo" title="Pasang koleksi Gundam & Cyber Mecha ke Runway Slot 01-04">
                <span>🤖 Cyber Mecha Expo</span>
              </button>
              <button type="button" class="deck-preset-btn" data-preset="fantasy_warlords" title="Pasang Warlord & Dragon ke Runway Slot 05-06">
                <span>🐉 Warlords &amp; Beasts</span>
              </button>
              <button type="button" class="deck-preset-btn" data-preset="clear_standby" title="Kembalikan semua slot runway ke standby reticle bersih">
                <span>🧹 Reset Standby</span>
              </button>
              <button type="button" class="deck-preset-btn eco-btn" id="btnDeckOpenEcosystem" title="Buka Sinkronisasi Model dari 3D AI Studio / RTX 3060">
                <span>🌐 Ekosistem 3D AI Studio</span>
              </button>
            </div>

            <!-- Row 3: 8 Runway Slots Quick Jumper -->
            <div class="deck-slots-row">
              <span class="slots-label">🎯 SLOT PODS:</span>
              <div class="deck-slots-strip">
                ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `
                  <button type="button" class="deck-slot-pip" data-slot="${i}" title="Fokus Kamera ke Slot 0${i + 1} & Pasang Model">
                    <span>0${i + 1}</span>
                  </button>
                `).join('')}
              </div>
              <button type="button" class="deck-btn-more" id="btnDeckOpenWorkshop" title="Buka Manajemen Aset Lengkap">
                <span>📦 BUKA WORKSHOP</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 1. Focus Camera on Runway
    const btnFocus = this.container.querySelector('#btnDeckFocusRunway');
    if (btnFocus) {
      btnFocus.addEventListener('click', () => {
        if (this.engine3D?.flyToSector) {
          this.engine3D.flyToSector('conveyor_runway');
        }
        try { audio.playClick?.(); } catch (e) {}
      });
    }

    // 2. Toggle Minimize
    const btnMin = this.container.querySelector('#btnDeckToggleMinimize');
    const body = this.container.querySelector('#runwayDeckBody');
    const minIcon = this.container.querySelector('#deckMinIcon');
    if (btnMin && body) {
      btnMin.addEventListener('click', () => {
        this.isMinimized = !this.isMinimized;
        body.style.display = this.isMinimized ? 'none' : 'block';
        if (minIcon) minIcon.textContent = this.isMinimized ? '➕' : '➖';
        try { audio.playClick?.(); } catch (e) {}
      });
    }

    // 3. Play / Pause Toggle
    const btnPause = this.container.querySelector('#btnDeckTogglePause');
    const pauseIcon = this.container.querySelector('#deckPauseIcon');
    const pauseText = this.container.querySelector('#deckPauseText');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.engine3D?.toggleConveyor) {
          this.isPaused = this.engine3D.toggleConveyor();
          btnPause.classList.toggle('active', !this.isPaused);
          if (pauseIcon) pauseIcon.textContent = this.isPaused ? '▶' : '⏸';
          if (pauseText) pauseText.textContent = this.isPaused ? 'LANJUTKAN' : 'JEDA RUNWAY';
          this.updateSpeedBadge();
          this.onNotification({
            agent: 'RUNWAY DECK',
            text: this.isPaused ? 'Catwalk runway 56m dijeda.' : 'Catwalk runway 56m kembali bergerak.',
            type: 'info'
          });
          try { audio.playBlip?.(); } catch (e) {}
        }
      });
    }

    // 4. Speed Multipliers
    const speedBtns = this.container.querySelectorAll('.deck-speed-btn');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.getAttribute('data-speed') || '1.0');
        this.currentSpeed = speed;
        this.isPaused = false;
        if (this.engine3D?.setConveyorSpeed) {
          this.engine3D.setConveyorSpeed(speed);
        }
        if (btnPause) {
          btnPause.classList.add('active');
          if (pauseIcon) pauseIcon.textContent = '⏸';
          if (pauseText) pauseText.textContent = 'JEDA RUNWAY';
        }
        this.updateSpeedBadge();
        this.onNotification({
          agent: 'RUNWAY DECK',
          text: `Kecepatan catwalk runway diatur ke ${speed.toFixed(1)}x.`,
          type: 'info'
        });
        try { audio.playClick?.(); } catch (e) {}
      });
    });

    // 5. Direction Toggle
    const btnDir = this.container.querySelector('#btnDeckToggleDirection');
    const dirIcon = this.container.querySelector('#deckDirIcon');
    const dirText = this.container.querySelector('#deckDirText');
    if (btnDir) {
      btnDir.addEventListener('click', () => {
        this.direction = this.direction === 1 ? -1 : 1;
        if (this.engine3D?.setConveyorDirection) {
          this.engine3D.setConveyorDirection(this.direction);
        }
        if (dirIcon) dirIcon.textContent = this.direction === 1 ? '⇥' : '⇤';
        if (dirText) dirText.textContent = this.direction === 1 ? 'ARAH: MAJU' : 'ARAH: MUNDUR';
        this.onNotification({
          agent: 'RUNWAY DECK',
          text: `Arah gerak catwalk runway dibalik (${this.direction === 1 ? 'Maju' : 'Mundur'}).`,
          type: 'info'
        });
        try { audio.playClick?.(); } catch (e) {}
      });
    }

    // 6. Turntable Toggle
    const btnTurntable = this.container.querySelector('#btnDeckToggleTurntable');
    const turntableText = this.container.querySelector('#deckTurntableText');
    if (btnTurntable) {
      btnTurntable.addEventListener('click', () => {
        this.isTurntable = !this.isTurntable;
        if (this.engine3D?.setConveyorTurntable) {
          this.engine3D.setConveyorTurntable(this.isTurntable, 1.0);
        }
        btnTurntable.classList.toggle('active', this.isTurntable);
        if (turntableText) turntableText.textContent = this.isTurntable ? '360° TURNTABLE: ON' : '360° TURNTABLE: OFF';
        this.onNotification({
          agent: 'RUNWAY DECK',
          text: `Putaran 360° turntable ${this.isTurntable ? 'diaktifkan' : 'dikunci'}.`,
          type: 'info'
        });
        try { audio.playClick?.(); } catch (e) {}
      });
    }

    // 7. Curated Theme Presets
    const presetBtns = this.container.querySelectorAll('.deck-preset-btn:not(.eco-btn)');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const preset = btn.getAttribute('data-preset');
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply via server endpoint or engine directly
        try {
          if (this.engine3D?.applyConveyorPreset) {
            await this.engine3D.applyConveyorPreset(preset);
          }
          await fetch('/api/runway-preset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preset })
          });
          this.onNotification({
            agent: 'EXPO PRESET',
            text: `Tema pameran [${preset.toUpperCase()}] berhasil diterapkan ke Catwalk Runway!`,
            type: 'success'
          });
          try { audio.playSuccess?.(); } catch (e) {}
        } catch (e) {
          console.warn('[RunwayControlDeck] Preset error:', e);
        }
      });
    });

    // 8. Open Ecosystem sync
    const btnEco = this.container.querySelector('#btnDeckOpenEcosystem');
    if (btnEco) {
      btnEco.addEventListener('click', () => {
        this.onOpenAssetManager('library', { filter: 'ai_studio' });
        try { audio.playClick?.(); } catch (e) {}
      });
    }

    // 9. Quick Slot Pips
    const slotPips = this.container.querySelectorAll('.deck-slot-pip');
    slotPips.forEach(pip => {
      pip.addEventListener('click', () => {
        const slotIdx = parseInt(pip.getAttribute('data-slot') || '0', 10);
        if (this.engine3D?.focusConveyorPod) {
          this.engine3D.focusConveyorPod(slotIdx);
        }
        this.onOpenSlotWorkshop(slotIdx);
        try { audio.playClick?.(); } catch (e) {}
      });
    });

    // 10. Open full workshop
    const btnWorkshop = this.container.querySelector('#btnDeckOpenWorkshop');
    if (btnWorkshop) {
      btnWorkshop.addEventListener('click', () => {
        this.onOpenAssetManager('deploy', { deployTarget: 'conveyor' });
        try { audio.playClick?.(); } catch (e) {}
      });
    }
  }

  updateSpeedBadge() {
    const badge = this.container.querySelector('#deckSpeedDisplay');
    if (badge) {
      if (this.isPaused) {
        badge.textContent = '⏸ PAUSED';
        badge.style.color = '#fbbf24';
        badge.style.borderColor = 'rgba(251, 191, 36, 0.4)';
      } else {
        const label = this.currentSpeed === 0.5 ? 'INSPECT' : this.currentSpeed === 2.0 ? 'TURBO' : 'CRUISE';
        badge.textContent = `${this.currentSpeed.toFixed(1)}x (${label})`;
        badge.style.color = '#38bdf8';
        badge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      }
    }
  }

  syncState() {
    if (!this.engine3D) return;
    const state = this.engine3D.getConveyorState();
    if (state) {
      this.currentSpeed = state.beltSpeedMultiplier;
      this.isPaused = state.isBeltPaused;
      this.direction = state.beltDirection;
      this.isTurntable = state.isTurntableSpinning;
      this.updateSpeedBadge();
    }
  }

  show() {
    this.container.style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }
}
