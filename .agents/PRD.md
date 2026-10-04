# PRD - AUDIRA-AGENT (3D AI Game Studio & Cyber Asset Command Center)

> Product Requirements Document: 3D AI Game Dev Studio, GLB Asset Showcase Runway & Autonomous AI Fleet.
> **Version:** v2.5.0-studio  
> **Last Updated:** 2026-10-04  
> **Status:** Active / 3D Asset Production Mode  

---

## 1. Executive Summary

**AUDIRA-AGENT** adalah platform pusat komando virtual 3D interaktif berbasis Three.js untuk Studio Game & Pipeline Asset 3D .GLB, terintegrasi dengan armada AI Game Developer otonom (Arthur, ROUTEX, CHRONOS, RESOLV, CIPHER, VOLTIS, dll), Catwalk Runway 56m 8-Slot, dan Master Production Wall 9-layar.

- **Vision Statement:** Menghadirkan pusat produksi game spasial 3D imersif di mana game producer, 3D artist, technical artist, audio designer, dan AI autonomous agent berkolaborasi menginspeksi aset 3D .GLB secara live di catwalk conveyor, menguji netcode multiplayer, dan menjalankan sprint milestone game engine.
- **Business & Creative Objectives:**
  - Mengeliminasi review aset 3D statis 2D dengan catwalk runway conveyor 56m 8-slot interaktif berkamera orbit.
  - Memungkinkan onboarding operator AI spesialis game dev baru secara instan tanpa restart sistem.
  - Menyediakan pipeline penalaran AI multi-tier (Gemini 2.0 Flash + Local Ollama) untuk comm-link dan task dispatcher otomatis.
  - Memberikan visualisasi spasial 60 FPS untuk mengoptimalkan WebGL draw calls, shader uniforms, dan multiplayer netcode.

---

## 2. Target Users & Personas

1. **Studio Director & Executive Producer (Persona: Arthur)**
   - Kebutuhan: Mengontrol milestone sprint v0.9.4, mengorkestrasi armada AI, memantau Master Production Wall, dan menyiarkan arahan studio resmi.
2. **Lead Gameplay & Engine Architect (Persona: ROUTEX)**
   - Kebutuhan: Optimasi WebGL draw calls, kestabilan 60 FPS (frametime 16.6ms), netcode multiplayer tickrate 64Hz, dan packet prediction.
3. **Lead Technical Artist & Level Designer (Persona: CHRONOS)**
   - Kebutuhan: Penyusunan level biome modular, NavMesh pathfinding catwalk 56m, dynamic lighting (senja, malam, siang), dan occlusion culling.
4. **Lead 3D Modeler & GLB Asset Specialist (Persona: VOLTIS)**
   - Kebutuhan: Inspeksi mesh .GLB, topologi polygon low-poly, PBR texture maps, auto-centering bounding box, dan penempatan slot pod runway.
5. **Lead Audio & Polyphonic Synth Engineer (Persona: CIPHER)**
   - Kebutuhan: Sintesis audio prosedural Web Audio, musik Lo-Fi adaptif, spatial 3D audio listener, dan verifikasi integritas hash aset .GLB.
6. **Lead Narrative & Game Systems Designer (Persona: RESOLV)**
   - Kebutuhan: Percabangan dialog quest NPC, balancing sistem gameplay, dan koordinasi tiket bug QA sprint.

---

## 3. Feature Specifications

### 3.1 Grand Cyber Studio 3D Hall (68m x 52m) & 6 Sektor Khusus
- **Deskripsi:** Aula simulasi spasial Three.js berukuran 68m x 52m dengan 6 sektor bertema cyber studio:
  - **Sektor 01**: Arsenal & Weapon R&D Lab (firing range 3-lane, workbench senjata berat).
  - **Sektor 02**: Exo-Armor & Mecha Workshop (hydraulic lift turntable 6.5m, gantry crane).
  - **Sektor 03**: Master Production Wall 9-layar & Central Avatar Stasis Scanner.
  - **Sektor 04**: Autonomous Drones & Vehicle Hangar (hexagonal drone landing pads, test flight cage).
  - **Sektor 05**: Quantum Core & VFX Particle Lab (tokamak fusion reactor, 4-rack GPU render cluster).
  - **Sektor 06**: Cyber Playtest Esports Arena & Studio Crew Lounge Espresso Bar.
