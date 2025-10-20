import { System, World } from "../index.js";

class TestSystem extends System {
  updateCalls = 0;
  lastDelta = 0;
  isInitialized = false;
  isCleanedUp = false;

  init(): void {
    this.isInitialized = true;
  }

  cleanup(): void {
    this.isCleanedUp = true;
  }

  getWorld(): World {
    return this.world;
  }

  update(deltaTime: number): void {
    this.updateCalls++;
    this.lastDelta = deltaTime;
  }
}

describe("System", () => {
  let world: World;
  let system: TestSystem;

  beforeEach(() => {
    world = new World();
    system = new TestSystem(world);
  });

  test("should store the world reference", () => {
    expect(system.getWorld()).toBe(world);
  });

  test("should not be initialized until added to world", () => {
    expect(system.isInitialized).toBe(false);

    world.addSystem(system);
    expect(system.isInitialized).toBe(true);
  });

  test("update method should be called correctly", () => {
    system.update(16);
    expect(system.updateCalls).toBe(1);
    expect(system.lastDelta).toBe(16);

    system.update(32);
    expect(system.updateCalls).toBe(2);
    expect(system.lastDelta).toBe(32);
  });

  test("should call cleanup when removed from world", () => {
    world.addSystem(system);
    expect(system.isCleanedUp).toBe(false);

    world.removeSystem(system);
    expect(system.isCleanedUp).toBe(true);
  });

  test("should call cleanup when world is cleared", () => {
    world.addSystem(system);
    expect(system.isCleanedUp).toBe(false);

    world.clearSystems();
    expect(system.isCleanedUp).toBe(true);
  });

  test("should call cleanup when world is destroyed", () => {
    world.addSystem(system);
    expect(system.isCleanedUp).toBe(false);

    world.destroy();
    expect(system.isCleanedUp).toBe(true);
  });

  test("init should not be called on construction", () => {
    const newSystem = new TestSystem(world);
    expect(newSystem.isInitialized).toBe(false);
  });

  test("update should receive correct deltaTime", () => {
    world.addSystem(system);
    world.update(100.5);
    expect(system.lastDelta).toBe(100.5);
  });

  test("system can access world", () => {
    expect(system.getWorld()).toBe(world);
  });

  test("cleanup should not be called until system is removed", () => {
    world.addSystem(system);
    world.update(16);
    expect(system.isCleanedUp).toBe(false);
  });
});
