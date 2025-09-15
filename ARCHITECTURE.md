# ARCHITECTURE

Status: Phase 2 (Foundational Documentation) – Last updated 2025-09-12

## 1. Architectural Overview
This project implements a **Hexagonal (Ports & Adapters) Architecture** for an **agentic desktop application** built with **Electron (Main/Renderer), Vite, React, TypeScript**, and **LangChain / LangGraph**.

The goal: Provide a system that is crystal clear to both humans and AI coding agents. Every file name, symbol, and layer signals its intent using a **Pattern-Driven Naming (PDN)** convention.

## 2. High-Level Runtime Model
```
┌─────────────────────────────────────────────────────────────────────┐
│                          Electron Application                       │
│                                                                     │
│  ┌───────────────┐    IPC (secure, typed)    ┌───────────────────┐  │
│  │   MAIN (Hex)  │ <------------------------> │   RENDERER (UI)   │  │
│  └───────────────┘                           └───────────────────┘  │
│          ▲                                                         │
│          │ Ports (Interfaces)                                      │
│          │                                                         │
│   ┌──────────────┐   ┌────────────────┐   ┌────────────────────┐   │
│   │ LLM Strategy │   │  Agent Registry│   │  Guardrails Engine │   │
│   └──────────────┘   └────────────────┘   └────────────────────┘   │
│          │                │                     │                  │
│          ▼                ▼                     ▼                  │
│   ┌──────────────┐  ┌───────────────┐   ┌────────────────────┐     │
│   │ Vertex AI     │  │ MCP Tooling   │   │  HITL (future)     │     │
│   │ OpenAI (todo) │  │ A2A Network   │   │  Telemetry (todo)  │     │
│   └──────────────┘  └───────────────┘   └────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Hexagon Definition
The **Hexagon (Core Domain)** resides in the Electron **Main Process** and is composed of:  
- `Agent Orchestrator` (execution lifecycle & streaming)  
- `Agent Definitions` (graph builders)  
- `LLM Strategy Port` (interface)  
- `Guardrails` (domain safety policies)  
- `Registry` (discovery of agents)  
- (Planned) `Coordinator / Planner` (multi-agent routing)  

Everything else (LLM providers, MCP tools, UI, human input, environment, filesystem, network protocols) are **Adapters** that implement or speak through **Ports**.

### Core Principles
1. **Isolation of Decisions** – Swapping an LLM provider should not affect agent logic.  
2. **Fully Typed Boundaries** – Every IPC call maps to a contract described in a `.d.ts` file.  
3. **Progressive Enhancement** – Additional agents, tools, providers, or guardrail policies can be layered without refactoring existing code.  
4. **AI Navigability** – Small modules > convenience monoliths. Each file focuses on a single concept.

## 4. Protocol-Driven Interoperability (A2A & MCP)
**Protocols are first-class citizens** in this architecture. They operationalize interoperability so internal agents can both expose and consume capabilities across an open agent ecosystem.

### 4.1 Agent-to-Agent (A2A) Protocol
The A2A protocol provides a bidirectional interaction model for autonomous and semi-autonomous agents.
- **Server Adapter (`protocols/a2a-server.ts`)**: Hosts an HTTP (Express) entrypoint that enumerates all registered internal agents and exposes a per-agent execution endpoint. Each internal `AgentDefinition` is wrapped in an execution shim that translates protocol messages into orchestrator runs.
- **Client Tool (`protocols/a2a-client-tool.ts`)**: A LangChain `DynamicTool` enabling any local agent to call a remote A2A-compliant agent (identified by its “agent card” URL). This turns every external agent into an on-demand tool within local reasoning graphs.
- **Lifecycle Mapping**:
  - A2A request → Orchestrator run (stream) → Aggregated result returned.
  - Errors standardized into protocol-level error payloads.
- **Planned Extensions**: Capability discovery, streaming token relay, authentication hooks, signed agent cards.

### 4.2 Model Context Protocol (MCP)
MCP standardizes access to external tool surfaces and contextual data sources.
- **Client Tool (`protocols/mcp-client-tool.ts`)**: Generic LangChain `DynamicTool` that—given a server URL + prompt—fetches or invokes MCP-provided tools. This collapses the gap between local agent reasoning and remote tool ecosystems.
- **Multi-Server Aggregation**: Individual agents (e.g., React Agent) may load multiple MCP servers (time, filesystem, knowledge bases) and unify their tools under a predictable name prefix, preserving disambiguation.
- **Future Directions**: Tool capability caching, semantic tool selection, offline fallback stubs.

### 4.3 Architectural Role of Protocols
| Concern | A2A | MCP |
|---------|-----|-----|
| Primary Purpose | Agent collaboration | Tool & context acquisition |
| Boundary Layer | Network adapter (server + client) | Network adapter (client only) |
| Port Consumed | Agent orchestrator port | Tool invocation abstractions |
| Error Handling | Standard error normalization | Tool-level exception mapping |
| Extensibility | Add auth / discovery endpoints | Add tool metadata enrichment |

### 4.4 Decoupling Guarantees
- Core agent logic does not import protocol server code (no inward dependency).  
- Protocol adapters never embed business logic; they translate request → orchestrator contract.  
- Adding a new protocol (e.g., WebRTC agent mesh) requires only a new `protocols/<name>-server.ts` and optionally `<name>-client-tool.ts`.

## 5. Layer Mapping
| Layer | Purpose | Examples |
|-------|---------|----------|
| Domain Core | Agent lifecycle + policies | `agentExecutor.ts`, `guardrails.ts` |
| Ports | Contracts (`interfaces`) | `LLMStrategy`, `AgentDefinition` |
| Adapters | Concrete implementations | `vertexAI.adapter.ts` (future), `reactMCPAgent.definition.ts` |
| Orchestration | Streaming, error surface | `agentExecutor.ts` |
| Protocols | External interoperability | `a2a-server.ts`, `mcp-client-tool.ts` |
| Presentation | UI (Renderer) | `App.tsx` |
| IPC Bridge | Secure API surface | `preload.ts` |
| Tooling | MCP, future local tools | `reactMCPAgent.definition.ts` |

## 6. Execution Flow (Single Run)
```
Renderer submits prompt -> IPC (run-agent-stream) -> Orchestrator
  -> Loads AgentDefinition from Registry
  -> Builds graph with injected LLMStrategy
  -> Applies input guardrails
  -> Streams LangGraph events
    -> Interprets tool calls / (future) HITL pauses
  -> Applies output guardrails
  -> Emits state/result events back over IPC
  -> Renderer updates UI incrementally
