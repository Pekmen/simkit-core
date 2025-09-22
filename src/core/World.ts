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
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  createQuery(config: QueryConfig): Query {
    return new Query(this, config);
  }
}
