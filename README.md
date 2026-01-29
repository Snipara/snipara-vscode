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
- **Upload** - Upload .md, .mdx, .txt files directly from explorer
- **Sync** - Bulk sync entire folders to Snipara
- **Summaries** - Store and manage AI-generated document summaries

### VS Code Integration
- **Copilot Tools** - 4 Language Model Tools for GitHub Copilot agent mode
- **MCP Server** - Auto-registers as MCP server for Copilot
- **Sidebar Views** - Results, Context, Memories, and Swarm Dashboard
- **Status Bar** - Quick access to documentation queries
- **Keyboard Shortcut** - Cmd+Shift+R / Ctrl+Shift+R

## Getting Started

1. Install the extension
2. Open Command Palette (Cmd+Shift+P) and run **Snipara: Configure**
3. Enter your API key and project ID from [snipara.com/dashboard](https://snipara.com/dashboard)
4. Press Cmd+Shift+R to ask your first question

## Commands

| Command | Description |
|---------|-------------|
| Snipara: Ask Question | Query documentation with semantic search |
| Snipara: Search Documentation | Regex pattern search |
| Snipara: Multi-Query | Run multiple queries at once |
| Snipara: Decompose Query | Break complex query into sub-queries |
| Snipara: Generate Plan | Create execution plan for complex topics |
| Snipara: Remember | Store a memory (fact, decision, learning, etc.) |
| Snipara: Recall Memory | Semantically search stored memories |
| Snipara: Browse Memories | View all memories in sidebar |
| Snipara: Load Shared Context | Get team standards and best practices |
| Snipara: Upload Document | Upload file to Snipara index |
| Snipara: Configure | Set API key and project ID |

## Copilot Integration

When using GitHub Copilot in agent mode, Snipara provides 4 tools:

- **snipara_contextQuery** - Search documentation
- **snipara_remember** - Store memories
- **snipara_recall** - Recall memories
- **snipara_sharedContext** - Get team standards

These tools are automatically available in Copilot chat when the extension is active.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `snipara.apiKey` | - | Your Snipara API key |
| `snipara.projectId` | - | Your project ID |
| `snipara.serverUrl` | `https://api.snipara.com` | API server URL |
| `snipara.maxTokens` | `4000` | Max tokens for context queries |
| `snipara.searchMode` | `hybrid` | Search mode: keyword, semantic, or hybrid |

## Requirements

- VS Code 1.93.0 or later
- Snipara account ([snipara.com](https://snipara.com))

## Links

- [Documentation](https://snipara.com/docs)
- [Dashboard](https://snipara.com/dashboard)
- [GitHub](https://github.com/alopez3006/snipara-vscode)
- [Issues](https://github.com/alopez3006/snipara-vscode/issues)
