import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { MemoryType } from "../types";

interface RememberInput {
  content: string;
  type?: MemoryType;
}

export class RememberTool implements vscode.LanguageModelTool<RememberInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<RememberInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured."),
      ]);
    }

    try {
      const response = await this.client.remember({
        content: options.input.content,
        type: options.input.type ?? "fact",
      });

      if (response.success && response.result) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Memory stored (${response.result.type}): ${response.result.message}`
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
