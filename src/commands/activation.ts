import * as vscode from "vscode";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import { promisify } from "util";
import type { SniparaClient } from "../client";
import type { ResultsProvider } from "../views/results-provider";
import { autoRegister, getApiKey } from "../auth/auto-register";
import { showFirstWorkBriefWebview } from "../views/first-work-brief-webview";
import { trackEvent } from "../telemetry";
import type { ContextSection } from "../types";

const FIRST_WORK_BRIEF_QUERY =
  "What does this project do, how should an AI coding agent start working on it, and what files matter first?";

const execFileAsync = promisify(execFile);
const ACTIVATION_STATE_KEY = "snipara.workspaceActivated";
const ACTIVATION_MANIFEST_PATH = path.join(
  ".snipara",
  "activation",
  "activation-manifest.json"
);

export interface EditorActivationManifest {
  schemaVersion: string;
  surfaceContract: Record<string, unknown>;
  artifacts: {
    firstBriefPath?: string;
    handoffPath?: string;
    activationManifestPath?: string;
  };
  lanes: Record<string, { status?: string; message?: string; error?: string }>;
  nextActions: ActivationNextAction[];
  errors: ActivationUserError[];
  query: string;
  indexedFiles: string[];
  estimatedTokens: number;
  sections: ContextSection[];
  suggestions: string[];
  raw: Record<string, unknown>;
}

export interface ActivationNextAction {
  id?: string;
  label: string;
  command?: string;
  description?: string;
}

export interface ActivationUserError {
  code?: string;
  message: string;
  userAction?: string;
}

export function registerActivationCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  resultsProvider: ResultsProvider,
  onActivated?: () => void
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.activateWorkspace", async () => {
      const workspaceRoot = getWorkspaceRoot();
      if (!workspaceRoot) {
        vscode.window.showWarningMessage(
          "Open a workspace folder before activating Snipara."
        );
        return;
      }

      if (!(await ensureNpxAvailable())) {
        return;
      }

      if (!(await ensureConfigured(context, client))) {
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Activating this workspace...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Running create-snipara activation engine" });

          const activation = await runEditorActivation(context, client, workspaceRoot);
          if (!activation.ok) {
            await showActivationFailure(activation);
            trackEvent("workspace_activation_failed", {
              exitCode: activation.exitCode,
              code: activation.error?.code,
            });
            return;
          }

          progress.report({ message: "Reading activation manifest" });
          const manifest = await loadActivationManifest(workspaceRoot, activation.stdoutJson);
          if (!manifest) {
            vscode.window.showErrorMessage(
              `create-snipara finished, but ${ACTIVATION_MANIFEST_PATH} was not found or was not readable.`
            );
            trackEvent("workspace_activation_failed", { code: "manifest_missing" });
            return;
          }

          resultsProvider.setResults(
            manifest.query,
            manifest.sections,
            manifest.sections.reduce((total, section) => total + section.token_count, 0),
            manifest.suggestions
          );
          showFirstWorkBriefWebview(manifest);
          await context.globalState.update(ACTIVATION_STATE_KEY, true);
          await vscode.commands.executeCommand("setContext", ACTIVATION_STATE_KEY, true);
          onActivated?.();
          await vscode.commands.executeCommand("snipara.resultsView.focus");

          trackEvent("workspace_activated", {
            schemaVersion: manifest.schemaVersion,
            fileCount: manifest.indexedFiles.length,
          });

          const nextAction = await vscode.window.showInformationMessage(
            "Snipara Active: opened your First Work Brief.",
            "Hand off to Copilot",
            "Open Snipara tools"
          );
          if (nextAction === "Hand off to Copilot") {
            await vscode.env.clipboard.writeText(buildCopilotHandoff(manifest));
            await vscode.commands.executeCommand("workbench.action.chat.open");
          } else if (nextAction === "Open Snipara tools") {
            await vscode.commands.executeCommand("workbench.view.extension.snipara");
          }
        }
      );
    })
  );
}

export function isWorkspaceActivated(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>(ACTIVATION_STATE_KEY, false);
}

