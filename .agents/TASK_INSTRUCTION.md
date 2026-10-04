# TASK INSTRUCTION - AUDIRA-AGENT

> Panduan Implementasi Step-by-Step & Checklist Tugas untuk AI Assistant dan Developer.
> **Purpose:** Panduan operasional pengembangan fitur dan pencegahan regresi visual.
> **Last Updated:** 2026-10-01  

---

## 0. Prerequisite Reading (WAJIB BACA SEBELUM CODING)

Sebelum menambahkan modul baru atau mengubah kode yang ada, Anda **WAJIB** membaca dan memahami:
1. `AGENTS.md` (Aturan koding, pantangan arsitektur, tech stack)
2. `.agents/ARCHITECTURE.md` (Struktur komponen spasial 3D & bridge real-time)
3. `.agents/DESIGN.md` (Design system tokens, warna CSS, dan standar layout)

---

## 1. Alur Kerja Menambahkan Peran Operator Baru (New Game Studio Role)

Jika ingin menambahkan divisi/peran baru ke studio game (misal: Lead Gameplay Programmer, Technical Animator, VFX Artist):
1. **Daftarkan Peran di [`src/utils/constants.js`](file:///f:/AUDIRA-AGENT/src/utils/constants.js)**:
   - Tambahkan key baru di object `ROLES` dengan atribut `title`, `badge`, `color`, `desk`, `tools`, dan `responsibilities`.
2. **Tambahkan Template di [`src/ui/AddAgentModal.js`](file:///f:/AUDIRA-AGENT/src/ui/AddAgentModal.js)**:
   - Tambahkan entri baru pada array preset studio agar dapat dipilih 1-klik oleh pengguna.
3. **Tambahkan Opsi di Dropdown Form**:
   - Tambahkan `<option value="...">` pada `agentRoleSelect` di `AddAgentModal.js`.
4. **Verifikasi Build**:
   - Jalankan `npm run build` dan pastikan kompilasi bebas error.

---

## 2. Alur Kerja Menambahkan Skenario Sprint / Milestone Baru

Jika ingin menambahkan simulasi sprint atau mitigasi game dev (misal: Shader Compile Crash / Netcode Desync):
1. Tambahkan method simulasi di [`src/agents/MultiAgentWorkflow.js`](file:///f:/AUDIRA-AGENT/src/agents/MultiAgentWorkflow.js).
2. Tentukan agen mana yang bereaksi, apa pesan ucapannya di 3D bubble, dan pergerakan targetnya di catwalk atau workstation.
3. Tambahkan tombol pemicu di [`src/ui/SidebarNav.js`](file:///f:/AUDIRA-AGENT/src/ui/SidebarNav.js) pada section `SKENARIO SPRINT STUDIO`.
4. Hubungkan event listener pada method `bindEvents()` di `SidebarNav.js`.

---

## 3. Checklist Verifikasi Mandatori Setiap Selesai Task

- [ ] **1. Integritas Build:** Jalankan `npm run build` (wajib exit code 0).
- [ ] **2. Anti-Clutter Check:** Pastikan tidak ada kartu HTML putih atau elemen unstyled melayang di atas Video Wall 3D.
- [ ] **3. Animasi Loop Check:** Pastikan `requestAnimationFrame(frame)` di `src/engine/3d/scene.ts` tidak melempar `ReferenceError` atau `TypeError`.
- [ ] **4. Layout Responsiveness:** Periksa apakah sidebar navigasi kiri dapat diciutkan (`Ctrl+B`) dengan lancar tanpa merusak aspect ratio kamera Three.js.
- [ ] **5. Persistensi:** Pastikan penambahan agen tersimpan di `localStorage` dan avatar tetap muncul saat halaman direfresh.
