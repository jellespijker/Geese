# Agentic Desktop App Scaffold

This project is a production‑ready scaffold for building **agentic desktop applications** with:

- **Electron + Vite + TypeScript** (fast development & packaging)
- **React** (renderer UI)
- **Hexagonal Architecture** (ports & adapters: LLM strategy, agent registry, guardrails, protocols)
- **LangChain + LangGraph** (agent graphs & streaming execution)
- **Protocol-Driven Interoperability** (A2A + MCP) ✅
- **Pluggable LLM providers** (currently: Vertex AI Gemini via `@langchain/google-genai`, mock fallback)
- **MCP (Model Context Protocol)** tool integration (`@langchain/mcp-adapters`)
- **Basic Guardrails** (input/output filtering hooks)
- **Extensibility** for more providers (OpenAI, Ollama, etc.) & custom agents

---
## Quick Start
```
npm install
npm start
```
The Electron main process launches and (Phase 3+) will automatically start the internal A2A server (default port from `A2A_PORT`).

Once the A2A server is active you can enumerate agents:
```
curl http://localhost:3020/agents
```
And invoke an agent (example payload shape to be finalized Phase 3):
```
curl -X POST http://localhost:3020/agents/React%20MCP%20Agent/run \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"What time is it?"}'
```

---
## Directory Layout

```
/electron
  main.ts
  preload.ts
  agentExecutor.orchestrator.ts
  /core
    types.ts
    guardrails.ts
    errors.ts
    ipcChannels.ts
    validation.ts
  /llm
    llmFactory.ts (planned rename from factory.ts in future cleanup)
    llmStrategy.ts (planned rename from strategy.ts)
    /providers
      vertexAI.adapter.ts (planned)
  /agents
    agentRegistry.ts
    reactAgent.definition.ts
  /protocols
    a2a-server.ts
    a2a-client-tool.ts
    mcp-client-tool.ts
/src
  App.tsx
  /components
    AgentSelector.tsx
    ConversationPanel.tsx
    HumanInputGate.tsx
  /hooks
    useAgentStreaming.ts
  main.tsx
  index.css
  /types
    electron.d.ts
/tests
  backend/* (backend tests)
  frontend/* (frontend tests)
```

---
## Environment Configuration
Create a `.env` or copy `.env.example`:
```
LLM_PROVIDER="vertexai"     # or mock
VERTEX_MODEL="gemini-1.5-flash"  # optional override
GOOGLE_API_KEY="<google-api-key>" # if not using ADC
JASON_ENDPOINT="https://<your-mcp-host>/api"
A2A_PORT=3020                 # internal A2A server port (planned Phase 3)
```

MCP `time` tool expected at:
```
${JASON_ENDPOINT}/v0/mcps/time/mcp
```

If using Application Default Credentials for Google:
```
gcloud auth application-default login
```
You may omit `GOOGLE_API_KEY` if ADC grants access.

---
## Protocol-Driven Interoperability (Overview)
| Protocol | Purpose | Implementation (Planned) |
|----------|---------|--------------------------|
| A2A (Agent-to-Agent) | Expose/consume agents across processes or hosts | `protocols/a2a-server.ts`, `a2a-client-tool.ts` |
| MCP (Model Context Protocol) | Acquire external tools/context sources | `protocols/mcp-client-tool.ts` |

Agents treat remote agents/tools as standard LangChain tools, preserving composability. Protocol adapters remain thin translation layers; business logic stays in the orchestrator and agent graphs.

---
## Scripts
```
npm install        # Install dependencies
npm start          # Launch Electron in dev mode (Vite + HMR)
npm run lint       # ESLint static analysis
npm run typecheck  # TypeScript project check
npm test           # Vitest unit tests
npm run ci         # Lint + typecheck + tests (used by CI)
```

---
## Adding a New LLM Provider
1. Create `electron/llm/providers/<provider>.adapter.ts` returning an `LLMStrategy`.
2. Add provider case to `llmFactory.ts` (current `factory.ts` will be renamed).
3. Document env vars in README + `.env.example`.
4. Add unit test with mocked network layer.

---
## Adding a New Agent
1. Create `electron/agents/<myAgent>Agent.definition.ts` exporting an `AgentDefinition`.
2. Register it inside `electron/agents/agentRegistry.ts` (current `registry.ts`).
3. Restart the app; it appears in the UI and will be enumerated by the A2A server.

