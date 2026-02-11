# Snipara - AI Context for Your Documentation

Query your documentation with AI-optimized semantic search. Snipara indexes your docs and delivers the most relevant context within your token budget — **90%+ token reduction** so your LLM gets better answers, faster.

## Quick Start

**No sign-in required to try it out.**

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) or run `ext install snipara.snipara`
2. Open the **Getting Started walkthrough** (auto-opens on first install)
3. Click **"Try Demo Query"** — see real results from Snipara's own docs with a cost/token comparison
4. When ready, click **"Sign in with GitHub"** for **30 days of Pro features free** (no credit card)

The extension works immediately in demo mode (3 queries) — query Snipara's documentation, see token savings and cost comparisons, all before creating an account.

---

## Features

### Try Before You Sign In
- **Demo Mode** — Run 3 queries against Snipara's product docs (integrations, pricing, hooks) without any configuration
- **Value Comparison Dashboard** — See token savings, cost reduction, and speed metrics in the results view
- **Guided Walkthrough** — 4-step onboarding: try demo → sign in → index docs → ask questions
- **Workspace Detection** — Auto-detects markdown files in your workspace and shows estimated token savings
- **30-Day Pro Trial** — Sign in with GitHub to unlock all Pro features free, no credit card required

### Documentation Query
- **Semantic Search** - Find relevant documentation sections using natural language
- **Multi-Query** - Run multiple queries in parallel with shared token budget
- **Query Decomposition** - Break complex questions into optimized sub-queries
- **Execution Plans** - Generate step-by-step query plans for complex topics
- **Multi-Project Search** - Search across all team projects simultaneously

### Agent Memory
- **Remember** - Store facts, decisions, learnings, and preferences
- **Recall** - Semantically search your memories with confidence scoring
- **Browse** - View all memories grouped by type in the sidebar
- **Forget** - Remove outdated or irrelevant memories

### Team Collaboration
- **Shared Context** - Load team coding standards and best practices
- **Prompt Templates** - Use and manage reusable prompt templates
- **Collections** - Browse and contribute to shared context collections

### Swarm Coordination
- **Create & Join** - Coordinate multiple AI agents
- **Task Queue** - Create, claim, and complete distributed tasks
- **Resource Claims** - Prevent conflicts with exclusive resource locks
- **Shared State** - Read and write shared state with optimistic locking
- **Event Broadcast** - Send events to all agents in a swarm

### Orchestration (Pro/Team)
- **Load Document** - Load raw document content by file path (Pro+)
- **Load Project** - Token-budgeted dump of all project files with path filtering (Team+)
- **Orchestrate** - Multi-round context exploration: scan → search → raw load in one call (Team+)
- **REPL Context** - Package project context with Python helpers for REPL sessions (Pro+)

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

### Session Lifecycle
- **Auto-Restore** - Restore previous session context on startup
- **Auto-Save** - Periodic context save every 5 minutes
- **Memory Recall** - Automatically recall recent session memories on activation
- **Session Tracking** - Store session-end memory on deactivation

### VS Code Integration
- **Copilot Tools** - 19 Language Model Tools for GitHub Copilot agent mode
- **MCP Server** - Auto-registers as MCP server for Copilot
- **Sidebar Views** - Welcome, Results, Context, Memories, and Swarm Dashboard
- **Welcome View** - Action buttons and workspace stats shown when not signed in
- **Status Bar** - Quick access to documentation queries
- **Keyboard Shortcut** - Cmd+Shift+R / Ctrl+Shift+R

## Getting Started

### Install

