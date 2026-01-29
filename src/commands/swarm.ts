import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { SwarmRole, ResourceType } from "../types";
import { requireConfigured } from "./helpers";

const ROLE_OPTIONS: { label: string; value: SwarmRole }[] = [
  { label: "Worker", value: "worker" },
  { label: "Coordinator", value: "coordinator" },
  { label: "Observer", value: "observer" },
];

const RESOURCE_TYPE_OPTIONS: { label: string; value: ResourceType }[] = [
  { label: "File", value: "file" },
  { label: "Function", value: "function" },
  { label: "Module", value: "module" },
  { label: "Component", value: "component" },
  { label: "Other", value: "other" },
];

export function registerSwarmCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Swarm Create ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.swarmCreate", async () => {
      if (!(await requireConfigured(client))) return;

      const name = await vscode.window.showInputBox({
        prompt: "Enter swarm name",
        placeHolder: "feature-auth-team",
      });
      if (!name) return;

      const description = await vscode.window.showInputBox({
        prompt: "Enter swarm description (optional)",
        placeHolder: "Team working on authentication feature",
      });

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Creating swarm...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.swarmCreate(name, {
              description: description || undefined,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Swarm created: ${response.result.message} (ID: ${response.result.swarm_id})`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to create swarm: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Swarm Join ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.swarmJoin", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID to join",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const rolePick = await vscode.window.showQuickPick(ROLE_OPTIONS, {
        placeHolder: "Select your role",
      });
      if (!rolePick) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Joining swarm...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.swarmJoin(swarmId, agentId, {
              role: rolePick.value,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Joined swarm: ${response.result.message}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to join swarm: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Claim Resource ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.claim", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const resourceTypePick = await vscode.window.showQuickPick(RESOURCE_TYPE_OPTIONS, {
        placeHolder: "Select resource type",
      });
      if (!resourceTypePick) return;

      const resourceId = await vscode.window.showInputBox({
        prompt: "Enter resource ID (e.g., file path)",
        placeHolder: "src/auth/login.ts",
      });
      if (!resourceId) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Claiming resource...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.claim(
              swarmId,
              agentId,
              resourceTypePick.value,
              resourceId
            );

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Resource claimed: ${response.result.message} (Claim ID: ${response.result.claim_id})`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to claim resource: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Release Resource ─────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.release", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const claimId = await vscode.window.showInputBox({
        prompt: "Enter claim ID to release",
        placeHolder: "claim_...",
      });
      if (!claimId) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Releasing resource...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.release(swarmId, agentId, {
              claimId,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Resource released: ${response.result.message}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to release resource: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Task Create ──────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.taskCreate", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const title = await vscode.window.showInputBox({
        prompt: "Enter task title",
        placeHolder: "Implement login endpoint",
      });
      if (!title) return;

      const description = await vscode.window.showInputBox({
        prompt: "Enter task description (optional)",
        placeHolder: "Create POST /api/auth/login with JWT response",
      });

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Creating task...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.taskCreate(swarmId, agentId, title, {
              description: description || undefined,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Task created: ${response.result.message} (ID: ${response.result.task_id})`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to create task: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Task Claim ───────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.taskClaim", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Claiming task...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.taskClaim(swarmId, agentId);

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Task claimed: ${response.result.title} (ID: ${response.result.task_id})`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to claim task: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Task Complete ────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.taskComplete", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const taskId = await vscode.window.showInputBox({
        prompt: "Enter task ID to complete",
        placeHolder: "task_...",
      });
      if (!taskId) return;

      const successPick = await vscode.window.showQuickPick(
        [
          { label: "Success", description: "Task completed successfully", value: true },
          { label: "Failed", description: "Task failed", value: false },
        ],
        { placeHolder: "Did the task succeed?" }
      );
      if (!successPick) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Completing task...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.taskComplete(swarmId, agentId, taskId, {
              success: successPick.value,
            });

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Task completed: ${response.result.message}`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to complete task: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── Broadcast ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.broadcast", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const eventType = await vscode.window.showInputBox({
        prompt: "Enter event type",
        placeHolder: "task_completed",
      });
      if (!eventType) return;

      const payloadStr = await vscode.window.showInputBox({
        prompt: "Enter payload as JSON (optional)",
        placeHolder: '{"key": "value"}',
      });

      let payload: Record<string, unknown> | undefined;
      if (payloadStr) {
        try {
          payload = JSON.parse(payloadStr);
        } catch {
          vscode.window.showErrorMessage("Invalid JSON payload");
          return;
        }
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Broadcasting event...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.broadcast(swarmId, agentId, eventType, payload);

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `Event broadcast: ${response.result.message} (delivered to ${response.result.delivered_to} agents)`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to broadcast: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── State Get ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.stateGet", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const key = await vscode.window.showInputBox({
        prompt: "Enter state key",
        placeHolder: "current_phase",
      });
      if (!key) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Getting state...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.stateGet(swarmId, key);

            if (response.success && response.result) {
              const result = response.result;
              const content = [
                `# Swarm State`,
                ``,
                `**Key:** ${result.key}`,
                `**Version:** ${result.version}`,
                ``,
                `## Value`,
                ``,
                "```json",
                JSON.stringify(result.value, null, 2),
                "```",
              ].join("\n");

              const doc = await vscode.workspace.openTextDocument({
                content,
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Failed to get state: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );

  // ─── State Set ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.stateSet", async () => {
      if (!(await requireConfigured(client))) return;

      const swarmId = await vscode.window.showInputBox({
        prompt: "Enter swarm ID",
        placeHolder: "swarm_...",
      });
      if (!swarmId) return;

      const agentId = await vscode.window.showInputBox({
        prompt: "Enter your agent ID",
        placeHolder: "agent-vscode-1",
      });
      if (!agentId) return;

      const key = await vscode.window.showInputBox({
        prompt: "Enter state key",
        placeHolder: "current_phase",
      });
      if (!key) return;

      const valueStr = await vscode.window.showInputBox({
        prompt: "Enter value as JSON",
        placeHolder: '"implementation"',
      });
      if (!valueStr) return;

      let value: unknown;
      try {
        value = JSON.parse(valueStr);
      } catch {
        vscode.window.showErrorMessage("Invalid JSON value");
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Setting state...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.stateSet(swarmId, agentId, key, value);

            if (response.success && response.result) {
              vscode.window.showInformationMessage(
                `State set: ${response.result.message} (version ${response.result.version})`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to set state: ${response.error || "Unknown error"}`
              );
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Snipara error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
          }
        }
      );
    })
  );
}
