import {
  assert,
  ComponentRegistry,
  ComponentStorage,
  EntityManager,
  Query,
  System,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";
import { Profiler } from "../profiling/Profiler.js";
import { ComponentSerializerRegistry } from "../serialization/ComponentSerializerRegistry.js";
import type {
  ComponentSerializer,
  EntitySnapshot,
  SerializedComponent,
  WorldSnapshot,
} from "../serialization/Snapshot.js";

export interface WorldConfig {
  enableProfiling?: boolean;
  maxFrameHistory?: number;
}

export class World {
  private entityManager = new EntityManager();
  private componentRegistry = new ComponentRegistry();
  private systems: System[] = [];
  private queries: Query[] = [];
  private queryIndex = new Map<string, Set<Query>>();
  private entityComponents = new Map<EntityId, Set<string>>();
  private profiler = new Profiler();
  private serializerRegistry = new ComponentSerializerRegistry();

  constructor(config?: WorldConfig) {
    if (config?.enableProfiling) {
      this.profiler.enable();
    }
    if (config?.maxFrameHistory !== undefined) {
      this.profiler.setMaxFrameHistory(config.maxFrameHistory);
    }
  }

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): void {
    const componentNames = this.entityComponents.get(entityId);

    if (componentNames) {
      for (const componentName of componentNames) {
        const storage = this.componentRegistry.get({
          name: componentName,
        } as ComponentType<unknown>);
        storage?.removeComponent(entityId);
      }

      for (const query of this.queries) {
        for (const componentName of componentNames) {
          if (query.tracksComponent(componentName)) {
            query.markDirty();
            break;
          }
        }
      }

      this.entityComponents.delete(entityId);
    }

    this.entityManager.destroyEntity(entityId);
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
    this.profiler.start("component:add");
    try {
      assert(componentType.name !== "", "ComponentType must have a valid name");

      if (!this.entityManager.isEntityValid(entityId)) {
        return false;
      }

      const storage = this.componentRegistry.getOrCreate(componentType);
      storage.addComponent(entityId, componentType.create(data));

      let components = this.entityComponents.get(entityId);
      if (!components) {
        components = new Set();
        this.entityComponents.set(entityId, components);
      }
      components.add(componentType.name);

      this.invalidateQueriesForComponent(componentType);
      return true;
    } finally {
      this.profiler.end("component:add");
    }
  }

  removeComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    this.profiler.start("component:remove");
    try {
      if (!this.entityManager.isEntityValid(entityId)) {
        return false;
      }

      const storage = this.componentRegistry.get(componentType);
      const removed = storage ? storage.removeComponent(entityId) : false;

      if (removed) {
        const components = this.entityComponents.get(entityId);
        if (components) {
          components.delete(componentType.name);
          if (components.size === 0) {
            this.entityComponents.delete(entityId);
          }
        }

        this.invalidateQueriesForComponent(componentType);
      }

      return removed;
    } finally {
      this.profiler.end("component:remove");
    }
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

  getComponentStorage<T>(
    componentType: ComponentType<T>,
  ): ComponentStorage<T> | undefined {
    return this.componentRegistry.get(componentType);
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
      const systemName = `system:${system.constructor.name}`;
      this.profiler.start(systemName);
      try {
        system.update(deltaTime);
      } catch (error) {
        this.profiler.end(systemName);
        throw new Error(
          `System "${system.constructor.name}" threw error during update: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      this.profiler.end(systemName);
    }
    this.profiler.endFrame();
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
    this.entityComponents.clear();
    this.componentRegistry = new ComponentRegistry();
    this.entityManager = new EntityManager();
  }

  getProfiler(): Profiler {
    return this.profiler;
  }

  enableProfiling(): void {
    this.profiler.enable();
  }

  disableProfiling(): void {
    this.profiler.disable();
  }

  registerComponentSerializer<T>(
    componentName: string,
    serializer: ComponentSerializer<T>,
  ): void {
    this.serializerRegistry.register(componentName, serializer);
  }

  createSnapshot(): WorldSnapshot {
    const entities: EntitySnapshot[] = [];

    for (const entityId of this.entityManager.getAllActiveEntities()) {
      const componentNames = this.entityComponents.get(entityId);
      if (!componentNames) {
        continue;
      }

      const components = new Map<string, SerializedComponent>();

      for (const componentName of componentNames) {
        const storage = this.componentRegistry.get({
          name: componentName,
        } as ComponentType<unknown>);

        if (!storage) {
          continue;
        }

        const component = storage.getComponent(entityId);
        if (component === undefined) {
          continue;
        }

        const serialized = this.serializerRegistry.serialize(
          componentName,
          component,
        );
        components.set(componentName, serialized);
      }

      entities.push({
        id: entityId,
        components,
      });
    }

    return {
      entities,
      entityManagerState: this.entityManager.createSnapshot(),
    };
  }

  restoreFromSnapshot(snapshot: WorldSnapshot): void {
    this.destroy();

    this.entityManager.restoreFromSnapshot(snapshot.entityManagerState);

    for (const entitySnapshot of snapshot.entities) {
      const entityId = entitySnapshot.id;

      if (!this.entityManager.isEntityValid(entityId)) {
        this.entityManager.createEntity();
      }

      const components = new Set<string>();
      this.entityComponents.set(entityId, components);

      for (const [componentName, serializedData] of entitySnapshot.components) {
        const deserialized = this.serializerRegistry.deserialize(
          componentName,
          serializedData,
        );

        const storage = this.componentRegistry.getOrCreate({
          name: componentName,
          create: () => deserialized,
        } as ComponentType<unknown>);

        storage.addComponent(entityId, deserialized);
        components.add(componentName);
      }
    }

    for (const query of this.queries) {
      query.markDirty();
    }
  }
}
