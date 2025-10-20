import { ComponentStorage, type ComponentType } from "../index.js";
import type { ComponentRegistrySnapshot } from "./serialization/types.js";

export class ComponentRegistry {
  private storages = new Map<string, ComponentStorage<unknown>>();

  get<T>(componentType: ComponentType<T>): ComponentStorage<T> | undefined {
    const storage = this.storages.get(componentType.name);
    return storage as ComponentStorage<T> | undefined;
  }

  getOrCreate<T>(componentType: ComponentType<T>): ComponentStorage<T> {
    const existing = this.storages.get(componentType.name);
    if (existing) {
      return existing as ComponentStorage<T>;
    }

    const storage = new ComponentStorage<T>();
    this.storages.set(componentType.name, storage);
    return storage;
  }

  values(): IterableIterator<ComponentStorage<unknown>> {
    return this.storages.values();
  }

  entries(): IterableIterator<[string, ComponentStorage<unknown>]> {
    return this.storages.entries();
  }

  toJSON(): ComponentRegistrySnapshot {
    const snapshot: ComponentRegistrySnapshot = {};
    for (const [name, storage] of this.storages.entries()) {
      snapshot[name] = storage.toJSON();
    }
    return snapshot;
  }

  static fromJSON(
    snapshot: ComponentRegistrySnapshot,
    componentTypes: ComponentType<unknown>[],
  ): ComponentRegistry {
    const registry = new ComponentRegistry();
    const componentTypeMap = new Map<string, ComponentType<unknown>>();

    for (const componentType of componentTypes) {
      componentTypeMap.set(componentType.name, componentType);
    }

    for (const [name, storageSnapshot] of Object.entries(snapshot)) {
      const componentType = componentTypeMap.get(name);
      if (!componentType) {
        throw new Error(
          `Component type '${name}' not found in provided component types. ` +
            `Available types: ${componentTypes.map((c) => c.name).join(", ")}`,
        );
      }

      const storage = ComponentStorage.fromJSON(storageSnapshot);
      registry.storages.set(name, storage);
    }

    return registry;
  }
}
