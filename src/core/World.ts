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

  destroyEntities(entityIds: readonly EntityId[]): number {
    const affectedComponents = new Set<ComponentType<unknown>>();
    let destroyedCount = 0;

    this.queryRegistry.startBatch();
    try {
      for (const entityId of entityIds) {
        const componentTypes =
          this.componentManager.removeAllComponents(entityId);

        if (componentTypes) {
          for (const componentType of componentTypes) {
            affectedComponents.add(componentType);
          }
        }

        if (this.entityManager.destroyEntity(entityId)) {
          destroyedCount++;
        }
      }

      for (const componentType of affectedComponents) {
        this.queryRegistry.invalidateForComponent(componentType);
      }
    } finally {
      this.queryRegistry.endBatch();
    }

    return destroyedCount;
  }

  getAllEntities(): readonly EntityId[] {
    return this.entityManager.getAllEntities();
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

  addComponentToEntities<T>(
    entityIds: readonly EntityId[],
    componentType: ComponentType<T>,
    dataFn?: (entityId: EntityId) => Partial<T>,
  ): number {
    let addedCount = 0;

    this.queryRegistry.startBatch();
    try {
      for (const entityId of entityIds) {
        if (!this.entityManager.isEntityValid(entityId)) {
          continue;
        }

        const data = dataFn ? dataFn(entityId) : undefined;
        this.componentManager.addComponent(
          entityId,
          componentType,
          componentType.create(data),
        );
        addedCount++;
      }

      if (addedCount > 0) {
        this.queryRegistry.invalidateForComponent(componentType);
      }
    } finally {
      this.queryRegistry.endBatch();
    }

    return addedCount;
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

  removeComponentFromEntities<T>(
    entityIds: readonly EntityId[],
    componentType: ComponentType<T>,
  ): number {
    let removedCount = 0;

    this.queryRegistry.startBatch();
    try {
      for (const entityId of entityIds) {
        if (!this.entityManager.isEntityValid(entityId)) {
          continue;
        }

        if (this.componentManager.removeComponent(entityId, componentType)) {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.queryRegistry.invalidateForComponent(componentType);
      }
    } finally {
      this.queryRegistry.endBatch();
    }

    return removedCount;
  }

  removeComponents(
    entityId: EntityId,
    componentTypes: readonly ComponentType<unknown>[],
  ): number {
    if (!this.entityManager.isEntityValid(entityId)) {
      return 0;
    }

    let removedCount = 0;
    const removedTypes = new Set<ComponentType<unknown>>();

    this.queryRegistry.startBatch();
    try {
      for (const componentType of componentTypes) {
        if (this.componentManager.removeComponent(entityId, componentType)) {
          removedCount++;
          removedTypes.add(componentType);
        }
      }

      for (const componentType of removedTypes) {
        this.queryRegistry.invalidateForComponent(componentType);
      }
    } finally {
      this.queryRegistry.endBatch();
    }

    return removedCount;
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
    this.queryRegistry = new QueryRegistry();
  }
}
