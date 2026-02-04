import * as vscode from "vscode";
import type { ContextSection } from "../types";
import type { DemoStats } from "../demo";
import { formatTokens } from "../demo";

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

export interface ResultsOptions {
  isDemo?: boolean;
  demoStats?: DemoStats;
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
  private isDemo: boolean = false;
  private demoStats: DemoStats | undefined = undefined;

  /**
   * Update results and refresh tree view
   */
  setResults(
    query: string,
    sections: ContextSection[],
    totalTokens: number,
    suggestions: string[] = [],
    options?: ResultsOptions
  ): void {
    this.query = query;
    this.results = sections;
    this.totalTokens = totalTokens;
    this.suggestions = suggestions;
    this.isDemo = options?.isDemo ?? false;
    this.demoStats = options?.demoStats;
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
    this.isDemo = false;
    this.demoStats = undefined;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ResultItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ResultItem): vscode.ProviderResult<ResultItem[]> {
    if (!element) {
      // Root level
      const items: ResultItem[] = [];

      // Demo value comparison banner
      if (this.isDemo && this.demoStats) {
        const stats = this.demoStats;
        const banner = new ResultItem(
          `Snipara saved ${stats.reductionPercent}% of tokens`,
          vscode.TreeItemCollapsibleState.Expanded
        );
        banner.iconPath = new vscode.ThemeIcon("graph-line");
        banner.tooltip = "Value comparison: with vs without Snipara context optimization";
        items.push(banner);
      } else if (this.isDemo) {
        const banner = new ResultItem(
          "Demo results \u2014 Sign in for your own docs",
          vscode.TreeItemCollapsibleState.None
        );
        banner.iconPath = new vscode.ThemeIcon("info");
        banner.command = {
          command: "snipara.configure",
          title: "Sign in",
        };
        items.push(banner);
      }

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

    // Children of demo stats banner
    if (
      this.demoStats &&
      element.label === `Snipara saved ${this.demoStats.reductionPercent}% of tokens`
    ) {
      const stats = this.demoStats;
      const children: ResultItem[] = [];

      const without = new ResultItem(
        `Without Snipara: ${formatTokens(stats.totalProjectTokens)} tokens (~${stats.estimatedCostWithout}/query)`,
        vscode.TreeItemCollapsibleState.None
      );
      without.iconPath = new vscode.ThemeIcon("arrow-up");
      children.push(without);

      const with_ = new ResultItem(
        `With Snipara: ${formatTokens(stats.returnedTokens)} tokens (~${stats.estimatedCostWith}/query)`,
        vscode.TreeItemCollapsibleState.None
      );
      with_.iconPath = new vscode.ThemeIcon("arrow-down");
      children.push(with_);

      const speed = new ResultItem(
        `Reduction: ${stats.reductionPercent}% in ${stats.latencyMs}ms`,
        vscode.TreeItemCollapsibleState.None
      );
      speed.iconPath = new vscode.ThemeIcon("zap");
      children.push(speed);

      const cta = new ResultItem(
        "Sign in free \u2014 100 queries/month",
        vscode.TreeItemCollapsibleState.None
      );
      cta.iconPath = new vscode.ThemeIcon("github");
      cta.command = {
        command: "snipara.configure",
        title: "Sign in",
      };
      children.push(cta);

      return Promise.resolve(children);
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
