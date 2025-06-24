import { text } from "drizzle-orm/sqlite-core"
import { customAlphabet } from "nanoid"
import { nolookalikes } from "nanoid-dictionary"

const randomId = customAlphabet(nolookalikes, 16)

/**
 * Returns a `TEXT PRIMARY KEY` with a default value of a random ID.
 * @param length - Optional length of the ID. Defaults to 16 characters.
 */
export const idType = (length?: number) =>
  text()
    .primaryKey()
    .$default(() => randomId(length))
