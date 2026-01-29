import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface RecallInput {
  query: string;
  limit?: number;
}

export class RecallTool implements vscode.LanguageModelTool<RecallInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<RecallInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured."),
      ]);
    }

    try {
      const response = await this.client.recall(options.input.query, {
        limit: options.input.limit,
      });

      if (response.success && response.result) {
        if (response.result.memories.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No relevant memories found."),
          ]);
        }

        const memories = response.result.memories
          .map(
            (m) =>
              `- [${m.type}] ${m.content} (relevance: ${(m.relevance_score * 100).toFixed(0)}%, confidence: ${(m.confidence * 100).toFixed(0)}%)`
          )
          .join("\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Found ${response.result.total_found} memories:\n\n${memories}`
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
