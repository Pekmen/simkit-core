#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESULTS_DIR = join(__dirname, "results");

// Read package.json to get version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../..", "package.json"), "utf8"),
);
const version = packageJson.version;

/**
 * Run a benchmark function multiple times and calculate ops/sec
 */
function runBenchmark(name, setupFn, benchFn, cleanupFn, iterations = 100) {
  console.log(`Running ${name}...`);

  // Setup
  setupFn();

  // Warm up
  for (let i = 0; i < 5; i++) {
    benchFn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    benchFn();
  }
  const end = performance.now();

  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  const opsPerSecond = Math.round(1000 / avgTime);

  console.log(
    `  ${iterations} iterations in ${totalTime.toFixed(2)}ms (${avgTime.toFixed(2)}ms/op, ${opsPerSecond.toLocaleString()} ops/sec)`,
  );

  // Cleanup
  cleanupFn();

  return opsPerSecond;
}

async function main() {
  console.log("Building project...");
  const { execSync } = await import("child_process");

  // Build the project first
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (error) {
    console.error("Failed to build project");
    process.exit(1);
  }

  // Compile benchmarks
  console.log("\nCompiling benchmarks...");
  try {
    execSync(
      "tsc benchmarks/local/index.ts --outDir benchmarks/local --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck",
      { stdio: "inherit", cwd: join(__dirname, "../..") },
    );
  } catch (error) {
    console.error("Failed to compile benchmarks");
    process.exit(1);
  }

  console.log("\nRunning benchmarks...\n");

  // Import benchmark functions
  const benchmarks = await import("./index.js");

  const results = {};

  // Run each benchmark
  results.packed_5 = runBenchmark(
    "Packed Iteration (5 queries)",
    benchmarks.setupPackedIteration,
    benchmarks.benchPackedIteration,
    benchmarks.cleanupPackedIteration,
  );
  results.simple_iter = runBenchmark(
    "Simple Iteration",
    benchmarks.setupSimpleIteration,
    benchmarks.benchSimpleIteration,
    benchmarks.cleanupSimpleIteration,
  );
  results.frag_iter = runBenchmark(
    "Fragmented Iteration",
    benchmarks.setupFragmentedIteration,
    benchmarks.benchFragmentedIteration,
    benchmarks.cleanupFragmentedIteration,
  );
  results.entity_cycle = runBenchmark(
    "Entity Cycle",
    benchmarks.setupEntityCycle,
    benchmarks.benchEntityCycle,
    benchmarks.cleanupEntityCycle,
  );
  results.add_remove = runBenchmark(
    "Add/Remove Component",
    benchmarks.setupAddRemove,
    benchmarks.benchAddRemove,
    benchmarks.cleanupAddRemove,
  );

  // Create result object
  const result = {
    version: version,
    timestamp: new Date().toISOString(),
    results: results,
    node_version: process.version,
    os: os.platform(),
  };

  // Save versioned results
  const versionedPath = join(RESULTS_DIR, `v${version}.json`);
  writeFileSync(versionedPath, JSON.stringify(result, null, 2) + "\n");
  console.log(`\nSaved results to ${versionedPath}`);

  // Save as latest
  const latestPath = join(RESULTS_DIR, "latest.json");
  writeFileSync(latestPath, JSON.stringify(result, null, 2) + "\n");
  console.log(`Saved results to ${latestPath}`);

  console.log("\n=== Benchmark Results ===");
  console.log(`Version: ${version}`);
  console.log(`Node: ${process.version}`);
  console.log(`OS: ${os.platform()}`);
  console.log("\nOperations per second:");
  for (const [key, value] of Object.entries(results)) {
    console.log(`  ${key.padEnd(20)}: ${value.toLocaleString()}`);
  }
}

main().catch((error) => {
  console.error("Error running benchmarks:", error);
  process.exit(1);
});
