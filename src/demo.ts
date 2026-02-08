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
  files_loaded: 18,
  total_lines: 6_240,
  total_characters: 487_000,
  sections: 86,
  files: [
    "docs/integrations.md",
    "docs/pricing.md",
    "docs/hooks-automations.md",
    "blog/cursor-mcp-setup.md",
    "blog/reduce-token-costs.md",
  ],
  project_id: "snipara-demo",
};

const DEMO_QUERY_RESULT: ContextQueryResult = {
  sections: [
    {
      title: "Supported Integrations",
      content:
        "Snipara integrates with all major AI coding tools via the Model Context Protocol (MCP):\n\n" +
        "- **Claude Code** — Add Snipara as an MCP server in `~/.claude/claude_desktop_config.json`\n" +
        "- **VS Code Copilot** — Language Model Tools appear natively in Copilot's Agent mode\n" +
        "- **Cursor** — Configure as MCP server in Cursor settings for inline context\n" +
        "- **Windsurf** — Full MCP support with automatic tool discovery\n" +
        "- **REST API** — Direct HTTP access for custom integrations and workflows\n\n" +
        "All integrations share the same project context, so your docs stay in sync across tools.",
      file: "docs/integrations.md",
      lines: [1, 28] as [number, number],
      relevance_score: 0.96,
      token_count: 285,
      truncated: false,
    },
    {
      title: "Pricing Plans",
      content:
        "Snipara offers flexible pricing for individuals and teams:\n\n" +
        "- **Free** — 1 project, 10K tokens/month, community support\n" +
        "- **Pro ($19/mo)** — Unlimited projects, 500K tokens/month, priority support, hooks & automations\n" +
        "- **Team ($49/seat/mo)** — Everything in Pro + shared projects, SSO, audit logs, dedicated support\n" +
        "- **Enterprise** — Custom limits, on-prem deployment, SLA, dedicated account manager\n\n" +
        "All paid plans include a 30-day free trial with no credit card required.",
      file: "docs/pricing.md",
      lines: [12, 35] as [number, number],
      relevance_score: 0.88,
      token_count: 248,
      truncated: false,
    },
    {
      title: "Hooks & Automations",
      content:
        "Automate your documentation workflow with Snipara hooks:\n\n" +
        "- **on-commit** — Re-index docs automatically when you push to main\n" +
        "- **on-pr** — Generate context summaries for pull request reviews\n" +
        "- **scheduled** — Daily/weekly re-sync for external docs (Notion, Confluence)\n" +
        "- **webhooks** — Trigger custom workflows when docs change\n\n" +
        "Configure hooks via the dashboard or the `snipara.yaml` config file in your repo.",
      file: "docs/hooks-automations.md",
      lines: [1, 24] as [number, number],
      relevance_score: 0.82,
      token_count: 196,
      truncated: false,
    },
  ],
  total_tokens: 729,
  max_tokens: 4000,
  query: "What integrations does Snipara support?",
  search_mode: "hybrid",
  search_mode_downgraded: false,
  session_context_included: false,
  suggestions: [
    "What are Snipara's pricing plans?",
    "How do hooks and automations work?",
    "How do I get started with Snipara?",
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
          max_tokens: 4000,
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
