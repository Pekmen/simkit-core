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
function runBenchmark(name, setupFn, benchFn, cleanupFn, iterations = 1000) {
  console.log(`Running ${name}...`);

  // Setup
  setupFn();

  // Extended warm up to let JIT compiler optimize
  for (let i = 0; i < 50; i++) {
    benchFn();
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Run multiple measurement rounds to reduce variance
  const rounds = 5;
  const measurements = [];

  for (let round = 0; round < rounds; round++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      benchFn();
    }
    const end = performance.now();
    measurements.push(end - start);
  }

  // Use median to reduce impact of outliers
  measurements.sort((a, b) => a - b);
  const medianTime = measurements[Math.floor(measurements.length / 2)];
  const avgTime = medianTime / iterations;
  const opsPerSecond = Math.round(1000 / avgTime);

  console.log(
    `  ${iterations * rounds} iterations in ${measurements.reduce((a, b) => a + b, 0).toFixed(2)}ms (${avgTime.toFixed(3)}ms/op, ${opsPerSecond.toLocaleString()} ops/sec)`,
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

  // Check if GC is available
  if (!global.gc) {
    console.log(
      "\nWarning: Running without --expose-gc flag. Results may be less stable.",
    );
    console.log(
      "For more stable results, run: node --expose-gc benchmarks/local/run.js\n",
    );
  } else {
    console.log("\nGarbage collection enabled for stable measurements.\n");
  }

  console.log("Running benchmarks...\n");

  // Import benchmark functions
  const benchmarks = await import("./index.js");

  const results = {};

  // Initial warm-up run to stabilize JIT compiler before first measurement
  console.log("Initial JIT warm-up...");
  benchmarks.setupPackedIteration();
  for (let i = 0; i < 100; i++) {
    benchmarks.benchPackedIteration();
  }
  benchmarks.cleanupPackedIteration();
  if (global.gc) global.gc();
  console.log("JIT warm-up complete.\n");

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

  // Update README with latest benchmark results
  console.log("\nUpdating README.md...");
  try {
    execSync("node benchmarks/update-readme.js", {
      stdio: "inherit",
      cwd: join(__dirname, "../.."),
    });
  } catch (error) {
    console.error("Failed to update README.md");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error running benchmarks:", error);
  process.exit(1);
});
