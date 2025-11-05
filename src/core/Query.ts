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

  *[Symbol.iterator](): Iterator<[EntityId, ...TData]> {
    const withStorages: ComponentStorage<unknown>[] = [];
    const withoutStorages: ComponentStorage<unknown>[] = [];
    const oneOfStorages: ComponentStorage<unknown>[] = [];

    if (this.config.with) {
      for (const ct of this.config.with) {
        const storage = this.world.getComponentStorage(ct);
        if (!storage) {
          return;
        }
        withStorages.push(storage);
      }
    }

    if (this.config.without) {
      for (const ct of this.config.without) {
        const storage = this.world.getComponentStorage(ct);
        if (storage) {
          withoutStorages.push(storage);
        }
      }
    }

    if (this.config.oneOf) {
      for (const ct of this.config.oneOf) {
        const storage = this.world.getComponentStorage(ct);
        if (storage) {
          oneOfStorages.push(storage);
        }
      }
    }

    let entitiesToCheck: Iterable<EntityId>;
    if (!this.config.with || this.config.with.length === 0) {
      entitiesToCheck = this.world.getAllEntities();
    } else {
      let smallestSet: readonly EntityId[] | undefined;
      let smallestSize = Infinity;

      for (const componentType of this.config.with) {
        const entities = this.world.getEntitiesWithComponent(componentType);
        if (!entities) {
          return;
        }

        if (entities.length < smallestSize) {
          smallestSize = entities.length;
          smallestSet = entities;
        }
      }

      entitiesToCheck = smallestSet ?? this.world.getAllEntities();
    }

    const componentTypes = this.config.with ?? [];

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

      yield tuple as [EntityId, ...TData];
    }
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
