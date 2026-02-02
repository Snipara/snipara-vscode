import * as vscode from "vscode";
import type {
  SniparaConfig,
  MCPResponse,
  ContextQueryResult,
  SearchResult,
  StatsResult,
  SectionsResult,
  DecomposeResult,
  MultiQueryItem,
  MultiQueryResult,
  PlanResult,
  MultiProjectQueryResult,
  StoreSummaryResult,
  GetSummariesResult,
  DeleteSummaryResult,
  SharedContextResult,
  SharedCategory,
  TemplateInfo,
  TemplateResult,
  CollectionInfo,
  UploadSharedDocumentResult,
  RememberResult,
  MemoryType,
  MemoryScope,
  RecallResult,
  MemoriesResult,
  ForgetResult,
  SwarmCreateResult,
  SwarmJoinResult,
  SwarmRole,
  ClaimResult,
  ResourceType,
  ReleaseResult,
  StateGetResult,
  StateSetResult,
  BroadcastResult,
  TaskCreateResult,
  TaskClaimResult,
  TaskCompleteResult,
  UploadDocumentResult,
  SyncDocumentItem,
  SyncDocumentsResult,
  SettingsResult,
  SummaryType,
  LoadDocumentResult,
  LoadProjectResult,
  OrchestrateResult,
  ReplContextResult,
  ToolName,
} from "./types";

/**
 * Snipara API client for VS Code extension
 */
export class SniparaClient {
  private config: SniparaConfig;

