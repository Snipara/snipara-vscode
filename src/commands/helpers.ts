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
