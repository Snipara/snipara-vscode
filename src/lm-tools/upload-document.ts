import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface UploadDocumentInput {
  path: string;
  content: string;
}

export class UploadDocumentTool implements vscode.LanguageModelTool<UploadDocumentInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<UploadDocumentInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.uploadDocument(
        options.input.path,
        options.input.content
      );

      if (response.success && response.result) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Document ${response.result.action}: ${response.result.path} (${response.result.size} bytes)`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Upload failed: ${response.error || "Unknown error"}`),
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
