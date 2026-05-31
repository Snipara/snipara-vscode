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
import { registerLocalReadinessCommands } from "./commands/local-readiness";
import { LocalReadinessProvider } from "./views/local-readiness-provider";
import { ExecutePythonTool } from "./lm-tools/execute-python";
import { getApiKey, isConfigured } from "./auth/auto-register";
import { demoContextQuery, calculateDemoStats, formatTokens, DEMO_STATS } from "./demo";
import { showDemoWebview } from "./views/demo-webview";
import { scanWorkspaceForDocs } from "./workspace-scanner";
import { initDemoLimiter, getDemoLimiter } from "./demo-limiter";
import { initTelemetry, trackEvent } from "./telemetry";

const ONBOARDING_SHOWN_KEY = "snipara.onboardingShown";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Snipara extension is now active");

  // Initialize demo limiter and telemetry
  initDemoLimiter(context);
  initTelemetry(context).then(() => {
    trackEvent("extension_activated");
  });

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
  const runtimeOutput = vscode.window.createOutputChannel("Snipara Sandbox");
  const runtime = new RuntimeBridge(runtimeOutput);
  context.subscriptions.push(runtimeOutput);

  // Create tree data providers
  const resultsProvider = new ResultsProvider();
  const contextProvider = new ContextProvider();
  const memoryProvider = new MemoryProvider(client);
  const swarmDashboardProvider = new SwarmDashboardProvider(client);
  const welcomeProvider = new WelcomeProvider();
  const localReadinessProvider = new LocalReadinessProvider(context, runtime);

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
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "snipara.localReadinessView",
      localReadinessProvider
    )
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

  // Register local readiness commands (native checks, optional companion doctor)
  registerLocalReadinessCommands(context, localReadinessProvider, runtime);

  // Register refresh memories command
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.refreshMemories", () => {
      memoryProvider.refresh();
    })
  );

  // Register demo query command (fully offline — no API key needed)
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.demoQuery", async () => {
      const demoLimiter = getDemoLimiter();

      // Check demo limit before proceeding
      if (demoLimiter?.isLimitReached()) {
        trackEvent("demo_limit_reached");
        await demoLimiter.showSignInWall();
        return;
      }

      // Increment demo count
      if (demoLimiter) {
        await demoLimiter.incrementCount();
        trackEvent("demo_query", { remaining: demoLimiter.getRemainingCount() });
      }

      const query = "How does Snipara keep project memory available across agents?";

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara (Demo): Running demo query...",
          cancellable: false,
        },
        async () => {
          try {
            const queryResponse = await demoContextQuery();

            if (queryResponse.success && queryResponse.result) {
              const totalProjectTokens = Math.ceil(DEMO_STATS.total_characters / 4);

              const demoStats = calculateDemoStats(
                totalProjectTokens,
                queryResponse.result.total_tokens,
                queryResponse.usage?.latency_ms ?? 0
              );

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
                demoStats,
                demoLimiter?.getRemainingCount() ?? 0
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
      statusBarItem.tooltip = "Click to sign in with GitHub (free account, no credit card)";
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
        localReadinessProvider.refresh();
        console.log("Snipara configuration updated");
      }
    })
  );

  // Show first-run walkthrough if not configured. Demo queries stay opt-in.
  isConfigured(context).then(async (configured) => {
    vscode.commands.executeCommand("setContext", "snipara.isConfigured", configured);

    if (!configured) {
      const hasSeenOnboarding = context.globalState.get<boolean>(
        ONBOARDING_SHOWN_KEY,
        false
      );
      const hasRunDemoBefore = (getDemoLimiter()?.getUsedCount() ?? 0) > 0;

      if (hasSeenOnboarding) {
        return;
      }

      if (hasRunDemoBefore) {
        await context.globalState.update(ONBOARDING_SHOWN_KEY, true);
        return;
      }

      await context.globalState.update(ONBOARDING_SHOWN_KEY, true);
      vscode.commands.executeCommand(
        "workbench.action.openWalkthrough",
        "snipara.snipara#snipara.gettingStarted#snipara.walkthrough.demo",
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
          `Found ${scanResult.fileCount} documentation files (~${formatTokens(scanResult.estimatedTokens)}). Index them as Snipara project context?`,
          "Index Now"
        );
        if (action === "Index Now") {
          vscode.commands.executeCommand("snipara.syncDocuments");
        }
      } else {
        const action = await vscode.window.showInformationMessage(
          `Found ${scanResult.fileCount} docs (~${formatTokens(scanResult.estimatedTokens)}). Snipara can turn them into reusable project context for agents.`,
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

  // Register sandbox status bar item
  const runtimeStatusBar = new RuntimeStatusBar(runtime);
  context.subscriptions.push(runtimeStatusBar.getDisposable());

  // Detect Snipara Sandbox availability (non-blocking)
  const runtimeConfig = vscode.workspace.getConfiguration("snipara");
  if (runtimeConfig.get<boolean>("sandboxEnabled", true)) {
    runtime.detect().then((status) => {
      console.log(
        `Snipara Sandbox: installed=${status.sandboxInstalled}` +
          ` (${status.sandboxVersion ?? "n/a"})` +
          `, docker=${status.dockerRunning}`
      );
      vscode.commands.executeCommand(
        "setContext",
        "snipara.sandboxInstalled",
        status.sandboxInstalled
      );
      vscode.commands.executeCommand(
        "setContext",
        "snipara.dockerRunning",
        status.dockerRunning
      );
      runtimeStatusBar.update();
      localReadinessProvider.refresh();
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
