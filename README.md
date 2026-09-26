# Qrify

Take attendance at events by scanning the QR code on the back of student ID cards.

Open it on a phone at the door, name the event, and point the camera at each card. Qrify beeps for a new check-in, flags anyone already in, and downloads the register as Excel or CSV when you're done. It works offline, and every record stays on the device.

**Live:** https://tarunkay7.github.io/Qrify

## What it does

- **Scans fast.** Uses the browser's native `BarcodeDetector` where available, and a bundled zxing-wasm decoder everywhere else (including iOS Safari). A card held in view is counted once.
- **Catches repeats.** One check-in per person per event, enforced by the database; the second scan says when they first checked in.
- **Never loses the list.** Check-ins are written to IndexedDB immediately, so a closed tab, reload or dead battery doesn't wipe the event. Removed someone by mistake? Undo.
- **Works with bad Wi-Fi.** Installable PWA; the app and decoder are precached.
- **Reads different ID formats.** The KLH preset derives email, department and year from the roll number. The "Any QR code" profile records raw contents for tickets or other cards.

## Architecture

A client-only SvelteKit app (static adapter, no server). Business rules are plain TypeScript with no framework or DOM dependencies, so they're unit tested directly.

```
src/lib/
  domain/     Pure logic: ID profiles, entry preparation, export tables
  data/       Dexie (IndexedDB) schema and repository; live queries for Svelte
  scanner/    Camera lifecycle, QR decode loop with cooldown, sound/haptic cues
  export/     CSV (RFC 4180, BOM, formula-injection safe) and lazy-loaded XLSX
  stores/     Settings (localStorage) and toasts, as Svelte 5 rune classes
  ui/         Components: scanner view, register table, dialog, toaster
src/routes/   Home (events), /events/[id] (scan session), /settings
tests/        Playwright end-to-end tests with a fake camera that renders real QR codes
```

### Adding an ID card format

Create a profile in `src/lib/domain/profiles/` implementing `IdProfile` (`normalize`, `validate`, `parse`, `columns`), then add it to the list in `profiles/index.ts`. Each event records the profile it started with, so changing the default doesn't affect existing events.

KLH department codes live in `profiles/klh.ts`. Unknown codes show as `Code NN` until they're added.

## Development

Requires Node 24.

```sh
npm install
npm run dev            # http://localhost:5173
npm run test:unit      # Vitest: domain, export and data layers
npm run test:e2e       # Playwright: desktop + mobile, builds first
npm run lint && npm run check
```

The camera needs a secure context. `localhost` works; to try it on a phone over your LAN, use `npm run dev -- --host` with an HTTPS tunnel, or deploy.

Screenshots of every screen in light and dark mode:

```sh
SHOTS_DIR=./shots npm run test:screens
```

## Deployment

`.github/workflows/ci.yml` lints, type-checks, and runs unit and e2e tests on every push. On `main` it builds with `BASE_PATH=/Qrify` and deploys to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## History

The original 2022 version (jQuery, Instascan, Vanta background) is preserved at the [`v1-legacy`](https://github.com/tarunkay7/Qrify/tree/v1-legacy) tag.

## License

Apache 2.0. See [LICENSE](LICENSE).
