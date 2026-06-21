import evlog from "evlog/nitro/v3"
import { defineConfig } from "nitro"

export default defineConfig({
  experimental: {
    asyncContext: true,
  },
  modules: [
    evlog({
      env: { service: "plateunlp" },
    }),
  ],
})
