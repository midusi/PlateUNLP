# CLAUDE.md

Guide for AI agents working on **PlateUNLP**. Read this before touching code.

> Written in English to match the codebase (code, comments and most docs are English).
> Parts of `docs/` and some inline comments are Spanish — that is expected, don't "fix" it.

---

## 1. What this software does

PlateUNLP semi-automates the digitisation of **historical spectroscopic glass plates** (FCAG–UNLP
collection, ReTrOH project, ~1900–1980). A scanned plate goes in; calibrated 1-D science spectra
plus FITS metadata come out.

The domain hierarchy is the backbone of the whole app — internalise it:

```
Project           a collection being digitised; users are members with a role
└─ Plate          one scanned glass plate (one uploaded image file)
   └─ Observation one exposure on that plate = one target star
      ├─ Spectrum one horizontal stripe inside the observation
      │             type: "science" (the star) or "lamp" (comparison lamp)
      └─ Calibration  pixel → wavelength mapping for that observation (1:1)
```

**Images are never re-cropped to disk.** Only the plate image is stored (in `UPLOADS_DIR`, row in
`upload`). `observation` and `spectrum` store `imageLeft/imageTop/imageWidth/imageHeight` offsets
and crops are re-derived on demand with `sharp`. Preserve this — it avoids repeated lossy
recompression of irreplaceable scientific data.

### The pipeline, stage by stage

| # | Stage | Where | How |
|---|-------|-------|-----|
| 1 | Create project, upload plate | `/project/$projectId` | `upload-plate.ts` → `uploadFile()` |
| 2 | Plate metadata | `/plate/$plateId` | `PlateMetadataForm`, autosaved |
| 3 | **Observation detection** | `/plate/$plateId` | ONNX **server-side**, `get-observations-detections.ts` |
| 4 | Observation metadata + derived values | `/observation/$observationId` | `compute-observation-metadata.ts` (SIMBAD + astronomy) |
| 5 | **Spectrum detection** (lamp vs science) | `/observation/$observationId` | ONNX **client-side**, `use-predict-BBs.ts` |
| 6 | Feature extraction → 1-D signals | `/observation/$observationId` | `SpectrumsExtractor` + `-utils/recalculate-spectrums-1d.ts` |
| 7 | Wavelength calibration | `/observation/$observationId/calibrate` | user matches lamp peaks to a reference material |
| 8 | FITS export | several routes ending in `fits` / `extracted-fits` / `calibrated-fits` | `fits2js` via `app/lib/fits/` |

`docs/missing-translation/*.mdx` documents stages 2–7 in detail (with the maths). The screenshots
in there are stale; the prose is correct.

### The two ML models — do not mix them up

| Model | Runtime | File | Loaded by |
|-------|---------|------|-----------|
| Observation detector | `onnxruntime-node` (server) | `app/models/detect_observations/detect_observations.3.0.0.m.onnx` | `get-observations-detections.ts`, path is **hardcoded relative to cwd** |
| Spectrum-part segmenter | `onnxruntime-web` (browser) | `public/models/spectrum_part_segmentator.onnx` (38 MB) | `use-predict-BBs.ts`, fetched from `/models/…` |

The Dockerfile copies `app/models` into the runner image explicitly — if you move or rename the
server model, update `Dockerfile` too.

---

## 2. Stack

- **TanStack Start** (file-based router + server functions) on **Nitro 3**, Vite 8, React 19
- **Drizzle ORM** over **libSQL/SQLite** (`casing: "snake_case"` — see §4)
- **better-auth** (email+password, `username` and `admin` plugins) — no public sign-up
- **TanStack Query** for client caching, **TanStack Form** for every form
- **Tailwind 4** + shadcn-style components on **Base UI** (`@base-ui/react`), Iconify icons
- **Zustand** for the calibration-page global store only
- **fumadocs** for `/docs` (MDX in `docs/`, KaTeX enabled)
- **Zod v4** for all validation, **neverthrow** `Result` for fallible non-throwing helpers
- **evlog** for structured request logging
- **Biome** for lint + format (not ESLint/Prettier)

---

## 3. Layout

