import { describe, test, expect, beforeEach } from "vitest";
import { EntityManager, type EntityId } from "../core/Entity";

describe("EntityManager", () => {
  let manager: EntityManager;

  beforeEach(() => {
    manager = new EntityManager();
  });

  test("createEntity returns a unique EntityId", () => {
    const entity1: EntityId = manager.createEntity();
    const entity2: EntityId = manager.createEntity();
    expect(entity1).not.toBe(entity2);
    expect(typeof entity1).toBe("number");
    expect(typeof entity2).toBe("number");
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

    manager.destroyEntity(entity1);
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

  test("destroyEntity on non-existing entity does nothing", () => {
    const entity1: EntityId = manager.createEntity();
    const fakeEntity = 999 as unknown as EntityId;
    manager.destroyEntity(fakeEntity);
    const active = manager.getAllActiveEntities();
    expect(active).toContain(entity1);
    expect(active.length).toBe(1);
  });
});
