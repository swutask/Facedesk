import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  
  return {
    base: "/",
    server: {
      proxy: isDev
        ? { "/api": { target: "http://localhost:4001", changeOrigin: true } }
        : undefined,
    },
    plugins: [react(), isDev && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      exclude: ['chunk-OPGQCL2F.js'], // Add your problematic dependency here if it's causing issues
    },
  };
});
