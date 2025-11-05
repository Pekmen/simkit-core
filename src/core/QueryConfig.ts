import type { ComponentType } from "./Component.js";
import type { EntityId } from "./EntityId.js";

export interface QueryConfig {
  with?: ComponentType<unknown>[];
  without?: ComponentType<unknown>[];
  oneOf?: ComponentType<unknown>[];
}

export type QueryResult = readonly EntityId[];
export type QueryFunction = () => QueryResult;
