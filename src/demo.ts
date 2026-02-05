import type { MCPResponse, ContextQueryResult, StatsResult } from "./types";

/** Reference cost per token (Claude Sonnet input: $3/M tokens) */
const COST_PER_MILLION_TOKENS = 3.0;

// ─── Demo Project Credentials (read-only, public) ────────────────────────────
const DEMO_PROJECT_ID = "cml9hjzb000013aam4pn5oe5j";
const DEMO_API_KEY = "rlm_2034b97c14b5c4f4b5af8fe2818bc81f670f8116f35fb593a290dea564fc5399";
const DEMO_SERVER_URL = "https://api.snipara.com";
const DEMO_DEFAULT_QUERY = "How does Snipara optimize context for LLMs?";

/**
 * Embedded demo data — works fully offline, no API key needed.
 * Used as the automatic first query and as fallback when the API is unreachable.
 */
const DEMO_STATS: StatsResult = {
  files_loaded: 42,
  total_lines: 18_340,
  total_characters: 1_948_000,
  sections: 256,
  files: [
    "docs/getting-started.md",
    "docs/architecture.md",
    "docs/api-reference.md",
    "docs/context-optimization.md",
    "docs/agent-memory.md",
    "docs/mcp-integration.md",
  ],
  project_id: "snipara-demo",
};

const DEMO_QUERY_RESULT: ContextQueryResult = {
  sections: [
    {
      title: "Context Optimization Pipeline",
      content:
        "Snipara optimizes context for LLMs through a multi-stage pipeline:\n\n" +
        "1. **Semantic Chunking** — Documents are split into sections based on meaning, not arbitrary token counts. " +
        "Headers, code blocks, and paragraph boundaries are preserved.\n\n" +
        "2. **Hybrid Search** — Combines BM25 keyword matching with vector embeddings for high recall + precision. " +
        "A query like 'authentication flow' matches both exact terms and semantically related sections about login, OAuth, and session management.\n\n" +
        "3. **Token Budget Allocation** — Given a max_tokens budget (e.g., 4000), Snipara ranks sections by relevance " +
        "and packs the most informative ones within budget. A 487K-token project gets reduced to ~2K tokens — " +
        "a 99.6% reduction with no loss of answer quality.\n\n" +
        "4. **Summary Layers** — For large documents, pre-computed summaries provide overview context " +
        "without consuming the full token budget.",
      file: "docs/context-optimization.md",
      lines: [45, 78] as [number, number],
      relevance_score: 0.94,
      token_count: 412,
      truncated: false,
    },
    {
      title: "Agent Memory System",
      content:
        "Snipara provides persistent memory across agent sessions:\n\n" +
        "- **remember** — Store facts, decisions, or patterns with optional TTL and scope (project/global)\n" +
        "- **recall** — Semantic search over stored memories with relevance filtering\n" +
        "- **memories** — List and manage stored memories by type (fact, decision, pattern, preference)\n\n" +
        "Memory is automatically included in context queries when relevant, giving agents continuity " +
        "without manual prompt engineering. Example: an agent that remembers 'user prefers TypeScript over JavaScript' " +
        "will have that context available in future coding sessions.",
      file: "docs/agent-memory.md",
      lines: [12, 38] as [number, number],
      relevance_score: 0.87,
      token_count: 318,
      truncated: false,
    },
    {
      title: "MCP Integration",
      content:
        "Snipara exposes all tools via the Model Context Protocol (MCP), making it compatible with:\n\n" +
        "- **Claude Code** — Add Snipara as an MCP server in Claude's config\n" +
        "- **VS Code Copilot** — Language Model Tools appear natively in Agent mode\n" +
        "- **Cursor / Windsurf** — MCP server configuration for inline context\n\n" +
        "A single project can serve context to multiple agents simultaneously via the Swarm coordination API, " +
        "with file-level locking and shared state to prevent conflicts.",
      file: "docs/mcp-integration.md",
      lines: [1, 22] as [number, number],
      relevance_score: 0.82,
      token_count: 286,
      truncated: false,
    },
  ],
  total_tokens: 1016,
  max_tokens: 4000,
  query: "How does Snipara optimize context for LLMs?",
  search_mode: "hybrid",
  search_mode_downgraded: false,
  session_context_included: false,
  suggestions: [
    "What search modes are available?",
    "How does the token budget allocation work?",
    "How do I set up MCP integration?",
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

  // Follow-up query → hit real API
  try {
    const start = Date.now();
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
          max_tokens: 4000,
          search_mode: "hybrid",
          include_metadata: true,
          prefer_summaries: false,
        },
      }),
    });

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
    const url = `${DEMO_SERVER_URL}/v1/${DEMO_PROJECT_ID}/mcp`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": DEMO_API_KEY,
      },
      body: JSON.stringify({ tool: "rlm_stats", params: {} }),
    });

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

  const costWithout =
    (totalProjectTokens / 1_000_000) * COST_PER_MILLION_TOKENS;
  const costWith = (returnedTokens / 1_000_000) * COST_PER_MILLION_TOKENS;

  return {
    totalProjectTokens,
    returnedTokens,
    reductionPercent: Math.round(reductionPercent * 10) / 10,
    latencyMs,
    estimatedCostWithout: formatCost(costWithout),
    estimatedCostWith: formatCost(costWith),
  };
}

export interface DemoStats {
  totalProjectTokens: number;
  returnedTokens: number;
  reductionPercent: number;
  latencyMs: number;
  estimatedCostWithout: string;
  estimatedCostWith: string;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count for display (e.g., 487000 → "487K").
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return `${tokens}`;
}
