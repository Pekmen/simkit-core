import { World, defineComponent, type WorldSnapshot } from "../src/index.js";

// Type declaration for console (Node.js runtime)
declare const console: {
  log: (...args: unknown[]) => void;
};

// Define component types
interface Position {
  x: number;
  y: number;
}

interface Velocity {
  vx: number;
  vy: number;
}

interface Health {
  current: number;
  max: number;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<Velocity>("Velocity", { vx: 0, vy: 0 });
const Health = defineComponent<Health>("Health", { current: 100, max: 100 });

// Create a world and populate it with entities
const world = new World();

const player = world.createEntity();
world.addComponent(player, Position, { x: 10, y: 20 });
world.addComponent(player, Velocity, { vx: 1, vy: 0 });
world.addComponent(player, Health, { current: 85, max: 100 });

const enemy1 = world.createEntity();
world.addComponent(enemy1, Position, { x: 50, y: 30 });
world.addComponent(enemy1, Velocity, { vx: -1, vy: 0.5 });
world.addComponent(enemy1, Health, { current: 50, max: 50 });

const enemy2 = world.createEntity();
world.addComponent(enemy2, Position, { x: 75, y: 60 });
world.addComponent(enemy2, Health, { current: 30, max: 30 });

console.log("Original world:");
console.log(`  Entities: ${world.getEntityCount().toString()}`);
console.log(
  `  Player position: ${JSON.stringify(world.getComponent(player, Position))}`,
);
console.log(
  `  Enemy1 position: ${JSON.stringify(world.getComponent(enemy1, Position))}`,
);

// Save world state
const snapshot = world.save();

// Serialize to JSON (for file storage, network transfer, etc.)
const json = JSON.stringify(snapshot, null, 2);
console.log("\nSerialized world to JSON:");
console.log(`  JSON size: ${json.length.toString()} bytes`);

// Simulate loading from saved data
const loadedSnapshot = JSON.parse(json) as WorldSnapshot;

// Create a new world and load the state
const world2 = new World();
world2.load(loadedSnapshot, [Position, Velocity, Health]);

console.log("\nLoaded world:");
console.log(`  Entities: ${world2.getEntityCount().toString()}`);
console.log(
  `  Player position: ${JSON.stringify(world2.getComponent(player, Position))}`,
);
console.log(
  `  Enemy1 position: ${JSON.stringify(world2.getComponent(enemy1, Position))}`,
);

// Verify entity IDs are preserved
console.log("\nEntity IDs preserved:");
console.log(
  `  Player health: ${JSON.stringify(world2.getComponent(player, Health))}`,
);
console.log(
  `  Enemy1 health: ${JSON.stringify(world2.getComponent(enemy1, Health))}`,
);
console.log(
  `  Enemy2 health: ${JSON.stringify(world2.getComponent(enemy2, Health))}`,
);

// Queries work on deserialized world
const movingEntities = world2.createQuery({ with: [Position, Velocity] });
console.log(`\nMoving entities: ${movingEntities.execute().length.toString()}`);
