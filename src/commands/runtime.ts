import * as vscode from "vscode";
import type { RuntimeBridge } from "../runtime";

export function registerRuntimeCommands(
  context: vscode.ExtensionContext,
  runtime: RuntimeBridge
): void {
  // ─── Execute in Docker (Isolated) ───────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.runtimeExecuteDocker", async () => {
      if (!requireRuntime(runtime)) return;
      if (!requireDocker(runtime)) return;

      const task = await vscode.window.showInputBox({
        prompt: "Enter task to execute in Docker-isolated environment",
        placeHolder: "Run pytest for the authentication module",
      });
      if (!task) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara Runtime: Executing in Docker...",
          cancellable: false,
        },
        async () => {
          const result = await runtime.runCommand(task, { docker: true });
          if (result.exitCode === 0) {
            vscode.window.showInformationMessage(
              `Runtime execution completed (${(result.durationMs / 1000).toFixed(1)}s)`
            );
          } else {
            vscode.window.showWarningMessage(
              `Runtime execution finished with exit code ${result.exitCode}`
            );
          }
        }
      );
    })
  );

  // ─── Execute Locally ────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.runtimeExecuteLocal", async () => {
      if (!requireRuntime(runtime)) return;

      const task = await vscode.window.showInputBox({
        prompt: "Enter task to execute locally (no isolation)",
        placeHolder: "Parse logs and extract error messages",
      });
      if (!task) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara Runtime: Executing locally...",
          cancellable: false,
        },
        async () => {
          const result = await runtime.runCommand(task, { docker: false });
          if (result.exitCode === 0) {
            vscode.window.showInformationMessage(
              `Runtime execution completed (${(result.durationMs / 1000).toFixed(1)}s)`
            );
          } else {
            vscode.window.showWarningMessage(
              `Runtime execution finished with exit code ${result.exitCode}`
            );
          }
        }
      );
    })
  );

  // ─── View Execution Logs ────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.runtimeLogs", async () => {
      if (!requireRuntime(runtime)) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara Runtime: Loading logs...",
          cancellable: false,
        },
        async () => {
          const result = await runtime.viewLogs(20);

          if (result.exitCode === 0 && result.stdout) {
            const doc = await vscode.workspace.openTextDocument({
              content: result.stdout,
              language: "log",
            });
            await vscode.window.showTextDocument(doc, { preview: true });
          } else {
            vscode.window.showErrorMessage(
              `Failed to load logs: ${result.stderr || "No output"}`
            );
          }
        }
      );
    })
  );

  // ─── Launch Trajectory Visualizer ───────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.runtimeVisualize", () => {
      if (!requireRuntime(runtime)) return;

      runtime.launchVisualizer();
      vscode.window.showInformationMessage(
        "Snipara Runtime: Visualizer launching at http://localhost:8501"
      );
    })
  );
}

// ─── Guards ───────────────────────────────────────────────────────────

function requireRuntime(runtime: RuntimeBridge): boolean {
  const status = runtime.getStatus();
  if (!status.rlmInstalled) {
    vscode.window
      .showErrorMessage(
        "RLM Runtime is not installed. Install it to use runtime features.",
        "Install"
      )
      .then((action) => {
        if (action === "Install") {
          const terminal = vscode.window.createTerminal("Snipara Runtime Setup");
          terminal.sendText("pip install rlm-runtime[all]");
          terminal.show();
        }
      });
    return false;
  }
  return true;
}

function requireDocker(runtime: RuntimeBridge): boolean {
  const status = runtime.getStatus();
  if (!status.dockerInstalled) {
    vscode.window.showErrorMessage(
      "Docker is not installed. Docker is required for isolated execution."
    );
    return false;
  }
  if (!status.dockerRunning) {
    vscode.window.showErrorMessage(
      "Docker is not running. Please start Docker to use isolated execution."
    );
    return false;
  }
  return true;
}
