import * as vscode from "vscode";
import type { RuntimeBridge } from "../runtime";

export class RuntimeStatusBar {
  private item: vscode.StatusBarItem;

  constructor(private runtime: RuntimeBridge) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99 // Just below the existing Snipara status bar item at priority 100
    );
    this.item.command = "snipara.runtimeExecuteDocker";
  }

  /**
   * Update status bar text and tooltip based on detected runtime state.
   */
  update(): void {
    const status = this.runtime.getStatus();

    if (!status.rlmInstalled) {
      this.item.text = "$(circle-slash) RLM";
      this.item.tooltip =
        "RLM Runtime not installed. Click to execute (will prompt to install).";
      this.item.backgroundColor = undefined;
    } else if (status.dockerRunning) {
      this.item.text = "$(vm-running) RLM";
      this.item.tooltip = `RLM Runtime ${status.rlmVersion ?? ""} | Docker running`;
      this.item.backgroundColor = undefined;
    } else if (status.dockerInstalled) {
      this.item.text = "$(vm-outline) RLM";
      this.item.tooltip = `RLM Runtime ${status.rlmVersion ?? ""} | Docker not running`;
      this.item.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      this.item.text = "$(terminal) RLM";
      this.item.tooltip = `RLM Runtime ${status.rlmVersion ?? ""} | Docker not installed (local only)`;
      this.item.backgroundColor = undefined;
    }

    this.item.show();
  }

  /**
   * Returns the StatusBarItem for disposal registration.
   */
  getDisposable(): vscode.Disposable {
    return this.item;
  }
}
