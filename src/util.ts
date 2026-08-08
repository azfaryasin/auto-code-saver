// Pure functions only — no `import * as vscode` here on purpose.
// Keeping this vscode-free lets us unit test it with plain `node --test`
// instead of spinning up an Extension Development Host.

const PAUSE_CHARS = new Set(['\n', ';', '}', ')']);

export function isPauseChar(char: string): boolean {
  return PAUSE_CHARS.has(char);
}

export interface DelayOptions {
  adaptive: boolean;
  baseDelay: number;
  adaptiveDelay: number;
  lastChar: string;
}

export function computeDelay(options: DelayOptions): number {
  const { adaptive, baseDelay, adaptiveDelay, lastChar } = options;
  if (adaptive && isPauseChar(lastChar)) {
    return adaptiveDelay;
  }
  return baseDelay;
}

// Simple wildcard-to-regex converter for `excludePatterns`.
// Supports `*` as a multi-character wildcard. Intentionally not a full
// glob implementation — that's what `excludePatterns` + `.gitignore`
// support (via the `ignore` package) is for.
export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars
    .replace(/\*/g, '.*');                // then expand our own wildcard
  return new RegExp(`^${escaped}$|/${escaped}$|^${escaped}/`);
}

export function matchesAnyPattern(relativePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => globToRegExp(pattern).test(relativePath));
}
