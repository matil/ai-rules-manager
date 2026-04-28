import { Template, ToolId } from '../types';

const T = (
  id: string,
  name: string,
  description: string,
  stack: string[],
  isPro: boolean,
  content: string,
  tags: string[] = []
): Template => ({
  id,
  name,
  description,
  stack,
  tools: ['claude', 'agents', 'cursor', 'windsurf', 'copilot', 'aider', 'cline'],
  isPro,
  content,
  tags
});

export const TEMPLATES: Template[] = [
  T(
    'generic-strict',
    'Generic — Strict & Concise',
    'A safe, concise default that works for any project.',
    ['any'],
    false,
    `# Project Rules

## Coding style
- Match existing code patterns and naming.
- Prefer simple, direct solutions over clever abstractions.
- Add types where the language supports them.

## Output
- Be concise. Avoid filler text.
- When uncertain, ask one focused question instead of guessing.
- Show diffs/edits, not whole-file rewrites unless asked.

## Safety
- Do not modify files outside the requested scope.
- Do not add dependencies without explaining the trade-off.
- Never delete user-authored comments without confirmation.
`,
    ['default', 'safe']
  ),

  T(
    'nextjs-app-router',
    'Next.js — App Router + TypeScript',
    'Next.js 14+ with App Router, Server Components, Tailwind, shadcn/ui.',
    ['nextjs', 'typescript', 'tailwind'],
    false,
    `# Next.js Project Rules

## Stack
- Next.js 14+ with the App Router (\`/app\` directory).
- TypeScript strict mode.
- Tailwind CSS for styling. shadcn/ui for components.
- Server Components by default. Mark client components with \`"use client"\`.

## Conventions
- Place data-fetching logic inside Server Components or Route Handlers.
- Co-locate components: \`app/feature/_components/\`.
- Use \`async/await\` in Server Components for data fetching.
- Always type \`params\` and \`searchParams\` props.

## Forbidden
- Do not use \`getServerSideProps\` or \`getStaticProps\` — App Router only.
- Do not put secrets in client components.
- Do not import server-only modules in client components.

## Output style
- Show only changed files in a diff-style block.
- Reference file paths relative to repo root.
`,
    ['nextjs', 'react', 'typescript']
  ),

  T(
    'python-django',
    'Python — Django + DRF',
    'Modern Django + DRF with type hints and pytest.',
    ['python', 'django'],
    false,
    `# Django Project Rules

## Stack
- Django 5+, Django REST Framework.
- Python 3.12+, type hints required on public APIs.
- pytest + pytest-django for tests.
- Black + ruff for formatting/linting.

## Conventions
- Apps live in \`apps/<name>/\`.
- Models keep business logic in \`managers.py\` or \`services.py\` — keep models thin.
- Serializers for input validation; never trust client data.
- Use \`select_related\`/\`prefetch_related\` to avoid N+1 queries.

## Tests
- Every new view/serializer/manager method gets a test.
- Use factories (factory_boy), not fixtures.

## Forbidden
- Do not use \`null=True\` on CharField/TextField — use \`blank=True, default=""\`.
- Do not bypass migrations with raw SQL unless flagged and reviewed.
`,
    ['python', 'django', 'drf']
  ),

  T(
    'rust-tokio',
    'Rust — Async (tokio + axum)',
    'Modern async Rust web service with tokio, axum, and sqlx.',
    ['rust'],
    false,
    `# Rust Project Rules

## Stack
- tokio runtime, axum for HTTP, sqlx for Postgres.
- thiserror for library errors, anyhow for binaries.
- tracing for logging (no \`println!\` in production paths).

## Conventions
- Prefer \`?\` over \`unwrap\`. \`unwrap\` is only acceptable in tests.
- Use \`#[derive(Debug, Clone, ...)]\` consistently.
- Public APIs documented with \`///\` doc comments.
- Modules organized by feature, not by type.

## Forbidden
- No \`unsafe\` without a SAFETY comment justifying it.
- No \`.clone()\` on large data when a borrow works.
`,
    ['rust', 'async']
  ),

  T(
    'go-stdlib',
    'Go — Stdlib-first service',
    'Idiomatic Go with stdlib HTTP, context, structured logging.',
    ['go'],
    false,
    `# Go Project Rules

## Stack
- Go 1.22+. Stdlib \`net/http\` (with \`ServeMux\` enhancements).
- \`log/slog\` for structured logging.
- Use \`context.Context\` for cancellation throughout.

## Conventions
- Errors wrapped with \`fmt.Errorf("doing X: %w", err)\`.
- Small interfaces, defined where consumed (not where implemented).
- Files named after the primary type they contain.
- Test files alongside source as \`_test.go\`.

## Forbidden
- No global mutable state.
- Avoid heavy frameworks (gin, echo) unless requested.
- Do not ignore returned errors — handle or propagate.
`,
    ['go', 'golang']
  ),

  T(
    'rails-modern',
    'Rails — Modern (Hotwire + RSpec)',
    'Rails 7+ with Hotwire, Tailwind, RSpec.',
    ['ruby', 'rails'],
    false,
    `# Rails Project Rules

## Stack
- Rails 7+, Hotwire (Turbo + Stimulus).
- Tailwind via cssbundling-rails.
- RSpec + FactoryBot + Capybara.

## Conventions
- Service objects in \`app/services/\` for non-trivial logic.
- Avoid callbacks for cross-model side effects — use service objects.
- Use \`.find_each\` for batch processing.
- Strong parameters always.

## Forbidden
- No \`update_all\` without a compelling reason.
- No raw SQL strings interpolated with user input — use parameter binding.
`,
    ['ruby', 'rails']
  ),

  T(
    'monorepo-pnpm',
    'Monorepo — pnpm + Turborepo',
    'TypeScript monorepo with pnpm workspaces and Turborepo.',
    ['typescript', 'monorepo'],
    false,
    `# Monorepo Rules

## Layout
- \`apps/*\` — deployable applications.
- \`packages/*\` — shared libraries.
- Each package has its own \`package.json\`, \`tsconfig.json\`, README.

## Conventions
- Internal packages referenced via workspace protocol: \`"@repo/ui": "workspace:*"\`.
- Build with Turborepo (\`turbo run build\`).
- Use \`tsup\` or \`tshy\` for package builds.

## Forbidden
- Do not import from \`apps/*\` into \`packages/*\` (one-way dependency).
- Do not edit \`package-lock.json\` — this repo uses pnpm.
`,
    ['monorepo', 'pnpm']
  ),

  T(
    'data-science',
    'Data Science — Python + Jupyter',
    'Pandas, scikit-learn, notebooks with discipline.',
    ['python', 'data'],
    false,
    `# Data Science Project Rules

## Stack
- Python 3.12, pandas, numpy, scikit-learn, matplotlib/seaborn.
- Jupyter for exploration; production code goes in \`src/\` modules.

## Conventions
- Notebooks number-prefixed by stage: \`01_eda.ipynb\`, \`02_features.ipynb\`.
- Reusable code lives in \`src/\` and is imported into notebooks.
- Use \`pathlib.Path\` for file paths, never string concatenation.
- Random seeds set explicitly for reproducibility.

## Output
- When asked to analyze data, show: shape, head, dtypes, describe.
- Plot only after explaining what the plot will show.

## Forbidden
- Do not use \`from x import *\`.
- Do not commit notebook outputs (use \`nbstripout\`).
`,
    ['python', 'jupyter', 'ml']
  ),

  T(
    'mobile-react-native',
    'React Native — Expo',
    'Expo + TypeScript + React Navigation.',
    ['react-native', 'mobile'],
    false,
    `# React Native (Expo) Rules

## Stack
- Expo SDK (latest), React Native, TypeScript.
- React Navigation (native stack + bottom tabs).
- expo-router preferred over manual setup.

## Conventions
- File-based routing under \`app/\`.
- Platform-specific code via \`Platform.OS\` checks or \`.ios.tsx\` / \`.android.tsx\`.
- Use \`SafeAreaView\` from \`react-native-safe-area-context\`.

## Forbidden
- Do not use \`react-native link\` (deprecated in Expo).
- Do not put secrets in app code — use \`expo-secure-store\` or env vars.
`,
    ['react-native', 'expo', 'mobile']
  ),

  // PRO templates
  T(
    'pro-enterprise-security',
    'Enterprise Security & Compliance (Pro)',
    'Strict rules for regulated/enterprise environments.',
    ['enterprise'],
    true,
    `# Enterprise Security Rules

## Hard requirements
- All HTTP must be HTTPS. No \`http://\` URLs except localhost.
- All inputs validated against schemas before persistence.
- All database access via parameterized queries — never string interpolation.
- All secrets from a secrets manager; never \`.env\` in repos.

## Logging
- Never log: passwords, tokens, full credit cards, full SSNs.
- Mask PII in logs (\`user@***.com\`, \`***1234\`).

## Audit
- Sensitive operations (auth, RBAC changes, data export) emit audit events.
- Audit events are append-only, with actor, action, target, timestamp, IP.

## Dependencies
- New dependencies require: license check, last-update date, weekly downloads.
- Pinned versions in lockfile; renovate/dependabot for updates.

## Forbidden
- No \`eval\`, \`Function()\`, dynamic require/import of user-provided strings.
- No client-side authorization checks — server enforces.
- No PII in URLs or query params.
`,
    ['security', 'compliance', 'enterprise', 'pro']
  ),

  T(
    'pro-react-perf',
    'React — Performance Hardened (Pro)',
    'Battle-tested React perf rules for production apps.',
    ['react'],
    true,
    `# React Performance Rules

## Rendering
- Memoize components only when profiling shows benefit.
- Stable keys on lists — never use array index for dynamic lists.
- Lift state down, not up: keep state as local as possible.

## Data
- React Query / TanStack Query for server state. No fetch in useEffect for app data.
- Suspense + Error Boundaries around async UI sections.

## Bundle
- Dynamic import for heavy routes/components.
- Avoid moment.js — use date-fns or Temporal.
- Avoid lodash full import — use \`lodash-es\` named imports.

## Forbidden
- No \`useEffect\` to derive state from props — derive inline.
- No inline object/array literals as props for memoized children.
`,
    ['react', 'performance', 'pro']
  )
];

export class TemplateLibrary {
  list(includesPro: boolean): Template[] {
    return TEMPLATES.filter(t => includesPro || !t.isPro);
  }

  byId(id: string): Template | undefined {
    return TEMPLATES.find(t => t.id === id);
  }

  byTool(tool: ToolId, includesPro: boolean): Template[] {
    return this.list(includesPro).filter(t => t.tools.includes(tool));
  }

  search(query: string, includesPro: boolean): Template[] {
    const q = query.toLowerCase();
    return this.list(includesPro).filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.stack.some(s => s.toLowerCase().includes(q)) ||
        t.tags.some(tg => tg.toLowerCase().includes(q))
    );
  }
}
