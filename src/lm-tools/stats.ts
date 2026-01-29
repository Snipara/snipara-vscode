import * as vscode from "vscode";
import type { SniparaClient } from "../client";

type StatsInput = Record<string, never>;

export class StatsTool implements vscode.LanguageModelTool<StatsInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    _options: vscode.LanguageModelToolInvocationOptions<StatsInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.getStats();

      if (response.success && response.result) {
        const stats = response.result;
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Documentation statistics:\n` +
            `- Files: ${stats.files_loaded}\n` +
            `- Sections: ${stats.sections}\n` +
            `- Characters: ${stats.total_characters.toLocaleString()}\n` +
            `- Lines: ${stats.total_lines.toLocaleString()}`
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
