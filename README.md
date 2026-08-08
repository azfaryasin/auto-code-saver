<p align="center">
  <img src="icon.png" width="96" height="96" alt="Auto Code Saver logo" />
</p>

<h1 align="center">Auto Code Saver</h1>
<p align="center"><b>Smart auto-save that saves fast, not sloppy.</b></p>

---

Most auto-save extensions do one thing: wait N milliseconds after your last
keystroke, then save. That's fine, but it means saving after `x` mid-variable
name and saving after `}` at the end of a function get treated identically —
even though one is a completed thought and the other is you mid-word.

Auto Code Saver separates the two. It saves fast after natural pauses (end of line,
end of statement) and holds off while you're still typing a word — so it
feels closer to instant without ever saving something half-finished.

## Why not just use the other auto-save extension?

If you've looked at similar tools before landing here, this table is for you:

| | **Auto Code Saver** | Typical auto-save extension |
|---|---|---|
| Debounce | **Per-file**, independent timers | Usually one global timer |
| Save delay | **Adaptive** — short after `\n` `;` `}` `)`, longer mid-word | Fixed delay, always |
| `.gitignore` awareness | ✅ optional, one scoped watcher | ❌ |
| Exclude by language/pattern | ✅ | Sometimes |
| Blocks uninstall or update | **Never** | ⚠️ some do — avoid these |
| Dependencies | 1 tiny runtime dep (`ignore`), opt-in only | Varies |
| Idle CPU | ~0% (single timer, no watchers by default) | Varies |

That last row about blocking uninstall isn't hypothetical — it's a real
pattern some auto-save extensions ship. Auto Code Saver will never do that. You can
disable or remove it in two clicks, same as anything else.

## How it actually works

```
You type  →  onDidChangeTextDocument fires
          →  was the last character a natural pause? (\n ; } ))
                yes → save in ~250ms
                no  → save in ~800ms (resets if you keep typing)
          →  file saves, dirty indicator clears
```

Each open file gets its **own** timer. Switching tabs mid-type in File A
doesn't touch File B's save schedule — they're tracked independently by URI.

## Features

- ⚡ **Adaptive debounce** — short delay after a completed line/statement, longer delay mid-word
- 📄 **Per-file timers** — no shared global debounce across your open tabs
- 🚫 **Exclude by language** — skip Markdown, JSON with comments, whatever you want
- 🎯 **Exclude by pattern** — wildcard match on file paths (`*.log`, `node_modules/*`)
- 🌲 **Optional `.gitignore` respect** — never auto-save files git already ignores
- 🟢 **Status bar toggle** — one click to pause/resume, no digging through settings
- 🪶 **Zero forced dependencies** — the only runtime dependency (`ignore`) is small and only loaded if you turn on gitignore support

## Installation

Search **Auto Code Saver** in the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
and click Install — or from the command line:

```bash
code --install-extension your-publisher-name.auto-code-saver
```

No configuration needed to get started. It just works after install.

## Settings

Open Settings (`Ctrl+,`) and search "Auto Code Saver", or edit `settings.json` directly:

```jsonc
{
  "autoCodeSaver.enabled": true,
  "autoCodeSaver.delay": 800,             // ms, base debounce delay
  "autoCodeSaver.adaptiveDebounce": true, // shorter delay after \n ; } )
  "autoCodeSaver.adaptiveDelay": 250,     // ms, used on natural pauses
  "autoCodeSaver.excludeLanguages": ["markdown"],
  "autoCodeSaver.excludePatterns": ["*.log", "node_modules/*"],
  "autoCodeSaver.respectGitignore": false,
  "autoCodeSaver.showStatusBarIcon": true
}
```

| Setting | Type | Default | What it does |
|---|---|---|---|
| `autoCodeSaver.enabled` | boolean | `true` | Master on/off switch |
| `autoCodeSaver.delay` | number | `800` | Base debounce delay (ms) |
| `autoCodeSaver.adaptiveDebounce` | boolean | `true` | Enable the shorter delay on natural pauses |
| `autoCodeSaver.adaptiveDelay` | number | `250` | Delay used on natural pauses (ms) |
| `autoCodeSaver.excludeLanguages` | array | `[]` | Language IDs to skip entirely |
| `autoCodeSaver.excludePatterns` | array | `[]` | Wildcard path patterns to skip |
| `autoCodeSaver.respectGitignore` | boolean | `false` | Skip files matched by the workspace `.gitignore` |
| `autoCodeSaver.showStatusBarIcon` | boolean | `true` | Show/hide the status bar toggle |

## Commands

Open the Command Palette (`Ctrl+Shift+P`) and search:

- **Auto Code Saver: Toggle Auto-Save**
- **Auto Code Saver: Save All Dirty Files Now**

## FAQ

**Will this fight with VS Code's built-in `files.autoSave`?**
Turn off `files.autoSave` (or leave it `off`) and let Auto Code Saver handle it —
running both means you're debouncing twice for no benefit.

**Does it watch my whole filesystem?**
No. By default, zero file watchers — just one event listener and one timer
per open document. The only exception is `autoCodeSaver.respectGitignore`, which
adds a single watcher scoped to `**/.gitignore` files, and only when you turn
that setting on.

**Can it save a half-finished word?**
No — the adaptive delay only shortens the wait on natural pause characters
(`\n`, `;`, `}`, `)`). Mid-word, it always uses the full base delay.

## Contributing

Issues and PRs welcome — see the repo for the source, unit tests, and CI
setup. The debounce/exclusion logic lives in `src/util.ts` with no `vscode`
import, so it's testable with plain `node --test`, no Extension Development
Host required.

## License

MIT — see [LICENSE](LICENSE)
