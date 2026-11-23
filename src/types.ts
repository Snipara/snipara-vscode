/**
 * Snipara VS Code Extension - Type Definitions
 * Mirrors Pydantic models from apps/mcp-server/src/models.py
 */

// ─── Configuration ───────────────────────────────────────────────────

export interface SniparaConfig {
  apiKey: string;
  projectId: string;
  serverUrl: string;
  maxTokens: number;
  searchMode: "keyword" | "semantic" | "hybrid";
}

// ─── Tool Names (wire format matches server ToolName enum) ───────────

export type ToolName =
  // Core query tools
  | "snipara_search"
  | "snipara_inject"
  | "snipara_context"
  | "snipara_clear_context"
  | "snipara_stats"
  | "snipara_sections"
  | "snipara_read"
  | "snipara_context_query"
  | "snipara_get_chunk"
  // Code graph tools
  | "snipara_code_callers"
  | "snipara_code_imports"
  | "snipara_code_neighbors"
  | "snipara_code_shortest_path"
  // Recursive context tools
  | "snipara_decompose"
  | "snipara_multi_query"
  | "snipara_multi_project_query"
  | "snipara_plan"
  // Summary storage tools
  | "snipara_store_summary"
  | "snipara_get_summaries"
  | "snipara_delete_summary"
  // Shared context tools
  | "snipara_shared_context"
  | "snipara_list_templates"
  | "snipara_get_template"
  | "snipara_list_collections"
  | "snipara_upload_shared_document"
  // Agent memory tools
  | "snipara_remember"
  | "snipara_remember_if_novel"
  | "snipara_end_of_task_commit"
  | "snipara_recall"
  | "snipara_memories"
  | "snipara_forget"
  | "snipara_memory_review_queue"
  | "snipara_memory_health"
  // Decisions
  | "snipara_decision_create"
  | "snipara_decision_query"
  // Document sync tools
  | "snipara_upload_document"
  | "snipara_sync_documents"
  | "snipara_settings"
  // Orchestration tools
  | "snipara_load_document"
  | "snipara_load_project"
  | "snipara_orchestrate"
  // REPL context bridge
  | "snipara_repl_context"
  // Operations and analytics
  | "snipara_index_health"
  | "snipara_index_recommendations"
  | "snipara_reindex"
  | "snipara_search_analytics"
  | "snipara_query_trends"
  // Access control
  | "snipara_request_access";

// ─── API Response ────────────────────────────────────────────────────

export interface MCPResponse<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    latency_ms: number;
  };
}

// ─── Core Query Types ────────────────────────────────────────────────

export interface ContextSection {
  title: string;
  content: string;
  file: string;
  lines: [number, number];
  relevance_score: number;
  token_count: number;
  truncated: boolean;
}

export interface ContextQueryResult {
  sections: ContextSection[];
  total_tokens: number;
  max_tokens: number;
  query: string;
  search_mode: string;
  search_mode_downgraded: boolean;
  session_context_included: boolean;
  suggestions: string[];
  summaries_used: number;
}

export interface SearchResult {
  line: number;
  content: string;
  file?: string;
}

export interface StatsResult {
  files_loaded: number;
  total_lines: number;
  total_characters: number;
  sections: number;
  files: string[];
  project_id: string;
}

export interface SectionInfo {
  id: string;
  title: string;
  start_line: number;
  end_line: number;
}

export interface SectionsResult {
  sections: SectionInfo[];
  total_sections: number;
  returned: number;
  offset: number;
  has_more: boolean;
}

// ─── Advanced Query Types ────────────────────────────────────────────

export interface SubQuery {
  id: number;
  query: string;
  priority: number;
  estimated_tokens: number;
  key_terms: string[];
}

export interface DecomposeResult {
  original_query: string;
  sub_queries: SubQuery[];
  dependencies: [number, number][];
  suggested_sequence: number[];
  total_estimated_tokens: number;
  strategy_used: string;
}

export interface MultiQueryItem {
  query: string;
  max_tokens?: number;
}

export interface MultiQueryResultItem {
  query: string;
  sections: ContextSection[];
  total_tokens: number;
}

export interface MultiQueryResult {
  results: MultiQueryResultItem[];
  total_tokens: number;
}

export interface PlanStep {
  step: number;
  action: string;
  params: Record<string, unknown>;
  depends_on: number[];
  expected_output: string;
}

export interface PlanResult {
  plan_id: string;
  query: string;
  steps: PlanStep[];
  estimated_total_tokens: number;
  strategy: string;
  estimated_queries: number;
}

export interface MultiProjectResultItem {
  project_id: string;
  project_name: string;
  sections: ContextSection[];
  tokens: number;
}

export interface MultiProjectQueryResult {
  results: MultiProjectResultItem[];
  total_tokens: number;
}

// ─── Summary Types ───────────────────────────────────────────────────

export type SummaryType = "concise" | "detailed" | "technical" | "keywords" | "custom";

export interface StoreSummaryResult {
  summary_id: string;
  document_path: string;
  summary_type: SummaryType;
  message: string;
}

