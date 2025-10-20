import { defineComponent, type ComponentType } from "../index.js";

interface TestComponentA {
  foo: string;
  count: number;
}

describe("defineComponent", () => {
  const defaultA: TestComponentA = { foo: "default", count: 0 };
  const AComponent: ComponentType<TestComponentA> = defineComponent(
    "A",
    defaultA,
  );

  test("should create a component with default values", () => {
    const comp = AComponent.create();
    expect(comp).toEqual(defaultA);
  });

  test("should override default values with partial data", () => {
    const comp = AComponent.create({ foo: "custom" });
    expect(comp).toEqual({ foo: "custom", count: 0 });
  });

  test("should override multiple default values", () => {
    const comp = AComponent.create({ foo: "x", count: 42 });
    expect(comp).toEqual({ foo: "x", count: 42 });
  });

  test("should not modify the default object", () => {
    void AComponent.create({ foo: "temp" });
    const comp2 = AComponent.create();
    expect(comp2).toEqual(defaultA);
  });

  test("should have the correct component name", () => {
    expect(AComponent.name).toBe("A");
  });

  test("should handle empty partial override", () => {
    const comp = AComponent.create({});
    expect(comp).toEqual(defaultA);
  });

  test("should create independent instances", () => {
    const comp1 = AComponent.create({ foo: "first" });
    const comp2 = AComponent.create({ foo: "second" });

    expect(comp1.foo).toBe("first");
    expect(comp2.foo).toBe("second");
    expect(comp1).not.toBe(comp2);
  });

  test("should handle undefined in partial data", () => {
    const comp = AComponent.create({ foo: undefined });
    expect(comp.foo).toBeUndefined();
  });
});
