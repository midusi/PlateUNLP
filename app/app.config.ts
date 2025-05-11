import process from "node:process"
import react from "@vitejs/plugin-react"
import { createApp } from "vinxi"
import { viteStaticCopy } from "vite-plugin-static-copy"
import tsconfigPaths from "vite-tsconfig-paths"

export default createApp({
  server: {
    esbuild: { options: { target: "esnext" } },
    preset: "node-server", // change to 'netlify' or 'bun' or anyof the supported presets for nitro (nitro.unjs.io)
  },
  routers: [
    {
      type: "static",
      name: "public",
      dir: "./public",
    },
    {
      type: "http",
      name: "trpc",
      base: "/api/trpc",
      handler: "./server/handler.ts",
      target: "server",
      plugins: () => [tsconfigPaths()],
    },
    ...(process.env.NODE_ENV === "production"
      ? [{
        type: "static",
        name: "docs",
        base: "/docs",
        dir: "../docs/dist",
      } as const]
      : []),
    {
      type: "spa",
      name: "client",
      handler: "./index.html",
      target: "browser",
      plugins: () => [
        tsconfigPaths(),
        react(),
        viteStaticCopy({
          targets: [{
            src: "node_modules/onnxruntime-web/dist/*.wasm",
            dest: "./models",
          }],
        }),
      ],
    },
  ],
})
