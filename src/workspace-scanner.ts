import * as vscode from "vscode";

export interface WorkspaceScanResult {
  fileCount: number;
  totalSizeBytes: number;
  estimatedTokens: number;
  compressedTokens: number;
  samplePaths: string[];
}

export interface WorkspaceActivationDocument {
  path: string;
  content: string;
  sizeBytes: number;
}

export interface WorkspaceActivationCorpus {
  documents: WorkspaceActivationDocument[];
  totalSizeBytes: number;
  estimatedTokens: number;
  skippedFiles: number;
}

const MAX_ACTIVATION_FILES = 24;
const MAX_FILE_CHARS = 12000;
const MAX_TOTAL_CHARS = 80000;

const ROOT_PATTERNS = [
  "README",
  "README.*",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "SUPPORT.md",
  "package.json",
  "pyproject.toml",
  "pnpm-workspace.yaml",
  "turbo.json",
];

const DOC_PATTERNS = [
  "docs/**/*.{md,mdx,txt}",
  ".github/**/*.{md,mdx,txt}",
  ".cursor/**/*.{md,mdx,txt}",
  "resources/**/*.{md,mdx,txt}",
];

const EXCLUDE_PATTERN =
  "**/{node_modules,dist,out,build,coverage,.git,.next,.turbo,.vscode-test}/**";

/**
 * Scan workspace for documentation files (.md, .mdx, .txt).
 * Lightweight: uses findFiles + stat only, does NOT read file contents.
 */
export async function scanWorkspaceForDocs(): Promise<WorkspaceScanResult | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }

  const files = await vscode.workspace.findFiles("**/*.{md,mdx,txt}", EXCLUDE_PATTERN, 1000);

  if (files.length === 0) {
    return null;
  }

  let totalSizeBytes = 0;
  const samplePaths: string[] = [];
  for (const file of files) {
    try {
      const stat = await vscode.workspace.fs.stat(file);
      totalSizeBytes += stat.size;
      if (samplePaths.length < 5) {
        samplePaths.push(vscode.workspace.asRelativePath(file, false));
      }
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
    samplePaths,
  };
}

export async function collectWorkspaceActivationCorpus(): Promise<WorkspaceActivationCorpus | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }

  const seen = new Set<string>();
  const orderedUris: vscode.Uri[] = [];

  for (const pattern of ROOT_PATTERNS) {
    const matches = await vscode.workspace.findFiles(pattern, EXCLUDE_PATTERN, 20);
    addUniqueUris(orderedUris, seen, matches);
  }

  for (const pattern of DOC_PATTERNS) {
    const matches = await vscode.workspace.findFiles(pattern, EXCLUDE_PATTERN, 200);
    addUniqueUris(orderedUris, seen, matches);
  }

  if (orderedUris.length === 0) {
    return null;
  }

  const documents: WorkspaceActivationDocument[] = [];
  let totalChars = 0;
  let totalSizeBytes = 0;
  let skippedFiles = 0;

  for (const uri of orderedUris) {
    if (documents.length >= MAX_ACTIVATION_FILES || totalChars >= MAX_TOTAL_CHARS) {
      skippedFiles++;
      continue;
    }

    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const raw = Buffer.from(bytes).toString("utf-8");
      const remainingChars = MAX_TOTAL_CHARS - totalChars;
      const content = raw.slice(0, Math.min(MAX_FILE_CHARS, remainingChars));
      if (!content.trim()) {
        skippedFiles++;
        continue;
      }

      documents.push({
        path: vscode.workspace.asRelativePath(uri, false),
        content,
        sizeBytes: bytes.byteLength,
      });
      totalChars += content.length;
      totalSizeBytes += bytes.byteLength;
    } catch {
      skippedFiles++;
    }
  }

  if (documents.length === 0) {
    return null;
  }

  return {
    documents,
    totalSizeBytes,
    estimatedTokens: Math.ceil(totalChars / 4),
    skippedFiles,
  };
}

function addUniqueUris(target: vscode.Uri[], seen: Set<string>, uris: vscode.Uri[]): void {
  for (const uri of uris) {
    if (seen.has(uri.toString())) {
      continue;
    }
    seen.add(uri.toString());
    target.push(uri);
  }
}
