import path from "node:path"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 1024,
    rollupOptions: {
      input: {
        home: path.resolve(__dirname, "index.html"),
        contact: path.resolve(__dirname, "contact/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
