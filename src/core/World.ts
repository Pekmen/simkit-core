import {
  ComponentStorage,
  EntityManager,
  Query,
  System,
  type ComponentType,
  type EntityId,
  type QueryConfig,
} from "../index.js";
import type { ComponentDataTuple } from "./Query.js";
import { QueryRegistry } from "./QueryRegistry.js";
import { ComponentManager } from "./ComponentManager.js";
import { SystemManager } from "./SystemManager.js";

export class World {
  private entityManager = new EntityManager();
  private componentManager = new ComponentManager();
  private systemManager = new SystemManager();
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
    const componentTypes = this.componentManager.removeAllComponents(entityId);

    if (componentTypes) {
      for (const componentType of componentTypes) {
        this.queryRegistry.invalidateForComponent(componentType);
      }
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

    this.componentManager.addComponent(
      entityId,
      componentType,
      componentType.create(data),
    );

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

    const removed = this.componentManager.removeComponent(
      entityId,
      componentType,
    );

    if (removed) {
      this.queryRegistry.invalidateForComponent(componentType);
    }

    return removed;
  }

  getComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): T | undefined {
    return this.componentManager.getComponent(entityId, componentType);
  }

  hasComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    return this.componentManager.hasComponent(entityId, componentType);
  }

  getEntitiesWithComponent<T>(
    componentType: ComponentType<T>,
  ): readonly EntityId[] | undefined {
    return this.componentManager.getEntitiesWithComponent(componentType);
  }

  getComponentStorage<T>(
    componentType: ComponentType<T>,
  ): ComponentStorage<T> | undefined {
    return this.componentManager.getComponentStorage(componentType);
  }

  addSystem<T extends System>(systemClass: new (world: World) => T): T {
    return this.systemManager.addSystem(this, systemClass);
  }

  removeSystem(system: System): boolean {
    return this.systemManager.removeSystem(system);
  }

  getSystems(): readonly System[] {
    return this.systemManager.getSystems();
  }

  clearSystems(): void {
    this.systemManager.clearSystems();
  }

  update(deltaTime: number): void {
    this.systemManager.update(deltaTime);
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
    this.systemManager.clearSystems();
    this.componentManager.clear();
    this.entityManager = new EntityManager();
  }
}
