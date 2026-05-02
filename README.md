# DEF CON Microsites

Standalone DEF CON microsites for conference displays and attendee-facing utility pages.

The current stack is Vite+, React, TypeScript, and Tailwind CSS. Vite+ provides the local CLI used by the package scripts.

## Getting Started

```bash
npm install
npm run dev
npm run build
npm run preview
```

Useful checks:

```bash
npm run fmt
npm run lint
vp check
vp test
```

## Pages

- `/merch/`: live merchandise availability.
- `/tv/`: live schedule display for screens.

Each page has its own HTML entry point and is included in `vite.config.ts`.
The root entry serves the microsite directory at the configured GitHub Pages base path.

## Project Structure

- `src/`: TypeScript, React components, shared utilities, and global CSS.
- `src/components/`: shared UI and status components.
- `src/features/`: page-specific microsite code.
- `src/lib/`: Firebase, dates, and conference constants.
- `src/types/`: shared TypeScript types.
- `src/index.css`: global design tokens, fonts, typography, focus styles, and reusable classes.
- `public/`: static assets copied by Vite.
- `public/fonts/`: approved local web fonts.
- `public/images/`: static image assets.
- `merch/` and `tv/`: standalone HTML entries.

## Design System

DEF CON 34 uses the Agency theme: clear, intentional, accessible, restrained, and human-first. UI should be readable and direct, with minimal animation and no effects that interfere with use.

Color rules:

- Use CSS variables from `src/index.css`.
- Do not use raw hex values in components.
- Raw hex values belong only in token definitions or unavoidable metadata.
- Avoid inline styles for colors.

Typography:

- Atkinson Hyperlegible is the default body and UI font.
- Museo is for major headings, used sparingly.
- Lato is for labels and metadata, used sparingly.

## Development Guidelines

- Prefer simple, readable components.
- Avoid unnecessary abstractions and dependencies.
- Keep bundle size small.
- Preserve existing routes and microsite behavior.
- Use visible focus states.
- Maintain readable contrast.
- Respect `prefers-reduced-motion`.
- Keep animation minimal and purposeful.

## Assets

- Fonts go in `public/fonts/`.
- Images go in `public/images/` unless a page has a specific reason to use another public path.

## Notes

- Vite builds the `merch/index.html` and `tv/index.html` entries configured in `vite.config.ts`.
- The GitHub Pages base path is `/defcon-microsites/`.
- Local dev uses the same base path, so `http://localhost:5173/` redirects to `/defcon-microsites/`.
