# Juyel Hushen — Portfolio

A calm, text-first portfolio built with React, Vite, and TypeScript. A fixed desktop sidebar
accompanies the reading column; smaller screens use a top bar and disclosure menu. The default
theme is dark navy and cyan, with a light theme and five accessible accent choices.

## Features

- Intro, experience and toolbox, project list, contact form, and a compact footer
- Fixed desktop sidebar and responsive top bar with a disclosure menu on smaller screens
- Search palette with the Ctrl/Cmd+K shortcut
- Project case studies opened from `#projects/<project-id>` links
- Theme and accent preferences saved in local storage and applied before first paint
- Contact form connected to the existing backend API client
- On-demand portfolio assistant (in the header on mobile) and build-flag-gated résumé link
- Keyboard skip link, visible focus, reduced-motion support, and Bengaluru local time

## Run locally

```bash
npm ci
npm run dev
```

The contact form submits to the deployed Spring Boot API. Development uses Vite's same-origin
`/backend` proxy; production calls the configured API directly. Set
`VITE_API_BASE_URL=https://joefolio-backend.onrender.com` in `.env.local` and in the deployment
environment. See the [contact API guide](./docs/contact-email.md).

The assistant is available only when `VITE_AI_ASSISTANT_API_URL` points to a compatible service.
See the [assistant API contract](./docs/ai-assistant-api.md). Vite environment values are public;
never put provider credentials or backend secrets in them.

The shared fetch client applies request timeouts and normalizes API errors. Inter's Latin variable
font is preloaded with a metric-adjusted fallback; dates and small labels use system monospace.

## Project structure

- `src/app/` composes the page and handles active section and legacy hash navigation.
- `src/components/layout/` contains the header, theme controls, footer, and local clock.
- `src/features/about/`, `experience/`, and `skills/` provide factual career and toolbox content.
- `src/features/projects/` owns project data, the plain work list, and case-study dialogs.
- `src/features/contact/` owns the accessible form and contact API integration.
- `src/features/command-palette/` and `assistant/` implement the optional search and assistant.
- `src/styles/` defines theme tokens, global styles, and shared utilities.

See the [architecture guide](./docs/architecture.md) for the page structure, interaction
contracts, and styling conventions.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

The résumé link appears only when `public/resume.pdf` exists at build time. One social row moves
between the desktop sidebar and mobile footer; its Email link is the sole on-page destination for
the public contact address.
