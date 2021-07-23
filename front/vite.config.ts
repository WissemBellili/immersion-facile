import { defineConfig } from "vite";
import { resolve } from "path";
import reactRefresh from "@vitejs/plugin-react-refresh";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8080/";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  resolve: {
    alias: {
      src: resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
