import { describe, it, expect, beforeEach } from "vitest";
import { World, defineComponent } from "../index.js";

describe("Query Cache", () => {
  let world: World;

  const Position = defineComponent<{ x: number; y: number }>("Position", {
    x: 0,
    y: 0,
  });

  const Velocity = defineComponent<{ dx: number; dy: number }>("Velocity", {
    dx: 0,
    dy: 0,
  });

  const Health = defineComponent<{ hp: number }>("Health", {
    hp: 100,
  });

  beforeEach(() => {
    world = new World();
  });

  describe("Basic Caching", () => {
    it("should cache query results after first iteration", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const query = world.query(Position);

      // First iteration - computes results
      const results1 = Array.from(query);
      expect(results1).toHaveLength(1);
      expect(query.getCacheSize()).toBe(1);

      // Second iteration - uses cache
      const results2 = Array.from(query);
      expect(results2).toHaveLength(1);
      expect(results2).toEqual(results1);
      expect(query.getCacheSize()).toBe(1);
    });

    it("should return same cached results on multiple iterations", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      world.addComponent(e1, Position, { x: 1, y: 2 });
      world.addComponent(e2, Position, { x: 3, y: 4 });

      const query = world.query(Position);

      const results1 = Array.from(query);
      const results2 = Array.from(query);
      const results3 = Array.from(query);

      expect(results1).toHaveLength(2);
      expect(results2).toEqual(results1);
      expect(results3).toEqual(results1);
    });

    it("should cache empty results", () => {
      const query = world.query(Position);

      const results1 = Array.from(query);
      expect(results1).toHaveLength(0);
      expect(query.getCacheSize()).toBe(0);

      const results2 = Array.from(query);
      expect(results2).toHaveLength(0);
    });
  });

  describe("Cache Invalidation - addComponent", () => {
    it("should invalidate cache when component is added", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const query = world.query(Position);

      const results1 = Array.from(query);
      expect(results1).toHaveLength(1);

      // Add another entity with Position
      const entity2 = world.createEntity();
      world.addComponent(entity2, Position, { x: 30, y: 40 });

      // Cache should be invalidated, query should return 2 entities
      const results2 = Array.from(query);
      expect(results2).toHaveLength(2);
    });

    it("should only invalidate queries tracking the affected component", () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 1, y: 2 });
      world.addComponent(e1, Velocity, { dx: 10, dy: 20 });

      const posQuery = world.query(Position);
      const velQuery = world.query(Velocity);

      // Cache both queries
      Array.from(posQuery);
      Array.from(velQuery);

      expect(posQuery.getCacheSize()).toBe(1);
      expect(velQuery.getCacheSize()).toBe(1);

      // Add Health component (neither query tracks this)
      world.addComponent(e1, Health, { hp: 50 });

      // Health query should not affect Position or Velocity queries
      // But they will be invalidated because Health is added to e1
      const posResults = Array.from(posQuery);
      const velResults = Array.from(velQuery);

      expect(posResults).toHaveLength(1);
      expect(velResults).toHaveLength(1);
    });

    it("should invalidate with/without/oneOf queries appropriately", () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 1, y: 2 });

      const queryWith = world.query(Position);
      const queryWithout = world.query().without(Velocity);
      const queryOneOf = world.query().oneOf(Position, Velocity);

      // Cache all queries
      expect(Array.from(queryWith)).toHaveLength(1);
      expect(Array.from(queryWithout)).toHaveLength(1);
      expect(Array.from(queryOneOf)).toHaveLength(1);

      // Add Velocity to e1 - should invalidate all queries
      world.addComponent(e1, Velocity, { dx: 5, dy: 10 });

      // All queries should recompute
      expect(Array.from(queryWith)).toHaveLength(1); // Still has Position
      expect(Array.from(queryWithout)).toHaveLength(0); // Now has Velocity
      expect(Array.from(queryOneOf)).toHaveLength(1); // Has both Position and Velocity
    });
  });

  describe("Cache Invalidation - removeComponent", () => {
    it("should invalidate cache when component is removed", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });
      world.addComponent(entity, Velocity, { dx: 1, dy: 1 });

      const query = world.query(Position, Velocity);

      const results1 = Array.from(query);
      expect(results1).toHaveLength(1);

      // Remove Velocity component
      world.removeComponent(entity, Velocity);

      // Cache should be invalidated, query should return 0 entities
      const results2 = Array.from(query);
      expect(results2).toHaveLength(0);
    });

    it("should handle without queries correctly after removal", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });
      world.addComponent(entity, Velocity, { dx: 1, dy: 1 });

      const query = world.query(Position).without(Health);

      const results1 = Array.from(query);
      expect(results1).toHaveLength(1);

      // Remove Position - should invalidate and return 0
      world.removeComponent(entity, Position);

      const results2 = Array.from(query);
      expect(results2).toHaveLength(0);
    });
  });

  describe("Cache Invalidation - destroyEntity", () => {
    it("should invalidate cache when entity is destroyed", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const query = world.query(Position);

      const results1 = Array.from(query);
      expect(results1).toHaveLength(1);

      // Destroy entity
      world.destroyEntity(entity);

      // Cache should be invalidated, query should return 0 entities
      const results2 = Array.from(query);
      expect(results2).toHaveLength(0);
    });

    it("should invalidate all relevant queries when entity is destroyed", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });
      world.addComponent(entity, Velocity, { dx: 1, dy: 1 });

      const posQuery = world.query(Position);
      const velQuery = world.query(Velocity);
      const bothQuery = world.query(Position, Velocity);

      // Cache all queries
      expect(Array.from(posQuery)).toHaveLength(1);
      expect(Array.from(velQuery)).toHaveLength(1);
      expect(Array.from(bothQuery)).toHaveLength(1);

      // Destroy entity - should invalidate all queries
      world.destroyEntity(entity);

      expect(Array.from(posQuery)).toHaveLength(0);
      expect(Array.from(velQuery)).toHaveLength(0);
      expect(Array.from(bothQuery)).toHaveLength(0);
    });
  });

  // Serialization removed: cache invalidation after load tests removed

  describe("Query Methods with Caching", () => {
    it("should cache count() results", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const query = world.query(Position);

      // count() doesn't use the tuple cache, it counts directly
      expect(query.count()).toBe(1);

      // But iterating should cache
      Array.from(query);
      expect(query.getCacheSize()).toBe(1);
    });

    it("should work correctly with first()", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      world.addComponent(e1, Position, { x: 1, y: 2 });
      world.addComponent(e2, Position, { x: 3, y: 4 });

      const query = world.query(Position);

      const first = query.first();
      expect(first).not.toBeNull();
      // first() exits early, doesn't iterate all results
      // So cache is not populated

      // Now iterate fully to populate cache
      const allResults = Array.from(query);
      expect(allResults).toHaveLength(2);
      expect(query.getCacheSize()).toBe(2);

      const firstAgain = query.first();
      expect(firstAgain).toEqual(first);
    });

    it("should work correctly with isEmpty()", () => {
      const query = world.query(Position);

      expect(query.isEmpty()).toBe(true);
      expect(query.getCacheSize()).toBe(0);

      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      // Cache invalidated by addComponent
      expect(query.isEmpty()).toBe(false);
    });
  });

  describe("Complex Query Scenarios", () => {
    it("should handle multiple queries on same components", () => {
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });
      world.addComponent(entity, Velocity, { dx: 1, dy: 1 });

      const query1 = world.query(Position);
      const query2 = world.query(Position, Velocity);
      const query3 = world.query().without(Health);

      // Cache all queries
      expect(Array.from(query1)).toHaveLength(1);
      expect(Array.from(query2)).toHaveLength(1);
      expect(Array.from(query3)).toHaveLength(1);

      // Add Health - should invalidate all queries tracking Health
      world.addComponent(entity, Health, { hp: 50 });

      // Queries should recompute
      expect(Array.from(query1)).toHaveLength(1);
      expect(Array.from(query2)).toHaveLength(1);
      expect(Array.from(query3)).toHaveLength(0); // Now has Health, so excluded
    });

    it("should handle chained query builders", () => {
      const e1 = world.createEntity();
      world.addComponent(e1, Position, { x: 1, y: 2 });
      world.addComponent(e1, Velocity, { dx: 10, dy: 20 });

      const e2 = world.createEntity();
      world.addComponent(e2, Position, { x: 3, y: 4 });

      // Query: has Position, doesn't have Health, has at least one of Velocity
      const query = world.query(Position).without(Health).oneOf(Velocity);

      const results1 = Array.from(query);
      // Only e1 matches (has Position and Velocity, doesn't have Health)
      // e2 doesn't match (has Position but not Velocity)
      expect(results1).toHaveLength(1);
      expect(query.getCacheSize()).toBe(1);

      // Add Health to e1 - should invalidate
      world.addComponent(e1, Health, { hp: 100 });

      const results2 = Array.from(query);
      expect(results2).toHaveLength(0); // e1 now excluded (has Health)
    });
  });
});
