import * as vscode from "vscode";

/**
 * Tree item for context view
 */
export class ContextItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value?: string,
    public readonly isHeader: boolean = false
  ) {
    super(
      label,
      isHeader
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    if (value) {
      this.description = value.length > 50 ? value.substring(0, 50) + "..." : value;
      this.tooltip = new vscode.MarkdownString("```\n" + value + "\n```");
    }

    this.iconPath = isHeader
      ? new vscode.ThemeIcon("symbol-namespace")
      : new vscode.ThemeIcon("symbol-string");
  }
}

/**
 * Provider for Snipara session context tree view
 */
export class ContextProvider implements vscode.TreeDataProvider<ContextItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ContextItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private context: string | null = null;
  private hasContext: boolean = false;

  /**
   * Update context and refresh tree view
   */
  setContext(context: string | null): void {
    this.context = context;
    this.hasContext = !!context;
    this._onDidChangeTreeData.fire();
  }

  /**
   * Clear context
   */
  clear(): void {
    this.context = null;
    this.hasContext = false;
    this._onDidChangeTreeData.fire();
  }

  /**
   * Check if context is set
   */
  hasSessionContext(): boolean {
    return this.hasContext;
  }

  getTreeItem(element: ContextItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ContextItem): vscode.ProviderResult<ContextItem[]> {
    if (!element) {
      // Root level
      const items: ContextItem[] = [];

      if (this.hasContext && this.context) {
        items.push(new ContextItem("Session Context", undefined, true));
      } else {
        items.push(
          new ContextItem(
            "No session context",
            "Use 'Snipara: Inject Context' to add context"
          )
        );
      }

      return Promise.resolve(items);
    }

    // Children of Session Context header
    if (element.isHeader && this.context) {
      // Split context into lines for display
      const lines = this.context.split("\n").filter((line) => line.trim());
      return Promise.resolve(
        lines.slice(0, 10).map((line, index) => new ContextItem(`Line ${index + 1}`, line))
      );
    }

    return Promise.resolve([]);
  }
}
