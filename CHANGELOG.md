# Changelog

## [1.1.0] - 2025-01-30

### Added
- 10 new Copilot Language Model Tools (14 total):
  - `snipara_search` - Regex pattern search across documentation
  - `snipara_askQuick` - Quick documentation lookup (~2500 tokens)
  - `snipara_multiQuery` - Parallel multi-query with shared token budget
  - `snipara_plan` - Execution plan generation for complex queries
  - `snipara_decompose` - Query decomposition into sub-queries
  - `snipara_multiProjectQuery` - Cross-project team search
  - `snipara_memories` - Browse stored memories with filters
  - `snipara_forget` - Delete memories by ID, type, or category
  - `snipara_stats` - Documentation statistics (files, sections, characters)
  - `snipara_uploadDocument` - Upload documents to Snipara index
- Session lifecycle automation:
  - `enableAutoRestore` setting - Restore previous session context on startup
  - `enableAutoSave` setting - Periodic context save (every 5 minutes)
  - Automatic memory recall on activation
  - Session-end memory on deactivation
- 5 new Command Palette commands (39 total):
  - Show Statistics - View indexed file/section/line counts
  - Read Lines - Read specific line ranges from documentation
  - List Collections - Browse shared context collections
  - Upload Shared Document - Multi-step upload wizard with editor content support
  - Show Settings - View project settings in markdown preview

## [1.0.0] - 2025-01-29

### Added
- 32 commands covering all Snipara MCP tools
- Semantic documentation search with AI-optimized context
- Agent memory (remember, recall, browse, forget)
- Swarm coordination (create, join, tasks, resources, state)
- Shared context collections and prompt templates
- Document upload and sync from explorer context menu
- Summary management for documentation
- Multi-query and query decomposition
- Execution plan generation
- Multi-project cross-search
- Session context injection and management
- Memory browser TreeView with type grouping
- Swarm Dashboard WebView
- 4 Copilot Language Model Tools (contextQuery, remember, recall, sharedContext)
- MCP Server Definition Provider for VS Code Copilot
- Keyboard shortcut: Cmd+Shift+R / Ctrl+Shift+R for quick query
- Status bar integration
- File explorer context menu for .md/.mdx/.txt upload
