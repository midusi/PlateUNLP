import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { reactStartCookies } from "better-auth/react-start"
import { db } from "~/db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    camelCase: false,
  }),
  emailAndPassword: { enabled: true, autoSignIn: false },
  plugins: [reactStartCookies()],
})
