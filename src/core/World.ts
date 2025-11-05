import {
  ComponentRegistry,
  ComponentStorage,
  EntityManager,
  Query,
  System,
  type ComponentStorageSnapshot,
  type ComponentType,
  type EntityId,
  type QueryConfig,
  type WorldSnapshot,
} from "../index.js";
import type { ComponentDataTuple } from "./Query.js";

export class World {
  private entityManager = new EntityManager();
  private componentRegistry = new ComponentRegistry();
  private systems: System[] = [];
  private entityComponents = new Map<EntityId, Set<string>>();
  private componentTypes = new Map<string, ComponentType<unknown>>();

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
    if (!this.entityManager.isEntityValid(entityId)) {
      return false;
    }

    if (!this.componentTypes.has(componentType.name)) {
      this.componentTypes.set(componentType.name, componentType);
    }

    const storage = this.componentRegistry.getOrCreate(componentType);
    storage.addComponent(entityId, componentType.create(data));

    let components = this.entityComponents.get(entityId);
    if (!components) {
      components = new Set();
      this.entityComponents.set(entityId, components);
    }
    components.add(componentType.name);

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
      const components = this.entityComponents.get(entityId);
      if (components) {
        components.delete(componentType.name);
        if (components.size === 0) {
          this.entityComponents.delete(entityId);
        }
      }
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

  addSystem(systemOrClass: System | (new () => System)): void {
    const system =
      typeof systemOrClass === "function" ? new systemOrClass() : systemOrClass;

    system.setWorld(this);

    this.systems.push(system);
    if (system.init) {
      system.init();
    }
  }

  removeSystem(system: System): boolean {
    const index = this.systems.indexOf(system);
    if (index === -1) return false;

    if (system.cleanup) {
      system.cleanup();
    }

    this.systems.splice(index, 1);
    return true;
  }

  getSystems(): readonly System[] {
    return this.systems;
  }

  clearSystems(): void {
    for (const system of this.systems) {
      if (system.cleanup) {
        system.cleanup();
      }
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
  ): Query<ComponentDataTuple<T>> {
    const config: QueryConfig = {
      with: [...components] as ComponentType<unknown>[],
    };

    return new Query(this, config);
  }

  save(): WorldSnapshot {
    const components: Record<string, ComponentStorageSnapshot> = {};

    for (const [name, storage] of this.componentRegistry.entries()) {
      components[name] = storage.serialize();
    }

    return {
      entities: this.entityManager.serialize(),
      components,
    };
  }

  load(
    snapshot: Readonly<WorldSnapshot>,
    componentTypes: readonly ComponentType<unknown>[],
  ): void {
    this.destroy();

    for (const componentType of componentTypes) {
      this.componentTypes.set(componentType.name, componentType);
    }

    this.entityManager.deserialize(snapshot.entities);

    for (const [componentName, componentSnapshot] of Object.entries(
      snapshot.components,
    )) {
      const componentType = this.componentTypes.get(componentName);

      if (!componentType) {
        throw new Error(
          `Component type '${componentName}' not found. Did you forget to register it?`,
        );
      }

      const storage = this.componentRegistry.getOrCreate(componentType);
      storage.deserialize(componentSnapshot);

      for (const entityId of componentSnapshot.entities) {
        let components = this.entityComponents.get(entityId);
        if (!components) {
          components = new Set();
          this.entityComponents.set(entityId, components);
        }
        components.add(componentName);
      }
    }
  }

  destroy(): void {
    this.clearSystems();
    this.entityComponents.clear();
    this.componentRegistry = new ComponentRegistry();
    this.entityManager = new EntityManager();
  }
}
