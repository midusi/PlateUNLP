import dedent from "dedent"
import { z } from "zod"

/**
 * SIMBAD service hosted by the Strasbourg Astronomical Data Center (CDS)
 * (https://simbad.cds.unistra.fr/guide/sim-url.htx)
 *
 * URL to SIMBAD script mode.
 * - They suggest not submitting more than 10 queries per second (may blacklist your IP),
 *   see https://cds.unistra.fr/help/faq/simbad/#d3349066167
 * - It's recommended to use the TAP service instead, but we're using the script service
 *   because it does coordinate transformations and other things that TAP doesn't do.
 */
const SIMBAD_URL = "https://simbad.cds.unistra.fr/simbad/sim-script"

/**
 * Queries SIMBAD script service.
 *
 * This function adds `output script=off` at the beginning of the script string, so don't include it in the script.
 * Then, it checks if the output threw an error and returns it.
 * Otherwise, it splits the lines of the output and returns it as a `string[]`.
 *
 * @see https://simbad.cds.unistra.fr/guide/sim-fscript.htx
 */
async function querySimbad(script: string): Promise<{ success: true, data: string[] } | { success: false, error: string }> {
  const url = new URL(SIMBAD_URL)
  script = `output script=off\n${script}` // add output script=off at the beginning of the script
  url.searchParams.set("script", script)
  const response = await fetch(url, { method: "POST", headers: { Accept: "text/plain" } })
  if (!response.ok) {
    return { success: false, error: `Error querying SIMBAD: ${response.status} ${response.statusText}` }
  }

  const text = await response.text()
  const lines = text.split("\n")
  let result: "data" | "error" | null = null
  let i = 0
  while (i < lines.length && result === null) {
    if (lines[i].startsWith("::data::"))
      result = "data"
    if (lines[i].startsWith("::error::"))
      result = "error"
    i++
  }
  if (result === "data") {
    i++ // skip extra empty line between header and data
    return {
      success: true,
      data: lines.slice(i, -2), // SIMBAD adds two extra empty lines at the end of the output
    }
  }
  else if (result === "error") {
    i++ // skip extra empty line between header and data
    return {
      success: false,
      error: lines.slice(i, -2).join("\n"), // SIMBAD adds two extra empty lines at the end of the output
    }
  }
  else {
    console.error(`SIMBAD response:`, text)
    return { success: false, error: "Couldn't parse SIMBAD response" }
  }
}

const queryObjectByIdResultSchema = z.interface({
  "MAIN-ID": z.string(),
  "RA": z.coerce.number(),
  "DEC": z.coerce.number(),
  "RA2000": z.coerce.number(),
  "DEC2000": z.coerce.number(),
  "RA1950": z.coerce.number(),
  "DEC1950": z.coerce.number(),
  "SP-TYPE": z.string().transform(s => s || null),
})

/**
 * Queries SIMBAD and gets the metadata for a given object by its identifier.
 * @param object The identifier of the object to be queried.
 * @param epoch The epoch of the coordinates to be returned.
 */
export async function queryObjectById(object: string, epoch: string): Promise<{ success: true, data: z.output<typeof queryObjectByIdResultSchema> } | { success: false, error: string }> {
  const script = dedent.withOptions({ escapeSpecialCharacters: false })`
    format object "%MAIN_ID\n"+
    "%COO(d;A;FK4;${epoch};1950)\n"+
    "%COO(d;D;FK4;${epoch};1950)\n"+
    "%COO(d;A;ICRS;J2000;2000)\n"+
    "%COO(d;D;ICRS;J2000;2000)\n"+
    "%COO(d;A;FK4;B1950;1950)\n"+
    "%COO(d;D;FK4;B1950;1950)\n"+
    "%SP(S)"
    query id ${object}
  `
  const res = await querySimbad(script)
  if (!res.success) {
    return res
  }
  const parsed = queryObjectByIdResultSchema.safeParse({
    "MAIN-ID": res.data[0],
    "RA": res.data[1],
    "DEC": res.data[2],
    "RA2000": res.data[3],
    "DEC2000": res.data[4],
    "RA1950": res.data[5],
    "DEC1950": res.data[6],
    "SP-TYPE": res.data[7],
  })
  if (!parsed.success) {
    return { success: false, error: z.prettifyError(parsed.error) }
  }
  return { success: true, data: parsed.data }
}

/**
 * Queries SIMBAD TAP service using ADQL (Astronomical Data Query Language).
 * It automatically constructs the query string from the provided template literal and values,
 * and does some simple sanitation.
 * @return a JSON object with the results of the query.
 */
async function querySimbadTAP(strings: TemplateStringsArray, ...values: unknown[]) {
  // Construct the query string from the template literal and values
  let adql = strings[0]
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (typeof value === "string")
      adql += `'${value.replaceAll("'", "''")}'`
    else if (typeof value === "undefined")
      adql += ""
    else if (value === null)
      adql += "NULL"
    else if (typeof value === "number")
      adql += value.toString()
    else if (typeof value === "boolean")
      adql += value ? "TRUE" : "FALSE"
    else
      throw new Error(`Unsupported value type: ${typeof value}`)
    adql += strings.at(i + 1) ?? ""
  }

  const data = new URLSearchParams()
  data.set("request", "doQuery") // to execute a query
  data.set("phase", "run")
  data.set("lang", "adql") // we'll send ADQL (https://simbad.cds.unistra.fr/simbad/tap/help/adqlHelp.html)
  data.set("format", "json") // we want the result in JSON format
  data.set("maxrec", "-1") // no limit on the number of records returned
  data.set("query", adql)
  const result = await fetch(SIMBAD_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: data,
  })
  if (!result.ok) {
    throw new Error(`Error querying SIMBAD: ${result.status} ${result.statusText}`)
  }
  return await result.json()
}

const queryObjectResultSchema = z.interface({
  data: z.tuple([
    z.string(), // "main_id"
    z.number(), // "ra"
    z.number(), // "dec"
    z.string().nullable(), // "sp_type"
  ]).array(),
})

/**
 * Gets the metadata for a given object by its identifier.
 * @param object The identifier of the object to be queried.
 */
export async function queryObjectTAP(object: string) {
  const result = await querySimbadTAP`
    SELECT
      basic."main_id",
      basic."ra",
      basic."dec",
      basic."sp_type"
    FROM basic
    JOIN ident ON basic."oid" = ident."oidref"
    WHERE ident."id" = ${object};
  `
  return queryObjectResultSchema.parse(result).data.map(row => ({
    main_id: row[0],
    ra: row[1],
    dec: row[2],
    sptype: row[3],
  }))
}
