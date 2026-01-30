import * as vscode from "vscode";
import { execFile, spawn } from "child_process";
import type { RuntimeStatus, RuntimeExecutionResult } from "./types";

export class RuntimeBridge {
  private status: RuntimeStatus = {
    rlmInstalled: false,
    rlmVersion: null,
    dockerInstalled: false,
    dockerRunning: false,
  };
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  getStatus(): RuntimeStatus {
    return { ...this.status };
  }

  /**
   * Detect rlm CLI and Docker availability.
   * Called once on activation, result cached in this.status.
   */
  async detect(): Promise<RuntimeStatus> {
    // Check rlm --version
    this.status.rlmInstalled = false;
    this.status.rlmVersion = null;
    try {
      const rlmOut = await this.exec("rlm", ["--version"]);
      if (rlmOut.exitCode === 0 && rlmOut.stdout.trim()) {
        this.status.rlmInstalled = true;
        this.status.rlmVersion = rlmOut.stdout.trim();
      }
    } catch {
      // rlm not found
    }

    // Check docker --version
    this.status.dockerInstalled = false;
    this.status.dockerRunning = false;
    try {
      const dockerVer = await this.exec("docker", ["--version"]);
      if (dockerVer.exitCode === 0) {
        this.status.dockerInstalled = true;
        // Check if Docker daemon is running
        const dockerInfo = await this.exec("docker", ["info"], 5000);
        this.status.dockerRunning = dockerInfo.exitCode === 0;
      }
    } catch {
      // docker not found
    }

    return { ...this.status };
  }

  /**
   * Execute `rlm run` with optional Docker isolation.
   * Streams output to the OutputChannel in real-time.
   */
  async runCommand(
    args: string,
    options: { docker?: boolean; cwd?: string } = {}
  ): Promise<RuntimeExecutionResult> {
    const cmdArgs = ["run"];
    if (options.docker) {
      cmdArgs.push("--env", "docker");
    }
    cmdArgs.push(args);

    this.outputChannel.show(true);
    this.outputChannel.appendLine(`\n${"=".repeat(60)}`);
    this.outputChannel.appendLine(
      `[${new Date().toISOString()}] rlm ${cmdArgs.join(" ")}`
    );
    this.outputChannel.appendLine(`${"=".repeat(60)}\n`);

    return this.execStreaming("rlm", cmdArgs, options.cwd);
  }

  /**
   * Execute `rlm logs` and return output.
   */
  async viewLogs(tailCount?: number): Promise<RuntimeExecutionResult> {
    const args = ["logs"];
    if (tailCount) {
      args.push("--tail", String(tailCount));
    }
    return this.exec("rlm", args);
  }

  /**
   * Launch `rlm visualize` (non-blocking, opens Streamlit).
   */
  launchVisualizer(): void {
    this.outputChannel.show(true);
    this.outputChannel.appendLine(
      `\n[${new Date().toISOString()}] Launching: rlm visualize`
    );
    this.outputChannel.appendLine(
      "Dashboard will open at http://localhost:8501\n"
    );

    const child = spawn("rlm", ["visualize"], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  }

  /**
   * Low-level exec helper. Collects stdout/stderr, resolves on exit.
   * Never throws — always resolves with an exit code.
   */
  private exec(
    cmd: string,
    args: string[],
    timeoutMs: number = 30000
  ): Promise<RuntimeExecutionResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      execFile(
        cmd,
        args,
        { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          let exitCode = 0;
          if (error) {
            // execFile provides exit status on error.code (number) or ENOENT (string)
            const status = (error as NodeJS.ErrnoException & { status?: number })
              .status;
            exitCode = typeof status === "number" ? status : 1;
          }
          resolve({
            exitCode,
            stdout: stdout ?? "",
            stderr: stderr ?? "",
            durationMs: Date.now() - start,
          });
        }
      );
    });
  }

  /**
   * Streaming exec that pipes to outputChannel line-by-line.
   * Never throws — always resolves with an exit code.
   */
  private execStreaming(
    cmd: string,
    args: string[],
    cwd?: string
  ): Promise<RuntimeExecutionResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      let stdout = "";
      let stderr = "";

      const child = spawn(cmd, args, { cwd });

      child.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        this.outputChannel.append(text);
      });

      child.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        this.outputChannel.append(text);
      });

      child.on("close", (code: number | null) => {
        const duration = Date.now() - start;
        this.outputChannel.appendLine(
          `\n[Completed in ${(duration / 1000).toFixed(1)}s with exit code ${code ?? "unknown"}]`
        );
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
          durationMs: duration,
        });
      });

      child.on("error", (err: Error) => {
        const duration = Date.now() - start;
        this.outputChannel.appendLine(`\n[Error: ${err.message}]`);
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + err.message,
          durationMs: duration,
        });
      });
    });
  }
}
