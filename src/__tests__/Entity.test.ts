import { EntityManager, type EntityId } from "../index.js";

describe("EntityManager", () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test("createEntity returns a unique EntityId number", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    expect(entity1).not.toEqual(entity2);
    expect(typeof entity1).toBe("number");
    expect(typeof entity2).toBe("number");
  });

  test("createEntity generates sequential ids", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    expect(entity1).toBe(0);
    expect(entity2).toBe(1);
  });

  test("getAllEntities returns all created entities", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const active = manager.getAllEntities();
    expect(active).toContain(entity1);
    expect(active).toContain(entity2);
    expect(active.length).toBe(2);
  });

  test("destroyEntity removes the entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const result = manager.destroyEntity(entity1);
    expect(result).toBe(true);

    const active = manager.getAllEntities();
    expect(active).not.toContain(entity1);
    expect(active).toContain(entity2);
    expect(active.length).toBe(1);
  });

  test("destroyEntity only removes the specified entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();
    const entity3: EntityId = manager.createEntity();

    manager.destroyEntity(entity2);
    const active = manager.getAllEntities();
    expect(active).toContain(entity1);
    expect(active).not.toContain(entity2);
    expect(active).toContain(entity3);
    expect(active.length).toBe(2);
  });

  test("destroyEntity on non-existing entity returns false", () => {
    const entity1: EntityId = manager.createEntity();
    const fakeEntity: EntityId = 999;

    const result = manager.destroyEntity(fakeEntity);
    expect(result).toBe(false);

    const active = manager.getAllEntities();
    expect(active).toContain(entity1);
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
    expect(entity1).toBe(0);

    manager.destroyEntity(entity1);

    const entity2: EntityId = manager.createEntity();
    expect(entity2).toBe(16777216);

    expect(manager.isEntityValid(entity1)).toBe(false);
    expect(manager.isEntityValid(entity2)).toBe(true);

    expect(entity1).not.toEqual(entity2);
  });

  test("generation counter prevents stale references", () => {
    const entity1 = manager.createEntity();
    const entity1Copy = entity1;
    manager.destroyEntity(entity1);
    const entity2 = manager.createEntity();

    expect(manager.isEntityValid(entity1)).toBe(false);
    expect(manager.isEntityValid(entity1Copy)).toBe(false);
    expect(manager.isEntityValid(entity2)).toBe(true);
    expect(entity1).not.toBe(entity2);
  });
});
