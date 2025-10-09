import { EntityId } from "../index.js";
import { INDEX_MASK } from "./constants.js";

function getEntityIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

export class ComponentStorage<T> {
  private sparse: (number | undefined)[] = [];
  private dense: T[] = [];
  private entities: EntityId[] = [];

  private bitset: number[] = [];

  private setBit(index: number): void {
    const arrayIndex = index >>> 5;
    const bitIndex = index & 31;

    while (this.bitset.length <= arrayIndex) {
      this.bitset.push(0);
    }

    const word = this.bitset[arrayIndex];
    if (word !== undefined) {
      this.bitset[arrayIndex] = word | (1 << bitIndex);
    }
  }

  private clearBit(index: number): void {
    const arrayIndex = index >>> 5;
    const bitIndex = index & 31;

    if (arrayIndex < this.bitset.length) {
      const word = this.bitset[arrayIndex];
      if (word !== undefined) {
        this.bitset[arrayIndex] = word & ~(1 << bitIndex);
      }
    }
  }

  private hasBit(index: number): boolean {
    const arrayIndex = index >>> 5;
    const bitIndex = index & 31;

    if (arrayIndex >= this.bitset.length) {
      return false;
    }

    const word = this.bitset[arrayIndex];
    if (word === undefined) {
      return false;
    }

    return (word & (1 << bitIndex)) !== 0;
  }

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
    this.setBit(entityIndex);
  }

  removeComponent(entityId: EntityId): boolean {
    const entityIndex = getEntityIndex(entityId);
    const denseIndex = this.sparse[entityIndex];

    if (denseIndex === undefined || this.entities[denseIndex] !== entityId) {
      return false;
    }

    const lastIndex = this.dense.length - 1;

    if (denseIndex < lastIndex) {
      const lastComponent = this.dense[lastIndex];
      const lastEntityId = this.entities[lastIndex];

      if (lastComponent === undefined || lastEntityId === undefined) {
        throw new Error("ComponentStorage internal error: arrays out of sync");
      }

      this.dense[denseIndex] = lastComponent;
      this.entities[denseIndex] = lastEntityId;

      const lastEntityIndex = getEntityIndex(lastEntityId);
      this.sparse[lastEntityIndex] = denseIndex;
    }

    this.dense.pop();
    this.entities.pop();
    this.sparse[entityIndex] = undefined;
    this.clearBit(entityIndex);

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
    if (!this.hasBit(entityIndex)) {
      return false;
    }

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
    this.bitset = [];
  }
}
