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
  private cachedResult: EntityId[] | null = null;
  private isDirty = true;
  private trackedComponentTypes: Set<string>;
  private optimalComponentType: string | null = null;

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

    if (this.cachedResult === null) {
      this.cachedResult = [];
    } else {
      this.cachedResult.length = 0;
    }

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

      this.cachedResult.push(entity);
    }

    this.isDirty = false;

    return this.cachedResult;
  }

  private getOptimalEntitySet(): Iterable<EntityId> {
    if (!this.config.with || this.config.with.length === 0) {
      return this.world.getAllEntities();
    }

    if (this.optimalComponentType) {
      const componentType = this.config.with.find(
        (c) => c.name === this.optimalComponentType,
      );
      if (componentType) {
        const entities = this.world.getEntitiesWithComponent(componentType);
        if (entities) {
          return entities;
        }
      }
    }

    let smallestSet: readonly EntityId[] | undefined;
    let smallestSize = Infinity;
    let smallestType: string | null = null;

    for (const componentType of this.config.with) {
      const entities = this.world.getEntitiesWithComponent(componentType);
      if (!entities) {
        return [];
      }

      if (entities.length < smallestSize) {
        smallestSize = entities.length;
        smallestSet = entities;
        smallestType = componentType.name;
      }
    }

    this.optimalComponentType = smallestType;
    return smallestSet ?? this.world.getAllEntities();
  }
}
