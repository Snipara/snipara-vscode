import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface PlanInput {
  query: string;
  strategy?: "breadth_first" | "depth_first" | "relevance_first";
  maxTokens?: number;
}

export class PlanTool implements vscode.LanguageModelTool<PlanInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<PlanInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.plan(options.input.query, {
        strategy: options.input.strategy,
        maxTokens: options.input.maxTokens,
      });

      if (response.success && response.result) {
        const steps = response.result.steps
          .map(
            (s) =>
              `**Step ${s.step}** [${s.action}]` +
              (s.depends_on?.length ? ` (depends on: ${s.depends_on.join(", ")})` : "") +
              `\n  Params: ${JSON.stringify(s.params)}`
          )
          .join("\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `Execution plan (${response.result.steps.length} steps, ~${response.result.estimated_total_tokens} tokens):\n\n${steps}`
          ),
        ]);
      }

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`Plan generation failed: ${response.error || "No results"}`),
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
