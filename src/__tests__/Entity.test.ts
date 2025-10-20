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

  test("getAllActiveEntities returns all created entities", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const active = manager.getAllActiveEntities();
    expect(active).toContain(entity1);
    expect(active).toContain(entity2);
    expect(active.length).toBe(2);
  });

  test("destroyEntity removes the entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();

    const result = manager.destroyEntity(entity1);
    expect(result).toBe(true);

    const active = manager.getAllActiveEntities();
    expect(active).not.toContain(entity1);
    expect(active).toContain(entity2);
    expect(active.length).toBe(1);
  });

  test("destroyEntity only removes the specified entity", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();
    const entity3: EntityId = manager.createEntity();

    manager.destroyEntity(entity2);
    const active = manager.getAllActiveEntities();
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

    const active = manager.getAllActiveEntities();
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

  test("getEntityCount returns correct count", () => {
    expect(manager.getEntityCount()).toBe(0);

    const entity1 = manager.createEntity();
    expect(manager.getEntityCount()).toBe(1);

    const entity2 = manager.createEntity();
    expect(manager.getEntityCount()).toBe(2);

    manager.destroyEntity(entity1);
    expect(manager.getEntityCount()).toBe(1);

    manager.destroyEntity(entity2);
    expect(manager.getEntityCount()).toBe(0);
  });

  test("generation increments on recycling", () => {
    const entity1 = manager.createEntity();
    const index = entity1 & 0xffffff;
    const gen1 = entity1 >>> 24;

    manager.destroyEntity(entity1);

    const entity2 = manager.createEntity();
    const index2 = entity2 & 0xffffff;
    const gen2 = entity2 >>> 24;

    expect(index2).toBe(index);
    expect(gen2).toBe((gen1 + 1) & 0xff);
  });

  test("getAllActiveEntities returns empty array initially", () => {
    expect(manager.getAllActiveEntities()).toEqual([]);
  });

  test("multiple destroy and create cycles", () => {
    const entity1 = manager.createEntity();
    const entity2 = manager.createEntity();
    const entity3 = manager.createEntity();

    manager.destroyEntity(entity1);
    manager.destroyEntity(entity2);

    const entity4 = manager.createEntity();
    const entity5 = manager.createEntity();

    expect(manager.getAllActiveEntities()).toContain(entity3);
    expect(manager.getAllActiveEntities()).toContain(entity4);
    expect(manager.getAllActiveEntities()).toContain(entity5);
    expect(manager.getAllActiveEntities().length).toBe(3);
  });

  test("snapshot captures state", () => {
    const entity1 = manager.createEntity();
    manager.createEntity();
    manager.destroyEntity(entity1);

    const snapshot = manager.createSnapshot();

    expect(snapshot.nextIndex).toBe(2);
    expect(snapshot.freeList.length).toBe(1);
    expect(snapshot.freeList[0]).toBeDefined();
  });

  test("restoreFromSnapshot preserves free list", () => {
    const entity1 = manager.createEntity();
    manager.destroyEntity(entity1);

    const snapshot = manager.createSnapshot();

    const newManager = new EntityManager();
    newManager.restoreFromSnapshot(snapshot);

    const entity2 = newManager.createEntity();
    const index1 = entity1 & 0xffffff;
    const index2 = entity2 & 0xffffff;

    expect(index2).toBe(index1);
    expect(newManager.getEntityCount()).toBe(1);
  });
});
