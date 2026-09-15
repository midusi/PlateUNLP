# Onboarding — PlateUNLP

Notas para arrancar en el proyecto. Resumen de lo que hay que tener presente desde el primer día, con links a
donde está el detalle.

## 1. Qué hace el software

PlateUNLP semi-automatiza la digitalización de placas fotográficas espectroscópicas históricas
(colección FCAG–UNLP, proyecto ReTrOH, ~1900–1980). Entra una placa escaneada; salen espectros 1D
calibrados en longitud de onda, más sus metadatos en formato FITS.

La jerarquía de dominio es la columna vertebral de toda la app — conviene interiorizarla antes de
leer código:

```
Project           una colección en digitalización; los usuarios son miembros con un rol
└─ Plate          una placa de vidrio escaneada (un archivo de imagen subido)
   └─ Observation una exposición sobre esa placa = una estrella observada
      ├─ Spectrum una franja horizontal dentro de la observación
      │             tipo: "science" (la estrella) o "lamp" (lámpara de comparación)
      └─ Calibration  mapeo píxel → longitud de onda para esa observación (1:1)
```

El pipeline completo (8 etapas, desde subir la placa hasta exportar el FITS calibrado) está
detallado en `CLAUDE.md` §1 — vale la pena leerlo entero antes de tocar código, no solo esta tabla.

## 2. Poner el entorno a andar

Requisitos según `package.json` (`engines`): **Node 24.x** y **pnpm 11.x**.; Seguí lo que pide `package.json`.

```bash
pnpm install
cp .env.sample .env   # completar BETTER_AUTH_SECRET y el resto de las variables
pnpm db:init          # crea .local/ y siembra datos de ejemplo — destructivo, ver abajo
pnpm dev              # http://localhost:3000
```

- Usuario admin de desarrollo: `admin` / `plateunlp` (definido en `db/seed.ts`).
- Hay placas de ejemplo para probar manualmente en `public/forTest/` (p. ej. `placa_ejemplo.png`).
- **`pnpm db:init` borra `.local/` por completo** (`rm -rf`) antes de re-sembrar. Solo correrlo
  sobre una base de datos que sea intencionalmente descartable. Para aplicar migraciones nuevas sin
  perder datos, usar `pnpm db:migrate`.
- `.claude/launch.json` ya declara el server de desarrollo para que herramientas de agentes lo
  levanten sin necesidad de shell.

## 3. El flujo de trabajo es:

**Para elegir con qué empezar**, conviene filtrar el listado de issues por la etiqueta
[`good first issue`](https://github.com/midusi/PlateUNLP/labels/good%20first%20issue). Son issues
acotados y sencillos, pensados para familiarizarse con el repositorio sin necesitar contexto previo
del resto del pipeline.

1. **Todo cambio arranca como un issue** en GitHub describiendo el problema.
2. **Se trabaja en una rama dedicada**, creada desde `dev`. Nunca se commitea directo a `main` ni
   a `dev`. Para cada Issue se crea una rama `ID-###` donde ### es el número del Issue.
3. **Para unir los cambios se crea un PR**: La PR apunta a `dev`, nunca a `main`. Ejecutamos PR de `dev → main` una vez se soluciona un lote de Issues.
4. Antes de unir el PR a `dev` otro usuario tiene que aprobar los cambios.

### Mensajes de commit:

Respetar el siguiente formato:
```
<feat|fix>: [ID-XXX] <descripción corta, se pueden usar gitemojis>
```

`XXX` es el número del issue de GitHub que el commit resuelve. Commits chicos y de un solo
propósito — si uno mezcla cambios sin relación, se separa en varios.

**Antes de abrir la PR:** correr `pnpm lint` (`tsc --noEmit && biome lint .`). No hay suite de
tests — los cambios se verifican levantando `pnpm dev` y recorriendo a mano la etapa afectada.

## 4. Convenciones de código que viene bien saber

- **Columnas en snake_case, propiedades en camelCase o claves FITS.** Drizzle usa
  `casing: "snake_case"`: `imageLeft` en TypeScript es la columna `image_left`. Cualquier consulta
  SQL cruda tiene que usar snake_case.
- **Los campos FITS opcionales van de a pares.** `plate` y `observation` usan claves FITS
  literales como nombre de propiedad (`"PLATE-N"`, `"DATE-OBS"`, `OBSERVAT`), y cada campo opcional
  tiene un booleano `"<CLAVE>?"` que indica si el valor es conocido. En Zod es el wrapper
  `knowable()` (`app/types/spectrum-metadata.ts`): `{ value, isKnown }`. `isKnown: false` significa
  *el usuario sabe que el dato se perdió* y exporta el centinela `UNKNOWN` en el FITS — es
  semánticamente distinto de un string vacío (*todavía no se completó*). Confundir los dos casos
  genera bugs difíciles de notar (ver issue #317 para un ejemplo real de esto).
- **Los formularios autoguardan.** Los formularios de metadatos y extracción envían el cambio con
  debounce automáticamente y muestran un pie "saved on database". Agregarles un botón de guardar
  sería una regresión, no una mejora.
- **Las imágenes recortadas no se guardan en disco.** Solo se almacena la imagen de la placa
  completa; los recortes de `observation`/`spectrum` se re-derivan al vuelo con `sharp` a partir de
  offsets (`imageLeft/imageTop/imageWidth/imageHeight`). Evita comprimir con
  pérdida pixeles relevantes de las placas.
- **Dos modelos de ML, en runtimes distintos** (servidor vs. navegador) — no son intercambiables. Hay un Issue para que ambos queden en servidor.

## 5. Archivos y Enlaces

- `README.md` — comandos para levantar la aplicación y conocimiento general.
- `CLAUDE.md` — guía técnica completa (stack, layout de carpetas, convenciones, protocolo de trabajo). Es la referencia principal una vez pasado el primer día. Útil si se hace uso de agentes de IA para colaborar en el código.
- path `/docs/` — documentación funcional del pipeline (también servida por la app en `/docs`).
- Producción: <https://plate.unlp.dev>.
- Repositorio: <https://github.com/midusi/PlateUNLP>.