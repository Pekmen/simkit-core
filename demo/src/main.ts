import { World, defineComponent, System } from "simkit-core";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const NUM_PARTICLES = 50_000;

let canvasContext: CanvasRenderingContext2D;
let fps = 0;

// -------------------- Components --------------------
interface PositionType {
  x: number;
  y: number;
}
interface VelocityType {
  x: number;
  y: number;
}
interface ParticleType {
  size: number;
  r: number;
  g: number;
  b: number;
}

const Position = defineComponent<PositionType>("Position", { x: 0, y: 0 });
const Velocity = defineComponent<VelocityType>("Velocity", { x: 0, y: 0 });
const Particle = defineComponent<ParticleType>("Particle", {
  size: 1,
  r: 255,
  g: 100,
  b: 100,
});

// -------------------- Physics System --------------------
class PhysicsSystem extends System {
  private query = this.world.query(Position, Velocity, Particle);

  update(deltaTime: number): void {
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    for (const [_, pos, vel, particle] of this.query) {
      const size = particle.size;
      let x = pos.x + vel.x * deltaTime;
      let y = pos.y + vel.y * deltaTime;

      if (x < size) {
        x = size;
        vel.x = Math.abs(vel.x);
      } else if (x > w - size) {
        x = w - size;
        vel.x = -Math.abs(vel.x);
      }

      if (y < size) {
        y = size;
        vel.y = Math.abs(vel.y);
      } else if (y > h - size) {
        y = h - size;
        vel.y = -Math.abs(vel.y);
      }

      pos.x = x;
      pos.y = y;
    }
  }
}

// -------------------- Render System (optimized) --------------------
class RenderSystem extends System {
  private query = this.world.query(Position, Particle);
  private imageData!: ImageData;
  private buffer!: Uint8ClampedArray;

  init(): void {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    canvasContext = ctx;

    this.imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.buffer = this.imageData.data;
  }

  update(_: number): void {
    // Clear buffer
    this.buffer.fill(26); // background RGB=26 (#1a1a2e)
    for (let i = 0; i < this.buffer.length; i += 4) this.buffer[i + 3] = 255; // alpha

    for (const [_, pos, particle] of this.query) {
      const px = Math.floor(pos.x);
      const py = Math.floor(pos.y);
      if (px < 0 || px >= CANVAS_WIDTH || py < 0 || py >= CANVAS_HEIGHT)
        continue;

      const index = (py * CANVAS_WIDTH + px) * 4;
      this.buffer[index] = particle.r;
      this.buffer[index + 1] = particle.g;
      this.buffer[index + 2] = particle.b;
      this.buffer[index + 3] = 255;
    }

    canvasContext.putImageData(this.imageData, 0, 0);

    // Draw FPS
    canvasContext.fillStyle = "white";
    canvasContext.font = "16px monospace";
    canvasContext.fillText(`FPS: ${fps}`, 10, 20);
  }
}

// -------------------- Init --------------------
function init(): void {
  const world = new World();
  world.addSystem(PhysicsSystem);
  world.addSystem(RenderSystem);

  // Create particles
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const entity = world.createEntity();
    world.addComponent(entity, Position, {
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
    });
    world.addComponent(entity, Velocity, {
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    });
    const hue = Math.random() * 360;
    world.addComponent(entity, Particle, {
      size: 1,
      r: 255,
      g: Math.floor(200 * Math.random()),
      b: Math.floor(200 * Math.random()),
    });
  }

  let lastTime = performance.now();
  let lastFpsUpdate = performance.now();
  let framesThisSecond = 0;

  function gameLoop(currentTime: number): void {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    framesThisSecond++;
    if (currentTime - lastFpsUpdate >= 1000) {
      fps = framesThisSecond;
      framesThisSecond = 0;
      lastFpsUpdate = currentTime;
    }

    world.update(deltaTime);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

// -------------------- Start --------------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
