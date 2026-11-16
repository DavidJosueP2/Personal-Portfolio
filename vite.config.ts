import { existsSync } from "node:fs"
import path from "node:path"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "local-kh-teka-preview",
      apply: "serve",
      transformIndexHtml() {
        const trialFont = path.resolve(__dirname, "fonts-local/KH-Teka-Trial/KH Teka Trial/WOFF2/KHTekaTRIAL-Regular.woff2")
        if (!existsSync(trialFont)) return []
        return [{ tag: "link", attrs: { rel: "stylesheet", href: "/src/styles/kh-teka-preview.css" }, injectTo: "head" }]
      },
    },
  ],
  build: {
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
