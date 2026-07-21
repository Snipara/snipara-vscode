# Changelog

## [2.0.9] - 2026-07-21

### Changed

- **Canonical positioning:** Marketplace metadata and README now lead with
  Snipara as the Project Brain for AI coding agents and explain the shared
  Project Intelligence layer behind it.
- **Category discovery:** Added project context, memory, workflow continuity,
  Claude Code, Cursor, and Codex search terms without changing the extension's
  behavior or supported editor surfaces.

## [2.0.8] - 2026-07-05

### Changed
- **Native activation contract:** `Snipara: Activate Workspace` now runs `npx -y create-snipara@latest init --client vscode --starter --json` and consumes the versioned `.snipara/activation/activation-manifest.json` contract.
- **First Work Brief:** The webview now renders contract fields for activation artifacts, lanes, next actions, indexed files, and source-backed starting points.
- **Status bar:** Successful activation sets the status entry to `Snipara Active`.

### Removed
- **Extension-side activation scanner:** Workspace activation no longer scans, syncs, or generates the First Work Brief inside the VS Code extension. `create-snipara` remains the canonical activation engine.

## [2.0.7] - 2026-07-05

### Changed
- **VSIX icon:** Replaced the package icon with the new blue Snipara S mark.

## [2.0.6] - 2026-07-05

### Changed
- **Activation handoff:** First Work Brief now includes actions to copy a Copilot-ready handoff prompt and open Copilot Chat after workspace activation.
- **Workspace sync:** `Snipara: Sync Documents` now syncs the single open workspace directly, uses a VS Code quick pick for multi-root workspaces, and only falls back to a folder picker when no workspace is open.

## [2.0.5] - 2026-07-05

### Added
- **Workspace activation:** Added `Snipara: Activate Workspace`, a first-run flow that signs in if needed, indexes a bounded starter corpus from the open workspace, runs a real source-backed project query, and opens a **First Work Brief** in the editor.
- **First Work Brief webview:** Shows indexed starter files, source-backed starting points, follow-up questions, and a direct action back into Snipara tools.

### Changed
- **Onboarding:** The Getting Started walkthrough, Welcome view, workspace scanner prompt, and empty Results view now lead with workspace activation instead of the generic demo.
- **Demo positioning:** Demo mode remains available as a no-account fallback, but no longer acts as the primary proof path for new installs.

## [2.0.4] - 2026-05-31

### Fixed
- **Onboarding:** The demo query no longer auto-runs on every unconfigured activation. First-run users still get the Getting Started walkthrough, but the demo now starts only after clicking **Try Demo Query**.
- **Demo quota:** Existing unconfigured users who already ran the demo are marked as onboarded, avoiding surprise walkthroughs after updating and preserving their remaining demo queries.
- **VSIX hygiene:** Exclude `CLAUDE.md` from packaged extension artifacts alongside other local agent instruction files.
- **Documentation:** Refreshed the README for the current 2.0.x connector surface, including VS Code vs Cursor support, opt-in demo behavior, 63 commands, 38 Copilot tools, MCP support, runtime/local readiness, and packaging guidance.
- **Snipara Sandbox:** Replaced the legacy runtime wording and CLI integration with `snipara-sandbox` from PyPI. Sandbox commands now call `snipara-sandbox run`, `snipara-sandbox logs`, `snipara-sandbox visualize`, and `snipara-sandbox doctor`.

## [2.0.1] - 2026-05-11

### Major Release
- **Project memory positioning:** Reframed the VS Code extension around project-scoped memory and source-backed agent context instead of token-reduction-first messaging.
- **Modern MCP surface:** Added commands for index health, index recommendations, reindex, search analytics, memory health, memory review queue, end-of-task commit, decision query, chunk loading, and code graph lookup.
- **Expanded Copilot tools:** Added modern MCP shortcuts for chunk loading, code graph traversal, novel memory writes, end-of-task commits, memory health/review, structured decisions, index operations, analytics, query trends, and hierarchical task workflows.
- **Demo refresh:** Updated the first-run demo, walkthrough, welcome view, and result banners to show durable project context and agent memory workflows.
- **Free account messaging:** Replaced obsolete paid-plan preview copy with current free account wording across README, onboarding, and sign-in prompts.

