import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import { requireConfigured } from "./helpers";

export function registerInfoCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Show Statistics ─────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showStats", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading statistics...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.getStats();

            if (response.success && response.result) {
              const stats = response.result;
              vscode.window.showInformationMessage(
                `Snipara Stats: ${stats.files_loaded} files, ${stats.sections} sections, ${stats.total_lines.toLocaleString()} lines, ${stats.total_characters.toLocaleString()} chars`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to load stats: ${response.error || "Unknown error"}`
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

  // ─── Read Lines ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.readLines", async () => {
      if (!(await requireConfigured(client))) return;

      const startLine = await vscode.window.showInputBox({
        prompt: "Start line number",
        placeHolder: "1",
        validateInput: (v) =>
          /^\d+$/.test(v) ? null : "Enter a valid line number",
      });
      if (!startLine) return;

      const endLine = await vscode.window.showInputBox({
        prompt: "End line number",
        placeHolder: "50",
        validateInput: (v) =>
          /^\d+$/.test(v) ? null : "Enter a valid line number",
      });
      if (!endLine) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Reading lines...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.readLines(
              parseInt(startLine, 10),
              parseInt(endLine, 10)
            );

            if (response.success && response.result) {
              const doc = await vscode.workspace.openTextDocument({
                content:
                  typeof response.result === "string"
                    ? response.result
                    : JSON.stringify(response.result, null, 2),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Failed to read lines: ${response.error || "Unknown error"}`
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

  // ─── List Collections ────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.listCollections", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading collections...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.listCollections();

            if (response.success && response.result) {
              const collections = response.result;

              if (collections.length === 0) {
                vscode.window.showInformationMessage("No shared collections found.");
                return;
              }

              const pick = await vscode.window.showQuickPick(
                collections.map((c) => ({
                  label: c.name,
                  description: c.is_public ? "Public" : "Private",
                  detail: `${c.document_count} documents`,
                  collectionId: c.collection_id,
                })),
                { placeHolder: "Select a collection to view" }
              );

              if (pick) {
                vscode.window.showInformationMessage(
                  `Collection: ${pick.label} (${pick.collectionId})`
                );
              }
            } else {
              vscode.window.showErrorMessage(
                `Failed to list collections: ${response.error || "Unknown error"}`
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

  // ─── Upload Shared Document ──────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.uploadSharedDocument", async () => {
      if (!(await requireConfigured(client))) return;

      const collectionId = await vscode.window.showInputBox({
        prompt: "Enter collection ID",
        placeHolder: "collection-id",
      });
      if (!collectionId) return;

      const title = await vscode.window.showInputBox({
        prompt: "Enter document title",
        placeHolder: "TypeScript Coding Standards",
      });
      if (!title) return;

      const editor = vscode.window.activeTextEditor;
      let content: string | undefined;

      if (editor && editor.document.getText().length > 0) {
        const useEditor = await vscode.window.showQuickPick(
          [
            { label: "Use active editor content", value: "editor" },
            { label: "Enter content manually", value: "manual" },
          ],
          { placeHolder: "Where should the content come from?" }
        );

        if (!useEditor) return;

        if (useEditor.value === "editor") {
          content = editor.document.getText();
        }
      }

      if (!content) {
        content = await vscode.window.showInputBox({
          prompt: "Enter document content (markdown)",
          placeHolder: "# Document content...",
        });
        if (!content) return;
      }

      const categoryPick = await vscode.window.showQuickPick(
        [
          { label: "BEST_PRACTICES", value: "BEST_PRACTICES" as const },
          { label: "MANDATORY", value: "MANDATORY" as const },
          { label: "GUIDELINES", value: "GUIDELINES" as const },
          { label: "REFERENCE", value: "REFERENCE" as const },
        ],
        { placeHolder: "Select category" }
      );
      if (!categoryPick) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Uploading shared document...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.uploadSharedDocument({
              collectionId,
              title,
              content: content!,
              category: categoryPick.value,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Document "${title}" uploaded to collection`
              );
            } else {
              vscode.window.showErrorMessage(
                `Upload failed: ${response.error || "Unknown error"}`
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

  // ─── Show Settings ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showSettings", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading settings...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.getSettings();

            if (response.success && response.result) {
              const settings = response.result;
              const lines: string[] = [
                `# Project Settings`,
                ``,
              ];

              for (const [key, value] of Object.entries(settings)) {
                lines.push(`- **${key}:** ${JSON.stringify(value)}`);
              }

              const doc = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Failed to load settings: ${response.error || "Unknown error"}`
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
