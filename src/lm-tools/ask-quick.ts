import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface AskQuickInput {
  question: string;
}

export class AskQuickTool implements vscode.LanguageModelTool<AskQuickInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<AskQuickInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      // The hosted keyword-only ask tool is no longer advertised: a quick ask is a small,
      // ranked context query, so the answer comes with its sources or comes back empty.
      const response = await this.client.contextQuery(options.input.question, {
        maxTokens: 1200,
        includeMetadata: false,
      });

      if (response.success && response.result) {
        const sections = response.result.sections ?? [];
        if (sections.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(
              "No project source supports an answer to this question."
            ),
          ]);
        }
        const text = sections
          .map((section) => `## ${section.title} (${section.file})\n${section.content}`)
          .join("\n\n");
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(text)]);
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
