import {
  defineComponent,
  Query,
  System,
  World,
  type WorldSnapshot,
} from "../index.js";

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
    const system = new TestSystem(world);
    world.addSystem(system);

    expect(system.isInitialized).toBe(true);

    world.update(16);
    expect(system.updateCalls).toBe(1);
    expect(system.lastDelta).toBe(16);

    world.update(33);
    expect(system.updateCalls).toBe(2);
    expect(system.lastDelta).toBe(33);
  });

  test("multiple systems are updated in order", () => {
    const s1 = new TestSystem(world);
    const s2 = new TestSystem(world);

    world.addSystem(s1);
    world.addSystem(s2);

    expect(s1.isInitialized).toBe(true);
    expect(s2.isInitialized).toBe(true);

    world.update(10);

    expect(s1.updateCalls).toBe(1);
    expect(s2.updateCalls).toBe(1);
    expect(s1.lastDelta).toBe(10);
    expect(s2.lastDelta).toBe(10);
  });

  test("system cleanup when removed", () => {
    const system = new TestSystem(world);
    world.addSystem(system);

    expect(system.isCleanedUp).toBe(false);

    world.removeSystem(system);
    expect(system.isCleanedUp).toBe(true);
  });

  test("system cleanup when all systems cleared", () => {
    const s1 = new TestSystem(world);
    const s2 = new TestSystem(world);

    world.addSystem(s1);
    world.addSystem(s2);

    expect(s1.isCleanedUp).toBe(false);
    expect(s2.isCleanedUp).toBe(false);

    world.clearSystems();

    expect(s1.isCleanedUp).toBe(true);
    expect(s2.isCleanedUp).toBe(true);
    expect(world.getSystems()).toEqual([]);
  });

  test("system cleanup when world destroyed", () => {
    const system = new TestSystem(world);
    world.addSystem(system);

    expect(system.isCleanedUp).toBe(false);

    world.destroy();

    expect(system.isCleanedUp).toBe(true);
    expect(world.getSystems()).toEqual([]);
    expect(world.getEntityCount()).toBe(0);
  });

  test("getSystems returns systems array", () => {
    const system1 = new TestSystem(world);
    world.addSystem(system1);

    const systems = world.getSystems();
    expect(systems.length).toBe(1);
    expect(systems[0]).toBe(system1);
  });
});

