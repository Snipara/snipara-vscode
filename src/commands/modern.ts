import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ToolName } from "../types";
import { requireConfigured } from "./helpers";

export function registerModernMcpCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showIndexHealth", async () => {
      if (!(await requireConfigured(client))) return;
      const staleThreshold = await vscode.window.showInputBox({
        prompt: "Days after which indexed content is considered stale",
        placeHolder: "30",
        value: "30",
        validateInput: (v) => (/^\d+$/.test(v) ? null : "Enter a number of days"),
      });
      if (!staleThreshold) return;
      await runJsonTool(client, "rlm_index_health", "Index Health", {
        stale_threshold_days: parseInt(staleThreshold, 10),
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showIndexRecommendations", async () => {
      if (!(await requireConfigured(client))) return;
      await runJsonTool(client, "rlm_index_recommendations", "Index Recommendations");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.reindex", async () => {
      if (!(await requireConfigured(client))) return;
      const mode = await vscode.window.showQuickPick(
        [
          { label: "incremental", description: "Update only changed context" },
          { label: "full", description: "Rebuild the selected index" },
        ],
        { placeHolder: "Choose reindex mode" }
      );
      if (!mode) return;

      const kind = await vscode.window.showQuickPick(
        [
          { label: "doc", description: "Documentation/source context index" },
          { label: "code", description: "Code graph index" },
        ],
        { placeHolder: "Choose index kind" }
      );
      if (!kind) return;

      await runJsonTool(client, "rlm_reindex", "Reindex", {
        mode: mode.label,
        kind: kind.label,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showSearchAnalytics", async () => {
      if (!(await requireConfigured(client))) return;
      const days = await vscode.window.showInputBox({
        prompt: "How many days of search analytics?",
        placeHolder: "30",
        value: "30",
        validateInput: (v) => (/^\d+$/.test(v) ? null : "Enter a number of days"),
      });
      if (!days) return;
      await runJsonTool(client, "rlm_search_analytics", "Search Analytics", {
        days: parseInt(days, 10),
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showMemoryHealth", async () => {
      if (!(await requireConfigured(client))) return;
      await runJsonTool(client, "rlm_memory_health", "Memory Health", {
        sample_limit: 10,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showMemoryReviewQueue", async () => {
      if (!(await requireConfigured(client))) return;
      const status = await vscode.window.showQuickPick(
        [
          "candidate",
          "pending",
          "stale",
          "rejected",
          "invalidated",
          "superseded",
          "archived",
          "active",
          "approved",
          "all",
        ],
        { placeHolder: "Choose memory review status" }
      );
      if (!status) return;
      await runJsonTool(client, "rlm_memory_review_queue", "Memory Review Queue", {
        status,
        limit: 50,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.endOfTaskCommit", async () => {
      if (!(await requireConfigured(client))) return;
      const summary = await getSummaryInput();
      if (!summary) return;

      const dryRun = await vscode.window.showQuickPick(
        [
          { label: "Write memories", value: false },
          { label: "Dry run", value: true },
        ],
        { placeHolder: "Persist durable task outcomes?" }
      );
      if (!dryRun) return;

      await runJsonTool(client, "rlm_end_of_task_commit", "End Of Task Commit", {
        summary,
        outcome: "completed",
        category: "vscode-extension",
        dry_run: dryRun.value,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.queryDecisions", async () => {
      if (!(await requireConfigured(client))) return;
      const query = await vscode.window.showInputBox({
        prompt: "Search project decisions",
        placeHolder: "authentication architecture",
      });
      if (query === undefined) return;
      await runJsonTool(client, "rlm_decision_query", "Project Decisions", {
        query,
        limit: 20,
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.getChunk", async () => {
      if (!(await requireConfigured(client))) return;
      const chunkId = await vscode.window.showInputBox({
        prompt: "Chunk ID from a Snipara retrieval result",
        placeHolder: "chunk_...",
      });
      if (!chunkId) return;
      await runJsonTool(client, "rlm_get_chunk", "Chunk", { chunk_id: chunkId });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.codeGraphLookup", async () => {
      if (!(await requireConfigured(client))) return;
      const tool = await vscode.window.showQuickPick(
        [
          { label: "Neighbors", value: "rlm_code_neighbors" as const },
          { label: "Callers", value: "rlm_code_callers" as const },
          { label: "Imports", value: "rlm_code_imports" as const },
        ],
        { placeHolder: "Choose code graph lookup" }
      );
      if (!tool) return;

      const target = await vscode.window.showInputBox({
        prompt: "Repo-qualified symbol name or file path",
        placeHolder: "src.client.SniparaClient or src/client.ts",
      });
      if (!target) return;

      const params =
        tool.value === "rlm_code_imports" && target.includes("/")
          ? { file_path: target, direction: "out" }
          : { qualified_name: target };

      await runJsonTool(client, tool.value, `Code Graph: ${tool.label}`, params);
    })
  );
}

async function runJsonTool(
  client: SniparaClient,
  tool: ToolName,
  title: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Snipara: ${title}...`,
      cancellable: false,
    },
    async () => {
      try {
        const response = await client.callTool(tool, params);
        if (!response.success) {
          vscode.window.showErrorMessage(
            `${title} failed: ${response.error || "Unknown error"}`
          );
          return;
        }

        const doc = await vscode.workspace.openTextDocument({
          content: `# ${title}\n\n\`\`\`json\n${JSON.stringify(response.result ?? {}, null, 2)}\n\`\`\`\n`,
          language: "markdown",
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error) {
        vscode.window.showErrorMessage(
          `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  );
}

async function getSummaryInput(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  const selection = editor?.selection;
  const selectedText =
    editor && selection && !selection.isEmpty ? editor.document.getText(selection) : "";

  if (selectedText.trim()) {
    const pick = await vscode.window.showQuickPick(
      [
        { label: "Use selected text", value: selectedText.trim() },
        { label: "Enter summary manually", value: "" },
      ],
      { placeHolder: "Choose task summary source" }
    );
    if (!pick) return undefined;
    if (pick.value) return pick.value;
  }

  return vscode.window.showInputBox({
    prompt: "Summarize durable task outcomes to persist",
    placeHolder: "Updated VS Code extension positioning and added modern MCP tools",
  });
}
