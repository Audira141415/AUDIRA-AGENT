# DESIGN - AUDIRA-AGENT (3D AI Game Studio & Cyber Asset Command Center)

> Design System & Panduan Visual UI/UX Spasial 3D Cyber Game Studio & Asset Runway.
> **Version:** v2.5.0-studio  
> **Last Updated:** 2026-10-04  

---

## 1. Design Philosophy

Desain antarmuka AUDIRA-AGENT dibangun di atas filosofi **"Cyber Game Studio & Dark Glassmorphism"**. Setiap elemen visual menyampaikan kedalaman spasial 3D Three.js, estetika cyber studio futuristik, dan performa tinggi 60 FPS tanpa mengorbankan kenyamanan inspeksi aset 3D dan keterbacaan data engine.

---

## 2. Color System & Design Tokens

Semua warna didefinisikan menggunakan CSS Variables di root [`src/style.css`](file:///f:/AUDIRA-AGENT/src/style.css):

```css
:root {
  /* Backgrounds & Surfaces */
  --bg-primary: #070d18;
  --bg-secondary: #0b1526;
  --bg-glass: rgba(11, 21, 38, 0.78);
  --bg-glass-card: rgba(16, 29, 51, 0.65);
  --bg-glass-input: rgba(6, 12, 22, 0.85);

  /* Borders & Glows */
  --border-glass: rgba(56, 189, 248, 0.22);
  --border-glass-subtle: rgba(255, 255, 255, 0.08);
  --glow-cyan: rgba(56, 189, 248, 0.35);
  --glow-emerald: rgba(16, 185, 129, 0.35);

  /* Semantic Accent Colors */
  --accent-cyan: #38bdf8;       /* Primary Action, Three.js Engine, Telemetry */
  --accent-emerald: #10b981;    /* 60 FPS, Healthy, Runway Active */
  --accent-amber: #fbbf24;      /* Warning, Review, Milestone Pending */
  --accent-rose: #f43f5e;       /* Frame Drop, Incident Alert */
  --accent-violet: #a855f7;     /* Audio Synth, Arthur Lead */

  /* Text Colors */
  --text-main: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --text-dim: #475569;
}
```

---

## 3. Typography

- **UI & Display Font:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif.
- **Code, Engine & Telemetry Font:** `JetBrains Mono`, `Fira Code`, `Consolas`, monospace.

### Type Scale:
- **Display / Brand:** `15px / Bold / Letter-spacing 1px / Uppercase`
- **Section Headers:** `10px / ExtraBold / Letter-spacing 1.2px / Uppercase (Color: var(--accent-cyan))`
- **Body / Labels:** `12px / Medium`
- **Telemetry / Logs:** `11px / Monospace / Line-height 1.5`

---

## 4. Layout Architecture

Aplikasi menggunakan layout **Full-Viewport CSS Grid & Flexbox**:

```text
+--------------------------------------------------------------------------------+
|                                topControlBar (52px)                            |
+----------------+------------------------------------------------+--------------+
|                |                                                |              |
|                |                                                |              |
|                |                                                | right        |
|                |                                                | Inspector    |
| leftSidebarNav |             #threeContainer (3D Scene)         | Container    |
| (280px / 68px) |                                                | (320px)      |
|                |                                                |              |
|                |  +---------------------+  +-----------------+  |              |
|                |  | bottomTerminal (HUD)|  | bottomTaskBar   |  |              |
|                |  +---------------------+  +-----------------+  |              |
+----------------+------------------------------------------------+--------------+
```

---

## 5. Component Design Standards

### A. Buttons & Chips
- **Primary Button (`.btn-primary`):** Gradien cyan ke emerald dengan box-shadow bercahaya saat hover.
- **Glass Chip (`.light-chip`, `.cam-grid-btn`):** Background transparan dengan border tipis `1px solid rgba(255,255,255,0.08)`. Saat aktif, latar berubah menjadi biru safir dengan border cyan terang.

### B. Add Agent Preset Cards (`.preset-card-btn`)
- Grid 2 kolom kartu preset dengan ikon emoji berlatar transparan.
- Efek hover: `transform: translateY(-2px)`, border glow cyan, dan kursor pointer interaktif.

### C. 3D Spatial Avatar Labels (`.vp-label`)
- Dirender melalui `CSS2DObject`.
- Latar: `rgba(10, 16, 26, 0.88)` dengan blur latar `4px`.
- Border: `1px solid rgba(56, 189, 248, 0.45)`.
- Tipografi: Monospace 11px, Uppercase, warna `#38bdf8`, dengan bayangan teks lembut.

### D. Spatial Speech Bubbles (`.vp-bubble`)
- Balon ucapan obrolan agen yang melayang tepat di atas kepala avatar.
- Border emerald neon lembut, sudut membulat 8px, batas maksimal lebar 220px.

---

## 6. Micro-Interactions & Animation Standards

- **Transisi Standar:** `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- **Indikator Status Online (`.pulse-indicator`):** Animasi denyut nadi keyframe `0% opacity: 1` -> `100% opacity: 0.3` secara berulang (1.5 detik).
- **Radar Sweep pada Video Wall:** Garis radar berputar yang digambar secara prosedural pada kanvas video wall untuk memberikan nuansa pusat komando hidup.
