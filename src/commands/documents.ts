import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { SyncDocumentItem } from "../types";
import { requireConfigured } from "./helpers";

export function registerDocumentCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Upload Document ──────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.uploadDocument", async (uri?: vscode.Uri) => {
      if (!(await requireConfigured(client))) return;

      let fileUri = uri;

      if (!fileUri) {
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: {
            "Documentation": ["md", "mdx", "txt"],
          },
          title: "Select document to upload",
        });
        if (!uris || uris.length === 0) return;
        fileUri = uris[0];
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Uploading document...",
          cancellable: false,
        },
        async () => {
          try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri!);
            const content = Buffer.from(fileContent).toString("utf-8");

            // Use the relative workspace path if possible, otherwise the filename
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let docPath: string;
            if (workspaceFolder) {
              docPath = vscode.workspace.asRelativePath(fileUri!, false);
            } else {
              docPath = fileUri!.path.split("/").pop() || "document.md";
            }

            const response = await client.uploadDocument(docPath, content);

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Document uploaded: ${response.result.message} (${response.result.action})`
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

  // ─── Sync Documents ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.syncDocuments", async () => {
      if (!(await requireConfigured(client))) return;

      const folderUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFiles: false,
        canSelectFolders: true,
        title: "Select folder to sync",
      });
      if (!folderUris || folderUris.length === 0) return;

      const folderUri = folderUris[0];

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Syncing documents...",
          cancellable: false,
        },
        async () => {
          try {
            // Find all .md, .mdx, .txt files in the folder
            const mdPattern = new vscode.RelativePattern(folderUri, "**/*.{md,mdx,txt}");
            const files = await vscode.workspace.findFiles(mdPattern);

            if (files.length === 0) {
              vscode.window.showWarningMessage(
                "No .md, .mdx, or .txt files found in the selected folder."
              );
              return;
            }

            const documents: SyncDocumentItem[] = [];

            for (const file of files) {
              const fileContent = await vscode.workspace.fs.readFile(file);
              const content = Buffer.from(fileContent).toString("utf-8");

              // Compute path relative to the selected folder
              const relativePath = file.path.substring(folderUri.path.length + 1);

              documents.push({ path: relativePath, content });
            }

            const response = await client.syncDocuments(documents);

            if (response.success && response.result) {
              const r = response.result;
              vscode.window.showInformationMessage(
                `Sync complete: ${r.synced} synced (${r.created} created, ${r.updated} updated, ${r.deleted} deleted)`
              );
            } else {
              vscode.window.showErrorMessage(
                `Sync failed: ${response.error || "Unknown error"}`
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
