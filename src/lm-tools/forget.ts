import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { MemoryType } from "../types";

interface ForgetInput {
  memoryId?: string;
  type?: MemoryType;
  category?: string;
}

export class ForgetTool implements vscode.LanguageModelTool<ForgetInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ForgetInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.forget({
        memoryId: options.input.memoryId,
        type: options.input.type,
        category: options.input.category,
      });

      if (response.success && response.result) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Deleted ${response.result.deleted} memory/memories. ${response.result.message}`
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
