import * as vscode from "vscode";

const TELEMETRY_ENDPOINT = "https://api.snipara.com/api/telemetry";
const STORAGE_KEY_INSTALL_ID = "snipara.installId";
const DEMO_API_KEY_ID = "cml9hjzce00033aamfursivit";

export type TelemetryEvent =
  | "extension_activated"
  | "demo_query"
  | "demo_limit_reached"
  | "sign_in_started"
  | "sign_in_completed"
  | "sign_in_failed";

interface TelemetryPayload {
  event: TelemetryEvent;
  installId: string;
  extensionVersion: string;
  vscodeVersion: string;
  platform: string;
  timestamp: string;
  demoApiKeyId?: string;
  properties?: Record<string, unknown>;
}

/**
 * Telemetry client for tracking extension events.
 * Respects VS Code telemetry settings and uses fire-and-forget pattern.
 */
export class Telemetry {
  private context: vscode.ExtensionContext;
  private installId: string | undefined;
  private extensionVersion: string;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.extensionVersion = this.getExtensionVersion();
  }

  /** Initialize telemetry and get/create install ID */
  async initialize(): Promise<void> {
    this.installId = this.context.globalState.get<string>(STORAGE_KEY_INSTALL_ID);
    if (!this.installId) {
      this.installId = this.generateInstallId();
      await this.context.globalState.update(STORAGE_KEY_INSTALL_ID, this.installId);
    }
  }

  /** Track an event (fire-and-forget) */
  track(event: TelemetryEvent, properties?: Record<string, unknown>): void {
    // Respect VS Code telemetry settings
    const telemetryLevel = vscode.workspace
      .getConfiguration("telemetry")
      .get<string>("telemetryLevel", "all");

    if (telemetryLevel === "off") {
      return;
    }

    if (!this.installId) {
      // Initialize not called yet, skip
      return;
    }

    // Include demo API key ID for demo-related events
    const isDemoEvent = event.startsWith("demo_");

    const payload: TelemetryPayload = {
      event,
      installId: this.installId,
      extensionVersion: this.extensionVersion,
      vscodeVersion: vscode.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      ...(isDemoEvent && { demoApiKeyId: DEMO_API_KEY_ID }),
      properties,
    };

    // Fire-and-forget: don't await, don't block
    this.send(payload).catch(() => {
      // Silent failure - telemetry should never affect user experience
    });
  }

  /** Get the anonymous install ID */
  getInstallId(): string | undefined {
    return this.installId;
  }

  private async send(payload: TelemetryPayload): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(TELEMETRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private generateInstallId(): string {
    // Generate a simple UUID-like ID
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 32; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        id += "-";
      }
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  private getExtensionVersion(): string {
    const extension = vscode.extensions.getExtension("snipara.snipara");
    return extension?.packageJSON?.version || "unknown";
  }
}

let instance: Telemetry | undefined;

/** Initialize telemetry (call once during extension activation) */
export async function initTelemetry(context: vscode.ExtensionContext): Promise<Telemetry> {
  instance = new Telemetry(context);
  await instance.initialize();
  return instance;
}

/** Get the telemetry instance */
export function getTelemetry(): Telemetry | undefined {
  return instance;
}

/** Track an event (convenience function) */
export function trackEvent(event: TelemetryEvent, properties?: Record<string, unknown>): void {
  instance?.track(event, properties);
}
