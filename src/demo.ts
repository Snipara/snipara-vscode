import { SniparaClient } from "./client";

/**
 * Demo project constants — read-only, rate-limited server-side.
 * This allows users to experience Snipara without signing in.
 *
 * TODO: Replace with actual demo project credentials after backend setup.
 */
export const DEMO_API_KEY = "rlm_demo_public_readonly_2026";
export const DEMO_PROJECT_SLUG = "snipara-demo";
export const DEMO_SERVER_URL = "https://api.snipara.com";

/** Reference cost per token (Claude Sonnet input: $3/M tokens) */
const COST_PER_MILLION_TOKENS = 3.0;

/**
 * Create a SniparaClient configured for the public demo project.
 */
export function createDemoClient(): SniparaClient {
  return new SniparaClient({
    apiKey: DEMO_API_KEY,
    projectId: DEMO_PROJECT_SLUG,
    serverUrl: DEMO_SERVER_URL,
    maxTokens: 4000,
    searchMode: "hybrid",
  });
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
