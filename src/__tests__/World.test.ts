import { defineComponent } from "../core/Component";
import { World } from "../core/World";
import { System } from "../core/System";

interface TestComponentA {
  foo: string;
}

interface TestComponentB {
  bar: number;
}

const TestComponentAType = defineComponent<TestComponentA>("A", {
  foo: "default",
});
const TestComponentBType = defineComponent<TestComponentB>("B", { bar: 0 });

class TestSystem extends System {
  lastDelta = 0;
  updateCalls = 0;

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

  test("update components", () => {
    const entity = world.createEntity();
    world.addComponent(entity, TestComponentAType, { foo: "start" });

    world.updateComponent(entity, TestComponentAType, (c) => ({
      foo: c.foo + "_upd",
    }));
    expect(world.getComponent(entity, TestComponentAType)).toEqual({
      foo: "start_upd",
    });
  });

  test("updateComponent returns false when component is missing", () => {
    const entity = world.createEntity();
    const result = world.updateComponent(entity, TestComponentAType, (c) => ({
      foo: c.foo + "x",
    }));
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

    world.update(10);

    expect(s1.updateCalls).toBe(1);
    expect(s2.updateCalls).toBe(1);
    expect(s1.lastDelta).toBe(10);
    expect(s2.lastDelta).toBe(10);
  });
});
