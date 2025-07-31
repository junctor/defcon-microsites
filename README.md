# DEF CON Microsites

[![Deploy Microsites](https://github.com/junctor/defcon-microsites/actions/workflows/pages.yml/badge.svg)](https://github.com/junctor/defcon-microsites/actions/workflows/pages.yml)

This repo hosts standalone microsites designed to supplement the official DEF CON schedule at [info.defcon.org](https://info.defcon.org).

These microsites are built with **Vite**, **Preact**, and **TypeScript**, and are optimized for fast display on conference screens or mobile devices. Each microsite is statically hosted and backed by live Firestore data.

---

## Available Pages

### `/tv/` – Live Event Display

A fullscreen auto-scrolling view of upcoming DEF CON events. Intended for public displays or kiosks.

#### URL Parameters

You can control which events are shown by passing query parameters:

| Param   | Type     | Example      | Description                                                                                 |
| ------- | -------- | ------------ | ------------------------------------------------------------------------------------------- |
| `l`     | `string` | `track 1`    | Filter events by location name (case-insensitive substring match).                          |
| `tag`   | `number` | `47607`      | Show only events with the specified tag ID.                                                 |
| `h`     | `number` | `6`          | Time window in hours (default is 6). Only events starting within this window will be shown. |
| `debug` | `true`   | `debug=true` | Show past and future events. Useful for testing outside the event time range.               |

#### Examples

- `https://junctor.github.io/defcon-microsites/tv/?l=track%201&tag=47607`
- `https://junctor.github.io/defcon-microsites/tv/?h=12&debug=true`

---

### `/merch/` – Merchandise Availability

Displays DEF CON merchandise and inventory status, powered by live Firestore updates. Intended for on-site TVs to let attendees know what’s in stock.

---

## Development

```bash
npm install
npm run build
npm run preview
```

## Microsites

These are single-page apps statically built with Vite. Each lives at its own path:

- [`/tv/`](./tv/index.html) – TV screen for auto-scrolling upcoming events
- [`/merch/`](./merch/index.html) – Real-time DEF CON merch availability
