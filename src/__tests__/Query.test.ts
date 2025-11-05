import { defineComponent, Query, World } from "../index.js";

interface TestComponentA {
  x: number;
  y: number;
}

interface TestComponentB {
  dx: number;
  dy: number;
}

interface TestComponentC {
  hp: number;
  maxHp: number;
}

interface TestComponentD {
  tag: string;
}

describe("Query", () => {
  let world: World;
  let ComponentA: ReturnType<typeof defineComponent<TestComponentA>>;
  let ComponentB: ReturnType<typeof defineComponent<TestComponentB>>;
  let ComponentC: ReturnType<typeof defineComponent<TestComponentC>>;
  let ComponentD: ReturnType<typeof defineComponent<TestComponentD>>;

  beforeEach(() => {
    world = new World();
    ComponentA = defineComponent("ComponentA", { x: 0, y: 0 });
    ComponentB = defineComponent("ComponentB", { dx: 0, dy: 0 });
    ComponentC = defineComponent("ComponentC", { hp: 100, maxHp: 100 });
    ComponentD = defineComponent("ComponentD", { tag: "default" });
  });

  describe("constructor", () => {
    test("should create a query with valid config", () => {
      const query = world.query(ComponentA);
      expect(query).toBeInstanceOf(Query);
    });

    test("should validate config and throw on invalid input when iterating", () => {
      expect(() => {
        const query = world.query();
        Array.from(query);
      }).toThrow("Query must specify at least one constraint");
    });
  });

  describe("iterator - with constraint", () => {
    test("should return entities that have all required components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, ComponentA, { x: 1, y: 1 });
      world.addComponent(entity1, ComponentB, { dx: 1, dy: 1 });

      world.addComponent(entity2, ComponentA, { x: 2, y: 2 });

      world.addComponent(entity3, ComponentB, { dx: 3, dy: 3 });

      const query = world.query(ComponentA, ComponentB);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });

    test("should return empty array when no entities match", () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, ComponentA);

      const query = world.query(ComponentB);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toEqual([]);
    });

    test("should handle single component requirement", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity2, ComponentB);

      const query = world.query(ComponentA);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result.length).toBe(1);
    });
  });

  describe("query - without constraint", () => {
    test("should return entities that don't have excluded components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity2, ComponentA);
      world.addComponent(entity2, ComponentB);

      const query = world.query(ComponentA).without(ComponentB);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });

    test("should handle multiple exclusions", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      const entity4 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity2, ComponentB);
      world.addComponent(entity3, ComponentC);

      const query = world.query(ComponentA).without(ComponentB, ComponentC);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result).not.toContain(entity4);
      expect(result.length).toBe(1);
    });
  });

  describe("query - oneOf constraint", () => {
    test("should return entities that have at least one of the specified components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      const entity4 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity2, ComponentB);
      world.addComponent(entity3, ComponentA);
      world.addComponent(entity3, ComponentB);

      const query = new Query(world, { oneOf: [ComponentA, ComponentB] });
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).toContain(entity2);
      expect(result).toContain(entity3);
      expect(result).not.toContain(entity4);
      expect(result.length).toBe(3);
    });

    test("should return empty array when no entities have any of the components", () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, ComponentC);

      const query = new Query(world, { oneOf: [ComponentA, ComponentB] });
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toEqual([]);
    });
  });

  describe("query - combined constraints", () => {
    test("should handle with + without constraints", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity1, ComponentC);

      world.addComponent(entity2, ComponentA);
      world.addComponent(entity2, ComponentB);

      world.addComponent(entity3, ComponentB);

      const query = world.query(ComponentA).without(ComponentB);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });

    test("should handle with + oneOf constraints", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity1, ComponentC);

      world.addComponent(entity2, ComponentA);
      world.addComponent(entity2, ComponentD);

      world.addComponent(entity3, ComponentA);

      const query = world.query(ComponentA).oneOf(ComponentC, ComponentD);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(2);
    });

    test("should handle without + oneOf constraints", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      const entity4 = world.createEntity();

      world.addComponent(entity1, ComponentC);
      world.addComponent(entity2, ComponentD);
      world.addComponent(entity3, ComponentA);
      world.addComponent(entity4, ComponentB);

      const query = new Query(world, {
        without: [ComponentA],
        oneOf: [ComponentC, ComponentD],
      });
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result).not.toContain(entity4);
      expect(result.length).toBe(2);
    });

    test("should handle all three constraint types together", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity1, ComponentC);

      world.addComponent(entity2, ComponentA);
      world.addComponent(entity2, ComponentB);
      world.addComponent(entity2, ComponentD);

      world.addComponent(entity3, ComponentA);

      const query = world
        .query(ComponentA)
        .without(ComponentB)
        .oneOf(ComponentC, ComponentD);
      const result = Array.from(query).map(([entity]) => entity);

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });
  });

  describe("edge cases", () => {
    test("should work with no entities in world", () => {
      const query = world.query(ComponentA);
      const result = Array.from(query).map(([entity]) => entity);
      expect(result).toEqual([]);
    });

    test("should work after entities are destroyed", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, ComponentA);
      world.addComponent(entity2, ComponentA);

      const query = world.query(ComponentA);
      let result = Array.from(query).map(([entity]) => entity);
      expect(result.length).toBe(2);

      world.destroyEntity(entity1);
      result = Array.from(query).map(([entity]) => entity);
      expect(result.length).toBe(1);
      expect(result).toContain(entity2);
    });

    test("should work after components are removed", () => {
      const entity = world.createEntity();
      world.addComponent(entity, ComponentA);
      world.addComponent(entity, ComponentB);

      const query = world.query(ComponentA, ComponentB);
      let result = Array.from(query).map(([entity]) => entity);
      expect(result.length).toBe(1);

      world.removeComponent(entity, ComponentB);
      result = Array.from(query).map(([entity]) => entity);
      expect(result.length).toBe(0);
    });
  });
});
