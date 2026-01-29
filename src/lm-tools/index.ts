import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import { ContextQueryTool } from "./context-query";
import { RememberTool } from "./remember";
import { RecallTool } from "./recall";
import { SharedContextTool } from "./shared-context";

export function registerLanguageModelTools(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // Guard: LM Tools API requires VS Code 1.93+
  if (!vscode.lm?.registerTool) {
    console.log("Snipara: Language Model Tools API not available in this VS Code version");
    return;
  }

  context.subscriptions.push(
    vscode.lm.registerTool("snipara_contextQuery", new ContextQueryTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_remember", new RememberTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_recall", new RecallTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_sharedContext", new SharedContextTool(client))
  );

  console.log("Snipara: 4 Language Model Tools registered");
}
