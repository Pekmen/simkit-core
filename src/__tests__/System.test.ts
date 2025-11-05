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

  beforeEach(() => {
    world = new World();
  });

  test("should store the world reference after being added to world", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;
    expect(system.getWorld()).toBe(world);
  });

  test("should be initialized when added to world", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;
    expect(system).toBeDefined();
    expect(system.isInitialized).toBe(true);
  });

  test("update method should be called correctly", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;

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

  test("should have access to world in init method", () => {
    let worldAccessible = false;

    class InitTestSystem extends System {
      init(): void {
        worldAccessible = Boolean(this.world);
      }

      update(): void {
        // Required abstract method
      }
    }

    world.addSystem(InitTestSystem);
    expect(worldAccessible).toBe(true);
  });

  test("should work with instance creation without passing world", () => {
    const system = new TestSystem();
    world.addSystem(system);

    expect(system.getWorld()).toBe(world);
    expect(system.isInitialized).toBe(true);
  });
});
