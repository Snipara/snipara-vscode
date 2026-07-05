import * as vscode from "vscode";
import type { EditorActivationManifest } from "../commands/activation";

export function showFirstWorkBriefWebview(
  manifest: EditorActivationManifest
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "snipara.firstWorkBrief",
    "Snipara First Work Brief",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );

  panel.webview.html = getHtml(manifest);

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "ask":
        vscode.commands.executeCommand("snipara.askQuestion", message.text);
        break;
      case "openTools":
        vscode.commands.executeCommand("workbench.view.extension.snipara");
        break;
      case "copyCopilotHandoff":
        vscode.env.clipboard.writeText(buildCopilotHandoff(manifest));
        vscode.window.showInformationMessage("Snipara Copilot handoff copied.");
        break;
      case "openCopilot":
        vscode.commands.executeCommand("workbench.action.chat.open");
        break;
      case "openArtifact":
        openWorkspaceFile(message.path);
        break;
      case "showSection": {
        const section = manifest.sections[message.index];
        if (section) {
          vscode.commands.executeCommand("snipara.showSection", section);
        }
        break;
      }
    }
  });

  return panel;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJs(text: string): string {
  return JSON.stringify(text);
}

function buildCopilotHandoff(manifest: EditorActivationManifest): string {
  const files = manifest.indexedFiles
    .slice(0, 12)
    .map((file) => `- ${file}`)
    .join("\n");
  const sources = manifest.sections
    .slice(0, 5)
    .map((section) => `- ${section.file}:${section.lines[0]}-${section.lines[1]} - ${section.title}`)
    .join("\n");
  const nextActions = manifest.nextActions
    .slice(0, 5)
    .map((action) => `- ${action.label}${action.description ? `: ${action.description}` : ""}`)
    .join("\n");

  return [
    "Use Snipara project context before making changes.",
    "",
    `First Work Brief query: ${manifest.query}`,
    manifest.artifacts.firstBriefPath ? `First brief artifact: ${manifest.artifacts.firstBriefPath}` : "",
    manifest.artifacts.handoffPath ? `Handoff artifact: ${manifest.artifacts.handoffPath}` : "",
    "",
    "Indexed starter files:",
    files || "- No indexed file list available",
    "",
    "Source-backed starting points:",
    sources || "- No source hits returned yet",
    "",
    "Next actions:",
    nextActions || "- Ask Snipara what to inspect before editing",
    "",
    "Before editing, inspect the cited files, identify the smallest safe change, and run the project's validation commands.",
  ].filter(Boolean).join("\n");
}

