import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/branding/logo.png", "assets/branding/logo.webp"],
      manifest: {
        name: "Zirndorfer Garagen-Flohmarkt",
        short_name: "Garagen-Flohmarkt",
        description:
          "Zirndorfer Garagen-Flohmarkt - Stände entdecken und anmelden.",
        theme_color: "#10AB48",
        background_color: "#e8ecef",
        display: "standalone",
        start_url: "/",
        lang: "de",
        icons: [
          {
            src: "/assets/branding/logo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/branding/logo-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/branding/logo-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/stands"),
            handler: "NetworkFirst",
            options: {
              cacheName: "stands-api-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "osm-tiles-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
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
