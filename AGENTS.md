# Snipara VSCode Extension

## Current State (v2.0.7)

- **Latest version:** 2.0.7 (Jul 5, 2026)
- **Branch:** dev
- **Package:** `snipara-2.0.7.vsix`

## Build & Package

- Compile: `pnpm run compile` (esbuild, outputs `dist/extension.js`)
- Type-check: `npx tsc --noEmit`
- Package VSIX: `npx vsce package --no-dependencies` (the `--no-dependencies` flag is required due to eventsource transitive dev-dep issues with npm)
- Publish: `npx vsce publish` / `npx ovsx publish`

## Architecture Decisions

- **Demo webview** (`src/views/demo-webview.ts`): Rich HTML panel in the editor area for demo mode results. Contains an inline search bar, suggestion chips, result cards, and sign-in CTA. All input from the webview routes through `vscode.postMessage` → `snipara.askQuestion` command.
- **Workspace activation** (`src/commands/activation.ts`): Native first-run command that scans bounded starter docs, signs in if needed, syncs the workspace corpus, opens the First Work Brief, and offers Copilot/Snipara handoff actions.
- **First Work Brief webview** (`src/views/first-work-brief-webview.ts`): Source-backed editor panel with indexed files, source cards, next questions, Copilot handoff copy action, and Open Copilot Chat action.
- **Document sync** (`src/commands/documents.ts`): Single-root workspaces sync without a folder picker; multi-root workspaces use a VS Code quick pick; no-workspace mode falls back to a folder picker.
- **Package icon** (`resources/icon.png`, `resources/icon.svg`): VSIX uses the blue Snipara S mark.
- **Results are capped to top 3** in the demo webview (`sections.slice(0, 3)`). The sidebar tree view (`src/views/results-provider.ts`) still shows all results.
- **Query input has two paths:** (1) search bar in webview sends `askQuestion` message, (2) suggestion chips send `runSuggestion` message — both execute `snipara.askQuestion` with prefill, skipping the native input box.
- **Demo mode** uses `demoContextQuery()` from `src/demo.ts`: no args → offline hardcoded data; custom query → real API with offline fallback.
- **Offline-first initial demo**: The `snipara.demoQuery` command in `extension.ts` uses hardcoded `DEMO_STATS` directly (no network call), so the webview renders instantly. Only follow-up queries hit the live API.
- **Fetch timeout**: All demo API calls (`demoContextQuery`, `demoGetStats`) use `AbortController` with an 8s timeout (`FETCH_TIMEOUT_MS`). On timeout or network error, they fall back to offline data silently.
- **Token comparison banner on follow-up queries**: `commands/query.ts` fetches stats in parallel via `demoGetStats()` and passes `demoStats` to `showDemoWebview()`, so the "With/Without Snipara" banner persists across queries.
- **Demo API endpoint**: REST at `POST /v1/{project_id}/mcp` with body `{"tool":"<tool_name>","params":{...}}` and `X-API-Key` header.
- **Demo limiter** (`src/demo-limiter.ts`): Tracks demo query count in `globalState`, enforces 3-query limit, shows sign-in wall when exceeded, resets on sign-in.
- **Telemetry** (`src/telemetry.ts`): Tracks funnel events (`extension_activated`, `demo_query`, `demo_limit_reached`, `sign_in_*`). Uses anonymous install ID, respects VS Code telemetry settings, fire-and-forget pattern.

## Commit Style

```
<type>: <description> (v<version>)
```
Types: `feat`, `fix`, `docs`, `refactor`. Always include version tag when bumping.
