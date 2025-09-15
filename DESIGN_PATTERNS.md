# DESIGN_PATTERNS
Status: Phase 2 – Last updated 2025-09-12

This document catalogs the intentional design patterns used in the codebase. It serves as a navigational index for both human contributors and AI coding agents.

---
## 1. Catalog Overview
| Pattern | Purpose | Where Used | Expansion Path |
|---------|---------|------------|----------------|
| Factory | Centralized creation logic with environment/policy branching | `llmFactory` | Add caching, lazy remote config |
| Strategy | Swappable algorithm/adapter contract | `LLMStrategy` | Add advanced routing / ensemble strategies |
| Adapter | External integration behind a stable port | `vertexAI.adapter.ts` (planned) | Add OpenAI, Mock, Ollama |
| Protocol Adapter | Network protocol surface (server/client) bridging domain orchestrator | `a2a-server.ts`, `a2a-client-tool.ts`, `mcp-client-tool.ts` | Auth, discovery, streaming relay |
| Registry | Dynamic discovery & lifecycle of domain participants | `agentRegistry` | Add deregistration, capability indexing |
| Orchestrator | Coordinates multi-step execution + streaming | `agentExecutor` | Add planner, cancellation, checkpoints |
| Guardrail | Pre/Post policy enforcement | `guardrails` | Chain-of-responsibility, external moderation APIs |
| Provider/Container (UI) | Separation of stateful logic from pure presentation | Future React components | Add suspense boundaries + streaming updates |
| Hook Abstraction | Encapsulate stateful subscriptions | `useAgentStream` (planned) | Add reconnection, retry policies |
| State Machine (Planned) | Predictable lifecycle modeling | Orchestrator redesign | Persist transitions, visual debugging |
| Planner (Planned) | Task decomposition & routing | `agentPlanner` | Multi-agent negotiation |

---
## 2. Core Pattern Narratives
### 2.1 Factory Pattern (`llmFactory`)
Central point to resolve an `LLMStrategy` implementation based on environment (`LLM_PROVIDER`). This prevents provider-specific conditionals from leaking into domain logic.

Principles:
- Single responsibility: provider selection
- No side-effects until instance is required
- Deterministic for test harnesses (enable mock provider)

### 2.2 Strategy Pattern (`LLMStrategy`)
Defines the minimal contract for all language model adapters. Separates *how* a response is generated from *when* and *why* it is invoked.

Benefits:
- Swap providers without touching agent definitions
- Easy to simulate behavior in tests

### 2.3 Adapter Pattern (`*.adapter.ts`)
Concrete bridge to external services (LLM APIs, tools). Maintains pure translation boundary: domain input → provider format → domain output.

Guidelines:
- Contain all network I/O
- Translate errors into typed domain errors
- NEVER embed business logic

### 2.4 Protocol Adapter Pattern (`protocols/*`)
Specialized form of Adapter focused on **interoperability protocols** (A2A, MCP). Unlike simple service adapters, protocol adapters may expose multiple routes / tool surfaces but remain thin translation layers.

Components:
- **Server Adapters**: e.g., `a2a-server.ts` hosting HTTP endpoints that enumerate & execute internal agents.
- **Client Tools**: e.g., `a2a-client-tool.ts`, `mcp-client-tool.ts` providing LangChain `DynamicTool` wrappers so protocol calls appear as normal tool invocations inside agent graphs.

Responsibilities:
- Normalize inbound requests (validate, constrain size)
- Invoke orchestrator or tool invocation path
- Map domain / orchestrator results into protocol-compliant responses
- Surface errors with structured, non-leaky messages

Non-Responsibilities:
- Business logic, planning, guardrail policy decisions
- Long-term state persistence

Extension Paths:
- Add authentication / tokens
- Streaming token proxy (SSE / WebSocket)
- Capability discovery endpoint (`/agents/:name/capabilities`)

### 2.5 Registry Pattern (`agentRegistry`)
Holds declarations of available agents. Provides introspection (`listAgents`) and retrieval (`getAgent`).

Planned Enhancements:
- Capability tagging
- Priority resolution for planner
- Hot reloading in dev

### 2.6 Orchestrator Pattern (`agentExecutor`)
Executes an agent run from start to completion while streaming intermediate states back to the renderer.

Responsibilities:
- Input validation & guardrails
- Graph construction (via agent definition)
- Event streaming translation
- Terminal condition detection
- Output guardrails & error surfacing

Non-responsibilities:
- UI formatting
- Provider-specific behaviors
- Long-term persistence

### 2.7 Guardrails Pattern (`guardrails`)
Central policy hooks called at execution boundaries. Divides safety concerns from business logic.

Initial Scope:
- Input prompt length & naive injection heuristic
- Output length & placeholder toxicity check

Future:
- Policy composition graph
- Configurable allow/deny classification actions
- External moderation services (OpenAI Moderation, custom classifiers)

### 2.8 Provider / Container UI Pattern
Renderer components separate stateful service coordination (Containers) from pure presentational components (Presenters). Enhances testability and reuse.

### 2.9 Hook Abstraction (`useAgentStream`)
Will encapsulate subscription to IPC streaming events, incremental state handling, and cleanup.

### 2.10 Planned: Coordinator / Planner
A meta-agent constructing a *task plan* selecting specialized agents based on capability metadata. Will integrate with the orchestrator to manage sub-run lifecycles.

