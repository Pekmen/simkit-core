import { defineComponent, Query, QueryConfig, World } from "../index.js";

interface PositionComponent {
  x: number;
  y: number;
}

interface VelocityComponent {
  dx: number;
  dy: number;
}

interface HealthComponent {
  hp: number;
  maxHp: number;
}

interface TagComponent {
  tag: string;
}

describe("Query", () => {
  let world: World;
  let PositionType: ReturnType<typeof defineComponent<PositionComponent>>;
  let VelocityType: ReturnType<typeof defineComponent<VelocityComponent>>;
  let HealthType: ReturnType<typeof defineComponent<HealthComponent>>;
  let TagType: ReturnType<typeof defineComponent<TagComponent>>;

  beforeEach(() => {
    world = new World();
    PositionType = defineComponent("Position", { x: 0, y: 0 });
    VelocityType = defineComponent("Velocity", { dx: 0, dy: 0 });
    HealthType = defineComponent("Health", { hp: 100, maxHp: 100 });
    TagType = defineComponent("Tag", { tag: "default" });
  });

  describe("constructor", () => {
    test("should create a query with valid config", () => {
      const config: QueryConfig = { with: [PositionType] };
      const query = new Query(world, config);
      expect(query).toBeInstanceOf(Query);
    });

    test("should validate config and throw on invalid input", () => {
      const invalidConfig: QueryConfig = {};
      expect(() => new Query(world, invalidConfig)).toThrow(
        "Query must specify at least one constraint",
      );
    });
  });

  describe("execute - with constraint", () => {
    test("should return entities that have all required components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, PositionType, { x: 1, y: 1 });
      world.addComponent(entity1, VelocityType, { dx: 1, dy: 1 });

      world.addComponent(entity2, PositionType, { x: 2, y: 2 });

      world.addComponent(entity3, VelocityType, { dx: 3, dy: 3 });

      const query = new Query(world, { with: [PositionType, VelocityType] });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });

    test("should return empty array when no entities match", () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, PositionType);

      const query = new Query(world, { with: [VelocityType] });
      const result = query.execute();

      expect(result).toEqual([]);
    });

    test("should handle single component requirement", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity2, VelocityType);

      const query = new Query(world, { with: [PositionType] });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result.length).toBe(1);
    });
  });

  describe("execute - without constraint", () => {
    test("should return entities that don't have excluded components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity2, PositionType);
      world.addComponent(entity2, VelocityType);

      const query = new Query(world, { without: [VelocityType] });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).toContain(entity3);
      expect(result.length).toBe(2);
    });

    test("should handle multiple exclusions", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      const entity4 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity2, VelocityType);
      world.addComponent(entity3, HealthType);

      const query = new Query(world, { without: [VelocityType, HealthType] });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result).toContain(entity4);
      expect(result.length).toBe(2);
    });
  });

  describe("execute - oneOf constraint", () => {
    test("should return entities that have at least one of the specified components", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();
      const entity4 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity2, VelocityType);
      world.addComponent(entity3, PositionType);
      world.addComponent(entity3, VelocityType);

      const query = new Query(world, { oneOf: [PositionType, VelocityType] });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).toContain(entity2);
      expect(result).toContain(entity3);
      expect(result).not.toContain(entity4);
      expect(result.length).toBe(3);
    });

    test("should return empty array when no entities have any of the components", () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, HealthType);

      const query = new Query(world, { oneOf: [PositionType, VelocityType] });
      const result = query.execute();

      expect(result).toEqual([]);
    });
  });

  describe("execute - combined constraints", () => {
    test("should handle with + without constraints", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity1, HealthType);

      world.addComponent(entity2, PositionType);
      world.addComponent(entity2, VelocityType);

      world.addComponent(entity3, VelocityType);

      const query = new Query(world, {
        with: [PositionType],
        without: [VelocityType],
      });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });

    test("should handle with + oneOf constraints", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity1, HealthType);

      world.addComponent(entity2, PositionType);
      world.addComponent(entity2, TagType);

      world.addComponent(entity3, PositionType);

      const query = new Query(world, {
        with: [PositionType],
        oneOf: [HealthType, TagType],
      });
      const result = query.execute();

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

      world.addComponent(entity1, HealthType);
      world.addComponent(entity2, TagType);
      world.addComponent(entity3, PositionType);
      world.addComponent(entity4, VelocityType);

      const query = new Query(world, {
        without: [PositionType],
        oneOf: [HealthType, TagType],
      });
      const result = query.execute();

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

      world.addComponent(entity1, PositionType);
      world.addComponent(entity1, HealthType);

      world.addComponent(entity2, PositionType);
      world.addComponent(entity2, VelocityType);
      world.addComponent(entity2, TagType);

      world.addComponent(entity3, PositionType);

      const query = new Query(world, {
        with: [PositionType],
        without: [VelocityType],
        oneOf: [HealthType, TagType],
      });
      const result = query.execute();

      expect(result).toContain(entity1);
      expect(result).not.toContain(entity2);
      expect(result).not.toContain(entity3);
      expect(result.length).toBe(1);
    });
  });

  describe("edge cases", () => {
    test("should work with no entities in world", () => {
      const query = new Query(world, { with: [PositionType] });
      const result = query.execute();
      expect(result).toEqual([]);
    });

    test("should work after entities are destroyed", () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, PositionType);
      world.addComponent(entity2, PositionType);

      const query = new Query(world, { with: [PositionType] });
      let result = query.execute();
      expect(result.length).toBe(2);

      world.destroyEntity(entity1);
      result = query.execute();
      expect(result.length).toBe(1);
      expect(result).toContain(entity2);
    });

    test("should work after components are removed", () => {
      const entity = world.createEntity();
      world.addComponent(entity, PositionType);
      world.addComponent(entity, VelocityType);

      const query = new Query(world, { with: [PositionType, VelocityType] });
      let result = query.execute();
      expect(result.length).toBe(1);

      world.removeComponent(entity, VelocityType);
      result = query.execute();
      expect(result.length).toBe(0);
    });
  });
});
