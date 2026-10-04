# ARCHITECTURE - AUDIRA-AGENT (3D AI Game Studio & Cyber Asset Command Center)

> Dokumen Arsitektur Teknis Sistem 3D AI Game Studio, GLB Asset Runway & Autonomous AI Fleet.
> **Version:** v2.5.0-studio  
> **Last Updated:** 2026-10-04  

---

## 1. System Overview

AUDIRA-AGENT mengimplementasikan arsitektur **3D Spatial Simulation + Real-time Reactive HUD + Multi-Tier Real AI Engine + Persistent GLB Asset Pipeline**. Sistem memvisualisasikan game development studio masa depan dalam bentuk ruang aula 3D Three.js berukuran 68m x 52m, catwalk runway conveyor 56m 8-slot, 6 sektor cyber studio, dan armada AI game developer otonom.

```
+--------------------------------------------------------------------------+
|                            USER INTERFACE (BROWSER)                      |
|                                                                          |
|  +--------------------+  +--------------------------------------------+  |
|  |   SidebarNav.js    |  |               ControlBar.js                |  |
|  | (Studio Navigation)|  |        (Studio Telemetry & Runway Status)  |  |
|  +--------------------+  +--------------------------------------------+  |
|            |                                    |                        |
|            v                                    v                        |
|  +--------------------------------------------------------------------+  |
|  |                       AudiraOffice3D.js                            |  |
|  |  +--------------------------------------------------------------+  |  |
|  |  |                     Three.js Scene Core                      |  |  |
|  |  |  - WebGLRenderer (PBR Lighting, Shadows, Grand Hall 68mx52m) |  |  |
|  |  |  - AssetShowcaseConveyor (56m Catwalk Runway, 8 Pod Slots)   |  |  |
|  |  |  - StudioSectors (6 Partitioned Cyber R&D & Workshop Rooms)  |  |  |
|  |  |  - 3D Spatial Raycaster (1-Click Picking for Pods & Sectors) |  |  |
|  |  |  - CSS2DRenderer (Spatial Agent Labels & Speech Bubbles)     |  |  |
|  |  |  - Master 9-Screen Dynamic Canvas Production Wall            |  |  |
|  |  |  - SD Gundam Rigged Avatars, Workstations, Mecha Turntables  |  |  |
|  |  +--------------------------------------------------------------+  |  |
|  +--------------------------------------------------------------------+  |
|            |                                    |                        |
|  +--------------------+              +---------------------+             |
|  |  TerminalLog.js    |              | AgentInspector.js   |             |
|  | (Studio Event Log) |              | (Selected Dev & AI) |             |
|  +--------------------+              +---------------------+             |
+--------------------------------------------------------------------------+
             ^                                    ^
             | (WebSocket Client: AgentBridge.js) |
             v                                    v
+--------------------------------------------------------------------------+
|                  TELEMETRY & ASSET SERVER (server.js)                    |
|       Node.js WebSocket & HTTP REST Server on Port 8080                  |
|  - Multi-Tier AI Engine (Gemini 2.0 Flash + Local Ollama LLM)            |
|  - Real Host OS Hardware Telemetry (AMD Ryzen 5700X, 64GB RAM)           |
|  - Persistent 3D Asset Storage (public/models/uploads & state.json)      |
+--------------------------------------------------------------------------+
             ^                                    ^
             | (Port 8005)                        | (Port 11434)
             v                                    v
+-----------------------------+      +-------------------------------------+
| AUDIRA-3D-AI-STUDIO WORKER  |      |         LOCAL OLLAMA AI CORE        |
| RTX 3060 CUDA (TripoSR 3D)  |      |   (qwen3:8b, deepseek-r1:8b, etc.)  |
+-----------------------------+      +-------------------------------------+
```

---

## 2. Architecture Layers

### 1. Presentation Layer (Spatial 3D & HUD)
- **WebGL Rendering Core (`src/engine/3d/scene.ts`)**: Mengelola scene graph Three.js, kamera perspektif, OrbitControls pan/zoom, sistem tata cahaya multi-sumber (malam cyberpunk, senja golden hour, siang studio terik), dan shadow mapping.
- **Catwalk Runway 56m 8-Slot (`src/engine/3d/AssetShowcaseConveyor.ts`)**: Conveyor catwalk 56m dengan 8 pod pameran bergerak dan turntable auto-rotation untuk model .GLB.
- **3D Spatial Raycasting (`src/engine/3d/scene.ts` & `src/main.js`)**: Raycasting presisi pada Pod Runway 01-08 dan plinth sektor studio untuk inspeksi dan penempatan instan aset 3D.
- **Master Production Wall (`src/engine/3d/DynamicVideoWallTexture.js`)**: Tekstur kanvas 9-layar resolusi tinggi (1024x512) yang diperbarui dinamis dengan performa 60 FPS, netcode 64Hz, pipeline aset, dan arahan studio.
- **HUD Glassmorphism (`src/ui/`)**: Komponen modular Vanilla JavaScript (SidebarNav, ControlBar, AgentInspector, TerminalLog, TaskBar, AddAgentModal, AssetManagerModal, NocVideoWallModal) dengan efek `backdrop-filter: blur(12px)`.

