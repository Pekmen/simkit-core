import type { ComponentType } from "./Component.js";
import type { QueryConfig } from "./QueryConfig.js";

function validateComponentArray(
  components: ComponentType<unknown>[],
  arrayName: string,
): void {
  const seen = new Set<string>();
  for (const component of components) {
    if (!component.name || typeof component.name !== "string") {
      throw new Error(
        `QueryValidation: Invalid component in '${arrayName}' constraint. ` +
          `Component must have a valid 'name' property (string). ` +
          `Ensure you're using components created with defineComponent(). ` +
          `Example: const Position = defineComponent("Position", { x: 0, y: 0 })`,
      );
    }
    if (seen.has(component.name)) {
      throw new Error(
        `QueryValidation: Duplicate component "${component.name}" in '${arrayName}' constraint. ` +
          `Each component can only appear once per constraint type. ` +
          `Remove the duplicate component from the ${arrayName} array.`,
      );
    }
    seen.add(component.name);
  }
}

function checkComponentConflicts(
  component: ComponentType<unknown>,
  withSet: Set<string>,
  withoutSet: Set<string>,
  currentArrayName: string,
): void {
  if (currentArrayName === "without" && withSet.has(component.name)) {
    throw new Error(
      `QueryValidation: Component "${component.name}" cannot be both required (with) and excluded (without). ` +
        `This creates a logical impossibility - an entity cannot both have and not have the same component. ` +
        `Remove "${component.name}" from either the 'with' or 'without' constraint.`,
    );
  }
  if (currentArrayName === "oneOf") {
    if (withSet.has(component.name)) {
      throw new Error(
        `QueryValidation: Component "${component.name}" cannot be both required (with) and optional (oneOf). ` +
          `If a component is required, it doesn't need to be in oneOf. ` +
          `Remove "${component.name}" from either the 'with' or 'oneOf' constraint.`,
      );
    }
    if (withoutSet.has(component.name)) {
      throw new Error(
        `QueryValidation: Component "${component.name}" cannot be both excluded (without) and optional (oneOf). ` +
          `This creates a logical impossibility - an entity cannot be excluded and optionally included. ` +
          `Remove "${component.name}" from either the 'without' or 'oneOf' constraint.`,
      );
    }
  }
}

export function validateQueryConfig(config: QueryConfig): void {
  if (config.with?.length === 0) {
    throw new Error(
      `QueryValidation: 'with' constraint cannot be an empty array. ` +
        `Either provide components or omit the 'with' property entirely. ` +
        `Example: { with: [Position, Velocity] } or {}`,
    );
  }

  if (config.without?.length === 0) {
    throw new Error(
      `QueryValidation: 'without' constraint cannot be an empty array. ` +
        `Either provide components or omit the 'without' property entirely. ` +
        `Example: { without: [Dead, Frozen] } or {}`,
    );
  }

  if (config.oneOf?.length === 0) {
    throw new Error(
      `QueryValidation: 'oneOf' constraint cannot be an empty array. ` +
        `Either provide components or omit the 'oneOf' property entirely. ` +
        `Example: { oneOf: [Player, Enemy] } or {}`,
    );
  }

  const hasConstraints =
    (config.with?.length ?? 0) > 0 ||
    (config.without?.length ?? 0) > 0 ||
    (config.oneOf?.length ?? 0) > 0;

  if (!hasConstraints) {
    throw new Error(
      `QueryValidation: Query must specify at least one constraint (with, without, or oneOf). ` +
        `Empty queries are not allowed. ` +
        `Example: world.query(Position) or new Query(world, { with: [Position], without: [Dead] })`,
    );
  }

  const withSet = new Set<string>();
  const withoutSet = new Set<string>();

  if (config.with) {
    validateComponentArray(config.with, "with");
    for (const component of config.with) {
      withSet.add(component.name);
    }
  }

  if (config.without) {
    validateComponentArray(config.without, "without");
    for (const component of config.without) {
      checkComponentConflicts(component, withSet, withoutSet, "without");
      withoutSet.add(component.name);
    }
  }

  if (config.oneOf) {
    validateComponentArray(config.oneOf, "oneOf");
    for (const component of config.oneOf) {
      checkComponentConflicts(component, withSet, withoutSet, "oneOf");
    }
  }
}
