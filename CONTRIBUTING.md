# Contributing

## Dev setup

```sh
git clone https://github.com/matil/ai-rules-manager
cd ai-rules-manager
npm install
npm run compile
```

Open the folder in VS Code, press F5 to launch a debug Extension Host with the extension loaded.

## Building a .vsix

```sh
npx vsce package
```

## Project layout

```
src/
  extension.ts          — entry point
  commands/             — command handlers
  providers/            — tree views, custom editors
  services/             — core logic (detect, sync, templates, license, ai, history, cloud)
  types/                — shared TS types
templates/              — markdown rule templates
media/                  — icons & marketplace assets
syntaxes/               — TextMate grammar for ai-rules language
```

## Adding a new tool

1. Add an entry to `src/services/Tools.ts`.
2. Add its filename(s) to the workspace watcher pattern in `RulesDetector.ts`.
3. (Optional) Add format-specific conversion logic in `RulesSync.convert()`.

## Adding a template

Edit `src/services/TemplateLibrary.ts` — add a new `T(...)` entry to the `TEMPLATES` array.

## Issues / board

Open issues for bugs and ideas at:
https://github.com/matil/ai-rules-manager/issues

The project board lives at:
https://github.com/users/matil/projects (linked from the repo)
