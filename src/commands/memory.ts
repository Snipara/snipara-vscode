import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { MemoryProvider } from "../views/memory-provider";
import type { MemoryType, MemoryInfo } from "../types";
import { requireConfigured } from "./helpers";

const MEMORY_TYPE_OPTIONS: { label: string; value: MemoryType }[] = [
  { label: "Fact", value: "fact" },
  { label: "Decision", value: "decision" },
  { label: "Learning", value: "learning" },
  { label: "Preference", value: "preference" },
  { label: "Todo", value: "todo" },
  { label: "Context", value: "context" },
];

export function registerMemoryCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  memoryProvider: MemoryProvider
): void {
  // ─── Remember ─────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.remember", async () => {
      if (!(await requireConfigured(client))) return;

      const content = await vscode.window.showInputBox({
        prompt: "Enter the memory content to store",
        placeHolder: "API uses JWT tokens for authentication",
      });
      if (!content) return;

      const typePick = await vscode.window.showQuickPick(MEMORY_TYPE_OPTIONS, {
        placeHolder: "Select memory type",
      });
      if (!typePick) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Storing memory...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.remember({
              content,
              type: typePick.value,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Memory stored: ${response.result.message}`
              );
              memoryProvider.refresh();
            } else {
              vscode.window.showErrorMessage(
                `Failed to store memory: ${response.error || "Unknown error"}`
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

  // ─── Recall ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.recall", async () => {
      if (!(await requireConfigured(client))) return;

      const query = await vscode.window.showInputBox({
        prompt: "Enter query to recall memories",
        placeHolder: "What decisions did we make about authentication?",
      });
      if (!query) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Recalling memories...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.recall(query);

            if (response.success && response.result) {
              const result = response.result;
              const lines: string[] = [
                `# Memory Recall`,
                ``,
                `**Query:** ${result.query}`,
                `**Found:** ${result.total_found} memories`,
                ``,
              ];

              for (const memory of result.memories) {
                lines.push(`## [${memory.type.toUpperCase()}] ${memory.memory_id}`);
                lines.push(``);
                lines.push(memory.content);
                lines.push(``);
                lines.push(`- **Relevance:** ${(memory.relevance_score * 100).toFixed(1)}%`);
                lines.push(`- **Confidence:** ${(memory.confidence * 100).toFixed(1)}%`);
                lines.push(`- **Scope:** ${memory.scope}`);
                if (memory.category) {
                  lines.push(`- **Category:** ${memory.category}`);
                }
                lines.push(`- **Created:** ${memory.created_at}`);
                lines.push(`- **Access Count:** ${memory.access_count}`);
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
                `Recall failed: ${response.error || "Unknown error"}`
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

  // ─── List Memories ────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.memories", async () => {
      if (!(await requireConfigured(client))) return;

      const typeFilter = await vscode.window.showQuickPick(
        [
          { label: "All Types", value: undefined },
          ...MEMORY_TYPE_OPTIONS,
        ],
        { placeHolder: "Filter by memory type" }
      );
      if (typeFilter === undefined) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading memories...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.memories({
              type: typeFilter.value as MemoryType | undefined,
            });

            if (response.success && response.result) {
              const result = response.result;
              const lines: string[] = [
                `# Memories`,
                ``,
                `**Total:** ${result.total_count}`,
                `**Showing:** ${result.memories.length}`,
                `**Has More:** ${result.has_more ? "Yes" : "No"}`,
                ``,
              ];

              for (const memory of result.memories) {
                lines.push(`## [${memory.type.toUpperCase()}] ${memory.memory_id}`);
                lines.push(``);
                lines.push(memory.content);
                lines.push(``);
                lines.push(`- **Scope:** ${memory.scope}`);
                lines.push(`- **Confidence:** ${(memory.confidence * 100).toFixed(1)}%`);
                if (memory.category) {
                  lines.push(`- **Category:** ${memory.category}`);
                }
                lines.push(`- **Source:** ${memory.source}`);
                lines.push(`- **Created:** ${memory.created_at}`);
                lines.push(`- **Access Count:** ${memory.access_count}`);
                if (memory.expires_at) {
                  lines.push(`- **Expires:** ${memory.expires_at}`);
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
                `Failed to load memories: ${response.error || "Unknown error"}`
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

  // ─── Forget ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.forget", async (arg?: MemoryInfo) => {
      if (!(await requireConfigured(client))) return;

      let memoryId: string | undefined;

      if (arg && arg.memory_id) {
        memoryId = arg.memory_id;
      } else {
        memoryId = await vscode.window.showInputBox({
          prompt: "Enter the memory ID to delete",
          placeHolder: "mem_...",
        });
      }
      if (!memoryId) return;

      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete memory "${memoryId}"?`,
        { modal: true },
        "Delete"
      );
      if (confirm !== "Delete") return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Deleting memory...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.forget({ memoryId });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Memory deleted: ${response.result.message}`
              );
              memoryProvider.refresh();
            } else {
              vscode.window.showErrorMessage(
                `Failed to delete memory: ${response.error || "Unknown error"}`
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