---
## 3. Pattern Decision Matrix
| Consideration | Chosen Pattern | Justification |
|---------------|----------------|---------------|
| LLM decoupling | Strategy + Factory | Feature growth + test isolation |
| Dynamic Agents | Registry | Simple runtime extensibility |
| Streaming Execution | Orchestrator | Separation from UI/transport |
| Safety Controls | Guardrails | Replaceable policy layer |
| Multi-provider LLM | Adapter | Each provider stays isolated |
| Interoperability | Protocol Adapter | Clean boundary, future auth & discovery |
| HITL Support | Orchestrator (events) | Central gate for pause/resume |

---
## 4. LLM-Centric Development Philosophy
This codebase is intentionally **LLM-friendly**—optimized for comprehension and safe modification by AI coding assistants.

### 4.1 Pattern-Driven Naming (PDN)
The naming scheme encodes intent:
- `*.definition.ts` – Declarative agent modules returning executable graphs.
- `*Strategy.ts` – Interface-only contract for a behavioral family.
- `*Factory.ts` – Entity responsible for selection/creation of strategies.
- `*.adapter.ts` – External integration surface (pure mapping logic).
- `*Registry.ts` – Shared lookup store with stable API.
- `*.orchestrator.ts` – Execution lifecycle & coordination (may keep legacy name with strong JSDoc if rename impractical).
- `guardrails.ts` – Safety entry points only; no unrelated logic.
- `*.types.d.ts` – Pure type declarations (no runtime side-effects).
- `a2a-server.ts` / `a2a-client-tool.ts` / `mcp-client-tool.ts` – Protocol adapters (server vs client tool).

### 4.2 Small Modules, Sharp Edges
- Every file has **one reason to change**.
- Public APIs intentionally compact (explicit exports, no wildcard flooding).
- JSDoc describes “purpose, inputs, outputs, error modes, extension notes.”

### 4.3 Deterministic & Testable
- Pure functions preferred.
- External I/O localized in adapters / protocol boundaries.
- Mock strategy enables deterministic tests.

### 4.4 Change Safety Principles
| If You Want To | Do This | Avoid |
|----------------|---------|-------|
| Add a provider | New `*.adapter.ts` + factory case | Editing agents directly |
| Add a guardrail | Extend functions or compose internally | Inlining checks in orchestrator |
| Add agent | New `*.definition.ts` + registry entry | Modifying registry internals |
| Add planner | New module; call from orchestrator | Embedding planning in agents |
| Add protocol | New server/client tool file in `protocols/` | Embedding network logic in agents |

---
## 5. Extension Recipes
### 5.1 Add OpenAI Provider
1. `electron/llm/providers/openAI.adapter.ts`
2. Implement `createOpenAIStrategy()` returning `LLMStrategy`.
3. Add switch case in `llmFactory.ts` for `openai`.
4. Document required env vars in README.
5. Add adapter test with mocked transport.

### 5.2 Add HITL Pause
1. Introduce event type `hitl`.
2. Orchestrator emits when agent requests human input (tool call classification or explicit directive).
3. Renderer shows modal → user response via `submitHumanInput` IPC.
4. Orchestrator resumes run context.

### 5.3 Add Capability-Based Routing
1. Extend agent definitions with `capabilities: string[]`.
2. Build `agentPlanner` to choose agents by capability.
3. Orchestrator delegates sub-tasks; aggregates responses.

### 5.4 Add New Protocol (Example: WebRTC)
1. `protocols/webrtc-server.ts` hosting offer/answer exchange.
2. `protocols/webrtc-client-tool.ts` wrapping remote invocation via data channel.
3. Add auth & session lifecycle tests.

---
## 6. Documentation Standard (JSDoc Template)
```
/**
 * One-line intent summary.
 *
 * Extended rationale (why this exists, NOT how JS works).
 * @param input - (Shape + critical invariants)
 * @returns Output description
 * @throws SpecificErrorType When condition
 * @extension Add new strategies by X (if relevant)
 */
```

---
## 7. Anti-Patterns to Avoid
| Anti-Pattern | Risk | Alternative |
|--------------|------|------------|
| Huge util files | Cognitive overload | Single-purpose modules |
| Silent catch-all errors | Masked failures | Typed domain errors + logging |
| Mixed concerns in adapters | Test brittleness | Keep adapters pure |
| IPC channel strings inline | Drift & typos | Central constants module |
| Overuse of dynamic reflection | Opaque to AI | Explicit registry maps |
| Protocol logic in agents | Coupling, inflexibility | Dedicated `protocols/` adapters |

---
## 8. Roadmap Alignment
Patterns introduced now are minimal but intentionally positioned for:
- Multi-agent orchestration
- Policy layering
- Deterministic simulation/testing
- Safe AI refactors (semantic clarity)

---
## 9. Maintenance Guidelines
- Keep PRs pattern-scoped ("Add OpenAI adapter" not "misc updates").
- Update this document when a new pattern or variation is introduced.
- Prefer additive changes; refactors require clear commit rationale lines.

---
## 10. Glossary
| Term | Meaning |
|------|---------|
| Port | Interface describing a boundary contract |
| Adapter | Implementation of a port integrating an external system |
| Protocol Adapter | Server/client module mediating standardized inter-agent or tool protocols |
| Strategy | Swappable algorithm family behind a stable interface |
| Orchestrator | High-level execution coordinator |
| HITL | Human-In-The-Loop intervention point |
| MCP | Model Context Protocol (tool interoperability) |
| A2A | Agent-to-Agent protocol (inter-agent collaboration) |

---
This document evolves continuously; treat it as a first-class artifact.
