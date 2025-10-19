import { World, defineComponent } from "./dist/index.js";

// Define test components
const Position = defineComponent("Position", { x: 0, y: 0, z: 0 });
const Velocity = defineComponent("Velocity", { dx: 0, dy: 0, dz: 0 });
const Health = defineComponent("Health", { current: 100, max: 100 });
const Name = defineComponent("Name", { value: "Entity" });

// Setup
const world = new World();
const ENTITY_COUNT = 10000;
const ITERATIONS = 100;

// Create entities with various component combinations
for (let i = 0; i < ENTITY_COUNT; i++) {
  const entity = world.createEntity();
  world.addComponent(entity, Position, { x: i, y: i * 2, z: i * 3 });

  if (i % 2 === 0) {
    world.addComponent(entity, Velocity, { dx: 1, dy: 1, dz: 1 });
  }
  if (i % 3 === 0) {
    world.addComponent(entity, Health);
  }
  if (i % 5 === 0) {
    world.addComponent(entity, Name, { value: `Entity_${i}` });
  }
}

// Create query
const movableQuery = world.createQuery({
  with: [Position, Velocity],
});

console.log(`\nBenchmark: Query execution on ${ENTITY_COUNT} entities`);
console.log(`Query: entities with Position + Velocity`);
console.log(`Expected matches: ~${Math.floor(ENTITY_COUNT / 2)}`);

// First execution (will be dirty)
const start1 = performance.now();
const result1 = movableQuery.execute();
const end1 = performance.now();
console.log(`\nFirst execution (dirty): ${(end1 - start1).toFixed(3)}ms`);
console.log(`Matches found: ${result1.length}`);

// Cached executions
const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  movableQuery.execute();
}
const end2 = performance.now();
const avgCached = (end2 - start2) / ITERATIONS;
console.log(
  `\nCached execution (avg of ${ITERATIONS}): ${avgCached.toFixed(3)}ms`,
);

// Force dirty and measure again
world.addComponent(world.createEntity(), Position);
const start3 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  world.addComponent(world.createEntity(), Position);
  movableQuery.execute();
}
const end3 = performance.now();
const avgDirty = (end3 - start3) / ITERATIONS;
console.log(`Dirty execution (avg of ${ITERATIONS}): ${avgDirty.toFixed(3)}ms`);

// Benchmark destroyEntity
console.log(`\n\nBenchmark: Entity destruction`);
const destroyEntities = [];
for (let i = 0; i < 1000; i++) {
  const e = world.createEntity();
  world.addComponent(e, Position);
  world.addComponent(e, Velocity);
  world.addComponent(e, Health);
  destroyEntities.push(e);
}

const start4 = performance.now();
for (const entity of destroyEntities) {
  world.destroyEntity(entity);
}
const end4 = performance.now();
console.log(`Destroyed 1000 entities in ${(end4 - start4).toFixed(3)}ms`);
console.log(`Average per entity: ${((end4 - start4) / 1000).toFixed(3)}ms`);

console.log("\n✓ Benchmark complete");
