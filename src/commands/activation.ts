import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ResultsProvider } from "../views/results-provider";
import { autoRegister } from "../auth/auto-register";
import { collectWorkspaceActivationCorpus } from "../workspace-scanner";
import { showFirstWorkBriefWebview } from "../views/first-work-brief-webview";
import { trackEvent } from "../telemetry";

const FIRST_WORK_BRIEF_QUERY =
  "What does this project do, how should an AI coding agent start working on it, and what files matter first?";

export function registerActivationCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  resultsProvider: ResultsProvider
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("snipara.activateWorkspace", async () => {
      const corpus = await collectWorkspaceActivationCorpus();
      if (!corpus) {
        vscode.window.showWarningMessage(
          "Snipara did not find README, docs, or agent instruction files in this workspace."
        );
        return;
      }

      if (!client.isConfigured()) {
        const action = await vscode.window.showInformationMessage(
          `Snipara found ${corpus.documents.length} project files. Sign in to build your First Work Brief from this workspace.`,
          "Sign in and activate"
        );
        if (action !== "Sign in and activate") {
          return;
        }

        const result = await autoRegister(context);
        if (!result) {
          return;
        }

        client.updateConfig({
          apiKey: result.apiKey,
          projectId: result.projectSlug,
          serverUrl: result.serverUrl,
        });
        await vscode.commands.executeCommand("setContext", "snipara.isConfigured", true);
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Snipara: Activating this workspace...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: `Indexing ${corpus.documents.length} starter files` });
          const syncResponse = await client.syncDocuments(
            corpus.documents.map((doc) => ({ path: doc.path, content: doc.content }))
          );

          if (!syncResponse.success) {
            vscode.window.showErrorMessage(
              `Workspace activation failed during indexing: ${syncResponse.error || "Unknown error"}`
            );
            return;
          }

          progress.report({ message: "Building First Work Brief" });
          const queryResponse = await client.contextQuery(FIRST_WORK_BRIEF_QUERY, {
            maxTokens: 6000,
            searchMode: "hybrid",
            includeMetadata: true,
            preferSummaries: false,
          });

          if (!queryResponse.success || !queryResponse.result) {
            vscode.window.showErrorMessage(
              `Workspace activation indexed files, but the brief query failed: ${queryResponse.error || "Unknown error"}`
            );
            return;
          }

          const result = queryResponse.result;
          resultsProvider.setResults(
            FIRST_WORK_BRIEF_QUERY,
            result.sections,
            result.total_tokens,
            result.suggestions
          );
          showFirstWorkBriefWebview(
            FIRST_WORK_BRIEF_QUERY,
            corpus,
            result.sections,
            result.suggestions ?? []
          );
          await vscode.commands.executeCommand("snipara.resultsView.focus");
          trackEvent("workspace_activated", {
            fileCount: corpus.documents.length,
            skippedFiles: corpus.skippedFiles,
          });
          vscode.window.showInformationMessage(
            `Workspace activated: indexed ${corpus.documents.length} files and opened your First Work Brief.`
          );
        }
      );
    })
  );
}
