import "dotenv/config"

import { defineConfig } from "drizzle-kit"
import { env } from "~/env"

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema/index.ts",
  casing: "snake_case",
  ...(env.RAILPACK_BUILDING
    ? {
        dialect: "sqlite",
        dbCredentials: {
          url: "file:./tmp.sqlite",
        },
      }
    : env.DATABASE_TOKEN
      ? {
          dialect: "turso",
          dbCredentials: {
            url: env.DATABASE_URL,
            authToken: env.DATABASE_TOKEN,
          },
        }
      : {
          dialect: "sqlite",
          dbCredentials: {
            url: env.DATABASE_URL,
          },
        }),
})
