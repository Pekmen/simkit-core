export interface ComponentType<T> {
  readonly name: string;
  readonly __brand: unique symbol;
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
    __brand: Symbol(name) as never,
    create(data: Partial<T> = {}): T {
      return { ...defaultValues, ...data };
    },
  };
}

export function isValidComponentType(
  value: unknown,
): value is ComponentType<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as Record<string, unknown>).name === "string" &&
    (value as Record<string, unknown>).name !== "" &&
    "create" in value &&
    typeof (value as Record<string, unknown>).create === "function" &&
    "__brand" in value &&
    typeof (value as Record<string, unknown>).__brand === "symbol"
  );
}
