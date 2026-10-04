/**
 * AssetManagerModal.js - 3D Asset & GLB Pipeline Workshop Modal
 *
 * Dedicated modal providing:
 * - Drag-and-drop & file picker for .glb / .gltf models
 * - Direct URL model loading & built-in quick presets
 * - Real-time 3D model inspection preview (rotate, zoom, inspect wireframe)
 * - Model telemetry (polygons, vertices, file size, bones, animations)
 * - Flexible Deployment Destinations:
 *   1. Assign as custom skin to any AI Agent (Arthur, ROUTEX, VOLTIS, etc.)
 *   2. Place in Sector 01 (Arsenal & Weapon Lab)
 *   3. Place in Sector 02 (Exo-Armor & Mecha Turntable)
 *   4. Place in Sector 04 (Drone & Vehicle Hangar)
 *   5. Place in Sector 05 (Quantum Core Containment Chamber)
 *   6. Place onto the 56m Moving Catwalk Conveyor
 */

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { loadGLB } from '../engine/3d/modelLoader.js'
import { audio } from '../engine/AudioManager.js'

export const CONVEYOR_SLOT_CONFIGS = [
  { index: 0, num: '01', name: 'SLOT 01', color: '#38bdf8' },
  { index: 1, num: '02', name: 'SLOT 02', color: '#06b6d4' },
  { index: 2, num: '03', name: 'SLOT 03', color: '#10b981' },
  { index: 3, num: '04', name: 'SLOT 04', color: '#f59e0b' },
  { index: 4, num: '05', name: 'SLOT 05', color: '#eab308' },
  { index: 5, num: '06', name: 'SLOT 06', color: '#a855f7' },
  { index: 6, num: '07', name: 'SLOT 07', color: '#ec4899' },
  { index: 7, num: '08', name: 'SLOT 08', color: '#38bdf8' },
]

export class AssetManagerModal {
  constructor({ container, registry, engine3D, onDeployAsset, onShowcaseUpdated }) {
    this.container = container
    this.registry = registry
    this.engine3D = engine3D
    this.onDeployAsset = onDeployAsset || (() => {})
    this.onShowcaseUpdated = onShowcaseUpdated || (() => {})

    this.isOpen = false
    this.currentFile = null
    this.currentSource = null
    this.loadedModel = null
    this.selectedSlotIndex = 0
    this.cachedShowcaseState = {}
    this.activeTab = 'library'
    this.libraryFilter = 'all'
    this.librarySearch = ''
    this.uploadedModels = []
    this.ecosystemAssets = []
    this.selectedTargetHeight = 3.0

    // 3D Preview state
    this.previewRenderer = null
    this.previewScene = null
    this.previewCamera = null
    this.previewGroup = null
    this.previewMixer = null
    this.previewAnimFrame = null
    this.isDragging = false
    this.prevMouseX = 0
    this.prevMouseY = 0

    // Phase 1: Shading & Animation Player State
    this.currentShadingMode = 'pbr'
    this.isPlayingAnimation = true
    this.animationSpeed = 1.0
    this.isAutoRotateTurntable = true
    this.isProceduralBobbing = false
    this.currentClipName = ''
    this.activeAction = null
    this.activeClip = null
    this.isScrubbing = false
    this.detectedBonesList = []

    this.render()
    this.bindEvents()
  }

