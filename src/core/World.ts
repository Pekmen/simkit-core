import {
  ComponentRegistry,
  ComponentStorage,
  EntityManager,
  Query,
  System,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";
import type { ComponentDataTuple } from "./Query.js";
import { assert } from "./assert.js";
import { MapSet } from "./MapSet.js";
import { QueryRegistry } from "./QueryRegistry.js";

export class World {
  private entityManager = new EntityManager();
  private componentRegistry = new ComponentRegistry();
  private systems: System[] = [];
  private entityComponents = new MapSet<EntityId, ComponentType<unknown>>();
  private queryRegistry = new QueryRegistry();

  registerQuery(query: Query): void {
    const trackedComponents = query.getTrackedComponents();
    this.queryRegistry.register(query, trackedComponents);
  }

  unregisterQuery(query: Query): void {
    const trackedComponents = query.getTrackedComponents();
    this.queryRegistry.unregister(query, trackedComponents);
  }

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): boolean {
    const componentTypes = this.entityComponents.get(entityId);

    if (componentTypes) {
      for (const componentType of componentTypes) {
        const storage = this.componentRegistry.get(componentType);
        storage?.removeComponent(entityId);
        this.queryRegistry.invalidateForComponent(componentType);
      }

      this.entityComponents.removeAll(entityId);
    }

    return this.entityManager.destroyEntity(entityId);
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
    if (!this.entityManager.isEntityValid(entityId)) {
      return false;
    }

    const storage = this.componentRegistry.getOrCreate(componentType);
    storage.addComponent(entityId, componentType.create(data));

    this.entityComponents.add(entityId, componentType);

    this.queryRegistry.invalidateForComponent(componentType);

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
      this.entityComponents.remove(entityId, componentType);
      this.queryRegistry.invalidateForComponent(componentType);
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

  getComponentStorage<T>(
    componentType: ComponentType<T>,
  ): ComponentStorage<T> | undefined {
    return this.componentRegistry.get(componentType);
  }

  addSystem<T extends System>(systemClass: new (world: World) => T): T {
    const system = new systemClass(this);

    assert(
      typeof system.init === "function",
      "System must have an init method",
    );
    assert(
      typeof system.update === "function",
      "System must have an update method",
    );
    assert(
      typeof system.cleanup === "function",
      "System must have a cleanup method",
    );

    this.systems.push(system);
    system.init();
    return system;
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

  query<const T extends readonly ComponentType<unknown>[]>(
    ...components: T
  ): Query<T extends readonly [] ? unknown[] : ComponentDataTuple<T>> {
    let config: QueryConfig = {};

    if (components.length > 0) {
      config = {
        with: [...components] as ComponentType<unknown>[],
      };
    }

    const query = new Query<
      T extends readonly [] ? unknown[] : ComponentDataTuple<T>
    >(this, config);

    if (
      (config.with?.length ?? 0) > 0 ||
      (config.without?.length ?? 0) > 0 ||
      (config.oneOf?.length ?? 0) > 0
    ) {
      this.registerQuery(query);
    }

    return query;
  }

  destroy(): void {
    this.clearSystems();
    this.entityComponents.clear();
    this.componentRegistry = new ComponentRegistry();
    this.entityManager = new EntityManager();
  }
}
