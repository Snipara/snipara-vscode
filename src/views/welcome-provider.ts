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
 * Displays workspace stats, activation CTA, and fallback actions.
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
      new WelcomeItem("Activate this workspace", {
        icon: "sparkle",
        tooltip:
          "Build a source-backed First Work Brief from docs already present in this workspace.",
      })
    );

    if (this.scanResult) {
      const est = formatTokens(this.scanResult.estimatedTokens);
      const comp = formatTokens(this.scanResult.compressedTokens);
      items.push(
        new WelcomeItem(`${this.scanResult.fileCount} docs found`, {
          description: `~${est} indexed, ~${comp} compact`,
          icon: "file-text",
          tooltip: `${this.scanResult.fileCount} markdown files in workspace (~${est}). Snipara can index them as reusable project context for agent workflows.`,
        })
      );
      if (this.scanResult.samplePaths.length > 0) {
        items.push(
          new WelcomeItem(this.scanResult.samplePaths.slice(0, 3).join(", "), {
            icon: "list-tree",
            tooltip: "Sample workspace documents found by Snipara.",
          })
        );
      }
    }

    // Separator (empty label)
    items.push(new WelcomeItem(""));

    items.push(
      new WelcomeItem("Build my First Work Brief", {
        icon: "rocket",
        tooltip: "Sign in if needed, index starter docs from this workspace, and open a source-backed project brief.",
        command: {
          command: "snipara.activateWorkspace",
          title: "Build First Work Brief",
        },
      })
    );

    items.push(
      new WelcomeItem("Sign in (free account)", {
        icon: "github",
        tooltip: "Create a free account with GitHub \u2014 no credit card required",
        command: {
          command: "snipara.configure",
          title: "Sign in",
        },
      })
    );

    items.push(
      new WelcomeItem("Try a Demo Query", {
        icon: "play",
        tooltip: "Run a fallback query against Snipara's documentation \u2014 no sign-in needed",
        command: {
          command: "snipara.demoQuery",
          title: "Try Demo Query",
        },
      })
    );

    return items;
  }
}
