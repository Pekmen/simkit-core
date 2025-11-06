import { describe, test, expect } from "vitest";
import { World, defineComponent } from "../index.js";

describe("Type System Tests", () => {
  const Position = defineComponent("Position", { x: 0, y: 0 });
  const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });
  const Health = defineComponent("Health", { hp: 100 });

  test("query returns correctly typed tuples - single component", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 10, y: 20 });

    const query = world.query(Position);
    const result = query.first();

    if (result) {
      const [e, pos] = result;

      // TypeScript infers correct types
      expect(e).toBe(entity);
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(20);
    }
  });

  test("query returns correctly typed tuples - multiple components", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 10, y: 20 });
    world.addComponent(entity, Velocity, { dx: 1, dy: 2 });

    const query = world.query(Position, Velocity);
    const result = query.first();

    if (result) {
      const [e, pos, vel] = result;

      // TypeScript infers correct types
      expect(e).toBe(entity);
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(20);
      expect(vel.dx).toBe(1);
      expect(vel.dy).toBe(2);
    }
  });

  test("chained .with() accumulates types", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 10, y: 20 });
    world.addComponent(entity, Velocity, { dx: 1, dy: 2 });
    world.addComponent(entity, Health, { hp: 100 });

    const query = world.query(Position).with(Velocity).with(Health);
    const result = query.first();

    if (result) {
      const [e, pos, vel, health] = result;

      expect(e).toBe(entity);
      expect(pos.x).toBe(10);
      expect(vel.dx).toBe(1);
      expect(health.hp).toBe(100);
    }
  });

  test("chained .with() starting from empty query", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 10, y: 20 });
    world.addComponent(entity, Velocity, { dx: 1, dy: 2 });

    const query = world.query().with(Position).with(Velocity);
    const result = query.first();

    if (result) {
      const [e, pos, vel] = result;

      expect(e).toBe(entity);
      expect(pos.x).toBe(10);
      expect(vel.dx).toBe(1);
    }
  });

  test("nominal typing prevents structural substitution", () => {
    const Pos1 = defineComponent("Position1", { x: 0, y: 0 });
    const Pos2 = defineComponent("Position2", { x: 0, y: 0 });

    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Pos1, { x: 10, y: 20 });

    // Different components despite same structure
    expect(world.hasComponent(entity, Pos1)).toBe(true);
    expect(world.hasComponent(entity, Pos2)).toBe(false);

    // Query with Pos1 should not match entities with only Pos2
    const query1 = world.query(Pos1);
    expect(query1.count()).toBe(1);

    const query2 = world.query(Pos2);
    expect(query2.count()).toBe(0);
  });

  test("component types have unique brands", () => {
    const Comp1 = defineComponent("TestComp", { value: 0 });
    const Comp2 = defineComponent("TestComp", { value: 0 });

    // Even with same name and structure, they're different types
    expect(Comp1).not.toBe(Comp2);
    expect(Comp1.__brand).not.toBe(Comp2.__brand);
  });

  test("query iteration preserves types", () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    world.addComponent(e1, Position, { x: 1, y: 2 });
    world.addComponent(e2, Position, { x: 3, y: 4 });
    world.addComponent(e1, Velocity, { dx: 10, dy: 20 });
    world.addComponent(e2, Velocity, { dx: 30, dy: 40 });

    const query = world.query(Position, Velocity);
    const results = Array.from(query);

    expect(results).toHaveLength(2);

    for (const [entity, pos, vel] of results) {
      // TypeScript knows the types here
      expect(typeof entity).toBe("number");
      expect(typeof pos.x).toBe("number");
      expect(typeof pos.y).toBe("number");
      expect(typeof vel.dx).toBe("number");
      expect(typeof vel.dy).toBe("number");
    }
  });

  test("getComponent returns correctly typed value", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 100, y: 200 });

    const pos = world.getComponent(entity, Position);

    // TypeScript infers correct type
    if (pos) {
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
    }
  });

  test("addComponent accepts correctly typed data", () => {
    const world = new World();
    const entity = world.createEntity();

    // Should accept full data
    world.addComponent(entity, Position, { x: 1, y: 2 });

    // Should accept partial data (merged with defaults)
    world.addComponent(entity, Velocity, { dx: 5 });
    const vel = world.getComponent(entity, Velocity);
    expect(vel).toEqual({ dx: 5, dy: 0 });

    // Should accept empty data (uses all defaults)
    world.addComponent(entity, Health, {});
    const health = world.getComponent(entity, Health);
    expect(health).toEqual({ hp: 100 });
  });

  test("complex query chains maintain type safety", () => {
    const world = new World();
    const entity = world.createEntity();
    world.addComponent(entity, Position, { x: 10, y: 20 });
    world.addComponent(entity, Velocity, { dx: 1, dy: 2 });
    world.addComponent(entity, Health, { hp: 100 });

    // Chain with, without, oneOf
    const Dead = defineComponent("Dead", {});
    const query = world
      .query(Position)
      .with(Velocity)
      .without(Dead)
      .with(Health);

    const result = query.first();
    if (result) {
      const [e, pos, vel, health] = result;

      expect(e).toBe(entity);
      expect(pos.x).toBe(10);
      expect(vel.dx).toBe(1);
      expect(health.hp).toBe(100);
    }
  });
});