async function ensureConfigured(
  context: vscode.ExtensionContext,
  client: SniparaClient
): Promise<boolean> {
  const apiKey = await getApiKey(context);
  const config = client.getConfig();
  if (apiKey && config.projectId) {
    client.updateConfig({ apiKey });
    return true;
  }

  const action = await vscode.window.showInformationMessage(
    "Snipara needs an API key to activate this workspace. Sign in stores it in VS Code SecretStorage.",
    "Sign in and activate"
  );
  if (action !== "Sign in and activate") {
    return false;
  }

  const result = await autoRegister(context);
  if (!result) {
    return false;
  }

  client.updateConfig({
    apiKey: result.apiKey,
    projectId: result.projectSlug,
    serverUrl: result.serverUrl,
  });
  await vscode.commands.executeCommand("setContext", "snipara.isConfigured", true);
  return true;
}

async function ensureNpxAvailable(): Promise<boolean> {
  try {
    await execFileAsync("npx", ["--version"], { timeout: 10000 });
    return true;
  } catch {
    const action = await vscode.window.showErrorMessage(
      "Snipara Activate Workspace needs Node.js/npm with npx available on PATH.",
      "Install Node.js"
    );
    if (action === "Install Node.js") {
      await vscode.env.openExternal(vscode.Uri.parse("https://nodejs.org/"));
    }
    return false;
  }
}

function getWorkspaceRoot(): string | null {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
}

async function runEditorActivation(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  cwd: string
): Promise<{
  ok: boolean;
  exitCode?: number;
  stdoutJson?: Record<string, unknown>;
  error?: ActivationUserError;
}> {
  const apiKey = await getApiKey(context);
  const config = client.getConfig();
  const env = {
    ...process.env,
    RLM_API_KEY: apiKey || process.env.RLM_API_KEY || "",
    SNIPARA_API_KEY: apiKey || process.env.SNIPARA_API_KEY || "",
    SNIPARA_PROJECT_ID: config.projectId || process.env.SNIPARA_PROJECT_ID || "",
    SNIPARA_SERVER_URL: config.serverUrl || process.env.SNIPARA_SERVER_URL || "",
  };

  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["-y", "create-snipara@latest", "init", "--client", "vscode", "--starter", "--json"],
      {
        cwd,
        env,
        timeout: 5 * 60 * 1000,
        maxBuffer: 1024 * 1024,
      }
    );
    return { ok: true, stdoutJson: parseJsonObject(stdout) ?? undefined };
  } catch (error) {
    const candidate = error as {
      code?: number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    const stdoutJson = parseJsonObject(candidate.stdout ?? "");
    return {
      ok: false,
      exitCode: typeof candidate.code === "number" ? candidate.code : undefined,
      stdoutJson: stdoutJson ?? undefined,
      error: normalizeActivationError(stdoutJson, candidate.message ?? candidate.stderr),
    };
  }
}

async function showActivationFailure(result: {
  exitCode?: number;
  error?: ActivationUserError;
}): Promise<void> {
  const message = result.error?.message ?? "Workspace activation failed.";
  const userAction = result.error?.userAction;
  const action = await vscode.window.showErrorMessage(
    userAction ? `${message} ${userAction}` : message,
    "Open Terminal"
  );
  if (action === "Open Terminal") {
    vscode.window.createTerminal({
      name: "Snipara Activate Workspace",
      cwd: getWorkspaceRoot() ?? undefined,
    }).sendText("npx -y create-snipara@latest init --client vscode --starter --json");
  }
}

async function loadActivationManifest(
  workspaceRoot: string,
  stdoutJson?: Record<string, unknown>
): Promise<EditorActivationManifest | null> {
  const manifestPath =
    stringAt(stdoutJson, "artifacts.activationManifestPath") ??
    stringAt(stdoutJson, "artifacts.activation_manifest_path") ??
    path.join(workspaceRoot, ACTIVATION_MANIFEST_PATH);
  const absoluteManifestPath = path.isAbsolute(manifestPath)
    ? manifestPath
    : path.join(workspaceRoot, manifestPath);

  let manifestText: string;
  try {
    manifestText = await fs.readFile(absoluteManifestPath, "utf-8");
  } catch {
    return stdoutJson ? normalizeManifest(stdoutJson) : null;
  }

  return normalizeManifest(parseJsonObject(manifestText));
}

