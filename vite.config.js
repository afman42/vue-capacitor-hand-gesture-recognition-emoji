import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: "jsdom", // Use jsdom to simulate a browser environment
    setupFiles: ["./src/test/vitest.setup.js"],
  },
});
