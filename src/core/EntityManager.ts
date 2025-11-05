import { MAX_ENTITY_INDEX, MAX_GENERATION } from "./constants.js";
import { type EntityId, pack, getIndex, getGen } from "./EntityId.js";

export class EntityManager {
  private nextIndex = 0;
  private freeList: EntityId[] = [];
  private activeEntities = new Set<EntityId>();
  private activeEntitiesCache: EntityId[] | null = null;
  private exhaustedSlots = new Set<number>();

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

    let index = this.nextIndex;
    while (this.exhaustedSlots.has(index)) {
      index++;
      if (index > MAX_ENTITY_INDEX) {
        throw new Error(`Maximum entity limit reached (all slots exhausted).`);
      }
    }

    this.nextIndex = index + 1;
    const id = pack(index, 0);
    this.activeEntities.add(id);
    this.activeEntitiesCache = null;
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    if (!this.activeEntities.has(entityId)) return false;

    const index = getIndex(entityId);
    const gen = getGen(entityId);

    if (gen >= MAX_GENERATION) {
      this.exhaustedSlots.add(index);
    } else {
      const nextId = pack(index, gen + 1);
      this.freeList.push(nextId);
    }

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
}