  constructor(config: SniparaConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<SniparaConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SniparaConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.projectId);
  }

  private async request<T>(
    tool: ToolName,
    params: Record<string, unknown> = {}
  ): Promise<MCPResponse<T>> {
    const url = `${this.config.serverUrl}/v1/${this.config.projectId}/mcp`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.config.apiKey,
      },
      body: JSON.stringify({ tool, params }),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({ error: response.statusText }))) as {
        error?: string;
      };
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<MCPResponse<T>>;
  }

  // ─── Core Query Methods ──────────────────────────────────────────

  async contextQuery(
    query: string,
    options: {
      maxTokens?: number;
      searchMode?: "keyword" | "semantic" | "hybrid";
      includeMetadata?: boolean;
      preferSummaries?: boolean;
    } = {}
  ): Promise<MCPResponse<ContextQueryResult>> {
    return this.request<ContextQueryResult>("rlm_context_query", {
      query,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      search_mode: options.searchMode ?? this.config.searchMode,
      include_metadata: options.includeMetadata ?? true,
      prefer_summaries: options.preferSummaries ?? false,
    });
  }

  async ask(question: string): Promise<MCPResponse<string>> {
    return this.request<string>("rlm_ask", { question });
  }

  async search(pattern: string, maxResults: number = 20): Promise<MCPResponse<SearchResult[]>> {
    return this.request<SearchResult[]>("rlm_search", { pattern, max_results: maxResults });
  }

  async getStats(): Promise<MCPResponse<StatsResult>> {
    return this.request<StatsResult>("rlm_stats", {});
  }

  async getSections(
    limit: number = 50,
    offset: number = 0,
    filter?: string
  ): Promise<MCPResponse<SectionsResult>> {
    const params: Record<string, unknown> = { limit, offset };
    if (filter) params.filter = filter;
    return this.request<SectionsResult>("rlm_sections", params);
  }

  async readLines(startLine: number, endLine: number): Promise<MCPResponse<string>> {
    return this.request<string>("rlm_read", { start_line: startLine, end_line: endLine });
  }

  // ─── Session Context Methods ─────────────────────────────────────

  async injectContext(
    context: string,
    append: boolean = false
  ): Promise<MCPResponse<{ message: string }>> {
    return this.request<{ message: string }>("rlm_inject", { context, append });
  }

  async getContext(): Promise<MCPResponse<string | null>> {
    return this.request<string | null>("rlm_context", {});
  }

  async clearContext(): Promise<MCPResponse<{ message: string }>> {
    return this.request<{ message: string }>("rlm_clear_context", {});
  }

  // ─── Advanced Query Methods ──────────────────────────────────────

  async decompose(query: string, maxDepth: number = 2): Promise<MCPResponse<DecomposeResult>> {
    return this.request<DecomposeResult>("rlm_decompose", { query, max_depth: maxDepth });
  }

  async multiQuery(
    queries: MultiQueryItem[],
    maxTokens: number = 8000
  ): Promise<MCPResponse<MultiQueryResult>> {
    return this.request<MultiQueryResult>("rlm_multi_query", {
      queries,
      max_tokens: maxTokens,
    });
  }

  async plan(
    query: string,
    options: {
      maxTokens?: number;
      strategy?: "breadth_first" | "depth_first" | "relevance_first";
    } = {}
  ): Promise<MCPResponse<PlanResult>> {
    return this.request<PlanResult>("rlm_plan", {
      query,
      max_tokens: options.maxTokens ?? 16000,
      strategy: options.strategy ?? "relevance_first",
    });
  }

  async multiProjectQuery(
    query: string,
    options: {
      projectIds?: string[];
      excludeProjectIds?: string[];
      maxTokens?: number;
      perProjectLimit?: number;
    } = {}
  ): Promise<MCPResponse<MultiProjectQueryResult>> {
    return this.request<MultiProjectQueryResult>("rlm_multi_project_query", {
      query,
      project_ids: options.projectIds ?? [],
      exclude_project_ids: options.excludeProjectIds ?? [],
      max_tokens: options.maxTokens ?? 8000,
      per_project_limit: options.perProjectLimit ?? 3,
    });
  }

  // ─── Summary Methods ─────────────────────────────────────────────

  async storeSummary(
    documentPath: string,
    summary: string,
    options: { summaryType?: SummaryType; generatedBy?: string } = {}
  ): Promise<MCPResponse<StoreSummaryResult>> {
    return this.request<StoreSummaryResult>("rlm_store_summary", {
      document_path: documentPath,
      summary,
      summary_type: options.summaryType ?? "concise",
      generated_by: options.generatedBy,
    });
  }

  async getSummaries(options: {
    documentPath?: string;
    summaryType?: SummaryType;
    includeContent?: boolean;
  } = {}): Promise<MCPResponse<GetSummariesResult>> {
    return this.request<GetSummariesResult>("rlm_get_summaries", {
      document_path: options.documentPath,
      summary_type: options.summaryType,
      include_content: options.includeContent ?? true,
    });
  }

  async deleteSummary(options: {
    summaryId?: string;
    documentPath?: string;
  } = {}): Promise<MCPResponse<DeleteSummaryResult>> {
    return this.request<DeleteSummaryResult>("rlm_delete_summary", {
      summary_id: options.summaryId,
      document_path: options.documentPath,
    });
  }

  // ─── Shared Context Methods ──────────────────────────────────────

  async sharedContext(options: {
    categories?: SharedCategory[];
    maxTokens?: number;
    includeContent?: boolean;
  } = {}): Promise<MCPResponse<SharedContextResult>> {
    return this.request<SharedContextResult>("rlm_shared_context", {
      categories: options.categories,
      max_tokens: options.maxTokens ?? 4000,
      include_content: options.includeContent ?? true,
    });
  }

  async listTemplates(category?: string): Promise<MCPResponse<TemplateInfo[]>> {
    const params: Record<string, unknown> = {};
    if (category) params.category = category;
    return this.request<TemplateInfo[]>("rlm_list_templates", params);
  }

  async getTemplate(options: {
    templateId?: string;
    slug?: string;
    variables?: Record<string, string>;
  }): Promise<MCPResponse<TemplateResult>> {
    return this.request<TemplateResult>("rlm_get_template", {
      template_id: options.templateId,
      slug: options.slug,
      variables: options.variables,
    });
  }

  async listCollections(includePublic: boolean = true): Promise<MCPResponse<CollectionInfo[]>> {
    return this.request<CollectionInfo[]>("rlm_list_collections", {
      include_public: includePublic,
    });
  }

  async uploadSharedDocument(params: {
    collectionId: string;
    title: string;
    content: string;
    category?: SharedCategory;
    priority?: number;
    tags?: string[];
  }): Promise<MCPResponse<UploadSharedDocumentResult>> {
    return this.request<UploadSharedDocumentResult>("rlm_upload_shared_document", {
      collection_id: params.collectionId,
      title: params.title,
      content: params.content,
      category: params.category ?? "BEST_PRACTICES",
      priority: params.priority ?? 0,
      tags: params.tags,
    });
  }

  // ─── Agent Memory Methods ────────────────────────────────────────

  async remember(params: {
    content: string;
    type?: MemoryType;
    scope?: MemoryScope;
    category?: string;
    ttlDays?: number;
    relatedTo?: string[];
    documentRefs?: string[];
  }): Promise<MCPResponse<RememberResult>> {
    return this.request<RememberResult>("rlm_remember", {
      content: params.content,
      type: params.type ?? "fact",
      scope: params.scope ?? "project",
      category: params.category,
      ttl_days: params.ttlDays,
      related_to: params.relatedTo ?? [],
      document_refs: params.documentRefs ?? [],
    });
  }

  async recall(
    query: string,
    options: {
      type?: MemoryType;
      scope?: MemoryScope;
      category?: string;
      limit?: number;
      minRelevance?: number;
    } = {}
  ): Promise<MCPResponse<RecallResult>> {
    return this.request<RecallResult>("rlm_recall", {
      query,
      type: options.type,
      scope: options.scope,
      category: options.category,
      limit: options.limit ?? 5,
      min_relevance: options.minRelevance ?? 0.5,
    });
  }

  async memories(options: {
    type?: MemoryType;
    scope?: MemoryScope;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MCPResponse<MemoriesResult>> {
    return this.request<MemoriesResult>("rlm_memories", {
      type: options.type,
      scope: options.scope,
      category: options.category,
      search: options.search,
      limit: options.limit ?? 20,
      offset: options.offset ?? 0,
    });
  }

  async forget(options: {
    memoryId?: string;
    type?: MemoryType;
    category?: string;
    olderThanDays?: number;
  } = {}): Promise<MCPResponse<ForgetResult>> {
    return this.request<ForgetResult>("rlm_forget", {
      memory_id: options.memoryId,
      type: options.type,
      category: options.category,
      older_than_days: options.olderThanDays,
    });
  }

  // ─── Swarm Methods ───────────────────────────────────────────────

  async swarmCreate(
    name: string,
    options: { description?: string; maxAgents?: number; config?: Record<string, unknown> } = {}
  ): Promise<MCPResponse<SwarmCreateResult>> {
    return this.request<SwarmCreateResult>("rlm_swarm_create", {
      name,
      description: options.description,
      max_agents: options.maxAgents ?? 10,
      config: options.config,
    });
  }

  async swarmJoin(
    swarmId: string,
    agentId: string,
    options: { role?: SwarmRole; capabilities?: string[] } = {}
  ): Promise<MCPResponse<SwarmJoinResult>> {
    return this.request<SwarmJoinResult>("rlm_swarm_join", {
      swarm_id: swarmId,
      agent_id: agentId,
      role: options.role ?? "worker",
      capabilities: options.capabilities,
    });
  }

  async claim(
    swarmId: string,
    agentId: string,
    resourceType: ResourceType,
    resourceId: string,
    timeoutSeconds: number = 300
  ): Promise<MCPResponse<ClaimResult>> {
    return this.request<ClaimResult>("rlm_claim", {
      swarm_id: swarmId,
      agent_id: agentId,
      resource_type: resourceType,
      resource_id: resourceId,
      timeout_seconds: timeoutSeconds,
    });
  }

  async release(
    swarmId: string,
    agentId: string,
    options: { claimId?: string; resourceId?: string; resourceType?: string } = {}
  ): Promise<MCPResponse<ReleaseResult>> {
    return this.request<ReleaseResult>("rlm_release", {
      swarm_id: swarmId,
      agent_id: agentId,
      claim_id: options.claimId,
      resource_id: options.resourceId,
      resource_type: options.resourceType,
    });
  }

  async stateGet(swarmId: string, key: string): Promise<MCPResponse<StateGetResult>> {
    return this.request<StateGetResult>("rlm_state_get", { swarm_id: swarmId, key });
  }

  async stateSet(
    swarmId: string,
    agentId: string,
    key: string,
    value: unknown,
    expectedVersion?: number
  ): Promise<MCPResponse<StateSetResult>> {
    return this.request<StateSetResult>("rlm_state_set", {
      swarm_id: swarmId,
      agent_id: agentId,
      key,
      value,
      expected_version: expectedVersion,
    });
  }

  async broadcast(
    swarmId: string,
    agentId: string,
    eventType: string,
    payload?: Record<string, unknown>
  ): Promise<MCPResponse<BroadcastResult>> {
    return this.request<BroadcastResult>("rlm_broadcast", {
      swarm_id: swarmId,
      agent_id: agentId,
      event_type: eventType,
      payload,
    });
  }

  async taskCreate(
    swarmId: string,
    agentId: string,
    title: string,
    options: {
      description?: string;
      priority?: number;
      dependsOn?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<MCPResponse<TaskCreateResult>> {
    return this.request<TaskCreateResult>("rlm_task_create", {
      swarm_id: swarmId,
      agent_id: agentId,
      title,
      description: options.description,
      priority: options.priority ?? 0,
      depends_on: options.dependsOn,
      metadata: options.metadata,
    });
  }

  async taskClaim(
    swarmId: string,
    agentId: string,
    options: { taskId?: string; timeoutSeconds?: number } = {}
  ): Promise<MCPResponse<TaskClaimResult>> {
    return this.request<TaskClaimResult>("rlm_task_claim", {
      swarm_id: swarmId,
      agent_id: agentId,
      task_id: options.taskId,
      timeout_seconds: options.timeoutSeconds ?? 600,
    });
  }

  async taskComplete(
    swarmId: string,
    agentId: string,
    taskId: string,
    options: { success?: boolean; result?: unknown } = {}
  ): Promise<MCPResponse<TaskCompleteResult>> {
    return this.request<TaskCompleteResult>("rlm_task_complete", {
      swarm_id: swarmId,
      agent_id: agentId,
      task_id: taskId,
      success: options.success ?? true,
      result: options.result,
    });
  }

  // ─── Document Sync Methods ───────────────────────────────────────

  async uploadDocument(path: string, content: string): Promise<MCPResponse<UploadDocumentResult>> {
    return this.request<UploadDocumentResult>("rlm_upload_document", { path, content });
  }

  async syncDocuments(
    documents: SyncDocumentItem[],
    deleteMissing: boolean = false
  ): Promise<MCPResponse<SyncDocumentsResult>> {
    return this.request<SyncDocumentsResult>("rlm_sync_documents", {
      documents,
      delete_missing: deleteMissing,
    });
  }

  // ─── Settings ────────────────────────────────────────────────────

  async getSettings(): Promise<MCPResponse<SettingsResult>> {
    return this.request<SettingsResult>("rlm_settings", {});
  }

  // ─── Orchestration Methods ────────────────────────────────────────

  async loadDocument(path: string): Promise<MCPResponse<LoadDocumentResult>> {
    return this.request<LoadDocumentResult>("rlm_load_document", { path });
  }

  async loadProject(options: {
    maxTokens?: number;
    pathsFilter?: string[];
    includeContent?: boolean;
  } = {}): Promise<MCPResponse<LoadProjectResult>> {
    return this.request<LoadProjectResult>("rlm_load_project", {
      max_tokens: options.maxTokens ?? 16000,
      paths_filter: options.pathsFilter ?? [],
      include_content: options.includeContent ?? true,
    });
  }

  async orchestrate(
    query: string,
    options: {
      maxTokens?: number;
      topK?: number;
      searchMode?: "keyword" | "semantic" | "hybrid";
    } = {}
  ): Promise<MCPResponse<OrchestrateResult>> {
    return this.request<OrchestrateResult>("rlm_orchestrate", {
      query,
      max_tokens: options.maxTokens ?? 16000,
      top_k: options.topK ?? 5,
      search_mode: options.searchMode ?? "hybrid",
    });
  }

  async replContext(options: {
    query?: string;
    maxTokens?: number;
    includeHelpers?: boolean;
    searchMode?: "keyword" | "semantic" | "hybrid";
  } = {}): Promise<MCPResponse<ReplContextResult>> {
    return this.request<ReplContextResult>("rlm_repl_context", {
      query: options.query ?? "",
      max_tokens: options.maxTokens ?? 8000,
      include_helpers: options.includeHelpers ?? true,
      search_mode: options.searchMode ?? "hybrid",
    });
  }
}

/**
 * Get Snipara configuration from VS Code settings
 */
export function getConfigFromSettings(): SniparaConfig {
  const config = vscode.workspace.getConfiguration("snipara");
  return {
    apiKey: config.get<string>("apiKey") || "",
    projectId: config.get<string>("projectId") || "",
    serverUrl: config.get<string>("serverUrl") || "https://api.snipara.com",
    maxTokens: config.get<number>("maxTokens") || 4000,
    searchMode: config.get<"keyword" | "semantic" | "hybrid">("searchMode") || "hybrid",
  };
}

/**
 * Create a configured Snipara client instance
 */
export function createClient(): SniparaClient {
  return new SniparaClient(getConfigFromSettings());
}
