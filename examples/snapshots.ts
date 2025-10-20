import {
  defineComponent,
  System,
  World,
  type ComponentSerializer,
} from "../src/index.js";

interface Position {
  x: number;
  y: number;
}
interface Timestamp {
  created: Date;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Timestamp = defineComponent<Timestamp>("Timestamp", {
  created: new Date(),
});

const timestampSerializer: ComponentSerializer<Timestamp> = {
  serialize: (component) => ({
    created: component.created.toISOString(),
  }),
  deserialize: (data) => ({
    created: new Date(data.created as string),
  }),
};

class LogSystem extends System {
  private query = this.world.createQuery({ with: [Position, Timestamp] });

  update(): void {
    console.log("\nCurrent entities:");
    for (const entity of this.query.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      const ts = this.world.getComponent(entity, Timestamp)!;
      console.log(
        `  Entity ${entity}: (${pos.x}, ${pos.y}) created at ${ts.created.toLocaleTimeString()}`,
      );
    }
  }
}

const world = new World();
world.addSystem(new LogSystem(world));

const entity1 = world.createEntity();
world.addComponent(entity1, Position, { x: 10, y: 20 });
world.addComponent(entity1, Timestamp, { created: new Date() });

const entity2 = world.createEntity();
world.addComponent(entity2, Position, { x: 30, y: 40 });
world.addComponent(entity2, Timestamp, {
  created: new Date(Date.now() - 1000 * 60),
});

console.log("=== Original World ===");
world.update(0);

const snapshot = world.createSnapshot({
  Timestamp: timestampSerializer,
});

console.log("\n=== Creating snapshot and loading into new world ===");

const newWorld = new World();
newWorld.addSystem(new LogSystem(newWorld));
newWorld.restoreFromSnapshot(snapshot, {
  Timestamp: timestampSerializer,
});

console.log("\n=== Restored World ===");
newWorld.update(0);

console.log("\n=== Modifying restored world ===");
const entity3 = newWorld.createEntity();
newWorld.addComponent(entity3, Position, { x: 50, y: 60 });
newWorld.addComponent(entity3, Timestamp, { created: new Date() });

newWorld.update(0);

console.log("\n=== Original world unchanged ===");
world.update(0);
