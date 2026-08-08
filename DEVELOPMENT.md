# Development

Instructions for working on Auto Code Saver itself — not needed by end users, just
by you (or contributors).

## Local testing

```bash
npm install
npm run compile
```

Then press `F5` in VS Code (launch config already set up in
`.vscode/launch.json`) to open an Extension Development Host with Auto Code Saver
loaded live.

## Unit tests

Pure logic (debounce timing, glob matching) lives in `src/util.ts` with no
`vscode` import, so it's testable without a running editor:

```bash
npm test
```

## Publishing to the VS Code Marketplace

1. Create a [publisher](https://marketplace.visualstudio.com/manage) via
   `npx @vscode/vsce login <publisher-name>` (needs an Azure DevOps
   Personal Access Token with **Marketplace: Manage** scope).
2. Update `publisher` in `package.json` to your publisher id, and update the
   `repository`/`bugs`/`homepage` URLs to your actual GitHub repo.
3. Bump `version` in `package.json` and add an entry to `CHANGELOG.md`.
4. `npm run compile && npm test` — confirm everything's green.
5. `npx @vscode/vsce package` to build the `.vsix` locally and sanity-check
   it: `code --install-extension auto-code-saver-0.1.0.vsix`.
6. `npx @vscode/vsce publish` to publish directly, **or** push a `v0.1.0` git
   tag — the included GitHub Actions workflow (`.github/workflows/build.yml`)
   builds, tests, and publishes automatically if you've added a `VSCE_PAT`
   repo secret (Settings → Secrets and variables → Actions).

## Pushing to GitHub

```bash
cd auto-code-saver
git init
git add .
git commit -m "Initial commit: Auto Code Saver v0.1.0"
git branch -M main
git remote add origin https://github.com/<your-username>/auto-code-saver.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `out/`, and `*.vsix`, so the
repo stays clean.
