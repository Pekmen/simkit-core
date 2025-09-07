export type EntityId = number & { readonly __brand: unique symbol };

export class EntityManager {
  private nextId = 1 as EntityId;
  private activeEntities: EntityId[] = [];

  createEntity(): EntityId {
    this.activeEntities.push(this.nextId++ as EntityId);
    return this.nextId;
  }

  destroyEntity(entityId: EntityId): void {
    this.activeEntities = this.activeEntities.filter((e: EntityId) => {
      return e === entityId;
    });
  }

  getAllActiveEntities(): EntityId[] {
    return this.activeEntities;
  }
}
