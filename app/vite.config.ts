import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  root: ".",
  publicDir: "public",
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