### 2. Domain & Fleet Orchestration Layer
- **`AgentRegistry.js`**: Pusat data seluruh armada AI game dev. Mengelola status aktif, level stamina, pemetaan deskIndex meja kerja, dan sinkronisasi persisten `localStorage`.
- **`MultiAgentWorkflow.js`**: State machine untuk simulasi sprint milestone game dev (Graphics Optimization, Netcode Jitter Mitigation, Asset Runway Staging, Audio Stem Mixing, Alpha Normalisasi).
- **`AIReasoningEngine.js`**: Mesin penalaran kognitif multi-tier (Gemini 2.0 Flash + Local Ollama LLM + Domain Fallback Game Dev) untuk 1-on-1 Comm-Link chat dan automated task directive dispatching.

### 3. Audio Synthesis Layer
- **`AudioManager.js`**: Generator audio sintetis prosedural menggunakan Web Audio API murni. Menghasilkan akord Lo-Fi polifonik multi-stems, bunyi switch keyboard mekanikal saat avatar mengetik, dan efek suara UI/sprint tanpa mengunduh file media berat.

### 4. Communication & Real-time Layer
- **`AgentBridge.js`**: Klien WebSocket dengan fitur *auto-reconnect* yang menghubungkan browser dengan server telemetri di `ws://localhost:8080`.
- **`server.js`**: Server WebSocket & REST API Node.js untuk live telemetri host OS, multi-service ecosystem health check, multi-tier AI inference, dan persistent 3D GLB model upload.

---

## 3. Directory Structure

```text
src/
  ├── agents/            # Registry data, alur kerja skenario insiden
  ├── engine/            # Core grafis 3D Three.js dan sintesis audio prosedural
  │   └── 3d/            # Mesh builder, tata letak spasial, avatar rig, video wall
  ├── network/           # Klien WebSocket bridge
  ├── ui/                # Komponen HUD antarmuka pengguna
  ├── utils/             # Konstanta global, konfigurasi peran, skema data
  ├── main.js            # Inisialisasi aplikasi dan event bus
  └── style.css          # Desain sistem global dan token CSS
```

---

## 4. Data Models & Entity Schemas

### Agent Entity Schema
```typescript
interface Agent {
  id: string;               // Unik identifier (contoh: "audira_voltis")
  name: string;             // Codename (contoh: "VOLTIS")
  role: string;             // Kode divisi (contoh: "ASSET_3D")
  displayName: string;      // Label lengkap (contoh: "VOLTIS (3D ASSETS)")
  deskIndex: number;        // Nomor meja kerja (0 - 7)
  status: 'working' | 'idle' | 'meeting' | 'review' | 'alert';
  roleConfig: {
    title: string;          // Jabatan resmi game studio
    badge: string;          // Emoji + Kode peran
    color: string;          // Warna HEX identitas
    desk: string;           // Nama stasiun kerja
    tools: string;          // Software 3D & game engine tools yang digunakan
    responsibilities: string[]; // Tanggung jawab divisi studio game
  };
  currentTask: string;      // Mandat operasional sprint yang sedang berjalan
  thoughts: string;         // Inner monologue / penalaran kognitif agen
  stamina: number;          // 0 - 100
  sla: number;              // 0 - 100%
  custom?: boolean;         // True jika hasil onboarding AddAgentModal
}
```

---

## 5. Key Design Decisions

1. **Kenapa Three.js murni dan bukan React-Three-Fiber?**
   - Performa optimal tanpa overhead virtual DOM reconciler, memungkinkan rendering 60 FPS stabil pada adegan 3D yang memiliki ratusan elemen spasial, 8-slot moving conveyor, dan puluhan avatar.
2. **Kenapa Web Audio Prosedural dan bukan file MP3?**
   - Zero-asset dependency: Aplikasi tidak memerlukan unduhan file audio berukuran besar, tidak ada resiko broken links aset suara, dan parameter bunyi dapat dimodifikasi langsung secara matematis saat runtime.
3. **Kenapa CSS2DRenderer untuk Label 3D?**
   - Memberikan teks tajam beresolusi vektor alami pada label avatar di atas canvas 3D tanpa penurunan kualitas seperti tekstur canvas 2D bitmap.
4. **Kenapa Persistent GLB Showcase Pipeline?**
   - Memungkinkan developer mengupload model 3D `.glb` sendiri secara langsung, otomatis dinormalisasi bounding box-nya, dan di-stage permanen ke slot runway pilihan.

---

## 6. Constraints & Safety Rules (WAJIB DIPATUHI)

1. **Murni 3D AI Game Studio**: DILARANG KERAS memunculkan kembali istilah datacenter seperti HVAC, PUE, Cold Aisle, atau trafo 20kV.
2. **No Canvas Retro Overlays**: Dilarang memasang elemen kartu HTML retro yang menutupi bidang pandang 3D atau Master Production Wall.
3. **Catwalk Runway Slot Protection**: Runway berkapasitas 8 slot (`slotIndex 0-7`). Raycasting dan upload pipeline wajib memvalidasi ketersediaan pod.
4. **Desk Index Boundary**: Meja kerja berkapasitas 8 slot (`deskIndex 0-7`). Jika operator bertambah lebih dari 8, agen berlebih dialokasikan ke zona kolaborasi secara rotasional.
5. **Persistensi Safe-Parsing**: Pengambilan data dari `localStorage` dan disk server harus selalu dibungkus blok `try-catch` dengan fallback aman jika data korup.
