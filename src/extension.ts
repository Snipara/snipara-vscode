import * as vscode from "vscode";
import { createClient, getConfigFromSettings } from "./client";
import { ResultsProvider } from "./views/results-provider";
import { ContextProvider } from "./views/context-provider";
import { MemoryProvider } from "./views/memory-provider";
import { SwarmDashboardProvider } from "./views/swarm-webview";
import { registerCommands } from "./commands";
import { registerLanguageModelTools } from "./lm-tools";
import { registerMcpProvider } from "./mcp-provider";
import { RuntimeBridge } from "./runtime";
import { RuntimeStatusBar } from "./views/runtime-status";
import { registerRuntimeCommands } from "./commands/runtime";
import { ExecutePythonTool } from "./lm-tools/execute-python";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Snipara extension is now active");

  // Create client instance
  const client = createClient();

  // Create runtime bridge and output channel
  const runtimeOutput = vscode.window.createOutputChannel("Snipara Runtime");
  const runtime = new RuntimeBridge(runtimeOutput);
  context.subscriptions.push(runtimeOutput);

  // Create tree data providers
  const resultsProvider = new ResultsProvider();
  const contextProvider = new ContextProvider();
  const memoryProvider = new MemoryProvider(client);
  const swarmDashboardProvider = new SwarmDashboardProvider(client);

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("snipara.resultsView", resultsProvider)
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("snipara.contextView", contextProvider)
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("snipara.memoriesView", memoryProvider)
  );

  // Register webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SwarmDashboardProvider.viewType,
      swarmDashboardProvider
    )
  );

  // Register all commands
  registerCommands(context, client, resultsProvider, contextProvider, memoryProvider);

  // Register runtime commands (independent of Snipara API client)
  registerRuntimeCommands(context, runtime);

  // Register refresh memories command
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.refreshMemories", () => {
      memoryProvider.refresh();
    })
  );

  // Register Language Model Tools (Copilot integration)
  registerLanguageModelTools(context, client);

  // Register Runtime Language Model Tool (Copilot)
  if (vscode.lm?.registerTool) {
    context.subscriptions.push(
      vscode.lm.registerTool("snipara_executePython", new ExecutePythonTool(runtime))
    );
  }

  // Register MCP Server Definition Provider
  registerMcpProvider(context, client);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration("snipara")) {
        client.updateConfig(getConfigFromSettings());
        console.log("Snipara configuration updated");
      }
    })
  );

  // Show welcome message if not configured
  if (!client.isConfigured()) {
    vscode.window
      .showInformationMessage(
        "Welcome to Snipara! Configure your API key to get started.",
        "Configure"
      )
      .then((action: string | undefined) => {
        if (action === "Configure") {
          vscode.commands.executeCommand("snipara.configure");
        }
      });
  }

  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(database) Snipara";
  statusBarItem.tooltip = "Snipara - Click to query documentation";
  statusBarItem.command = "snipara.askQuestion";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Register runtime status bar item
  const runtimeStatusBar = new RuntimeStatusBar(runtime);
  context.subscriptions.push(runtimeStatusBar.getDisposable());

  // Detect runtime availability (non-blocking)
  const runtimeConfig = vscode.workspace.getConfiguration("snipara");
  if (runtimeConfig.get<boolean>("runtimeEnabled", true)) {
    runtime.detect().then((status) => {
      console.log(
        `Snipara Runtime: rlm=${status.rlmInstalled}` +
          ` (${status.rlmVersion ?? "n/a"})` +
          `, docker=${status.dockerRunning}`
      );
      vscode.commands.executeCommand(
        "setContext",
        "snipara.rlmInstalled",
        status.rlmInstalled
      );
      vscode.commands.executeCommand(
        "setContext",
        "snipara.dockerRunning",
        status.dockerRunning
      );
      runtimeStatusBar.update();
    });
  }

  // Lifecycle: Auto-restore session context on startup
  const config = vscode.workspace.getConfiguration("snipara");
  if (config.get<boolean>("enableAutoRestore") && client.isConfigured()) {
    const savedContext = context.globalState.get<string>("snipara.lastSessionContext");
    if (savedContext) {
      client.injectContext(savedContext, false).catch(() => {});
    }

    client
      .recall("session context decisions learnings", { limit: 5, type: "context" })
      .then((response) => {
        if (response.success && response.result?.memories.length) {
          const memoryContext = response.result.memories
            .map((m) => `[${m.type}] ${m.content}`)
            .join("\n");
          client.injectContext(memoryContext, true).catch(() => {});
        }
      })
      .catch(() => {});

    console.log("Snipara: Auto-restore initiated");
  }

  // Lifecycle: Periodic context save (every 5 minutes)
  if (config.get<boolean>("enableAutoSave") && client.isConfigured()) {
    const saveInterval = setInterval(async () => {
      try {
        const resp = await client.getContext();
        if (resp.success && resp.result) {
          await context.globalState.update(
            "snipara.lastSessionContext",
            typeof resp.result === "string" ? resp.result : JSON.stringify(resp.result)
          );
        }
      } catch {
        // Silent — best-effort periodic save
      }
    }, 5 * 60 * 1000);

    context.subscriptions.push({ dispose: () => clearInterval(saveInterval) });
    console.log("Snipara: Auto-save enabled (every 5 minutes)");
  }
}

export async function deactivate(): Promise<void> {
  console.log("Snipara extension is now deactivated");

  const config = vscode.workspace.getConfiguration("snipara");
  if (!config.get<boolean>("enableAutoSave")) {
    return;
  }

  const client = createClient();
  if (!client.isConfigured()) {
    return;
  }

  try {
    await client.remember({
      content: `VS Code session ended. Last active project: ${client.getConfig().projectId}`,
      type: "context",
      scope: "project",
      ttlDays: 7,
    });
  } catch {
    // Best-effort, don't block shutdown
  }
}
