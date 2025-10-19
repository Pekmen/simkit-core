import {
  assert,
  ComponentRegistry,
  ComponentType,
  EntityId,
  EntityManager,
  Query,
  QueryConfig,
  System,
} from "../index.js";

export class World {
  private entityManager = new EntityManager();
  private componentRegistry = new ComponentRegistry();
  private systems: System[] = [];
  private queries: Query[] = [];
  private queryIndex = new Map<string, Set<Query>>();

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): void {
    const modifiedComponents = new Set<string>();

    for (const [componentName, storage] of this.componentRegistry.entries()) {
      if (storage.hasComponent(entityId)) {
        storage.removeComponent(entityId);
        modifiedComponents.add(componentName);
      }
    }

    this.entityManager.destroyEntity(entityId);

    for (const query of this.queries) {
      for (const componentName of modifiedComponents) {
        if (query.tracksComponent(componentName)) {
          query.markDirty();
          break;
        }
      }
    }
  }

  getAllEntities(): readonly EntityId[] {
    return this.entityManager.getAllActiveEntities();
  }

  getEntityCount(): number {
    return this.entityManager.getEntityCount();
  }

  addComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
    data?: Partial<T>,
  ): boolean {
    assert(componentType.name !== "", "ComponentType must have a valid name");

    if (!this.entityManager.isEntityValid(entityId)) {
      return false;
    }

    const storage = this.componentRegistry.getOrCreate(componentType);
    storage.addComponent(entityId, componentType.create(data));

    this.invalidateQueriesForComponent(componentType);
    return true;
  }

  removeComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    if (!this.entityManager.isEntityValid(entityId)) {
      return false;
    }

    const storage = this.componentRegistry.get(componentType);
    const removed = storage ? storage.removeComponent(entityId) : false;

    if (removed) {
      this.invalidateQueriesForComponent(componentType);
    }

    return removed;
  }

  getComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): T | undefined {
    return this.componentRegistry.get(componentType)?.getComponent(entityId);
  }

  hasComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    return (
      this.componentRegistry.get(componentType)?.hasComponent(entityId) ?? false
    );
  }

  getEntitiesWithComponent<T>(
    componentType: ComponentType<T>,
  ): readonly EntityId[] | undefined {
    return this.componentRegistry.get(componentType)?.getAllEntities();
  }

  addSystem(system: System): void {
    assert(
      !this.systems.includes(system),
      "System is already added to this world",
    );
    this.systems.push(system);
    system.init();
  }

  removeSystem(system: System): boolean {
    const index = this.systems.indexOf(system);
    if (index === -1) return false;

    system.cleanup();

    this.systems.splice(index, 1);
    return true;
  }

  getSystems(): readonly System[] {
    return this.systems;
  }

  clearSystems(): void {
    for (const system of this.systems) {
      system.cleanup();
    }
    this.systems = [];
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  createQuery(config: QueryConfig): Query {
    const query = new Query(this, config);

    assert(
      !this.queries.includes(query),
      "Query is already registered in this world",
    );

    this.queries.push(query);

    const trackedTypes: string[] = [];
    if (config.with) {
      trackedTypes.push(...config.with.map((c) => c.name));
    }
    if (config.without) {
      trackedTypes.push(...config.without.map((c) => c.name));
    }
    if (config.oneOf) {
      trackedTypes.push(...config.oneOf.map((c) => c.name));
    }

    for (const componentType of trackedTypes) {
      let querySet = this.queryIndex.get(componentType);
      if (!querySet) {
        querySet = new Set();
        this.queryIndex.set(componentType, querySet);
      }
      querySet.add(query);
    }

    return query;
  }

  removeQuery(query: Query): boolean {
    const index = this.queries.indexOf(query);
    if (index === -1) return false;

    this.queries.splice(index, 1);

    for (const querySet of this.queryIndex.values()) {
      querySet.delete(query);
    }

    return true;
  }

  private invalidateQueriesForComponent<T>(
    componentType: ComponentType<T>,
  ): void {
    const querySet = this.queryIndex.get(componentType.name);
    if (querySet) {
      for (const query of querySet) {
        query.markDirty();
      }
    }
  }

  destroy(): void {
    this.clearSystems();
    this.queries = [];
    this.queryIndex.clear();
    this.componentRegistry = new ComponentRegistry();
    this.entityManager = new EntityManager();
  }
}
