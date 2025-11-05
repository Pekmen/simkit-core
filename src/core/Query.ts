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

  constructor(world: World, config: QueryConfig) {
    validateQueryConfig(config);

    this.world = world;
    this.config = config;
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
          // Missing storage means no entities can match
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

  private *generateResults(): Generator<[EntityId, ...TData]> {
    const storages = this.getStorages();

    // Early exit if we have 'with' constraints but no storages
    if (
      this.config.with &&
      this.config.with.length > 0 &&
      storages.with.length === 0
    ) {
      return;
    }

    const entitiesToCheck = this.getOptimalEntitySet();
    const componentTypes = this.config.with ?? [];

    entityLoop: for (const entity of entitiesToCheck) {
      // Check 'with' constraints
      for (const storage of storages.with) {
        if (!storage.hasComponent(entity)) {
          continue entityLoop;
        }
      }

      // Check 'without' constraints
      for (const storage of storages.without) {
        if (storage.hasComponent(entity)) {
          continue entityLoop;
        }
      }

      // Check 'oneOf' constraints
      if (this.config.oneOf && this.config.oneOf.length > 0) {
        if (storages.oneOf.length === 0) {
          continue entityLoop;
        }

        let hasOneOf = false;
        for (const storage of storages.oneOf) {
          if (storage.hasComponent(entity)) {
            hasOneOf = true;
            break;
          }
        }
        if (!hasOneOf) {
          continue entityLoop;
        }
      }

      // Build tuple with entity and component data
      const tuple: [EntityId, ...unknown[]] = [entity];

      for (const componentType of componentTypes) {
        tuple.push(this.world.getComponent(entity, componentType));
      }

      yield tuple as [EntityId, ...TData];
    }
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

  without(...components: readonly ComponentType<unknown>[]): this {
    this.config.without = [
      ...(this.config.without ?? []),
      ...components,
    ] as ComponentType<unknown>[];

    return this;
  }

  oneOf(...components: readonly ComponentType<unknown>[]): this {
    this.config.oneOf = [
      ...(this.config.oneOf ?? []),
      ...components,
    ] as ComponentType<unknown>[];

    return this;
  }

  isEmpty(): boolean {
    return this.first() === null;
  }

  count(): number {
    let count = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of this) {
      count++;
    }
    return count;
  }

  first(): [EntityId, ...TData] | null {
    for (const result of this) {
      return result;
    }
    return null;
  }
}
