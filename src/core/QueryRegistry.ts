import type { Query } from "./Query.js";
import { MapSet } from "./MapSet.js";
import type { ComponentType } from "../index.js";

export class QueryRegistry {
  private componentToQueries = new MapSet<ComponentType<unknown>, Query>();

  private pendingInvalidationsStack: Set<ComponentType<unknown>>[] = [];

  startBatch(): void {
    this.pendingInvalidationsStack.push(new Set());
  }

  endBatch(): void {
    if (this.pendingInvalidationsStack.length === 0) {
      throw new Error(
        "QueryRegistry: endBatch() called without matching startBatch()",
      );
    }

    const pending = this.pendingInvalidationsStack.pop();
    if (pending && pending.size > 0) {
      for (const componentType of pending) {
        this.invalidateForComponentImmediate(componentType);
      }
    }
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
    if (this.pendingInvalidationsStack.length > 0) {
      // Add to current batch scope's pending set.
      const top =
        this.pendingInvalidationsStack[
          this.pendingInvalidationsStack.length - 1
        ];
      if (top) top.add(componentType);
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
