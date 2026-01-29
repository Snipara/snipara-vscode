import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface MultiProjectQueryInput {
  query: string;
  maxTokens?: number;
}

export class MultiProjectQueryTool implements vscode.LanguageModelTool<MultiProjectQueryInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<MultiProjectQueryInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.multiProjectQuery(options.input.query, {
        maxTokens: options.input.maxTokens,
      });

      if (response.success && response.result) {
        if (response.result.results.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No results found across team projects."),
          ]);
        }

        const results = response.result.results
          .map(
            (r) =>
              `### Project: ${r.project_name}\n` +
              r.sections
                .map(
                  (s) =>
                    `**${s.title}** (${s.file})\n${s.content.slice(0, 300)}${s.content.length > 300 ? "..." : ""}`
                )
                .join("\n\n")
          )
          .join("\n\n---\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Found results across ${response.result.results.length} projects (${response.result.total_tokens} tokens):\n\n${results}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Multi-project query failed: ${response.error || "No results"}`),
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
