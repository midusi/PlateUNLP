import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import mdx from "fumadocs-mdx/vite"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import * as MdxConfig from "./source.config"

export default defineConfig({
  server: { host: "0.0.0.0", port: 3000 },
  preview: { host: "0.0.0.0" },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "app",
      spa: { enabled: true },
      prerender: { enabled: false },
    }),
    nitro(),
    react(),
    mdx(MdxConfig),
  ],
  resolve: {
    alias: { tslib: "tslib/tslib.es6.js" },
    tsconfigPaths: true,
  },
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
})
