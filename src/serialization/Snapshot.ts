import type { EntityId } from "../index.js";

export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type SerializedComponent = Record<string, SerializableValue>;

export interface ComponentSerializer<T> {
  serialize(component: T): SerializedComponent;
  deserialize(data: SerializedComponent): T;
}

export interface EntitySnapshot {
  id: EntityId;
  components: Map<string, SerializedComponent>;
}

export interface WorldSnapshot {
  entities: EntitySnapshot[];
  entityManagerState: {
    nextIndex: number;
    freeList: EntityId[];
  };
}
