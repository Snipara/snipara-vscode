import * as vscode from "vscode";

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
 * Displays activation CTA and fallback actions.
 */
export class WelcomeProvider implements vscode.TreeDataProvider<WelcomeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

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
          "Run create-snipara's editor activation contract and open a First Work Brief.",
      })
    );

    items.push(
      new WelcomeItem("Uses create-snipara activation", {
        description: "--client vscode --starter --json",
        icon: "terminal",
        tooltip:
          "VS Code orchestrates the shared activation engine and reads the versioned activation manifest.",
      })
    );

    // Separator (empty label)
    items.push(new WelcomeItem(""));

    items.push(
      new WelcomeItem("Build my First Work Brief", {
        icon: "rocket",
        tooltip: "Sign in if needed, run the activation engine, and open the manifest-backed project brief.",
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
