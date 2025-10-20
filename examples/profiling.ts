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
  private query = this.world.createQuery({ with: [Position, Velocity] });

  update(deltaTime: number): void {
    for (const entity of this.query.execute()) {
      const pos = this.world.getComponent(entity, Position)!;
      const vel = this.world.getComponent(entity, Velocity)!;
      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;
    }
  }
}

class PhysicsSystem extends System {
  private query = this.world.createQuery({ with: [Position, Velocity] });

  update(_deltaTime: number): void {
    for (const entity of this.query.execute()) {
      const vel = this.world.getComponent(entity, Velocity)!;
      vel.dx *= 0.99;
      vel.dy *= 0.99;
    }
  }
}

const world = new World({ enableProfiling: true, maxFrameHistory: 60 });
world.addSystem(new MovementSystem(world));
world.addSystem(new PhysicsSystem(world));

for (let i = 0; i < 100; i++) {
  const entity = world.createEntity();
  world.addComponent(entity, Position, {
    x: Math.random() * 100,
    y: Math.random() * 100,
  });
  world.addComponent(entity, Velocity, {
    dx: Math.random() * 2 - 1,
    dy: Math.random() * 2 - 1,
  });
}

console.log("Running simulation with profiling enabled...\n");

for (let frame = 0; frame < 100; frame++) {
  world.update(0.016);
}

const profiler = world.getProfiler();
const frameHistory = profiler.getFrameHistory();

console.log("=== Performance Report ===\n");
console.log(`Total frames: ${frameHistory.length}`);
console.log(`Average FPS: ${profiler.getFPS().toFixed(2)}`);
console.log(
  `Average frame time: ${profiler.getAverageFrameTime().toFixed(3)}ms\n`,
);

let minFrameTime = Infinity;
let maxFrameTime = 0;
for (const frame of frameHistory) {
  minFrameTime = Math.min(minFrameTime, frame.totalTime);
  maxFrameTime = Math.max(maxFrameTime, frame.totalTime);
}
console.log(`Min frame time: ${minFrameTime.toFixed(3)}ms`);
console.log(`Max frame time: ${maxFrameTime.toFixed(3)}ms\n`);

console.log("System Performance:");
const allStats = profiler.getAllStats();
for (const [operation, stats] of allStats) {
  if (operation.startsWith("system:")) {
    console.log(`  ${operation}:`);
    console.log(`    Avg: ${stats.avgTime.toFixed(3)}ms`);
    console.log(`    Min: ${stats.minTime.toFixed(3)}ms`);
    console.log(`    Max: ${stats.maxTime.toFixed(3)}ms`);
  }
}
