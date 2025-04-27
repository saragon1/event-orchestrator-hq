import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Regular React plugin instead of SWC
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'disabled_production' ? '/event-orchestrator-hq/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), // Use the standard React plugin without SWC
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensures index.html is copied to 404.html for GitHub Pages SPA routing
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})); 