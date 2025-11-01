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

    world.addSystem(TestSystem);
    const addedSystem = world.getSystems()[0] as TestSystem;
    expect(addedSystem).toBeDefined();
    expect(addedSystem.isInitialized).toBe(true);
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
    world.addSystem(TestSystem);
    const addedSystem = world.getSystems()[0] as TestSystem;
    expect(addedSystem).toBeDefined();
    expect(addedSystem.isCleanedUp).toBe(false);

    world.removeSystem(addedSystem);
    expect(addedSystem.isCleanedUp).toBe(true);
  });

  test("should call cleanup when world is cleared", () => {
    world.addSystem(TestSystem);
    const addedSystem = world.getSystems()[0] as TestSystem;
    expect(addedSystem).toBeDefined();
    expect(addedSystem.isCleanedUp).toBe(false);

    world.clearSystems();
    expect(addedSystem.isCleanedUp).toBe(true);
  });

  test("should call cleanup when world is destroyed", () => {
    world.addSystem(TestSystem);
    const addedSystem = world.getSystems()[0] as TestSystem;
    expect(addedSystem).toBeDefined();
    expect(addedSystem.isCleanedUp).toBe(false);

    world.destroy();
    expect(addedSystem.isCleanedUp).toBe(true);
  });
});
