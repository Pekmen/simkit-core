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

  constructor(world: World, config: QueryConfig) {
    validateQueryConfig(config);

    this.world = world;
    this.config = config;
  }

  markDirty(): void {
    this.isDirty = true;
  }

  execute(): QueryResult {
    if (!this.isDirty && this.cachedResult !== null) {
      return this.cachedResult;
    }

    const allEntities = this.world.getAllEntities();
    const matchingEntities: EntityId[] = [];

    entityLoop: for (const entity of allEntities) {
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
}
