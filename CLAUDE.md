# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # npm install + prisma generate + prisma migrate dev

# Development
npm run dev            # Next.js dev server with Turbopack (Windows)
npm run dev:daemon     # Same, runs in background, logs to logs.txt

# Build & run
npm run build
npm run start

# Database
npm run db:reset       # Reset SQLite DB (prisma migrate reset --force)
npx prisma studio      # Browse DB

# Testing
npm run test           # Vitest (jsdom)
npm run test -- --run src/components/chat/__tests__/  # Run a specific test directory

# Lint
npm run lint
```

The dev script requires `NODE_OPTIONS=--require ./node-compat.cjs` — this is already embedded in the npm scripts. `node-compat.cjs` removes `localStorage`/`sessionStorage` globals on the server to fix a Node.js 25+ incompatibility.

## Architecture

UIGen is a Next.js 15 (App Router) application where users describe React components in a chat interface and Claude generates them with a live preview.

### Request flow

1. User types a message → `ChatInterface` → POST `/api/chat`
2. `src/app/api/chat/route.ts` calls the AI with tool support via Vercel AI SDK (`streamText`)
3. The model calls `str_replace_editor` or `file_manager` tools to write/edit files
4. Tool calls stream back to the client and are dispatched through `FileSystemContext.handleToolCall`
5. `VirtualFileSystem` (in-memory, no disk) updates its state
6. `PreviewFrame` re-renders the live component from the virtual FS
7. On completion, if authenticated, the conversation + file state are saved to SQLite via Prisma

### Key files

| File | Role |
|---|---|
| `src/app/api/chat/route.ts` | AI streaming endpoint; tool definitions; prompt caching |
| `src/lib/provider.ts` | Returns Anthropic Claude Haiku 4.5 model, or `MockLanguageModel` when no API key |
| `src/lib/file-system.ts` | `VirtualFileSystem` class — all generated code lives here |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VirtualFileSystem; routes tool calls into it |
| `src/lib/contexts/chat-context.tsx` | Vercel AI SDK `useChat` hook; tracks anonymous work |
| `src/lib/prompts/generation.ts` | System prompt for component generation |
| `src/lib/tools/` | `str_replace_editor` and `file_manager` tool implementations |
| `src/lib/auth.ts` | JWT sessions via `jose` (HTTP-only cookie `auth-token`, 7-day expiry) |
| `src/actions/index.ts` | Server actions: `signUp`, `signIn`, `signOut`, `getUser` |
| `src/app/main-content.tsx` | Root UI: resizable panels (Chat 35% | Preview+Code 65%) |

### UI layout

`main-content.tsx` uses `react-resizable-panels` to split the screen:
- **Left panel**: `ChatInterface` (message list + Monaco editor for code view)
- **Right panel**: toggles between `PreviewFrame` (live iframe) and a `FileTree` + `CodeEditor` (Monaco)

### Data persistence

- **Authenticated users**: conversations and virtual FS state are stored as JSON columns in the `Project` model (SQLite via Prisma, generated client at `src/generated/prisma/`)
- **Anonymous users**: work is tracked in memory via `anon-work-tracker.ts` and lost on page refresh
- The home route (`/`) auto-redirects authenticated users to their most recent project or creates a new one

### AI integration

- Model: `claude-haiku-4-5` via `@ai-sdk/anthropic`
- `maxTokens: 10_000`, `maxSteps: 40` (real), `4` (mock)
- Prompt caching is enabled via Anthropic ephemeral cache headers in `route.ts`
- When `ANTHROPIC_API_KEY` is absent, `provider.ts` returns a `MockLanguageModel` that generates a static Counter/Card/Form component through a 4-step deterministic pipeline — useful for UI development without an API key

### Auth

Password-based auth with bcrypt + JWT. `verifySession()` in `src/lib/auth.ts` is the middleware-equivalent used in server actions and route handlers. Min password length is 8 characters.

### Path alias

`@/*` maps to `src/*` throughout the codebase.
