import { defineComponent, System, World } from "../src/index.js";

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<Velocity>("Velocity", { dx: 0, dy: 0 });

class MovementSystem extends System {
  private query = this.world.createQuery({
    with: [Position, Velocity],
  });

  update(deltaTime: number): void {
    for (const entity of this.query.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      const vel = this.world.getComponent(entity, Velocity)!;

      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

class LogSystem extends System {
  private query = this.world.createQuery({ with: [Position] });

  update(): void {
    console.log("\nEntity Positions:");
    for (const entity of this.query.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      console.log(
        `  Entity ${entity}: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`,
      );
    }
  }
}

const world = new World();

world.addSystem(new MovementSystem(world));
world.addSystem(new LogSystem(world));

const player = world.createEntity();
world.addComponent(player, Position, { x: 0, y: 0 });
world.addComponent(player, Velocity, { dx: 1, dy: 1 });

const enemy = world.createEntity();
world.addComponent(enemy, Position, { x: 10, y: 10 });
world.addComponent(enemy, Velocity, { dx: -1, dy: -0.5 });

const obstacle = world.createEntity();
world.addComponent(obstacle, Position, { x: 5, y: 5 });

console.log("=== Simulation Start ===");
console.log(`Total entities: ${world.getEntityCount()}`);

for (let i = 0; i < 5; i++) {
  console.log(`\n--- Frame ${i + 1} ---`);
  world.update(0.5);
}

console.log("\n=== Simulation End ===");
