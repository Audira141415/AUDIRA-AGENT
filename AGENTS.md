# AGENTS.md - AUDIRA-AGENT (3D AI Game Studio & Cyber Asset Command Center)

> System Prompt & Panduan Tata Kelola Permanen untuk AI Assistant & Developer.
> Mengatur standar kode, arsitektur 3D Three.js, manajemen armada AI Game Developer, pipeline asset 3D .GLB, dan batas operasional sistem.

---

## 0. Mandatory AI Co-Pilot & Assistant Directives (WAJIB DIPATUHI)

> **PERINGATAN UNTUK SEMUA AI AGENTS & GITHUB COPILOT:**
> File ini (`AGENTS.md`) bersama seluruh dokumen di dalam folder `.agents/` adalah **Single Source of Truth** untuk proyek AUDIRA-AGENT.
> 
> 1. **Proyek Ini Adalah 3D AI Game Dev Studio & Asset Runway**: Proyek ini BUKAN proyek datacenter/NOC fasilitas pendingin. Dilarang keras memunculkan kembali istilah datacenter seperti HVAC, PUE, Cold Aisle, atau trafo 20kV.
> 2. **Selalu Baca Dokumen Ini**: Setiap kali Co-Pilot / AI Assistant mengusulkan kode, refactoring, atau membuat file baru, Anda **WAJIB** membaca dan mematuhi batasan di file ini dan `.agents/`.
> 3. **Dilarang Menghapus Fitur / Aturan Eksis**: Jangan pernah menghapus konfigurasi, agen bawaan, atau aturan yang sudah ada. Lakukan **enhancement** (penyempurnaan bertahap) tanpa memutus alur yang sudah berjalan.
> 4. **Pertahankan 100% 3D Three.js**: Jangan pernah menambahkan canvas retro 2D atau kartu overlay HTML yang menutupi Master Production Wall atau 3D Runway.
> 5. **Konsistensi Desain Studio**: Semua UI wajib berpadu dengan Dark Glassmorphism, palet warna HSL di `src/style.css`, dan Sidebar Navigasi Kiri.

---

## 1. Project Overview

- **Name** : AUDIRA-AGENT
- **Description** : Pusat Komando Virtual 3D Interaktif berbasis Three.js untuk Studio Game & Pipeline Asset 3D .GLB, terintegrasi dengan armada AI Game Developer otonom (Arthur, ROUTEX, CHRONOS, RESOLV, CIPHER, VOLTIS, dll), Catwalk Runway 56m 8-Slot, dan Master Production Wall 9-layar.
- **Goal** : Pusat kolaborasi visual spasial 3D untuk game engine production, inspeksi model .GLB di catwalk runway 8-slot, live netcode multiplayer, procedural Web Audio synthesizer, dan penalaran otonom agen LLM (Gemini & Ollama).
- **Target Users** : Game Producers, 3D Artists/Modelers, Technical Artists, Gameplay & Netcode Engineers, Audio Designers, dan Autonomous AI Game Developers.
- **Version** : v2.5.0-studio
- **Status** : Active Development & 3D Asset Production Mode

---

## 2. Tech Stack

- **3D Graphics Engine** : Three.js (r160+), CSS2DRenderer (Label & Balon Ucapan Spasial)
- **Frontend Core** : Modern JavaScript (ES2022+), TypeScript (untuk scene engine layout)
- **Bundler & Dev Server** : Vite 6
- **Styling** : Pure Vanilla CSS (Design System terpusat di `src/style.css`, Glassmorphism, HSL custom palette)
- **Audio Engine** : Web Audio API (Sintesis Prosedural Polyphonic Lo-Fi Beats, Mechanical Keyboard, Sound FX tanpa file MP3 eksternal)
- **Backend Bridge** : Node.js WebSocket Server (`ws`, Port 8080)
- **State & Persistence** : `AgentRegistry` berbasis `localStorage` + In-memory Reactive Sync
- **Package Manager** : npm
- **Automation Scripts** : `start.bat`, `stop.bat` (Windows PowerShell/CMD automation)

---

## 3. Commands

