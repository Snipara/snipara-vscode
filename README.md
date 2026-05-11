# Snipara - Project Memory for AI Agents

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/snipara.snipara?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=snipara.snipara)
[![Open VSX](https://img.shields.io/open-vsx/v/snipara/snipara?label=Open%20VSX)](https://open-vsx.org/extension/snipara/snipara)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/snipara/snipara?label=Open%20VSX%20downloads)](https://open-vsx.org/extension/snipara/snipara)
[![GitHub](https://img.shields.io/badge/source-GitHub-24292f)](https://github.com/Snipara/snipara-vscode)

Snipara gives AI coding agents a project-scoped memory and context layer that survives sessions, users, tools, and model switches. Your agent still uses its own LLM; Snipara gives it the durable project context, reviewed decisions, source-backed retrieval, and team standards it needs to avoid starting cold.

Available from both the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) and [Open VSX Registry](https://open-vsx.org/extension/snipara/snipara) for VS Code, Cursor, VSCodium, and other VS Code-compatible editors.

## Quick Start

**No sign-in required to try it out.**

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) or [Open VSX](https://open-vsx.org/extension/snipara/snipara)
2. Open the **Getting Started walkthrough** (auto-opens on first install)
3. Click **"Try Demo Query"** — see how Snipara retrieves project context, memory, and source-backed answers
4. When ready, click **"Sign in with GitHub"** to create a **free account** (no credit card)

The extension works immediately in demo mode (3 queries) — explore Snipara's own project context before creating an account.

---

## Features

### Try Before You Sign In
- **Demo Mode** — Run 3 queries against Snipara's product context without any configuration
- **Project Context Snapshot** — See retrieved source sections, follow-up questions, and compact project context metadata
- **Guided Walkthrough** — 4-step onboarding: try demo → sign in → index project context → ask questions
- **Workspace Detection** — Auto-detects markdown files in your workspace and offers to index them
- **Free Account** — Sign in with GitHub to use Snipara on your own project context, no credit card required

### Project Context Retrieval
- **Semantic Search** - Find relevant project sections using natural language
- **Source-Backed Retrieval** - Load cited source chunks and raw documents when the agent needs deeper evidence
- **Code Graph Tools** - Ask structural code questions with callers, imports, neighbors, and shortest-path queries
- **Multi-Query** - Run multiple queries in parallel with shared context budgets
- **Query Decomposition** - Break complex questions into optimized sub-queries
- **Execution Plans** - Generate step-by-step query plans for complex topics
- **Multi-Project Search** - Search across all team projects simultaneously

### Agent Memory
- **Remember** - Store facts, decisions, learnings, and preferences
- **Remember If Novel** - Store durable knowledge only when it is not already covered
- **End-of-Task Commit** - Persist reusable workflow outcomes at the end of a task
- **Recall** - Semantically search your memories with confidence scoring
- **Browse** - View all memories grouped by type in the sidebar
- **Memory Health** - Inspect memory hygiene, duplicate candidates, and review needs
- **Forget** - Remove outdated or irrelevant memories

### Team Collaboration
- **Shared Context** - Load team coding standards and best practices
- **Prompt Templates** - Use and manage reusable prompt templates
- **Collections** - Browse and contribute to shared context collections

### Swarm Coordination
- **Create & Join** - Coordinate multiple AI agents
- **Task Queue** - Create, claim, and complete distributed tasks
- **Hierarchical Tasks** - Use htasks for feature/workstream/task breakdowns with closure checks
- **Resource Claims** - Prevent conflicts with exclusive resource locks
- **Shared State** - Read and write shared state with optimistic locking
- **Event Broadcast** - Send events to all agents in a swarm

### Orchestration (Pro/Team)
- **Load Document** - Load raw document content by file path (Pro+)
- **Load Project** - Full project context dump with path filtering (Team+)
- **Orchestrate** - Multi-round context exploration: scan → search → raw load in one call (Team+)
- **REPL Context** - Package project context with Python helpers for REPL sessions (Pro+)

### Index Health & Analytics
- **Index Health** - View comprehensive health metrics (coverage, quality, tier distribution, stale docs)
- **Recommendations** - Get actionable suggestions to improve index health
- **Reindex** - Trigger index maintenance when docs or code context drift
- **Search Analytics** - View query performance (success rate, latency percentiles, tool usage)
- **Query Trends** - Analyze query volume trends over time with configurable granularity

### Document Management
- **Upload** - Upload .md, .mdx, .txt files directly from explorer context menu
- **Sync** - Bulk sync entire folders to Snipara
- **Summaries** - Store and manage AI-generated document summaries

### RLM Runtime
- **Execute in Docker** - Run tasks in Docker-isolated environment via RLM Runtime
- **Execute Locally** - Run tasks locally without isolation
- **View Logs** - Browse recent execution history
- **Launch Visualizer** - Open trajectory visualization dashboard
- **Status Bar** - See runtime availability at a glance (rlm + Docker status)
- **Graceful Install** - Prompted setup when RLM Runtime is not installed

### Doctor / Local Readiness (NEW - v1.7)
- **Local Setup Checks** - Detect workspace `.env` files, provider key names, Snipara auth, RLM Runtime, and Docker from inside VS Code
- **Workflow Suggestions** - Jump directly into Load Project, Plan, Orchestrate, or REPL Context commands when Snipara is configured
- **Runtime Suggestions** - Choose local execution, Docker execution, logs, or visualizer based on detected runtime status
- **Optional Companion Doctor** - Run `rlm-hook doctor` only when `rlm-hook` is installed; the extension does not require `snipara-companion`

### Session Lifecycle
- **Auto-Restore** - Restore previous session context on startup
- **Auto-Save** - Periodic context save every 5 minutes
- **Memory Recall** - Automatically recall recent session memories on activation
- **Session Tracking** - Store session-end memory on deactivation

### VS Code Integration
- **Copilot Tools** - Language Model Tools for GitHub Copilot agent mode
- **MCP Server** - Auto-registers as MCP server for Copilot
- **Sidebar Views** - Welcome, Results, Context, Memories, Doctor / Local Readiness, and Swarm Dashboard
- **Welcome View** - Action buttons and workspace stats shown when not signed in
- **Status Bar** - Quick access to project context queries
- **Keyboard Shortcut** - Cmd+Shift+R / Ctrl+Shift+R

## Getting Started

### Install

| Editor | Registry | Method |
|--------|----------|--------|
| **VS Code** | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) | Run `ext install snipara.snipara` or search "Snipara" in Extensions |
| **Cursor** | [Open VSX](https://open-vsx.org/extension/snipara/snipara) | Search "Snipara" in Extensions |
| **VSCodium** | [Open VSX](https://open-vsx.org/extension/snipara/snipara) | Run `codium --install-extension snipara.snipara` or search "Snipara" |
| **Eclipse Theia / Open VSX editors** | [Open VSX](https://open-vsx.org/extension/snipara/snipara) | Install extension ID `snipara.snipara` |
| **Manual** | [GitHub Releases](https://github.com/Snipara/snipara-vscode/releases) | Download and install the `.vsix` artifact |

### First Launch

On first install, the **Getting Started walkthrough** opens automatically with 4 steps:

1. **See it in action** — Run a demo query against Snipara's project context (3 demo queries available)
2. **Sign in for free** — Create an account with GitHub (no credit card)
3. **Index project context** — Sync your markdown files
4. **Ask your first question** — Query your own project context

The sidebar also shows a **Welcome view** with workspace stats and quick action buttons until you sign in.

### Configure

**Automatic (recommended):** Click "Sign in with GitHub" in the walkthrough, welcome view, or status bar — a free account is created automatically.

**Manual:** Open Command Palette (`Cmd+Shift+P`) → **Snipara: Configure** → enter your API key and project ID from [snipara.com/dashboard](https://snipara.com/dashboard).

> A free account lets you query your own project context after sign-in — no credit card required. Upgrade anytime at [snipara.com/pricing](https://snipara.com/pricing).

## Commands

All 63 commands are accessible via Command Palette under the "Snipara", "Snipara Runtime", and "Snipara Doctor" categories.

### Core Query

| Command | Description |
|---------|-------------|
| Snipara: Ask Question | Source-backed project context search (Cmd+Shift+R). Falls back to demo mode if not signed in |
| Snipara: Search Project Context | Regex pattern search. Falls back to demo mode if not signed in |
| Snipara: Try Demo Query | Run a pre-built query against Snipara's project context demo |
| Snipara: Multi-Query | Run multiple queries in parallel |
| Snipara: Decompose Query | Break complex query into sub-queries |
| Snipara: Generate Plan | Create execution plan for complex topics |
| Snipara: Multi-Project Query | Search across all team projects |

### Session Context

| Command | Description |
|---------|-------------|
| Snipara: Show Current Context | Display active session context |
| Snipara: Clear Context | Clear session context |
| Snipara: Inject Context | Set context from text selection or input |

### Agent Memory

| Command | Description |
|---------|-------------|
| Snipara: Remember | Store a memory (fact, decision, learning, preference, todo, context) |
| Snipara: Recall Memory | Semantically search stored memories |
| Snipara: Browse Memories | View all memories with type filter |
| Snipara: Forget Memory | Delete a memory (with confirmation) |

### Team Collaboration

| Command | Description |
|---------|-------------|
| Snipara: Load Shared Context | Get team standards and best practices |
| Snipara: Browse Templates | List and view prompt templates |
| Snipara: Apply Template | Load a template by slug |

### Swarm Coordination

| Command | Description |
|---------|-------------|
| Snipara: Create Swarm | Create a new agent swarm |
| Snipara: Join Swarm | Join an existing swarm |
| Snipara: Claim Resource | Exclusive lock on file/function/module |
| Snipara: Release Resource | Release a claimed resource |
| Snipara: Create Task | Add task to swarm queue |
| Snipara: Claim Task | Claim highest-priority available task |
| Snipara: Complete Task | Mark task as completed or failed |
| Snipara: Broadcast Event | Send event to all swarm agents |
| Snipara: Get Shared State | Read shared state by key |
| Snipara: Set Shared State | Write shared state with optimistic locking |

### Document Management

| Command | Description |
|---------|-------------|
| Snipara: Upload Document | Upload file to Snipara index |
| Snipara: Sync Documents | Bulk sync folder to Snipara |
| Snipara: Store Summary | Store AI-generated document summary |
| Snipara: View Summaries | Browse stored summaries |
| Snipara: Delete Summary | Delete a summary |

### Orchestration (Pro/Team)

| Command | Description |
|---------|-------------|
| Snipara: Load Document (Raw) | Load raw document content by path (Pro+) |
| Snipara: Load Project | Full project context dump with path filtering (Team+) |
| Snipara: Orchestrate | Multi-round scan → search → load exploration (Team+) |
| Snipara: Build REPL Context | Package context with Python helpers for REPL (Pro+) |

### Info & Settings

| Command | Description |
|---------|-------------|
| Snipara: Show Statistics | View indexed file, section, and line counts |
| Snipara: Show Index Health | View coverage, quality, tier, and stale-content health metrics |
| Snipara: Show Index Recommendations | Get prioritized index improvement recommendations |
| Snipara: Reindex Project | Trigger document or code index maintenance |
| Snipara: Show Search Analytics | View query volume, success rate, latency, and tool usage analytics |
| Snipara: Show Memory Health | Inspect memory hygiene and anomaly samples |
| Snipara: Show Memory Review Queue | Inspect candidate, stale, rejected, or active memory review items |
| Snipara: End-of-Task Commit | Persist durable task outcomes into memory |
| Snipara: Query Decisions | Search structured project decisions |
| Snipara: Get Chunk by ID | Load cited source content by chunk ID |
| Snipara: Code Graph Lookup | Inspect code graph neighbors, callers, or imports |
| Snipara: Read Lines | Read specific line range from documentation |
| Snipara: List Collections | Browse shared context collections |
| Snipara: Upload Shared Document | Upload document to a shared collection |
| Snipara: Show Settings | View project settings |

### RLM Runtime

| Command | Description |
|---------|-------------|
| Snipara Runtime: Execute in Docker (Isolated) | Run tasks in Docker via RLM Runtime |
| Snipara Runtime: Execute Locally | Run tasks locally via RLM Runtime |
| Snipara Runtime: View Execution Logs | Browse recent execution history |
| Snipara Runtime: Launch Trajectory Visualizer | Open Streamlit dashboard |

### Doctor / Local Readiness

| Command | Description |
|---------|-------------|
| Snipara Doctor: Refresh Local Readiness | Re-run local setup checks |
| Snipara Doctor: Open Env File | Open or create a workspace `.env` file |
| Snipara Doctor: Use Workflow | Choose a Snipara workflow command based on current setup |
| Snipara Doctor: Use Runtime | Choose a runtime action based on detected RLM/Docker status |
| Snipara Doctor: Run Companion Doctor | Run optional `rlm-hook doctor` when `rlm-hook` is installed |

### Other

| Command | Description |
|---------|-------------|
| Snipara: Configure | Set API key and project ID |

## Sidebar Views

The extension adds 6 views in the Snipara activity bar:

| View | Description |
|------|-------------|
| **Welcome** | Action buttons, workspace doc stats, and value proposition (shown when not signed in) |
| **Results** | Query results with source sections, relevance scores, and context metadata. Shows demo CTA or quick-start links when empty |
| **Session Context** | Current session context display |
| **Memories** | Stored memories grouped by type (facts, decisions, learnings, preferences, todos, context) |
| **Doctor / Local Readiness** | Native local readiness checks for env files, provider keys, Snipara auth, runtime, Docker, and optional companion doctor |
| **Swarm Dashboard** | Webview panel for swarm management |

## Copilot Integration

When using GitHub Copilot in agent mode, Snipara provides 38 Language Model Tools:

| Tool | Purpose |
|------|---------|
| `snipara_contextQuery` | Search project context with semantic retrieval |
| `snipara_remember` | Store memories (facts, decisions, learnings) |
| `snipara_recall` | Recall relevant memories by query |
| `snipara_sharedContext` | Load team coding standards |
| `snipara_search` | Regex pattern search across indexed project context |
| `snipara_askQuick` | Quick project context lookup |
| `snipara_multiQuery` | Run multiple queries in parallel |
| `snipara_plan` | Generate execution plans for complex topics |
| `snipara_decompose` | Break queries into optimized sub-queries |
| `snipara_multiProjectQuery` | Search across all team projects |
| `snipara_memories` | Browse stored memories with filters |
| `snipara_forget` | Delete memories by ID, type, or category |
| `snipara_stats` | Get project index statistics |
| `snipara_uploadDocument` | Upload documents to Snipara index |
| `snipara_loadDocument` | Load raw document content by path (Pro+) |
| `snipara_loadProject` | Load full project context (Team+) |
| `snipara_orchestrate` | Multi-round context exploration (Team+) |
| `snipara_replContext` | Package context for REPL with Python helpers (Pro+) |
| `snipara_getChunk` | Load full cited source content by chunk ID |
| `snipara_codeNeighbors` | Return local code graph context around a symbol |
| `snipara_codeCallers` | Find callers of a code symbol |
| `snipara_codeImports` | List imports or importers for a symbol or file |
| `snipara_codeShortestPath` | Find the shortest structural path between two symbols |
| `snipara_rememberIfNovel` | Store durable memory only when it is novel |
| `snipara_endOfTaskCommit` | Persist durable task outcomes into memory |
| `snipara_memoryHealth` | Inspect memory hygiene |
| `snipara_memoryReviewQueue` | Inspect memory review queue items |
| `snipara_decisionCreate` | Create a structured project decision |
| `snipara_decisionQuery` | Query structured project decisions |
| `snipara_indexHealth` | Inspect project index health |
| `snipara_indexRecommendations` | Get index improvement recommendations |
| `snipara_reindex` | Trigger or poll a project reindex job |
| `snipara_searchAnalytics` | Inspect search performance analytics |
| `snipara_queryTrends` | Inspect query trends over time |
| `snipara_htaskTree` | Inspect a hierarchical task tree |
| `snipara_htaskRecommendations` | Get recommended ready hierarchical tasks |
| `snipara_htaskMetrics` | Get hierarchical task metrics for a swarm |
| `snipara_executePython` | Execute Python code via RLM Runtime (Docker isolation) |

The extension also registers as an **MCP Server Definition Provider**, making the hosted Snipara MCP server available to Copilot's MCP integration (VS Code 1.99+). The hosted MCP surface can expose more tools than the curated Copilot tool shortcuts above, depending on plan, project state, and server deployment.

## File Explorer Integration

Right-click any `.md`, `.mdx`, or `.txt` file in the explorer to **Upload Document** directly to Snipara.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `snipara.apiKey` | - | Your Snipara API key |
| `snipara.projectId` | - | Your project ID |
| `snipara.serverUrl` | `https://api.snipara.com` | API server URL |
| `snipara.maxTokens` | `4000` | Max context budget for retrieval queries |
| `snipara.searchMode` | `hybrid` | Search mode: keyword, semantic, or hybrid |
| `snipara.enableAutoRestore` | `false` | Restore previous session context on startup |
| `snipara.enableAutoSave` | `false` | Periodic context save (every 5 minutes) |
| `snipara.runtimeEnabled` | `true` | Enable RLM Runtime integration |

## Requirements

- VS Code 1.93.0+, Cursor 0.40+, or any VS Code-compatible editor
- **No account needed** for demo mode — try it immediately after install
- Snipara account ([snipara.com](https://snipara.com)) for querying your own project context (free account available, no credit card required)
- **Optional for Runtime:** [RLM Runtime](https://pypi.org/project/rlm-runtime/) (`pip install rlm-runtime[all]`) + Docker for isolated execution
- **Optional for Companion Doctor:** `rlm-hook` from `snipara-companion`; core extension features do not depend on it

## Cursor Users

The extension works in Cursor with full support for commands, sidebar views, keyboard shortcuts, and file explorer integration. GitHub Copilot-specific features (Language Model Tools, MCP Server Definition Provider) are not available in Cursor.

For AI chat access to Snipara tools in Cursor, also configure the [MCP integration](https://snipara.com/docs/integration/cursor).

## Links

- [Open VSX Registry](https://open-vsx.org/extension/snipara/snipara)
- [Documentation](https://snipara.com/docs/integration/vscode)
- [Dashboard](https://snipara.com/dashboard)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara)
- [GitHub](https://github.com/Snipara/snipara-vscode)
- [Issues](https://github.com/Snipara/snipara-vscode/issues)
