# Agent Guide

## Purpose

This file guides AI and automated code agents working in this repo. Keep changes small, accurate, and easy for future maintainers to review.

## Tech Stack

- Vite+ via `vite-plus` and the `vp` CLI.
- React with TypeScript.
- Tailwind CSS.
- Firebase for live microsite data.
- Standalone HTML entries for each microsite.

## Core Rules

- Do not use raw hex colors in components.
- Use global design tokens from `src/index.css`.
- Do not introduce large UI frameworks.
- Prefer simple, readable solutions over new abstractions.
- Do not add dependencies without a clear need.
- Keep bundle size small.
- Preserve existing routes and content unless a behavior is clearly obsolete.

## Styling Rules

- Use CSS variables and token-based reusable classes.
- Avoid inline styles unless required for measured layout or runtime values.
- Avoid inline styles for colors.
- Atkinson Hyperlegible is the default font.
- Museo is for major headings, sparingly.
- Lato is for labels and metadata, sparingly.

## Component Guidelines

- Keep components small and composable.
- Avoid over-generalization.
- Do not add premature design-system patterns.
- Prefer semantic HTML before custom UI helpers.
- Keep page-specific behavior inside `src/features/`.

## Accessibility

- Ensure visible focus states.
- Respect `prefers-reduced-motion`.
- Maintain readable contrast.
- Preserve keyboard usability.
- Use clear headings, labels, and table semantics.

## Safe Refactoring

- Do not break `/merch/` or `/tv/`.
- Preserve current Firestore behavior unless intentionally changing it.
- Do not rewrite unrelated business logic.
- Verify meaningful changes with:

```bash
npm run build
vp check
vp test
```

- Start the dev server after UI or routing changes:

```bash
npm run dev
```

## Dependency Hygiene

- Remove confirmed unused dependencies.
- Treat dependency audit tools as starting points, not truth.
- Check scripts, config files, HTML entries, and dynamic usage before removing a package.
- Prefer native browser, React, Vite, and CSS features over new libraries.

## Vite+

Use package scripts for common work:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vite+ docs are available in `node_modules/vite-plus/docs` after dependencies are installed.
