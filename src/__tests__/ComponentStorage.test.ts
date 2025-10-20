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

  test("updating component via addComponent", () => {
    storage.addComponent(entity1, { foo: "initial", count: 1 });
    expect(storage.getComponent(entity1)).toEqual({ foo: "initial", count: 1 });

    storage.addComponent(entity1, { foo: "updated", count: 2 });
    expect(storage.getComponent(entity1)).toEqual({ foo: "updated", count: 2 });
    expect(storage.size()).toBe(1);
  });

  test("swap and pop during removal maintains data integrity", () => {
    const entity3 = world.createEntity();

    storage.addComponent(entity1, { foo: "first", count: 1 });
    storage.addComponent(entity2, { foo: "second", count: 2 });
    storage.addComponent(entity3, { foo: "third", count: 3 });

    storage.removeComponent(entity1);

    expect(storage.hasComponent(entity1)).toBe(false);
    expect(storage.hasComponent(entity2)).toBe(true);
    expect(storage.hasComponent(entity3)).toBe(true);
    expect(storage.getComponent(entity2)).toEqual({ foo: "second", count: 2 });
    expect(storage.getComponent(entity3)).toEqual({ foo: "third", count: 3 });
    expect(storage.size()).toBe(2);
  });

  test("removing last component", () => {
    storage.addComponent(entity1, { foo: "only", count: 1 });
    expect(storage.size()).toBe(1);

    storage.removeComponent(entity1);
    expect(storage.size()).toBe(0);
    expect(storage.hasComponent(entity1)).toBe(false);
  });

  test("getAllComponents returns empty array initially", () => {
    expect(storage.getAllComponents()).toEqual([]);
  });

  test("getAllEntities returns empty array initially", () => {
    expect(storage.getAllEntities()).toEqual([]);
  });

  test("getComponent returns undefined for non-existent entity", () => {
    const nonExistentEntity = 999 as ReturnType<World["createEntity"]>;
    expect(storage.getComponent(nonExistentEntity)).toBeUndefined();
  });

  test("component arrays stay synchronized", () => {
    storage.addComponent(entity1, { foo: "a", count: 1 });
    storage.addComponent(entity2, { foo: "b", count: 2 });

    const components = storage.getAllComponents();
    const entities = storage.getAllEntities();

    expect(components.length).toBe(entities.length);
    expect(components.length).toBe(storage.size());
  });
});
