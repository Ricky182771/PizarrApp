# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

PizarrApp ("Pizarra Táctica") is a client-only interactive football/soccer tactics board built with React 19 + TypeScript + Vite. It runs as both an installable **PWA** and a **Telegram Mini App**. There is no backend — all persistence is `localStorage` and shareable URLs. UI copy is in Spanish.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b (typecheck) then vite build -> dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint (flat config, eslint.config.js)
npm run test      # Vitest run (jsdom)
```

- Run a single test: `npx vitest run path/to/file.test.tsx` (or `npx vitest -t "name"`).
- **Note:** the test script and Vitest are configured (`vite.config.ts` → `setupFiles: './src/test/setup.ts'`), but no tests or the setup file exist yet. Create `src/test/setup.ts` (importing `@testing-library/jest-dom`) before adding the first test.
- To test PWA/service-worker behavior you must use `npm run build && npm run preview` — the service worker only meaningfully caches the built `/assets/`.

## Architecture

### State lives in one place: `src/App.tsx` (orchestrator, ~700 lines)
`App` holds essentially all application state via `useState` (players `local`/`visitante`, `colors`, `elements`, `arrows`, scoreboard fields, UI toggles) and wires it into presentational components. Logic lives in extracted modules:
- `src/constants/formations.ts` — squad templates + formation layout algorithm (`buildFormationLayout`, `changeFormation`, `autoArrangeTeam`, `findFreeSpot`). Positions are computed in landscape field space; away team is mirrored.
- `src/constants/colors.ts` — jersey color palette.
- `src/utils/storage.ts` — all localStorage access (autosave key + 3 slots), always validated via `isValidTacticaGuardada`.
- `src/utils/share.ts` — URL-hash compression (`compressToUrlSafe`/`decompressFromUrlSafe`).
- `src/utils/exportTactic.ts` — canvas render + PNG/PDF export.
- `src/hooks/` — `usePercentDrag`, `useIsMobile`, `useToast`, `useZoomPan`.

Child components are memoized (`React.memo`) and receive **stable id-based callbacks** (e.g. `onDragEnd(numero, x, y)`) built once in `App` with `useCallback`/`useMemo`, so dragging one token doesn't re-render the other 21. Preserve this pattern: new callbacks passed to memoized children must be referentially stable.

**Mobile coordinate rotation:** field data is stored in landscape space; on mobile the pitch renders portrait. `App` maps screen↔field (`toField()` for input, `screenArrows`/`screenElements` memos for output): screen x = field y, screen y = 100 − field x.

### Core data model — `src/types.ts`
- `Jugador` (player: numero, nombre, x, y), `FieldElement` (ball/cone/text/goal/dummy), `ArrowItem`, and `TacticaGuardada` (the full serializable board state).
- **All positions are percentages (0–100) of the field container**, never pixels. This is what makes the board resolution-independent and shareable. `usePercentDrag` converts pointer coordinates to these percentages.
- `types.ts` also defines `isValid*` validation guards. These are defense-in-depth: **any data entering from `localStorage` or a shared URL must pass `isValidTacticaGuardada` before use** (see `loadFromLS`/`loadSlot`). Extend these validators whenever you add a field to `TacticaGuardada`.
- The `Window.Telegram` global interface is declared here.

### Persistence & sharing
- Debounced autosave (600 ms) to `localStorage` key `pizarra-tactica`; three named manual save slots under `pizarra-tactica-slot-{1,2,3}`. All reads/writes go through `src/utils/storage.ts`.
- **Shareable links:** board JSON is compressed with the native `CompressionStream('deflate-raw')`, base64url-encoded (`src/utils/share.ts`), and placed in the URL hash. On mount, `App` reads the hash and hydrates state from it via `applyTactic`.

### Dragging — `src/hooks/usePercentDrag.ts`
Custom pointer-based drag hook (replaced Framer Motion to avoid accumulated-offset bugs). Reports positions as container percentages, has a drag threshold (distinguishes tap/click from drag), captures the pointer, prevents touch scroll during drag, batches move updates with `requestAnimationFrame`, and supports an optional `snapStep` (grid snapping, toggled in the UI — `SNAP_STEP = 2.5` in `App`). Reuse this hook for any new draggable element rather than rolling new drag logic.

### Components (`src/components/`)
- `Cancha.tsx` — the pitch: renders field markings and is the drag-constraint container (`canchaRef` from `App`).
- `FichaJugador.tsx` — draggable player token (editable number/name, delete).
- `DraggableElement.tsx` — draggable ball/cone/text/goal/dummy elements (supports scale + rotation).
- `InteractiveArrow.tsx` — draggable/editable tactical arrows.
- `DesktopSidebar.tsx` / `FloatingMenu.tsx` — controls; desktop uses the sidebar, mobile uses the floating menu (`useIsMobile`, breakpoint ≤768px). Both compose the shared pieces below.
- `TeamConfig.tsx` — team panels (formation F7/F9/F11, jersey color, add/remove player, auto-arrange); shared by sidebar and floating menu.
- `TacticSlots.tsx` — the 3 save/load/delete slot rows.
- `Scoreboard.tsx` — stadium scoreboard (click +1, right-click −1).
- `ZoomControls.tsx` — zoom in/out/reset, snap toggle, fullscreen.
- `ColorPickerPortal.tsx` — jersey color picker (mobile bottom sheet / desktop anchored popover, via portal to escape overflow clipping).

### Export
- PNG/PDF export renders the board to an offscreen `<canvas>` (`renderTacticToCanvas` in `src/utils/exportTactic.ts`), then `toDataURL`. PDF uses a **dynamic import** of `jspdf` (`await import('jspdf')`) to keep it out of the main bundle. On mobile, PNG export uses the Web Share API / saves to camera roll when available.

### Telegram Mini App integration
`telegram-web-app.js` is loaded in `index.html`. On mount `App` calls `window.Telegram.WebApp.ready()`/`expand()` and syncs header/background colors. Feature-detect `window.Telegram?.WebApp` — the same build must also run as a plain PWA.

### PWA
`public/sw.js` (service worker, registered in `main.tsx`), `public/manifest.json`, and icons in `public/`. SW strategy: **cache-first** for Vite `/assets/`, **network-first** for root HTML/config/Telegram SDK. Bump `CACHE_NAME` in `sw.js` when changing the cached shell.

## Conventions & constraints
- **Percentage coordinates everywhere** — keep new positional data in 0–100 space.
- `tsconfig.app.json` enforces `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` (use `import type` for type-only imports). `npm run build` typechecks, so unused code fails the build — this has broken Vercel deploys before (see git history).
- Styling is **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (no `tailwind.config.js`; configured in `src/index.css`). Fonts: Inter + Orbitron from Google Fonts.
- `index.html` sets a strict CSP; new external origins (scripts, fonts, connections) must be added there or they will be blocked.
