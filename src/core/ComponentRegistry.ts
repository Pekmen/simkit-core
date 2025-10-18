import { ComponentStorage, ComponentType } from "../index.js";

export class ComponentRegistry {
  private storages = new Map<string, ComponentStorage<unknown>>();

  get<T>(componentType: ComponentType<T>): ComponentStorage<T> | undefined {
    const storage = this.storages.get(componentType.name);
    return storage as ComponentStorage<T> | undefined;
  }

  getOrCreate<T>(componentType: ComponentType<T>): ComponentStorage<T> {
    let storage = this.storages.get(componentType.name);
    if (!storage) {
      storage = new ComponentStorage<T>();
      this.storages.set(componentType.name, storage);
    }
    return storage as ComponentStorage<T>;
  }

  values(): IterableIterator<ComponentStorage<unknown>> {
    return this.storages.values();
  }

  entries(): IterableIterator<[string, ComponentStorage<unknown>]> {
    return this.storages.entries();
  }
}
