import { ComponentRegistry } from "./ComponentRegistry.js";
import { MapSet } from "./MapSet.js";
import type { ComponentType } from "./Component.js";
import type { EntityId } from "./EntityId.js";
import type { ComponentStorage } from "./ComponentStorage.js";

export class ComponentManager {
  private componentRegistry = new ComponentRegistry();
  private entityComponents = new MapSet<EntityId, ComponentType<unknown>>();

  addComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
    data: T,
  ): void {
    const storage = this.componentRegistry.getOrCreate(componentType);
    storage.addComponent(entityId, data);
    this.entityComponents.add(entityId, componentType);
  }

  removeComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    const storage = this.componentRegistry.get(componentType);
    const removed = storage ? storage.removeComponent(entityId) : false;

    if (removed) {
      this.entityComponents.remove(entityId, componentType);
    }

    return removed;
  }

  removeAllComponents(
    entityId: EntityId,
  ): ReadonlySet<ComponentType<unknown>> | undefined {
    const componentTypes = this.entityComponents.get(entityId);

    if (componentTypes) {
      const componentTypesCopy = new Set(componentTypes);

      for (const componentType of componentTypesCopy) {
        const storage = this.componentRegistry.get(componentType);
        storage?.removeComponent(entityId);
      }

      this.entityComponents.removeAll(entityId);

      return componentTypesCopy;
    }

    return undefined;
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

  getEntityComponents(
    entityId: EntityId,
  ): ReadonlySet<ComponentType<unknown>> | undefined {
    return this.entityComponents.get(entityId);
  }

  clear(): void {
    this.entityComponents.clear();
    this.componentRegistry = new ComponentRegistry();
  }
}
