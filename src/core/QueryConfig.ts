import { ComponentType, EntityId } from "../index.js";

export interface QueryConfig {
  with?: ComponentType<unknown>[];
  without?: ComponentType<unknown>[];
  oneOf?: ComponentType<unknown>[];
}

export type QueryResult = readonly EntityId[];
export type QueryFunction = () => QueryResult;

// @TODO: break into separate functions for each check?
export function validateQueryConfig(config: QueryConfig): void {
  const hasConstraints =
    (config.with?.length ?? 0) > 0 ||
    (config.without?.length ?? 0) > 0 ||
    (config.oneOf?.length ?? 0) > 0;

  if (!hasConstraints) {
    throw new Error(
      "Query must specify at least one constraint (with, without, or oneOf)",
    );
  }

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

  const withSet = new Set<ComponentType<unknown>>();
  const withoutSet = new Set<ComponentType<unknown>>();
  const oneOfSet = new Set<ComponentType<unknown>>();

  // Process 'with' array
  if (config.with) {
    for (const component of config.with) {
      if (!component.name || typeof component.name !== "string") {
        throw new Error(
          `Invalid component: component must have a valid name property`,
        );
      }
      withSet.add(component);
    }
  }

  // Process 'without' array and check conflicts with 'with'
  if (config.without) {
    for (const component of config.without) {
      if (!component.name || typeof component.name !== "string") {
        throw new Error(
          `Invalid component: component must have a valid name property`,
        );
      }
      if (withSet.has(component)) {
        throw new Error(
          `Component "${component.name}" cannot be both required (with) and excluded (without)`,
        );
      }
      withoutSet.add(component);
    }
  }

  // Process 'oneOf' array and check conflicts with 'with' and 'without'
  if (config.oneOf) {
    for (const component of config.oneOf) {
      if (!component.name || typeof component.name !== "string") {
        throw new Error(
          `Invalid component: component must have a valid name property`,
        );
      }
      if (withSet.has(component)) {
        throw new Error(
          `Component "${component.name}" cannot be both required (with) and optional (oneOf)`,
        );
      }
      if (withoutSet.has(component)) {
        throw new Error(
          `Component "${component.name}" cannot be both excluded (without) and optional (oneOf)`,
        );
      }
      oneOfSet.add(component);
    }
  }
}