## [1.7.0] - 2026-04-27

### Added
- **Doctor / Local Readiness:** Native VS Code panel for local setup checks covering workspace `.env` files, provider key presence, Snipara auth, Snipara Sandbox, and Docker.
- **Workflow and runtime suggestions:** Quick actions to start Snipara workflow commands or runtime execution directly from the readiness panel.
- **Sandbox doctor:** `snipara-sandbox doctor` is available from the panel when Snipara Sandbox is installed; core readiness checks do not depend on `snipara-companion`.

### Changed
- **VSIX hygiene:** Exclude local agent files (`AGENTS.md`, `.claude/**`) from packaged extension artifacts.

## [1.6.17] - 2026-03-10

### Added
- **Index Health & Analytics (Sprint 3):** New MCP tools for monitoring documentation health and search performance:
  - `rlm_index_health` - Get comprehensive health metrics (coverage, quality, tier distribution, stale docs)
  - `rlm_index_recommendations` - Get actionable recommendations to improve index health
  - `rlm_search_analytics` - Get search performance metrics (queries, success rate, latency percentiles, tool usage)
  - `rlm_query_trends` - Get query trends over time with configurable granularity
- **Health Score:** Composite 0-100 score based on coverage (40%), quality (30%), and freshness (30%)
- **Latency Percentiles:** p50, p75, p90, p95, p99 response time metrics
- **Error Analysis:** Categorized error breakdown with examples

## [1.6.16] - 2026-02-11

### Added
- **Demo friction:** Limited demo mode to 3 queries before prompting sign-in — helps convert demo users to registered accounts
- **Demo query counter:** Badge in demo webview now shows remaining queries (e.g., "Demo • 2 queries left")
- **Telemetry:** Track key funnel events — extension activations, demo queries, demo limit reached, sign-in started/completed/failed
- **Anonymous install ID:** Telemetry uses a randomly-generated install ID stored in globalState (no PII)

### Improved
- **Sign-in CTA:** Redesigned demo webview CTA with clear value proposition:
  - "Free account available"
  - "No credit card required"
  - "Project memory and source-backed retrieval"
  - Note about Claude Code, Cursor, and Windsurf compatibility
- **Sign-in wall:** Modal prompt when demo limit reached now emphasizes free account sign-in
- **Demo counter reset:** Signing in now resets the demo query counter

### Technical
- New modules: `src/demo-limiter.ts` (query limit tracking), `src/telemetry.ts` (event tracking)
- Telemetry respects VS Code's `telemetry.telemetryLevel` setting
- Fire-and-forget telemetry (non-blocking, silent failures)

## [1.6.15] - 2026-02-08

### Fixed
- **Onboarding:** Demo now auto-runs when extension activates for new users — no need to manually click "See it in action"
- **Walkthrough focus:** Walkthrough opens directly on the demo step instead of defaulting to sign-in

## [1.6.14] - 2026-02-08

### Fixed
- **Suggestion chips:** Escaped single quotes in chip text so they're clickable
- **Demo content:** Refreshed offline fallback to match new demo project docs

### Changed
- **Token limit:** Increased `max_tokens` from 4000 to 6000 for richer responses

## [1.6.13] - 2026-02-08

### Changed
- **Demo content refresh:** Demo now showcases Snipara's commercial value — integrations (Claude Code, Cursor, Windsurf, Copilot), pricing plans, and hooks/automations instead of generic technical docs
- **Demo files:** Shows realistic mix of `docs/` and `blog/` paths (integrations, pricing, hooks, tutorials)
- **Follow-up questions:** Product-focused suggestions ("What are Snipara's pricing plans?", "How do hooks and automations work?", "How do I get started?")

## [1.6.12] - 2026-02-05

### Fixed
- **Offline-first demo:** Initial demo query now uses hardcoded data directly — renders instantly with no network call
- **Fetch timeouts:** All demo API calls use 8s timeout with `AbortController`; on timeout or network error, falls back to offline data silently
- **Stats banner on follow-ups:** Token comparison banner ("With/Without Snipara") now persists across follow-up queries by fetching stats in parallel

## [1.6.11] - 2026-02-05

### Added
- **Search bar in demo webview:** Users can now type custom questions directly in the results panel instead of relying only on suggestion chips

