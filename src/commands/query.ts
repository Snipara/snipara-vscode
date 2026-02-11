import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ResultsProvider } from "../views/results-provider";
import type { ContextSection, SearchResult } from "../types";
import { requireConfigured, isDemoMode } from "./helpers";
import { demoContextQuery, demoGetStats, calculateDemoStats } from "../demo";
import { showDemoWebview } from "../views/demo-webview";
import { getDemoLimiter } from "../demo-limiter";
import { trackEvent } from "../telemetry";

export function registerQueryCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  resultsProvider: ResultsProvider
): void {
  // ─── Ask Question ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.askQuestion", async (prefill?: string) => {
      const isDemo = isDemoMode(client);
      const demoLimiter = getDemoLimiter();

      // Check demo limit before proceeding
      if (isDemo && demoLimiter?.isLimitReached()) {
        trackEvent("demo_limit_reached");
        await demoLimiter.showSignInWall();
        return;
      }

      const remainingQueries = isDemo ? demoLimiter?.getRemainingCount() ?? 0 : 0;
      const query = typeof prefill === "string" && prefill.length > 0
        ? prefill
        : await vscode.window.showInputBox({
            prompt: isDemo
              ? `Enter your question (demo mode — ${remainingQueries} queries left)`
              : "Enter your question",
            placeHolder: "How does authentication work?",
          });
      if (!query) return;

      // Increment demo count before query
      if (isDemo && demoLimiter) {
        await demoLimiter.incrementCount();
        trackEvent("demo_query", { remaining: demoLimiter.getRemainingCount() });
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: isDemo
            ? "Snipara (Demo): Querying documentation..."
            : "Snipara: Querying documentation...",
          cancellable: false,
        },
        async () => {
          try {
            const [response, statsResponse] = isDemo
              ? await Promise.all([demoContextQuery(query), demoGetStats()])
              : [await client.contextQuery(query), undefined];

            if (response.success && response.result) {
              const demoStats =
                isDemo && statsResponse?.success && statsResponse.result
                  ? calculateDemoStats(
                      Math.ceil(statsResponse.result.total_characters / 4),
                      response.result.total_tokens,
                      response.usage?.latency_ms ?? 0
                    )
                  : undefined;

              resultsProvider.setResults(
                query,
                response.result.sections,
                response.result.total_tokens,
                response.result.suggestions,
                { isDemo, demoStats }
              );

              const sectionCount = response.result.sections.length;
              vscode.window.showInformationMessage(
                `Found ${sectionCount} relevant section${sectionCount !== 1 ? "s" : ""} (${response.result.total_tokens} tokens)`
              );

              if (isDemo) {
                showDemoWebview(
                  context.extensionUri,
                  query,
                  response.result.sections,
                  response.result.suggestions ?? [],
                  demoStats,
                  demoLimiter?.getRemainingCount() ?? 0
                );
              }
            } else {
              vscode.window.showErrorMessage(
                `Query failed: ${response.error || "Unknown error"}`
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

  // ─── Search Documentation ─────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.searchDocs", async () => {
      const isDemo = isDemoMode(client);
      const demoLimiter = getDemoLimiter();

      // Check demo limit before proceeding
      if (isDemo && demoLimiter?.isLimitReached()) {
        trackEvent("demo_limit_reached");
        await demoLimiter.showSignInWall();
        return;
      }

      const remainingQueries = isDemo ? demoLimiter?.getRemainingCount() ?? 0 : 0;
      const pattern = await vscode.window.showInputBox({
        prompt: isDemo
          ? `Enter search pattern (demo mode — ${remainingQueries} queries left)`
          : "Enter search pattern (regex supported)",
        placeHolder: "function.*authenticate",
      });
      if (!pattern) return;

      // Increment demo count before query
      if (isDemo && demoLimiter) {
        await demoLimiter.incrementCount();
        trackEvent("demo_query", { remaining: demoLimiter.getRemainingCount() });
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: isDemo ? "Snipara (Demo): Searching..." : "Snipara: Searching...",
          cancellable: false,
        },
        async () => {
          try {
            if (isDemo) {
              // Offline demo: return the same demo sections as a search result
              const demoResponse = await demoContextQuery(pattern);
              if (demoResponse.success && demoResponse.result) {
                resultsProvider.setResults(pattern, demoResponse.result.sections, demoResponse.result.total_tokens, [], { isDemo });
                showDemoWebview(
                  context.extensionUri,
                  pattern,
                  demoResponse.result.sections,
                  demoResponse.result.suggestions ?? [],
                  undefined,
                  demoLimiter?.getRemainingCount() ?? 0
                );
              }
              return;
            }

            const response = await client.search(pattern);

            if (response.success && response.result) {
              const sections: ContextSection[] = response.result.map(
                (r: SearchResult, i: number) => ({
                  title: `Match ${i + 1}`,
                  content: r.content,
                  file: r.file || "unknown",
                  lines: [r.line, r.line] as [number, number],
                  relevance_score: 1.0,
                  token_count: Math.ceil(r.content.length / 4),
                  truncated: false,
                })
              );

              resultsProvider.setResults(pattern, sections, 0, []);

              vscode.window.showInformationMessage(
                `Found ${sections.length} match${sections.length !== 1 ? "es" : ""}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Search failed: ${response.error || "Unknown error"}`
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

  // ─── Multi Query ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.multiQuery", async () => {
      if (!(await requireConfigured(client))) return;

      const input = await vscode.window.showInputBox({
        prompt: "Enter queries separated by commas",
        placeHolder: "authentication, database schema, API endpoints",
      });
      if (!input) return;

      const queries = input
        .split(",")
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
        .map((q) => ({ query: q }));

      if (queries.length === 0) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Snipara: Running ${queries.length} queries...`,
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.multiQuery(queries);

            if (response.success && response.result) {
              const allSections: ContextSection[] = [];
              for (const item of response.result.results) {
                allSections.push(...item.sections);
              }

              resultsProvider.setResults(
                input,
                allSections,
                response.result.total_tokens
              );

              vscode.window.showInformationMessage(
                `Found ${allSections.length} section${allSections.length !== 1 ? "s" : ""} across ${queries.length} queries (${response.result.total_tokens} tokens)`
              );
            } else {
              vscode.window.showErrorMessage(
                `Multi-query failed: ${response.error || "Unknown error"}`
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

  // ─── Decompose ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.decompose", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Enter a complex query to decompose",
        placeHolder: "How does the full authentication flow work end-to-end?",
      });
      if (!query) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Decomposing query...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.decompose(query);

            if (response.success && response.result) {
              const result = response.result;
              const lines: string[] = [
                `# Query Decomposition`,
                ``,
                `**Original Query:** ${result.original_query}`,
                `**Strategy:** ${result.strategy_used}`,
                `**Estimated Tokens:** ${result.total_estimated_tokens}`,
                ``,
                `## Sub-Queries`,
                ``,
              ];

              for (const sq of result.sub_queries) {
                lines.push(`### ${sq.id}. ${sq.query}`);
                lines.push(`- Priority: ${sq.priority}`);
                lines.push(`- Estimated Tokens: ${sq.estimated_tokens}`);
                lines.push(`- Key Terms: ${sq.key_terms.join(", ")}`);
                lines.push(``);
              }

              if (result.dependencies.length > 0) {
                lines.push(`## Dependencies`);
                lines.push(``);
                for (const [from, to] of result.dependencies) {
                  lines.push(`- Query ${from} -> Query ${to}`);
                }
                lines.push(``);
              }

              lines.push(`## Suggested Sequence`);
              lines.push(``);
              lines.push(result.suggested_sequence.join(" -> "));

              const doc = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Decompose failed: ${response.error || "Unknown error"}`
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

  // ─── Plan ─────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.plan", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Enter a query to generate an execution plan",
        placeHolder: "Implement OAuth 2.0 integration",
      });
      if (!query) return;

      const strategyPick = await vscode.window.showQuickPick(
        [
          { label: "Relevance First", description: "Prioritize most relevant results", value: "relevance_first" as const },
          { label: "Depth First", description: "Sequential deep exploration", value: "depth_first" as const },
          { label: "Breadth First", description: "Parallel broad exploration", value: "breadth_first" as const },
        ],
        { placeHolder: "Select execution strategy" }
      );
      if (!strategyPick) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Generating execution plan...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.plan(query, {
              strategy: strategyPick.value,
            });

            if (response.success && response.result) {
              const result = response.result;
              const lines: string[] = [
                `# Execution Plan`,
                ``,
                `**Plan ID:** ${result.plan_id}`,
                `**Query:** ${result.query}`,
                `**Strategy:** ${result.strategy}`,
                `**Estimated Queries:** ${result.estimated_queries}`,
                `**Estimated Total Tokens:** ${result.estimated_total_tokens}`,
                ``,
                `## Steps`,
                ``,
              ];

              for (const step of result.steps) {
                lines.push(`### Step ${step.step}: ${step.action}`);
                lines.push(`- **Expected Output:** ${step.expected_output}`);
                if (step.depends_on.length > 0) {
                  lines.push(`- **Depends On:** Steps ${step.depends_on.join(", ")}`);
                }
                lines.push(`- **Params:** \`${JSON.stringify(step.params)}\``);
                lines.push(``);
              }

              const doc = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Plan failed: ${response.error || "Unknown error"}`
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

  // ─── Multi-Project Query ──────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.multiProjectQuery", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Enter query to search across all projects",
        placeHolder: "How is authentication implemented?",
      });
      if (!query) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Searching across projects...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.multiProjectQuery(query);

            if (response.success && response.result) {
              const allSections: ContextSection[] = [];
              for (const project of response.result.results) {
                for (const section of project.sections) {
                  allSections.push({
                    ...section,
                    title: `[${project.project_name}] ${section.title}`,
                  });
                }
              }

              resultsProvider.setResults(
                query,
                allSections,
                response.result.total_tokens
              );

              const projectCount = response.result.results.length;
              vscode.window.showInformationMessage(
                `Found ${allSections.length} section${allSections.length !== 1 ? "s" : ""} across ${projectCount} project${projectCount !== 1 ? "s" : ""} (${response.result.total_tokens} tokens)`
              );
            } else {
              vscode.window.showErrorMessage(
                `Multi-project query failed: ${response.error || "Unknown error"}`
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
