import {
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

  createEntity(): EntityId {
    return this.entityManager.createEntity();
  }

  destroyEntity(entityId: EntityId): void {
    for (const storage of this.componentRegistry.values()) {
      storage.removeComponent(entityId);
    }
    this.entityManager.destroyEntity(entityId);
  }

  getAllEntities(): EntityId[] {
    return this.entityManager.getAllActiveEntities();
  }

  getEntityCount(): number {
    return this.entityManager.getAllActiveEntities().length;
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
    const component = componentType.create(data);
    storage.addComponent(entityId, component);
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
    return storage ? storage.removeComponent(entityId) : false;
  }

  getComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): T | undefined {
    if (!this.entityManager.isEntityValid(entityId)) {
      return undefined;
    }

    return this.componentRegistry.get(componentType)?.getComponent(entityId);
  }

  hasComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
  ): boolean {
    if (!this.entityManager.isEntityValid(entityId)) {
      return false;
    }

    return (
      this.componentRegistry.get(componentType)?.hasComponent(entityId) ?? false
    );
  }

  updateComponent<T>(
    entityId: EntityId,
    componentType: ComponentType<T>,
    updater: (component: T) => Partial<T>,
  ): boolean {
    const component = this.getComponent(entityId, componentType);
    if (!component) return false;

    const updates = updater(component);
    const newComponent = { ...component, ...updates };
    this.addComponent(entityId, componentType, newComponent);
    return true;
  }

  addSystem(system: System): void {
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

  getSystems(): System[] {
    return [...this.systems];
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
    return new Query(this, config);
  }

  destroy(): void {
    this.clearSystems();
    this.componentRegistry = new ComponentRegistry();
    this.entityManager = new EntityManager();
  }
}
