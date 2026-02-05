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

/**
 * Adds a default prepareInvocation method to a tool if it doesn't already have one.
 * Required by Copilot Agent mode for the confirmation dialog flow.
 */
function withPrepareInvocation<T>(
  tool: vscode.LanguageModelTool<T>,
  displayName: string
): vscode.LanguageModelTool<T> {
  if (!tool.prepareInvocation) {
    tool.prepareInvocation = () => ({
      invocationMessage: `Running ${displayName}...`,
    });
  }
  return tool;
}

/**
 * Helper to register a tool with prepareInvocation and error handling.
 */
function registerTool<T>(
  context: vscode.ExtensionContext,
  name: string,
  displayName: string,
  tool: vscode.LanguageModelTool<T>
): void {
  try {
    context.subscriptions.push(
      vscode.lm.registerTool(name, withPrepareInvocation(tool, displayName))
    );
  } catch (error) {
    console.error(`Snipara: Failed to register tool ${name}:`, error);
  }
}

export function registerLanguageModelTools(
  context: vscode.ExtensionContext,
  client: SniparaClient
): void {
  // Guard: LM Tools API requires VS Code 1.93+
  if (!vscode.lm?.registerTool) {
    console.warn("Snipara: vscode.lm.registerTool not available — Language Model Tools disabled");
    return;
  }

  console.log("Snipara: Registering Language Model Tools...");

  // Core query tools
  registerTool(context, "snipara_contextQuery", "Snipara Query", new ContextQueryTool(client));
  registerTool(context, "snipara_search", "Snipara Search", new SearchTool(client));
  registerTool(context, "snipara_askQuick", "Snipara Quick Ask", new AskQuickTool(client));
  registerTool(context, "snipara_multiQuery", "Snipara Multi-Query", new MultiQueryTool(client));
  registerTool(context, "snipara_plan", "Snipara Plan", new PlanTool(client));
  registerTool(context, "snipara_decompose", "Snipara Decompose", new DecomposeTool(client));
  registerTool(context, "snipara_multiProjectQuery", "Snipara Multi-Project Query", new MultiProjectQueryTool(client));

  // Memory tools
  registerTool(context, "snipara_remember", "Snipara Remember", new RememberTool(client));
  registerTool(context, "snipara_recall", "Snipara Recall", new RecallTool(client));
  registerTool(context, "snipara_memories", "Snipara Memories", new MemoriesTool(client));
  registerTool(context, "snipara_forget", "Snipara Forget", new ForgetTool(client));

  // Team & stats tools
  registerTool(context, "snipara_sharedContext", "Snipara Shared Context", new SharedContextTool(client));
  registerTool(context, "snipara_stats", "Snipara Stats", new StatsTool(client));
  registerTool(context, "snipara_uploadDocument", "Snipara Upload", new UploadDocumentTool(client));

  // Orchestration + REPL tools
  registerTool(context, "snipara_loadDocument", "Snipara Load Document", new LoadDocumentTool(client));
  registerTool(context, "snipara_loadProject", "Snipara Load Project", new LoadProjectTool(client));
  registerTool(context, "snipara_orchestrate", "Snipara Orchestrate", new OrchestrateTool(client));
  registerTool(context, "snipara_replContext", "Snipara REPL Context", new ReplContextTool(client));

  // Diagnostic: list all registered tools
  try {
    const allTools = vscode.lm.tools;
    const sniparaTools = allTools.filter((t) => t.name.startsWith("snipara_"));
    console.log(`Snipara: ${sniparaTools.length} tools visible in vscode.lm.tools: ${sniparaTools.map((t) => t.name).join(", ")}`);
  } catch {
    console.log("Snipara: Could not enumerate vscode.lm.tools");
  }

  console.log("Snipara: 18 Language Model Tools registered successfully");
}
