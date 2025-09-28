import { EntityId, EntityManager } from "../index.js";

describe("EntityManager", () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test("createEntity returns a unique EntityId object", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    expect(entity1).not.toEqual(entity2);
    expect(entity1).toHaveProperty("id");
    expect(entity1).toHaveProperty("generation");
    expect(entity2).toHaveProperty("id");
    expect(entity2).toHaveProperty("generation");
    expect(typeof entity1.id).toBe("number");
    expect(typeof entity1.generation).toBe("number");
  });

  test("createEntity generates sequential ids", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    expect(entity1.id).toBe(1);
    expect(entity2.id).toBe(2);
    expect(entity1.generation).toBe(0);
    expect(entity2.generation).toBe(0);
  });

  test("getAllActiveEntities returns all created entities", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const active = manager.getAllActiveEntities();
    expect(active).toContainEqual(entity1);
    expect(active).toContainEqual(entity2);
    expect(active.length).toBe(2);
  });

  test("destroyEntity removes the entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const result = manager.destroyEntity(entity1);
    expect(result).toBe(true);

    const active = manager.getAllActiveEntities();
    expect(active).not.toContainEqual(entity1);
    expect(active).toContainEqual(entity2);
    expect(active.length).toBe(1);
  });

  test("destroyEntity only removes the specified entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();
    const entity3: EntityId = manager.createEntity();

    manager.destroyEntity(entity2);
    const active = manager.getAllActiveEntities();
    expect(active).toContainEqual(entity1);
    expect(active).not.toContainEqual(entity2);
    expect(active).toContainEqual(entity3);
    expect(active.length).toBe(2);
  });

  test("destroyEntity on non-existing entity returns false", () => {
    const entity1: EntityId = manager.createEntity();
    const fakeEntity: EntityId = { id: 999, generation: 0 };

    const result = manager.destroyEntity(fakeEntity);
    expect(result).toBe(false);

    const active = manager.getAllActiveEntities();
    expect(active).toContainEqual(entity1);
    expect(active.length).toBe(1);
  });

  test("destroyEntity on already destroyed entity returns false", () => {
    const entity1: EntityId = manager.createEntity();

    expect(manager.destroyEntity(entity1)).toBe(true);
    expect(manager.destroyEntity(entity1)).toBe(false);
  });

  test("isEntityValid works correctly", () => {
    const entity1: EntityId = manager.createEntity();

    expect(manager.isEntityValid(entity1)).toBe(true);

    manager.destroyEntity(entity1);
    expect(manager.isEntityValid(entity1)).toBe(false);
  });

  test("entity recycling with generation counter", () => {
    const entity1: EntityId = manager.createEntity();
    expect(entity1.id).toBe(1);
    expect(entity1.generation).toBe(0);

    manager.destroyEntity(entity1);

    const entity2: EntityId = manager.createEntity();
    expect(entity2.id).toBe(1); // Should reuse the same ID
    expect(entity2.generation).toBe(1); // But with incremented generation

    expect(manager.isEntityValid(entity1)).toBe(false);
    expect(manager.isEntityValid(entity2)).toBe(true);

    expect(entity1).not.toEqual(entity2);
  });

  test("generation counter prevents stale references", () => {
    const entity1 = manager.createEntity();
    const entity1Copy = { ...entity1 };

    manager.destroyEntity(entity1);
    const entity2 = manager.createEntity();

    expect(manager.isEntityValid(entity1)).toBe(false);
    expect(manager.isEntityValid(entity1Copy)).toBe(false);
    expect(manager.isEntityValid(entity2)).toBe(true);
  });
});
