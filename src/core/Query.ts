import {
  ComponentStorage,
  validateQueryConfig,
  World,
  type EntityId,
  type QueryConfig,
  type QueryResult,
} from "../index.js";

export class Query {
  private world: World;
  private config: QueryConfig;
  private cachedResult: EntityId[] | null = null;
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
  }

  tracksComponent(componentName: string): boolean {
    return this.trackedComponentTypes.has(componentName);
  }

  execute(): QueryResult {
    if (!this.isDirty && this.cachedResult !== null) {
      return this.cachedResult;
    }

    const profiler = this.world.getProfiler();
    profiler.start("query:execute");

    try {
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
    } finally {
      profiler.end("query:execute");
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
}