| Editor | Method |
|--------|--------|
| **VS Code** | [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara) or `ext install snipara.snipara` |
| **Cursor** | [Open VSX](https://open-vsx.org/extension/snipara/snipara) — search "Snipara" in Extensions sidebar |
| **VSCodium** | [Open VSX](https://open-vsx.org/extension/snipara/snipara) |
| **Manual** | Download `.vsix` from [GitHub Releases](https://github.com/Snipara/snipara-vscode/releases) |

### First Launch

On first install, the **Getting Started walkthrough** opens automatically with 4 steps:

1. **See it in action** — Run a demo query against Snipara's docs (3 demo queries available)
2. **Sign in for free** — Create an account with GitHub (30 days Pro free, no credit card)
3. **Index your documentation** — Sync your markdown files
4. **Ask your first question** — Query your own docs

The sidebar also shows a **Welcome view** with workspace stats and quick action buttons until you sign in.

### Configure

**Automatic (recommended):** Click "Sign in with GitHub" in the walkthrough, welcome view, or status bar — a free account is created automatically.

**Manual:** Open Command Palette (`Cmd+Shift+P`) → **Snipara: Configure** → enter your API key and project ID from [snipara.com/dashboard](https://snipara.com/dashboard).

> **30 days Pro features free** when you sign in — no credit card required. After trial: 100 queries/month on the free plan. Upgrade anytime at [snipara.com/pricing](https://snipara.com/pricing).

## Commands

All 48 commands are accessible via Command Palette under the "Snipara" and "Snipara Runtime" categories.

### Core Query

| Command | Description |
|---------|-------------|
| Snipara: Ask Question | Semantic search across documentation (Cmd+Shift+R). Falls back to demo mode if not signed in |
| Snipara: Search Documentation | Regex pattern search. Falls back to demo mode if not signed in |
| Snipara: Try Demo Query | Run a pre-built query against Snipara's docs with cost/token comparison dashboard |
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
| Snipara: Load Project | Token-budgeted project dump with path filtering (Team+) |
| Snipara: Orchestrate | Multi-round scan → search → load exploration (Team+) |
| Snipara: Build REPL Context | Package context with Python helpers for REPL (Pro+) |

### Info & Settings

| Command | Description |
|---------|-------------|
| Snipara: Show Statistics | View indexed file, section, and line counts |
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

### Other

| Command | Description |
|---------|-------------|
| Snipara: Configure | Set API key and project ID |

## Sidebar Views

The extension adds 5 views in the Snipara activity bar:

| View | Description |
|------|-------------|
| **Welcome** | Action buttons, workspace doc stats, and value proposition (shown when not signed in) |
| **Results** | Query results with sections, relevance scores, and token counts. Shows demo CTA or quick-start links when empty |
| **Session Context** | Current session context display |
| **Memories** | Stored memories grouped by type (facts, decisions, learnings, preferences, todos, context) |
| **Swarm Dashboard** | Webview panel for swarm management |

## Copilot Integration

When using GitHub Copilot in agent mode, Snipara provides 19 Language Model Tools:

| Tool | Purpose |
|------|---------|
| `snipara_contextQuery` | Search documentation with semantic search |
| `snipara_remember` | Store memories (facts, decisions, learnings) |
| `snipara_recall` | Recall relevant memories by query |
| `snipara_sharedContext` | Load team coding standards |
| `snipara_search` | Regex pattern search across documentation |
| `snipara_askQuick` | Quick documentation lookup (~2500 tokens) |
| `snipara_multiQuery` | Run multiple queries in parallel |
| `snipara_plan` | Generate execution plans for complex topics |
| `snipara_decompose` | Break queries into optimized sub-queries |
| `snipara_multiProjectQuery` | Search across all team projects |
| `snipara_memories` | Browse stored memories with filters |
| `snipara_forget` | Delete memories by ID, type, or category |
| `snipara_stats` | Get documentation index statistics |
| `snipara_uploadDocument` | Upload documents to Snipara index |
| `snipara_loadDocument` | Load raw document content by path (Pro+) |
| `snipara_loadProject` | Load full project with token budgeting (Team+) |
| `snipara_orchestrate` | Multi-round context exploration (Team+) |
| `snipara_replContext` | Package context for REPL with Python helpers (Pro+) |
| `snipara_executePython` | Execute Python code via RLM Runtime (Docker isolation) |

The extension also registers as an **MCP Server Definition Provider**, making all 43 Snipara tools available to Copilot's MCP integration (VS Code 1.99+).

## File Explorer Integration

Right-click any `.md`, `.mdx`, or `.txt` file in the explorer to **Upload Document** directly to Snipara.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `snipara.apiKey` | - | Your Snipara API key |
| `snipara.projectId` | - | Your project ID |
| `snipara.serverUrl` | `https://api.snipara.com` | API server URL |
| `snipara.maxTokens` | `4000` | Max tokens for context queries |
| `snipara.searchMode` | `hybrid` | Search mode: keyword, semantic, or hybrid |
| `snipara.enableAutoRestore` | `false` | Restore previous session context on startup |
| `snipara.enableAutoSave` | `false` | Periodic context save (every 5 minutes) |
| `snipara.runtimeEnabled` | `true` | Enable RLM Runtime integration |

## Requirements

- VS Code 1.93.0+, Cursor 0.40+, or any VS Code-compatible editor
- **No account needed** for demo mode — try it immediately after install
- Snipara account ([snipara.com](https://snipara.com)) for querying your own docs (free tier: 100 queries/month)
- **Optional for Runtime:** [RLM Runtime](https://pypi.org/project/rlm-runtime/) (`pip install rlm-runtime[all]`) + Docker for isolated execution

## Cursor Users

The extension works in Cursor with full support for commands, sidebar views, keyboard shortcuts, and file explorer integration. GitHub Copilot-specific features (Language Model Tools, MCP Server Definition Provider) are not available in Cursor.

For AI chat access to Snipara tools in Cursor, also configure the [MCP integration](https://snipara.com/docs/integration/cursor).

## Links

- [Documentation](https://snipara.com/docs/integration/vscode)
- [Dashboard](https://snipara.com/dashboard)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=snipara.snipara)
- [Open VSX Registry](https://open-vsx.org/extension/snipara/snipara)
- [GitHub](https://github.com/Snipara/snipara-vscode)
- [Issues](https://github.com/Snipara/snipara-vscode/issues)
