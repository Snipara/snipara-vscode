import type { MCPResponse, ContextQueryResult, StatsResult } from "./types";

/** Reference cost per token (Claude Sonnet input: $3/M tokens) */
const COST_PER_MILLION_TOKENS = 3.0;

// ─── Demo Project Credentials (read-only, public) ────────────────────────────
const DEMO_PROJECT_ID = "cml9hjzb000013aam4pn5oe5j";
const DEMO_API_KEY = "rlm_2034b97c14b5c4f4b5af8fe2818bc81f670f8116f35fb593a290dea564fc5399";
const DEMO_SERVER_URL = "https://api.snipara.com";
const DEMO_DEFAULT_QUERY = "What integrations does Snipara support?";
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
    "docs/overview.md",
    "docs/pricing.md",
    "docs/integrations.md",
    "docs/features.md",
    "docs/getting-started.md",
    "docs/api-reference.md",
    "docs/use-cases.md",
    "blog/reduce-token-costs.md",
    "blog/mcp-setup-guide.md",
  ],
  project_id: "snipara-demo",
};

const DEMO_QUERY_RESULT: ContextQueryResult = {
  sections: [
    {
      title: "Supported Tools",
      content:
        "Snipara works with all major AI coding assistants via the Model Context Protocol (MCP):\n\n" +
        "| Tool | Type | Setup Time |\n|------|------|------------|\n" +
        "| Claude Code | MCP Server | 2 min |\n| Cursor | MCP Server | 2 min |\n" +
        "| VS Code | Extension | 1 min |\n| Windsurf | MCP Server | 2 min |\n" +
        "| Python SDK | pip install | 1 min |\n\n" +
        "All integrations share the same project context, so your docs stay in sync across tools.",
      file: "docs/integrations.md",
      lines: [1, 20] as [number, number],
      relevance_score: 0.96,
      token_count: 180,
      truncated: false,
    },
    {
      title: "Context Optimization Plans",
      content:
        "Simple, transparent pricing. Start free, scale as you grow.\n\n" +
        "- **Free** — $0/mo, 100 queries, 1 project\n" +
        "- **Pro** — $19/mo, 5,000 queries, semantic + hybrid search\n" +
        "- **Team** — $49/mo, 20,000 queries, unlimited shared projects, SSO\n" +
        "- **Enterprise** — Custom pricing, unlimited queries, self-hosted option\n\n" +
        "All paid plans include a 14-day free trial with full access.",
      file: "docs/pricing.md",
      lines: [1, 30] as [number, number],
      relevance_score: 0.92,
      token_count: 150,
      truncated: false,
    },
    {
      title: "Performance Benchmarks",
      content:
        "Latest results (February 2026, tested with GPT-4o):\n\n" +
        "| Metric | Without Snipara | With Snipara | Improvement |\n" +
        "|--------|-----------------|--------------|-------------|\n" +
        "| Tokens/query | 45,681 | 3,663 | 92% reduction |\n" +
        "| Cost/query | $0.114 | $0.010 | 91% savings |\n" +
        "| Hallucination rate | ~15% | <2% | 7x reduction |",
      file: "docs/overview.md",
      lines: [15, 28] as [number, number],
      relevance_score: 0.88,
      token_count: 140,
      truncated: false,
    },
  ],
  total_tokens: 470,
  max_tokens: 6000,
  query: "What integrations does Snipara support?",
  search_mode: "hybrid",
  search_mode_downgraded: false,
  session_context_included: false,
  suggestions: [
    "What are Snipara pricing plans?",
    "How do I reduce AI token costs?",
    "How do I set up Claude Code with Snipara?",
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
