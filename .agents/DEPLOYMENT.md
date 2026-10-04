# DEPLOYMENT - AUDIRA-AGENT

> Panduan Infrastruktur, Packaging Bundle, dan Eksekusi Produksi.
> **Version:** v2.4.0-dcos  
> **Last Updated:** 2026-10-01  

---

## 1. Deployment Architecture

Sistem terbagi menjadi 2 komponen utama:
1. **Frontend Client Application (SPA):** Static bundle yang dihasilkan oleh Vite (`dist/index.html`, `dist/assets/*`). Dapat disajikan oleh Nginx, Caddy, Cloudflare Pages, Vercel, atau Vite Preview.
2. **Backend Telemetry Bridge (`server.js`):** Layanan Node.js WebSocket mandiri (Port 8080) yang menyalurkan telemetri agen eksternal ke browser klien.

---

## 2. Environment Setup & Prerequisites

- **Runtime:** Node.js v18.0.0+ (Direkomendasikan Node.js v20 LTS atau v22)
- **Package Manager:** npm (v9.0.0+)
- **Port Komunikasi:**
  - `5173` (Vite Development Server / Frontend)
  - `8080` (WebSocket Telemetry Bridge Server)
- **GPU Acceleration:** Browser modern (Chrome, Edge, Firefox, Safari) dengan WebGL 2.0 aktif.

---

## 3. Deployment Steps

### A. Menjalankan di Mode Development
Gunakan skrip otomatisasi bawaan:
```bash
./start.bat
```
Atau secara manual di dua terminal terpisah:
```bash
# Terminal 1 - Backend Server
node server.js

# Terminal 2 - Frontend Vite
npm run dev
```

### B. Membangun Bundle Production
```bash
# 1. Jalankan kompilasi dan optimasi bundle
npm run build

# 2. Bundle output tersedia di folder dist/
# Terdiri dari dist/index.html, dist/assets/*.js, dan dist/assets/*.css

# 3. Uji jalankan bundle production secara lokal
npm run preview
```

### C. Menghentikan Seluruh Layanan
Gunakan skrip pembasmi proses bawaan:
```bash
./stop.bat
```
Skrip ini akan mencari PID yang mendengarkan pada Port 5173 dan Port 8080 lalu menghentikannya secara bersih.

---

## 4. Rollback & Troubleshooting

- **Bersihkan Cache Vite:**
  ```bash
  Remove-Item -Recurse -Force node_modules/.vite
  npm run dev
  ```
- **Reset LocalStorage Agen Kustom di Browser:**
  Buka Console Developer Tools browser (F12) dan jalankan:
  ```javascript
  localStorage.removeItem('audira_custom_agents_v2');
  location.reload();
  ```
