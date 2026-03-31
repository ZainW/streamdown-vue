# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vue 3 component library for rendering AI-streamed markdown. Community port of Vercel's React [Streamdown](https://github.com/vercel/streamdown) library.

## Commands

- **Package manager:** pnpm (never use npm or yarn)
- `pnpm build` — Vite build + vue-tsc declarations (lint errors fail the build)
- `pnpm test` — run all tests (vitest, happy-dom environment)
- `pnpm test -- -t 'test name'` — run a single test by name
- `pnpm lint` / `pnpm lint:fix` — oxlint (type-aware)
- `pnpm fmt` / `pnpm fmt:check` — oxfmt
- `pnpm typecheck` — vue-tsc type checking
- `pnpm dev` — watch mode rebuild

## Code Style

- **Formatter/linter:** oxfmt + oxlint — ESLint and Prettier are NOT used
- Single quotes, no semicolons, 100-char line width (enforced by oxfmt)
- Run `pnpm fmt` before committing

## Architecture

- `src/` — library source (Vue components, composables, utilities)
- `src/__tests__/` — vitest tests
- `playground/` — separate Vite app for local testing (own package.json, port 5199)
- `vue` and `shiki` are external peer dependencies (not bundled)
- Shiki is optional — code blocks fall back to plain `<pre><code>` without it
