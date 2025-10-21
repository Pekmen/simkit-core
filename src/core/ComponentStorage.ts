import { getIndex, type EntityId } from "../index.js";
import type { ComponentStorageSnapshot } from "./Serialization.js";
import { assert } from "./assert.js";

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

  serialize(): ComponentStorageSnapshot {
    return {
      entities: [...this.entities],
      data: [...this.dense],
    };
  }

  deserialize(snapshot: ComponentStorageSnapshot): void {
    assert(
      Array.isArray(snapshot.entities),
      "snapshot.entities must be an array",
    );
    assert(Array.isArray(snapshot.data), "snapshot.data must be an array");
    assert(
      snapshot.entities.length === snapshot.data.length,
      `snapshot.entities and snapshot.data must have same length: entities=${String(snapshot.entities.length)}, data=${String(snapshot.data.length)}`,
    );

    this.sparse = [];
    this.dense = [];
    this.entities = [];

    for (let i = 0; i < snapshot.entities.length; i++) {
      const entityId = snapshot.entities[i];
      const component = snapshot.data[i];

      if (entityId !== undefined && component !== undefined) {
        const entityIndex = getIndex(entityId);
        assert(
          entityIndex >= 0,
          `Entity index must be non-negative: ${String(entityIndex)}`,
        );
        this.sparse[entityIndex] = i;
        this.dense.push(component as T);
        this.entities.push(entityId);
      }
    }

    assert(
      this.dense.length === this.entities.length,
      "Dense and entities arrays must have same length after deserialization",
    );
  }
}
