import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { SharedCategory } from "../types";
import { requireConfigured } from "./helpers";

const CATEGORY_OPTIONS: { label: string; value: SharedCategory }[] = [
  { label: "MANDATORY", value: "MANDATORY" },
  { label: "BEST_PRACTICES", value: "BEST_PRACTICES" },
  { label: "GUIDELINES", value: "GUIDELINES" },
  { label: "REFERENCE", value: "REFERENCE" },
];

export function registerSharedCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // ─── Shared Context ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.sharedContext", async () => {
      if (!(await requireConfigured(client))) return;

      const categoryPicks = await vscode.window.showQuickPick(CATEGORY_OPTIONS, {
        placeHolder: "Select categories to include (leave empty for all)",
        canPickMany: true,
      });

      const categories = categoryPicks && categoryPicks.length > 0
        ? categoryPicks.map((p) => p.value)
        : undefined;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading shared context...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.sharedContext({ categories });

            if (response.success && response.result) {
              const result = response.result;
              const lines: string[] = [
                `# Shared Context`,
                ``,
                `**Total Tokens:** ${result.total_tokens}`,
                ``,
                `## Budget Allocation`,
                ``,
              ];

              for (const [cat, tokens] of Object.entries(result.budget_allocation)) {
                lines.push(`- **${cat}:** ${tokens} tokens`);
              }
              lines.push(``);

              for (const doc of result.documents) {
                lines.push(`## [${doc.category}] ${doc.title}`);
                lines.push(`*Collection: ${doc.collection_name} | Priority: ${doc.priority}*`);
                lines.push(``);
                lines.push(doc.content);
                lines.push(``);
                lines.push(`---`);
                lines.push(``);
              }

              const docView = await vscode.workspace.openTextDocument({
                content: lines.join("\n"),
                language: "markdown",
              });
              await vscode.window.showTextDocument(docView, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Failed to load shared context: ${response.error || "Unknown error"}`
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

  // ─── List Templates ───────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.listTemplates", async () => {
      if (!(await requireConfigured(client))) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading templates...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.listTemplates();

            if (response.success && response.result) {
              const templates = response.result;

              if (templates.length === 0) {
                vscode.window.showInformationMessage("No templates found.");
                return;
              }

              const pick = await vscode.window.showQuickPick(
                templates.map((t) => ({
                  label: t.title,
                  description: t.category || "",
                  detail: t.description || "",
                  templateId: t.template_id,
                })),
                { placeHolder: "Select a template to view" }
              );

              if (!pick) return;

              const templateResponse = await client.getTemplate({
                templateId: pick.templateId,
              });

              if (templateResponse.success && templateResponse.result) {
                const tmpl = templateResponse.result;
                const doc = await vscode.workspace.openTextDocument({
                  content: tmpl.content,
                  language: "markdown",
                });
                await vscode.window.showTextDocument(doc, { preview: true });
              } else {
                vscode.window.showErrorMessage(
                  `Failed to load template: ${templateResponse.error || "Unknown error"}`
                );
              }
            } else {
              vscode.window.showErrorMessage(
                `Failed to list templates: ${response.error || "Unknown error"}`
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

  // ─── Get Template ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.getTemplate", async () => {
      if (!(await requireConfigured(client))) return;

      const slug = await vscode.window.showInputBox({
        prompt: "Enter template slug",
        placeHolder: "pull-request-review",
      });
      if (!slug) return;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Loading template...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.getTemplate({ slug });

            if (response.success && response.result) {
              const doc = await vscode.workspace.openTextDocument({
                content: response.result.content,
                language: "markdown",
              });
              await vscode.window.showTextDocument(doc, { preview: true });
            } else {
              vscode.window.showErrorMessage(
                `Failed to load template: ${response.error || "Unknown error"}`
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
