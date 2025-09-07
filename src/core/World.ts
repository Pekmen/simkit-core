import { ComponentTypeSymbol, type ComponentType } from "./Component";
import { ComponentStorage } from "./ComponentStorage";
import { EntityManager, type EntityId } from "./Entity";

export class World {
  private entityManager = new EntityManager();
  private componentStorages = new Map<symbol, ComponentStorage<unknown>>();

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): void {
    for (const storage of this.componentStorages.values()) {
      storage.removeComponent(entityId);
    }
    this.entityManager.destroyEntity(entityId);
  }

  addComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
    data?: Partial<T>,
  ): void {
    const storage = this.getOrCreateStorage(componentType);
    const component = componentType.create(data);

    storage.addComponent(entityId, component);
  }

  removeComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    const storage = this.getStorage(componentType);
    return storage ? storage.removeComponent(entityId) : false;
  }

  getComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): T | undefined {
    const storage = this.getStorage(componentType);
    return storage?.getComponent(entityId);
  }

  hasComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    const storage = this.getStorage(componentType);
    return storage ? storage.hasComponent(entityId) : false;
  }

  private getStorage<T>(
    componentType: ComponentType<T>,
  ): ComponentStorage<T> | undefined {
    const symbol = componentType[ComponentTypeSymbol];
    return this.componentStorages.get(symbol);
  }

  private getOrCreateStorage<T>(
    componentType: ComponentType<T>,
  ): ComponentStorage<T> {
    const symbol = componentType[ComponentTypeSymbol];
    let storage = this.componentStorages.get(symbol);

    if (!storage) {
      storage = new ComponentStorage<T>();
      this.componentStorages.set(symbol, storage);
    }

    return storage;
  }
}
