import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { username } from "better-auth/plugins/username"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "~/db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    camelCase: false,
  }),
  emailAndPassword: { enabled: true, autoSignIn: false },
  plugins: [
    tanstackStartCookies(),
    username(),
    admin({ defaultRole: "user" }),
  ],
})
