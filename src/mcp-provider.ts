import * as vscode from "vscode";
import type { SniparaClient } from "./client";

export function registerMcpProvider(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // Guard: MCP Server Definition Provider requires VS Code 1.99+
  const lm = vscode.lm as typeof vscode.lm & {
    registerMcpServerDefinitionProvider?: (
      id: string,
      provider: { provideMcpServerDefinitions: () => vscode.ProviderResult<unknown[]> }
    ) => vscode.Disposable;
  };

  if (!lm.registerMcpServerDefinitionProvider) {
    console.log("Snipara: MCP Server Definition Provider API not available in this VS Code version");
    return;
  }

  const provider = {
    provideMcpServerDefinitions(): vscode.ProviderResult<unknown[]> {
      const config = client.getConfig();
      if (!config.apiKey || !config.projectId) {
        return [];
      }

      return [
        {
          type: "http",
          label: `Snipara: ${config.projectId}`,
          url: `${config.serverUrl}/mcp/${config.projectId}`,
          headers: {
            "X-API-Key": config.apiKey,
          },
        },
      ];
    },
  };

  context.subscriptions.push(
    lm.registerMcpServerDefinitionProvider("snipara-mcp", provider)
  );

  console.log("Snipara: MCP Server Definition Provider registered");
}
