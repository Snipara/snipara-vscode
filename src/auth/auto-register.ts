import * as vscode from "vscode";
import { signInWithGitHub, AutoRegisterResult } from "./github-auth";

/**
 * Orchestrates the auto-registration flow:
 * 1. GitHub auth → plugin-register call → store credentials → configure client
 *
 * Stores API key in VS Code SecretStorage (encrypted, OS keychain).
 * Stores projectId and serverUrl in VS Code settings (non-sensitive).
 */
export async function autoRegister(
  context: vscode.ExtensionContext
): Promise<AutoRegisterResult | null> {
  const config = vscode.workspace.getConfiguration("snipara");
  const serverUrl =
    config.get<string>("serverUrl") || "https://api.snipara.com";

  try {
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Snipara: Signing in with GitHub...",
        cancellable: false,
      },
      async () => signInWithGitHub(serverUrl)
    );

    // Store API key in SecretStorage (encrypted)
    await context.secrets.store("snipara.apiKey", result.apiKey);

    // Store non-sensitive settings (triggers config change listener which updates status bar)
    // Note: The caller should update the client with the apiKey AFTER this returns,
    // so the config change listener sees a properly configured client
    await config.update("serverUrl", result.serverUrl, vscode.ConfigurationTarget.Global);
    await config.update("projectId", result.projectSlug, vscode.ConfigurationTarget.Global);

    // Clear any legacy plaintext API key from settings
    const legacyKey = config.get<string>("apiKey");
    if (legacyKey) {
      await config.update("apiKey", "", vscode.ConfigurationTarget.Global);
    }

    const welcomeMsg = result.isNewUser
      ? `Welcome to Snipara! Account created for ${result.email}. Project "${result.projectSlug}" is ready.`
      : `Signed in as ${result.email}. Using project "${result.projectSlug}".`;

    vscode.window.showInformationMessage(welcomeMsg);

    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    vscode.window.showErrorMessage(`Snipara sign-in failed: ${msg}`);
    return null;
  }
}

/**
 * Get the API key from SecretStorage, falling back to settings for migration.
 */
export async function getApiKey(
  context: vscode.ExtensionContext
): Promise<string> {
  // Try SecretStorage first
  const secret = await context.secrets.get("snipara.apiKey");
  if (secret) return secret;

  // Fall back to legacy plaintext setting
  const config = vscode.workspace.getConfiguration("snipara");
  const legacyKey = config.get<string>("apiKey") || "";

  // Migrate to SecretStorage if found
  if (legacyKey) {
    await context.secrets.store("snipara.apiKey", legacyKey);
    await config.update("apiKey", "", vscode.ConfigurationTarget.Global);
  }

  return legacyKey;
}

/**
 * Check if the extension is configured (has API key + project ID).
 */
export async function isConfigured(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const apiKey = await getApiKey(context);
  const config = vscode.workspace.getConfiguration("snipara");
  const projectId = config.get<string>("projectId") || "";
  return !!(apiKey && projectId);
}
