import * as vscode from "vscode";
import * as path from "path";
import type { SniparaClient } from "../client";
import type { SyncDocumentItem } from "../types";
import { requireConfigured } from "./helpers";

const SYNC_EXCLUDE_PATTERN =
  "**/{node_modules,dist,out,build,coverage,.git,.next,.turbo,.vscode-test}/**";

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

      const folderUri = await selectSyncFolder();
      if (!folderUri) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Syncing documents...",
          cancellable: false,
        },
        async () => {
          try {
            const mdPattern = new vscode.RelativePattern(folderUri, "**/*.{md,mdx,txt}");
            const files = await vscode.workspace.findFiles(mdPattern, SYNC_EXCLUDE_PATTERN);

            if (files.length === 0) {
              vscode.window.showWarningMessage(
                "No .md, .mdx, or .txt files found in this workspace."
              );
              return;
            }

            const documents: SyncDocumentItem[] = [];

            for (const file of files) {
              const fileContent = await vscode.workspace.fs.readFile(file);
              const content = Buffer.from(fileContent).toString("utf-8");

              const relativePath = path.relative(folderUri.fsPath, file.fsPath) || path.basename(file.fsPath);

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

async function selectSyncFolder(): Promise<vscode.Uri | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0].uri;
  }

  if (workspaceFolders.length > 1) {
    const pick = await vscode.window.showQuickPick(
      workspaceFolders.map((folder) => ({
        label: folder.name,
        description: folder.uri.fsPath,
        uri: folder.uri,
      })),
      { placeHolder: "Choose the workspace folder to sync" }
    );
    return pick?.uri;
  }

  const folderUris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    canSelectFiles: false,
    canSelectFolders: true,
    title: "Select folder to sync",
  });
  return folderUris?.[0];
}
