# TESTING - AUDIRA-AGENT

> Strategi Pengujian Kualitas, Verifikasi Headless Browser, dan Pencegahan Regresi.
> **Version:** v2.4.0-dcos  
> **Last Updated:** 2026-10-01  

---

## 1. Testing Strategy Overview

Sistem pengujian pada AUDIRA-AGENT mencakup tiga pilar utama:
1. **Static Build Verification:** Memastikan seluruh modul ES dan TypeScript ter-bundle dengan sempurna oleh Vite tanpa error resolusi dependensi atau kesalahan sintaks.
2. **Headless Browser E2E Testing (Chrome DevTools Protocol):** Menjalankan peramban Microsoft Edge secara headless dengan port debugging untuk memantau runtime exception, memverifikasi struktur DOM, dan menangkap tangkapan layar (screenshot) aktual.
3. **Real-time Protocol Verification:** Menguji keandalan transmisi event telemetri WebSocket antara browser dan backend server.

---

## 2. Command Pengujian Mandatori

### A. Validasi Build Produksi
```bash
npm run build
```
*Kriteria Lulus:* Exit code 0, tidak ada error resolusi impor, ukuran bundle di bawah batas peringatan.

### B. Pengujian E2E & Validasi Visual Headless
Skrip pengujian E2E otomatis tersedia di folder artifact/scratch untuk mengeksekusi alur penuh:
- Membuka halaman `http://localhost:5173/`.
- Memeriksa ketersediaan `#leftSidebarNav` dan `#btnOpenAddAgent`.
- Membuka modal onboarding operator, memilih template preset `VOLTIS`, dan menugaskannya.
- Memverifikasi penambahan agen di roster dan kemunculan avatar di aula 3D.
- Menangkap bukti visual screenshot (`modal_add_agent.png` dan `studio_with_voltis.png`).

---

## 3. Checklist Kriteria Penerimaan (Acceptance Criteria)

| Fitur / Komponen | Kriteria Pengujian | Status Target |
| :--- | :--- | :--- |
| **Virtual 3D Cyber Studio** | Scene Three.js merender 6 Sektor Studio, Catwalk Runway 56m, dan avatar pada 60 FPS tanpa jeda | PASS |
| **Catwalk Runway 56m 8-Slot** | 8 Pod bergerak mulus, slot 01-08 dapat di-klik (raycasting), dan model .GLB berputar di turntable | PASS |
| **3D Asset Upload Pipeline** | File .GLB dapat diunggah, auto-scaling normal, tersimpan di server disk, dan deploy ke runway | PASS |
| **Master Production Wall** | Tekstur kanvas 9-layar bersih, dinamis 60 FPS/64Hz, tanpa tertutup kartu retro 2D | PASS |
| **Multi-Tier AI Engine** | AI (Arthur, ROUTEX, CHRONOS, VOLTIS) merespons topik Game Dev / 3D Asset tanpa istilah datacenter | PASS |
| **Menu Sisi Kiri** | Sidebar navigasi studio terbuka di sisi kiri, responsif, dan dapat diciutkan (`Ctrl+B`) | PASS |
| **Onboarding Modal** | Preset cepat studio terisi otomatis ke form dan dapat dideploy ke meja kerja 3D | PASS |
| **Persistensi State** | Model .GLB runway dan agen kustom tetap ada setelah refresh halaman | PASS |
| **Audio Sintetis** | Musik Lo-Fi dan efek klik keyboard mekanikal berbunyi tanpa error AudioContext | PASS |
