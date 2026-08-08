import * as vscode from 'vscode';
import { computeDelay, matchesAnyPattern } from './util';
import { enableGitignoreWatching, disableGitignoreWatching, isGitignored } from './gitignore';

// One timer per document (keyed by URI string) — NOT a single global timer.
// This is the main correctness/latency win over a naive implementation:
// switching between files while typing won't reset or delay unrelated saves.
const timers = new Map<string, ReturnType<typeof setTimeout>>();

let statusBarItem: vscode.StatusBarItem;
let extensionContext: vscode.ExtensionContext;

function config() {
  return vscode.workspace.getConfiguration('autoCodeSaver');
}

function isEnabled(): boolean {
  return config().get<boolean>('enabled', true);
}

function isExcluded(document: vscode.TextDocument): boolean {
  const excludeLanguages = config().get<string[]>('excludeLanguages', []);
  if (excludeLanguages.includes(document.languageId)) {
    return true;
  }

  const excludePatterns = config().get<string[]>('excludePatterns', []);
  if (excludePatterns.length > 0) {
    const relativePath = vscode.workspace.asRelativePath(document.uri, false);
    if (matchesAnyPattern(relativePath, excludePatterns)) {
      return true;
    }
  }

  if (config().get<boolean>('respectGitignore', false) && isGitignored(document)) {
    return true;
  }

  return false;
}

function scheduleSave(document: vscode.TextDocument, delay: number) {
  const key = document.uri.toString();

  const existing = timers.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    timers.delete(key);
    if (document.isDirty) {
      document.save();
    }
  }, delay);

  timers.set(key, timer);
}

function clearTimerFor(document: vscode.TextDocument) {
  const key = document.uri.toString();
  const existing = timers.get(key);
  if (existing) {
    clearTimeout(existing);
    timers.delete(key);
  }
}

function updateStatusBar() {
  if (!statusBarItem) return;

  const showIcon = config().get<boolean>('showStatusBarIcon', true);
  if (!showIcon) {
    statusBarItem.hide();
    return;
  }

  const enabled = isEnabled();
  statusBarItem.text = enabled ? '$(zap) Auto Save: On' : '$(circle-slash) Auto Save: Off';
  statusBarItem.tooltip = 'Auto Code Saver — click to toggle';
  statusBarItem.command = 'autoCodeSaver.toggle';
  statusBarItem.show();
}

function syncGitignoreWatching() {
  if (config().get<boolean>('respectGitignore', false)) {
    enableGitignoreWatching(extensionContext);
  } else {
    disableGitignoreWatching();
  }
}

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);
  updateStatusBar();
  syncGitignoreWatching();

  const changeListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (!isEnabled()) return;
    if (event.contentChanges.length === 0) return;
    if (isExcluded(event.document)) return;

    const lastChange = event.contentChanges[event.contentChanges.length - 1];
    const delay = computeDelay({
      adaptive: config().get<boolean>('adaptiveDebounce', true),
      baseDelay: config().get<number>('delay', 800),
      adaptiveDelay: config().get<number>('adaptiveDelay', 250),
      lastChar: lastChange.text.slice(-1)
    });

    scheduleSave(event.document, delay);
  });

  // Clean up if a document is saved/closed some other way (e.g. Ctrl+S)
  // so we don't fire a redundant save a moment later.
  const saveListener = vscode.workspace.onDidSaveTextDocument(clearTimerFor);
  const closeListener = vscode.workspace.onDidCloseTextDocument(clearTimerFor);

  const toggleCommand = vscode.commands.registerCommand('autoCodeSaver.toggle', async () => {
    const current = isEnabled();
    await config().update('enabled', !current, vscode.ConfigurationTarget.Global);
    updateStatusBar();
  });

  const saveAllCommand = vscode.commands.registerCommand('autoCodeSaver.saveAllNow', async () => {
    const dirtyDocs = vscode.workspace.textDocuments.filter(d => d.isDirty);
    await Promise.all(dirtyDocs.map(d => d.save()));
    vscode.window.setStatusBarMessage(`Auto Code Saver: saved ${dirtyDocs.length} file(s)`, 2000);
  });

  const configListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('autoCodeSaver.showStatusBarIcon') || event.affectsConfiguration('autoCodeSaver.enabled')) {
      updateStatusBar();
    }
    if (event.affectsConfiguration('autoCodeSaver.respectGitignore')) {
      syncGitignoreWatching();
    }
  });

  context.subscriptions.push(
    changeListener,
    saveListener,
    closeListener,
    toggleCommand,
    saveAllCommand,
    configListener
  );
}

export function deactivate() {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  timers.clear();
  disableGitignoreWatching();
}
