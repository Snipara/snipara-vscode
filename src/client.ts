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

  async callTool<T = Record<string, unknown>>(
    tool: ToolName,
    params: Record<string, unknown> = {}
  ): Promise<MCPResponse<T>> {
    return this.request<T>(tool, params);
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
    return this.request<ContextQueryResult>("snipara_context_query", {
      query,
      max_tokens: options.maxTokens ?? this.config.maxTokens,
      search_mode: options.searchMode ?? this.config.searchMode,
      include_metadata: options.includeMetadata ?? true,
      prefer_summaries: options.preferSummaries ?? false,
    });
  }

  async search(pattern: string, maxResults: number = 20): Promise<MCPResponse<SearchResult[]>> {
    return this.request<SearchResult[]>("snipara_search", { pattern, max_results: maxResults });
  }

  async getStats(): Promise<MCPResponse<StatsResult>> {
    return this.request<StatsResult>("snipara_stats", {});
  }

  async getSections(
    limit: number = 50,
    offset: number = 0,
    filter?: string
  ): Promise<MCPResponse<SectionsResult>> {
    const params: Record<string, unknown> = { limit, offset };
    if (filter) params.filter = filter;
    return this.request<SectionsResult>("snipara_sections", params);
  }

  async readLines(startLine: number, endLine: number): Promise<MCPResponse<string>> {
    return this.request<string>("snipara_read", { start_line: startLine, end_line: endLine });
  }

  // ─── Session Context Methods ─────────────────────────────────────

  async injectContext(
    context: string,
    append: boolean = false
  ): Promise<MCPResponse<{ message: string }>> {
    return this.request<{ message: string }>("snipara_inject", { context, append });
  }

  async getContext(): Promise<MCPResponse<string | null>> {
    return this.request<string | null>("snipara_context", {});
  }

  async clearContext(): Promise<MCPResponse<{ message: string }>> {
    return this.request<{ message: string }>("snipara_clear_context", {});
  }

  // ─── Advanced Query Methods ──────────────────────────────────────

  async decompose(query: string, maxDepth: number = 2): Promise<MCPResponse<DecomposeResult>> {
    return this.request<DecomposeResult>("snipara_decompose", { query, max_depth: maxDepth });
  }

  async multiQuery(
    queries: MultiQueryItem[],
    maxTokens: number = 8000
  ): Promise<MCPResponse<MultiQueryResult>> {
    return this.request<MultiQueryResult>("snipara_multi_query", {
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
    return this.request<PlanResult>("snipara_plan", {
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
    return this.request<MultiProjectQueryResult>("snipara_multi_project_query", {
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
    return this.request<StoreSummaryResult>("snipara_store_summary", {
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
    return this.request<GetSummariesResult>("snipara_get_summaries", {
      document_path: options.documentPath,
      summary_type: options.summaryType,
      include_content: options.includeContent ?? true,
    });
  }

  async deleteSummary(options: {
    summaryId?: string;
    documentPath?: string;
  } = {}): Promise<MCPResponse<DeleteSummaryResult>> {
    return this.request<DeleteSummaryResult>("snipara_delete_summary", {
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
    return this.request<SharedContextResult>("snipara_shared_context", {
      categories: options.categories,
      max_tokens: options.maxTokens ?? 4000,
      include_content: options.includeContent ?? true,
    });
  }

  async listTemplates(category?: string): Promise<MCPResponse<TemplateInfo[]>> {
    const params: Record<string, unknown> = {};
    if (category) params.category = category;
    return this.request<TemplateInfo[]>("snipara_list_templates", params);
  }

  async getTemplate(options: {
    templateId?: string;
    slug?: string;
    variables?: Record<string, string>;
  }): Promise<MCPResponse<TemplateResult>> {
    return this.request<TemplateResult>("snipara_get_template", {
      template_id: options.templateId,
      slug: options.slug,
      variables: options.variables,
    });
  }

  async listCollections(includePublic: boolean = true): Promise<MCPResponse<CollectionInfo[]>> {
    return this.request<CollectionInfo[]>("snipara_list_collections", {
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
    return this.request<UploadSharedDocumentResult>("snipara_upload_shared_document", {
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
    return this.request<RememberResult>("snipara_remember", {
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
    return this.request<RecallResult>("snipara_recall", {
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
    return this.request<MemoriesResult>("snipara_memories", {
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
    return this.request<ForgetResult>("snipara_forget", {
      memory_id: options.memoryId,
      type: options.type,
      category: options.category,
      older_than_days: options.olderThanDays,
    });
  }

  // ─── Document Sync Methods ───────────────────────────────────────

  async uploadDocument(path: string, content: string): Promise<MCPResponse<UploadDocumentResult>> {
    return this.request<UploadDocumentResult>("snipara_upload_document", { path, content });
  }

  async syncDocuments(
    documents: SyncDocumentItem[],
    deleteMissing: boolean = false
  ): Promise<MCPResponse<SyncDocumentsResult>> {
    return this.request<SyncDocumentsResult>("snipara_sync_documents", {
      documents,
      delete_missing: deleteMissing,
    });
  }

  // ─── Settings ────────────────────────────────────────────────────

  async getSettings(): Promise<MCPResponse<SettingsResult>> {
    return this.request<SettingsResult>("snipara_settings", {});
  }

  // ─── Orchestration Methods ────────────────────────────────────────

  async loadDocument(path: string): Promise<MCPResponse<LoadDocumentResult>> {
    return this.request<LoadDocumentResult>("snipara_load_document", { path });
  }

  async loadProject(options: {
    maxTokens?: number;
    pathsFilter?: string[];
    includeContent?: boolean;
  } = {}): Promise<MCPResponse<LoadProjectResult>> {
    return this.request<LoadProjectResult>("snipara_load_project", {
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
    return this.request<OrchestrateResult>("snipara_orchestrate", {
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
    return this.request<ReplContextResult>("snipara_repl_context", {
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
