export interface ComponentType<T> {
  readonly name: string;
  create(data?: Partial<T>): T;
}

export function defineComponent<T>(
  name: string,
  defaultValues: T,
): ComponentType<T> {
  if (typeof name !== "string") {
    const actualType = typeof name;
    const nameStr = String(name);
    throw new Error(
      `defineComponent: Invalid component name. Expected non-empty string, got ${actualType}: "${nameStr}". ` +
        `Example: defineComponent("Position", { x: 0, y: 0 })`,
    );
  }

  if (name.length === 0) {
    throw new Error(
      `defineComponent: Invalid component name. Expected non-empty string, got empty string "". ` +
        `Example: defineComponent("Position", { x: 0, y: 0 })`,
    );
  }

  if (defaultValues === null || defaultValues === undefined) {
    throw new Error(
      `defineComponent: Component "${name}" missing defaultValues. ` +
        `Provide an object with default values for all properties. ` +
        `Example: defineComponent("${name}", { property: defaultValue })`,
    );
  }

  return {
    name,
    create(data: Partial<T> = {}): T {
      return { ...defaultValues, ...data };
    },
  };
}
