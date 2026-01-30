# Snipara - AI Context for Your Documentation

Query your documentation with AI-optimized semantic search. Snipara indexes your docs and delivers the most relevant context within your token budget.

## Features

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

### Document Management
- **Upload** - Upload .md, .mdx, .txt files directly from explorer context menu
- **Sync** - Bulk sync entire folders to Snipara
- **Summaries** - Store and manage AI-generated document summaries

### Session Lifecycle
- **Auto-Restore** - Restore previous session context on startup
- **Auto-Save** - Periodic context save every 5 minutes
- **Memory Recall** - Automatically recall recent session memories on activation
- **Session Tracking** - Store session-end memory on deactivation

### VS Code Integration
- **Copilot Tools** - 14 Language Model Tools for GitHub Copilot agent mode
- **MCP Server** - Auto-registers as MCP server for Copilot
- **Sidebar Views** - Results, Context, Memories, and Swarm Dashboard
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

### Configure

1. Open Command Palette (`Cmd+Shift+P`) and run **Snipara: Configure**
2. Enter your API key and project ID from [snipara.com/dashboard](https://snipara.com/dashboard)
3. Press `Cmd+Shift+R` to ask your first question

## Commands

All 39 commands are accessible via Command Palette under the "Snipara" category.

### Core Query

| Command | Description |
|---------|-------------|
| Snipara: Ask Question | Semantic search across documentation (Cmd+Shift+R) |
| Snipara: Search Documentation | Regex pattern search |
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

### Info & Settings

| Command | Description |
|---------|-------------|
| Snipara: Show Statistics | View indexed file, section, and line counts |
| Snipara: Read Lines | Read specific line range from documentation |
| Snipara: List Collections | Browse shared context collections |
| Snipara: Upload Shared Document | Upload document to a shared collection |
| Snipara: Show Settings | View project settings |

### Other

| Command | Description |
|---------|-------------|
| Snipara: Configure | Set API key and project ID |

## Sidebar Views

The extension adds 4 views in the Snipara activity bar:

| View | Description |
|------|-------------|
| **Results** | Query results with sections, relevance scores, and token counts |
| **Session Context** | Current session context display |
| **Memories** | Stored memories grouped by type (facts, decisions, learnings, preferences, todos, context) |
| **Swarm Dashboard** | Webview panel for swarm management |

## Copilot Integration

When using GitHub Copilot in agent mode, Snipara provides 14 Language Model Tools:

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

The extension also registers as an **MCP Server Definition Provider**, making all 40 Snipara tools available to Copilot's MCP integration (VS Code 1.99+).

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

## Requirements

- VS Code 1.93.0+, Cursor 0.40+, or any VS Code-compatible editor
- Snipara account ([snipara.com](https://snipara.com))

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
