# Qrify v2: Architectural Rebuild + Minimal Redesign

## Context

Qrify (github.com/tarunkay7/Qrify) is a 3-year-old static 2-page site that lets college event organizers scan the QR on the back of a KLH student ID (which holds a 10-digit roll number), derive email/dept/year, and export attendance to Excel. It is currently:

- **Broken**: the scanner loads from `rawgit.com` (shut down), so scanning doesn't work.
- **Fragile**: data lives in `sessionStorage` (gone when the tab closes), with no delete/undo. `alert()` on duplicates blocks the scan loop.
- **Bloated**: jQuery is loaded twice, and Three.js + p5 + Vanta (~1MB) are used only for a background. There's also a 515KB webpack `table2excel.js` bundle.
- **Hard-coded**: `@klh.edu.in`, only 3 dept codes (others render "undefined"), inline styles, no mobile layout.

Goal: a real, reliable tool that organizers use on phones at the door, and that also works as a portfolio piece. **Decisions (confirmed with user):** client-only PWA (no backend), SvelteKit + TypeScript, configurable ID parser (KLH preset), "Paper & ink" minimal aesthetic.

## Repo strategy

- Clone to `C:\Users\Tarun Kesavan\Qrify`, tag the current `main` as `v1-legacy`, and work on branch `v2`.
- Delete the legacy files (html/css/png/mp3/table2excel.js/txt) in v2. They stay available in history and under the tag.
- First commit on v2: this design as `docs/superpowers/specs/2026-09-26-qrify-v2-design.md`.
- Merge to main / deploy only when the user says so.

## Stack

| Concern     | Choice                                                                                           | Why                                                       |
| ----------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Framework   | SvelteKit 2 + Svelte 5 (runes), TS strict                                                        | User's pick; small bundles                                |
| Build/host  | `@sveltejs/adapter-static` (SPA, `fallback: '404.html'`), `paths.base = '/Qrify'`                | Free GitHub Pages hosting, deep links work                |
| QR decoding | `barcode-detector` ponyfill (uses native `BarcodeDetector` where available, zxing-wasm fallback) | Maintained, fast, works on iOS Safari                     |
| Persistence | Dexie (IndexedDB), `liveQuery` → Svelte-compatible observables                                   | Survives tab close/reload, supports compound unique index |
| Export      | CSV (native) + XLSX via `write-excel-file` (lazy `import()`)                                     | Replaces the 515KB bundle; only loaded on click           |
| PWA/offline | `@vite-pwa/sveltekit` (precache app shell + wasm)                                                | Works with bad venue Wi-Fi, installable                   |
| Styling     | Plain CSS design tokens (custom properties) + Svelte scoped styles; no UI framework              | Minimal, full control, tiny                               |
| Fonts       | Self-hosted via `@fontsource` (display serif + text sans + mono)                                 | No Google Fonts request, works offline                    |
| Quality     | ESLint (flat) + Prettier + `svelte-check`; Vitest; Playwright                                    | Standard best practice                                    |
| CI/CD       | GitHub Actions: lint, check, test, build → deploy to Pages on `main`                             | Replaces manual Pages                                     |

## Architecture

Layered, framework code kept thin. Domain logic is pure TS and unit-testable.

```
src/
  lib/
    domain/            # pure TS, no Svelte/DOM
      types.ts         # Event, Attendee, IdProfile, ParseResult
      profiles/
        index.ts       # registry: getProfile(id), listProfiles()
        klh.ts         # KLH preset (validate 10 digits, dept map, year, email)
        generic.ts     # raw QR text only
      attendance.ts    # addAttendee() rules: normalize, parse, dedupe decision
      export.ts        # toRows(event, attendees, profile) → header + rows
    data/
      db.ts            # Dexie schema: events, attendees ([eventId+key] unique)
      repo.ts          # createEvent, listEvents, deleteEvent, addAttendee, removeAttendee, restore (undo), liveQuery wrappers
    scanner/
      camera.ts        # getUserMedia, camera list/switch, torch, stop on hidden tab
      decoder.ts       # BarcodeDetector loop via requestVideoFrameCallback; cooldown per value
      feedback.ts      # WebAudio beep (success/duplicate tones), navigator.vibrate
    export/
      csv.ts           # RFC-4180 CSV + BOM (Excel-friendly)
      xlsx.ts          # lazy write-excel-file
    ui/                # presentational components
      Button, Input, Toast/Toaster, Dialog, EmptyState, ThemeToggle,
      ScannerView.svelte, AttendeeTable.svelte, EventCard.svelte, StatBadge.svelte
    stores/
      toasts.svelte.ts # toast queue (runes)
      settings.svelte.ts # theme, sound on/off, default profile (localStorage)
  routes/
    +layout.svelte     # shell, header, theme, toaster
    +layout.ts         # export const prerender = true; ssr = false
    +page.svelte       # Home: create event form + list of past events
    events/[id]/+page.svelte   # Scan session: camera + manual entry + live table + export
    settings/+page.svelte      # profile choice, sound, clear data
    about/+page.svelte         # what/how, privacy note (all data stays on device)
static/ (icons, manifest assets)
tests/  (Playwright e2e)
```

