import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ToolName } from "../types";

type ToolInput = Record<string, unknown>;

export class ModernMcpTool implements vscode.LanguageModelTool<ToolInput> {
  constructor(
    private client: SniparaClient,
    private toolName: ToolName,
    private displayName: string
  ) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ToolInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured."),
      ]);
    }

    try {
      const response = await this.client.callTool(this.toolName, compact(options.input));

      if (response.success) {
        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `${this.displayName} result:\n\n${formatResult(response.result)}`
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

function compact(input: ToolInput | undefined): ToolInput {
  const result: ToolInput = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = value;
    }
  }
  return result;
}

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (result === undefined || result === null) return "No result payload.";
  return `\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
}
