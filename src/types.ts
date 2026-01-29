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
  | "rlm_ask"
  | "rlm_search"
  | "rlm_inject"
  | "rlm_context"
  | "rlm_clear_context"
  | "rlm_stats"
  | "rlm_sections"
  | "rlm_read"
  | "rlm_context_query"
  // Recursive context tools
  | "rlm_decompose"
  | "rlm_multi_query"
  | "rlm_multi_project_query"
  | "rlm_plan"
  // Summary storage tools
  | "rlm_store_summary"
  | "rlm_get_summaries"
  | "rlm_delete_summary"
  // Shared context tools
  | "rlm_shared_context"
  | "rlm_list_templates"
  | "rlm_get_template"
  | "rlm_list_collections"
  | "rlm_upload_shared_document"
  // Agent memory tools
  | "rlm_remember"
  | "rlm_recall"
  | "rlm_memories"
  | "rlm_forget"
  // Swarm tools
  | "rlm_swarm_create"
  | "rlm_swarm_join"
  | "rlm_claim"
  | "rlm_release"
  | "rlm_state_get"
  | "rlm_state_set"
  | "rlm_broadcast"
  | "rlm_task_create"
  | "rlm_task_claim"
  | "rlm_task_complete"
  // Document sync tools
  | "rlm_upload_document"
  | "rlm_sync_documents"
  | "rlm_settings"
  // Access control
  | "rlm_request_access";

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

// ─── Swarm Types ─────────────────────────────────────────────────────

export type SwarmRole = "coordinator" | "worker" | "observer";
export type ResourceType = "file" | "function" | "module" | "component" | "other";

export interface SwarmCreateResult {
  swarm_id: string;
  name: string;
  created: boolean;
  message: string;
}

export interface SwarmJoinResult {
  swarm_id: string;
  agent_id: string;
  role: SwarmRole;
  joined: boolean;
  message: string;
}

export interface ClaimResult {
  claim_id: string;
  resource_type: ResourceType;
  resource_id: string;
  claimed: boolean;
  expires_at: string;
  message: string;
}

export interface ReleaseResult {
  released: boolean;
  message: string;
}

export interface StateGetResult {
  key: string;
  value: unknown;
  version: number;
}

export interface StateSetResult {
  key: string;
  version: number;
  message: string;
}

export interface BroadcastResult {
  event_type: string;
  delivered_to: number;
  message: string;
}

export interface TaskCreateResult {
  task_id: string;
  title: string;
  created: boolean;
  message: string;
}

export interface TaskClaimResult {
  task_id: string;
  title: string;
  description?: string;
  claimed: boolean;
  message: string;
}

export interface TaskCompleteResult {
  task_id: string;
  success: boolean;
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
