import { defineComponent } from "../src/core/Component";
import { System } from "../src/core/System";
import { World } from "../src/core/World";

// Define components
interface Position {
  x: number;
  y: number;
}
interface Velocity {
  dx: number;
  dy: number;
}

const PositionComponent = defineComponent<Position>("Position", { x: 0, y: 0 });
const VelocityComponent = defineComponent<Velocity>("Velocity", {
  dx: 0,
  dy: 0,
});

// Create the world
const world = new World();

// Create entities and add components
const player = world.createEntity();
world.addComponent(player, PositionComponent, { x: 5, y: 5 });
world.addComponent(player, VelocityComponent, { dx: 1, dy: 1 });

const enemy = world.createEntity();
world.addComponent(enemy, PositionComponent, { x: 10, y: 10 });
world.addComponent(enemy, VelocityComponent, { dx: -1, dy: 0 });

// Create a system
class MovementSystem extends System {
  update(deltaTime: number): void {
    // Move all entities with Position + Velocity
    for (const entity of [player, enemy]) {
      const pos = this.world.getComponent(entity, PositionComponent);
      const vel = this.world.getComponent(entity, VelocityComponent);
      if (pos && vel) {
        pos.x += vel.dx * deltaTime;
        pos.y += vel.dy * deltaTime;
        this.world.updateComponent(entity, PositionComponent, () => pos);
      }
    }
  }
}

// Add system to world
const movementSystem = new MovementSystem(world);
world.addSystem(movementSystem);

// Run an update loop
world.update(1); // 1 time unit
