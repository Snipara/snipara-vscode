import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ResultsProvider } from "../views/results-provider";
import type { ContextSection } from "../types";
import { requireConfigured } from "./helpers";

export function registerOrchestrationCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  resultsProvider: ResultsProvider
): void {
  // ─── Load Document ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.loadDocument", async () => {
      if (!(await requireConfigured(client))) return;

      const path = await vscode.window.showInputBox({
        prompt: "Enter document path to load",
        placeHolder: "docs/api.md",
      });
      if (!path) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading document...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.loadDocument(path);

            if (response.success && response.result) {
              const r = response.result;
              const doc = await vscode.workspace.openTextDocument({
                content:
                  `# ${r.path}\n` +
                  `<!-- Lines: ${r.lines} | Tokens: ${r.token_count} -->\n\n` +
                  r.content,
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Load document failed: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Load Project ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.loadProject", async () => {
      if (!(await requireConfigured(client))) return;

      const filterInput = await vscode.window.showInputBox({
        prompt: "Path prefixes to include (comma-separated, or empty for all)",
        placeHolder: "docs/, src/",
      });

      const pathsFilter = filterInput
        ? filterInput.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
        : [];

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading project...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.loadProject({ pathsFilter });

            if (response.success && response.result) {
              const r = response.result;
              const lines: string[] = [
                `# Project Overview`,
                ``,
                `**Files:** ${r.returned_files}/${r.total_files}`,
                `**Tokens:** ${r.total_tokens}/${r.max_tokens}`,
                ``,
              ];

              for (const d of r.documents) {
                lines.push(`## ${d.path}`);
                lines.push(`Lines: ${d.lines} | Tokens: ${d.token_count}${d.truncated ? " (truncated)" : ""}`);
                if (d.content) {
                  lines.push(``);
                  lines.push(d.content);
                }
                lines.push(``);
                lines.push(`---`);
                lines.push(``);
              }

              const doc = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Load project failed: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Orchestrate ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.orchestrate", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Enter query for multi-round orchestration",
        placeHolder: "How does the authentication flow work?",
      });
      if (!query) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Orchestrating...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.orchestrate(query);

            if (response.success && response.result) {
              const r = response.result;
              const raw = r.rounds.raw_load;

              // Show raw documents in results view
              const sections: ContextSection[] = raw.documents.map((d) => ({
                title: d.path,
                content: d.content,
                file: d.path,
                lines: [1, 1] as [number, number],
                relevance_score: d.relevance_score,
                token_count: d.token_count,
                truncated: d.truncated,
              }));

              resultsProvider.setResults(query, sections, raw.total_tokens);

              vscode.window.showInformationMessage(
                `Orchestration complete: scanned ${r.rounds.sections_scan.total_files} files, loaded ${raw.files_loaded} documents (${raw.total_tokens} tokens)`
              );
            } else {
              vscode.window.showErrorMessage(
                `Orchestrate failed: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── REPL Context ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.replContext", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Optional relevance query (leave empty for all files within budget)",
        placeHolder: "authentication flow",
      });

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Building REPL context...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.replContext({
              query: query || undefined,
            });

            if (response.success && response.result) {
              const r = response.result;
              const ctx = r.context_data;

              const lines: string[] = [
                `# REPL Context`,
                ``,
                `**Files:** ${ctx.loaded_files}/${ctx.total_files_in_project}`,
                `**Tokens:** ${r.total_tokens}`,
                ``,
                `## Loaded Files`,
                ``,
              ];

              for (const [path, info] of Object.entries(ctx.files)) {
                lines.push(`- **${path}** — ${info.tokens} tokens${info.truncated ? " (truncated)" : ""}`);
              }

              lines.push(``);
              lines.push(`## Usage`);
              lines.push(``);
              lines.push(r.usage_hint);

              if (r.setup_code) {
                lines.push(``);
                lines.push(`## Setup Code`);
                lines.push(``);
                lines.push("```python");
                lines.push(r.setup_code);
                lines.push("```");
              }

              const doc = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `REPL context failed: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );
}
