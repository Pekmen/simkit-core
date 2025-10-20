import { getIndex, type EntityId } from "../index.js";
import type { ComponentStorageSnapshot } from "./serialization/types.js";

export class ComponentStorage<T> {
  private sparse: (number | undefined)[] = [];
  private dense: T[] = [];
  private entities: EntityId[] = [];

  addComponent(entityId: EntityId, component: T): void {
    const entityIndex = getIndex(entityId);
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
    const entityIndex = getIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    if (denseIndex === undefined || this.entities[denseIndex] !== entityId) {
      return false;
    }

    const lastDenseIndex = this.dense.length - 1;

    if (denseIndex !== lastDenseIndex) {
      const lastComponent = this.dense[lastDenseIndex];
      const lastEntity = this.entities[lastDenseIndex];

      if (lastComponent !== undefined && lastEntity !== undefined) {
        this.dense[denseIndex] = lastComponent;
        this.entities[denseIndex] = lastEntity;
        this.sparse[getIndex(lastEntity)] = denseIndex;
      }
    }

    this.dense.pop();
    this.entities.pop();
    this.sparse[entityIndex] = undefined;

    return true;
  }

  getComponent(entityId: EntityId): T | undefined {
    const entityIndex = getIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    if (denseIndex === undefined || this.entities[denseIndex] !== entityId) {
      return undefined;
    }

    return this.dense[denseIndex];
  }

  hasComponent(entityId: EntityId): boolean {
    const entityIndex = getIndex(entityId);
    const denseIndex = this.sparse[entityIndex];
    return denseIndex !== undefined && this.entities[denseIndex] === entityId;
  }

  getAllComponents(): readonly T[] {
    return this.dense;
  }

  getAllEntities(): readonly EntityId[] {
    return this.entities;
  }

  size(): number {
    return this.dense.length;
  }

  toJSON(): ComponentStorageSnapshot<T> {
    return {
      sparse: this.sparse.map((value) => value ?? null),
      dense: [...this.dense],
      entities: [...this.entities],
    };
  }

  static fromJSON<T>(
    snapshot: ComponentStorageSnapshot<T>,
  ): ComponentStorage<T> {
    const storage = new ComponentStorage<T>();
    storage.sparse = snapshot.sparse.map((value) => value ?? undefined);
    storage.dense = [...snapshot.dense];
    storage.entities = [...snapshot.entities];
    return storage;
  }
}
