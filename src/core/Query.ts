import {
  validateQueryConfig,
  World,
  type ComponentStorage,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";

export type ExtractComponentData<C> =
  C extends ComponentType<infer T> ? T : never;

export type ComponentDataTuple<T extends readonly ComponentType<unknown>[]> = {
  [K in keyof T]: T[K] extends ComponentType<infer U> ? U : never;
};

export class Query<TData extends readonly unknown[] = readonly unknown[]> {
  private world: World;
  private config: QueryConfig;
  private cachedTuples: [EntityId, ...TData][] | null = null;
  private trackedComponentTypes: Set<string>;
  private storageCache: {
    with: ComponentStorage<unknown>[];
    without: ComponentStorage<unknown>[];
    oneOf: ComponentStorage<unknown>[];
  } | null = null;

  constructor(world: World, config: QueryConfig) {
    validateQueryConfig(config);

    this.world = world;
    this.config = config;

    this.trackedComponentTypes = new Set<string>();

    if (config.with) {
      for (const ct of config.with) {
        this.trackedComponentTypes.add(ct.name);
      }
    }
    if (config.without) {
      for (const ct of config.without) {
        this.trackedComponentTypes.add(ct.name);
      }
    }
    if (config.oneOf) {
      for (const ct of config.oneOf) {
        this.trackedComponentTypes.add(ct.name);
      }
    }
  }

  markDirty(): void {
    this.cachedTuples = null;
    this.storageCache = null;
  }

  tracksComponent(componentName: string): boolean {
    return this.trackedComponentTypes.has(componentName);
  }

  private buildTuples(): [EntityId, ...TData][] {
    if (!this.storageCache) {
      this.storageCache = {
        with: [],
        without: [],
        oneOf: [],
      };

      if (this.config.with) {
        for (const ct of this.config.with) {
          const storage = this.world.getComponentStorage(ct);
          if (!storage) {
            return [];
          }
          this.storageCache.with.push(storage);
        }
      }

      if (this.config.without) {
        for (const ct of this.config.without) {
          const storage = this.world.getComponentStorage(ct);
          if (storage) {
            this.storageCache.without.push(storage);
          }
        }
      }

      if (this.config.oneOf) {
        for (const ct of this.config.oneOf) {
          const storage = this.world.getComponentStorage(ct);
          if (storage) {
            this.storageCache.oneOf.push(storage);
          }
        }
      }
    }

    const result: [EntityId, ...TData][] = [];
    const entitiesToCheck = this.getOptimalEntitySet();
    const componentTypes = this.config.with ?? [];
    const {
      with: withStorages,
      without: withoutStorages,
      oneOf: oneOfStorages,
    } = this.storageCache;

    entityLoop: for (const entity of entitiesToCheck) {
      for (const storage of withStorages) {
        if (!storage.hasComponent(entity)) {
          continue entityLoop;
        }
      }

      for (const storage of withoutStorages) {
        if (storage.hasComponent(entity)) {
          continue entityLoop;
        }
      }

      if (this.config.oneOf && this.config.oneOf.length > 0) {
        if (oneOfStorages.length === 0) {
          continue entityLoop;
        }

        let hasOneOf = false;
        for (const storage of oneOfStorages) {
          if (storage.hasComponent(entity)) {
            hasOneOf = true;
            break;
          }
        }
        if (!hasOneOf) {
          continue entityLoop;
        }
      }

      const tuple: [EntityId, ...unknown[]] = [entity];

      for (const componentType of componentTypes) {
        tuple.push(this.world.getComponent(entity, componentType));
      }

      result.push(tuple as [EntityId, ...TData]);
    }

    return result;
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

  *[Symbol.iterator](): Iterator<[EntityId, ...TData]> {
    if (this.cachedTuples) {
      yield* this.cachedTuples;
      return;
    }

    this.cachedTuples = this.buildTuples();
    yield* this.cachedTuples;
  }

  without(...components: readonly ComponentType<unknown>[]): this {
    this.config.without = [
      ...(this.config.without ?? []),
      ...components,
    ] as ComponentType<unknown>[];

    for (const ct of components) {
      this.trackedComponentTypes.add(ct.name);
      this.world.registerQueryForComponent(this, ct);
    }

    this.markDirty();
    return this;
  }

  oneOf(...components: readonly ComponentType<unknown>[]): this {
    this.config.oneOf = [
      ...(this.config.oneOf ?? []),
      ...components,
    ] as ComponentType<unknown>[];

    for (const ct of components) {
      this.trackedComponentTypes.add(ct.name);
      this.world.registerQueryForComponent(this, ct);
    }

    this.markDirty();
    return this;
  }

  isEmpty(): boolean {
    return this.first() === null;
  }

  count(): number {
    this.cachedTuples ??= this.buildTuples();
    return this.cachedTuples.length;
  }

  first(): [EntityId, ...TData] | null {
    for (const result of this) {
      return result;
    }
    return null;
  }
}
