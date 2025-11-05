import type { ComponentType, EntityId } from "../index.js";

export interface QueryConfig {
  with?: ComponentType<unknown>[];
  without?: ComponentType<unknown>[];
  oneOf?: ComponentType<unknown>[];
}

export type QueryResult = readonly EntityId[];
export type QueryFunction = () => QueryResult;

function validateComponentArray(
  components: ComponentType<unknown>[],
  arrayName: string,
): void {
  const seen = new Set<string>();
  for (const component of components) {
    if (!component.name || typeof component.name !== "string") {
      throw new Error(
        `Invalid component in '${arrayName}': component must have a valid name property`,
      );
    }
    if (seen.has(component.name)) {
      throw new Error(
        `Duplicate component "${component.name}" in '${arrayName}' constraint`,
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
      `Component "${component.name}" cannot be both required (with) and excluded (without)`,
    );
  }
  if (currentArrayName === "oneOf") {
    if (withSet.has(component.name)) {
      throw new Error(
        `Component "${component.name}" cannot be both required (with) and optional (oneOf)`,
      );
    }
    if (withoutSet.has(component.name)) {
      throw new Error(
        `Component "${component.name}" cannot be both excluded (without) and optional (oneOf)`,
      );
    }
  }
}

export function validateQueryConfig(config: QueryConfig): void {
  if (config.with?.length === 0) {
    throw new Error(
      "'with' constraint cannot be an empty array. Use undefined instead.",
    );
  }

  if (config.without?.length === 0) {
    throw new Error(
      "'without' constraint cannot be an empty array. Use undefined instead.",
    );
  }

  if (config.oneOf?.length === 0) {
    throw new Error(
      "'oneOf' constraint cannot be an empty array. Use undefined instead.",
    );
  }

  const hasConstraints =
    (config.with?.length ?? 0) > 0 ||
    (config.without?.length ?? 0) > 0 ||
    (config.oneOf?.length ?? 0) > 0;

  if (!hasConstraints) {
    throw new Error(
      "Query must specify at least one constraint (with, without, or oneOf)",
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
