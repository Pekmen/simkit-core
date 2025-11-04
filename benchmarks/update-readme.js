#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const README_PATH = join(__dirname, "..", "README.md");
const LATEST_RESULTS_PATH = join(__dirname, "local", "results", "latest.json");

function updateReadme() {
  // Read the latest benchmark results
  let results;
  try {
    results = JSON.parse(readFileSync(LATEST_RESULTS_PATH, "utf8"));
  } catch (error) {
    console.error("Error reading benchmark results:", error.message);
    console.error(
      "Run 'npm run benchmark' first to generate benchmark results.",
    );
    process.exit(1);
  }

  // Read the README
  let readme;
  try {
    readme = readFileSync(README_PATH, "utf8");
  } catch (error) {
    console.error("Error reading README.md:", error.message);
    process.exit(1);
  }

  // Format the date
  const date = new Date(results.timestamp);
  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

  // Create the benchmark section
  const benchmarkSection = `<!-- BENCHMARK_START -->

## Performance

Latest benchmark results for version ${results.version} (${formattedDate}):

| Benchmark | Operations/sec |
|-----------|---------------:|
| Packed Iteration (5 queries) | ${results.results.packed_5.toLocaleString()} |
| Simple Iteration | ${results.results.simple_iter.toLocaleString()} |
| Fragmented Iteration | ${results.results.frag_iter.toLocaleString()} |
| Entity Cycle | ${results.results.entity_cycle.toLocaleString()} |
| Add/Remove Component | ${results.results.add_remove.toLocaleString()} |

### Benchmark Descriptions

- **Packed Iteration (5 queries)**: Tests core iteration overhead with multiple queries on 1,000 entities
- **Simple Iteration**: Tests independent systems on entities with different component combinations
- **Fragmented Iteration**: Tests iteration through fragmented dataset (26 component types)
- **Entity Cycle**: Tests entity creation and destruction performance
- **Add/Remove Component**: Tests component addition and removal on existing entities

*Benchmarks run on Node.js ${results.node_version} on ${results.os}*

<!-- BENCHMARK_END -->`;

  // Replace the benchmark section
  const updatedReadme = readme.replace(
    /<!-- BENCHMARK_START -->[\s\S]*?<!-- BENCHMARK_END -->/,
    benchmarkSection,
  );

  // Write the updated README
  try {
    writeFileSync(README_PATH, updatedReadme);
    console.log("\n✓ README.md updated with latest benchmark results");
    console.log(`  Version: ${results.version}`);
    console.log(`  Date: ${formattedDate}`);
  } catch (error) {
    console.error("Error writing README.md:", error.message);
    process.exit(1);
  }
}

updateReadme();
