import { describe, test, expect, beforeEach } from "vitest";
import { ComponentRegistry } from "../core/ComponentRegistry";
import { defineComponent, type ComponentType } from "../core/Component";
import { ComponentStorage } from "../core/ComponentStorage";
import { World } from "../core/World";

interface TestComponentA {
  foo: string;
}

interface TestComponentB {
  bar: number;
}

describe("ComponentRegistry", () => {
  let registry: ComponentRegistry;
  let componentA: ComponentType<TestComponentA>;
  let componentB: ComponentType<TestComponentB>;
  let world: World;

  beforeEach(() => {
    registry = new ComponentRegistry();
    componentA = defineComponent("A", { foo: "default" });
    componentB = defineComponent("B", { bar: 0 });
    world = new World();
  });

  test("getOrCreate returns a ComponentStorage instance", () => {
    const storage = registry.getOrCreate(componentA);
    expect(storage).toBeInstanceOf(ComponentStorage);
  });

  test("get returns undefined if storage does not exist", () => {
    const storage = registry.get(componentA);
    expect(storage).toBeUndefined();
  });

  test("get returns the same storage after getOrCreate", () => {
    const storage1 = registry.getOrCreate(componentA);
    const storage2 = registry.get(componentA);
    expect(storage2).toBe(storage1);
  });

  test("getOrCreate returns the same storage on multiple calls", () => {
    const storage1 = registry.getOrCreate(componentA);
    const storage2 = registry.getOrCreate(componentA);
    expect(storage2).toBe(storage1);
  });

  test("values() returns all stored ComponentStorage instances", () => {
    const storageA = registry.getOrCreate(componentA);
    const storageB = registry.getOrCreate(componentB);

    const storages = Array.from(registry.values());
    expect(storages).toContain(storageA);
    expect(storages).toContain(storageB);
    expect(storages.length).toBe(2);
  });

  test("storages for different components are independent", () => {
    const storageA = registry.getOrCreate(componentA);
    const storageB = registry.getOrCreate(componentB);

    const entity1 = world.createEntity();
    const entity2 = world.createEntity();

    storageA.addComponent(entity1, { foo: "test" });
    storageB.addComponent(entity1, { bar: 42 });

    const retrievedA = registry.get(componentA)?.getComponent(entity1);
    const retrievedB = registry.get(componentB)?.getComponent(entity1);

    expect(retrievedA).toEqual({ foo: "test" });
    expect(retrievedB).toEqual({ bar: 42 });

    expect(registry.get(componentA)?.getComponent(entity2)).toBeUndefined();
    expect(registry.get(componentB)?.getComponent(entity2)).toBeUndefined();
  });
});
