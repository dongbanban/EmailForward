import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createEmailPlugin } from "./server/vite-email-plugin.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
    createEmailPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    exclude: [],
  },
});
