import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    coverage: {
      reporter: ["html"],
      include: ["src/core/**/*.ts"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
      reportsDirectory: "coverage",
    },
  },
});
