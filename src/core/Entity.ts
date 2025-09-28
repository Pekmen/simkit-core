export interface EntityId {
  readonly id: number;
  readonly generation: number;
}

export class EntityManager {
  private nextId = 1;
  private generations = new Map<number, number>();
  private freeIds: number[] = [];
  private activeEntities: EntityId[] = [];

  createEntity(): EntityId {
    const id = this.freeIds.pop() ?? this.nextId++;
    const generation = this.generations.get(id) ?? 0;

    const entityId = { id, generation };
    this.activeEntities.push(entityId);

    if (!this.generations.has(id)) {
      this.generations.set(id, generation);
    }

    return entityId;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.isEntityValid(entityId)) return false;

    this.generations.set(entityId.id, entityId.generation + 1);
    this.freeIds.push(entityId.id);

    this.activeEntities = this.activeEntities.filter(
      (e) => e.id !== entityId.id || e.generation !== entityId.generation,
    );

    return true;
  }

  isEntityValid(entityId: EntityId): boolean {
    const currentGeneration = this.generations.get(entityId.id);
    return (
      currentGeneration !== undefined &&
      currentGeneration === entityId.generation
    );
  }

  getAllActiveEntities(): EntityId[] {
    return this.activeEntities;
  }
}
