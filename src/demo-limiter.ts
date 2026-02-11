import * as vscode from "vscode";

const DEMO_QUERY_LIMIT = 3;
const STORAGE_KEY = "snipara.demoQueryCount";

/**
 * Demo query limiter - tracks usage and enforces a 3-query limit
 * before prompting users to sign in.
 */
export class DemoLimiter {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /** Get the number of demo queries used */
  getUsedCount(): number {
    return this.context.globalState.get<number>(STORAGE_KEY, 0);
  }

  /** Get the number of demo queries remaining */
  getRemainingCount(): number {
    return Math.max(0, DEMO_QUERY_LIMIT - this.getUsedCount());
  }

  /** Check if the demo limit has been reached */
  isLimitReached(): boolean {
    return this.getUsedCount() >= DEMO_QUERY_LIMIT;
  }

  /** Increment the demo query count */
  async incrementCount(): Promise<number> {
    const current = this.getUsedCount();
    const newCount = current + 1;
    await this.context.globalState.update(STORAGE_KEY, newCount);
    return newCount;
  }

  /** Reset the demo query count (e.g., after sign-in) */
  async resetCount(): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, 0);
  }

  /** Get the demo limit */
  getLimit(): number {
    return DEMO_QUERY_LIMIT;
  }

  /**
   * Show the sign-in wall when demo limit is reached.
   * Returns true if user chose to sign in, false otherwise.
   */
  async showSignInWall(): Promise<boolean> {
    const result = await vscode.window.showInformationMessage(
      `You've used all ${DEMO_QUERY_LIMIT} demo queries! Sign in to get 30 days of Pro features free (no credit card).`,
      { modal: true },
      "Sign in with GitHub",
      "Learn more"
    );

    if (result === "Sign in with GitHub") {
      vscode.commands.executeCommand("snipara.configure");
      return true;
    } else if (result === "Learn more") {
      vscode.env.openExternal(vscode.Uri.parse("https://snipara.com/pricing"));
    }

    return false;
  }
}

let instance: DemoLimiter | undefined;

/** Initialize the demo limiter (call once during extension activation) */
export function initDemoLimiter(context: vscode.ExtensionContext): DemoLimiter {
  instance = new DemoLimiter(context);
  return instance;
}

/** Get the demo limiter instance */
export function getDemoLimiter(): DemoLimiter | undefined {
  return instance;
}
