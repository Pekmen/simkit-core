import {
  defineComponent,
  World,
  type ComponentSerializer,
  type WorldSnapshot,
} from "../index.js";

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

interface Name {
  value: string;
}

const PositionType = defineComponent<Position>("Position", { x: 0, y: 0 });
const VelocityType = defineComponent<Velocity>("Velocity", { dx: 0, dy: 0 });
const NameType = defineComponent<Name>("Name", { value: "" });

describe("Snapshot", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  test("create and restore snapshot with simple components", () => {
    const entity1 = world.createEntity();
    world.addComponent(entity1, PositionType, { x: 10, y: 20 });
    world.addComponent(entity1, VelocityType, { dx: 1, dy: 2 });

    const entity2 = world.createEntity();
    world.addComponent(entity2, PositionType, { x: 30, y: 40 });

    const snapshot: WorldSnapshot = world.createSnapshot();

    expect(snapshot.entities).toHaveLength(2);
    expect(snapshot.entityManagerState.nextIndex).toBe(2);

    const newWorld = new World();
    newWorld.restoreFromSnapshot(snapshot);

    expect(newWorld.getEntityCount()).toBe(2);

    const pos1 = newWorld.getComponent(entity1, PositionType);
    expect(pos1).toEqual({ x: 10, y: 20 });

    const vel1 = newWorld.getComponent(entity1, VelocityType);
    expect(vel1).toEqual({ dx: 1, dy: 2 });

    const pos2 = newWorld.getComponent(entity2, PositionType);
    expect(pos2).toEqual({ x: 30, y: 40 });
  });

  test("create snapshot with empty world", () => {
    const snapshot: WorldSnapshot = world.createSnapshot();

    expect(snapshot.entities).toHaveLength(0);
    expect(snapshot.entityManagerState.nextIndex).toBe(0);
    expect(snapshot.entityManagerState.freeList).toHaveLength(0);
  });

  test("restore snapshot clears existing world state", () => {
    const entity1 = world.createEntity();
    world.addComponent(entity1, PositionType, { x: 10, y: 20 });

    const snapshot: WorldSnapshot = world.createSnapshot();

    const entity2 = world.createEntity();
    world.addComponent(entity2, NameType, { value: "test" });

    expect(world.getEntityCount()).toBe(2);

    world.restoreFromSnapshot(snapshot);

    expect(world.getEntityCount()).toBe(1);
    expect(world.getComponent(entity1, PositionType)).toEqual({ x: 10, y: 20 });
    expect(world.getComponent(entity2, NameType)).toBeUndefined();
  });

  test("snapshot preserves entity IDs", () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const entity3 = world.createEntity();

    world.addComponent(entity1, PositionType, { x: 1, y: 1 });
    world.addComponent(entity2, PositionType, { x: 2, y: 2 });
    world.addComponent(entity3, PositionType, { x: 3, y: 3 });

    const snapshot: WorldSnapshot = world.createSnapshot();

    const newWorld = new World();
    newWorld.restoreFromSnapshot(snapshot);

    expect(newWorld.getComponent(entity1, PositionType)).toEqual({
      x: 1,
      y: 1,
    });
    expect(newWorld.getComponent(entity2, PositionType)).toEqual({
      x: 2,
      y: 2,
    });
    expect(newWorld.getComponent(entity3, PositionType)).toEqual({
      x: 3,
      y: 3,
    });
  });

  test("snapshot with entity recycling", () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const entity3 = world.createEntity();

    world.addComponent(entity1, PositionType, { x: 1, y: 1 });
    world.addComponent(entity2, PositionType, { x: 2, y: 2 });
    world.addComponent(entity3, PositionType, { x: 3, y: 3 });

    world.destroyEntity(entity2);

    const snapshot: WorldSnapshot = world.createSnapshot();

    expect(snapshot.entities).toHaveLength(2);
    expect(snapshot.entityManagerState.freeList).toHaveLength(1);

    const newWorld = new World();
    newWorld.restoreFromSnapshot(snapshot);

    expect(newWorld.getEntityCount()).toBe(2);
    expect(newWorld.getComponent(entity1, PositionType)).toEqual({
      x: 1,
      y: 1,
    });
    expect(newWorld.getComponent(entity2, PositionType)).toBeUndefined();
    expect(newWorld.getComponent(entity3, PositionType)).toEqual({
      x: 3,
      y: 3,
    });

    const entity4 = newWorld.createEntity();
    newWorld.addComponent(entity4, PositionType, { x: 4, y: 4 });

    expect(newWorld.getEntityCount()).toBe(3);
  });

  test("snapshot with custom serializer", () => {
    interface ComplexData {
      timestamp: Date;
      value: number;
    }

    const ComplexType = defineComponent<ComplexData>("Complex", {
      timestamp: new Date(0),
      value: 0,
    });

    const serializer: ComponentSerializer<ComplexData> = {
      serialize: (component) => ({
        timestamp: component.timestamp.getTime(),
        value: component.value,
      }),
      deserialize: (data) => {
        const timestampValue = data.timestamp;
        const valueValue = data.value;
        return {
          timestamp: new Date(
            typeof timestampValue === "number" ? timestampValue : 0,
          ),
          value: typeof valueValue === "number" ? valueValue : 0,
        };
      },
    };

    world.registerComponentSerializer("Complex", serializer);

    const entity = world.createEntity();
    const testDate = new Date(2024, 0, 1);
    world.addComponent(entity, ComplexType, { timestamp: testDate, value: 42 });

    const snapshot: WorldSnapshot = world.createSnapshot();

    const newWorld = new World();
    newWorld.registerComponentSerializer("Complex", serializer);
    newWorld.restoreFromSnapshot(snapshot);

    const restored = newWorld.getComponent(entity, ComplexType);
    expect(restored?.timestamp.getTime()).toBe(testDate.getTime());
    expect(restored?.value).toBe(42);
  });

  test("multiple snapshot cycles", () => {
    const entity1 = world.createEntity();
    world.addComponent(entity1, PositionType, { x: 10, y: 20 });

    const snapshot1: WorldSnapshot = world.createSnapshot();

    const entity2 = world.createEntity();
    world.addComponent(entity2, VelocityType, { dx: 5, dy: 10 });

    const snapshot2: WorldSnapshot = world.createSnapshot();

    world.restoreFromSnapshot(snapshot1);
    expect(world.getEntityCount()).toBe(1);
    expect(world.getComponent(entity1, PositionType)).toEqual({ x: 10, y: 20 });
    expect(world.getComponent(entity2, VelocityType)).toBeUndefined();

    world.restoreFromSnapshot(snapshot2);
    expect(world.getEntityCount()).toBe(2);
    expect(world.getComponent(entity1, PositionType)).toEqual({ x: 10, y: 20 });
    expect(world.getComponent(entity2, VelocityType)).toEqual({
      dx: 5,
      dy: 10,
    });
  });

  test("snapshot does not include systems", () => {
    const entity = world.createEntity();
    world.addComponent(entity, PositionType, { x: 1, y: 1 });

    const snapshot: WorldSnapshot = world.createSnapshot();

    const newWorld = new World();
    newWorld.restoreFromSnapshot(snapshot);

    expect(newWorld.getSystems()).toHaveLength(0);
  });

  test("queries are invalidated after restore", () => {
    const entity = world.createEntity();
    world.addComponent(entity, PositionType, { x: 1, y: 1 });

    const query = world.createQuery({ with: [PositionType] });
    expect(query.execute()).toHaveLength(1);

    const snapshot: WorldSnapshot = world.createSnapshot();

    const entity2 = world.createEntity();
    world.addComponent(entity2, PositionType, { x: 2, y: 2 });

    world.restoreFromSnapshot(snapshot);

    expect(query.execute()).toHaveLength(1);
  });

  test("snapshot with multiple components per entity", () => {
    const entity = world.createEntity();
    world.addComponent(entity, PositionType, { x: 100, y: 200 });
    world.addComponent(entity, VelocityType, { dx: 10, dy: 20 });
    world.addComponent(entity, NameType, { value: "Player" });

    const snapshot: WorldSnapshot = world.createSnapshot();

    const newWorld = new World();
    newWorld.restoreFromSnapshot(snapshot);

    expect(newWorld.getComponent(entity, PositionType)).toEqual({
      x: 100,
      y: 200,
    });
    expect(newWorld.getComponent(entity, VelocityType)).toEqual({
      dx: 10,
      dy: 20,
    });
    expect(newWorld.getComponent(entity, NameType)).toEqual({
      value: "Player",
    });
  });
});
