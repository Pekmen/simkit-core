export type EntityId = number & { readonly __brand: unique symbol };

export class EntityManager {
  private nextId = 1 as EntityId;
  private activeEntities: EntityId[] = [];

  createEntity(): EntityId {
    const id = this.nextId;
    this.activeEntities.push(id);
    return this.nextId++ as EntityId;
  }

  destroyEntity(entityId: EntityId): void {
    this.activeEntities = this.activeEntities.filter((e: EntityId) => {
      return e !== entityId;
    });
  }

  getAllActiveEntities(): EntityId[] {
    return this.activeEntities;
  }
}
