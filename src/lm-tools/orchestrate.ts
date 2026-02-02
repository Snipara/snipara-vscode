import * as vscode from "vscode";
import type { SniparaClient } from "../client";

interface OrchestrateInput {
  query: string;
  maxTokens?: number;
  topK?: number;
  searchMode?: "keyword" | "semantic" | "hybrid";
}

export class OrchestrateTool implements vscode.LanguageModelTool<OrchestrateInput> {
  constructor(private client: SniparaClient) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<OrchestrateInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    if (!this.client.isConfigured()) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart("Snipara is not configured. Please set API key and project ID in settings."),
      ]);
    }

    try {
      const response = await this.client.orchestrate(options.input.query, {
        maxTokens: options.input.maxTokens,
        topK: options.input.topK,
        searchMode: options.input.searchMode,
      });

      if (response.success && response.result) {
        const r = response.result;
        const scan = r.rounds.sections_scan;
        const search = r.rounds.ranked_search;
        const raw = r.rounds.raw_load;

        const sections = search.top_sections
          .map(
            (s) =>
              `- ${s.title} (${(s.relevance_score * 100).toFixed(0)}%, lines ${s.start_line}-${s.end_line})`
          )
          .join("\n");

        const docs = raw.documents
          .map(
            (d) =>
              `## ${d.path}\n` +
              `Relevance: ${(d.relevance_score * 100).toFixed(0)}% | Tokens: ${d.token_count}${d.truncated ? " (truncated)" : ""}\n\n` +
              d.content
          )
          .join("\n\n---\n\n");

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            `# Orchestration: ${r.query}\n\n` +
            `**Scan:** ${scan.total_files} files, ${scan.total_sections} sections\n` +
            `**Search (${search.search_mode}):**\n${sections}\n\n` +
            `**Raw Load:** ${raw.files_loaded} files (${raw.total_tokens}/${raw.max_tokens} tokens)\n\n` +
            docs
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
