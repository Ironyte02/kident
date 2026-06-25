import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Auto-update the service worker in the background.
      registerType: "autoUpdate",
      injectRegister: "auto",
      // We keep the existing /public/manifest.json as the source of truth.
      manifest: false,
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png", "apple-touch-icon.png"],
      workbox: {
        // Bring in our plain-JS push/notificationclick handlers.
        importScripts: ["push-handler.js"],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,json}"],
        navigateFallback: "/index.html",
        // Don't let the SPA fallback hijack Supabase API calls.
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            // Supabase REST/Auth — always try the network first, fall back to cache.
            urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "worker", "image", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Allow testing the SW with `vite dev`. Set to false if it gets noisy.
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
