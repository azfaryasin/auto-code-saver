# Changelog

All notable changes to Auto Code Saver are documented here.

## [0.1.0] — Unreleased

### Added
- Per-document debounced auto-save (independent timer per file, not one global timer)
- Adaptive debounce: shorter delay after natural pause characters (`\n`, `;`, `}`, `)`)
- Status bar toggle
- `Auto Code Saver: Save All Dirty Files Now` command
- Exclude by language ID or wildcard file pattern
- Optional `.gitignore`-aware exclusion (`autoCodeSaver.respectGitignore`)
- Unit tests for debounce/exclusion logic
