import type { ComponentSerializer, SerializedComponent } from "./Snapshot.js";

export class ComponentSerializerRegistry {
  private serializers = new Map<string, ComponentSerializer<unknown>>();

  register<T>(componentName: string, serializer: ComponentSerializer<T>): void {
    this.serializers.set(componentName, serializer);
  }

  getSerializer<T>(componentName: string): ComponentSerializer<T> | undefined {
    const serializer = this.serializers.get(componentName);
    return serializer as ComponentSerializer<T> | undefined;
  }

  hasSerializer(componentName: string): boolean {
    return this.serializers.has(componentName);
  }

  serialize(componentName: string, component: unknown): SerializedComponent {
    const serializer = this.getSerializer(componentName);
    if (!serializer) {
      return component as SerializedComponent;
    }
    return serializer.serialize(component);
  }

  deserialize(componentName: string, data: SerializedComponent): unknown {
    const serializer = this.getSerializer(componentName);
    if (!serializer) {
      return data;
    }
    return serializer.deserialize(data);
  }
}
