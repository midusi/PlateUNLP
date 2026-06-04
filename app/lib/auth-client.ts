import { adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "./auth"

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), usernameClient(), adminClient()],
})
