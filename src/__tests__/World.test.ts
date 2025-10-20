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

  describe("WorldConfig", () => {
    test("should create world with profiling disabled by default", () => {
      const defaultWorld = new World();
      expect(defaultWorld.getProfiler().isEnabled()).toBe(false);
    });

    test("should create world with profiling enabled via config", () => {
      const profiledWorld = new World({ enableProfiling: true });
      expect(profiledWorld.getProfiler().isEnabled()).toBe(true);
    });

    test("should set custom max frame history via config", () => {
      const customWorld = new World({ maxFrameHistory: 120 });
      customWorld.enableProfiling();

      customWorld.addSystem(new TestSystem(customWorld));

      for (let i = 0; i < 100; i++) {
        customWorld.update(16.67);
      }

      const history = customWorld.getProfiler().getFrameHistory();
      expect(history.length).toBe(100);
    });

    test("should accept both config options together", () => {
      const configuredWorld = new World({
        enableProfiling: true,
        maxFrameHistory: 30,
      });

      expect(configuredWorld.getProfiler().isEnabled()).toBe(true);

      configuredWorld.addSystem(new TestSystem(configuredWorld));

      for (let i = 0; i < 50; i++) {
        configuredWorld.update(16.67);
      }

      const history = configuredWorld.getProfiler().getFrameHistory();
      expect(history.length).toBe(30);
    });

    test("should work with empty config object", () => {
      const emptyConfigWorld = new World({});
      expect(emptyConfigWorld.getProfiler().isEnabled()).toBe(false);
    });
  });

  describe("removeQuery", () => {
    test("should remove query from world", () => {
      const query = world.createQuery({ with: [TestComponentAType] });
      expect(world.removeQuery(query)).toBe(true);
      expect(world.removeQuery(query)).toBe(false);
    });

    test("should return false for non-existent query", () => {
      const otherWorld = new World();
      const query = otherWorld.createQuery({ with: [TestComponentAType] });
      expect(world.removeQuery(query)).toBe(false);
    });
  });

  describe("getEntitiesWithComponent", () => {
    test("should return entities with specific component", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, TestComponentAType);
      world.addComponent(entity2, TestComponentAType);

      const entities = world.getEntitiesWithComponent(TestComponentAType);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
      expect(entities).not.toContain(entity3);
    });

    test("should return undefined for non-existent component", () => {
      const entities = world.getEntitiesWithComponent(TestComponentAType);
      expect(entities).toBeUndefined();
    });
  });

  describe("getComponentStorage", () => {
    test("should return storage for existing component", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);

      const storage = world.getComponentStorage(TestComponentAType);
      expect(storage).toBeDefined();
      expect(storage?.size()).toBe(1);
    });

    test("should return undefined for non-existent component", () => {
      const storage = world.getComponentStorage(TestComponentAType);
      expect(storage).toBeUndefined();
    });
  });

  describe("addComponent edge cases", () => {
    test("should return false when adding to invalid entity", () => {
      const invalidEntity = 999 as ReturnType<World["createEntity"]>;
      const result = world.addComponent(invalidEntity, TestComponentAType);
      expect(result).toBe(false);
    });

    test("should return false when adding to destroyed entity", () => {
      const entity = world.createEntity();
      world.destroyEntity(entity);
      const result = world.addComponent(entity, TestComponentAType);
      expect(result).toBe(false);
    });

    test("should use default values when no data provided", () => {
      const entity = world.createEntity();
      world.addComponent(entity, TestComponentAType);
      expect(world.getComponent(entity, TestComponentAType)).toEqual({
        foo: "default",
      });
    });
  });

  describe("removeComponent edge cases", () => {
    test("should return false when removing from invalid entity", () => {
      const invalidEntity = 999 as ReturnType<World["createEntity"]>;
      const result = world.removeComponent(invalidEntity, TestComponentAType);
      expect(result).toBe(false);
    });

    test("should return false when removing from destroyed entity", () => {
      const entity = world.createEntity();
      world.destroyEntity(entity);
      const result = world.removeComponent(entity, TestComponentAType);
      expect(result).toBe(false);
    });
  });

  describe("world destroy", () => {
    test("should clear all entities", () => {
      world.createEntity();
      world.createEntity();
      world.destroy();
      expect(world.getEntityCount()).toBe(0);
    });

    test("should clear all systems", () => {
      const system = new TestSystem(world);
      world.addSystem(system);
      world.destroy();
      expect(world.getSystems()).toEqual([]);
    });

    test("should allow creating entities after destroy", () => {
      world.createEntity();
      world.destroy();
      const entity = world.createEntity();
      expect(world.getEntityCount()).toBe(1);
      expect(entity).toBe(0);
    });
  });

  describe("system error handling", () => {
    class ErrorSystem extends System {
      update(): void {
        throw new Error("System error");
      }
    }

    test("should throw error with system name when system update fails", () => {
      const system = new ErrorSystem(world);
      world.addSystem(system);

      expect(() => {
        world.update(16);
      }).toThrow('System "ErrorSystem" threw error during update');
    });
  });

  describe("removeSystem edge cases", () => {
    test("should return false when removing non-existent system", () => {
      const system = new TestSystem(world);
      const result = world.removeSystem(system);
      expect(result).toBe(false);
    });

    test("should not allow adding same system twice", () => {
      const system = new TestSystem(world);
      world.addSystem(system);
      expect(() => {
        world.addSystem(system);
      }).toThrow("System is already added to this world");
    });
  });
});
