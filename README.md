# AI Rules Manager

> One extension to manage every AI assistant's rule file — Claude, Cursor, Windsurf, Copilot, Aider, Cline, and the open AGENTS.md standard.

[![Version](https://img.shields.io/visual-studio-marketplace/v/matil.ai-rules-manager)](https://marketplace.visualstudio.com/items?itemName=matil.ai-rules-manager)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/matil.ai-rules-manager)](https://marketplace.visualstudio.com/items?itemName=matil.ai-rules-manager)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/matil.ai-rules-manager)](https://marketplace.visualstudio.com/items?itemName=matil.ai-rules-manager)

If you use more than one AI coding assistant — and most devs do now — you're juggling `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`, and more. This extension gives you one place to **edit, sync, validate, and generate** all of them.

## Why

- Stop maintaining 4 nearly-identical rule files by hand.
- Write rules once → sync to every tool with one command.
- Drop in a battle-tested template for your stack in seconds.
- (Pro) Generate a rule file from a project description with AI.
- (Pro) Sync your rules across machines via cloud sync.

## Features

### Free

- 🔍 **Auto-detects** all known AI rule files in your workspace
- 📁 **Sidebar tree view** — see what's present, what's missing, jump to any file
- 🔄 **One-click sync** between tool formats (CLAUDE.md → .cursorrules etc.)
- 📚 **9 stack-specific templates** — Next.js, Django, Rails, Rust, Go, RN, monorepo, data science, generic
- ✅ **Validator** — catches embedded secrets, oversized files, missing headings
- 🎯 **Smart suggestions** based on detected stack (package.json, pyproject.toml, etc.)

### Pro ($9 one-time)

- ✨ **AI generation** from a project description (Anthropic, OpenAI, or local Ollama)
- ☁️ **Cloud sync** rule files across machines and teams
- 🕒 **Change history** — every save tracked locally, browse and restore
- 🏆 **Premium templates** — Enterprise security, React performance, more added monthly
- 👥 **Team sharing** (Team tier) — shared rule libraries

## Quick start

1. Install the extension.
2. Open any project.
3. Click the **AI Rules** icon in the activity bar.
4. Click **Create Rule File** → pick a tool → pick a template.
5. Want it for every tool? Run **AI Rules: Sync Between Tools**.

## Supported tools

| Tool | File |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules`, `.cursor/rules.md` |
| Windsurf | `.windsurfrules`, `.windsurf/rules.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| AGENTS.md (open) | `AGENTS.md` |
| Aider | `CONVENTIONS.md`, `.aider.conf.yml` |
| Cline | `.clinerules` |
| Continue | `.continue/config.json` |

## Get Pro

[devtools360.xyz/ai-rules-pro](https://devtools360.xyz/ai-rules-pro) — $9 one-time, lifetime updates.

Then run `AI Rules: Activate Pro License` and paste your key.

## Privacy

- Free tier: 100% local. No telemetry, no network calls.
- Pro: AI generation calls go to **your configured provider with your API key**. Cloud sync is opt-in and end-to-end keyed by your license.

## Repo / issues

[github.com/matil/ai-rules-manager](https://github.com/matil/ai-rules-manager)

## License

MIT
