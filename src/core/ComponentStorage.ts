import { assert, EntityId, getIndex, MAX_ENTITY_INDEX } from "../index.js";

export class ComponentStorage<T> {
  private sparse: (number | undefined)[] = [];
  private dense: T[] = [];
  private entities: EntityId[] = [];

  addComponent(entityId: EntityId, component: T): void {
    const entityIndex = getIndex(entityId);

    assert(
      entityIndex >= 0 && entityIndex <= MAX_ENTITY_INDEX,
      `Entity index ${String(entityIndex)} out of valid range [0, ${String(MAX_ENTITY_INDEX)}]`,
    );

    const existingDenseIndex = this.sparse[entityIndex];

    if (
      existingDenseIndex !== undefined &&
      this.entities[existingDenseIndex] === entityId
    ) {
      this.dense[existingDenseIndex] = component;
      return;
    }

    const denseIndex = this.dense.length;

    assert(
      this.dense.length === this.entities.length,
      `Internal error: dense and entities arrays out of sync (${String(this.dense.length)} vs ${String(this.entities.length)})`,
    );

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

    assert(
      this.dense.length === this.entities.length,
      `Internal error: dense and entities arrays out of sync (${String(this.dense.length)} vs ${String(this.entities.length)})`,
    );

    const lastDenseIndex = this.dense.length - 1;

    assert(
      denseIndex <= lastDenseIndex,
      `Internal error: denseIndex ${String(denseIndex)} > lastDenseIndex ${String(lastDenseIndex)}`,
    );

    if (denseIndex !== lastDenseIndex) {
      const lastComponent = this.dense[lastDenseIndex];
      const lastEntity = this.entities[lastDenseIndex];

      assert(
        lastComponent !== undefined && lastEntity !== undefined,
        `Internal error: last component or entity is undefined at index ${String(lastDenseIndex)}`,
      );

      this.dense[denseIndex] = lastComponent;
      this.entities[denseIndex] = lastEntity;
      this.sparse[getIndex(lastEntity)] = denseIndex;
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

    assert(
      denseIndex < this.dense.length,
      `Internal error: denseIndex ${String(denseIndex)} >= dense.length ${String(this.dense.length)}`,
    );

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

  clear(): void {
    this.sparse = [];
    this.dense = [];
    this.entities = [];
  }
}
