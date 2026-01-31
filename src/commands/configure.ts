import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ContextSection } from "../types";
import { autoRegister, getApiKey } from "../auth/auto-register";

export function registerConfigureCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Configure ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.configure", async () => {
      const choice = await vscode.window.showQuickPick(
        [
          {
            label: "$(github) Sign in with GitHub",
            description: "One-click setup - creates a free account automatically",
            id: "github",
          },
          {
            label: "$(key) Enter API Key Manually",
            description: "Paste an existing API key and project ID",
            id: "manual",
          },
        ],
        { placeHolder: "How would you like to configure Snipara?" }
      );

      if (!choice) return;

      if (choice.id === "github") {
        const result = await autoRegister(context);
        if (result) {
          client.updateConfig({
            apiKey: result.apiKey,
            projectId: result.projectSlug,
            serverUrl: result.serverUrl,
          });
        }
        return;
      }

      // Manual configuration flow
      const config = vscode.workspace.getConfiguration("snipara");
      const currentApiKey = await getApiKey(context);
      const currentProjectId = config.get<string>("projectId") || "";

      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Snipara API key",
        value: currentApiKey,
        password: true,
        placeHolder: "rlm_...",
      });
      if (apiKey === undefined) return;

      const projectId = await vscode.window.showInputBox({
        prompt: "Enter your Snipara project ID or slug",
        value: currentProjectId,
        placeHolder: "my-project",
      });
      if (projectId === undefined) return;

      // Store API key in SecretStorage
      await context.secrets.store("snipara.apiKey", apiKey);
      await config.update("projectId", projectId, vscode.ConfigurationTarget.Global);

      // Clear legacy plaintext key if present
      if (config.get<string>("apiKey")) {
        await config.update("apiKey", "", vscode.ConfigurationTarget.Global);
      }

      client.updateConfig({ apiKey, projectId });

      vscode.window.showInformationMessage("Snipara configuration saved");
    })
  );

  // ─── Show Section ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snipara.showSection",
      async (section: ContextSection) => {
        const doc = await vscode.workspace.openTextDocument({
          content:
            `// ${section.title}\n` +
            `// File: ${section.file}\n` +
            `// Lines: ${section.lines[0]}-${section.lines[1]}\n` +
            `// Relevance: ${(section.relevance_score * 100).toFixed(0)}%\n` +
            `// Tokens: ${section.token_count}\n\n` +
            section.content,
          language: "markdown",
        });

        await vscode.window.showTextDocument(doc, { preview: true });
      }
    )
  );
}
