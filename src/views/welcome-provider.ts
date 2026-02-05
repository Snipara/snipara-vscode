import * as vscode from "vscode";
import type { WorkspaceScanResult } from "../workspace-scanner";
import { formatTokens } from "../demo";

class WelcomeItem extends vscode.TreeItem {
  constructor(
    label: string,
    options?: {
      description?: string;
      tooltip?: string;
      icon?: string;
      command?: vscode.Command;
    }
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    if (options?.description) this.description = options.description;
    if (options?.tooltip) this.tooltip = options.tooltip;
    if (options?.icon) this.iconPath = new vscode.ThemeIcon(options.icon);
    if (options?.command) this.command = options.command;
  }
}

/**
 * Welcome view shown in the sidebar when the extension is not configured.
 * Displays workspace stats, value proposition, and action buttons.
 */
export class WelcomeProvider implements vscode.TreeDataProvider<WelcomeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private scanResult: WorkspaceScanResult | null = null;

  setScanResult(result: WorkspaceScanResult | null): void {
    this.scanResult = result;
    this._onDidChangeTreeData.fire();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WelcomeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): WelcomeItem[] {
    const items: WelcomeItem[] = [];

    items.push(
      new WelcomeItem("AI-optimized context for your docs", {
        icon: "sparkle",
        tooltip:
          "Snipara compresses documentation by 90%+ for LLM queries. Your LLM gets better answers with less tokens.",
      })
    );

    if (this.scanResult) {
      const est = formatTokens(this.scanResult.estimatedTokens);
      const comp = formatTokens(this.scanResult.compressedTokens);
      items.push(
        new WelcomeItem(`${this.scanResult.fileCount} docs found`, {
          description: `~${est} tokens \u2192 ~${comp}`,
          icon: "file-text",
          tooltip: `${this.scanResult.fileCount} markdown files in workspace (~${est} tokens). Snipara compresses to ~${comp} tokens (99% reduction).`,
        })
      );
    }

    // Separator (empty label)
    items.push(new WelcomeItem(""));

    items.push(
      new WelcomeItem("Try a Demo Query", {
        icon: "play",
        tooltip: "Run a query against Snipara's documentation \u2014 no sign-in needed",
        command: {
          command: "snipara.demoQuery",
          title: "Try Demo Query",
        },
      })
    );

    items.push(
      new WelcomeItem("Sign in (30-day free Pro)", {
        icon: "github",
        tooltip: "Create a free account with GitHub \u2014 30-day Pro trial, no credit card",
        command: {
          command: "snipara.configure",
          title: "Sign in",
        },
      })
    );

    items.push(
      new WelcomeItem("Getting Started Guide", {
        icon: "book",
        tooltip: "Open the step-by-step walkthrough",
        command: {
          command: "workbench.action.openWalkthrough",
          title: "Open Walkthrough",
          arguments: ["snipara.snipara#snipara.gettingStarted", false],
        },
      })
    );

    return items;
  }
}
