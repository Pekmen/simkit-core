import type { Query } from "./Query.js";
import { MapSet } from "./MapSet.js";

export class QueryRegistry {
  private componentToQueries = new MapSet<string, Query>();

  register(query: Query, componentNames: Iterable<string>): void {
    for (const componentName of componentNames) {
      this.componentToQueries.add(componentName, query);
    }
  }

  invalidateForComponent(componentName: string): void {
    const queries = this.componentToQueries.get(componentName);
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
    componentName: string,
  ): ReadonlySet<Query> | undefined {
    return this.componentToQueries.get(componentName);
  }
}