---
## Guardrails
`electron/core/guardrails.ts` isolates safety checks:
- Input: length + naive prompt injection heuristic.
- Output: length constraint (future: moderation / redaction).
Extend with structured evaluators; avoid embedding checks in orchestrator logic.

---
## Human‑in‑the‑Loop (HITL)
Planned event type `hitl` will pause orchestrator runs:
1. Orchestrator yields `{ type: 'hitl', data: { reason } }`.
2. Renderer prompts user.
3. User input resumes run via IPC.

---
## MCP Tooling
The example agent (React MCP Agent) dynamically loads MCP tools via `MultiServerMCPClient`. Extend server list in its definition file to add more MCP endpoints.

---
## Using Protocol Client Tools (A2A + MCP)

Once the application is running, internal agents can leverage protocol tools that were injected into the React MCP Agent graph:

1. A2A Remote Agent Tool (`a2a_remote_agent`)
   - Treat any remote A2A agent endpoint like a tool.
   - Input JSON structure:
     ```json
     { "url": "http://REMOTE_HOST:3020/agents/Some%20Agent/run", "prompt": "Summarize today's news" }
     ```
   - Example (inside an agent reasoning step) the LLM might be guided with an instruction:
     "Use the a2a_remote_agent tool with the given URL to delegate summarization, then integrate the response."

2. MCP Generic Invoke Tool (`mcp_generic_invoke`)
   - Generic wrapper for an MCP server assumed to expose `/invoke`.
   - Input JSON structure:
     ```json
     { "serverUrl": "http://mcp.example", "prompt": "Get current system metrics" }
     ```

### Prompt Engineering Hint
When authoring system / developer prompts for an agent that should exploit these tools, include guidance like:
```
If a task requires external agent expertise, call the a2a_remote_agent tool with the appropriate URL.
If a task requires environment or contextual data (time, metrics, etc.), call the mcp_generic_invoke tool with a concise prompt.
Return synthesized final answers after integrating tool outputs.
```

### Curl Examples (Manual Invocation)
Invoke remote agent directly (bypassing tool) – same endpoint the A2A tool hits:
```bash
curl -X POST "http://localhost:3020/agents/React%20MCP%20Agent/run" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"What is the current time?"}'
```

---
## Testing Overview
Fast unit tests ensure architectural contracts remain stable:
| Area | File(s) | Purpose |
|------|---------|---------|
| Guardrails | `guardrails.test.ts` | Input/output policy enforcement |
| LLM Factory | `llmFactory.test.ts` | Provider selection & fallback |
| Registry | `agentRegistry.test.ts` | Agent discovery correctness |
| Orchestrator | `orchestrator.test.ts`, `orchestratorSuccess.test.ts` | Error + success streaming paths |
| Validation | `validation.test.ts` | IPC payload schema integrity |
| Protocol Server | `a2aServer.test.ts` | A2A server health + listing |
| Protocol Tools | `a2aClientTool.test.ts`, `mcpClientTool.test.ts` | Tool input validation + remote call |

Run all tests:
```bash
npm test
```

---
## Production Notes
- Harden preload: only minimal APIs exposed.
- Replace naive guardrails with layered policy engine for real deployments.
- Add telemetry (OpenTelemetry) for spans on orchestrations.
- Sign & notarize builds for distribution.
- Consider secure auth tokens for A2A protocol in multi-tenant deployments.

---
## Troubleshooting
| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| `Agent 'React MCP Agent' not found` | Registry not loaded | Ensure registration call exists |
| Empty agent dropdown | IPC bridge not injected | Check `preload.js` path in `BrowserWindow` config |
| Vertex AI auth error | Missing/invalid credentials | Set `GOOGLE_API_KEY` or use ADC |
| No MCP tools loaded | Wrong `JASON_ENDPOINT` | Verify endpoint & path | 

---
## Cancellation
You can cancel an in-progress agent run via the preload API:
```ts
window.electron.cancelAgentRun(currentRunId);
```
The orchestrator cooperatively checks cancellation between streamed graph events.
A cancellation yields an event:
```json
{ "type": "cancelled", "data": { "reason": "user_cancel" } }
```
The UI hook (`useAgentStreaming`) adds a system message when it sees this event.

---
## Next Extensions
- Add OpenAI / Ollama providers
- Protocol server & client tools implementation (Phase 3)
- Streaming partial token UI
- Persistent conversation history & transcript export
- Advanced moderation / policy layering
- Multi-agent planner & capability routing

---
## License
MIT
