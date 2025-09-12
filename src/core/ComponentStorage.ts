import type { EntityId } from "./Entity.js";

export class ComponentStorage<T> {
  private components = new Map<EntityId, T>();

  addComponent(entityId: EntityId, component: T): void {
    this.components.set(entityId, component);
  }

  removeComponent(entityId: EntityId): boolean {
    return this.components.delete(entityId);
  }

  getComponent(entityId: EntityId): T | undefined {
    return this.components.get(entityId);
  }

  hasComponent(entityId: EntityId): boolean {
    return this.components.has(entityId);
  }

  getAllComponents(): T[] {
    return Array.from(this.components.values());
  }
  getAllEntities(): EntityId[] {
    return Array.from(this.components.keys());
  }

  size(): number {
    return this.components.size;
  }

  clear(): void {
    this.components.clear();
  }
}
