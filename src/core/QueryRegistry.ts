import type { Query } from "./Query.js";
import { MapSet } from "./MapSet.js";
import type { ComponentType } from "../index.js";

export class QueryRegistry {
  private componentToQueries = new MapSet<ComponentType<unknown>, Query>();

  register(
    query: Query,
    componentTypes: Iterable<ComponentType<unknown>>,
  ): void {
    for (const componentType of componentTypes) {
      this.componentToQueries.add(componentType, query);
    }
  }

  invalidateForComponent(componentType: ComponentType<unknown>): void {
    const queries = this.componentToQueries.get(componentType);
    if (queries) {
      for (const query of queries) {
        query.markDirty();
      }
    }
  }

  invalidateAll(): void {
    for (const queries of this.componentToQueries.values()) {
      for (const query of queries) {
        query.markDirty();
      }
    }
  }

  clear(): void {
    this.componentToQueries.clear();
  }

  size(): number {
    return this.componentToQueries.size();
  }

  getQueriesForComponent(
    componentType: ComponentType<unknown>,
  ): ReadonlySet<Query> | undefined {
    return this.componentToQueries.get(componentType);
  }
}
