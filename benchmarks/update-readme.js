#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS_DIR = join(__dirname, "results");
const README_PATH = join(__dirname, "..", "README.md");

function formatNumber(num) {
  if (num === null || num === undefined) {
    return "TODO";
  }
  return num.toLocaleString();
}

function generateBenchmarkTable(results) {
  const { version, timestamp, results: benchmarkResults } = results;

  return `## Performance

Latest benchmark results for version ${version} (${new Date(timestamp).toLocaleDateString()}):

| Benchmark | Operations/sec |
|-----------|---------------:|
| Packed Iteration (5 queries) | ${formatNumber(benchmarkResults.packed_5)} |
| Simple Iteration | ${formatNumber(benchmarkResults.simple_iter)} |
| Fragmented Iteration | ${formatNumber(benchmarkResults.frag_iter)} |
| Entity Cycle | ${formatNumber(benchmarkResults.entity_cycle)} |
| Add/Remove Component | ${formatNumber(benchmarkResults.add_remove)} |

### Benchmark Descriptions

- **Packed Iteration (5 queries)**: Tests core iteration overhead with multiple queries on 1,000 entities
- **Simple Iteration**: Tests independent systems on entities with different component combinations  
- **Fragmented Iteration**: Tests iteration through fragmented dataset (26 component types)
- **Entity Cycle**: Tests entity creation and destruction performance
- **Add/Remove Component**: Tests component addition and removal on existing entities

*Benchmarks run on Node.js ${results.node_version} on ${results.os}*`;
}

function updateReadme() {
  // Check if latest results exist
  const latestResultsPath = join(RESULTS_DIR, "latest.json");
  if (!existsSync(latestResultsPath)) {
    console.log("No benchmark results found, skipping README update");
    return;
  }

  // Read latest benchmark results
  const latestResults = JSON.parse(readFileSync(latestResultsPath, "utf8"));

  // Read current README
  if (!existsSync(README_PATH)) {
    console.error("README.md not found");
    process.exit(1);
  }

  let readmeContent = readFileSync(README_PATH, "utf8");

  // Generate new benchmark section
  const benchmarkSection = generateBenchmarkTable(latestResults);

  // Define markers for benchmark section
  const startMarker = "<!-- BENCHMARK_START -->";
  const endMarker = "<!-- BENCHMARK_END -->";

  // Check if benchmark section exists
  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    // Replace existing benchmark section
    const before = readmeContent.substring(0, startIndex + startMarker.length);
    const after = readmeContent.substring(endIndex);
    readmeContent = before + "\n\n" + benchmarkSection + "\n\n" + after;
  } else {
    // Add benchmark section before installation section or at the end
    const installationIndex = readmeContent.indexOf("## Installation");
    if (installationIndex !== -1) {
      const before = readmeContent.substring(0, installationIndex);
      const after = readmeContent.substring(installationIndex);
      readmeContent =
        before +
        startMarker +
        "\n\n" +
        benchmarkSection +
        "\n\n" +
        endMarker +
        "\n\n" +
        after;
    } else {
      // Add at the end
      readmeContent =
        readmeContent.trimEnd() +
        "\n\n" +
        startMarker +
        "\n\n" +
        benchmarkSection +
        "\n\n" +
        endMarker +
        "\n";
    }
  }

  // Write updated README
  writeFileSync(README_PATH, readmeContent);
  console.log(
    `Updated README.md with benchmark results for version ${latestResults.version}`,
  );
}

function listAvailableResults() {
  if (!existsSync(RESULTS_DIR)) {
    console.log("No benchmark results directory found");
    return;
  }

  const files = require("fs")
    .readdirSync(RESULTS_DIR)
    .filter((file) => file.endsWith(".json") && file !== "latest.json")
    .sort();

  console.log("Available benchmark results:");
  files.forEach((file) => {
    const version = file.replace(".json", "");
    const data = JSON.parse(readFileSync(join(RESULTS_DIR, file), "utf8"));
    console.log(
      `  ${version} - ${new Date(data.timestamp).toLocaleDateString()}`,
    );
  });
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--list")) {
  listAvailableResults();
} else {
  updateReadme();
}
