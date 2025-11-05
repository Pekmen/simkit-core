import type { ComponentStorage } from "./ComponentStorage.js";
import type { EntityId } from "./EntityId.js";
import type { QueryConfig } from "./QueryConfig.js";
import type { World } from "./World.js";

export class QueryMatcher {
  constructor(
    private world: World,
    private config: QueryConfig,
  ) {}

  getStorages(): {
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

  entityMatches(
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

  getOptimalEntitySet(): Iterable<EntityId> {
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
