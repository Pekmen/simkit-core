import { World, System, defineComponent } from "../src/index.js";

// Define components
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

// Create a system
class MovementSystem extends System {
  init(): void {
    // Queries can be created in init() once world is available
  }

  update(deltaTime: number): void {
    // Or create queries inline in update() - they're lightweight
    for (const [, pos, vel] of this.world.query(Position, Velocity)) {
      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

// Create world and add system
const world = new World();
world.addSystem(MovementSystem);

// Create entities
const player = world.createEntity();
world.addComponent(player, Position, { x: 0, y: 0 });
world.addComponent(player, Velocity, { dx: 1, dy: 1 });

const enemy = world.createEntity();
world.addComponent(enemy, Position, { x: 10, y: 10 });
world.addComponent(enemy, Velocity, { dx: -1, dy: 0 });

// Run simulation
world.update(1);
