import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPauseChar, computeDelay, globToRegExp, matchesAnyPattern } from '../util';

test('isPauseChar recognizes natural pause characters', () => {
  assert.equal(isPauseChar('\n'), true);
  assert.equal(isPauseChar(';'), true);
  assert.equal(isPauseChar('}'), true);
  assert.equal(isPauseChar(')'), true);
  assert.equal(isPauseChar('a'), false);
  assert.equal(isPauseChar(''), false);
});

test('computeDelay uses adaptiveDelay on a pause char when adaptive is on', () => {
  const delay = computeDelay({ adaptive: true, baseDelay: 800, adaptiveDelay: 250, lastChar: '\n' });
  assert.equal(delay, 250);
});

test('computeDelay uses baseDelay mid-word even when adaptive is on', () => {
  const delay = computeDelay({ adaptive: true, baseDelay: 800, adaptiveDelay: 250, lastChar: 'x' });
  assert.equal(delay, 800);
});

test('computeDelay ignores pause chars when adaptive is off', () => {
  const delay = computeDelay({ adaptive: false, baseDelay: 800, adaptiveDelay: 250, lastChar: '\n' });
  assert.equal(delay, 800);
});

test('globToRegExp matches simple extension wildcards', () => {
  const re = globToRegExp('*.log');
  assert.equal(re.test('debug.log'), true);
  assert.equal(re.test('logs/debug.log'), true);
  assert.equal(re.test('debug.logger'), false);
});

test('globToRegExp matches directory-style patterns', () => {
  const re = globToRegExp('node_modules/*');
  assert.equal(re.test('node_modules/foo/index.js'), true);
  assert.equal(re.test('src/node_modules_backup/index.js'), false);
});

test('matchesAnyPattern returns true if any pattern matches', () => {
  assert.equal(matchesAnyPattern('build/output.log', ['*.tmp', '*.log']), true);
  assert.equal(matchesAnyPattern('src/index.ts', ['*.tmp', '*.log']), false);
});