### Fixed
- **Too many results:** Demo webview now shows the top 3 most relevant results instead of dumping every section returned by the API

## [1.6.10] - 2026-02-05

### Added
- **Live demo queries:** Follow-up questions and suggestion chips now hit the real Snipara API against a dedicated read-only demo project — users get accurate, varied answers about pricing, features, setup, MCP integration, and more instead of the same 3 hardcoded sections every time
- **Clickable suggestion chips:** Clicking a suggestion chip in the demo webview now runs that query directly (no input box in the way)
- **Offline fallback:** The initial "Try Demo Query" and any network-failure scenario gracefully fall back to embedded offline data — demo never breaks

### Changed
- `askQuestion` command accepts an optional `prefill` argument — when provided (e.g., from suggestion chips), skips the input box and runs the query immediately
- `demoContextQuery` now accepts an optional `query` parameter: no args → offline hardcoded; custom query → real API with fallback

## [1.6.8] - 2026-02-05

### Fixed
- **Demo mode works offline:** Demo no longer requires API key — uses embedded sample data (3 sections from a simulated 487K-token project) with realistic latency. No network calls.
- **CTA updated:** All sign-in prompts now emphasize free account sign-in instead of quota-specific copy

## [1.6.7] - 2026-02-05

### Fixed
- **Extension activation crash:** Added `contributes.mcpServerDefinitionProviders` declaration for `"snipara-mcp"` — VS Code now requires MCP providers to be declared in package.json before runtime registration; missing declaration caused `Activating extension failed` error
- **Extension was disabled:** Removed `snipara.snipara` from VS Code's disabled extensions state (had been inadvertently disabled during rapid version iteration)

## [1.6.6] - 2026-02-05

### Fixed
- **Copilot Agent mode auto-enable:** Changed `tags` from `[]` to `["extension_installed_by_tool"]` on all 19 Language Model Tools — Copilot Chat 0.36.2 only auto-enables third-party tools in Agent mode if they carry this tag; without it, tools are silently filtered out of the available tools list even when correctly registered

## [1.6.5] - 2026-02-05

### Fixed
- **Copilot tool confirmation:** Added `prepareInvocation` to all 19 Language Model Tools — provides confirmation message for Copilot's tool approval dialog (matches official VS Code example)
- **Copilot tool icons:** Added `icon` field to all 19 tools (e.g., `$(search)`, `$(save)`, `$(history)`) for display in the tool picker UI
- **Diagnostic logging:** Tool registration now logs individual tool names and verifies visibility via `vscode.lm.tools` — check Developer Tools console for `Snipara:` entries

## [1.6.4] - 2026-02-05

