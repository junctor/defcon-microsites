import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  plugins: [react(), tailwindcss()],
  base: "/defcon-microsites/", // GitHub Pages repo base; dev serves entries under it too.
  resolve: {
    alias: { "@": path.resolve(projectRoot, "src") },
  },
  build: {
    rollupOptions: {
      // every HTML file listed here becomes a standalone page
      input: {
        index: path.resolve(projectRoot, "index.html"),
        merch: path.resolve(projectRoot, "merch/index.html"),
        tv: path.resolve(projectRoot, "tv/index.html"),
      },
    },
  },
});
