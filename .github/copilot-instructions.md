# Copilot Project Instructions

Purpose: Prime AI assistants (GitHub Copilot / future LLM agents) with the architectural philosophy, naming conventions, and extension guidelines for this repository.

## Core Architectural Philosophy
1. Hexagonal Architecture (Ports & Adapters) – Main process domain core; providers, tools, UI, protocol servers/clients are adapters.
2. Pattern-Driven Naming (PDN) – File/function names encode architectural role.
3. Protocol-Driven Interoperability – A2A (Agent-to-Agent) and MCP (Model Context Protocol) are first-class adapters for collaboration & tool acquisition.
4. Multi-Agent Evolution – Registry + Orchestrator now; Planner/Coordinator later.
5. AI-Friendliness – Small modules, explicit interfaces, exhaustive JSDoc on exports (Phase 3+).

## Pattern-Driven Naming (PDN)
| Suffix / Pattern | Meaning |
|------------------|---------|
| `*.definition.ts` | Declares an agent (builds graph) |
| `*Registry.ts` | Registry pattern (register/list) |
| `*Strategy.ts` | Interface for pluggable behavior |
| `*Factory.ts` | Creates a strategy implementation |
| `*.adapter.ts` | External integration (LLM/tool/protocol) |
| `*.orchestrator.ts` | Execution lifecycle manager |
| `guardrails.ts` | Input/output policy hooks |
| `*.types.d.ts` | Type-only declarations |
| `a2a-server.ts` | A2A protocol server adapter |
| `a2a-client-tool.ts` | LangChain DynamicTool for remote A2A agent |
| `mcp-client-tool.ts` | LangChain DynamicTool for generic MCP invocation |

Exports must be intention-revealing (verbs for functions, nouns for contracts):
- Functions: `createLLMStrategy`, `applyInputGuardrail`, `registerAgent`, `startA2AServer`, `createMCPClientTool`.
- Types: `AgentDefinition`, `LLMStrategy`, `GuardrailResult`.

## Protocol Roles (Quick)
- **A2A Server**: Exposes internal agents via HTTP/JSON for external agents.
- **A2A Client Tool**: Lets local agents call remote agents (treat as a tool).
- **MCP Client Tool**: Lets local agents access *any* MCP server’s tools dynamically.

## Extension Recipes (Quick)
Add LLM Provider:
1. New `electron/llm/providers/<name>.adapter.ts`
2. Add case in `llmFactory.ts`
3. Test with a mock adapter if possible

Add Agent:
1. New `<agentName>Agent.definition.ts`
2. Register in `agentRegistry.ts`

Add Guardrail:
1. Extend functions in `guardrails.ts`
2. Return structured results; do not throw unless fatal

Add Protocol:
1. Server: `protocols/<proto>-server.ts` (export `start<Proto>Server`)
2. Client tool: `protocols/<proto>-client-tool.ts` (LangChain DynamicTool)
3. Keep translation logic pure – no business logic.

## Do / Avoid
| Do | Avoid |
|----|-------|
| Keep modules focused | Large multi-purpose util files |
| Add JSDoc rationale | Commenting what code syntactically does |
| Introduce ports first | Hard-coding provider logic in domain |
| Test with mocks | Calling real APIs in unit tests |
| Validate IPC + protocol inputs | Trusting network payloads blindly |
| Centralize channel & route constants | Scattering magic strings |

## Invariants
- Agent definitions deterministic given injected strategy.
- No network calls outside adapters / protocol layers.
- Orchestrator owns streaming semantics.
- Guardrails side-effect free (pure) except logging.
- Protocol adapters only translate; never embed domain decisions.

## Future Signals
- Planner integration: look for `agentPlanner` stub.
- HITL: expect `hitl` event type + state machine.
- Telemetry: metrics/logging modules will expand; keep interfaces slim.
- Protocol Auth: Expect token validation hooks in `a2a-server.ts` later.

When unsure: prefer creating a new small file with clear naming over extending an unrelated module.

Keep this document updated when adding new architectural patterns, protocol types, or naming conventions.