describe("World.createQuery", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe("query creation", () => {
    test("should create a valid query", () => {
      const query = world.createQuery({ with: [TestComponentAType] });
      expect(query).toBeInstanceOf(Query);
    });

    test("should create independent query instances", () => {
      const query1 = world.createQuery({ with: [TestComponentAType] });
      const query2 = world.createQuery({ with: [TestComponentAType] });
      expect(query1).not.toBe(query2);
      expect(query1.execute()).toEqual(query2.execute());
    });

    test("should create different queries for different configs", () => {
      const query1 = world.createQuery({ with: [TestComponentAType] });
      const query2 = world.createQuery({ with: [TestComponentBType] });
      expect(query1).not.toBe(query2);
    });

    test("should work with complex configurations", () => {
      const config = {
        with: [TestComponentAType],
        without: [TestComponentBType],
        oneOf: [TestComponentCType],
      };
      const query = world.createQuery(config);
      expect(query).toBeInstanceOf(Query);
    });
  });

  describe("error handling", () => {
    test("should throw error for empty config", () => {
      expect(() => {
        world.createQuery({});
      }).toThrow("Query must specify at least one constraint");
    });

    test("should throw error for config with only empty arrays", () => {
      expect(() => {
        world.createQuery({ with: [], without: [] });
      }).toThrow("Query must specify at least one constraint");
    });

    test("should throw error for conflicting components", () => {
      expect(() => {
        world.createQuery({
          with: [TestComponentAType],
          without: [TestComponentAType],
        });
      }).toThrow("cannot be both required (with) and excluded (without)");
    });

    test("should provide clear error for invalid component", () => {
      const invalidComponent = { name: "", create: (): object => ({}) };
      expect(() => {
        world.createQuery({ with: [invalidComponent] });
      }).toThrow("component must have a valid name property");
    });
  });

  describe("query execution with component changes", () => {
    test("should return updated results after adding components", () => {
      const query = world.createQuery({ with: [TestComponentAType] });

      expect(query.execute().length).toBe(0);

      const entity1 = world.createEntity();
      world.addComponent(entity1, TestComponentAType, { foo: "test1" });

      expect(query.execute().length).toBe(1);
      expect(query.execute()).toContain(entity1);

      const entity2 = world.createEntity();
      world.addComponent(entity2, TestComponentAType, { foo: "test2" });

      expect(query.execute().length).toBe(2);
    });

    test("should return updated results after removing components", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);
      world.addComponent(entity, TestComponentBType);

      const query = world.createQuery({
        with: [TestComponentAType, TestComponentBType],
      });
      expect(query.execute().length).toBe(1);

      world.removeComponent(entity, TestComponentBType);
      expect(query.execute().length).toBe(0);
    });

    test("should return updated results after destroying entities", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity2, TestComponentAType);

      const query = world.createQuery({ with: [TestComponentAType] });
      expect(query.execute().length).toBe(2);

      world.destroyEntity(entity1);
      expect(query.execute().length).toBe(1);
      expect(query.execute()).toContain(entity2);
    });

    test("should handle rapid component changes correctly", () => {
      const query = world.createQuery({ with: [TestComponentAType] });

      const entity = world.createEntity();
      expect(query.execute().length).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(query.execute().length).toBe(1);

      world.removeComponent(entity, TestComponentAType);
      expect(query.execute().length).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(query.execute().length).toBe(1);
    });
  });

  describe("multiple queries interaction", () => {
    test("should handle multiple independent queries correctly", () => {
      const query1 = world.createQuery({ with: [TestComponentAType] });
      const query2 = world.createQuery({ with: [TestComponentBType] });

      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity2, TestComponentBType);

      expect(query1.execute()).toContain(entity1);
      expect(query1.execute()).not.toContain(entity2);
      expect(query2.execute()).toContain(entity2);
      expect(query2.execute()).not.toContain(entity1);
    });

    test("should update all queries when components change", () => {
      const queryA = world.createQuery({ with: [TestComponentAType] });
      const queryB = world.createQuery({ with: [TestComponentBType] });
      const queryBoth = world.createQuery({
        with: [TestComponentAType, TestComponentBType],
      });

      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);

      expect(queryA.execute().length).toBe(1);
      expect(queryB.execute().length).toBe(0);
      expect(queryBoth.execute().length).toBe(0);

      world.addComponent(entity, TestComponentBType);

      expect(queryA.execute().length).toBe(1);
      expect(queryB.execute().length).toBe(1);
      expect(queryBoth.execute().length).toBe(1);
    });
  });

  describe("query reuse pattern (recommended usage)", () => {
    test("should support query reuse in system-like pattern", () => {
      const movingEntities = world.createQuery({
        with: [TestComponentAType, TestComponentBType],
      });

      const entity1 = world.createEntity();
      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity1, TestComponentBType);

      const result1 = movingEntities.execute();
      const result2 = movingEntities.execute();

      expect(result1).toContain(entity1);
      expect(result2).toContain(entity1);
    });

    test("should work correctly when query is stored and reused", () => {
      const entity = world.createEntity();

      const componentAQuery = world.createQuery({ with: [TestComponentAType] });

      expect(componentAQuery.execute().length).toBe(0);

      world.addComponent(entity, TestComponentAType);
      expect(componentAQuery.execute().length).toBe(1);

      world.removeComponent(entity, TestComponentAType);
      expect(componentAQuery.execute().length).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should work with no entities", () => {
      const query = world.createQuery({ with: [TestComponentAType] });
      expect(query.execute()).toEqual([]);
    });

    test("should work with entities but no matching components", () => {
      world.createEntity();
      world.createEntity();

      const query = world.createQuery({ with: [TestComponentAType] });
      expect(query.execute()).toEqual([]);
    });

    test("should handle queries created before and after entity creation", () => {
      const queryBefore = world.createQuery({ with: [TestComponentAType] });

      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);

      const queryAfter = world.createQuery({ with: [TestComponentAType] });

      expect(queryBefore.execute()).toEqual(queryAfter.execute());
      expect(queryBefore.execute()).toContain(entity);
    });
  });
});

