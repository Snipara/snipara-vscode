import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { SharedCategory } from "../types";

interface SharedContextInput {
  categories?: SharedCategory[];
  maxTokens?: number;
}

export class SharedContextTool implements vscode.LanguageModelTool<SharedContextInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<SharedContextInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured."),
      ]);
    }

    try {
      const response = await this.client.sharedContext({
        categories: options.input.categories,
        maxTokens: options.input.maxTokens,
      });

      if (response.success && response.result) {
        if (response.result.documents.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No shared context documents found."),
          ]);
        }

        const docs = response.result.documents
          .map(
            (d) =>
              `## ${d.title} [${d.category}]\n` +
              `Collection: ${d.collection_name}\n\n` +
              d.content
          )
          .join("\n\n---\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Shared context (${response.result.total_tokens} tokens):\n\n${docs}`
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
