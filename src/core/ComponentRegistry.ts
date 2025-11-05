import { ComponentStorage, type ComponentType } from "../index.js";

export class ComponentRegistry {
  private storages = new Map<
    ComponentType<unknown>,
    ComponentStorage<unknown>
  >();

  get<T>(componentType: ComponentType<T>): ComponentStorage<T> | undefined {
    const storage = this.storages.get(componentType as ComponentType<unknown>);
    return storage as ComponentStorage<T> | undefined;
  }

  getOrCreate<T>(componentType: ComponentType<T>): ComponentStorage<T> {
    const key = componentType as ComponentType<unknown>;
    const existing = this.storages.get(key);
    if (existing) {
      return existing as ComponentStorage<T>;
    }

    const storage = new ComponentStorage<T>();
    this.storages.set(key, storage);
    return storage;
  }

  values(): IterableIterator<ComponentStorage<unknown>> {
    return this.storages.values();
  }

  entries(): IterableIterator<
    [ComponentType<unknown>, ComponentStorage<unknown>]
  > {
    return this.storages.entries();
  }
}
