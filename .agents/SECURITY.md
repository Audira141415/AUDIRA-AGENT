# SECURITY - AUDIRA-AGENT (3D AI Game Studio & Cyber Asset Command Center)

> Protokol Keamanan, Standar Integritas Asset 3D, dan Kebijakan DEFCON.
> **Version:** v2.5.0-studio  
> **Last Updated:** 2026-10-04  

---

## 1. Security Architecture & Threat Model

AUDIRA-AGENT bertindak sebagai pusat komando 3D untuk pipeline game engine Three.js dan pameran aset 3D .GLB. Keamanan dibangun dengan prinsip **Defense-in-Depth** yang melindungi layer antarmuka visual, komunikasi real-time WebSocket, validasi upload file 3D model, dan integritas payload game.

### Status Kesiapsiagaan Pertahanan (DEFCON Levels)
- **DEFCON 5 (Normal Ops):** Kondisi hijau. Game engine Three.js 60 FPS stabil, netcode multiplayer 64Hz terkunci, pipeline aset .GLB normal.
- **DEFCON 4 (Increased Intel):** Anomali waktu kompilasi shader, fluktuasi draw calls WebGL, atau minor packet jitter pada WebSocket.
- **DEFCON 3 (Studio Alert):** Lonjakan buffer memory VRAM GPU atau desync netcode multiplayer pada sesi playtest.
- **DEFCON 2 (Critical Threat):** WebGL context loss, payload model .GLB korup/tampered, atau exploit packet injection.
- **DEFCON 1 (Emergency Crash):** Unhandled Three.js render loop crash, korupsi showcase state registry, atau blocker build pipeline.

---

## 2. Input Validation & XSS Prevention

### Onboarding Agent Form (`AddAgentModal.js`)
1. **Nama / Codename Operator:**
   - Panjang karakter: Min 2, Maks 24 karakter.
   - Karakter yang diizinkan: Alfabetik, Angka, Underscore, Strip (`[A-Za-z0-9_-]+`).
   - Mencegah injeksi tag HTML atau script injection (`<script>`, `<iframe>`).
2. **Text Content Escaping:**
   - Semua input teks tugas (task) dan monolog pikiran (thoughts) di-render ke DOM menggunakan properti `textContent` atau disanitasi sebelum dimasukkan ke dalam template string.
   - Balon ucapan 3D (`.vp-bubble`) menggunakan `element.textContent` untuk mencegah render HTML jahat di dalam scene spasial.

---

## 3. WebSocket Bridge Security (`server.js` & `AgentBridge.js`)

1. **Localhost Binding:**
   - Secara default, WebSocket server berjalan di loopback address (`localhost:8080`) untuk mencegah eksposur port yang tidak terproteksi ke jaringan publik.
2. **Message Payload Schema Validation:**
   - Setiap pesan JSON yang masuk diverifikasi tipe datanya (`type`, `agentId`, `text`, `timestamp`). Pesan dengan struktur malformed akan diabaikan untuk mencegah crash denial-of-service.
3. **Graceful Reconnection:**
   - Client WebSocket menggunakan retry backoff bertahap (maksimum 5000ms) untuk mencegah *thundering herd problem* terhadap server.

---

## 4. LocalStorage Data Security & Integrity

- Key Penyimpanan: `audira_custom_agents_v2`.
- Validasi Deserialisasi: Data hasil `JSON.parse()` selalu diverifikasi keberadaan atribut wajib (`id`, `name`, `role`, `roleConfig`).
- Safe Reset: Jika data di `localStorage` rusak atau mengalami korupsi format, sistem otomatis melakukan fallback aman ke daftar agen bawaan tanpa memicu exception runtime.

---

## 5. Environment Variables & Secrets Handling

- Dilarang menempatkan API Secret Keys, token otentikasi produksi, atau kredensial database di dalam bundle frontend client (`src/`).
- File `.env` lokal dikecualikan dari commit publik melalui `.gitignore`.
