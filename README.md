# Roomify

Roomify is a measured 2D interior design studio built with plain HTML, CSS, and vanilla JavaScript. This repository contains **Phase 1**: the foundation, the full landing page, the dashboard and create flow, and a read-only room preview.

No frameworks, build tools, backend, or database are used.

## Phase 1 status

- [x] Design system, local fonts, and responsive foundations
- [x] Landing page: hero, features, how it works, inspiration gallery, final CTA, footer
- [x] Dashboard: empty state, room creation, recent/all rooms, templates, delete flow
- [x] Measured SVG room plans and persistent projects in `localStorage`
- [x] Read-only editor preview with missing-room and storage-failure states
- [x] Automated browser checks across desktop and mobile sizes

Phase 2 (interactive canvas, furniture placement, drag-and-drop editing, and room editing) has **not** been started.

## Preview locally

From this folder, run:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/>.

Opening the HTML files directly with `file://` also works, but browsers block the self-hosted WOFF2 fonts in that mode, so system fallback fonts are used. A local static server is recommended for the intended typography.

## Features

### Landing

- Sticky navigation, mobile menu, and working section links
- Hero with measured-plan artwork
- Features, How It Works, filterable Inspiration gallery, manifesto, and final CTA
- Scroll-reveal motion with reduced-motion support
- Local photography with credits in the footer

### Dashboard

- Welcome header, project count, and storage status
- Empty state and a "new room" dialog with validation
- Room types, real dimensions in centimeters, and floor finishes
- Recent rooms and a full archive with measured plan thumbnails
- Relative modified dates, delete confirmation, and four room templates
- Entry points via `dashboard.html?new=1` and `#templates`
- Protection against blocked or corrupt `localStorage`

### Editor preview

- Opens at `editor.html?id=<project-id>`
- Shows the measured plan, footprint, area, floor, type, and dates
- Clearly labeled `Phase 1 · Preview` and intentionally read-only
- Graceful state for deleted or unknown rooms

## Project structure

```text
index.html            Landing page
dashboard.html        Studio dashboard and dialogs
editor.html           Phase 1 read-only room preview

css/
  tokens.css          Palette, typography, spacing, motion
  base.css            Reset, base elements, utilities
  components.css      Shared header, buttons, dialogs, forms, footer
  pages.css           Landing, dashboard, and editor layouts

js/
  catalog.js          Room types, floors, templates, area helpers
  storage.js          localStorage project API and corruption guards
  plan.js             Measured SVG floor-plan renderer
  ui.js               Toasts, dates, escaping, shared helpers
  nav.js              Sticky header and mobile menu
  landing.js          Landing interactions and inspiration filters
  dashboard.js        Dashboard rendering and create/delete/template flows
  editor.js           Loads a project and renders the preview

assets/
  fonts/              Self-hosted DM Serif Display and DM Sans (WOFF2)
  images/             Local interior photography
  favicon.svg
```

## Data and storage

Projects are stored only in the current browser under the `roomify.projects.v1` key. There are no accounts, no cloud sync, and no server.

A project records its name, room type, width and depth in centimeters (clamped to 150–1500 cm), floor finish, timestamps, and an empty `objects` array reserved for Phase 2.

Clearing site data or using a private window removes access to saved rooms. If saved data cannot be read, Roomify pauses writes rather than overwriting it.

## Verification

- `node --check` passes for all JavaScript files.
- Playwright end-to-end checks cover landing filters and menus, dashboard empty state, room creation, persistence, opening a room, deletion, templates, `?new=1`, missing rooms, blocked/corrupt storage, and responsive overflow at 1440, 1024, 768, and 390 px.
- Direct `file://` loading was smoke-tested; custom fonts fall back as noted above.

## Limitations

- No furniture engine, canvas editing, drag-and-drop, or editing UI yet — that is Phase 2.
- Projects stay in one browser; no import, export, sync, or accounts.
- Room plans are generated previews, not editable drawings.
- Template thumbnails are measured SVG previews rather than photographs.
- Custom image generation was unavailable, so photography uses local Unsplash images.

## Credits

- Typography: DM Serif Display and DM Sans, self-hosted under their open font licenses.
- Interior photography via [Unsplash](https://unsplash.com).
- Interface artwork and floor plans are custom inline SVG.