export interface SummaryInfo {
  summary_id: string;
  document_path: string;
  summary_type: SummaryType;
  summary: string;
  generated_by?: string;
  created_at: string;
}

export interface GetSummariesResult {
  summaries: SummaryInfo[];
  total_count: number;
}

export interface DeleteSummaryResult {
  deleted: number;
  message: string;
}

// ─── Shared Context Types ────────────────────────────────────────────

export type SharedCategory = "MANDATORY" | "BEST_PRACTICES" | "GUIDELINES" | "REFERENCE";

export interface SharedDocument {
  title: string;
  category: SharedCategory;
  priority: number;
  content: string;
  collection_name: string;
}

export interface SharedContextResult {
  documents: SharedDocument[];
  total_tokens: number;
  budget_allocation: Record<string, number>;
}

export interface TemplateInfo {
  template_id: string;
  slug: string;
  title: string;
  category?: string;
  description?: string;
}

export interface TemplateResult {
  template_id: string;
  slug: string;
  title: string;
  content: string;
  variables?: Record<string, string>;
}

export interface CollectionInfo {
  collection_id: string;
  name: string;
  description?: string;
  document_count: number;
  is_public: boolean;
}

export interface UploadSharedDocumentResult {
  document_id: string;
  slug: string;
  token_count: number;
  message: string;
}

// ─── Agent Memory Types ──────────────────────────────────────────────

export type MemoryType = "fact" | "decision" | "learning" | "preference" | "todo" | "context";
export type MemoryScope = "agent" | "project" | "team" | "user";

export interface RememberResult {
  memory_id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  expires_at: string | null;
  created: boolean;
  message: string;
}

export interface RecalledMemory {
  memory_id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  category: string | null;
  confidence: number;
  relevance_score: number;
  created_at: string;
  expires_at: string | null;
  access_count: number;
}

export interface RecallResult {
  memories: RecalledMemory[];
  query: string;
  total_found: number;
}

export interface MemoryInfo {
  memory_id: string;
  content: string;
  type: MemoryType;
  scope: MemoryScope;
  category: string | null;
  confidence: number;
  source: string;
  created_at: string;
  expires_at: string | null;
  access_count: number;
}

export interface MemoriesResult {
  memories: MemoryInfo[];
  total_count: number;
  has_more: boolean;
}

export interface ForgetResult {
  deleted: number;
  message: string;
}

// ─── Document Sync Types ─────────────────────────────────────────────

export interface UploadDocumentResult {
  path: string;
  action: "created" | "updated";
  size: number;
  hash: string;
  message: string;
}

export interface SyncDocumentItem {
  path: string;
  content: string;
}

export interface SyncDocumentsResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  message: string;
}

// ─── Settings Types ──────────────────────────────────────────────────

export interface SettingsResult {
  project_id: string;
  max_tokens: number;
  search_mode: string;
  [key: string]: unknown;
}

// ─── SSE Types ───────────────────────────────────────────────────────

export interface SSEEvent {
  type: "start" | "result" | "error" | "done";
  tool?: string;
  success?: boolean;
  result?: unknown;
  error?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    latency_ms: number;
  };
}

// ─── Runtime Types ──────────────────────────────────────────────────

export interface RuntimeStatus {
  sandboxInstalled: boolean;
  sandboxVersion: string | null;
  dockerInstalled: boolean;
  dockerRunning: boolean;
}

export interface RuntimeExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

// ─── Orchestration Types ────────────────────────────────────────────

export interface LoadDocumentResult {
  path: string;
  content: string;
  token_count: number;
  lines: number;
}

export interface LoadProjectDocument {
  path: string;
  token_count: number;
  lines: number;
  content?: string;
  truncated: boolean;
}

export interface LoadProjectResult {
  total_files: number;
  returned_files: number;
  total_tokens: number;
  max_tokens: number;
  documents: LoadProjectDocument[];
}

export interface OrchestrateRankedSection {
  title: string;
  relevance_score: number;
  start_line: number;
  end_line: number;
}

export interface OrchestrateDocument {
  path: string;
  content: string;
  token_count: number;
  relevance_score: number;
  truncated: boolean;
}

export interface OrchestrateResult {
  query: string;
  rounds: {
    sections_scan: {
      total_sections: number;
      total_files: number;
    };
    ranked_search: {
      top_sections: OrchestrateRankedSection[];
      search_mode: string;
    };
    raw_load: {
      files_loaded: number;
      total_tokens: number;
      max_tokens: number;
      documents: OrchestrateDocument[];
    };
  };
}

// ─── REPL Context Bridge Types ──────────────────────────────────────

export interface ReplContextFileInfo {
  content: string;
  tokens: number;
  relevance: number;
  truncated: boolean;
}

export interface ReplContextSection {
  title: string;
  file: string;
  lines: [number, number];
}

export interface ReplContextResult {
  context_data: {
    files: Record<string, ReplContextFileInfo>;
    sections: ReplContextSection[];
    total_files_in_project: number;
    loaded_files: number;
  };
  setup_code: string;
  total_tokens: number;
  usage_hint: string;
}
