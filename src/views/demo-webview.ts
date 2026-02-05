import * as vscode from "vscode";
import type { ContextSection } from "../types";
import type { DemoStats } from "../demo";

/**
 * Opens a rich webview panel in the editor area showing demo query results.
 * Displays the query, cost comparison, result sections with full content,
 * clickable suggestions, and a sign-in CTA.
 */
export function showDemoWebview(
  extensionUri: vscode.Uri,
  query: string,
  sections: ContextSection[],
  suggestions: string[],
  demoStats?: DemoStats
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "snipara.demoResults",
    "Snipara Demo Results",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: false }
  );

  panel.webview.html = getDemoHtml(query, sections, suggestions, demoStats);

  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "runSuggestion":
        vscode.commands.executeCommand("snipara.askQuestion", message.text);
        break;
      case "signIn":
        vscode.commands.executeCommand("snipara.configure");
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
    .replace(/"/g, "&quot;");
}

function markdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\n\n/g, "</p><p>");
}

function getDemoHtml(
  query: string,
  sections: ContextSection[],
  suggestions: string[],
  demoStats?: DemoStats
): string {
  const statsHtml = demoStats
    ? `<div class="stats-banner">
        <div class="stats-title">Token Reduction</div>
        <div class="stats-grid">
          <div class="stat-card stat-before">
            <div class="stat-label">Without Snipara</div>
            <div class="stat-value">${formatTokensHtml(demoStats.totalProjectTokens)} tokens</div>
            <div class="stat-sub">~${demoStats.estimatedCostWithout}/query</div>
          </div>
          <div class="stat-card stat-arrow">
            <div class="arrow">\u2192</div>
          </div>
          <div class="stat-card stat-after">
            <div class="stat-label">With Snipara</div>
            <div class="stat-value">${formatTokensHtml(demoStats.returnedTokens)} tokens</div>
            <div class="stat-sub">~${demoStats.estimatedCostWith}/query</div>
          </div>
        </div>
        <div class="stats-summary">${demoStats.reductionPercent}% reduction in ${demoStats.latencyMs}ms</div>
      </div>`
    : "";

  const sectionsHtml = sections
    .map(
      (s, i) => `
      <div class="result-card" onclick="showSection(${i})">
        <div class="result-header">
          <span class="result-title">${escapeHtml(s.title)}</span>
          <span class="relevance-badge">${(s.relevance_score * 100).toFixed(0)}%</span>
        </div>
        <div class="result-meta">
          <span class="file-path">${escapeHtml(s.file)}:${s.lines[0]}-${s.lines[1]}</span>
          <span class="token-count">${s.token_count} tokens</span>
        </div>
        <div class="result-content"><p>${markdownToHtml(escapeHtml(s.content))}</p></div>
      </div>`
    )
    .join("\n");

  const suggestionsHtml =
    suggestions.length > 0
      ? `<div class="suggestions">
          <div class="suggestions-title">Follow-up questions</div>
          <div class="suggestion-chips">
            ${suggestions.map((s) => `<button class="suggestion-chip" onclick="runSuggestion('${escapeHtml(s)}')">${escapeHtml(s)}</button>`).join("\n")}
          </div>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    padding: 0 24px 24px;
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    line-height: 1.5;
    max-width: 800px;
    margin: 0 auto;
  }

  .demo-badge {
    display: inline-block;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .query-section {
    margin: 20px 0 16px;
  }
  .query-label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .query-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .stats-banner {
    background: var(--vscode-textBlockQuote-background, var(--vscode-sideBar-background));
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 20px;
  }
  .stats-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .stats-grid {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .stat-card {
    flex: 1;
    text-align: center;
  }
  .stat-arrow {
    flex: 0;
    font-size: 24px;
    color: var(--vscode-descriptionForeground);
  }
  .stat-label {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 4px;
  }
  .stat-value {
    font-size: 20px;
    font-weight: 700;
  }
  .stat-before .stat-value { color: var(--vscode-errorForeground, #f44); }
  .stat-after .stat-value { color: var(--vscode-testing-iconPassed, #4a4); }
  .stat-sub {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    margin-top: 2px;
  }
  .stats-summary {
    text-align: center;
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
    margin-top: 12px;
    font-weight: 500;
  }

  .results-heading {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .result-card {
    background: var(--vscode-textBlockQuote-background, var(--vscode-sideBar-background));
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .result-card:hover {
    border-color: var(--vscode-focusBorder);
  }
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .result-title {
    font-size: 14px;
    font-weight: 600;
  }
  .relevance-badge {
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    padding: 1px 7px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }
  .result-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 10px;
  }
  .file-path { font-family: var(--vscode-editor-font-family); }
  .result-content {
    font-size: 13px;
    color: var(--vscode-foreground);
    line-height: 1.6;
    border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    padding-top: 10px;
  }
  .result-content p { margin: 0 0 8px; }
  .result-content li { margin: 2px 0 2px 16px; }
  .result-content code {
    background: var(--vscode-textCodeBlock-background);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
  }

  .suggestions {
    margin: 20px 0;
  }
  .suggestions-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }
  .suggestion-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .suggestion-chip {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
    border-radius: 16px;
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;
    font-family: var(--vscode-font-family);
  }
  .suggestion-chip:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .cta-section {
    text-align: center;
    margin-top: 24px;
    padding: 16px;
    border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
  }
  .cta-text {
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 10px;
  }
  .cta-button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 8px 20px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--vscode-font-family);
  }
  .cta-button:hover {
    background: var(--vscode-button-hoverBackground);
  }
</style>
</head>
<body>
  <div class="query-section">
    <span class="demo-badge">Demo</span>
    <div class="query-label">Query</div>
    <div class="query-text">${escapeHtml(query)}</div>
  </div>

  ${statsHtml}

  <div class="results-heading">Results (${sections.length} sections, ${sections.reduce((t, s) => t + s.token_count, 0)} tokens)</div>
  ${sectionsHtml}

  ${suggestionsHtml}

  <div class="cta-section">
    <div class="cta-text">Try it on your own docs \u2014 30-day free Pro account, no credit card.</div>
    <button class="cta-button" onclick="signIn()">Sign in with GitHub</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function runSuggestion(text) { vscode.postMessage({ command: 'runSuggestion', text }); }
    function signIn() { vscode.postMessage({ command: 'signIn' }); }
    function showSection(index) { vscode.postMessage({ command: 'showSection', index }); }
  </script>
</body>
</html>`;
}

function formatTokensHtml(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}
