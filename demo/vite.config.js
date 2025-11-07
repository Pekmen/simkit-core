import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "simkit-core": resolve(__dirname, "../src/index.ts"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
