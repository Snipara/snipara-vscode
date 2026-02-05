import * as vscode from "vscode";
import { createClient, getConfigFromSettings } from "./client";
import { ResultsProvider } from "./views/results-provider";
import { ContextProvider } from "./views/context-provider";
import { MemoryProvider } from "./views/memory-provider";
import { SwarmDashboardProvider } from "./views/swarm-webview";
import { WelcomeProvider } from "./views/welcome-provider";
import { registerCommands } from "./commands";
import { registerLanguageModelTools } from "./lm-tools";
import { registerMcpProvider } from "./mcp-provider";
import { RuntimeBridge } from "./runtime";
import { RuntimeStatusBar } from "./views/runtime-status";
import { registerRuntimeCommands } from "./commands/runtime";
import { ExecutePythonTool } from "./lm-tools/execute-python";
import { getApiKey, isConfigured } from "./auth/auto-register";
import { demoContextQuery, demoGetStats, calculateDemoStats, formatTokens } from "./demo";
import { showDemoWebview } from "./views/demo-webview";
import { scanWorkspaceForDocs } from "./workspace-scanner";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Snipara extension is now active");

  // Create client instance (uses SecretStorage API key if available)
  const client = createClient();

  // Bootstrap: try to load API key from SecretStorage and configure the client
  getApiKey(context).then((apiKey) => {
    if (apiKey) {
      client.updateConfig({ apiKey });
    }
    // Set context key for view visibility (after API key is loaded)
    vscode.commands.executeCommand(
      "setContext",
      "snipara.isConfigured",
      client.isConfigured()
    );
  });

  // Create runtime bridge and output channel
  const runtimeOutput = vscode.window.createOutputChannel("Snipara Runtime");
  const runtime = new RuntimeBridge(runtimeOutput);
  context.subscriptions.push(runtimeOutput);

  // Create tree data providers
  const resultsProvider = new ResultsProvider();
  const contextProvider = new ContextProvider();
  const memoryProvider = new MemoryProvider(client);
  const swarmDashboardProvider = new SwarmDashboardProvider(client);
  const welcomeProvider = new WelcomeProvider();

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("snipara.welcomeView", welcomeProvider)
  );
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

  // Register demo query command (fully offline — no API key needed)
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.demoQuery", async () => {
      const query = "How does Snipara optimize context for LLMs?";

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara (Demo): Running demo query...",
          cancellable: false,
        },
        async () => {
          try {
            const [statsResponse, queryResponse] = await Promise.all([
              demoGetStats(),
              demoContextQuery(),
            ]);

            if (queryResponse.success && queryResponse.result) {
              const totalProjectTokens =
                statsResponse?.success && statsResponse.result
                  ? Math.ceil(statsResponse.result.total_characters / 4)
                  : 0;

              const demoStats =
                totalProjectTokens > 0
                  ? calculateDemoStats(
                      totalProjectTokens,
                      queryResponse.result.total_tokens,
                      queryResponse.usage?.latency_ms ?? 0
                    )
                  : undefined;

              resultsProvider.setResults(
                query,
                queryResponse.result.sections,
                queryResponse.result.total_tokens,
                queryResponse.result.suggestions,
                { isDemo: true, demoStats }
              );

              // Open rich webview panel in the editor area
              showDemoWebview(
                context.extensionUri,
                query,
                queryResponse.result.sections,
                queryResponse.result.suggestions ?? [],
                demoStats
              );

              // Also reveal the sidebar results tree
              vscode.commands.executeCommand("snipara.resultsView.focus");
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Demo error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // Register Language Model Tools (Copilot integration)
  registerLanguageModelTools(context, client);

  // Register Runtime Language Model Tool (Copilot)
  if (vscode.lm?.registerTool) {
    const pyTool = new ExecutePythonTool(runtime);
    (pyTool as any).prepareInvocation = () => ({
      invocationMessage: "Running Snipara Execute Python...",
    });
    context.subscriptions.push(
      vscode.lm.registerTool("snipara_executePython", pyTool)
    );
    console.log("Snipara: snipara_executePython tool registered");
  }

  // Register MCP Server Definition Provider
  registerMcpProvider(context, client);

  // Register status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  // Helper to update status bar and context key based on configuration state
  const updateStatusBar = () => {
    const configured = client.isConfigured();
    vscode.commands.executeCommand("setContext", "snipara.isConfigured", configured);

    if (configured) {
      statusBarItem.text = "$(database) Snipara";
      statusBarItem.tooltip = "Snipara - Click to query documentation";
      statusBarItem.command = "snipara.askQuestion";
      statusBarItem.backgroundColor = undefined;
    } else {
      statusBarItem.text = "$(key) Snipara: Sign in";
      statusBarItem.tooltip = "Click to sign in with GitHub (30-day free Pro trial)";
      statusBarItem.command = "snipara.configure";
      statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    }
  };

  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration("snipara")) {
        client.updateConfig(getConfigFromSettings());
        updateStatusBar();
        console.log("Snipara configuration updated");
      }
    })
  );

  // Show walkthrough if not configured (replaces old welcome notification)
  isConfigured(context).then((configured) => {
    vscode.commands.executeCommand("setContext", "snipara.isConfigured", configured);

    if (!configured) {
      vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "snipara.snipara#snipara.gettingStarted",
        false
      );
    }
  });

  // Workspace doc scanner (delayed to avoid competing with walkthrough)
  setTimeout(async () => {
    try {
      const scanResult = await scanWorkspaceForDocs();
      if (!scanResult) return;

      vscode.commands.executeCommand("setContext", "snipara.workspaceHasDocs", true);
      welcomeProvider.setScanResult(scanResult);

      if (client.isConfigured()) {
        const action = await vscode.window.showInformationMessage(
          `Found ${scanResult.fileCount} documentation files (~${formatTokens(scanResult.estimatedTokens)} tokens). Index them with Snipara?`,
          "Index Now"
        );
        if (action === "Index Now") {
          vscode.commands.executeCommand("snipara.syncDocuments");
        }
      } else {
        const action = await vscode.window.showInformationMessage(
          `Found ${scanResult.fileCount} docs (~${formatTokens(scanResult.estimatedTokens)} tokens). Snipara compresses to ~${formatTokens(scanResult.compressedTokens)} tokens for your LLM.`,
          "Try Demo",
          "Sign in (free)"
        );
        if (action === "Try Demo") {
          vscode.commands.executeCommand("snipara.demoQuery");
        } else if (action === "Sign in (free)") {
          vscode.commands.executeCommand("snipara.configure");
        }
      }
    } catch {
      // Silent — workspace scanning is best-effort
    }
  }, 3000);

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
