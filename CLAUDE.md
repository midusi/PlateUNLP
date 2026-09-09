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

**TensorFlow.js memory in `app/lib/extract-features.ts` and friends.** `reshape`/`squeeze`/
`expandDims` don't copy data — they register a new `Tensor` object sharing the same underlying
buffer (confirmed via `tf.memory().numDataBuffers`), so the buffer only frees once every object
referencing it is disposed. Two consequences that actually caused a leak here: chaining
`.expandDims(0).expandDims(-1)` creates an orphaned intermediate with no variable to dispose —
collapse it into one `.reshape([...])` instead. And `tf.tidy()` only auto-disposes tensors *created
inside* its callback, never ones passed in as arguments — a tensor built outside and used inside
still needs an explicit `.dispose()` from the caller.

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

**Do not commit or push until the maintainer confirms the change.** Finish the work, run the
relevant checks, summarize the diff and the commit message you'd use, and wait for a go-ahead.
Only commit once they say so — don't treat one confirmation as blanket approval for later changes
in the same session.

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

### Releases

Published versions are `X.Y.Z`: bump **X** when the published version changes, **Y** when
something breaks backwards compatibility, **Z** when nothing breaks the installation (no dependency
reinstall, no migration on the user's side).

Numbering continues from the deployed rewrite, informally called `2.0.0` and never tagged, so the
first release published under these conventions is `2.0.1`. The `v1.0.x` tags and their GitHub
Releases belong to the pre-React software and sit on commits that are **not** ancestors of `main` —
don't read them as part of this sequence.

Each release is a GitHub Release **linked to its own tag** (`vX.Y.Z`), cut from `main` after the
changes are merged there — not from `dev`.

Title: `X.Y.Z - CodenameInPascalCase` (e.g. `0.5.0 - OBBYComponentes`, `0.4.0 - UnSoloCanal`). The
codename summarises the release's main change, no spaces.

Body **in Spanish, without accents**, in paragraphs — one per relevant change, each opening with
its main idea in bold. It describes what changed; it is *not* a list of commits. Quote real numbers
whenever the change lends itself to being measured (`0.4.0`: "75 ms a 45 ms, 1.68x"). Anything that
breaks backwards compatibility goes in its own `## Cambios incompatibles` section, saying what
stops working and what someone relying on it has to do now.

Same rules are in `README.md`; keep both in sync (see #298).

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

**Mark anything you author as pending human review with the `ai-review` label**, not with an
in-body disclaimer. Apply it to every issue you create, and to every existing issue you edit or
comment on. Do not write "🤖" markers or "written by an AI, please corroborate" disclaimers inside
the issue/comment text itself — the label is the review flag now.

**Never mention a person's name inside an issue or comment body.** This is broader than just
assignment: no "as X reported", no attributing an idea to whoever raised it in a meeting or a
mail, no assignee baked into the text. Write the problem, origin and solution directly, in a
professional and formal tone. Assignment is handled outside the issue text (GitHub's assignee
field, milestones, or verbally) and changes over time; a name in the body just goes stale.
Cross-references to other issues (`Relacionado:`, `Depende de:`) are fine — people are not. When
you add a `Depende de:`/`Relacionado:` link, also drop a short comment on the *other* issue
pointing back — cross-references only help if they're discoverable from both sides.

**In "Posible solución", commit to one recommendation instead of listing options neutrally.** If
there's an obvious simplest path (a unit selector on the existing graph instead of a second graph;
a prop to disable a behaviour instead of splitting the component), say so explicitly instead of
listing alternatives with equal weight, and be concrete about the mechanism ("mediante un
tooltip"), not just the outcome ("mostrar la longitud de onda"). This is the single most common
edit made to issues drafted here — vague or neutral solution sections get tightened into a
concrete pick every time.

**Labels used for triage** (beyond the stock set): `ai-review` (see above) and `usable-minima`,
which marks an issue as required for a first version usable end-to-end through calibration. Don't
self-apply `usable-minima` when drafting a new issue — it reflects a maintainer's prioritization
call, not something inferable from the bug alone.

**Milestones group a whole plan of work, not just one person's tasks.** `Tesis V. Dome` is the
current example: it holds both the assigned student's issues *and* the maintainer's own supporting
issues that unblock them (retraining a model, fixing an extraction bug the thesis work depends on).
Don't read a milestone as an assignee list.

`.github/CODEOWNERS`: everything → `@Sansanto2000`; `app/lib/astronomical/` → `@JuanM04`.

**`gh api` gotcha:** `-f field=@file` does **not** read the file — it sets the field to the literal
string `@file`. The `@file` magic-conversion syntax only works with `-F`/`--field` (capital F).
This silently corrupts whatever you're editing (a comment, an issue body) with no error — verify
the result after any `gh api -X PATCH` call that reads from a file.

---

## 7. Known rough edges

**The backlog of diagnosed-but-unfixed defects lives in GitHub issues now, not here** — as of
August 2026 that's roughly the #254–#297 range, covering the observation/spectrum metadata
pipeline, calibration UI, and extraction. Search there before assuming something is undiscovered
(see "Search the existing issues" above); don't try to keep this file in sync with the issue
tracker.

Smaller things that are easy to trip over and unlikely to ever get their own issue:

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

Re-verify before filing any of these as an issue — this list reflects the state at the time it was
written.

---

## 8. Reference

- Production: <https://plate.unlp.dev>
- Repo: <https://github.com/midusi/PlateUNLP>
- Docs (also served by the app at `/docs`): `docs/`
- Background: S. Ponte Ahón, *master's thesis* — chapter 4 describes the system, chapter 5 the
  models and algorithms. Related papers: JCCH 2025, JCC 2024, GCH 2024, BAAA 2023, CACIC 2022.
- `fits2js` was written for this project to generate FITS from JS.
