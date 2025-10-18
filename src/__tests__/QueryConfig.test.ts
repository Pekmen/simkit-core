import {
  ComponentType,
  defineComponent,
  QueryConfig,
  validateQueryConfig,
} from "../index.js";

interface TestComponentA {
  value: number;
}

interface TestComponentB {
  name: string;
}

interface TestComponentC {
  active: boolean;
}

describe("validateQueryConfig", () => {
  let ComponentA: ReturnType<typeof defineComponent<TestComponentA>>;
  let ComponentB: ReturnType<typeof defineComponent<TestComponentB>>;
  let ComponentC: ReturnType<typeof defineComponent<TestComponentC>>;

  beforeEach(() => {
    ComponentA = defineComponent("ComponentA", { value: 0 });
    ComponentB = defineComponent("ComponentB", { name: "test" });
    ComponentC = defineComponent("ComponentC", { active: true });
  });

  describe("valid configurations", () => {
    test("should accept config with only 'with' constraint", () => {
      const config: QueryConfig = { with: [ComponentA] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with only 'without' constraint", () => {
      const config: QueryConfig = { without: [ComponentA] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with only 'oneOf' constraint", () => {
      const config: QueryConfig = { oneOf: [ComponentA] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with multiple 'with' components", () => {
      const config: QueryConfig = { with: [ComponentA, ComponentB] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with multiple 'without' components", () => {
      const config: QueryConfig = { without: [ComponentA, ComponentB] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with multiple 'oneOf' components", () => {
      const config: QueryConfig = { oneOf: [ComponentA, ComponentB] };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with valid combination of constraints", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentB],
        oneOf: [ComponentC],
      };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should accept config with all constraint types having multiple components", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentB],
        oneOf: [ComponentC],
      };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });
  });

  describe("invalid configurations - missing constraints", () => {
    test("should reject empty config", () => {
      const config: QueryConfig = {};
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });

    test("should reject config with all undefined constraints", () => {
      expect(() => {
        validateQueryConfig({});
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });
  });

  describe("invalid configurations - empty arrays", () => {
    test("should reject config with empty 'with' array", () => {
      const config: QueryConfig = { with: [] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });

    test("should reject config with empty 'without' array", () => {
      const config: QueryConfig = { without: [] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });

    test("should reject config with empty 'oneOf' array", () => {
      const config: QueryConfig = { oneOf: [] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });

    test("should reject config with multiple empty arrays", () => {
      const config: QueryConfig = { with: [], without: [] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    });
  });

  describe("invalid configurations - malformed components", () => {
    test("should reject components without name in 'with'", () => {
      const invalidComponent = {
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { with: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'with': component must have a valid name property",
      );
    });

    test("should reject components with empty name in 'with'", () => {
      const invalidComponent = {
        name: "",
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { with: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'with': component must have a valid name property",
      );
    });

    test("should reject components with non-string name in 'without'", () => {
      const invalidComponent = {
        name: 123,
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { without: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'without': component must have a valid name property",
      );
    });

    test("should reject components without name in 'oneOf'", () => {
      const invalidComponent = {
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { oneOf: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'oneOf': component must have a valid name property",
      );
    });
  });

  describe("invalid configurations - constraint conflicts", () => {
    test("should reject component in both 'with' and 'without'", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentA],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both required (with) and excluded (without)`,
      );
    });

    test("should reject component in both 'with' and 'oneOf'", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        oneOf: [ComponentA],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both required (with) and optional (oneOf)`,
      );
    });

    test("should reject component in both 'without' and 'oneOf'", () => {
      const config: QueryConfig = {
        without: [ComponentA],
        oneOf: [ComponentA],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both excluded (without) and optional (oneOf)`,
      );
    });

    test("should reject component appearing in multiple arrays with different conflicts", () => {
      const config: QueryConfig = {
        with: [ComponentA, ComponentB],
        without: [ComponentB, ComponentC],
        oneOf: [ComponentC],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentB" cannot be both required (with) and excluded (without)`,
      );
    });

    test("should detect conflicts even with multiple components in each array", () => {
      const config: QueryConfig = {
        with: [ComponentA, ComponentB],
        oneOf: [ComponentC, ComponentA],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both required (with) and optional (oneOf)`,
      );
    });
  });

  describe("edge cases", () => {
    test("should allow same component name in different valid constraint combinations", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentB],
        oneOf: [ComponentC],
      };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });

    test("should handle component with undefined name property", () => {
      const invalidComponent = {
        name: undefined,
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { with: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'with': component must have a valid name property",
      );
    });

    test("should handle component with null name property", () => {
      const invalidComponent = {
        name: null,
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = { with: [invalidComponent] };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'with': component must have a valid name property",
      );
    });

    test("should validate all components in arrays even if first ones are valid", () => {
      const invalidComponent = {
        name: "",
        create: () => ({}),
      } as unknown as ComponentType<unknown>;
      const config: QueryConfig = {
        with: [ComponentA, ComponentB, invalidComponent],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        "Invalid component in 'with': component must have a valid name property",
      );
    });

    test("should detect conflicts in the middle of arrays", () => {
      const config: QueryConfig = {
        with: [ComponentA, ComponentB, ComponentC],
        without: [ComponentB],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentB" cannot be both required (with) and excluded (without)`,
      );
    });

    test("should work with single-element arrays", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentB],
        oneOf: [ComponentC],
      };
      expect(() => {
        validateQueryConfig(config);
      }).not.toThrow();
    });
  });

  describe("comprehensive conflict detection", () => {
    test("should detect all types of conflicts in a complex configuration", () => {
      const config: QueryConfig = {
        with: [ComponentA, ComponentB],
        without: [ComponentA],
        oneOf: [ComponentB],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both required (with) and excluded (without)`,
      );
    });

    test("should prioritize 'with vs without' conflicts over 'with vs oneOf' conflicts", () => {
      const config: QueryConfig = {
        with: [ComponentA],
        without: [ComponentA],
        oneOf: [ComponentA],
      };
      expect(() => {
        validateQueryConfig(config);
      }).toThrow(
        `Component "ComponentA" cannot be both required (with) and excluded (without)`,
      );
    });
  });
});
