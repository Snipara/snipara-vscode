import * as vscode from "vscode";

interface PluginRegisterResponse {
  success: boolean;
  user: { id: string; email: string; name: string | null; is_new: boolean };
  team: { id: string; slug: string; name: string };
  project: { id: string; slug: string; name: string; is_new: boolean };
  api_key: string;
  server_url: string;
  mcp_endpoint: string;
}

export interface AutoRegisterResult {
  apiKey: string;
  projectId: string;
  projectSlug: string;
  serverUrl: string;
  mcpEndpoint: string;
  isNewUser: boolean;
  isNewProject: boolean;
  email: string;
}

/**
 * Sign in with GitHub via VS Code's built-in auth provider,
 * then register/provision on Snipara backend.
 */
export async function signInWithGitHub(
  serverUrl: string
): Promise<AutoRegisterResult> {
  // Use VS Code's built-in GitHub auth provider
  const session = await vscode.authentication.getSession(
    "github",
    ["user:email"],
    { createIfNone: true }
  );

  if (!session) {
    throw new Error("GitHub authentication was cancelled");
  }

  // Call Snipara backend to auto-register
  const baseUrl = serverUrl.replace("api.snipara.com", "snipara.com");
  const registerUrl = baseUrl.includes("localhost")
    ? `${baseUrl}/api/auth/plugin-register`
    : "https://snipara.com/api/auth/plugin-register";

  const response = await fetch(registerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "github",
      provider_token: session.accessToken,
      client_id: "snipara-vscode",
      client_name: "VS Code Extension",
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(
      (errorData.error_description as string) || `Registration failed (${response.status})`
    );
  }

  const data = (await response.json()) as PluginRegisterResponse;

  return {
    apiKey: data.api_key,
    projectId: data.project.id,
    projectSlug: data.project.slug,
    serverUrl: data.server_url,
    mcpEndpoint: data.mcp_endpoint,
    isNewUser: data.user.is_new,
    isNewProject: data.project.is_new,
    email: data.user.email,
  };
}
