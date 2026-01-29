import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface MultiQueryInput {
  queries: string[];
  maxTokens?: number;
}

export class MultiQueryTool implements vscode.LanguageModelTool<MultiQueryInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<MultiQueryInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const queryItems = options.input.queries.map((q) => ({ query: q }));
      const response = await this.client.multiQuery(
        queryItems,
        options.input.maxTokens ?? 8000
      );

      if (response.success && response.result) {
        const results = response.result.results
          .map(
            (r) =>
              `### Query: "${r.query}"\n` +
              `Sections: ${r.sections.length}, Tokens: ${r.total_tokens}\n\n` +
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
            `Executed ${response.result.results.length} queries (${response.result.total_tokens} total tokens):\n\n${results}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Multi-query failed: ${response.error || "No results"}`),
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