function normalizeManifest(raw: Record<string, unknown> | null): EditorActivationManifest | null {
  if (!raw) {
    return null;
  }

  const brief = objectAt(raw, "firstWorkBrief") ?? objectAt(raw, "first_work_brief") ?? raw;
  const artifacts = objectAt(raw, "artifacts") ?? {};
  const files = arrayAt(raw, "files").length
    ? arrayAt(raw, "files")
    : arrayAt(raw, "indexedFiles").length
      ? arrayAt(raw, "indexedFiles")
      : arrayAt(raw, "indexed_files");

  return {
    schemaVersion:
      stringAt(raw, "schemaVersion") ?? stringAt(raw, "schema_version") ?? "unknown",
    surfaceContract: objectAt(raw, "surfaceContract") ?? objectAt(raw, "surface_contract") ?? {},
    artifacts: {
      firstBriefPath:
        stringAt(artifacts, "firstBriefPath") ?? stringAt(artifacts, "first_brief_path"),
      handoffPath: stringAt(artifacts, "handoffPath") ?? stringAt(artifacts, "handoff_path"),
      activationManifestPath:
        stringAt(artifacts, "activationManifestPath") ??
        stringAt(artifacts, "activation_manifest_path"),
    },
    lanes: normalizeLanes(objectAt(raw, "lanes") ?? {}),
    nextActions: normalizeNextActions(arrayAt(raw, "nextActions").length ? arrayAt(raw, "nextActions") : arrayAt(raw, "next_actions")),
    errors: normalizeErrors(arrayAt(raw, "errors")),
    query: stringAt(brief, "query") ?? FIRST_WORK_BRIEF_QUERY,
    indexedFiles: files.map(filePathFromEntry).filter(Boolean),
    estimatedTokens:
      numberAt(raw, "estimatedTokens") ??
      numberAt(raw, "estimated_tokens") ??
      numberAt(brief, "total_tokens") ??
      0,
    sections: normalizeSections(arrayAt(brief, "sections").length ? arrayAt(brief, "sections") : arrayAt(brief, "sources")),
    suggestions:
      stringArrayAt(brief, "suggestions") ??
      normalizeNextActions(arrayAt(raw, "nextActions").length ? arrayAt(raw, "nextActions") : arrayAt(raw, "next_actions")).map((action) => action.label),
    raw,
  };
}

function normalizeLanes(
  lanes: Record<string, unknown>
): Record<string, { status?: string; message?: string; error?: string }> {
  const normalized: Record<string, { status?: string; message?: string; error?: string }> = {};
  for (const [key, value] of Object.entries(lanes)) {
    const lane = asObject(value);
    normalized[key] = {
      status: stringAt(lane, "status"),
      message: stringAt(lane, "message"),
      error: stringAt(lane, "error"),
    };
  }
  return normalized;
}

function normalizeNextActions(actions: unknown[]): ActivationNextAction[] {
  return actions.map((entry) => {
    if (typeof entry === "string") {
      return { label: entry };
    }
    const action = asObject(entry);
    return {
      id: stringAt(action, "id"),
      label: stringAt(action, "label") ?? stringAt(action, "title") ?? "Next action",
      command: stringAt(action, "command"),
      description: stringAt(action, "description"),
    };
  });
}

function normalizeErrors(errors: unknown[]): ActivationUserError[] {
  return errors.map((entry) => normalizeActivationError(asObject(entry))).filter(Boolean);
}

function normalizeActivationError(
  raw: Record<string, unknown> | null,
  fallback?: string
): ActivationUserError {
  const error = objectAt(raw, "error") ?? raw ?? {};
  return {
    code: stringAt(error, "code"),
    message:
      stringAt(error, "message") ??
      stringAt(error, "error") ??
      fallback ??
      "Workspace activation failed.",
    userAction:
      stringAt(error, "userAction") ??
      stringAt(error, "user_action") ??
      stringAt(error, "actionRequired") ??
      stringAt(error, "action_required"),
  };
}

