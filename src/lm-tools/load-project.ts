import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface LoadProjectInput {
  maxTokens?: number;
  pathsFilter?: string[];
  includeContent?: boolean;
}

export class LoadProjectTool implements vscode.LanguageModelTool<LoadProjectInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<LoadProjectInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.loadProject({
        maxTokens: options.input.maxTokens,
        pathsFilter: options.input.pathsFilter,
        includeContent: options.input.includeContent,
      });

      if (response.success && response.result) {
        const r = response.result;
        const docs = r.documents
          .map(
            (d) =>
              `## ${d.path}\n` +
              `Lines: ${d.lines} | Tokens: ${d.token_count}${d.truncated ? " (truncated)" : ""}\n` +
              (d.content ? `\n${d.content}` : "")
          )
          .join("\n\n---\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Project: ${r.returned_files}/${r.total_files} files (${r.total_tokens}/${r.max_tokens} tokens)\n\n${docs}`
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
