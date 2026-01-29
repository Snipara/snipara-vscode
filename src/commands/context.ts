import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ContextProvider } from "../views/context-provider";
import { requireConfigured } from "./helpers";

export function registerContextCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  contextProvider: ContextProvider
): void {
  // ─── Show Context ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.showContext", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading session context...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.getContext();

            if (response.success) {
              contextProvider.setContext(response.result || null);

              if (response.result) {
                vscode.window.showInformationMessage("Session context loaded");
              } else {
                vscode.window.showInformationMessage("No session context set");
              }
            } else {
              vscode.window.showErrorMessage(
                `Failed to get context: ${response.error || "Unknown error"}`
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

  // ─── Clear Context ────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.clearContext", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Clearing session context...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.clearContext();

            if (response.success) {
              contextProvider.clear();
              vscode.window.showInformationMessage("Session context cleared");
            } else {
              vscode.window.showErrorMessage(
                `Failed to clear context: ${response.error || "Unknown error"}`
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

  // ─── Inject Context ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.injectContext", async () => {
      if (!(await requireConfigured(client))) return;

      // Get selected text or prompt for input
      const editor = vscode.window.activeTextEditor;
      let contextText = editor?.document.getText(editor.selection);

      if (!contextText) {
        contextText = await vscode.window.showInputBox({
          prompt: "Enter context to inject",
          placeHolder: "Working on: authentication flow",
        });
      }

      if (!contextText) return;

      const appendPick = await vscode.window.showQuickPick(
        [
          { label: "Replace", description: "Replace existing context", value: false },
          { label: "Append", description: "Add to existing context", value: true },
        ],
        { placeHolder: "Replace or append to existing context?" }
      );
      if (appendPick === undefined) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Injecting context...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.injectContext(contextText!, appendPick.value);

            if (response.success) {
              contextProvider.setContext(contextText!);
              vscode.window.showInformationMessage(
                appendPick.value ? "Context appended" : "Context set"
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to inject context: ${response.error || "Unknown error"}`
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
