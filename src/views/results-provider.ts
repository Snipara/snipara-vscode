import * as vscode from "vscode";
import type { ContextSection } from "../types";

/**
 * Tree item for results view
 */
export class ResultItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly section?: ContextSection,
    public readonly content?: string
  ) {
    super(label, collapsibleState);

    if (section) {
      this.description = `${section.file}:${section.lines[0]}-${section.lines[1]}`;
      this.tooltip = new vscode.MarkdownString(
        `**${section.title}**\n\n` +
          `File: \`${section.file}\`\n` +
          `Lines: ${section.lines[0]}-${section.lines[1]}\n` +
          `Relevance: ${(section.relevance_score * 100).toFixed(0)}%\n` +
          `Tokens: ${section.token_count}`
      );
      this.iconPath = new vscode.ThemeIcon("file-text");

      // Add command to open in editor
      this.command = {
        command: "snipara.showSection",
        title: "Show Section",
        arguments: [section],
      };
    } else if (content) {
      this.tooltip = content;
      this.iconPath = new vscode.ThemeIcon("info");
    }
  }
}

/**
 * Provider for Snipara results tree view
 */
export class ResultsProvider implements vscode.TreeDataProvider<ResultItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ResultItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private results: ContextSection[] = [];
  private query: string = "";
  private totalTokens: number = 0;
  private suggestions: string[] = [];

  /**
   * Update results and refresh tree view
   */
  setResults(
    query: string,
    sections: ContextSection[],
    totalTokens: number,
    suggestions: string[] = []
  ): void {
    this.query = query;
    this.results = sections;
    this.totalTokens = totalTokens;
    this.suggestions = suggestions;
    this._onDidChangeTreeData.fire();
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
    this.query = "";
    this.totalTokens = 0;
    this.suggestions = [];
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ResultItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ResultItem): vscode.ProviderResult<ResultItem[]> {
    if (!element) {
      // Root level
      const items: ResultItem[] = [];

      if (this.query) {
        items.push(
          new ResultItem(
            `Query: "${this.query}"`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            `Total tokens: ${this.totalTokens}`
          )
        );
      }

      if (this.results.length > 0) {
        items.push(
          new ResultItem(
            `Results (${this.results.length})`,
            vscode.TreeItemCollapsibleState.Expanded
          )
        );
      } else if (this.query) {
        items.push(
          new ResultItem(
            "No results found",
            vscode.TreeItemCollapsibleState.None,
            undefined,
            "Try a different query"
          )
        );
      }

      if (this.suggestions.length > 0) {
        items.push(
          new ResultItem(
            `Suggestions (${this.suggestions.length})`,
            vscode.TreeItemCollapsibleState.Collapsed
          )
        );
      }

      return Promise.resolve(items);
    }

    // Children of Results node
    if (element.label === `Results (${this.results.length})`) {
      return Promise.resolve(
        this.results.map(
          (section) =>
            new ResultItem(
              section.title || "Untitled Section",
              vscode.TreeItemCollapsibleState.None,
              section
            )
        )
      );
    }

    // Children of Suggestions node
    if (element.label === `Suggestions (${this.suggestions.length})`) {
      return Promise.resolve(
        this.suggestions.map(
          (suggestion) =>
            new ResultItem(
              suggestion,
              vscode.TreeItemCollapsibleState.None,
              undefined,
              "Click to search"
            )
        )
      );
    }

    return Promise.resolve([]);
  }
}
