import { INDEX_BITS, INDEX_MASK } from "./constants.js";

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
