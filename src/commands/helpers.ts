import * as vscode from "vscode";
import type { SniparaClient } from "../client";

export async function requireConfigured(client: SniparaClient): Promise<boolean> {
  if (!client.isConfigured()) {
    const action = await vscode.window.showErrorMessage(
      "Snipara is not configured. Please set your API key and project ID.",
      "Configure"
    );
    if (action === "Configure") {
      vscode.commands.executeCommand("snipara.configure");
    }
    return false;
  }
  return true;
}