  render() {
    this.container.innerHTML = `
      <div class="asset-modal-overlay" id="assetModalOverlay" style="display: none;">
        <div class="asset-modal-dialog glass-panel custom-scrollbar">
          <!-- Modal Header -->
          <div class="asset-modal-header">
            <div class="asset-modal-title-group">
              <span class="asset-modal-badge">3D ASSET ECOSYSTEM</span>
              <h2 class="asset-modal-title">📦 MANAJEMEN ASET 3D // GLB REPOSITORY &amp; WORKSHOP</h2>
              <span class="asset-modal-sub">Kelola, Inspeksi, dan Deploy File Model 3D (.glb / .gltf) ke Catwalk Runway, Sektor Ruangan, &amp; Skin Operator</span>
            </div>
            <button class="asset-modal-close-btn" id="btnAssetModalClose" title="Tutup Modal (Esc)">✕</button>
          </div>

          <!-- Master View Mode Tabs: Library vs Workshop -->
          <div class="asset-modal-tabs-bar">
            <button type="button" class="asset-tab-btn active" id="tabBtnLibrary">
              <span class="tab-btn-icon">📂</span>
              <span class="tab-btn-label">PERPUSTAKAAN &amp; KELOLA ASET GLB</span>
              <span class="tab-btn-badge" id="libraryCountBadge">0 MODEL</span>
            </button>
            <button type="button" class="asset-tab-btn" id="tabBtnDeploy">
              <span class="tab-btn-icon">⚡</span>
              <span class="tab-btn-label">WORKSHOP UPLOAD &amp; PASANG KE RUANGAN</span>
              <span class="tab-btn-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">LIVE 3D</span>
            </button>
          </div>

          <!-- TAB VIEW 1: Dedicated GLB Asset Library & Repository Manager -->
          <div class="asset-library-view" id="viewAssetLibrary" style="display: flex;">
            <!-- Top Metric Stats Cards -->
            <div class="lib-stats-grid">
              <div class="lib-stat-card">
                <span class="lib-stat-label">📦 TOTAL MODEL DISK</span>
                <span class="lib-stat-value" id="libStatTotal">0</span>
                <span class="lib-stat-sub">File .glb tersimpan di server</span>
              </div>
              <div class="lib-stat-card">
                <span class="lib-stat-label">🚀 AKTIF DI AULA 3D</span>
                <span class="lib-stat-value" id="libStatActive" style="color: #10b981;">0</span>
                <span class="lib-stat-sub">Runway, Sektor, &amp; Skin Operator</span>
              </div>
              <div class="lib-stat-card">
                <span class="lib-stat-label">💾 TOTAL PENYIMPANAN</span>
                <span class="lib-stat-value" id="libStatSize" style="color: #38bdf8;">0 MB</span>
                <span class="lib-stat-sub">Kapasitas disk server terpakai</span>
              </div>
              <div class="lib-stat-card">
                <span class="lib-stat-label">🟢 STANDBY REPOSITORY</span>
                <span class="lib-stat-value" id="libStatVacant" style="color: #fbbf24;">0</span>
                <span class="lib-stat-sub">Siap dideploy ke aula</span>
              </div>
            </div>

            <!-- Toolbar: Search, Filters, & Actions -->
            <div class="lib-toolbar">
              <div class="lib-search-box">
                <span class="lib-search-icon">🔍</span>
                <input type="text" id="libSearchInput" placeholder="Cari nama model .glb di server..." class="lib-search-input" />
              </div>

              <div class="lib-filter-group">
                <button type="button" class="lib-filter-btn active" data-filter="all">Semua</button>
                <button type="button" class="lib-filter-btn" data-filter="conveyor">🏃‍♂️ Runway</button>
                <button type="button" class="lib-filter-btn" data-filter="sector">🏛️ Sektor</button>
                <button type="button" class="lib-filter-btn" data-filter="agent">🤖 Skin</button>
                <button type="button" class="lib-filter-btn" data-filter="ai_studio">🌐 3D AI Studio</button>
                <button type="button" class="lib-filter-btn" data-filter="unassigned">📦 Standby</button>
              </div>

              <div class="lib-action-btns">
                <button type="button" class="btn btn-primary btn-sm" id="btnLibUploadNew">
                  <span>+ Unggah Model (.glb)</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" id="btnSyncEcosystem" title="Pindai model dari AUDIRA-3D-AI-Studio & RTX 3060 Worker" style="border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">
                  <span>🌐 Pindai 3D AI Studio</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" id="btnExportSnapshot" title="Ekspor cadangan snapshot tata letak 3D JSON">
                  <span>💾 Backup Snapshot</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" id="btnImportSnapshot" title="Pulihkan cadangan snapshot tata letak 3D JSON">
                  <span>📥 Restore Snapshot</span>
                </button>
                <input type="file" id="inputSnapshotFile" accept=".json" style="display: none;" />
                <button type="button" class="btn btn-secondary btn-sm" id="btnLibRefresh">
                  <span>🔄 Refresh</span>
                </button>
              </div>
            </div>

            <!-- Asset Cards Grid -->
            <div class="lib-cards-grid custom-scrollbar" id="libAssetGrid">
              <!-- Rendered dynamically by renderLibraryGrid() -->
            </div>
          </div>

          <!-- TAB VIEW 2: Workshop Upload & Deployment Split Screen -->
          <div class="asset-modal-body" id="viewAssetDeploy" style="display: none;">
            <!-- Left Column: Upload & Deployment Controls -->
            <div class="asset-ctrl-col">
              <!-- Upload Dropzone -->
              <div class="asset-dropzone" id="assetDropzone">
                <input type="file" id="assetFileInput" accept=".glb,.gltf" style="display: none;" />
                <div class="dropzone-icon">📤</div>
                <div class="dropzone-title">Drag &amp; Drop file .glb / .gltf di sini</div>
                <div class="dropzone-hint">atau klik untuk memilih file dari komputer Anda</div>
                <button type="button" class="btn btn-secondary btn-sm" id="btnBrowseFile" style="margin-top: 8px;">
                  📁 Pilih File 3D (.glb)
                </button>
              </div>

              <!-- Direct URL Loader -->
              <div class="asset-section-box">
                <div class="asset-box-label">🌐 ATAU MUAT DARI URL:</div>
                <div class="url-input-row" style="display: flex; gap: 8px;">
                  <input type="text" id="assetUrlInput" placeholder="https://... atau /models/sample.glb" class="asset-input" style="flex: 1;" />
                  <button type="button" class="btn btn-secondary btn-sm" id="btnLoadUrl">Muat</button>
                </div>
              </div>

              <!-- Preset Sample 3D Models -->
              <div class="asset-section-box">
                <div class="asset-box-label">⚡ PRESET CONTOH MODEL 3D CEPAT:</div>
                <div class="preset-chips-grid">
                  <button type="button" class="preset-chip-btn" data-preset="mecha">
                    🤖 Mecha War Robot
                  </button>
                  <button type="button" class="preset-chip-btn" data-preset="drone">
                    🚁 Autonomous Drone X-1
                  </button>
                  <button type="button" class="preset-chip-btn" data-preset="weapon">
                    🔫 Plasma Railgun
                  </button>
                  <button type="button" class="preset-chip-btn" data-preset="quantum">
                    ⚡ Quantum Energy Core
                  </button>
                  <button type="button" class="preset-chip-btn" data-preset="conveyor">
                    🚀 Cyber Speeder
                  </button>
                </div>
              </div>

              <!-- Stored 3D Models on Disk Server -->
              <div class="asset-section-box" id="storedModelsSection">
                <div class="asset-box-label" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>💾 MODEL TERSIMPAN DI DISK SERVER:</span>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary btn-xs" id="btnOpenLibraryTab" style="font-size: 10px; padding: 2px 8px; border-color: rgba(16, 185, 129, 0.4); color: #10b981;">📂 Kelola di Library</button>
                    <button type="button" class="btn btn-secondary btn-xs" id="btnRefreshStoredModels" style="font-size: 10px; padding: 2px 8px; border-color: rgba(56, 189, 248, 0.4);">🔄 Refresh</button>
                  </div>
                </div>
                <div class="stored-models-grid" id="storedModelsGrid">
                  <span class="stored-empty-hint">Memuat daftar model di server...</span>
                </div>
              </div>

              <!-- Target Deployment Selector -->
              <div class="asset-section-box highlight-box">
                <div class="asset-box-label">🎯 TUJUAN PENEMPATAN MODEL 3D:</div>
                
                <!-- 2 Big Selectable Mode Cards -->
                <!-- 3 Big Selectable Mode Cards (Prominent Conveyor Runway, Sector Spot, Agent Skin) -->
                <div class="deploy-target-tabs">
                  <!-- Option 1: Pajangan Berjalan (Conveyor Runway 56m) -->
                  <div class="deploy-target-card active" data-target="conveyor" id="tabDeployConveyor">
                    <span class="card-badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8;">✦ BERJALAN 360°</span>
                    <div class="card-title">
                      <input type="radio" name="deployTarget" value="conveyor" checked style="accent-color: #38bdf8;" />
                      <span>🏃‍♂️ Runway Berjalan</span>
                    </div>
                    <div class="card-desc">Conveyor catwalk 56m bergerak melintasi aula di depan Video Wall.</div>
                  </div>

                  <!-- Option 2: Pajangan Statis di Sektor Ruangan -->
                  <div class="deploy-target-card" data-target="sector" id="tabDeploySector">
                    <span class="card-badge">SPOT RUANGAN</span>
                    <div class="card-title">
                      <input type="radio" name="deployTarget" value="sector" style="accent-color: #38bdf8;" />
                      <span>🏛️ Pajang di Sektor</span>
                    </div>
                    <div class="card-desc">Turntable Mecha 6.5m, Arsenal, Helipad Drone, Quantum Core.</div>
                  </div>

                  <!-- Option 3: Pakai Sebagai Skin Agen -->
                  <div class="deploy-target-card agent-card" data-target="agent" id="tabDeployAgent">
                    <span class="card-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">DIPAKAI ROBOT</span>
                    <div class="card-title">
                      <input type="radio" name="deployTarget" value="agent" style="accent-color: #fbbf24;" />
                      <span>🤖 Skin Karakter Agen</span>
                    </div>
                    <div class="card-desc">Dipasang ke AI Operator untuk bertugas &amp; berpatroli di aula.</div>
                  </div>
                </div>

                <!-- Sub-options 1: Conveyor Runway Pajangan Berjalan (Visible by default) -->
                <div class="deploy-sub-options" id="conveyorDeployOptions">
                  <div class="deploy-mode-banner banner-conveyor" style="border-color: #38bdf8; background: rgba(56, 189, 248, 0.1);">
                    <span class="banner-icon">🏃‍♂️</span>
                    <div>
                      <strong style="color: #38bdf8;">PAJANGAN BERJALAN: CONVEYOR RUNWAY 56 METER</strong>
                      <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
                        Model 3D akan ditempatkan di atas <strong>Pod Turntable Bergerak</strong> yang meluncur bolak-balik melintasi catwalk 56 meter sambil berputar 360° secara otomatis di depan Master Video Wall!
                      </div>
                    </div>
                  </div>

                  <!-- Runway Interactive Controls Strip -->
                  <div class="conveyor-runway-controls-strip" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px;">⚙️</span>
                        <strong style="font-size: 11px; letter-spacing: 0.5px; color: #38bdf8;">KONTROL GERAK RUNWAY 56M:</strong>
                      </div>
                      <span id="modalRunwaySpeedBadge" style="font-family: monospace; font-size: 11px; color: #38bdf8; font-weight: 700;">1.0x (CRUISE)</span>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                      <button type="button" class="btn btn-secondary btn-xs" id="btnModalRunwayPause">⏸ JEDA</button>
                      <div style="display: flex; gap: 3px; align-items: center;">
                        <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">SPD:</span>
                        <button type="button" class="btn btn-secondary btn-xs btn-modal-speed" data-speed="0.5">0.5x</button>
                        <button type="button" class="btn btn-secondary btn-xs btn-modal-speed active" data-speed="1.0">1.0x</button>
                        <button type="button" class="btn btn-secondary btn-xs btn-modal-speed" data-speed="2.0">2.0x</button>
                      </div>
                      <button type="button" class="btn btn-secondary btn-xs" id="btnModalRunwayDir">⇥ MAJU</button>
                      <button type="button" class="btn btn-secondary btn-xs" id="btnModalRunwayTurntable">🔄 360° SPIN</button>
                      <button type="button" class="btn btn-secondary btn-xs" id="btnModalPresetMecha" style="border-color: rgba(56, 189, 248, 0.5); color: #38bdf8;">🤖 Preset Mecha</button>
                      <button type="button" class="btn btn-secondary btn-xs" id="btnModalPresetBeast" style="border-color: rgba(245, 158, 11, 0.5); color: #fbbf24;">🐉 Preset Warlord</button>
                    </div>
                  </div>

                  <!-- Visual 8-Slot Interactive Picker Grid -->
                  <div class="conveyor-slot-picker-wrap">
                    <div class="slot-picker-header">
                      <span class="slot-picker-title">🎯 PILIH NOMOR SLOT RUNWAY (SLOT 01 - 08):</span>
                      <span class="slot-picker-badge" id="slotPickerCountBadge">8 SLOTS TERSEDIA</span>
                    </div>

                    <!-- 8 Clickable Slot Cards -->
                    <div class="conveyor-slots-picker-grid" id="conveyorSlotsPickerGrid">
                      <!-- Rendered by renderConveyorSlotPicker() -->
                    </div>

                    <!-- Interactive Slot Status Banner -->
                    <div class="slot-info-banner" id="slotInfoBanner">
                      <span class="slot-info-icon" id="slotInfoIcon">🎯</span>
                      <div class="slot-info-content">
                        <div class="slot-info-row">
                          <span class="slot-info-label">TARGET SLOT:</span>
                          <strong class="slot-info-name" id="slotSelectedIndicator">SLOT 01</strong>
                          <span class="slot-status-pill vacant" id="slotSelectedPill">🟢 STANDBY (KOSONG)</span>
                        </div>
                        <div class="slot-info-desc" id="slotSelectedDesc">
                          Slot turntable masih kosong &amp; siap menampung model 3D baru.
                        </div>
                      </div>
                    </div>

                    <!-- Hidden Synced Select for compatibility -->
                    <select id="selectConveyorPodDirect" style="display: none;">
                      <option value="0" selected>SLOT 01</option>
                      <option value="1">SLOT 02</option>
                      <option value="2">SLOT 03</option>
                      <option value="3">SLOT 04</option>
                      <option value="4">SLOT 05</option>
                      <option value="5">SLOT 06</option>
                      <option value="6">SLOT 07</option>
                      <option value="7">SLOT 08</option>
                    </select>
                  </div>
                </div>

                <!-- Sub-options 2: Sector Pajangan Statis (Hidden by default) -->
                <div class="deploy-sub-options" id="sectorDeployOptions" style="display: none;">
                  <div class="deploy-mode-banner banner-showcase">
                    <span class="banner-icon">🏛️</span>
                    <div>
                      <strong style="color: #38bdf8;">MODE PAJANG SAJA DI SEKTOR (SHOWCASE ONLY)</strong>
                      <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
                        Model 3D dipajang statis di spot pameran khusus sektor ruangan. AI Agent <em>tidak akan menggunakannya</em>.
                      </div>
                    </div>
                  </div>

                  <div class="option-row">
                    <span class="sub-label">Spot Sektor:</span>
                    <select id="selectDeploySector" class="asset-select">
                      <option value="mecha">🛸 Sektor 02 // Mecha Bay (Turntable Hidrolik 6.5m Berputar)</option>
                      <option value="weapon">🔫 Sektor 01 // Arsenal Lab (Meja Kalibrasi &amp; Rak Senjata)</option>
                      <option value="drone">🚁 Sektor 04 // Drone Hangar (Hex Helipad Docking)</option>
                      <option value="quantum">⚡ Sektor 05 // Quantum Core (Bilik Reaktor Terisolasi)</option>
                    </select>
                  </div>
                </div>

                <!-- Sub-options 3: Agent Skin (Hidden by default) -->
                <div class="deploy-sub-options" id="agentDeployOptions" style="display: none;">
                  <div class="deploy-mode-banner banner-agent">
                    <span class="banner-icon">🤖</span>
                    <div>
                      <strong style="color: #fbbf24;">MODE SKIN OPERATOR (DIGUNAKAN AGEN)</strong>
                      <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
                        Model 3D akan dipasang ke karakter AI Operator terpilih sebagai kostum 3D saat bekerja.
                      </div>
                    </div>
                  </div>

                  <div class="option-row">
                    <span class="sub-label">Pilih Agent:</span>
                    <select id="selectDeployAgent" class="asset-select">
                      ${this.registry.getAll().map(a => `
                        <option value="${a.name}">${a.name} (${a.role})</option>
                      `).join('')}
                    </select>
                  </div>

                  <div class="option-row">
                    <span class="sub-label">Mode Gerak:</span>
                    <select id="selectLocomotionMode" class="asset-select">
                      <option value="mecha_stride">🤖 Mecha Stride (Langkah Kaki)</option>
                      <option value="mecha_hover">🚀 Jet Hover (Melayang Halus)</option>
                    </select>
                  </div>
                </div>

                <!-- 3D Scale & Visual Size Adjustment Box -->
                <div class="asset-scale-control-box" style="margin-top: 14px; margin-bottom: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 14px;">📏</span>
                      <strong style="font-size: 11px; letter-spacing: 0.5px; color: #38bdf8; text-transform: uppercase;">Ukuran Visual Model 3D:</strong>
                    </div>
                    <span id="scaleDisplayBadge" style="font-family: monospace; font-size: 12px; font-weight: 800; color: #38bdf8; background: rgba(15, 23, 42, 0.85); padding: 3px 10px; border-radius: 5px; border: 1px solid rgba(56, 189, 248, 0.4);">
                      3.0m (Megah &amp; Gagah)
                    </span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 10px; font-family: monospace; color: #94a3b8;">1.0m</span>
                    <input type="range" id="inputAssetScaleSlider" min="1.0" max="5.0" step="0.1" value="3.0" style="flex: 1; accent-color: #38bdf8; cursor: pointer; height: 6px; border-radius: 3px;">
                    <span style="font-size: 10px; font-family: monospace; color: #94a3b8;">5.0m</span>
                  </div>
                  <!-- Quick Preset Pills -->
                  <div class="scale-presets-pills">
                    <button type="button" class="btn-scale-preset" data-scale="1.8">👤 1.8m (Humanoid)</button>
                    <button type="button" class="btn-scale-preset active" data-scale="3.0">🤖 3.0m (Mecha Runway)</button>
                    <button type="button" class="btn-scale-preset" data-scale="4.2">⚡ 4.2m (Titan Colossus)</button>
                  </div>
                </div>

                <!-- Deploy Action Button -->
                <button type="button" class="btn btn-primary btn-block asset-deploy-btn" id="btnExecuteDeploy">
                  🏃‍♂️ PAJANG DI CONVEYOR BERJALAN (CATWALK RUNWAY 56M)
                </button>
              </div>

              <!-- Active Showcase Status & Management -->
              <div class="asset-section-box" id="showcaseManagerSection" style="background: rgba(14, 28, 48, 0.45); border: 1px dashed rgba(56, 189, 248, 0.35);">
                <div class="asset-box-label" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>🎪 STATUS &amp; KELOLA PAJANGAN:</span>
                  <button type="button" class="btn btn-secondary btn-xs" id="btnClearAllConveyor" style="color: #f43f5e; border-color: rgba(244, 63, 94, 0.4); font-size: 10px; padding: 2px 8px;">🗑️ Kosongkan Runway</button>
                </div>
                <div id="activeShowcaseList" class="showcase-active-grid">
                  <!-- Populated dynamically -->
                </div>
              </div>
            </div>

            <!-- Right Column: Interactive 3D Model Inspection Viewport -->
            <div class="asset-preview-col">
              <div class="preview-viewport-card">
                <div class="viewport-header">
                  <div class="viewport-header-left">
                    <span class="viewport-badge">LIVE 3D INSPECTOR</span>
                    <div class="shading-mode-toolbar">
                      <span class="shading-label">🎨 Shading:</span>
                      <button type="button" class="btn-shading-mode active" data-shading="pbr" title="PBR Full Render (Tekstur, Material & Normal Maps Asli)">PBR</button>
                      <button type="button" class="btn-shading-mode" data-shading="wireframe" title="Neon Cyber Wireframe (Inspeksi Topologi & Polygon Mesh)">Wireframe</button>
                      <button type="button" class="btn-shading-mode" data-shading="clay" title="Clay MatCap Sculpt (Inspeksi Bentuk, Kurva & Siluet)">Clay</button>
                      <button type="button" class="btn-shading-mode" data-shading="normals" title="Normal Maps Orientation (Inspeksi Arah Vektor Permukaan)">Normals</button>
                    </div>
                  </div>
                  <div class="viewport-lighting-toolbar">
                    <span class="lighting-label">💡 Kecerahan:</span>
                    <button type="button" class="btn-light-preset active" data-exposure="1.05">Normal (Alami)</button>
                    <button type="button" class="btn-light-preset" data-exposure="1.35">☀️ Terang</button>
                    <button type="button" class="btn-bg-toggle" id="btnTogglePreviewBg" title="Ganti Latar Gelap / Kontras Terang">🎨 Latar</button>
                    <button type="button" class="btn-bg-toggle" id="btnRecenterCamera" title="Pusatkan Kamera ke Seluruh Badan Model (Center &amp; Frame)">🎯 Center</button>
                  </div>
                </div>
                
                <div class="viewport-canvas-box">
                  <canvas id="assetPreviewCanvas"></canvas>
                  <div class="viewport-overlay-loading" id="viewportLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <span>Memproses &amp; Mengoptimalkan Mesh 3D...</span>
                  </div>
                </div>

                <!-- Phase 1: Skeletal Animation Player Deck -->
                <div class="anim-controller-deck" id="animControllerDeck">
                  <div class="anim-deck-header">
                    <div class="anim-deck-title">
                      <span class="anim-deck-icon">🎬</span>
                      <span class="anim-deck-label">ANIMATION PLAYER // SKELETAL RIG</span>
                      <span class="anim-deck-count-badge" id="animClipsCountBadge">0 CLIPS</span>
                    </div>
                    <div class="anim-deck-time-display">
                      <span id="animTimeCurrent">0.00s</span> / <span id="animTimeTotal">0.00s</span>
                    </div>
                  </div>

                  <!-- Time Scrub Bar -->
                  <div class="anim-scrub-row">
                    <input type="range" class="anim-scrub-slider" id="animScrubSlider" min="0" max="100" value="0" step="0.1" disabled />
                  </div>

                  <!-- Playback & Clip Selection Controls Row -->
                  <div class="anim-controls-row">
                    <div class="anim-playback-group">
                      <button type="button" class="btn-anim-play" id="btnAnimTogglePlay" title="Play / Pause Animasi">
                        <span id="animPlayIcon">▶</span>
                        <span id="animPlayText">PLAY</span>
                      </button>
                      <select class="anim-clip-select" id="selectAnimClip" title="Pilih Klip Animasi Skeletal" disabled>
                        <option value="">(Tidak ada klip animasi)</option>
                      </select>
                    </div>

                    <div class="anim-speed-group">
                      <span class="anim-speed-label">Speed:</span>
                      <div class="anim-speed-chips">
                        <button type="button" class="btn-anim-speed" data-speed="0.25">0.25x</button>
                        <button type="button" class="btn-anim-speed" data-speed="0.5">0.5x</button>
                        <button type="button" class="btn-anim-speed active" data-speed="1.0">1.0x</button>
                        <button type="button" class="btn-anim-speed" data-speed="1.5">1.5x</button>
                        <button type="button" class="btn-anim-speed" data-speed="2.0">2.0x</button>
                      </div>
                    </div>

                    <div class="anim-util-group">
                      <button type="button" class="btn-deck-toggle active" id="btnToggleTurntable" title="Toggle Auto-Rotate Turntable Model 360°">
                        🔄 Turntable
                      </button>
                      <button type="button" class="btn-deck-toggle" id="btnToggleProceduralBob" title="Toggle Prosedural Hover / Floating untuk Model Statis">
                        ✨ Hover
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 3D Model Telemetry Cards -->
                <div class="model-telemetry-grid">
                  <div class="telem-item">
                    <span class="telem-label">NAMA ASSET</span>
                    <span class="telem-val" id="telemName">-</span>
                  </div>
                  <div class="telem-item">
                    <span class="telem-label">UKURAN FILE &amp; MEMORI</span>
                    <span class="telem-val" id="telemSize">-</span>
                  </div>
                  <div class="telem-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="telem-label">POLYGONS / TRIANGLES</span>
                      <span class="poly-rating-pill" id="telemPolyRating" style="display: none;">OPTIMAL</span>
                    </div>
                    <span class="telem-val" id="telemPolys">-</span>
                  </div>
                  <div class="telem-item">
                    <span class="telem-label">VERTICES &amp; SUBMESHES</span>
                    <span class="telem-val" id="telemVerts">-</span>
                  </div>
                  <div class="telem-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="telem-label">RIGGING / SKELETON</span>
                      <button type="button" class="btn-bone-inspect" id="btnToggleBones" style="display: none;">🦴 Sendi</button>
                    </div>
                    <span class="telem-val" id="telemBones">-</span>
                  </div>
                  <div class="telem-item">
                    <span class="telem-label">ANIMASI AKTIF &amp; DURASI</span>
                    <span class="telem-val" id="telemAnims">-</span>
                  </div>
                  <div class="telem-item" style="grid-column: span 2;">
                    <span class="telem-label">DIMENSI MODEL 3D (W × H × D)</span>
                    <span class="telem-val" id="telemDims">-</span>
                  </div>
                </div>

                <!-- Collapsible Bone Hierarchy Explorer -->
                <div class="bone-hierarchy-deck" id="boneHierarchyDeck" style="display: none;">
                  <div class="bone-deck-header">
                    <span class="bone-deck-title">🦴 STRUKTUR TULANG / SKELETON JOINTS:</span>
                    <span class="bone-deck-count" id="boneCountBadge">0 BONES</span>
                  </div>
                  <div class="bone-chips-wrap custom-scrollbar" id="boneChipsWrap">
                    <!-- Populated dynamically -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  bindEvents() {
    const overlay = this.container.querySelector('#assetModalOverlay')
    const btnClose = this.container.querySelector('#btnAssetModalClose')
    const dropzone = this.container.querySelector('#assetDropzone')
    const fileInput = this.container.querySelector('#assetFileInput')
    const btnBrowse = this.container.querySelector('#btnBrowseFile')
    const btnLoadUrl = this.container.querySelector('#btnLoadUrl')
    const urlInput = this.container.querySelector('#assetUrlInput')
    const btnDeploy = this.container.querySelector('#btnExecuteDeploy')

    // Close button & overlay click
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close())
    }
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close()
      })
    }

    // Keydown Esc to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    })

    // Browse file
    if (btnBrowse && fileInput) {
      btnBrowse.addEventListener('click', () => fileInput.click())
      dropzone.addEventListener('click', (e) => {
        if (e.target !== btnBrowse) fileInput.click()
      })
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0]
        if (file) this.loadFile(file)
      })
    }

    // Drag and drop zone
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault()
        dropzone.classList.add('dragover')
      })
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover')
      })
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault()
        dropzone.classList.remove('dragover')
        const file = e.dataTransfer?.files?.[0]
        if (file) this.loadFile(file)
      })
    }

    // URL load
    if (btnLoadUrl && urlInput) {
      btnLoadUrl.addEventListener('click', () => {
        const url = urlInput.value.trim()
        if (url) this.loadUrl(url)
      })
    }

    // Preset buttons
    const presetBtns = this.container.querySelectorAll('.preset-chip-btn')
    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset')
        this.loadPreset(preset)
      })
    })

    // Stored models refresh button
    const btnRefreshStored = this.container.querySelector('#btnRefreshStoredModels')
    if (btnRefreshStored) {
      btnRefreshStored.addEventListener('click', () => {
        this.refreshStoredModels()
      })
    }

    // Export Snapshot JSON
    const btnExportSnapshot = this.container.querySelector('#btnExportSnapshot')
    if (btnExportSnapshot) {
      btnExportSnapshot.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/showcase-state')
          let state = this.cachedShowcaseState
          if (res.ok) {
            const data = await res.json()
            if (data.state) state = data.state
          }
          const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `audira_3d_showcase_snapshot_${new Date().toISOString().slice(0, 10)}.json`
          a.click()
          URL.revokeObjectURL(url)
          audio.playSuccess()
        } catch (e) {
          audio.playAlert()
          alert('Gagal mengekspor snapshot: ' + e.message)
        }
      })
    }

    // Import Snapshot JSON
    const btnImportSnapshot = this.container.querySelector('#btnImportSnapshot')
    const inputSnapshotFile = this.container.querySelector('#inputSnapshotFile')
    if (btnImportSnapshot && inputSnapshotFile) {
      btnImportSnapshot.addEventListener('click', () => {
        inputSnapshotFile.click()
      })

      inputSnapshotFile.addEventListener('change', async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
          const text = await file.text()
          const parsed = JSON.parse(text)
          if (!parsed.conveyor && !parsed.sectors) {
            throw new Error('Format snapshot tidak valid: harus memuat key conveyor atau sectors')
          }
          const res = await fetch('/api/showcase-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          })
          if (res.ok) {
            this.cachedShowcaseState = parsed
            this.onShowcaseUpdated(parsed)
            this.renderShowcaseStatus(parsed)
            this.renderLibraryGrid()
            audio.playSuccess()
            alert('✅ Snapshot berhasil dipulihkan dan diterapkan ke aula 3D!')
          }
        } catch (err) {
          audio.playAlert()
          alert('❌ Gagal memulihkan snapshot: ' + err.message)
        }
        inputSnapshotFile.value = ''
      })
    }

    // Clear All Runway Conveyor button
    const btnClearConveyor = this.container.querySelector('#btnClearAllConveyor')
    if (btnClearConveyor) {
      btnClearConveyor.addEventListener('click', () => {
        this.clearAllConveyor()
      })
    }

    // Deploy Mode Toggle (Cards & Radios sync for 3 Modes: Conveyor, Sector, Agent)
    const tabConveyor = this.container.querySelector('#tabDeployConveyor')
    const tabSector = this.container.querySelector('#tabDeploySector')
    const tabAgent = this.container.querySelector('#tabDeployAgent')
    const conveyorOpts = this.container.querySelector('#conveyorDeployOptions')
    const sectorOpts = this.container.querySelector('#sectorDeployOptions')
    const agentOpts = this.container.querySelector('#agentDeployOptions')

    const updateDeployMode = (mode) => {
      const radioConveyor = this.container.querySelector('input[name="deployTarget"][value="conveyor"]')
      const radioSector = this.container.querySelector('input[name="deployTarget"][value="sector"]')
      const radioAgent = this.container.querySelector('input[name="deployTarget"][value="agent"]')

      if (mode === 'agent') {
        if (radioAgent) radioAgent.checked = true
        if (tabAgent) tabAgent.classList.add('active')
        if (tabSector) tabSector.classList.remove('active')
        if (tabConveyor) tabConveyor.classList.remove('active')
        if (agentOpts) agentOpts.style.display = 'block'
        if (sectorOpts) sectorOpts.style.display = 'none'
        if (conveyorOpts) conveyorOpts.style.display = 'none'
        if (btnDeploy) {
          btnDeploy.innerHTML = '🤖 PASANG SEBAGAI SKIN OPERATOR (GUNAKAN)'
          btnDeploy.style.background = 'linear-gradient(135deg, #d97706, #b45309)'
          btnDeploy.style.borderColor = '#fbbf24'
        }
      } else if (mode === 'sector') {
        if (radioSector) radioSector.checked = true
        if (tabSector) tabSector.classList.add('active')
        if (tabConveyor) tabConveyor.classList.remove('active')
        if (tabAgent) tabAgent.classList.remove('active')
        if (agentOpts) agentOpts.style.display = 'none'
        if (sectorOpts) sectorOpts.style.display = 'block'
        if (conveyorOpts) conveyorOpts.style.display = 'none'
        if (btnDeploy) {
          btnDeploy.innerHTML = '🏛️ PAJANG ASSET DI SPOT SEKTOR (DISPLAY ONLY)'
          btnDeploy.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)'
          btnDeploy.style.borderColor = '#38bdf8'
        }
      } else {
        // mode === 'conveyor' (Default)
        if (radioConveyor) radioConveyor.checked = true
        if (tabConveyor) tabConveyor.classList.add('active')
        if (tabSector) tabSector.classList.remove('active')
        if (tabAgent) tabAgent.classList.remove('active')
        if (conveyorOpts) conveyorOpts.style.display = 'block'
        if (sectorOpts) sectorOpts.style.display = 'none'
        if (agentOpts) agentOpts.style.display = 'none'
        const currentSlotName = CONVEYOR_SLOT_CONFIGS[this.selectedSlotIndex]?.name || 'SLOT 01'
        if (btnDeploy) {
          btnDeploy.innerHTML = `🏃‍♂️ PAJANG DI RUNWAY (${currentSlotName})`
          btnDeploy.style.background = 'linear-gradient(135deg, #0284c7, #06b6d4)'
          btnDeploy.style.borderColor = '#38bdf8'
        }
      }
    }

    if (tabConveyor) tabConveyor.addEventListener('click', () => updateDeployMode('conveyor'))
    if (tabSector) tabSector.addEventListener('click', () => updateDeployMode('sector'))
    if (tabAgent) tabAgent.addEventListener('click', () => updateDeployMode('agent'))

    const radios = this.container.querySelectorAll('input[name="deployTarget"]')
    radios.forEach((r) => {
      r.addEventListener('change', (e) => {
        updateDeployMode(e.target.value)
      })
    })

    // Execute Deploy button
    if (btnDeploy) {
      btnDeploy.addEventListener('click', () => {
        this.executeDeployment()
      })
    }

    // Scale Slider & Preset Pills Handlers
    const scaleSlider = this.container.querySelector('#inputAssetScaleSlider')
    const scaleBadge = this.container.querySelector('#scaleDisplayBadge')
    const scalePresets = this.container.querySelectorAll('.btn-scale-preset')

    const updateScaleDisplay = (val) => {
      this.selectedTargetHeight = parseFloat(val)
      if (scaleBadge) {
        let label = 'Megah & Gagah'
        if (this.selectedTargetHeight <= 2.0) label = 'Humanoid / Compact'
        else if (this.selectedTargetHeight >= 4.0) label = 'Titan / Colossus'
        scaleBadge.innerHTML = `${this.selectedTargetHeight.toFixed(1)}m (${label})`
      }
      if (scaleSlider && scaleSlider.value !== String(this.selectedTargetHeight)) {
        scaleSlider.value = String(this.selectedTargetHeight)
      }
      scalePresets.forEach((btn) => {
        const btnScale = parseFloat(btn.getAttribute('data-scale') || '3.0')
        if (Math.abs(btnScale - this.selectedTargetHeight) < 0.1) {
          btn.classList.add('active')
        } else {
          btn.classList.remove('active')
        }
      })

      // Realtime live scale update in Preview Inspector canvas
      if (this.loadedModel && this.loadedModel.rawScene && this.loadedModel.originalSize) {
        const origH = this.loadedModel.originalSize.y
        if (origH > 0.001) {
          const factor = this.selectedTargetHeight / origH
          this.loadedModel.rawScene.scale.setScalar(factor)
          const newBox = new THREE.Box3().setFromObject(this.loadedModel.rawScene)
          this.loadedModel.rawScene.position.y = -newBox.min.y
          this.fitCameraToPreview()
        }
      }
    }

    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        updateScaleDisplay(e.target.value)
      })
    }

    scalePresets.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const scaleVal = btn.getAttribute('data-scale')
        if (scaleVal) updateScaleDisplay(scaleVal)
      })
    })

    // Viewport Lighting toolbar handlers
    const lightBtns = this.container.querySelectorAll('.btn-light-preset')
    lightBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        lightBtns.forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        const exp = parseFloat(btn.getAttribute('data-exposure') || '2.2')
        if (this.previewRenderer) {
          this.previewRenderer.toneMappingExposure = exp
        }
      })
    })

    const btnBg = this.container.querySelector('#btnTogglePreviewBg')
    const canvasBox = this.container.querySelector('.viewport-canvas-box')
    if (btnBg && canvasBox) {
      btnBg.addEventListener('click', () => {
        canvasBox.classList.toggle('high-contrast-bg')
        if (canvasBox.classList.contains('high-contrast-bg')) {
          btnBg.style.background = '#38bdf8'
          btnBg.style.color = '#070d18'
          btnBg.style.fontWeight = '700'
        } else {
          btnBg.style.background = ''
          btnBg.style.color = ''
          btnBg.style.fontWeight = ''
        }
      })
    }

    // Center camera button
    const btnCenter = this.container.querySelector('#btnRecenterCamera')
    if (btnCenter) {
      btnCenter.addEventListener('click', () => {
        this.fitCameraToPreview()
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Master View Mode Tabs (Library vs Deploy Workshop)
    const tabLib = this.container.querySelector('#tabBtnLibrary')
    const tabDep = this.container.querySelector('#tabBtnDeploy')
    if (tabLib) tabLib.addEventListener('click', () => this.switchTab('library'))
    if (tabDep) tabDep.addEventListener('click', () => this.switchTab('deploy'))

    // Button to jump to Library tab from stored models box
    const btnOpenLib = this.container.querySelector('#btnOpenLibraryTab')
    if (btnOpenLib) btnOpenLib.addEventListener('click', () => this.switchTab('library'))

    // Library Search input
    const libSearch = this.container.querySelector('#libSearchInput')
    if (libSearch) {
      libSearch.addEventListener('input', (e) => {
        this.librarySearch = e.target.value
        this.renderLibraryGrid()
      })
    }

    // Library Filter buttons
    const filterBtns = this.container.querySelectorAll('.lib-filter-btn')
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        this.libraryFilter = btn.getAttribute('data-filter') || 'all'
        this.renderLibraryGrid()
        try { audio.playClick?.() } catch (e) {}
      })
    })

    // Library Action buttons
    const btnLibUpload = this.container.querySelector('#btnLibUploadNew')
    if (btnLibUpload && fileInput) {
      btnLibUpload.addEventListener('click', () => fileInput.click())
    }

    const btnLibRefresh = this.container.querySelector('#btnLibRefresh')
    if (btnLibRefresh) {
      btnLibRefresh.addEventListener('click', () => {
        this.refreshLibrary()
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Ecosystem 3D AI Studio Scan Button
    const btnSyncEco = this.container.querySelector('#btnSyncEcosystem')
    if (btnSyncEco) {
      btnSyncEco.addEventListener('click', async () => {
        btnSyncEco.disabled = true
        btnSyncEco.innerHTML = '<span>⏳ Memindai...</span>'
        try {
          await this.scanEcosystem()
          const filterBtn = this.container.querySelector('.lib-filter-btn[data-filter="ai_studio"]')
          if (filterBtn) filterBtn.click()
        } finally {
          btnSyncEco.disabled = false
          btnSyncEco.innerHTML = '<span>🌐 Pindai 3D AI Studio</span>'
        }
      })
    }

    // Modal Runway Motion Controls
    const btnModalPause = this.container.querySelector('#btnModalRunwayPause')
    if (btnModalPause) {
      btnModalPause.addEventListener('click', () => {
        if (this.engine3D?.toggleConveyor) {
          const paused = this.engine3D.toggleConveyor()
          btnModalPause.textContent = paused ? '▶ JALAN' : '⏸ JEDA'
          this.updateModalRunwayBadge()
        }
      })
    }

    const modalSpeedBtns = this.container.querySelectorAll('.btn-modal-speed')
    modalSpeedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modalSpeedBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const speed = parseFloat(btn.getAttribute('data-speed') || '1.0')
        if (this.engine3D?.setConveyorSpeed) {
          this.engine3D.setConveyorSpeed(speed)
        }
        if (btnModalPause) btnModalPause.textContent = '⏸ JEDA'
        this.updateModalRunwayBadge()
      })
    })

    const btnModalDir = this.container.querySelector('#btnModalRunwayDir')
    let modalDir = 1
    if (btnModalDir) {
      btnModalDir.addEventListener('click', () => {
        modalDir = modalDir === 1 ? -1 : 1
        if (this.engine3D?.setConveyorDirection) {
          this.engine3D.setConveyorDirection(modalDir)
        }
        btnModalDir.textContent = modalDir === 1 ? '⇥ MAJU' : '⇤ MUNDUR'
      })
    }

    const btnModalTurntable = this.container.querySelector('#btnModalRunwayTurntable')
    let modalTurntable = true
    if (btnModalTurntable) {
      btnModalTurntable.addEventListener('click', () => {
        modalTurntable = !modalTurntable
        if (this.engine3D?.setConveyorTurntable) {
          this.engine3D.setConveyorTurntable(modalTurntable, 1.0)
        }
        btnModalTurntable.textContent = modalTurntable ? '🔄 360° SPIN' : '🔒 LOCKED'
        btnModalTurntable.classList.toggle('active', modalTurntable)
      })
    }

    const btnPresetMecha = this.container.querySelector('#btnModalPresetMecha')
    if (btnPresetMecha) {
      btnPresetMecha.addEventListener('click', async () => {
        if (this.engine3D?.applyConveyorPreset) {
          await this.engine3D.applyConveyorPreset('mecha_expo')
        }
        await fetch('/api/runway-preset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preset: 'mecha_expo' }) })
        await this.refreshShowcaseManager()
        this.onShowcaseUpdated(this.cachedShowcaseState)
        try { audio.playSuccess?.() } catch (e) {}
      })
    }

    const btnPresetBeast = this.container.querySelector('#btnModalPresetBeast')
    if (btnPresetBeast) {
      btnPresetBeast.addEventListener('click', async () => {
        if (this.engine3D?.applyConveyorPreset) {
          await this.engine3D.applyConveyorPreset('fantasy_warlords')
        }
        await fetch('/api/runway-preset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preset: 'fantasy_warlords' }) })
        await this.refreshShowcaseManager()
        this.onShowcaseUpdated(this.cachedShowcaseState)
        try { audio.playSuccess?.() } catch (e) {}
      })
    }

    // Phase 1: Shading Mode Toolbar buttons
    const shadingBtns = this.container.querySelectorAll('.btn-shading-mode')
    shadingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        shadingBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const mode = btn.getAttribute('data-shading') || 'pbr'
        this.setShadingMode(mode)
        try { audio.playClick?.() } catch (e) {}
      })
    })

    // Phase 1: Animation Play / Pause
    const btnTogglePlay = this.container.querySelector('#btnAnimTogglePlay')
    if (btnTogglePlay) {
      btnTogglePlay.addEventListener('click', () => {
        this.togglePlayAnimation()
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Phase 1: Animation Clip Selector
    const selectClip = this.container.querySelector('#selectAnimClip')
    if (selectClip) {
      selectClip.addEventListener('change', (e) => {
        this.switchAnimationClip(e.target.value)
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Phase 1: Animation Scrub Slider
    const scrubSlider = this.container.querySelector('#animScrubSlider')
    if (scrubSlider) {
      scrubSlider.addEventListener('mousedown', () => { this.isScrubbing = true })
      scrubSlider.addEventListener('touchstart', () => { this.isScrubbing = true })
      scrubSlider.addEventListener('input', (e) => {
        this.isScrubbing = true
        this.scrubAnimation(parseFloat(e.target.value))
      })
      scrubSlider.addEventListener('change', (e) => {
        this.scrubAnimation(parseFloat(e.target.value))
        this.isScrubbing = false
      })
      window.addEventListener('mouseup', () => { this.isScrubbing = false })
      window.addEventListener('touchend', () => { this.isScrubbing = false })
    }

    // Phase 1: Animation Speed Chips
    const speedBtns = this.container.querySelectorAll('.btn-anim-speed')
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        const speed = parseFloat(btn.getAttribute('data-speed')) || 1.0
        this.setAnimationSpeed(speed)
        try { audio.playClick?.() } catch (e) {}
      })
    })

    // Phase 1: Turntable Auto-Rotate Toggle
    const btnTurntable = this.container.querySelector('#btnToggleTurntable')
    if (btnTurntable) {
      btnTurntable.addEventListener('click', () => {
        this.isAutoRotateTurntable = !this.isAutoRotateTurntable
        btnTurntable.classList.toggle('active', this.isAutoRotateTurntable)
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Phase 1: Procedural Hover / Floating Toggle
    const btnBob = this.container.querySelector('#btnToggleProceduralBob')
    if (btnBob) {
      btnBob.addEventListener('click', () => {
        this.isProceduralBobbing = !this.isProceduralBobbing
        btnBob.classList.toggle('active', this.isProceduralBobbing)
        if (!this.isProceduralBobbing && this.loadedModel?.root) {
          this.loadedModel.root.position.y = 0.125
        }
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Phase 1: Bone Hierarchy Explorer Toggle
    const btnBones = this.container.querySelector('#btnToggleBones')
    const boneDeck = this.container.querySelector('#boneHierarchyDeck')
    if (btnBones && boneDeck) {
      btnBones.addEventListener('click', () => {
        const isHidden = boneDeck.style.display === 'none'
        boneDeck.style.display = isHidden ? 'flex' : 'none'
        btnBones.classList.toggle('active', isHidden)
        try { audio.playClick?.() } catch (e) {}
      })
    }

    // Initialize Slot Picker
    this.renderConveyorSlotPicker()
    this.selectConveyorSlot(0)

    // Initialize 3D Viewport
    this.initPreviewViewport()
  }

  initPreviewViewport() {
    const canvas = this.container.querySelector('#assetPreviewCanvas')
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width || 420
    const height = rect.height || 360

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    this.previewRenderer.setSize(width, height)
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.previewRenderer.toneMapping = THREE.ACESFilmicToneMapping
    this.previewRenderer.toneMappingExposure = 1.05
    this.previewRenderer.outputColorSpace = THREE.SRGBColorSpace

    this.previewScene = new THREE.Scene()
    this.previewCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    this.previewLookAtTarget = new THREE.Vector3(0, 1.5, 0)
    this.previewCamera.position.set(0, 1.7, 5.2)
    this.previewCamera.lookAt(this.previewLookAtTarget)

    // Generate Studio Environment Map for metallic & PBR surface reflections
    const pmrem = new THREE.PMREMGenerator(this.previewRenderer)
    pmrem.compileEquirectangularShader()
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.previewScene.environment = envTexture
    this.previewScene.environmentIntensity = 0.45

    // Balanced Studio Lighting Rig (Ensures vivid diffuse colors, crisp shadows & specular highlights)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.95)
    this.previewScene.add(hemiLight)

    // Key Light (Front-Right Upper)
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(2.5, 4.5, 3.5)
    this.previewScene.add(key)

    // Fill Light (Front-Left Upper)
    const fill = new THREE.DirectionalLight(0x94a3b8, 0.75)
    fill.position.set(-3.0, 3.5, 3.0)
    this.previewScene.add(fill)

    // Rim / Backlight (Upper Rear with subtle cyan rim accent to define silhouette)
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.1)
    rim.position.set(0, 5.0, -3.2)
    this.previewScene.add(rim)

    // Front Under-Bounce Light (Soft ambient bounce)
    const under = new THREE.DirectionalLight(0xffffff, 0.4)
    under.position.set(0, -1.8, 3.0)
    this.previewScene.add(under)

    // Pedestal
    this.previewGroup = new THREE.Group()
    this.previewScene.add(this.previewGroup)

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.25 })
    )
    plinth.position.y = 0.06
    this.previewGroup.add(plinth)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.035, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 3.5 })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.125
    this.previewGroup.add(ring)

    // Orbit Drag Interaction (Rotate Y & Elevation Pitch)
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.prevMouseX = e.clientX
      this.prevMouseY = e.clientY
    })

    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.previewGroup) return
      const deltaX = e.clientX - this.prevMouseX
      const deltaY = e.clientY - this.prevMouseY

      // Horizontal yaw: rotate model 360°
      this.previewGroup.rotation.y += deltaX * 0.015

      // Vertical camera tilt/elevation: look up or down
      if (this.previewCamera && this.previewLookAtTarget) {
        this.previewCamera.position.y = Math.max(-0.5, Math.min(8.0, this.previewCamera.position.y - deltaY * 0.008))
        this.previewCamera.lookAt(this.previewLookAtTarget)
      }

      this.prevMouseX = e.clientX
      this.prevMouseY = e.clientY
    })

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      if (!this.previewCamera || !this.previewLookAtTarget) return
      const dir = new THREE.Vector3().subVectors(this.previewCamera.position, this.previewLookAtTarget)
      let dist = dir.length()
      dist = Math.max(1.8, Math.min(14.0, dist + e.deltaY * 0.006))
      dir.normalize().multiplyScalar(dist)
      this.previewCamera.position.copy(this.previewLookAtTarget).add(dir)
      this.previewCamera.lookAt(this.previewLookAtTarget)
    }, { passive: false })
  }

  /**
   * Automatically calculates model bounding box and centers camera so the entire model
   * from head to toe is 100% visible and centered in the viewport.
   */
  fitCameraToPreview() {
    if (!this.previewCamera || !this.previewGroup) return

    // Calculate bounding box of the loaded model (or plinth group)
    const targetObj = this.loadedModel?.root || this.previewGroup
    const box = new THREE.Box3().setFromObject(targetObj)
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // FOV angles in radians
    const vFovRad = this.previewCamera.fov * (Math.PI / 180)
    const aspect = this.previewCamera.aspect || 1.15
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect)

    // Compute required distance to comfortably fit both height and width with 36% safety margin
    const distY = (size.y / 2) / Math.tan(vFovRad / 2)
    const distX = (size.x / 2) / Math.tan(hFovRad / 2)
    const distZ = size.z / 2

    const requiredDist = Math.max(distY, distX, distZ) * 1.36
    const finalDist = Math.max(2.8, Math.min(12.0, requiredDist))

    // Set lookAt target exactly at the vertical midpoint of the model
    this.previewLookAtTarget = new THREE.Vector3(0, Math.max(0.6, center.y), 0)

    // Position camera backed up to finalDist and centered vertically
    this.previewCamera.position.set(0, this.previewLookAtTarget.y + size.y * 0.06, finalDist)
    this.previewCamera.lookAt(this.previewLookAtTarget)
    this.previewCamera.updateProjectionMatrix()
  }

  async loadFile(file) {
    this.currentFile = file
    this.currentSource = file

    // Automatically upload to server disk so it is persisted in the Library
    try {
      const uploadRes = await this.uploadModelFile(file)
      if (uploadRes && uploadRes.url) {
        this.currentSource = uploadRes.url
        this.currentFile = { name: uploadRes.filename, size: uploadRes.size }
        await this.refreshStoredModels()
        await this.refreshLibrary()
      }
    } catch (e) {
      console.warn('[AssetManagerModal] Upload during loadFile warning:', e)
    }

    await this.processAndDisplayModel(this.currentSource, file.name, file.size)
    if (this.activeTab === 'library') {
      this.switchTab('deploy')
    }
  }

  async loadUrl(url) {
    this.currentFile = null
    this.currentSource = url
    const fileName = url.split('/').pop() || 'Remote Model'
    await this.processAndDisplayModel(url, fileName, 0)
  }

  async loadPreset(presetKey) {
    const loading = this.container.querySelector('#viewportLoading')
    if (loading) loading.style.display = 'flex'

    let targetHeight = 1.85
    let title = 'Preset 3D Model'

    if (presetKey === 'mecha') {
      title = '🤖 Mecha War Robot'
      targetHeight = 2.4
    } else if (presetKey === 'drone') {
      title = '🚁 Autonomous Drone X-1'
      targetHeight = 0.9
    } else if (presetKey === 'weapon') {
      title = '🔫 Plasma Railgun Cannon'
      targetHeight = 0.7
    } else if (presetKey === 'quantum') {
      title = '⚡ Quantum Reactor Core'
      targetHeight = 1.5
    } else {
      title = '🚀 Cyber Speeder'
      targetHeight = 1.2
    }

    this.currentSource = `preset://${presetKey}`
    this.currentFile = { name: `${title}.glb`, size: 284000 }
    await this.processAndDisplayModel(this.currentSource, title, 284000)
  }