```bash
# Development
npm run dev           # Menjalankan Vite development server (http://localhost:5173/)
npm run build         # Validasi tipe dan kompilasi bundle production ke folder dist/
npm run preview       # Preview hasil build production

# Server & Automation
node server.js        # Menjalankan WebSocket Telemetry Bridge Server (Port 8080)
./start.bat           # 1-Click launcher: Menjalankan Server Backend + Vite Dev Server otomatis
./stop.bat            # 1-Click stopper: Menghentikan seluruh proses Node.js & Vite di Port 5173 & 8080

# External AI Agent Simulation
python test_agent_client.py  # Skrip pengujian simulasi agen eksternal via WebSocket
```

---

## 4. Project Structure

Arsitektur: **Modular Spasial 3D + UI Glassmorphism + Event-Driven Network Bridge**

```text
f:\AUDIRA-AGENT/
├── .agents/                   # Tata Kelola & Dokumen Arsitektur Proyek
│   ├── ARCHITECTURE.md        # Topologi teknis, pipeline Three.js, dan arsitektur sistem
│   ├── PRD.md                 # Product Requirements Document & spesifikasi fitur
│   ├── DESIGN.md              # Design system, palet warna, tipografi, dan standar UI
│   ├── SECURITY.md            # Protokol keamanan, DEFCON levels, dan WebSocket safety
│   ├── DEPLOYMENT.md          # Panduan rilis, packaging, dan infrastruktur server
│   ├── TASK_INSTRUCTION.md    # Panduan implementasi step-by-step untuk AI & developer
│   └── TESTING.md             # Strategi pengujian otomatis & headless validation
├── dist/                      # Hasil kompilasi Vite untuk production
├── src/
│   ├── engine/                # Core 3D Engine & Audio
│   │   ├── 3d/                # Three.js Room, Desk Layout, Avatar Rigging, Pathfinding
│   │   │   ├── scene.ts       # Main Three.js Scene, CSS2DRenderer, Animation Loop
│   │   │   ├── build.ts       # Prosedural mesh generator (lantai, dinding, rak server, meja)
│   │   │   ├── layout.ts      # Koordinat spasial ruangan, grid meja, zona patroli
│   │   │   ├── videoWall.ts   # Tekstur dinamis 9-layar Master Video Wall
│   │   │   └── types.ts       # Interface dan tipe data 3D
│   │   ├── AudiraOffice3D.js  # Wrapper penghubung 3D Engine dengan logika aplikasi
│   │   └── AudioManager.js    # Prosedural Web Audio (Lo-Fi beats, FX, key clacks)
│   ├── agents/                # Manajemen Logika & Armada AI Agent
│   │   ├── AgentRegistry.js   # Registri agen, persistensi localStorage, auto-assign meja
│   │   └── MultiAgentWorkflow.js # Alur skenario insiden (Power Surge, HVAC, DDoS, dll)
│   ├── ui/                    # Modul Antarmuka Pengguna (Glassmorphism HUD)
│   │   ├── SidebarNav.js      # Menu Navigasi Sisi Kiri (AUDIRA-DCOS Standard)
│   │   ├── ControlBar.js      # Top Telemetry Bar & SCADA breadcrumbs
│   │   ├── AddAgentModal.js   # Modal Onboarding Operator Baru (5 DCOS Presets + Custom)
│   │   ├── AgentInspector.js  # Panel Detail Operator sisi kanan (status, SLA, stamina)
│   │   ├── TerminalLog.js     # Konsol log telemetri & event insiden sisi bawah
│   │   ├── TaskBar.js         # Input dispatcher perintah/arahan resmi ke agen
│   │   └── NocVideoWallModal.js # Modal zoom 9-layar Master Video Wall
│   ├── network/               # Lapisan Komunikasi Real-time
│   │   └── AgentBridge.js     # WebSocket Client connector ke backend server
│   ├── utils/                 # Utilitas & Konstanta Sistem
│   │   └── constants.js       # Definisi ROLES, SCADA thresholds, preset avatar
│   ├── main.js                # App entry point, bootstrap modul & koordinasi event
│   └── style.css              # Master Design System (CSS Variables, Grid, Glassmorphism)
├── index.html                 # Halaman utama aplikasi (Viewport 3D + HUD containers)
├── server.js                  # WebSocket server untuk broadcast status agen & event NOC
├── package.json               # Konfigurasi dependensi npm
├── start.bat                  # Script batch untuk menyalakan semua komponen
├── stop.bat                   # Script batch untuk mematikan semua komponen
└── AGENTS.md                  # File aturan utama & system prompt agen AI
```

---

## 5. Naming Conventions

