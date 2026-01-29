import * as vscode from "vscode";
import type { SniparaClient } from "../client";

export class SwarmDashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "snipara.swarmView";
  private _view?: vscode.WebviewView;

  constructor(private client: SniparaClient) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "createSwarm": {
          try {
            const response = await this.client.swarmCreate(message.name, {
              description: message.description,
            });
            if (response.success) {
              this.postMessage({ type: "swarmCreated", data: response.result });
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to create swarm: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
          break;
        }
        case "refresh":
          this.refresh();
          break;
      }
    });
  }

  refresh(): void {
    if (this._view) {
      this._view.webview.html = this.getHtml();
    }
  }

  private postMessage(message: unknown): void {
    this._view?.webview.postMessage(message);
  }

  private getHtml(): string {
    const configured = this.client.isConfigured();
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      padding: 10px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }
    h3 { margin: 0 0 8px 0; font-size: 13px; font-weight: 600; }
    .section { margin-bottom: 16px; }
    .empty {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      font-style: italic;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 12px;
      border-radius: 2px;
    }
    button:hover { background: var(--vscode-button-hoverBackground); }
    .info-row {
      font-size: 12px;
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
    }
    .badge {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  ${
    configured
      ? `
  <div class="section">
    <h3>Swarm Dashboard</h3>
    <p class="empty">Use Snipara commands to create and manage swarms.</p>
    <div style="margin-top: 8px;">
      <button onclick="vscode.postMessage({command:'refresh'})">Refresh</button>
    </div>
  </div>
  <div class="section">
    <h3>Quick Actions</h3>
    <div class="info-row">
      <span>Create Swarm</span>
      <button onclick="vscode.postMessage({command:'createSwarm', name: 'new-swarm'})">Create</button>
    </div>
  </div>
  <script>const vscode = acquireVsCodeApi();</script>
  `
      : `
  <div class="section">
    <h3>Swarm Dashboard</h3>
    <p class="empty">Configure Snipara to use swarm features.</p>
    <button onclick="vscode.postMessage({command:'configure'})">Configure</button>
  </div>
  <script>const vscode = acquireVsCodeApi();</script>
  `
  }
</body>
</html>`;
  }
}
