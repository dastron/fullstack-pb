import { defineConfig } from "vitest/config";
import { mergeConfig } from "vite";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      // globals: true,
      // clearMocks: true,
      // mockReset: true,
      // restoreMocks: true,
      setupFiles: ["setupTests.ts"],
      alias: {
        "@/": new URL("./src/", import.meta.url).pathname,
      },
    },
  })
);
