# GitHub Copilot Instructions for AUDIRA-AGENT

> **CRITICAL DIRECTIVE FOR GITHUB COPILOT & AI AGENTS:**
> This repository is **AUDIRA-AGENT** (Virtual NOC 3D Command Center for Tier-III Datacenter Facilities).
> You MUST ALWAYS read, respect, and strictly adhere to **`AGENTS.md`** at the project root and the documentation suite inside **`.agents/`**:
> - `.agents/ARCHITECTURE.md` (Three.js scene graph, 9-screen video wall, WebSocket bridge)
> - `.agents/PRD.md` (Product requirements, operator personas, Tier-III workflows)
> - `.agents/DESIGN.md` (Dark Glassmorphism, CSS variables, typography, HUD layouts)
> - `.agents/SECURITY.md` (DEFCON levels, input sanitization, safe localStorage)
> - `.agents/DEPLOYMENT.md` (Build commands, ports 5173 and 8080, start/stop automation)
> - `.agents/TASK_INSTRUCTION.md` (Step-by-step checklist, regression prevention)
> - `.agents/TESTING.md` (Vite build validation, headless browser E2E acceptance criteria)

---

## Key Development Rules

1. **Do NOT Delete Existing Logic or Features**:
   - Always perform non-destructive, additive enhancements.
   - Preserve default agents (`Arthur`, `ROUTEX`, `CHRONOS`, `RESOLV`, `CIPHER`) and custom onboarded agents.
2. **Strictly Maintain 100% 3D Three.js Architecture**:
   - Never add retro 2D HTML/canvas overlays or unstyled CSS2D cards that obstruct the 3D scene or the 9-screen Master Video Wall.
   - Use CSS2DObject ONLY for spatial avatar labels (`.vp-label`) and speech bubbles (`.vp-bubble`).
3. **Design System & Styling**:
   - Use pure Vanilla CSS with design tokens defined in `src/style.css`.
   - Never install or use Tailwind CSS, MUI, or Bootstrap unless explicitly requested by the user.
4. **Audio Engine Standards**:
   - All sound generation must remain procedural via Web Audio API in `src/engine/AudioManager.js` (zero external MP3 dependencies).
   - Always verify `audio.ensureContext()` before playback.
5. **Real-Time Network Ports**:
   - Frontend Vite runs on port `5173`.
   - Telemetry WebSocket bridge runs on port `8080` (`server.js`). Never change or hardcode different ports.
