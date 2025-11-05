import { ComponentStorage, World } from "../index.js";

interface TestComponent {
  foo: string;
  count: number;
}

describe("ComponentStorage", () => {
  let storage: ComponentStorage<TestComponent>;
  let world: World;
  let entity1: ReturnType<World["createEntity"]>;
  let entity2: ReturnType<World["createEntity"]>;

  beforeEach(() => {
    storage = new ComponentStorage<TestComponent>();
    world = new World();
    entity1 = world.createEntity();
    entity2 = world.createEntity();
  });

  test("addComponent and getComponent work correctly", () => {
    storage.addComponent(entity1, { foo: "test", count: 1 });
    const comp = storage.getComponent(entity1);
    expect(comp).toEqual({ foo: "test", count: 1 });
  });

  test("hasComponent returns true for added components", () => {
    expect(storage.hasComponent(entity1)).toBe(false);
    storage.addComponent(entity1, { foo: "test", count: 0 });
    expect(storage.hasComponent(entity1)).toBe(true);
  });

  test("removeComponent removes component", () => {
    storage.addComponent(entity1, { foo: "test", count: 0 });
    expect(storage.removeComponent(entity1)).toBe(true);
    expect(storage.getComponent(entity1)).toBeUndefined();
    expect(storage.removeComponent(entity1)).toBe(false);
  });

  test("getAllEntities works correctly", () => {
    storage.addComponent(entity1, { foo: "a", count: 1 });
    storage.addComponent(entity2, { foo: "b", count: 2 });

    const allEntities = storage.getAllEntities();

    expect(allEntities).toContain(entity1);
    expect(allEntities).toContain(entity2);
    expect(allEntities.length).toBe(2);
  });

  test("multiple components can be managed", () => {
    storage.addComponent(entity1, { foo: "x", count: 0 });
    storage.addComponent(entity2, { foo: "y", count: 1 });

    expect(storage.getAllEntities().length).toBe(2);
    expect(storage.hasComponent(entity1)).toBe(true);
    expect(storage.hasComponent(entity2)).toBe(true);
  });
});
