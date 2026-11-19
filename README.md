# Roomify

Roomify is a measured 2D interior design studio built with plain HTML, CSS, and vanilla JavaScript. The repository currently covers **Phase 1** (foundation, landing page, dashboard, persistence) and **Phase 2** (the interactive room editor).

No frameworks, build tools, backend, or database are used.

## Status

### Phase 1 — complete

- [x] Design system, local fonts, and responsive foundations
- [x] Landing page: hero, features, how it works, inspiration gallery, final CTA, footer
- [x] Dashboard: empty state, room creation, recent/all rooms, templates, delete flow
- [x] Measured SVG room plans and persistent projects in `localStorage`
- [x] Missing-room, blocked-storage, and corrupt-storage states
- [x] Automated browser checks across desktop and mobile sizes

### Phase 2 — complete

- [x] Interactive 2D editor with a centimeter-accurate SVG plan
- [x] Furniture catalog: 28 pieces across 7 categories with real dimensions
- [x] Add, select, drag, rotate, resize, duplicate, and delete pieces
- [x] Grid snapping, wall snapping, and room-bound validation
- [x] Properties panel for position, size, rotation, and name
- [x] Room settings: name, width, depth, and floor finish
- [x] Undo/redo history, keyboard shortcuts, and debounced autosave
- [x] Zoom and pan controls, fit-to-room, and responsive catalog sheet
- [x] Empty, missing, blocked-storage, and save-failure states

## Preview locally

From this folder, run:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/>.

Opening the HTML files directly with `file://` also works, including the self-hosted fonts. Font preload hints are injected only over HTTP, because browsers reject cross-origin font preloads on `file://`; the CSS `@font-face` rules load normally in both modes.

## Using the editor

Open a room from the dashboard, or visit `editor.html?id=<project-id>`.

1. Pick a piece from the catalog to place it in the center of the room.
2. Drag the piece to move it. It snaps to a 5 cm grid and to nearby walls.
3. Use the round handle above the selection, or the ±15° buttons, to rotate.
4. Edit exact position, width, depth, and rotation in the properties panel.
5. Open **Room settings** to rename the room, change its dimensions, or switch floors.
6. Changes autosave after a short pause; the header shows the save state.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Delete` / `Backspace` | Delete the selected piece |
| Arrow keys | Nudge 5 cm |
| `Shift` + arrow keys | Nudge 1 cm |
| `R` | Rotate +15° |
| `Shift` + `R` | Rotate −15° |
| `Ctrl/Cmd` + `D` | Duplicate the selected piece |
| `Ctrl/Cmd` + `Z` | Undo |
| `Ctrl/Cmd` + `Shift` + `Z` or `Ctrl` + `Y` | Redo |
| `0` | Fit the room to the viewport |
| `+` / `−` | Zoom in / out |
| `Escape` | Deselect, or close the catalog sheet |

Hold `Alt` while dragging or rotating to bypass grid and angle snapping.

Shortcuts are ignored while typing in an input or while a dialog is open.

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

### Room editor

- Measured SVG plan with grid, wall thickness, and a scale indicator
- Catalog of 28 furniture pieces: seating, tables, storage, bedroom, kitchen, bathroom, and decor
- Selection outline, rotation handle, and a live properties panel
- Move with snapping; resize and rotate with room-aware limits
- Room shrink automatically scales rotated furniture so it stays inside
- Impossible rotations are blocked with an explanatory toast instead of overflowing
- Undo/redo snapshots of room settings and furniture, capped at 60 steps
- Autosave with an 800 ms debounce, page-hide flush, and retry after save failures
- Zoom from 35% to 400%, wheel zoom, background pan, and fit-to-room
- Desktop side panels; catalog becomes a bottom sheet at 1020 px and below
- Empty-room overlay and clear states for missing rooms or unavailable storage

## Project structure

```text
index.html            Landing page
dashboard.html        Studio dashboard and dialogs
editor.html           Interactive room editor

css/
  tokens.css          Palette, typography, spacing, motion
  base.css            Reset, base elements, utilities
  components.css      Shared header, buttons, dialogs, forms, footer
  pages.css           Landing, dashboard, and editor layouts

js/
  catalog.js          Room types, floors, templates, area helpers
  storage.js          localStorage project API, normalization, corruption guards
  furniture.js        Furniture catalog and top-view SVG renderers
  plan.js             Measured SVG floor-plan renderer
  ui.js               Toasts, dates, escaping, shared helpers
  nav.js              Sticky header and mobile menu
  landing.js          Landing interactions and inspiration filters
  dashboard.js        Dashboard rendering and create/delete/template flows
  editor.js           Editor state, interactions, history, autosave, room settings

assets/
  fonts/              Self-hosted DM Serif Display and DM Sans (WOFF2)
  images/             Local interior photography
  favicon.svg
```

## Data and storage

Projects are stored only in the current browser under the `roomify.projects.v1` key. There are no accounts, no cloud sync, and no server.

A project records its name, room type, width and depth in centimeters (clamped to 150–1500 cm), floor finish, wall finish, timestamps, and a list of furniture objects. Each object stores its catalog reference, display name, top-left position, size in centimeters, rotation, and color.

Furniture dimensions are clamped to 20–600 cm. Dragging the rotation handle uses 15° steps unless `Alt` is held, while the rotation field accepts exact degrees. When a room is resized, pieces are rescaled uniformly to fit; if a piece cannot fit at its current angle, the app keeps the last valid state and explains why.

Clearing site data or using a private window removes access to saved rooms. If saved data cannot be read, Roomify pauses writes rather than overwriting it. If a save fails, the editor keeps working, shows an error, and retries while the data is still unsaved.

## Verification

- `node --check` passes for all JavaScript files.
- Phase 2 browser suites cover editor interactions, rotation and size limits, error states, responsive layouts from 1440 px down to 320 px, and the room-settings dialog.
- Phase 1 regression checks cover landing filters and menus, dashboard empty state, room creation, persistence, opening a room, deletion, templates, `?new=1`, missing rooms, and blocked/corrupt storage.
- Direct `file://` loading was smoke-tested on the landing page and dashboard with no failed requests or console errors.

## Limitations

- Furniture can overlap; there is no collision detection or automatic spacing.
- Single selection only: no multi-select, grouping, alignment tools, or copy/paste between rooms.
- No export, print, image, or PDF output yet.
- Projects stay in one browser; no import, export, sync, or accounts.
- Room plans are top-view SVG drawings, not photorealistic renders.
- Template thumbnails are measured SVG previews rather than photographs.
- Custom image generation was unavailable, so photography uses local Unsplash images.

## Credits

- Typography: DM Serif Display and DM Sans, self-hosted under their open font licenses.
- Interior photography via [Unsplash](https://unsplash.com).
- Interface artwork and floor plans are custom inline SVG.
