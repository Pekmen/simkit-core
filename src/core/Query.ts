import {
  EntityId,
  QueryConfig,
  QueryResult,
  validateQueryConfig,
  World,
} from "../index.js";

export class Query {
  private world: World;
  private config: QueryConfig;
  private cachedResult: QueryResult | null = null;
  private isDirty = true;
  private trackedComponentTypes: Set<string>;

  constructor(world: World, config: QueryConfig) {
    validateQueryConfig(config);

    this.world = world;
    this.config = config;

    const tracked: string[] = [];
    if (config.with) {
      tracked.push(...config.with.map((c) => c.name));
    }
    if (config.without) {
      tracked.push(...config.without.map((c) => c.name));
    }
    if (config.oneOf) {
      tracked.push(...config.oneOf.map((c) => c.name));
    }
    this.trackedComponentTypes = new Set(tracked);
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

    const matchingEntities: EntityId[] = [];

    const entitiesToCheck = this.getOptimalEntitySet();

    entityLoop: for (const entity of entitiesToCheck) {
      if (this.config.with) {
        for (const componentType of this.config.with) {
          if (!this.world.hasComponent(entity, componentType)) {
            continue entityLoop;
          }
        }
      }

      if (this.config.without) {
        for (const componentType of this.config.without) {
          if (this.world.hasComponent(entity, componentType)) {
            continue entityLoop;
          }
        }
      }

      if (this.config.oneOf) {
        let hasOneOf = false;
        for (const componentType of this.config.oneOf) {
          if (this.world.hasComponent(entity, componentType)) {
            hasOneOf = true;
            break;
          }
        }
        if (!hasOneOf) {
          continue entityLoop;
        }
      }

      matchingEntities.push(entity);
    }

    this.cachedResult = matchingEntities;
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
}
