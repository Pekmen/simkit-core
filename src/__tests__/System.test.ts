import { System } from "../core/System";
import { World } from "../core/World";

class TestSystem extends System {
  updateCalls = 0;
  lastDelta = 0;

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

  test("update method should be called correctly", () => {
    system.update(16);
    expect(system.updateCalls).toBe(1);
    expect(system.lastDelta).toBe(16);

    system.update(32);
    expect(system.updateCalls).toBe(2);
    expect(system.lastDelta).toBe(32);
  });
});
