/**
 * AgentBridge.js - WebSocket & Event Bridge for External AI Agents
 * Connects Python/Node.js multi-agent frameworks (CrewAI, LangGraph, AutoGen)
 * to animate the virtual office in real-time.
 */

import { AGENT_STATES } from '../utils/constants.js';

export class AgentBridge {
  constructor({ registry, pathFinder, onStatusChange, onLogUpdate, onShowcaseSync, onHostMetricsUpdate, onEcosystemUpdate }) {
    this.registry = registry;
    this.pathFinder = pathFinder;
    this.onStatusChange = onStatusChange || (() => {});
    this.onLogUpdate = onLogUpdate || (() => {});
    this.onShowcaseSync = onShowcaseSync || (() => {});
    this.onHostMetricsUpdate = onHostMetricsUpdate || (() => {});
    this.onEcosystemUpdate = onEcosystemUpdate || (() => {});

    this.ws = null;
    this.connected = false;
    this.reconnectTimer = null;
    this.serverUrl = 'ws://localhost:8080';
  }

  connect(url = 'ws://localhost:8080') {
    this.serverUrl = url;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connected = true;
        this.onStatusChange(true);
        this.onLogUpdate({
          agent: 'Bridge',
          text: `⚡ Connected to Live Agent Server (${url})`,
          type: 'system'
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingAgentEvent(payload);
        } catch (e) {
          console.warn('Failed to parse agent event payload:', e);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.onStatusChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        this.onStatusChange(false);
      };
    } catch (e) {
      this.connected = false;
      this.onStatusChange(false);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.connected) {
        this.connect(this.serverUrl);
      }
    }, 4000);
  }

  // Handle incoming event from external real AI agent
  handleIncomingAgentEvent(evt) {
    if (!evt) return;

    // Handle real-time host hardware telemetry from server
    if (evt.type === 'HOST_METRICS_UPDATE' && evt.telemetry) {
      this.onHostMetricsUpdate(evt.telemetry);
      return;
    }

    // Handle multi-service ecosystem health stream from server
    if (evt.type === 'ECOSYSTEM_HEALTH_UPDATE' && evt.ecosystem) {
      this.onEcosystemUpdate(evt.ecosystem);
      return;
    }

    // Handle persistent 3D showcase state & host telemetry sync from server
    if (evt.type === 'WELCOME_SYNC') {
      if (evt.showcaseState) this.onShowcaseSync(evt.showcaseState);
      if (evt.hostTelemetry) this.onHostMetricsUpdate(evt.hostTelemetry);
      if (evt.ecosystemHealth) this.onEcosystemUpdate(evt.ecosystemHealth);
      return;
    } else if (evt.type === 'SHOWCASE_STATE_UPDATED' && evt.state) {
      this.onShowcaseSync(evt.state);
      return;
    }

    // Expected evt schema for AI Agents:
    // { role: 'DEV'|'PM'|'QA'|'DEVOPS', action: 'coding'|'thinking'|'idle'|'walking'|'coffee', task: string, tool: string, speech: string, tokens: number }
    if (!evt.role) return;

    const agent = this.registry.getByRole(evt.role.toUpperCase());
    if (!agent) return;

    if (evt.task) {
      agent.setTask(evt.task, evt.tool || null);
    }

    if (evt.action && Object.values(AGENT_STATES).includes(evt.action)) {
      agent.state = evt.action;
    }

    if (evt.speech) {
      agent.speak(evt.speech);
    }

    if (evt.tokens) {
      agent.consumeTokens(evt.tokens);
    }

    if (evt.targetCoord) {
      agent.navigateTo(evt.targetCoord.x, evt.targetCoord.y, this.pathFinder);
    }

    this.onLogUpdate({
      agent: agent.name,
      text: evt.log || evt.speech || `Executed action: ${evt.action}`,
      type: evt.action || 'info'
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.onStatusChange(false);
  }
}
