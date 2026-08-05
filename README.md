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
work. Unsupported values safely use DEFCON34. The value selects only a hardcoded Firestore conference
collection and cannot address arbitrary collections.
Slashless `/merch` and `/tv` requests are handed off to their canonical trailing-slash entries while
preserving the query string and hash.

## Merchandise Display Operator Guide

The production entry is `https://junctor.github.io/defcon-microsites/merch/`. Operators should only
need these common deployment URLs:

```text
/defcon-microsites/merch/
/defcon-microsites/merch/?conference=DEFCON33
/defcon-microsites/merch/?view=rotating
/defcon-microsites/merch/?view=full
/defcon-microsites/merch/?view=rotating&showOSFA=false
/defcon-microsites/merch/?view=rotating&showSized=false
```

With no `view`, the page uses a compact card list built for phones and tablets. `view=rotating`
selects the paged display and rotates every 15 seconds. `view=full` shows the complete inventory at
once and automatically becomes dense enough to fit. On large landscape displays, the full view gives
three fifths of the board to the sized matrix and splits OSFA products into two contiguous columns in
the remaining space. Rotating pages give each product group the full board width, with two balanced
OSFA columns where space permits. If either `showSized=false` or `showOSFA=false` is set, the remaining
group uses the full width. All three views share footer navigation for Compact List, Rotating Pages,
and Full Inventory.

Every mode keeps sold-out products visible, reconciles Firebase every 2 minutes, and fully reloads
every 10 minutes. `IN` is available, `LOW` is limited stock, `OUT` is unavailable, and `UNK` means the
source status is not recognized. One-size products are identified only when all their real variants
use the `OSFA` code.

### Merchandise configuration

| Parameter    | Values                 | Default and bounds                       |
| ------------ | ---------------------- | ---------------------------------------- |
| `conference` | `DEFCON33`, `DEFCON34` | `DEFCON34`                               |
| `view`       | `rotating`, `full`     | compact phone/tablet list                |
| `showSized`  | `true`, `false`        | `true`                                   |
| `showOSFA`   | `true`, `false`        | `true`                                   |
| `page`       | integer                | first rotating page; `1` through `80`    |
| `rotate`     | seconds                | rotating: `15`; `0` or `8` through `120` |

Product order and sizes always follow the inventory source, and sold-out products remain visible.
Rotating pages balance each group independently. `page` selects the initial rotating page; combine it
with `rotate=0` to pin the display to that page.

The Firebase listener remains live between reconciliations. A reconciliation replaces the existing
listener before subscribing again, so listeners do not accumulate. Cached reconciliation results do
not replace already committed inventory; the display waits for the authoritative server result and
keeps the last-known inventory on screen while syncing or offline. Failed listeners retry after 15
seconds, and overdue reconciliations resume when the tab becomes visible again. Data is marked stale
after three minutes without a server sync. A scheduled full reload first shows the branded
`REFRESHING INVENTORY` transition and then uses `window.location.reload()`.

Examples:

```text
/defcon-microsites/merch/?view=rotating&rotate=20
/defcon-microsites/merch/?view=rotating&page=2&rotate=0
/defcon-microsites/merch/?view=full&showOSFA=false
```

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
