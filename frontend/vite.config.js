import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, forward /api/* to the local Wrangler Worker
      "/api": {
        target: process.env.WORKER_DEV_URL || "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