```

## 7. Guardrails (Initial Scope)
Guardrails provide light-weight pre/post execution policies and are intentionally simple in Phase 2:
- Input: length limits, prompt injection heuristic placeholder
- Output: content length & placeholder toxicity scan
- Future: policy chains, external moderation API integration, redaction filters

## 8. Multi-Agent and Coordination (Planned)
The near-term evolution introduces:
- A **Coordinator (Planner)** that routes tasks to specialized agents based on capability metadata.
- A **Task Graph** (meta-level) enabling decomposition & aggregation.
- A **Capability Registry** indexing agent declared competencies.

## 9. Human-in-the-Loop (HITL) (Planned)
Future events of type `hitl` will pause execution and require renderer-provided input. The orchestrator will maintain a run context state machine with transitions: `idle -> running -> awaiting_human -> resumed -> complete`.

## 10. Naming & Structure (PDN Recap)
- `*.definition.ts` – Declares an agent as a domain-capable participant (builds a graph).
- `*Registry.ts` – Central registry pattern (add/list/remove operations).
- `*Strategy.ts` – Interface describing a pluggable algorithm family.
- `*Factory.ts` – Entity responsible for selection/creation of strategies.
- `*.adapter.ts` – Concrete implementation of a strategy port that integrates external service.
- `*.orchestrator.ts` (or `agentExecutor.ts`) – Lifecycle manager.
- `guardrails.ts` – Policy entry points (`applyInputGuardrail`, `applyOutputGuardrail`).

## 11. Extensibility Scenarios
| Scenario | Add / Change | No Changes To |
|----------|--------------|---------------|
| New LLM provider | `providers/<name>.adapter.ts`, switch in factory | Agents, Guardrails |
| New Agent | `<agentName>Agent.definition.ts`, register | LLM strategy, other agents |
| Better Guardrails | Extend `guardrails.ts` | Agents, UI |
| Add HITL | Add HITL channel + orchestrator state | Existing strategies/providers |
| Add Telemetry | Implement metrics adapter | Core logic (inject hooks) |
| New Protocol | `protocols/<p>-server.ts` / `<p>-client-tool.ts` | Agent definitions |

## 12. Security Considerations
- **Preload Isolation**: Only whitelisted APIs exposed (`window.electron.*`).
- **No Dynamic Eval**: Agent graphs instantiated via controlled factory paths.
- **LLM Prompt Safety**: Guardrails mitigate trivial prompt injection (expand later).
- **IPC Validation**: Inputs will be structurally validated before execution (Phase 3 target).
- **Protocol Surface Hardening**: A2A server sanitizes and bounds request size; future auth tokens.

## 13. Testing Strategy (Planned)
| Test Type | Focus | Example |
|-----------|-------|---------|
| Unit | Guardrail decisions | `guardrails.test.ts` |
| Unit | Factory resolution | `llmFactory.test.ts` |
| Unit | Registry operations | `agentRegistry.test.ts` |
| Component | Rendering & streaming integration | `appRender.test.tsx` |
| Protocol | A2A server routing | `a2aServer.test.ts` |
| Future Integration | Multi-agent planning | `agentPlanner.test.ts` |

## 14. Future Enhancements
- OpenTelemetry integration
- Capability graph introspection endpoint
- Structured logger + log level control
- Protocol auth & agent identity signatures
- Configuration layering (`.env`, overrides, runtime flags)

## 15. Conventions
- Prefer pure functions for domain logic.
- Keep side-effects (I/O, network) inside adapters / protocol boundaries.
- JSDoc every exported symbol (Phase 3+ requirement).
- Avoid global singletons except controlled registries (with reset for tests).

---
This document evolves with each phase. All new modules must reference the intent described here.
