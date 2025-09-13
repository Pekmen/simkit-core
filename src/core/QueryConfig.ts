import { ComponentType } from "..";
import { EntityId } from "./Entity";

export interface QueryConfig {
  with?: ComponentType<unknown>[];
  without?: ComponentType<unknown>[];
  oneOf?: ComponentType<unknown>[];
}

export type QueryResult = readonly EntityId[];
export type QueryFunction = () => QueryResult;

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

  if (
    config.with?.length === 0 ||
    config.without?.length === 0 ||
    config.oneOf?.length === 0
  ) {
    throw new Error("Constraint arrays cannot be empty when specified");
  }
}
