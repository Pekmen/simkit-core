import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "./src",
    coverage: {
      reporter: ["html", "json"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
      reportsDirectory: "../coverage",
    },
  },
});
