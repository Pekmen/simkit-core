import {
  World,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";
import { validateQueryConfig } from "./QueryValidation.js";
import { QueryMatcher } from "./QueryMatcher.js";

export type ExtractComponentData<C> =
  C extends ComponentType<infer T> ? T : never;

export type ComponentDataTuple<T extends readonly ComponentType<unknown>[]> = {
  [K in keyof T]: T[K] extends ComponentType<infer U> ? U : never;
};

export class Query<TData extends readonly unknown[] = readonly unknown[]> {
  private world: World;
  private config: QueryConfig;
  private cachedResults: [EntityId, ...TData][] | null = null;
  private trackedComponents: Set<ComponentType<unknown>> | null = null;
  private matcher: QueryMatcher;

  constructor(world: World, config: QueryConfig = {}) {
    this.world = world;
    this.config = config;
    this.matcher = new QueryMatcher(world, config);

    const hasEmptyArrays =
      config.with?.length === 0 ||
      config.without?.length === 0 ||
      config.oneOf?.length === 0;

    if (this.hasAnyConstraints() || hasEmptyArrays) {
      validateQueryConfig(this.config);
    }
  }

  private hasAnyConstraints(): boolean {
    return (
      (this.config.with?.length ?? 0) > 0 ||
      (this.config.without?.length ?? 0) > 0 ||
      (this.config.oneOf?.length ?? 0) > 0
    );
  }

  getTrackedComponents(): ReadonlySet<ComponentType<unknown>> {
    if (this.trackedComponents !== null) {
      return this.trackedComponents;
    }

    const tracked = new Set<ComponentType<unknown>>();

    if (this.config.with) {
      for (const ct of this.config.with) {
        tracked.add(ct);
      }
    }

    if (this.config.without) {
      for (const ct of this.config.without) {
        tracked.add(ct);
      }
    }

    if (this.config.oneOf) {
      for (const ct of this.config.oneOf) {
        tracked.add(ct);
      }
    }

    this.trackedComponents = tracked;
    return tracked;
  }

  markDirty(): void {
    this.cachedResults = null;
  }

  getCacheSize(): number {
    return this.cachedResults?.length ?? 0;
  }

  private *generateResults(): Generator<[EntityId, ...TData]> {
    if (!this.hasAnyConstraints()) {
      throw new Error(
        `Query: Cannot iterate query without constraints. ` +
          `Queries must specify at least one constraint: with(), without(), or oneOf(). ` +
          `Examples:\n` +
          `  - world.query(Position, Velocity) // entities WITH Position AND Velocity\n` +
          `  - world.query().with(Position).without(Dead) // WITH Position, WITHOUT Dead\n` +
          `  - world.query().oneOf(Player, Enemy) // WITH either Player OR Enemy`,
      );
    }

    if (this.cachedResults !== null) {
      yield* this.cachedResults;
      return;
    }

    const storages = this.matcher.getStorages();

    if (
      this.config.with &&
      this.config.with.length > 0 &&
      storages.with.length === 0
    ) {
      return;
    }

    const entitiesToCheck = this.matcher.getOptimalEntitySet();
    const componentTypes = this.config.with ?? [];
    const results: [EntityId, ...TData][] = [];

    for (const entity of entitiesToCheck) {
      if (!this.matcher.entityMatches(entity, storages)) {
        continue;
      }

      const tuple: [EntityId, ...unknown[]] = [entity];

      for (const componentType of componentTypes) {
        tuple.push(this.world.getComponent(entity, componentType));
      }

      const typedTuple = tuple as [EntityId, ...TData];
      results.push(typedTuple);
      yield typedTuple;
    }

    this.cachedResults = results;
  }

  [Symbol.iterator](): Iterator<[EntityId, ...TData]> {
    return this.generateResults();
  }

  with<const T extends readonly ComponentType<unknown>[]>(
    ...components: T
  ): Query<ComponentDataTuple<T>> {
    const newConfig: QueryConfig = {
      ...this.config,
      with: [
        ...(this.config.with ?? []),
        ...components,
      ] as ComponentType<unknown>[],
    };
    const query = new Query<ComponentDataTuple<T>>(this.world, newConfig);
    this.world.registerQuery(query);
    return query;
  }

  without(...components: readonly ComponentType<unknown>[]): Query<TData> {
    const newConfig: QueryConfig = {
      ...this.config,
      without: [
        ...(this.config.without ?? []),
        ...components,
      ] as ComponentType<unknown>[],
    };
    const query = new Query<TData>(this.world, newConfig);
    if (
      (newConfig.with?.length ?? 0) > 0 ||
      (newConfig.without?.length ?? 0) > 0 ||
      (newConfig.oneOf?.length ?? 0) > 0
    ) {
      this.world.registerQuery(query);
    }
    return query;
  }

  oneOf(...components: readonly ComponentType<unknown>[]): Query<TData> {
    const newConfig: QueryConfig = {
      ...this.config,
      oneOf: [
        ...(this.config.oneOf ?? []),
        ...components,
      ] as ComponentType<unknown>[],
    };
    const query = new Query<TData>(this.world, newConfig);
    if (
      (newConfig.with?.length ?? 0) > 0 ||
      (newConfig.without?.length ?? 0) > 0 ||
      (newConfig.oneOf?.length ?? 0) > 0
    ) {
      this.world.registerQuery(query);
    }
    return query;
  }

  isEmpty(): boolean {
    return this.first() === null;
  }

  count(): number {
    if (this.cachedResults !== null) {
      return this.cachedResults.length;
    }

    if (!this.hasAnyConstraints()) {
      throw new Error(
        `Query: Cannot count query without constraints. ` +
          `Queries must specify at least one constraint: with(), without(), or oneOf(). ` +
          `Examples:\n` +
          `  - world.query(Position, Velocity).count() // count entities WITH Position AND Velocity\n` +
          `  - world.query().with(Position).without(Dead).count() // WITH Position, WITHOUT Dead\n` +
          `  - world.query().oneOf(Player, Enemy).count() // WITH either Player OR Enemy`,
      );
    }

    const storages = this.matcher.getStorages();

    if (
      this.config.with &&
      this.config.with.length > 0 &&
      storages.with.length === 0
    ) {
      return 0;
    }

    const entitiesToCheck = this.matcher.getOptimalEntitySet();
    let count = 0;

    for (const entity of entitiesToCheck) {
      if (this.matcher.entityMatches(entity, storages)) {
        count++;
      }
    }

    return count;
  }

  first(): [EntityId, ...TData] | null {
    for (const result of this) {
      return result;
    }
    return null;
  }

  dispose(): void {
    this.world.unregisterQuery(this);
    this.cachedResults = null;
  }
}
