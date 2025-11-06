import type { Query } from "./Query.js";
import { MapSet } from "./MapSet.js";
import type { ComponentType } from "../index.js";

export class QueryRegistry {
  private componentToQueries = new MapSet<ComponentType<unknown>, Query>();
  private pendingInvalidations = new Set<ComponentType<unknown>>();
  private batchMode = false;

  startBatch(): void {
    this.batchMode = true;
    this.pendingInvalidations.clear();
  }

  endBatch(): void {
    this.batchMode = false;
    for (const componentType of this.pendingInvalidations) {
      this.invalidateForComponentImmediate(componentType);
    }
    this.pendingInvalidations.clear();
  }

  register(
    query: Query,
    componentTypes: Iterable<ComponentType<unknown>>,
  ): void {
    for (const componentType of componentTypes) {
      this.componentToQueries.add(componentType, query);
    }
  }

  unregister(
    query: Query,
    componentTypes: Iterable<ComponentType<unknown>>,
  ): void {
    for (const componentType of componentTypes) {
      this.componentToQueries.remove(componentType, query);
    }
  }

  invalidateForComponent(componentType: ComponentType<unknown>): void {
    if (this.batchMode) {
      this.pendingInvalidations.add(componentType);
      return;
    }

    this.invalidateForComponentImmediate(componentType);
  }

  private invalidateForComponentImmediate(
    componentType: ComponentType<unknown>,
  ): void {
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
