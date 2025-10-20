import {
  World,
  defineComponent,
  EntityManager,
  ComponentStorage,
  ComponentRegistry,
  type EntityId,
} from "../index.js";

describe("Serialization", () => {
  describe("EntityManager", () => {
    test("should serialize and deserialize empty EntityManager", () => {
      const manager = new EntityManager();
      const snapshot = manager.toJSON();
      const restored = EntityManager.fromJSON(snapshot);

      expect(restored.getEntityCount()).toBe(0);
      expect(restored.getAllActiveEntities()).toEqual([]);
    });

    test("should serialize and deserialize EntityManager with entities", () => {
      const manager = new EntityManager();
      const entity1 = manager.createEntity();
      const entity2 = manager.createEntity();
      const entity3 = manager.createEntity();

      const snapshot = manager.toJSON();
      const restored = EntityManager.fromJSON(snapshot);

      expect(restored.getEntityCount()).toBe(3);
      expect(restored.isEntityValid(entity1)).toBe(true);
      expect(restored.isEntityValid(entity2)).toBe(true);
      expect(restored.isEntityValid(entity3)).toBe(true);
    });

    test("should preserve free list after serialization", () => {
      const manager = new EntityManager();
      const entity1 = manager.createEntity();
      const entity2 = manager.createEntity();
      const entity3 = manager.createEntity();

      manager.destroyEntity(entity2);

      const snapshot = manager.toJSON();
      const restored = EntityManager.fromJSON(snapshot);

      expect(restored.getEntityCount()).toBe(2);
      expect(restored.isEntityValid(entity1)).toBe(true);
      expect(restored.isEntityValid(entity2)).toBe(false);
      expect(restored.isEntityValid(entity3)).toBe(true);

      const entity4 = restored.createEntity();
      expect(restored.getEntityCount()).toBe(3);
      expect(restored.isEntityValid(entity4)).toBe(true);
    });
  });

  describe("ComponentStorage", () => {
    test("should serialize and deserialize empty ComponentStorage", () => {
      const storage = new ComponentStorage<{ x: number; y: number }>();
      const snapshot = storage.toJSON();
      const restored = ComponentStorage.fromJSON(snapshot);

      expect(restored.size()).toBe(0);
      expect(restored.getAllComponents()).toEqual([]);
    });

    test("should serialize and deserialize ComponentStorage with components", () => {
      const storage = new ComponentStorage<{ x: number; y: number }>();
      const entity1 = 0 as EntityId;
      const entity2 = 1 as EntityId;

      storage.addComponent(entity1, { x: 10, y: 20 });
      storage.addComponent(entity2, { x: 30, y: 40 });

      const snapshot = storage.toJSON();
      const restored = ComponentStorage.fromJSON<{ x: number; y: number }>(
        snapshot,
      );

      expect(restored.size()).toBe(2);
      expect(restored.getComponent(entity1)).toEqual({ x: 10, y: 20 });
      expect(restored.getComponent(entity2)).toEqual({ x: 30, y: 40 });
    });

    test("should preserve sparse array structure", () => {
      const storage = new ComponentStorage<{ value: number }>();
      const entity1 = 0 as EntityId;
      const entity2 = 100 as EntityId;

      storage.addComponent(entity1, { value: 1 });
      storage.addComponent(entity2, { value: 2 });

      const snapshot = storage.toJSON();
      const restored = ComponentStorage.fromJSON<{ value: number }>(snapshot);

      expect(restored.getComponent(entity1)).toEqual({ value: 1 });
      expect(restored.getComponent(entity2)).toEqual({ value: 2 });
      expect(restored.hasComponent(50 as EntityId)).toBe(false);
    });
  });

  describe("ComponentRegistry", () => {
    test("should serialize and deserialize empty ComponentRegistry", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const registry = new ComponentRegistry();

      const snapshot = registry.toJSON();
      const restored = ComponentRegistry.fromJSON(snapshot, [Position]);

      expect(restored.get(Position)).toBeUndefined();
    });

    test("should serialize and deserialize ComponentRegistry with components", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });

      const registry = new ComponentRegistry();
      const posStorage = registry.getOrCreate(Position);
      const velStorage = registry.getOrCreate(Velocity);

      const entity1 = 0 as EntityId;
      posStorage.addComponent(entity1, { x: 10, y: 20 });
      velStorage.addComponent(entity1, { dx: 1, dy: 2 });

      const snapshot = registry.toJSON();
      const restored = ComponentRegistry.fromJSON(snapshot, [
        Position,
        Velocity,
      ]);

      const restoredPosStorage = restored.get(Position);
      const restoredVelStorage = restored.get(Velocity);

      expect(restoredPosStorage?.getComponent(entity1)).toEqual({
        x: 10,
        y: 20,
      });
      expect(restoredVelStorage?.getComponent(entity1)).toEqual({
        dx: 1,
        dy: 2,
      });
    });

    test("should throw error if component type not provided", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });

      const registry = new ComponentRegistry();
      const posStorage = registry.getOrCreate(Position);
      posStorage.addComponent(0 as EntityId, { x: 10, y: 20 });

      const snapshot = registry.toJSON();

      expect(() => {
        ComponentRegistry.fromJSON(snapshot, [Velocity]);
      }).toThrow(/Component type 'Position' not found/);
    });
  });

  describe("World", () => {
    test("should serialize and deserialize empty World", () => {
      const world = new World();

      const snapshot = world.toJSON();
      const jsonString = JSON.stringify(snapshot);
      const restored = World.fromJSON(jsonString, []);

      expect(restored.getEntityCount()).toBe(0);
    });

    test("should serialize and deserialize World with entities and components", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });

      const world = new World();
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, Position, { x: 10, y: 20 });
      world.addComponent(entity1, Velocity, { dx: 1, dy: 2 });
      world.addComponent(entity2, Position, { x: 30, y: 40 });

      const snapshot = world.toJSON();
      const jsonString = JSON.stringify(snapshot);
      const restored = World.fromJSON(jsonString, [Position, Velocity]);

      expect(restored.getEntityCount()).toBe(2);
      expect(restored.getComponent(entity1, Position)).toEqual({
        x: 10,
        y: 20,
      });
      expect(restored.getComponent(entity1, Velocity)).toEqual({
        dx: 1,
        dy: 2,
      });
      expect(restored.getComponent(entity2, Position)).toEqual({
        x: 30,
        y: 40,
      });
      expect(restored.getComponent(entity2, Velocity)).toBeUndefined();
    });

    test("should handle entity destruction and recreation", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      const world = new World();
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, Position, { x: 10, y: 20 });
      world.addComponent(entity2, Position, { x: 30, y: 40 });
      world.addComponent(entity3, Position, { x: 50, y: 60 });

      world.destroyEntity(entity2);

      const snapshot = world.toJSON();
      const restored = World.fromJSON(JSON.stringify(snapshot), [Position]);

      expect(restored.getEntityCount()).toBe(2);
      expect(restored.getComponent(entity1, Position)).toEqual({
        x: 10,
        y: 20,
      });
      expect(restored.getComponent(entity2, Position)).toBeUndefined();
      expect(restored.getComponent(entity3, Position)).toEqual({
        x: 50,
        y: 60,
      });
    });

    test("should preserve entityComponents map", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });
      const Velocity = defineComponent("Velocity", { dx: 0, dy: 0 });
      const Health = defineComponent("Health", { hp: 100 });

      const world = new World();
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, Position, { x: 10, y: 20 });
      world.addComponent(entity1, Velocity, { dx: 1, dy: 2 });
      world.addComponent(entity2, Position, { x: 30, y: 40 });
      world.addComponent(entity2, Health, { hp: 50 });

      const snapshot = world.toJSON();
      const restored = World.fromJSON(JSON.stringify(snapshot), [
        Position,
        Velocity,
        Health,
      ]);

      expect(restored.hasComponent(entity1, Position)).toBe(true);
      expect(restored.hasComponent(entity1, Velocity)).toBe(true);
      expect(restored.hasComponent(entity1, Health)).toBe(false);

      expect(restored.hasComponent(entity2, Position)).toBe(true);
      expect(restored.hasComponent(entity2, Velocity)).toBe(false);
      expect(restored.hasComponent(entity2, Health)).toBe(true);
    });

    test("should work with WorldSnapshot object instead of string", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      const world = new World();
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      const snapshot = world.toJSON();
      const restored = World.fromJSON(snapshot, [Position]);

      expect(restored.getComponent(entity, Position)).toEqual({ x: 10, y: 20 });
    });

    test("should throw error on version mismatch", () => {
      const world = new World();
      const snapshot = world.toJSON();

      snapshot.version = "999.0";

      expect(() => {
        World.fromJSON(snapshot, []);
      }).toThrow(/Unsupported serialization version/);
    });

    test("should handle complex component data types", () => {
      const Inventory = defineComponent("Inventory", {
        items: [] as string[],
        gold: 0,
      });

      const world = new World();
      const entity = world.createEntity();
      world.addComponent(entity, Inventory, {
        items: ["sword", "shield", "potion"],
        gold: 100,
      });

      const snapshot = world.toJSON();
      const restored = World.fromJSON(JSON.stringify(snapshot), [Inventory]);

      expect(restored.getComponent(entity, Inventory)).toEqual({
        items: ["sword", "shield", "potion"],
        gold: 100,
      });
    });

    test("should handle large numbers of entities", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      const world = new World();
      const entities: EntityId[] = [];

      for (let i = 0; i < 1000; i++) {
        const entity = world.createEntity();
        entities.push(entity);
        world.addComponent(entity, Position, { x: i, y: i * 2 });
      }

      const snapshot = world.toJSON();
      const restored = World.fromJSON(JSON.stringify(snapshot), [Position]);

      expect(restored.getEntityCount()).toBe(1000);

      expect(restored.getComponent(entities[0], Position)).toEqual({
        x: 0,
        y: 0,
      });
      expect(restored.getComponent(entities[500], Position)).toEqual({
        x: 500,
        y: 1000,
      });
      expect(restored.getComponent(entities[999], Position)).toEqual({
        x: 999,
        y: 1998,
      });
    });

    test("should not serialize systems or queries", () => {
      const Position = defineComponent("Position", { x: 0, y: 0 });

      const world = new World();
      const entity = world.createEntity();
      world.addComponent(entity, Position, { x: 10, y: 20 });

      world.createQuery({ with: [Position] });

      const snapshot = world.toJSON();

      expect(snapshot).not.toHaveProperty("systems");
      expect(snapshot).not.toHaveProperty("queries");

      const restored = World.fromJSON(JSON.stringify(snapshot), [Position]);

      expect(restored.getComponent(entity, Position)).toEqual({ x: 10, y: 20 });

      const query = restored.createQuery({ with: [Position] });
      expect(query.execute()).toContain(entity);
    });
  });
});
