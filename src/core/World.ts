import { ComponentRegistry } from "./ComponentRegistry";
import { EntityManager, type EntityId } from "./Entity";
import type { ComponentType } from "./Component";

export class World {
  private entityManager = new EntityManager();
  private componentRegistry = new ComponentRegistry();

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): void {
    for (const storage of this.componentRegistry.values()) {
      storage.removeComponent(entityId);
    }
    this.entityManager.destroyEntity(entityId);
  }

  addComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
    data?: Partial<T>,
  ): void {
    const storage = this.componentRegistry.getOrCreate(componentType);
    const component = componentType.create(data);
    storage.addComponent(entityId, component);
  }

  removeComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    const storage = this.componentRegistry.get(componentType);
    return storage ? storage.removeComponent(entityId) : false;
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
}