```
app/
  routes/                 file-based routes (routeTree.gen.ts is GENERATED — never edit)
    (auth)/               login + better-auth catch-all
    _app/                 authenticated shell (header, breadcrumbs, footer)
      <route>/-actions/     server functions for that route
      <route>/-components/  components for that route
      <route>/-utils/       pure helpers for that route
    _docs/                fumadocs
  api/                    raw Nitro handlers (registered in nitro.config.ts, NOT file-routed)
  components/ui/          shadcn-style primitives
  components/forms/       TanStack Form field components
  hooks/use-app-form.ts   the form hook — always use this, not raw useForm
  lib/
    astronomical/         JD, sidereal time, hour angle, airmass, SIMBAD  ← @JuanM04 owns this
    fits/                 FITS building on top of fits2js
    math/                 mathjs/bignumber helpers
  models/                 server-side ONNX
  types/                  zod schemas + shared TS types
db/
  schema/                 drizzle tables, one file per entity
  migrations/             generated SQL — never hand-edit
  seed.ts, dev-init.ts
docs/                     fumadocs MDX
dataset/                  sample FITS + reference lamp spectra (not shipped)
public/forTest/           sample plate scans usable for manual testing
```

Directories prefixed with `-` inside `routes/` are **excluded from routing** by TanStack — that is
the convention for co-locating code with a route. Follow it; don't invent a top-level `services/`.

Path aliases: `~/*` → `app/*`, `~/db` → `db/index.ts`, `~/db/schema` → `db/schema/index.ts`.

---

## 4. Conventions that will bite you

**Drizzle `casing: "snake_case"`.** TS property names are camelCase or FITS keywords; column names
are auto-snake_cased. So `imageLeft` is the column `image_left`, and raw `sqlite3` queries must use
snake_case. Set in both `db/index.ts` and `drizzle.config.ts`.

**FITS keyword columns.** `plate` / `observation` use literal FITS keys as property names
(`"PLATE-N"`, `"DATE-OBS"`, `OBSERVAT`) with explicit column names. Each optional one is paired with
a `"<KEY>?"` boolean "is known" flag. In Zod this is the `knowable()` wrapper in
`app/types/spectrum-metadata.ts`: `{ value, isKnown }`. `isKnown: false` means *the user knows the
value is lost* and exports the `UNKNOWN` sentinel — semantically different from an empty string
(*not filled in yet*). Respect that distinction.

**`metadataCompletion`** is a cached percentage on `plate`/`observation`. Recompute it with
`getPlateMetadataCompletion` / the observation equivalent whenever you write metadata.

**Server functions.** Always `createServerFn().validator(zodSchema).handler(...)`. Use
`{ method: "POST" }` for mutations. Export a `…QueryOptions` factory next to a getter when the
client needs it cached. Note the API is `.validator()`, not `.inputValidator()`.

**Autosave everywhere.** Metadata and extraction forms submit on change with a debounce and show a
"saved on database" footer. Adding a Save button to those forms would be a regression.

**Logging.** Server code uses `log()` from `~/lib/log` (evlog wide events): enrich with
`log().set({ … })`, emit notable events with `log().info/warn/error`. It reads Nitro async context
— **never import it in a client component**. Throw with `createError({ message, status, why, fix })`
from `evlog`.

**Errors to the user.** `notifyError(title, error)` / `notifySucces(title)` from `~/lib/notifications`.

**Auth.** Route protection is the `_app` route loader (redirects to `/login`). Raw Nitro handlers in
`app/api/` do their own `auth.api.getSession(...)` **plus** a `user_to_project` membership check —
see `app/lib/observation-preview.ts`. Copy that pattern for any new image/data endpoint; it was
added deliberately (commit `d54bad3c`).

**`OBS-N`** is the human label for an observation (`A`, `B`, … `_A`), generated by `app/lib/obs-n.ts`,
and is what the UI shows (`Obs. A`) — distinct from `observation.name` (`Observation vjk9`).

---

## 5. Running it

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

`.claude/launch.json` is versioned and declares the dev server, so agent tooling can start it
instead of shelling out. `.claude/worktrees/` is gitignored — that is where agent worktrees land,
and committing it would nest a checkout inside the repo.

`pnpm db:init` **destroys `.local/`** (`rm -rf`) and re-seeds. Only run it on an intentionally
disposable database. To just apply new migrations use `pnpm db:migrate`.

Dev seed admin: username `admin` / password `plateunlp` (`db/seed.ts`).

Sample plate scans for manual testing live in `public/forTest/` (e.g. `placa_ejemplo.png`) and are
served by the dev server.

Required env (`.env`, see `.env.sample`): `DATABASE_URL`, `UPLOADS_DIR`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, optional `DATABASE_TOKEN` / `DATABASE_TLS`.

### Checks before you open a PR

```bash
pnpm lint
```

`pnpm lint` = `tsc --noEmit && biome lint .`.

**Baseline as of this writing: typecheck is clean, Biome reports 13 pre-existing errors + 3
warnings** (mostly `a11y` on `BoundingBoxer.tsx` and the calibration SVG components, plus two unused
`biome-ignore` suppressions). Don't treat those as caused by your change — but don't add new ones.
`pnpm lint:fix` runs `biome check --write .`.