```
# File & Folder
- Modul JavaScript/Class : PascalCase (contoh: SidebarNav.js, AudiraOffice3D.js)
- File Engine/TypeScript : camelCase / kebab-case (contoh: scene.ts, videoWall.ts)
- File Utilitas          : camelCase (contoh: constants.js)
- Folder                 : kebab-case / camelCase (contoh: engine/3d/, agents/)

# Di Dalam Kode
- Variabel               : camelCase (contoh: activeAgent, isMuted, cameraTarget)
- Konstanta              : UPPER_SNAKE_CASE (contoh: ROLES, DEFAULT_CAMERA_POS, DEFCON_LEVELS)
- Method / Fungsi        : camelCase (contoh: followAgent(), playBlip(), syncAgents())
- Class                  : PascalCase (contoh: AgentRegistry, AddAgentModal)
- CSS Classes            : kebab-case (contoh: dcos-sidebar, agent-nav-row, glass-panel)
```

---

## 6. Code Conventions

```
# Pendekatan Umum
- Pertahankan arsitektur 100% 3D Three.js. Dilarang menambahkan elemen retro 2D canvas yang merusak nuansa spasial.
- Tulis kode yang modular, efisien, dan memiliki komentar penjelasan arsitektur.
- Semua event asynchronous (WebSocket, Web Audio, AudioContext resume) wajib dibungkus try-catch.

# Audio Engine
- Selalu panggil `audio.ensureContext()` sebelum memainkan audio untuk mematuhi AudioContext autoplay policy browser.
- Gunakan procedural sound generation (Web Audio Oscillator/GainNode) agar aplikasi tidak bergantung pada aset audio eksternal.

# 3D Scene Safety
- Jangan pernah memanipulasi koordinat posisi avatar secara langsung di luar sistem pathfinding/target Vector3 scene.ts.
- Setiap kali menambahkan elemen CSS2DObject baru, pastikan memiliki class CSS dan dibersihkan saat dispose.
```

---

## 7. Component Rules

```
# Struktur Modul UI (Vanilla JS Class)
1. constructor({ container, ...callbacks })
2. render() -> Menginjeksi template HTML ke dalam this.container
3. bindEvents() -> Menghubungkan event listener DOM
4. update(data) / refresh() -> Memperbarui tampilan secara reaktif
5. open() / close() -> Untuk komponen modal atau drawer
```

---

## 8. Styling Rules

```
# Desain & Tema (AUDIRA-DCOS Design System)
- Gunakan Dark Mode Cyberpunk / Datacenter aesthetic dengan palet HSL:
  - Background Utama : #070d18 / rgba(10, 16, 26, 0.85)
  - Aksen Cyan / Sky  : #38bdf8
  - Aksen Emerald     : #10b981
  - Aksen Warning     : #fbbf24
  - Aksen Danger      : #f43f5e
- Efek Visual: Glassmorphism (`backdrop-filter: blur(12px)`), border halus (`1px solid rgba(56, 189, 248, 0.2)`).
- Dilarang keras menggunakan Tailwind CSS kecuali diminta secara eksplisit oleh pengguna.
- Hindari inline styling kecuali untuk nilai dinamis (misal: warna badge dinamis dari data agen).
```

---

## 9. API & Real-time WebSocket Rules

```
# Protokol Pesan WebSocket
Format payload standar:
{
  "type": "AGENT_MESSAGE" | "INCIDENT_TRIGGER" | "TELEMETRY_UPDATE" | "SYNC_AGENTS",
  "agentId": "string",
  "text": "string",
  "data": { ... },
  "timestamp": 1790842000000
}
```

---

## 10. State Management & Persistensi

- **Armada Agen (Agent Fleet)** dikelola secara terpusat oleh `AgentRegistry`.
- Agen bawaan sistem (`Arthur`, `ROUTEX`, `CHRONOS`, `RESOLV`, `CIPHER`) didefinisikan sebagai default.
- Agen kustom hasil onboarding pengguna (`AddAgentModal`) disimpan secara otomatis ke `localStorage` dengan key `audira_custom_agents_v2`.
- Saat inisialisasi, `AgentRegistry` memuat kombinasi agen default + kustom, lalu menyinkronkannya ke `scene.ts` untuk di-render ke 3D world.

---

## 11. Performance Rules