async function openWorkspaceFile(filePath: string | undefined): Promise<void> {
  if (!filePath) {
    return;
  }
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
  const uri = workspaceRoot && !filePath.startsWith("/")
    ? vscode.Uri.joinPath(workspaceRoot, filePath)
    : vscode.Uri.file(filePath);
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    vscode.window.showWarningMessage(
      `Could not open Snipara artifact: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}

function getHtml(manifest: EditorActivationManifest): string {
  const sourceCards = manifest.sections
    .slice(0, 5)
    .map(
      (section, index) => `
        <button class="source-card" onclick="showSection(${index})">
          <span class="source-title">${escapeHtml(section.title)}</span>
          <span class="source-meta">${escapeHtml(section.file)}:${section.lines[0]}-${section.lines[1]}</span>
          <span class="source-content">${escapeHtml(section.content).slice(0, 520)}</span>
        </button>`
    )
    .join("");

  const indexedFiles = manifest.indexedFiles
    .slice(0, 12)
    .map((file) => `<li>${escapeHtml(file)}</li>`)
    .join("");

  const suggestionButtons = manifest.suggestions
    .slice(0, 4)
    .map(
      (suggestion) =>
        `<button class="chip" onclick="ask(${escapeJs(suggestion)})">${escapeHtml(suggestion)}</button>`
    )
    .join("");

  const laneRows = Object.entries(manifest.lanes)
    .map(([name, lane]) => {
      const status = lane.status ?? "unknown";
      return `<div class="lane"><span class="lane-name">${escapeHtml(name)}</span><span class="status status-${escapeHtml(status)}">${escapeHtml(status)}</span><span class="lane-message">${escapeHtml(lane.message ?? lane.error ?? "")}</span></div>`;
    })
    .join("");

  const nextActions = manifest.nextActions
    .slice(0, 6)
    .map((action) => `<li><strong>${escapeHtml(action.label)}</strong>${action.description ? ` ${escapeHtml(action.description)}` : ""}</li>`)
    .join("");

  const artifactButtons = [
    manifest.artifacts.firstBriefPath
      ? `<button class="secondary" onclick="openArtifact(${escapeJs(manifest.artifacts.firstBriefPath)})">Open first brief</button>`
      : "",
    manifest.artifacts.handoffPath
      ? `<button class="secondary" onclick="openArtifact(${escapeJs(manifest.artifacts.handoffPath)})">Open handoff</button>`
      : "",
  ].join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    margin: 0 auto;
    padding: 24px;
    max-width: 880px;
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    font-family: var(--vscode-font-family);
    line-height: 1.5;
  }
  .eyebrow {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 8px;
    font-size: 26px;
    font-weight: 700;
  }
  .lede {
    margin: 0 0 20px;
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 18px 0 22px;
  }
  .metric {
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 6px;
    padding: 12px;
    background: var(--vscode-sideBar-background);
  }
  .metric-value {
    display: block;
    font-size: 20px;
    font-weight: 700;
  }
  .metric-label {
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }
  .section-title {
    margin: 24px 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
  }
  .files {
    columns: 2;
    padding-left: 18px;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
  }
  .artifact-line,
  .lane {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) auto minmax(0, 2fr);
    gap: 10px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-panel-border);
    font-size: 13px;
  }
  .artifact-line {
    grid-template-columns: 140px minmax(0, 1fr);
  }
  .artifact-path,
  .lane-message {
    color: var(--vscode-descriptionForeground);
    overflow-wrap: anywhere;
  }
  .lane-name {
    font-weight: 700;
  }
  .status {
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--vscode-descriptionForeground);
  }
  .status-ready,
  .status-complete,
  .status-completed {
    color: var(--vscode-testing-iconPassed);
  }
  .status-failed,
  .status-error {
    color: var(--vscode-testing-iconFailed);
  }
  .status-indexing,
  .status-partial {
    color: var(--vscode-testing-iconQueued);
  }
  .source-card {
    display: block;
    width: 100%;
    margin: 0 0 10px;
    padding: 14px;
    text-align: left;
    color: var(--vscode-foreground);
    background: var(--vscode-textBlockQuote-background, var(--vscode-sideBar-background));
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 6px;
    cursor: pointer;
  }
  .source-card:hover {
    border-color: var(--vscode-focusBorder);
  }
  .source-title {
    display: block;
    font-weight: 700;
  }
  .source-meta {
    display: block;
    margin: 2px 0 8px;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
  }
  .source-content {
    display: block;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    white-space: pre-wrap;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 22px;
  }
  button.primary,
  button.secondary,
  .chip {
    border: 1px solid var(--vscode-button-border, transparent);
    border-radius: 4px;
    padding: 7px 10px;
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    cursor: pointer;
    font: inherit;
  }
  button.secondary {
    color: var(--vscode-button-secondaryForeground);
    background: var(--vscode-button-secondaryBackground);
  }
  .chip {
    color: var(--vscode-button-secondaryForeground);
    background: var(--vscode-button-secondaryBackground);
  }
  @media (max-width: 620px) {
    .metrics { grid-template-columns: 1fr; }
    .files { columns: 1; }
    .artifact-line,
    .lane { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <div class="eyebrow">Workspace activated</div>
  <h1>First Work Brief</h1>
  <p class="lede">Snipara ran the shared editor activation engine and loaded the machine-readable activation contract for this workspace.</p>

  <div class="metrics">
    <div class="metric"><span class="metric-value">${manifest.indexedFiles.length}</span><span class="metric-label">files indexed</span></div>
    <div class="metric"><span class="metric-value">${escapeHtml(manifest.schemaVersion)}</span><span class="metric-label">contract schema</span></div>
    <div class="metric"><span class="metric-value">${manifest.sections.length}</span><span class="metric-label">source hits</span></div>
  </div>

  <div class="section-title">Activation artifacts</div>
  <div class="artifact-line"><span>First brief</span><span class="artifact-path">${escapeHtml(manifest.artifacts.firstBriefPath ?? "Not reported")}</span></div>
  <div class="artifact-line"><span>Handoff</span><span class="artifact-path">${escapeHtml(manifest.artifacts.handoffPath ?? "Not reported")}</span></div>
  <div class="actions">${artifactButtons}</div>

  <div class="section-title">Activation lanes</div>
  ${laneRows || "<p>No lane statuses were reported by the activation contract.</p>"}

  <div class="section-title">Indexed starter files</div>
  <ul class="files">${indexedFiles || "<li>No indexed file list reported yet.</li>"}</ul>

  <div class="section-title">Brief query</div>
  <p>${escapeHtml(manifest.query)}</p>

  <div class="section-title">Source-backed starting points</div>
  ${sourceCards || "<p>No source sections came back yet. Try asking a narrower project question after indexing finishes.</p>"}

  <div class="section-title">Next actions</div>
  ${nextActions ? `<ul>${nextActions}</ul>` : "<p>No next actions were reported by the activation contract.</p>"}

  <div class="section-title">Ask next</div>
  <div class="actions">
    ${suggestionButtons || ""}
    <button class="chip" onclick="ask('What commands should an agent run before changing this project?')">Agent start commands</button>
    <button class="chip" onclick="ask('What project guardrails should I follow?')">Project guardrails</button>
    <button class="primary" onclick="copyCopilotHandoff()">Hand off to Copilot</button>
    <button class="primary" onclick="openTools()">Open Snipara tools</button>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  function ask(text) { vscode.postMessage({ command: "ask", text }); }
  function openTools() { vscode.postMessage({ command: "openTools" }); }
  function copyCopilotHandoff() { vscode.postMessage({ command: "copyCopilotHandoff" }); }
  function openCopilot() { vscode.postMessage({ command: "openCopilot" }); }
  function openArtifact(path) { vscode.postMessage({ command: "openArtifact", path }); }
  function showSection(index) { vscode.postMessage({ command: "showSection", index }); }
</script>
</body>
</html>`;
}
