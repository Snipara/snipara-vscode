# Snipara VSCode Extension

## Current State (v1.6.12)

- **Latest version:** 1.6.12 (Feb 5, 2026)
- **Branch:** main
- **Package:** `snipara-1.6.12.vsix`

## Build & Package

- Compile: `pnpm run compile` (esbuild, outputs `dist/extension.js`)
- Type-check: `npx tsc --noEmit`
- Package VSIX: `npx vsce package --no-dependencies` (the `--no-dependencies` flag is required due to eventsource transitive dev-dep issues with npm)
- Publish: `npx vsce publish` / `npx ovsx publish`

## Architecture Decisions

- **Demo webview** (`src/views/demo-webview.ts`): Rich HTML panel in the editor area for demo mode results. Contains an inline search bar, suggestion chips, result cards, and sign-in CTA. All input from the webview routes through `vscode.postMessage` → `snipara.askQuestion` command.
- **Results are capped to top 3** in the demo webview (`sections.slice(0, 3)`). The sidebar tree view (`src/views/results-provider.ts`) still shows all results.
- **Query input has two paths:** (1) search bar in webview sends `askQuestion` message, (2) suggestion chips send `runSuggestion` message — both execute `snipara.askQuestion` with prefill, skipping the native input box.
- **Demo mode** uses `demoContextQuery()` from `src/demo.ts`: no args → offline hardcoded data; custom query → real API with offline fallback.
- **Offline-first initial demo**: The `snipara.demoQuery` command in `extension.ts` uses hardcoded `DEMO_STATS` directly (no network call), so the webview renders instantly. Only follow-up queries hit the live API.
- **Fetch timeout**: All demo API calls (`demoContextQuery`, `demoGetStats`) use `AbortController` with an 8s timeout (`FETCH_TIMEOUT_MS`). On timeout or network error, they fall back to offline data silently.
- **Token comparison banner on follow-up queries**: `commands/query.ts` fetches stats in parallel via `demoGetStats()` and passes `demoStats` to `showDemoWebview()`, so the "With/Without Snipara" banner persists across queries.
- **Demo API endpoint**: REST at `POST /v1/{project_id}/mcp` with body `{"tool":"<tool_name>","params":{...}}` and `X-API-Key` header.

## Commit Style

```
<type>: <description> (v<version>)
```
Types: `feat`, `fix`, `docs`, `refactor`. Always include version tag when bumping.
