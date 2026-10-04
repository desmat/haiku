# AGENTS.md

Guidance for coding agents working in this repository.

## Project Snapshot

This is a Next.js 14 App Router app for AI-generated haiku, generative art, and daily Haikudle puzzles.

- Routes and API handlers live under `app/`.
- Shared UI lives in `app/_components/`; client-side Zustand hooks live in `app/_hooks/`.
- Server/domain logic lives in `services/`.
- Redis-backed persistence is wired through `services/stores/redis.ts`; sample fallback data is in `services/stores/samples.ts`.
- Shared data shapes live in `types/`.
- Utility helpers live in `utils/`.

The app uses TypeScript, React, Tailwind CSS, Zustand, Upstash Redis, Vercel Blob/Analytics, and OpenAI.

## Commands

Use npm unless the user asks otherwise.

```bash
npm run dev
npm run build
npm run lint
npm run test:e2e
npm run test:e2e:headed
npm start
```

The dev server defaults to `http://localhost:3000`.

## Local Development Notes

- Environment variables are expected in `.env.local`; do not commit secrets or paste secret values into logs, docs, or PR text.
- `OPENAI_API_KEY=DEBUG` enables local fake OpenAI responses in `services/openai.ts`.
- Some flows depend on Redis, Vercel Blob, Twitter/X credentials, OpenAI, or webhook configuration. Prefer debug/sample paths when possible.
- `EXPERIENCE_MODE` switches behavior between haiku, showcase, and Haikudle modes. Check mode-specific branches before changing routing or UI assumptions.
- Use `localhost` rather than `127.0.0.1` when manually checking app behavior. The app derives a subdomain from the request host, and `127.0.0.1` can be misread as a subdomain/album.

## Code Style

- Prefer existing patterns over new abstractions. This codebase is intentionally direct.
- Use the `@/*` path alias from `tsconfig.json` for internal imports.
- Keep server logic in `services/` and route request/response handling in `app/api/**/route.ts`.
- Mark interactive React components with `'use client'`; keep server pages/components server-side when they only fetch and render.
- Preserve the current Tailwind-first styling approach and existing responsive/orientation utilities in `tailwind.config.js`.
- Keep comments sparse and useful. There are many diagnostic `console.log` calls already; avoid adding noisy logs unless debugging requires them.

## Testing And Verification

For most changes:

1. Run `npm run lint` for static checks.
2. Run `npm run build` when touching routing, server components, API handlers, config, or types.
3. Run `npm run test:e2e` for the Playwright smoke test when changing page rendering, routing, or client behavior.
4. Run `npm run test:e2e:headed` when you need to watch the same smoke test in Chromium with slow motion and a short pause at the end.

The Playwright config starts Next on port `3017` in `haiku` mode. It binds the server to `127.0.0.1` but navigates to `http://localhost:3017` so host-derived app behavior matches normal local usage.

The smoke test checks that the front page loads a haiku with three visible lines, has a CSS background image, and emits no browser console warnings/errors or uncaught page errors.

If a command cannot run because required local services, secrets, browser permissions, or sandbox network/listen permissions are missing, note that clearly in the final response.

## Safety

- Do not overwrite `.env.local` or production-looking data files.
- Be careful with admin, backup, restore, daily haiku, and daily Haikudle paths. They can affect persistent data.
- Avoid destructive data-store changes unless explicitly requested.
- Do not change generated assets or dependency lockfiles unless the task calls for it.
