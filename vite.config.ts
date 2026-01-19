import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createEmailPlugin } from "./server/vite-email-plugin.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), createEmailPlugin()],
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
