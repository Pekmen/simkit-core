import { ComponentStorage } from "../core/ComponentStorage.js";
import { World } from "../core/World.js";

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

  test("getAllComponents and getAllEntities work correctly", () => {
    storage.addComponent(entity1, { foo: "a", count: 1 });
    storage.addComponent(entity2, { foo: "b", count: 2 });

    const allComponents = storage.getAllComponents();
    const allEntities = storage.getAllEntities();

    expect(allComponents).toContainEqual({ foo: "a", count: 1 });
    expect(allComponents).toContainEqual({ foo: "b", count: 2 });
    expect(allEntities).toContain(entity1);
    expect(allEntities).toContain(entity2);
  });

  test("size returns correct number of components", () => {
    expect(storage.size()).toBe(0);
    storage.addComponent(entity1, { foo: "x", count: 0 });
    storage.addComponent(entity2, { foo: "y", count: 1 });
    expect(storage.size()).toBe(2);
  });

  test("clear removes all components", () => {
    storage.addComponent(entity1, { foo: "a", count: 1 });
    storage.addComponent(entity2, { foo: "b", count: 2 });
    storage.clear();
    expect(storage.size()).toBe(0);
    expect(storage.getComponent(entity1)).toBeUndefined();
    expect(storage.getComponent(entity2)).toBeUndefined();
  });
});
