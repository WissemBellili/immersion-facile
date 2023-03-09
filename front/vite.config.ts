import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "src/public",
  plugins: [react()],
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    sourcemap: true,
  },
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:1234/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    port: 3000,
  },
  preview: {
    port: 5000,
  },
});