  async processAndDisplayModel(source, name, sizeBytes) {
    const loading = this.container.querySelector('#viewportLoading')
    if (loading) loading.style.display = 'flex'

    try {
      const glb = await loadGLB(source, {
        targetHeight: this.selectedTargetHeight || 3.0,
        groundY: true,
        centerXZ: true,
      })

      if (this.loadedModel) {
        this.previewGroup.remove(this.loadedModel.root)
        if (this.loadedModel.dispose) this.loadedModel.dispose()
      }

      this.loadedModel = glb
      glb.root.position.y = 0.125
      this.previewGroup.add(glb.root)

      // Cache original mesh materials for non-destructive shading switching
      glb.root.traverse((obj) => {
        if (obj.isMesh && obj.material && !obj.userData.__origMaterial) {
          obj.userData.__origMaterial = obj.material
        }
      })

      // Auto-frame camera so model head and feet are completely visible and centered
      this.fitCameraToPreview()

      // Calculate polygons, vertices, meshes, and bone joints
      let triangleCount = 0
      let vertexCount = 0
      let meshCount = 0
      const bonesList = []

      glb.root.traverse((obj) => {
        if (obj.isMesh && obj.geometry) {
          meshCount++
          const geo = obj.geometry
          if (geo.index) {
            triangleCount += geo.index.count / 3
          } else if (geo.attributes.position) {
            triangleCount += geo.attributes.position.count / 3
          }
          if (geo.attributes.position) {
            vertexCount += geo.attributes.position.count
          }
        }
        if (obj.isBone) {
          bonesList.push(obj.name || `Joint_${bonesList.length + 1}`)
        }
      })
      this.detectedBonesList = bonesList

      // Setup Animation Player Deck
      this.populateAnimationControls(glb)

      // Apply active shading mode
      this.setShadingMode(this.currentShadingMode)

      // Render bone hierarchy chips
      this.renderBoneChips(bonesList)

      const sizeStr = sizeBytes > 0
        ? (sizeBytes > 1024 * 1024 ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(sizeBytes / 1024)} KB`)
        : 'Web Stream'

      const dims = glb.originalSize
        ? `${dimsFormat(glb.originalSize.x)} × ${dimsFormat(glb.originalSize.y)} × ${dimsFormat(glb.originalSize.z)}`
        : '~1.8m Height'

      // Evaluate Game-Ready rating
      let polyRatingText = '🟢 GAME READY'
      let polyRatingClass = 'poly-optimal'
      if (triangleCount > 80000) {
        polyRatingText = '🔴 HIGH POLY'
        polyRatingClass = 'poly-heavy'
      } else if (triangleCount > 25000) {
        polyRatingText = '🟡 MID POLY'
        polyRatingClass = 'poly-medium'
      }

      const activeClipDesc = this.activeClip
        ? `${this.activeClip.name} (${this.activeClip.duration.toFixed(2)}s)`
        : (glb.animations.length > 0 ? `${glb.animations.length} Clips (Siaga)` : 'Model Statis')

      this.updateTelemetry({
        name,
        size: sizeStr,
        polys: `${Math.round(triangleCount).toLocaleString()} Triangles`,
        polyRatingText,
        polyRatingClass,
        verts: `${Math.round(vertexCount).toLocaleString()} Verts (${meshCount} Meshes)`,
        bones: bonesList.length > 0 ? `Rigged (${bonesList.length} Bones)` : (glb.hasBones ? 'Rigged (Armature)' : 'Static Mesh'),
        hasBones: bonesList.length > 0 || glb.hasBones,
        anims: activeClipDesc,
        dims,
      })

      try {
        audio.ensureContext()
        if (audio.playGlbSuccess) audio.playGlbSuccess()
        else if (audio.playBlip) audio.playBlip()
      } catch (e) {
        // audio policy ignored
      }
    } catch (err) {
      console.error('[AssetManagerModal] Failed to parse GLB:', err)
      alert(`Gagal memuat file 3D .glb: ${err.message}`)
    } finally {
      if (loading) loading.style.display = 'none'
    }
  }

  /**
   * Switches shading mode across all meshes in the model non-destructively:
   * - 'pbr': Restores original realistic textures, normal maps, and diffuse materials
   * - 'wireframe': Neon cyber cyan wireframe topology
   * - 'clay': Studio clay/MatCap sculpt finish
   * - 'normals': RGB normal vector orientation
   */
  setShadingMode(mode) {
    this.currentShadingMode = mode
    if (!this.loadedModel || !this.loadedModel.root) return

    // Update active button state
    const btns = this.container.querySelectorAll('.btn-shading-mode')
    btns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-shading') === mode)
    })

    this.loadedModel.root.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (!obj.userData.__origMaterial) {
          obj.userData.__origMaterial = obj.material
        }
        const orig = obj.userData.__origMaterial

        if (mode === 'pbr') {
          obj.material = orig
        } else if (mode === 'wireframe') {
          obj.material = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.88,
          })
        } else if (mode === 'clay') {
          obj.material = new THREE.MeshStandardMaterial({
            color: 0xd8dde4,
            roughness: 0.65,
            metalness: 0.08,
            flatShading: false,
          })
        } else if (mode === 'normals') {
          obj.material = new THREE.MeshNormalMaterial({
            wireframe: false,
          })
        }
      }
    })
  }

  /**
   * Populates animation controls and defaults to active clip
   */
  populateAnimationControls(glb) {
    const select = this.container.querySelector('#selectAnimClip')
    const slider = this.container.querySelector('#animScrubSlider')
    const btnPlay = this.container.querySelector('#btnAnimTogglePlay')
    const countBadge = this.container.querySelector('#animClipsCountBadge')
    const timeCur = this.container.querySelector('#animTimeCurrent')
    const timeTotal = this.container.querySelector('#animTimeTotal')

    if (!select || !slider) return

    this.previewMixer = glb.mixer
    this.isPlayingAnimation = true
    this.activeAction = null
    this.activeClip = null

    if (glb.animations && glb.animations.length > 0 && glb.actions && glb.actions.size > 0) {
      if (countBadge) countBadge.textContent = `${glb.animations.length} CLIPS`
      select.innerHTML = ''
      select.disabled = false
      slider.disabled = false
      if (btnPlay) {
        btnPlay.disabled = false
        this.updatePlayButtonState(true)
      }

      glb.animations.forEach((clip, idx) => {
        const opt = document.createElement('option')
        opt.value = clip.name
        opt.textContent = `${idx + 1}. ${clip.name || 'Clip'} (${clip.duration.toFixed(2)}s)`
        select.appendChild(opt)
      })

      // Choose default clip: walk, idle, or first clip
      let defaultClip = glb.animations[0]
      const walkClip = glb.animations.find(c => c.name.toLowerCase().includes('walk') || c.name.toLowerCase().includes('run'))
      const idleClip = glb.animations.find(c => c.name.toLowerCase().includes('idle'))
      if (walkClip) defaultClip = walkClip
      else if (idleClip) defaultClip = idleClip

      select.value = defaultClip.name
      this.switchAnimationClip(defaultClip.name)
    } else {
      if (countBadge) countBadge.textContent = '0 CLIPS'
      select.innerHTML = '<option value="">(Model Statis - Tanpa Skeletal Clips)</option>'
      select.disabled = true
      slider.disabled = true
      slider.value = 0
      if (timeCur) timeCur.textContent = '0.00s'
      if (timeTotal) timeTotal.textContent = '0.00s'
      if (btnPlay) {
        btnPlay.disabled = true
        this.updatePlayButtonState(false)
      }
    }
  }

  /**
   * Switches to a specific animation clip with smooth crossfade
   */
  switchAnimationClip(clipName) {
    if (!this.loadedModel || !this.loadedModel.animations || !this.previewMixer) return

    const clip = this.loadedModel.animations.find(c => c.name === clipName)
    if (!clip) return

    const newAction = this.loadedModel.actions.get(clipName) || this.previewMixer.clipAction(clip)

    if (this.activeAction && this.activeAction !== newAction) {
      this.activeAction.fadeOut(0.2)
    }

    newAction.reset()
    newAction.setEffectiveTimeScale(this.animationSpeed || 1.0)
    newAction.fadeIn(0.2).play()

    this.activeAction = newAction
    this.activeClip = clip
    this.currentClipName = clipName
    this.isPlayingAnimation = true
    this.updatePlayButtonState(true)

    const timeTotal = this.container.querySelector('#animTimeTotal')
    if (timeTotal) timeTotal.textContent = `${clip.duration.toFixed(2)}s`

    const timeCur = this.container.querySelector('#animTimeCurrent')
    if (timeCur) timeCur.textContent = '0.00s'

    const slider = this.container.querySelector('#animScrubSlider')
    if (slider) slider.value = 0

    // Update active telemetry anim info
    const telemAnims = this.container.querySelector('#telemAnims')
    if (telemAnims) {
      telemAnims.textContent = `${clip.name} (${clip.duration.toFixed(2)}s)`
    }
  }

  /**
   * Toggles play/pause for skeletal animation
   */
  togglePlayAnimation() {
    if (!this.activeAction) return
    this.isPlayingAnimation = !this.isPlayingAnimation
    this.updatePlayButtonState(this.isPlayingAnimation)
  }

  updatePlayButtonState(isPlaying) {
    const icon = this.container.querySelector('#animPlayIcon')
    const text = this.container.querySelector('#animPlayText')
    const btn = this.container.querySelector('#btnAnimTogglePlay')
    if (icon) icon.textContent = isPlaying ? '⏸' : '▶'
    if (text) text.textContent = isPlaying ? 'PAUSE' : 'PLAY'
    if (btn) btn.classList.toggle('active', isPlaying)
  }

  /**
   * Adjusts animation playback speed multiplier
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = speed
    if (this.activeAction) {
      this.activeAction.setEffectiveTimeScale(speed)
    }
    const btns = this.container.querySelectorAll('.btn-anim-speed')
    btns.forEach(b => {
      b.classList.toggle('active', parseFloat(b.getAttribute('data-speed')) === speed)
    })
  }

  /**
   * Scrubs animation to a specific percentage (0 - 100)
   */
  scrubAnimation(percent) {
    if (!this.activeAction || !this.activeClip || !this.previewMixer) return

    const dur = this.activeClip.duration || 1.0
    const targetTime = (Math.max(0, Math.min(100, percent)) / 100) * dur

    this.activeAction.time = targetTime
    this.previewMixer.update(0)

    const timeCur = this.container.querySelector('#animTimeCurrent')
    if (timeCur) timeCur.textContent = `${targetTime.toFixed(2)}s`
  }

  /**
   * Renders bone hierarchy chips
   */
  renderBoneChips(bonesList) {
    const wrap = this.container.querySelector('#boneChipsWrap')
    const countBadge = this.container.querySelector('#boneCountBadge')
    const btnInspect = this.container.querySelector('#btnToggleBones')

    if (btnInspect) {
      btnInspect.style.display = bonesList && bonesList.length > 0 ? 'inline-block' : 'none'
    }

    if (!wrap) return
    if (!bonesList || bonesList.length === 0) {
      wrap.innerHTML = '<span style="color: #64748b; font-size: 10px;">Model ini tidak memiliki armature / skeletal bones (Static Mesh).</span>'
      if (countBadge) countBadge.textContent = '0 BONES'
      return
    }

    if (countBadge) countBadge.textContent = `${bonesList.length} BONES`
    wrap.innerHTML = bonesList.map((bone, idx) => `
      <div class="bone-chip" title="Joint #${idx + 1}: ${bone}">
        <span class="bone-chip-icon">🦴</span>
        <span class="bone-chip-name">${bone}</span>
      </div>
    `).join('')
  }

  updateTelemetry(data) {
    const el = (id) => this.container.querySelector(id)
    if (el('#telemName')) el('#telemName').textContent = data.name || '-'
    if (el('#telemSize')) el('#telemSize').textContent = data.size || '-'
    if (el('#telemPolys')) el('#telemPolys').textContent = data.polys || '-'
    if (el('#telemVerts')) el('#telemVerts').textContent = data.verts || '-'
    if (el('#telemBones')) el('#telemBones').textContent = data.bones || '-'
    if (el('#telemAnims')) el('#telemAnims').textContent = data.anims || '-'
    if (el('#telemDims')) el('#telemDims').textContent = data.dims || '-'

    const ratingPill = el('#telemPolyRating')
    if (ratingPill && data.polyRatingText) {
      ratingPill.textContent = data.polyRatingText
      ratingPill.className = `poly-rating-pill ${data.polyRatingClass || 'poly-optimal'}`
      ratingPill.style.display = 'inline-block'
    }
  }

  async uploadModelFile(file) {
    const filename = file.name || `model_${Date.now()}.glb`
    const endpoints = [
      `/api/upload-model?filename=${encodeURIComponent(filename)}`,
      `http://localhost:8080/api/upload-model?filename=${encodeURIComponent(filename)}`
    ]
    let lastError = null
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': encodeURIComponent(filename),
          },
          body: file,
        })
        if (res.ok) {
          return await res.json()
        }
      } catch (err) {
        lastError = err
      }
    }
    throw lastError || new Error('Gagal mengunggah file ke backend server')
  }

  async saveShowcaseState(patch) {
    const endpoints = [
      '/api/showcase-state',
      'http://localhost:8080/api/showcase-state'
    ]
    let savedState = null
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (res.ok) {
          const json = await res.json()
          savedState = json.state
          break
        }
      } catch (e) {}
    }

    try {
      const cur = JSON.parse(localStorage.getItem('audira_showcase_state_v2') || '{}')
      if (patch.conveyor) cur.conveyor = { ...(cur.conveyor || {}), ...patch.conveyor }
      if (patch.sectors) cur.sectors = { ...(cur.sectors || {}), ...patch.sectors }
      if (patch.agentSkins) cur.agentSkins = { ...(cur.agentSkins || {}), ...patch.agentSkins }
      localStorage.setItem('audira_showcase_state_v2', JSON.stringify(cur))
      if (!savedState) savedState = cur
    } catch (e) {}

    if (savedState) {
      this.onShowcaseUpdated(savedState)
    }
    return savedState
  }

  async fetchUploadedModels() {
    const endpoints = ['/api/uploaded-models', 'http://localhost:8080/api/uploaded-models']
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep)
        if (res.ok) {
          const data = await res.json()
          return data.models || []
        }
      } catch (e) {}
    }
    return []
  }

  async fetchShowcaseState() {
    const endpoints = ['/api/showcase-state', 'http://localhost:8080/api/showcase-state']
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep)
        if (res.ok) {
          const data = await res.json()
          return data.state
        }
      } catch (e) {}
    }
    try {
      const raw = localStorage.getItem('audira_showcase_state_v2')
      if (raw) return JSON.parse(raw)
    } catch (e) {}
    return null
  }

  async refreshStoredModels() {
    const grid = this.container.querySelector('#storedModelsGrid')
    if (!grid) return
    grid.innerHTML = '<span class="stored-empty-hint">Memuat model tersimpan...</span>'

    const models = await this.fetchUploadedModels()
    if (!models || models.length === 0) {
      grid.innerHTML = '<span class="stored-empty-hint">Belum ada model tersimpan di public/models/uploads. Upload file .glb di atas untuk menyimpannya permanen ke disk server.</span>'
      return
    }

    grid.innerHTML = ''
    models.forEach((m) => {
      const sizeStr = m.size ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : ''
      const card = document.createElement('div')
      card.className = 'stored-model-card'
      card.title = `Klik untuk mempratinjau & deploy: ${m.filename}`
      card.innerHTML = `
        <span>📦</span>
        <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.filename}</span>
        <small style="color: #64748b; font-size: 9px;">${sizeStr}</small>
      `
      card.addEventListener('click', () => {
        this.container.querySelectorAll('.stored-model-card').forEach(c => c.classList.remove('active'))
        card.classList.add('active')
        this.currentSource = m.url
        this.currentFile = { name: m.filename, size: m.size }
        this.processAndDisplayModel(m.url, m.filename, m.size)
      })
      grid.appendChild(card)
    })
  }

  switchTab(tabName) {
    this.activeTab = tabName
    const btnLib = this.container.querySelector('#tabBtnLibrary')
    const btnDep = this.container.querySelector('#tabBtnDeploy')
    const viewLib = this.container.querySelector('#viewAssetLibrary')
    const viewDep = this.container.querySelector('#viewAssetDeploy')

    if (tabName === 'library') {
      if (btnLib) btnLib.classList.add('active')
      if (btnDep) btnDep.classList.remove('active')
      if (viewLib) viewLib.style.display = 'flex'
      if (viewDep) viewDep.style.display = 'none'
      this.refreshLibrary()
    } else {
      if (btnDep) btnDep.classList.add('active')
      if (btnLib) btnLib.classList.remove('active')
      if (viewDep) viewDep.style.display = 'grid'
      if (viewLib) viewLib.style.display = 'none'
      this.startPreviewLoop()
      // Adjust preview renderer size when tab becomes visible
      setTimeout(() => {
        const canvas = this.container.querySelector('#assetPreviewCanvas')
        if (canvas && this.previewRenderer && this.previewCamera) {
          const rect = canvas.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            this.previewRenderer.setSize(rect.width, rect.height)
            this.previewCamera.aspect = rect.width / rect.height
            this.previewCamera.updateProjectionMatrix()
          }
        }
      }, 50)
    }
    try { audio.playClick?.() } catch (e) {}
  }

  getModelPlacements(model) {
    const placements = []
    const filename = model.filename
    const url = model.url
    const state = this.cachedShowcaseState || {}

    // Check conveyor slots 0..7
    if (state.conveyor) {
      for (let i = 0; i < 8; i++) {
        const pod = state.conveyor[i]
        if (pod && (pod.modelUrl === url || pod.fileName === filename || (pod.title && pod.title.toLowerCase().includes(filename.toLowerCase().replace(/\.[^/.]+$/, ''))))) {
          const cfg = CONVEYOR_SLOT_CONFIGS[i] || { name: `SLOT 0${i + 1}`, color: '#38bdf8' }
          placements.push({
            type: 'conveyor',
            label: `🏃‍♂️ Runway: ${cfg.name}`,
            detail: pod.title || `Slot 0${i + 1}`,
            slotIndex: i,
            color: cfg.color
          })
        }
      }
    }

    // Check sectors
    if (state.sectors) {
      const sectorNames = {
        mecha: 'Sektor 02 // Mecha Bay',
        weapon: 'Sektor 01 // Arsenal Senjata',
        drone: 'Sektor 04 // Drone Hangar',
        quantum: 'Sektor 05 // Quantum Core'
      }
      for (const [secId, sec] of Object.entries(state.sectors)) {
        if (sec && (sec.modelUrl === url || sec.fileName === filename)) {
          placements.push({
            type: 'sector',
            label: `🏛️ ${sectorNames[secId] || secId}`,
            detail: sec.fileName || 'Pameran Sektor',
            sectorId: secId,
            color: '#38bdf8'
          })
        }
      }
    }

    // Check agent skins
    if (state.agentSkins) {
      for (const [agentName, skin] of Object.entries(state.agentSkins)) {
        if (skin && (skin.modelUrl === url || skin.modelName === filename)) {
          placements.push({
            type: 'agent',
            label: `🤖 Skin: ${agentName}`,
            detail: `Mode: ${skin.locomotion || 'Stride'}`,
            agentName,
            color: '#fbbf24'
          })
        }
      }
    }

    return placements
  }

  async scanEcosystem() {
    try {
      const res = await fetch('/api/ecosystem-assets')
      if (res.ok) {
        const data = await res.json()
        this.ecosystemAssets = data.assets || []
        this.renderLibraryGrid()
        try { audio.playSuccess?.() } catch (e) {}
      }
    } catch (e) {
      console.warn('[AssetManagerModal] Failed to scan ecosystem:', e)
    }
  }

  async importEcosystemAsset(asset) {
    try {
      const res = await fetch('/api/ecosystem-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: asset.fullPath,
          filename: asset.filename
        })
      })
      if (res.ok) {
        const data = await res.json()
        try { audio.playGlbSuccess?.() } catch (e) {}
        alert(`✅ Model [${data.filename}] berhasil diimpor ke perpustakaan studio!`)
        await this.refreshLibrary()
        await this.scanEcosystem()
      } else {
        const err = await res.json()
        alert(`Gagal mengimpor model: ${err.error || 'Unknown error'}`)
      }
    } catch (e) {
      alert(`Gagal mengimpor: ${e.message}`)
    }
  }

  updateModalRunwayBadge() {
    const badge = this.container.querySelector('#modalRunwaySpeedBadge')
    if (!badge || !this.engine3D) return
    const state = this.engine3D.getConveyorState()
    if (state) {
      if (state.isBeltPaused) {
        badge.textContent = '⏸ PAUSED'
        badge.style.color = '#fbbf24'
      } else {
        badge.textContent = `${state.beltSpeedMultiplier.toFixed(1)}x (${state.beltSpeedMultiplier === 0.5 ? 'INSPECT' : state.beltSpeedMultiplier === 2.0 ? 'TURBO' : 'CRUISE'})`
        badge.style.color = '#38bdf8'
      }
    }
  }

  async refreshLibrary() {
    const grid = this.container.querySelector('#libAssetGrid')
    if (!grid) return
    grid.innerHTML = '<span class="stored-empty-hint">Memuat koleksi model dari disk server...</span>'

    const [models, state, ecoRes] = await Promise.all([
      this.fetchUploadedModels(),
      this.fetchShowcaseState(),
      fetch('/api/ecosystem-assets').then(r => r.ok ? r.json() : null).catch(() => null)
    ])

    this.uploadedModels = models || []
    this.cachedShowcaseState = state || {}
    if (ecoRes && ecoRes.assets) {
      this.ecosystemAssets = ecoRes.assets
    }

    // Update count badge
    const badge = this.container.querySelector('#libraryCountBadge')
    if (badge) badge.textContent = `${this.uploadedModels.length} MODEL`

    // Update metric cards
    let totalBytes = 0
    let activeCount = 0
    let vacantCount = 0

    this.uploadedModels.forEach(m => {
      totalBytes += (m.size || 0)
      const places = this.getModelPlacements(m)
      if (places.length > 0) activeCount++
      else vacantCount++
    })

    const totalEl = this.container.querySelector('#libStatTotal')
    const activeEl = this.container.querySelector('#libStatActive')
    const sizeEl = this.container.querySelector('#libStatSize')
    const vacantEl = this.container.querySelector('#libStatVacant')

    if (totalEl) totalEl.textContent = this.uploadedModels.length
    if (activeEl) activeEl.textContent = `${activeCount} Model`
    if (sizeEl) sizeEl.textContent = totalBytes > 1024 * 1024 ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(totalBytes / 1024)} KB`
    if (vacantEl) vacantEl.textContent = `${vacantCount} Standby`

    this.renderLibraryGrid()
  }

  renderLibraryGrid() {
    const grid = this.container.querySelector('#libAssetGrid')
    if (!grid) return
    grid.innerHTML = ''

    const search = (this.librarySearch || '').toLowerCase().trim()
    const filter = this.libraryFilter || 'all'

    // If filtering by 3D AI Studio ecosystem models
    if (filter === 'ai_studio') {
      const ecoFiltered = this.ecosystemAssets.filter(m => {
        const name = (m.filename || '').toLowerCase()
        if (search && !name.includes(search)) return false
        return true
      })

      if (ecoFiltered.length === 0) {
        grid.innerHTML = `
          <div class="lib-empty-state">
            <div class="empty-state-icon">🌐</div>
            <div class="empty-state-title">Tidak Ada Model Ekosistem Ditemukan</div>
            <div class="empty-state-desc">Pastikan folder AUDIRA-3D-AI-Studio tersedia di komputer Anda atau klik Pindai Ulang.</div>
            <button type="button" class="btn btn-secondary btn-sm" id="btnRetryEcoScan">
              <span>🔄 Pindai Ulang 3D AI Studio</span>
            </button>
          </div>
        `
        grid.querySelector('#btnRetryEcoScan')?.addEventListener('click', () => this.scanEcosystem())
        return
      }

      ecoFiltered.forEach(m => {
        const sizeStr = m.size
          ? (m.size > 1024 * 1024 ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(m.size / 1024)} KB`)
          : 'Binary GLB'
        const isImported = m.isImported
        const card = document.createElement('div')
        card.className = `lib-asset-card ${isImported ? 'is-deployed' : ''}`
        card.innerHTML = `
          <div class="lib-card-header">
            <div class="lib-card-icon-box">
              <span class="lib-card-icon">${isImported ? '📦' : '🌐'}</span>
            </div>
            <div class="lib-card-title-box">
              <div class="lib-card-filename" title="${m.filename}">${m.filename}</div>
              <div class="lib-card-meta">
                <span class="lib-meta-pill">${sizeStr}</span>
                <span class="lib-meta-date" style="color: ${isImported ? '#10b981' : '#38bdf8'}; font-weight: 700;">${m.sourceType === 'local' ? 'Local Studio' : 'RTX 3060 Worker'}</span>
              </div>
            </div>
          </div>

          <div class="lib-card-placements">
            <div class="lib-placement-badge" style="border-color: ${isImported ? '#10b981' : '#fbbf24'}; color: ${isImported ? '#10b981' : '#fbbf24'}; background: ${isImported ? '#10b98115' : '#fbbf2415'};">
              ${isImported ? '✅ Terimpor di Studio' : '🌐 Tersedia di 3D AI Studio'}
            </div>
          </div>

          <div class="lib-card-actions">
            ${isImported ? `
              <button type="button" class="btn-lib-action btn-inspect" style="grid-column: span 2;" title="Inspeksi model 3D live">
                <span>👁️ Inspeksi</span>
              </button>
              <button type="button" class="btn-lib-action btn-deploy" style="grid-column: span 2;" title="Pasang model ke aula 3D">
                <span>🚀 Pasang</span>
              </button>
            ` : `
              <button type="button" class="btn-lib-action btn-import-eco" style="grid-column: span 4; background: linear-gradient(135deg, #0284c7, #2563eb); border-color: #38bdf8; color: #fff; font-weight: 700;" title="Impor model dari AUDIRA-3D-AI-Studio ke studio ini">
                <span>📥 Impor ke Studio Ini</span>
              </button>
            `}
          </div>
        `

        if (isImported) {
          card.querySelector('.btn-inspect')?.addEventListener('click', () => {
            this.currentSource = m.url
            this.currentFile = { name: m.filename, size: m.size }
            this.processAndDisplayModel(m.url, m.filename, m.size)
            this.switchTab('deploy')
          })
          card.querySelector('.btn-deploy')?.addEventListener('click', () => {
            this.currentSource = m.url
            this.currentFile = { name: m.filename, size: m.size }
            this.processAndDisplayModel(m.url, m.filename, m.size)
            this.switchTab('deploy')
          })
        } else {
          card.querySelector('.btn-import-eco')?.addEventListener('click', () => {
            this.importEcosystemAsset(m)
          })
        }

        grid.appendChild(card)
      })
      return
    }

    const filtered = this.uploadedModels.filter(m => {
      const name = (m.filename || '').toLowerCase()
      if (search && !name.includes(search)) return false

      const places = this.getModelPlacements(m)
      if (filter === 'conveyor') {
        return places.some(p => p.type === 'conveyor')
      } else if (filter === 'sector') {
        return places.some(p => p.type === 'sector')
      } else if (filter === 'agent') {
        return places.some(p => p.type === 'agent')
      } else if (filter === 'unassigned') {
        return places.length === 0
      }
      return true
    })

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div')
      emptyDiv.className = 'lib-empty-state'
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">${search ? 'Tidak ada model yang cocok dengan pencarian' : 'Belum Ada Model 3D Tersimpan'}</div>
        <div class="empty-state-desc">${search ? `Pencarian "${search}" tidak menemukan file .glb` : 'Unggah file 3D (.glb / .gltf) ke disk server untuk mulai mengelola & memajangnya di aula 3D.'}</div>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyUpload">
          <span>📤 Unggah File .glb Sekarang</span>
        </button>
      `
      const btnUpload = emptyDiv.querySelector('#btnEmptyUpload')
      if (btnUpload) {
        btnUpload.addEventListener('click', () => {
          const fileInput = this.container.querySelector('#assetFileInput')
          if (fileInput) fileInput.click()
        })
      }
      grid.appendChild(emptyDiv)
      return
    }

    filtered.forEach(m => {
      const places = this.getModelPlacements(m)
      const sizeStr = m.size
        ? (m.size > 1024 * 1024 ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(m.size / 1024)} KB`)
        : 'Binary GLB'

      const dateStr = m.mtime ? new Date(m.mtime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru Diunggah'

      const card = document.createElement('div')
      card.className = `lib-asset-card ${places.length > 0 ? 'is-deployed' : ''}`
      card.innerHTML = `
        <div class="lib-card-header">
          <div class="lib-card-icon-box">
            <span class="lib-card-icon">📦</span>
          </div>
          <div class="lib-card-title-box">
            <div class="lib-card-filename" title="${m.filename}">${m.filename}</div>
            <div class="lib-card-meta">
              <span class="lib-meta-pill">${sizeStr}</span>
              <span class="lib-meta-date">${dateStr}</span>
            </div>
          </div>
        </div>

        <div class="lib-card-placements">
          ${places.length > 0 ? places.map(p => `
            <div class="lib-placement-badge" style="border-color: ${p.color}; color: ${p.color}; background: ${p.color}15;">
              ${p.label}
            </div>
          `).join('') : `
            <div class="lib-placement-badge standby">
              📦 Standby di Disk Server
            </div>
          `}
        </div>

        <div class="lib-card-actions">
          <button type="button" class="btn-lib-action btn-inspect" title="Inspeksi model 3D live, periksa wireframe & animasi">
            <span>👁️ Inspeksi</span>
          </button>
          <button type="button" class="btn-lib-action btn-deploy" title="Pasang model ini ke Conveyor Runway, Sektor, atau Skin Operator">
            <span>🚀 Pasang</span>
          </button>
          <button type="button" class="btn-lib-action btn-dl" title="Unduh file .glb ke komputer">
            <span>⬇️</span>
          </button>
          <button type="button" class="btn-lib-action btn-del" title="Hapus file ini permanen dari disk server">
            <span>🗑️</span>
          </button>
        </div>
      `

      // Inspect click
      card.querySelector('.btn-inspect')?.addEventListener('click', () => {
        this.currentSource = m.url
        this.currentFile = { name: m.filename, size: m.size }
        this.processAndDisplayModel(m.url, m.filename, m.size)
        this.switchTab('deploy')
      })

      // Deploy click
      card.querySelector('.btn-deploy')?.addEventListener('click', () => {
        this.currentSource = m.url
        this.currentFile = { name: m.filename, size: m.size }
        this.processAndDisplayModel(m.url, m.filename, m.size)
        this.switchTab('deploy')
      })

      // Download click
      card.querySelector('.btn-dl')?.addEventListener('click', () => {
        this.downloadModel(m)
      })

      // Delete click
      card.querySelector('.btn-del')?.addEventListener('click', () => {
        this.deleteModel(m)
      })

      grid.appendChild(card)
    })
  }

  downloadModel(model) {
    const a = document.createElement('a')
    a.href = model.url
    a.download = model.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async deleteModel(model) {
    const placements = this.getModelPlacements(model)
    let warning = `Yakin ingin menghapus permanen file 3D "${model.filename}" dari disk server?`
    if (placements.length > 0) {
      const placesStr = placements.map(p => p.label).join(', ')
      warning += `\n\n⚠️ PERHATIAN: Model ini sedang dipajang di:\n${placesStr}\n\nMenghapus file ini akan otomatis mengosongkan pajangan tersebut dari aula 3D!`
    }

    if (!confirm(warning)) return

    try {
      const res = await fetch(`/api/delete-model?filename=${encodeURIComponent(model.filename)}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        // Unmount locally if present
        placements.forEach(p => {
          if (p.type === 'conveyor' && this.engine3D?.clearConveyorPod) {
            this.engine3D.clearConveyorPod(p.slotIndex)
          } else if (p.type === 'sector' && this.engine3D?.clearSector) {
            this.engine3D.clearSector(p.sectorId)
          }
        })

        await this.refreshShowcaseManager()
        await this.refreshStoredModels()
        await this.refreshLibrary()
        try { audio.playGlbSuccess?.() } catch (e) {}
      } else {
        alert(`Gagal menghapus model: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('[AssetManagerModal] Delete error:', err)
      alert(`Gagal menghapus file: ${err.message}`)
    }
  }

  renderConveyorSlotPicker() {
    const grid = this.container.querySelector('#conveyorSlotsPickerGrid')
    if (!grid) return
    grid.innerHTML = ''

    const conveyorState = this.cachedShowcaseState?.conveyor || {}

    CONVEYOR_SLOT_CONFIGS.forEach((cfg) => {
      const i = cfg.index
      const podData = conveyorState[i]
      const isOccupied = !!(podData && podData.modelUrl)
      const isSelected = this.selectedSlotIndex === i
      const modelName = podData?.fileName || podData?.title || 'Standby Pod'

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `slot-card-btn ${isSelected ? 'active' : ''} ${isOccupied ? 'occupied' : 'vacant'}`
      btn.setAttribute('data-slot', String(i))
      btn.setAttribute('title', isOccupied ? `${cfg.name}: Terisi (${modelName})` : `${cfg.name}: Standby (Kosong)`)
      btn.style.setProperty('--slot-accent', cfg.color)

      btn.innerHTML = `
        <div class="slot-card-header">
          <span class="slot-card-badge" style="border-color: ${cfg.color}; color: ${cfg.color}; background: ${cfg.color}18;">${cfg.name}</span>
          <span class="slot-card-mark">${isSelected ? '●' : '○'}</span>
        </div>
        <div class="slot-card-body">
          <span class="slot-card-icon">${isOccupied ? '📦' : '✦'}</span>
          <div class="slot-card-meta">
            <span class="slot-card-label" title="${isOccupied ? modelName : 'Siap Dipasang'}">${isOccupied ? modelName : 'Standby Pod'}</span>
            <span class="slot-card-sub ${isOccupied ? 'occ' : 'vac'}">${isOccupied ? '● Terisi' : '○ Kosong'}</span>
          </div>
        </div>
      `

      btn.addEventListener('click', (e) => {
        e.preventDefault()
        this.selectConveyorSlot(i)
      })

      grid.appendChild(btn)
    })
  }

  selectConveyorSlot(index) {
    this.selectedSlotIndex = index
    const cfg = CONVEYOR_SLOT_CONFIGS[index] || CONVEYOR_SLOT_CONFIGS[0]

    // Sync select input
    const select = this.container.querySelector('#selectConveyorPodDirect')
    if (select) select.value = String(index)

    // Update active class on grid buttons
    const btns = this.container.querySelectorAll('.slot-card-btn')
    btns.forEach((b) => {
      const s = parseInt(b.getAttribute('data-slot') || '-1', 10)
      if (s === index) {
        b.classList.add('active')
        const mark = b.querySelector('.slot-card-mark')
        if (mark) mark.textContent = '●'
      } else {
        b.classList.remove('active')
        const mark = b.querySelector('.slot-card-mark')
        if (mark) mark.textContent = '○'
      }
    })

    // Update Banner Info
    const indicator = this.container.querySelector('#slotSelectedIndicator')
    const pill = this.container.querySelector('#slotSelectedPill')
    const desc = this.container.querySelector('#slotSelectedDesc')
    const btnDeploy = this.container.querySelector('#btnExecuteDeploy')

    if (indicator) {
      indicator.textContent = cfg.name
      indicator.style.color = cfg.color
    }

    const podData = this.cachedShowcaseState?.conveyor?.[index]
    const isOccupied = !!(podData && podData.modelUrl)
    const modelName = podData?.fileName || podData?.title || 'Model Aktif'

    if (pill) {
      if (isOccupied) {
        pill.className = 'slot-status-pill occupied'
        pill.innerHTML = '⚠️ TERISI MODEL'
        pill.style.background = 'rgba(245, 158, 11, 0.2)'
        pill.style.borderColor = '#fbbf24'
        pill.style.color = '#fbbf24'
      } else {
        pill.className = 'slot-status-pill vacant'
        pill.innerHTML = '🟢 STANDBY (KOSONG)'
        pill.style.background = 'rgba(16, 185, 129, 0.2)'
        pill.style.borderColor = '#10b981'
        pill.style.color = '#10b981'
      }
    }

    if (desc) {
      if (isOccupied) {
        desc.innerHTML = `Perhatian: Slot ini saat ini memajang <strong>${modelName}</strong>. Memasang model baru akan menimpa slot ini.`
      } else {
        desc.textContent = `Slot turntable ${cfg.name} dalam status standby reticle & siap menampung model 3D baru.`
      }
    }

    // Update deploy button label if conveyor mode active
    const isConveyorActive = this.container.querySelector('input[name="deployTarget"][value="conveyor"]')?.checked
    if (isConveyorActive && btnDeploy) {
      btnDeploy.innerHTML = `🏃‍♂️ PAJANG DI RUNWAY (${cfg.name})`
    }

    try {
      if (audio.playBlip) audio.playBlip()
    } catch (e) {}
  }

  updateConveyorSlotPicker(state) {
    this.cachedShowcaseState = state || {}
    this.renderConveyorSlotPicker()

    // Update count badge
    const badge = this.container.querySelector('#slotPickerCountBadge')
    if (badge) {
      const conveyor = this.cachedShowcaseState?.conveyor || {}
      let occupiedCount = 0
      for (let i = 0; i < 8; i++) {
        if (conveyor[i]?.modelUrl) occupiedCount++
      }
      const vacantCount = 8 - occupiedCount
      badge.textContent = `${vacantCount} KOSONG / ${occupiedCount} TERISI`
      if (vacantCount === 8) {
        badge.style.color = '#10b981'
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)'
      } else if (vacantCount === 0) {
        badge.style.color = '#f43f5e'
        badge.style.borderColor = 'rgba(244, 63, 94, 0.4)'
      } else {
        badge.style.color = '#38bdf8'
        badge.style.borderColor = 'rgba(56, 189, 248, 0.4)'
      }
    }

    this.selectConveyorSlot(this.selectedSlotIndex)
  }

  async refreshShowcaseManager() {
    const list = this.container.querySelector('#activeShowcaseList')
    if (!list) return
    list.innerHTML = '<span class="stored-empty-hint">Memuat status pameran...</span>'

    const state = await this.fetchShowcaseState() || {}
    this.updateConveyorSlotPicker(state)
    list.innerHTML = ''

    // Conveyor Pods 01 to 08
    const conveyorState = state.conveyor || {}
    for (let i = 0; i < 8; i++) {
      const cfg = CONVEYOR_SLOT_CONFIGS[i] || { name: `SLOT 0${i + 1}`, color: '#38bdf8' }
      const podData = conveyorState[i]
      const isOccupied = !!(podData && podData.modelUrl)
      const item = document.createElement('div')
      item.className = 'showcase-pod-item'
      item.innerHTML = `
        <div class="showcase-pod-info">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="showcase-slot-pill" style="border: 1px solid ${cfg.color}55; color: ${cfg.color}; background: ${cfg.color}15; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 3px; font-family: var(--font-mono, monospace);">${cfg.name}</span>
            <span class="showcase-pod-title">Catwalk Runway</span>
          </div>
          <span class="showcase-pod-status ${isOccupied ? 'occupied' : ''}">
            ${isOccupied ? `✦ ${podData.fileName || podData.title || 'Model Aktif'}` : '[ Standby Reticle ]'}
          </span>
        </div>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button type="button" class="btn-select-slot-item" data-pod="${i}" title="Pilih ${cfg.name} untuk dipajang">🎯 Pilih</button>
          ${isOccupied ? `<button type="button" class="btn-reset-item" data-pod="${i}" title="Kosongkan ${cfg.name}">✕ Reset</button>` : ''}
        </div>
      `
      const btnSelect = item.querySelector('.btn-select-slot-item')
      if (btnSelect) {
        btnSelect.addEventListener('click', (e) => {
          e.stopPropagation()
          const tabConveyor = this.container.querySelector('#tabDeployConveyor')
          if (tabConveyor) tabConveyor.click()
          this.selectConveyorSlot(i)
        })
      }
      if (isOccupied) {
        const btn = item.querySelector('.btn-reset-item')
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.clearConveyorPod(i)
          })
        }
      }
      list.appendChild(item)
    }

    // Sectors
    const sectorLabels = {
      mecha: 'Sektor 02 // Mecha Bay',
      weapon: 'Sektor 01 // Arsenal Senjata',
      drone: 'Sektor 04 // Drone Hangar',
      quantum: 'Sektor 05 // Quantum Core'
    }
    const sectorsState = state.sectors || {}
    for (const [secId, label] of Object.entries(sectorLabels)) {
      const secData = sectorsState[secId]
      const isOccupied = !!(secData && secData.modelUrl)
      const item = document.createElement('div')
      item.className = 'showcase-pod-item'
      item.innerHTML = `
        <div class="showcase-pod-info">
          <span class="showcase-pod-title">${label}</span>
          <span class="showcase-pod-status ${isOccupied ? 'occupied' : ''}">
            ${isOccupied ? `✦ ${secData.fileName || 'Model Aktif'}` : '[ Standby ]'}
          </span>
        </div>
        ${isOccupied ? `<button type="button" class="btn-reset-item" data-sector="${secId}" title="Kosongkan sektor ini">✕ Reset</button>` : ''}
      `
      if (isOccupied) {
        const btn = item.querySelector('.btn-reset-item')
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.clearSector(secId)
          })
        }
      }
      list.appendChild(item)
    }
  }

  async clearConveyorPod(index) {
    if (this.engine3D?.clearConveyorPod) {
      this.engine3D.clearConveyorPod(index)
    }
    const endpoints = ['/api/clear-showcase', 'http://localhost:8080/api/clear-showcase']
    for (const ep of endpoints) {
      try {
        await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'conveyor', id: index })
        })
      } catch (e) {}
    }
    try {
      const cur = JSON.parse(localStorage.getItem('audira_showcase_state_v2') || '{}')
      if (cur.conveyor) delete cur.conveyor[index]
      localStorage.setItem('audira_showcase_state_v2', JSON.stringify(cur))
      this.onShowcaseUpdated(cur)
    } catch (e) {}
    this.refreshShowcaseManager()
  }

  async clearSector(sectorId) {
    if (this.engine3D?.clearSector) {
      this.engine3D.clearSector(sectorId)
    }
    const endpoints = ['/api/clear-showcase', 'http://localhost:8080/api/clear-showcase']
    for (const ep of endpoints) {
      try {
        await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'sector', id: sectorId })
        })
      } catch (e) {}
    }
    try {
      const cur = JSON.parse(localStorage.getItem('audira_showcase_state_v2') || '{}')
      if (cur.sectors) delete cur.sectors[sectorId]
      localStorage.setItem('audira_showcase_state_v2', JSON.stringify(cur))
      this.onShowcaseUpdated(cur)
    } catch (e) {}
    this.refreshShowcaseManager()
  }

  async clearAllConveyor() {
    if (!confirm('Kosongkan semua model pada catwalk conveyor 56m kembali ke standby reticle?')) return
    for (let i = 0; i < 8; i++) {
      if (this.engine3D?.clearConveyorPod) {
        this.engine3D.clearConveyorPod(i)
      }
    }
    const endpoints = ['/api/clear-showcase', 'http://localhost:8080/api/clear-showcase']
    for (const ep of endpoints) {
      try {
        await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        })
      } catch (e) {}
    }
    try {
      const cur = JSON.parse(localStorage.getItem('audira_showcase_state_v2') || '{}')
      cur.conveyor = {}
      localStorage.setItem('audira_showcase_state_v2', JSON.stringify(cur))
      this.onShowcaseUpdated(cur)
    } catch (e) {}
    this.refreshShowcaseManager()
  }

  async executeDeployment() {
    if (!this.currentSource && !this.loadedModel) {
      alert('Pilih atau upload file 3D .glb terlebih dahulu!')
      return
    }

    const deployType = this.container.querySelector('input[name="deployTarget"]:checked')?.value || 'conveyor'
    const btnDeploy = this.container.querySelector('#btnExecuteDeploy')
    const originalText = btnDeploy?.innerHTML || ''

    try {
      let finalSource = this.currentSource
      let finalFileName = this.currentFile?.name || 'Custom Model'

      // 1. If user loaded a local File object, upload to persistent server storage on disk!
      if (this.currentFile instanceof File || (this.currentSource && typeof this.currentSource !== 'string')) {
        if (btnDeploy) {
          btnDeploy.disabled = true
          btnDeploy.innerHTML = '⏳ MENGUNGGAH KE DISK SERVER (public/models/uploads/)...'
        }
        const fileToUpload = this.currentFile instanceof File ? this.currentFile : this.currentSource
        const uploadResult = await this.uploadModelFile(fileToUpload)
        finalSource = uploadResult.url
        finalFileName = uploadResult.filename || fileToUpload.name
        this.currentSource = finalSource
      }

      if (btnDeploy) {
        btnDeploy.innerHTML = '⚙️ MEMASANG ASSET KE DUNIA 3D...'
      }

      if (deployType === 'agent') {
        const agentName = this.container.querySelector('#selectDeployAgent')?.value
        const locomotion = this.container.querySelector('#selectLocomotionMode')?.value || 'mecha_stride'
        const agent = this.registry.getAll().find(a => a.name === agentName)

        if (agent && this.engine3D) {
          const success = await this.engine3D.loadAgentGLB(agent.name, finalSource)
          if (success) {
            agent.modelUrl = finalSource
            agent.modelName = finalFileName
            agent.locomotionMode = locomotion
            this.registry.saveCustomAgents()
            this.engine3D.setAgentLocomotion(agent.name, locomotion)
            this.engine3D.followAgent(agent.id)
            this.engine3D.speakAgent(agent.name, `Model 3D ${finalFileName} berhasil dipasang ke sistem saya!`)

            await this.saveShowcaseState({
              agentSkins: {
                [agent.name]: {
                  modelUrl: finalSource,
                  modelName: finalFileName,
                  locomotion,
                  timestamp: Date.now()
                }
              }
            })

            this.onDeployAsset({
              type: 'agent',
              agent,
              fileName: finalFileName,
            })
            this.close()
          }
        }
      } else if (deployType === 'conveyor') {
        const podIndex = this.selectedSlotIndex ?? parseInt(this.container.querySelector('#selectConveyorPodDirect')?.value || '0', 10)
        const slotCfg = CONVEYOR_SLOT_CONFIGS[podIndex] || { name: `SLOT 0${podIndex + 1}` }
        const title = finalFileName.replace(/\.[^/.]+$/, '').toUpperCase()
        const displayTitle = `✦ [ ${slotCfg.name} ] ${title}`

        const targetHeight = this.selectedTargetHeight || 3.0

        if (this.engine3D && this.engine3D.loadConveyorGLB) {
          await this.engine3D.loadConveyorGLB(
            podIndex,
            finalSource,
            displayTitle,
            '[ LIVE USER ASSET ]',
            targetHeight,
            this.currentClipName || null,
            this.animationSpeed || 1.0,
            this.currentShadingMode || 'pbr'
          )
        }

        await this.saveShowcaseState({
          conveyor: {
            [podIndex]: {
              modelUrl: finalSource,
              fileName: finalFileName,
              title: displayTitle,
              sub: '[ LIVE USER ASSET ]',
              slotNum: slotCfg.name,
              targetHeight,
              clipName: this.currentClipName || null,
              animSpeed: this.animationSpeed || 1.0,
              shadingMode: this.currentShadingMode || 'pbr',
              timestamp: Date.now()
            }
          }
        })

        // Focus camera on the moving conveyor runway in front of Video Wall
        if (this.engine3D?.flyToSector) {
          this.engine3D.flyToSector('conveyor_runway')
        } else if (this.engine3D?.scene?.camera && this.engine3D?.scene?.controls) {
          this.engine3D.scene.camera.position.set(0, 5, -11)
          this.engine3D.scene.controls.target.set(0, 1.8, -19.8)
          this.engine3D.scene.controls.update()
        }

        this.onDeployAsset({
          type: 'conveyor',
          podIndex,
          slotName: slotCfg.name,
          fileName: finalFileName,
        })
        await this.refreshShowcaseManager()
        this.close()
      } else {
        // deployType === 'sector'
        const sectorId = this.container.querySelector('#selectDeploySector')?.value || 'mecha'
        const targetHeight = this.selectedTargetHeight || (sectorId === 'mecha' ? 4.2 : 2.8)

        if (this.engine3D && this.engine3D.mountSectorGLB) {
          await this.engine3D.mountSectorGLB(sectorId, finalSource, targetHeight)
        }

        await this.saveShowcaseState({
          sectors: {
            [sectorId]: {
              modelUrl: finalSource,
              fileName: finalFileName,
              targetHeight,
              timestamp: Date.now()
            }
          }
        })

        // Smoothly adjust camera to the sector showroom spot
        if (this.engine3D?.flyToSector) {
          const map = { mecha: 'sector_mecha', weapon: 'sector_arsenal', drone: 'sector_drone', quantum: 'sector_quantum' }
          if (map[sectorId]) this.engine3D.flyToSector(map[sectorId])
        }

        this.onDeployAsset({
          type: 'sector',
          sector: sectorId,
          fileName: finalFileName,
        })
        this.close()
      }
    } catch (err) {
      console.error('[AssetManagerModal] Deployment failed:', err)
      alert(`Gagal menyimpan dan memasang model 3D: ${err.message}`)
    } finally {
      if (btnDeploy) {
        btnDeploy.disabled = false
        btnDeploy.innerHTML = originalText
      }
    }
  }

  open(initialTab = 'library', targetOptions = {}) {
    this.isOpen = true
    const overlay = this.container.querySelector('#assetModalOverlay')
    if (overlay) overlay.style.display = 'flex'

    // Refresh agent dropdown list
    const select = this.container.querySelector('#selectDeployAgent')
    if (select) {
      select.innerHTML = this.registry.getAll().map(a => `
        <option value="${a.name}">${a.name} (${a.role})</option>
      `).join('')
    }

    if (typeof targetOptions.slotIndex === 'number') {
      this.selectedSlotIndex = targetOptions.slotIndex
    }

    this.renderConveyorSlotPicker()
    this.selectConveyorSlot(this.selectedSlotIndex)
    this.refreshStoredModels()
    this.refreshShowcaseManager()
    this.switchTab(initialTab)

    // Handle targetOptions for direct deployment pre-selection
    if (targetOptions.deployTarget) {
      const radio = this.container.querySelector(`input[name="deployTarget"][value="${targetOptions.deployTarget}"]`)
      if (radio) {
        radio.checked = true
        radio.dispatchEvent(new Event('change'))
      }
    }
    if (targetOptions.sectorId) {
      const sectorRadio = this.container.querySelector(`input[name="sectorTarget"][value="${targetOptions.sectorId}"]`)
      if (sectorRadio) {
        sectorRadio.checked = true
      }
    }
  }

  close() {
    this.isOpen = false
    const overlay = this.container.querySelector('#assetModalOverlay')
    if (overlay) overlay.style.display = 'none'
    this.stopPreviewLoop()
  }

  startPreviewLoop() {
    let lastTime = performance.now()
    const loop = (time) => {
      if (!this.isOpen) return
      const dt = (time - lastTime) / 1000
      lastTime = time

      // Turntable auto-rotate
      if (this.previewGroup && !this.isDragging && this.isAutoRotateTurntable) {
        this.previewGroup.rotation.y += dt * 0.45
      }

      // Procedural floating / hover for static models
      if (this.isProceduralBobbing && this.loadedModel?.root) {
        this.loadedModel.root.position.y = 0.125 + Math.sin(time * 0.003) * 0.05
      }

      // Skeletal animation mixer update
      if (this.previewMixer && this.isPlayingAnimation) {
        this.previewMixer.update(dt * (this.animationSpeed || 1.0))

        // Scrub slider and time indicator sync
        if (this.activeAction && this.activeClip && !this.isScrubbing) {
          const dur = this.activeClip.duration || 1.0
          const curTime = (this.activeAction.time % dur)
          const slider = this.container.querySelector('#animScrubSlider')
          const timeCur = this.container.querySelector('#animTimeCurrent')
          if (slider) slider.value = ((curTime / dur) * 100).toFixed(1)
          if (timeCur) timeCur.textContent = `${curTime.toFixed(2)}s`
        }
      }

      if (this.previewRenderer && this.previewScene && this.previewCamera) {
        if (this.previewLookAtTarget) {
          this.previewCamera.lookAt(this.previewLookAtTarget)
        }
        this.previewRenderer.render(this.previewScene, this.previewCamera)
      }

      this.previewAnimFrame = requestAnimationFrame(loop)
    }
    this.previewAnimFrame = requestAnimationFrame(loop)
  }

  stopPreviewLoop() {
    if (this.previewAnimFrame) {
      cancelAnimationFrame(this.previewAnimFrame)
      this.previewAnimFrame = null
    }
  }
}

function dimsFormat(n) {
  return `${Math.abs(n).toFixed(2)}m`
}
