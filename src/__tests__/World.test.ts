import { defineComponent, Query, System, World } from "../index.js";

interface TestComponentA {
  foo: string;
}

interface TestComponentB {
  bar: number;
}

interface TestComponentC {
  active: boolean;
}

const TestComponentAType = defineComponent<TestComponentA>("A", {
  foo: "default",
});
const TestComponentBType = defineComponent<TestComponentB>("B", { bar: 0 });
const TestComponentCType = defineComponent<TestComponentC>("C", {
  active: false,
});
class TestSystem extends System {
  lastDelta = 0;
  updateCalls = 0;
  isInitialized = false;
  isCleanedUp = false;

  init(): void {
    this.isInitialized = true;
  }

  cleanup(): void {
    this.isCleanedUp = true;
  }

  update(deltaTime: number): void {
    this.lastDelta = deltaTime;
    this.updateCalls++;
  }
}

describe("World", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  test("create and destroy entities", () => {
    const entity = world.createEntity();
    expect(world.getEntityCount()).toBe(1);

    world.destroyEntity(entity);
    expect(world.getEntityCount()).toBe(0);
  });

  test("getAllEntities returns same entities as tracked by entity count", () => {
    const entity1 = world.createEntity();
    world.createEntity();

    expect(world.getAllEntities().length).toBe(world.getEntityCount());
    expect(world.getAllEntities().length).toBe(2);

    world.destroyEntity(entity1);

    expect(world.getAllEntities().length).toBe(world.getEntityCount());
    expect(world.getAllEntities().length).toBe(1);
  });

  test("add and retrieve components", () => {
    const entity = world.createEntity();
    world.addComponent(entity, TestComponentAType, { foo: "test" });
    expect(world.getComponent(entity, TestComponentAType)).toEqual({
      foo: "test",
    });
  });

  test("component isolation across entities", () => {
    const e1 = world.createEntity();
    const e2 = world.createEntity();

    world.addComponent(e1, TestComponentAType, { foo: "v1" });
    world.addComponent(e2, TestComponentAType, { foo: "v2" });

    expect(world.getComponent(e1, TestComponentAType)).toEqual({ foo: "v1" });
    expect(world.getComponent(e2, TestComponentAType)).toEqual({ foo: "v2" });
  });

  test("detect component presence", () => {
    const entity = world.createEntity();
    expect(world.hasComponent(entity, TestComponentAType)).toBe(false);
    world.addComponent(entity, TestComponentAType);
    expect(world.hasComponent(entity, TestComponentAType)).toBe(true);
  });

  test("remove components", () => {
    const entity = world.createEntity();
    world.addComponent(entity, TestComponentAType);
    expect(world.removeComponent(entity, TestComponentAType)).toBe(true);
    expect(world.getComponent(entity, TestComponentAType)).toBeUndefined();
  });

  test("removeComponent returns false when component is missing", () => {
    const entity = world.createEntity();
    const result = world.removeComponent(entity, TestComponentAType);
    expect(result).toBe(false);
  });

  test("handle multiple component types", () => {
    const entity = world.createEntity();
    world.addComponent(entity, TestComponentAType, { foo: "a" });
    world.addComponent(entity, TestComponentBType, { bar: 42 });

    expect(world.getComponent(entity, TestComponentAType)).toEqual({
      foo: "a",
    });
    expect(world.getComponent(entity, TestComponentBType)).toEqual({ bar: 42 });
  });

  test("destroying entity removes all components", () => {
    const entity = world.createEntity();
    world.addComponent(entity, TestComponentAType, { foo: "x" });
    world.addComponent(entity, TestComponentBType, { bar: 99 });

    world.destroyEntity(entity);
    expect(world.getComponent(entity, TestComponentAType)).toBeUndefined();
    expect(world.getComponent(entity, TestComponentBType)).toBeUndefined();
    expect(world.getEntityCount()).toBe(0);
  });

  test("systems are added and updated", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;

    expect(system).toBeDefined();
    expect(system.isInitialized).toBe(true);

    world.update(16);
    expect(system.updateCalls).toBe(1);
    expect(system.lastDelta).toBe(16);

    world.update(33);
    expect(system.updateCalls).toBe(2);
    expect(system.lastDelta).toBe(33);
  });

  test("multiple systems are updated in order", () => {
    world.addSystem(TestSystem);
    world.addSystem(TestSystem);

    const systems = world.getSystems();
    const s1 = systems[0] as TestSystem;
    const s2 = systems[1] as TestSystem;

    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
    expect(s1.isInitialized).toBe(true);
    expect(s2.isInitialized).toBe(true);

    world.update(10);

    expect(s1.updateCalls).toBe(1);
    expect(s2.updateCalls).toBe(1);
    expect(s1.lastDelta).toBe(10);
    expect(s2.lastDelta).toBe(10);
  });

  test("system cleanup when removed", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;

    expect(system).toBeDefined();
    expect(system.isCleanedUp).toBe(false);

    world.removeSystem(system);
    expect(system.isCleanedUp).toBe(true);
  });

  test("system cleanup when all systems cleared", () => {
    world.addSystem(TestSystem);
    world.addSystem(TestSystem);

    const systems = world.getSystems();
    const s1 = systems[0] as TestSystem;
    const s2 = systems[1] as TestSystem;

    expect(s1).toBeDefined();
    expect(s2).toBeDefined();
    expect(s1.isCleanedUp).toBe(false);
    expect(s2.isCleanedUp).toBe(false);

    world.clearSystems();

    expect(s1.isCleanedUp).toBe(true);
    expect(s2.isCleanedUp).toBe(true);
    expect(world.getSystems()).toEqual([]);
  });

  test("system cleanup when world destroyed", () => {
    world.addSystem(TestSystem);
    const system = world.getSystems()[0] as TestSystem;

    expect(system).toBeDefined();
    expect(system.isCleanedUp).toBe(false);

    world.destroy();

    expect(system.isCleanedUp).toBe(true);
    expect(world.getSystems()).toEqual([]);
    expect(world.getEntityCount()).toBe(0);
  });

  test("getSystems returns systems array", () => {
    world.addSystem(TestSystem);
    const system1 = world.getSystems()[0] as TestSystem;

    const systems = world.getSystems();
    expect(systems.length).toBe(1);
    expect(systems[0]).toBe(system1);
  });
});
describe("World.query", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe("query creation", () => {
    test("should create a valid query", () => {
      const query = world.query(TestComponentAType);
      expect(query).toBeInstanceOf(Query);
    });

    test("should create independent query instances", () => {
      const query1 = world.query(TestComponentAType);
      const query2 = world.query(TestComponentAType);
      expect(query1).not.toBe(query2);
      expect(Array.from(query1).map(([e]) => e)).toEqual(
        Array.from(query2).map(([e]) => e),
      );
    });

    test("should create different queries for different configs", () => {
      const query1 = world.query(TestComponentAType);
      const query2 = world.query(TestComponentBType);
      expect(query1).not.toBe(query2);
    });

    test("should work with complex configurations", () => {
      const query = world
        .query(TestComponentAType)
        .without(TestComponentBType)
        .oneOf(TestComponentCType);
      expect(query).toBeInstanceOf(Query);
    });

    test("should support world.query().with() chaining", () => {
      const query = world.query().with(TestComponentAType);
      expect(query).toBeInstanceOf(Query);
    });

    test("should support world.query().with() with multiple components", () => {
      const query = world.query().with(TestComponentAType, TestComponentBType);
      expect(query).toBeInstanceOf(Query);
    });

    test("should support world.query().with().without() chaining", () => {
      const query = world
        .query()
        .with(TestComponentAType)
        .without(TestComponentBType);
      expect(query).toBeInstanceOf(Query);
    });

    test("should support world.query().with().oneOf() chaining", () => {
      const query = world
        .query()
        .with(TestComponentAType)
        .oneOf(TestComponentBType, TestComponentCType);
      expect(query).toBeInstanceOf(Query);
    });
  });

  describe("query().with() functional tests", () => {
    test("world.query().with() should return correct entities", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType);
      world.addComponent(e2, TestComponentAType);
      world.addComponent(e2, TestComponentBType);
      world.addComponent(e3, TestComponentBType);

      const query = world.query().with(TestComponentAType);
      const results = Array.from(query).map(([e]) => e);

      expect(results).toContain(e1);
      expect(results).toContain(e2);
      expect(results).not.toContain(e3);
      expect(results.length).toBe(2);
    });

    test("world.query().with() multiple components should work", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType);
      world.addComponent(e2, TestComponentAType);
      world.addComponent(e2, TestComponentBType);
      world.addComponent(e3, TestComponentBType);

      const query = world.query().with(TestComponentAType, TestComponentBType);
      const results = Array.from(query).map(([e]) => e);

      expect(results).not.toContain(e1);
      expect(results).toContain(e2);
      expect(results).not.toContain(e3);
      expect(results.length).toBe(1);
    });

    test("world.query().with().without() should filter correctly", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType);
      world.addComponent(e2, TestComponentAType);
      world.addComponent(e2, TestComponentBType);
      world.addComponent(e3, TestComponentBType);

      const query = world
        .query()
        .with(TestComponentAType)
        .without(TestComponentBType);
      const results = Array.from(query).map(([e]) => e);

      expect(results).toContain(e1);
      expect(results).not.toContain(e2);
      expect(results).not.toContain(e3);
      expect(results.length).toBe(1);
    });

    test("world.query().with().oneOf() should filter correctly", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();
      const e4 = world.createEntity();

      world.addComponent(e1, TestComponentAType);
      world.addComponent(e1, TestComponentBType);
      world.addComponent(e2, TestComponentAType);
      world.addComponent(e2, TestComponentCType);
      world.addComponent(e3, TestComponentAType);
      world.addComponent(e4, TestComponentBType);

      const query = world
        .query()
        .with(TestComponentAType)
        .oneOf(TestComponentBType, TestComponentCType);
      const results = Array.from(query).map(([e]) => e);

      expect(results).toContain(e1);
      expect(results).toContain(e2);
      expect(results).not.toContain(e3);
      expect(results).not.toContain(e4);
      expect(results.length).toBe(2);
    });
  });

  describe("error handling", () => {
    test("should throw error for empty config when iterating", () => {
      expect(() => {
        const query = world.query();
        Array.from(query);
      }).toThrow("Query must specify at least one constraint");
    });

    test("should throw error for config with only empty arrays when iterating", () => {
      expect(() => {
        const query = new Query(world, { with: [], without: [] });
        Array.from(query);
      }).toThrow("'with' constraint cannot be an empty array");
    });

    test("should throw error for conflicting components when iterating", () => {
      expect(() => {
        const query = world
          .query(TestComponentAType)
          .without(TestComponentAType);
        Array.from(query);
      }).toThrow("cannot be both required (with) and excluded (without)");
    });

    test("should provide clear error for invalid component when iterating", () => {
      const invalidComponent = { name: "", create: (): object => ({}) };
      expect(() => {
        const query = world.query(invalidComponent);
        Array.from(query);
      }).toThrow("component must have a valid name property");
    });
  });

  describe("query execution with component changes", () => {
    test("should return updated results after adding components", () => {
      const query = world.query(TestComponentAType);

      expect(query.count()).toBe(0);

      const entity1 = world.createEntity();
      world.addComponent(entity1, TestComponentAType, { foo: "test1" });

      expect(query.count()).toBe(1);
      expect(Array.from(query).map(([e]) => e)).toContain(entity1);

      const entity2 = world.createEntity();
      world.addComponent(entity2, TestComponentAType, { foo: "test2" });

      expect(query.count()).toBe(2);
    });

    test("should return updated results after removing components", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);
      world.addComponent(entity, TestComponentBType);

      const query = world.query(TestComponentAType, TestComponentBType);
      expect(query.count()).toBe(1);

      world.removeComponent(entity, TestComponentBType);
      expect(query.count()).toBe(0);
    });

    test("should return updated results after destroying entities", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity2, TestComponentAType);

      const query = world.query(TestComponentAType);
      expect(query.count()).toBe(2);

      world.destroyEntity(entity1);
      expect(query.count()).toBe(1);
      expect(Array.from(query).map(([e]) => e)).toContain(entity2);
    });

    test("should handle rapid component changes correctly", () => {
      const query = world.query(TestComponentAType);

      const entity = world.createEntity();
      expect(query.count()).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(query.count()).toBe(1);

      world.removeComponent(entity, TestComponentAType);
      expect(query.count()).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(query.count()).toBe(1);
    });
  });

  describe("multiple queries interaction", () => {
    test("should handle multiple independent queries correctly", () => {
      const query1 = world.query(TestComponentAType);
      const query2 = world.query(TestComponentBType);

      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity2, TestComponentBType);

      expect(Array.from(query1).map(([e]) => e)).toContain(entity1);
      expect(Array.from(query1).map(([e]) => e)).not.toContain(entity2);
      expect(Array.from(query2).map(([e]) => e)).toContain(entity2);
      expect(Array.from(query2).map(([e]) => e)).not.toContain(entity1);
    });

    test("should update all queries when components change", () => {
      const queryA = world.query(TestComponentAType);
      const queryB = world.query(TestComponentBType);
      const queryBoth = world.query(TestComponentAType, TestComponentBType);

      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);

      expect(queryA.count()).toBe(1);
      expect(queryB.count()).toBe(0);
      expect(queryBoth.count()).toBe(0);

      world.addComponent(entity, TestComponentBType);

      expect(queryA.count()).toBe(1);
      expect(queryB.count()).toBe(1);
      expect(queryBoth.count()).toBe(1);
    });
  });

  describe("query reuse pattern (recommended usage)", () => {
    test("should support query reuse in system-like pattern", () => {
      const movingEntities = world.query(
        TestComponentAType,
        TestComponentBType,
      );

      const entity1 = world.createEntity();
      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity1, TestComponentBType);

      const result1 = Array.from(movingEntities).map(([e]) => e);
      const result2 = Array.from(movingEntities).map(([e]) => e);

      expect(result1).toContain(entity1);
      expect(result2).toContain(entity1);
    });

    test("should work correctly when query is stored and reused", () => {
      const entity = world.createEntity();

      const componentAQuery = world.query(TestComponentAType);

      expect(componentAQuery.count()).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(componentAQuery.count()).toBe(1);

      world.removeComponent(entity, TestComponentAType);
      expect(componentAQuery.count()).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should work with no entities", () => {
      const query = world.query(TestComponentAType);
      expect(Array.from(query).map(([e]) => e)).toEqual([]);
    });

    test("should work with entities but no matching components", () => {
      world.createEntity();
      world.createEntity();

      const query = world.query(TestComponentAType);
      expect(Array.from(query).map(([e]) => e)).toEqual([]);
    });

    test("should handle queries created before and after entity creation", () => {
      const queryBefore = world.query(TestComponentAType);

      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);

      const queryAfter = world.query(TestComponentAType);

      expect(Array.from(queryBefore).map(([e]) => e)).toEqual(
        Array.from(queryAfter).map(([e]) => e),
      );
      expect(Array.from(queryBefore).map(([e]) => e)).toContain(entity);
    });
  });
});
