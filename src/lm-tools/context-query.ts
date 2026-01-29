import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface ContextQueryInput {
  query: string;
  maxTokens?: number;
}

export class ContextQueryTool implements vscode.LanguageModelTool<ContextQueryInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ContextQueryInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.contextQuery(options.input.query, {
        maxTokens: options.input.maxTokens,
      });

      if (response.success && response.result) {
        const sections = response.result.sections
          .map(
            (s) =>
              `## ${s.title}\n` +
              `File: ${s.file} (lines ${s.lines[0]}-${s.lines[1]})\n` +
              `Relevance: ${(s.relevance_score * 100).toFixed(0)}%\n\n` +
              s.content
          )
          .join("\n\n---\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Found ${response.result.sections.length} sections (${response.result.total_tokens} tokens):\n\n${sections}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Query failed: ${response.error || "No results"}`),
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
