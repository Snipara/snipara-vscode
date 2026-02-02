import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface LoadDocumentInput {
  path: string;
}

export class LoadDocumentTool implements vscode.LanguageModelTool<LoadDocumentInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<LoadDocumentInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.loadDocument(options.input.path);

      if (response.success && response.result) {
        const r = response.result;
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `# ${r.path}\n` +
            `Lines: ${r.lines} | Tokens: ${r.token_count}\n\n` +
            r.content
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Failed: ${response.error || "Unknown error"}`),
      ]);
    } catch (error) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        ),
      ]);
    }
  }
}
