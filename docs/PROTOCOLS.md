# Protocols: A2A & MCP
Status: Phase 2 – Foundational Documentation

This document provides a deeper, implementation-oriented view of the **protocol adapters** powering interoperability.

---
## 1. Philosophy
Protocols are treated as *adapters* in the Hexagonal Architecture. They never contain business logic; instead they:
- Normalize inbound network payloads.
- Translate them into orchestrator/domain calls.
- Map results/errors back to protocol-compliant responses.

This preserves the **replaceability** of agents, LLM providers, and tools without cross-coupling concerns.

---
## 2. Agent-to-Agent (A2A) Protocol
### 2.1 Goals
| Goal | Description |
|------|-------------|
| Discovery | Enumerate locally registered agents over HTTP. |
| Invocation | Execute an internal agent run via a POST request. |
| Toolification | Allow other agents (local or remote) to treat an internal agent like a tool. |
| Extensibility | Support future auth, capability metadata, and streaming. |

### 2.2 Planned Endpoints (Phase 3)
| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| GET | `/agents` | List agents | Returns name, description, (future) capabilities |
| GET | `/agents/:name` | Agent metadata | 404 if unknown |
| POST | `/agents/:name/run` | Execute prompt | Body: `{ prompt: string }` (will evolve) |

### 2.3 Request Validation
Performed with `zod` schemas (planned):
- `prompt`: non-empty, max length boundary aligned with guardrails input limit.
- Future: optional `sessionId`, `context`, `toolsPolicy`.

### 2.4 Execution Flow
```
HTTP POST /agents/:name/run
  -> Lookup agent in registry
  -> Orchestrator.runAgentStream()
    -> Guardrails (input)
    -> Build graph with injected LLMStrategy
    -> Stream internal states (currently aggregated into a final result for HTTP)
    -> Guardrails (output)
  -> Return JSON { result, meta }
```

### 2.5 Error Normalization
| Domain Error | HTTP Code | Payload Shape |
|--------------|-----------|---------------|
| AgentNotFoundError | 404 | `{ error: 'agent_not_found', message }` |
| GuardrailViolationError | 400 | `{ error: 'guardrail_violation', message, details }` |
| ProviderInitError | 500 | `{ error: 'llm_init_failed', message }` |
| Unknown | 500 | `{ error: 'internal_error', message: 'Unexpected failure' }` |

### 2.6 Streaming (Future)
Upgrade path: Server-Sent Events (SSE) endpoint `/agents/:name/stream` streaming events:
```
event: state
data: { token: "..." }

event: result
data: { content: "final" }
```
Fallback to chunked JSON or WebSocket if richer bi-directional semantics needed.

### 2.7 Security Roadmap
1. **Phase 3**: Size limits & basic rate limiting (per-IP bucket).
2. **Phase 4**: Bearer token or HMAC signature per request.
3. **Phase 5**: Signed agent capability documents + trust registry.

---
## 3. MCP (Model Context Protocol)
### 3.1 Purpose
Enable agents to dynamically load tool surfaces hosted by MCP servers, unifying external context (time, filesystem, analysis) behind consistent LangChain tool interfaces.

### 3.2 Tool Wrapper: `mcp-client-tool.ts`
| Aspect | Description |
|--------|-------------|
| Input | `{ serverUrl: string, prompt: string }` |
| Action | Connect/load tools (cached), invoke generic or selected tool |
| Output | Stringified tool result (structured JSON preserved where possible) |
| Error Handling | Wraps transport/service errors into `ToolExecutionError` (planned) |

### 3.3 Multi-Server Strategy
The example agent uses `MultiServerMCPClient` with a mapping:
```
{ time: { url: "https://host/v0/mcps/time/mcp", transport: 'http' } }
```
Tool names are prefixed with `mcp_<server>_<original>` to prevent collisions.

### 3.4 Caching
Initial implementation: in-memory tool list cache per server URL.
Future enhancements: TTL-based invalidation, ETag negotiation, offline fallback snapshot.

### 3.5 Failure Modes
| Case | Mitigation |
|------|------------|
| Server unreachable | Return structured tool error; agent may fallback. |
| Tool not found | Surface hint listing available tools. |
| Rate limited | Expose `retryAfter` metadata for planner (future). |

---
## 4. Client Tool Patterns
Both A2A and MCP client tools rely on a shared approach:
1. Validate input schema.
2. Optionally fetch & cache remote metadata.
3. Invoke remote endpoint/tool.
4. Normalize result into a string or structured JSON string.
5. Throw typed errors for domain-distinguishable issues.

---
## 5. Versioning Strategy
- Protocol adapters versioned implicitly with the application.
- Backward-incompatible endpoint changes require a new base path (`/v1/agents/...`).
- Client tools may include a `protocolVersion` constant enabling compatibility checks.

---
## 6. Testing Approach
| Layer | Test Type | Focus |
|-------|-----------|-------|
| A2A Server | Unit (with supertest or mocked express) | Route wiring, error mapping |
| A2A Client Tool | Unit (nock/http mocking) | Remote call + response shaping |
| MCP Client Tool | Unit | Tool enumeration + invocation path |
| Integration (future) | End-to-end | Orchestrator + protocol roundtrip |

---
## 7. Future Protocol Candidates
| Protocol | Rationale |
|----------|-----------|
| WebRTC Mesh | Low-latency peer agent collaboration |
| GRPC | Strong schema + multiplexing for high-throughput scenarios |
| SSE Streaming | Lightweight progressive output for UIs |

---
## 8. Contribution Guidelines
- Add new protocol files under `electron/protocols/` with explicit name tokens (`<name>-server.ts`, `<name>-client-tool.ts`).
- Update `ARCHITECTURE.md` and this file with endpoints & responsibilities.
- Provide at least one unit test per new protocol adapter.

---
## 9. Glossary
| Term | Meaning |
|------|---------|
| Agent Card | Metadata document describing an agent’s name/capabilities (planned) |
| Toolification | Treating a remote agent as a callable tool inside a graph |
| Normalization | Converting domain outputs to protocol shapes |

---
This document evolves; keep it current with each protocol enhancement.

