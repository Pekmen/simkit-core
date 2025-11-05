import type { EntityId } from "./EntityId.js";

export interface EntityManagerSnapshot {
  nextIndex: number;
  freeList: EntityId[];
  activeEntities: EntityId[];
}

export interface ComponentStorageSnapshot {
  entities: EntityId[];
  data: unknown[];
}

export interface WorldSnapshot {
  entities: EntityManagerSnapshot;
  components: Record<string, ComponentStorageSnapshot>;
}
