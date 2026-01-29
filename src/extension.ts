import * as vscode from "vscode";
import { createClient, getConfigFromSettings } from "./client";
import { ResultsProvider } from "./views/results-provider";
import { ContextProvider } from "./views/context-provider";
import { MemoryProvider } from "./views/memory-provider";
import { SwarmDashboardProvider } from "./views/swarm-webview";
import { registerCommands } from "./commands";
import { registerLanguageModelTools } from "./lm-tools";
import { registerMcpProvider } from "./mcp-provider";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Snipara extension is now active");

  // Create client instance
  const client = createClient();

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

  // Register refresh memories command
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.refreshMemories", () => {
      memoryProvider.refresh();
    })
  );

  // Register Language Model Tools (Copilot integration)
  registerLanguageModelTools(context, client);

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
}

export function deactivate(): void {
  console.log("Snipara extension is now deactivated");
}
