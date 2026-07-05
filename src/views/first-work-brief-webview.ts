import * as vscode from "vscode";
import type { ContextSection } from "../types";
import type { WorkspaceActivationCorpus } from "../workspace-scanner";

export function showFirstWorkBriefWebview(
  query: string,
  corpus: WorkspaceActivationCorpus,
  sections: ContextSection[],
  suggestions: string[]
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "snipara.firstWorkBrief",
    "Snipara First Work Brief",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );

  panel.webview.html = getHtml(query, corpus, sections, suggestions);

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "ask":
        vscode.commands.executeCommand("snipara.askQuestion", message.text);
        break;
      case "openTools":
        vscode.commands.executeCommand("workbench.view.extension.snipara");
        break;
      case "copyCopilotHandoff":
        vscode.env.clipboard.writeText(buildCopilotHandoff(query, corpus, sections));
        vscode.window.showInformationMessage("Snipara Copilot handoff copied.");
        break;
      case "openCopilot":
        vscode.commands.executeCommand("workbench.action.chat.open");
        break;
      case "showSection": {
        const section = sections[message.index];
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

function buildCopilotHandoff(
  query: string,
  corpus: WorkspaceActivationCorpus,
  sections: ContextSection[]
): string {
  const files = corpus.documents
    .slice(0, 12)
    .map((doc) => `- ${doc.path}`)
    .join("\n");
  const sources = sections
    .slice(0, 5)
    .map((section) => `- ${section.file}:${section.lines[0]}-${section.lines[1]} - ${section.title}`)
    .join("\n");

  return [
    "Use Snipara project context before making changes.",
    "",
    `First Work Brief query: ${query}`,
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

function getHtml(
  query: string,
  corpus: WorkspaceActivationCorpus,
  sections: ContextSection[],
  suggestions: string[]
): string {
  const sourceCards = sections
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

  const indexedFiles = corpus.documents
    .slice(0, 12)
    .map((doc) => `<li>${escapeHtml(doc.path)}</li>`)
    .join("");

  const suggestionButtons = suggestions
    .slice(0, 4)
    .map(
      (suggestion) =>
        `<button class="chip" onclick="ask(${escapeJs(suggestion)})">${escapeHtml(suggestion)}</button>`
    )
    .join("");

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
  }
</style>
</head>
<body>
  <div class="eyebrow">Workspace activated</div>
  <h1>First Work Brief</h1>
  <p class="lede">Snipara indexed a bounded source pack from this workspace and retrieved the first agent-ready context from your own project.</p>

  <div class="metrics">
    <div class="metric"><span class="metric-value">${corpus.documents.length}</span><span class="metric-label">files indexed</span></div>
    <div class="metric"><span class="metric-value">~${corpus.estimatedTokens.toLocaleString()}</span><span class="metric-label">source tokens scanned</span></div>
    <div class="metric"><span class="metric-value">${sections.length}</span><span class="metric-label">source hits</span></div>
  </div>

  <div class="section-title">Indexed starter files</div>
  <ul class="files">${indexedFiles}</ul>

  <div class="section-title">Brief query</div>
  <p>${escapeHtml(query)}</p>

  <div class="section-title">Source-backed starting points</div>
  ${sourceCards || "<p>No source sections came back yet. Try asking a narrower project question after indexing finishes.</p>"}

  <div class="section-title">Next questions</div>
  <div class="actions">
    ${suggestionButtons || ""}
    <button class="chip" onclick="ask('What commands should an agent run before changing this project?')">Agent start commands</button>
    <button class="chip" onclick="ask('What project guardrails should I follow?')">Project guardrails</button>
    <button class="primary" onclick="copyCopilotHandoff()">Copy Copilot handoff</button>
    <button class="secondary" onclick="openCopilot()">Open Copilot Chat</button>
    <button class="primary" onclick="openTools()">Open Snipara tools</button>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  function ask(text) { vscode.postMessage({ command: "ask", text }); }
  function openTools() { vscode.postMessage({ command: "openTools" }); }
  function copyCopilotHandoff() { vscode.postMessage({ command: "copyCopilotHandoff" }); }
  function openCopilot() { vscode.postMessage({ command: "openCopilot" }); }
  function showSection(index) { vscode.postMessage({ command: "showSection", index }); }
</script>
</body>
</html>`;
}
