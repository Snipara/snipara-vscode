import type { MCPResponse, ContextQueryResult, StatsResult } from "./types";

// ─── Demo Project Credentials (read-only, public) ────────────────────────────
const DEMO_PROJECT_ID = "cml9hjzb000013aam4pn5oe5j";
const DEMO_API_KEY = "rlm_2034b97c14b5c4f4b5af8fe2818bc81f670f8116f35fb593a290dea564fc5399";
const DEMO_SERVER_URL = "https://api.snipara.com";
const DEMO_DEFAULT_QUERY = "How does Snipara keep project memory available across agents?";
const FETCH_TIMEOUT_MS = 8_000;

/**
 * Embedded demo data — works fully offline, no API key needed.
 * Used as the automatic first query and as fallback when the API is unreachable.
 */
export const DEMO_STATS: StatsResult = {
  files_loaded: 9,
  total_lines: 655,
  total_characters: 16_145,
  sections: 60,
  files: [
    "docs/project-memory.md",
    "docs/memory-workflow.md",
    "docs/mcp-tools.md",
    "docs/features.md",
    "docs/getting-started.md",
    "docs/api-reference.md",
    "docs/use-cases.md",
    "blog/project-memory-for-agents.md",
    "blog/mcp-setup-guide.md",
  ],
  project_id: "snipara-demo",
};

const DEMO_QUERY_RESULT: ContextQueryResult = {
  sections: [
    {
      title: "Project Memory Across Agents",
      content:
        "Snipara is project-scoped persistent context for AI-assisted work. " +
        "Claude Code, Cursor, Codex, OpenAI Agents, VS Code, and other MCP-compatible clients can all retrieve the same project memory. " +
        "The agent still uses its own LLM; Snipara supplies durable decisions, source-backed retrieval, and compact project context.",
      file: "docs/project-memory.md",
      lines: [1, 20] as [number, number],
      relevance_score: 0.96,
      token_count: 180,
      truncated: false,
    },
    {
      title: "Durable Memory Workflow",
      content:
        "A Snipara workflow starts by recalling relevant memory, loads source-backed project context, then persists reusable outcomes at the end. " +
        "Durable memories are typed as facts, decisions, learnings, preferences, todos, or context, and can be reviewed, compacted, superseded, or retired instead of becoming stale chat history.",
      file: "docs/memory-workflow.md",
      lines: [1, 30] as [number, number],
      relevance_score: 0.92,
      token_count: 150,
      truncated: false,
    },
    {
      title: "Current MCP Surface",
      content:
        "Snipara exposes retrieval, memory, shared context, code graph, index health, analytics, and coordination tools through MCP. " +
        "Agents can use rlm_context_query for source-backed retrieval, rlm_get_chunk for cited sections, rlm_code_* for structural code questions, rlm_memory_health for memory hygiene, and rlm_htask_* for hierarchical task workflows.",
      file: "docs/mcp-tools.md",
      lines: [15, 28] as [number, number],
      relevance_score: 0.88,
      token_count: 140,
      truncated: false,
    },
  ],
  total_tokens: 470,
  max_tokens: 6000,
  query: DEMO_DEFAULT_QUERY,
  search_mode: "hybrid",
  search_mode_downgraded: false,
  session_context_included: false,
  suggestions: [
    "How should an agent persist durable task outcomes?",
    "Which MCP tools are available for code graph questions?",
    "How does Snipara memory differ from chat history?",
  ],
  summaries_used: 0,
};

/**
 * Demo context query.
 * - No query or default query → returns hardcoded offline data (instant).
 * - Custom query → hits the real Snipara API against the demo project,
 *   falls back to offline data if the request fails.
 */
export async function demoContextQuery(
  query?: string
): Promise<MCPResponse<ContextQueryResult>> {
  // Automatic / default query → offline, no network needed
  if (!query || query === DEMO_DEFAULT_QUERY) {
    const latencyMs = 80 + Math.floor(Math.random() * 120);
    await new Promise((r) => setTimeout(r, latencyMs));
    return {
      success: true,
      result: DEMO_QUERY_RESULT,
      usage: { input_tokens: 12, output_tokens: 1016, latency_ms: latencyMs },
    };
  }

  // Follow-up query → hit real API (with timeout)
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const url = `${DEMO_SERVER_URL}/v1/${DEMO_PROJECT_ID}/mcp`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": DEMO_API_KEY,
      },
      body: JSON.stringify({
        tool: "rlm_context_query",
        params: {
          query,
          max_tokens: 6000,
          search_mode: "hybrid",
          include_metadata: true,
          prefer_summaries: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as MCPResponse<ContextQueryResult>;
    const latencyMs = Date.now() - start;

    // Patch usage latency with measured wall-clock time
    if (data.usage) {
      data.usage.latency_ms = latencyMs;
    }

    return data;
  } catch {
    // Network error or API failure → graceful offline fallback
    const latencyMs = 80 + Math.floor(Math.random() * 120);
    await new Promise((r) => setTimeout(r, latencyMs));
    return {
      success: true,
      result: { ...DEMO_QUERY_RESULT, query },
      usage: { input_tokens: 12, output_tokens: 1016, latency_ms: latencyMs },
    };
  }
}

/**
 * Demo stats — hits the real API, falls back to offline data.
 */
export async function demoGetStats(): Promise<MCPResponse<StatsResult>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const url = `${DEMO_SERVER_URL}/v1/${DEMO_PROJECT_ID}/mcp`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": DEMO_API_KEY,
      },
      body: JSON.stringify({ tool: "rlm_stats", params: {} }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as MCPResponse<StatsResult>;
  } catch {
    return {
      success: true,
      result: DEMO_STATS,
      usage: { input_tokens: 0, output_tokens: 0, latency_ms: 1 },
    };
  }
}

/**
 * Calculate cost comparison stats for demo results display.
 */
export function calculateDemoStats(
  totalProjectTokens: number,
  returnedTokens: number,
  latencyMs: number
): DemoStats {
  const reductionPercent =
    totalProjectTokens > 0
      ? ((totalProjectTokens - returnedTokens) / totalProjectTokens) * 100
      : 0;

  return {
    totalProjectTokens,
    returnedTokens,
    reductionPercent: Math.round(reductionPercent * 10) / 10,
    latencyMs,
  };
}

export interface DemoStats {
  totalProjectTokens: number;
  returnedTokens: number;
  reductionPercent: number;
  latencyMs: number;
}

/**
 * Format token count for display (e.g., 487000 → "487K").
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}
