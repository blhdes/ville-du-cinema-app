# Pre-Migration Terminal Guide — Ville du Cinéma

A step-by-step walkthrough to harden the **portable core** of the app before the Expo migration.
Every step maps to a concept from the Anthropic Course manual. Run each step from the Claude Code terminal.

> **Rule:** After completing each numbered step, run `/clear` or `/compact` to reset context and save tokens.

---

## STEP 0 — Ground Zero: Bootstrap Claude Code in the Project

**Manual concept:** Appendix — `/init` and `CLAUDE.md`

Open the Claude terminal inside `ville-du-cinema-app/` and run:

```
/init
```

When it generates `CLAUDE.md`, replace its contents with the following (paste it directly or ask Claude to write it):

```markdown
# Ville du Cinéma — Project Brain

## Tech Stack
- Next.js 16.1.1 (App Router) + React 19 + TypeScript 5 (strict)
- Supabase (auth + database + storage) via @supabase/ssr
- TailwindCSS v4, Lucide React icons
- next-intl v4 (FR / EN / ES)
- localforage for guest-mode offline storage

## Architecture
- `hooks/` — 4 custom hooks (useUser, useProfile, useDisplayPreferences, useUserLists)
- `lib/supabase/` — client.ts (browser), server.ts (RSC), middleware.ts (session)
- `lib/letterboxd/` — RSS validation utility
- `types/database.ts` — Single source of truth for all Supabase types
- `app/api/` — 10 API route handlers
- `messages/` — i18n translation JSON files (fr, en, es)
- `constants/` — App configuration values

## Strict Rules
- NEVER read or log .env, .env.local, or any file starting with .env
- NEVER expose Supabase keys, service role keys, or any secret
- Always run `npx tsc --noEmit` after editing any .ts or .tsx file
- Use snake_case for database fields, camelCase for TypeScript/React
- All API routes must return proper status codes and typed error responses
- Keep hooks framework-agnostic where possible (no DOM, no window, no document)
```

Then `/clear`.

---

## STEP 1 — Security Hook: Block .env Reads

**Manual concept:** Level 2 — PreToolUse Hooks (The Security Guard)

Ask Claude:

```
Create a .claude/settings.local.json file with a PreToolUse hook that blocks
any Read or Edit tool call targeting files that start with ".env".
The hook should use a simple node script at .claude/hooks/block-env.js that
checks the tool input for ".env" in the file path and exits with code 2 to block it.
```

**What you'll learn:** How hooks intercept tool calls before they execute. Exit code 2 = block the action.

Then `/clear`.

---

## STEP 2 — Quality Hook: TypeScript Check After Edits

**Manual concept:** Level 2 — PostToolUse Hooks (The Quality Inspector)

Ask Claude:

```
Add a PostToolUse hook to .claude/settings.local.json that runs after any
Edit or Write tool call on .ts or .tsx files. It should execute
"npx tsc --noEmit" and return the output. Use a script at
.claude/hooks/typecheck.js for the logic.
```

**What you'll learn:** How to auto-catch type errors the moment Claude edits a file, feeding errors back so it self-corrects.

Then `/clear`.

---

## STEP 3 — Add a `typecheck` Script to package.json

**Manual concept:** Level 1 — Direct Prompting (zero-search rule)

Give Claude the exact file and the exact change. No searching needed:

```
In package.json, add a "typecheck" script: "tsc --noEmit". Here is the current
scripts block:

"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**What you'll learn:** Direct prompting with the exact snippet costs almost zero tokens. Claude doesn't need to read anything.

Then `/clear`.

---

## STEP 4 — Run a Full TypeScript Audit

**Manual concept:** Level 1 — Direct Prompting

```
Run "npm run typecheck" and show me every error.
```

If there are errors, fix them one at a time using direct prompts like:

```
In hooks/useProfile.ts line 42, the type error says X. Fix it by doing Y.
```

**What you'll learn:** Always tell Claude *where* the error is and *what* to do. Never say "find and fix all errors" — that triggers a full codebase scan.

Then `/clear`.

---

## STEP 5 — Harden types/database.ts

**Manual concept:** Level 1 — Direct Prompting

This file is the portable foundation. Ask Claude to read it and tighten it:

```
Read types/database.ts. Then:
1. Add JSDoc comments to every exported type/interface explaining its purpose
2. Make feed_grid_columns a union type (1 | 2 | 3) everywhere, not just number
3. Ensure every API request/response type is used by at least one API route
   (list any orphaned types you find)
```

**What you'll learn:** Giving Claude a specific file + a numbered checklist keeps it focused and cheap.

Then `/clear`.

---

## STEP 6 — Abstract Storage for Portability

**Manual concept:** Level 1 — Direct Prompting

The `useUserLists` hook imports `localforage` directly. This is a browser-only dependency. Create a thin abstraction:

```
Read hooks/useUserLists.ts. Then:
1. Create a new file lib/storage.ts that exports a simple interface:
   - getItem<T>(key: string): Promise<T | null>
   - setItem<T>(key: string, value: T): Promise<void>
   - removeItem(key: string): Promise<void>
