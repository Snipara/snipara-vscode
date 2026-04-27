import * as vscode from "vscode";
import * as path from "path";
import type { RuntimeBridge } from "../runtime";
import {
  collectLocalReadiness,
  type LocalReadinessReport,
  type ProviderKeyStatus,
} from "../local-readiness";

type ReadinessGroup = "environment" | "snipara" | "runtime" | "suggestions";

class LocalReadinessItem extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly group?: ReadinessGroup
  ) {
    super(label, collapsibleState);
  }
}

export class LocalReadinessProvider
  implements vscode.TreeDataProvider<LocalReadinessItem>
{
  private _onDidChangeTreeData =
    new vscode.EventEmitter<LocalReadinessItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private report: LocalReadinessReport | undefined;
  private loading = false;
  private error: string | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private runtime: RuntimeBridge
  ) {}

  async refresh(): Promise<void> {
    this.loading = true;
    this._onDidChangeTreeData.fire();
    try {
      this.report = await collectLocalReadiness(this.context, this.runtime);
      this.error = undefined;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
    } finally {
      this.loading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  getReport(): LocalReadinessReport | undefined {
    return this.report;
  }

  getTreeItem(element: LocalReadinessItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: LocalReadinessItem
  ): Promise<LocalReadinessItem[]> {
    if (!this.report && !this.loading) {
      await this.refresh();
    }

    if (this.loading) {
      return [this.detail("Checking local readiness...", "sync~spin")];
    }

    if (!this.report) {
      const item = this.detail("Local readiness unavailable", "warning");
      item.tooltip = this.error;
      return [item];
    }

    if (!element) {
      return this.getRootItems(this.report);
    }

    switch (element.group) {
      case "environment":
        return this.getEnvironmentItems(this.report);
      case "snipara":
        return this.getSniparaItems(this.report);
      case "runtime":
        return this.getRuntimeItems(this.report);
      case "suggestions":
        return this.getSuggestionItems(this.report);
      default:
        return [];
    }
  }

  private getRootItems(report: LocalReadinessReport): LocalReadinessItem[] {
    const envOk = report.envFiles.length > 0 && report.providerKeys.length > 0;
    const runtimeOk = report.runtime.rlmInstalled;

    return [
      this.group("Environment", "environment", envOk ? "pass" : "warning"),
      this.group(
        "Snipara Auth",
        "snipara",
        report.sniparaAuth.configured ? "pass" : "key"
      ),
      this.group("Runtime", "runtime", runtimeOk ? "terminal" : "warning"),
      this.group("Suggestions", "suggestions", "lightbulb"),
    ];
  }

  private getEnvironmentItems(report: LocalReadinessReport): LocalReadinessItem[] {
    const items: LocalReadinessItem[] = [];

    if (report.workspaceRoots.length === 0) {
      items.push(this.detail("No workspace folder open", "warning"));
      return items;
    }

    if (report.envFiles.length > 0) {
      const envItem = this.detail(
        `${report.envFiles.length} env file${report.envFiles.length === 1 ? "" : "s"} found`,
        "pass"
      );
      envItem.tooltip = report.envFiles
        .map((file) => `${file.workspaceName}: ${file.path}`)
        .join("\n");
      items.push(envItem);

      for (const file of report.envFiles) {
        const item = this.detail(path.basename(file.path), "file-code");
        item.description = `${file.keys.length} keys`;
        item.tooltip = file.path;
        item.command = {
          command: "vscode.open",
          title: "Open Env File",
          arguments: [vscode.Uri.file(file.path)],
        };
        items.push(item);
      }
    } else {
      const missing = this.detail("No .env file found", "warning");
      missing.command = {
        command: "snipara.localReadiness.openEnv",
        title: "Create .env",
      };
      items.push(missing);
    }

    if (report.providerKeys.length > 0) {
      const keyItem = this.detail(
        `${report.providerKeys.length} provider key${report.providerKeys.length === 1 ? "" : "s"} detected`,
        "key"
      );
      keyItem.tooltip = providerKeyTooltip(report.providerKeys);
      items.push(keyItem);

      for (const providerKey of report.providerKeys) {
        const item = this.detail(providerKey.name, "key");
        item.description = providerKey.sources.join(", ");
        item.tooltip = providerKeyTooltip([providerKey]);
        items.push(item);
      }
    } else {
      const providerMissing = this.detail("No provider keys detected", "warning");
      providerMissing.tooltip =
        "Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or another supported provider key in your shell or workspace .env.";
      providerMissing.command = {
        command: "snipara.localReadiness.openEnv",
        title: "Open .env",
      };
      items.push(providerMissing);
    }

    return items;
  }

  private getSniparaItems(report: LocalReadinessReport): LocalReadinessItem[] {
    const auth = report.sniparaAuth;
    const items: LocalReadinessItem[] = [];

    const status = this.detail(
      auth.configured ? "Configured" : "Not fully configured",
      auth.configured ? "pass" : "warning"
    );
    status.description = auth.projectId ?? undefined;
    status.tooltip = new vscode.MarkdownString(
      [
        `API key: ${auth.hasApiKey ? `present (${auth.apiKeySource})` : "missing"}`,
        `Project ID: ${auth.projectId ?? "missing"}`,
        `Server: ${auth.serverUrl}`,
      ].join("\n\n")
    );
    items.push(status);

    if (!auth.configured) {
      const configure = this.detail("Configure Snipara", "github");
      configure.command = {
        command: "snipara.configure",
        title: "Configure Snipara",
      };
      items.push(configure);
    } else {
      const settings = this.detail("Show project settings", "settings-gear");
      settings.command = {
        command: "snipara.showSettings",
        title: "Show Project Settings",
      };
      items.push(settings);
    }

    return items;
  }

  private getRuntimeItems(report: LocalReadinessReport): LocalReadinessItem[] {
    const runtime = report.runtime;
    const items: LocalReadinessItem[] = [];

    const rlm = this.detail(
      runtime.rlmInstalled ? "RLM Runtime installed" : "RLM Runtime missing",
      runtime.rlmInstalled ? "pass" : "warning"
    );
    rlm.description = runtime.rlmVersion ?? undefined;
    items.push(rlm);

    if (runtime.dockerRunning) {
      const docker = this.detail("Docker running", "vm-running");
      docker.description = "isolated execution ready";
      items.push(docker);
    } else if (runtime.dockerInstalled) {
      items.push(this.detail("Docker installed, daemon stopped", "warning"));
    } else {
      items.push(this.detail("Docker not installed", "circle-slash"));
    }

    const hook = this.detail(
      runtime.rlmHookInstalled ? "rlm-hook installed" : "rlm-hook not installed",
      runtime.rlmHookInstalled ? "pass" : "circle-slash"
    );
    hook.description = runtime.rlmHookVersion ?? "optional";
    hook.tooltip =
      "Optional companion CLI. Core VS Code readiness checks do not depend on it.";
    items.push(hook);

    if (runtime.rlmHookInstalled) {
      const doctor = this.detail("Run companion doctor", "tools");
      doctor.command = {
        command: "snipara.localReadiness.runCompanionDoctor",
        title: "Run Companion Doctor",
      };
      items.push(doctor);
    }

    return items;
  }

  private getSuggestionItems(report: LocalReadinessReport): LocalReadinessItem[] {
    const items: LocalReadinessItem[] = [];

    const workflow = this.detail("Use workflow", "symbol-method");
    workflow.description = report.sniparaAuth.configured
      ? "plan, load, orchestrate"
      : "configure first";
    workflow.command = {
      command: "snipara.localReadiness.useWorkflow",
      title: "Use Workflow",
    };
    items.push(workflow);

    const runtime = this.detail("Use runtime", "terminal");
    runtime.description = report.runtime.rlmInstalled
      ? report.runtime.dockerRunning
        ? "local or Docker"
        : "local available"
      : "install runtime";
    runtime.command = {
      command: "snipara.localReadiness.useRuntime",
      title: "Use Runtime",
    };
    items.push(runtime);

    if (report.providerKeys.length === 0) {
      const env = this.detail("Add provider key", "key");
      env.command = {
        command: "snipara.localReadiness.openEnv",
        title: "Open .env",
      };
      items.push(env);
    }

    if (report.runtime.rlmHookInstalled) {
      const doctor = this.detail("Run companion doctor", "tools");
      doctor.command = {
        command: "snipara.localReadiness.runCompanionDoctor",
        title: "Run Companion Doctor",
      };
      items.push(doctor);
    }

    return items;
  }

  private group(
    label: string,
    group: ReadinessGroup,
    icon: string
  ): LocalReadinessItem {
    const item = new LocalReadinessItem(
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      group
    );
    item.iconPath = new vscode.ThemeIcon(icon);
    return item;
  }

  private detail(label: string, icon: string): LocalReadinessItem {
    const item = new LocalReadinessItem(
      label,
      vscode.TreeItemCollapsibleState.None
    );
    item.iconPath = new vscode.ThemeIcon(icon);
    return item;
  }
}

function providerKeyTooltip(providerKeys: ProviderKeyStatus[]): string {
  return providerKeys
    .map((key) => {
      const sourceDetail = key.sources
        .map((source) =>
          source === "env-file"
            ? `.env (${[...new Set(key.envFiles)].join(", ")})`
            : "environment"
        )
        .join(", ");
      return `${key.name}: ${sourceDetail}`;
    })
    .join("\n");
}
