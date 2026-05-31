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

    if (!status.sandboxInstalled) {
      this.item.text = "$(circle-slash) Sandbox";
      this.item.tooltip =
        "Snipara Sandbox is not installed. Click to execute (will prompt to install).";
      this.item.backgroundColor = undefined;
    } else if (status.dockerRunning) {
      this.item.text = "$(vm-running) Sandbox";
      this.item.tooltip = `Snipara Sandbox ${status.sandboxVersion ?? ""} | Docker running`;
      this.item.backgroundColor = undefined;
    } else if (status.dockerInstalled) {
      this.item.text = "$(vm-outline) Sandbox";
      this.item.tooltip = `Snipara Sandbox ${status.sandboxVersion ?? ""} | Docker not running`;
      this.item.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      this.item.text = "$(terminal) Sandbox";
      this.item.tooltip = `Snipara Sandbox ${status.sandboxVersion ?? ""} | Docker not installed (local only)`;
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
