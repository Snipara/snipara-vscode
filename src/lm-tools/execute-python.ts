import * as vscode from "vscode";
import type { RuntimeBridge } from "../runtime";

interface ExecutePythonInput {
  code: string;
  docker?: boolean;
}

export class ExecutePythonTool
  implements vscode.LanguageModelTool<ExecutePythonInput>
{
  constructor(private runtime: RuntimeBridge) {}

  async invoke(
    options: vscode.LanguageModelToolInvocationOptions<ExecutePythonInput>,
    _token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const status = this.runtime.getStatus();

    if (!status.rlmInstalled) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          "RLM Runtime is not installed. Install with: pip install rlm-runtime[all]"
        ),
      ]);
    }

    const useDocker = options.input.docker ?? true;
    if (useDocker && !status.dockerRunning) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          "Docker is not running. Start Docker for isolated execution, or set docker=false for local execution."
        ),
      ]);
    }

    try {
      const result = await this.runtime.runCommand(options.input.code, {
        docker: useDocker,
      });

      const output = result.stdout || result.stderr || "(no output)";
      const statusLine =
        result.exitCode === 0
          ? `Execution succeeded (${(result.durationMs / 1000).toFixed(1)}s)`
          : `Execution failed with exit code ${result.exitCode} (${(result.durationMs / 1000).toFixed(1)}s)`;

      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(`${statusLine}\n\n${output}`),
      ]);
    } catch (error) {
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(
          `Runtime error: ${error instanceof Error ? error.message : "Unknown error"}`
        ),
      ]);
    }
  }
}
