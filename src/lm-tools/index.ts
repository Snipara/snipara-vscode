import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import { ContextQueryTool } from "./context-query";
import { RememberTool } from "./remember";
import { RecallTool } from "./recall";
import { SharedContextTool } from "./shared-context";
import { SearchTool } from "./search";
import { AskQuickTool } from "./ask-quick";
import { MultiQueryTool } from "./multi-query";
import { PlanTool } from "./plan";
import { DecomposeTool } from "./decompose";
import { MultiProjectQueryTool } from "./multi-project-query";
import { MemoriesTool } from "./memories";
import { ForgetTool } from "./forget";
import { StatsTool } from "./stats";
import { UploadDocumentTool } from "./upload-document";
import { LoadDocumentTool } from "./load-document";
import { LoadProjectTool } from "./load-project";
import { OrchestrateTool } from "./orchestrate";
import { ReplContextTool } from "./repl-context";

export function registerLanguageModelTools(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // Guard: LM Tools API requires VS Code 1.93+
  if (!vscode.lm?.registerTool) {
    console.log("Snipara: Language Model Tools API not available in this VS Code version");
    return;
  }

  // Original 4 tools
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

  // 10 new tools
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_search", new SearchTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_askQuick", new AskQuickTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_multiQuery", new MultiQueryTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_plan", new PlanTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_decompose", new DecomposeTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_multiProjectQuery", new MultiProjectQueryTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_memories", new MemoriesTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_forget", new ForgetTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_stats", new StatsTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_uploadDocument", new UploadDocumentTool(client))
  );

  // 4 orchestration + REPL tools
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_loadDocument", new LoadDocumentTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_loadProject", new LoadProjectTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_orchestrate", new OrchestrateTool(client))
  );
  context.subscriptions.push(
    vscode.lm.registerTool("snipara_replContext", new ReplContextTool(client))
  );

  console.log("Snipara: 18 Language Model Tools registered");
}
