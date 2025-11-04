import {
  validateQueryConfig,
  World,
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
  }

  tracksComponent(componentName: string): boolean {
    return this.trackedComponentTypes.has(componentName);
  }

  private buildTuples(): [EntityId, ...TData][] {
    const withStorages = this.config.with?.map((ct) =>
      this.world.getComponentStorage(ct),
    );
    const withoutStorages = this.config.without?.map((ct) =>
      this.world.getComponentStorage(ct),
    );
    const oneOfStorages = this.config.oneOf?.map((ct) =>
      this.world.getComponentStorage(ct),
    );

    const result: [EntityId, ...TData][] = [];
    const entitiesToCheck = this.getOptimalEntitySet();
    const componentTypes = this.config.with ?? [];
    const componentCount = componentTypes.length;

    entityLoop: for (const entity of entitiesToCheck) {
      if (withStorages) {
        for (const storage of withStorages) {
          if (!storage?.hasComponent(entity)) {
            continue entityLoop;
          }
        }
      }

      if (withoutStorages) {
        for (const storage of withoutStorages) {
          if (storage?.hasComponent(entity)) {
            continue entityLoop;
          }
        }
      }

      if (oneOfStorages) {
        let hasOneOf = false;
        for (const storage of oneOfStorages) {
          if (storage?.hasComponent(entity)) {
            hasOneOf = true;
            break;
          }
        }
        if (!hasOneOf) {
          continue entityLoop;
        }
      }

      const tuple: unknown[] = new Array(componentCount + 1);
      tuple[0] = entity;

      for (let j = 0; j < componentCount; j++) {
        const componentType = componentTypes[j];
        if (componentType === undefined) continue;
        tuple[j + 1] = this.world.getComponent(entity, componentType);
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
    return Array.from(this).length;
  }

  first(): [EntityId, ...TData] | null {
    for (const result of this) {
      return result;
    }
    return null;
  }
}
