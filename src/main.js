/**
 * main.js - AUDIRA NOC 3D Command Center Application Entrypoint
 * 100% Pure 3D Three.js Architecture (No retro 2D canvas)
 * Powered by AUDIRA-DCOS Left Sidebar Navigation, 9-Screen Video Wall & Specialized NOC Agent Fleet
 */

import { AgentRegistry } from './agents/AgentRegistry.js';
import { AudiraOffice3D } from './engine/AudiraOffice3D.js';
import { MultiAgentWorkflow } from './agents/MultiAgentWorkflow.js';
import { AgentBridge } from './network/AgentBridge.js';

import { SidebarNav } from './ui/SidebarNav.js';
import { ControlBar } from './ui/ControlBar.js';
import { AgentInspector } from './ui/AgentInspector.js';
import { TerminalLog } from './ui/TerminalLog.js';
import { TaskBar } from './ui/TaskBar.js';
import { NocVideoWallModal } from './ui/NocVideoWallModal.js';
import { AddAgentModal } from './ui/AddAgentModal.js';
import { AssetManagerModal } from './ui/AssetManagerModal.js';
import { AIConfigModal } from './ui/AIConfigModal.js';
import { ServerRackInspector } from './ui/ServerRackInspector.js';
import { CameraNavGizmo } from './ui/CameraNavGizmo.js';
import { RunwayControlDeck } from './ui/RunwayControlDeck.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize AUDIRA-DCOS NOC Agents (Arthur, ROUTEX, CHRONOS, RESOLV, CIPHER)
  const registry = new AgentRegistry();

  // 2. Initialize Telemetry Terminal & Inspector
  const terminalLog = new TerminalLog({
    container: document.getElementById('bottomTerminalContainer')
  });

  let engine3D = null;
  let nocModal = null;
  let assetManagerModal = null;
  let isZenMode = false;

  const toggleZen = (zenState) => {
    isZenMode = typeof zenState === 'boolean' ? zenState : !isZenMode;
    document.body.classList.toggle('zen-mode', isZenMode);
  };

  // Mount Multi-Tier AI Engine & LLM Configuration Modal
  const aiConfigModal = new AIConfigModal({
    container: document.getElementById('aiConfigModalContainer'),
    onConfigSaved: (cfg) => {
      terminalLog.addLog({
        agent: 'AI ENGINE',
        text: `Konfigurasi AI diperbarui: Provider [${(cfg.preferredProvider || 'auto').toUpperCase()}], Model [${cfg.ollamaModel || 'qwen3:8b'}].`,
        type: 'success'
      });
    }
  });

  // Mount 42U Server Rack Telemetry Inspector
  const rackContainer = document.createElement('div');
  rackContainer.id = 'serverRackContainer';
  document.body.appendChild(rackContainer);
  const serverRackInspector = new ServerRackInspector({
    container: rackContainer,
    onAssignAgentToRack: (rackLabel) => {
      const active = agentInspector.currentAgent || registry.getById('audira_lead');
      if (active && engine3D) {
        engine3D.sendAgentToRack(active.name, rackLabel);
        terminalLog.addLog({
          agent: active.name,
          text: `Ditugaskan inspeksi ke ${rackLabel}.`,
          type: 'info'
        });
      }
    },
    onLogUpdate: (log) => terminalLog.addLog(log)
  });

  const agentInspector = new AgentInspector({
    container: document.getElementById('rightInspectorContainer'),
    registry,
    onOpenAiConfig: () => aiConfigModal.open(),
    onFocusAgent: (agentId) => {
      if (engine3D) engine3D.followAgent(agentId);
    },
    onSendToVideoWall: (agent) => {
      if (engine3D) {
        engine3D.focusVideoWall();
        engine3D.sendAgentToVideoWall(agent.name);
      }
    },
    onSendToDesk: (agent) => {
      if (engine3D) {
        engine3D.centerCamera();
        engine3D.sendAgentToDesk(agent.name);
      }
    },
    onSendToPantry: (agent) => {
      if (engine3D) {
        engine3D.sendAgentToPantry(agent.name);
      }
    },
    onChangeModel: (agent, source, fileName) => {
      if (engine3D) {
        engine3D.loadAgentGLB(agent.name, source).then((success) => {
          if (success) {
            agent.modelUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
            agent.modelName = fileName;
            registry.saveCustomAgents();
            agentInspector.update();
            terminalLog.addLog({
              agent: '3D PIPELINE',
              text: `Model 3D .glb (${fileName}) berhasil diintegrasikan ke ${agent.name}!`,
              type: 'success'
            });
          } else {
            terminalLog.addLog({
              agent: '3D PIPELINE',
              text: `Gagal memuat model 3D .glb untuk ${agent.name}.`,
              type: 'error'
            });
          }
        });
      }
    },
    onResetModel: (agent) => {
      if (engine3D) {
        engine3D.clearAgentGLB(agent.name);
        agent.modelUrl = null;
        agent.modelName = null;
        agent.locomotionMode = 'mecha_stride';
        registry.saveCustomAgents();
        agentInspector.update();
        terminalLog.addLog({
          agent: '3D PIPELINE',
          text: `Visual operator ${agent.name} berhasil direset kembali ke SD Gundam bawaan!`,
          type: 'success'
        });
      }
    },
    onSetLocomotion: (agent, mode) => {
      if (engine3D) {
        engine3D.setAgentLocomotion(agent.name, mode);
        terminalLog.addLog({
          agent: 'MECHA LOCOMOTION',
          text: `Mode lokomosi ${agent.name} diubah ke [${mode === 'mecha_hover' ? '🚀 Jet Hover' : '🤖 Mecha Stride'}].`,
          type: 'info'
        });
      }
    },
    onTestWalk: (agent) => {
      if (engine3D) {
        engine3D.testWalkAgent(agent.name);
        terminalLog.addLog({
          agent: 'ROBOT TEST',
          text: `Menguji berjalan: ${agent.name} bergerak melintasi catwalk studio!`,
          type: 'warning'
        });
      }
    }
  });

  // Drag-and-drop .glb file directly into 3D scene
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
        const activeAgent = agentInspector.currentAgent || registry.getById('audira_lead');
        if (activeAgent && engine3D) {
          engine3D.loadAgentGLB(activeAgent.name, file).then((ok) => {
            if (ok) {
              activeAgent.modelUrl = URL.createObjectURL(file);
              activeAgent.modelName = file.name;
              registry.saveCustomAgents();
              agentInspector.update();
              terminalLog.addLog({
                agent: '3D DRAG-DROP',
                text: `📦 Model ${file.name} otomatis dipasang ke operator ${activeAgent.name}!`,
                type: 'success'
              });
            }
          });
        }
      }
    }
  });

  // Keep inspector closed initially for an open, uncluttered 3D view
  agentInspector.close();

  // 3. Initialize 3D Engine (Three.js High-Tech NOC Command Center)
  const canvas3D = document.getElementById('office3DCanvas');
  const labels3D = document.getElementById('office3DLabels');

  try {
    engine3D = new AudiraOffice3D({
      canvas: canvas3D,
      labelHost: labels3D,
      registry,
      onSelectAgent: (agent) => {
        agentInspector.setAgent(agent);
      },
      onInteractObject: (obj) => {
        terminalLog.addLog({
          agent: 'STUDIO 3D',
          text: `Interaksi: ${obj.label || 'Objek 3D'}`,
          type: 'system'
        });
      },
      onOpenVideoWall: () => {
        if (nocModal) nocModal.open();
      },
      onServerRackClick: (rackLabel) => {
        serverRackInspector.open(rackLabel);
        terminalLog.addLog({
          agent: 'SCADA RACK SENSOR',
          text: `Inspeksi fisik 3D: [${rackLabel}] dipilih. Membuka panel thermal.`,
          type: 'info'
        });
      },
      onCoffeeMachineClick: () => {
        const active = agentInspector.currentAgent || registry.getById('audira_lead');
        if (active && engine3D) {
          active.drinkCoffee();
          engine3D.sendAgentToPantry(active.name);
          terminalLog.addLog({
            agent: active.name,
            text: `Mengunjungi pantry untuk menyeduh espresso hangat ☕.`,
            type: 'info'
          });
          agentInspector.update();
        }
      },
      onMeetingTableClick: () => {
        if (engine3D) {
          engine3D.triggerAllHandsStandup();
          terminalLog.addLog({
            agent: 'ARTHUR HQ',
            text: `📢 Sesi koordinasi ALL-HANDS STANDUP dipicu di meja rapat utama.`,
            type: 'warning'
          });
        }
      },
      onConveyorPodClick: (podIndex, slotNum) => {
        if (engine3D) {
          engine3D.focusConveyorPod(podIndex);
        }
        terminalLog.addLog({
          agent: 'RUNWAY SPATIAL',
          text: `🎯 Turntable Pod Slot ${slotNum} dipilih via klik 3D. Membuka workshop aset.`,
          type: 'info'
        });
        if (assetManagerModal) {
          assetManagerModal.open('deploy', { deployTarget: 'conveyor', slotIndex: podIndex });
        }
      },
      onSectorClick: (sectorId) => {
        const secMap = {
          weapon: 'sector_arsenal',
          mecha: 'sector_mecha',
          drone: 'sector_drone',
          quantum: 'sector_quantum',
        };
        if (engine3D && secMap[sectorId]) {
          engine3D.flyToSector(secMap[sectorId]);
        }
        terminalLog.addLog({
          agent: 'SECTOR SPATIAL',
          text: `🏛️ Sektor ${sectorId.toUpperCase()} dipilih via klik 3D. Membuka workshop aset.`,
          type: 'info'
        });
        if (assetManagerModal) {
          assetManagerModal.open('deploy', { deployTarget: 'sector', sectorId });
        }
      }
    });
    console.log('[DEBUG] engine3D created successfully');
    window.__office3d = engine3D;
    agentInspector.setEngine3D(engine3D);
  } catch (err) {
    console.error('[CRITICAL] Failed to initialize 3D Engine:', err);
    const errDiv = document.createElement('div');
    errDiv.id = 'critical3dError';
    errDiv.style.cssText = 'position:fixed;top:80px;left:20px;right:20px;background:#7f1d1d;color:#fff;padding:16px;z-index:99999;border-radius:8px;font-family:monospace;white-space:pre-wrap;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    errDiv.textContent = `[3D Engine Init Error]: ${err.message}\n\nStack:\n${err.stack}`;
    document.body.appendChild(errDiv);
    terminalLog.addLog({
      agent: 'STUDIO 3D ERROR',
      text: `Gagal memuat visual 3D: ${err.message}`,
      type: 'error'
    });
  }

  // 4. Initialize NOC 9-Screen Video Wall HUD Modal
  nocModal = new NocVideoWallModal({
    container: document.getElementById('nocVideoWallModalContainer'),
    videoWallTexture: engine3D?.videoWall,
    onBroadcastDirective: (text) => {
      terminalLog.addLog({
        agent: 'DIRECTOR HQ',
        text: `📢 ARAHAN RESMI TERSIAR KE MASTER VIDEO WALL: "${text}"`,
        type: 'system'
      });
      const director = registry.getById('audira_lead');
      if (director) {
        director.speak(`Pesan arahan resmi HQ terpasang di Video Wall!`);
      }
      if (engine3D) engine3D.syncAgents();
    },
    onClearDirective: () => {
      terminalLog.addLog({
        agent: 'STUDIO HQ',
        text: 'Feed standar 9-layar dipulihkan ke Master Production Wall.',
        type: 'system'
      });
    }
  });

  // 4b. Initialize Add Agent Onboarding Modal
  const addAgentModal = new AddAgentModal({
    container: document.getElementById('addAgentModalContainer'),
    registry,
    onAgentAdded: (newAgent) => {
      terminalLog.addLog({
        agent: 'ONBOARDING HQ',
        text: `📢 Operator Baru: ${newAgent.name} (${newAgent.role}) resmi bergabung di Stasiun Kerja Game Studio 3D.`,
        type: 'success'
      });
      if (engine3D) engine3D.syncAgents();
      if (sidebarNav) sidebarNav.refresh();
      if (engine3D) engine3D.followAgent(newAgent.id);
      agentInspector.setAgent(newAgent);
    }
  });

  // 4c. Persistent 3D Showcase State Management (Conveyor, Sectors, Agent Skins)
  const appliedShowcaseKey = { current: '' };

  const applyShowcaseState = async (state) => {
    if (!state || !engine3D) return;
    const stateKey = JSON.stringify(state);
    if (appliedShowcaseKey.current === stateKey) return;
    appliedShowcaseKey.current = stateKey;

    try {
      // 1. Conveyor Pods on the 56m Catwalk Runway
      if (state.conveyor) {
        for (let i = 0; i < 8; i++) {
          const pod = state.conveyor[i];
          if (pod && pod.modelUrl) {
            await engine3D.loadConveyorGLB(
              i,
              pod.modelUrl,
              pod.title,
              pod.sub,
              pod.targetHeight || 3.0,
              pod.clipName,
              pod.animSpeed,
              pod.shadingMode
            );
          } else {
            engine3D.clearConveyorPod(i);
          }
        }
      }

      // 2. Room Sectors (Mecha, Arsenal, Drone, Quantum)
      if (state.sectors) {
        for (const [sectorId, sec] of Object.entries(state.sectors)) {
          if (sec && sec.modelUrl) {
            await engine3D.mountSectorGLB(sectorId, sec.modelUrl, sec.targetHeight);
          } else {
            engine3D.clearSector(sectorId);
          }
        }
      }

      // 3. Agent Skins
      if (state.agentSkins) {
        for (const [agentName, skin] of Object.entries(state.agentSkins)) {
          const ag = registry.getAll().find(a => a.name === agentName);
          if (ag && skin && skin.modelUrl) {
            await engine3D.loadAgentGLB(agentName, skin.modelUrl);
            ag.modelUrl = skin.modelUrl;
            ag.modelName = skin.modelName || 'Custom Model';
            if (skin.locomotion) {
              ag.locomotionMode = skin.locomotion;
              engine3D.setAgentLocomotion(agentName, skin.locomotion);
            }
          }
        }
        registry.saveCustomAgents();
        agentInspector.update();
      }
    } catch (e) {
      console.warn('[ShowcaseSync] Error applying showcase state:', e);
    }
  };

  const loadInitialShowcaseState = async () => {
    let state = null;
    try {
      const endpoints = ['/api/showcase-state', 'http://localhost:8080/api/showcase-state'];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            if (data.state && (Object.keys(data.state.conveyor || {}).length > 0 || Object.keys(data.state.sectors || {}).length > 0)) {
              state = data.state;
              break;
            }
          }
        } catch (e) {}
      }
    } catch (e) {}

    // Check localStorage fallback
    if (!state) {
      try {
        const raw = localStorage.getItem('audira_showcase_state_v2');
        if (raw) state = JSON.parse(raw);
      } catch (e) {}
    }

    // Default presets on 56m runway if completely fresh/empty on first launch
    if (!state || (!state.conveyor && !state.sectors)) {
      state = {
        conveyor: {
          0: { modelUrl: 'preset://mecha', fileName: 'Mecha War Robot', title: '✦ POD 01 // MECHA TITAN', sub: '[ EXPO DISPLAY ]' },
          1: { modelUrl: 'preset://drone', fileName: 'Autonomous Drone', title: '✦ POD 02 // DRONE X-1', sub: '[ EXPO DISPLAY ]' },
          2: { modelUrl: 'preset://conveyor', fileName: 'Cyber Speeder', title: '✦ POD 03 // SPEEDER', sub: '[ EXPO DISPLAY ]' },
          3: { modelUrl: 'preset://quantum', fileName: 'Quantum Reactor', title: '✦ POD 04 // QUANTUM CORE', sub: '[ EXPO DISPLAY ]' }
        },
        sectors: {
          mecha: { modelUrl: 'preset://mecha', fileName: 'Mecha Titan 6.5m' },
          weapon: { modelUrl: 'preset://weapon', fileName: 'Plasma Cannon' }
        }
      };
      // Persist default demo state to backend
      fetch('/api/showcase-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => {});
    }

    await applyShowcaseState(state);
  };

  // 4d. Initialize 3D Asset & GLB Pipeline Workshop Modal
  assetManagerModal = new AssetManagerModal({
    container: document.getElementById('assetManagerModalContainer'),
    registry,
    engine3D,
    onShowcaseUpdated: (updatedState) => {
      applyShowcaseState(updatedState);
    },
    onDeployAsset: ({ type, agent, sector, fileName }) => {
      if (type === 'agent' && agent) {
        terminalLog.addLog({
          agent: '3D PIPELINE',
          text: `📦 Model 3D .glb (${fileName}) sukses dipasang ke avatar ${agent.name}! Disimpan permanen ke disk server.`,
          type: 'success'
        });
        agentInspector.update();
        if (sidebarNav) sidebarNav.refresh();
      } else {
        const sectorNames = {
          weapon: 'Sektor 01 // Arsenal & Weapon Lab (Meja Kalibrasi)',
          mecha: 'Sektor 02 // Exo-Armor & Mecha Bay (Turntable Hidrolik 6.5m)',
          drone: 'Sektor 04 // Drone Hangar (Helipad Peluncuran)',
          quantum: 'Sektor 05 // Quantum Core Reactor (Containment Chamber)',
          conveyor: 'Catwalk Conveyor Pameran Bergerak 56m'
        };
        terminalLog.addLog({
          agent: '3D PIPELINE',
          text: `🚀 Model 3D (${fileName}) sukses dideploy ke [${sectorNames[sector] || sector}] & dipersist ke disk server!`,
          type: 'success'
        });
      }
    }
  });
  window.__assetManagerModal = assetManagerModal;

  // 4e. Mount Grand 56m Catwalk Runway Controls Deck
  const runwayControlDeck = new RunwayControlDeck({
    container: document.getElementById('runwayControlDeckContainer'),
    engine3D,
    onOpenAssetManager: (tab, opts) => {
      if (assetManagerModal) assetManagerModal.open(tab, opts);
    },
    onOpenSlotWorkshop: (slotIdx) => {
      if (assetManagerModal) {
        assetManagerModal.open('deploy', { deployTarget: 'conveyor', slotIndex: slotIdx });
      }
    },
    onNotification: (log) => {
      terminalLog.addLog(log);
    }
  });
  window.__runwayDeck = runwayControlDeck;

  // 5. Initialize Multi-Agent Workflow Orchestrator
  const workflow = new MultiAgentWorkflow({
    registry,
    terminalLog,
    onLogUpdate: (logData) => {
      terminalLog.addLog(logData);
      agentInspector.update();
      if (engine3D) engine3D.syncAgents();
    }
  });

  // 6. Initialize External Live Agent Bridge (WebSocket)
  let sidebarNav = null;
  let controlBar = null;

  const bridge = new AgentBridge({
    registry,
    onStatusChange: (connected) => {
      if (sidebarNav) sidebarNav.setBridgeStatus(connected);
      if (controlBar) controlBar.setBridgeConnected(connected);
    },
    onLogUpdate: (logData) => {
      terminalLog.addLog(logData);
      agentInspector.update();
      if (engine3D) engine3D.syncAgents();
    },
    onShowcaseSync: (syncState) => {
      applyShowcaseState(syncState);
    },
    onHostMetricsUpdate: (metrics) => {
      if (controlBar) controlBar.updateHostMetrics(metrics);
    },
    onEcosystemUpdate: (eco) => {
      if (controlBar) controlBar.updateEcosystemHealth(eco);
    }
  });

  bridge.connect('ws://localhost:8080');

  // Initial fetch of real host hardware telemetry
  fetch('/api/host-metrics')
    .then(r => r.json())
    .then(data => {
      if (data.telemetry && controlBar) {
        controlBar.updateHostMetrics(data.telemetry);
      }
    })
    .catch(() => {});

  // Initial fetch of ecosystem multi-service health
  fetch('/api/ecosystem-status')
    .then(r => r.json())
    .then(data => {
      if (data.ecosystem && controlBar) {
        controlBar.updateEcosystemHealth(data.ecosystem);
      }
    })
    .catch(() => {});

  // Load persistent showcase models on boot
  loadInitialShowcaseState();

  // 7. Mount Left Sidebar Navigation (AUDIRA-DCOS Style)
  sidebarNav = new SidebarNav({
    container: document.getElementById('leftSidebarNav'),
    engine3D,
    registry,
    workflow,
    bridge,
    onSelectAgent: (agent) => {
      agentInspector.setAgent(agent);
      if (engine3D) engine3D.followAgent(agent.id);
    },
    onOpenVideoWall: () => {
      if (nocModal) nocModal.open();
    },
    onOpenAssetLibrary: () => {
      assetManagerModal.open('library');
    },
    onOpenAssetManager: (tab = 'deploy') => {
      assetManagerModal.open(tab);
    },
    onToggleInspector: () => {
      agentInspector.toggle();
    },
    onToggleTerminal: () => {
      terminalLog.toggleMinimize();
    },
    onToggleZen: () => {
      toggleZen();
    },
    onOpenAddAgent: () => {
      addAgentModal.open();
    },
    onOpenAiConfig: () => {
      aiConfigModal.open();
    }
  });

  // 8. Mount Top Header & Breadcrumb Bar
  controlBar = new ControlBar({
    container: document.getElementById('topControlBar'),
    engine3D,
    registry,
    bridge,
    onSelectAgent: (agent) => {
      agentInspector.setAgent(agent);
      if (engine3D) engine3D.followAgent(agent.id);
    },
    onOpenVideoWall: () => {
      if (nocModal) nocModal.open();
    },
    onOpenAssetManager: () => {
      assetManagerModal.open();
    },
    onOpenAiConfig: () => {
      aiConfigModal.open();
    },
    onToggleInspector: () => {
      agentInspector.toggle();
    },
    onToggleTerminal: () => {
      terminalLog.toggleMinimize();
    },
    onToggleZen: () => {
      toggleZen();
    },
    onToggleSidebar: () => {
      if (sidebarNav) sidebarNav.toggleCollapse();
    },
    onToggleRunwayDeck: () => {
      if (runwayControlDeck) runwayControlDeck.toggle();
    }
  });

  // 9. Mount 3D Camera Pan / Geser & Sector Navigation Gizmo HUD
  const cameraNavGizmo = new CameraNavGizmo({
    container: document.getElementById('cameraNavGizmoContainer'),
    engine3D,
    onNavigateSector: (sectorKey) => {
      terminalLog.addLog({
        agent: 'NAVIGASI SPASIAL',
        text: `Kamera bergeser ke sektor [${sectorKey}].`,
        type: 'info'
      });
    }
  });

  // 10. Mount Bottom Prompt Dispatcher
  new TaskBar({
    container: document.getElementById('bottomTaskBarContainer'),
    workflow,
    onSelectAgent: (agent) => {
      agentInspector.setAgent(agent);
    },
    onOpenAiConfig: () => {
      aiConfigModal.open();
    }
  });

  // 10. Initial active agent
  const defaultAgent = registry.getById('audira_lead') || registry.getAll()[0];
  if (defaultAgent) {
    agentInspector.currentAgent = defaultAgent;
    if (engine3D) engine3D.selectedAgentId = defaultAgent.id;
  }

  setInterval(() => {
    agentInspector.update();
  }, 250);

  terminalLog.addLog({
    agent: 'AUDIRA STUDIO',
    text: 'Pusat Komando 3D Game Studio (Three.js) & Master Production Wall aktif.',
    type: 'system'
  });

  window.__audiraApp = {
    registry,
    engine3D,
    sidebarNav,
    addAgentModal,
    cameraNavGizmo,
    assetManagerModal,
    aiConfigModal
  };

  console.log('AUDIRA STUDIO 3D Command Center initialized successfully.');
});
