export interface ComponentType<T> {
  readonly name: string;
  create(data?: Partial<T>): T;
}

export function defineComponent<T>(
  name: string,
  defaultValues: T,
): ComponentType<T> {
  return {
    name,
    create(data: Partial<T> = {}): T {
      return Object.assign({}, defaultValues, data);
    },
  };
}