2. The default implementation should use localforage (current behavior).
3. Update hooks/useUserLists.ts to import from lib/storage.ts
   instead of directly from localforage.

Do NOT change any behavior. Just wrap the dependency.
```

**What you'll learn:** Abstraction layers make hooks portable. When we move to Expo, we swap the implementation to AsyncStorage without touching the hooks.

Then `/clear`.

---

## STEP 7 — Audit Hooks for Framework-Agnostic Portability

**Manual concept:** Level 3 — Programmatic Execution (`npx claude -p`)

Run this from your regular terminal (not the Claude interactive prompt):

```bash
npx claude -p "Read these 4 files and list every line that uses a browser-only API (window, document, localStorage, sessionStorage, navigator, DOM events). Only list file:line and the offending code. Files: hooks/useUser.ts, hooks/useProfile.ts, hooks/useDisplayPreferences.ts, hooks/useUserLists.ts"
```

**What you'll learn:** Running Claude as a one-shot script for targeted audits. The `-p` flag sends one prompt and exits — no interactive context to bloat.

If browser APIs are found in hooks (they shouldn't be — the hooks use `fetch` which is universal), fix them. If clean, move on.

Then `/clear` (if you're back in interactive mode).

---

## STEP 8 — Audit API Routes for Consistent Error Handling

**Manual concept:** Level 3 — Programmatic Execution

Run from your regular terminal:

```bash
npx claude -p "Read every file in app/api/ (all route.ts files). Check that every route: 1) Returns typed JSON error responses with { error: string }, 2) Handles 401 with a session check, 3) Has try/catch around database calls. List any route that fails these checks with the specific issue."
```

**What you'll learn:** Programmatic audits against a checklist. Claude reads only the files you specify and reports deviations. This is how you enforce consistency before porting the API layer.

Fix any issues found using direct prompts in interactive mode.

Then `/clear`.

---

## STEP 9 — Audit i18n Translation Files for Completeness

**Manual concept:** Level 3 — Programmatic Execution

```bash
npx claude -p "Read messages/fr.json, messages/en.json, and messages/es.json. Compare all three and list any keys that exist in one language but are missing in another. Output as a table: key | fr | en | es (with checkmarks or X)."
```

**What you'll learn:** Using Claude as a diff tool for structured data. Translation files are 100% portable to Expo — but only if they're complete.

Then `/clear`.

---

## STEP 10 — Install Vitest and Write Tests for Portable Hooks

**Manual concept:** Level 2 — Quality Hooks + Level 1 — Direct Prompting

First, install vitest:

```
Run: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Then ask Claude to set up the config:

```
Create a vitest.config.ts at the project root with:
- jsdom environment
- Path alias @ mapped to the project root (matching tsconfig paths)
- Include pattern: **/*.test.ts
```

Then `/clear`.

Now write tests one hook at a time (one `/clear` between each):

```
Read hooks/useDisplayPreferences.ts and types/database.ts.
Write a test file at __tests__/hooks/useDisplayPreferences.test.ts that tests:
1. Returns defaults when no profile is loaded
2. Optimistic update behavior (local state updates before API)
3. Revert on API failure
Mock fetch and useProfile. Do NOT test React rendering — test the logic only.
```

Repeat for `useUserLists` (test add/remove/duplicate detection) and `useProfile` (test fetch/update/error states).

**What you'll learn:** Testing the portable logic layer. These exact tests will run in the Expo project unchanged.

---

## STEP 11 — Validate the Build

**Manual concept:** Level 1 — Direct Prompting

```
Run "npm run build" and show me only the errors, if any.
```

Fix anything that breaks. This confirms the portable core is solid.

Then `/clear`.

---

## Checklist

After completing all steps, you should have:

- [x] `CLAUDE.md` — Project brain for every future Claude session
- [x] `.claude/hooks/block-env.js` — Security guard blocking .env reads
- [x] `.claude/hooks/typecheck.js` — Auto TypeScript check after edits
- [x] `.claude/settings.local.json` — Hook configuration
- [x] `package.json` — New `typecheck` script
- [x] `types/database.ts` — Tightened types with JSDoc
- [x] `lib/storage.ts` — Portable storage abstraction layer
- [x] `hooks/useUserLists.ts` — Updated to use storage abstraction
- [x] All API routes — Consistent error handling and 401 checks
- [x] `messages/*.json` — Complete translations across all 3 languages
- [x] `vitest.config.ts` — Test runner configuration
- [x] `__tests__/hooks/*.test.ts` — Unit tests for portable hooks
- [x] Clean `npm run build` — No errors

---

## What's Next

Once this checklist is green, the portable core is solid. The next phase is:

1. Create a new `ville-du-cinema-mobile/` Expo project
2. Copy over: `types/`, `lib/storage.ts`, `hooks/`, `messages/`, `constants/`
3. Swap `lib/storage.ts` implementation to AsyncStorage
4. Swap `lib/supabase/client.ts` to the React Native Supabase SDK
5. Build native UI components with React Native StyleSheet
6. Set up React Navigation to replace Next.js App Router

That guide will be a separate file.