### Data model

- `Event { id (uuid), name, profileId, createdAt, updatedAt }`
- `Attendee { id, eventId, key (normalized roll/raw), raw, fields: Record<string,string>, source: 'scan'|'manual', scannedAt }`
- Unique compound index `[eventId+key]` enforces no duplicates at the DB level.

### IdProfile interface (the configurable parser)

```ts
interface IdProfile {
	id: string;
	name: string;
	columns: { key: string; label: string }[]; // table + export columns
	normalize(raw: string): string; // trim, uppercase, strip URL wrappers
	validate(key: string): { ok: true } | { ok: false; reason: string };
	parse(key: string): Record<string, string>; // e.g. { email, dept, year }
}
```

- KLH preset: validate `/^\d{10}$/`; `year = 'Y' + key.slice(0,2)`; `dept = DEPT[key.slice(4,6)] ?? \`Code ${code}\``(no more "undefined");`email = \`${key}@klh.edu.in\``. The dept map is data in `klh.ts`, easy to extend.
- Generic preset: stores the raw value, with a single "Value" column.
- Each event stores its `profileId`, so old events stay stable if defaults change.

### Scan flow

camera frame → `decoder` (cooldown: ignore the same value for 2.5s) → `profile.normalize/validate` → `repo.addAttendee` → one of:

- success: beep + vibrate, row slides in, count ticks up
- duplicate: different tone, non-blocking toast "Already checked in at 10:42"
- invalid: toast with the reason

Manual entry goes through the same path. Each row has a delete button with an Undo toast. The camera stops when the tab is hidden or the user leaves the page.

### Best practices baked in

- No blocking `alert()`. All errors are recoverable toasts. There's a camera-permission-denied state with instructions and a manual-entry fallback.
- Accessibility: semantic table, labelled inputs, `aria-live` region announcing each check-in, visible focus, `prefers-reduced-motion`, and AA contrast in both themes.
- Mobile-first: on phones the camera sits on top with the list below; on tablets and desktops they're side by side. Large touch targets.
- Privacy: no network calls after load, no analytics. "Clear all data" lives in settings.
- Performance budget: under 100KB JS for the initial route (excluding lazy wasm/xlsx). Lighthouse ≥ 95 on all categories.

## Visual design: "Paper & ink"

During implementation, apply the **frontend-design skill** to the UI layer.

- Palette: warm paper `#F5F1E8`-ish background, ink `#141414`, muted rule lines, and a single signal-red accent for scan success and the primary action. The dark theme inverts to warm charcoal/bone. Follows the system setting, with a manual toggle.
- Type: an editorial serif for display (event names, big count), a clean grotesk for UI text, and mono with tabular numbers for roll numbers and the `#` column.
- Motifs: ledger-style hairline rules, generous whitespace, and corner-bracket viewfinder marks on the camera. The "present" count is set large like a headline. No gradients, glows or 3D backgrounds.
- Motion: minimal and purposeful. New row fades and slides in, a brief red flash on the viewfinder corners at scan, and a count tick. All of it is disabled under reduced motion.
- Screens: Home (hero wordmark "qrify / attendance, simplified", create-event field, past-events ledger list with counts and dates), Scan session (per the approved mockup), Settings, About. The old 3-step explainer becomes a quiet numbered row on Home when there are no events yet.
- New SVG logo/favicon and PWA icons, replacing the PNGs.

## Build sequence (for writing-plans to expand into tasks)

1. Clone, tag, branch, commit spec. Scaffold SvelteKit (TS, ESLint, Prettier, Vitest, Playwright), adapter-static, and base path. Add CI workflow.
2. Domain: types, KLH and generic profiles, attendance rules, export rows (TDD with Vitest).
3. Data: Dexie schema + repo (tests with `fake-indexeddb`).
4. Scanner: camera, decoder and feedback modules.
5. Design tokens, fonts, layout shell, theme (frontend-design skill).
6. Routes: Home → Scan session → Settings/About. Wire toasts, undo and export.
7. PWA manifest, service worker, icons/logo.
8. Rewrite the README (screenshots, architecture, local dev). Pages deploy workflow.

## Verification

- `npm run lint && npm run check && npm run test` all pass (unit coverage on domain/ and data/).
- Playwright e2e, using Chromium with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=tests/fixtures/qr.y4m`, which renders a known KLH QR. Assert: a row appears, a rescan within cooldown is ignored, a later rescan shows the duplicate toast, the row survives reload, and CSV/XLSX download has the expected headers and rows.
- Manual-entry e2e path (invalid roll → toast; valid → row; delete → undo restores).
- `npm run build && npm run preview`: check deep link `/Qrify/events/<id>` reload works, offline mode works (DevTools offline), and Lighthouse ≥ 95.
- Run the app with the `run` skill and screenshot Home + Scan in light and dark themes, on mobile and desktop viewports, for the user to review.
- Real-device check by the user: phone camera scanning a physical ID card.
