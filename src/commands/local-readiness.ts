import * as vscode from "vscode";
import type { RuntimeBridge } from "../runtime";
import type { LocalReadinessProvider } from "../views/local-readiness-provider";

interface CommandPick extends vscode.QuickPickItem {
  command: string;
}

export function registerLocalReadinessCommands(
  context: vscode.ExtensionContext,
  provider: LocalReadinessProvider,
  runtime: RuntimeBridge
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.localReadiness.refresh", async () => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Snipara: checking local readiness",
          cancellable: false,
        },
        async () => provider.refresh()
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.localReadiness.openEnv", async () => {
      const folder = await selectWorkspaceFolder();
      if (!folder) {
        vscode.window.showWarningMessage("Open a workspace folder to manage .env.");
        return;
      }

      const envUri = await pickOrCreateEnvFile(folder);
      if (!envUri) return;

      const doc = await vscode.workspace.openTextDocument(envUri);
      await vscode.window.showTextDocument(doc, { preview: false });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snipara.localReadiness.useWorkflow",
      async () => {
        const report = await ensureReport(provider);
        if (!report?.sniparaAuth.configured) {
          const action = await vscode.window.showWarningMessage(
            "Snipara auth is not configured for workflow commands.",
            "Configure"
          );
          if (action === "Configure") {
            vscode.commands.executeCommand("snipara.configure");
          }
          return;
        }

        const pick = await vscode.window.showQuickPick<CommandPick>(
          [
            {
              label: "Load Project Context",
              description: "Package relevant workspace context",
              command: "snipara.loadProject",
            },
            {
              label: "Generate Plan",
              description: "Ask Snipara for an execution plan",
              command: "snipara.plan",
            },
            {
              label: "Orchestrate",
              description: "Run a multi-step hosted workflow",
              command: "snipara.orchestrate",
            },
            {
              label: "Build REPL Context",
              description: "Prepare structured context for runtime sessions",
              command: "snipara.replContext",
            },
          ],
          {
            placeHolder: "Choose a Snipara workflow",
          }
        );

        if (pick) {
          vscode.commands.executeCommand(pick.command);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.localReadiness.useRuntime", async () => {
      const report = await ensureReport(provider);
      if (!report?.runtime.sandboxInstalled) {
        const action = await vscode.window.showWarningMessage(
          "Snipara Sandbox is not installed.",
          "Install"
        );
        if (action === "Install") {
          const terminal = vscode.window.createTerminal("Snipara Sandbox Setup");
          terminal.sendText("pip install snipara-sandbox[all]");
          terminal.show();
        }
        return;
      }

      const picks: CommandPick[] = [
        {
          label: "Execute Locally",
          description: "Run a task with Snipara Sandbox on this machine",
          command: "snipara.runtimeExecuteLocal",
        },
        {
          label: "View Sandbox Logs",
          description: "Open recent Snipara Sandbox logs",
          command: "snipara.runtimeLogs",
        },
        {
          label: "Launch Visualizer",
          description: "Open the trajectory visualizer",
          command: "snipara.runtimeVisualize",
        },
      ];

      if (report.runtime.dockerRunning) {
        picks.unshift({
          label: "Execute in Docker",
          description: "Run a task in isolated Docker execution",
          command: "snipara.runtimeExecuteDocker",
        });
      }

      const pick = await vscode.window.showQuickPick(picks, {
        placeHolder: "Choose a runtime action",
      });

      if (pick) {
        vscode.commands.executeCommand(pick.command);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "snipara.localReadiness.runCompanionDoctor",
      async () => {
        let status = runtime.getStatus();
        if (!status.sandboxInstalled) {
          status = await runtime.detect();
        }

        if (!status.sandboxInstalled) {
          vscode.window.showWarningMessage(
            "Snipara Sandbox is not installed. The VS Code readiness checks do not require it."
          );
          await provider.refresh();
          return;
        }

        const folder = await selectWorkspaceFolder(false);
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Snipara: running sandbox doctor...",
            cancellable: false,
          },
          async () => {
            const result = await runtime.runSandboxDoctor(folder?.uri.fsPath);
            if (result.exitCode === 0) {
              vscode.window.showInformationMessage(
                `Sandbox doctor completed (${(result.durationMs / 1000).toFixed(1)}s).`
              );
            } else {
              vscode.window.showWarningMessage(
                `Sandbox doctor finished with exit code ${result.exitCode}.`
              );
            }
          }
        );

        await provider.refresh();
      }
    )
  );
}

async function ensureReport(
  provider: LocalReadinessProvider
): Promise<ReturnType<LocalReadinessProvider["getReport"]>> {
  if (!provider.getReport()) {
    await provider.refresh();
  }
  return provider.getReport();
}

async function selectWorkspaceFolder(
  promptWhenMultiple = true
): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 0) return undefined;
  if (folders.length === 1 || !promptWhenMultiple) return folders[0];

  const pick = await vscode.window.showQuickPick(
    folders.map((folder) => ({
      label: folder.name,
      description: folder.uri.fsPath,
      folder,
    })),
    { placeHolder: "Choose a workspace folder" }
  );

  return pick?.folder;
}

async function pickOrCreateEnvFile(
  folder: vscode.WorkspaceFolder
): Promise<vscode.Uri | undefined> {
  const candidates = [".env", ".env.local"];
  const existing: vscode.Uri[] = [];
  const defaultEnvUri = vscode.Uri.joinPath(folder.uri, ".env");

  for (const fileName of candidates) {
    const uri = vscode.Uri.joinPath(folder.uri, fileName);
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type === vscode.FileType.File) {
        existing.push(uri);
      }
    } catch {
      // Missing env files are handled by the create option.
    }
  }

  if (existing.length === 1) return existing[0];

  const choices = [
    ...existing.map((uri) => ({
      label: `Open ${uri.path.split("/").pop()}`,
      description: uri.fsPath,
      uri,
    })),
  ];
  if (!existing.some((uri) => uri.fsPath === defaultEnvUri.fsPath)) {
    choices.push({
      label: "Create .env",
      description: defaultEnvUri.fsPath,
      uri: defaultEnvUri,
    });
  }

  const pick = await vscode.window.showQuickPick(choices, {
    placeHolder: "Choose an env file",
  });
  if (!pick) return undefined;

  try {
    await vscode.workspace.fs.stat(pick.uri);
  } catch {
    await vscode.workspace.fs.writeFile(pick.uri, new Uint8Array());
  }

  return pick.uri;
}
