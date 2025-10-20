import type { EntityId } from "../Entity.js";

export const SERIALIZATION_VERSION = "1.0";

export interface EntityManagerSnapshot {
  nextIndex: number;
  activeEntities: EntityId[];
  freeList: EntityId[];
}

export interface ComponentStorageSnapshot<T> {
  sparse: (number | null)[];
  dense: T[];
  entities: EntityId[];
}

export type ComponentRegistrySnapshot = Record<
  string,
  ComponentStorageSnapshot<unknown>
>;

export interface WorldSnapshot {
  version: string;
  entityManager: EntityManagerSnapshot;
  components: ComponentRegistrySnapshot;
  entityComponents: [EntityId, string[]][];
}
