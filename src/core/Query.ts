import {
  ComponentStorage,
  validateQueryConfig,
  World,
  type ComponentType,
  type EntityId,
  type QueryConfig,
  type QueryResult,
} from "../index.js";

/**
 * Extract the component data type from ComponentType<T>
 *
 * @example
 * type Position = { x: number; y: number };
 * const PositionComponent: ComponentType<Position> = ...;
 * type Data = ExtractComponentData<typeof PositionComponent>; // Position
 */
export type ExtractComponentData<C> =
  C extends ComponentType<infer T> ? T : never;

/**
 * Map an array of ComponentType to a tuple of their data types
 *
 * @example
 * type Tuple = ComponentDataTuple<[ComponentType<Position>, ComponentType<Velocity>]>;
 * // Result: [Position, Velocity]
 */
export type ComponentDataTuple<T extends readonly ComponentType<unknown>[]> = {
  [K in keyof T]: T[K] extends ComponentType<infer U> ? U : never;
};

export class Query<TData extends readonly unknown[] = readonly unknown[]> {
  private world: World;
  private config: QueryConfig;
  private cachedResult: EntityId[] | null = null;
  private cachedTuples: [EntityId, ...TData][] | null = null;
  private isDirty = true;
  private trackedComponentTypes: Set<string>;
  private withStorages: (ComponentStorage<unknown> | undefined)[] | null = null;
  private withoutStorages: (ComponentStorage<unknown> | undefined)[] | null =
    null;
  private oneOfStorages: (ComponentStorage<unknown> | undefined)[] | null =
    null;

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
    this.isDirty = true;
    this.cachedTuples = null;
  }

  tracksComponent(componentName: string): boolean {
    return this.trackedComponentTypes.has(componentName);
  }

  private execute(): QueryResult {
    if (!this.isDirty && this.cachedResult !== null) {
      return this.cachedResult;
    }

    if (this.isDirty) {
      if (this.config.with) {
        this.withStorages = this.config.with.map((ct) =>
          this.world.getComponentStorage(ct),
        );
      }
      if (this.config.without) {
        this.withoutStorages = this.config.without.map((ct) =>
          this.world.getComponentStorage(ct),
        );
      }
      if (this.config.oneOf) {
        this.oneOfStorages = this.config.oneOf.map((ct) =>
          this.world.getComponentStorage(ct),
        );
      }
    }

    if (this.cachedResult === null) {
      this.cachedResult = [];
    } else {
      this.cachedResult.length = 0;
    }

    const entitiesToCheck = this.getOptimalEntitySet();

    entityLoop: for (const entity of entitiesToCheck) {
      if (this.withStorages) {
        for (const storage of this.withStorages) {
          if (!storage?.hasComponent(entity)) {
            continue entityLoop;
          }
        }
      }

      if (this.withoutStorages) {
        for (const storage of this.withoutStorages) {
          if (storage?.hasComponent(entity)) {
            continue entityLoop;
          }
        }
      }

      if (this.oneOfStorages) {
        let hasOneOf = false;
        for (const storage of this.oneOfStorages) {
          if (storage?.hasComponent(entity)) {
            hasOneOf = true;
            break;
          }
        }
        if (!hasOneOf) {
          continue entityLoop;
        }
      }

      this.cachedResult.push(entity);
    }

    this.isDirty = false;

    return this.cachedResult;
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

    const entities = this.execute();
    const componentTypes = this.config.with ?? [];
    const componentCount = componentTypes.length;

    this.cachedTuples = new Array(entities.length);

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity === undefined) continue;

      const tuple: unknown[] = new Array(componentCount + 1);
      tuple[0] = entity;

      for (let j = 0; j < componentCount; j++) {
        const componentType = componentTypes[j];
        if (componentType === undefined) continue;
        tuple[j + 1] = this.world.getComponent(entity, componentType);
      }

      const result = tuple as [EntityId, ...TData];
      this.cachedTuples[i] = result;
      yield result;
    }
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
    return this.execute().length === 0;
  }

  count(): number {
    return this.execute().length;
  }

  forEach(callback: (entity: EntityId, ...data: TData) => void): void {
    for (const [entity, ...data] of this) {
      callback(entity, ...(data as TData));
    }
  }

  toArray(): [EntityId, ...TData][] {
    return Array.from(this);
  }

  first(): [EntityId, ...TData] | null {
    for (const result of this) {
      return result;
    }
    return null;
  }
}
