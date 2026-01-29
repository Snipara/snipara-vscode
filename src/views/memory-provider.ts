import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { MemoryInfo, MemoryType } from "../types";

// Memory type icons and labels
const MEMORY_TYPE_CONFIG: Record<MemoryType, { icon: string; label: string }> = {
  fact: { icon: "symbol-constant", label: "Facts" },
  decision: { icon: "law", label: "Decisions" },
  learning: { icon: "mortar-board", label: "Learnings" },
  preference: { icon: "settings-gear", label: "Preferences" },
  todo: { icon: "checklist", label: "Todos" },
  context: { icon: "symbol-namespace", label: "Context" },
};

export class MemoryItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly memoryType?: MemoryType,
    public readonly memory?: MemoryInfo
  ) {
    super(label, collapsibleState);

    if (memory) {
      // Individual memory item
      this.contextValue = "memory";
      this.description = memory.category || undefined;
      this.tooltip = new vscode.MarkdownString(
        `**${memory.type}** (confidence: ${(memory.confidence * 100).toFixed(0)}%)\n\n` +
        `${memory.content}\n\n` +
        `Created: ${memory.created_at}\n` +
        `Accessed: ${memory.access_count} times`
      );
      this.iconPath = new vscode.ThemeIcon("note");
      // Store memory_id for forget command
      this.id = memory.memory_id;
    } else if (memoryType) {
      // Group header
      const config = MEMORY_TYPE_CONFIG[memoryType];
      this.iconPath = new vscode.ThemeIcon(config.icon);
    }
  }
}

export class MemoryProvider implements vscode.TreeDataProvider<MemoryItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MemoryItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private memories: MemoryInfo[] = [];
  private loading = false;

  constructor(private client: SniparaClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MemoryItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: MemoryItem): Promise<MemoryItem[]> {
    if (!this.client.isConfigured()) {
      return [
        new MemoryItem(
          "Configure Snipara to view memories",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }

    if (!element) {
      // Root level: fetch all memories and group by type
      if (!this.loading) {
        this.loading = true;
        try {
          const response = await this.client.memories({ limit: 100 });
          if (response.success && response.result) {
            this.memories = response.result.memories;
          }
        } catch {
          // Silently fail - show empty
          this.memories = [];
        }
        this.loading = false;
      }

      if (this.memories.length === 0) {
        return [
          new MemoryItem(
            "No memories stored",
            vscode.TreeItemCollapsibleState.None
          ),
        ];
      }

      // Group by type
      const groups = new Map<MemoryType, MemoryInfo[]>();
      for (const memory of this.memories) {
        const list = groups.get(memory.type) || [];
        list.push(memory);
        groups.set(memory.type, list);
      }

      const items: MemoryItem[] = [];
      for (const [type, memories] of groups) {
        const config = MEMORY_TYPE_CONFIG[type];
        items.push(
          new MemoryItem(
            `${config.label} (${memories.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            type
          )
        );
      }
      return items;
    }

    // Children of a type group
    if (element.memoryType) {
      return this.memories
        .filter((m) => m.type === element.memoryType)
        .map(
          (memory) =>
            new MemoryItem(
              memory.content.length > 60
                ? memory.content.substring(0, 60) + "..."
                : memory.content,
              vscode.TreeItemCollapsibleState.None,
              undefined,
              memory
            )
        );
    }

    return [];
  }
}
