import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  base: "/defcon-microsites/", // GitHub Pages repo name
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    rollupOptions: {
      // every HTML file listed here becomes a standalone page
      input: {
        merch: path.resolve(__dirname, "merch/index.html"),
        tv: path.resolve(__dirname, "tv/index.html"),
      },
    },
  },
});