describe("World serialization", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe("save and load", () => {
    test("should save and restore empty world", () => {
      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, []);

      expect(world2.getEntityCount()).toBe(0);
    });

    test("should save and restore entities without components", () => {
      world.createEntity();
      world.createEntity();
      world.createEntity();

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, []);

      expect(world2.getEntityCount()).toBe(3);
    });

    test("should save and restore single component", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType, { foo: "test" });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [TestComponentAType]);

      expect(world2.getEntityCount()).toBe(1);
      expect(world2.getComponent(entity, TestComponentAType)).toEqual({
        foo: "test",
      });
    });

    test("should save and restore multiple components on same entity", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType, { foo: "a" });
      world.addComponent(entity, TestComponentBType, { bar: 42 });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [TestComponentAType, TestComponentBType]);

      expect(world2.getComponent(entity, TestComponentAType)).toEqual({
        foo: "a",
      });
      expect(world2.getComponent(entity, TestComponentBType)).toEqual({
        bar: 42,
      });
    });

    test("should save and restore multiple entities with different components", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType, { foo: "one" });
      world.addComponent(e2, TestComponentBType, { bar: 2 });
      world.addComponent(e3, TestComponentAType, { foo: "three" });
      world.addComponent(e3, TestComponentCType, { active: true });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [
        TestComponentAType,
        TestComponentBType,
        TestComponentCType,
      ]);

      expect(world2.getEntityCount()).toBe(3);
      expect(world2.getComponent(e1, TestComponentAType)).toEqual({
        foo: "one",
      });
      expect(world2.getComponent(e2, TestComponentBType)).toEqual({ bar: 2 });
      expect(world2.getComponent(e3, TestComponentAType)).toEqual({
        foo: "three",
      });
      expect(world2.getComponent(e3, TestComponentCType)).toEqual({
        active: true,
      });
    });

    test("should preserve entity IDs across save/load", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();

      world.addComponent(e1, TestComponentAType, { foo: "e1" });
      world.addComponent(e2, TestComponentAType, { foo: "e2" });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [TestComponentAType]);

      // Entity IDs should be the same
      expect(world2.getComponent(e1, TestComponentAType)).toEqual({
        foo: "e1",
      });
      expect(world2.getComponent(e2, TestComponentAType)).toEqual({
        foo: "e2",
      });
    });

    test("should handle recycled entity IDs", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      world.destroyEntity(e1);
      const e3 = world.createEntity(); // Should reuse e1's index

      world.addComponent(e2, TestComponentAType, { foo: "e2" });
      world.addComponent(e3, TestComponentBType, { bar: 3 });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [TestComponentAType, TestComponentBType]);

      expect(world2.getEntityCount()).toBe(2);
      expect(world2.getComponent(e2, TestComponentAType)).toEqual({
        foo: "e2",
      });
      expect(world2.getComponent(e3, TestComponentBType)).toEqual({ bar: 3 });
      // e1 should not be valid
      expect(world2.getComponent(e1, TestComponentAType)).toBeUndefined();
    });
  });

  describe("JSON serialization", () => {
    test("should serialize to JSON and back", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType, { foo: "json" });
      world.addComponent(entity, TestComponentBType, { bar: 123 });

      const snapshot = world.save();
      const json = JSON.stringify(snapshot);
      const parsed = JSON.parse(json) as WorldSnapshot;

      const world2 = new World();
      world2.load(parsed, [TestComponentAType, TestComponentBType]);

      expect(world2.getEntityCount()).toBe(1);
      expect(world2.getComponent(entity, TestComponentAType)).toEqual({
        foo: "json",
      });
      expect(world2.getComponent(entity, TestComponentBType)).toEqual({
        bar: 123,
      });
    });
  });

  describe("error handling", () => {
    test("should throw error when loading component type not registered", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType, { foo: "test" });
      world.addComponent(entity, TestComponentBType, { bar: 42 });

      const snapshot = world.save();
      const world2 = new World();

      expect(() => {
        // Only register TestComponentAType, not TestComponentBType
        world2.load(snapshot, [TestComponentAType]);
      }).toThrow("Component type 'B' not found");
    });

    test("should not throw when all component types are registered", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType, { foo: "test" });

      const snapshot = world.save();
      const world2 = new World();

      expect(() => {
        world2.load(snapshot, [TestComponentAType]);
      }).not.toThrow();
    });
  });

  describe("load clears existing state", () => {
    test("should clear existing entities when loading", () => {
      const world2 = new World();
      world2.createEntity();
      world2.createEntity();
      expect(world2.getEntityCount()).toBe(2);

      const snapshot = world.save(); // Empty world
      world2.load(snapshot, []);

      expect(world2.getEntityCount()).toBe(0);
    });

    test("should clear existing components when loading", () => {
      const world2 = new World();
      const entity = world2.createEntity();
      world2.addComponent(entity, TestComponentAType, { foo: "old" });

      const e2 = world.createEntity();
      world.addComponent(e2, TestComponentBType, { bar: 99 });

      const snapshot = world.save();
      world2.load(snapshot, [TestComponentBType]);

      // Old component should be gone
      expect(world2.getComponent(entity, TestComponentAType)).toBeUndefined();
      // New component should exist
      expect(world2.getComponent(e2, TestComponentBType)).toEqual({ bar: 99 });
    });
  });

  describe("queries after deserialization", () => {
    test("should support queries on deserialized world", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType, { foo: "1" });
      world.addComponent(e2, TestComponentAType, { foo: "2" });
      world.addComponent(e2, TestComponentBType, { bar: 2 });
      world.addComponent(e3, TestComponentBType, { bar: 3 });

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [TestComponentAType, TestComponentBType]);

      const query = world2.createQuery({ with: [TestComponentAType] });
      const results = query.execute();

      expect(results.length).toBe(2);
      expect(results).toContain(e1);
      expect(results).toContain(e2);
    });

    test("should support complex queries on deserialized world", () => {
      const e1 = world.createEntity();
      const e2 = world.createEntity();
      const e3 = world.createEntity();

      world.addComponent(e1, TestComponentAType);
      world.addComponent(e1, TestComponentBType);

      world.addComponent(e2, TestComponentAType);
      world.addComponent(e2, TestComponentCType);

      world.addComponent(e3, TestComponentBType);

      const snapshot = world.save();
      const world2 = new World();
      world2.load(snapshot, [
        TestComponentAType,
        TestComponentBType,
        TestComponentCType,
      ]);

      const query = world2.createQuery({
        with: [TestComponentAType],
        without: [TestComponentBType],
      });
      const results = query.execute();

      expect(results.length).toBe(1);
      expect(results).toContain(e2);
    });
  });
});