### Fixed
- **Copilot Agent mode:** Added `canBeReferencedInPrompt: true` to all 19 Language Model Tools — required for tools to be available in Agent mode ([VS Code issue #246132](https://github.com/microsoft/vscode/issues/246132))

## [1.6.3] - 2026-02-05

### Fixed
- **Copilot tool picker:** Added `toolReferenceName` to all 19 tools — required for Copilot to display tools in the tool picker UI (e.g., `sniparaQuery`, `sniparaRemember`)
- **Copilot tool picker:** Added `userDescription` to all 19 tools — required user-facing description shown in the tool picker

## [1.6.2] - 2026-02-05

### Fixed
- **Copilot Chat crash:** Added `tags: []` to all 19 Language Model Tools — fixes `TypeError: e is not iterable` crash in Copilot Chat 0.36.2 when iterating tool contributions

## [1.6.1] - 2026-02-05

### Fixed
- Added `required: []` to 6 tools that were missing the field in their `inputSchema` (`snipara_stats`, `snipara_sharedContext`, `snipara_memories`, `snipara_forget`, `snipara_loadProject`, `snipara_replContext`)

## [1.6.0] - 2026-02-04

### Added
- **Demo Mode** — Try Snipara without signing in. `Ask Question` and `Search Documentation` now fall back to a public demo project (Snipara's own docs) when not configured
- **Try Demo Query command** — One-click canned demo query with parallel stats + context fetch, showing a full value comparison dashboard
- **Value Comparison Dashboard** — Demo results show an expandable banner with token savings (e.g., "99.2% reduction"), cost comparison ($0.73 vs $0.006 per query), latency, and a sign-in CTA
- **VS Code Walkthrough** — 4-step guided onboarding (demo → sign in → index → query) auto-opens on first install, replacing the old welcome notification
- **Welcome sidebar view** — New tree view (visible when not signed in) showing value proposition, workspace doc stats, and action buttons for demo, sign-in, and walkthrough
- **Workspace doc scanner** — Auto-detects `.md`, `.mdx`, `.txt` files in the workspace 3s after activation, shows file count and estimated token savings, and offers to index or try demo
- **viewsWelcome content** — Results view now shows contextual empty-state buttons: "Try Demo Query" + "Sign in" when unconfigured, "Ask Question" when configured
- 1 new Command Palette command (48 total): `Snipara: Try Demo Query`

### Improved
- `Ask Question` and `Search Documentation` no longer require sign-in — they transparently use demo mode with "(Demo)" label in progress notifications
- Status bar and all configuration-dependent views now consistently set `snipara.isConfigured` context key for proper `when`-clause visibility
- Consolidated demo imports in extension.ts (removed duplicate import)

## [1.5.1] - 2026-02-03

### Fixed
- **Onboarding:** Status bar now shows "Sign in" with warning highlight when not configured, making it obvious users need to sign in
- **Onboarding:** "Sign in with GitHub" now correctly updates the status bar after successful authentication
- **Onboarding:** Command error messages now mention the free account path and show "Sign in with GitHub" as primary action instead of generic "Configure" button

## [1.5.0] - 2026-02-02

### Added
- Orchestration tools — advanced context exploration for Pro/Team plans:
  - `Snipara: Load Document (Raw)` — Load raw document content by file path (Pro+)
  - `Snipara: Load Project` — Token-budgeted dump of all project files with path filtering (Team+)
  - `Snipara: Orchestrate` — Multi-round context exploration: scan → search → raw load in one call (Team+)
  - `Snipara: Build REPL Context` — Package project context with Python helpers for REPL sessions (Pro+)
- 4 new Copilot Language Model Tools (19 total):
  - `snipara_loadDocument` — Load raw document content by path
  - `snipara_loadProject` — Load full project with token budgeting
  - `snipara_orchestrate` — Multi-round context exploration
  - `snipara_replContext` — Package context for REPL with Python helpers
- 4 new Command Palette commands (47 total)

## [1.4.0] - 2026-02-01

### Improved
- Onboarding experience: welcome notification now highlights the free account path (no credit card required)
- README: added prominent "Quick Start (Free)" section at the top for faster first-time setup
- README: simplified Configure section with auto-setup as the default path

## [1.3.1] - 2026-01-31

### Fixed
- **Critical:** Auto-registration endpoint used `snipara.com` which returns a 301 redirect to `www.snipara.com`, silently converting POST requests to GET (per HTTP spec). This caused all "Sign in with GitHub" attempts to fail with no visible error. Changed to `www.snipara.com` so plugin-register calls now reach the backend correctly.

## [1.2.0] - 2026-01-30

### Added
- Snipara Sandbox integration — lightweight sandbox bridge for code execution:
  - `Snipara Sandbox: Execute in Docker (Isolated)` — Run tasks in Docker-isolated environment via `snipara-sandbox run --env docker`
  - `Snipara Sandbox: Execute Locally` — Run tasks locally via `snipara-sandbox run --env local`
  - `Snipara Sandbox: View Execution Logs` — View recent execution history
  - `Snipara Sandbox: Launch Trajectory Visualizer` — Open Streamlit dashboard at localhost:8501
- Sandbox status bar item showing Snipara Sandbox + Docker availability (installed/running/missing)
- `snipara_executePython` Copilot Language Model Tool (15 total) — Execute Python code with optional Docker isolation
- "Snipara Sandbox" output channel for streaming execution output
- `snipara.sandboxEnabled` setting to toggle sandbox integration
- Graceful degradation: install prompt with terminal setup when `snipara-sandbox` CLI is not found
- Auto-detection of `snipara-sandbox` CLI and Docker daemon on activation (non-blocking)
- `snipara.sandboxInstalled` and `snipara.dockerRunning` context keys for when-clause visibility

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
