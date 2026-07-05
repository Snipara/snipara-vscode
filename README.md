# Snipara - Project Memory for AI Agents

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/snipara.snipara?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=snipara.snipara)
[![Open VSX](https://img.shields.io/open-vsx/v/snipara/snipara?label=Open%20VSX)](https://open-vsx.org/extension/snipara/snipara)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/snipara/snipara?label=Open%20VSX%20downloads)](https://open-vsx.org/extension/snipara/snipara)
[![GitHub](https://img.shields.io/badge/source-GitHub-24292f)](https://github.com/Snipara/snipara-vscode)

Snipara gives AI coding agents a project-scoped memory and context layer that survives sessions, users, tools, and model switches. Your agent keeps using its own LLM; Snipara supplies durable decisions, source-backed retrieval, shared context, code graph context, and team memory so the next agent does not start cold.

Snipara turns an editor install into a live project context in under a minute. Cursor uses the `create-snipara` bootstrap; VS Code can run the same activation as a native workspace command.

Current extension release: **2.0.7**.

Available from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) and [Open VSX Registry](https://open-vsx.org/extension/snipara/snipara) for VS Code, Cursor, VSCodium, and other VS Code-compatible editors.

## What This Extension Does

- Runs the native VS Code entry point for Snipara's shared activation engine: install extension, activate workspace, sync local docs, open a First Work Brief, then hand off to Copilot.
- Activates the open workspace by indexing bounded starter docs, opening a source-backed First Work Brief, and offering a copyable Copilot handoff.
- Runs a no-account demo against Snipara's project context as a fallback. The demo is opt-in and limited to 3 queries.
- Connects VS Code-compatible editors to a Snipara project through API credentials stored in VS Code SecretStorage.
- Lets users query source-backed project context, upload documentation, inspect memories, review decisions, and monitor index health.
- Exposes 64 Command Palette actions across project context, memory, documents, orchestration, sandbox execution, swarm coordination, and local readiness.
- Exposes 38 GitHub Copilot Language Model Tools in VS Code agent mode.
- Registers a Snipara MCP Server Definition Provider for VS Code's MCP integration when the host supports it.
- Keeps Cursor users supported through the extension UI plus the separate hosted MCP setup for Cursor chat.

## Quick Start

**The primary first run is your own workspace.**

1. Install Snipara from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) or [Open VSX](https://open-vsx.org/extension/snipara/snipara).
2. Open a project that has docs such as `README`, `docs/**`, `AGENTS.md`, `CLAUDE.md`, or changelogs.
3. Click **Activate Workspace** / **Build my First Work Brief**.
4. Sign in with GitHub if prompted; Snipara stores credentials in VS Code SecretStorage.
5. Snipara indexes a bounded starter corpus from the workspace, opens a source-backed **First Work Brief**, and offers a Copilot handoff prompt.

This is the VS Code-native version of the `create-snipara` activation flow. The activation engine stays shared across Snipara surfaces; VS Code adds editor-native UX with commands, SecretStorage, panels, status bar, workspace-first sync, and Copilot handoff.

## One Activation Engine, Multiple Entry Points

Snipara keeps the activation logic centralized instead of duplicating it in every integration.

| Surface | Entry Point | What Users Get |
|---------|-------------|----------------|
| VS Code extension | Native **Snipara: Activate Workspace** command | Workspace doc scan, sign-in when needed, hosted sync, First Work Brief panel, Copilot handoff |
| Cursor plugin | `create-snipara` bootstrap | Project-local Cursor rules, activation artifacts, First Work Brief path, hosted MCP upgrade with `SNIPARA_API_KEY` |
| `create-snipara` CLI | `npx create-snipara@latest init --client <client> --starter` | Shared activation package for Cursor, Claude Code, Codex, VS Code-compatible clients, and generic MCP clients |

The product promise is the same across surfaces: install Snipara, open your project, and give the agent live project context before it starts work.

## Editor Support

| Editor | Install Source | Supported Surfaces |
|--------|----------------|--------------------|
| VS Code | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) | Commands, sidebar views, status bar, file explorer upload, Copilot Language Model Tools, MCP Server Definition Provider |
| Cursor | [Open VSX](https://open-vsx.org/extension/snipara/snipara) | Commands, sidebar views, status bar, file explorer upload, keyboard shortcut. Configure Snipara MCP separately for Cursor chat |
| VSCodium / Theia / Open VSX editors | [Open VSX](https://open-vsx.org/extension/snipara/snipara) | Commands, sidebar views, file explorer upload, sandbox/local readiness where host APIs allow |

Cursor and other Open VSX editors do not expose VS Code's GitHub Copilot-specific Language Model Tool APIs. For AI chat access in Cursor, configure the hosted MCP integration from [Snipara Cursor docs](https://snipara.com/docs/integration/cursor).

## Core Features

### Demo and Onboarding

- **Workspace activation:** The first-run path scans bounded local starter docs, syncs them after sign-in, opens a source-backed First Work Brief, and offers direct Copilot handoff actions.
- **Local project proof:** The Welcome view shows detected workspace docs before sign-in so users see that Snipara found their own project material.
- **Opt-in demo mode:** Run 3 demo queries against Snipara's own indexed project context without signing in.
- **Instant first demo:** The default demo query uses embedded fallback data, so it works even when the network is unavailable.
- **Live follow-ups:** Custom demo questions call the read-only demo project and fall back silently if the API is unreachable.
- **Guided walkthrough:** First-run users see the Getting Started flow, with workspace activation first and the demo kept as fallback.
- **Workspace detection:** Markdown workspaces are scanned and surfaced in the Welcome view so users can index project docs after sign-in.

### Project Context

- Natural-language project context queries with keyword, semantic, or hybrid search.
- Source-backed retrieval with cited files, sections, relevance scores, and token budgets.
- Raw chunk, raw document, line-range, and project-load commands for deeper inspection.
- Multi-query, multi-project query, query decomposition, planning, and orchestration workflows.
- Code graph lookup for neighbors, callers, imports, importers, and structural paths.

### Agent Memory

- Store and recall facts, decisions, learnings, preferences, todos, and context.
- Use **Remember If Novel** to avoid duplicate durable memories.
- Run **End-of-Task Commit** to persist reusable outcomes at the end of a task.
- Browse memories in the sidebar and inspect memory health, review queues, stale entries, and candidate memories.
- Query structured project decisions directly.

### Project Intelligence

- Index health, recommendations, reindexing, search analytics, and query trends.
- Shared context collections and prompt templates for team standards.
- Summary storage for generated document summaries.
- Swarm coordination commands for multi-agent work: swarms, tasks, resource claims, shared state, and broadcast events.

### Sandbox and Local Readiness

- Native **Doctor / Local Readiness** view for workspace `.env` files, provider keys, Snipara auth, Snipara Sandbox, and Docker.
- Sandbox commands for Docker-isolated execution, local execution, logs, and trajectory visualization.
- Local setup guidance installs the PyPI package [`snipara-sandbox`](https://pypi.org/project/snipara-sandbox/).
- Core extension features do not require `snipara-companion`.

### VS Code Integration

- Snipara activity bar with Welcome, Results, Session Context, Memories, Doctor / Local Readiness, and Swarm Dashboard views.
- Status bar entry for sign-in or quick query.
- `Cmd+Shift+R` / `Ctrl+Shift+R` shortcut for **Snipara: Ask Question**.
- File explorer upload for `.md`, `.mdx`, and `.txt` files.
- Workspace-first document sync: single-folder workspaces sync without an unnecessary folder picker; multi-root workspaces use a VS Code quick pick.
- Optional auto-restore and auto-save of session context.

## Commands

All 64 commands are available from the Command Palette under **Snipara**, **Snipara Sandbox**, and **Snipara Doctor**.

### Query and Context

| Command | Purpose |
|---------|---------|
| Snipara: Activate Workspace | Index bounded starter docs from the open workspace and open a First Work Brief |
| Snipara: Ask Question | Query source-backed project context. Falls back to demo mode when not signed in |
| Snipara: Search Project Context | Search indexed project context by pattern. Falls back to demo mode when not signed in |
| Snipara: Try Demo Query | Run the opt-in demo query |
| Snipara: Multi-Query | Run multiple retrieval queries in parallel |
| Snipara: Multi-Project Query | Search across accessible team projects |
| Snipara: Decompose Query | Break a complex question into sub-queries |
| Snipara: Generate Plan | Build an execution plan for context exploration |
| Snipara: Show Current Context | Load active session context |
| Snipara: Inject Context | Add selected text or custom text to session context |
| Snipara: Clear Context | Clear active session context |

### Memory and Decisions

| Command | Purpose |
|---------|---------|
| Snipara: Remember | Store a fact, decision, learning, preference, todo, or context memory |
| Snipara: Recall Memory | Search durable project memories |
| Snipara: Browse Memories | Browse memories in the sidebar |
| Snipara: Refresh Memories | Refresh the Memories view |
| Snipara: Forget Memory | Delete a memory after confirmation |
| Snipara: End-of-Task Commit | Persist reusable task outcomes into memory |
| Snipara: Show Memory Health | Inspect duplicates, stale memories, and review signals |
| Snipara: Show Memory Review Queue | Inspect candidate, rejected, stale, or active review items |
| Snipara: Query Decisions | Search structured project decisions |

### Index, Documents, and Shared Context

| Command | Purpose |
|---------|---------|
| Snipara: Upload Document | Upload a `.md`, `.mdx`, or `.txt` document |
| Snipara: Sync Documents | Bulk sync workspace documentation |
| Snipara: Upload Shared Document | Upload a document into a shared context collection |
| Snipara: Load Shared Context | Load shared team context |
| Snipara: List Collections | Browse shared context collections |
| Snipara: Browse Templates | List reusable prompt templates |
| Snipara: Apply Template | Load a prompt template by slug |
| Snipara: Store Summary | Store an AI-generated document summary |
| Snipara: View Summaries | Browse stored summaries |
| Snipara: Delete Summary | Delete a stored summary |
| Snipara: Show Statistics | View indexed files, sections, lines, and token counts |
| Snipara: Show Index Health | Inspect coverage, quality, tiers, and stale content |
| Snipara: Show Index Recommendations | Get index improvement recommendations |
| Snipara: Reindex Project | Trigger document or code index maintenance |
| Snipara: Show Search Analytics | View query performance and tool usage analytics |

### Raw Context and Code Graph

| Command | Purpose |
|---------|---------|
| Snipara: Show Section | Display a retrieved source section |
| Snipara: Get Chunk by ID | Load cited source content by chunk ID |
| Snipara: Read Lines | Read a specific line range from indexed documentation |
| Snipara: Code Graph Lookup | Inspect code graph neighbors, callers, or imports |
| Snipara: Load Document (Raw) | Load raw document content by path |
| Snipara: Load Project | Load a broader project context dump with path filtering |
| Snipara: Orchestrate | Run multi-round scan, search, and raw-load exploration |
| Snipara: Build REPL Context | Package project context with Python helpers for sandbox sessions |

### Swarm Coordination

| Command | Purpose |
|---------|---------|
| Snipara: Create Swarm | Create an agent swarm |
| Snipara: Join Swarm | Join an existing swarm |
| Snipara: Claim Resource | Lock a file, function, module, or resource |
| Snipara: Release Resource | Release a resource claim |
| Snipara: Create Task | Add a task to a swarm queue |
| Snipara: Claim Task | Claim the highest-priority available task |
| Snipara: Complete Task | Mark a task as completed or failed |
| Snipara: Broadcast Event | Send an event to swarm agents |
| Snipara: Get Shared State | Read shared swarm state by key |
| Snipara: Set Shared State | Write shared swarm state with optimistic locking |

### Sandbox, Doctor, and Setup

| Command | Purpose |
|---------|---------|
| Snipara: Configure | Sign in with GitHub or configure API credentials manually |
| Snipara: Show Project Settings | View current Snipara project settings |
| Snipara Sandbox: Execute in Docker (Isolated) | Run code through Snipara Sandbox with Docker isolation |
| Snipara Sandbox: Execute Locally | Run code through Snipara Sandbox locally |
| Snipara Sandbox: View Execution Logs | Browse sandbox execution logs |
| Snipara Sandbox: Launch Trajectory Visualizer | Open the trajectory visualizer |
| Snipara Doctor: Refresh Local Readiness | Re-run local setup checks |
| Snipara Doctor: Open Env File | Open or create a workspace `.env` file |
| Snipara Doctor: Use Workflow | Pick a context workflow based on current readiness |
| Snipara Doctor: Use Sandbox | Pick a sandbox action based on detected Snipara Sandbox/Docker status |
| Snipara Doctor: Run Sandbox Doctor | Run `snipara-sandbox doctor` when available |

## Copilot and MCP

In VS Code agent mode, Snipara contributes 38 Language Model Tools covering:

- project context retrieval, search, quick ask, multi-query, planning, decomposition, and multi-project search;
- memory storage, recall, browsing, deletion, novelty checks, memory health, memory review, and end-of-task commits;
- shared context, document upload, raw document load, full project load, orchestration, and REPL context packaging;
- source chunk loading, code graph neighbors, callers, imports, and shortest paths;
- structured decisions, index health, recommendations, reindexing, search analytics, and query trends;
- hierarchical task inspection, recommendations, metrics, and Python execution through Snipara Sandbox.

The extension also declares a **Snipara MCP Server Definition Provider** for VS Code hosts that support MCP server definitions. Hosted MCP availability depends on the editor, VS Code version, project configuration, and Snipara server deployment.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `snipara.apiKey` | empty | Legacy/manual API key setting. Sign-in stores keys in VS Code SecretStorage |
| `snipara.projectId` | empty | Snipara project ID or slug |
| `snipara.serverUrl` | `https://api.snipara.com` | Snipara API server URL |
| `snipara.maxTokens` | `4000` | Max context budget for retrieval queries |
| `snipara.searchMode` | `hybrid` | Search mode: `keyword`, `semantic`, or `hybrid` |
| `snipara.enableAutoRestore` | `false` | Restore previous session context on startup |
| `snipara.enableAutoSave` | `false` | Save session context periodically and on shutdown |
| `snipara.sandboxEnabled` | `true` | Enable Snipara Sandbox status and commands |

## Requirements

- VS Code 1.93.0+, Cursor 0.40+, VSCodium, or another compatible Open VSX editor.
- No account is required for the opt-in demo.
- A free Snipara account is required to query and manage your own project context.
- Optional for sandbox execution: [snipara-sandbox](https://pypi.org/project/snipara-sandbox/) and Docker for isolated runs.
- Optional for companion workflows: `snipara-companion`.

## Development

```bash
pnpm install
pnpm run type-check
pnpm run compile
pnpm run package
```

Packaging uses `vsce package --no-dependencies`. Publishing targets:

```bash
pnpm run publish:vsce
pnpm run publish:ovsx
```

Generated `.vsix` files are local release artifacts and are ignored by git.

## Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara)
- [Open VSX Registry](https://open-vsx.org/extension/snipara/snipara)
- [VS Code integration docs](https://snipara.com/docs/integration/vscode)
- [Cursor integration docs](https://snipara.com/docs/integration/cursor)
- [Dashboard](https://snipara.com/dashboard)
- [GitHub](https://github.com/Snipara/snipara-vscode)
- [Issues](https://github.com/Snipara/snipara-vscode/issues)
