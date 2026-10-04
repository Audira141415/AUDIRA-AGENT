# Claude Code Rules - AUDIRA-AGENT

AUDIRA-AGENT is a 3D Virtual NOC (Network Operations Center) Command Center built on Three.js for Tier-III Datacenter monitoring.

Always refer to:
- `AGENTS.md` (Root configuration & coding rules)
- `.agents/ARCHITECTURE.md` (System topology & Three.js pipeline)
- `.agents/PRD.md` (Product specs & operator personas)
- `.agents/DESIGN.md` (Vanilla CSS design system & tokens)
- `.agents/TASK_INSTRUCTION.md` (Step-by-step implementation guide)
- `.agents/TESTING.md` (Build & E2E headless validation)

Core Guidelines:
- Non-destructive enhancements only (never delete existing agents or features).
- Pure 3D Three.js: no retro 2D canvas overlays over the 9-screen Master Video Wall.
- Vanilla CSS with HSL variables in `src/style.css`.
- Procedural Web Audio API sound engine (zero external MP3 files).
- Development commands: `start.bat`, `stop.bat`, `npm run dev`, `npm run build`.
