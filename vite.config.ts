import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react-oxc"
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    react(),
    tanstackStart({
      customViteReactPlugin: true,
      target: "node-server",
      tsr: { srcDirectory: "app" },
      spa: { enabled: true },
    }),
  ],
  experimental: { enableNativePlugin: true },
  resolve: { tsconfigPaths: true },
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
})
