import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface DecomposeInput {
  query: string;
  maxDepth?: number;
}

export class DecomposeTool implements vscode.LanguageModelTool<DecomposeInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<DecomposeInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.decompose(
        options.input.query,
        options.input.maxDepth ?? 2
      );

      if (response.success && response.result) {
        const subQueries = response.result.sub_queries
          .map(
            (sq) =>
              `${sq.priority}. "${sq.query}" (~${sq.estimated_tokens} tokens)`
          )
          .join("\n");

        const deps = response.result.dependencies.length > 0
          ? `\nDependencies: ${response.result.dependencies.map((d) => `[${d.join(" -> ")}]`).join(", ")}`
          : "";

        const sequence = response.result.suggested_sequence.length > 0
          ? `\nSuggested order: ${response.result.suggested_sequence.join(" -> ")}`
          : "";

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Decomposed "${response.result.original_query}" into ${response.result.sub_queries.length} sub-queries (~${response.result.total_estimated_tokens} tokens total):\n\n${subQueries}${deps}${sequence}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Decompose failed: ${response.error || "No results"}`),
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
