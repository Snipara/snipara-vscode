import * as vscode from "vscode";
import * as path from "path";
import type { RuntimeBridge } from "./runtime";
import type { RuntimeStatus } from "./types";

export type ProviderKeySource = "environment" | "env-file";

export interface EnvFileStatus {
  path: string;
  workspaceName: string;
  keys: string[];
}

export interface ProviderKeyStatus {
  name: string;
  sources: ProviderKeySource[];
  envFiles: string[];
}

export interface SniparaAuthStatus {
  hasApiKey: boolean;
  hasProjectId: boolean;
  configured: boolean;
  projectId: string | null;
  serverUrl: string;
  apiKeySource: "secret-storage" | "settings" | null;
}

export interface LocalReadinessReport {
  workspaceRoots: string[];
  envFiles: EnvFileStatus[];
  providerKeys: ProviderKeyStatus[];
  sniparaAuth: SniparaAuthStatus;
  runtime: RuntimeStatus;
  generatedAt: number;
}

const ENV_FILE_NAMES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
];

const PROVIDER_KEY_NAMES = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "AZURE_OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "MISTRAL_API_KEY",
  "COHERE_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
  "TOGETHER_API_KEY",
  "DEEPSEEK_API_KEY",
  "XAI_API_KEY",
  "PERPLEXITY_API_KEY",
  "MINIMAX_API_KEY",
];

export async function collectLocalReadiness(
  context: vscode.ExtensionContext,
  runtime: RuntimeBridge
): Promise<LocalReadinessReport> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  const envFiles = await findEnvFiles(workspaceFolders);
  const providerKeys = collectProviderKeys(envFiles);
  const sniparaAuth = await collectSniparaAuth(context);
  const runtimeStatus = await runtime.detect();

  return {
    workspaceRoots: workspaceFolders.map((folder) => folder.uri.fsPath),
    envFiles,
    providerKeys,
    sniparaAuth,
    runtime: runtimeStatus,
    generatedAt: Date.now(),
  };
}

async function findEnvFiles(
  workspaceFolders: readonly vscode.WorkspaceFolder[]
): Promise<EnvFileStatus[]> {
  const results: EnvFileStatus[] = [];

  for (const folder of workspaceFolders) {
    for (const fileName of ENV_FILE_NAMES) {
      const uri = vscode.Uri.joinPath(folder.uri, fileName);
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        if (stat.type !== vscode.FileType.File) continue;

        const bytes = await vscode.workspace.fs.readFile(uri);
        results.push({
          path: uri.fsPath,
          workspaceName: folder.name,
          keys: parseEnvKeys(Buffer.from(bytes).toString("utf8")),
        });
      } catch {
        // Missing or unreadable env files are expected.
      }
    }
  }

  return results;
}

function parseEnvKeys(content: string): string[] {
  const keys = new Set<string>();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) {
      keys.add(match[1]);
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function collectProviderKeys(envFiles: EnvFileStatus[]): ProviderKeyStatus[] {
  const keys = new Map<string, ProviderKeyStatus>();

  for (const name of PROVIDER_KEY_NAMES) {
    if (process.env[name]) {
      keys.set(name, {
        name,
        sources: ["environment"],
        envFiles: [],
      });
    }
  }

  for (const envFile of envFiles) {
    for (const key of envFile.keys) {
      if (!PROVIDER_KEY_NAMES.includes(key)) continue;

      const status =
        keys.get(key) ??
        ({
          name: key,
          sources: [],
          envFiles: [],
        } satisfies ProviderKeyStatus);

      if (!status.sources.includes("env-file")) {
        status.sources.push("env-file");
      }
      status.envFiles.push(path.basename(envFile.path));
      keys.set(key, status);
    }
  }

  return [...keys.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function collectSniparaAuth(
  context: vscode.ExtensionContext
): Promise<SniparaAuthStatus> {
  const config = vscode.workspace.getConfiguration("snipara");
  const secretKey = await context.secrets.get("snipara.apiKey");
  const settingsKey = config.get<string>("apiKey") || "";
  const projectId = config.get<string>("projectId") || "";
  const serverUrl = config.get<string>("serverUrl") || "https://api.snipara.com";

  const apiKeySource = secretKey
    ? "secret-storage"
    : settingsKey
      ? "settings"
      : null;

  return {
    hasApiKey: Boolean(secretKey || settingsKey),
    hasProjectId: Boolean(projectId),
    configured: Boolean((secretKey || settingsKey) && projectId),
    projectId: projectId || null,
    serverUrl,
    apiKeySource,
  };
}
