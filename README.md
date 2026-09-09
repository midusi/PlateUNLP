<p align="center">
  <img src="public/favicon.svg" alt="Turso Database" width="100"/>
  <h1 align="center">PlateUNLP</h1>
</p>

<p align="center">
  Process and calibrate spectroscopic observations.
</p>


<p align="center">
  <a title="Instituto de Investigación en Informática LIDI (III-LIDI)" target="_blank" href="https://weblidi.info.unlp.edu.ar/"><img src="app/assets/logolidi.png" width="100"></a>
  <a title="Facultad de Ciencias Astronómicas y Geofísicas (FCAGLP)" target="_blank" href="https://www.fcaglp.unlp.edu.ar/"><img src="app/assets/fcaglp.png" width="200"></a>
  <a title="Recuperación del Trabajo Observacional Histórico (ReTrOH)" target="_blank" href="https://retroh.fcaglp.unlp.edu.ar/"><img src="app/assets/logoretroh.png" width="100"></a>
  <a title="Instituto de Astrofisica de La Plata (CONICET-UNLP)" target="_blank" href="https://ialp.fcaglp.unlp.edu.ar/"><img src="app/assets/logoialp.png" width="100"></a>
</p>

---

## Development

To develop this project locally, you'll need [Node.js v22](https://nodejs.org/) and [pnpm v10](https://pnpm.io/). After you have cloned the repository, run the following commands to set up your environment:

```bash
pnpm install  # To install dependencies
pnpm db:init  # To initialize and seed the database
pnpm dev      # To start the development server
```

## Contributing

Every change starts as a GitHub issue. Work happens on a dedicated branch and lands via a pull
request — never commit directly to `main` or `dev`.

1. Open an issue describing the problem before writing code.
2. Branch off `dev`. Keep the branch scoped to that one issue.
3. Open a PR **targeting `dev`**, not `main`. `dev` → `main` is batched separately by a maintainer,
   who reviews and approves every PR.

### Commit messages

```
<feat|fix>: [ID-XXX] <short description, emoji welcome>
```

`XXX` is the GitHub issue number the commit resolves. Keep commits small and single-purpose — if
one commit mixes unrelated changes, split it into several.

```
feat: [ID-271] ✨ Autocompletar SCANRES desde placas del proyecto
fix: [ID-268] 🐛 HA se formatea en horas, no en grados
```

### Releases

Published versions are numbered `X.Y.Z`:

| Part | Bump it when                                                                             |
| ---- | ---------------------------------------------------------------------------------------- |
| `X`  | The published version changes.                                                            |
| `Y`  | Something breaks backwards compatibility.                                                 |
| `Z`  | Nothing breaks the installation — no dependency reinstall, no migration on the user side. |

Numbering continues from the deployed rewrite, informally called `2.0.0` and never tagged, so the
first release published under these conventions is `2.0.1`. The `v1.0.x` tags already in the
repository belong to the pre-React software; they are not ancestors of `main` and are not part of
this sequence.

Every release is published as a GitHub Release **linked to its own tag** (`vX.Y.Z`), created from
`main` once the changes are merged there.

**Title:** `X.Y.Z - CodenameInPascalCase` — for example `0.5.0 - OBBYComponentes`,
`0.4.0 - UnSoloCanal`, `0.3.0 - AdiosShim`. The codename summarises the main change of the release,
with no spaces.

**Body:** written in Spanish, without accents, matching the rest of the codebase. Organise it in
paragraphs — one per relevant feature or change, each opening with its main idea in bold. It is a
description of what changed, not a list of commits. When a change lends itself to being measured,
quote the actual numbers (`0.4.0`: "75 ms a 45 ms, 1.68x"; `0.5.0`: "IoU de 0.964 a 0.971").

Anything that breaks backwards compatibility goes in its own `## Cambios incompatibles` section,
explaining what stops working and what someone relying on it has to do now.

## Deployment

As is, PlateUNLP can be deployed using any platform that supports Node.js applications. Right now, we are using [Railpack](https://railpack.com/) to deploy the application.

Before starting the application in a production environment, make sure to set the following environment variables:
- `DATABASE_URL`: The database connection URL.
- `DATABASE_TOKEN`: The authentication token for the database (if required).
- `UPLOADS_DIR`: The directory path where uploaded files will be stored.
- `BETTER_AUTH_SECRET`: A secret key for authentication purposes.
- `BETTER_AUTH_URL`: The URL where the app is exposed.

There are two important scripts for deployment:
```bash
pnpm build    # To build the application for production
pnpm start    # To start the application in production mode
```

### Database

We're using [libSQL](https://github.com/tursodatabase/libsql) as our database solution, a fork of SQLite. This allows us to use a file-based database when developing locally, and a cloud-hosted database when deploying.

We recommend hosting a libSQL server for easy access from the outside for maintenance and backups. You can find more about this [here](docs/maintenance/libsql.mdx).

## Migrations

To manage database schema changes, we use Drizzle ORM's migration system. You can create and apply migrations using the following commands:
```bash
pnpm db:generate 'migration-name'  # To create a new migration
pnpm db:migrate                    # To apply pending migrations
```
