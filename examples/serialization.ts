import { World, defineComponent } from "../src/index.js";

// Define components
const Position = defineComponent("Position", { x: 0, y: 0 });
const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });
const Health = defineComponent("Health", { hp: 100, maxHp: 100 });
const Name = defineComponent("Name", { value: "" });

// Create a world with some entities
console.log("Creating world with entities...");
const world = new World();

// Create a player entity
const player = world.createEntity();
world.addComponent(player, Position, { x: 100, y: 150 });
world.addComponent(player, Velocity, { dx: 5, dy: 0 });
world.addComponent(player, Health, { hp: 80, maxHp: 100 });
world.addComponent(player, Name, { value: "Hero" });

// Create some enemy entities
const enemy1 = world.createEntity();
world.addComponent(enemy1, Position, { x: 200, y: 100 });
world.addComponent(enemy1, Velocity, { dx: -2, dy: 1 });
world.addComponent(enemy1, Health, { hp: 50, maxHp: 50 });
world.addComponent(enemy1, Name, { value: "Goblin" });

const enemy2 = world.createEntity();
world.addComponent(enemy2, Position, { x: 300, y: 200 });
world.addComponent(enemy2, Health, { hp: 30, maxHp: 30 });
world.addComponent(enemy2, Name, { value: "Slime" });

// Create a static object (no velocity)
const tree = world.createEntity();
world.addComponent(tree, Position, { x: 150, y: 180 });
world.addComponent(tree, Name, { value: "Oak Tree" });

console.log(`Created ${world.getEntityCount()} entities`);
console.log("\nOriginal world state:");
printWorldState(world);

// SERIALIZE: Convert world to JSON
console.log("\n=== SERIALIZING ===");
const snapshot = world.toJSON();
const jsonString = JSON.stringify(snapshot, null, 2);

console.log("Serialized to JSON:");
console.log(`Size: ${jsonString.length} characters`);
console.log(`Version: ${snapshot.version}`);
console.log(
  `Entity count in snapshot: ${snapshot.entityManager.activeEntities.length}`,
);

// Simulate saving to file/localStorage
// In a real application:
// - localStorage.setItem('gameState', jsonString);
// - or: fs.writeFileSync('savegame.json', jsonString);

// DESERIALIZE: Restore world from JSON
console.log("\n=== DESERIALIZING ===");

// Important: Must provide all component types used in the world
const componentTypes = [Position, Velocity, Health, Name];

const restoredWorld = World.fromJSON(jsonString, componentTypes);

console.log("Restored world state:");
printWorldState(restoredWorld);

// Verify restoration
console.log("\n=== VERIFICATION ===");
console.log(`Original entity count: ${world.getEntityCount()}`);
console.log(`Restored entity count: ${restoredWorld.getEntityCount()}`);

// Verify specific entities
const playerPos = restoredWorld.getComponent(player, Position);
const playerHealth = restoredWorld.getComponent(player, Health);
console.log(`\nPlayer position: (${playerPos?.x}, ${playerPos?.y})`);
console.log(`Player health: ${playerHealth?.hp}/${playerHealth?.maxHp}`);

// Test that queries work on restored world
console.log("\n=== QUERIES ON RESTORED WORLD ===");
const movingEntities = restoredWorld.createQuery({ with: [Velocity] });
console.log(
  `Moving entities: ${movingEntities.execute().length} (has Velocity component)`,
);

const allLivingEntities = restoredWorld.createQuery({ with: [Health] });
console.log(
  `Living entities: ${allLivingEntities.execute().length} (has Health component)`,
);

// Example: Partial serialization (destroy some entities before saving)
console.log("\n=== PARTIAL STATE EXAMPLE ===");
const partialWorld = new World();

// Create entities
const e1 = partialWorld.createEntity();
const e2 = partialWorld.createEntity();
const e3 = partialWorld.createEntity();

partialWorld.addComponent(e1, Position, { x: 1, y: 1 });
partialWorld.addComponent(e2, Position, { x: 2, y: 2 });
partialWorld.addComponent(e3, Position, { x: 3, y: 3 });

console.log(`Created ${partialWorld.getEntityCount()} entities`);

// Destroy middle entity
partialWorld.destroyEntity(e2);
console.log(`After destroying one: ${partialWorld.getEntityCount()} entities`);

// Serialize and restore
const partialSnapshot = partialWorld.toJSON();
const partialRestored = World.fromJSON(JSON.stringify(partialSnapshot), [
  Position,
]);

console.log(`Restored: ${partialRestored.getEntityCount()} entities`);
console.log(`Entity 1 valid: ${partialRestored.hasComponent(e1, Position)}`);
console.log(
  `Entity 2 valid: ${partialRestored.hasComponent(e2, Position)} (was destroyed)`,
);
console.log(`Entity 3 valid: ${partialRestored.hasComponent(e3, Position)}`);

// Helper function to print world state
function printWorldState(w: World): void {
  const entities = w.getAllEntities();

  for (const entity of entities) {
    const name = w.getComponent(entity, Name);
    const pos = w.getComponent(entity, Position);
    const vel = w.getComponent(entity, Velocity);
    const health = w.getComponent(entity, Health);

    console.log(`\n  Entity ${entity}${name ? ` (${name.value})` : ""}:`);

    if (pos) {
      console.log(`    Position: (${pos.x}, ${pos.y})`);
    }
    if (vel) {
      console.log(`    Velocity: (${vel.dx}, ${vel.dy})`);
    }
    if (health) {
      console.log(`    Health: ${health.hp}/${health.maxHp}`);
    }
  }
}
