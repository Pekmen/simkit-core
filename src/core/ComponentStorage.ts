import { EntityId } from "../index.js";

const INDEX_BITS = 24;
const INDEX_MASK = (1 << INDEX_BITS) - 1;

function getEntityIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

export class ComponentStorage<T> {
  private sparse: (number | undefined)[] = [];

  private dense: T[] = [];
  private entities: EntityId[] = [];

  addComponent(entityId: EntityId, component: T): void {
    const entityIndex = getEntityIndex(entityId);
    const existingDenseIndex = this.sparse[entityIndex];

    if (
      existingDenseIndex !== undefined &&
      this.entities[existingDenseIndex] === entityId
    ) {
      this.dense[existingDenseIndex] = component;
      return;
    }

    const denseIndex = this.dense.length;
    this.sparse[entityIndex] = denseIndex;
    this.dense.push(component);
    this.entities.push(entityId);
  }

  removeComponent(entityId: EntityId): boolean {
    const entityIndex = getEntityIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    if (denseIndex === undefined || this.entities[denseIndex] !== entityId) {
      return false;
    }

    const lastIndex = this.dense.length - 1;

    if (denseIndex < lastIndex) {
      const lastEntityId = this.entities[lastIndex];
      const lastComponent = this.dense[lastIndex];

      if (lastEntityId === undefined || lastComponent === undefined) {
        return false;
      }

      this.dense[denseIndex] = lastComponent;
      this.entities[denseIndex] = lastEntityId;

      const lastEntityIndex = getEntityIndex(lastEntityId);
      this.sparse[lastEntityIndex] = denseIndex;
    }

    this.dense.pop();
    this.entities.pop();

    this.sparse[entityIndex] = undefined;

    return true;
  }

  getComponent(entityId: EntityId): T | undefined {
    const entityIndex = getEntityIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    if (denseIndex === undefined || this.entities[denseIndex] !== entityId) {
      return undefined;
    }

    return this.dense[denseIndex];
  }

  hasComponent(entityId: EntityId): boolean {
    const entityIndex = getEntityIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    return denseIndex !== undefined && this.entities[denseIndex] === entityId;
  }

  getAllComponents(): T[] {
    return this.dense.slice();
  }

  getAllEntities(): EntityId[] {
    return this.entities.slice();
  }

  size(): number {
    return this.dense.length;
  }

  clear(): void {
    this.sparse = [];
    this.dense = [];
    this.entities = [];
  }
}