- **Target Frame Rate**: Konsisten 60 FPS pada resolusi Full HD (1920x1080).
- **Throttling**: Hindari perhitungan kalkulasi proyeksi matematika yang berat di setiap frame render loop Three.js.
- **Label 3D**: `CSS2DRenderer` hanya merender posisi elemen DOM yang aktif di dalam frustum kamera.
- **Resource Cleanup**: Hapus geometri, material, dan event listener saat scene atau elemen dimusnahkan.

---

## 12. Git & Version Control Rules

```
# Format Pesan Commit
feat     : [fitur baru] (contoh: feat: tambah fitur onboarding add agent kustom)
fix      : [perbaikan bug] (contoh: fix: perbaiki animasi loop frame pada scene Three.js)
refactor : [penataan kode] (contoh: refactor: modularisasi sidebar navigasi DCOS)
style    : [desain/tampilan] (contoh: style: perbarui badge avatar 3D glassmorphism)
docs     : [dokumentasi] (contoh: docs: tambahkan arsitektur dan PRD proyek)
```

---

## 13. Features

### Selesai (Completed)
- [x] Ruang Aula Simulasi 3D berukuran 68m x 52m (Three.js) dengan 6 Sektor Cyber Studio & Catwalk Runway 56m 8-Slot.
- [x] Master Production Wall 9-layar dengan canvas tekstur resolusi tinggi interaktif.
- [x] 3D Asset Manager Modal & Persistent Upload Pipeline (.GLB) dengan auto-centering, scaling, dan live turntable.
- [x] 3D Spatial Raycasting & Picking (klik Pod Runway / Sektor untuk inspeksi & deployment instan).
- [x] Multi-Tier Real AI Engine (Google Gemini 2.0 Flash + Local Ollama LLM + Domain Fallback).
- [x] Multi-Service Real Hardware & Ecosystem Telemetry (Host CPU, RAM, RTX 3060 CUDA Worker, Ollama).
- [x] Menu Navigasi Sisi Kiri (AUDIRA Studio Standard) dengan preset kamera dan live status armada.
- [x] Onboarding Operator Baru (`+ TAMBAH` / `AddAgentModal`) dengan preset Game Studio & kustom form.
- [x] Persistensi agen kustom ke `localStorage` dan dynamic avatar spawning di aula 3D.
- [x] Sintesis Prosedural Web Audio (Lo-Fi beats, switch keyboard mekanikal, efek suara studio 3D).
- [x] Launcher otomatisasi 1-klik (`start.bat` dan `stop.bat`).

### Sedang Dikerjakan (In-Progress)
- [ ] Interaksi klik langsung pada cluster GPU render farm di aula 3D untuk inspeksi thermal tiap unit.
- [ ] Integrasi animasi rigged skeletal animation (.GLB) saat avatar berpatroli di NavMesh catwalk.

---

## 14. Testing & Validasi

- **Verifikasi Build**: `npm run build` wajib menghasilkan exit code 0 tanpa error lint atau sintaks TypeScript/Vite.
- **Headless Browser Test**: Verifikasi DOM, render WebGL, dan integrasi modal menggunakan Microsoft Edge headless (`--remote-debugging-port=9222`).
- **Verifikasi Log**: Pastikan tidak ada exception unhandled pada konsol browser saat transisi kamera atau pemanggilan fungsi audio.

---

## 15. Do Not (Pagar Pengaman Agen AI)

> JIKA INSTRUKSI USER AMBIGU, BERHENTI DAN TANYAKAN DULU. JANGAN BERASUMSI.

- **DILARANG KERAS** memunculkan kembali istilah datacenter seperti HVAC, PUE, Cold Aisle, atau trafo 20kV.
- **DILARANG** mengembalikan tampilan ke canvas 2D retro atau menambahkan kartu CSS2D mengambang di atas Master Production Wall 3D.
- **DILARANG** menghapus atau mengganti agen-agen default sistem tanpa instruksi spesifik.
- **DILARANG** menginstal library UI eksternal berat (Tailwind, MUI, Bootstrap) yang merusak Vanilla CSS Design System.
- **DILARANG** meng-hardcode port WebSocket yang berbeda dengan arsitektur `server.js` (Port 8080).
- **DILARANG** mengubah struktur folder root tanpa konfirmasi.

---

## 16. Environment Variables

```bash
# Frontend (Vite)
VITE_WS_URL="ws://localhost:8080"
VITE_STUDIO_ID="AUDIRA-CYBER-STUDIO-01"

# Backend Telemetry Bridge
PORT=8080
NODE_ENV="development"
```
