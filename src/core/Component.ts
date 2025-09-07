export const ComponentTypeSymbol: unique symbol = Symbol("ComponentType");

export interface ComponentType<T> {
  readonly name: string;
  readonly [ComponentTypeSymbol]: symbol;
  create(data?: Partial<T>): T;
}

export function defineComponent<T>(
  name: string,
  defaultValues: T,
): ComponentType<T> {
  const symbol: unique symbol = Symbol(name);

  return {
    name,
    [ComponentTypeSymbol]: symbol,
    create(data: Partial<T> = {}): T {
      return { ...defaultValues, ...data };
    },
  };
}
