import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import FullReload from "vite-plugin-full-reload"

export default defineConfig({
  plugins: [react(), FullReload(["../src/**/*"])],
  resolve: {
    alias: {
      notestamp: path.resolve(__dirname, "../src"),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  preserveSymlinks: true,
})
