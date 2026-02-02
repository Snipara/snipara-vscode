import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface ReplContextInput {
  query?: string;
  maxTokens?: number;
  includeHelpers?: boolean;
  searchMode?: "keyword" | "semantic" | "hybrid";
}

export class ReplContextTool implements vscode.LanguageModelTool<ReplContextInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ReplContextInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.replContext({
        query: options.input.query,
        maxTokens: options.input.maxTokens,
        includeHelpers: options.input.includeHelpers,
        searchMode: options.input.searchMode,
      });

      if (response.success && response.result) {
        const r = response.result;
        const ctx = r.context_data;
        const fileList = Object.entries(ctx.files)
          .map(([path, info]) => `- ${path} (${info.tokens} tokens${info.truncated ? ", truncated" : ""})`)
          .join("\n");

        let text =
          `# REPL Context\n\n` +
          `Files: ${ctx.loaded_files}/${ctx.total_files_in_project} | Tokens: ${r.total_tokens}\n\n` +
          `## Loaded Files\n${fileList}\n\n` +
          `## Usage\n${r.usage_hint}`;

        if (r.setup_code) {
          text += `\n\n## Setup Code\n\`\`\`python\n${r.setup_code}\n\`\`\``;
        }

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(text),
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
