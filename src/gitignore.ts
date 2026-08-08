import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore, { Ignore } from 'ignore';

// One `ignore` instance per workspace folder, keyed by folder URI string.
// Only built/watched when autoCodeSaver.respectGitignore is enabled — this is
// the one place Auto Code Saver uses a file watcher, and it's scoped to a single
// filename pattern, not general-purpose file watching.
const ignoreInstances = new Map<string, Ignore>();
let gitignoreWatcher: vscode.FileSystemWatcher | undefined;

function loadGitignore(folder: vscode.WorkspaceFolder) {
  const gitignorePath = path.join(folder.uri.fsPath, '.gitignore');
  const key = folder.uri.toString();

  try {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    ignoreInstances.set(key, ignore().add(content));
  } catch {
    // No .gitignore in this folder — treat as "nothing ignored".
    ignoreInstances.delete(key);
  }
}

function loadAllGitignores() {
  ignoreInstances.clear();
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    loadGitignore(folder);
  }
}

export function enableGitignoreWatching(context: vscode.ExtensionContext) {
  loadAllGitignores();

  if (!gitignoreWatcher) {
    gitignoreWatcher = vscode.workspace.createFileSystemWatcher('**/.gitignore');
    gitignoreWatcher.onDidChange(() => loadAllGitignores());
    gitignoreWatcher.onDidCreate(() => loadAllGitignores());
    gitignoreWatcher.onDidDelete(() => loadAllGitignores());
    context.subscriptions.push(gitignoreWatcher);
  }

  const folderListener = vscode.workspace.onDidChangeWorkspaceFolders(() => loadAllGitignores());
  context.subscriptions.push(folderListener);
}

export function disableGitignoreWatching() {
  ignoreInstances.clear();
  if (gitignoreWatcher) {
    gitignoreWatcher.dispose();
    gitignoreWatcher = undefined;
  }
}

export function isGitignored(document: vscode.TextDocument): boolean {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return false;

  const ig = ignoreInstances.get(folder.uri.toString());
  if (!ig) return false;

  const relativePath = path.relative(folder.uri.fsPath, document.uri.fsPath).split(path.sep).join('/');
  if (!relativePath || relativePath.startsWith('..')) return false;

  return ig.ignores(relativePath);
}
