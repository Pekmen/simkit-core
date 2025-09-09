import { ComponentStorage } from "./ComponentStorage";
import { type ComponentType } from "./Component";

export class ComponentRegistry {
  private storages = new Map<
    ComponentType<unknown>,
    ComponentStorage<unknown>
  >();

  get<T>(componentType: ComponentType<T>): ComponentStorage<T> | undefined {
    const storage = this.storages.get(componentType);
    return storage as ComponentStorage<T> | undefined;
  }

  getOrCreate<T>(componentType: ComponentType<T>): ComponentStorage<T> {
    let storage = this.storages.get(componentType);
    if (!storage) {
      storage = new ComponentStorage<T>();
      this.storages.set(componentType, storage);
    }
    return storage as ComponentStorage<T>;
  }

  values(): IterableIterator<ComponentStorage<unknown>> {
    return this.storages.values();
  }
}
