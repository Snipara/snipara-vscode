import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface SearchInput {
  pattern: string;
  maxResults?: number;
}

export class SearchTool implements vscode.LanguageModelTool<SearchInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<SearchInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.search(
        options.input.pattern,
        options.input.maxResults ?? 20
      );

      if (response.success && response.result) {
        if (response.result.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`No matches found for pattern: ${options.input.pattern}`),
          ]);
        }

        const matches = response.result
          .map(
            (r) =>
              `- **Match** (${r.file || "unknown"}, line ${r.line})\n  ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`
          )
          .join("\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Found ${response.result.length} matches for "${options.input.pattern}":\n\n${matches}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Search failed: ${response.error || "No results"}`),
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
