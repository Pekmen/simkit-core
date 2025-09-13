import { defineComponent } from "../core/Component";
import { validateQueryConfig } from "../core/QueryConfig";

describe("QueryConfig", () => {
  const ComponentA = defineComponent("ComponentA", { foo: "x" });
  const ComponentB = defineComponent("ComponentB", { foo: "y" });
  const ComponentC = defineComponent("ComponentC", {});

  describe("validation", () => {
    test("requires at least one constraint", () => {
      expect(() => {
        validateQueryConfig({});
      }).toThrow("at least one constraint");
    });

    test("rejects empty arrays", () => {
      expect(() => {
        validateQueryConfig({ with: [] });
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });

    test("accepts valid configurations", () => {
      expect(() => {
        validateQueryConfig({ with: [ComponentA] });
      }).not.toThrow();
      expect(() => {
        validateQueryConfig({
          with: [ComponentA, ComponentB],
          without: [ComponentC],
        });
      }).not.toThrow();
    });
  });
});
