import {
  assert,
  GENERATION_MASK,
  INDEX_BITS,
  INDEX_MASK,
  MAX_ENTITY_INDEX,
} from "./constants.js";

export type EntityId = number & { readonly __brand: "EntityId" };

export function pack(index: number, gen: number): EntityId {
  assert(
    index >= 0 && index <= MAX_ENTITY_INDEX,
    `Entity index ${String(index)} out of valid range [0, ${String(MAX_ENTITY_INDEX)}]`,
  );
  assert(
    gen >= 0 && gen <= GENERATION_MASK,
    `Entity generation ${String(gen)} out of valid range [0, ${String(GENERATION_MASK)}]`,
  );
  return ((gen << INDEX_BITS) | index) as EntityId;
}

export function getIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

export function getGen(id: EntityId): number {
  return id >>> INDEX_BITS;
}

export interface EntityManagerSnapshot {
  nextIndex: number;
  freeList: EntityId[];
}

export class EntityManager {
  private nextIndex = 0;
  private freeList: EntityId[] = [];
  private activeEntities = new Set<EntityId>();
  private activeEntitiesCache: EntityId[] | null = null;

  createEntity(): EntityId {
    const recycledId = this.freeList.pop();
    if (recycledId !== undefined) {
      assert(
        !this.activeEntities.has(recycledId),
        `Internal error: recycled entity ${String(recycledId)} is already active`,
      );
      this.activeEntities.add(recycledId);
      this.activeEntitiesCache = null;
      return recycledId;
    }

    if (this.nextIndex > MAX_ENTITY_INDEX) {
      const maxEntities = String(MAX_ENTITY_INDEX + 1);
      throw new Error(
        `Maximum entity limit reached (${maxEntities} entities).`,
      );
    }

    const id = pack(this.nextIndex++, 0);
    assert(
      !this.activeEntities.has(id),
      `Internal error: new entity ${String(id)} is already active`,
    );
    this.activeEntities.add(id);
    this.activeEntitiesCache = null;
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.activeEntities.has(entityId)) return false;

    const index = getIndex(entityId);
    const gen = getGen(entityId);

    assert(
      index < this.nextIndex,
      `Internal error: destroying entity with index ${String(index)} >= nextIndex ${String(this.nextIndex)}`,
    );

    const nextId = pack(index, (gen + 1) & GENERATION_MASK);
    this.freeList.push(nextId);

    this.activeEntities.delete(entityId);
    this.activeEntitiesCache = null;
    return true;
  }

  isEntityValid(entityId: EntityId): boolean {
    return this.activeEntities.has(entityId);
  }

  getEntityCount(): number {
    return this.activeEntities.size;
  }

  getAllActiveEntities(): readonly EntityId[] {
    this.activeEntitiesCache ??= Array.from(this.activeEntities);
    return this.activeEntitiesCache;
  }

  createSnapshot(): EntityManagerSnapshot {
    return {
      nextIndex: this.nextIndex,
      freeList: [...this.freeList],
    };
  }

  restoreFromSnapshot(snapshot: EntityManagerSnapshot): void {
    this.nextIndex = snapshot.nextIndex;
    this.freeList = [...snapshot.freeList];
    this.activeEntities.clear();
    this.activeEntitiesCache = null;
  }
}