- **Pencahayaan Dinamis:** Mode suasana Malam Cyberpunk, Senja Golden Hour, dan Siang Studio Terik.

### 3.2 Catwalk Runway 56m 8-Slot & 3D Spatial Raycasting
- **Deskripsi:** Runway catwalk 56m di tengah aula dengan 8 pod pameran bergerak dan turntable auto-rotation untuk model .GLB.
- **Interactive Picking (Raycasting):** Klik langsung pada Pod Runway (Slot 01 - 08) atau Plinth Sektor untuk zoom kamera otomatis dan membuka dialog inspeksi aset.

### 3.3 Persistent 3D Asset Manager & Upload Pipeline (.GLB)
- **Deskripsi:** Modal komprehensif untuk upload file `.glb` atau memilih model mecha bawaan studio:
  - Auto-centering bounding box dan auto-scaling cerdas.
  - Turntable live preview 3D interaktif (orbit, zoom, pan).
  - Deployment 1-klik ke Pod Runway 01-08 atau Sektor Pameran Studio.
  - Persistensi permanen ke disk server (`data/showcase_state.json` & `public/models/uploads/`).

### 3.4 Master 9-Screen Production Wall
- **Deskripsi:** Dinding video utama 9 panel resolusi tinggi (1024x512) di aula 3D:
  - Layar 1: Engine Performance & 60 FPS Frametime Waveform.
  - Layar 2: 3D Asset Workshop & .GLB Pipeline Stats.
  - Layar 3: Multiplayer Netcode & 64Hz Tickrate.
  - Layar 4: Level Design & Modular Biome Generation.
  - Layar 5: Sprint Milestone Alpha v0.9.4 Status.
  - Layar 6: Dynamic Audio & Polyphonic Synth Visualizer.
  - Modal Zoom & Broadcast Studio Directive Form.

### 3.5 Multi-Tier Real AI Engine & Comm-Link
- **Deskripsi:** Penalaran kognitif agen AI multi-tier:
  - **Tier 1:** Google Gemini 2.0 Flash API (jika API key terpasang).
  - **Tier 2:** Local Ollama LLM (`qwen3:8b`, `deepseek-r1:8b`, dll) via port 11434.
  - **Tier 3:** Deep Domain Fallback Persona dengan respon teknis game dev Bahasa Indonesia.
- **Fitur Comm-Link:** Chat 1-on-1 dengan visualisasi *inner thought* (💭) dan status AI aktif.

### 3.6 Sintesis Prosedural Web Audio
- **Deskripsi:** Pembangkit audio sintetis real-time tanpa file MP3 eksternal:
  - Musik Lo-Fi ambient polifonik multi-stems.
  - Bunyi switch keyboard mekanikal saat avatar mengetik.
  - Efek taktil klik UI, alert sprint, dan spatial sound effect 3D.

---

## 4. Non-Functional Requirements

- **Performance:** Render konsisten 60 FPS pada kartu grafis kelas menengah (NVIDIA RTX 3060 / GTX 1650).
- **Responsive Viewport:** Otomatis menyesuaikan aspek rasio Three.js saat sidebar diciutkan atau jendela browser di-resize.
- **Zero-Crash Resilience:** Seluruh penanganan event WebSockets, Web Audio context resume, dan rendering GLB memiliki fail-safe guard.

---

## 5. Release Phases

- **Phase 1 (Completed):** Ruang aula 68m x 52m, Catwalk Runway 56m 8-Slot, 6 Sektor Cyber Studio, Master Video Wall 9-layar.
- **Phase 2 (Completed):** Persistent 3D Asset Upload Pipeline (.GLB), 3D Spatial Raycasting & Picking slot runway.
- **Phase 3 (Completed):** Multi-Tier Real AI Engine (Gemini + Local Ollama), Real Host Hardware Telemetry, dan Comm-Link Chat.
- **Phase 4 (In-Progress):** Rigged skeletal animations (.GLB) saat avatar berpatroli dan WebGL multiplayer room sync.
