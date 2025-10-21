import { INDEX_BITS, INDEX_MASK, MAX_ENTITY_INDEX } from "./constants.js";
import type { EntityManagerSnapshot } from "./Serialization.js";
import { assert } from "./assert.js";

export type EntityId = number & { readonly __brand: "EntityId" };

export function pack(index: number, gen: number): EntityId {
  return ((gen << INDEX_BITS) | index) as EntityId;
}

export function getIndex(id: EntityId): number {
  return id & INDEX_MASK;
}

export function getGen(id: EntityId): number {
  return id >>> INDEX_BITS;
}

export class EntityManager {
  private nextIndex = 0;
  private freeList: EntityId[] = [];
  private activeEntities = new Set<EntityId>();
  private activeEntitiesCache: EntityId[] | null = null;

  createEntity(): EntityId {
    const recycledId = this.freeList.pop();
    if (recycledId !== undefined) {
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
    this.activeEntities.add(id);
    this.activeEntitiesCache = null;
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.activeEntities.has(entityId)) return false;

    const index = getIndex(entityId);
    const gen = getGen(entityId);

    const nextId = pack(index, (gen + 1) & 0xff);
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

  serialize(): EntityManagerSnapshot {
    return {
      nextIndex: this.nextIndex,
      freeList: [...this.freeList],
      activeEntities: Array.from(this.activeEntities),
    };
  }

  deserialize(snapshot: EntityManagerSnapshot): void {
    assert(
      snapshot.nextIndex >= 0 && snapshot.nextIndex <= MAX_ENTITY_INDEX + 1,
      `Invalid nextIndex in snapshot: ${String(snapshot.nextIndex)}`,
    );
    assert(Array.isArray(snapshot.freeList), "freeList must be an array");
    assert(
      Array.isArray(snapshot.activeEntities),
      "activeEntities must be an array",
    );

    this.nextIndex = snapshot.nextIndex;
    this.freeList = [...snapshot.freeList];
    this.activeEntities = new Set(snapshot.activeEntities);
    this.activeEntitiesCache = null;
  }
}
