import {
  ComponentRegistry,
  ComponentStorage,
  EntityManager,
  Query,
  System,
  type ComponentType,
  type EntityId,
  type QueryConfig,
  type WorldSnapshot,
} from "../index.js";
import type { ComponentDataTuple } from "./Query.js";
import { assert } from "./assert.js";

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

  addSystem(systemOrClass: System | (new (world: World) => System)): void {
    const system =
      typeof systemOrClass === "function"
        ? new systemOrClass(this)
        : systemOrClass;

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
  ): Query<ComponentDataTuple<T>> {
    const config: QueryConfig = {
      with: [...components] as ComponentType<unknown>[],
    };

    return new Query(this, config);
  }

  save(): WorldSnapshot {
    const components: WorldSnapshot["components"] = {};

    for (const [name, storage] of this.componentRegistry.entries()) {
      components[name] = storage.serialize();
    }

    return {
      entities: this.entityManager.serialize(),
      components,
    };
  }

  load(
    snapshot: WorldSnapshot,
    componentTypes: ComponentType<unknown>[],
  ): void {
    assert(Array.isArray(componentTypes), "componentTypes must be an array");

    this.destroy();

    for (const componentType of componentTypes) {
      assert(
        typeof componentType.name === "string" && componentType.name.length > 0,
        "Each componentType must have a valid name property",
      );
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
