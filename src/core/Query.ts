import {
  World,
  type ComponentStorage,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";
import { validateQueryConfig } from "./QueryValidation.js";

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

  constructor(world: World, config: QueryConfig = {}) {
    this.world = world;
    this.config = config;

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

  private getStorages(): {
    with: ComponentStorage<unknown>[];
    without: ComponentStorage<unknown>[];
    oneOf: ComponentStorage<unknown>[];
  } {
    const storages = {
      with: [] as ComponentStorage<unknown>[],
      without: [] as ComponentStorage<unknown>[],
      oneOf: [] as ComponentStorage<unknown>[],
    };

    if (this.config.with) {
      for (const ct of this.config.with) {
        const storage = this.world.getComponentStorage(ct);
        if (!storage) {
          return { with: [], without: [], oneOf: [] };
        }
        storages.with.push(storage);
      }
    }

    if (this.config.without) {
      for (const ct of this.config.without) {
        const storage = this.world.getComponentStorage(ct);
        if (storage) {
          storages.without.push(storage);
        }
      }
    }

    if (this.config.oneOf) {
      for (const ct of this.config.oneOf) {
        const storage = this.world.getComponentStorage(ct);
        if (storage) {
          storages.oneOf.push(storage);
        }
      }
    }

    return storages;
  }

  private entityMatchesQuery(
    entity: EntityId,
    storages: {
      with: ComponentStorage<unknown>[];
      without: ComponentStorage<unknown>[];
      oneOf: ComponentStorage<unknown>[];
    },
  ): boolean {
    for (const storage of storages.with) {
      if (!storage.hasComponent(entity)) {
        return false;
      }
    }

    for (const storage of storages.without) {
      if (storage.hasComponent(entity)) {
        return false;
      }
    }

    if (this.config.oneOf && this.config.oneOf.length > 0) {
      if (storages.oneOf.length === 0) {
        return false;
      }

      let hasOneOf = false;
      for (const storage of storages.oneOf) {
        if (storage.hasComponent(entity)) {
          hasOneOf = true;
          break;
        }
      }
      if (!hasOneOf) {
        return false;
      }
    }

    return true;
  }

  private *generateResults(): Generator<[EntityId, ...TData]> {
    if (!this.hasAnyConstraints()) {
      throw new Error(
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    }

    if (this.cachedResults !== null) {
      yield* this.cachedResults;
      return;
    }

    const storages = this.getStorages();

    if (
      this.config.with &&
      this.config.with.length > 0 &&
      storages.with.length === 0
    ) {
      return;
    }

    const entitiesToCheck = this.getOptimalEntitySet();
    const componentTypes = this.config.with ?? [];
    const results: [EntityId, ...TData][] = [];

    for (const entity of entitiesToCheck) {
      if (!this.entityMatchesQuery(entity, storages)) {
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

  private getOptimalEntitySet(): Iterable<EntityId> {
    if (!this.config.with || this.config.with.length === 0) {
      return this.world.getAllEntities();
    }

    let smallestSet: readonly EntityId[] | undefined;
    let smallestSize = Infinity;

    for (const componentType of this.config.with) {
      const entities = this.world.getEntitiesWithComponent(componentType);
      if (!entities) {
        return [];
      }

      if (entities.length < smallestSize) {
        smallestSize = entities.length;
        smallestSet = entities;
      }
    }

    return smallestSet ?? this.world.getAllEntities();
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
        "Query must specify at least one constraint (with, without, or oneOf)",
      );
    }

    const storages = this.getStorages();

    if (
      this.config.with &&
      this.config.with.length > 0 &&
      storages.with.length === 0
    ) {
      return 0;
    }

    const entitiesToCheck = this.getOptimalEntitySet();
    let count = 0;

    for (const entity of entitiesToCheck) {
      if (this.entityMatchesQuery(entity, storages)) {
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
