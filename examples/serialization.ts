import { World, defineComponent, type WorldSnapshot } from "../src/index.js";

declare const console: { log: (...args: unknown[]) => void };

// Define components
interface Position {
  x: number;
  y: number;
}
interface Health {
  current: number;
  max: number;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Health = defineComponent<Health>("Health", { current: 100, max: 100 });

// Create world with entities
const world = new World();

const player = world.createEntity();
world.addComponent(player, Position, { x: 10, y: 20 });
world.addComponent(player, Health, { current: 85, max: 100 });

const enemy = world.createEntity();
world.addComponent(enemy, Position, { x: 50, y: 30 });
world.addComponent(enemy, Health, { current: 50, max: 50 });

console.log("Original world:", world.getEntityCount(), "entities");

// Save and serialize
const snapshot = world.save();
const json = JSON.stringify(snapshot);
console.log("Serialized:", json.length, "bytes");

// Load into new world
const loaded = JSON.parse(json) as WorldSnapshot;
const world2 = new World();
world2.load(loaded, [Position, Health]);

console.log("Loaded world:", world2.getEntityCount(), "entities");
console.log("Player health:", world2.getComponent(player, Health));
console.log("Enemy position:", world2.getComponent(enemy, Position));
