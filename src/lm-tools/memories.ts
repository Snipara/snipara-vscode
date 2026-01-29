import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { MemoryType } from "../types";

interface MemoriesInput {
  type?: MemoryType;
  search?: string;
  limit?: number;
}

export class MemoriesTool implements vscode.LanguageModelTool<MemoriesInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<MemoriesInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.memories({
        type: options.input.type,
        search: options.input.search,
        limit: options.input.limit,
      });

      if (response.success && response.result) {
        if (response.result.memories.length === 0) {
          return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart("No memories found."),
          ]);
        }

        const memories = response.result.memories
          .map(
            (m) =>
              `- [${m.type}] ${m.content}` +
              (m.category ? ` (category: ${m.category})` : "") +
              ` — confidence: ${(m.confidence * 100).toFixed(0)}%`
          )
          .join("\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `${response.result.total_count} memories total (showing ${response.result.memories.length}):\n\n${memories}`
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
