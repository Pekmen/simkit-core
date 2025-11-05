import type { EntityId } from "./Entity.js";

export interface EntityManagerSnapshot {
  readonly nextIndex: number;
  readonly freeList: readonly EntityId[];
  readonly activeEntities: readonly EntityId[];
}

export interface ComponentStorageSnapshot {
  readonly entities: readonly EntityId[];
  readonly data: readonly unknown[];
}

export interface WorldSnapshot {
  readonly entities: EntityManagerSnapshot;
  readonly components: Readonly<Record<string, ComponentStorageSnapshot>>;
}
