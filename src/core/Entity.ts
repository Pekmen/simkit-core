export type EntityId = number & { readonly __brand: "EntityId" };

const INDEX_BITS = 24;
const INDEX_MASK = (1 << INDEX_BITS) - 1;

function pack(index: number, gen: number): EntityId {
  return ((gen << INDEX_BITS) | index) as EntityId;
}

function getIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

function getGen(id: EntityId): number {
  return id >>> INDEX_BITS;
}

export class EntityManager {
  private nextIndex = 0;
  private freeList: EntityId[] = [];
  private activeEntities = new Set<EntityId>();

  createEntity(): EntityId {
    const id = this.freeList.pop() ?? pack(this.nextIndex++, 0);

    this.activeEntities.add(id);
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.activeEntities.has(entityId)) return false;

    const index = getIndex(entityId);
    const gen = getGen(entityId);

    const nextId = pack(index, (gen + 1) & 0xff);
    this.freeList.push(nextId);

    this.activeEntities.delete(entityId);
    return true;
  }

  isEntityValid(entityId: EntityId): boolean {
    return this.activeEntities.has(entityId);
  }

  getAllActiveEntities(): EntityId[] {
    return Array.from(this.activeEntities);
  }
}
