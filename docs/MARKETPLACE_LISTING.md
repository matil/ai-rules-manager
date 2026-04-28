# Marketplace listing copy

Use this content when filling out the publisher portal at marketplace.visualstudio.com/manage.

---

## Display name (max 50 chars)

`AI Rules Manager — Claude, Cursor, Windsurf, Copilot`

## Short description (max 200 chars)

`Manage all your AI assistant rule files in one place. Edit, sync, and generate CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, copilot-instructions, and more.`

## Categories

- Other
- Snippets
- Education

## Tags (search keywords — pick the strongest 15)

```
ai
claude
claude.md
cursor
cursorrules
windsurf
copilot
agents.md
agent
mcp
anthropic
openai
rules
prompt
system-prompt
```

## Long description (markdown — what shows on listing page)

(Use the full README.md — Marketplace pulls it automatically when set in package.json.)

---

## Launch posts

### Show HN

**Title:** `Show HN: AI Rules Manager – one VS Code extension for every AI assistant's rules`

**Body:**
```
I kept maintaining nearly-identical rule files for Claude, Cursor, Windsurf, and Copilot — CLAUDE.md, .cursorrules, .windsurfrules, .github/copilot-instructions.md, AGENTS.md. Same content, slightly different formats.

Built a small VS Code extension to handle all of them in one place: detect what's in the workspace, edit/preview, and one-click sync the same content to every tool's expected location. Free, MIT licensed.

There are 9 stack-specific templates (Next.js, Django, Rails, Rust, Go, RN, monorepo, etc.) and a validator that catches common issues — embedded API keys, oversized files, structural problems.

Pro tier ($9 one-time) adds AI generation (your own Anthropic/OpenAI key, or local Ollama), cloud sync across machines, change history, and a couple premium templates.

Marketplace: https://marketplace.visualstudio.com/items?itemName=matil.ai-rules-manager
GitHub: https://github.com/matil/ai-rules-manager

Curious what other tools you'd want supported, and what conventions you've found useful in your own rule files.
```

### r/vscode

**Title:** `[Free + Pro] AI Rules Manager — keep CLAUDE.md / .cursorrules / .windsurfrules / copilot-instructions in sync`

**Body:**
```
If you use more than one AI assistant, you've probably noticed they all want their own rules file. I made a free extension that detects all of them in your workspace, lets you edit them in one place, and syncs the same content to every tool's expected location with one command.

Free features: detect, edit, sync, 9 stack templates, validator (catches embedded API keys etc).
Pro ($9 one-time): AI generation from a project description, cloud sync across machines, change history, premium templates.

Open to feedback, especially on which tools to support next (Cody? Continue.dev? Aider?).

[Marketplace link]
```

### r/ChatGPTCoding / r/cursor / r/ClaudeAI

Same body, slightly tweaked headline mentioning the relevant tool.

### Product Hunt

**Tagline:** `One file editor for every AI assistant's rules`

**First comment:**
```
Hi PH 👋

I kept duplicating ~80% of the same content into CLAUDE.md, .cursorrules, .windsurfrules, and copilot-instructions.md. Forgot to update one. AI assistant gave inconsistent advice. Wasted hours.

Built this to fix that. Detect → edit → one-click sync. There are 9 stack templates so you don't start from scratch, and a validator that catches things like embedded API keys before you commit them.

Pro tier ($9 one-time, no subscription) adds AI generation, cloud sync, and history — but the free tier is fully usable on its own.

Happy to answer questions or take feature requests!
```

---

## Demo GIF script (10–15s loop)

1. Open VS Code with a Next.js project.
2. Click AI Rules sidebar icon.
3. See "No rule files yet" → click "Create Rule File".
4. Pick "Claude Code" → pick "Next.js — App Router" template.
5. CLAUDE.md opens with the populated template.
6. Cmd+Shift+P → "AI Rules: Sync Between Tools" → check Cursor, Windsurf, Copilot → confirm.
7. Sidebar shows all 4 files now present.
8. End on toast: "Synced to 3 tool(s)."

Record at 1280x800, export as GIF (≤ 5 MB) or MP4. Use peek.fyi or kap.app.