function normalizeSections(entries: unknown[]): ContextSection[] {
  return entries.map((entry) => {
    const section = asObject(entry);
    const lines = arrayAt(section, "lines");
    const start =
      numberAt(section, "start_line") ?? numberAt(section, "startLine") ?? numberAt(section, "line") ?? 1;
    const end = numberAt(section, "end_line") ?? numberAt(section, "endLine") ?? start;
    return {
      title: stringAt(section, "title") ?? stringAt(section, "heading") ?? "Workspace source",
      content: stringAt(section, "content") ?? stringAt(section, "summary") ?? "",
      file:
        stringAt(section, "file") ??
        stringAt(section, "path") ??
        stringAt(section, "document_path") ??
        "workspace",
      lines:
        lines.length >= 2 && typeof lines[0] === "number" && typeof lines[1] === "number"
          ? [lines[0], lines[1]]
          : [start, end],
      relevance_score: numberAt(section, "relevance_score") ?? numberAt(section, "score") ?? 0,
      token_count: numberAt(section, "token_count") ?? numberAt(section, "tokens") ?? 0,
      truncated: Boolean(section.truncated),
    };
  });
}

function buildCopilotHandoff(manifest: EditorActivationManifest): string {
  const files = manifest.indexedFiles.slice(0, 12).map((file) => `- ${file}`).join("\n");
  const sources = manifest.sections
    .slice(0, 5)
    .map((section) => `- ${section.file}:${section.lines[0]}-${section.lines[1]} - ${section.title}`)
    .join("\n");
  const handoffPath = manifest.artifacts.handoffPath
    ? `\nHandoff artifact: ${manifest.artifacts.handoffPath}`
    : "";

  return [
    "Use Snipara project context before making changes.",
    "",
    `First Work Brief query: ${manifest.query}`,
    handoffPath,
    "",
    "Activation artifacts:",
    manifest.artifacts.firstBriefPath ? `- First brief: ${manifest.artifacts.firstBriefPath}` : "- First brief: not reported",
    manifest.artifacts.handoffPath ? `- Handoff: ${manifest.artifacts.handoffPath}` : "- Handoff: not reported",
    "",
    "Indexed starter files:",
    files || "- No indexed file list available",
    "",
    "Source-backed starting points:",
    sources || "- No source hits returned yet",
    "",
    "Before editing, inspect the cited files, identify the smallest safe change, and run the project's validation commands.",
  ].join("\n");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const lastJsonLine = trimmed
      .split(/\r?\n/)
      .reverse()
      .find((line) => line.trim().startsWith("{") && line.trim().endsWith("}"));
    if (!lastJsonLine) {
      return null;
    }
    try {
      return JSON.parse(lastJsonLine) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function filePathFromEntry(entry: unknown): string {
  if (typeof entry === "string") {
    return entry;
  }
  const object = asObject(entry);
  return (
    stringAt(object, "path") ??
    stringAt(object, "file") ??
    stringAt(object, "document_path") ??
    ""
  );
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function objectAt(value: unknown, key: string): Record<string, unknown> | null {
  const object = asObject(value);
  if (key.includes(".")) {
    return key.split(".").reduce<unknown>((current, part) => asObject(current)[part], object) as
      | Record<string, unknown>
      | null;
  }
  const child = object[key];
  return child && typeof child === "object" && !Array.isArray(child)
    ? (child as Record<string, unknown>)
    : null;
}

function arrayAt(value: unknown, key: string): unknown[] {
  const object = asObject(value);
  const child = object[key];
  return Array.isArray(child) ? child : [];
}

function stringAt(value: unknown, key: string): string | undefined {
  const object = asObject(value);
  const child = key.includes(".")
    ? key.split(".").reduce<unknown>((current, part) => asObject(current)[part], object)
    : object[key];
  return typeof child === "string" ? child : undefined;
}

function numberAt(value: unknown, key: string): number | undefined {
  const object = asObject(value);
  const child = object[key];
  return typeof child === "number" ? child : undefined;
}

function stringArrayAt(value: unknown, key: string): string[] | undefined {
  const array = arrayAt(value, key).filter((entry): entry is string => typeof entry === "string");
  return array.length ? array : undefined;
}
