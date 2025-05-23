import { defineConfig } from "drizzle-kit"
import { env } from "./server/env"

export default defineConfig({
  out: "./server/db/migrations",
  schema: "./server/db/schema/index.ts",
  ...(env.DATABASE_TOKEN
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
