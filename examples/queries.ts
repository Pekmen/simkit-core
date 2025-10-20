import { defineComponent, System, World } from "../src/index.js";

interface Position {
  x: number;
  y: number;
}
interface Velocity {
  dx: number;
  dy: number;
}
interface Health {
  current: number;
  max: number;
}
interface Player {
  name: string;
}
interface Enemy {
  difficulty: number;
}

const Position = defineComponent<Position>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<Velocity>("Velocity", { dx: 0, dy: 0 });
const Health = defineComponent<Health>("Health", { current: 100, max: 100 });
const Player = defineComponent<Player>("Player", { name: "Unknown" });
const Enemy = defineComponent<Enemy>("Enemy", { difficulty: 1 });

class MovementSystem extends System {
  private movingQuery = this.world.createQuery({ with: [Position, Velocity] });

  update(deltaTime: number): void {
    for (const entity of this.movingQuery.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      const vel = this.world.getComponent(entity, Velocity)!;
      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

class CombatSystem extends System {
  private combatantsQuery = this.world.createQuery({
    with: [Health],
    oneOf: [Player, Enemy],
  });

  update(): void {
    for (const entity of this.combatantsQuery.execute()) {
      const health = this.world.getComponent(entity, Health)!;
      if (health.current <= 0) {
        console.log(`Entity ${entity} has been defeated`);
      }
    }
  }
}

class ReportSystem extends System {
  private playerQuery = this.world.createQuery({ with: [Player] });
  private enemyQuery = this.world.createQuery({ with: [Enemy] });
  private aliveQuery = this.world.createQuery({
    with: [Health],
    without: [Velocity],
  });

  update(): void {
    console.log("\n=== Query Report ===");
    console.log(`Players: ${this.playerQuery.execute().length}`);
    console.log(`Enemies: ${this.enemyQuery.execute().length}`);
    console.log(
      `Stationary entities with health: ${this.aliveQuery.execute().length}`,
    );
  }
}

const world = new World();
world.addSystem(new MovementSystem(world));
world.addSystem(new CombatSystem(world));
world.addSystem(new ReportSystem(world));

const player = world.createEntity();
world.addComponent(player, Position, { x: 0, y: 0 });
world.addComponent(player, Velocity, { dx: 1, dy: 0.5 });
world.addComponent(player, Health, { current: 100, max: 100 });
world.addComponent(player, Player, { name: "Hero" });

const enemy1 = world.createEntity();
world.addComponent(enemy1, Position, { x: 10, y: 10 });
world.addComponent(enemy1, Velocity, { dx: -0.5, dy: -0.5 });
world.addComponent(enemy1, Health, { current: 50, max: 50 });
world.addComponent(enemy1, Enemy, { difficulty: 1 });

const enemy2 = world.createEntity();
world.addComponent(enemy2, Position, { x: 20, y: 20 });
world.addComponent(enemy2, Health, { current: 75, max: 75 });
world.addComponent(enemy2, Enemy, { difficulty: 2 });

const obstacle = world.createEntity();
world.addComponent(obstacle, Position, { x: 5, y: 5 });
world.addComponent(obstacle, Health, { current: 200, max: 200 });

console.log("Simulating queries demo...");
world.update(1);
