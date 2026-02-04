import * as vscode from "vscode";
import type { SniparaClient } from "../client";

export async function requireConfigured(client: SniparaClient): Promise<boolean> {
  if (!client.isConfigured()) {
    const action = await vscode.window.showWarningMessage(
      "Snipara: Sign in to use this feature. Free tier: 100 queries/month, no credit card.",
      "Sign in with GitHub",
      "Configure Manually"
    );
    if (action === "Sign in with GitHub" || action === "Configure Manually") {
      vscode.commands.executeCommand("snipara.configure");
    }
    return false;
  }
  return true;
}

export interface ConfiguredOrDemo {
  client: SniparaClient;
  isDemo: boolean;
}

/**
 * Returns the real client if configured, otherwise falls back to the demo client.
 * Use this for commands that should work in demo mode (askQuestion, searchDocs).
 */
export function getClientOrDemo(
  client: SniparaClient,
  demoClient: SniparaClient
): ConfiguredOrDemo {
  if (client.isConfigured()) {
    return { client, isDemo: false };
  }
  return { client: demoClient, isDemo: true };
}
