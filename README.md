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

Both displays use DEFCON34 by default. For testing or demonstrations, select an allow-listed
conference without changing the build:

```text
/defcon-microsites/merch/?conference=DEFCON33
/defcon-microsites/tv/?conference=DEFCON33
```

`conference` accepts `DEFCON33` or `DEFCON34`; normalized `33`, `34`, `DC33`, and `DC34` values also
work. `conf` is a short alias. The canonical `conference` parameter wins when both are present, and
unsupported values safely use DEFCON34. The value selects only a hardcoded Firestore conference
collection and cannot address arbitrary collections.
Slashless `/merch` and `/tv` requests are handed off to their canonical trailing-slash entries while
preserving the query string and hash.

## Merchandise Signage Operator Guide

The merchandise display is a full-screen, unattended inventory board. The production URL is:

```text
https://junctor.github.io/defcon-microsites/merch/
```

The default board shows sized and one-size products, keeps sold-out products visible, uses compact
television density, rotates readable pages every 15 seconds, reconciles Firebase every 2 minutes,
and fully reloads every 10 minutes. `IN` is available, `LOW` is limited stock, `OUT` is unavailable,
and `UNK` means the source status is not recognized. One-size products are identified only when all of
their real variants use the `OSFA` code; their displayed state comes from that variant.

Supported query parameters:

| Parameter     | Values                              | Default and bounds                                |
| ------------- | ----------------------------------- | ------------------------------------------------- |
| `conference`  | `DEFCON33`, `DEFCON34`              | `DEFCON34`; `conf` is an alias                    |
| `show`        | `all`, `sized`, `one-size`          | `all`                                             |
| `view`        | `board`, `cards`                    | `board`                                           |
| `include`     | comma-separated numeric product IDs | all source products                               |
| `exclude`     | comma-separated numeric product IDs | none; exclusion wins                              |
| `sizes`       | comma-separated source size codes   | all known sizes in source order                   |
| `hideSoldOut` | `true`, `false`                     | `false`                                           |
| `oneSize`     | `true`, `false`                     | `true`; applies when `show=all`                   |
| `density`     | `comfortable`, `compact`, `dense`   | `compact`                                         |
| `limit`       | integer                             | no extra limit; `1` through `80`                  |
| `page`        | integer                             | first page; `1` through `80`                      |
| `rotate`      | seconds                             | `15`; `0` disables, otherwise `8` through `120`   |
| `refresh`     | seconds                             | `120`; `0` disables, otherwise `15` through `600` |
| `reload`      | minutes                             | `10`; `0` disables, otherwise `2` through `1440`  |
| `debug`       | `true`, `false`                     | `false`                                           |

Filtering preserves source merchandise order. It applies `show` and one-size visibility first, then
`include`, `exclude`, `hideSoldOut`, and a global `limit`. `sizes` changes visible columns without
changing the underlying sold-out decision. Products are balanced across full-width pages: all sized
pages appear first, followed by dedicated one-size pages. `view=cards` applies to the same filtered
global candidate set. `page` selects the initial page; combine it with `rotate=0` to pin a television
to that page.

The Firebase listener remains live between reconciliations. A reconciliation replaces the existing
listener before subscribing again, so listeners do not accumulate. Cached reconciliation results do
not replace already committed inventory; the display waits for the authoritative server result and
keeps the last-known inventory on screen while syncing or offline. Failed listeners retry after 15
seconds, and overdue reconciliations resume when the tab becomes visible again. Data is marked stale
after three minutes without a server sync. A scheduled full reload first shows the branded
`REFRESHING INVENTORY` transition and then uses `window.location.reload()`.

Examples:

```text
/defcon-microsites/merch/?show=sized
/defcon-microsites/merch/?conference=DEFCON33
/defcon-microsites/merch/?show=one-size
/defcon-microsites/merch/?oneSize=false
/defcon-microsites/merch/?include=606,610,622&sizes=S,M,L,1X,2X
/defcon-microsites/merch/?hideSoldOut=true&density=comfortable&rotate=20
/defcon-microsites/merch/?show=one-size&view=cards
/defcon-microsites/merch/?page=2&rotate=0
/defcon-microsites/merch/?refresh=120&reload=10
/defcon-microsites/merch/?debug=true
```

Backward-compatible aliases are `show=apparel` for `show=sized` and `showOneSize` for `oneSize`.
When both one-size names are present, canonical `oneSize` wins. Invalid values use the documented
default. Narrow windows retain the unattended paginated board instead of switching to a scrolling
layout.

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
