import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.js"],
    // Silence noisy React act() warnings in test output
    onConsoleLog(log) {
      if (log.includes("act(")) return false;
    },
  },
});
