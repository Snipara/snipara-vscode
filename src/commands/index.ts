import * as vscode from "vscode";
import type { SniparaClient } from "../client";
import type { ResultsProvider } from "../views/results-provider";
import type { ContextProvider } from "../views/context-provider";
import type { MemoryProvider } from "../views/memory-provider";
import { registerQueryCommands } from "./query";
import { registerContextCommands } from "./context";
import { registerConfigureCommands } from "./configure";
import { registerMemoryCommands } from "./memory";
import { registerSwarmCommands } from "./swarm";
import { registerDocumentCommands } from "./documents";
import { registerSharedCommands } from "./shared";
import { registerSummaryCommands } from "./summaries";
import { registerInfoCommands } from "./info";
import { registerOrchestrationCommands } from "./orchestration";

export function registerCommands(
  context: vscode.ExtensionContext,
  client: SniparaClient,
  resultsProvider: ResultsProvider,
  contextProvider: ContextProvider,
  memoryProvider: MemoryProvider
): void {
  registerQueryCommands(context, client, resultsProvider);
  registerContextCommands(context, client, contextProvider);
  registerConfigureCommands(context, client);
  registerMemoryCommands(context, client, memoryProvider);
  registerSwarmCommands(context, client);
  registerDocumentCommands(context, client);
  registerSharedCommands(context, client);
  registerSummaryCommands(context, client);
  registerInfoCommands(context, client);
  registerOrchestrationCommands(context, client, resultsProvider);
}
