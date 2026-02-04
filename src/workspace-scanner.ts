import * as vscode from "vscode";

export interface WorkspaceScanResult {
  fileCount: number;
  totalSizeBytes: number;
  estimatedTokens: number;
  compressedTokens: number;
}

/**
 * Scan workspace for documentation files (.md, .mdx, .txt).
 * Lightweight: uses findFiles + stat only, does NOT read file contents.
 */
export async function scanWorkspaceForDocs(): Promise<WorkspaceScanResult | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }

  const files = await vscode.workspace.findFiles(
    "**/*.{md,mdx,txt}",
    "**/node_modules/**",
    1000
  );

  if (files.length === 0) {
    return null;
  }

  let totalSizeBytes = 0;
  for (const file of files) {
    try {
      const stat = await vscode.workspace.fs.stat(file);
      totalSizeBytes += stat.size;
    } catch {
      // Skip files that can't be stat'd
    }
  }

  const estimatedTokens = Math.round(totalSizeBytes / 4);
  const compressedTokens = Math.round(estimatedTokens * 0.01);

  return {
    fileCount: files.length,
    totalSizeBytes,
    estimatedTokens,
    compressedTokens,
  };
}