There is **no test suite**. Verify changes by running `pnpm dev` and walking the affected stage.

Migrations: `pnpm db:generate 'name'` then `pnpm db:migrate`. Never hand-edit files under
`db/migrations/`.

---

## 6. Workflow — issue → branch → PR

This project has a strict protocol. Follow it exactly.

1. **Find a problem.**
2. **Open an issue** on <https://github.com/midusi/PlateUNLP> describing it.
3. **Work on a dedicated branch.** Never commit to `main`. Never commit to `dev` directly.
4. **Open a PR targeting `dev`.** `dev` → `main` is batched separately by the maintainer.
   The maintainer reviews and approves all PRs.

### Commit message format

```
<feat|fix>: [ID-XXX] <short description, emoji welcome>
```

`XXX` is the GitHub issue number. Keep commits **small and single-purpose** — if one commit mixes
unrelated changes, split it.

```
feat: [ID-271] ✨ Autocompletar SCANRES desde placas del proyecto
fix: [ID-268] 🐛 HA se formatea en horas, no en grados
```

Sign commits off with the standard trailer:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Issues and PRs

The `gh` CLI is available and authenticated, so issues and PRs can be created from the shell.

**Search the existing issues before filing anything.** The astronomers on the project report
science-level bugs regularly, so a defect you find in the code may already be reported from the
observational side. In that case comment the root cause on the existing issue instead of opening a
duplicate — see #258 / #259 for an example.

**Back findings with numbers, not just code reading.** Reproduce the reported case by running the
repo's own functions (`npx tsx` from the repo root — it fails with a top-level-await error if the
script lives outside the project) and quote the measured values. That is what turned the #259
hypothesis into a confirmation.

**Mark anything you author as pending human review.** Open every issue, comment and PR body you
write with a one-line marker:

```
> 🤖 En espera de revisión humana.
```

Only expand that into a full "found by an AI agent, please corroborate before merging" disclaimer
when the maintainer explicitly asks for it on that particular issue.

`.github/CODEOWNERS`: everything → `@Sansanto2000`; `app/lib/astronomical/` → `@JuanM04`.

---

## 7. Known rough edges

Useful context, and a source of candidate issues.

- **`compute-observation-metadata.ts` has three independent defects**, all open as issues:
  - **#259** — `AIRMASS` is computed as `getAirmass(azimuth)` but `getAirmass` takes an **altitude**
    (`equatorialToHorizontal` returns both). Confirmed: for HD148937 the current code yields
    `1.3685` and the fix yields `1.1979`, matching the astronomer-reported 1.37 / 1.20.
  - **#258** — `RA`/`DEC` are filled from `simbad.value.RA2000`/`DEC2000`, so the
    FK4-at-observation-equinox coordinates that `queryObjectById` already fetches are discarded —
    `RA` always equals `RA2000` even though `EQUINOX` says e.g. `1976.13`. No precession code is
    needed; SIMBAD already returns the right values.
  - **#265** — `HA` is formatted with `degToDMS` instead of `degToHMS`, so it reads `24:16:36` where
    the docs (and every other hour quantity) expect `01:37:06`.
- Spelling that has leaked into the **database schema and enums**, so it can't be fixed casually:
  `calibration.deegre`, the enum value `"Linear regresion"`, "Teorical" in the calibration UI.
- Breadcrumb label for a plate is `Plate <PLATE-N>` on the calibrate route but `<PLATE-N>` everywhere
  else.
- `docs/index.mdx` lists missing pages (fit-function methods, deploy, interpolation functions,
  detector docs). Several `docs/missing-translation/*.mdx` pages link to paths like
  `../feature-extraction/index.md` that don't resolve under fumadocs.
- `debug_input.png` at the repo root and `tmp/plate-*.png` are leftover debugging artefacts.
- The thesis says docs are generated with VitePress; they were migrated to fumadocs.
- The README documents `pnpm db:init` as a normal setup step, without warning that it wipes
  `.local/`.

Before filing any of these as an issue, re-verify — this list reflects the state at the time it was
written.

---

## 8. Reference

- Production: <https://plate.unlp.dev>
- Repo: <https://github.com/midusi/PlateUNLP>
- Docs (also served by the app at `/docs`): `docs/`
- Background: S. Ponte Ahón, *master's thesis* — chapter 4 describes the system, chapter 5 the
  models and algorithms. Related papers: JCCH 2025, JCC 2024, GCH 2024, BAAA 2023, CACIC 2022.
- `fits2js` was written for this project to generate FITS from JS.
