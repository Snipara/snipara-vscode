import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ContextSection } from "../types";

export function registerConfigureCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Configure ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.configure", async () => {
      const config = vscode.workspace.getConfiguration("snipara");
      const currentApiKey = config.get<string>("apiKey") || "";
      const currentProjectId = config.get<string>("projectId") || "";

      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Snipara API key",
        value: currentApiKey,
        password: true,
        placeHolder: "rlm_...",
      });
      if (apiKey === undefined) return;

      const projectId = await vscode.window.showInputBox({
        prompt: "Enter your Snipara project ID",
        value: currentProjectId,
        placeHolder: "project-id",
      });
      if (projectId === undefined) return;

      await config.update("apiKey", apiKey, vscode.ConfigurationTarget.Global);
      await config.update("projectId", projectId, vscode.ConfigurationTarget.Global);

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
