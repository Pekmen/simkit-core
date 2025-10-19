/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, beforeEach } from "vitest";
import { World } from "../core/World.js";
import { System } from "../core/System.js";
import { defineComponent } from "../core/Component.js";

describe("Profiling Integration", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.enableProfiling();
  });

  describe("World profiling", () => {
    it("should provide access to profiler", () => {
      const profiler = world.getProfiler();
      expect(profiler).toBeDefined();
      expect(profiler.isEnabled()).toBe(true);
    });

    it("should enable and disable profiling", () => {
      world.disableProfiling();
      expect(world.getProfiler().isEnabled()).toBe(false);

      world.enableProfiling();
      expect(world.getProfiler().isEnabled()).toBe(true);
    });
  });

  describe("Component operation profiling", () => {
    it("should profile component additions", () => {
      const Position = defineComponent("Position", {
        x: 0,
        y: 0,
      });

      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const stats = world.getProfiler().getStats("component:add");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it("should profile component removals", () => {
      const Position = defineComponent("Position", {
        x: 0,
        y: 0,
      });

      const entity = world.createEntity();
      world.addComponent(entity, Position);
      world.removeComponent(entity, Position);

      const removeStats = world.getProfiler().getStats("component:remove");
      expect(removeStats).toBeDefined();
      expect(removeStats!.count).toBe(1);
    });

    it("should accumulate multiple component operations", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });

      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, Position);
      world.addComponent(entity1, Velocity);
      world.addComponent(entity2, Position);

      const stats = world.getProfiler().getStats("component:add");
      expect(stats!.count).toBe(3);
    });
  });

  describe("System profiling", () => {
    it("should profile system execution", () => {
      class TestSystem extends System {
        update(_deltaTime: number): void {
          // Simple system
        }
      }

      const system = new TestSystem(world);
      world.addSystem(system);
      world.update(16.67);

      const stats = world.getProfiler().getStats("system:TestSystem");
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });

    it("should profile multiple systems", () => {
      class PhysicsSystem extends System {
        update(_deltaTime: number): void {}
      }

      class RenderSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new PhysicsSystem(world));
      world.addSystem(new RenderSystem(world));
      world.update(16.67);

      expect(
        world.getProfiler().getStats("system:PhysicsSystem"),
      ).toBeDefined();
      expect(world.getProfiler().getStats("system:RenderSystem")).toBeDefined();
    });

    it("should accumulate system execution times", () => {
      class TestSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new TestSystem(world));
      world.update(16.67);
      world.update(16.67);
      world.update(16.67);

      const stats = world.getProfiler().getStats("system:TestSystem");
      expect(stats!.count).toBe(3);
    });
  });

  describe("Query profiling", () => {
    it("should profile query execution", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      const entity = world.createEntity();
      world.addComponent(entity, Position);

      const query = world.createQuery({ with: [Position] });
      query.execute();

      const stats = world.getProfiler().getStats("query:execute");
      expect(stats).toBeDefined();
      expect(stats!.count).toBeGreaterThan(0);
    });

    it("should profile multiple query executions", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });

      world.createEntity();
      world.createEntity();

      const query = world.createQuery({ with: [Position, Velocity] });
      query.execute();
      query.execute();

      const stats = world.getProfiler().getStats("query:execute");
      expect(stats!.count).toBeGreaterThan(0);
    });
  });

  describe("Frame profiling", () => {
    it("should create frame profiles on world update", () => {
      class TestSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new TestSystem(world));
      world.update(16.67);

      const lastFrame = world.getProfiler().getLastFrame();
      expect(lastFrame).toBeDefined();
      expect(lastFrame!.frameNumber).toBe(0);
    });

    it("should track multiple frames", () => {
      class TestSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new TestSystem(world));
      world.update(16.67);
      world.update(16.67);
      world.update(16.67);

      const history = world.getProfiler().getFrameHistory();
      expect(history.length).toBe(3);
      expect(history[0].frameNumber).toBe(0);
      expect(history[2].frameNumber).toBe(2);
    });

    it("should categorize frame time by operation type", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      class TestSystem extends System {
        private query = this.world.createQuery({ with: [Position] });

        update(_deltaTime: number): void {
          const entities = this.query.execute();
          for (const entity of entities) {
            this.world.getComponent(entity, Position);
          }
        }
      }

      const entity = world.createEntity();
      world.addComponent(entity, Position);

      world.addSystem(new TestSystem(world));
      world.update(16.67);

      const frame = world.getProfiler().getLastFrame();
      expect(frame!.systemTime).toBeGreaterThan(0);
    });

    it("should calculate average frame time and FPS", () => {
      class TestSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new TestSystem(world));

      for (let i = 0; i < 10; i++) {
        world.update(16.67);
      }

      const avgFrameTime = world.getProfiler().getAverageFrameTime();
      const fps = world.getProfiler().getFPS();

      expect(avgFrameTime).toBeGreaterThan(0);
      expect(fps).toBeGreaterThan(0);
    });
  });

  describe("Profiler report", () => {
    it("should generate comprehensive report", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      class MovementSystem extends System {
        private query = this.world.createQuery({ with: [Position] });

        update(_deltaTime: number): void {
          this.query.execute();
        }
      }

      const entity = world.createEntity();
      world.addComponent(entity, Position);

      world.addSystem(new MovementSystem(world));
      world.update(16.67);

      const report = world.getProfiler().generateReport();

      expect(report).toContain("Profiler Report");
      expect(report).toContain("system:MovementSystem");
      expect(report).toContain("component:add");
      expect(report).toContain("query:execute");
    });
  });

  describe("Performance with profiling disabled", () => {
    it("should not record data when profiling is disabled", () => {
      world.disableProfiling();

      const Position = defineComponent("Position", { x: 0, y: 0 });
      const entity = world.createEntity();
      world.addComponent(entity, Position);

      class TestSystem extends System {
        update(_deltaTime: number): void {}
      }

      world.addSystem(new TestSystem(world));
      world.update(16.67);

      expect(world.getProfiler().getAllStats().size).toBe(0);
      expect(world.getProfiler().getFrameHistory().length).toBe(0);
    });
  });
});
